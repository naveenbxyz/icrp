#!/usr/bin/env python3
"""
Test script for document annotation flow
"""
import requests
import json
import os

BASE_URL = "http://localhost:8000/api"
CLIENT_ID = 1
TEST_PDF = "sample_documents/demo_registration_certificate.pdf"

print("🧪 Testing Document Annotation Flow\n")
print("=" * 60)

# Step 1: Check if backend is running
print("\n1️⃣  Checking backend connection...")
try:
    response = requests.get(f"http://localhost:8000/health")
    if response.status_code == 200:
        print("   ✅ Backend is running")
    else:
        print(f"   ❌ Backend returned status {response.status_code}")
        exit(1)
except Exception as e:
    print(f"   ❌ Cannot connect to backend: {e}")
    print("   💡 Start backend: ./venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000")
    exit(1)

# Step 2: Check if test PDF exists
print("\n2️⃣  Checking test PDF...")
if os.path.exists(TEST_PDF):
    file_size = os.path.getsize(TEST_PDF)
    print(f"   ✅ PDF found: {TEST_PDF} ({file_size} bytes)")
else:
    print(f"   ❌ PDF not found: {TEST_PDF}")
    exit(1)

# Step 3: Upload document
print("\n3️⃣  Uploading document...")
try:
    with open(TEST_PDF, 'rb') as f:
        files = {'file': ('demo.pdf', f, 'application/pdf')}
        data = {
            'document_category': 'registration_certificate',
            'uploaded_by': 'Test Script'
        }
        response = requests.post(
            f"{BASE_URL}/clients/{CLIENT_ID}/documents",
            files=files,
            data=data
        )

    if response.status_code == 200:
        doc = response.json()
        print(f"   ✅ Document uploaded successfully")
        print(f"      Document ID: {doc['id']}")
        print(f"      File path: {doc['file_path']}")
        document_id = doc['id']
    else:
        print(f"   ❌ Upload failed: {response.status_code}")
        print(f"      Response: {response.text}")
        exit(1)
except Exception as e:
    print(f"   ❌ Upload error: {e}")
    exit(1)

# Step 4: Trigger annotation
print("\n4️⃣  Triggering AI annotation...")
try:
    response = requests.post(f"{BASE_URL}/documents/{document_id}/annotate")

    if response.status_code == 200:
        result = response.json()
        print(f"   ✅ Annotation successful")
        print(f"      Annotations created: {len(result['annotations'])}")
        print(f"      Overall confidence: {result['overall_confidence']:.2f}")
        print(f"      Validation status: {result['validation_status']}")

        print(f"\n   📋 Extracted entities:")
        for ann in result['annotations']:
            print(f"      - {ann['entity_label']}: {ann['extracted_value'][:40]}...")
            print(f"        Confidence: {ann['confidence']:.2f} | Status: {ann['status']}")
    else:
        print(f"   ❌ Annotation failed: {response.status_code}")
        print(f"      Response: {response.text}")
        exit(1)
except Exception as e:
    print(f"   ❌ Annotation error: {e}")
    exit(1)

# Step 5: Retrieve annotations
print("\n5️⃣  Retrieving annotations...")
try:
    response = requests.get(f"{BASE_URL}/documents/{document_id}/annotations")

    if response.status_code == 200:
        annotations = response.json()
        print(f"   ✅ Retrieved {len(annotations)} annotations")

        # Check file accessibility
        doc_path = doc['file_path']
        full_path = f"http://localhost:8000{doc_path}"
        print(f"\n6️⃣  Checking PDF accessibility...")
        print(f"      URL: {full_path}")

        pdf_response = requests.head(full_path)
        if pdf_response.status_code == 200:
            print(f"   ✅ PDF is accessible")
        else:
            print(f"   ⚠️  PDF returned status {pdf_response.status_code}")
            print(f"      This might cause issues in the frontend!")
    else:
        print(f"   ❌ Retrieval failed: {response.status_code}")
        exit(1)
except Exception as e:
    print(f"   ❌ Retrieval error: {e}")
    exit(1)

print("\n" + "=" * 60)
print("✅ All tests passed!")
print("\n💡 Test document ID:", document_id)
print("💡 You can now test the frontend with this document")
print("\n🌐 Frontend Test:")
print(f"   1. Navigate to: http://localhost:5174/clients/{CLIENT_ID}")
print(f"   2. Click 'Documents' tab")
print(f"   3. Upload: {TEST_PDF}")
print(f"   4. The annotation viewer should open automatically")
