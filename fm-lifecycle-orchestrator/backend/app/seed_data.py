"""Generate mock data for the FM Client Lifecycle Orchestrator"""
from datetime import datetime, timedelta
from .database import SessionLocal, engine, Base
from .models.client import Client, OnboardingStatus
from .models.onboarding_stage import OnboardingStage, StageStatus, StageName
from .models.regulatory_classification import RegulatoryClassification, RegulatoryFramework, ValidationStatus
from .models.document import Document, DocumentCategory, OCRStatus
from .models.task import Task, TaskStatus, TaskType
from .models.classification_rule import ClassificationRule
from .models.regime_eligibility import RegimeEligibility
from .models.mandatory_evidence import MandatoryEvidence, EvidenceCategory
from .models.document_requirement import DocumentRequirement
from .services.classification_engine import ClassificationEngine


def clear_database():
    """Clear all data from database"""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def create_onboarding_stages(db, client_id: int, stages_config: list):
    """Helper to create onboarding stages"""
    # Default target TATs (in hours) for each stage
    default_target_tats = {
        StageName.LEGAL_ENTITY_SETUP: 120,  # 5 days
        StageName.REG_CLASSIFICATION: 240,  # 10 days
        StageName.FM_ACCOUNT_REQUEST: 360,  # 15 days
        StageName.STATIC_DATA_ENRICHMENT: 240,  # 10 days
        StageName.SSI_VALIDATION: 360,  # 15 days
        StageName.VALUATION_SETUP: 240  # 10 days
    }

    stages = []
    for idx, config in enumerate(stages_config):
        stage_name = config["name"]
        stage = OnboardingStage(
            client_id=client_id,
            stage_name=stage_name,
            status=config["status"],
            assigned_team=config.get("assigned_team"),
            started_date=config.get("started_date"),
            completed_date=config.get("completed_date"),
            notes=config.get("notes"),
            order=idx,
            target_tat_hours=config.get("target_tat_hours", default_target_tats.get(stage_name, 240))
        )

        # Calculate TAT if stage has started
        if stage.started_date:
            stage.calculate_tat()

        stages.append(stage)
        db.add(stage)
    return stages


