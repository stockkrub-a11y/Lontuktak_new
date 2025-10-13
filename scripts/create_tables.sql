-- ============================================================================
-- Lon TukTak Database Schema
-- PostgreSQL table creation script for DBeaver
-- ============================================================================

-- Create base_data table for aggregated sales data
CREATE TABLE IF NOT EXISTS base_data (
    product_sku VARCHAR(50) NOT NULL,
    product_name VARCHAR(200),
    sales_date DATE NOT NULL,
    sales_year INTEGER,
    sales_month INTEGER,
    total_quantity NUMERIC(12),
    CONSTRAINT pk_base_data PRIMARY KEY (product_sku, sales_date)
);

-- Create indexes for faster queries on base_data
CREATE INDEX IF NOT EXISTS idx_base_data_date ON base_data(sales_date);
CREATE INDEX IF NOT EXISTS idx_base_data_sku ON base_data(product_sku);
CREATE INDEX IF NOT EXISTS idx_base_data_year_month ON base_data(sales_year, sales_month);

-- Create all_products table for product information
CREATE TABLE IF NOT EXISTS all_products (
    product_sku VARCHAR(50) NOT NULL,
    product_name VARCHAR(200),
    category VARCHAR(100),
    quantity NUMERIC(12),
    CONSTRAINT pk_products PRIMARY KEY (product_sku)
);

-- Added forecast_output table for storing ML predictions
-- Create forecast_output table for sales forecasts
CREATE TABLE IF NOT EXISTS forecast_output (
    product_sku VARCHAR(50) NOT NULL,
    forecast_date DATE NOT NULL,
    predicted_sales NUMERIC(12,2),
    current_sale NUMERIC(12,2),
    current_date_col DATE,
    CONSTRAINT pk_forecast_output PRIMARY KEY (product_sku, forecast_date)
);

-- Create indexes for faster queries on forecast_output
CREATE INDEX IF NOT EXISTS idx_forecast_date ON forecast_output(forecast_date);
CREATE INDEX IF NOT EXISTS idx_forecast_sku ON forecast_output(product_sku);

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Check if tables exist
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
    AND table_name IN ('base_data', 'all_products', 'forecast_output')
ORDER BY table_name;

-- Display success message
SELECT 'All tables created successfully!' AS status;
