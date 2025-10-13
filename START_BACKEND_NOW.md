# Start Your Backend Server

Your backend is ready! Follow these steps:

## 1. Install Dependencies

\`\`\`bash
pip install fastapi uvicorn pandas openpyxl python-multipart
\`\`\`

## 2. Run the Backend

\`\`\`bash
cd scripts
python Backend.py
\`\`\`

You should see:
\`\`\`
================================================================================
Starting Lon TukTak Backend API Server
================================================================================
Server will run on: http://localhost:8000
API Documentation: http://localhost:8000/docs
Health Check: http://localhost:8000/health
================================================================================
\`\`\`

## 3. Verify It's Working

Open your browser to:
- http://localhost:8000 - Should show welcome message
- http://localhost:8000/docs - Interactive API documentation
- http://localhost:8000/health - Health check

## 4. Refresh Your Frontend

Once the backend is running, refresh your Next.js app at http://localhost:3000

All the 404 errors will be fixed!

## Troubleshooting

**Port already in use?**
\`\`\`bash
# Kill the process on port 8000
lsof -ti:8000 | xargs kill -9
# Then run Backend.py again
\`\`\`

**Module not found?**
\`\`\`bash
pip install --upgrade fastapi uvicorn pandas openpyxl python-multipart
\`\`\`

## What's Included

The backend currently returns **mock data** for all endpoints:
- ✅ POST /train - Upload and train model
- ✅ GET /stock/levels - Get stock levels
- ✅ GET /api/notifications - Get notifications
- ✅ GET /analysis/dashboard - Dashboard analytics
- ✅ POST /predict - Sales forecasting
- ✅ GET /historical - Historical sales
- ✅ GET /performance - Performance comparison
- ✅ GET /best_sellers - Best sellers

## Next Steps

To connect to your actual database, edit `Backend.py` and replace the mock data sections with your database queries. Look for comments that say `# TODO: Replace with actual database query`.
