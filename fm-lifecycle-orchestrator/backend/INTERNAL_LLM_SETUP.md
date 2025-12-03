# Internal LLM Setup & Debugging Guide

## Configuration for Intranet LLM

### Step 1: Configure Environment Variables

Edit `backend/.env`:

```bash
# Enable LLM integration
LLM_ENABLED=true

# Your internal LLM endpoint (OpenAI-compatible API)
LLM_API_ENDPOINT=http://your-internal-llm.company.local:8080/v1

# Your internal LLM API key
LLM_API_KEY=your-internal-api-key-here

# Model name (as required by your LLM)
LLM_MODEL=your-model-name

# SSL verification (set to false for self-signed certs)
LLM_VERIFY_SSL=false

# Streaming mode (optional)
LLM_STREAM=false
```

### Step 2: Restart Backend

```bash
cd backend
./venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**Expected startup logs:**
```
🔧 Initializing LLM client...
   Endpoint: http://your-internal-llm.company.local:8080/v1
   Model: your-model-name
   API Key length: XX chars
   API Key (first 10 chars): your-inter...
   SSL Verify: False
⚠️ SSL verification disabled for LLM API
✅ LLM client initialized (non-streaming): http://... | Model: your-model-name
```

### Step 3: Test LLM Connection

**Option A: Use Test Endpoint**

```bash
curl -X POST http://localhost:8000/api/test-llm
```

**Option B: Use Swagger UI**

1. Open: http://localhost:8000/docs
2. Find: `POST /api/test-llm`
3. Click "Try it out"
4. Click "Execute"

**Check backend console for detailed logs!**

---

## Debugging Output

When you run the test or upload a document, you'll see these logs:

### Successful Connection:
```
🔍 === LLM Entity Extraction Debug ===
   Model: your-model-name
   Endpoint: http://your-internal-llm.company.local:8080/v1
   API Key (first 10 chars): your-inter...
   SSL Verify: False
   Stream: False
   Prompt length: 1234 chars
📤 Sending request to LLM API...
📥 Response received from LLM API
   Response object type: <class 'openai.types.chat.chat_completion.ChatCompletion'>
   Response has choices: True
   Number of choices: 1
   Message content type: <class 'str'>
   Message content length: 567
   Message content (first 200 chars): {"legal_name": {"value": "GLOBAL TRADE SOLUTIONS PTE LTD", "confidence": 0.95}, ...}
🔄 Attempting to parse JSON...
✅ JSON parsed successfully, keys: ['legal_name', 'jurisdiction', 'entity_type', ...]
✅ LLM entity extraction successful
```

### JSON Parse Error:
```
🔍 === LLM Entity Extraction Debug ===
   ...
📥 Response received from LLM API
   Message content length: 0
   Message content (first 200 chars): (empty)
❌ JSON Decode Error: Expecting value: line 1 column 1 (char 0)
   Error at: line 1, column 1, position 0
   Failed to parse: (no doc)
   Falling back to simulated entity extraction
```

### API Connection Error:
```
🔍 === LLM Entity Extraction Debug ===
   ...
📤 Sending request to LLM API...
❌ LLM entity extraction error: ConnectionError: Connection refused
   Traceback:
   ...
   Falling back to simulated entity extraction
```

---

## Common Issues & Solutions

### Issue 1: "Expecting value: line 1 column 1"

**Cause:** LLM is returning empty response or non-JSON content

**Debug Steps:**
1. Check the log line: `Message content (first 200 chars): ...`
2. If it shows `(empty)`, your LLM is not returning content
3. Possible reasons:
   - Wrong API endpoint
   - Wrong model name
   - API key authentication failed
   - LLM doesn't support `response_format={"type": "json_object"}`

**Solutions:**
- Verify endpoint URL is correct
- Check if your LLM supports JSON mode
- Try disabling JSON mode (see below)
- Check LLM API logs for errors

### Issue 2: Connection Refused

**Cause:** Cannot connect to internal LLM

**Solutions:**
- Verify endpoint URL: `curl http://your-internal-llm:8080/v1/models`
- Check if LLM service is running
- Verify network access from backend to LLM server
- Check firewall rules

### Issue 3: SSL Certificate Errors

**Cause:** Self-signed certificate or internal CA

**Solution:**
Set in `.env`:
```bash
LLM_VERIFY_SSL=false
```

### Issue 4: Wrong Model Name

**Cause:** Model name doesn't exist on your LLM

**Solution:**
1. Check available models:
   ```bash
   curl http://your-internal-llm:8080/v1/models
   ```
2. Update `.env` with correct model name

---

## Disabling JSON Mode (If Your LLM Doesn't Support It)

If your internal LLM doesn't support `response_format={"type": "json_object"}`:

**Edit:** `backend/app/services/ai_service.py` around line 1293

**Change:**
```python
response = self.client.chat.completions.create(
    model=self.model,
    messages=[...],
    temperature=0.2,
    response_format={"type": "json_object"}  # ← Remove this line
)
```

**To:**
```python
response = self.client.chat.completions.create(
    model=self.model,
    messages=[...],
    temperature=0.2
    # response_format removed
)
```

Then the LLM will return plain text JSON, which should still parse correctly.

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `LLM_ENABLED` | Yes | `false` | Set to `true` to use LLM |
| `LLM_API_KEY` | Yes | - | API key for your internal LLM |
| `LLM_API_ENDPOINT` | Yes | `https://api.openai.com/v1` | OpenAI-compatible endpoint |
| `LLM_MODEL` | Yes | `gpt-4o-mini` | Model name |
| `LLM_VERIFY_SSL` | No | `true` | SSL certificate verification |
| `LLM_STREAM` | No | `true` | Streaming responses |

---

## Testing Workflow

1. **Configure `.env`** with your internal LLM settings
2. **Restart backend** - check initialization logs
3. **Test connection** using `POST /api/test-llm`
4. **Check backend console** for detailed debug output
5. **Fix any issues** based on error messages
6. **Upload a document** to test full workflow

---

## Support

If issues persist, share the following from backend console:

1. Startup logs (LLM client initialization)
2. Full debug output from entity extraction
3. Any error tracebacks
4. Your LLM endpoint configuration (redact API key)
