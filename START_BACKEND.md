# How to Start Your Backend Server

Your frontend is working correctly, but you need to start the FastAPI backend server for the app to function properly.

## Quick Start

1. **Open a new terminal** in your backend directory (where your Python files are located)

2. **Run the backend server:**

\`\`\`bash
python Backend.py
\`\`\`

Or using uvicorn directly:

\`\`\`bash
uvicorn Backend:app --reload --host 0.0.0.0 --port 8000
\`\`\`

3. **Verify it's running:**
   - You should see: `Uvicorn running on http://0.0.0.0:8000`
   - Open http://localhost:8000/docs in your browser to see the API documentation

4. **Refresh your frontend** at http://localhost:3000
   - The backend status indicator should turn green and show "Backend Connected"
   - All features (upload, notifications, predictions) will now work

## Troubleshooting

### Port Already in Use
If you get an error that port 8000 is already in use:

**Windows:**
\`\`\`bash
netstat -ano | findstr :8000
taskkill /PID <PID_NUMBER> /F
\`\`\`

**Mac/Linux:**
\`\`\`bash
lsof -ti:8000 | xargs kill -9
\`\`\`

### Database Connection Error
Make sure PostgreSQL is running and your connection string in `DB_server.py` is correct:

\`\`\`python
DATABASE_URL = "postgresql://username:password@localhost:5432/database_name"
\`\`\`

### Missing Python Packages
Install all required packages:

\`\`\`bash
pip install fastapi uvicorn sqlalchemy psycopg2-binary pandas numpy scikit-learn xgboost python-multipart
\`\`\`

## What the Backend Does

- **`/train`** - Uploads and processes product/sales CSV files
- **`/predict`** - Generates sales forecasts using ML
- **`/api/notifications`** - Provides stock alerts and notifications
- **`/historical`** - Returns historical sales data
- **`/performance`** - Compares product performance
- **`/best_sellers`** - Shows top-selling products
- **`/analysis/dashboard`** - Provides dashboard analytics

## Keep Both Running

You need **TWO terminals** running simultaneously:

1. **Terminal 1 (Backend):** `python Backend.py`
2. **Terminal 2 (Frontend):** `npm run dev`

The frontend status indicator will show you when the backend is connected!
