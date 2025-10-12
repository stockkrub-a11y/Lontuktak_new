# How to Run Your Backend Server

## Quick Start

1. **Install Python dependencies:**

\`\`\`bash
pip install fastapi uvicorn pandas openpyxl python-multipart
\`\`\`

2. **Copy the Backend.py file:**

Copy `scripts/Backend.py` to your backend directory (where you want to run your Python server).

3. **Run the server:**

\`\`\`bash
python Backend.py
\`\`\`

Or using uvicorn directly:

\`\`\`bash
uvicorn Backend:app --reload --host 0.0.0.0 --port 8000
\`\`\`

4. **Verify it's running:**

Open these URLs in your browser:
- http://localhost:8000 - Root endpoint
- http://localhost:8000/health - Health check
- http://localhost:8000/docs - Interactive API documentation

5. **Test with your frontend:**

Make sure your frontend is running on http://localhost:3000, then refresh the page. All the 404 errors should be gone!

## What This Backend Provides

### Working Endpoints:

✅ **POST /train** - Upload sales and product files
✅ **GET /stock/levels** - Get current stock levels
✅ **GET /api/notifications** - Get inventory alerts
✅ **GET /analysis/dashboard** - Get dashboard analytics
✅ **POST /predict** - Generate sales forecasts
✅ **GET /historical** - Get historical sales data
✅ **GET /performance** - Compare product performance
✅ **GET /best_sellers** - Get top selling products

### Current Implementation:

The backend currently returns **mock data** for all endpoints. This allows your frontend to work immediately without requiring a database connection.

### Next Steps - Connect to Your Database:

To connect to your actual database, replace the mock data sections with your database queries:

1. **Add database connection:**

\`\`\`python
from sqlalchemy import create_engine
import psycopg2

# PostgreSQL connection
DATABASE_URL = "postgresql://username:password@localhost:5432/database_name"
engine = create_engine(DATABASE_URL)
\`\`\`

2. **Replace mock data with real queries:**

Look for comments that say `# TODO: Replace with actual database query` and add your SQL queries there.

Example:
\`\`\`python
# Instead of mock data:
stock_data = [...]

# Use real database query:
query = "SELECT product_name, product_sku, stock, category, status FROM stock_data"
df = pd.read_sql(query, engine)
stock_data = df.to_dict('records')
\`\`\`

## Troubleshooting

### Port Already in Use

If port 8000 is already in use:

**Windows:**
\`\`\`bash
netstat -ano | findstr :8000
taskkill /PID <PID_NUMBER> /F
\`\`\`

**Mac/Linux:**
\`\`\`bash
lsof -ti:8000 | xargs kill -9
\`\`\`

### Module Not Found Errors

Install missing packages:
\`\`\`bash
pip install fastapi uvicorn pandas openpyxl python-multipart sqlalchemy psycopg2-binary
\`\`\`

### CORS Errors

The backend is already configured to allow requests from localhost:3000. If you're running on a different port, update the CORS configuration in Backend.py:

\`\`\`python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:YOUR_PORT"],
    ...
)
\`\`\`

## Testing the Endpoints

### Using curl:

\`\`\`bash
# Health check
curl http://localhost:8000/health

# Get stock levels
curl http://localhost:8000/stock/levels

# Get notifications
curl http://localhost:8000/api/notifications

# Get dashboard analytics
curl http://localhost:8000/analysis/dashboard

# Upload files (requires actual files)
curl -X POST http://localhost:8000/train \
  -F "sales_file=@Sales_Order_1.xlsx" \
  -F "product_file=@Stock.xlsx"
\`\`\`

### Using the browser:

Just open http://localhost:8000/docs to see the interactive API documentation where you can test all endpoints!

## Running Both Frontend and Backend

You need **TWO terminals** running simultaneously:

**Terminal 1 (Backend):**
\`\`\`bash
cd backend-directory
python Backend.py
\`\`\`

**Terminal 2 (Frontend):**
\`\`\`bash
cd frontend-directory
npm run dev
\`\`\`

Now open http://localhost:3000 and everything should work!
