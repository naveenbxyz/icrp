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
from .services.classification_engine import ClassificationEngine


def clear_database():
    """Clear all data from database"""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def create_onboarding_stages(db, client_id: int, stages_config: list):
    """Helper to create onboarding stages"""
    stages = []
    for idx, config in enumerate(stages_config):
        stage = OnboardingStage(
            client_id=client_id,
            stage_name=config["name"],
            status=config["status"],
            assigned_team=config.get("assigned_team"),
            started_date=config.get("started_date"),
            completed_date=config.get("completed_date"),
            notes=config.get("notes"),
            order=idx
        )
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
            jurisdiction="United Kingdom",
            entity_type="Limited Liability Partnership",
            onboarding_status=OnboardingStatus.COMPLETED,
            assigned_rm="Sarah Johnson",
            created_date=datetime.now() - timedelta(days=90)
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
            last_review_date=datetime.now() - timedelta(days=30),
            next_review_date=datetime.now() + timedelta(days=335),
            validation_status=ValidationStatus.VALIDATED
        )
        db.add(reg1)

        # Client 2: US Corporate Pension Fund - In Progress (SSI Validation)
        client2 = Client(
            name="American Retirement Trust Fund",
            legal_entity_id="SX002456",
            jurisdiction="United States",
            entity_type="Corporate Pension Fund",
            onboarding_status=OnboardingStatus.IN_PROGRESS,
            assigned_rm="Michael Chen",
            created_date=datetime.now() - timedelta(days=45)
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

        # Client 3: German Asset Manager - Blocked (missing documentation)
        client3 = Client(
            name="Frankfurt Asset Management GmbH",
            legal_entity_id="SX003789",
            jurisdiction="Germany",
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
            jurisdiction="Cayman Islands",
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
            jurisdiction="Japan",
            entity_type="Credit Institution",
            onboarding_status=OnboardingStatus.IN_PROGRESS,
            assigned_rm="Yuki Tanaka",
            created_date=datetime.now() - timedelta(days=60)
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

        # Client 6: Swiss Family Office - Review overdue
        client6 = Client(
            name="Zurich Family Office AG",
            legal_entity_id="SX006890",
            jurisdiction="Switzerland",
            entity_type="Family Office",
            onboarding_status=OnboardingStatus.IN_PROGRESS,
            assigned_rm="Anna Müller",
            created_date=datetime.now() - timedelta(days=180)
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

        # Client 7: Singapore Sovereign Wealth Fund
        client7 = Client(
            name="Singapore Strategic Investment Fund",
            legal_entity_id="SX007234",
            jurisdiction="Singapore",
            entity_type="Sovereign Wealth Fund",
            onboarding_status=OnboardingStatus.COMPLETED,
            assigned_rm="David Wong",
            created_date=datetime.now() - timedelta(days=120)
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
            next_review_date=datetime.now() + timedelta(days=250),
            validation_status=ValidationStatus.VALIDATED
        )
        db.add(reg7)

        # Client 8: Australian Superannuation Fund
        client8 = Client(
            name="Melbourne Retirement Super Fund",
            legal_entity_id="SX008567",
            jurisdiction="Australia",
            entity_type="Superannuation Fund",
            onboarding_status=OnboardingStatus.IN_PROGRESS,
            assigned_rm="Sophie Anderson",
            created_date=datetime.now() - timedelta(days=25)
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

        # Client 9: Luxembourg SICAV
        client9 = Client(
            name="European Growth Fund SICAV",
            legal_entity_id="SX009876",
            jurisdiction="Luxembourg",
            entity_type="SICAV",
            onboarding_status=OnboardingStatus.IN_PROGRESS,
            assigned_rm="Pierre Dubois",
            created_date=datetime.now() - timedelta(days=40)
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

        # Client 10: Canadian Insurance Company
        client10 = Client(
            name="Toronto Life & General Insurance Co",
            legal_entity_id="SX010345",
            jurisdiction="Canada",
            entity_type="Insurance Company",
            onboarding_status=OnboardingStatus.INITIATED,
            assigned_rm="Robert MacDonald",
            created_date=datetime.now() - timedelta(days=7)
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
            jurisdiction="India",
            entity_type="Private Limited Company",
            onboarding_status=OnboardingStatus.IN_PROGRESS,
            assigned_rm="Rajesh Kumar",
            created_date=datetime.now() - timedelta(days=15),
            client_attributes={
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
            jurisdiction="India",
            entity_type="Investment Fund",
            onboarding_status=OnboardingStatus.IN_PROGRESS,
            assigned_rm="Priya Sharma",
            created_date=datetime.now() - timedelta(days=20),
            client_attributes={
                "account_type": "subfund",
                "booking_location": "India/ICICI",
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
            {"name": StageName.LEGAL_ENTITY_SETUP, "status": StageStatus.COMPLETED, "assigned_team": "Entity Management",
             "started_date": datetime.now() - timedelta(days=20), "completed_date": datetime.now() - timedelta(days=18)},
            {"name": StageName.REG_CLASSIFICATION, "status": StageStatus.IN_PROGRESS, "assigned_team": "Compliance",
             "started_date": datetime.now() - timedelta(days=18), "notes": "Awaiting product approval"},
            {"name": StageName.FM_ACCOUNT_REQUEST, "status": StageStatus.NOT_STARTED, "assigned_team": "FM Operations"},
            {"name": StageName.STATIC_DATA_ENRICHMENT, "status": StageStatus.NOT_STARTED, "assigned_team": "FM Ops - Data"},
            {"name": StageName.SSI_VALIDATION, "status": StageStatus.NOT_STARTED, "assigned_team": "SSI Team"},
            {"name": StageName.VALUATION_SETUP, "status": StageStatus.NOT_STARTED, "assigned_team": "Valuation Team"}
        ])

        # Client 13: Private Banking - Out of Scope
        client13 = Client(
            name="Bangalore Private Wealth Management",
            legal_entity_id="SX013333",
            jurisdiction="India",
            entity_type="Private Banking",
            onboarding_status=OnboardingStatus.BLOCKED,
            assigned_rm="Anil Verma",
            created_date=datetime.now() - timedelta(days=10),
            client_attributes={
                "account_type": "private_banking",  # Out of scope!
                "booking_location": "India/SBI",
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
        print("\nOriginal Clients (1-10):")
        print("1. Aldgate Capital Partners LLP (UK) - COMPLETED")
        print("2. American Retirement Trust Fund (US) - IN PROGRESS (SSI Validation)")
        print("3. Frankfurt Asset Management GmbH (DE) - BLOCKED (Missing docs)")
        print("4. Cayman Global Investment Fund I Ltd (KY) - INITIATED")
        print("5. Tokyo International Bank Ltd (JP) - IN PROGRESS (Valuation Setup)")
        print("6. Zurich Family Office AG (CH) - IN PROGRESS (Review OVERDUE)")
        print("7. Singapore Strategic Investment Fund (SG) - COMPLETED")
        print("8. Melbourne Retirement Super Fund (AU) - IN PROGRESS (Data Enrichment)")
        print("9. European Growth Fund SICAV (LU) - IN PROGRESS (SSI Validation)")
        print("10. Toronto Life & General Insurance Co (CA) - INITIATED")
        print("\nRBI Regime Clients (11-13):")
        print("11. Mumbai Financial Services Pvt Ltd (IN) - RBI Eligible ✅")
        print("12. Delhi Investment Fund (IN) - RBI Partial (Pending Approval) ⚠️")
        print("13. Bangalore Private Wealth Management (IN) - RBI Out of Scope ❌")
        print("\n" + "="*70)
        print("RBI Classification Rules Created: 3")
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
