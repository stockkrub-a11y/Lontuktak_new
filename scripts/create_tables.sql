-- Create base_data table for aggregated sales data
CREATE TABLE IF NOT EXISTS base_data (
    product_sku VARCHAR(255) NOT NULL,
    product_name VARCHAR(500),
    sales_date DATE NOT NULL,
    sales_year INTEGER NOT NULL,
    sales_month INTEGER NOT NULL,
    total_quantity INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (product_sku, sales_date)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_base_data_date ON base_data(sales_date);
CREATE INDEX IF NOT EXISTS idx_base_data_sku ON base_data(product_sku);

-- Create all_products table for product information
CREATE TABLE IF NOT EXISTS all_products (
    "Product_SKU" VARCHAR(255) PRIMARY KEY,
    product_name VARCHAR(500)
);

-- Display table info
SELECT 'base_data table created successfully' AS status;
SELECT 'all_products table created successfully' AS status;
