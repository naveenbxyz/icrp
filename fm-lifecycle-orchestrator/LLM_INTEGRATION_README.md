# LLM Integration with RAG for AI Chat

This document explains how to configure and use the OpenAI-compatible LLM API integration in the FM Lifecycle Orchestrator application.

## Overview

The AI Chat Bubble now supports two modes:
1. **Simulation Mode** (default): Uses pattern-matching canned responses
2. **LLM Mode**: Integrates with OpenAI-compatible APIs using RAG (Retrieval Augmented Generation)

When LLM mode is enabled, the chat assistant uses real AI to provide context-aware responses based on complete client data from the database.

## Features

- ✅ OpenAI-compatible API support (OpenAI, Azure OpenAI, local LLMs, etc.)
- ✅ RAG implementation with full client context
- ✅ Automatic fallback to simulation mode if LLM fails
- ✅ Configurable API endpoint and model
- ✅ Seamless switching between simulation and LLM modes
- ✅ Context includes: client info, documents, onboarding stages, regulatory classifications, and tasks

## Configuration

### 1. Environment Variables

Edit the `.env` file in the `backend/` directory:

```bash
# LLM API Configuration
LLM_ENABLED=true                                    # Set to true to enable LLM mode
LLM_API_KEY=your-api-key-here                       # Your API key
LLM_API_ENDPOINT=https://api.openai.com/v1          # API endpoint (OpenAI-compatible)
LLM_MODEL=gpt-4o-mini                               # Model name
LLM_VERIFY_SSL=true                                 # Set to false for self-signed certs
LLM_STREAM=true                                     # Enable streaming responses
```

### 2. Supported Endpoints

The integration works with any OpenAI-compatible API:

**OpenAI:**
```bash
LLM_API_ENDPOINT=https://api.openai.com/v1
LLM_MODEL=gpt-4o-mini
```

**Azure OpenAI:**
```bash
LLM_API_ENDPOINT=https://your-resource.openai.azure.com/openai/deployments/your-deployment
LLM_MODEL=gpt-4
```

**Local LLM (e.g., Ollama, LM Studio):**
```bash
LLM_API_ENDPOINT=http://localhost:11434/v1
LLM_MODEL=llama2
```

**Custom Internal API (with SSL and streaming):**
```bash
LLM_API_ENDPOINT=https://your-org.com/xyz-chatbot/v1
LLM_API_KEY=your-pat-token
LLM_MODEL=XYZ
LLM_VERIFY_SSL=false  # Disable SSL verification for self-signed certs
LLM_STREAM=true       # Enable streaming
```

**Other OpenAI-compatible APIs:**
- Together AI: `https://api.together.xyz/v1`
- Anyscale: `https://api.endpoints.anyscale.com/v1`
- Any other service with OpenAI-compatible endpoints

### 3. Getting an API Key

**For OpenAI:**
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Copy the key to your `.env` file

**For other providers:**
Follow their respective documentation for obtaining API keys.

## Advanced Configuration Options

### Streaming Responses

