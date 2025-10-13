"""
Database setup script - Creates required tables for Lon TukTak system
Run this ONCE before using the backend for the first time
"""

from DB_server import engine
from sqlalchemy import text

def create_tables():
    """Create base_data and all_products tables if they don't exist"""
    
    print("🔧 Setting up database tables...")
    
    create_base_data = """
    CREATE TABLE IF NOT EXISTS base_data (
        product_sku VARCHAR(255) NOT NULL,
        product_name VARCHAR(500),
        sales_date DATE NOT NULL,
        sales_year INTEGER NOT NULL,
        sales_month INTEGER NOT NULL,
        total_quantity INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (product_sku, sales_date)
    );
    """
    
    create_base_data_indexes = """
    CREATE INDEX IF NOT EXISTS idx_base_data_date ON base_data(sales_date);
    CREATE INDEX IF NOT EXISTS idx_base_data_sku ON base_data(product_sku);
    """
    
    create_all_products = """
    CREATE TABLE IF NOT EXISTS all_products (
        "Product_SKU" VARCHAR(255) PRIMARY KEY,
        product_name VARCHAR(500)
    );
    """
    
    try:
        with engine.begin() as conn:
            # Create base_data table
            conn.execute(text(create_base_data))
            print("✅ base_data table created")
            
            # Create indexes
            conn.execute(text(create_base_data_indexes))
            print("✅ base_data indexes created")
            
            # Create all_products table
            conn.execute(text(create_all_products))
            print("✅ all_products table created")
            
        print("\n🎉 Database setup complete! You can now upload your files.")
        
    except Exception as e:
        print(f"❌ Database setup failed: {str(e)}")
        raise

if __name__ == "__main__":
    create_tables()
