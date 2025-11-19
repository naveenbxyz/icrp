# Seed Data Customization Guide

This guide shows you exactly where to update the seed data to match your internal company data for the demo.

## Quick Reference: What You Can Customize

1. **Client Names** - Lines 79-88
2. **Legal Entity IDs** - Lines 79-88
3. **Jurisdictions** - Lines 79-88
4. **Entity Types** - Lines 79-88
5. **Client Attributes** (account_type, booking_location, product_grid) - Lines 103-247

---

## Section 1: Basic Client Information

**File**: `/Users/naveenbatchala/workspace/code/icrp/fm-lifecycle-orchestrator/backend/app/seed_data.py`

### Lines 79-88: Client Master Data

```python
clients_data = [
    # Client 1
    {
        "legal_entity_name": "Aldgate Capital Partners LLP",  # ← CHANGE: Client name
        "legal_entity_id": "LEI-GB-ACP-2019-001",           # ← CHANGE: Legal entity ID
        "jurisdiction": "GB",                                 # ← CHANGE: 2-letter country code
        "entity_type": "Limited Liability Partnership",       # ← CHANGE: Entity type
        "onboarding_status": "completed",
        "risk_tier": "Low",
        "kyc_status": "approved",
        "current_phase": "Operational",
    },
    # Client 2
    {
        "legal_entity_name": "American Retirement Trust Fund",
        "legal_entity_id": "LEI-US-ARTF-2020-045",
        "jurisdiction": "US",
        "entity_type": "Trust",
        # ... etc
    },
    # ... continue for all 10 clients
]
```

**What to change**:
- `legal_entity_name`: Full legal name of the entity
- `legal_entity_id`: Your internal LEI or entity identifier
- `jurisdiction`: Two-letter country code (GB, US, DE, KY, JP, CH, SG, AU, LU, CA, IN)
- `entity_type`: Legal structure (Limited Liability Partnership, Trust, GmbH, Fund, etc.)

**Do NOT change**:
- `onboarding_status`, `risk_tier`, `kyc_status`, `current_phase` - these drive the workflow demo

---

## Section 2: Client Attributes (Used for Regime Classification)

**File**: Same file, lines 103-247

### Lines 103-127: Client 1 Attributes (MIFID Demo)

```python
# Client 1: Professional Client - MIFID eligible
client1.client_attributes = {
    "account_type": "Professional Client",              # ← CHANGE: Account classification
    "booking_location": "London",                       # ← CHANGE: Trading desk location
    "product_grid": {
        "product_group": "Derivatives",                 # ← CHANGE: Product category
        "product_category": "OTC Derivatives",
        "product_type": "Interest Rate Swap",
        "product_status": "Approved",
        "bank_entity": "London Branch"                  # ← CHANGE: Your bank entity
    }
}
```

**Common Values for `account_type`**:
- Professional Client
- Retail Client
- Eligible Counterparty
- Per Se Professional
- Elective Professional

**Common Values for `booking_location`**:
- London
- New York
- Singapore
- Hong Kong
- Mumbai
- Frankfurt
- Tokyo

**Product Grid Structure**:
```python
"product_grid": {
    "product_group": "Derivatives" | "Cash" | "Securities",
    "product_category": "OTC Derivatives" | "Exchange Traded" | "Bonds",
    "product_type": "Interest Rate Swap" | "FX Forward" | "CDS",
    "product_status": "Approved" | "Pending" | "Restricted",
    "bank_entity": "London Branch" | "Singapore Entity" | "Mumbai Entity"
}
```

### Lines 129-151: Client 2 Attributes (Dodd-Frank Demo)

```python
# Client 2: US Person with Dodd-Frank requirements
client2.client_attributes = {
    "account_type": "Qualified Institutional Buyer",
    "booking_location": "New York",
    "product_grid": {
        "product_group": "Derivatives",
        "product_category": "OTC Derivatives",
        "product_type": "Interest Rate Swap",
        "product_status": "Approved",
        "bank_entity": "US Branch"
    }
}
```

Continue this pattern for all 10 clients (lines 103-247).

---

## Section 3: RBI-Specific Clients (India Demo)

**File**: Same file, lines 1031-1118

### Lines 1031-1055: Mumbai Client (RBI Eligible)

```python
# RBI Client 1 - ELIGIBLE for all RBI regimes
rbi_client1 = Client(
    legal_entity_name="Mumbai Financial Services Pvt Ltd",  # ← CHANGE
    legal_entity_id="LEI-IN-MFS-2021-001",                 # ← CHANGE
    jurisdiction="IN",
    entity_type="Private Limited Company",                  # ← CHANGE
    onboarding_status="completed",
    risk_tier="Medium",
    kyc_status="approved",
    current_phase="Operational"
)
```

### Lines 1057-1074: RBI Client Attributes

```python
rbi_client1.client_attributes = {
    "account_type": "Authorized Dealer Category-I",     # ← CHANGE
    "booking_location": "Mumbai",                       # ← CHANGE
    "product_grid": {
        "product_group": "FX Derivatives",
        "product_category": "Currency Derivatives",
        "product_type": "USD/INR Forward",
        "product_status": "RBI Approved",              # ← CHANGE
        "bank_entity": "Mumbai Branch"                 # ← CHANGE
    }
}
```

**RBI-Specific Values**:

