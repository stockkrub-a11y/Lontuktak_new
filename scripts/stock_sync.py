"""
Stock Synchronization Module
Syncs product data from all_products to stock_data table for notification system
"""

import pandas as pd
from datetime import datetime
from sqlalchemy import text
from DB_server import engine

def create_stock_data_table():
    """Create stock_data table if it doesn't exist"""
    
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS stock_data (
        id SERIAL PRIMARY KEY,
        week_date TIMESTAMP NOT NULL,
        product_name VARCHAR(500) NOT NULL,
        product_sku VARCHAR(255) NOT NULL,
        stock_level INTEGER NOT NULL DEFAULT 0,
        minstock INTEGER NOT NULL DEFAULT 0,
        buffer INTEGER NOT NULL DEFAULT 0,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(week_date, product_sku)
    );
    """
    
    create_indexes_sql = """
    CREATE INDEX IF NOT EXISTS idx_stock_data_date ON stock_data(week_date);
    CREATE INDEX IF NOT EXISTS idx_stock_data_sku ON stock_data(product_sku);
    CREATE INDEX IF NOT EXISTS idx_stock_data_uploaded ON stock_data(uploaded_at);
    """
    
    try:
        with engine.begin() as conn:
            conn.execute(text(create_table_sql))
            conn.execute(text(create_indexes_sql))
            print("✅ stock_data table created/verified")
            return True
    except Exception as e:
        print(f"❌ Failed to create stock_data table: {e}")
        return False

def sync_products_to_stock_data():
    """
    Sync products from all_products to stock_data table
    Calculates stock levels based on recent sales data
    """
    
    try:
        print("\n[Stock Sync] Starting product sync to stock_data...")
        
        # Ensure table exists
        create_stock_data_table()
        
        # Get all products
        products_query = """
            SELECT "Product_SKU" as product_sku, product_name
            FROM all_products
            WHERE "Product_SKU" IS NOT NULL
        """
        df_products = pd.read_sql(products_query, engine)
        
        if df_products.empty:
            print("[Stock Sync] ⚠️ No products found in all_products table")
            return {"success": False, "message": "No products to sync"}
        
        print(f"[Stock Sync] Found {len(df_products)} products in all_products")
        
        # Get recent sales data to calculate stock levels
        sales_query = """
            SELECT 
                product_sku,
                product_name,
                sales_date,
                total_quantity
            FROM base_data
            WHERE sales_date >= (SELECT MAX(sales_date) - INTERVAL '90 days' FROM base_data)
            ORDER BY sales_date DESC
        """
        df_sales = pd.read_sql(sales_query, engine)
        
        print(f"[Stock Sync] Found {len(df_sales)} recent sales records")
        
        # Calculate stock metrics for each product
        stock_records = []
        current_time = datetime.now()
        
        for _, product in df_products.iterrows():
            sku = product['product_sku']
            name = product['product_name']
            
            # Get sales for this product
            product_sales = df_sales[df_sales['product_sku'] == sku]
            
            if not product_sales.empty:
                # Calculate average monthly sales
                monthly_sales = product_sales.groupby(
                    pd.to_datetime(product_sales['sales_date']).dt.to_period('M')
                )['total_quantity'].sum()
                
                avg_monthly_sales = int(monthly_sales.mean()) if len(monthly_sales) > 0 else 0
                
                # Estimate current stock (this is a placeholder - you should have actual stock data)
                # For now, we'll use 3 months of average sales as initial stock
                estimated_stock = avg_monthly_sales * 3
                
                # Calculate minimum stock (2 weeks of sales with 1.5x safety factor)
                weekly_sales = avg_monthly_sales / 4
                min_stock = int(weekly_sales * 2 * 1.5)
                
                # Calculate buffer based on sales volatility
                if len(monthly_sales) > 1:
                    sales_std = monthly_sales.std()
                    cv = (sales_std / monthly_sales.mean()) if monthly_sales.mean() > 0 else 0
                    
                    if cv > 0.5:  # High volatility
                        buffer = 20
                    elif cv > 0.2:  # Medium volatility
                        buffer = 10
                    else:  # Low volatility
                        buffer = 5
                else:
                    buffer = 10  # Default buffer
            else:
                # No sales data - use defaults
                estimated_stock = 100  # Default starting stock
                min_stock = 20  # Default minimum
                buffer = 10  # Default buffer
            
            stock_records.append({
                'week_date': current_time,
                'product_name': name,
                'product_sku': sku,
                'stock_level': estimated_stock,
                'minstock': min_stock,
                'buffer': buffer,
                'uploaded_at': current_time
            })
        
        # Create DataFrame
        df_stock = pd.DataFrame(stock_records)
        
        print(f"[Stock Sync] Generated {len(df_stock)} stock records")
        
        # Insert into stock_data table (replace existing records for current week_date)
        with engine.begin() as conn:
            # Delete existing records for this timestamp to avoid duplicates
            delete_sql = text("""
                DELETE FROM stock_data 
                WHERE DATE_TRUNC('day', week_date) = DATE_TRUNC('day', :current_date)
            """)
            conn.execute(delete_sql, {"current_date": current_time})
            
            # Insert new records
            df_stock.to_sql('stock_data', engine, if_exists='append', index=False)
        
        print(f"[Stock Sync] ✅ Successfully synced {len(df_stock)} products to stock_data")
        
        return {
            "success": True,
            "products_synced": len(df_stock),
            "timestamp": current_time.isoformat()
        }
        
    except Exception as e:
        print(f"[Stock Sync] ❌ Error syncing products: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "error": str(e)
        }

def get_stock_report():
    """
    Generate stock report from stock_data table
    This is called by the notification system
    """
    try:
        query = """
            SELECT 
                product_name as "Product",
                product_sku as "Product_SKU",
                stock_level as "Stock",
                minstock as "MinStock",
                buffer as "Buffer",
                week_date,
                uploaded_at
            FROM stock_data
            ORDER BY week_date DESC, product_name ASC
        """
        
        df = pd.read_sql(query, engine)
        
        if df.empty:
            return {"error": "No stock data available"}
        
        return df.to_dict('records')
        
    except Exception as e:
        print(f"[Stock Sync] Error getting stock report: {e}")
        return {"error": str(e)}

if __name__ == "__main__":
    # Test the sync
    result = sync_products_to_stock_data()
    print(f"\nSync Result: {result}")
