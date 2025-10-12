# Backend Implementation Guide - Fix All 404 Errors

## Problem Summary

Your frontend is getting 404 Not Found errors for these endpoints:
- `POST /train` - Upload and train model with sales/product files
- `GET /stock/levels` - Get current stock levels
- `GET /api/notifications` - Get inventory notifications
- `GET /analysis/dashboard` - Get analysis dashboard data

## Solution: Add Missing Endpoints

### Step 1: Open Your Backend.py File

Locate your `Backend.py` file in your project directory.

### Step 2: Verify Imports

Make sure you have these imports at the top of your Backend.py:

\`\`\`python
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
import pandas as pd
import io
from typing import List, Dict, Any, Optional
import json
\`\`\`

### Step 3: Verify CORS Configuration

Right after creating your FastAPI app, make sure CORS is configured:

\`\`\`python
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
\`\`\`

### Step 4: Add the Missing Endpoints

Copy all the endpoint functions from `scripts/complete_backend_implementation.py` into your Backend.py file:

1. **POST /train** - Handles file uploads and model training
2. **GET /stock/levels** - Returns current stock levels
3. **GET /api/notifications** - Returns inventory alerts
4. **GET /analysis/dashboard** - Returns dashboard analytics
5. **GET /health** - Health check endpoint

### Step 5: Restart Your Backend Server

Stop your current backend server (Ctrl+C) and restart it:

\`\`\`bash
uvicorn Backend:app --reload --host 0.0.0.0 --port 8000
\`\`\`

You should see output like:
\`\`\`
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [xxxxx] using WatchFiles
INFO:     Started server process [xxxxx]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
\`\`\`

### Step 6: Test the Endpoints

Open a new terminal and test each endpoint:

\`\`\`bash
# Test health check
curl http://localhost:8000/health

# Test stock levels
curl http://localhost:8000/stock/levels

# Test notifications
curl http://localhost:8000/api/notifications

# Test analysis dashboard
curl http://localhost:8000/analysis/dashboard
\`\`\`

All should return JSON responses without 404 errors.

### Step 7: Test File Upload

To test the train endpoint with actual files:

\`\`\`bash
curl -X POST http://localhost:8000/train \
  -F "sales_file=@Sales_Order_1.xlsx" \
  -F "product_file=@Stock.xlsx"
\`\`\`

Replace the file names with your actual file paths.

### Step 8: Refresh Your Frontend

1. Go back to your browser
2. Refresh the page (F5 or Ctrl+R)
3. The "Backend Offline" indicator should turn green showing "Backend Connected"
4. All 404 errors should be gone
5. File uploads should work correctly

## Important Notes

### Mock Data vs Real Data

The current implementation uses **mock data** for demonstration. You need to replace the TODO sections with your actual database queries:

\`\`\`python
# Example: Replace this mock data
stock_data = [
    {"product_name": "Example", "current_stock": 45}
]

# With actual database query
cursor.execute("SELECT * FROM products")
stock_data = cursor.fetchall()
\`\`\`

### Database Integration

If you're using PostgreSQL (as shown in your logs), make sure to:

1. Import your database connection
2. Replace mock data with actual queries
3. Handle database errors properly
4. Close connections after use

### Error Handling

All endpoints include try-catch blocks that:
- Log errors to console with `[Backend]` prefix
- Return proper HTTP status codes
- Provide detailed error messages

### File Upload Handling

The `/train` endpoint:
- Accepts both sales_file (required) and product_file (optional)
- Reads Excel files using pandas
- Validates file content
- Returns success with record counts

## Troubleshooting

### Still Getting 404 Errors?

1. **Check endpoint paths match exactly**
   - Frontend calls `/stock/levels`
   - Backend must have `@app.get("/stock/levels")`

2. **Verify server is running**
   - Check terminal for "Application startup complete"
   - No error messages during startup

3. **Check CORS configuration**
   - Make sure localhost:3000 is in allowed origins
   - Verify middleware is added before routes

4. **Restart both servers**
   - Stop backend (Ctrl+C) and restart
   - Stop frontend (Ctrl+C) and restart with `npm run dev`

### File Upload Fails?

1. **Check file size limits**
   - FastAPI has default limits
   - Add `max_upload_size` if needed

2. **Verify file format**
   - Must be .xlsx files
   - Check pandas can read them

3. **Check FormData names**
   - Frontend sends `sales_file` and `product_file`
   - Backend expects same names

## Next Steps

After fixing the 404 errors:

1. **Replace mock data** with real database queries
2. **Implement actual model training** logic
3. **Add authentication** if needed
4. **Add data validation** for uploaded files
5. **Implement proper logging** for production
6. **Add unit tests** for each endpoint

## Success Indicators

You'll know it's working when:

- ✅ Backend status shows "Backend Connected" (green)
- ✅ No 404 errors in browser console
- ✅ File uploads complete successfully
- ✅ Stock data displays on Stocks page
- ✅ Notifications load on Notifications page
- ✅ Analysis dashboard shows data

## Support

If you continue to have issues:

1. Check the browser console for detailed error messages
2. Check the backend terminal for server logs
3. Verify all file paths are correct
4. Make sure all dependencies are installed (`pip install fastapi pandas openpyxl`)
