# Client Data Reference Guide

## Overview
This document provides a comprehensive reference for the 13 sample clients in the FM Lifecycle Orchestrator system. It outlines each client's profile, attributes, regime eligibility, data quality scores, and intended use case for demonstration purposes.

---

## Client Summary Table

| ID | Name | Jurisdiction | Onboarding Status | Attributes | Regimes | Data Quality | Use Case |
|----|------|--------------|-------------------|------------|---------|--------------|----------|
| 1 | Aldgate Capital Partners LLP | UK | COMPLETED | ✅ | 5 eligible | 90-100% (Excellent) | Complete lifecycle demo |
| 2 | American Retirement Trust Fund | US | IN_PROGRESS | ✅ | TBD | 70-89% (Good) | Mid-stage processing |
| 3 | Global Structured Finance GmbH | Germany | BLOCKED | ❌ | 0 | N/A | Blocked workflow demo |
| 4 | Cayman Investment Holdings | Cayman Islands | INITIATED | ❌ | 0 | N/A | Early lifecycle stage |
| 5 | Tokyo International Bank Ltd | Japan | IN_PROGRESS | ✅ | TBD | 70-89% (Good) | Multi-framework client |
| 6 | Zurich Family Office AG | Switzerland | IN_PROGRESS | ✅ | TBD | 50-69% (Fair) | Overdue review demo |
| 7 | Singapore Strategic Investment Fund | Singapore | COMPLETED | ✅ | 6 eligible | 90-100% (Excellent) | Sovereign wealth fund |
| 8 | Melbourne Retirement Super Fund | Australia | IN_PROGRESS | ✅ | TBD | 70-89% (Good) | Superannuation fund |
| 9 | European Growth Fund SICAV | Luxembourg | IN_PROGRESS | ✅ | TBD | 70-89% (Good) | UCITS fund |
| 10 | Toronto Life & General Insurance Co | Canada | INITIATED | ✅ | TBD | 50-69% (Fair) | Insurance company |
| 11 | Mumbai Financial Services Pvt Ltd | India | IN_PROGRESS | ✅ | 1 eligible (RBI) | 90-100% (Excellent) | RBI fully eligible |
| 12 | Delhi Investment Fund | India | IN_PROGRESS | ✅ | 0 (partial) | 50-69% (Fair) | RBI partial eligibility |
| 13 | Bangalore Private Wealth Management | India | INITIATED | ❌ | 0 | N/A | RBI out of scope |

---

## Detailed Client Profiles

### Client 1: Aldgate Capital Partners LLP
**Profile:**
- **Entity Type:** Limited Liability Partnership
- **Jurisdiction:** United Kingdom
- **Onboarding Status:** COMPLETED
- **Relationship Manager:** Sarah Johnson
- **Created Date:** 90 days ago

**Client Attributes:**
```json
{
  "account_type": "subfund",
  "booking_location": "UK/London",
  "product_grid": {
    "product_group": "financial_markets",
    "product_category": "fx",
    "product_type": "forward",
    "product_status": "approved",
    "bank_entity": "UK/London"
  }
}
```

**Regime Eligibility:**
- EMIR_FC (Eligible) - Financial Counterparty
- UK_MiFID_PC (Eligible) - Professional Client
- SFTR (Eligible) - SFTR reporting
- US_DF_SD (Eligible) - Swap Dealer
- Stays Exempt (Eligible)

**Data Quality:** 90-100% (Excellent) - All documents compliant, complete lifecycle

**Document Status:** All mandatory documents uploaded and compliant

**Use Case:** Demonstrates complete client lifecycle from initiation to completion with all regimes evaluated

---

### Client 2: American Retirement Trust Fund
**Profile:**
- **Entity Type:** Corporate Pension Fund
- **Jurisdiction:** United States
- **Onboarding Status:** IN_PROGRESS (SSI Validation stage)
- **Relationship Manager:** Michael Chen
- **Created Date:** 45 days ago

**Client Attributes:**
```json
{
  "account_type": "trading_entity",
  "booking_location": "US/NewYork",
  "product_grid": {
    "product_group": "financial_markets",
    "product_category": "interest_rate",
    "product_type": "swap",
    "product_status": "approved",
    "bank_entity": "US/NewYork"
  }
}
```

