# Complete Backend Setup Guide

## Current Issues

Your backend is returning 404 errors because:
1. Missing import: `from Notification import generate_stock_report`
2. `/stock/levels` and `/analysis/dashboard` endpoints have incomplete implementations

## Step-by-Step Fix

### Step 1: Update Backend.py Imports

Open your `Backend.py` file and update the imports section:

\`\`\`python
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
from Notification import generate_stock_report  # <-- ADD THIS LINE
\`\`\`

### Step 2: Replace /stock/levels Endpoint

Find the `/stock/levels` endpoint in your Backend.py and replace it with:

\`\`\`python
@app.get("/stock/levels")
async def get_stock_levels_endpoint():
    try:
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
\`\`\`

### Step 3: Replace /analysis/dashboard Endpoint

Find the `/analysis/dashboard` endpoint and replace it with:

\`\`\`python
@app.get("/analysis/dashboard")
async def get_dashboard_analytics():
    try:
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
            AND stock < minstock AND stock > 0
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
\`\`\`

### Step 4: Restart Backend Server

After making these changes, restart your backend:

\`\`\`bash
# Stop the current server (Ctrl+C)
# Then restart:
uvicorn Backend:app --reload --host 0.0.0.0 --port 8000
\`\`\`

### Step 5: Verify All Endpoints Work

Test each endpoint:

1. **Dashboard**: http://localhost:8000/analysis/dashboard
2. **Stock Levels**: http://localhost:8000/stock/levels
3. **Notifications**: http://localhost:8000/api/notifications
4. **Train**: POST to http://localhost:8000/train (with files)

## Expected Results

After these fixes:
- ✅ Backend status shows "Connected" (green)
- ✅ Dashboard displays real metrics
- ✅ Stock page shows product list
- ✅ File uploads work successfully
- ✅ Notifications display properly
- ✅ No more 404 errors

## Troubleshooting

**If you still get 404 errors:**
- Make sure you saved Backend.py
- Restart the server completely
- Check the terminal for any Python errors

**If you get database errors:**
- Make sure your PostgreSQL is running
- Verify the `stock_data` and `base_data` tables exist
- Run `Auto_cleaning.py` to populate the database

**If imports fail:**
- Make sure all Python files are in the same directory
- Check that `Notification.py` has the `generate_stock_report` function
