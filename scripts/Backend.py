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
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
import os
import numpy as np
import tempfile
import shutil

from Auto_cleaning import auto_cleaning, check_db_status
from DB_server import engine
from Predict import update_model_and_train, forcast_loop
from data_analyzer import size_mix_pivot, performance_table, best_sellers_by_month, total_income_table

# ============================================================================
# DATABASE CONFIGURATION
# ============================================================================

# Configure your database connection here
# Supported formats:
# PostgreSQL: "postgresql://username:password@localhost:5432/database_name"
# MySQL: "mysql+pymysql://username:password@localhost:3306/database_name"
# SQLite: "sqlite:///./lontuktak.db"

# DATABASE_URL = os.getenv(
#     "DATABASE_URL",
#     "sqlite:///./lontuktak.db"  # Default to SQLite for easy setup
# )

# Create database engine
# try:
#     engine = create_engine(DATABASE_URL, echo=True)
#     print(f"[Backend] Database connected: {DATABASE_URL}")
# except Exception as e:
#     print(f"[Backend] Database connection failed: {str(e)}")
#     engine = None

# Initialize FastAPI app
app = FastAPI(title="Lon TukTak API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://0.0.0.0:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],  # Allow frontend to read all response headers
)

# Function to ensure tables exist
def ensure_tables_exist():
    """
    Ensure required database tables exist, create them if they don't
    """
    if not engine:
        print("[Backend] No database engine available")
        return False
    
    try:
        with engine.connect() as conn:
            # Check if base_data table exists
            check_query = text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'base_data'
                );
            """)
            
            result = conn.execute(check_query).fetchone()
            table_exists = result[0] if result else False
            
            if not table_exists:
                print("[Backend] Tables don't exist, creating them now...")
                
                # Create base_data table
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS base_data (
                        product_sku      VARCHAR(50) NOT NULL,
                        product_name     VARCHAR(200),
                        sales_date       DATE NOT NULL,
                        sales_year       INTEGER,
                        sales_month      INTEGER,
                        total_quantity   NUMERIC(12),
                        CONSTRAINT pk_base_data PRIMARY KEY (product_sku, sales_date)
                    );
                """))
                
                # Create all_products table
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS all_products (
                        product_sku     VARCHAR(50) NOT NULL,
                        product_name    VARCHAR(200),
                        category        VARCHAR(100),
                        quantity        NUMERIC(12),
                        CONSTRAINT pk_products PRIMARY KEY (product_sku)
                    );
                """))
                
                # Create forecast_output table
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS forecast_output (
                        product_sku      VARCHAR(50) NOT NULL,
                        forecast_date    DATE NOT NULL,
                        predicted_sales  NUMERIC(12,2),
                        current_sale     NUMERIC(12,2),
                        current_date_col DATE,
                        CONSTRAINT pk_forecast_output PRIMARY KEY (product_sku, forecast_date)
                    );
                """))
                
                conn.commit()
                print("[Backend] ✅ Tables created successfully")
                return True
            else:
                print("[Backend] ✅ Tables already exist")
                return True
                
    except Exception as e:
        print(f"[Backend] ❌ Error ensuring tables exist: {str(e)}")
        return False

print("[Backend] Checking database tables...")
ensure_tables_exist()

