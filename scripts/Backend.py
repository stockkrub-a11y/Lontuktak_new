from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import os
import pandas as pd
import io
import uvicorn
from sqlalchemy import text

# Import local modules
from Auto_cleaning import auto_cleaning
from DB_server import engine
from Predict import update_model_and_train, forcast_loop, Evaluate
from Notification import generate_stock_report

# Initialize FastAPI app
app = FastAPI(title="Lon TukTak Stock Management API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# HEALTH CHECK
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    }

# ============================================================================
# NOTIFICATIONS ENDPOINTS
# ============================================================================

@app.get("/api/notifications")
async def get_notifications():
    """Get inventory notifications from stock_notifications table"""
    try:
        print("[Backend] Fetching notifications")
        
        if not engine:
            print("[Backend] ❌ Database engine not available")
            return []
        
        try:
            print("[Backend] Querying stock_notifications table...")
            query = """
                SELECT 
                    "Product",
                    "Stock",
                    "Last_Stock",
                    "Decrease_Rate(%)",
                    "Weeks_To_Empty",
                    "MinStock",
                    "Buffer",
                    "Reorder_Qty",
                    "Status",
                    "Description",
                    created_at
                FROM stock_notifications
                ORDER BY created_at DESC
            """
            df = pd.read_sql(query, engine)
            
            if not df.empty:
                print(f"[Backend] ✅ Retrieved {len(df)} notifications from database")
                notifications = df.to_dict('records')
                # Convert datetime to string for JSON serialization
                for notification in notifications:
                    if 'created_at' in notification and notification['created_at']:
                        notification['created_at'] = str(notification['created_at'])
                return notifications
            else:
                print("[Backend] No notifications in database")
                return []
        except Exception as db_error:
            print(f"[Backend] Database query failed: {str(db_error)}")
            import traceback
            traceback.print_exc()
            return []
        
    except Exception as e:
        print(f"[Backend] ❌ Error in get_notifications: {str(e)}")
        import traceback
        traceback.print_exc()
        return []

@app.get("/notifications/check_base_stock")
async def check_base_stock():
    """Check if base_stock table exists and has data"""
    try:
        print("[Backend] Checking base_stock table...")
        
        if not engine:
            return {"exists": False, "count": 0}
        
        # Check if table exists and has data
        query = "SELECT COUNT(*) as count FROM base_stock"
        result = pd.read_sql(query, engine)
        count = int(result.iloc[0]['count'])
        
        print(f"[Backend] base_stock exists with {count} rows")
        return {"exists": count > 0, "count": count}
        
    except Exception as e:
        print(f"[Backend] base_stock table doesn't exist or error: {str(e)}")
        return {"exists": False, "count": 0}

