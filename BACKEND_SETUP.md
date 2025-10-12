# Backend Setup Instructions

## The Issue

You're seeing "Failed to fetch" errors because the backend endpoints `/stock/levels` and `/analysis/dashboard` don't exist yet in your Backend.py file.

## Quick Fix - Add Missing Endpoints

Add these functions to your `Backend.py` file:

### 1. Add the missing import at the top

\`\`\`python
from Notification import generate_stock_report
\`\`\`

### 2. Add these helper functions before your endpoints

\`\`\`python
def get_dashboard_data():
    """Get dashboard analytics data"""
    df = pd.read_sql("SELECT * FROM base_data", engine)
    
    # Calculate metrics
    total_items = df['product_sku'].nunique()
    
    # Low stock alerts (items with stock < 10)
    try:
        stock_df = pd.read_sql("SELECT * FROM stock_data ORDER BY week_date DESC LIMIT 1", engine)
        low_stock = len(stock_df[stock_df['stock'] < 10])
        out_of_stock = len(stock_df[stock_df['stock'] == 0])
    except:
        low_stock = 0
        out_of_stock = 0
    
    # Sales this month
    current_month = datetime.now().month
    current_year = datetime.now().year
    df['sales_date'] = pd.to_datetime(df['sales_date'])
    monthly_sales = df[
        (df['sales_date'].dt.month == current_month) & 
        (df['sales_date'].dt.year == current_year)
    ]['Total_Amount_baht'].sum()
    
    return {
        "total_stock_items": int(total_items),
        "low_stock_alerts": int(low_stock),
        "sales_this_month": float(monthly_sales),
        "out_of_stock": int(out_of_stock)
    }

def get_stock_levels():
    """Get current stock levels for all products"""
    try:
        # Get latest stock data
        query = """
            SELECT DISTINCT ON (product_name) 
                product_name, 
                product_sku, 
                stock,
                week_date
            FROM stock_data 
            ORDER BY product_name, week_date DESC
        """
        df = pd.read_sql(query, engine)
        
        # Add category and status
        df['category'] = df['product_sku'].str.extract(r'([A-Z]+)')[0]
        df['status'] = df['stock'].apply(lambda x: 
            'Out of Stock' if x == 0 else 
            'Low Stock' if x < 10 else 
            'In Stock'
        )
        
        return df[['product_name', 'product_sku', 'stock', 'category', 'status']].to_dict('records')
    except Exception as e:
        print(f"Error getting stock levels: {e}")
        return []
\`\`\`

### 3. Update the existing endpoints

Replace your existing `/analysis/dashboard` and `/stock/levels` endpoints with:

\`\`\`python
@app.get("/analysis/dashboard")
async def get_analytics():
    try:
        data = get_dashboard_data()
        return {"success": True, "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/stock/levels")
async def get_stock_levels_endpoint():
    try:
        levels = get_stock_levels()
        return {"success": True, "data": levels}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
\`\`\`

## How to Test

1. **Stop your backend** if it's running (Ctrl+C)

2. **Add the code above** to your `Backend.py`

3. **Restart the backend**:
   \`\`\`bash
   python Backend.py
   \`\`\`

4. **Test the endpoints** in your browser:
   - http://localhost:8000/analysis/dashboard
   - http://localhost:8000/stock/levels
   - http://localhost:8000/api/notifications

5. **Refresh your frontend** at http://localhost:3000

## Troubleshooting

### Still getting errors?

1. **Check if backend is running**:
   \`\`\`bash
   curl http://localhost:8000/docs
   \`\`\`
   You should see the FastAPI documentation page.

2. **Check the browser console** (F12) for detailed error messages

3. **Check backend logs** in the terminal where you ran `python Backend.py`

### Backend not starting?

Make sure you have all dependencies:
\`\`\`bash
pip install fastapi uvicorn sqlalchemy psycopg2-binary pandas numpy scikit-learn xgboost python-multipart
\`\`\`

### Database connection errors?

Check your `DB_server.py` has the correct PostgreSQL credentials:
\`\`\`python
DATABASE_URL = "postgresql://username:password@localhost:5432/database_name"
