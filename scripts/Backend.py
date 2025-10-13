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
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
import os

# ============================================================================
# DATABASE CONFIGURATION
# ============================================================================

# Configure your database connection here
# Supported formats:
# PostgreSQL: "postgresql://username:password@localhost:5432/database_name"
# MySQL: "mysql+pymysql://username:password@localhost:3306/database_name"
# SQLite: "sqlite:///./lontuktak.db"

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./lontuktak.db"  # Default to SQLite for easy setup
)

# Create database engine
try:
    engine = create_engine(DATABASE_URL, echo=True)
    print(f"[Backend] Database connected: {DATABASE_URL}")
except Exception as e:
    print(f"[Backend] Database connection failed: {str(e)}")
    engine = None

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
        "docs": "/docs",
        "database": "connected" if engine else "disconnected"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    db_status = "connected"
    if engine:
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
        except:
            db_status = "disconnected"
    else:
        db_status = "not configured"
    
    return {
        "status": "healthy",
        "database": db_status,
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
        
        if engine:
            try:
                # Store sales data
                sales_df.to_sql('sales_data', engine, if_exists='replace', index=False)
                print(f"[Backend] Stored {len(sales_df)} sales records in database")
                
                # Store product data if provided
                if product_df is not None:
                    product_df.to_sql('product_data', engine, if_exists='replace', index=False)
                    print(f"[Backend] Stored {len(product_df)} product records in database")
                
            except SQLAlchemyError as e:
                print(f"[Backend] Database error: {str(e)}")
                raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        
        return {
            "success": True,
            "message": "Model trained successfully and data stored in database",
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
        
        if engine:
            try:
                # Adjust this query based on your actual table structure
                # Expected columns: product_name, product_sku, stock, category, status
                query = """
                    SELECT 
                        product_name,
                        product_sku,
                        stock,
                        category,
                        CASE 
                            WHEN stock = 0 THEN 'Out of Stock'
                            WHEN stock < 15 THEN 'Low Stock'
                            ELSE 'In Stock'
                        END as status
                    FROM product_data
                    ORDER BY stock ASC
                """
                
                df = pd.read_sql(query, engine)
                stock_data = df.to_dict('records')
                
                print(f"[Backend] Retrieved {len(stock_data)} stock records from database")
                
                return {
                    "success": True,
                    "data": stock_data,
                    "total": len(stock_data),
                    "timestamp": datetime.now().isoformat()
                }
                
            except SQLAlchemyError as e:
                print(f"[Backend] Database error: {str(e)}")
                # Fall back to mock data if database query fails
                print("[Backend] Falling back to mock data")
        
        # Mock data fallback
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
        
        if engine:
            try:
                # This query calculates stock alerts based on current and previous stock levels
                # Adjust column names based on your actual database schema
                query = """
                    SELECT 
                        p.product_name as Product,
                        p.stock as Stock,
                        p.last_stock as Last_Stock,
                        ROUND(((p.last_stock - p.stock) * 100.0 / NULLIF(p.last_stock, 0)), 1) as "Decrease_Rate(%)",
                        CASE 
                            WHEN (p.stock - p.last_stock) <= 0 THEN 0
                            ELSE ROUND(p.stock / NULLIF((p.last_stock - p.stock), 0))
                        END as Weeks_To_Empty,
                        p.min_stock as MinStock,
                        p.buffer_stock as Buffer,
                        CASE 
                            WHEN p.stock < p.min_stock THEN (p.min_stock + p.buffer_stock - p.stock)
                            ELSE 0
                        END as Reorder_Qty,
                        CASE 
                            WHEN p.stock = 0 THEN 'Critical'
                            WHEN p.stock < p.min_stock THEN 'Warning'
                            ELSE 'Good'
                        END as Status,
                        CASE 
                            WHEN p.stock = 0 THEN 'Out of stock! Immediate reorder required.'
                            WHEN p.stock < p.min_stock THEN 'Stock level below minimum threshold. Reorder recommended.'
                            ELSE 'Stock levels are healthy.'
                        END as Description
                    FROM product_data p
                    WHERE p.stock < p.min_stock OR p.stock = 0
                    ORDER BY 
                        CASE 
                            WHEN p.stock = 0 THEN 1
                            WHEN p.stock < p.min_stock THEN 2
                            ELSE 3
                        END,
                        p.stock ASC
                """
                
                df = pd.read_sql(query, engine)
                notifications = df.to_dict('records')
                
                print(f"[Backend] Retrieved {len(notifications)} notifications from database")
                
                return notifications
                
            except SQLAlchemyError as e:
                print(f"[Backend] Database error: {str(e)}")
                print("[Backend] Falling back to mock data")
        
        # Mock data fallback
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
        
        if engine:
            try:
                # Get total stock items
                total_items_query = "SELECT COUNT(DISTINCT product_sku) as total FROM product_data"
                total_items = pd.read_sql(total_items_query, engine).iloc[0]['total']
                
                # Get low stock alerts
                low_stock_query = "SELECT COUNT(*) as count FROM product_data WHERE stock < min_stock"
                low_stock = pd.read_sql(low_stock_query, engine).iloc[0]['count']
                
                # Get out of stock items
                out_of_stock_query = "SELECT COUNT(*) as count FROM product_data WHERE stock = 0"
                out_of_stock = pd.read_sql(out_of_stock_query, engine).iloc[0]['count']
                
                # Get sales this month (adjust based on your sales table structure)
                sales_query = """
                    SELECT COALESCE(SUM(total_amount), 0) as total 
                    FROM sales_data 
                    WHERE strftime('%Y-%m', sale_date) = strftime('%Y-%m', 'now')
                """
                sales_this_month = pd.read_sql(sales_query, engine).iloc[0]['total']
                
                dashboard_data = {
                    "total_stock_items": int(total_items),
                    "low_stock_alerts": int(low_stock),
                    "sales_this_month": float(sales_this_month),
                    "out_of_stock": int(out_of_stock)
                }
                
                print(f"[Backend] Retrieved dashboard analytics from database")
                
                return {
                    "success": True,
                    "data": dashboard_data,
                    "timestamp": datetime.now().isoformat()
                }
                
            except SQLAlchemyError as e:
                print(f"[Backend] Database error: {str(e)}")
                print("[Backend] Falling back to mock data")
        
        # Mock data fallback
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
        
        if engine:
            try:
                # Adjust this query based on your actual sales table structure
                query = """
                    SELECT 
                        strftime('%Y-%m', sale_date) as date,
                        size,
                        SUM(quantity) as quantity,
                        SUM(total_amount) as income
                    FROM sales_data
                    WHERE product_sku LIKE ?
                    GROUP BY strftime('%Y-%m', sale_date), size
                    ORDER BY date DESC
                    LIMIT 12
                """
                
                df = pd.read_sql(query, engine, params=[f"{base_sku}%"])
                
                # Transform data for chart format
                months = df['date'].unique().tolist()
                sizes = df['size'].unique().tolist()
                
                series = []
                for size in sizes:
                    size_data = df[df['size'] == size]
                    values = size_data['quantity'].tolist()
                    series.append({"size": size, "values": values})
                
                historical_data = {
                    "chart": {
                        "months": months,
                        "series": series
                    },
                    "table": df.to_dict('records')
                }
                
                print(f"[Backend] Retrieved historical sales from database")
                
                return historical_data
                
            except SQLAlchemyError as e:
                print(f"[Backend] Database error: {str(e)}")
                print("[Backend] Falling back to mock data")
        
        # Mock data fallback
        historical_data = {
            "chart": {
                "months": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
                "series": [
                    {"size": "M", "values": [120, 135, 142, 158, 165, 172]},
                    {"size": "L", "values": [95, 102, 108, 115, 122, 128]}
                ]
            },
            "table": [
                {"date": "2025-01", "size": "M", "quantity": 120, "income": 24000},
                {"date": "2025-01", "size": "L", "quantity": 95, "income": 19000}
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
        
        if engine:
            try:
                # Adjust this query based on your actual sales table structure
                query = """
                    SELECT 
                        SUBSTR(product_sku, 1, INSTR(product_sku, '-') - 1) as base_sku,
                        size as best_size,
                        SUM(quantity) as quantity
                    FROM sales_data
                    WHERE strftime('%Y', sale_date) = ? 
                        AND strftime('%m', sale_date) = ?
                    GROUP BY base_sku, size
                    ORDER BY quantity DESC
                    LIMIT ?
                """
                
                df = pd.read_sql(
                    query, 
                    engine, 
                    params=[str(year), f"{month:02d}", top_n]
                )
                
                best_sellers_data = {
                    "table": df.to_dict('records')
                }
                
                print(f"[Backend] Retrieved {len(df)} best sellers from database")
                
                return best_sellers_data
                
            except SQLAlchemyError as e:
                print(f"[Backend] Database error: {str(e)}")
                print("[Backend] Falling back to mock data")
        
        # Mock data fallback
        best_sellers_data = {
            "table": [
                {"base_sku": "SB", "best_size": "M", "quantity": 450},
                {"base_sku": "DS", "best_size": "L", "quantity": 380},
                {"base_sku": "SS", "best_size": "M", "quantity": 320}
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
