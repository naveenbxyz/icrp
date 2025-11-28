# Streaming and SSL Configuration Update

## Summary of Changes

I've updated the LLM integration to support your specific use case with streaming responses and custom SSL configuration, matching your example code exactly.

## What's New

### 1. SSL Verification Control

**New Configuration:**
```bash
LLM_VERIFY_SSL=false  # Disable SSL verification for self-signed certs
```

**Implementation:**
- Uses `httpx.Client(verify=False)` when SSL verification is disabled
- Shows warning in logs: `⚠️ SSL verification disabled for LLM API`
- Exactly matches your code: `http_client=httpx.Client(verify=False)`

### 2. Streaming Support

**New Configuration:**
```bash
LLM_STREAM=true  # Enable streaming responses
```

**Implementation:**
- Uses `stream=True` in API calls
- Collects chunks: `for chunk in stream`
- Extracts content: `chunk.choices[0].delta.content`
- Returns complete message to frontend

### 3. Configuration Files Updated

**Files Modified:**
1. [config.py](backend/app/config.py) - Added `llm_verify_ssl` and `llm_stream` settings
2. [ai_service.py](backend/app/services/ai_service.py) - Added httpx client and streaming logic
3. [.env](backend/.env) - Added new configuration options
4. [.env.example](backend/.env.example) - Updated with examples

**New Documentation:**
1. [STREAMING_CONFIGURATION_EXAMPLE.md](STREAMING_CONFIGURATION_EXAMPLE.md) - Detailed guide matching your code
2. Updated [QUICKSTART_LLM.md](QUICKSTART_LLM.md) - Added streaming and SSL examples
3. Updated [LLM_INTEGRATION_README.md](LLM_INTEGRATION_README.md) - Added advanced configuration section

## How to Configure for Your API

Based on your example code, here's the exact configuration:

### Your Code
```python
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
```

### Your Configuration

Edit `backend/.env`:

```bash
# Enable LLM
LLM_ENABLED=true

# Your API details
LLM_API_KEY=your-ado-pat-token-here
LLM_API_ENDPOINT=https://your-org.com/xyz-chatbot/v1
LLM_MODEL=XYZ

# Match your example code
LLM_VERIFY_SSL=false  # ← Matches http_client=httpx.Client(verify=False)
LLM_STREAM=true       # ← Matches stream=True

# Other settings
DATABASE_URL=sqlite:///./fm_orchestrator.db
UPLOAD_DIR=./uploads
CORS_ORIGINS=http://localhost:5173
```

## Code Mapping

| Your Code | Our Implementation | Config |
|-----------|-------------------|---------|
| `base_url="https://..."` | `base_url=settings.llm_api_endpoint` | `LLM_API_ENDPOINT` |
| `api_key=os.environ["ADO_PAT"]` | `api_key=settings.llm_api_key` | `LLM_API_KEY` |
| `http_client=httpx.Client(verify=False)` | `http_client=httpx.Client(verify=False)` when `not settings.llm_verify_ssl` | `LLM_VERIFY_SSL=false` |
| `model="XYZ"` | `model=settings.llm_model` | `LLM_MODEL` |
| `stream=True` | `stream=True` when `settings.llm_stream` | `LLM_STREAM=true` |
| `for chunk in stream:` | `for chunk in stream:` | Auto |
| `chunk.choices[0].delta.content` | `chunk.choices[0].delta.content` | Auto |

## Implementation Details

### In `ai_service.py`

**Initialization with SSL:**
```python
def __init__(self):
    # ...
    if self.llm_enabled and settings.llm_api_key:
        # Create custom HTTP client if SSL verification is disabled
        http_client = None
        if not settings.llm_verify_ssl:
            http_client = httpx.Client(verify=False)  # ← YOUR CODE

        self.client = OpenAI(
            api_key=settings.llm_api_key,
            base_url=settings.llm_api_endpoint,
            http_client=http_client                   # ← YOUR CODE
        )
```

**Streaming in `_chat_with_llm()`:**
```python
if self.llm_stream:
    # Streaming mode - collect all chunks
    stream = self.client.chat.completions.create(
        model=self.model,
        messages=[...],
        temperature=0.7,
        max_tokens=500,
        stream=True                                   # ← YOUR CODE
    )

    # Collect streamed chunks
    assistant_message = ""
    for chunk in stream:                              # ← YOUR CODE
        if chunk.choices[0].delta.content:            # ← YOUR CODE
            assistant_message += chunk.choices[0].delta.content
```

## Testing

### 1. Verify Configuration

```bash
cd backend
./venv/bin/python -c "from app.config import settings; \
    print(f'Enabled: {settings.llm_enabled}'); \
    print(f'Endpoint: {settings.llm_api_endpoint}'); \
    print(f'Model: {settings.llm_model}'); \
    print(f'SSL Verify: {settings.llm_verify_ssl}'); \
    print(f'Stream: {settings.llm_stream}')"
```

Expected output:
```
Enabled: True
Endpoint: https://your-org.com/xyz-chatbot/v1
Model: XYZ
SSL Verify: False
Stream: True
```

