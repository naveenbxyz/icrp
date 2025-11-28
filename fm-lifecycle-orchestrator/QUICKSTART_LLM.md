# Quick Start: Enable LLM Integration

## 3-Step Setup

### Step 1: Configure Environment Variables

Edit `backend/.env`:

```bash
# Enable LLM mode
LLM_ENABLED=true

# Add your API key
LLM_API_KEY=sk-your-actual-api-key-here

# Set endpoint (default is OpenAI)
LLM_API_ENDPOINT=https://api.openai.com/v1

# Choose model
LLM_MODEL=gpt-4o-mini
```

### Step 2: Restart Backend

```bash
cd backend
./venv/bin/uvicorn app.main:app --reload
```

Look for this message:
```
✅ LLM client initialized: https://api.openai.com/v1 | Model: gpt-4o-mini
```

### Step 3: Test in UI

1. Open the application in your browser
2. Navigate to any client detail page
3. Click the purple AI chat bubble
4. Ask: "What's the onboarding status?"
5. You should get a context-aware response based on real data!

---

## Common Providers

### OpenAI
```bash
LLM_API_ENDPOINT=https://api.openai.com/v1
LLM_API_KEY=sk-...
LLM_MODEL=gpt-4o-mini
```
Get your key: https://platform.openai.com/api-keys

### Azure OpenAI
```bash
LLM_API_ENDPOINT=https://your-resource.openai.azure.com/openai/deployments/your-deployment
LLM_API_KEY=your-azure-key
LLM_MODEL=gpt-4
```

### Local (Ollama)
```bash
LLM_API_ENDPOINT=http://localhost:11434/v1
LLM_API_KEY=not-needed
LLM_MODEL=llama2
```

---

## Disable LLM (Use Simulation)

To switch back to simulation mode:

```bash
LLM_ENABLED=false
```

Then restart the backend.

---

## Troubleshooting

**Problem**: Still getting canned responses

**Solution**:
1. Check `LLM_ENABLED=true` in `.env`
2. Verify backend shows initialization message
3. Restart backend server

**Problem**: Error messages

**Solution**:
1. Verify API key is correct
2. Check endpoint URL format
3. Ensure you have API credits
4. Review backend logs for details

---

## What's Different?

**Simulation Mode** (LLM_ENABLED=false):
- Pattern-matching responses
- No API costs
- Generic answers
- Fast, offline

**LLM Mode** (LLM_ENABLED=true):
- Real AI responses
- API costs apply
- Context-aware answers with real client data
- Requires internet connection

---

For detailed documentation, see [LLM_INTEGRATION_README.md](./LLM_INTEGRATION_README.md)
