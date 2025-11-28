import os
import random
import time
import json
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from openai import OpenAI
# import PyPDF2
# import pdfplumber
# from PIL import Image
# import pytesseract
# from docx import Document as DocxDocument
from ..config import settings


class AIService:
    def __init__(self):
        # Initialize OpenAI-compatible client
        self.llm_enabled = settings.llm_enabled
        self.client = None

        if self.llm_enabled and settings.llm_api_key:
            try:
                self.client = OpenAI(
                    api_key=settings.llm_api_key,
                    base_url=settings.llm_api_endpoint
                )
                self.model = settings.llm_model
                print(f"✅ LLM client initialized: {settings.llm_api_endpoint} | Model: {self.model}")
            except Exception as e:
                print(f"⚠️ Failed to initialize LLM client: {str(e)}")
                self.client = None
                self.llm_enabled = False
        else:
            self.model = settings.openai_model
            print("ℹ️ LLM integration disabled - using simulation mode")

    def extract_text_from_pdf(self, file_path: str) -> str:
        """Extract text from PDF using pdfplumber"""
        try:
            text = ""
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
            return text.strip()
        except Exception as e:
            # Fallback to PyPDF2
            try:
                text = ""
                with open(file_path, 'rb') as file:
                    pdf_reader = PyPDF2.PdfReader(file)
                    for page in pdf_reader.pages:
                        page_text = page.extract_text()
                        if page_text:
                            text += page_text + "\n"
                return text.strip()
            except Exception as e2:
                raise Exception(f"Failed to extract text from PDF: {str(e2)}")

    def extract_text_from_image(self, file_path: str) -> str:
        """Extract text from image using OCR"""
        try:
            image = Image.open(file_path)
            text = pytesseract.image_to_string(image)
            return text.strip()
        except Exception as e:
            raise Exception(f"Failed to extract text from image: {str(e)}")

    def extract_text_from_docx(self, file_path: str) -> str:
        """Extract text from Word document"""
        try:
            doc = DocxDocument(file_path)
            text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
            return text.strip()
        except Exception as e:
            raise Exception(f"Failed to extract text from DOCX: {str(e)}")

    def extract_text(self, file_path: str, file_type: str) -> str:
        """Extract text based on file type"""
        file_type = file_type.lower()

        if file_type == 'pdf' or file_path.endswith('.pdf'):
            return self.extract_text_from_pdf(file_path)
        elif file_type in ['png', 'jpg', 'jpeg', 'tiff', 'bmp'] or any(file_path.endswith(ext) for ext in ['.png', '.jpg', '.jpeg', '.tiff', '.bmp']):
            return self.extract_text_from_image(file_path)
        elif file_type == 'docx' or file_path.endswith('.docx'):
            return self.extract_text_from_docx(file_path)
        else:
            raise Exception(f"Unsupported file type: {file_type}")

    def validate_document(
        self,
        extracted_text: str,
        client_name: str,
        document_category: str,
        regulatory_framework: Optional[str] = None
    ) -> Dict[str, Any]:
        """Use AI to validate document and extract key information"""

        if not self.client:
            # Return mock validation if OpenAI is not configured
            return self._mock_validation(extracted_text, client_name)

        # Construct the validation prompt
        prompt = f"""Analyze this document related to regulatory classification:

Document Type: {document_category}
Client Name: {client_name}
{f'Expected Framework: {regulatory_framework}' if regulatory_framework else ''}

Document Text:
{extracted_text[:3000]}  # Limit to avoid token limits

Please extract and validate the following:

1. **Extracted Entities**:
   - Client/Entity name mentioned
   - Jurisdiction(s)
   - Entity type/classification
   - Dates (signing date, effective date, expiry date)
   - Signatory information
   - Any regulatory classifications mentioned

2. **Validation Checks**:
   - Does the client name match "{client_name}"? (true/false)
   - Is the document properly signed/attested? (true/false)
   - Are critical dates present and valid? (true/false)
   - Is the information consistent throughout? (true/false)
   - Are there any contradictions or red flags? (true/false means no issues)

3. **Recommendations**: List any issues, missing information, or suggested actions

4. **Confidence Score**: Overall confidence in validation (0-100)

Respond in JSON format with keys: extracted_entities, validation_checks, recommendations (array), confidence_score
"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a financial regulatory compliance expert. Analyze documents and extract key information for regulatory classification validation. Always respond with valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                response_format={"type": "json_object"}
            )

            import json
            result = json.loads(response.choices[0].message.content)

            # Add extracted text preview
            result['extracted_text_preview'] = extracted_text[:500]

            return result

        except Exception as e:
            print(f"AI validation error: {str(e)}")
            return self._mock_validation(extracted_text, client_name)

    def _mock_validation(self, extracted_text: str, client_name: str) -> Dict[str, Any]:
        """Generate mock validation result when OpenAI is not available"""
        return {
            "extracted_entities": {
                "client_name": client_name,
                "jurisdiction": "Unknown",
                "entity_type": "To be determined",
                "dates": {
                    "document_date": "Not extracted"
                }
            },
            "validation_checks": {
                "client_name_match": True,
                "properly_signed": True,
                "dates_valid": True,
                "information_consistent": True,
                "no_contradictions": True
            },
            "recommendations": [
                "Manual review recommended - using mock validation",
                "Configure OpenAI API key for full AI validation"
            ],
            "confidence_score": 60,
            "extracted_text_preview": extracted_text[:500]
        }

    def enhanced_validate_document(
        self,
        extracted_text: str,
        client_data: Dict[str, Any],
        document_category: str
    ) -> Dict[str, Any]:
        """
        Enhanced AI validation with detailed entity extraction and confidence scores.
        Returns structured validation result matching EnhancedValidationResult schema.

        This is a SIMULATION for demo purposes - generates realistic mock data.
        """
        start_time = time.time()

        # Simulate processing delay (1-3 seconds for realism)
        time.sleep(random.uniform(1.0, 2.5))

        # Extract expected values from client data
        expected_name = client_data.get("legal_entity_name", "Unknown")
        expected_jurisdiction = client_data.get("jurisdiction", "Unknown")
        expected_entity_type = client_data.get("entity_type", "Unknown")

        # Generate realistic confidence scores (75-98%)
        def random_confidence(base=0.85, variance=0.13):
            """Generate confidence between 75-98%"""
            return min(0.98, max(0.75, base + random.uniform(-variance, variance)))

        # Simulate occasional low confidence for demo variety (1 in 5 chance)
        force_low_confidence = random.random() < 0.2

        # Create extracted entities with varying confidence
        legal_name_conf = random_confidence(0.92) if not force_low_confidence else random_confidence(0.70, 0.05)
        jurisdiction_conf = random_confidence(0.95)
        doc_type_conf = random_confidence(0.88)
        issue_date_conf = random_confidence(0.90)
        expiry_date_conf = random_confidence(0.85) if random.random() > 0.3 else random_confidence(0.68, 0.08)
        signatory_conf = random_confidence(0.82) if random.random() > 0.2 else random_confidence(0.65, 0.10)
        doc_ref_conf = random_confidence(0.93)
        entity_type_conf = random_confidence(0.87)

        # Generate realistic dates
        today = datetime.now()
        issue_date = (today - timedelta(days=random.randint(30, 365))).strftime("%Y-%m-%d")
        expiry_date = (today + timedelta(days=random.randint(180, 730))).strftime("%Y-%m-%d")

        # Determine document type based on category
        doc_type_map = {
            "CLIENT_CONFIRMATION": "Professional Client Attestation",
            "RM_ATTESTATION": "Relationship Manager Attestation",
            "LEGAL_OPINION": "Legal Opinion Letter",
            "BOARD_RESOLUTION": "Board Resolution",
            "KYC_DOCUMENTATION": "KYC Documentation",
            "FINANCIAL_STATEMENTS": "Financial Statements"
        }
        detected_doc_type = doc_type_map.get(document_category, "Regulatory Document")

        # Simulate document reference number
        doc_ref = f"{document_category[:3].upper()}-{random.randint(1000, 9999)}-{datetime.now().year}"

        # Simulate signatory
        signatories = ["Chief Compliance Officer", "Managing Director", "Legal Counsel", "Chief Executive Officer"]
        detected_signatory = random.choice(signatories)

        # Build entity results
        entities = {
            "legal_name": {
                "value": expected_name,
                "confidence": legal_name_conf,
                "matches_expected": legal_name_conf > 0.75,
                "expected_value": expected_name,
                "issues": [] if legal_name_conf > 0.75 else ["Low confidence - manual verification recommended"]
            },
            "jurisdiction": {
                "value": expected_jurisdiction,
                "confidence": jurisdiction_conf,
                "matches_expected": True,
                "expected_value": expected_jurisdiction,
                "issues": []
            },
            "document_type": {
                "value": detected_doc_type,
                "confidence": doc_type_conf,
                "matches_expected": True,
                "expected_value": detected_doc_type,
                "issues": []
            },
            "issue_date": {
                "value": issue_date,
                "confidence": issue_date_conf,
                "matches_expected": issue_date_conf > 0.80,
                "expected_value": issue_date,
                "issues": [] if issue_date_conf > 0.80 else ["Date format unclear - please verify"]
            },
            "expiry_date": {
                "value": expiry_date if expiry_date_conf > 0.70 else None,
                "confidence": expiry_date_conf,
                "matches_expected": expiry_date_conf > 0.70,
                "expected_value": expiry_date if expiry_date_conf > 0.70 else "Not specified",
                "issues": [] if expiry_date_conf > 0.70 else ["Expiry date not clearly stated"]
            },
            "signatory": {
                "value": detected_signatory if signatory_conf > 0.65 else None,
                "confidence": signatory_conf,
                "matches_expected": signatory_conf > 0.65,
                "expected_value": detected_signatory if signatory_conf > 0.65 else "Unknown",
                "issues": [] if signatory_conf > 0.70 else ["Signature quality low - manual verification needed"]
            },
            "document_reference": {
                "value": doc_ref,
                "confidence": doc_ref_conf,
                "matches_expected": True,
                "expected_value": doc_ref,
                "issues": []
            },
            "entity_type": {
                "value": expected_entity_type,
                "confidence": entity_type_conf,
                "matches_expected": True,
                "expected_value": expected_entity_type,
                "issues": []
            }
        }

        # Calculate overall confidence (average of all entities)
        confidences = [e["confidence"] for e in entities.values()]
        overall_confidence = sum(confidences) / len(confidences)

        # Determine validation status
        if overall_confidence >= 0.90:
            validation_status = "verified"
        elif overall_confidence >= 0.75:
            validation_status = "needs_review"
        else:
            validation_status = "failed"

        # Collect all issues
        all_issues = []
        all_warnings = []
        for entity_name, entity_data in entities.items():
            if entity_data.get("issues"):
                if entity_data["confidence"] < 0.70:
                    all_issues.extend(entity_data["issues"])
                else:
                    all_warnings.extend(entity_data["issues"])

        # Generate recommendations
        recommendations = []
        if validation_status == "needs_review":
            recommendations.append("Some entities extracted with medium confidence - please review highlighted fields")
        if signatory_conf < 0.70:
            recommendations.append("Signature detection confidence low - verify document is properly signed")
        if expiry_date_conf < 0.70:
            recommendations.append("Expiry date unclear - confirm validity period with client")
        if legal_name_conf < 0.85:
            recommendations.append("Legal entity name extraction needs verification")

        if not recommendations and validation_status == "verified":
            recommendations.append("All key entities extracted with high confidence - document ready for approval")

        # Calculate processing time
        processing_time = int((time.time() - start_time) * 1000)

        return {
            "legal_name": entities["legal_name"],
            "jurisdiction": entities["jurisdiction"],
            "document_type": entities["document_type"],
            "issue_date": entities["issue_date"],
            "expiry_date": entities["expiry_date"],
            "signatory": entities["signatory"],
            "document_reference": entities["document_reference"],
            "entity_type": entities["entity_type"],
            "overall_confidence": overall_confidence,
            "validation_status": validation_status,
            "processing_time_ms": processing_time,
            "issues": all_issues,
            "warnings": all_warnings,
            "recommendations": recommendations,
            "extracted_text_preview": extracted_text[:500] if extracted_text else "No text extracted"
        }

    def calculate_compliance_risk_score(
        self,
        client_data: Dict[str, Any],
        document_status: Dict[str, Any],
        data_quality_scores: Dict[str, float]
    ) -> Dict[str, Any]:
        """
        Calculate AI-powered compliance risk score for a client.

        Returns risk score (0-100), risk level, contributing factors, and recommendations.
        This is a SIMULATION for demo purposes.
        """
        # Base risk score starts at 0 (low risk)
        risk_score = 0
        risk_factors = []

        # 1. Document completeness (0-30 points)
        missing_docs = document_status.get("missing_count", 0)
        pending_docs = document_status.get("pending_count", 0)
        total_required = document_status.get("total_required", 10)

        doc_completeness = max(0, 1 - (missing_docs + pending_docs * 0.5) / total_required)
        doc_risk = (1 - doc_completeness) * 30
        risk_score += doc_risk

        if missing_docs > 0:
            risk_factors.append(f"{missing_docs} required document(s) missing")
        if pending_docs > 2:
            risk_factors.append(f"{pending_docs} documents pending validation")

        # 2. Data quality (0-25 points)
        avg_data_quality = sum(data_quality_scores.values()) / len(data_quality_scores) if data_quality_scores else 0.8
        data_quality_risk = (1 - avg_data_quality) * 25
        risk_score += data_quality_risk

        if avg_data_quality < 0.7:
            risk_factors.append(f"Data quality below threshold ({int(avg_data_quality * 100)}%)")

        # 3. Jurisdiction risk (0-20 points)
        jurisdiction = client_data.get("jurisdiction", "").upper()
        high_risk_jurisdictions = ["CAYMAN ISLANDS", "BAHAMAS", "BERMUDA", "MALTA"]
        medium_risk_jurisdictions = ["LUXEMBOURG", "IRELAND", "SWITZERLAND"]

        if any(hrj in jurisdiction for hrj in high_risk_jurisdictions):
            risk_score += 15
            risk_factors.append(f"High-risk jurisdiction: {jurisdiction}")
        elif any(mrj in jurisdiction for mrj in medium_risk_jurisdictions):
            risk_score += 8
            risk_factors.append(f"Medium-risk jurisdiction: {jurisdiction}")

        # 4. Entity type complexity (0-15 points)
        entity_type = client_data.get("entity_type", "").lower()
        complex_types = ["hedge fund", "private equity", "spv", "special purpose vehicle"]

        if any(ct in entity_type for ct in complex_types):
            risk_score += 10
            risk_factors.append("Complex entity structure")

        # 5. Onboarding status (0-10 points)
        onboarding_status = client_data.get("onboarding_status", "in_progress")
        if onboarding_status == "blocked":
            risk_score += 10
            risk_factors.append("Onboarding process blocked")
        elif onboarding_status == "initiated":
            risk_score += 5
            risk_factors.append("Onboarding not yet in progress")

        # Add some randomness for demo variety (±5 points)
        risk_score += random.uniform(-5, 5)
        risk_score = max(0, min(100, risk_score))  # Clamp to 0-100

        # Determine risk level
        if risk_score >= 70:
            risk_level = "high"
            risk_color = "#ef4444"
        elif risk_score >= 40:
            risk_level = "medium"
            risk_color = "#f59e0b"
        else:
            risk_level = "low"
            risk_color = "#10b981"

        # Generate recommendations
        recommendations = []
        if missing_docs > 0:
            recommendations.append("Prioritize collection of missing regulatory documents")
        if avg_data_quality < 0.8:
            recommendations.append("Review and improve data quality for critical fields")
        if risk_score >= 70:
            recommendations.append("Escalate to compliance team for immediate review")
        if pending_docs > 3:
            recommendations.append("Expedite document validation process")
        if onboarding_status == "blocked":
            recommendations.append("Resolve blocking issues to continue onboarding")

        if not recommendations:
            recommendations.append("Continue standard onboarding process - no immediate concerns")

        return {
            "risk_score": round(risk_score, 1),
            "risk_level": risk_level,
            "risk_color": risk_color,
            "risk_factors": risk_factors,
            "recommendations": recommendations,
            "breakdown": {
                "document_completeness": round(doc_risk, 1),
                "data_quality": round(data_quality_risk, 1),
                "jurisdiction": round(risk_score * 0.2, 1),  # Approximation
                "entity_complexity": round(risk_score * 0.15, 1),
                "onboarding_status": round(risk_score * 0.1, 1)
            },
            "calculated_at": datetime.now().isoformat()
        }

    def build_rag_context(self, client_data: Dict[str, Any]) -> str:
        """
        Build RAG context from client data for LLM.
        Converts client data into a structured text format for the LLM.
        """
        context_parts = []

        # Basic client information
        context_parts.append("=== CLIENT INFORMATION ===")
        context_parts.append(f"Client Name: {client_data.get('name', 'N/A')}")
        context_parts.append(f"Legal Entity ID: {client_data.get('legal_entity_id', 'N/A')}")
        context_parts.append(f"Jurisdiction: {client_data.get('jurisdiction', 'N/A')}")
        context_parts.append(f"Entity Type: {client_data.get('entity_type', 'N/A')}")
        context_parts.append(f"Onboarding Status: {client_data.get('onboarding_status', 'N/A')}")
        context_parts.append(f"Assigned RM: {client_data.get('assigned_rm', 'N/A')}")
        context_parts.append(f"Created Date: {client_data.get('created_date', 'N/A')}")

        # Client attributes
        if client_data.get('client_attributes'):
            context_parts.append("\n=== CLIENT ATTRIBUTES ===")
            attrs = client_data['client_attributes']
            for key, value in attrs.items():
                context_parts.append(f"{key}: {value}")

        # Documents
        if client_data.get('documents'):
            context_parts.append("\n=== DOCUMENTS ===")
            for doc in client_data['documents']:
                context_parts.append(f"\nDocument: {doc.get('category', 'Unknown')}")
                context_parts.append(f"  Status: {doc.get('status', 'N/A')}")
                context_parts.append(f"  OCR Status: {doc.get('ocr_status', 'N/A')}")
                if doc.get('ai_validation_result'):
                    val_result = doc['ai_validation_result']
                    if isinstance(val_result, dict):
                        context_parts.append(f"  Validation Status: {val_result.get('validation_status', 'N/A')}")
                        context_parts.append(f"  Confidence: {val_result.get('overall_confidence', 'N/A')}")

        # Onboarding stages
        if client_data.get('onboarding_stages'):
            context_parts.append("\n=== ONBOARDING STAGES ===")
            for stage in client_data['onboarding_stages']:
                context_parts.append(f"\nStage: {stage.get('stage_name', 'Unknown')}")
                context_parts.append(f"  Status: {stage.get('status', 'N/A')}")
                context_parts.append(f"  Owner: {stage.get('owner', 'N/A')}")
                if stage.get('tat_hours'):
                    context_parts.append(f"  TAT: {stage['tat_hours']} hours")

        # Regulatory classifications
        if client_data.get('regulatory_classifications'):
            context_parts.append("\n=== REGULATORY CLASSIFICATIONS ===")
            for classification in client_data['regulatory_classifications']:
                context_parts.append(f"\nRegime: {classification.get('regime_name', 'Unknown')}")
                context_parts.append(f"  Classification: {classification.get('classification', 'N/A')}")
                context_parts.append(f"  Confidence: {classification.get('confidence_score', 'N/A')}")
                context_parts.append(f"  Status: {classification.get('status', 'N/A')}")

        # Tasks
        if client_data.get('tasks'):
            context_parts.append("\n=== TASKS ===")
            pending_tasks = [t for t in client_data['tasks'] if t.get('status') != 'completed']
            for task in pending_tasks[:5]:  # Limit to 5 most relevant tasks
                context_parts.append(f"\nTask: {task.get('title', 'Unknown')}")
                context_parts.append(f"  Status: {task.get('status', 'N/A')}")
                context_parts.append(f"  Priority: {task.get('priority', 'N/A')}")
                if task.get('due_date'):
                    context_parts.append(f"  Due: {task['due_date']}")

        return "\n".join(context_parts)

    def chat_with_assistant(
        self,
        message: str,
        context: Dict[str, Any] = None,
        full_client_data: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        AI chat assistant with support for both simulation and real LLM integration.
        When LLM is enabled, uses RAG with full client context.
        Otherwise, uses pattern-matching canned responses.
        """
        # If LLM is enabled and client is initialized, use real LLM
        if self.llm_enabled and self.client and full_client_data:
            return self._chat_with_llm(message, full_client_data)

        # Otherwise, use simulation mode
        return self._chat_simulation(message, context)

    def _chat_with_llm(
        self,
        message: str,
        full_client_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Chat using real LLM with RAG context.
        """
        try:
            # Build RAG context
            rag_context = self.build_rag_context(full_client_data)
            client_name = full_client_data.get('name', 'the client')

            # Build system prompt
            system_prompt = f"""You are an AI assistant for a Financial Markets Client Lifecycle Orchestrator system.
You help users with client onboarding, document validation, compliance risk assessment, and data quality analysis.

You have access to complete information about {client_name} through the context below.
Use this information to provide specific, accurate, and helpful responses.

When answering:
- Be specific and reference actual data from the context
- Provide actionable insights and recommendations
- Keep responses concise but informative (2-3 sentences usually)
- Use professional, friendly language
- If asked about data not in the context, say so clearly

CLIENT DATA CONTEXT:
{rag_context}
"""

            # Call LLM
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message}
                ],
                temperature=0.7,
                max_tokens=500
            )

            assistant_message = response.choices[0].message.content

            # Generate contextual suggestions based on the response
            suggestions = self._generate_llm_suggestions(message, full_client_data)

            # Determine topic from message keywords
            topic = self._determine_topic(message)

            return {
                "message": assistant_message,
                "suggestions": suggestions,
                "topic": topic,
                "timestamp": datetime.now().isoformat(),
                "source": "llm"
            }

        except Exception as e:
            print(f"❌ LLM chat error: {str(e)}")
            # Fallback to simulation
            return self._chat_simulation(message, {"client_name": full_client_data.get('name', 'the client')})

    def _generate_llm_suggestions(self, last_message: str, client_data: Dict[str, Any]) -> list[str]:
        """Generate contextual suggestions based on client data and last message."""
        suggestions = []
        message_lower = last_message.lower()

        # Context-aware suggestions
        if 'document' in message_lower:
            suggestions = [
                "What's the overall document completion percentage?",
                "Which documents need urgent attention?",
                "Show me documents with validation issues"
            ]
        elif 'onboarding' in message_lower or 'status' in message_lower:
            suggestions = [
                "What are the next steps in onboarding?",
                "Show me any blockers or issues",
                "What's the expected completion date?"
            ]
        elif 'risk' in message_lower or 'compliance' in message_lower:
            suggestions = [
                "What's the current compliance risk score?",
                "What are the main risk factors?",
                "How can we mitigate these risks?"
            ]
        else:
            # Default suggestions based on client state
            suggestions = [
                "What's the onboarding status?",
                "Show me document summary",
                "What tasks are pending?"
            ]

        return suggestions[:3]

    def _determine_topic(self, message: str) -> str:
        """Determine the topic category of the message."""
        message_lower = message.lower()

        if any(kw in message_lower for kw in ['document', 'upload', 'file', 'validation']):
            return 'document'
        elif any(kw in message_lower for kw in ['onboarding', 'stage', 'progress']):
            return 'onboarding'
        elif any(kw in message_lower for kw in ['risk', 'compliance', 'score']):
            return 'compliance'
        elif any(kw in message_lower for kw in ['task', 'todo', 'pending']):
            return 'task'
        else:
            return 'general'

    def _chat_simulation(
        self,
        message: str,
        context: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Simulation mode: pattern-matching canned responses.
        Simulates intelligent responses about client onboarding, documents, and compliance.
        """
        message_lower = message.lower()

        # Simulate processing delay (0.3-0.8s)
        time.sleep(random.uniform(0.3, 0.8))

        # Extract context
        context = context or {}
        client_id = context.get("client_id")
        client_name = context.get("client_name", "the client")

        # Add source indicator for simulation mode
        response_suffix = ""

        # Pattern matching for canned responses
        response_text = ""
        suggestions = []
        topic = "general"

        # Document-related queries
        if any(keyword in message_lower for keyword in ["document", "documents", "upload", "missing", "pending"]):
            topic = "document"
            if "missing" in message_lower or "need" in message_lower:
                response_text = f"Based on {client_name}'s profile, the following documents are typically required: Client Confirmation, RM Attestation, Legal Opinion, Articles of Association, and Regulatory Licenses. You can check the Documents tab to see which ones have been uploaded and validated."
                suggestions = [
                    "Show me document validation status",
                    "What documents need review?",
                    "How does AI validation work?"
                ]
            elif "validate" in message_lower or "validation" in message_lower:
                response_text = "Our AI automatically validates uploaded documents by extracting key entities (legal name, jurisdiction, dates, etc.) and comparing them against client data. Each field gets a confidence score, and the system flags any mismatches for human review."
                suggestions = [
                    "What confidence threshold is used?",
                    "Can I manually override validation?",
                    "Show validation history"
                ]
            elif "status" in message_lower:
                response_text = f"I can help you check document status for {client_name}. The system tracks verified, pending, and missing documents. Would you like me to show you the current status breakdown?"
                suggestions = [
                    "Show document status breakdown",
                    "What's the completion percentage?",
                    "Which documents are high priority?"
                ]
            else:
                response_text = f"For {client_name}, you can upload documents through the Documents tab. Our AI will automatically extract information and validate against client data. Supported formats include PDF, DOC, DOCX, JPG, and PNG."
                suggestions = [
                    "What documents are required?",
                    "How accurate is AI extraction?",
                    "Can I bulk upload documents?"
                ]

        # Onboarding status queries
        elif any(keyword in message_lower for keyword in ["onboarding", "status", "progress", "stage"]):
            topic = "onboarding"
            if "complete" in message_lower or "finish" in message_lower:
                response_text = f"To complete onboarding for {client_name}, ensure all required documents are validated, regulatory classifications are confirmed, and compliance risk score is acceptable. The system will automatically update the status to 'completed' once all criteria are met."
                suggestions = [
                    "What's blocking completion?",
                    "Show onboarding checklist",
                    "What's the timeline?"
                ]
            elif "stage" in message_lower or "step" in message_lower:
                response_text = f"The onboarding process includes several stages: Document Collection, Identity Verification, Regulatory Classification, Risk Assessment, and Final Approval. Each stage must be completed before moving to the next."
                suggestions = [
                    "Which stage is the client in?",
                    "How long does each stage take?",
                    "Can stages run in parallel?"
                ]
            else:
                response_text = f"{client_name}'s onboarding status reflects the overall progress across document verification, regulatory checks, and compliance reviews. I can provide detailed insights on each component."
                suggestions = [
                    "Show onboarding progress breakdown",
                    "What are the next steps?",
                    "Are there any blockers?"
                ]

        # Risk and compliance queries
        elif any(keyword in message_lower for keyword in ["risk", "compliance", "score", "rating"]):
            topic = "compliance"
            if "high" in message_lower or "concern" in message_lower:
                response_text = "High-risk clients typically have incomplete documentation, complex entity structures, or operate in high-risk jurisdictions. The AI analyzes multiple factors including document completeness (30%), data quality (25%), jurisdiction risk (20%), entity complexity (15%), and onboarding status (10%)."
                suggestions = [
                    "How is risk calculated?",
                    "Can risk be mitigated?",
                    "Show risk factors for this client"
                ]
            elif "calculate" in message_lower or "score" in message_lower:
                response_text = "The compliance risk score is calculated in real-time based on document status, data quality metrics, jurisdiction risk level, entity complexity, and onboarding progress. Scores range from 0-100, with higher scores indicating higher risk."
                suggestions = [
                    "What's a good risk score?",
                    "How often is it updated?",
                    "Show risk breakdown"
                ]
            else:
                response_text = f"I can help you understand {client_name}'s compliance risk profile. The system continuously monitors document status, data quality, and regulatory factors to provide an up-to-date risk assessment."
                suggestions = [
                    "Show current risk score",
                    "What are the main risk factors?",
                    "How can we reduce risk?"
                ]

        # Data quality queries
        elif any(keyword in message_lower for keyword in ["data", "quality", "accuracy", "missing data"]):
            topic = "client"
            response_text = "Data quality is assessed across multiple dimensions: completeness (are all required fields filled?), accuracy (do values match expected formats?), consistency (do related fields align?), and timeliness (is data up-to-date?). The AI flags any data quality issues for review."
            suggestions = [
                "Show data quality report",
                "What fields need attention?",
                "How is data quality calculated?"
            ]

        # AI capabilities queries
        elif any(keyword in message_lower for keyword in ["ai", "how do you", "what can you", "help"]):
            topic = "general"
            if "do" in message_lower or "help" in message_lower:
                response_text = "I can assist with: 📄 Document validation and status checks, 🎯 Onboarding progress tracking, ⚠️ Compliance risk assessment, 📊 Data quality analysis, 🔍 Natural language searches (coming soon). Just ask me about any client, document, or onboarding task!"
                suggestions = [
                    "Explain AI document validation",
                    "How accurate are your insights?",
                    "What data do you analyze?"
                ]
            else:
                response_text = "I'm powered by AI to help you navigate client onboarding and compliance workflows. I can answer questions, provide status updates, explain risk factors, and guide you through processes."
                suggestions = [
                    "What can you help with?",
                    "Show me onboarding tips",
                    "Explain compliance scoring"
                ]

        # Greeting
        elif any(keyword in message_lower for keyword in ["hello", "hi", "hey"]):
            topic = "general"
            response_text = f"Hello! I'm your AI assistant for client onboarding and compliance. I can help you with document validation, onboarding status, risk assessment, and data quality checks{' for ' + client_name if client_name != 'the client' else ''}. What would you like to know?"
            suggestions = [
                "What documents are required?",
                "Show onboarding status",
                "Check compliance risk score"
            ]

        # Default fallback
        else:
            response_text = "I'm here to help with client onboarding, document validation, compliance risk assessment, and data quality analysis. Could you rephrase your question or ask about one of these topics?"
            suggestions = [
                "What can you help with?",
                "Show document status",
                "Check onboarding progress"
            ]

        return {
            "message": response_text,
            "suggestions": suggestions,
            "topic": topic,
            "timestamp": datetime.now().isoformat(),
            "source": "simulation"
        }

    def generate_insights_summary(
        self,
        clients_data: list[Dict[str, Any]],
        documents_data: list[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Generate AI-powered insights summary for dashboard.
        Analyzes clients, documents, and identifies trends/risks.
        """
        # Simulate processing delay
        time.sleep(random.uniform(0.5, 1.0))

        total_clients = len(clients_data)

        # Analyze onboarding status distribution
        onboarding_statuses = {}
        for client in clients_data:
            status = client.get("onboarding_status", "unknown")
            onboarding_statuses[status] = onboarding_statuses.get(status, 0) + 1

        # Analyze document status
        total_docs = len(documents_data)
        verified_docs = sum(1 for doc in documents_data
                           if doc.get("ai_validation_result")
                           and isinstance(doc.get("ai_validation_result"), dict)
                           and doc.get("ai_validation_result").get("validation_status") == "verified")
        pending_docs = sum(1 for doc in documents_data if doc.get("ocr_status") == "pending")

        # Calculate verification rate
        verification_rate = (verified_docs / total_docs * 100) if total_docs > 0 else 0

        # Identify high-risk clients (simulated)
        high_risk_count = int(total_clients * random.uniform(0.15, 0.25))
        medium_risk_count = int(total_clients * random.uniform(0.30, 0.45))
        low_risk_count = total_clients - high_risk_count - medium_risk_count

        # Generate key insights
        insights = []

        if verification_rate < 60:
            insights.append({
                "type": "warning",
                "title": "Document Verification Backlog",
                "description": f"Only {verification_rate:.0f}% of documents are verified. {pending_docs} documents need review.",
                "action": "Review pending documents",
                "priority": "high"
            })

        if high_risk_count > 0:
            insights.append({
                "type": "alert",
                "title": "High-Risk Clients Detected",
                "description": f"{high_risk_count} clients have elevated compliance risk scores requiring immediate attention.",
                "action": "Review high-risk clients",
                "priority": "high"
            })

        blocked_count = onboarding_statuses.get("blocked", 0)
        if blocked_count > 0:
            insights.append({
                "type": "warning",
                "title": "Blocked Onboarding Processes",
                "description": f"{blocked_count} client(s) have blocked onboarding. Common blockers: missing documents, data quality issues.",
                "action": "Resolve blockers",
                "priority": "medium"
            })

        completed_count = onboarding_statuses.get("completed", 0)
        if completed_count > 0:
            insights.append({
                "type": "success",
                "title": "Onboarding Completions",
                "description": f"{completed_count} client(s) successfully completed onboarding this period.",
                "action": "View completed clients",
                "priority": "low"
            })

        # AI recommendations
        recommendations = []

        if pending_docs > 10:
            recommendations.append("Prioritize document validation - backlog is building up")

        if high_risk_count > total_clients * 0.2:
            recommendations.append("High proportion of risky clients - consider enhanced due diligence procedures")

        if verification_rate > 80:
            recommendations.append("Strong document verification performance - maintain current process")

        # Trend analysis (simulated)
        trends = {
            "onboarding_velocity": {
                "value": random.randint(5, 15),
                "unit": "clients/week",
                "change": random.uniform(-20, 30),
                "direction": "up" if random.random() > 0.4 else "down"
            },
            "document_processing_time": {
                "value": round(random.uniform(1.5, 4.5), 1),
                "unit": "days avg",
                "change": random.uniform(-15, 25),
                "direction": "down" if random.random() > 0.5 else "up"
            },
            "data_quality_score": {
                "value": random.randint(75, 95),
                "unit": "% avg",
                "change": random.uniform(-5, 10),
                "direction": "up" if random.random() > 0.6 else "down"
            }
        }

        return {
            "summary": {
                "total_clients": total_clients,
                "onboarding_statuses": onboarding_statuses,
                "total_documents": total_docs,
                "verified_documents": verified_docs,
                "pending_documents": pending_docs,
                "verification_rate": round(verification_rate, 1),
                "risk_distribution": {
                    "high": high_risk_count,
                    "medium": medium_risk_count,
                    "low": low_risk_count
                }
            },
            "insights": insights,
            "recommendations": recommendations,
            "trends": trends,
            "generated_at": datetime.now().isoformat()
        }

    def parse_natural_language_search(self, query: str) -> Dict[str, Any]:
        """
        Parse natural language search query into structured filters.
        Extracts entities, statuses, and keywords for search.
        """
        query_lower = query.lower()

        # Initialize filters
        filters = {
            "onboarding_status": [],
            "risk_level": [],
            "jurisdictions": [],
            "entity_types": [],
            "keywords": [],
            "time_filters": []
        }

        # Extract onboarding status
        status_map = {
            "initiated": ["initiated", "new", "started"],
            "in_progress": ["in progress", "progressing", "ongoing", "active"],
            "blocked": ["blocked", "stuck", "issues"],
            "completed": ["completed", "done", "finished"]
        }

        for status, keywords in status_map.items():
            if any(kw in query_lower for kw in keywords):
                filters["onboarding_status"].append(status)

        # Extract risk levels
        if any(word in query_lower for word in ["high risk", "risky", "dangerous"]):
            filters["risk_level"].append("high")
        if any(word in query_lower for word in ["medium risk", "moderate"]):
            filters["risk_level"].append("medium")
        if any(word in query_lower for word in ["low risk", "safe"]):
            filters["risk_level"].append("low")

        # Extract common jurisdictions
        jurisdictions = [
            "United States", "UK", "United Kingdom", "Luxembourg", "Ireland",
            "Cayman Islands", "Singapore", "Hong Kong", "Switzerland", "Germany"
        ]
        for jurisdiction in jurisdictions:
            if jurisdiction.lower() in query_lower:
                filters["jurisdictions"].append(jurisdiction)

        # Extract entity types
        entity_types = [
            "hedge fund", "private equity", "corporation", "partnership", "spv"
        ]
        for entity_type in entity_types:
            if entity_type in query_lower:
                filters["entity_types"].append(entity_type)

        # Extract time filters
        if any(word in query_lower for word in ["recent", "recently", "latest", "new"]):
            filters["time_filters"].append("recent")
        if any(word in query_lower for word in ["pending", "waiting"]):
            filters["time_filters"].append("pending")

        # Extract general keywords (simple word extraction)
        # Remove common words and extract meaningful terms
        stop_words = {"show", "me", "all", "the", "with", "that", "have", "are", "is", "in", "at", "to", "for", "of", "a", "an"}
        words = query_lower.split()
        keywords = [word for word in words if word not in stop_words and len(word) > 3]
        filters["keywords"] = keywords[:5]  # Limit to 5 keywords

        # Generate query interpretation
        interpretation = self._generate_search_interpretation(filters, query)

        return {
            "original_query": query,
            "filters": filters,
            "interpretation": interpretation,
            "parsed_at": datetime.now().isoformat()
        }

    def _generate_search_interpretation(self, filters: Dict[str, Any], original_query: str) -> str:
        """Generate human-readable interpretation of parsed search."""
        parts = []

        if filters["onboarding_status"]:
            statuses = ", ".join(filters["onboarding_status"])
            parts.append(f"clients with status: {statuses}")

        if filters["risk_level"]:
            risk = ", ".join(filters["risk_level"])
            parts.append(f"{risk} risk clients")

        if filters["jurisdictions"]:
            juris = ", ".join(filters["jurisdictions"])
            parts.append(f"in {juris}")

        if filters["entity_types"]:
            types = ", ".join(filters["entity_types"])
            parts.append(f"entity type: {types}")

        if filters["time_filters"]:
            time = filters["time_filters"][0]
            if time == "recent":
                parts.append("from recent activity")
            elif time == "pending":
                parts.append("with pending items")

        if parts:
            return "Searching for " + " ".join(parts)
        else:
            return f"Searching all clients matching: {original_query}"

    def check_document_consistency(
        self,
        client_data: Dict[str, Any],
        documents_data: list[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Check consistency across multiple documents for a client.
        Identifies mismatches in legal names, jurisdictions, dates, etc.
        """
        # Simulate processing delay
        time.sleep(random.uniform(0.3, 0.7))

        inconsistencies = []
        warnings = []

        # Extract entities from all documents
        extracted_names = set()
        extracted_jurisdictions = set()
        extracted_entity_types = set()

        for doc in documents_data:
            validation_result = doc.get("ai_validation_result")
            if not validation_result:
                continue

            # Collect legal names
            legal_name = validation_result.get("legal_name", {})
            if legal_name.get("value"):
                extracted_names.add(legal_name["value"])

            # Collect jurisdictions
            jurisdiction = validation_result.get("jurisdiction", {})
            if jurisdiction.get("value"):
                extracted_jurisdictions.add(jurisdiction["value"])

            # Collect entity types
            entity_type = validation_result.get("entity_type", {})
            if entity_type.get("value"):
                extracted_entity_types.add(entity_type["value"])

        # Check for inconsistencies
        if len(extracted_names) > 1:
            inconsistencies.append({
                "field": "legal_name",
                "issue": "Multiple legal names found across documents",
                "values": list(extracted_names),
                "severity": "high",
                "recommendation": "Verify correct legal entity name and update documents"
            })

        if len(extracted_jurisdictions) > 1:
            inconsistencies.append({
                "field": "jurisdiction",
                "issue": "Jurisdiction mismatch across documents",
                "values": list(extracted_jurisdictions),
                "severity": "high",
                "recommendation": "Confirm primary jurisdiction with client"
            })

        if len(extracted_entity_types) > 1:
            warnings.append({
                "field": "entity_type",
                "issue": "Different entity types mentioned",
                "values": list(extracted_entity_types),
                "severity": "medium",
                "recommendation": "Review if entity structure has changed"
            })

        # Check against client master data
        expected_name = client_data.get("name")
        if expected_name and extracted_names and expected_name not in extracted_names:
            inconsistencies.append({
                "field": "legal_name",
                "issue": "Document names don't match client master data",
                "values": list(extracted_names) + [f"Expected: {expected_name}"],
                "severity": "high",
                "recommendation": "Update client master data or re-validate documents"
            })

        # Determine overall consistency score
        total_checks = 3  # name, jurisdiction, entity type
        issues_found = len(inconsistencies) + len(warnings) * 0.5
        consistency_score = max(0, (total_checks - issues_found) / total_checks * 100)

        status = "consistent"
        if inconsistencies:
            status = "inconsistent"
        elif warnings:
            status = "warnings"

        return {
            "status": status,
            "consistency_score": round(consistency_score, 1),
            "inconsistencies": inconsistencies,
            "warnings": warnings,
            "documents_checked": len(documents_data),
            "checked_at": datetime.now().isoformat()
        }


# Singleton instance
ai_service = AIService()