@app.post("/notifications/upload")
async def upload_stock_files(
    previous_stock: Optional[UploadFile] = File(None),
    current_stock: UploadFile = File(...)
):
    """Upload stock files and generate notifications"""
    try:
        print("[Backend] Processing stock upload...")
        
        # Read current stock file
        current_content = await current_stock.read()
        df_curr = pd.read_excel(io.BytesIO(current_content))
        print(f"[Backend] Current stock loaded: {len(df_curr)} rows")
        
        # Check if base_stock exists
        base_stock_exists = False
        df_prev = None
        
        try:
            query = "SELECT * FROM base_stock ORDER BY updated_at DESC"
            df_prev = pd.read_sql(query, engine)
            if not df_prev.empty:
                base_stock_exists = True
                print(f"[Backend] Loaded previous stock from database: {len(df_prev)} rows")
        except:
            print("[Backend] base_stock table doesn't exist yet")
        
        # If base_stock doesn't exist, require previous stock file
        if not base_stock_exists:
            if not previous_stock:
                raise HTTPException(
                    status_code=400,
                    detail="Previous stock file is required for first upload"
                )
            prev_content = await previous_stock.read()
            df_prev = pd.read_excel(io.BytesIO(prev_content), header=1)
            print(f"[Backend] Previous stock loaded from file: {len(df_prev)} rows")
        
        df_curr = df_curr.rename(columns={
            'ชื่อสินค้า': 'product_name',
            'รหัสสินค้า': 'product_sku',
            'จำนวนคงเหลือ': 'stock_level',
            'จำนวน': 'stock_level'
        })
        df_prev = df_prev.rename(columns={
            'ชื่อสินค้า': 'product_name',
            'รหัสสินค้า': 'product_sku',
            'จำนวนคงเหลือ': 'stock_level',
            'จำนวน': 'stock_level'
        })

        # Generate stock report
        print("[Backend] Generating stock report...")
        report_df = generate_stock_report(df_prev, df_curr)
        print(f"[Backend] Report generated: {len(report_df)} items")
        
        # Calculate flags based on stock changes
        print("[Backend] Calculating stock flags...")
        for idx, row in report_df.iterrows():
            product_name = row.get('Product', '')
            current_stock_level = row.get('Stock', 0)
            last_stock_level = row.get('Last_Stock', 0)
            
            # Get previous counter and flag from base_stock if exists
            prev_counter = 0
            prev_flag = 'stage'
            
            if base_stock_exists and not df_prev.empty:
                prev_row = df_prev[df_prev['product_name'] == product_name]
                if not prev_row.empty:
                    prev_counter = prev_row.iloc[0].get('unchanged_counter', 0)
                    prev_flag = prev_row.iloc[0].get('flag', 'stage')
            
            # Apply flag logic
            if current_stock_level == last_stock_level:
                new_counter = prev_counter + 1
                new_flag = 'inactive' if new_counter >= 4 else prev_flag
            elif current_stock_level < last_stock_level:
                new_counter = 0
                new_flag = 'active'
            else:  # current_stock_level > last_stock_level
                new_counter = 0
                new_flag = 'just added stock'
            
            report_df.at[idx, 'unchanged_counter'] = new_counter
            report_df.at[idx, 'flag'] = new_flag
        
        # Save report to stock_notifications table
        print("[Backend] Saving to stock_notifications table...")
        report_df['created_at'] = datetime.now()
        report_df.to_sql('stock_notifications', engine, if_exists='append', index=False)
        
        # Update base_stock with current stock
        print("[Backend] Updating base_stock table...")
        base_stock_df = pd.DataFrame({
            'product_name': df_curr['product_name'],
            'product_sku': df_curr.get('product_sku', ''),
            'stock_level': df_curr['stock_level'],
            'หมวดหมู่': df_curr.get('หมวดหมู่', ''),
            'unchanged_counter': report_df['unchanged_counter'].values,
            'flag': report_df['flag'].values,
            'updated_at': datetime.now()
        })
        
        # Clear and insert new data
        with engine.begin() as conn:
            conn.execute(text("DELETE FROM base_stock"))
        base_stock_df.to_sql('base_stock', engine, if_exists='append', index=False)
        
        print("[Backend] ✅ Upload completed successfully")
        return {
            "success": True,
            "message": "Stock files processed successfully",
            "notifications_count": len(report_df)
        }
        
    except Exception as e:
        print(f"[Backend] ❌ Error in upload: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/notifications/clear_base_stock")