### 2. Start Backend

```bash
./venv/bin/uvicorn app.main:app --reload
```

Expected output:
```
⚠️ SSL verification disabled for LLM API
✅ LLM client initialized (streaming): https://your-org.com/xyz-chatbot/v1 | Model: XYZ
```

### 3. Test in UI

1. Open the application
2. Navigate to a client detail page
3. Click the AI chat bubble
4. Ask: "What's the onboarding status?"
5. Watch for the response from your API

## Technical Details

### Dependencies

No new dependencies required! We're already using:
- `openai==1.51.2` ✅
- `httpx==0.27.2` ✅

### Backend Flow

```
User Question
    ↓
Fetch client context from DB
    ↓
Build RAG context
    ↓
Create streaming request to your API
    LLM_API_ENDPOINT (your base_url)
    LLM_API_KEY (your api_key)
    LLM_MODEL (your model)
    stream=True (your stream parameter)
    httpx.Client(verify=False) (your http_client)
    ↓
Collect streamed chunks
    for chunk in stream:
        assistant_message += chunk.choices[0].delta.content
    ↓
Return complete message to frontend
    ↓
Display in UI
```

### Differences from Your Code

The only difference is that we collect all chunks before returning to the frontend:

**Your Code (prints as it streams):**
```python
for chunk in stream:
    print(chunk.choices[0].delta.content or "")
```

**Our Code (collects then returns):**
```python
assistant_message = ""
for chunk in stream:
    if chunk.choices[0].delta.content:
        assistant_message += chunk.choices[0].delta.content
# Then return assistant_message to frontend
```

**Why?**: The current frontend expects a complete message. This approach still benefits from streaming (faster time-to-first-byte on backend) while keeping the frontend simple.

## Configuration Options

### Default (OpenAI)
```bash
LLM_VERIFY_SSL=true
LLM_STREAM=true
```

### Your Internal API
```bash
LLM_VERIFY_SSL=false  # For self-signed certs
LLM_STREAM=true       # Enable streaming
```

### Debugging
```bash
LLM_VERIFY_SSL=true
LLM_STREAM=false      # Disable streaming for simpler debugging
```

## Security Notes

**SSL Verification:**
- Only set `LLM_VERIFY_SSL=false` for trusted internal APIs
- Never disable for public APIs
- Use proper certificates in production
- The system logs a warning when SSL verification is disabled

**Streaming:**
- Streaming is safe and recommended
- Reduces latency
- Same security as non-streaming
- No additional security concerns

## Troubleshooting

### SSL Certificate Error

```
SSLError: certificate verify failed
```

**Solution:**
```bash
LLM_VERIFY_SSL=false
```

### Connection Issues

```
Connection refused
```

**Check:**
1. `LLM_API_ENDPOINT` is correct
2. Network connectivity to API
3. API is running and accessible
4. Firewall rules

### Authentication Failed

```
401 Unauthorized
```

**Check:**
1. `LLM_API_KEY` is correct
2. Token hasn't expired
3. Token has necessary permissions

### No Streaming

```
Still see "thinking..." for a long time
```

**Check:**
1. `LLM_STREAM=true` in `.env`
2. Backend restarted after config change
3. API supports streaming
4. Check backend logs for streaming initialization

## Files Changed

### Configuration
- ✅ `backend/app/config.py` - Added SSL and streaming settings
- ✅ `backend/.env` - Added new variables
- ✅ `backend/.env.example` - Updated with examples

### Implementation
- ✅ `backend/app/services/ai_service.py` - Added httpx client and streaming logic

### Documentation
- ✅ `STREAMING_CONFIGURATION_EXAMPLE.md` - Detailed guide (NEW)
- ✅ `STREAMING_UPDATE_SUMMARY.md` - This file (NEW)
- ✅ `QUICKSTART_LLM.md` - Updated with examples
- ✅ `LLM_INTEGRATION_README.md` - Added advanced configuration

## Quick Reference

### Minimum Configuration for Your API

```bash
LLM_ENABLED=true
LLM_API_KEY=your-ado-pat
LLM_API_ENDPOINT=https://your-org.com/xyz-chatbot/v1
LLM_MODEL=XYZ
LLM_VERIFY_SSL=false
LLM_STREAM=true
```

### Restart and Test

```bash
cd backend
./venv/bin/uvicorn app.main:app --reload
```

Look for:
```
⚠️ SSL verification disabled for LLM API
✅ LLM client initialized (streaming): https://... | Model: XYZ
```

## Next Steps

1. ✅ Configuration is ready - just update your `.env`
2. ✅ Implementation matches your code exactly
3. ✅ Documentation updated with examples
4. 🚀 Ready to test with your API!

Simply update the `.env` file with your API details and restart the backend. The system will automatically use your streaming API with SSL verification disabled, exactly as your example code shows.

For detailed instructions, see [STREAMING_CONFIGURATION_EXAMPLE.md](STREAMING_CONFIGURATION_EXAMPLE.md).
