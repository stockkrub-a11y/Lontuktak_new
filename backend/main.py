# Import the FastAPI app from scripts/Backend.py
import sys
import os

# Add scripts directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'scripts'))

# Last updated: 2025-10-17 03:30:00

# Import the app from Backend.py
from Backend import app, engine

import pandas as pd
from datetime import datetime

print("=" * 80)
print("BACKEND MAIN.PY LOADED - Timestamp: 2025-10-17 03:30:00")
print("=" * 80)

@app.get("/api/db-test")
async def db_test():
    """Test database connection and check stock_notifications table"""
    print("DB-TEST ENDPOINT CALLED", flush=True)
    try:
        if not engine:
            return {"error": "Database engine not available"}
        
        # Test basic connection
        test_query = "SELECT 1 as test"
        test_df = pd.read_sql(test_query, engine)
        print("Database connection test passed", flush=True)
        
        # Check if table exists
        table_check = """
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'stock_notifications'
        )
        """
        table_exists = pd.read_sql(table_check, engine).iloc[0, 0]
        print(f"Table exists check: {table_exists}", flush=True)
        
        if not table_exists:
            return {
                "database_connected": True,
                "table_exists": False,
                "error": "Table 'stock_notifications' does not exist"
            }
        
        # Count rows
        count_query = "SELECT COUNT(*) as count FROM stock_notifications"
        count_df = pd.read_sql(count_query, engine)
        row_count = int(count_df.iloc[0, 0])
        print(f"Row count: {row_count}", flush=True)
        
        # Get column names
        columns_query = """
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'stock_notifications'
        ORDER BY ordinal_position
        """
        columns_df = pd.read_sql(columns_query, engine)
        columns = columns_df['column_name'].tolist()
        print(f"Columns: {columns}", flush=True)
        
        # Get sample data
        sample_query = "SELECT * FROM stock_notifications LIMIT 3"
        sample_df = pd.read_sql(sample_query, engine)
        sample_data = sample_df.to_dict('records')
        
        # Convert datetime objects to strings
        for row in sample_data:
            for key, value in row.items():
                if isinstance(value, (pd.Timestamp, datetime)):
                    row[key] = str(value)
        
        print(f"Returning diagnostic data with {row_count} total rows", flush=True)
        
        return {
            "database_connected": True,
            "table_exists": True,
            "row_count": row_count,
            "columns": columns,
            "sample_data": sample_data
        }
        
    except Exception as e:
        print(f"ERROR in db_test: {str(e)}", flush=True)
        import traceback
        traceback.print_exc()
        return {
            "error": str(e),
            "error_type": type(e).__name__
        }

# Export the app so uvicorn can find it
__all__ = ['app']