**Regime Eligibility:** Will be evaluated for US Dodd-Frank, MiFID, EMIR

**Data Quality:** 70-89% (Good) - Some documents pending

**Legacy Classification:** Dodd-Frank - Eligible Contract Participant (ECP)

**Use Case:** Mid-stage onboarding with US-focused products

---

### Client 3: Global Structured Finance GmbH
**Profile:**
- **Entity Type:** Asset Management Company
- **Jurisdiction:** Germany
- **Onboarding Status:** BLOCKED (missing documentation)
- **Relationship Manager:** Klaus Werner
- **Created Date:** 55 days ago

**Client Attributes:** ❌ None (intentionally sparse)

**Regime Eligibility:** None - blocked due to missing documentation

**Data Quality:** N/A - Cannot evaluate without attributes

**Blocked Reason:** Missing critical KYC documentation

**Use Case:** Demonstrates blocked workflow due to incomplete documentation

---

### Client 4: Cayman Investment Holdings
**Profile:**
- **Entity Type:** Special Purpose Vehicle (SPV)
- **Jurisdiction:** Cayman Islands
- **Onboarding Status:** INITIATED (just started)
- **Relationship Manager:** Jennifer Smith
- **Created Date:** 2 days ago

**Client Attributes:** ❌ None (intentionally sparse - early stage)

**Regime Eligibility:** None - too early in lifecycle

**Data Quality:** N/A - Early stage

**Use Case:** Demonstrates very early lifecycle stage with minimal data

---

### Client 5: Tokyo International Bank Ltd
**Profile:**
- **Entity Type:** Credit Institution
- **Jurisdiction:** Japan
- **Onboarding Status:** IN_PROGRESS (Valuation Setup)
- **Relationship Manager:** Yuki Tanaka
- **Created Date:** 60 days ago

**Client Attributes:**
```json
{
  "account_type": "trading_entity",
  "booking_location": "Japan/Tokyo",
  "product_grid": {
    "product_group": "financial_markets",
    "product_category": "credit",
    "product_type": "swap",
    "product_status": "approved",
    "bank_entity": "Japan/Tokyo"
  }
}
```

**Regime Eligibility:** Will be evaluated for MiFID, EMIR, Dodd-Frank

**Data Quality:** 70-89% (Good)

**Legacy Classifications:**
- MiFID II - Professional Client (Per Se)
- EMIR - Financial Counterparty
- Dodd-Frank - Swap Dealer

**Use Case:** Multi-framework financial institution with complex classification needs

---

### Client 6: Zurich Family Office AG
**Profile:**
- **Entity Type:** Family Office
- **Jurisdiction:** Switzerland
- **Onboarding Status:** IN_PROGRESS (Reg Classification - overdue)
- **Relationship Manager:** Anna Müller
- **Created Date:** 180 days ago

**Client Attributes:**
```json
{
  "account_type": "subfund",
  "booking_location": "Switzerland/Zurich",
  "product_grid": {
    "product_group": "financial_markets",
    "product_category": "fx",
    "product_type": "option",
    "product_status": "pending_approval",
    "bank_entity": "Switzerland/Zurich"
  }
}
```

**Regime Eligibility:** Pending evaluation (product approval required)

**Data Quality:** 50-69% (Fair) - Review overdue, product approval pending

**Legacy Classification:** MiFID II - Elective Professional Client (OVERDUE REVIEW!)

**Use Case:** Demonstrates overdue annual review scenario

---

### Client 7: Singapore Strategic Investment Fund
**Profile:**
- **Entity Type:** Sovereign Wealth Fund
- **Jurisdiction:** Singapore
- **Onboarding Status:** COMPLETED
- **Relationship Manager:** Li Wei
- **Created Date:** 120 days ago

**Client Attributes:**
```json
{
  "account_type": "subfund",
  "booking_location": "Singapore/DBS",
  "product_grid": {
    "product_group": "financial_markets",
    "product_category": "interest_rate",
    "product_type": "swap",
    "product_status": "approved",
    "bank_entity": "Singapore/DBS"
  }
}
```

**Regime Eligibility:**
- MAS Margin Rules (Eligible)
- MAS Clearing (Eligible)
- MAS Transaction Reporting (Eligible)
- ASIC TR (Eligible)
- MiFID (Eligible)
- Stays Exempt (Eligible)