`account_type`:
- Authorized Dealer Category-I
- Authorized Dealer Category-II
- Authorized Person
- Qualified Foreign Investor

`product_status` for RBI:
- RBI Approved
- Pending RBI Approval
- Not Approved

---

## Section 4: Document Metadata

**File**: Same file, lines 258-520

### Example: Client 1 Documents (Lines 258-313)

```python
# Document 1: Professional Client Attestation
doc1_1 = Document(
    client_id=client1.id,
    regime="MIFID",
    evidence_type="client_confirmation",
    document_type="attestation",
    file_name="professional_client_attestation.pdf",    # ← CHANGE: Filename
    file_path=f"/documents/client_{client1.id}/professional_client_attestation.pdf",
    file_size_bytes=245760,
    mime_type="application/pdf",
    upload_date=datetime.now() - timedelta(days=90),
    uploaded_by="compliance@aldgate.co.uk",             # ← CHANGE: Uploader email
    ocr_status="completed",
    extracted_text="This is to certify that Aldgate Capital Partners LLP...",  # ← CHANGE
    metadata={
        "document_id": "PROF-CLIENT-CERT-2024-001",     # ← CHANGE: Doc ID
        "issuer": "Aldgate Capital Partners LLP",       # ← CHANGE: Issuer
        "issue_date": "2024-01-15",
        "attestation_type": "Professional Client Status",
        "signatory": "Chief Compliance Officer",
        "verified": True
    }
)
```

**What to change**:
- `file_name`: Your actual document filename
- `uploaded_by`: Email of uploader in your system
- `extracted_text`: Sample OCR text from document
- `metadata.document_id`: Your internal document reference
- `metadata.issuer`: Entity that issued the document
- `metadata.signatory`: Person who signed

---

## Section 5: How to Apply Your Changes

### Step 1: Edit the seed_data.py file

```bash
# Open in your editor
code /Users/naveenbatchala/workspace/code/icrp/fm-lifecycle-orchestrator/backend/app/seed_data.py
```

### Step 2: Make your changes

Follow the line numbers above to update:
- Client names, LEIs, jurisdictions, entity types (lines 79-88)
- Client attributes (lines 103-247)
- RBI clients if needed (lines 1031-1118)
- Document metadata if needed (lines 258-520)

### Step 3: Delete old database and reseed

```bash
cd /Users/naveenbatchala/workspace/code/icrp/fm-lifecycle-orchestrator/backend

# Delete old database
rm fm_orchestrator.db

# Run seed script
./venv/bin/python -m app.seed_data
```

### Step 4: Restart backend server

```bash
./start.sh
```

### Step 5: Verify in UI

Open http://localhost:5173 and check:
- Client names and details appear correctly
- Client attributes show in Overview tab
- Documents appear in Document Requirements tab
- Regime qualification shows evaluated attributes

---

## Section 6: Demo-Specific Recommendations

### For Senior Management Demo

**Keep these clients for storytelling**:

1. **Client 1 (Aldgate)**: MIFID success story - completed onboarding
   - Change name/LEI to match your actual UK client
   - Shows: Professional client classification, complete docs, MIFID eligible

2. **Client 3 (Frankfurt)**: Blocked workflow example
   - Change name/LEI to match your actual DE client
   - Shows: Missing documentation causing blockage

3. **Client 6 (Zurich)**: Overdue review scenario
   - Change name/LEI to match your actual CH client
   - Shows: Review milestone overdue, escalation needed

4. **Client 7 (Singapore)**: MAS multi-regime demo
   - Change name/LEI to match your actual SG client
   - Shows: Multiple MAS regimes (Margin, Clearing, Reporting, FAIR)

5. **RBI Client 1 (Mumbai)**: India regulatory compliance
   - Change name/LEI to match your actual IN client
   - Shows: Rule-based classification with product grid approval

### Recommended Demo Flow

1. **Dashboard Overview**: Show all clients, filter by status
2. **Client 1 Details**: Show completed journey with MIFID compliance
3. **Client Attributes**: Highlight how attributes drive regime classification
4. **Document Requirements**: Show uploaded docs linked to evidence requirements
5. **Regime Qualification**: Show rule evaluation with client attributes
6. **RBI Client**: Show India-specific rule-based approval workflow

---

## Section 7: Quick Checklist Before Demo

- [ ] Updated client names to match internal data
- [ ] Updated LEIs to match internal identifiers
- [ ] Updated jurisdictions to match actual client locations
- [ ] Updated entity types to match legal structures
- [ ] Verified client attributes reflect actual business rules
- [ ] Deleted old database: `rm fm_orchestrator.db`
- [ ] Reseeded with new data: `./venv/bin/python -m app.seed_data`
- [ ] Restarted backend server: `./start.sh`
- [ ] Tested UI at http://localhost:5173
- [ ] Verified documents appear in Document Requirements tab
- [ ] Verified client attributes show in Overview and Regime tabs

---

## Need Help?

If you encounter any issues:

1. Check backend logs: The terminal running `./start.sh`
2. Check frontend logs: The terminal running `npm run dev`
3. Verify database was deleted before reseeding
4. Ensure venv is activated when running seed script
5. Check that all required fields are present in clients_data array

---

**Last Updated**: 2025-11-19
**File Location**: `/Users/naveenbatchala/workspace/code/icrp/fm-lifecycle-orchestrator/backend/app/seed_data.py`
