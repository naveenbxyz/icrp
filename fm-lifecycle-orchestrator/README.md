# FM Client Lifecycle Orchestrator

A Financial Markets client onboarding and regulatory classification management system.

## Project Structure

```
fm-lifecycle-orchestrator/
├── backend/                    # Python FastAPI backend
│   ├── app/
│   │   ├── models/            # SQLAlchemy models
│   │   ├── schemas/           # Pydantic schemas
│   │   ├── api/               # API routes
│   │   ├── services/          # Business logic (AI service)
│   │   ├── integrations/      # Mock external systems (SX, CX, EX)
│   │   ├── config.py          # Configuration
│   │   ├── database.py        # Database setup
│   │   ├── main.py            # FastAPI app
│   │   └── seed_data.py       # Mock data generator
│   ├── uploads/               # Document storage
│   ├── requirements.txt
│   ├── .env.example
│   └── run.py
├── frontend/                   # React + TypeScript frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── ui/           # shadcn/ui components
│   │   │   ├── layout/       # Layout components
│   │   │   ├── dashboard/    # Dashboard components
│   │   │   ├── client/       # Client detail components
│   │   │   └── documents/    # Document components
│   │   ├── pages/            # Page components
│   │   ├── hooks/            # React Query hooks
│   │   ├── lib/              # Utilities (API client, utils)
│   │   ├── types/            # TypeScript types
│   │   └── App.tsx
│   ├── package.json
│   ├── tailwind.config.js
│   └── .env.example
└── README.md
```

## Setup Instructions

### Backend Setup

1. **Create a virtual environment and install dependencies:**

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

2. **Configure environment variables:**

```bash
cp .env.example .env
# Edit .env and add your OpenAI API key (optional - will use mock validation if not provided)
```

3. **Initialize database and seed mock data:**

```bash
python -m app.seed_data
```

4. **Run the backend server:**

```bash
python run.py
# Or: uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`
API documentation: `http://localhost:8000/docs`

### Frontend Setup

1. **Install dependencies:**

```bash
cd frontend
npm install
```

2. **Configure environment variables:**

```bash
cp .env.example .env
# The default API URL is http://localhost:8000
```

3. **Run the development server:**

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Features

### Current Implementation

✅ **Backend (Complete)**
- Full REST API with FastAPI
- SQLAlchemy models for clients, onboarding stages, regulatory classifications, documents, tasks
- AI service for document OCR and validation (OpenAI integration)
- Mock external system integrations (SX, CX, EX)
- Comprehensive mock data with 10 clients covering various scenarios:
  - MiFID II, EMIR, Dodd-Frank classifications
  - Different jurisdictions (UK, US, Germany, Japan, Switzerland, etc.)
  - Various onboarding statuses (initiated, in progress, completed, blocked)
  - Overdue reviews, missing documentation, etc.

✅ **Frontend (In Progress)**
- Project structure with React + TypeScript + Vite
- Tailwind CSS + shadcn/ui component library
- API client library
- TypeScript types
- Basic UI components (Card, Badge, Button, Input, Table)

### To Be Completed (Frontend)

The following components need to be implemented. I'll provide the structure below:

#### 1. Dashboard Page
- Client list table with sorting/filtering
- Summary metrics cards (Total clients, In Progress, Blocked, Completed)
- Status badges with color coding
- Search functionality

#### 2. Client Detail Page
- Visual timeline of onboarding stages
- Regulatory classification section
- Document list with upload
- Task list
- Tabs for organization

#### 3. Document Management
- Document upload with drag-and-drop
- AI validation trigger and results display
- Document categorization
- Confidence score visualization

#### 4. React Query Hooks
- useClients, useClient
- useOnboardingStages
- useRegulatoryClassifications
- useDocuments, useDocumentValidation
- useTasks

## API Endpoints

### Clients
- `GET /api/clients` - List all clients (with filters)
- `GET /api/clients/{id}` - Get client details
- `POST /api/clients` - Create client
- `PUT /api/clients/{id}` - Update client
- `DELETE /api/clients/{id}` - Delete client

### Onboarding
- `GET /api/clients/{id}/onboarding` - Get onboarding stages
- `PUT /api/onboarding/{stage_id}` - Update stage

### Regulatory Classifications
- `GET /api/clients/{id}/regulatory` - Get classifications
- `PUT /api/regulatory/{id}` - Update classification
- `POST /api/regulatory/{id}/review` - Schedule review

### Documents
- `GET /api/clients/{id}/documents` - List documents
- `POST /api/clients/{id}/documents` - Upload document
- `GET /api/documents/{id}` - Get document
- `POST /api/documents/{id}/validate` - Trigger AI validation
- `GET /api/documents/{id}/validation` - Get validation result
- `DELETE /api/documents/{id}` - Delete document

