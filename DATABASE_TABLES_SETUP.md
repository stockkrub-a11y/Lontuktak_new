# Database Tables Setup Guide

## Problem
The error `relation "base_data" does not exist` means the required database tables haven't been created yet.

## Solution - Choose ONE method:

### Method 1: Run Python Script (Recommended)
\`\`\`bash
cd scripts
python setup_database.py
\`\`\`

### Method 2: Run SQL in DBeaver
1. Open DBeaver and connect to your PostgreSQL database
2. Open the file `scripts/create_tables.sql`
3. Select all the SQL code
4. Click "Execute SQL Statement" (or press Ctrl+Enter)
5. Verify tables were created by refreshing the database tree

## Verify Tables Created
After running either method, check in DBeaver:
- You should see `base_data` table with 6 columns
- You should see `all_products` table with 2 columns

## Next Steps
1. Restart your Backend.py server
2. Upload your Product List and Sales files
3. The system will now work correctly!

## Table Schemas

### base_data
- `product_sku` (VARCHAR) - Product SKU code
- `product_name` (VARCHAR) - Product name
- `sales_date` (DATE) - Sales month (first day of month)
- `sales_year` (INTEGER) - Year of sale
- `sales_month` (INTEGER) - Month number (1-12)
- `total_quantity` (INTEGER) - Total quantity sold in that month

### all_products
- `Product_SKU` (VARCHAR) - Product SKU code (Primary Key)
- `product_name` (VARCHAR) - Product name
