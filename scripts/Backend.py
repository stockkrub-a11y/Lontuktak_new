@app.get("/analysis/historical")
async def get_historical_sales(sku: str = Query(...)):
    """
    Get historical sales data for a product directly from base_data
    Search by full product_sku without removing any characters
    """
    try:
        print(f"[Backend] Fetching historical sales for SKU: {sku}")
        
        if not engine:
            return {
                "success": False,
                "message": "Database not configured",
                "chart_data": [],
                "table_data": [],
                "sizes": []
            }
        
        try:
            print(f"[Backend] Searching for SKU pattern: {sku}")
            
            query = text("""
                SELECT 
                    product_sku,
                    product_name,
                    sales_date,
                    sales_year,
                    sales_month,
                    total_quantity
                FROM base_data
                WHERE product_sku LIKE :sku_pattern
                ORDER BY sales_date ASC, product_sku ASC
            """)
            
            # Execute query with parameters
            with engine.connect() as conn:
                result = conn.execute(query, {"sku_pattern": f"{sku}%"})
                df = pd.DataFrame(result.fetchall(), columns=result.keys())
            
            print(f"[Backend] Retrieved {len(df)} rows from base_data")
            
            if df.empty:
                return {
                    "success": False,
                    "message": f"No data found for SKU: {sku}",
                    "chart_data": [],
                    "table_data": [],
                    "sizes": []
                }
            
            # Extract size from SKU (everything after first 3 parts)
            df['size'] = df['product_sku'].apply(
                lambda x: '-'.join(x.split('-')[3:]) if len(x.split('-')) > 3 else 'Standard'
            )
            
            # Group by date and size
            df['year_month'] = pd.to_datetime(df['sales_date']).dt.to_period('M')
            grouped = df.groupby(['year_month', 'size'])['total_quantity'].sum().reset_index()
            
            # Pivot to get sizes as columns
            pivot = grouped.pivot(index='year_month', columns='size', values='total_quantity').fillna(0)
            
            # Get unique sizes
            sizes = list(pivot.columns)
            print(f"[Backend] Found {len(sizes)} sizes: {sizes}")
            
            # Convert to chart format
            chart_data = []
            for date_idx, row in pivot.iterrows():
                month_data = {
                    "month": str(date_idx)
                }
                for size in sizes:
                    month_data[size] = int(row[size])
                chart_data.append(month_data)
            
            # Convert to table format
            table_data = []
            for date_idx, row in pivot.iterrows():
                row_data = {
                    "date": str(date_idx)
                }
                for size in sizes:
                    row_data[size] = int(row[size])
                table_data.append(row_data)
            
            print(f"[Backend] ✅ Retrieved historical sales: {len(chart_data)} months, {len(sizes)} sizes")
            
            return {
                "success": True,
                "message": "Historical sales data retrieved successfully",
                "chart_data": chart_data,
                "table_data": table_data,
                "sizes": sizes
            }
            
        except Exception as e:
            print(f"[Backend] Error querying historical sales: {str(e)}")
            import traceback
            traceback.print_exc()
            return {
                "success": False,
                "message": f"Error: {str(e)}",
                "chart_data": [],
                "table_data": [],
                "sizes": []
            }
        
    except Exception as e:
        print(f"[Backend] Error in get_historical_sales: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch historical sales: {str(e)}")
