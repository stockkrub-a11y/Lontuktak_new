"""
Setup script to create and populate the stock_data table
Run this script to initialize the stock tracking system
"""

from DB_server import engine
import pandas as pd
from datetime import datetime, timedelta

def setup_stock_data_table():
    """Create the stock_data table and populate with initial data"""
    
    print("Setting up stock_data table...")
    
    # Read and execute the SQL file
    with open('scripts/create_stock_data_table.sql', 'r') as f:
        sql_script = f.read()
    
    try:
        # Execute the SQL script
        with engine.connect() as conn:
            # Split by semicolon and execute each statement
            statements = [s.strip() for s in sql_script.split(';') if s.strip()]
            for statement in statements:
                conn.execute(statement)
                conn.commit()
        
        print("✅ stock_data table created successfully!")
        
        # Verify the data
        df = pd.read_sql("SELECT COUNT(*) as count FROM stock_data", engine)
        print(f"✅ Inserted {df['count'].iloc[0]} stock records")
        
        # Show sample data
        sample = pd.read_sql("""
            SELECT week_date, product_name, stock_level, min_stock 
            FROM stock_data 
            ORDER BY week_date DESC, product_name 
            LIMIT 10
        """, engine)
        print("\nSample stock data:")
        print(sample.to_string(index=False))
        
    except Exception as e:
        print(f"❌ Error setting up stock_data table: {str(e)}")
        raise

if __name__ == "__main__":
    setup_stock_data_table()