**Data Quality:** 90-100% (Excellent) - All compliant

**Use Case:** Sovereign wealth fund with Asia-Pacific focus, demonstrates MAS regulatory requirements

---

### Client 8: Melbourne Retirement Super Fund
**Profile:**
- **Entity Type:** Superannuation Fund
- **Jurisdiction:** Australia
- **Onboarding Status:** IN_PROGRESS (Static Data Enrichment)
- **Relationship Manager:** Sophie Anderson
- **Created Date:** 25 days ago

**Client Attributes:**
```json
{
  "account_type": "subfund",
  "booking_location": "Australia/Sydney",
  "product_grid": {
    "product_group": "financial_markets",
    "product_category": "interest_rate",
    "product_type": "forward",
    "product_status": "approved",
    "bank_entity": "Australia/Sydney"
  }
}
```

**Regime Eligibility:** Will be evaluated for ASIC, MiFID

**Data Quality:** 70-89% (Good)

**Use Case:** Australian pension fund demonstrating APAC regulatory requirements

---

### Client 9: European Growth Fund SICAV
**Profile:**
- **Entity Type:** SICAV (UCITS fund)
- **Jurisdiction:** Luxembourg
- **Onboarding Status:** IN_PROGRESS (SSI Validation)
- **Relationship Manager:** Pierre Dubois
- **Created Date:** 40 days ago

**Client Attributes:**
```json
{
  "account_type": "subfund",
  "booking_location": "Luxembourg/Luxembourg",
  "product_grid": {
    "product_group": "financial_markets",
    "product_category": "fx",
    "product_type": "swap",
    "product_status": "approved",
    "bank_entity": "Luxembourg/Luxembourg"
  }
}
```

**Regime Eligibility:** Will be evaluated for MiFID, EMIR, SFTR

**Data Quality:** 70-89% (Good)

**Legacy Classifications:**
- MiFID II - Professional Client
- EMIR - Financial Counterparty

**Use Case:** UCITS fund with pan-European regulatory requirements

---

### Client 10: Toronto Life & General Insurance Co
**Profile:**
- **Entity Type:** Insurance Company
- **Jurisdiction:** Canada
- **Onboarding Status:** INITIATED (Reg Classification)
- **Relationship Manager:** Robert MacDonald
- **Created Date:** 7 days ago

**Client Attributes:**
```json
{
  "account_type": "trading_entity",
  "booking_location": "Canada/Toronto",
  "product_grid": {
    "product_group": "financial_markets",
    "product_category": "credit",
    "product_type": "forward",
    "product_status": "approved",
    "bank_entity": "Canada/Toronto"
  }
}
```

**Regime Eligibility:** Will be evaluated for MiFID, EMIR, Dodd-Frank

**Data Quality:** 50-69% (Fair) - Early stage, limited documentation

**Use Case:** Insurance company with credit derivatives exposure

---

### Client 11: Mumbai Financial Services Pvt Ltd
**Profile:**
- **Entity Type:** Private Limited Company
- **Jurisdiction:** India
- **Onboarding Status:** IN_PROGRESS (Reg Classification)
- **Relationship Manager:** Rajesh Kumar
- **Created Date:** 15 days ago

**Client Attributes:**
```json
{
  "account_type": "trading_entity",
  "booking_location": "India/HDFC",
  "product_grid": {
    "product_group": "financial_markets",
    "product_category": "fx",
    "product_type": "forward",
    "product_status": "approved",
    "bank_entity": "India/HDFC"
  }
}
```

**Regime Eligibility:**
- **RBI** (Eligible) - Meets all 3 classification rules

**Data Quality:** 90-100% (Excellent) - Full RBI compliance

**Use Case:** Demonstrates RBI regime fully eligible client with all rules matched

---

### Client 12: Delhi Investment Fund
**Profile:**
- **Entity Type:** Investment Fund
- **Jurisdiction:** India
- **Onboarding Status:** IN_PROGRESS (Reg Classification)
- **Relationship Manager:** Priya Sharma
- **Created Date:** 20 days ago

