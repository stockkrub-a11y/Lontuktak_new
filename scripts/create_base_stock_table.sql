-- Create base_stock table to store previous stock data
CREATE TABLE IF NOT EXISTS base_stock (
    id SERIAL PRIMARY KEY,
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(255),
    stock_level INTEGER NOT NULL,
    "หมวดหมู่" VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_base_stock_product_name 
ON base_stock(product_name);

CREATE INDEX IF NOT EXISTS idx_base_stock_category 
ON base_stock("หมวดหมู่");
