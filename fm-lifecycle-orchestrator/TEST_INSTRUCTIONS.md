# ✅ Testing Instructions - Document Annotation Feature

## 🔧 What Was Fixed

**Root Cause**: Backend wasn't serving uploaded PDF files via HTTP.

**Solution**: Added static file mounting in `backend/app/main.py`:
```python
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.mount("/sample_documents", StaticFiles(directory="sample_documents"), name="sample_documents")
```

**Added Features**:
- Comprehensive console logging for debugging
- Better error messages with document details
- PDF load success/failure tracking

---

## 🚀 How to Test

### Step 1: Restart Backend (IMPORTANT!)

```bash
cd backend

# Stop any running backend (Ctrl+C)

# Start fresh
./venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**You should see:**
```
ℹ️ LLM integration disabled - using simulation mode
INFO:     Started server process
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Step 2: Verify File Serving Works

**Open browser and test these URLs:**

1. Health check: http://localhost:8000/health
   - Should show: `{"status":"healthy"}`

2. Sample PDF: http://localhost:8000/sample_documents/demo_registration_certificate.pdf
   - Should **download or display the PDF**
   - If you get 404, something is wrong!

### Step 3: Start Frontend

```bash
cd frontend

# Stop any running frontend (Ctrl+C)

# Start fresh
npm run dev
```

### Step 4: Test the Full Workflow

1. **Open browser**: http://localhost:5174 (or whatever port Vite shows)

2. **Open Developer Console** (F12)
   - Go to "Console" tab
   - Keep it open to see all the debug logs

3. **Navigate to a client**: Click on any client (e.g., "Aldgate Capital Partners LLP")

4. **Go to Documents tab**

5. **Find a missing or expired document** and click "Upload"

6. **Select the demo PDF**:
   - File location: `backend/sample_documents/demo_registration_certificate.pdf`
   - Click "Open"

### Step 5: Watch the Console Logs

**You should see this sequence:**

```
📤 Starting document upload: demo_registration_certificate.pdf
📤 Uploading to backend...
✅ Document uploaded: {id: 20, file_path: "/uploads/1_20241203_..._demo.pdf", ...}
🤖 Starting AI annotation processing...
✅ Annotations created: {document_id: 20, annotations: [...], overall_confidence: 0.91, ...}
🎯 Opening annotation viewer
Document path: /uploads/1_20241203_..._demo.pdf
✅ Annotation viewer should be visible
📄 DocumentAnnotationViewer mounted
   Document ID: 20
   Document Path: /uploads/1_20241203_..._demo.pdf
🔄 Loading annotations for document: 20
   Fetching: http://localhost:8000/api/documents/20/annotations
   Response status: 200
✅ Annotations loaded: 7 items
🎨 Rendering DocumentAnnotationViewer
   Loading: false
   Error: null
   Annotations: 7
   → Showing main viewer
✅ PDF loaded successfully
   Pages: 1
```

### Step 6: What You Should See

**A large modal should appear showing:**

- 📄 Left side: PDF document with color-coded bounding boxes
- 📋 Right side: List of 7 extracted entities
- 📊 Progress bar showing "0 / 7 verified"
- Each entity has:
  - Entity label (e.g., "Client Name")
  - Extracted value
  - Confidence score
  - Color-coded badge (High/Medium/Low)
  - "Verify" button

**The highlights should be:**
- 🟢 Green borders: High confidence (≥90%)
- 🟡 Amber borders: Medium confidence (75-89%)
- 🔴 Red borders: Low confidence (<75%)

### Step 7: Interact with the Viewer

1. **Click on a highlighted box** on the PDF
   - The corresponding entity card on the right should highlight

2. **Click "Verify"** on each entity (do all 7)
   - Button changes to "✓ Verified"
   - Progress bar updates: 1/7, 2/7, ... 7/7
   - Entity card shows green checkmark

3. **After all 7 are verified**
   - "Approve Document" button turns green
   - Click it

4. **Success!**
   - Alert: "Document approved successfully!"
   - Modal closes
   - Document list refreshes
   - Document status should update

---

## 🐛 If It Still Doesn't Work

### Check 1: Backend Serving Files

```bash
# Should return PDF content (not 404)
curl -I http://localhost:8000/sample_documents/demo_registration_certificate.pdf

# Expected:
HTTP/1.1 200 OK
content-type: application/pdf
```

### Check 2: Console Errors

**Look for these errors in browser console:**

❌ **If you see:**
```
GET http://localhost:8000/uploads/... 404 (Not Found)
```
**Solution**: Backend needs restart - the static file mounting didn't take effect

❌ **If you see:**
```
Failed to load PDF document: ...
```
**Solution**: Check the PDF path in console logs. URL should be complete and valid.

❌ **If you see:**
```
Failed to load annotations: 500
```
**Solution**: Backend annotation API error - check backend console

### Check 3: Network Tab

1. Open Developer Tools → Network tab
2. Upload document
3. Look for requests to:
   - `POST /api/clients/1/documents` (should be 200)
   - `POST /api/documents/20/annotate` (should be 200)
   - `GET /api/documents/20/annotations` (should be 200)
   - `GET /uploads/1_..._demo.pdf` (should be 200 and return PDF)

If any are red (failed), click on them to see the error.

---

## 📋 Expected Behavior Summary

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Click Upload | File picker opens |
| 2 | Select PDF | Upload starts |
| 3 | Processing | "Processing document..." overlay |
| 4 | AI Processing | Takes 2-3 seconds |
| 5 | Modal Opens | Full screen with PDF + entities |
| 6 | PDF Loads | Green/amber/red boxes appear |
| 7 | Click Verify | Button changes to "✓ Verified" |
| 8 | Verify All | Progress bar reaches 100% |
| 9 | Approve | Success message, modal closes |
| 10 | List Updates | Document status changes |

---

## 🎯 Success Criteria

✅ **Working correctly if you see:**
- Processing overlay appears after upload
- Modal opens with PDF visible
- 7 colored bounding boxes on the PDF
- 7 entity cards on the right
- Can click Verify on each entity
- Can approve after all verified
- Modal closes after approval

❌ **Still broken if:**
- Blank screen after upload
- Modal opens but no PDF
- Console shows 404 for PDF
- Console shows PDF load errors
- No colored boxes on PDF
- Annotations don't load

---

## 📞 Need Help?

**Share these details:**

1. **Browser console output** (all logs from upload to modal)
2. **Network tab** (screenshot of failed requests in red)
3. **Backend console** (any error messages)
4. **Screenshot** of what you see (blank screen or partial render)

**Quick diagnostic commands:**
```bash
# Check backend is serving files
curl -I http://localhost:8000/sample_documents/demo_registration_certificate.pdf

# Check uploads directory exists
ls -la backend/uploads/

# Check backend version includes fix
grep "StaticFiles" backend/app/main.py
```

Should return:
```
from fastapi.staticfiles import StaticFiles
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
```

---

## ✅ Everything Should Work Now!

The backend is now properly configured to serve files, and the frontend has comprehensive logging for debugging. Follow the steps above and you should see the complete document annotation workflow! 🎉
