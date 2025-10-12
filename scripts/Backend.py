"""
Lon TukTak Backend API Server
FastAPI backend for stock management and sales forecasting
"""

from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
from typing import Optional, List
import pandas as pd
import io
import uvicorn

# Initialize FastAPI app
app = FastAPI(title="Lon TukTak API", version="1.0.0")

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

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Lon TukTak API Server",
        "status": "running",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    }

# ============================================================================
# TRAIN MODEL ENDPOINT
# ============================================================================

@app.post("/train")
async def train_model(
    sales_file: UploadFile = File(...),
    product_file: Optional[UploadFile] = File(None)
):
    """
    Upload and train model with sales and product data
    """
    try:
        print(f"[Backend] Received training request")
        print(f"[Backend] Sales file: {sales_file.filename}")
        
        # Read sales file
        sales_content = await sales_file.read()
        
        # Determine file type and read accordingly
        if sales_file.filename.endswith('.xlsx') or sales_file.filename.endswith('.xls'):
            sales_df = pd.read_excel(io.BytesIO(sales_content))
        elif sales_file.filename.endswith('.csv'):
            sales_df = pd.read_csv(io.BytesIO(sales_content))
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Use .xlsx, .xls, or .csv")
        
        print(f"[Backend] Sales data shape: {sales_df.shape}")
        print(f"[Backend] Sales columns: {sales_df.columns.tolist()}")
        
        # Read product file if provided
        product_df = None
        if product_file:
            print(f"[Backend] Product file: {product_file.filename}")
            product_content = await product_file.read()
            
            if product_file.filename.endswith('.xlsx') or product_file.filename.endswith('.xls'):
                product_df = pd.read_excel(io.BytesIO(product_content))
            elif product_file.filename.endswith('.csv'):
                product_df = pd.read_csv(io.BytesIO(product_content))
            
            print(f"[Backend] Product data shape: {product_df.shape}")
            print(f"[Backend] Product columns: {product_df.columns.tolist()}")
        
        # TODO: Add your actual model training logic here
        # Example: train_your_model(sales_df, product_df)
        # For now, we'll just validate and return success
        
        return {
            "success": True,
            "message": "Model trained successfully",
            "sales_records": len(sales_df),
            "product_records": len(product_df) if product_df is not None else 0,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        print(f"[Backend] Error in train_model: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")

# ============================================================================
# STOCK LEVELS ENDPOINT
# ============================================================================

@app.get("/stock/levels")
async def get_stock_levels():
    """
    Get current stock levels for all products
    """
    try:
        print("[Backend] Fetching stock levels")
        
        # TODO: Replace with actual database query
        # Example:
        # query = "SELECT product_name, product_sku, stock, category, status FROM stock_data"
        # df = pd.read_sql(query, engine)
        # return {"success": True, "data": df.to_dict('records')}
        
        # Mock data for demonstration
        stock_data = [
            {
                "product_name": "Shinchan Boxers",
                "product_sku": "SB-M-001",
                "stock": 45,
                "category": "Boxers",
                "status": "In Stock"
            },
            {
                "product_name": "Deep Sleep Pants",
                "product_sku": "DS-L-002",
                "stock": 12,
                "category": "Pants",
                "status": "Low Stock"
            },
            {
                "product_name": "Long Pants Classic",
                "product_sku": "LP-XL-003",
                "stock": 0,
                "category": "Pants",
                "status": "Out of Stock"
            },
            {
                "product_name": "Summer Shorts",
                "product_sku": "SS-M-004",
                "stock": 67,
                "category": "Shorts",
                "status": "In Stock"
            },
            {
                "product_name": "Winter Boxers",
                "product_sku": "WB-L-005",
                "stock": 8,
                "category": "Boxers",
                "status": "Low Stock"
            }
        ]
        
        return {
            "success": True,
            "data": stock_data,
            "total": len(stock_data),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        print(f"[Backend] Error in get_stock_levels: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch stock levels: {str(e)}")

# ============================================================================
# NOTIFICATIONS ENDPOINT
# ============================================================================

@app.get("/api/notifications")
async def get_notifications():
    """
    Get inventory notifications and alerts
    """
    try:
        print("[Backend] Fetching notifications")
        
        # TODO: Replace with actual database query
        # Example:
        # query = """
        #     SELECT * FROM notifications 
        #     WHERE is_active = true 
        #     ORDER BY created_at DESC
        # """
        # df = pd.read_sql(query, engine)
        # return df.to_dict('records')
        
        # Mock data for demonstration
        notifications = [
            {
                "Product": "Deep Sleep Pants",
                "Stock": 12,
                "Last_Stock": 25,
                "Decrease_Rate(%)": 52.0,
                "Weeks_To_Empty": 2,
                "MinStock": 15,
                "Buffer": 5,
                "Reorder_Qty": 30,
                "Status": "Warning",
                "Description": "Stock level below minimum threshold. Reorder recommended."
            },
            {
                "Product": "Long Pants Classic",
                "Stock": 0,
                "Last_Stock": 8,
                "Decrease_Rate(%)": 100.0,
                "Weeks_To_Empty": 0,
                "MinStock": 10,
                "Buffer": 5,
                "Reorder_Qty": 50,
                "Status": "Critical",
                "Description": "Out of stock! Immediate reorder required."
            },
            {
                "Product": "Winter Boxers",
                "Stock": 8,
                "Last_Stock": 15,
                "Decrease_Rate(%)": 46.7,
                "Weeks_To_Empty": 1,
                "MinStock": 12,
                "Buffer": 3,
                "Reorder_Qty": 25,
                "Status": "Warning",
                "Description": "Low stock alert. Consider reordering soon."
            },
            {
                "Product": "Shinchan Boxers",
                "Stock": 45,
                "Last_Stock": 42,
                "Decrease_Rate(%)": -7.1,
                "Weeks_To_Empty": 8,
                "MinStock": 20,
                "Buffer": 10,
                "Reorder_Qty": 0,
                "Status": "Good",
                "Description": "Stock levels are healthy."
            }
        ]
        
        return notifications
        
    except Exception as e:
        print(f"[Backend] Error in get_notifications: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch notifications: {str(e)}")

# ============================================================================
# DASHBOARD ANALYTICS ENDPOINT
# ============================================================================

@app.get("/analysis/dashboard")
async def get_dashboard_analytics():
    """
    Get dashboard analytics data
    """
    try:
        print("[Backend] Fetching dashboard analytics")
        
        # TODO: Replace with actual database queries
        # Example:
        # total_items = pd.read_sql("SELECT COUNT(DISTINCT product_sku) FROM stock_data", engine)
        # low_stock = pd.read_sql("SELECT COUNT(*) FROM stock_data WHERE stock < minstock", engine)
        
        # Mock data for demonstration
        dashboard_data = {
            "total_stock_items": 156,
            "low_stock_alerts": 12,
            "sales_this_month": 245678.50,
            "out_of_stock": 4
        }
        
        return {
            "success": True,
            "data": dashboard_data,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        print(f"[Backend] Error in get_dashboard_analytics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch dashboard analytics: {str(e)}")

# ============================================================================
# PREDICTION ENDPOINT
# ============================================================================

@app.post("/predict")
async def predict_sales(n_forecast: int = Query(default=3, ge=1, le=12)):
    """
    Generate sales forecast
    """
    try:
        print(f"[Backend] Generating forecast for {n_forecast} periods")
        
        # TODO: Replace with actual prediction logic
        # Example:
        # from Predict import forcast_loop
        # forecast_df = forcast_loop(n_forecast)
        # return forecast_df.to_dict('records')
        
        # Mock data for demonstration
        forecast_data = []
        base_date = datetime.now()
        
        for i in range(n_forecast):
            forecast_date = base_date + timedelta(weeks=i+1)
            forecast_data.append({
                "product_sku": "SB-M-001",
                "forecast_date": forecast_date.strftime("%Y-%m-%d"),
                "predicted_sales": 45 + (i * 5),
                "current_sales": 42,
                "current_date_col": base_date.strftime("%Y-%m-%d")
            })
        
        return {
            "status": "success",
            "forecast_rows": len(forecast_data),
            "n_forecast": n_forecast,
            "forecast": forecast_data
        }
        
    except Exception as e:
        print(f"[Backend] Error in predict_sales: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

# ============================================================================
# HISTORICAL SALES ENDPOINT
# ============================================================================

@app.get("/historical")
async def get_historical_sales(base_sku: str = Query(...)):
    """
    Get historical sales data for a product
    """
    try:
        print(f"[Backend] Fetching historical sales for {base_sku}")
        
        # TODO: Replace with actual database query
        # Mock data for demonstration
        historical_data = {
            "chart": {
                "months": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
                "series": [
                    {"size": "M", "values": [120, 135, 142, 158, 165, 172]},
                    {"size": "L", "values": [95, 102, 108, 115, 122, 128]},
                    {"size": "XL", "values": [78, 85, 89, 95, 98, 105]}
                ]
            },
            "table": [
                {"date": "2025-01", "size": "M", "quantity": 120, "income": 24000},
                {"date": "2025-01", "size": "L", "quantity": 95, "income": 19000},
                {"date": "2025-02", "size": "M", "quantity": 135, "income": 27000}
            ]
        }
        
        return historical_data
        
    except Exception as e:
        print(f"[Backend] Error in get_historical_sales: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch historical sales: {str(e)}")

# ============================================================================
# PERFORMANCE COMPARISON ENDPOINT
# ============================================================================

@app.get("/performance")
async def get_performance_comparison(sku_list: List[str] = Query(...)):
    """
    Compare performance of multiple products
    """
    try:
        print(f"[Backend] Comparing performance for: {sku_list}")
        
        # TODO: Replace with actual database query
        # Mock data for demonstration
        performance_data = {
            "scatter": [
                {"item": sku_list[0] if len(sku_list) > 0 else "SB-M-001", "quantity": 450},
                {"item": sku_list[1] if len(sku_list) > 1 else "DS-L-002", "quantity": 320},
                {"item": sku_list[2] if len(sku_list) > 2 else "LP-XL-003", "quantity": 280}
            ]
        }
        
        return performance_data
        
    except Exception as e:
        print(f"[Backend] Error in get_performance_comparison: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch performance data: {str(e)}")

# ============================================================================
# BEST SELLERS ENDPOINT
# ============================================================================

@app.get("/best_sellers")
async def get_best_sellers(
    year: int = Query(...),
    month: int = Query(...),
    top_n: int = Query(default=10, ge=1, le=50)
):
    """
    Get best selling products for a specific month
    """
    try:
        print(f"[Backend] Fetching best sellers for {year}-{month:02d}, top {top_n}")
        
        # TODO: Replace with actual database query
        # Mock data for demonstration
        best_sellers_data = {
            "table": [
                {"base_sku": "SB", "best_size": "M", "quantity": 450},
                {"base_sku": "DS", "best_size": "L", "quantity": 380},
                {"base_sku": "SS", "best_size": "M", "quantity": 320},
                {"base_sku": "WB", "best_size": "L", "quantity": 295},
                {"base_sku": "LP", "best_size": "XL", "quantity": 280}
            ][:top_n]
        }
        
        return best_sellers_data
        
    except Exception as e:
        print(f"[Backend] Error in get_best_sellers: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch best sellers: {str(e)}")

# ============================================================================
# RUN SERVER
# ============================================================================

if __name__ == "__main__":
    print("=" * 80)
    print("Starting Lon TukTak Backend API Server")
    print("=" * 80)
    print("Server will run on: http://localhost:8000")
    print("API Documentation: http://localhost:8000/docs")
    print("Health Check: http://localhost:8000/health")
    print("=" * 80)
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
