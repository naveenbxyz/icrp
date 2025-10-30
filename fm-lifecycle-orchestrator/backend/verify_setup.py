#!/usr/bin/env python3
"""Verification script to check if the backend is set up correctly"""
import sys
import os

def check_python_version():
    """Check Python version"""
    print("✓ Checking Python version...")
    version = sys.version_info
    if version.major >= 3 and version.minor >= 8:
        print(f"  ✅ Python {version.major}.{version.minor}.{version.micro}")
        return True
    else:
        print(f"  ❌ Python {version.major}.{version.minor}.{version.micro} - Need 3.8+")
        return False

def check_dependencies():
    """Check if dependencies are installed"""
    print("\n✓ Checking dependencies...")
    try:
        import fastapi
        import sqlalchemy
        import openai
        print("  ✅ Core dependencies installed")
        return True
    except ImportError as e:
        print(f"  ❌ Missing dependency: {e}")
        print("  Run: pip install -r requirements.txt")
        return False

def check_database():
    """Check if database exists"""
    print("\n✓ Checking database...")
    if os.path.exists("fm_orchestrator.db"):
        print("  ✅ Database file exists")
        return True
    else:
        print("  ❌ Database not found")
        print("  Run: python -m app.seed_data")
        return False

def check_env_file():
    """Check if .env file exists"""
    print("\n✓ Checking environment file...")
    if os.path.exists(".env"):
        print("  ✅ .env file exists")
        # Check for OpenAI key
        with open(".env", "r") as f:
            content = f.read()
            if "OPENAI_API_KEY=sk-" in content:
                print("  ✅ OpenAI API key configured")
            else:
                print("  ⚠️  OpenAI API key not configured (will use mock validation)")
        return True
    else:
        print("  ❌ .env file not found")
        print("  Run: cp .env.example .env")
        return False

def check_uploads_dir():
    """Check if uploads directory exists"""
    print("\n✓ Checking uploads directory...")
    if os.path.exists("uploads"):
        print("  ✅ uploads/ directory exists")
        return True
    else:
        print("  ⚠️  uploads/ directory not found (will be created automatically)")
        os.makedirs("uploads", exist_ok=True)
        return True

def test_database_connection():
    """Test database connection"""
    print("\n✓ Testing database connection...")
    try:
        from app.database import SessionLocal
        from app.models.client import Client

        db = SessionLocal()
        count = db.query(Client).count()
        db.close()

        print(f"  ✅ Database connected - {count} clients found")
        return True
    except Exception as e:
        print(f"  ❌ Database connection failed: {e}")
        return False

def main():
    """Run all checks"""
    print("=" * 60)
    print("FM Client Lifecycle Orchestrator - Backend Verification")
    print("=" * 60)

    checks = [
        check_python_version(),
        check_dependencies(),
        check_env_file(),
        check_uploads_dir(),
        check_database(),
        test_database_connection(),
    ]

    print("\n" + "=" * 60)
    if all(checks):
        print("✅ All checks passed! Backend is ready to run.")
        print("\nStart the server with:")
        print("  python run.py")
        print("\nAPI will be available at:")
        print("  http://localhost:8000")
        print("  http://localhost:8000/docs (API documentation)")
    else:
        print("❌ Some checks failed. Please fix the issues above.")
        sys.exit(1)
    print("=" * 60)

if __name__ == "__main__":
    main()
