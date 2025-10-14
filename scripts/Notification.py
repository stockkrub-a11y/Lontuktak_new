# ================= Backend: Postgres Version =================
import pandas as pd
from DB_server import engine  # your SQLAlchemy engine

# Manual overrides
manual_minstock = {}  # {'Product': value}
manual_buffer = {}    # {'Product': value}

SAFETY_FACTOR = 1.5
WEEKS_TO_COVER = 2
MAX_BUFFER = 50

# ================= Get latest stock per product =================
def get_data(week_date):
    query = f"""
        SELECT product_name, stock_level
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
    merged_df = pd.merge(
        df_curr,
        df_prev,
        on='product_name',
        how='left',
        suffixes=('_current', '_previous')
    )

    results = []
    for _, p in merged_df.iterrows():
        name = p['product_name']
        stock = p['stock_level_current']
        last_stock = p.get('stock_level_previous', stock)

        weekly_sale = max(last_stock - stock, 1)
        decrease_rate = (last_stock - stock) / last_stock * 100 if last_stock > 0 else 0
        weeks_to_empty = round(stock / max(weekly_sale, 1), 2)

        min_stock = manual_minstock.get(name, int(weekly_sale * WEEKS_TO_COVER * SAFETY_FACTOR))

        dynamic_buffer = 20 if decrease_rate > 50 else 10 if decrease_rate > 20 else 5
        dynamic_buffer = min(dynamic_buffer, MAX_BUFFER)
        buffer = manual_buffer.get(name, dynamic_buffer)

        reorder_qty = max(min_stock + buffer - stock, int(weekly_sale * SAFETY_FACTOR))

        state = "Green"
        desc = "Stock is sufficient"
        if stock < min_stock or decrease_rate > 50:
            state = "Red"
            desc = f"Decreasing rapidly and nearly out of stock! Recommend restocking {reorder_qty} units"
        elif decrease_rate > 20:
            state = "Yellow"
            desc = f"Decreasing rapidly, should prepare to restock. Recommend restocking {reorder_qty} units"

        results.append({
            "Product": name,
            "Stock": stock,
            "Last_Stock": last_stock,
            "Decrease_Rate(%)": round(decrease_rate, 1),
            "Weeks_To_Empty": weeks_to_empty,
            "MinStock": min_stock,
            "Buffer": buffer,
            "Reorder_Qty": reorder_qty,
            "Status": state,
            "Description": desc
        })

    return pd.DataFrame(results)

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
