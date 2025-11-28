# Streaming API Configuration Example

This document shows how to configure the LLM integration for a streaming OpenAI-compatible API with custom SSL settings.

## Your Example Code

Based on your working code:

```python
from openai import OpenAI

client = OpenAI(
    base_url="https://<org>/xyz-chatbot/v1",
    api_key=os.environ["ADO_PAT"],
    http_client=httpx.Client(verify=False),
)

stream = client.chat.completions.create(
    model="XYZ",
    messages=[{"role": "user", "content": "Hello"}],
    stream=True,
)

for chunk in stream:
    print(chunk.choices[0].delta.content or "")
```

## Configuration for Your API

### Step 1: Set Environment Variables

Edit `backend/.env`:

```bash
# Enable LLM mode
LLM_ENABLED=true

# Your API configuration
LLM_API_KEY=your-ado-pat-token-here
LLM_API_ENDPOINT=https://your-org.com/xyz-chatbot/v1
LLM_MODEL=XYZ

# Disable SSL verification (for self-signed certs)
LLM_VERIFY_SSL=false

# Enable streaming
LLM_STREAM=true
```

### Step 2: How It Maps

The implementation automatically maps your configuration:

| Your Code | Our Configuration | Environment Variable |
|-----------|------------------|---------------------|
| `base_url="https://..."` | `base_url=settings.llm_api_endpoint` | `LLM_API_ENDPOINT` |
| `api_key=os.environ["ADO_PAT"]` | `api_key=settings.llm_api_key` | `LLM_API_KEY` |
| `http_client=httpx.Client(verify=False)` | Auto-configured when `settings.llm_verify_ssl=False` | `LLM_VERIFY_SSL=false` |
| `stream=True` | Auto-configured when `settings.llm_stream=True` | `LLM_STREAM=true` |
| `model="XYZ"` | `model=settings.llm_model` | `LLM_MODEL=XYZ` |

### Step 3: The Implementation

The code in `ai_service.py` handles this exactly as your example:

```python
# In AIService.__init__()
if self.llm_enabled and settings.llm_api_key:
    # Create custom HTTP client if SSL verification is disabled
    http_client = None
    if not settings.llm_verify_ssl:
        http_client = httpx.Client(verify=False)  # ← Your verify=False

    self.client = OpenAI(
        api_key=settings.llm_api_key,             # ← Your api_key
        base_url=settings.llm_api_endpoint,       # ← Your base_url
        http_client=http_client                   # ← Your http_client
    )
```

```python
# In _chat_with_llm()
if self.llm_stream:
    # Streaming mode - collect all chunks
    stream = self.client.chat.completions.create(
        model=self.model,                         # ← Your model
        messages=[...],
        temperature=0.7,
        max_tokens=500,
        stream=True                               # ← Your stream=True
    )

    # Collect streamed chunks
    assistant_message = ""
    for chunk in stream:                          # ← Your for chunk in stream
        if chunk.choices[0].delta.content:        # ← Your chunk.choices[0].delta.content
            assistant_message += chunk.choices[0].delta.content
```

## Complete Example Configuration

### For Your Internal API

```bash
# backend/.env

# ========================================
# LLM API Configuration
# ========================================
LLM_ENABLED=true
LLM_API_KEY=your-ado-pat-token
LLM_API_ENDPOINT=https://your-org.com/xyz-chatbot/v1
LLM_MODEL=XYZ
LLM_VERIFY_SSL=false
LLM_STREAM=true

# ========================================
# Application Configuration
# ========================================
DATABASE_URL=sqlite:///./fm_orchestrator.db
UPLOAD_DIR=./uploads
CORS_ORIGINS=http://localhost:5173
```

## Testing the Configuration

### Step 1: Start the Backend

```bash
cd backend
./venv/bin/uvicorn app.main:app --reload
```

You should see:
```
⚠️ SSL verification disabled for LLM API
✅ LLM client initialized (streaming): https://your-org.com/xyz-chatbot/v1 | Model: XYZ
```

### Step 2: Test in the UI

1. Navigate to a client detail page
2. Click the AI chat bubble
3. Ask: "What's the onboarding status?"
4. The system will stream the response from your API

### Step 3: Check Logs

Backend logs will show:
- API calls to your endpoint
- Streaming chunks being collected
- Complete response being returned

## Differences from Your Code

The main difference is that our implementation:

1. **Collects all chunks before responding**: Your code prints chunks as they arrive. Our implementation collects all chunks and returns the complete message to the frontend.

2. **Why?**: The current frontend expects a complete message, not a stream. This provides a simpler integration while still benefiting from streaming on the backend (faster time-to-first-byte).

3. **Future Enhancement**: We can add true streaming to the frontend using Server-Sent Events (SSE) if needed.

## Streaming Flow

```
User asks question
    ↓
Backend fetches client context from DB
    ↓
Backend sends request to your API with stream=True
    ↓
Your API starts streaming chunks
    ↓
Backend collects: chunk1 + chunk2 + chunk3 + ...
    ↓
Backend returns complete message to frontend
    ↓
Frontend displays complete response
```

## Benefits of This Approach

1. **Faster Backend Processing**: Streaming reduces wait time on backend
2. **Simple Frontend**: No streaming complexity on frontend
3. **Compatible**: Works with existing UI without changes
4. **Flexible**: Can add frontend streaming later if needed

## Troubleshooting

### Issue: SSL Certificate Error

**Error:**
```
SSLError: certificate verify failed
```

**Solution:**
```bash
LLM_VERIFY_SSL=false
```

### Issue: Connection Refused

**Error:**
```
Connection refused to https://...
```

**Solution:**
- Verify `LLM_API_ENDPOINT` is correct
- Check network connectivity to your API
- Ensure API is running and accessible

### Issue: Authentication Failed

**Error:**
```
401 Unauthorized
```

**Solution:**
- Verify `LLM_API_KEY` is correct
- Check if token has expired
- Ensure token has necessary permissions

### Issue: Model Not Found

**Error:**
```
404 Model not found
```

**Solution:**
- Verify `LLM_MODEL=XYZ` matches your API's model name
- Check API documentation for correct model names

## Advanced: Adding True Frontend Streaming (Future)

If you want the frontend to display text as it streams (like ChatGPT), we can implement Server-Sent Events:

### Backend Changes (future):
```python
@router.post("/chat/stream")
async def stream_chat_message(...):
    async def generate():
        for chunk in stream:
            yield f"data: {json.dumps({'content': chunk})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
```

### Frontend Changes (future):
```typescript
const eventSource = new EventSource('/api/chat/stream');
eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    appendToMessage(data.content);
};
```

This would show the typing effect in real-time. Let me know if you'd like this implemented!

## Summary

Your configuration is now fully supported:

✅ Custom API endpoint
✅ Custom API key (like ADO PAT)
✅ SSL verification disabled (for self-signed certs)
✅ Streaming responses
✅ Custom model name

Just set the environment variables and restart the backend!