# ============================================================================
# HEALTH CHECK
# ============================================================================

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to Lon TukTak API",
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
    product_file: UploadFile = File(...)
):
    """
    Upload and train model with sales and product data using Auto_cleaning.py
    Then train ML model using Predict.py
    """
    sales_temp_path = None
    product_temp_path = None
    
    try:
        print(f"[Backend] Received training request")
        print(f"[Backend] Sales file: {sales_file.filename}")
        print(f"[Backend] Product file: {product_file.filename}")
        
        if not engine:
            raise HTTPException(status_code=500, detail="Database not configured")
        
        print("[Backend] Ensuring database tables exist...")
        if not ensure_tables_exist():
            raise HTTPException(status_code=500, detail="Failed to create database tables")
        
        # Create temporary directory for uploaded files
        temp_dir = tempfile.mkdtemp()
        
        # Save sales file to temporary location
        sales_temp_path = os.path.join(temp_dir, sales_file.filename)
        with open(sales_temp_path, "wb") as f:
            sales_content = await sales_file.read()
            f.write(sales_content)
        print(f"[Backend] Saved sales file to: {sales_temp_path}")
        
        # Save product file to temporary location
        product_temp_path = os.path.join(temp_dir, product_file.filename)
        with open(product_temp_path, "wb") as f:
            product_content = await product_file.read()
            f.write(product_content)
        print(f"[Backend] Saved product file to: {product_temp_path}")
        
        # Step 1: Call auto_cleaning function
        print("[Backend] Step 1: Starting auto_cleaning process...")
        df_cleaned = auto_cleaning(sales_temp_path, product_temp_path, engine)
        
        print(f"[Backend] ✅ Auto cleaning completed successfully")
        print(f"[Backend] Cleaned data shape: {df_cleaned.shape}")
        
        print("[Backend] Step 2: Pulling data from base_data for ML training...")
        
        try:
            # Query base_data table to get the cleaned data
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
            
            df_for_training = pd.read_sql(query, engine)
            print(f"[Backend] Retrieved {len(df_for_training)} rows from base_data for training")
            
            if len(df_for_training) < 12:
                print("[Backend] ⚠️ Warning: Not enough data for ML training (need at least 12 months)")
                training_status = "skipped"
                training_message = "Not enough historical data for ML training (need at least 12 months)"
                forecast_rows = 0
            else:
                # Call update_model_and_train from Predict.py
                print("[Backend] Starting ML model training...")
                df_window_raw, df_window, base_model, X_train, y_train, X_test, y_test, product_sku_last = update_model_and_train(df_for_training)
                
                print(f"[Backend] ✅ ML model training completed successfully")
                
                print("[Backend] Step 3: Generating forecasts...")
                long_forecast, long_forecast_rows = forcast_loop(
                    X_train, 
                    y_train, 
                    df_window_raw, 
                    product_sku_last, 
                    base_model, 
                    n_forecast=2,  # Forecast next 2 months
                    retrain_each_step=True
                )
                
                print(f"[Backend] ✅ Forecast generation completed")
                print(f"[Backend] Generated {len(long_forecast)} forecast records")
                
                # Save forecast to database
                print("[Backend] Saving forecast to database...")
                long_forecast.to_sql(
                    'forecast_output',
                    engine,
                    if_exists='replace',
                    index=False,
                    method='multi'
                )
                
                print(f"[Backend] ✅ Forecast saved to forecast_output table")
                
                training_status = "completed"
                training_message = "ML model trained and forecasts generated successfully"
                forecast_rows = len(long_forecast)
                
        except Exception as ml_error:
            print(f"[Backend] ⚠️ ML training error: {str(ml_error)}")
            training_status = "failed"
            training_message = f"ML training failed: {str(ml_error)}"
            forecast_rows = 0
        
        # Clean up temporary files
        try:
            shutil.rmtree(temp_dir)
            print("[Backend] Cleaned up temporary files")
        except Exception as e:
            print(f"[Backend] Warning: Could not clean up temp files: {e}")
        
        return {
            "success": True,
            "message": "Data processing completed",
            "data_cleaning": {
                "status": "completed",
                "rows_uploaded": len(df_cleaned)
            },
            "ml_training": {
                "status": training_status,
                "message": training_message,
                "forecast_rows": forecast_rows
            },
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        print(f"[Backend] Error in train_model: {str(e)}")
        
        # Clean up temporary files on error
        if sales_temp_path and os.path.exists(sales_temp_path):
            try:
                os.remove(sales_temp_path)
            except:
                pass
        if product_temp_path and os.path.exists(product_temp_path):
            try:
                os.remove(product_temp_path)
            except:
                pass
        
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")

# ============================================================================
# STOCKLEVELS ENDPOINT
# ============================================================================

@app.get("/stock/levels")
async def get_stock_levels():
    """
    Get current stock levels for all products from base_data table
    """
    try:
        print("[Backend] Fetching stock levels")
        
        if engine:
            try:
                # Query from base_data table (created by auto_cleaning)
                query = """
                    SELECT 
                        product_name,
                        product_sku,
                        total_quantity as stock,
                        sales_date,
                        sales_year,
                        sales_month
                    FROM base_data
                    ORDER BY sales_date DESC, total_quantity ASC
                """
                
                df = pd.read_sql(query, engine)
                
                # Get the most recent data for each product
                df_latest = df.sort_values('sales_date', ascending=False).groupby('product_sku').first().reset_index()
                
                stock_data = df_latest.to_dict('records')
                
                print(f"[Backend] Retrieved {len(stock_data)} stock records from database")
                
                return {
                    "success": True,
                    "data": stock_data,
                    "total": len(stock_data),
                    "timestamp": datetime.now().isoformat()
                }
                
            except SQLAlchemyError as e:
                print(f"[Backend] Database error: {str(e)}")
                print("[Backend] Returning empty stock data - no data uploaded yet")
                return {
                    "success": True,
                    "data": [],
                    "total": 0,
                    "message": "No data uploaded yet. Please upload sales and product files.",
                    "timestamp": datetime.now().isoformat()
                }
        
        return {
            "success": True,
            "data": [],
            "total": 0,
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
    Get inventory notifications based on sales trends from base_data
    """
    try:
        print("[Backend] Fetching notifications")
        
        if engine:
            try:
                # Get latest stock levels and calculate trends
                query = """
                    WITH latest_data AS (
                        SELECT 
                            product_sku,
                            product_name,
                            total_quantity,
                            sales_date,
                            ROW_NUMBER() OVER (PARTITION BY product_sku ORDER BY sales_date DESC) as rn
                        FROM base_data
                    ),
                    current_stock AS (
                        SELECT 
                            product_sku,
                            product_name,
                            total_quantity as current_qty,
                            sales_date as current_date
                        FROM latest_data
                        WHERE rn = 1
                    ),
                    previous_stock AS (
                        SELECT 
                            product_sku,
                            total_quantity as previous_qty,
                            sales_date as previous_date
                        FROM latest_data
                        WHERE rn = 2
                    )
                    SELECT 
                        c.product_name as Product,
                        c.current_qty as Stock,
                        COALESCE(p.previous_qty, c.current_qty) as Last_Stock,
                        CASE 
                            WHEN COALESCE(p.previous_qty, c.current_qty) > 0 
                            THEN ROUND(((COALESCE(p.previous_qty, c.current_qty) - c.current_qty) * 100.0 / COALESCE(p.previous_qty, c.current_qty)), 1)
                            ELSE 0
                        END as "Decrease_Rate(%)",
                        CASE 
                            WHEN c.current_qty = 0 THEN 'Critical'
                            WHEN c.current_qty < 50 THEN 'Warning'
                            ELSE 'Good'
                        END as Status,
                        CASE 
                            WHEN c.current_qty = 0 THEN 'Out of stock! Immediate reorder required.'
                            WHEN c.current_qty < 50 THEN 'Stock level is low. Reorder recommended.'
                            ELSE 'Stock levels are healthy.'
                        END as Description
                    FROM current_stock c
                    LEFT JOIN previous_stock p ON c.product_sku = p.product_sku
                    WHERE c.current_qty < 50 OR c.current_qty = 0
                    ORDER BY 
                        CASE 
                            WHEN c.current_qty = 0 THEN 1
                            WHEN c.current_qty < 50 THEN 2
                            ELSE 3
                        END,
                        c.current_qty ASC
                """
                
                df = pd.read_sql(query, engine)
                notifications = df.to_dict('records')
                
                print(f"[Backend] Retrieved {len(notifications)} notifications from database")
                
                return notifications
                
            except SQLAlchemyError as e:
                print(f"[Backend] Database error: {str(e)}")
                print("[Backend] Returning empty notifications - no data uploaded yet")
                return []
        
        print("[Backend] No database connection - returning empty notifications")
        return []
        
    except Exception as e:
        print(f"[Backend] Error in get_notifications: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch notifications: {str(e)}")

# ============================================================================
# DASHBOARD ANALYTICS ENDPOINT
# ============================================================================

@app.get("/analysis/dashboard")
async def get_dashboard_analytics():
    """
    Get dashboard analytics data from base_data and all_products tables
    """
    try:
        print("[Backend] Fetching dashboard analytics")
        
        if engine:
            try:
                # Get total products
                total_items_query = "SELECT COUNT(DISTINCT product_sku) as total FROM all_products"
                total_items = pd.read_sql(total_items_query, engine).iloc[0]['total']
                
                # Get low stock alerts (products with quantity < 50)
                low_stock_query = """
                    WITH latest_stock AS (
                        SELECT 
                            product_sku,
                            total_quantity,
                            ROW_NUMBER() OVER (PARTITION BY product_sku ORDER BY sales_date DESC) as rn
                        FROM base_data
                    )
                    SELECT COUNT(*) as count 
                    FROM latest_stock 
                    WHERE rn = 1 AND total_quantity < 50
                """
                low_stock = pd.read_sql(low_stock_query, engine).iloc[0]['count']
                
                # Get out of stock items
                out_of_stock_query = """
                    WITH latest_stock AS (
                        SELECT 
                            product_sku,
                            total_quantity,
                            ROW_NUMBER() OVER (PARTITION BY product_sku ORDER BY sales_date DESC) as rn
                        FROM base_data
                    )
                    SELECT COUNT(*) as count 
                    FROM latest_stock 
                    WHERE rn = 1 AND total_quantity = 0
                """
                out_of_stock = pd.read_sql(out_of_stock_query, engine).iloc[0]['count']
                
                # Get total sales quantity this month (PostgreSQL syntax)
                sales_query = """
                    SELECT COALESCE(SUM(total_quantity), 0) as total 
                    FROM base_data 
                    WHERE TO_CHAR(sales_date, 'YYYY-MM') = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
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
                print("[Backend] Returning empty dashboard data")
                
                return {
                    "success": True,
                    "data": {
                        "total_stock_items": 0,
                        "low_stock_alerts": 0,
                        "sales_this_month": 0,
                        "out_of_stock": 0
                    },
                    "message": "No data uploaded yet. Please upload sales and product files.",
                    "timestamp": datetime.now().isoformat()
                }
        
        return {
            "success": True,
            "data": {
                "total_stock_items": 0,
                "low_stock_alerts": 0,
                "sales_this_month": 0,
                "out_of_stock": 0
            },
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        print(f"[Backend] Error in get_dashboard_analytics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch dashboard analytics: {str(e)}")

# ============================================================================
# PREDICTION ENDPOINT
# ============================================================================

@app.get("/predict/existing")
async def get_existing_forecasts():
    """
    Get existing forecast data from forecast_output table without retraining
    """
    try:
        print("[Backend] Fetching existing forecasts from database")
        
        if not engine:
            return {
                "status": "error",
                "forecast_rows": 0,
                "forecast": [],
                "message": "Database not configured"
            }
        
        try:
            # Query existing forecasts from forecast_output table
            query = """
                SELECT 
                    product_sku,
                    forecast_date,
                    predicted_sales,
                    current_sale as current_sales,
                    current_date_col
                FROM forecast_output
                ORDER BY forecast_date ASC, product_sku ASC
            """
            
            df = pd.read_sql(query, engine)
            
            if df.empty:
                print("[Backend] No existing forecasts found")
                return {
                    "status": "success",
                    "forecast_rows": 0,
                    "forecast": [],
                    "message": "No forecasts available. Upload data first or click 'Predict System'."
                }
            
            # Convert to response format
            forecast_data = []
            for _, row in df.iterrows():
                forecast_data.append({
                    "product_sku": row['product_sku'],
                    "forecast_date": row['forecast_date'].strftime("%Y-%m-%d") if pd.notna(row['forecast_date']) else None,
                    "predicted_sales": float(row['predicted_sales']) if pd.notna(row['predicted_sales']) else 0,
                    "current_sales": float(row['current_sales']) if pd.notna(row['current_sales']) else 0,
                    "current_date_col": row['current_date_col'].strftime("%Y-%m-%d") if pd.notna(row['current_date_col']) else None
                })
            
            print(f"[Backend] ✅ Retrieved {len(forecast_data)} existing forecast records")
            
            return {
                "status": "success",
                "forecast_rows": len(forecast_data),
                "forecast": forecast_data,
                "message": "Existing forecasts loaded successfully"
            }
            
        except SQLAlchemyError as e:
            print(f"[Backend] Database error: {str(e)}")
            return {
                "status": "error",
                "forecast_rows": 0,
                "forecast": [],
                "message": "No forecasts available yet. Upload data first."
            }
        
    except Exception as e:
        print(f"[Backend] Error in get_existing_forecasts: {str(e)}")
        return {
            "status": "error",
            "forecast_rows": 0,
            "forecast": [],
            "message": f"Failed to load forecasts: {str(e)}"
        }

@app.post("/predict")
async def predict_sales(n_forecast: int = Query(default=3, ge=1, le=12)):
    """
    Generate sales forecast by retraining the model with data from base_data
    and generating forecasts for the specified number of months
    """
    try:
        print(f"[Backend] Starting prediction with retraining for {n_forecast} months")
        
        if not engine:
            raise HTTPException(status_code=500, detail="Database not configured")
        
        try:
            # Step 1: Pull data from base_data table
            print("[Backend] Step 1: Pulling data from base_data for retraining...")
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
            
            df_for_training = pd.read_sql(query, engine)
            print(f"[Backend] Retrieved {len(df_for_training)} rows from base_data")
            
            if len(df_for_training) < 12:
                return {
                    "status": "error",
                    "forecast_rows": 0,
                    "n_forecast": n_forecast,
                    "forecast": [],
                    "message": "Not enough historical data for prediction (need at least 12 months)"
                }
            
            # Step 2: Retrain the model
            print("[Backend] Step 2: Retraining ML model...")
            df_window_raw, df_window, base_model, X_train, y_train, X_test, y_test, product_sku_last = update_model_and_train(df_for_training)
            print(f"[Backend] ✅ Model retrained successfully")
            
            # Step 3: Generate forecasts for n_forecast months
            print(f"[Backend] Step 3: Generating {n_forecast} month forecasts...")
            long_forecast, long_forecast_rows = forcast_loop(
                X_train, 
                y_train, 
                df_window_raw, 
                product_sku_last, 
                base_model, 
                n_forecast=n_forecast,
                retrain_each_step=True
            )
            
            print(f"[Backend] ✅ Generated {len(long_forecast)} forecast records")
            
            # Step 4: Save forecast to database (replace old data)
            print("[Backend] Step 4: Saving new forecasts to database...")
            long_forecast.to_sql(
                'forecast_output',
                engine,
                if_exists='replace',
                index=False,
                method='multi'
            )
            print(f"[Backend] ✅ Forecasts saved to forecast_output table")
            
            # Step 5: Convert to response format
            forecast_data = []
            for _, row in long_forecast.iterrows():
                forecast_data.append({
                    "product_sku": row['product_sku'],
                    "forecast_date": row['forecast_date'].strftime("%Y-%m-%d") if pd.notna(row['forecast_date']) else None,
                    "predicted_sales": float(row['predicted_sales']) if pd.notna(row['predicted_sales']) else 0,
                    "current_sales": float(row['current_sales']) if pd.notna(row['current_sales']) else 0,
                    "current_date_col": row['current_date_col'].strftime("%Y-%m-%d") if pd.notna(row['current_date_col']) else None
                })
            
            print(f"[Backend] ✅ Prediction completed successfully")
            
            return {
                "status": "success",
                "forecast_rows": len(forecast_data),
                "n_forecast": n_forecast,
                "forecast": forecast_data,
                "message": f"Model retrained and {n_forecast} month forecast generated successfully"
            }
            
        except Exception as ml_error:
            print(f"[Backend] ❌ Prediction error: {str(ml_error)}")
            return {
                "status": "error",
                "forecast_rows": 0,
                "n_forecast": n_forecast,
                "forecast": [],
                "message": f"Prediction failed: {str(ml_error)}"
            }
        
    except Exception as e:
        print(f"[Backend] Error in predict_sales: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.delete("/predict/clear")
async def clear_forecasts():
    """
    Clear all forecast data from forecast_output table
    """
    try:
        print("[Backend] Clearing all forecasts from database")
        
        if not engine:
            raise HTTPException(status_code=500, detail="Database not configured")
        
        try:
            with engine.connect() as conn:
                # Delete all records from forecast_output table
                conn.execute(text("DELETE FROM forecast_output"))
                conn.commit()
                
            print("[Backend] ✅ All forecasts cleared successfully")
            
            return {
                "success": True,
                "message": "All forecast data cleared successfully",
                "timestamp": datetime.now().isoformat()
            }
            
        except SQLAlchemyError as e:
            print(f"[Backend] Database error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to clear forecasts: {str(e)}")
        
    except Exception as e:
        print(f"[Backend] Error in clear_forecasts: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to clear forecasts: {str(e)}")

# ============================================================================
# ANALYSIS ENDPOINTS
# ============================================================================

# ============================================================================
# HISTORICAL SALES ENDPOINT
# ============================================================================

@app.get("/analysis/historical")
async def get_historical_sales(sku: str = Query(...)):
    """
    Get historical sales data for a product directly from base_data
    No complex processing - just raw data grouped by date and size
    """
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
        
        try:
            # Extract base SKU (first 3 parts)
            sku_parts = sku.split('-')
            base_sku = '-'.join(sku_parts[:3]) if len(sku_parts) >= 3 else sku
            
            print(f"[Backend] Searching for base SKU: {base_sku}")
            
            # Query all SKUs that start with the base SKU
            query = f"""
                SELECT 
                    product_sku,
                    product_name,
                    sales_date,
                    sales_year,
                    sales_month,
                    total_quantity
                FROM base_data
                WHERE product_sku LIKE '{base_sku}%'
                ORDER BY sales_date ASC, product_sku ASC
            """
            
            df = pd.read_sql(query, engine)
            print(f"[Backend] Retrieved {len(df)} rows from base_data")
            
            if df.empty:
                return {
                    "success": False,
                    "message": f"No data found for SKU: {sku}",
                    "chart_data": [],
                    "table_data": [],
                    "sizes": []
                }
            
            # Extract size from SKU (everything after base SKU)
            df['size'] = df['product_sku'].apply(lambda x: '-'.join(x.split('-')[3:]) if len(x.split('-')) > 3 else 'Standard')
            
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
                month_data = {
                    "month": str(date_idx)
                }
                for size in sizes:
                    month_data[size] = int(row[size])
                chart_data.append(month_data)
            
            # Convert to table format
            table_data = []
            for date_idx, row in pivot.iterrows():
                row_data = {
                    "date": str(date_idx)
                }
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
            print(f"[Backend] Error querying historical sales: {str(e)}")
            import traceback
            traceback.print_exc()
            return {
                "success": False,
                "message": f"Error: {str(e)}",
                "chart_data": [],
                "table_data": [],
                "sizes": []
            }
        
    except Exception as e:
        print(f"[Backend] Error in get_historical_sales: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch historical sales: {str(e)}")

# ============================================================================
# PERFORMANCE COMPARISON ENDPOINT
# ============================================================================

@app.post("/analysis/performance")
async def get_performance_comparison(sku_list: List[str]):
    """
    Compare performance of up to 3 products using data_analyzer.performance_table
    """
    try:
        print(f"[Backend] Comparing performance for: {sku_list}")
        
        if not engine:
            return {
                "success": False,
                "message": "Database not configured",
                "table_data": [],
                "chart_data": {}
            }
        
        try:
            # Query base_data table
            query = """
                SELECT 
                    product_sku as Product_SKU,
                    product_name as Product_name,
                    sales_date as Date,
                    sales_year as Year,
                    sales_month as Month,
                    total_quantity as Total_quantity
                FROM base_data
                ORDER BY sales_date ASC
            """
            
            df = pd.read_sql(query, engine)
            
            if df.empty:
                return {
                    "success": False,
                    "message": "No data available. Please upload sales data first.",
                    "table_data": [],
                    "chart_data": {}
                }
            
            # Use data_analyzer.performance_table
            perf_df = performance_table(df, sku_list[:3])  # Limit to 3 SKUs
            
            if perf_df.empty:
                return {
                    "success": False,
                    "message": f"No data found for SKUs: {sku_list}",
                    "table_data": [],
                    "chart_data": {}
                }
            
            # Convert to table format
            table_data = perf_df.to_dict('records')
            
            # Generate chart data (monthly trends for each SKU)
            chart_data = {}
            for sku in sku_list[:3]:
                sku_data = df[df['Product_SKU'].str.contains(sku, case=False, na=False)]
                if not sku_data.empty:
                    monthly = sku_data.groupby(['Year', 'Month'])['Total_quantity'].sum().reset_index()
                    chart_data[sku] = [
                        {"month": int(row['Month']), "value": int(row['Total_quantity'])}
                        for _, row in monthly.iterrows()
                    ]
            
            print(f"[Backend] ✅ Retrieved performance comparison for {len(table_data)} products")
            
            return {
                "success": True,
                "message": "Performance comparison data retrieved successfully",
                "table_data": table_data,
                "chart_data": chart_data
            }
            
        except Exception as e:
            print(f"[Backend] Error querying performance comparison: {str(e)}")
            return {
                "success": False,
                "message": f"Error: {str(e)}",
                "table_data": [],
                "chart_data": {}
            }
        
    except Exception as e:
        print(f"[Backend] Error in get_performance_comparison: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch performance data: {str(e)}")

# ============================================================================
# BEST SELLERS ENDPOINT
# ============================================================================

@app.get("/analysis/best_sellers")
async def get_best_sellers(
    year: int = Query(...),
    month: int = Query(...),
    top_n: int = Query(default=10, ge=1, le=50)
):
    """
    Get best selling products for a specific month using data_analyzer.best_sellers_by_month
    """
    try:
        print(f"[Backend] Fetching best sellers for {year}-{month:02d}, top {top_n}")
        
        if not engine:
            return {
                "success": False,
                "message": "Database not configured",
                "data": []
            }
        
        try:
            # Query base_data table
            query = """
                SELECT 
                    product_sku as Product_SKU,
                    product_name as Product_name,
                    sales_date as Date,
                    sales_year as Year,
                    sales_month as Month,
                    total_quantity as Total_quantity
                FROM base_data
                ORDER BY sales_date ASC
            """
            
            df = pd.read_sql(query, engine)
            
            if df.empty:
                return {
                    "success": False,
                    "message": "No data available. Please upload sales data first.",
                    "data": []
                }
            
            # Use data_analyzer.best_sellers_by_month
            best_df = best_sellers_by_month(df, year, month, top_n)
            
            if best_df.empty:
                return {
                    "success": False,
                    "message": f"No data found for {year}-{month:02d}",
                    "data": []
                }
            
            # Convert to response format with rank
            best_sellers_data = []
            for idx, row in best_df.iterrows():
                best_sellers_data.append({
                    "rank": idx + 1,
                    "base_sku": row['Base_SKU'],
                    "name": row['Product_name'],
                    "size": row['Best_Size'] if pd.notna(row['Best_Size']) else "N/A",
                    "quantity": int(row['Quantity'])
                })
            
            print(f"[Backend] ✅ Retrieved {len(best_sellers_data)} best sellers")
            
            return {
                "success": True,
                "message": "Best sellers data retrieved successfully",
                "data": best_sellers_data
            }
            
        except Exception as e:
            print(f"[Backend] Error querying best sellers: {str(e)}")
            return {
                "success": False,
                "message": f"Error: {str(e)}",
                "data": []
            }
        
    except Exception as e:
        print(f"[Backend] Error in get_best_sellers: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch best sellers: {str(e)}")

# ============================================================================
# TOTAL INCOME ENDPOINT
# ============================================================================

@app.get("/analysis/total_income")
async def get_total_income():
    """
    Get total income analysis for all products using data_analyzer.total_income_table
    """
    try:
        print(f"[Backend] Fetching total income analysis")
        
        if not engine:
            return {
                "success": False,
                "message": "Database not configured",
                "table_data": [],
                "chart_data": [],
                "grand_total": 0
            }
        
        try:
            # Query base_data table with revenue column
            query = """
                SELECT 
                    product_sku as Product_SKU,
                    product_name as Product_name,
                    sales_date as Date,
                    sales_year as Year,
                    sales_month as Month,
                    total_quantity as Total_quantity,
                    CAST(total_quantity * 100 as FLOAT) as "Total_Amount(baht)"
                FROM base_data
                ORDER BY sales_date ASC
            """
            
            df = pd.read_sql(query, engine)
            
            if df.empty:
                return {
                    "success": False,
                    "message": "No data available. Please upload sales data first.",
                    "table_data": [],
                    "chart_data": [],
                    "grand_total": 0
                }
            
            # Add YearMonth column for grouping
            df['YearMonth'] = pd.to_datetime(
                df['Year'].astype(int).astype(str) + "-" + df['Month'].astype(int).astype(str) + "-01",
                errors="coerce"
            )
            
            # Use data_analyzer.total_income_table
            income_df, grand_total = total_income_table(df)
            
            # Convert table to response format
            table_data = income_df.to_dict('records')
            
            # Generate chart data (monthly income growth)
            monthly_income = df.groupby('YearMonth')['Total_Amount(baht)'].sum().reset_index()
            monthly_income = monthly_income.sort_values('YearMonth')
            
            chart_data = []
            for idx, row in monthly_income.iterrows():
                chart_data.append({
                    "month": idx + 1,
                    "income": float(row['Total_Amount(baht)'])
                })
            
            print(f"[Backend] ✅ Retrieved total income: ฿{grand_total:,.2f}")
            
            return {
                "success": True,
                "message": "Total income data retrieved successfully",
                "table_data": table_data,
                "chart_data": chart_data,
                "grand_total": float(grand_total)
            }
            
        except Exception as e:
            print(f"[Backend] Error querying total income: {str(e)}")
            return {
                "success": False,
                "message": f"Error: {str(e)}",
                "table_data": [],
                "chart_data": [],
                "grand_total": 0
            }
        
    except Exception as e:
        print(f"[Backend] Error in get_total_income: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch total income: {str(e)}")

# ============================================================================
# ANALYSIS ENDPOINTS
# ============================================================================

@app.get("/analysis/base_skus")
async def get_base_skus(search: str = Query(default="")):
    """
    Get unique base SKUs (without size suffix) for autocomplete
    Filters by search term if provided
    """
    try:
        print(f"[Backend] Fetching base SKUs with search: '{search}'")
        
        if not engine:
            return {
                "success": False,
                "message": "Database not configured",
                "base_skus": []
            }
        
        try:
            # Query unique product SKUs from base_data
            query = """
                SELECT DISTINCT product_sku
                FROM base_data
                ORDER BY product_sku ASC
            """
            
            df = pd.read_sql(query, engine)
            
            if df.empty:
                return {
                    "success": False,
                    "message": "No data available",
                    "base_skus": []
                }
            
            base_skus = set()
            for sku in df['product_sku']:
                # Split by hyphen and take first 3 parts
                # Example: "SC-THU-0004-SS-WH-FF" → "SC-THU-0004"
                parts = str(sku).split('-')
                if len(parts) >= 3:
                    base_sku = '-'.join(parts[:3])
                    base_skus.add(base_sku)
                elif len(parts) > 0:
                    # If less than 3 parts, use what we have
                    base_sku = '-'.join(parts)
                    base_skus.add(base_sku)
            
            # Convert to sorted list
            base_skus_list = sorted(list(base_skus))
            
            if search and search.strip():
                search_upper = search.strip().upper()
                # Extract base from search term too (in case user types full SKU)
                search_parts = search_upper.split('-')
                if len(search_parts) >= 3:
                    search_base = '-'.join(search_parts[:3])
                else:
                    search_base = search_upper
                
                base_skus_list = [
                    sku for sku in base_skus_list 
                    if sku.upper().startswith(search_base) or search_base in sku.upper()
                ]
            
            print(f"[Backend] ✅ Found {len(base_skus_list)} base SKUs")
            
            return {
                "success": True,
                "base_skus": base_skus_list[:50],  # Limit to 50 results
                "total": len(base_skus_list)
            }
            
        except Exception as e:
            print(f"[Backend] Error querying base SKUs: {str(e)}")
            return {
                "success": False,
                "message": f"Error: {str(e)}",
                "base_skus": []
            }
        
    except Exception as e:
        print(f"[Backend] Error in get_base_skus: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch base SKUs: {str(e)}")


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
