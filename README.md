# Lon TukTak UI - Stock Management System

A modern stock management and sales forecasting application built with Next.js and FastAPI.

## Features

- **Dashboard**: Real-time inventory overview with key metrics
- **Stock Management**: Upload and manage product inventory
- **Sales Prediction**: ML-powered sales forecasting
- **Analysis**: Historical sales, performance comparison, and best sellers
- **Notifications**: Smart stock alerts and reorder recommendations

## Getting Started

### Prerequisites

- Node.js 18+ 
- Python 3.8+
- PostgreSQL database

### Frontend Setup

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Configure environment variables:
\`\`\`bash
cp .env.local.example .env.local
\`\`\`

Edit `.env.local` and set your backend API URL:
\`\`\`
NEXT_PUBLIC_API_URL=http://localhost:8000
\`\`\`

3. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Backend Setup

1. Install Python dependencies:
\`\`\`bash
pip install fastapi uvicorn pandas sqlalchemy psycopg2-binary xgboost scikit-learn optuna
\`\`\`

2. Configure database in `DB_server.py`:
\`\`\`python
DB_USER = "your_username"
DB_PASSWORD = "your_password"
DB_HOST = "localhost"
DB_PORT = "5432"
DB_NAME = "your_database"
\`\`\`

3. Run the FastAPI server:
\`\`\`bash
python Backend.py
\`\`\`

Or with uvicorn:
\`\`\`bash
uvicorn Backend:app --reload --host 0.0.0.0 --port 8000
\`\`\`

The API will be available at [http://localhost:8000](http://localhost:8000)

## API Endpoints

- `POST /train` - Upload sales/product files and train ML model
- `POST /predict?n_forecast=3` - Generate sales forecast
- `GET /historical?base_sku=XXX` - Get historical sales data
- `GET /performance?sku_list=XXX,YYY` - Compare product performance
- `GET /best_sellers?year=2025&month=1` - Get top sellers
- `GET /api/notifications` - Get stock notifications
- `GET /analysis/dashboard` - Get dashboard analytics

## Tech Stack

**Frontend:**
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS v4
- Recharts for data visualization
- shadcn/ui components

**Backend:**
- FastAPI
- PostgreSQL
- XGBoost for ML predictions
- Pandas for data processing
- SQLAlchemy for database ORM

## Project Structure

\`\`\`
├── app/                    # Next.js app directory
│   ├── dashboard/         # Dashboard pages
│   │   ├── page.tsx       # Main dashboard
│   │   ├── stocks/        # Stock management
│   │   ├── predict/       # Sales prediction
│   │   ├── analysis/      # Sales analysis
│   │   └── notifications/ # Stock alerts
│   └── layout.tsx         # Root layout
├── lib/
│   └── api.ts             # API client functions
├── components/ui/         # Reusable UI components
└── Backend files:
    ├── Backend.py         # FastAPI server
    ├── DB_server.py       # Database connection
    ├── Predict.py         # ML prediction model
    ├── Notification.py    # Stock notification logic
    └── data_analyzer.py   # Data analysis functions
\`\`\`

## Usage

1. **Upload Data**: Go to Stocks page and upload your product list and sales data
2. **Train Model**: The system will automatically train the ML model on upload
3. **View Dashboard**: Check real-time metrics and alerts
4. **Generate Predictions**: Use the Predict page to forecast future sales
5. **Analyze Performance**: Compare products and view best sellers
6. **Monitor Alerts**: Check notifications for low stock warnings

## License

MIT
"# Lontuktak_new" 
"# Lontuktak_new" 
"# Lontuktak_new" 
