# Import the FastAPI app from scripts/Backend.py
import sys
import os

# Add scripts directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'scripts'))

# Import the app from Backend.py
from Backend import app

# Export the app so uvicorn can find it
__all__ = ['app']
