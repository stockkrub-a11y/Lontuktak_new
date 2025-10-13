"""
Database Configuration Helper
Instructions for setting up your database connection
"""

# ============================================================================
# DATABASE SETUP INSTRUCTIONS
# ============================================================================

"""
1. CHOOSE YOUR DATABASE TYPE:

   Option A - SQLite (Easiest, no setup required):
   DATABASE_URL = "sqlite:///./lontuktak.db"
   
   Option B - PostgreSQL:
   DATABASE_URL = "postgresql://username:password@localhost:5432/lontuktak"
   Install: pip install psycopg2-binary
   
   Option C - MySQL:
   DATABASE_URL = "mysql+pymysql://username:password@localhost:3306/lontuktak"
   Install: pip install pymysql

2. SET ENVIRONMENT VARIABLE:

   Windows:
   set DATABASE_URL=your_connection_string
   
   Mac/Linux:
   export DATABASE_URL=your_connection_string
   
   Or create a .env file:
   DATABASE_URL=your_connection_string

3. EXPECTED DATABASE SCHEMA:

   Table: product_data
   Columns:
   - product_name (TEXT)
   - product_sku (TEXT, PRIMARY KEY)
   - stock (INTEGER)
   - last_stock (INTEGER)
   - min_stock (INTEGER)
   - buffer_stock (INTEGER)
   - category (TEXT)
   
   Table: sales_data
   Columns:
   - id (INTEGER, PRIMARY KEY)
   - product_sku (TEXT)
   - size (TEXT)
   - quantity (INTEGER)
   - total_amount (DECIMAL)
   - sale_date (DATE)

4. CREATE TABLES (if they don't exist):

   Run the SQL script below in your database:
"""

CREATE_TABLES_SQL = """
-- Product Data Table
CREATE TABLE IF NOT EXISTS product_data (
    product_sku TEXT PRIMARY KEY,
    product_name TEXT NOT NULL,
    stock INTEGER DEFAULT 0,
    last_stock INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 10,
    buffer_stock INTEGER DEFAULT 5,
    category TEXT
);

-- Sales Data Table
CREATE TABLE IF NOT EXISTS sales_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_sku TEXT NOT NULL,
    size TEXT,
    quantity INTEGER NOT NULL,
    total_amount DECIMAL(10, 2),
    sale_date DATE NOT NULL,
    FOREIGN KEY (product_sku) REFERENCES product_data(product_sku)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales_data(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_sku ON sales_data(product_sku);
CREATE INDEX IF NOT EXISTS idx_product_stock ON product_data(stock);
"""

# ============================================================================
# SAMPLE DATA (Optional - for testing)
# ============================================================================

SAMPLE_DATA_SQL = """
-- Insert sample products
INSERT OR IGNORE INTO product_data VALUES
('SB-M-001', 'Shinchan Boxers', 45, 42, 20, 10, 'Boxers'),
('DS-L-002', 'Deep Sleep Pants', 12, 25, 15, 5, 'Pants'),
('LP-XL-003', 'Long Pants Classic', 0, 8, 10, 5, 'Pants'),
('SS-M-004', 'Summer Shorts', 67, 65, 25, 10, 'Shorts'),
('WB-L-005', 'Winter Boxers', 8, 15, 12, 3, 'Boxers');

-- Insert sample sales
INSERT INTO sales_data (product_sku, size, quantity, total_amount, sale_date) VALUES
('SB-M-001', 'M', 15, 3000, '2025-01-15'),
('DS-L-002', 'L', 8, 1600, '2025-01-16'),
('SS-M-004', 'M', 12, 2400, '2025-01-17');
"""

if __name__ == "__main__":
    print("Database Configuration Helper")
    print("=" * 80)
    print("\nFollow the instructions in this file to set up your database.")
    print("\nTo create tables, run:")
    print("  python -c \"from database_config import CREATE_TABLES_SQL; print(CREATE_TABLES_SQL)\"")
    print("\nThen execute the SQL in your database client.")
