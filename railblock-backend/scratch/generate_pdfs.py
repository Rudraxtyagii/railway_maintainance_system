"""
PDF Generator for RAILBLOCK SIH Technical Audit and Judge Revision Sheet
Converts CODEBASE_AUDIT.md -> CODEBASE_AUDIT.pdf
and JUDGE_REVISION_SHEET.md -> JUDGE_REVISION_SHEET.pdf
Using ReportLab with clean typography, tables, and headers.
"""
import os
import sys
import re
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
AUDIT_MD = os.path.join(BASE_DIR, "CODEBASE_AUDIT.md")
AUDIT_PDF = os.path.join(BASE_DIR, "CODEBASE_AUDIT.pdf")
SHEET_MD = os.path.join(BASE_DIR, "JUDGE_REVISION_SHEET.md")
SHEET_PDF = os.path.join(BASE_DIR, "JUDGE_REVISION_SHEET.pdf")


class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_number(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        
        # Header
        self.drawString(40, 755, "RAILBLOCK (v3.0) — Technical Audit Dossier | SIH PS 26027")
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(40, 748, 572, 748)
        
        # Footer
        self.line(40, 45, 572, 45)
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(572, 32, page_str)
        self.drawString(40, 32, "CONFIDENTIAL — Ministry of Railways / CRIS Hackathon Defense Dossier")
        self.restoreState()


def parse_markdown_to_flowables(md_path, is_compact=False):
    with open(md_path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18 if not is_compact else 15,
        leading=22 if not is_compact else 18,
        textColor=colors.HexColor('#0f172a'),
        spaceAfter=6
    )
    
    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=13 if not is_compact else 11,
        leading=16 if not is_compact else 14,
        textColor=colors.HexColor('#1e293b'),
        spaceBefore=12 if not is_compact else 8,
        spaceAfter=6,
        keepWithNext=True
    )
    
    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=11 if not is_compact else 9.5,
        leading=14 if not is_compact else 12,
        textColor=colors.HexColor('#0369a1'),
        spaceBefore=10 if not is_compact else 6,
        spaceAfter=4,
        keepWithNext=True
    )
    
    h3_style = ParagraphStyle(
        'Heading3_Custom',
        parent=styles['Heading3'],
        fontName='Helvetica-Bold',
        fontSize=9.5 if not is_compact else 8.5,
        leading=12 if not is_compact else 11,
        textColor=colors.HexColor('#334155'),
        spaceBefore=8 if not is_compact else 4,
        spaceAfter=3,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5 if not is_compact else 7.5,
        leading=11.5 if not is_compact else 9.5,
        textColor=colors.HexColor('#1e293b'),
        spaceAfter=4
    )
    
    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=body_style,
        leftIndent=12,
        spaceAfter=2
    )

    code_style = ParagraphStyle(
        'Code_Custom',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=7.5 if not is_compact else 6.5,
        leading=9.5 if not is_compact else 8,
        textColor=colors.HexColor('#0f172a'),
        backColor=colors.HexColor('#f1f5f9'),
        borderPadding=4,
        spaceBefore=4,
        spaceAfter=4
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=body_style,
        fontName='Helvetica-Bold',
        fontSize=8 if not is_compact else 7,
        leading=10 if not is_compact else 9,
        textColor=colors.white
    )
    
    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=body_style,
        fontSize=7.5 if not is_compact else 6.5,
        leading=9.5 if not is_compact else 8.5
    )

    flowables = []
    in_code_block = False
    code_lines = []
    in_table = False
    table_rows = []

    def format_inline_markdown(text):
        # bold **text** -> <b>text</b>
        text = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', text)
        # italic *text* -> <i>text</i>
        text = re.sub(r'\*(.+?)\*', r'<i>\1</i>', text)
        # inline code `text` -> <font face="Courier" color="#0369a1">text</font>
        text = re.sub(r'`(.+?)`', r'<font face="Courier" color="#0369a1">\1</font>', text)
        # special characters escaping for reportlab XML
        text = text.replace('&', '&amp;').replace('&amp;lt;', '&lt;').replace('&amp;gt;', '&gt;')
        # Clean up double escaped ampersands
        text = re.sub(r'&amp;(?=[a-zA-Z]+;)', '&', text)
        return text

    for line in lines:
        raw = line.rstrip('\n')
        stripped = raw.strip()

        # Handle Code Blocks
        if stripped.startswith("```"):
            if in_code_block:
                in_code_block = False
                code_text = "\n".join(code_lines)
                code_lines = []
                flowables.append(Paragraph(code_text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('\n', '<br/>'), code_style))
                flowables.append(Spacer(1, 4))
            else:
                in_code_block = True
                code_lines = []
            continue

        if in_code_block:
            code_lines.append(raw)
            continue

        # Handle Tables
        if "|" in stripped and (stripped.startswith("|") or stripped.endswith("|")):
            # Check if separator row
            if re.match(r'^\|[\s:-|]+\|$', stripped):
                continue
            cells = [c.strip() for c in stripped.split("|")[1:-1]]
            if cells:
                in_table = True
                table_rows.append(cells)
            continue
        elif in_table:
            # End of table, render table
            if table_rows:
                header = [Paragraph(format_inline_markdown(c), table_header_style) for c in table_rows[0]]
                body_rows = [[Paragraph(format_inline_markdown(c), table_cell_style) for c in row] for row in table_rows[1:]]
                all_data = [header] + body_rows
                
                # Dynamic width calculation
                num_cols = len(table_rows[0])
                total_w = 532
                col_w = total_w / num_cols
                
                t = Table(all_data, colWidths=[col_w]*num_cols)
                t.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                    ('TOPPADDING', (0, 0), (-1, -1), 3),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
                    ('LEFTPADDING', (0, 0), (-1, -1), 4),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 4),
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
                ]))
                flowables.append(t)
                flowables.append(Spacer(1, 6))
            in_table = False
            table_rows = []

        if not stripped:
            continue

        # Horizontal Rule
        if stripped == "---":
            flowables.append(HRFlowable(width="100%", thickness=0.75, color=colors.HexColor("#cbd5e1"), spaceBefore=6, spaceAfter=6))
            continue

        # Headings
        if stripped.startswith("# "):
            flowables.append(Paragraph(format_inline_markdown(stripped[2:]), title_style))
            flowables.append(Spacer(1, 4))
        elif stripped.startswith("## "):
            flowables.append(Paragraph(format_inline_markdown(stripped[3:]), h1_style))
            flowables.append(Spacer(1, 3))
        elif stripped.startswith("### "):
            flowables.append(Paragraph(format_inline_markdown(stripped[4:]), h2_style))
            flowables.append(Spacer(1, 2))
        elif stripped.startswith("#### "):
            flowables.append(Paragraph(format_inline_markdown(stripped[5:]), h3_style))
            flowables.append(Spacer(1, 2))
        elif stripped.startswith("- ") or stripped.startswith("* "):
            flowables.append(Paragraph(f"• {format_inline_markdown(stripped[2:])}", bullet_style))
        elif re.match(r'^\d+\.\s', stripped):
            flowables.append(Paragraph(format_inline_markdown(stripped), bullet_style))
        else:
            flowables.append(Paragraph(format_inline_markdown(stripped), body_style))

    # Flush any trailing table
    if in_table and table_rows:
        header = [Paragraph(format_inline_markdown(c), table_header_style) for c in table_rows[0]]
        body_rows = [[Paragraph(format_inline_markdown(c), table_cell_style) for c in row] for row in table_rows[1:]]
        all_data = [header] + body_rows
        num_cols = len(table_rows[0])
        col_w = 532 / num_cols
        t = Table(all_data, colWidths=[col_w]*num_cols)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
        ]))
        flowables.append(t)

    return flowables


def build_pdf(md_path, pdf_path, is_compact=False):
    print(f"Compiling {md_path} -> {pdf_path}...")
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        leftMargin=40,
        rightMargin=40,
        topMargin=50,
        bottomMargin=50
    )
    
    story = parse_markdown_to_flowables(md_path, is_compact=is_compact)
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"✓ Created {pdf_path} successfully ({os.path.getsize(pdf_path)} bytes).")


if __name__ == "__main__":
    build_pdf(AUDIT_MD, AUDIT_PDF, is_compact=False)
    build_pdf(SHEET_MD, SHEET_PDF, is_compact=True)