### Tasks
- `GET /api/clients/{id}/tasks` - List tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/{id}` - Update task
- `DELETE /api/tasks/{id}` - Delete task

### Integrations (Mock)
- `GET /api/integrations/sx/{entity_id}` - Mock SX data
- `GET /api/integrations/cx/{client_id}` - Mock CX data
- `GET /api/integrations/ex/{request_id}` - Mock EX workflow

## Mock Data Clients

1. **Aldgate Capital Partners LLP** (UK) - Completed
2. **American Retirement Trust Fund** (US) - In Progress (SSI Validation)
3. **Frankfurt Asset Management GmbH** (DE) - Blocked (Missing docs)
4. **Cayman Global Investment Fund I Ltd** (KY) - Initiated
5. **Tokyo International Bank Ltd** (JP) - In Progress (Valuation Setup)
6. **Zurich Family Office AG** (CH) - In Progress (Review OVERDUE)
7. **Singapore Strategic Investment Fund** (SG) - Completed
8. **Melbourne Retirement Super Fund** (AU) - In Progress (Data Enrichment)
9. **European Growth Fund SICAV** (LU) - In Progress (SSI Validation)
10. **Toronto Life & General Insurance Co** (CA) - Initiated

## AI Document Validation

The system includes AI-powered document validation using OpenAI's API:

1. **Text Extraction**: Supports PDF, images (OCR), and Word documents
2. **AI Analysis**: Extracts key entities (client name, jurisdiction, dates, etc.)
3. **Validation**: Checks document completeness, consistency, signatures
4. **Confidence Scoring**: Provides confidence scores for validation results
5. **Recommendations**: AI suggests next actions or flags issues

**Mock Mode**: If OpenAI API key is not configured, the system uses mock validation results.

## AI Chat with RAG Integration

The system now includes an AI-powered chat assistant with RAG (Retrieval Augmented Generation) capabilities:

### Features
- 🤖 **OpenAI-Compatible API Support**: Works with OpenAI, Azure OpenAI, local LLMs, and more
- 🔍 **RAG Implementation**: Sends complete client context (documents, tasks, classifications) to LLM
- 💬 **Context-Aware Responses**: AI answers based on real client data from the database
- 🔄 **Dual Mode**: Seamlessly switches between simulation and real LLM
- 🛡️ **Automatic Fallback**: Falls back to simulation mode if LLM fails

### Quick Start

1. **Enable LLM Mode** - Edit `backend/.env`:
   ```bash
   LLM_ENABLED=true
   LLM_API_KEY=your-api-key-here
   LLM_API_ENDPOINT=https://api.openai.com/v1
   LLM_MODEL=gpt-4o-mini
   ```

2. **Restart Backend**:
   ```bash
   cd backend
   ./venv/bin/uvicorn app.main:app --reload
   ```

3. **Test in UI**:
   - Navigate to any client detail page
   - Click the purple AI chat bubble
   - Ask questions like "What's the onboarding status?"

### Documentation

- 📖 **[QUICKSTART_LLM.md](QUICKSTART_LLM.md)** - 3-step setup guide
- 📚 **[LLM_INTEGRATION_README.md](LLM_INTEGRATION_README.md)** - Complete documentation
- 📋 **[LLM_IMPLEMENTATION_SUMMARY.md](LLM_IMPLEMENTATION_SUMMARY.md)** - Technical details

### Supported Providers
- OpenAI (GPT-4, GPT-4o, GPT-4o-mini)
- Azure OpenAI
- Local LLMs (Ollama, LM Studio)
- Any OpenAI-compatible endpoint

## Technology Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM
- **SQLite** - Database (local development)
- **OpenAI API** - AI document validation
- **LangChain** - Document processing
- **pdfplumber, pytesseract** - OCR

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library
- **TanStack Query** - Data fetching
- **TanStack Table** - Data tables
- **Lucide React** - Icons
- **Recharts** - Charts

## Next Steps

### Immediate (Complete Frontend)
1. Create React Query hooks for data fetching
2. Build Dashboard page with client list
3. Implement Client Detail page with timeline
4. Add Document upload and validation UI
5. Create Task management interface

### Phase 2 (Real Integrations)
- Connect to actual SX/CX/EX APIs
- Real-time data synchronization
- Webhook support

### Phase 3 (Advanced Features)
- User authentication and authorization
- Audit trail
- Email notifications
- Advanced analytics and reporting
- Integration with Droit for regulatory rules

## Development Notes

- Backend runs on port 8000
- Frontend runs on port 5173
- Both support hot reload for development
- Database file: `backend/fm_orchestrator.db`
- Uploaded documents: `backend/uploads/`

## Troubleshooting

**Backend won't start:**
- Check if port 8000 is already in use
- Ensure all dependencies are installed
- Check Python version (3.8+)

**Frontend won't start:**
- Check if port 5173 is already in use
- Run `npm install` again
- Check Node version (20+)

**API requests failing:**
- Ensure backend is running
- Check CORS settings in `.env`
- Verify API_URL in frontend `.env`

**AI validation not working:**
- Add OpenAI API key to backend `.env`
- System will fall back to mock validation if no key

## Contributing

This is a prototype for demonstration purposes. To extend:

1. Add more regulatory frameworks
2. Implement additional document types
3. Add more sophisticated AI validation rules
4. Build reporting and analytics features
5. Integrate with real external systems

## License

Prototype/Demo - Internal Use Only
