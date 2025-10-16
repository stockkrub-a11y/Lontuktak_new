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
import sys
import time

# Import local modules
from Auto_cleaning import auto_cleaning
from DB_server import engine
from Predict import update_model_and_train, forcast_loop, Evaluate
from Notification import generate_stock_report

# Initialize FastAPI app
app = FastAPI(title="Lon TukTak Stock Management API")

@app.middleware("http")
async def log_requests(request, call_next):
    start_time = time.time()
    print(f"\n{'='*80}", flush=True)
    print(f"🌐 REQUEST: {request.method} {request.url.path}", flush=True)
    print(f"{'='*80}", flush=True)
    sys.stdout.flush()
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    print(f"✅ RESPONSE: {response.status_code} (took {process_time:.2f}s)", flush=True)
    print(f"{'='*80}\n", flush=True)
    sys.stdout.flush()
    
    return response

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    print("\n" + "="*80, flush=True)
    print("🚀 LON TUKTAK BACKEND STARTED", flush=True)
    print("="*80, flush=True)
    print(f"✅ Backend loaded from: {__file__}", flush=True)
    print(f"✅ Database engine available: {engine is not None}", flush=True)
    print("="*80 + "\n", flush=True)
    sys.stdout.flush()

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
    print("\n" + "="*80, flush=True)
    print("🔔 [NOTIFICATIONS ENDPOINT CALLED]", flush=True)
    print("="*80, flush=True)
    sys.stdout.flush()
    
    try:
        if not engine:
            print("❌ Database engine not available", flush=True)
            sys.stdout.flush()
            return []
        
        print("✅ Database engine available", flush=True)
        sys.stdout.flush()
        
        try:
            test_query = "SELECT 1 as test"
            test_df = pd.read_sql(test_query, engine)
            print(f"✅ Database connection test passed: {test_df.iloc[0]['test']}", flush=True)
            sys.stdout.flush()
        except Exception as test_error:
            print(f"❌ Database connection test FAILED: {str(test_error)}", flush=True)
            sys.stdout.flush()
            return []
        
        try:
            print("\n📋 Checking if stock_notifications table exists...", flush=True)
            sys.stdout.flush()
            
            table_check_query = """
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public'
                    AND table_name = 'stock_notifications'
                )
            """
            table_exists_df = pd.read_sql(table_check_query, engine)
            table_exists = table_exists_df.iloc[0]['exists']
            print(f"Table exists: {table_exists}", flush=True)
            sys.stdout.flush()
            
            if not table_exists:
                print("❌ stock_notifications table does not exist!", flush=True)
                sys.stdout.flush()
                return []
            
            print("\n📊 Checking row count...", flush=True)
            sys.stdout.flush()
            
            count_query = "SELECT COUNT(*) as total FROM stock_notifications"
            count_df = pd.read_sql(count_query, engine)
            total_rows = int(count_df.iloc[0]['total'])
            print(f"✅ Total rows in stock_notifications: {total_rows}", flush=True)
            sys.stdout.flush()
            
            if total_rows == 0:
                print("⚠️ Table exists but has no data", flush=True)
                sys.stdout.flush()
                return []
            
            print("\n📝 Checking column names...", flush=True)
            sys.stdout.flush()
            
            check_columns_query = """
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_schema = 'public'
                AND table_name = 'stock_notifications'
                ORDER BY ordinal_position
            """
            columns_df = pd.read_sql(check_columns_query, engine)
            available_columns = columns_df['column_name'].tolist()
            print(f"✅ Available columns ({len(available_columns)}): {available_columns}", flush=True)
            sys.stdout.flush()
            
            print("\n🔍 Querying notifications data...", flush=True)
            sys.stdout.flush()
            
            query = """
                SELECT *
                FROM stock_notifications
                ORDER BY created_at DESC
                LIMIT 100
            """
            df = pd.read_sql(query, engine)
            
            print(f"✅ Query returned {len(df)} rows", flush=True)
            sys.stdout.flush()
            
            if not df.empty:
                print(f"✅ Actual column names from query: {df.columns.tolist()}", flush=True)
                print(f"\n📄 First row sample:", flush=True)
                first_row = df.iloc[0].to_dict()
                for key, value in first_row.items():
                    print(f"  {key}: {value}", flush=True)
                sys.stdout.flush()
                
                # Convert to list of dicts
                notifications = df.to_dict('records')
                
                # Convert datetime to string
                for notification in notifications:
                    for key, value in notification.items():
                        if pd.notna(value) and isinstance(value, (pd.Timestamp, datetime)):
                            notification[key] = str(value)
                
                print(f"\n✅ Returning {len(notifications)} notifications", flush=True)
                print("="*80 + "\n", flush=True)
                sys.stdout.flush()
                return notifications
            else:
                print("⚠️ Query returned empty dataframe", flush=True)
                print("="*80 + "\n", flush=True)
                sys.stdout.flush()
                return []
                
        except Exception as db_error:
            print(f"\n❌ Database query failed: {str(db_error)}", flush=True)
            import traceback
            traceback.print_exc()
            sys.stdout.flush()
            print("="*80 + "\n", flush=True)
            return []
        
    except Exception as e:
        print(f"\n❌ Error in get_notifications: {str(e)}", flush=True)
        import traceback
        traceback.print_exc()
        sys.stdout.flush()
        print("="*80 + "\n", flush=True)
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
            'จำนวน': 'stock_level',
            'หมวดหมู่': 'category'
        })
        df_prev = df_prev.rename(columns={
            'ชื่อสินค้า': 'product_name',
            'รหัสสินค้า': 'product_sku',
            'จำนวนคงเหลือ': 'stock_level',
            'จำนวน': 'stock_level',
            'หมวดหมู่': 'category'
        })
        df_curr["stock_level"] = pd.to_numeric(df_curr["stock_level"], errors='coerce').fillna(0).astype(int)
        df_prev["stock_level"] = pd.to_numeric(df_prev["stock_level"], errors='coerce').fillna(0).astype(int)
        # Generate stock report
        print("[Backend] Generating stock report...")
        report_df = generate_stock_report(df_prev, df_curr)
        print(f"[Backend] Report generated: {len(report_df)} items")
        
        report_df['unchanged_counter'] = 0
        report_df['flag'] = 'stage'
        
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
        
        print("[Backend] Updating base_stock table...")
        
        # Create a mapping of product names to their flags
        flag_map = dict(zip(report_df['Product'], report_df['flag']))
        counter_map = dict(zip(report_df['Product'], report_df['unchanged_counter']))
        
        # Build base_stock_df with proper alignment
        base_stock_data = []
        for idx, row in df_curr.iterrows():
            product_name = row.get('product_name', '')
            base_stock_data.append({
                'product_name': product_name,
                'product_sku': row.get('product_sku', ''),
                'stock_level': row.get('stock_level', 0),
                'หมวดหมู่': row.get('category', ''),
                'unchanged_counter': counter_map.get(product_name, 0),
                'flag': flag_map.get(product_name, 'stage'),
                'updated_at': datetime.now()
            })
        
        base_stock_df = pd.DataFrame(base_stock_data)
        
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
        
        query = text("""
            SELECT 
                product_name,
                product_sku,
                stock_level as quantity,
                "หมวดหมู่" as category,
                flag as status,
                unchanged_counter,
                updated_at
            FROM base_stock
            WHERE 1=1
        """)
        
        # Build conditions
        conditions = []
        params = {}
        
        if category:
            conditions.append('"หมวดหมู่" = :category')
            params['category'] = category
        if status:
            conditions.append('flag = :status')
            params['status'] = status
        
        # Add conditions to query
        if conditions:
            query = text(str(query) + " AND " + " AND ".join(conditions))
        
        # Add sorting
        if sort_by == "quantity_asc":
            query = text(str(query) + " ORDER BY stock_level ASC")
        elif sort_by == "quantity_desc":
            query = text(str(query) + " ORDER BY stock_level DESC")
        else:
            query = text(str(query) + " ORDER BY product_name ASC")
        
        df = pd.read_sql(query, engine, params=params if params else None)
        
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

