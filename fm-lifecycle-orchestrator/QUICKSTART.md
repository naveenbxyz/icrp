# Quick Start Guide

## Get the Application Running in 5 Minutes

### Step 1: Start the Backend (Terminal 1)

```bash
cd /Users/naveenbatchala/workspace/code/iclm/fm-lifecycle-orchestrator/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file (OpenAI key is optional)
cp .env.example .env
# Edit .env if you want to add OpenAI API key

# Seed the database with mock data
python -m app.seed_data

# Start the server
python run.py
```

**Expected output:**
```
✅ Database seeded successfully with 10 clients!

Client Summary:
1. Aldgate Capital Partners LLP (UK) - COMPLETED
2. American Retirement Trust Fund (US) - IN PROGRESS (SSI Validation)
3. Frankfurt Asset Management GmbH (DE) - BLOCKED (Missing docs)
...

INFO:     Uvicorn running on http://0.0.0.0:8000
```

**Verify:** Open http://localhost:8000/docs - you should see the API documentation

### Step 2: Start the Frontend (Terminal 2)

```bash
cd /Users/naveenbatchala/workspace/code/iclm/fm-lifecycle-orchestrator/frontend

# Install dependencies (first time only)
npm install

# Create .env file
cp .env.example .env

# Start the development server
npm run dev
```

**Expected output:**
```
VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

**Verify:** Open http://localhost:5173 - you should see the dashboard with 10 clients

### Step 3: Explore the Application

#### Dashboard Features
- **Metrics Cards**: See total clients, in progress, completed, and blocked
- **Search**: Search by client name or entity ID
- **Filter**: Filter by onboarding status (All, In Progress, Blocked, Completed)
- **Client Table**: View all clients with:
  - Client name
  - Legal entity ID
  - Jurisdiction
  - Current onboarding stage
  - Status badge
  - Relationship manager
  - Pending tasks/documents

#### Example Clients to Check

1. **Zurich Family Office AG** - Has overdue review (red flag scenario)
2. **Frankfurt Asset Management GmbH** - Blocked due to missing documentation
3. **American Retirement Trust Fund** - Currently in SSI Validation stage
4. **Aldgate Capital Partners LLP** - Fully completed onboarding

### Step 4: Test API Endpoints

#### Using the API Documentation
Visit http://localhost:8000/docs and try:

1. **GET /api/clients** - List all clients
2. **GET /api/clients/1** - Get details for client ID 1
3. **GET /api/clients/1/onboarding** - See onboarding stages
4. **GET /api/clients/1/regulatory** - See regulatory classifications
5. **GET /api/clients/1/tasks** - See tasks for client

#### Using curl

```bash
# List all clients
curl http://localhost:8000/api/clients

# Get client details
curl http://localhost:8000/api/clients/1

# Get onboarding stages
curl http://localhost:8000/api/clients/1/onboarding

# Get regulatory classifications
curl http://localhost:8000/api/clients/6/regulatory
```

### Step 5: Test Document Upload & AI Validation

You can test document upload through the API:

```bash
# Upload a document (replace with actual PDF file)
curl -X POST "http://localhost:8000/api/clients/1/documents" \
  -F "file=@/path/to/document.pdf" \
  -F "document_category=client_confirmation" \
  -F "uploaded_by=Test User"

# Trigger AI validation (replace {document_id} with ID from upload response)
curl -X POST "http://localhost:8000/api/documents/{document_id}/validate"

# Get validation results
curl "http://localhost:8000/api/documents/{document_id}/validation"
```

**Note:** If you haven't configured an OpenAI API key, the system will return mock validation results.

## What You Get Out of the Box

### ✅ Backend (Fully Functional)
- 10 realistic client scenarios with mock data
- Complete REST API with 20+ endpoints
- AI-powered document validation (with mock fallback)
- Mock external system integrations (SX, CX, EX)
- Regulatory classifications (MiFID II, EMIR, Dodd-Frank)
- Task management
- Document storage and OCR

### ✅ Frontend (Dashboard Complete)
- Modern, responsive dashboard
- Client list with search and filtering
- Status visualization with color-coded badges
- Real-time data from backend
- Professional UI with shadcn/ui components

### 🚧 To Be Built (Next Steps)
1. **Client Detail Page** - Timeline view, regulatory details, documents
2. **Document Upload UI** - Drag-and-drop, validation display
3. **Task Management UI** - Create, assign, complete tasks
4. **Additional Pages** - Regulatory overview, reports

## Common Issues

### Backend Issues

**Port 8000 already in use:**
```bash
# Find and kill the process
lsof -ti:8000 | xargs kill -9
```

**Module not found errors:**
```bash
# Make sure virtual environment is activated
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

**Database errors:**
```bash
# Recreate the database
rm fm_orchestrator.db
python -m app.seed_data
```

### Frontend Issues

**Port 5173 already in use:**
```bash
# The dev server will prompt you to use a different port
# Or kill the process:
lsof -ti:5173 | xargs kill -9
```

**Module not found errors:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**API connection errors:**
- Ensure backend is running on http://localhost:8000
- Check .env file has correct VITE_API_URL
- Check browser console for CORS errors

## Next Development Steps

### 1. Add Client Detail Page

Create `frontend/src/pages/ClientDetail.tsx` with:
- Route parameter for client ID
- Client overview section
- Timeline component for onboarding stages
- Regulatory classification cards
- Document list and upload
- Task list

### 2. Implement Document Upload UI

Create `frontend/src/components/documents/DocumentUpload.tsx`:
- Drag-and-drop file upload
- File type validation
- Upload progress indicator
- Trigger AI validation button
- Display validation results with confidence scores

### 3. Build Task Management

Create `frontend/src/components/client/TaskList.tsx`:
- Display tasks with status
- Create new task form
- Update task status
- Due date tracking
- Team assignment

### 4. Add Router for Navigation

Install React Router:
```bash
npm install react-router-dom
```

Update App.tsx to include routes:
```tsx
<BrowserRouter>
  <Routes>
    <Route path="/" element={<Dashboard />} />
    <Route path="/client/:id" element={<ClientDetail />} />
  </Routes>
</BrowserRouter>
```

## Data Scenarios to Explore

The mock data includes realistic scenarios:

1. **Overdue Reviews** - Client 6 (Zurich Family Office) has overdue MiFID II review
2. **Missing Documentation** - Client 3 (Frankfurt AM) blocked for missing docs
3. **Multi-Framework** - Client 5 (Tokyo Bank) has MiFID II, EMIR, Dodd-Frank
4. **Various Jurisdictions** - UK, US, Germany, Japan, Switzerland, Singapore, etc.
5. **Different Stages** - Clients at various onboarding stages
6. **Task Management** - Some clients have pending tasks with due dates

## Production Considerations

When moving beyond prototype:

1. **Authentication** - Add user login and role-based access
2. **Real Database** - Replace SQLite with PostgreSQL
3. **File Storage** - Use S3 or similar for document storage
4. **Environment Config** - Proper environment variable management
5. **Error Handling** - Comprehensive error handling and logging
6. **Testing** - Add unit and integration tests
7. **Deployment** - Containerize with Docker, deploy to cloud
8. **Monitoring** - Add logging, metrics, and alerting

## Support

For issues or questions:
- Check the main [README.md](README.md) for detailed documentation
- Review API docs at http://localhost:8000/docs
- Check browser console for frontend errors
- Check terminal output for backend errors

---

**Happy Prototyping! 🚀**
