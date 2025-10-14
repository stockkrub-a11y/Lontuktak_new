from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import os
import pandas as pd
import joblib
import uvicorn
from sqlalchemy import text

# Import local modules
from Auto_cleaning import auto_cleaning
from DB_server import engine
from Predict import update_model_and_train, forcast_loop, Evaluate
from Notification import get_notifications as get_notification_data
from stock_sync import sync_products_to_stock_data

# Initialize FastAPI app
app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
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
# TRAINING ENDPOINT
# ============================================================================

@app.post("/train")
async def train_model(
    sales_file: UploadFile = File(...),
    product_file: UploadFile = File(...)
):
    """Train model with uploaded files"""
    try:
        print(f"[Backend] Received training request")
        print(f"[Backend] Sales file: {sales_file.filename}")
        print(f"[Backend] Product file: {product_file.filename}")
        
        # Save uploaded files temporarily
        sales_path = f"temp_{sales_file.filename}"
        product_path = f"temp_{product_file.filename}"
        
        with open(sales_path, "wb") as f:
            f.write(await sales_file.read())
        
        with open(product_path, "wb") as f:
            f.write(await product_file.read())
        
        # Process files with auto_cleaning
        print("[Backend] Processing files with auto_cleaning...")
        auto_cleaning(sales_path, product_path, engine)
        
        print("[Backend] Syncing products to stock_data table...")
        sync_result = sync_products_to_stock_data()
        print(f"[Backend] Stock sync result: {sync_result}")
        
        print("[Backend] Loading training data from base_data...")
        query = """
            SELECT 
                product_sku,
                product_name,
                sales_date,
                sales_year,
                sales_month,
                total_quantity
            FROM base_data
            ORDER BY sales_date ASC
        """
        df = pd.read_sql(query, engine)
        print(f"[Backend] Loaded {len(df)} rows from base_data")
        rows_uploaded = len(df)
        
        print("[Backend] Training model...")
        df_window_raw, df_window, base_model, X_train, y_train, X_test, y_test, product_sku_last = update_model_and_train(df)
        
        print("[Backend] Generating forecasts...")
        long_forecast, long_forecast_rows = forcast_loop(X_train, y_train, df_window_raw, product_sku_last, base_model)
        forecast_rows = len(long_forecast_rows)
        
        # Clean up temp files
        os.remove(sales_path)
        os.remove(product_path)
        
        print(f"[Backend] ✅ Training completed successfully: {rows_uploaded} rows, {forecast_rows} forecasts")
        
        return {
            "success": True,
            "message": "Model trained successfully",
            "data_cleaning": {
                "rows_uploaded": rows_uploaded,
                "status": "success"
            },
            "ml_training": {
                "status": "success",
                "forecast_rows": forecast_rows,
                "message": f"Generated {forecast_rows} forecasts"
            },
            "stock_sync": sync_result,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        print(f"[Backend] Error in train_model: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")

# ============================================================================
# STOCK ENDPOINTS
# ============================================================================

@app.get("/stock/levels")
async def get_stock_levels():
    """Get current stock levels"""
    try:
        print("[Backend] Fetching stock levels")
        
        if not engine:
            return {"success": False, "data": [], "message": "Database not configured"}
        
        query = """
            SELECT DISTINCT ON (product_name)
                product_name,
                product_sku,
                stock_level,
                category,
                CASE 
                    WHEN stock_level = 0 THEN 'Out of Stock'
                    WHEN stock_level < minstock THEN 'Low Stock'
                    ELSE 'In Stock'
                END as status
            FROM stock_data
            ORDER BY product_name, week_date DESC
        """
        
        df = pd.read_sql(query, engine)
        
        return {
            "success": True,
            "data": df.to_dict('records'),
            "total": len(df)
        }
        
    except Exception as e:
        print(f"[Backend] Error in get_stock_levels: {str(e)}")
        # Fallback to base_data
        try:
            query = """
                SELECT 
                    product_name,
                    product_sku,
                    SUM(total_quantity) as stock_level,
                    category,
                    'In Stock' as status
                FROM base_data
                GROUP BY product_name, product_sku, category
                ORDER BY product_name
            """
            df = pd.read_sql(query, engine)
            return {"success": True, "data": df.to_dict('records')}
        except Exception as e2:
            return {"success": False, "data": [], "error": str(e2)}

# ============================================================================
# NOTIFICATIONS ENDPOINT
# ============================================================================

@app.get("/api/notifications")
async def get_notifications():
    """Get inventory notifications"""
    try:
        print("[Backend] Fetching notifications")
        
        if not engine:
            print("[Backend] ❌ Database engine not available")
            return []
        
        print("[Backend] Calling get_notification_data()...")
        notifications = get_notification_data()
        
        print(f"[Backend] get_notification_data() returned type: {type(notifications)}")
        print(f"[Backend] get_notification_data() returned value: {notifications}")
        
        # Handle error case - if it returns a dict with 'error' key, return empty array
        if isinstance(notifications, dict) and "error" in notifications:
            print(f"[Backend] ⚠️ Notification error: {notifications['error']}")
            return []
        
        # Handle case where notifications is not a list
        if not isinstance(notifications, list):
            print(f"[Backend] ❌ Unexpected notification format: {type(notifications)}")
            return []
        
        print(f"[Backend] ✅ Retrieved {len(notifications)} notifications")
        print(f"[Backend] Sample notification: {notifications[0] if notifications else 'None'}")
        return notifications
        
    except Exception as e:
        print(f"[Backend] ❌ Error in get_notifications: {str(e)}")
        import traceback
        traceback.print_exc()
        return []

# ============================================================================
# ANALYSIS ENDPOINTS
# ============================================================================

@app.get("/analysis/dashboard")
async def get_dashboard_analytics():
    """Get dashboard analytics data"""
    try:
        print("[Backend] Fetching dashboard analytics")
        
        if not engine:
            return {"success": False, "data": {}}
        
        current_date = datetime.now()
        current_month = current_date.month
        current_year = current_date.year
        
        # Total stock items
        stock_query = """
            SELECT COUNT(DISTINCT product_sku) as total_items
            FROM stock_data
            WHERE week_date = (SELECT MAX(week_date) FROM stock_data)
        """
        total_items_result = pd.read_sql(stock_query, engine)
        total_items = int(total_items_result.iloc[0]['total_items']) if not total_items_result.empty else 0
        
        # Low stock alerts
        low_stock_query = """
            SELECT COUNT(*) as low_stock_count
            FROM stock_data
            WHERE week_date = (SELECT MAX(week_date) FROM stock_data)
            AND stock_level < minstock
            AND stock_level > 0
        """
        low_stock_result = pd.read_sql(low_stock_query, engine)
        low_stock = int(low_stock_result.iloc[0]['low_stock_count']) if not low_stock_result.empty else 0
        
        # Out of stock
        out_of_stock_query = """
            SELECT COUNT(*) as out_of_stock_count
            FROM stock_data
            WHERE week_date = (SELECT MAX(week_date) FROM stock_data)
            AND stock_level = 0
        """
        out_of_stock_result = pd.read_sql(out_of_stock_query, engine)
        out_of_stock = int(out_of_stock_result.iloc[0]['out_of_stock_count']) if not out_of_stock_result.empty else 0
        
        # Sales this month
        sales_query = f"""
            SELECT COALESCE(SUM(total_amount_baht), 0) as monthly_sales
            FROM base_data
            WHERE EXTRACT(MONTH FROM sales_date) = {current_month}
            AND EXTRACT(YEAR FROM sales_date) = {current_year}
        """
        monthly_sales_result = pd.read_sql(sales_query, engine)
        monthly_sales = float(monthly_sales_result.iloc[0]['monthly_sales']) if not monthly_sales_result.empty else 0
        
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
        print(f"[Backend] Error in get_dashboard_analytics: {str(e)}")
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
async def get_base_skus(search: str = Query("")):
    """Get unique base SKUs for autocomplete"""
    try:
        print(f"[Backend] Fetching base SKUs with search: '{search}'")
        
        if not engine:
            return {"success": False, "data": []}
        
        # Query all product SKUs
        query = "SELECT DISTINCT product_sku FROM base_data ORDER BY product_sku"
        df = pd.read_sql(query, engine)
        
        # Extract base SKUs (first 3 parts: prefix-category-number)
        base_skus = set()
        for sku in df['product_sku']:
            parts = str(sku).split('-')
            if len(parts) >= 3:
                base_sku = '-'.join(parts[:3])
                base_skus.add(base_sku)
        
        # Filter by search term
        if search:
            # Extract base SKU from search term if it's a full SKU
            search_parts = search.split('-')
            if len(search_parts) >= 3:
                search_base = '-'.join(search_parts[:3])
            else:
                search_base = search
            
            base_skus = [sku for sku in base_skus if search_base.upper() in sku.upper()]
        else:
            base_skus = list(base_skus)
        
        base_skus.sort()
        
        print(f"[Backend] ✅ Found {len(base_skus)} base SKUs")
        
        return {
            "success": True,
            "data": base_skus
        }
        
    except Exception as e:
        print(f"[Backend] Error in get_base_skus: {str(e)}")
        return {"success": False, "data": [], "error": str(e)}

@app.get("/analysis/historical")
async def get_historical_sales(sku: str = Query(...)):
    """Get historical sales data for a product"""
    try:
        print(f"[Backend] Fetching historical sales for SKU: {sku}")
        
        if not engine:
            return {
                "success": False,
                "message": "Database not configured",
                "chart_data": [],
                "table_data": [],
                "sizes": []
            }
        
        print(f"[Backend] Searching for SKU pattern: {sku}")
        
        query = text("""
            SELECT 
                product_sku,
                product_name,
                sales_date,
                sales_year,
                sales_month,
                total_quantity
            FROM base_data
            WHERE product_sku LIKE :sku_pattern
            ORDER BY sales_date ASC, product_sku ASC
        """)
        
        # Execute query with parameters
        with engine.connect() as conn:
            result = conn.execute(query, {"sku_pattern": f"{sku}%"})
            df = pd.DataFrame(result.fetchall(), columns=result.keys())
        
        print(f"[Backend] Retrieved {len(df)} rows from base_data")
        
        if df.empty:
            return {
                "success": False,
                "message": f"No data found for SKU: {sku}",
                "chart_data": [],
                "table_data": [],
                "sizes": []
            }
        
        # Extract size from SKU (everything after first 3 parts)
        df['size'] = df['product_sku'].apply(
            lambda x: '-'.join(x.split('-')[3:]) if len(x.split('-')) > 3 else 'Standard'
        )
        
        # Group by date and size
        df['year_month'] = pd.to_datetime(df['sales_date']).dt.to_period('M')
        grouped = df.groupby(['year_month', 'size'])['total_quantity'].sum().reset_index()
        
        # Pivot to get sizes as columns
        pivot = grouped.pivot(index='year_month', columns='size', values='total_quantity').fillna(0)
        
        # Get unique sizes
        sizes = list(pivot.columns)
        print(f"[Backend] Found {len(sizes)} sizes: {sizes}")
        
        # Convert to chart format
        chart_data = []
        for date_idx, row in pivot.iterrows():
            month_data = {"month": str(date_idx)}
            for size in sizes:
                month_data[size] = int(row[size])
            chart_data.append(month_data)
        
        # Convert to table format
        table_data = []
        for date_idx, row in pivot.iterrows():
            row_data = {"date": str(date_idx)}
            for size in sizes:
                row_data[size] = int(row[size])
            table_data.append(row_data)
        
        print(f"[Backend] ✅ Retrieved historical sales: {len(chart_data)} months, {len(sizes)} sizes")
        
        return {
            "success": True,
            "message": "Historical sales data retrieved successfully",
            "chart_data": chart_data,
            "table_data": table_data,
            "sizes": sizes
        }
        
    except Exception as e:
        print(f"[Backend] Error in get_historical_sales: {str(e)}")
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
# PREDICT ENDPOINTS
# ============================================================================

@app.get("/predict/existing")
async def get_existing_forecasts():
    """Get existing forecasts from CSV file"""
    try:
        print("[Backend] Fetching existing forecasts")
        
        forecast_file = "forecast_output.csv"
        
        if not os.path.exists(forecast_file):
            return {
                "status": "no_forecasts",
                "forecast_rows": 0,
                "forecast": [],
                "message": "No forecasts available. Please train the model first."
            }
        
        # Read forecasts from CSV
        df = pd.read_csv(forecast_file)
        
        # Convert to list of dicts
        forecasts = df.to_dict('records')
        
        # Convert date columns to strings
        for forecast in forecasts:
            if 'forecast_date' in forecast:
                forecast['forecast_date'] = str(forecast['forecast_date'])
            if 'current_date_col' in forecast:
                forecast['current_date_col'] = str(forecast['current_date_col'])
        
        print(f"[Backend] ✅ Retrieved {len(forecasts)} existing forecasts")
        
        return {
            "status": "success",
            "forecast_rows": len(forecasts),
            "forecast": forecasts,
            "message": f"Retrieved {len(forecasts)} forecasts"
        }
        
    except Exception as e:
        print(f"[Backend] Error in get_existing_forecasts: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to load forecasts: {str(e)}")

@app.post("/predict")
async def generate_forecasts(n_forecast: int = Query(default=3, ge=1, le=12)):
    """Generate new forecasts with specified number of months"""
    try:
        print(f"[Backend] Generating forecasts for {n_forecast} months")
        
        # Load training data
        print("[Backend] Loading training data from base_data...")
        query = """
            SELECT 
                product_sku,
                product_name,
                sales_date,
                sales_year,
                sales_month,
                total_quantity
            FROM base_data
            ORDER BY sales_date ASC
        """
        df = pd.read_sql(query, engine)
        
        if df.empty:
            raise HTTPException(
                status_code=400,
                detail="No training data available. Please upload sales data first."
            )
        
        print(f"[Backend] Loaded {len(df)} rows from base_data")
        
        # Train model
        print("[Backend] Training model...")
        df_window_raw, df_window, base_model, X_train, y_train, X_test, y_test, product_sku_last = update_model_and_train(df)
        
        # Generate forecasts
        print(f"[Backend] Generating {n_forecast} month forecasts...")
        long_forecast, long_forecast_rows = forcast_loop(
            X_train, y_train, df_window_raw, product_sku_last, base_model, 
            n_forecast=n_forecast
        )
        
        # Convert to serializable format
        forecasts = []
        for forecast in long_forecast_rows:
            forecasts.append({
                "product_sku": forecast["product_sku"],
                "forecast_date": str(forecast["forecast_date"]),
                "predicted_sales": int(forecast["predicted_sales"]),
                "current_sales": int(forecast["current_sales"]),
                "current_date_col": str(forecast["current_date_col"])
            })
        
        print(f"[Backend] ✅ Generated {len(forecasts)} forecasts")
        
        return {
            "status": "success",
            "forecast_rows": len(forecasts),
            "n_forecast": n_forecast,
            "forecast": forecasts
        }
        
    except Exception as e:
        print(f"[Backend] Error in generate_forecasts: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Forecast generation failed: {str(e)}")

# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    print("="*80)
    print("Lon TukTak Backend Server")
    print("="*80)
    print(f"Starting server at http://localhost:8000")
    print(f"API docs available at http://localhost:8000/docs")
    print("="*80)
    
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
