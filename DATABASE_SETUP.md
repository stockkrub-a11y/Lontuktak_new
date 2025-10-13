# Database Setup Guide

## Quick Start

The backend now connects to your actual database instead of using mock data. Follow these steps to set it up:

### Step 1: Install Database Dependencies

\`\`\`bash
# For SQLite (easiest, no additional setup)
# Already included with Python

# For PostgreSQL
pip install psycopg2-binary

# For MySQL
pip install pymysql

# For all database operations
pip install sqlalchemy pandas
\`\`\`

### Step 2: Configure Database Connection

Set the `DATABASE_URL` environment variable:

**Option A - SQLite (Recommended for testing):**
\`\`\`bash
export DATABASE_URL="sqlite:///./lontuktak.db"
\`\`\`

**Option B - PostgreSQL:**
\`\`\`bash
export DATABASE_URL="postgresql://username:password@localhost:5432/lontuktak"
\`\`\`

**Option C - MySQL:**
\`\`\`bash
export DATABASE_URL="mysql+pymysql://username:password@localhost:3306/lontuktak"
\`\`\`

### Step 3: Create Database Tables

Your database needs these tables:

#### product_data table:
- product_sku (TEXT, PRIMARY KEY)
- product_name (TEXT)
- stock (INTEGER)
- last_stock (INTEGER)
- min_stock (INTEGER)
- buffer_stock (INTEGER)
- category (TEXT)

#### sales_data table:
- id (INTEGER, PRIMARY KEY)
- product_sku (TEXT)
- size (TEXT)
- quantity (INTEGER)
- total_amount (DECIMAL)
- sale_date (DATE)

See `database_config.py` for the complete SQL schema.

### Step 4: Upload Your Data

Use the frontend to upload your Excel/CSV files:
1. Go to the Stocks page
2. Click "Upload Product List" and "Upload Sale Stock"
3. The data will be automatically stored in your database

### Step 5: Restart Backend

\`\`\`bash
python scripts/Backend.py
\`\`\`

## How It Works

The backend now:
- Connects to your database on startup
- Queries real data from your tables
- Falls back to mock data if database is unavailable
- Stores uploaded files directly in the database

## Customizing Queries

If your database schema is different, edit the SQL queries in `Backend.py`:
- Look for comments marked with ``
- Adjust table names and column names to match your schema
- Test each endpoint after making changes

## Troubleshooting

**Database connection failed:**
- Check your DATABASE_URL is correct
- Verify database server is running
- Check username/password credentials

**Table doesn't exist:**
- Run the CREATE TABLE statements from `database_config.py`
- Or upload data through the frontend to auto-create tables

**Query errors:**
- Check column names match your database schema
- Adjust SQL queries in Backend.py to match your structure
