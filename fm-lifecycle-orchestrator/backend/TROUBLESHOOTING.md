# Backend Troubleshooting Guide

## Issue: ModuleNotFoundError: No module named 'pydantic_settings'

### Cause
Your shell has a Python alias that overrides the virtual environment Python. The system detected:
- **venv Python**: Python 3.11.6 (correct)
- **Aliased Python**: Python 3.9.6 (system default)

When you activate the venv with `source venv/bin/activate`, the alias still points to the system Python instead of the venv Python.

### Solutions

#### Solution 1: Use the start.sh script (Recommended)

```bash
cd /Users/naveenbatchala/workspace/code/iclm/fm-lifecycle-orchestrator/backend
./start.sh
```

This script uses the venv Python directly, bypassing the alias issue.

#### Solution 2: Use venv Python explicitly

```bash
cd /Users/naveenbatchala/workspace/code/iclm/fm-lifecycle-orchestrator/backend
./venv/bin/python run.py
```

#### Solution 3: Fix the Python alias (Permanent fix)

Edit your shell configuration file (`~/.zshrc` or `~/.bashrc`):

```bash
# Comment out or remove the python alias
# alias python=/usr/bin/python3

# Or add this to prioritize venv
alias python='$(which python3)'
```

Then reload your shell:
```bash
source ~/.zshrc  # or source ~/.bashrc
```

### Verification

Test that pydantic-settings is installed:

```bash
cd backend
./venv/bin/python -c "from pydantic_settings import BaseSettings; print('✅ Working!')"
```

Expected output:
```
✅ Working!
```

## Other Common Issues

### Port 8000 already in use

```bash
# Find and kill the process
lsof -ti:8000 | xargs kill -9
```

### Database not found

```bash
./venv/bin/python -m app.seed_data
```

### Missing dependencies

```bash
./venv/bin/pip install -r requirements.txt
```

### Virtual environment issues

Recreate the venv:
```bash
rm -rf venv
python3 -m venv venv
./venv/bin/pip install -r requirements.txt
./venv/bin/python -m app.seed_data
```

## Quick Start (With Alias Fix)

Use the start script which handles everything:

```bash
cd /Users/naveenbatchala/workspace/code/iclm/fm-lifecycle-orchestrator/backend

# First time setup
python3 -m venv venv
./venv/bin/pip install -r requirements.txt
./venv/bin/python -m app.seed_data

# Every time you want to start the server
./start.sh
```

## Alternative: Using uvicorn directly

```bash
cd /Users/naveenbatchala/workspace/code/iclm/fm-lifecycle-orchestrator/backend
./venv/bin/uvicorn app.main:app --reload
```

## Checking Your Environment

Run this to see what's happening:

```bash
# Check system Python
which python3
python3 --version

# Check if alias exists
type python

# Check venv Python
./venv/bin/python --version

# List installed packages in venv
./venv/bin/pip list
```

## Success Checklist

You're good to go when:
- [ ] `./venv/bin/python --version` shows Python 3.11.6
- [ ] `./venv/bin/python -c "from pydantic_settings import BaseSettings"` works
- [ ] `./start.sh` starts the server
- [ ] http://localhost:8000/docs is accessible
