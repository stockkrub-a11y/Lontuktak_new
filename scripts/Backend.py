@app.get("/api/notifications")
async def get_notifications():
    """Get inventory notifications from stock_notifications table"""
    try:
        print("[Backend] Fetching notifications")
        
        if not engine:
            print("[Backend] ❌ Database engine not available")
            return []
        
        try:
            print("[Backend] Querying stock_notifications table...")
            query = """
                SELECT 
                    "Product",
                    "Stock",
                    "Last_Stock",
                    "Decrease_Rate(%)",
                    "Weeks_To_Empty",
                    "MinStock",
                    "Buffer",
                    "Reorder_Qty",
                    "Status",
                    "Description",
                    created_at
                FROM stock_notifications
                ORDER BY created_at DESC
            """
            df = pd.read_sql(query, engine)
            
            if not df.empty:
                print(f"[Backend] ✅ Retrieved {len(df)} notifications from database")
                notifications = df.to_dict('records')
                for notification in notifications:
                    if 'created_at' in notification and notification['created_at']:
                        notification['created_at'] = str(notification['created_at'])
                return notifications
            else:
                print("[Backend] No notifications in database")
                return []
        except Exception as db_error:
            print(f"[Backend] Database query failed: {str(db_error)}")
            import traceback
            traceback.print_exc()
            return []
        
    except Exception as e:
        print(f"[Backend] ❌ Error in get_notifications: {str(e)}")
        import traceback
        traceback.print_exc()
        return []