def seed_data():
    """Seed database with mock data"""
    db = SessionLocal()

    try:
        print("Clearing existing data...")
        clear_database()

        print("Creating clients and onboarding data...")

        # Client 1: UK Hedge Fund - Completed
        client1 = Client(
            name="Aldgate Capital Partners LLP",
            legal_entity_id="SX001234",
            country_of_incorporation="United Kingdom",
            entity_type="Limited Liability Partnership",
            onboarding_status=OnboardingStatus.COMPLETED,
            assigned_rm="Sarah Johnson",
            created_date=datetime.now() - timedelta(days=90),
            client_attributes={
                "account_type": "subfund",
                "booking_location": "UK/London",
                "product": "FX Forwards",
                "product_grid": {
                    "product_group": "financial_markets",
                    "product_category": "fx",
                    "product_type": "forward",
                    "product_status": "approved",
                    "bank_entity": "UK/London"
                }
            }
        )
        db.add(client1)
        db.flush()

        create_onboarding_stages(db, client1.id, [
            {"name": StageName.LEGAL_ENTITY_SETUP, "status": StageStatus.COMPLETED, "assigned_team": "Entity Management",
             "started_date": datetime.now() - timedelta(days=90), "completed_date": datetime.now() - timedelta(days=85)},
            {"name": StageName.REG_CLASSIFICATION, "status": StageStatus.COMPLETED, "assigned_team": "Compliance",
             "started_date": datetime.now() - timedelta(days=85), "completed_date": datetime.now() - timedelta(days=75)},
            {"name": StageName.FM_ACCOUNT_REQUEST, "status": StageStatus.COMPLETED, "assigned_team": "FM Operations",
             "started_date": datetime.now() - timedelta(days=75), "completed_date": datetime.now() - timedelta(days=60)},
            {"name": StageName.STATIC_DATA_ENRICHMENT, "status": StageStatus.COMPLETED, "assigned_team": "FM Ops - Data",
             "started_date": datetime.now() - timedelta(days=60), "completed_date": datetime.now() - timedelta(days=45)},
            {"name": StageName.SSI_VALIDATION, "status": StageStatus.COMPLETED, "assigned_team": "SSI Team",
             "started_date": datetime.now() - timedelta(days=45), "completed_date": datetime.now() - timedelta(days=30)},
            {"name": StageName.VALUATION_SETUP, "status": StageStatus.COMPLETED, "assigned_team": "Valuation Team",
             "started_date": datetime.now() - timedelta(days=30), "completed_date": datetime.now() - timedelta(days=20)}
        ])

        reg1 = RegulatoryClassification(
            client_id=client1.id,
            framework=RegulatoryFramework.MIFID_II,
            classification="Professional Client",
            classification_date=datetime.now() - timedelta(days=80),
            last_review_date=datetime.now() - timedelta(days=80),
            next_review_date=datetime.now() + timedelta(days=285),
            validation_status=ValidationStatus.VALIDATED
        )
        db.add(reg1)

        # Add realistic documents for Client1 (completed client) - Full lifecycle demonstration
        print("  Creating documents for Client1 (Aldgate Capital Partners)...")

        # COMPLIANT DOCUMENTS
        doc1_1 = Document(
            client_id=client1.id,
            regulatory_classification_id=reg1.id,
            filename="Professional_Client_Attestation_Aldgate_2024.pdf",
            file_path="/uploads/client1/professional_client_attestation.pdf",
            file_type="application/pdf",
            upload_date=datetime.now() - timedelta(days=85),
            uploaded_by="Sarah Johnson",
            document_category=DocumentCategory.CLIENT_CONFIRMATION,
            ocr_status=OCRStatus.COMPLETED,
            extracted_text="Professional Client Attestation - Aldgate Capital Partners LLP confirms status as Professional Client under MiFID II..."
        )
        db.add(doc1_1)

        doc1_2 = Document(
            client_id=client1.id,
            regulatory_classification_id=reg1.id,
            filename="Entity_Registration_Certificate_UK_2024.pdf",
            file_path="/uploads/client1/registration_certificate.pdf",
            file_type="application/pdf",
            upload_date=datetime.now() - timedelta(days=80),
            uploaded_by="Sarah Johnson",
            document_category=DocumentCategory.ENTITY_DOCUMENTATION,
            ocr_status=OCRStatus.COMPLETED,
            extracted_text="Certificate of Registration - Companies House UK - Aldgate Capital Partners LLP, Registration Number: OC123456..."
        )
        db.add(doc1_2)

        doc1_3 = Document(
            client_id=client1.id,
            regulatory_classification_id=reg1.id,
            filename="Board_Resolution_Trading_Authorization_2024.pdf",
            file_path="/uploads/client1/board_resolution.pdf",
            file_type="application/pdf",
            upload_date=datetime.now() - timedelta(days=80),
            uploaded_by="Sarah Johnson",
            document_category=DocumentCategory.CLIENT_CONFIRMATION,
            ocr_status=OCRStatus.COMPLETED,
            extracted_text="Board Resolution authorizing financial markets trading activities..."
        )
        db.add(doc1_3)

        doc1_4 = Document(
            client_id=client1.id,
            regulatory_classification_id=reg1.id,
            filename="Financial_Statements_FY2023_Audited.pdf",
            file_path="/uploads/client1/financial_statements_2023.pdf",
            file_type="application/pdf",
            upload_date=datetime.now() - timedelta(days=75),
            uploaded_by="Sarah Johnson",
            document_category=DocumentCategory.FINANCIAL_STATEMENTS,
            ocr_status=OCRStatus.COMPLETED,
            extracted_text="Audited Financial Statements for Year Ending December 31, 2023..."
        )
        db.add(doc1_4)

        doc1_5 = Document(
            client_id=client1.id,
            regulatory_classification_id=reg1.id,
            filename="KYC_Documentation_Package_Complete.pdf",
            file_path="/uploads/client1/kyc_package.pdf",
            file_type="application/pdf",
            upload_date=datetime.now() - timedelta(days=85),
            uploaded_by="Sarah Johnson",
            document_category=DocumentCategory.CLIENT_CONFIRMATION,
            ocr_status=OCRStatus.COMPLETED,
            extracted_text="Know Your Customer documentation package including identity verification, beneficial ownership..."
        )
        db.add(doc1_5)

        # EXPIRED DOCUMENTS (to demonstrate expiry workflow)
        doc1_6 = Document(
            client_id=client1.id,
            regulatory_classification_id=reg1.id,
            filename="Risk_Disclosure_Statement_2023.pdf",
            file_path="/uploads/client1/risk_disclosure_expired.pdf",
            file_type="application/pdf",
            upload_date=datetime.now() - timedelta(days=200),  # Uploaded 200 days ago, expired
            uploaded_by="Sarah Johnson",
            document_category=DocumentCategory.PRODUCT_ELIGIBILITY,
            ocr_status=OCRStatus.COMPLETED,
            extracted_text="Risk Disclosure Statement - Client acknowledges understanding of derivative trading risks..."
        )
        db.add(doc1_6)

        doc1_7 = Document(
            client_id=client1.id,
            regulatory_classification_id=reg1.id,
            filename="Product_Approval_Matrix_Q1_2024.pdf",
            file_path="/uploads/client1/product_approval_expired.pdf",
            file_type="application/pdf",
            upload_date=datetime.now() - timedelta(days=100),  # Uploaded 100 days ago, expired
            uploaded_by="Sarah Johnson",
            document_category=DocumentCategory.PRODUCT_ELIGIBILITY,
            ocr_status=OCRStatus.COMPLETED,
            extracted_text="Product Approval Matrix - Approved products: FX Forwards, Interest Rate Swaps..."
        )
        db.add(doc1_7)

        # PENDING REVIEW DOCUMENTS (recently uploaded, awaiting validation)
        doc1_8 = Document(
            client_id=client1.id,
            regulatory_classification_id=reg1.id,
            filename="Financial_Statements_FY2024_Q3_Unaudited.pdf",
            file_path="/uploads/client1/financial_statements_2024_q3.pdf",
            file_type="application/pdf",
            upload_date=datetime.now() - timedelta(days=2),
            uploaded_by="Sarah Johnson",
            document_category=DocumentCategory.FINANCIAL_STATEMENTS,
            ocr_status=OCRStatus.PROCESSING,
            extracted_text=None  # Still processing
        )
        db.add(doc1_8)

        doc1_9 = Document(
            client_id=client1.id,
            regulatory_classification_id=reg1.id,
            filename="Director_Identification_Updated_2024.pdf",
            file_path="/uploads/client1/director_id_2024.pdf",
            file_type="application/pdf",
            upload_date=datetime.now() - timedelta(days=3),
            uploaded_by="Sarah Johnson",
            document_category=DocumentCategory.CLIENT_CONFIRMATION,
            ocr_status=OCRStatus.COMPLETED,
            extracted_text="Updated director identification documents for all managing partners..."
        )
        db.add(doc1_9)

        # Add RegimeEligibility records for Client1 (demonstrate rule-based assessment)
        # Only showing the 3 regimes that have been evaluated and are relevant
        print("  Creating regime eligibility records for Client1...")

        # MIFID - Eligible
        elig1_1 = RegimeEligibility(
            client_id=client1.id,
            regime="MIFID",
            is_eligible=True,
            eligibility_reason="Client meets all 1 classification rules for MIFID",
            matched_rules=[{
                "rule_id": 1,
                "rule_type": "account_type",
                "rule_name": "MIFID Account Type Eligibility"
            }],
            unmatched_rules=[],
            client_attributes=client1.client_attributes,
            rule_version=1,
            last_evaluated_date=datetime.now() - timedelta(days=80)
        )
        db.add(elig1_1)

        # EMIR - Eligible
        elig1_2 = RegimeEligibility(
            client_id=client1.id,
            regime="EMIR",
            is_eligible=True,
            eligibility_reason="Client meets all 1 classification rules for EMIR",
            matched_rules=[{
                "rule_id": 2,
                "rule_type": "account_type",
                "rule_name": "EMIR Account Type Eligibility"
            }],
            unmatched_rules=[],
            client_attributes=client1.client_attributes,
            rule_version=1,
            last_evaluated_date=datetime.now() - timedelta(days=80)
        )
        db.add(elig1_2)

        # Stays Exempt - Eligible
        elig1_3 = RegimeEligibility(
            client_id=client1.id,
            regime="Stays Exempt",
            is_eligible=True,
            eligibility_reason="Client meets all 1 classification rules for Stays Exempt",
            matched_rules=[{
                "rule_id": 5,
                "rule_type": "account_type",
                "rule_name": "Stays Exempt Account Type Eligibility"
            }],
            unmatched_rules=[],
            client_attributes=client1.client_attributes,
            rule_version=1,
            last_evaluated_date=datetime.now() - timedelta(days=80)
        )
        db.add(elig1_3)

        # Client 2: US Corporate Pension Fund - In Progress (SSI Validation)
        client2 = Client(
            name="American Retirement Trust Fund",
            legal_entity_id="SX002456",
            country_of_incorporation="United States",
            entity_type="Corporate Pension Fund",
            onboarding_status=OnboardingStatus.IN_PROGRESS,
            assigned_rm="Michael Chen",
            created_date=datetime.now() - timedelta(days=45),
            client_attributes={
                "account_type": "trading_entity",
                "booking_location": "US/NewYork",
                "product": "Interest Rate Swaps",
                "product_grid": {
                    "product_group": "financial_markets",
                    "product_category": "interest_rate",
                    "product_type": "swap",
                    "product_status": "approved",
                    "bank_entity": "US/NewYork"
                }
            }
        )
        db.add(client2)
        db.flush()

        create_onboarding_stages(db, client2.id, [
            {"name": StageName.LEGAL_ENTITY_SETUP, "status": StageStatus.COMPLETED, "assigned_team": "Entity Management",
             "started_date": datetime.now() - timedelta(days=45), "completed_date": datetime.now() - timedelta(days=42)},
            {"name": StageName.REG_CLASSIFICATION, "status": StageStatus.COMPLETED, "assigned_team": "Compliance",
             "started_date": datetime.now() - timedelta(days=42), "completed_date": datetime.now() - timedelta(days=35)},
            {"name": StageName.FM_ACCOUNT_REQUEST, "status": StageStatus.COMPLETED, "assigned_team": "FM Operations",
             "started_date": datetime.now() - timedelta(days=35), "completed_date": datetime.now() - timedelta(days=25)},
            {"name": StageName.STATIC_DATA_ENRICHMENT, "status": StageStatus.COMPLETED, "assigned_team": "FM Ops - Data",
             "started_date": datetime.now() - timedelta(days=25), "completed_date": datetime.now() - timedelta(days=15)},
            {"name": StageName.SSI_VALIDATION, "status": StageStatus.IN_PROGRESS, "assigned_team": "SSI Team",
             "started_date": datetime.now() - timedelta(days=15), "notes": "Waiting for bank confirmation"},
            {"name": StageName.VALUATION_SETUP, "status": StageStatus.NOT_STARTED, "assigned_team": "Valuation Team"}
        ])

        reg2 = RegulatoryClassification(
            client_id=client2.id,
            framework=RegulatoryFramework.DODD_FRANK,
            classification="Eligible Contract Participant (ECP)",
            classification_date=datetime.now() - timedelta(days=38),
            last_review_date=datetime.now() - timedelta(days=38),
            next_review_date=datetime.now() + timedelta(days=327),
            validation_status=ValidationStatus.VALIDATED
        )
        db.add(reg2)

        task1 = Task(
            client_id=client2.id,
            title="Obtain SSI confirmation from Deutsche Bank",
            description="Need signed SSI confirmation for USD settlement account",
            assigned_team="SSI Team",
            status=TaskStatus.IN_PROGRESS,
            task_type=TaskType.MANUAL,
            due_date=datetime.now() + timedelta(days=3)
        )
        db.add(task1)

        # Add documents for Client2 (US Dodd Frank regimes)
        print("  Creating documents for Client2 (American Retirement Trust Fund)...")

        doc2_1 = Document(
            client_id=client2.id,
            regulatory_classification_id=reg2.id,
            filename="ECP_Attestation_American_Retirement_2024.pdf",
            file_path="/uploads/client2/ecp_attestation.pdf",
            file_type="application/pdf",
            upload_date=datetime.now() - timedelta(days=40),
            uploaded_by="Michael Chen",
            document_category=DocumentCategory.CLIENT_CONFIRMATION,
            ocr_status=OCRStatus.COMPLETED,
            extracted_text="Eligible Contract Participant (ECP) Attestation - American Retirement Trust Fund qualifies as ECP under Dodd-Frank Section 1a(18)..."
        )
        db.add(doc2_1)

        doc2_2 = Document(
            client_id=client2.id,
            regulatory_classification_id=reg2.id,
            filename="ISDA_Protocol_Adherence_Letter_2024.pdf",
            file_path="/uploads/client2/isda_protocol.pdf",
            file_type="application/pdf",
            upload_date=datetime.now() - timedelta(days=38),
            uploaded_by="Michael Chen",
            document_category=DocumentCategory.CLIENT_CONFIRMATION,
            ocr_status=OCRStatus.COMPLETED,
            extracted_text="ISDA Dodd-Frank Protocol Adherence Letter - Confirms adherence to ISDA 2013 DF Protocol..."
        )
        db.add(doc2_2)

        doc2_3 = Document(
            client_id=client2.id,
            regulatory_classification_id=reg2.id,
            filename="Financial_Statements_FY2023_Audited.pdf",
            file_path="/uploads/client2/financial_statements_2023.pdf",
            file_type="application/pdf",
            upload_date=datetime.now() - timedelta(days=40),
            uploaded_by="Michael Chen",
            document_category=DocumentCategory.FINANCIAL_STATEMENTS,
            ocr_status=OCRStatus.COMPLETED,
            extracted_text="Audited Financial Statements - Total Assets: USD 2.5 billion, demonstrating ECP qualification criteria..."
        )
        db.add(doc2_3)

        # Add RegimeEligibility records for Client2 (US-focused regimes)
        print("  Creating regime eligibility records for Client2...")

        # Dodd Frank (US Person - CFTC) - Eligible
        elig2_1 = RegimeEligibility(
            client_id=client2.id,
            regime="Dodd Frank (US Person - CFTC)",
            is_eligible=True,
            eligibility_reason="Client meets all classification rules for Dodd Frank (US Person - CFTC)",
            matched_rules=[{
                "rule_id": 7,
                "rule_type": "account_type",
                "rule_name": "Dodd Frank CFTC Account Type Eligibility"
            }],
            unmatched_rules=[],
            client_attributes=client2.client_attributes,
            rule_version=1,
            last_evaluated_date=datetime.now() - timedelta(days=38),
            data_quality_score=95.0
        )
        db.add(elig2_1)

        # Dodd Frank (SEC) - Eligible
        elig2_2 = RegimeEligibility(
            client_id=client2.id,
            regime="Dodd Frank (SEC)",
            is_eligible=True,
            eligibility_reason="Client meets all classification rules for Dodd Frank (SEC)",
            matched_rules=[{
                "rule_id": 8,
                "rule_type": "account_type",
                "rule_name": "Dodd Frank SEC Account Type Eligibility"
            }],
            unmatched_rules=[],
            client_attributes=client2.client_attributes,
            rule_version=1,
            last_evaluated_date=datetime.now() - timedelta(days=38),
            data_quality_score=95.0
        )
        db.add(elig2_2)

        # DF Deemed ISDA - Eligible
        elig2_3 = RegimeEligibility(
            client_id=client2.id,
            regime="DF Deemed ISDA",
            is_eligible=True,
            eligibility_reason="Client meets all classification rules for DF Deemed ISDA",
            matched_rules=[{
                "rule_id": 19,
                "rule_type": "account_type",
                "rule_name": "DF Deemed ISDA Account Type Eligibility"
            }],
            unmatched_rules=[],
            client_attributes=client2.client_attributes,
            rule_version=1,
            last_evaluated_date=datetime.now() - timedelta(days=38),
            data_quality_score=95.0
        )
        db.add(elig2_3)

        # Stays Exempt - Eligible
        elig2_4 = RegimeEligibility(
            client_id=client2.id,
            regime="Stays Exempt",
            is_eligible=True,
            eligibility_reason="Client meets all classification rules for Stays Exempt",
            matched_rules=[{
                "rule_id": 5,
                "rule_type": "account_type",
                "rule_name": "Stays Exempt Account Type Eligibility"
            }],
            unmatched_rules=[],
            client_attributes=client2.client_attributes,
            rule_version=1,
            last_evaluated_date=datetime.now() - timedelta(days=38),
            data_quality_score=95.0
        )
        db.add(elig2_4)

        # Client 3: German Asset Manager - Blocked (missing documentation)
        client3 = Client(
            name="Frankfurt Asset Management GmbH",
            legal_entity_id="SX003789",
            country_of_incorporation="Germany",
            entity_type="Asset Management Company",
            onboarding_status=OnboardingStatus.BLOCKED,
            assigned_rm="Emma Schmidt",
            created_date=datetime.now() - timedelta(days=30)
        )
        db.add(client3)
        db.flush()

        create_onboarding_stages(db, client3.id, [
            {"name": StageName.LEGAL_ENTITY_SETUP, "status": StageStatus.COMPLETED, "assigned_team": "Entity Management",
             "started_date": datetime.now() - timedelta(days=30), "completed_date": datetime.now() - timedelta(days=28)},
            {"name": StageName.REG_CLASSIFICATION, "status": StageStatus.BLOCKED, "assigned_team": "Compliance",
             "started_date": datetime.now() - timedelta(days=28), "notes": "Missing: Professional client attestation and EMIR classification docs"},
            {"name": StageName.FM_ACCOUNT_REQUEST, "status": StageStatus.NOT_STARTED, "assigned_team": "FM Operations"},
            {"name": StageName.STATIC_DATA_ENRICHMENT, "status": StageStatus.NOT_STARTED, "assigned_team": "FM Ops - Data"},
            {"name": StageName.SSI_VALIDATION, "status": StageStatus.NOT_STARTED, "assigned_team": "SSI Team"},
            {"name": StageName.VALUATION_SETUP, "status": StageStatus.NOT_STARTED, "assigned_team": "Valuation Team"}
        ])

        reg3a = RegulatoryClassification(
            client_id=client3.id,
            framework=RegulatoryFramework.MIFID_II,
            classification="Professional Client",
            classification_date=datetime.now() - timedelta(days=25),
            validation_status=ValidationStatus.REJECTED,
            validation_notes="Missing professional client attestation letter"
        )
        db.add(reg3a)

        reg3b = RegulatoryClassification(
            client_id=client3.id,
            framework=RegulatoryFramework.EMIR,
            classification="Financial Counterparty",
            classification_date=datetime.now() - timedelta(days=25),
            validation_status=ValidationStatus.PENDING,
            validation_notes="Awaiting EMIR classification documentation"
        )
        db.add(reg3b)

        task2 = Task(
            client_id=client3.id,
            title="Request MiFID II Professional Client attestation",
            description="Contact RM to obtain signed attestation from client",
            assigned_to="Emma Schmidt",
            assigned_team="Relationship Management",
            status=TaskStatus.PENDING,
            task_type=TaskType.MANUAL,
            due_date=datetime.now() + timedelta(days=5)
        )
        db.add(task2)

        task3 = Task(
            client_id=client3.id,
            title="Obtain EMIR classification documents",
            description="Request FC status confirmation and supporting documentation",
            assigned_team="Compliance",
            status=TaskStatus.PENDING,
            task_type=TaskType.REVIEW,
            due_date=datetime.now() + timedelta(days=5)
        )
        db.add(task3)

        # Client 4: Cayman Islands SPV - Just started
        client4 = Client(
            name="Cayman Global Investment Fund I Ltd",
            legal_entity_id="SX004123",
            country_of_incorporation="Cayman Islands",
            entity_type="Special Purpose Vehicle",
            onboarding_status=OnboardingStatus.INITIATED,
            assigned_rm="James Liu",
            created_date=datetime.now() - timedelta(days=3)
        )
        db.add(client4)
        db.flush()

        create_onboarding_stages(db, client4.id, [
            {"name": StageName.LEGAL_ENTITY_SETUP, "status": StageStatus.IN_PROGRESS, "assigned_team": "Entity Management",
             "started_date": datetime.now() - timedelta(days=2)},
            {"name": StageName.REG_CLASSIFICATION, "status": StageStatus.NOT_STARTED, "assigned_team": "Compliance"},
            {"name": StageName.FM_ACCOUNT_REQUEST, "status": StageStatus.NOT_STARTED, "assigned_team": "FM Operations"},
            {"name": StageName.STATIC_DATA_ENRICHMENT, "status": StageStatus.NOT_STARTED, "assigned_team": "FM Ops - Data"},
            {"name": StageName.SSI_VALIDATION, "status": StageStatus.NOT_STARTED, "assigned_team": "SSI Team"},
            {"name": StageName.VALUATION_SETUP, "status": StageStatus.NOT_STARTED, "assigned_team": "Valuation Team"}
        ])

        reg4 = RegulatoryClassification(
            client_id=client4.id,
            framework=RegulatoryFramework.MIFID_II,
            classification="Professional Client (Per Se)",
            classification_date=datetime.now() - timedelta(days=1),
            validation_status=ValidationStatus.PENDING
        )
        db.add(reg4)

        # Client 5: Japanese Bank - In Progress (Valuation Setup)
        client5 = Client(
            name="Tokyo International Bank Ltd",
            legal_entity_id="SX005678",
            country_of_incorporation="Japan",
            entity_type="Credit Institution",
            onboarding_status=OnboardingStatus.IN_PROGRESS,
            assigned_rm="Yuki Tanaka",
            created_date=datetime.now() - timedelta(days=60),
            client_attributes={
                "account_type": "trading_entity",
                "booking_location": "Japan/Tokyo",
                "product": "Credit Default Swaps",
                "product_grid": {
                    "product_group": "financial_markets",
                    "product_category": "credit",
                    "product_type": "swap",
                    "product_status": "approved",
                    "bank_entity": "Japan/Tokyo"
                }
            }
        )
        db.add(client5)
        db.flush()

        create_onboarding_stages(db, client5.id, [
            {"name": StageName.LEGAL_ENTITY_SETUP, "status": StageStatus.COMPLETED, "assigned_team": "Entity Management",
             "started_date": datetime.now() - timedelta(days=60), "completed_date": datetime.now() - timedelta(days=58)},
            {"name": StageName.REG_CLASSIFICATION, "status": StageStatus.COMPLETED, "assigned_team": "Compliance",
             "started_date": datetime.now() - timedelta(days=58), "completed_date": datetime.now() - timedelta(days=50)},
            {"name": StageName.FM_ACCOUNT_REQUEST, "status": StageStatus.COMPLETED, "assigned_team": "FM Operations",
             "started_date": datetime.now() - timedelta(days=50), "completed_date": datetime.now() - timedelta(days=35)},
            {"name": StageName.STATIC_DATA_ENRICHMENT, "status": StageStatus.COMPLETED, "assigned_team": "FM Ops - Data",
             "started_date": datetime.now() - timedelta(days=35), "completed_date": datetime.now() - timedelta(days=20)},
            {"name": StageName.SSI_VALIDATION, "status": StageStatus.COMPLETED, "assigned_team": "SSI Team",
             "started_date": datetime.now() - timedelta(days=20), "completed_date": datetime.now() - timedelta(days=10)},
            {"name": StageName.VALUATION_SETUP, "status": StageStatus.IN_PROGRESS, "assigned_team": "Valuation Team",
             "started_date": datetime.now() - timedelta(days=10), "notes": "Setting up JPY MTM reports"}
        ])

        reg5a = RegulatoryClassification(
            client_id=client5.id,
            framework=RegulatoryFramework.MIFID_II,
            classification="Professional Client (Per Se)",
            classification_date=datetime.now() - timedelta(days=55),
            last_review_date=datetime.now() - timedelta(days=55),
            next_review_date=datetime.now() + timedelta(days=310),
            validation_status=ValidationStatus.VALIDATED
        )
        db.add(reg5a)

        reg5b = RegulatoryClassification(
            client_id=client5.id,
            framework=RegulatoryFramework.EMIR,
            classification="Financial Counterparty",
            classification_date=datetime.now() - timedelta(days=55),
            last_review_date=datetime.now() - timedelta(days=55),
            next_review_date=datetime.now() + timedelta(days=310),
            validation_status=ValidationStatus.VALIDATED
        )
        db.add(reg5b)

        reg5c = RegulatoryClassification(
            client_id=client5.id,
            framework=RegulatoryFramework.DODD_FRANK,
            classification="Swap Dealer",
            classification_date=datetime.now() - timedelta(days=55),
            last_review_date=datetime.now() - timedelta(days=55),
            next_review_date=datetime.now() + timedelta(days=310),
            validation_status=ValidationStatus.VALIDATED
        )
        db.add(reg5c)

        # Add documents for Client5 (Asian + EU regimes)
        print("  Creating documents for Client5 (Tokyo International Bank)...")

        doc5_1 = Document(
            client_id=client5.id,
            regulatory_classification_id=reg5a.id,
            filename="Professional_Client_Attestation_Tokyo_Bank_2024.pdf",
            file_path="/uploads/client5/professional_client_attestation.pdf",
            file_type="application/pdf",
            upload_date=datetime.now() - timedelta(days=56),
            uploaded_by="Yuki Tanaka",
            document_category=DocumentCategory.CLIENT_CONFIRMATION,
            ocr_status=OCRStatus.COMPLETED,
            extracted_text="Professional Client (Per Se) Attestation - Tokyo International Bank Ltd qualifies as Credit Institution under MiFID II Annex II..."
        )
        db.add(doc5_1)

        doc5_2 = Document(
            client_id=client5.id,
            regulatory_classification_id=reg5b.id,
            filename="EMIR_Financial_Counterparty_Classification_2024.pdf",
            file_path="/uploads/client5/emir_fc_classification.pdf",
            file_type="application/pdf",
            upload_date=datetime.now() - timedelta(days=55),
            uploaded_by="Yuki Tanaka",
            document_category=DocumentCategory.CLIENT_CONFIRMATION,
            ocr_status=OCRStatus.COMPLETED,
            extracted_text="EMIR Financial Counterparty (FC) Classification Letter - Tokyo International Bank classified as FC under EMIR regulations..."
        )
        db.add(doc5_2)

        doc5_3 = Document(
            client_id=client5.id,
            regulatory_classification_id=reg5a.id,
            filename="HKMA_Registration_Certificate_2024.pdf",
            file_path="/uploads/client5/hkma_registration.pdf",
            file_type="application/pdf",
            upload_date=datetime.now() - timedelta(days=55),
            uploaded_by="Yuki Tanaka",
            document_category=DocumentCategory.ENTITY_DOCUMENTATION,
            ocr_status=OCRStatus.COMPLETED,
            extracted_text="Hong Kong Monetary Authority Registration Certificate - Authorized Institution for derivatives activities in Hong Kong SAR..."
        )
        db.add(doc5_3)

        doc5_4 = Document(
            client_id=client5.id,
            regulatory_classification_id=reg5c.id,
            filename="Financial_Statements_FY2023_Audited.pdf",
            file_path="/uploads/client5/financial_statements_2023.pdf",
            file_type="application/pdf",
            upload_date=datetime.now() - timedelta(days=52),
            uploaded_by="Yuki Tanaka",
            document_category=DocumentCategory.FINANCIAL_STATEMENTS,
            ocr_status=OCRStatus.COMPLETED,
            extracted_text="Audited Financial Statements FY2023 - Total Assets: JPY 850 billion, Capital: JPY 120 billion..."
        )
        db.add(doc5_4)

        doc5_5 = Document(
            client_id=client5.id,
            regulatory_classification_id=reg5a.id,
            filename="MAS_Authorization_Letter_Regional_Trading_2024.pdf",
            file_path="/uploads/client5/mas_authorization.pdf",
            file_type="application/pdf",
            upload_date=datetime.now() - timedelta(days=54),
            uploaded_by="Yuki Tanaka",
            document_category=DocumentCategory.CLIENT_CONFIRMATION,
            ocr_status=OCRStatus.COMPLETED,
            extracted_text="Monetary Authority of Singapore - Authorization for regional derivatives trading activities..."
        )
        db.add(doc5_5)

        # Add RegimeEligibility records for Client5 (Asian regional bank + EU exposure)
        print("  Creating regime eligibility records for Client5...")

        # MIFID - Eligible
        elig5_1 = RegimeEligibility(
            client_id=client5.id,
            regime="MIFID",
            is_eligible=True,
            eligibility_reason="Client meets all classification rules for MIFID",
            matched_rules=[{
                "rule_id": 1,
                "rule_type": "account_type",
                "rule_name": "MIFID Account Type Eligibility"
            }],
            unmatched_rules=[],
            client_attributes=client5.client_attributes,
            rule_version=1,
            last_evaluated_date=datetime.now() - timedelta(days=55),
            data_quality_score=96.0
        )
        db.add(elig5_1)

        # EMIR - Eligible
        elig5_2 = RegimeEligibility(
            client_id=client5.id,
            regime="EMIR",
            is_eligible=True,
            eligibility_reason="Client meets all classification rules for EMIR",
            matched_rules=[{
                "rule_id": 2,
                "rule_type": "account_type",
                "rule_name": "EMIR Account Type Eligibility"
            }],
            unmatched_rules=[],
            client_attributes=client5.client_attributes,
            rule_version=1,
            last_evaluated_date=datetime.now() - timedelta(days=55),
            data_quality_score=96.0
        )
        db.add(elig5_2)

        # HKMA Margin - Eligible
        elig5_3 = RegimeEligibility(
            client_id=client5.id,
            regime="HKMA Margin",
            is_eligible=True,
            eligibility_reason="Client meets all classification rules for HKMA Margin",
            matched_rules=[{
                "rule_id": 10,
                "rule_type": "account_type",
                "rule_name": "HKMA Margin Account Type Eligibility"
            }],
            unmatched_rules=[],
            client_attributes=client5.client_attributes,
            rule_version=1,
            last_evaluated_date=datetime.now() - timedelta(days=55),
            data_quality_score=94.0
        )
        db.add(elig5_3)

        # HKMA Clearing - Eligible
        elig5_4 = RegimeEligibility(
            client_id=client5.id,
            regime="HKMA Clearing",
            is_eligible=True,
            eligibility_reason="Client meets all classification rules for HKMA Clearing",
            matched_rules=[{
                "rule_id": 11,
                "rule_type": "account_type",
                "rule_name": "HKMA Clearing Account Type Eligibility"
            }],
            unmatched_rules=[],
            client_attributes=client5.client_attributes,
            rule_version=1,
            last_evaluated_date=datetime.now() - timedelta(days=55),
            data_quality_score=94.0
        )
        db.add(elig5_4)

        # MAS Margin - Eligible (regional exposure)
        elig5_5 = RegimeEligibility(
            client_id=client5.id,
            regime="MAS Margin",
            is_eligible=True,
            eligibility_reason="Client meets all classification rules for MAS Margin (regional Asian bank)",
            matched_rules=[{
                "rule_id": 6,
                "rule_type": "account_type",
                "rule_name": "MAS Margin Account Type Eligibility"
            }],
            unmatched_rules=[],
            client_attributes=client5.client_attributes,
            rule_version=1,
            last_evaluated_date=datetime.now() - timedelta(days=55),
            data_quality_score=93.0
        )
        db.add(elig5_5)

        # Client 6: Swiss Family Office - Review overdue
        client6 = Client(
            name="Zurich Family Office AG",
            legal_entity_id="SX006890",
            country_of_incorporation="Switzerland",
            entity_type="Family Office",
            onboarding_status=OnboardingStatus.IN_PROGRESS,
            assigned_rm="Anna Müller",
            created_date=datetime.now() - timedelta(days=180),
            client_attributes={
                "account_type": "subfund",
                "booking_location": "Switzerland/Zurich",
                "product": "FX Options",
                "product_grid": {
                    "product_group": "financial_markets",
                    "product_category": "fx",
                    "product_type": "option",
                    "product_status": "pending_approval",
                    "bank_entity": "Switzerland/Zurich"
                }
            }
        )
        db.add(client6)
        db.flush()

        create_onboarding_stages(db, client6.id, [
            {"name": StageName.LEGAL_ENTITY_SETUP, "status": StageStatus.COMPLETED, "assigned_team": "Entity Management",
             "started_date": datetime.now() - timedelta(days=180), "completed_date": datetime.now() - timedelta(days=178)},
            {"name": StageName.REG_CLASSIFICATION, "status": StageStatus.IN_PROGRESS, "assigned_team": "Compliance",
             "started_date": datetime.now() - timedelta(days=178), "notes": "Elective professional status - annual review required"},
            {"name": StageName.FM_ACCOUNT_REQUEST, "status": StageStatus.NOT_STARTED, "assigned_team": "FM Operations"},
            {"name": StageName.STATIC_DATA_ENRICHMENT, "status": StageStatus.NOT_STARTED, "assigned_team": "FM Ops - Data"},
            {"name": StageName.SSI_VALIDATION, "status": StageStatus.NOT_STARTED, "assigned_team": "SSI Team"},
            {"name": StageName.VALUATION_SETUP, "status": StageStatus.NOT_STARTED, "assigned_team": "Valuation Team"}
        ])

        reg6 = RegulatoryClassification(
            client_id=client6.id,
            framework=RegulatoryFramework.MIFID_II,
            classification="Elective Professional Client",
            classification_date=datetime.now() - timedelta(days=400),
            last_review_date=datetime.now() - timedelta(days=400),
            next_review_date=datetime.now() - timedelta(days=35),  # OVERDUE!
            validation_status=ValidationStatus.VALIDATED,
            validation_notes="Annual review required for elective professional status"
        )
        db.add(reg6)

        task4 = Task(
            client_id=client6.id,
            title="URGENT: Complete MiFID II annual elective professional review",
            description="Annual review is overdue. Need to reconfirm client meets criteria and obtain updated attestation",
            assigned_team="Compliance",
            status=TaskStatus.PENDING,
            task_type=TaskType.REVIEW,
            due_date=datetime.now() + timedelta(days=7)
        )
        db.add(task4)

        task5 = Task(
            client_id=client6.id,
            title="Request updated financial information",
            description="Request portfolio size, transaction volume, and professional experience update",
            assigned_to="Anna Müller",
            assigned_team="Relationship Management",
            status=TaskStatus.PENDING,
            task_type=TaskType.MANUAL,
            due_date=datetime.now() + timedelta(days=7)
        )
        db.add(task5)

        # Client 7: Singapore Sovereign Wealth Fund (Event-Driven: Country Change Demo)
        # Scenario: Client changed country of incorporation from Hong Kong to Singapore yesterday
        # This triggers a periodic review and requires new classification evaluation
        client7 = Client(
            name="Singapore Strategic Investment Fund",
            legal_entity_id="SX007234",
            country_of_incorporation="Singapore",  # CHANGED from Hong Kong yesterday
            entity_type="Sovereign Wealth Fund",
            onboarding_status=OnboardingStatus.COMPLETED,
            assigned_rm="David Wong",
            created_date=datetime.now() - timedelta(days=120),
            client_attributes={
                "account_type": "trading_entity",
                "booking_location": "Singapore/DBS",  # UPDATED from Hong Kong/HSBC
                "product": "Interest Rate Swaps",
                "product_grid": {
                    "product_group": "financial_markets",
                    "product_category": "interest_rate",
                    "product_type": "swap",
                    "product_status": "approved",
                    "bank_entity": "Singapore/DBS"  # UPDATED from Hong Kong
                },
                # Event metadata
                "previous_country_of_incorporation": "Hong Kong",
                "country_change_date": (datetime.now() - timedelta(days=1)).isoformat(),
                "change_reason": "Corporate restructuring - domicile change",
                "periodic_review_triggered": True,
                "periodic_review_trigger_date": (datetime.now() - timedelta(days=1)).isoformat()
            }
        )
        db.add(client7)
        db.flush()

        create_onboarding_stages(db, client7.id, [
            {"name": StageName.LEGAL_ENTITY_SETUP, "status": StageStatus.COMPLETED, "assigned_team": "Entity Management",
             "started_date": datetime.now() - timedelta(days=120), "completed_date": datetime.now() - timedelta(days=118)},
            {"name": StageName.REG_CLASSIFICATION, "status": StageStatus.COMPLETED, "assigned_team": "Compliance",
             "started_date": datetime.now() - timedelta(days=118), "completed_date": datetime.now() - timedelta(days=110)},
            {"name": StageName.FM_ACCOUNT_REQUEST, "status": StageStatus.COMPLETED, "assigned_team": "FM Operations",
             "started_date": datetime.now() - timedelta(days=110), "completed_date": datetime.now() - timedelta(days=95)},
            {"name": StageName.STATIC_DATA_ENRICHMENT, "status": StageStatus.COMPLETED, "assigned_team": "FM Ops - Data",
             "started_date": datetime.now() - timedelta(days=95), "completed_date": datetime.now() - timedelta(days=80)},
            {"name": StageName.SSI_VALIDATION, "status": StageStatus.COMPLETED, "assigned_team": "SSI Team",
             "started_date": datetime.now() - timedelta(days=80), "completed_date": datetime.now() - timedelta(days=65)},
            {"name": StageName.VALUATION_SETUP, "status": StageStatus.COMPLETED, "assigned_team": "Valuation Team",
             "started_date": datetime.now() - timedelta(days=65), "completed_date": datetime.now() - timedelta(days=60)}
        ])

        reg7 = RegulatoryClassification(
            client_id=client7.id,
            framework=RegulatoryFramework.MIFID_II,
            classification="Professional Client (Per Se)",
            classification_date=datetime.now() - timedelta(days=115),
            last_review_date=datetime.now() - timedelta(days=115),
            next_review_date=datetime.now() - timedelta(days=1),  # OVERDUE for review due to country change
            validation_status=ValidationStatus.PENDING,  # PENDING re-validation after country change
            validation_notes="Periodic review triggered by country of incorporation change from Hong Kong to Singapore. Classification needs re-validation for Singapore-specific regimes (MAS requirements)."
        )
        db.add(reg7)

        # Add realistic documents for Client7 (completed client) - Singapore focus
        print("  Creating documents for Client7 (Singapore Strategic Investment Fund)...")

        # COMPLIANT DOCUMENTS
        doc7_1 = Document(
            client_id=client7.id,
            regulatory_classification_id=reg7.id,
            filename="Professional_Client_Attestation_Singapore_SWF_2024.pdf",
            file_path="/uploads/client7/professional_client_attestation.pdf",
            file_type="application/pdf",
            upload_date=datetime.now() - timedelta(days=118),
            uploaded_by="David Wong",
            document_category=DocumentCategory.CLIENT_CONFIRMATION,
            ocr_status=OCRStatus.COMPLETED,
            extracted_text="Professional Client (Per Se) Attestation - Singapore Strategic Investment Fund qualifies as Professional Client under MiFID II Annex II..."
        )
        db.add(doc7_1)

        doc7_2 = Document(
            client_id=client7.id,
            regulatory_classification_id=reg7.id,
            filename="MAS_Registration_Certificate_2024.pdf",
            file_path="/uploads/client7/mas_registration.pdf",
            file_type="application/pdf",
            upload_date=datetime.now() - timedelta(days=115),
            uploaded_by="David Wong",
            document_category=DocumentCategory.ENTITY_DOCUMENTATION,
            ocr_status=OCRStatus.COMPLETED,
            extracted_text="Monetary Authority of Singapore - Certificate of Registration for Fund Management..."
        )
        db.add(doc7_2)

        doc7_3 = Document(
            client_id=client7.id,
            regulatory_classification_id=reg7.id,
            filename="Board_Resolution_Derivatives_Trading_2024.pdf",
            file_path="/uploads/client7/board_resolution.pdf",
            file_type="application/pdf",
            upload_date=datetime.now() - timedelta(days=115),
            uploaded_by="David Wong",
            document_category=DocumentCategory.CLIENT_CONFIRMATION,
            ocr_status=OCRStatus.COMPLETED,
            extracted_text="Board Resolution authorizing OTC derivatives trading and collateral arrangements..."
        )
        db.add(doc7_3)

        doc7_4 = Document(
            client_id=client7.id,
            regulatory_classification_id=reg7.id,
            filename="Audited_Financial_Statements_FY2023.pdf",
            file_path="/uploads/client7/financial_statements_2023.pdf",
            file_type="application/pdf",
            upload_date=datetime.now() - timedelta(days=110),
            uploaded_by="David Wong",
            document_category=DocumentCategory.FINANCIAL_STATEMENTS,
            ocr_status=OCRStatus.COMPLETED,
            extracted_text="Audited Financial Statements - Assets Under Management: SGD 45 billion..."
        )
        db.add(doc7_4)

        doc7_5 = Document(
            client_id=client7.id,
            regulatory_classification_id=reg7.id,
            filename="KYC_AML_Package_Singapore_SWF.pdf",
            file_path="/uploads/client7/kyc_aml_package.pdf",
            file_type="application/pdf",
            upload_date=datetime.now() - timedelta(days=118),
            uploaded_by="David Wong",
            document_category=DocumentCategory.CLIENT_CONFIRMATION,
            ocr_status=OCRStatus.COMPLETED,
            extracted_text="KYC and AML documentation for sovereign wealth fund - Government ownership structure..."
        )
        db.add(doc7_5)

        doc7_6 = Document(
            client_id=client7.id,
            regulatory_classification_id=reg7.id,
            filename="Investment_Mandate_Documentation_2024.pdf",
            file_path="/uploads/client7/investment_mandate.pdf",
            file_type="application/pdf",
            upload_date=datetime.now() - timedelta(days=110),
            uploaded_by="David Wong",
            document_category=DocumentCategory.PRODUCT_ELIGIBILITY,
            ocr_status=OCRStatus.COMPLETED,
            extracted_text="Investment Mandate - Authorized products: FX, Rates, Credit, Equity Derivatives..."
        )
        db.add(doc7_6)

        # EXPIRED DOCUMENTS
        doc7_7 = Document(
            client_id=client7.id,
            regulatory_classification_id=reg7.id,
            filename="Risk_Assessment_Report_2023.pdf",
            file_path="/uploads/client7/risk_assessment_expired.pdf",
            file_type="application/pdf",
            upload_date=datetime.now() - timedelta(days=195),
            uploaded_by="David Wong",
            document_category=DocumentCategory.PRODUCT_ELIGIBILITY,
            ocr_status=OCRStatus.COMPLETED,
            extracted_text="Annual Risk Assessment Report for derivatives trading activities..."
        )
        db.add(doc7_7)

        # PENDING REVIEW DOCUMENTS
        doc7_8 = Document(
            client_id=client7.id,
            regulatory_classification_id=reg7.id,
            filename="Quarterly_Investment_Report_Q4_2024.pdf",
            file_path="/uploads/client7/quarterly_report_q4_2024.pdf",
            file_type="application/pdf",
            upload_date=datetime.now() - timedelta(days=1),
            uploaded_by="David Wong",
            document_category=DocumentCategory.FINANCIAL_STATEMENTS,
            ocr_status=OCRStatus.PROCESSING,
            extracted_text=None
        )
        db.add(doc7_8)

        doc7_9 = Document(
            client_id=client7.id,
            regulatory_classification_id=reg7.id,
            filename="Updated_Authorized_Signatories_List_2024.pdf",
            file_path="/uploads/client7/authorized_signatories_2024.pdf",
            file_type="application/pdf",
            upload_date=datetime.now() - timedelta(days=4),
            uploaded_by="David Wong",
            document_category=DocumentCategory.CLIENT_CONFIRMATION,
            ocr_status=OCRStatus.COMPLETED,
            extracted_text="Updated list of authorized signatories for trading activities..."
        )
        db.add(doc7_9)

        # Add RegimeEligibility records for Client7 (Singapore-focused regimes)
        print("  Creating regime eligibility records for Client7...")

        # MAS Margin - Eligible
        elig7_1 = RegimeEligibility(
            client_id=client7.id,
            regime="MAS Margin",
            is_eligible=True,
            eligibility_reason="Client meets all 1 classification rules for MAS Margin",
            matched_rules=[{
                "rule_id": 6,
                "rule_type": "account_type",
                "rule_name": "MAS Margin Account Type Eligibility"
            }],
            unmatched_rules=[],
            client_attributes=client7.client_attributes,
            rule_version=1,
            last_evaluated_date=datetime.now() - timedelta(days=115)
        )
        db.add(elig7_1)

        # MAS Clearing - Eligible
        elig7_2 = RegimeEligibility(
            client_id=client7.id,
            regime="MAS Clearing",
            is_eligible=True,
            eligibility_reason="Client meets all 1 classification rules for MAS Clearing",
            matched_rules=[{
                "rule_id": 7,
                "rule_type": "account_type",
                "rule_name": "MAS Clearing Account Type Eligibility"
            }],
            unmatched_rules=[],
            client_attributes=client7.client_attributes,
            rule_version=1,
            last_evaluated_date=datetime.now() - timedelta(days=115)
        )
        db.add(elig7_2)

        # MAS Transaction Reporting - Eligible
        elig7_3 = RegimeEligibility(
            client_id=client7.id,
            regime="MAS Transaction Reporting",
            is_eligible=True,
            eligibility_reason="Client meets all 1 classification rules for MAS Transaction Reporting",
            matched_rules=[{
                "rule_id": 8,
                "rule_type": "account_type",
                "rule_name": "MAS Transaction Reporting Account Type Eligibility"
            }],
            unmatched_rules=[],
            client_attributes=client7.client_attributes,
            rule_version=1,
            last_evaluated_date=datetime.now() - timedelta(days=115)
        )
        db.add(elig7_3)

        # ASIC TR - Not Eligible (wrong jurisdiction)
        elig7_4 = RegimeEligibility(
            client_id=client7.id,
            regime="ASIC TR",
            is_eligible=False,
            eligibility_reason="Client matches 0/1 rules. Missing: Australian jurisdiction",
            matched_rules=[],
            unmatched_rules=[{
                "rule_id": 9,
                "rule_type": "booking_location",
                "rule_name": "ASIC TR Location Requirement",
                "expected": "Australia/*",
                "actual": "Singapore/DBS"
            }],
            client_attributes=client7.client_attributes,
            rule_version=1,
            last_evaluated_date=datetime.now() - timedelta(days=115)
        )
        db.add(elig7_4)

        # MIFID - Eligible (international exposure)
        elig7_5 = RegimeEligibility(
            client_id=client7.id,
            regime="MIFID",
            is_eligible=True,
            eligibility_reason="Client meets all 1 classification rules for MIFID",
            matched_rules=[{
                "rule_id": 1,
                "rule_type": "account_type",
                "rule_name": "MIFID Account Type Eligibility"
            }],
            unmatched_rules=[],
            client_attributes=client7.client_attributes,
            rule_version=1,
            last_evaluated_date=datetime.now() - timedelta(days=115)
        )
        db.add(elig7_5)

        # Stays Exempt - Eligible
        elig7_6 = RegimeEligibility(
            client_id=client7.id,
            regime="Stays Exempt",
            is_eligible=True,
            eligibility_reason="Client meets all 1 classification rules for Stays Exempt",
            matched_rules=[{
                "rule_id": 5,
                "rule_type": "account_type",
                "rule_name": "Stays Exempt Account Type Eligibility"
            }],
            unmatched_rules=[],
            client_attributes=client7.client_attributes,
            rule_version=1,
            last_evaluated_date=datetime.now() - timedelta(days=115)
        )
        db.add(elig7_6)

        # HKMA Margin - Eligible (regional Asian coverage)
        elig7_7 = RegimeEligibility(
            client_id=client7.id,
            regime="HKMA Margin",
            is_eligible=True,
            eligibility_reason="Client meets all 1 classification rules for HKMA Margin (regional Asian exposure)",
            matched_rules=[{
                "rule_id": 10,
                "rule_type": "account_type",
                "rule_name": "HKMA Margin Account Type Eligibility"
            }],
            unmatched_rules=[],
            client_attributes=client7.client_attributes,
            rule_version=1,
            last_evaluated_date=datetime.now() - timedelta(days=115),
            data_quality_score=93.0
        )
        db.add(elig7_7)

        # NEW regime triggered by country change event
        elig7_8 = RegimeEligibility(
            client_id=client7.id,
            regime="MAS FAIR Client Classification",
            is_eligible=True,
            eligibility_reason="Client meets requirements for MAS FAIR Client Classification after country change to Singapore",
            matched_rules=[{
                "rule_id": 10,
                "rule_type": "country_of_incorporation",
                "rule_name": "MAS FAIR Singapore Entity Requirement"
            }, {
                "rule_id": 11,
                "rule_type": "account_type",
                "rule_name": "MAS FAIR Account Type Eligibility"
            }],
            unmatched_rules=[],
            client_attributes=client7.client_attributes,
            rule_version=1,
            last_evaluated_date=datetime.now() - timedelta(days=1),  # Evaluated yesterday after country change
            data_quality_score=92.0
        )
        db.add(elig7_7)

        # Client 8: Australian Superannuation Fund
        client8 = Client(
            name="Melbourne Retirement Super Fund",
            legal_entity_id="SX008567",
            country_of_incorporation="Australia",
            entity_type="Superannuation Fund",
            onboarding_status=OnboardingStatus.IN_PROGRESS,
            assigned_rm="Sophie Anderson",
            created_date=datetime.now() - timedelta(days=25),
            client_attributes={
                "account_type": "subfund",
                "booking_location": "Australia/Sydney",
                "product": "Interest Rate Forwards",
                "product_grid": {
                    "product_group": "financial_markets",
                    "product_category": "interest_rate",
                    "product_type": "forward",
                    "product_status": "approved",
                    "bank_entity": "Australia/Sydney"
                }
            }
        )
        db.add(client8)
        db.flush()

        create_onboarding_stages(db, client8.id, [
            {"name": StageName.LEGAL_ENTITY_SETUP, "status": StageStatus.COMPLETED, "assigned_team": "Entity Management",
             "started_date": datetime.now() - timedelta(days=25), "completed_date": datetime.now() - timedelta(days=23)},
            {"name": StageName.REG_CLASSIFICATION, "status": StageStatus.COMPLETED, "assigned_team": "Compliance",
             "started_date": datetime.now() - timedelta(days=23), "completed_date": datetime.now() - timedelta(days=18)},
            {"name": StageName.FM_ACCOUNT_REQUEST, "status": StageStatus.COMPLETED, "assigned_team": "FM Operations",
             "started_date": datetime.now() - timedelta(days=18), "completed_date": datetime.now() - timedelta(days=12)},
            {"name": StageName.STATIC_DATA_ENRICHMENT, "status": StageStatus.IN_PROGRESS, "assigned_team": "FM Ops - Data",
             "started_date": datetime.now() - timedelta(days=12), "notes": "Enriching AUD currency settlement details"},
            {"name": StageName.SSI_VALIDATION, "status": StageStatus.NOT_STARTED, "assigned_team": "SSI Team"},
            {"name": StageName.VALUATION_SETUP, "status": StageStatus.NOT_STARTED, "assigned_team": "Valuation Team"}
        ])

        reg8 = RegulatoryClassification(
            client_id=client8.id,
            framework=RegulatoryFramework.MIFID_II,
            classification="Professional Client",
            classification_date=datetime.now() - timedelta(days=20),
            last_review_date=datetime.now() - timedelta(days=20),
            next_review_date=datetime.now() + timedelta(days=345),
            validation_status=ValidationStatus.VALIDATED
        )
        db.add(reg8)

        # Add documents for Client8 (Australian regimes)
        print("  Creating documents for Client8 (Melbourne Retirement Super Fund)...")

        doc8_1 = Document(
            client_id=client8.id,
            regulatory_classification_id=reg8.id,
            filename="ASIC_Registration_Certificate_2024.pdf",
            file_path="/uploads/client8/asic_registration.pdf",
            file_type="application/pdf",
            upload_date=datetime.now() - timedelta(days=22),
            uploaded_by="Sophie Anderson",
            document_category=DocumentCategory.ENTITY_DOCUMENTATION,
            ocr_status=OCRStatus.COMPLETED,
            extracted_text="Australian Securities and Investments Commission - Registration Certificate for Superannuation Fund..."
        )
        db.add(doc8_1)

        doc8_2 = Document(
            client_id=client8.id,
            regulatory_classification_id=reg8.id,
            filename="Australian_Superannuation_Fund_License_2024.pdf",
            file_path="/uploads/client8/superannuation_license.pdf",
            file_type="application/pdf",
            upload_date=datetime.now() - timedelta(days=22),
            uploaded_by="Sophie Anderson",
            document_category=DocumentCategory.CLIENT_CONFIRMATION,
            ocr_status=OCRStatus.COMPLETED,
            extracted_text="APRA Superannuation Fund License - Melbourne Retirement Super Fund - RSE License L0012345..."
        )
        db.add(doc8_2)

        doc8_3 = Document(
            client_id=client8.id,
            regulatory_classification_id=reg8.id,
            filename="Professional_Client_Attestation_Melbourne_Super_2024.pdf",
            file_path="/uploads/client8/professional_client_attestation.pdf",
            file_type="application/pdf",
            upload_date=datetime.now() - timedelta(days=20),
            uploaded_by="Sophie Anderson",
            document_category=DocumentCategory.CLIENT_CONFIRMATION,
            ocr_status=OCRStatus.COMPLETED,
            extracted_text="Professional Client Attestation for international derivatives trading under MiFID II..."
        )
        db.add(doc8_3)

        # Add RegimeEligibility records for Client8 (Australian focus + limited international)
        print("  Creating regime eligibility records for Client8...")

        # ASIC TR - Eligible (primary)
        elig8_1 = RegimeEligibility(
            client_id=client8.id,
            regime="ASIC TR",
            is_eligible=True,
            eligibility_reason="Client meets all classification rules for ASIC TR",
            matched_rules=[{
                "rule_id": 16,
                "rule_type": "account_type",
                "rule_name": "ASIC TR Account Type Eligibility"
            }],
            unmatched_rules=[],
            client_attributes=client8.client_attributes,
            rule_version=1,
            last_evaluated_date=datetime.now() - timedelta(days=20),
            data_quality_score=97.0
        )
        db.add(elig8_1)

        # MIFID - Eligible (limited international exposure)
        elig8_2 = RegimeEligibility(
            client_id=client8.id,
            regime="MIFID",
            is_eligible=True,
            eligibility_reason="Client meets all classification rules for MIFID (international exposure)",
            matched_rules=[{
                "rule_id": 1,
                "rule_type": "account_type",
                "rule_name": "MIFID Account Type Eligibility"
            }],
            unmatched_rules=[],
            client_attributes=client8.client_attributes,
            rule_version=1,
            last_evaluated_date=datetime.now() - timedelta(days=20),
            data_quality_score=91.0
        )
        db.add(elig8_2)

        # Client 9: Luxembourg SICAV
        client9 = Client(
            name="European Growth Fund SICAV",
            legal_entity_id="SX009876",
            country_of_incorporation="Luxembourg",
            entity_type="SICAV",
            onboarding_status=OnboardingStatus.IN_PROGRESS,
            assigned_rm="Pierre Dubois",
            created_date=datetime.now() - timedelta(days=40),
            client_attributes={
                "account_type": "subfund",
                "booking_location": "Luxembourg/Luxembourg",
                "product": "FX Swaps",
                "product_grid": {
                    "product_group": "financial_markets",
                    "product_category": "fx",
                    "product_type": "swap",
                    "product_status": "approved",
                    "bank_entity": "Luxembourg/Luxembourg"
                }
            }
        )
        db.add(client9)
        db.flush()

        create_onboarding_stages(db, client9.id, [
            {"name": StageName.LEGAL_ENTITY_SETUP, "status": StageStatus.COMPLETED, "assigned_team": "Entity Management",
             "started_date": datetime.now() - timedelta(days=40), "completed_date": datetime.now() - timedelta(days=38)},
            {"name": StageName.REG_CLASSIFICATION, "status": StageStatus.COMPLETED, "assigned_team": "Compliance",
             "started_date": datetime.now() - timedelta(days=38), "completed_date": datetime.now() - timedelta(days=32)},
            {"name": StageName.FM_ACCOUNT_REQUEST, "status": StageStatus.COMPLETED, "assigned_team": "FM Operations",
             "started_date": datetime.now() - timedelta(days=32), "completed_date": datetime.now() - timedelta(days=22)},
            {"name": StageName.STATIC_DATA_ENRICHMENT, "status": StageStatus.COMPLETED, "assigned_team": "FM Ops - Data",
             "started_date": datetime.now() - timedelta(days=22), "completed_date": datetime.now() - timedelta(days=15)},
            {"name": StageName.SSI_VALIDATION, "status": StageStatus.IN_PROGRESS, "assigned_team": "SSI Team",
             "started_date": datetime.now() - timedelta(days=15), "notes": "Multiple currency SSIs being validated"},
            {"name": StageName.VALUATION_SETUP, "status": StageStatus.NOT_STARTED, "assigned_team": "Valuation Team"}
        ])

        reg9a = RegulatoryClassification(
            client_id=client9.id,
            framework=RegulatoryFramework.MIFID_II,
            classification="Professional Client (Per Se)",
            classification_date=datetime.now() - timedelta(days=35),
            last_review_date=datetime.now() - timedelta(days=35),
            next_review_date=datetime.now() + timedelta(days=330),
            validation_status=ValidationStatus.VALIDATED
        )
        db.add(reg9a)

        reg9b = RegulatoryClassification(
            client_id=client9.id,
            framework=RegulatoryFramework.EMIR,
            classification="Financial Counterparty",
            classification_date=datetime.now() - timedelta(days=35),
            last_review_date=datetime.now() - timedelta(days=35),
            next_review_date=datetime.now() + timedelta(days=330),
            validation_status=ValidationStatus.VALIDATED
        )
        db.add(reg9b)

        # Add documents for Client9 (EU regimes)
        print("  Creating documents for Client9 (European Growth Fund SICAV)...")

        doc9_1 = Document(
            client_id=client9.id,
            regulatory_classification_id=reg9a.id,
            filename="SICAV_Registration_Certificate_Luxembourg_2024.pdf",
            file_path="/uploads/client9/sicav_registration.pdf",
            file_type="application/pdf",
            upload_date=datetime.now() - timedelta(days=37),
            uploaded_by="Pierre Dubois",
            document_category=DocumentCategory.ENTITY_DOCUMENTATION,
            ocr_status=OCRStatus.COMPLETED,
            extracted_text="CSSF Luxembourg - SICAV Registration Certificate - European Growth Fund SICAV registered under Part I of the Law of 2010..."
        )
        db.add(doc9_1)

        doc9_2 = Document(
            client_id=client9.id,
            regulatory_classification_id=reg9a.id,
            filename="UCITS_Compliance_Documentation_2024.pdf",
            file_path="/uploads/client9/ucits_compliance.pdf",
            file_type="application/pdf",
            upload_date=datetime.now() - timedelta(days=36),
            uploaded_by="Pierre Dubois",
            document_category=DocumentCategory.CLIENT_CONFIRMATION,
            ocr_status=OCRStatus.COMPLETED,
            extracted_text="UCITS V Compliance Documentation - European Growth Fund SICAV complies with UCITS V Directive requirements..."
        )
        db.add(doc9_2)

        doc9_3 = Document(
            client_id=client9.id,
            regulatory_classification_id=reg9b.id,
            filename="SFTR_Reporting_Confirmation_2024.pdf",
            file_path="/uploads/client9/sftr_reporting.pdf",
            file_type="application/pdf",
            upload_date=datetime.now() - timedelta(days=35),
            uploaded_by="Pierre Dubois",
            document_category=DocumentCategory.CLIENT_CONFIRMATION,
            ocr_status=OCRStatus.COMPLETED,
            extracted_text="SFTR Reporting Confirmation - Securities Financing Transactions Reporting under SFTR regulations established..."
        )
        db.add(doc9_3)

        doc9_4 = Document(
            client_id=client9.id,
            regulatory_classification_id=reg9a.id,
            filename="Professional_Client_Classification_SICAV_2024.pdf",
            file_path="/uploads/client9/professional_client_classification.pdf",
            file_type="application/pdf",
            upload_date=datetime.now() - timedelta(days=35),
            uploaded_by="Pierre Dubois",
            document_category=DocumentCategory.CLIENT_CONFIRMATION,
            ocr_status=OCRStatus.COMPLETED,
            extracted_text="Professional Client (Per Se) Classification - SICAV qualifies as Professional Client under MiFID II Annex II..."
        )
        db.add(doc9_4)

        # Add RegimeEligibility records for Client9 (EU SICAV regimes)
        print("  Creating regime eligibility records for Client9...")

        # MIFID - Eligible
        elig9_1 = RegimeEligibility(
            client_id=client9.id,
            regime="MIFID",
            is_eligible=True,
            eligibility_reason="Client meets all classification rules for MIFID",
            matched_rules=[{
                "rule_id": 1,
                "rule_type": "account_type",
                "rule_name": "MIFID Account Type Eligibility"
            }],
            unmatched_rules=[],
            client_attributes=client9.client_attributes,
            rule_version=1,
            last_evaluated_date=datetime.now() - timedelta(days=35),
            data_quality_score=98.0
        )
        db.add(elig9_1)

        # EMIR - Eligible
        elig9_2 = RegimeEligibility(
            client_id=client9.id,
            regime="EMIR",
            is_eligible=True,
            eligibility_reason="Client meets all classification rules for EMIR",
            matched_rules=[{
                "rule_id": 2,
                "rule_type": "account_type",
                "rule_name": "EMIR Account Type Eligibility"
            }],
            unmatched_rules=[],
            client_attributes=client9.client_attributes,
            rule_version=1,
            last_evaluated_date=datetime.now() - timedelta(days=35),
            data_quality_score=98.0
        )
        db.add(elig9_2)

        # SFTR - Eligible
        elig9_3 = RegimeEligibility(
            client_id=client9.id,
            regime="SFTR",
            is_eligible=True,
            eligibility_reason="Client meets all classification rules for SFTR",
            matched_rules=[{
                "rule_id": 9,
                "rule_type": "account_type",
                "rule_name": "SFTR Account Type Eligibility"
            }],
            unmatched_rules=[],
            client_attributes=client9.client_attributes,
            rule_version=1,
            last_evaluated_date=datetime.now() - timedelta(days=35),
            data_quality_score=96.0
        )
        db.add(elig9_3)

        # Stays Exempt - Eligible
        elig9_4 = RegimeEligibility(
            client_id=client9.id,
            regime="Stays Exempt",
            is_eligible=True,
            eligibility_reason="Client meets all classification rules for Stays Exempt",
            matched_rules=[{
                "rule_id": 5,
                "rule_type": "account_type",
                "rule_name": "Stays Exempt Account Type Eligibility"
            }],
            unmatched_rules=[],
            client_attributes=client9.client_attributes,
            rule_version=1,
            last_evaluated_date=datetime.now() - timedelta(days=35),
            data_quality_score=98.0
        )
        db.add(elig9_4)

        # Client 10: Canadian Insurance Company
        client10 = Client(
            name="Toronto Life & General Insurance Co",
            legal_entity_id="SX010345",
            country_of_incorporation="Canada",
            entity_type="Insurance Company",
            onboarding_status=OnboardingStatus.INITIATED,
            assigned_rm="Robert MacDonald",
            created_date=datetime.now() - timedelta(days=7),
            client_attributes={
                "account_type": "trading_entity",
                "booking_location": "Canada/Toronto",
                "product": "Credit Forwards",
                "product_grid": {
                    "product_group": "financial_markets",
                    "product_category": "credit",
                    "product_type": "forward",
                    "product_status": "approved",
                    "bank_entity": "Canada/Toronto"
                }
            }
        )
        db.add(client10)
        db.flush()

        create_onboarding_stages(db, client10.id, [
            {"name": StageName.LEGAL_ENTITY_SETUP, "status": StageStatus.COMPLETED, "assigned_team": "Entity Management",
             "started_date": datetime.now() - timedelta(days=7), "completed_date": datetime.now() - timedelta(days=5)},
            {"name": StageName.REG_CLASSIFICATION, "status": StageStatus.IN_PROGRESS, "assigned_team": "Compliance",
             "started_date": datetime.now() - timedelta(days=5), "notes": "Analyzing insurance company classification under multiple frameworks"},
            {"name": StageName.FM_ACCOUNT_REQUEST, "status": StageStatus.NOT_STARTED, "assigned_team": "FM Operations"},
            {"name": StageName.STATIC_DATA_ENRICHMENT, "status": StageStatus.NOT_STARTED, "assigned_team": "FM Ops - Data"},
            {"name": StageName.SSI_VALIDATION, "status": StageStatus.NOT_STARTED, "assigned_team": "SSI Team"},
            {"name": StageName.VALUATION_SETUP, "status": StageStatus.NOT_STARTED, "assigned_team": "Valuation Team"}
        ])

        reg10 = RegulatoryClassification(
            client_id=client10.id,
            framework=RegulatoryFramework.MIFID_II,
            classification="Professional Client (Per Se)",
            classification_date=datetime.now() - timedelta(days=4),
            validation_status=ValidationStatus.PENDING
        )
        db.add(reg10)

        # =====================================================
        # RBI REGIME - Classification Rules & Mandatory Evidences
        # =====================================================
        print("\nCreating RBI classification rules and mandatory evidences...")

        # RBI Classification Rule 1: Account Type
        rbi_rule1 = ClassificationRule(
            regime="RBI",
            rule_type="account_type",
            rule_name="RBI Account Type Eligibility",
            rule_config={
                "in_scope": ["subfund", "trading_entity", "pooled_account", "allocation_account"],
                "out_of_scope": ["private_banking", "business_banking"]
            },
            description="Account types eligible for RBI regime. Excludes private and business banking.",
            is_active=True,
            version=1,
            created_by="System"
        )
        db.add(rbi_rule1)

        # RBI Classification Rule 2: Booking Location
        rbi_rule2 = ClassificationRule(
            regime="RBI",
            rule_type="booking_location",
            rule_name="RBI Booking Location Requirement",
            rule_config={
                "allowed_locations": ["India/HDFC", "India/ICICI", "India/SBI", "India/AXIS"],
                "allowed_patterns": ["India/*"]
            },
            description="Booking location must be in India with specified bank code",
            is_active=True,
            version=1,
            created_by="System"
        )
        db.add(rbi_rule2)

        # RBI Classification Rule 3: Product Grid
        rbi_rule3 = ClassificationRule(
            regime="RBI",
            rule_type="product_grid",
            rule_name="RBI Product Grid Approval",
            rule_config={
                "required_attributes": {
                    "product_group": {
                        "allowed_values": ["financial_markets"]
                    },
                    "product_category": {
                        "allowed_values": ["credit", "fx", "interest_rate"]
                    },
                    "product_type": {
                        "allowed_values": ["forward", "option", "swap", "swaption"]
                    },
                    "product_status": {
                        "allowed_values": ["approved"]
                    },
                    "bank_entity": {
                        "allowed_values": ["India/HDFC", "India/ICICI", "India/SBI", "India/AXIS"]
                    }
                }
            },
            description="Product must be approved for financial markets trading in India",
            is_active=True,
            version=1,
            created_by="System"
        )
        db.add(rbi_rule3)

        # RBI Mandatory Evidences
        rbi_evidence1 = MandatoryEvidence(
            regime="RBI",
            evidence_type="rbi_registration_certificate",
            evidence_name="RBI Registration Certificate",
            category=EvidenceCategory.REGULATORY_COMPLIANCE,
            description="Valid RBI registration certificate for foreign exchange trading",
            is_mandatory=True,
            validity_days=365,
            is_active=True
        )
        db.add(rbi_evidence1)

        rbi_evidence2 = MandatoryEvidence(
            regime="RBI",
            evidence_type="kyc_documentation",
            evidence_name="KYC Documentation",
            category=EvidenceCategory.KYC_DOCUMENTATION,
            description="Complete KYC documentation as per RBI norms",
            is_mandatory=True,
            validity_days=365,
            is_active=True
        )
        db.add(rbi_evidence2)

        rbi_evidence3 = MandatoryEvidence(
            regime="RBI",
            evidence_type="board_resolution",
            evidence_name="Board Resolution for FX Trading",
            category=EvidenceCategory.LEGAL_AGREEMENTS,
            description="Board resolution authorizing foreign exchange trading",
            is_mandatory=True,
            validity_days=None,  # No expiry
            is_active=True
        )
        db.add(rbi_evidence3)

        rbi_evidence4 = MandatoryEvidence(
            regime="RBI",
            evidence_type="product_approval_matrix",
            evidence_name="Product Approval Matrix",
            category=EvidenceCategory.PRODUCT_APPROVAL,
            description="Approved product matrix signed by authorized signatory",
            is_mandatory=True,
            validity_days=180,
            is_active=True
        )
        db.add(rbi_evidence4)

        # Add RBI-specific clients with varying attributes
        print("\nCreating RBI-specific clients...")

        # Client 11: Indian Corporation - Fully Eligible for RBI
        client11 = Client(
            name="Mumbai Financial Services Pvt Ltd",
            legal_entity_id="SX011111",
            country_of_incorporation="India",
            entity_type="Private Limited Company",
            onboarding_status=OnboardingStatus.IN_PROGRESS,
            assigned_rm="Rajesh Kumar",
            created_date=datetime.now() - timedelta(days=15),
            client_attributes={
                "account_type": "trading_entity",
                "booking_location": "India/HDFC",
                "product": "FX Forwards",
                "product_grid": {
                    "product_group": "financial_markets",
                    "product_category": "fx",
                    "product_type": "forward",
                    "product_status": "approved",
                    "bank_entity": "India/HDFC"
                }
            }
        )
        db.add(client11)
        db.flush()

        create_onboarding_stages(db, client11.id, [
            {"name": StageName.LEGAL_ENTITY_SETUP, "status": StageStatus.COMPLETED, "assigned_team": "Entity Management",
             "started_date": datetime.now() - timedelta(days=15), "completed_date": datetime.now() - timedelta(days=13)},
            {"name": StageName.REG_CLASSIFICATION, "status": StageStatus.IN_PROGRESS, "assigned_team": "Compliance",
             "started_date": datetime.now() - timedelta(days=13), "notes": "Evaluating RBI eligibility"},
            {"name": StageName.FM_ACCOUNT_REQUEST, "status": StageStatus.NOT_STARTED, "assigned_team": "FM Operations"},
            {"name": StageName.STATIC_DATA_ENRICHMENT, "status": StageStatus.NOT_STARTED, "assigned_team": "FM Ops - Data"},
            {"name": StageName.SSI_VALIDATION, "status": StageStatus.NOT_STARTED, "assigned_team": "SSI Team"},
            {"name": StageName.VALUATION_SETUP, "status": StageStatus.NOT_STARTED, "assigned_team": "Valuation Team"}
        ])

        # Client 12: Indian Fund - Partially Eligible (missing product approval)
        client12 = Client(
            name="Delhi Investment Fund",
            legal_entity_id="SX012222",
            country_of_incorporation="India",
            entity_type="Investment Fund",
            onboarding_status=OnboardingStatus.IN_PROGRESS,
            assigned_rm="Priya Sharma",
            created_date=datetime.now() - timedelta(days=20),
            client_attributes={
                "account_type": "subfund",
                "booking_location": "India/ICICI",
                "product": "Interest Rate Swaps",
                "product_grid": {
                    "product_group": "financial_markets",
                    "product_category": "interest_rate",
                    "product_type": "swap",
                    "product_status": "pending_approval",  # Not approved yet!
                    "bank_entity": "India/ICICI"
                }
            }
        )
        db.add(client12)
        db.flush()

        create_onboarding_stages(db, client12.id, [
            {"name": StageName.LEGAL_ENTITY_SETUP, "status": StageStatus.IN_PROGRESS, "assigned_team": "Entity Management",
             "started_date": datetime.now() - timedelta(days=20), "notes": "Awaiting product approval"},
            {"name": StageName.REG_CLASSIFICATION, "status": StageStatus.NOT_STARTED, "assigned_team": "Compliance"},
            {"name": StageName.FM_ACCOUNT_REQUEST, "status": StageStatus.NOT_STARTED, "assigned_team": "FM Operations"},
            {"name": StageName.STATIC_DATA_ENRICHMENT, "status": StageStatus.NOT_STARTED, "assigned_team": "FM Ops - Data"},
            {"name": StageName.SSI_VALIDATION, "status": StageStatus.NOT_STARTED, "assigned_team": "SSI Team"},
            {"name": StageName.VALUATION_SETUP, "status": StageStatus.NOT_STARTED, "assigned_team": "Valuation Team"}
        ])

        # Client 13: Private Banking - Out of Scope
        client13 = Client(
            name="Bangalore Private Wealth Management",
            legal_entity_id="SX013333",
            country_of_incorporation="India",
            entity_type="Private Banking",
            onboarding_status=OnboardingStatus.BLOCKED,
            assigned_rm="Anil Verma",
            created_date=datetime.now() - timedelta(days=10),
            client_attributes={
                "account_type": "private_banking",  # Out of scope!
                "booking_location": "India/SBI",
                "product": "FX Forwards",
                "product_grid": {
                    "product_group": "financial_markets",
                    "product_category": "fx",
                    "product_type": "forward",
                    "product_status": "approved",
                    "bank_entity": "India/SBI"
                }
            }
        )
        db.add(client13)
        db.flush()

        create_onboarding_stages(db, client13.id, [
            {"name": StageName.LEGAL_ENTITY_SETUP, "status": StageStatus.COMPLETED, "assigned_team": "Entity Management",
             "started_date": datetime.now() - timedelta(days=10), "completed_date": datetime.now() - timedelta(days=8)},
            {"name": StageName.REG_CLASSIFICATION, "status": StageStatus.BLOCKED, "assigned_team": "Compliance",
             "started_date": datetime.now() - timedelta(days=8), "notes": "Private banking accounts are out of scope for RBI regime"},
            {"name": StageName.FM_ACCOUNT_REQUEST, "status": StageStatus.NOT_STARTED, "assigned_team": "FM Operations"},
            {"name": StageName.STATIC_DATA_ENRICHMENT, "status": StageStatus.NOT_STARTED, "assigned_team": "FM Ops - Data"},
            {"name": StageName.SSI_VALIDATION, "status": StageStatus.NOT_STARTED, "assigned_team": "SSI Team"},
            {"name": StageName.VALUATION_SETUP, "status": StageStatus.NOT_STARTED, "assigned_team": "Valuation Team"}
        ])

        db.commit()

        # =====================================================
        # ALL ADDITIONAL REGIMES - Classification Rules
        # =====================================================
        print("\nCreating classification rules for all 20 regimes...")

        # List of all regimes to create basic rules for
        all_regimes = [
            "MIFID", "EMIR", "MAS Margin", "MAS Clearing", "MAS Transaction Reporting",
            "MAS FAIR Client Classification", "Dodd Frank (US Person - CFTC)", "Dodd Frank (SEC)",
            "SFTR", "HKMA Margin", "HKMA Clearing", "HKMA Transaction Reporting",
            "Canadian Transaction Reporting(CAD)", "RBI Variation Margin", "India NDDC TR",
            "ASIC TR", "ZAR MR", "Stays Exempt", "DF Deemed ISDA", "Indonesia Margin Classification"
        ]

        # Create basic classification rules for each regime
        for regime in all_regimes:
            # Create basic account type rule for each regime
            rule = ClassificationRule(
                regime=regime,
                rule_type="account_type",
                rule_name=f"{regime} Account Type Eligibility",
                rule_config={
                    "in_scope": ["subfund", "trading_entity", "pooled_account", "allocation_account"],
                    "out_of_scope": ["private_banking", "business_banking"]
                },
                description=f"Basic account type eligibility for {regime} regime",
                is_active=True,
                version=1,
                created_by="System"
            )
            db.add(rule)

            # Create basic mandatory evidence for each regime
            evidence = MandatoryEvidence(
                regime=regime,
                evidence_type="kyc_documentation",
                evidence_name=f"{regime} KYC Documentation",
                category=EvidenceCategory.KYC_DOCUMENTATION,
                description=f"KYC documentation required for {regime} regime compliance",
                is_mandatory=True,
                validity_days=365,
                is_active=True
            )
            db.add(evidence)

        print(f"Created basic classification rules for {len(all_regimes)} regimes")
        db.commit()

        # Link seeded documents to DocumentRequirements
        print("\nLinking seeded documents to document requirements...")

        # Get all evidences to map documents to requirements
        all_evidences = {(e.regime, e.evidence_type): e for e in db.query(MandatoryEvidence).all()}

        # Client1 - MIFID regime document requirements
        print("  Creating document requirements for Client1 (MIFID regime)...")

        # Map each Client1 document to appropriate evidence and create requirement
        # doc1_1: Professional Client Attestation -> client_confirmation evidence
        if ("MIFID", "kyc_documentation") in all_evidences:
            req1_1 = DocumentRequirement(
                client_id=client1.id,
                regime="MIFID",
                evidence_id=all_evidences[("MIFID", "kyc_documentation")].id,
                document_id=doc1_1.id,
                status="compliant",
                received_date=doc1_1.upload_date,
                expiry_date=doc1_1.upload_date + timedelta(days=365)
            )
            db.add(req1_1)

        # doc1_2: Registration Certificate -> entity_documentation evidence
        if ("MIFID", "kyc_documentation") in all_evidences:
            req1_2 = DocumentRequirement(
                client_id=client1.id,
                regime="MIFID",
                evidence_id=all_evidences[("MIFID", "kyc_documentation")].id,
                document_id=doc1_2.id,
                status="compliant",
                received_date=doc1_2.upload_date,
                expiry_date=doc1_2.upload_date + timedelta(days=730)  # Registration cert valid 2 years
            )
            db.add(req1_2)

        # doc1_3: Board Resolution -> client_confirmation evidence
        if ("EMIR", "kyc_documentation") in all_evidences:
            req1_3 = DocumentRequirement(
                client_id=client1.id,
                regime="EMIR",
                evidence_id=all_evidences[("EMIR", "kyc_documentation")].id,
                document_id=doc1_3.id,
                status="compliant",
                received_date=doc1_3.upload_date,
                expiry_date=doc1_3.upload_date + timedelta(days=365)
            )
            db.add(req1_3)

        # doc1_4: Financial Statements -> financial_statements evidence
        if ("MIFID", "kyc_documentation") in all_evidences:
            req1_4 = DocumentRequirement(
                client_id=client1.id,
                regime="MIFID",
                evidence_id=all_evidences[("MIFID", "kyc_documentation")].id,
                document_id=doc1_4.id,
                status="compliant",
                received_date=doc1_4.upload_date,
                expiry_date=doc1_4.upload_date + timedelta(days=365)
            )
            db.add(req1_4)

        # doc1_5: KYC Package -> kyc_documentation evidence
        if ("EMIR", "kyc_documentation") in all_evidences:
            req1_5 = DocumentRequirement(
                client_id=client1.id,
                regime="EMIR",
                evidence_id=all_evidences[("EMIR", "kyc_documentation")].id,
                document_id=doc1_5.id,
                status="compliant",
                received_date=doc1_5.upload_date,
                expiry_date=doc1_5.upload_date + timedelta(days=365)
            )
            db.add(req1_5)

        # doc1_6: Risk Disclosure (EXPIRED) -> product_eligibility evidence
        if ("MIFID", "kyc_documentation") in all_evidences:
            req1_6 = DocumentRequirement(
                client_id=client1.id,
                regime="MIFID",
                evidence_id=all_evidences[("MIFID", "kyc_documentation")].id,
                document_id=doc1_6.id,
                status="expired",
                received_date=doc1_6.upload_date,
                expiry_date=doc1_6.upload_date + timedelta(days=180)  # Expired after 180 days
            )
            db.add(req1_6)

        # doc1_7: Product Approval (EXPIRED) -> product_eligibility evidence
        if ("EMIR", "kyc_documentation") in all_evidences:
            req1_7 = DocumentRequirement(
                client_id=client1.id,
                regime="EMIR",
                evidence_id=all_evidences[("EMIR", "kyc_documentation")].id,
                document_id=doc1_7.id,
                status="expired",
                received_date=doc1_7.upload_date,
                expiry_date=doc1_7.upload_date + timedelta(days=90)  # Expired after 90 days
            )
            db.add(req1_7)

        # doc1_8: Financial Statements Q3 (PENDING REVIEW) -> financial_statements evidence
        if ("MIFID", "kyc_documentation") in all_evidences:
            req1_8 = DocumentRequirement(
                client_id=client1.id,
                regime="MIFID",
                evidence_id=all_evidences[("MIFID", "kyc_documentation")].id,
                document_id=doc1_8.id,
                status="pending_review",
                received_date=doc1_8.upload_date,
                expiry_date=None  # Not yet validated
            )
            db.add(req1_8)

        # doc1_9: Director ID (PENDING REVIEW) -> client_confirmation evidence
        if ("EMIR", "kyc_documentation") in all_evidences:
            req1_9 = DocumentRequirement(
                client_id=client1.id,
                regime="EMIR",
                evidence_id=all_evidences[("EMIR", "kyc_documentation")].id,
                document_id=doc1_9.id,
                status="uploaded",
                received_date=doc1_9.upload_date,
                expiry_date=doc1_9.upload_date + timedelta(days=365)
            )
            db.add(req1_9)

        # Client7 - MAS regime document requirements
        print("  Creating document requirements for Client7 (MAS regimes)...")

        # Map each Client7 document to appropriate evidence and create requirement
        # doc7_1: KYC Package -> kyc_documentation evidence
        if ("MAS Margin", "kyc_documentation") in all_evidences:
            req7_1 = DocumentRequirement(
                client_id=client7.id,
                regime="MAS Margin",
                evidence_id=all_evidences[("MAS Margin", "kyc_documentation")].id,
                document_id=doc7_1.id,
                status="compliant",
                received_date=doc7_1.upload_date,
                expiry_date=doc7_1.upload_date + timedelta(days=365)
            )
            db.add(req7_1)

        # doc7_2: MAS Registration -> registration_certificate evidence
        if ("MAS Clearing", "kyc_documentation") in all_evidences:
            req7_2 = DocumentRequirement(
                client_id=client7.id,
                regime="MAS Clearing",
                evidence_id=all_evidences[("MAS Clearing", "kyc_documentation")].id,
                document_id=doc7_2.id,
                status="compliant",
                received_date=doc7_2.upload_date,
                expiry_date=doc7_2.upload_date + timedelta(days=730)
            )
            db.add(req7_2)

        # doc7_3: Financial Statements -> financial_statements evidence
        if ("MAS Transaction Reporting", "kyc_documentation") in all_evidences:
            req7_3 = DocumentRequirement(
                client_id=client7.id,
                regime="MAS Transaction Reporting",
                evidence_id=all_evidences[("MAS Transaction Reporting", "kyc_documentation")].id,
                document_id=doc7_3.id,
                status="compliant",
                received_date=doc7_3.upload_date,
                expiry_date=doc7_3.upload_date + timedelta(days=365)
            )
            db.add(req7_3)

        # doc7_4: Board Resolution -> board_resolution evidence
        if ("MAS FAIR Client Classification", "kyc_documentation") in all_evidences:
            req7_4 = DocumentRequirement(
                client_id=client7.id,
                regime="MAS FAIR Client Classification",
                evidence_id=all_evidences[("MAS FAIR Client Classification", "kyc_documentation")].id,
                document_id=doc7_4.id,
                status="compliant",
                received_date=doc7_4.upload_date,
                expiry_date=doc7_4.upload_date + timedelta(days=365)
            )
            db.add(req7_4)

        # doc7_5: Product Approval Matrix -> product_approval evidence
        if ("MAS Margin", "kyc_documentation") in all_evidences:
            req7_5 = DocumentRequirement(
                client_id=client7.id,
                regime="MAS Margin",
                evidence_id=all_evidences[("MAS Margin", "kyc_documentation")].id,
                document_id=doc7_5.id,
                status="compliant",
                received_date=doc7_5.upload_date,
                expiry_date=doc7_5.upload_date + timedelta(days=180)
            )
            db.add(req7_5)

        # doc7_6: Risk Disclosure (EXPIRED) -> product_eligibility evidence
        if ("MAS Clearing", "kyc_documentation") in all_evidences:
            req7_6 = DocumentRequirement(
                client_id=client7.id,
                regime="MAS Clearing",
                evidence_id=all_evidences[("MAS Clearing", "kyc_documentation")].id,
                document_id=doc7_6.id,
                status="expired",
                received_date=doc7_6.upload_date,
                expiry_date=doc7_6.upload_date + timedelta(days=180)
            )
            db.add(req7_6)

        # doc7_7: Client Confirmation (EXPIRED) -> client_confirmation evidence
        if ("MAS Transaction Reporting", "kyc_documentation") in all_evidences:
            req7_7 = DocumentRequirement(
                client_id=client7.id,
                regime="MAS Transaction Reporting",
                evidence_id=all_evidences[("MAS Transaction Reporting", "kyc_documentation")].id,
                document_id=doc7_7.id,
                status="expired",
                received_date=doc7_7.upload_date,
                expiry_date=doc7_7.upload_date + timedelta(days=90)
            )
            db.add(req7_7)

        # doc7_8: Updated Financial Statements (PENDING REVIEW) -> financial_statements evidence
        if ("MAS FAIR Client Classification", "kyc_documentation") in all_evidences:
            req7_8 = DocumentRequirement(
                client_id=client7.id,
                regime="MAS FAIR Client Classification",
                evidence_id=all_evidences[("MAS FAIR Client Classification", "kyc_documentation")].id,
                document_id=doc7_8.id,
                status="pending_review",
                received_date=doc7_8.upload_date,
                expiry_date=None
            )
            db.add(req7_8)

        # doc7_9: Beneficial Ownership Declaration (UPLOADED) -> client_confirmation evidence
        if ("MAS Margin", "kyc_documentation") in all_evidences:
            req7_9 = DocumentRequirement(
                client_id=client7.id,
                regime="MAS Margin",
                evidence_id=all_evidences[("MAS Margin", "kyc_documentation")].id,
                document_id=doc7_9.id,
                status="uploaded",
                received_date=doc7_9.upload_date,
                expiry_date=doc7_9.upload_date + timedelta(days=365)
            )
            db.add(req7_9)

        # Client2 - Dodd Frank regime document requirements
        print("  Creating document requirements for Client2 (Dodd Frank regimes)...")

        # doc2_1: ECP Attestation -> Dodd Frank regimes
        if ("Dodd Frank (US Person - CFTC)", "kyc_documentation") in all_evidences:
            req2_1 = DocumentRequirement(
                client_id=client2.id,
                regime="Dodd Frank (US Person - CFTC)",
                evidence_id=all_evidences[("Dodd Frank (US Person - CFTC)", "kyc_documentation")].id,
                document_id=doc2_1.id,
                status="compliant",
                received_date=doc2_1.upload_date,
                expiry_date=doc2_1.upload_date + timedelta(days=365)
            )
            db.add(req2_1)

        # doc2_2: ISDA Protocol -> Dodd Frank regimes
        if ("Dodd Frank (SEC)", "kyc_documentation") in all_evidences:
            req2_2 = DocumentRequirement(
                client_id=client2.id,
                regime="Dodd Frank (SEC)",
                evidence_id=all_evidences[("Dodd Frank (SEC)", "kyc_documentation")].id,
                document_id=doc2_2.id,
                status="compliant",
                received_date=doc2_2.upload_date,
                expiry_date=doc2_2.upload_date + timedelta(days=365)
            )
            db.add(req2_2)

        # doc2_3: Financial Statements -> DF Deemed ISDA
        if ("DF Deemed ISDA", "kyc_documentation") in all_evidences:
            req2_3 = DocumentRequirement(
                client_id=client2.id,
                regime="DF Deemed ISDA",
                evidence_id=all_evidences[("DF Deemed ISDA", "kyc_documentation")].id,
                document_id=doc2_3.id,
                status="compliant",
                received_date=doc2_3.upload_date,
                expiry_date=doc2_3.upload_date + timedelta(days=365)
            )
            db.add(req2_3)

        # Client5 - Asian + EU regime document requirements
        print("  Creating document requirements for Client5 (Asian + EU regimes)...")

        # doc5_1: Professional Client Attestation -> MIFID
        if ("MIFID", "kyc_documentation") in all_evidences:
            req5_1 = DocumentRequirement(
                client_id=client5.id,
                regime="MIFID",
                evidence_id=all_evidences[("MIFID", "kyc_documentation")].id,
                document_id=doc5_1.id,
                status="compliant",
                received_date=doc5_1.upload_date,
                expiry_date=doc5_1.upload_date + timedelta(days=365)
            )
            db.add(req5_1)

        # doc5_2: EMIR FC Classification -> EMIR
        if ("EMIR", "kyc_documentation") in all_evidences:
            req5_2 = DocumentRequirement(
                client_id=client5.id,
                regime="EMIR",
                evidence_id=all_evidences[("EMIR", "kyc_documentation")].id,
                document_id=doc5_2.id,
                status="compliant",
                received_date=doc5_2.upload_date,
                expiry_date=doc5_2.upload_date + timedelta(days=365)
            )
            db.add(req5_2)

        # doc5_3: HKMA Registration -> HKMA Margin
        if ("HKMA Margin", "kyc_documentation") in all_evidences:
            req5_3 = DocumentRequirement(
                client_id=client5.id,
                regime="HKMA Margin",
                evidence_id=all_evidences[("HKMA Margin", "kyc_documentation")].id,
                document_id=doc5_3.id,
                status="compliant",
                received_date=doc5_3.upload_date,
                expiry_date=doc5_3.upload_date + timedelta(days=730)
            )
            db.add(req5_3)

        # doc5_4: Financial Statements -> HKMA Clearing
        if ("HKMA Clearing", "kyc_documentation") in all_evidences:
            req5_4 = DocumentRequirement(
                client_id=client5.id,
                regime="HKMA Clearing",
                evidence_id=all_evidences[("HKMA Clearing", "kyc_documentation")].id,
                document_id=doc5_4.id,
                status="compliant",
                received_date=doc5_4.upload_date,
                expiry_date=doc5_4.upload_date + timedelta(days=365)
            )
            db.add(req5_4)

        # doc5_5: MAS Authorization -> MAS Margin
        if ("MAS Margin", "kyc_documentation") in all_evidences:
            req5_5 = DocumentRequirement(
                client_id=client5.id,
                regime="MAS Margin",
                evidence_id=all_evidences[("MAS Margin", "kyc_documentation")].id,
                document_id=doc5_5.id,
                status="compliant",
                received_date=doc5_5.upload_date,
                expiry_date=doc5_5.upload_date + timedelta(days=365)
            )
            db.add(req5_5)

        # Client8 - Australian regime document requirements
        print("  Creating document requirements for Client8 (Australian regimes)...")

        # doc8_1: ASIC Registration -> ASIC TR
        if ("ASIC TR", "kyc_documentation") in all_evidences:
            req8_1 = DocumentRequirement(
                client_id=client8.id,
                regime="ASIC TR",
                evidence_id=all_evidences[("ASIC TR", "kyc_documentation")].id,
                document_id=doc8_1.id,
                status="compliant",
                received_date=doc8_1.upload_date,
                expiry_date=doc8_1.upload_date + timedelta(days=730)
            )
            db.add(req8_1)

        # doc8_2: Superannuation License -> ASIC TR
        if ("ASIC TR", "kyc_documentation") in all_evidences:
            req8_2 = DocumentRequirement(
                client_id=client8.id,
                regime="ASIC TR",
                evidence_id=all_evidences[("ASIC TR", "kyc_documentation")].id,
                document_id=doc8_2.id,
                status="compliant",
                received_date=doc8_2.upload_date,
                expiry_date=doc8_2.upload_date + timedelta(days=730)
            )
            db.add(req8_2)

        # doc8_3: Professional Client Attestation -> MIFID
        if ("MIFID", "kyc_documentation") in all_evidences:
            req8_3 = DocumentRequirement(
                client_id=client8.id,
                regime="MIFID",
                evidence_id=all_evidences[("MIFID", "kyc_documentation")].id,
                document_id=doc8_3.id,
                status="compliant",
                received_date=doc8_3.upload_date,
                expiry_date=doc8_3.upload_date + timedelta(days=365)
            )
            db.add(req8_3)

        # Client9 - EU regime document requirements
        print("  Creating document requirements for Client9 (EU regimes)...")

        # doc9_1: SICAV Registration -> MIFID
        if ("MIFID", "kyc_documentation") in all_evidences:
            req9_1 = DocumentRequirement(
                client_id=client9.id,
                regime="MIFID",
                evidence_id=all_evidences[("MIFID", "kyc_documentation")].id,
                document_id=doc9_1.id,
                status="compliant",
                received_date=doc9_1.upload_date,
                expiry_date=doc9_1.upload_date + timedelta(days=730)
            )
            db.add(req9_1)

        # doc9_2: UCITS Compliance -> EMIR
        if ("EMIR", "kyc_documentation") in all_evidences:
            req9_2 = DocumentRequirement(
                client_id=client9.id,
                regime="EMIR",
                evidence_id=all_evidences[("EMIR", "kyc_documentation")].id,
                document_id=doc9_2.id,
                status="compliant",
                received_date=doc9_2.upload_date,
                expiry_date=doc9_2.upload_date + timedelta(days=365)
            )
            db.add(req9_2)

        # doc9_3: SFTR Reporting -> SFTR
        if ("SFTR", "kyc_documentation") in all_evidences:
            req9_3 = DocumentRequirement(
                client_id=client9.id,
                regime="SFTR",
                evidence_id=all_evidences[("SFTR", "kyc_documentation")].id,
                document_id=doc9_3.id,
                status="compliant",
                received_date=doc9_3.upload_date,
                expiry_date=doc9_3.upload_date + timedelta(days=180)
            )
            db.add(req9_3)

        # doc9_4: Professional Client Classification -> Stays Exempt
        if ("Stays Exempt", "kyc_documentation") in all_evidences:
            req9_4 = DocumentRequirement(
                client_id=client9.id,
                regime="Stays Exempt",
                evidence_id=all_evidences[("Stays Exempt", "kyc_documentation")].id,
                document_id=doc9_4.id,
                status="compliant",
                received_date=doc9_4.upload_date,
                expiry_date=doc9_4.upload_date + timedelta(days=365)
            )
            db.add(req9_4)

        db.commit()
        print(f"  Linked {32} documents to document requirements for demo clients (18 original + 14 new)")

        # Evaluate RBI eligibility for new clients
        print("\nEvaluating RBI eligibility for clients...")
        engine = ClassificationEngine(db)

        for client_id in [client11.id, client12.id, client13.id]:
            try:
                result = engine.evaluate_client_eligibility(client_id, "RBI")
                client = db.query(Client).filter(Client.id == client_id).first()
                status = "✅ ELIGIBLE" if result["is_eligible"] else "❌ NOT ELIGIBLE"
                print(f"  {client.name}: {status}")
                print(f"    Reason: {result['reason']}")
            except Exception as e:
                print(f"  Error evaluating client {client_id}: {str(e)}")

        db.commit()
        print("\n" + "="*70)
        print("✅ Database seeded successfully with 13 clients!")
        print("="*70)
        print("\n📊 Demo-Ready Clients with Regime Eligibility:")
        print("1. Aldgate Capital Partners LLP (UK) - COMPLETED | 3 regimes (MIFID, EMIR, Stays Exempt)")
        print("2. American Retirement Trust Fund (US) - IN PROGRESS | 4 regimes (Dodd Frank CFTC/SEC, DF Deemed ISDA, Stays Exempt) ⭐NEW")
        print("3. Frankfurt Asset Management GmbH (DE) - BLOCKED (Missing docs)")
        print("4. Cayman Global Investment Fund I Ltd (KY) - INITIATED")
        print("5. Tokyo International Bank Ltd (JP) - IN PROGRESS | 5 regimes (MIFID, EMIR, HKMA Margin/Clearing, MAS Margin) ⭐NEW")
        print("6. Zurich Family Office AG (CH) - IN PROGRESS (Review OVERDUE)")
        print("7. Singapore Strategic Investment Fund (SG) - COMPLETED | 8 regimes (MAS x4, HKMA Margin, MIFID, Stays Exempt, ASIC TR) ⭐ENHANCED")
        print("8. Melbourne Retirement Super Fund (AU) - IN PROGRESS | 2 regimes (ASIC TR, MIFID) ⭐NEW")
        print("9. European Growth Fund SICAV (LU) - IN PROGRESS | 4 regimes (MIFID, EMIR, SFTR, Stays Exempt) ⭐NEW")
        print("10. Toronto Life & General Insurance Co (CA) - INITIATED")
        print("\n🏦 RBI Regime Clients (11-13):")
        print("11. Mumbai Financial Services Pvt Ltd (IN) - RBI Eligible ✅ | 2 regimes")
        print("12. Delhi Investment Fund (IN) - ⭐⭐⭐ CLIENT CENTRAL APPROVAL SIMULATION | Pending product approval")
        print("13. Bangalore Private Wealth Management (IN) - RBI Out of Scope ❌")
        print("\n📈 Regime Coverage Statistics:")
        print("  • Total clients with regime eligibility: 8 out of 13 (62%)")
        print("  • Average regimes per eligible client: 3.5")
        print("  • Total regime evaluations: 28")
        print("  • Total documents with regime links: 32")
        print("  • Unique regimes demonstrated: 15 out of 20 (75%)")
        print("\n" + "="*70)
        print("Regulatory Regimes Configured: 20")
        print("  - MIFID, EMIR, SFTR")
        print("  - MAS Margin, MAS Clearing, MAS Transaction Reporting, MAS FAIR Client Classification")
        print("  - HKMA Margin, HKMA Clearing, HKMA Transaction Reporting")
        print("  - Dodd Frank (US Person - CFTC), Dodd Frank (SEC), DF Deemed ISDA")
        print("  - Canadian Transaction Reporting(CAD)")
        print("  - RBI Variation Margin, India NDDC TR")
        print("  - ASIC TR, ZAR MR")
        print("  - Stays Exempt, Indonesia Margin Classification")
        print("\nRBI Detailed Classification Rules Created: 3")
        print("  - Account Type Eligibility")
        print("  - Booking Location Requirement")
        print("  - Product Grid Approval")
        print("\nRBI Mandatory Evidences Created: 4")
        print("  - RBI Registration Certificate")
        print("  - KYC Documentation")
        print("  - Board Resolution for FX Trading")
        print("  - Product Approval Matrix")
        print("="*70)

    except Exception as e:
        print(f"❌ Error seeding database: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_data()
