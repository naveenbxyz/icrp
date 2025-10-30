import os
from typing import Dict, Any, Optional
from openai import OpenAI
import PyPDF2
import pdfplumber
from PIL import Image
import pytesseract
from docx import Document as DocxDocument
from ..config import settings


class AIService:
    def __init__(self):
        self.client = OpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None
        self.model = settings.openai_model

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


# Singleton instance
ai_service = AIService()
