# ================= Backend: Postgres Version =================
import pandas as pd
import numpy as np  # Added numpy import for vectorized operations
from DB_server import engine  # your SQLAlchemy engine

# Manual overrides
manual_minstock = {}  # {'Product_SKU': value}
manual_buffer = {}    # {'Product_SKU': value}

SAFETY_FACTOR = 1.5
WEEKS_TO_COVER = 2
MAX_BUFFER = 50

# ================= Get latest stock per product =================
def get_data(week_date):
    query = f"""
        SELECT product_name, product_sku, stock_level, "หมวดหมู่" as category
        FROM stock_data
        WHERE week_date = '{week_date}'
        AND uploaded_at = (
            SELECT MAX(sub.uploaded_at)
            FROM stock_data AS sub
            WHERE sub.product_name = stock_data.product_name
            AND sub.week_date = stock_data.week_date
        )
    """
    df = pd.read_sql(query, engine)
    return df

# ================= Generate Stock Report =================
def generate_stock_report(df_prev, df_curr):
    """
    df_curr: columns ['product_sku', 'stock_level', 'category']
    df_prev: columns ['product_sku', 'stock_level', 'category']
    """
    df_prev_unique = df_prev.drop_duplicates(subset='product_sku', keep='last')
    prev_lookup = df_prev_unique.set_index('product_sku')['stock_level']
    
    category_lookup = df_curr.drop_duplicates(subset='product_sku', keep='last').set_index('product_sku')['category']

    curr = df_curr.drop_duplicates(subset='product_sku', keep='last').copy()
    curr.rename(columns={
        'product_sku': 'Product_SKU', 
        'stock_level': 'Stock',
        'category': 'Category'
    }, inplace=True)

    # Last_Stock = previous snapshot if available, else fall back to current stock
    curr['Last_Stock'] = curr['Product_SKU'].map(prev_lookup).fillna(curr['Stock'])

    # Weekly sales and decrease rate
    curr['Weekly_Sale'] = (curr['Last_Stock'] - curr['Stock']).clip(lower=1)
    curr['Decrease_Rate(%)'] = np.where(
        curr['Last_Stock'] > 0,
        (curr['Last_Stock'] - curr['Stock']) / curr['Last_Stock'] * 100,
        0
    ).round(1)

    # Weeks to empty
    curr['Weeks_To_Empty'] = (curr['Stock'] / curr['Weekly_Sale']).round(2)

    # MinStock: manual override, else formula
    default_min = (curr['Weekly_Sale'] * WEEKS_TO_COVER * SAFETY_FACTOR).astype(int)
    manual_min = curr['Product_SKU'].map(manual_minstock)
    curr['MinStock'] = np.where(manual_min.notna(), manual_min, default_min).astype(int)

    # Buffer: dynamic by decrease rate, capped; manual override if present
    dyn_buf = np.select(
        [curr['Decrease_Rate(%)'] > 50, curr['Decrease_Rate(%)'] > 20],
        [20, 10],
        default=5
    )
    dyn_buf = np.minimum(dyn_buf, MAX_BUFFER)
    manual_buf = curr['Product_SKU'].map(manual_buffer)
    curr['Buffer'] = np.where(manual_buf.notna(), manual_buf, dyn_buf).astype(int)

    # Reorder quantity (at least SAFETY_FACTOR * weekly sale)
    default_reorder = (curr['Weekly_Sale'] * SAFETY_FACTOR).astype(int)
    curr['Reorder_Qty'] = np.maximum(curr['MinStock'] + curr['Buffer'] - curr['Stock'], default_reorder).astype(int)

    # Status + Description
    is_red = (curr['Stock'] < curr['MinStock']) | (curr['Decrease_Rate(%)'] > 50)
    is_yellow = (~is_red) & (curr['Decrease_Rate(%)'] > 20)

    curr['Status'] = np.where(is_red, 'Red', np.where(is_yellow, 'Yellow', 'Green'))
    curr['Description'] = np.where(
        is_red,
        'Decreasing rapidly and nearly out of stock! Recommend restocking ' + curr['Reorder_Qty'].astype(str) + ' units',
        np.where(
            is_yellow,
            'Decreasing rapidly, should prepare to restock. Recommend restocking ' + curr['Reorder_Qty'].astype(str) + ' units',
            'Stock is sufficient'
        )
    )

    return curr[['Product_SKU', 'Category', 'Stock', 'Last_Stock', 'Decrease_Rate(%)', 'Weeks_To_Empty',
                 'MinStock', 'Buffer', 'Reorder_Qty', 'Status', 'Description']].reset_index(drop=True)

