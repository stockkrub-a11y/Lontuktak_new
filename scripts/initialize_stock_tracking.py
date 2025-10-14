"""
Initialize Stock Tracking System
Creates the stock_data table and populates it with sample data for testing.
Run this script once to set up the notification system.
"""

import psycopg2
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

load_dotenv()

# Database connection
DATABASE_URL = os.getenv("DATABASE_URL")

def initialize_stock_tracking():
    """Create stock_data table and populate with sample data"""
    
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    try:
        print("🔧 Creating stock_data table...")
        
        # Create the table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS stock_data (
                id SERIAL PRIMARY KEY,
                week_date TIMESTAMP NOT NULL,
                product_name VARCHAR(255) NOT NULL,
                product_sku VARCHAR(100),
                stock_level INTEGER NOT NULL,
                min_stock INTEGER DEFAULT 10,
                buffer INTEGER DEFAULT 5,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(week_date, product_name)
            );
        """)
        
        print("✅ Table created successfully")
        
        # Create indexes for better query performance
        print("🔧 Creating indexes...")
        cur.execute("""
            CREATE INDEX IF NOT EXISTS idx_stock_data_week_date 
            ON stock_data(week_date DESC);
        """)
        cur.execute("""
            CREATE INDEX IF NOT EXISTS idx_stock_data_product 
            ON stock_data(product_name);
        """)
        
        print("✅ Indexes created successfully")
        
        # Check if we already have data
        cur.execute("SELECT COUNT(*) FROM stock_data")
        count = cur.fetchone()[0]
        
        if count > 0:
            print(f"ℹ️  Table already has {count} records. Skipping sample data insertion.")
            conn.commit()
            return
        
        # Populate with sample data
        print("🔧 Populating sample stock data...")
        
        # Sample products with realistic stock levels
        products = [
            ("Product A", "SKU-001", 150, 20, 10),
            ("Product B", "SKU-002", 80, 15, 8),
            ("Product C", "SKU-003", 45, 30, 15),
            ("Product D", "SKU-004", 200, 25, 12),
            ("Product E", "SKU-005", 30, 20, 10),
        ]
        
        # Create 3 time points: 14 days ago, 7 days ago, and today
        dates = [
            datetime.now() - timedelta(days=14),
            datetime.now() - timedelta(days=7),
            datetime.now()
        ]
        
        # Insert data with decreasing stock levels over time
        for date_idx, week_date in enumerate(dates):
            for product_name, sku, base_stock, min_stock, buffer in products:
                # Simulate stock decrease over time
                # Some products decrease faster than others
                if product_name in ["Product C", "Product E"]:
                    # Fast-moving products
                    stock_level = base_stock - (date_idx * 25)
                else:
                    # Slower-moving products
                    stock_level = base_stock - (date_idx * 10)
                
                # Ensure stock doesn't go negative
                stock_level = max(0, stock_level)
                
                cur.execute("""
                    INSERT INTO stock_data 
                    (week_date, product_name, product_sku, stock_level, min_stock, buffer)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    ON CONFLICT (week_date, product_name) DO NOTHING
                """, (week_date, product_name, sku, stock_level, min_stock, buffer))
        
        conn.commit()
        
        # Verify the data
        cur.execute("SELECT COUNT(*) FROM stock_data")
        total_records = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(DISTINCT product_name) FROM stock_data")
        total_products = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(DISTINCT week_date) FROM stock_data")
        total_dates = cur.fetchone()[0]
        
        print(f"✅ Sample data inserted successfully!")
        print(f"   - Total records: {total_records}")
        print(f"   - Unique products: {total_products}")
        print(f"   - Time points: {total_dates}")
        print("\n🎉 Stock tracking system initialized!")
        print("   You can now view notifications in the dashboard.")
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Error: {e}")
        raise
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    initialize_stock_tracking()
