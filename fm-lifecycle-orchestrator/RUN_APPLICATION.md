# 🚀 RUN THE APPLICATION

## Quick Start (2 Terminals)

### ✅ Both services are currently RUNNING!

You can access them now:
- **Dashboard**: http://localhost:5173
- **API Docs**: http://localhost:8000/docs

---

## If You Need to Start Again

### Terminal 1: Backend
```bash
cd /Users/naveenbatchala/workspace/code/iclm/fm-lifecycle-orchestrator/backend
./start.sh
```

Wait for:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

### Terminal 2: Frontend
```bash
cd /Users/naveenbatchala/workspace/code/iclm/fm-lifecycle-orchestrator/frontend
npm run dev
```

Wait for:
```
VITE v5.4.20  ready in xxx ms
➜  Local:   http://localhost:5173/
```

---

## Open in Browser

1. **Dashboard**: http://localhost:5173
   - See 10 clients
   - Try searching for "Frankfurt"
   - Click filter buttons

2. **API Documentation**: http://localhost:8000/docs
   - Interactive API testing
   - Try GET /api/clients

---

## Quick Test

```bash
# Test backend
curl http://localhost:8000/health

# Test API
curl http://localhost:8000/api/clients
```

Both should return successfully!

---

## That's It!

The application is ready to use. Check **FINAL_STATUS.md** for complete details.
