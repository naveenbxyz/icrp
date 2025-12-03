# 🐛 Debugging Guide: Blank Screen Issue

## Quick Diagnosis Steps

### Step 1: Check Browser Console

**Open your browser's developer console** (F12 or Right-click → Inspect → Console)

Look for these log messages after uploading a document:

```
Expected console output:
📤 Starting document upload: demo_registration_certificate.pdf
📤 Uploading to backend...
✅ Document uploaded: {id: 20, file_path: ...}
🤖 Starting AI annotation processing...
✅ Annotations created: {...}
🎯 Opening annotation viewer
Document path: /uploads/...
✅ Annotation viewer should be visible
📄 DocumentAnnotationViewer mounted
   Document ID: 20
   Document Path: /uploads/...
🔄 Loading annotations for document: 20
   Fetching: http://localhost:8000/api/documents/20/annotations
   Response status: 200
✅ Annotations loaded: 7 items
🎨 Rendering DocumentAnnotationViewer
   Loading: false
   Error: null
   Annotations: 7
   → Showing main viewer
```

### Step 2: Check for Errors

**Look for these common errors:**

❌ **CORS Error**
```
Access to fetch at 'http://localhost:8000/...' from origin 'http://localhost:5174'
has been blocked by CORS policy
```
**Solution**: Backend CORS should be configured, but check backend logs

❌ **Network Error**
```
Failed to fetch
```
**Solution**: Make sure backend is running on port 8000

❌ **404 Not Found**
```
GET http://localhost:8000/uploads/... 404 (Not Found)
```
**Solution**: File path issue - check backend file serving

❌ **PDF.js Worker Error**
```
Setting up fake worker failed: "Cannot read properties of undefined"
```
**Solution**: PDF.js worker not loading - check network tab

---

## Step-by-Step Debugging

### 1. Verify Backend is Running

```bash
cd backend
./venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**Expected output:**
```
ℹ️ LLM integration disabled - using simulation mode
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**Test backend:**
```bash
curl http://localhost:8000/health
```

Should return: `{"status":"healthy"}`

### 2. Verify Frontend is Running

```bash
cd frontend
npm run dev
```

**Expected output:**
```
VITE v5.4.20  ready in 121 ms
➜  Local:   http://localhost:5174/
```

### 3. Check File Upload API

**Open browser console and run:**
```javascript
// Test document upload
const formData = new FormData();
const file = new Blob(['test'], { type: 'application/pdf' });
formData.append('file', file, 'test.pdf');
formData.append('document_category', 'registration_certificate');
formData.append('uploaded_by', 'Test');

fetch('http://localhost:8000/api/clients/1/documents', {
  method: 'POST',
  body: formData
}).then(r => r.json()).then(console.log);
```

### 4. Check if Uploaded File is Accessible

**After upload, check if the file URL works:**

In browser console, check the document path logged, then try:
```javascript
fetch('http://localhost:8000/uploads/1_20241203_120000_demo.pdf')
  .then(r => console.log('File accessible:', r.status));
```

### 5. Check Backend File Serving

The backend needs to serve the uploaded files. Check `app/main.py`:

```python
from fastapi.staticfiles import StaticFiles

# Should have this:
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
```

---

## Common Issues & Solutions

### Issue 1: Backend Not Serving Files

**Symptom**: PDF URL returns 404

**Check**:
```bash
ls -la backend/uploads/
```

**Solution**: Add static file mounting to `backend/app/main.py`:

```python
from fastapi.staticfiles import StaticFiles
import os

# Create uploads directory if it doesn't exist
os.makedirs("uploads", exist_ok=True)

# Mount static files
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
```

### Issue 2: PDF.js Worker Not Loading

**Symptom**: Blank screen, console shows worker error

**Check browser Network tab** for: `pdf.worker.min.mjs`

**Solution**: Already fixed in code, but verify:
```tsx
// In DocumentAnnotationViewer.tsx
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();
```

### Issue 3: Annotation Modal Not Showing

**Symptom**: Upload completes but nothing happens

**Debug**:
1. Check browser console for "Opening annotation viewer" message
2. Check if `showAnnotationViewer` state is true
3. Check if `currentDocument` state has correct values

**Solution**: Add to browser console:
```javascript
// In React DevTools or console
// Check component state
```

### Issue 4: React Component Error

**Symptom**: Blank screen with no console errors

**Check**: React Developer Tools (install browser extension)
- Look for component errors
- Check if DocumentAnnotationViewer is mounted

---

## Manual Testing Steps

### Test 1: Upload a Document

1. Navigate to: `http://localhost:5174/clients/1`
2. Click "Documents" tab
3. Click "Upload" on any missing/expired document
4. Select: `backend/sample_documents/demo_registration_certificate.pdf`
5. **Watch console logs** - you should see all the emoji-prefixed messages

### Test 2: Check API Directly

**Open new browser tab and go to:**
```
http://localhost:8000/docs
```

1. Find `POST /api/documents/{document_id}/annotate`
2. Click "Try it out"
3. Enter document_id: 19 (or any uploaded document)
4. Click "Execute"
5. Should return 200 with annotations

### Test 3: Check Annotations API

```
http://localhost:8000/api/documents/19/annotations
```

Should return array of 7 annotations

---

## Debug Checklist

- [ ] Backend running on port 8000
- [ ] Frontend running on port 5174
- [ ] Browser console open (F12)
- [ ] React DevTools installed
- [ ] Network tab open to check requests
- [ ] Backend serves files from `/uploads`
- [ ] Sample PDF exists in `backend/sample_documents/`
- [ ] No CORS errors in console
- [ ] No 404 errors for PDF or annotations
- [ ] No red errors in console
- [ ] Log messages appear when uploading

---

## Get Full Debug Logs

**Run these commands and share the output:**

```bash
# 1. Check backend status
cd backend
curl http://localhost:8000/health

# 2. List uploaded files
ls -la uploads/

# 3. Test annotation on existing document
curl -X POST http://localhost:8000/api/documents/19/annotate

# 4. Get annotations
curl http://localhost:8000/api/documents/19/annotations

# 5. Check if sample PDF is accessible
curl -I http://localhost:8000/sample_documents/demo_registration_certificate.pdf
```

---

## Still Having Issues?

**Share this information:**

1. **Browser console output** (all logs when uploading)
2. **Network tab** (any failed requests in red)
3. **Backend console output** (any errors when processing)
4. **Screenshot** of the blank screen
5. **React DevTools** component tree (if DocumentAnnotationViewer is visible)

---

## Quick Fix: Force Show Modal

**Temporary test to see if modal works:**

Add this to browser console after page loads:
```javascript
// Force show the modal for testing
document.body.innerHTML += `
<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
  <div class="bg-white p-8 rounded">
    <h1>Test Modal</h1>
    <p>If you see this, the modal rendering works!</p>
  </div>
</div>
`;
```

If you see the modal, the issue is with state management or props, not CSS/rendering.
