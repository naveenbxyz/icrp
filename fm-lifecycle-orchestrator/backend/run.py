#!/usr/bin/env python3
"""Run script for the FM Lifecycle Orchestrator backend

NOTE: If you get ModuleNotFoundError, use ./start.sh instead
This script should be run with: ./venv/bin/python run.py
"""
import uvicorn

if __name__ == "__main__":
    print("🚀 Starting FM Client Lifecycle Orchestrator Backend")
    print("=" * 60)
    print("📍 API: http://localhost:8000")
    print("📚 Docs: http://localhost:8000/docs")
    print("=" * 60)
    print("")

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
