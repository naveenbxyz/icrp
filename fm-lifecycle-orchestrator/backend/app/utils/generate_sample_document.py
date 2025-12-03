"""
Generate a sample KYC Registration Certificate PDF for demo purposes
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.pdfgen import canvas
import os
from datetime import datetime, timedelta


def generate_registration_certificate(output_path: str, client_name: str = "GLOBAL TRADE SOLUTIONS PTE LTD"):
    """
    Generate a sample business registration certificate PDF

    Args:
        output_path: Path where the PDF will be saved
        client_name: Name of the company (default: GLOBAL TRADE SOLUTIONS PTE LTD)
    """

    # Create the PDF
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=72
    )

    # Container for the 'Flowable' objects
    elements = []

    # Define styles
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1a1a1a'),
        spaceAfter=30,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )

    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#333333'),
        spaceAfter=12,
        fontName='Helvetica-Bold'
    )

    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=11,
        textColor=colors.HexColor('#1a1a1a'),
        spaceAfter=6,
        leading=16
    )

    centered_style = ParagraphStyle(
        'Centered',
        parent=normal_style,
        alignment=TA_CENTER
    )

    # Header decoration
    elements.append(Spacer(1, 0.3*inch))

    # Title
    title = Paragraph("═══════════════════════════════════════", centered_style)
    elements.append(title)
    elements.append(Spacer(1, 0.1*inch))

    title = Paragraph("CERTIFICATE OF INCORPORATION", title_style)
    elements.append(title)

    title = Paragraph("═══════════════════════════════════════", centered_style)
    elements.append(title)
    elements.append(Spacer(1, 0.4*inch))

    # Certificate Number
    cert_number = Paragraph("<b>Certificate Number:</b> RC-2024-12345", centered_style)
    elements.append(cert_number)
    elements.append(Spacer(1, 0.3*inch))

    # Main content
    intro = Paragraph("This is to certify that:", normal_style)
    elements.append(intro)
    elements.append(Spacer(1, 0.2*inch))

    # Company name (highlighted section)
    company_name_style = ParagraphStyle(
        'CompanyName',
        parent=title_style,
        fontSize=18,
        textColor=colors.HexColor('#1a1a1a'),
        spaceAfter=20,
        alignment=TA_CENTER
    )
    company = Paragraph(f"<b>{client_name}</b>", company_name_style)
    elements.append(company)
    elements.append(Spacer(1, 0.2*inch))

    # Incorporation text
    incorp_date = "15th day of June, 2023"
    incorp_text = Paragraph(
        f"has been incorporated under the Companies Act on the <b>{incorp_date}</b>",
        centered_style
    )
    elements.append(incorp_text)
    elements.append(Spacer(1, 0.3*inch))

    # Details section
    details_heading = Paragraph("<b>Registered Office Address:</b>", normal_style)
    elements.append(details_heading)
    elements.append(Spacer(1, 0.05*inch))

    address = Paragraph("123 Marina Boulevard, #05-01<br/>Singapore 018936", normal_style)
    elements.append(address)
    elements.append(Spacer(1, 0.2*inch))

    entity_type = Paragraph("<b>Type of Entity:</b> Private Limited Company", normal_style)
    elements.append(entity_type)
    elements.append(Spacer(1, 0.1*inch))

    principal = Paragraph("<b>Principal Activities:</b> Financial Services", normal_style)
    elements.append(principal)
    elements.append(Spacer(1, 0.3*inch))

    # Registration details table
    reg_heading = Paragraph("<b>Registration Details:</b>", normal_style)
    elements.append(reg_heading)
    elements.append(Spacer(1, 0.1*inch))

    reg_data = [
        ['Incorporation Date:', '15 June 2023'],
        ['Expiry Date:', '15 June 2026'],
        ['Authorized Capital:', 'SGD 500,000']
    ]

    reg_table = Table(reg_data, colWidths=[2.5*inch, 2.5*inch])
    reg_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#1a1a1a')),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'LEFT'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(reg_table)
    elements.append(Spacer(1, 0.4*inch))

    # Issuer
    issuer = Paragraph(
        "<b>Issued by:</b> Singapore Accounting and Corporate Regulatory Authority (ACRA)",
        normal_style
    )
    elements.append(issuer)
    elements.append(Spacer(1, 0.1*inch))

    issue_date = Paragraph("<b>Date of Issue:</b> 15 June 2023", normal_style)
    elements.append(issue_date)
    elements.append(Spacer(1, 0.5*inch))

    # Footer decoration
    footer = Paragraph("═══════════════════════════════════════", centered_style)
    elements.append(footer)
    elements.append(Spacer(1, 0.2*inch))

    # Signature section
    sig_data = [
        ['Official Seal', '[Signature]'],
        ['', 'Registrar of Companies']
    ]

    sig_table = Table(sig_data, colWidths=[2.5*inch, 2.5*inch])
    sig_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#666666')),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    elements.append(sig_table)

    # Build PDF
    doc.build(elements)
    print(f"Sample registration certificate generated: {output_path}")


if __name__ == "__main__":
    # Generate sample document
    output_dir = os.path.join(os.path.dirname(__file__), "..", "..", "sample_documents")
    os.makedirs(output_dir, exist_ok=True)

    output_path = os.path.join(output_dir, "demo_registration_certificate.pdf")
    generate_registration_certificate(output_path)
