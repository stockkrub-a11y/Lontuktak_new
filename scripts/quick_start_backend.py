#!/usr/bin/env python3
"""
Quick start script to check dependencies and run the backend
"""

import sys
import subprocess

def check_dependencies():
    """Check if required packages are installed"""
    required_packages = [
        'fastapi',
        'uvicorn',
        'pandas',
        'openpyxl',
        'python-multipart'
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
            print(f"✓ {package} is installed")
        except ImportError:
            print(f"✗ {package} is NOT installed")
            missing_packages.append(package)
    
    if missing_packages:
        print("\n" + "="*80)
        print("Missing packages detected!")
        print("="*80)
        print("\nInstall them with:")
        print(f"pip install {' '.join(missing_packages)}")
        print("\nOr install all at once:")
        print("pip install fastapi uvicorn pandas openpyxl python-multipart")
        return False
    
    return True

def main():
    print("="*80)
    print("Lon TukTak Backend - Quick Start")
    print("="*80)
    print("\nChecking dependencies...\n")
    
    if not check_dependencies():
        print("\n❌ Please install missing dependencies first!")
        sys.exit(1)
    
    print("\n✅ All dependencies are installed!")
    print("\n" + "="*80)
    print("Starting Backend Server...")
    print("="*80)
    print()
    
    # Run the backend
    try:
        subprocess.run([sys.executable, "Backend.py"], check=True)
    except KeyboardInterrupt:
        print("\n\n" + "="*80)
        print("Backend server stopped")
        print("="*80)
    except Exception as e:
        print(f"\n❌ Error starting backend: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
