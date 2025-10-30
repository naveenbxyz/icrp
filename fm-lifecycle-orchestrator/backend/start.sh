#!/bin/bash

# FM Client Lifecycle Orchestrator - Backend Startup Script
# This script handles the shell alias issue and ensures the correct Python is used

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "🚀 Starting FM Client Lifecycle Orchestrator Backend"
echo "=================================================="

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found!"
    echo "Please run: python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
    exit 1
fi

# Check if database exists
if [ ! -f "fm_orchestrator.db" ]; then
    echo "⚠️  Database not found. Generating mock data..."
    ./venv/bin/python -m app.seed_data
    echo ""
fi

echo "✅ Starting server with venv Python..."
echo "📍 API will be available at: http://localhost:8000"
echo "📚 API Docs will be available at: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop the server"
echo "=================================================="
echo ""

# Use venv python directly to avoid shell alias issues
./venv/bin/python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