The system supports streaming responses from the LLM API (similar to ChatGPT's typing effect):

**Enable Streaming:**
```bash
LLM_STREAM=true
```

When enabled:
- The backend collects chunks from the stream
- Returns the complete response to the frontend
- Reduces perceived latency for long responses
- Works with any OpenAI-compatible streaming API

**Disable Streaming:**
```bash
LLM_STREAM=false
```

Use non-streaming mode if your API doesn't support streaming or for simpler debugging.

### SSL Verification

For internal APIs or development environments with self-signed certificates:

**Disable SSL Verification:**
```bash
LLM_VERIFY_SSL=false
```

**Important Security Notes:**
- Only disable SSL verification for trusted internal APIs
- Never disable for public APIs
- Use proper certificates in production
- The warning `⚠️ SSL verification disabled for LLM API` will appear in logs

**Example for Internal API:**
```bash
LLM_API_ENDPOINT=https://internal-api.company.local/v1
LLM_API_KEY=internal-token
LLM_VERIFY_SSL=false  # Required for self-signed certs
```

## How It Works

### RAG (Retrieval Augmented Generation)

When you ask a question in the AI Chat Bubble:

1. **Context Fetching**: The system fetches complete client data from the database:
   - Client basic information (name, jurisdiction, entity type, etc.)
   - All uploaded documents with validation status
   - Onboarding stages and their progress
   - Regulatory classifications
   - Pending tasks

2. **Context Building**: The data is formatted into a structured text format:
   ```
   === CLIENT INFORMATION ===
   Client Name: ABC Capital Partners
   Jurisdiction: Cayman Islands
   Entity Type: Hedge Fund
   ...

   === DOCUMENTS ===
   Document: CLIENT_CONFIRMATION
     Status: validated
     Confidence: 0.95
   ...

   === ONBOARDING STAGES ===
   Stage: Document Collection
     Status: completed
   ...
   ```

3. **LLM Query**: The context is sent to the LLM along with your question as a system prompt

4. **Response**: The LLM generates a context-aware response based on real client data

### Example Queries

With RAG enabled, you can ask specific questions about client data:

- "What documents are still missing?"
- "What's the current onboarding status?"
- "Are there any compliance issues?"
- "What tasks are pending?"
- "Show me a summary of this client's progress"
- "What's blocking the onboarding process?"

The AI will reference actual data from the database in its responses.

## Testing the Integration

### 1. Enable LLM Mode

Update your `.env`:
```bash
LLM_ENABLED=true
LLM_API_KEY=sk-your-actual-api-key
LLM_API_ENDPOINT=https://api.openai.com/v1
LLM_MODEL=gpt-4o-mini
```

### 2. Restart the Backend

```bash
cd backend
./venv/bin/uvicorn app.main:app --reload
```

You should see:
```
✅ LLM client initialized: https://api.openai.com/v1 | Model: gpt-4o-mini
```

### 3. Test in the UI

1. Navigate to a client detail page
2. Click the AI Chat Bubble (purple floating button)
3. Ask a question like: "What's the onboarding status?"
4. The AI should respond with specific information from the database

### 4. Verify LLM Usage

Check the console logs - successful LLM responses will include contextual information about the client.

## Switching Between Modes

You can switch between simulation and LLM modes at any time:

**Simulation Mode** (default):
```bash
LLM_ENABLED=false
```

**LLM Mode**:
```bash
LLM_ENABLED=true
```

Changes require restarting the backend server.

## Cost Considerations

When using cloud-based LLM APIs (like OpenAI):

1. **Token Usage**: Each query sends the full client context (typically 500-2000 tokens) plus your question
2. **Recommended Models**:
   - `gpt-4o-mini`: Cost-effective, good quality
   - `gpt-3.5-turbo`: Cheaper, faster, slightly lower quality
   - `gpt-4o`: Higher quality, more expensive

3. **Cost Optimization**:
   - Start with simulation mode for development
   - Use `gpt-4o-mini` for production
   - Monitor API usage in your provider's dashboard

## Troubleshooting

### LLM Not Working

**Check 1**: Verify environment variables are set correctly
```bash
cat backend/.env | grep LLM
```

**Check 2**: Check backend logs for initialization message
```
✅ LLM client initialized: ...
```

**Check 3**: Verify API key is valid
```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $LLM_API_KEY"
```

### Fallback to Simulation

If the LLM fails, the system automatically falls back to simulation mode. Check logs for:
```
❌ LLM chat error: ...
```

Common errors:
- Invalid API key
- Network connection issues
- Rate limits exceeded
- Model not available

### Response Quality Issues

**Issue**: Generic responses
- **Solution**: Ensure `LLM_ENABLED=true` in `.env`
- **Check**: Backend logs should show LLM initialization

**Issue**: Incorrect information
- **Solution**: Verify client data exists in database
- **Check**: Query the database to ensure data is present

**Issue**: Slow responses
- **Solution**:
  - Use faster models (gpt-4o-mini instead of gpt-4)
  - Reduce context size if needed
  - Check network latency to API endpoint

## Architecture

```
User Question
    ↓
AI Chat Panel (React)
    ↓
POST /api/chat
    ↓
chat.py: fetch_full_client_data()
    ↓ (fetches all related data)
Database (SQLAlchemy)
    ↓
chat.py: ai_service.chat_with_assistant()
    ↓
ai_service.py: _chat_with_llm()
    ↓
ai_service.py: build_rag_context()
    ↓
OpenAI-compatible API
    ↓
Response with context-aware answer
```

## Security Notes

1. **API Keys**: Never commit API keys to version control
2. **Environment Files**: Add `.env` to `.gitignore`
3. **Rate Limiting**: Implement rate limiting for production use
4. **Data Privacy**: Be aware that client data is sent to the LLM provider
5. **Local LLMs**: For sensitive data, consider using local LLM deployments

## Advanced Configuration

### Custom System Prompts

Edit `ai_service.py` to customize the system prompt in `_chat_with_llm()`:

```python
system_prompt = f"""You are an AI assistant for...
[Customize this section]
"""
```

### Adjusting Context Size

Modify `build_rag_context()` in `ai_service.py` to include/exclude specific data:

```python
# Example: Limit documents to most recent 5
for doc in client_data['documents'][:5]:
    ...
```

### Adding Conversation History

The current implementation is stateless. To add conversation history:

1. Store messages in frontend state
2. Pass conversation history in the request
3. Modify `_chat_with_llm()` to include previous messages

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review backend logs for error messages
3. Verify your API provider's status page
4. Test with simulation mode to isolate issues

## Future Enhancements

Potential improvements:
- [ ] Conversation history/memory
- [ ] Streaming responses
- [ ] Multiple client comparison queries
- [ ] Custom RAG embeddings for semantic search
- [ ] Configurable context templates
- [ ] Response caching
