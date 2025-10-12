"""
Add these endpoints to your Backend.py file

Copy and paste these functions into your Backend.py file after the existing endpoints.
"""

# Add this import at the top of Backend.py if not already present
# from data_analyzer import size_mix_pivot, performance_table, best_sellers_by_month, total_income_table
# from Notification import generate_stock_report

# ============================================
# MISSING ENDPOINT 1: Dashboard Analytics
# ============================================
@app.get("/analysis/dashboard")
async def get_dashboard_analytics():
    """
    Get dashboard overview statistics
    Returns: total items, low stock count, total sales, out of stock count
    """
    try:
        conn = engine.connect()
        
        # Get total unique SKUs
        total_items_query = text("SELECT COUNT(DISTINCT base_sku) FROM base_data")
        total_items = conn.execute(total_items_query).scalar()
        
        # Get low stock items (items with less than 50 total quantity)
        low_stock_query = text("""
            SELECT COUNT(DISTINCT base_sku) 
            FROM (
                SELECT base_sku, SUM(quantity) as total_qty 
                FROM base_data 
                GROUP BY base_sku 
                HAVING SUM(quantity) < 50
            ) as low_stock_items
        """)
        low_stock = conn.execute(low_stock_query).scalar()
        
        # Get total sales (sum of all quantities)
        total_sales_query = text("SELECT SUM(quantity) FROM base_data")
        total_sales = conn.execute(total_sales_query).scalar()
        
        # Get out of stock items (items with 0 quantity)
        out_of_stock_query = text("""
            SELECT COUNT(DISTINCT base_sku) 
            FROM (
                SELECT base_sku, SUM(quantity) as total_qty 
                FROM base_data 
                GROUP BY base_sku 
                HAVING SUM(quantity) = 0
            ) as out_of_stock_items
        """)
        out_of_stock = conn.execute(out_of_stock_query).scalar()
        
        conn.close()
        
        return {
            "totalItems": total_items or 0,
            "lowStock": low_stock or 0,
            "totalSales": total_sales or 0,
            "outOfStock": out_of_stock or 0
        }
    except Exception as e:
        print(f"Error in dashboard analytics: {e}")
        return {
            "totalItems": 0,
            "lowStock": 0,
            "totalSales": 0,
            "outOfStock": 0
        }


# ============================================
# MISSING ENDPOINT 2: Stock Levels
# ============================================
@app.get("/stock/levels")
async def get_stock_levels():
    """
    Get current stock levels for all products
    Returns: list of products with their stock quantities
    """
    try:
        conn = engine.connect()
        
        # Get stock levels grouped by base_sku
        query = text("""
            SELECT 
                base_sku,
                product_name,
                SUM(quantity) as total_quantity,
                COUNT(DISTINCT size) as size_count
            FROM base_data
            GROUP BY base_sku, product_name
            ORDER BY total_quantity DESC
        """)
        
        result = conn.execute(query)
        stocks = []
        
        for row in result:
            stocks.append({
                "sku": row[0],
                "name": row[1],
                "quantity": int(row[2]),
                "sizes": int(row[3])
            })
        
        conn.close()
        return {"stocks": stocks}
        
    except Exception as e:
        print(f"Error fetching stock levels: {e}")
        return {"stocks": []}


# ============================================
# MISSING ENDPOINT 3: Analysis - Historical Sales
# ============================================
@app.get("/analysis/historical")
async def get_historical_analysis(base_sku: str = None):
    """
    Get historical sales data with size breakdown
    """
    try:
        df = size_mix_pivot(base_sku)
        
        if df.empty:
            return {
                "chart": [],
                "table": []
            }
        
        # Prepare chart data
        chart_data = []
        for _, row in df.iterrows():
            chart_data.append({
                "date": row['date'].strftime('%Y-%m-%d'),
                "S": int(row.get('S', 0)),
                "M": int(row.get('M', 0)),
                "L": int(row.get('L', 0)),
                "XL": int(row.get('XL', 0))
            })
        
        # Prepare table data
        table_data = []
        for _, row in df.iterrows():
            table_data.append({
                "date": row['date'].strftime('%Y-%m-%d'),
                "S": int(row.get('S', 0)),
                "M": int(row.get('M', 0)),
                "L": int(row.get('L', 0)),
                "XL": int(row.get('XL', 0))
            })
        
        return {
            "chart": chart_data,
            "table": table_data
        }
        
    except Exception as e:
        print(f"Error in historical analysis: {e}")
        return {"chart": [], "table": []}


# ============================================
# MISSING ENDPOINT 4: Analysis - Best Sellers
# ============================================
@app.get("/analysis/best-sellers")
async def get_best_sellers_analysis(year: int = 2025, month: int = 1, top_n: int = 10):
    """
    Get top N best selling products for a specific month
    """
    try:
        df = best_sellers_by_month(year, month, top_n)
        
        if df.empty:
            return {"bestSellers": []}
        
        best_sellers = []
        for idx, row in df.iterrows():
            best_sellers.append({
                "rank": idx + 1,
                "sku": row['base_sku'],
                "name": row['product_name'],
                "size": row['size'],
                "quantity": int(row['quantity']),
                "income": float(row['income'])
            })
        
        return {"bestSellers": best_sellers}
        
    except Exception as e:
        print(f"Error in best sellers analysis: {e}")
        return {"bestSellers": []}


# ============================================
# MISSING ENDPOINT 5: Analysis - Total Income
# ============================================
@app.get("/analysis/total-income")
async def get_total_income_analysis():
    """
    Get total income analysis with growth metrics
    """
    try:
        df = total_income_table()
        
        if df.empty:
            return {
                "metrics": {
                    "totalAnnualIncome": 0,
                    "averageMonthlyIncome": 0,
                    "annualGrowthRate": 0
                },
                "chart": [],
                "table": []
            }
        
        # Calculate metrics
        total_income = df['total_income'].sum()
        avg_monthly = df['avg_monthly_income'].mean()
        
        # Calculate growth rate (simplified)
        if len(df) > 1:
            first_month = df.iloc[0]['total_income']
            last_month = df.iloc[-1]['total_income']
            growth_rate = ((last_month - first_month) / first_month * 100) if first_month > 0 else 0
        else:
            growth_rate = 0
        
        # Prepare chart data
        chart_data = []
        for idx, row in df.iterrows():
            chart_data.append({
                "month": idx + 1,
                "income": float(row['total_income'])
            })
        
        # Prepare table data
        table_data = []
        for _, row in df.iterrows():
            table_data.append({
                "sku": row['base_sku'],
                "monthsActive": int(row['months_active']),
                "totalIncome": float(row['total_income']),
                "avgMonthlyIncome": float(row['avg_monthly_income'])
            })
        
        return {
            "metrics": {
                "totalAnnualIncome": float(total_income),
                "averageMonthlyIncome": float(avg_monthly),
                "annualGrowthRate": float(growth_rate)
            },
            "chart": chart_data,
            "table": table_data
        }
        
    except Exception as e:
        print(f"Error in total income analysis: {e}")
        return {
            "metrics": {
                "totalAnnualIncome": 0,
                "averageMonthlyIncome": 0,
                "annualGrowthRate": 0
            },
            "chart": [],
            "table": []
        }