def update_manual_values(product_sku: str, minstock: int = None, buffer: int = None):
    """Update manual MinStock and Buffer values for a product"""
    if minstock is not None:
        manual_minstock[product_sku] = minstock
    if buffer is not None:
        manual_buffer[product_sku] = buffer

# ================= Get Notifications =================
def get_notifications():
    """
    Returns notification list (summary view).
    """
    print("[Notification] get_notifications() called")
    
    try:
        week_dates_query = """
            SELECT DISTINCT week_date
            FROM stock_data
            ORDER BY week_date DESC
            LIMIT 2
        """
        print("[Notification] Querying for week dates...")
        week_dates = pd.read_sql(week_dates_query, engine)["week_date"].tolist()
        print(f"[Notification] Found {len(week_dates)} week dates: {week_dates}")
        
        if len(week_dates) < 2:
            print("[Notification] ⚠️ Not enough data - need at least 2 week dates")
            return {"error": "Not enough data"}

        week_date_curr, week_date_prev = week_dates[0], week_dates[1]
        print(f"[Notification] Current week: {week_date_curr}, Previous week: {week_date_prev}")
        
        print("[Notification] Fetching previous week data...")
        df_prev = get_data(week_date_prev)
        print(f"[Notification] Previous week data: {len(df_prev)} rows")
        
        print("[Notification] Fetching current week data...")
        df_curr = get_data(week_date_curr)
        print(f"[Notification] Current week data: {len(df_curr)} rows")

        if df_prev.empty or df_curr.empty:
            print("[Notification] ⚠️ No stock data available")
            return {"error": "No stock data available"}

        print("[Notification] Generating stock report...")
        report = generate_stock_report(df_prev, df_curr)
        print(f"[Notification] Generated report with {len(report)} rows")
        
        result = report.to_dict(orient="records")
        print(f"[Notification] ✅ Returning {len(result)} notifications")
        return result
        
    except Exception as e:
        print(f"[Notification] ❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"error": str(e)}


def get_notification_detail(product_name: str):
    """
    Returns detailed metrics for one product.
    """
    week_dates_query = """
        SELECT DISTINCT week_date
        FROM stock_data
        ORDER BY week_date DESC
        LIMIT 2
    """
    week_dates = pd.read_sql(week_dates_query, engine)["week_date"].tolist()
    if len(week_dates) < 2:
        return {"error": "Not enough data"}

    week_date_curr, week_date_prev = week_dates[0], week_dates[1]
    df_prev = get_data(week_date_prev)
    df_curr = get_data(week_date_curr)

    if df_prev.empty or df_curr.empty:
        return {"error": "No stock data available"}

    report = generate_stock_report(df_prev, df_curr)
    row = report.loc[report["Product"] == product_name]

    if row.empty:
        return {"error": f"Product '{product_name}' not found"}

    record = row.iloc[0].to_dict()

    detail = {
        "current_stock": record["Stock"],
        "decrease_rate_per_week": f"{record['Decrease_Rate(%)']}%/week",
        "time_to_run_out": f"{record['Weeks_To_Empty']} weeks",
        "min_stock": record["MinStock"],
        "buffer": record["Buffer"],
        "recommended_restock": record["Reorder_Qty"],
    }

    return {"detail": detail}