**Client Attributes:**
```json
{
  "account_type": "subfund",
  "booking_location": "India/ICICI",
  "product_grid": {
    "product_group": "financial_markets",
    "product_category": "interest_rate",
    "product_type": "swap",
    "product_status": "pending_approval",  // ❌ Not approved
    "bank_entity": "India/ICICI"
  }
}
```

**Regime Eligibility:**
- **RBI** (NOT Eligible) - Fails product approval rule

**Data Quality:** 50-69% (Fair) - Missing product approval

**Use Case:** Demonstrates RBI regime partial eligibility (fails 1 of 3 rules)

---

### Client 13: Bangalore Private Wealth Management
**Profile:**
- **Entity Type:** Private Banking
- **Jurisdiction:** India
- **Onboarding Status:** INITIATED
- **Relationship Manager:** Arun Reddy
- **Created Date:** 10 days ago

**Client Attributes:** ❌ None (intentionally sparse)

**Regime Eligibility:**
- **RBI** (NOT Eligible) - Out of scope (private banking excluded)

**Data Quality:** N/A

**Use Case:** Demonstrates RBI out-of-scope scenario

---

## Data Quality Score Distribution

### Excellent (90-100%)
- **Client 1:** Aldgate Capital Partners LLP
- **Client 7:** Singapore Strategic Investment Fund
- **Client 11:** Mumbai Financial Services Pvt Ltd

### Good (70-89%)
- **Client 2:** American Retirement Trust Fund
- **Client 5:** Tokyo International Bank Ltd
- **Client 8:** Melbourne Retirement Super Fund
- **Client 9:** European Growth Fund SICAV

### Fair (50-69%)
- **Client 6:** Zurich Family Office AG
- **Client 10:** Toronto Life & General Insurance Co
- **Client 12:** Delhi Investment Fund

### Sparse (Intentionally Incomplete)
- **Client 3:** Global Structured Finance GmbH (blocked)
- **Client 4:** Cayman Investment Holdings (early stage)
- **Client 13:** Bangalore Private Wealth Management (out of scope)

---

## Regime Coverage

### Global Regimes
- **EMIR_FC** (European Market Infrastructure Regulation - Financial Counterparty)
- **UK_MiFID_PC** (UK MiFID II - Professional Client)
- **SFTR** (Securities Financing Transactions Regulation)
- **US_DF_SD** (US Dodd-Frank - Swap Dealer)
- **Stays Exempt** (Stay Regulations Exemption)
- **MIFID** (Markets in Financial Instruments Directive)

### Asia-Pacific Regimes
- **MAS Margin Rules** (Monetary Authority of Singapore)
- **MAS Clearing**
- **MAS Transaction Reporting**
- **ASIC TR** (Australian Securities & Investments Commission)

### India-Specific Regime
- **RBI** (Reserve Bank of India) - 3 classification rules:
  1. Account Type Eligibility
  2. Booking Location Requirement (India banks only)
  3. Product Grid Approval

---

## Testing Scenarios

### Complete Lifecycle
Use **Client 1** or **Client 7** to test complete onboarding workflow from initiation to completion

### Mid-Stage Processing
Use **Client 2, 5, 8, or 9** to test various in-progress stages

### Blocked Workflow
Use **Client 3** to test blocked client handling and task management

### Early Stage
Use **Client 4** or **Client 13** to test initial onboarding steps

### Overdue Reviews
Use **Client 6** to test annual review reminders and overdue handling

### RBI Regime Testing
- **Fully Eligible:** Client 11
- **Partially Eligible:** Client 12
- **Out of Scope:** Client 13

### Multi-Framework Complexity
Use **Client 5** (Japanese Bank) to test clients with multiple regulatory frameworks

---

## Notes

1. **Attribute-Based Evaluation:** 10 clients have complete attributes for rule-based regime evaluation
2. **Lifecycle Diversity:** Clients span all onboarding stages (INITIATED, IN_PROGRESS, COMPLETED, BLOCKED)
3. **Geographic Coverage:** Clients cover 13 different jurisdictions across EMEA, Americas, and APAC
4. **Entity Type Variety:** Includes hedge funds, pension funds, banks, family offices, SWFs, insurance companies, and more
5. **Data Quality Variability:** Intentional variation in data quality scores to demonstrate different scenarios

---

**Last Updated:** 2025
**Version:** 1.0
