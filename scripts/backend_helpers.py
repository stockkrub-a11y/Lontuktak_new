"""
Backend Helper Functions
Add these functions to your Backend.py or create separate modules
"""

# ============================================
# 1. Add to DB_server.py
# ============================================

def get_stock_levels():
    """
    Get current stock levels from the database
    Returns a list of products with their stock information
    """
    import pandas as pd
    from DB_server import engine
    
    try:
        # Try to get stock data from stock_data table
        query = """
            SELECT DISTINCT ON (product_name)
                product_name,
                product_sku,
                stock,
                category,
                CASE 
                    WHEN stock = 0 THEN 'Out of Stock'
                    WHEN stock < minstock THEN 'Low Stock'
                    ELSE 'In Stock'
                END as status
            FROM stock_data
            ORDER BY product_name, week_date DESC
        """
        df = pd.read_sql(query, engine)
        return df.to_dict('records')
    except Exception as e:
        print(f"Error getting stock levels: {e}")
        # Fallback: try to get from base_data
        try:
            query = """
                SELECT 
                    product_name,
                    product_sku,
                    SUM(total_quantity) as stock,
                    category,
                    'In Stock' as status
                FROM base_data
                GROUP BY product_name, product_sku, category
                ORDER BY product_name
            """
            df = pd.read_sql(query, engine)
            return df.to_dict('records')
        except Exception as e2:
            print(f"Fallback also failed: {e2}")
            return []


# ============================================
# 2. Add to data_analyzer.py
# ============================================

def get_dashboard_data():
    """
    Get dashboard analytics data
    Returns metrics for the dashboard overview
    """
    import pandas as pd
    from DB_server import engine
    from datetime import datetime, timedelta
    
    try:
        # Get current month
        current_date = datetime.now()
        current_month = current_date.month
        current_year = current_date.year
        
        # Total stock items
        stock_query = """
            SELECT COUNT(DISTINCT product_sku) as total_items
            FROM stock_data
            WHERE week_date = (SELECT MAX(week_date) FROM stock_data)
        """
        total_items = pd.read_sql(stock_query, engine).iloc[0]['total_items']
        
        # Low stock alerts
        low_stock_query = """
            SELECT COUNT(*) as low_stock_count
            FROM stock_data
            WHERE week_date = (SELECT MAX(week_date) FROM stock_data)
            AND stock < minstock
            AND stock > 0
        """
        low_stock = pd.read_sql(low_stock_query, engine).iloc[0]['low_stock_count']
        
        # Out of stock
        out_of_stock_query = """
            SELECT COUNT(*) as out_of_stock_count
            FROM stock_data
            WHERE week_date = (SELECT MAX(week_date) FROM stock_data)
            AND stock = 0
        """
        out_of_stock = pd.read_sql(out_of_stock_query, engine).iloc[0]['out_of_stock_count']
        
        # Sales this month
        sales_query = f"""
            SELECT COALESCE(SUM(total_amount_baht), 0) as monthly_sales
            FROM base_data
            WHERE EXTRACT(MONTH FROM sales_date) = {current_month}
            AND EXTRACT(YEAR FROM sales_date) = {current_year}
        """
        monthly_sales = pd.read_sql(sales_query, engine).iloc[0]['monthly_sales']
        
        return {
            "total_stock_items": int(total_items),
            "low_stock_alerts": int(low_stock),
            "sales_this_month": float(monthly_sales),
            "out_of_stock": int(out_of_stock)
        }
        
    except Exception as e:
        print(f"Error getting dashboard data: {e}")
        # Return default values if database query fails
        return {
            "total_stock_items": 0,
            "low_stock_alerts": 0,
            "sales_this_month": 0,
            "out_of_stock": 0
        }


# ============================================
# 3. Complete Backend.py Implementation
# ============================================

"""
Update your Backend.py with these changes:

1. Add imports at the top:
"""

from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import os
import pandas as pd
import joblib
import uvicorn

from Auto_cleaning import auto_cleaning
from DB_server import engine
from Predict import update_model_and_train, forcast_loop, Evaluate
from Notification import generate_stock_report  # <-- ADD THIS
# from analysis.data_analyzer import size_mix_pivot, performance_table, best_sellers_by_month

"""
2. Replace the /stock/levels endpoint:
"""

@app.get("/stock/levels")
async def get_stock_levels_endpoint():
    try:
        # Get stock data from database
        query = """
            SELECT DISTINCT ON (product_name)
                product_name,
                product_sku,
                stock,
                category,
                CASE 
                    WHEN stock = 0 THEN 'Out of Stock'
                    WHEN stock < minstock THEN 'Low Stock'
                    ELSE 'In Stock'
                END as status
            FROM stock_data
            ORDER BY product_name, week_date DESC
        """
        df = pd.read_sql(query, engine)
        return {"success": True, "data": df.to_dict('records')}
    except Exception as e:
        print(f"Error in /stock/levels: {e}")
        # Fallback to base_data if stock_data doesn't exist
        try:
            query = """
                SELECT 
                    product_name,
                    product_sku,
                    SUM(total_quantity) as stock,
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

"""
3. Replace the /analysis/dashboard endpoint:
"""

@app.get("/analysis/dashboard")
async def get_dashboard_analytics():
    try:
        from datetime import datetime
        
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
            AND stock < minstock
            AND stock > 0
        """
        low_stock_result = pd.read_sql(low_stock_query, engine)
        low_stock = int(low_stock_result.iloc[0]['low_stock_count']) if not low_stock_result.empty else 0
        
        # Out of stock
        out_of_stock_query = """
            SELECT COUNT(*) as out_of_stock_count
            FROM stock_data
            WHERE week_date = (SELECT MAX(week_date) FROM stock_data)
            AND stock = 0
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
        print(f"Error in /analysis/dashboard: {e}")
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