@app.get("/stock/categories")
async def get_stock_categories():
    """Get unique stock categories from base_stock"""
    try:
        print("[Backend] Fetching stock categories...")
        
        if not engine:
            return {"success": False, "data": []}
        
        try:
            query = text('SELECT DISTINCT "หมวดหมู่" as category FROM base_stock WHERE "หมวดหมู่" IS NOT NULL')
            df = pd.read_sql(query, engine)
            
            if not df.empty:
                categories = df['category'].tolist()
                print(f"[Backend] ✅ Found {len(categories)} categories")
                return {"success": True, "data": categories}
            else:
                return {"success": True, "data": []}
        except Exception as db_error:
            print(f"[Backend] Error fetching categories: {str(db_error)}")
            return {"success": True, "data": []}
        
    except Exception as e:
        print(f"[Backend] ❌ Error in get_stock_categories: {str(e)}")
        return {"success": False, "data": []}

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

@app.get("/analysis/base_skus")
async def get_analysis_base_skus(search: str = Query("", description="Search term for base SKUs")):
    """Get unique base SKUs from base_data for analysis"""
    try:
        print(f"[Backend] Fetching base SKUs with search: '{search}'")
        
        if not engine:
            return {"success": False, "base_skus": [], "total": 0}
        
        try:
            # Get unique base SKUs from base_data
            query = """
                SELECT DISTINCT product_sku
                FROM base_data
                WHERE product_sku IS NOT NULL
            """
            
            if search:
                query += f" AND product_sku ILIKE '%{search}%'"
            
            query += " ORDER BY product_sku ASC LIMIT 100"
            
            df = pd.read_sql(query, engine)
            
            if not df.empty:
                base_skus = df['product_sku'].tolist()
                print(f"[Backend] ✅ Found {len(base_skus)} base SKUs")
                return {"success": True, "base_skus": base_skus, "total": len(base_skus)}
            else:
                print("[Backend] No base SKUs found")
                return {"success": True, "base_skus": [], "total": 0}
                
        except Exception as db_error:
            print(f"[Backend] Database query failed: {str(db_error)}")
            import traceback
            traceback.print_exc()
            return {"success": False, "base_skus": [], "total": 0}
        
    except Exception as e:
        print(f"[Backend] ❌ Error fetching base SKUs: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "base_skus": [], "total": 0}

@app.get("/analysis/historical")
async def get_analysis_historical_sales(sku: str = Query(..., description="Product SKU to analyze")):
    """Get historical sales data for a specific SKU"""
    try:
        print(f"[Backend] Fetching historical sales for SKU: {sku}")
        
        if not engine:
            return {"success": False, "message": "Database not available", "chart_data": [], "table_data": [], "sizes": []}
        
        try:
            query = text("""
                SELECT 
                    sales_date,
                    product_sku,
                    quantity,
                    total_amount_baht,
                    EXTRACT(YEAR FROM sales_date) as year,
                    EXTRACT(MONTH FROM sales_date) as month
                FROM base_data
                WHERE product_sku ILIKE :sku_pattern
                ORDER BY sales_date ASC
            """)
            
            # Execute with proper parameter binding
            df = pd.read_sql(query, engine, params={"sku_pattern": f"%{sku}%"})
            
            if df.empty:
                print(f"[Backend] No historical data found for SKU: {sku}")
                return {
                    "success": True,
                    "message": "No data found for this SKU",
                    "chart_data": [],
                    "table_data": [],
                    "sizes": []
                }
            
            print(f"[Backend] ✅ Retrieved {len(df)} historical sales records")
            
            # Prepare chart data (monthly aggregation)
            df['month_year'] = df['sales_date'].dt.to_period('M').astype(str)
            chart_data = df.groupby('month_year').agg({
                'quantity': 'sum',
                'total_amount_baht': 'sum'
            }).reset_index()
            
            # Prepare table data
            table_data = df[['sales_date', 'product_sku', 'quantity', 'total_amount_baht']].copy()
            table_data['sales_date'] = table_data['sales_date'].astype(str)
            
            # Get unique sizes/variants
            sizes = df['product_sku'].unique().tolist()
            
            return {
                "success": True,
                "message": "Historical sales data retrieved successfully",
                "chart_data": chart_data.to_dict('records'),
                "table_data": table_data.to_dict('records'),
                "sizes": sizes
            }
            
        except Exception as db_error:
            print(f"[Backend] Database query failed: {str(db_error)}")
            import traceback
            traceback.print_exc()
            return {
                "success": False,
                "message": f"Database error: {str(db_error)}",
                "chart_data": [],
                "table_data": [],
                "sizes": []
            }
        
    except Exception as e:
        print(f"[Backend] ❌ Error fetching historical sales: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "message": f"Error: {str(e)}",
            "chart_data": [],
            "table_data": [],
            "sizes": []
        }

# ============================================================================
# TRAIN AND PREDICT ENDPOINTS
# ============================================================================

@app.post("/train")
async def train_model(
    product_file: UploadFile = File(...),
    sales_file: UploadFile = File(...)
):
    """Train the forecasting model with product and sales data"""
    try:
        print("[Backend] Starting model training...")
        
        if not engine:
            raise HTTPException(status_code=500, detail="Database not available")
        
        # Read uploaded files
        product_content = await product_file.read()
        sales_content = await sales_file.read()
        
        print(f"[Backend] Product file: {product_file.filename}")
        print(f"[Backend] Sales file: {sales_file.filename}")
        
        import tempfile
        
        # Create temporary files
        with tempfile.NamedTemporaryFile(mode='wb', delete=False, suffix='.xlsx') as product_temp:
            product_temp.write(product_content)
            product_temp_path = product_temp.name
        
        with tempfile.NamedTemporaryFile(mode='wb', delete=False, suffix='.xlsx') as sales_temp:
            sales_temp.write(sales_content)
            sales_temp_path = sales_temp.name
        
        try:
            # Clean the data using file paths
            print("[Backend] Cleaning data...")
            df_cleaned = auto_cleaning(sales_temp_path, product_temp_path, engine)
            
            rows_uploaded = len(df_cleaned)
            print(f"[Backend] Cleaned data: {rows_uploaded} rows")
            
            response = {
                "success": True,
                "data_cleaning": {
                    "status": "completed",
                    "rows_uploaded": rows_uploaded,
                    "message": f"Successfully cleaned and uploaded {rows_uploaded} rows"
                },
                "ml_training": {
                    "status": "pending",
                    "message": "Training not started"
                }
            }
            
            # Train the model
            print("[Backend] Training forecasting model...")
            try:
                df_window_raw, df_window, base_model, X_train, y_train, X_test, y_test, product_sku_last = update_model_and_train(df_cleaned)
                
                print("[Backend] ✅ Model training completed successfully")
                
                response["ml_training"] = {
                    "status": "completed",
                    "message": "Model trained successfully"
                }
                
                try:
                    print("[Backend] Attempting to generate forecasts...")
                    long_forecast, forecast_results = forcast_loop(X_train, y_train, df_window_raw, product_sku_last, base_model)
                    
                    if forecast_results and len(forecast_results) > 0:
                        # Save forecasts to database
                        forecast_df = pd.DataFrame(forecast_results)
                        forecast_df['created_at'] = datetime.now()
                        
                        try:
                            with engine.begin() as conn:
                                conn.execute(text("DELETE FROM forecasts"))
                        except:
                            # Table might not exist, create it
                            print("[Backend] Creating forecasts table...")
                            create_forecasts_table = """
                                CREATE TABLE IF NOT EXISTS forecasts (
                                    id SERIAL PRIMARY KEY,
                                    product_sku VARCHAR(255),
                                    forecast_date DATE,
                                    predicted_sales INTEGER,
                                    current_sales INTEGER,
                                    current_date_col DATE,
                                    created_at TIMESTAMP
                                )
                            """
                            with engine.begin() as conn:
                                conn.execute(text(create_forecasts_table))
                        
                        forecast_df.to_sql('forecasts', engine, if_exists='append', index=False)
                        
                        print(f"[Backend] ✅ Generated {len(forecast_results)} forecasts")
                        
                        response["ml_training"]["forecast_rows"] = len(forecast_results)
                        response["ml_training"]["message"] = f"Model trained and {len(forecast_results)} forecasts generated"
                    else:
                        response["ml_training"]["message"] = "Model trained but no forecasts generated"
                        
                except Exception as forecast_error:
                    print(f"[Backend] ⚠️ Forecast generation failed: {str(forecast_error)}")
                    import traceback
                    traceback.print_exc()
                    response["ml_training"]["message"] = f"Model trained but forecast generation failed: {str(forecast_error)}"
                
            except Exception as train_error:
                print(f"[Backend] ❌ Model training failed: {str(train_error)}")
                import traceback
                traceback.print_exc()
                response["ml_training"] = {
                    "status": "failed",
                    "message": f"Training failed: {str(train_error)}"
                }
            
            return response
            
        finally:
            # Clean up temporary files
            import os
            try:
                os.unlink(product_temp_path)
                os.unlink(sales_temp_path)
            except:
                pass
        
    except Exception as e:
        print(f"[Backend] ❌ Error in train_model: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/predict/existing")
async def get_existing_forecasts():
    """Get existing forecast data from the forecasts table"""
    try:
        print("[Backend] Fetching existing forecasts...")
        
        if not engine:
            return {"success": False, "forecast": []}
        
        try:
            query = """
                SELECT 
                    product_sku,
                    forecast_date,
                    predicted_sales,
                    current_sales,
                    current_date_col,
                    created_at
                FROM forecasts
                ORDER BY product_sku ASC, forecast_date ASC
            """
            df = pd.read_sql(query, engine)
            
            if not df.empty:
                print(f"[Backend] ✅ Retrieved {len(df)} forecasts")
                for idx, row in df.iterrows():
                    if 'forecast_date' in df.columns and pd.notna(row['forecast_date']):
                        df.at[idx, 'forecast_date'] = str(row['forecast_date'])
                    if 'current_date_col' in df.columns and pd.notna(row['current_date_col']):
                        df.at[idx, 'current_date_col'] = str(row['current_date_col'])
                    if 'created_at' in df.columns and pd.notna(row['created_at']):
                        df.at[idx, 'created_at'] = str(row['created_at'])
                
                return {"success": True, "forecast": df.to_dict('records')}
            else:
                print("[Backend] No forecasts found")
                return {"success": True, "forecast": []}
                
        except Exception as db_error:
            print(f"[Backend] Forecasts table doesn't exist or query failed: {str(db_error)}")
            return {"success": True, "forecast": []}
        
    except Exception as e:
        print(f"[Backend] ❌ Error fetching forecasts: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "forecast": [], "error": str(e)}

@app.post("/predict")
async def predict_sales(n_forecast: int = Query(3, description="Number of months to forecast")):
    """Generate sales forecasts for n months"""
    try:
        print(f"[Backend] Generating {n_forecast} month forecast...")
        
        if not engine:
            raise HTTPException(status_code=500, detail="Database not available")
        
        # Check if model is trained (base_data exists)
        try:
            check_query = "SELECT COUNT(*) as count FROM base_data"
            result = pd.read_sql(check_query, engine)
            if result.iloc[0]['count'] == 0:
                raise HTTPException(
                    status_code=400,
                    detail="No training data available. Please train the model first."
                )
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail="Model not trained. Please upload and train with data first."
            )
        
        print("[Backend] Loading trained model and data...")
        import joblib
        
        if not os.path.exists("xgb_sales_model.pkl"):
            raise HTTPException(
                status_code=400,
                detail="Model file not found. Please train the model first."
            )
        
        # Load model
        base_model = joblib.load("xgb_sales_model.pkl")
        
        # Get the latest training data from base_data
        query = "SELECT * FROM base_data ORDER BY sales_date DESC"
        df_cleaned = pd.read_sql(query, engine)
        
        # Recreate the training data
        print("[Backend] Preparing training data...")
        df_window_raw, df_window, _, X_train, y_train, X_test, y_test, product_sku_last = update_model_and_train(df_cleaned)
        
        # Run forecast loop with n_forecast parameter
        print(f"[Backend] Running forecast loop for {n_forecast} months...")
        long_forecast, forecast_results = forcast_loop(X_train, y_train, df_window_raw, product_sku_last, base_model, n_forecast=n_forecast)
        
        # Save forecasts to database
        print("[Backend] Saving forecasts to database...")
        forecast_df = pd.DataFrame(forecast_results)
        forecast_df['created_at'] = datetime.now()
        
        try:
            with engine.begin() as conn:
                conn.execute(text("DELETE FROM forecasts"))
        except:
            # Table might not exist, create it
            print("[Backend] Creating forecasts table...")
            create_forecasts_table = """
                CREATE TABLE IF NOT EXISTS forecasts (
                    id SERIAL PRIMARY KEY,
                    product_sku VARCHAR(255),
                    forecast_date DATE,
                    predicted_sales INTEGER,
                    current_sales INTEGER,
                    current_date_col DATE,
                    created_at TIMESTAMP
                )
            """
            with engine.begin() as conn:
                conn.execute(text(create_forecasts_table))
        
        forecast_df.to_sql('forecasts', engine, if_exists='append', index=False)
        
        print(f"[Backend] ✅ Generated {len(forecast_results)} forecasts for {n_forecast} months")
        
        # Convert dates to strings for JSON serialization
        for item in forecast_results:
            if 'forecast_date' in item:
                item['forecast_date'] = str(item['forecast_date'])
            if 'current_date_col' in item:
                item['current_date_col'] = str(item['current_date_col'])
        
        return {
            "status": "success",
            "forecast_rows": len(forecast_results),
            "n_forecast": n_forecast,
            "forecast": forecast_results
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Backend] ❌ Error generating forecasts: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/predict/clear")
async def clear_forecasts():
    """Clear all forecast data"""
    try:
        print("[Backend] Clearing forecasts...")
        
        if not engine:
            raise HTTPException(status_code=500, detail="Database not available")
        
        with engine.begin() as conn:
            conn.execute(text("DELETE FROM forecasts"))
        
        print("[Backend] ✅ Forecasts cleared")
        return {"success": True, "message": "Forecasts cleared successfully"}
        
    except Exception as e:
        print(f"[Backend] ❌ Error clearing forecasts: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# RUN SERVER
# ============================================================================

if __name__ == "__main__":
    print("=" * 80)
    print("Starting Lon TukTak Backend Server")
    print("=" * 80)
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