async def clear_base_stock():
    """Clear the base_stock table"""
    try:
        print("[Backend] Clearing base_stock table...")
        
        if not engine:
            raise HTTPException(status_code=500, detail="Database not available")
        
        with engine.begin() as conn:
            conn.execute(text("DELETE FROM base_stock"))
        
        print("[Backend] ✅ base_stock cleared")
        return {"success": True, "message": "Base stock cleared successfully"}
        
    except Exception as e:
        print(f"[Backend] ❌ Error clearing base_stock: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# STOCK ENDPOINTS
# ============================================================================

@app.get("/stock/levels")
async def get_stock_levels(
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    sort_by: Optional[str] = Query(None)
):
    """Get stock levels from base_stock table"""
    try:
        print("[Backend] Fetching stock levels from base_stock...")
        
        if not engine:
            return {"success": False, "data": []}
        
        query = """
            SELECT 
                product_name,
                product_sku,
                stock_level as quantity,
                "หมวดหมู่" as category,
                flag as status,
                unchanged_counter,
                updated_at
            FROM base_stock
        """
        
        # Add filters
        conditions = []
        if category:
            conditions.append(f"\"หมวดหมู่\" = '{category}'")
        if status:
            conditions.append(f"flag = '{status}'")
        
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
        
        # Add sorting
        if sort_by == "quantity_asc":
            query += " ORDER BY stock_level ASC"
        elif sort_by == "quantity_desc":
            query += " ORDER BY stock_level DESC"
        else:
            query += " ORDER BY product_name ASC"
        
        df = pd.read_sql(query, engine)
        
        if not df.empty:
            print(f"[Backend] ✅ Retrieved {len(df)} stock items")
            # Convert datetime to string
            for idx, row in df.iterrows():
                if 'updated_at' in df.columns and pd.notna(row['updated_at']):
                    df.at[idx, 'updated_at'] = str(row['updated_at'])
            return {"success": True, "data": df.to_dict('records')}
        else:
            print("[Backend] No stock data found")
            return {"success": True, "data": []}
        
    except Exception as e:
        print(f"[Backend] ❌ Error fetching stock levels: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "data": [], "error": str(e)}

# ============================================================================
# ANALYSIS ENDPOINTS
# ============================================================================

@app.get("/analysis/dashboard")
async def get_dashboard_analytics():
    """Get dashboard analytics data"""
    try:
        print("[Backend] Fetching dashboard analytics...")
        
        if not engine:
            return {
                "success": False,
                "data": {
                    "total_stock_items": 0,
                    "low_stock_alerts": 0,
                    "sales_this_month": 0,
                    "out_of_stock": 0
                }
            }
        
        # Get metrics from base_data and base_stock
        current_date = datetime.now()
        current_month = current_date.month
        current_year = current_date.year
        
        # Total stock items
        total_query = "SELECT COUNT(*) as count FROM base_stock"
        total_result = pd.read_sql(total_query, engine)
        total_items = int(total_result.iloc[0]['count']) if not total_result.empty else 0
        
        # Low stock (using flag)
        low_stock_query = "SELECT COUNT(*) as count FROM base_stock WHERE flag = 'active'"
        low_stock_result = pd.read_sql(low_stock_query, engine)
        low_stock = int(low_stock_result.iloc[0]['count']) if not low_stock_result.empty else 0
        
        # Out of stock
        out_stock_query = "SELECT COUNT(*) as count FROM base_stock WHERE stock_level = 0"
        out_stock_result = pd.read_sql(out_stock_query, engine)
        out_of_stock = int(out_stock_result.iloc[0]['count']) if not out_stock_result.empty else 0
        
        # Sales this month
        try:
            sales_query = f"""
                SELECT COALESCE(SUM(total_amount_baht), 0) as monthly_sales
                FROM base_data
                WHERE EXTRACT(MONTH FROM sales_date) = {current_month}
                AND EXTRACT(YEAR FROM sales_date) = {current_year}
            """
            sales_result = pd.read_sql(sales_query, engine)
            monthly_sales = float(sales_result.iloc[0]['monthly_sales']) if not sales_result.empty else 0
        except:
            monthly_sales = 0
        
        return {
            "success": True,
            "data": {
                "total_stock_items": total_items,
                "low_stock_alerts": low_stock,
                "sales_this_month": monthly_sales,
                "out_of_stock": out_of_stock
            }
        }
        
    except Exception as e:
        print(f"[Backend] ❌ Error in dashboard analytics: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "data": {
                "total_stock_items": 0,
                "low_stock_alerts": 0,
                "sales_this_month": 0,
                "out_of_stock": 0
            },
            "error": str(e)
        }

# ============================================================================
# RUN SERVER
# ============================================================================

if __name__ == "__main__":
    print("=" * 80)
    print("Starting Lon TukTak Backend Server")
    print("=" * 80)
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
