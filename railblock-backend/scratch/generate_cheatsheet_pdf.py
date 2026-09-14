import os
import re
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#1A365D"))
        if self._pageNumber > 1:
            self.drawString(54, 750, "RAILBLOCK — JUDGE AI/ML CROSS-QUESTIONING CHEATSHEET")
            self.setFont("Helvetica", 8)
            self.setFillColor(colors.HexColor("#718096"))
            self.drawRightString(612 - 54, 750, "SIH GRAND FINALE")
            self.setStrokeColor(colors.HexColor("#CBD5E0"))
            self.setLineWidth(0.5)
            self.line(54, 742, 612 - 54, 742)

        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#718096"))
        self.drawString(54, 36, "CONFIDENTIAL — JURY REVISION SHEET | SOURCE-CODE GROUND TRUTH")
        self.drawRightString(612 - 54, 36, f"Page {self._pageNumber} of {page_count}")
        self.setStrokeColor(colors.HexColor("#CBD5E0"))
        self.setLineWidth(0.5)
        self.line(54, 48, 612 - 54, 48)
        self.restoreState()

def build_pdf():
    md_path = "/Users/kakulrathi/SIH-FINAL/railway_maintainance_system/JUDGE_AI_ML_CHEATSHEET.md"
    pdf_path = "/Users/kakulrathi/SIH-FINAL/railway_maintainance_system/JUDGE_AI_ML_CHEATSHEET.pdf"

    with open(md_path, "r", encoding="utf-8") as f:
        md_text = f.read()

    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#0F172A'),
        spaceAfter=4
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor('#0284C7'),
        spaceAfter=12
    )
    h1_style = ParagraphStyle(
        'H1',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        textColor=colors.HexColor('#0F172A'),
        spaceBefore=12,
        spaceAfter=5,
        keepWithNext=True
    )
    h2_style = ParagraphStyle(
        'H2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13,
        textColor=colors.HexColor('#1E293B'),
        spaceBefore=8,
        spaceAfter=3,
        keepWithNext=True
    )
    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.5,
        textColor=colors.HexColor('#334155'),
        spaceAfter=4
    )
    bullet_style = ParagraphStyle(
        'Bullet',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.5,
        textColor=colors.HexColor('#334155'),
        leftIndent=12,
        spaceAfter=3
    )
    code_style = ParagraphStyle(
        'CodeSnippet',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor('#0F172A'),
        backColor=colors.HexColor('#F1F5F9'),
        borderPadding=4,
        spaceAfter=5
    )

    story = []
    lines = md_text.split("\n")
    i = 0
    in_code_block = False
    code_buffer = []
    table_buffer = []

    def flush_table(tbl_lines):
        if not tbl_lines:
            return None
        rows = []
        for l in tbl_lines:
            if re.match(r"^\s*\|[-:\s|]+\|\s*$", l):
                continue
            cells = [c.strip() for c in l.split("|")[1:-1]]
            if cells:
                rows.append(cells)
        if not rows:
            return None
        
        num_cols = max(len(r) for r in rows)
        col_width = (612 - 108) / num_cols
        
        table_data = []
        for row_idx, r in enumerate(rows):
            formatted_row = []
            for cell in r:
                if row_idx == 0:
                    p = Paragraph(f"<b>{cell}</b>", ParagraphStyle('TH', fontName='Helvetica-Bold', fontSize=7.5, leading=9.5, textColor=colors.HexColor('#0F172A')))
                else:
                    p = Paragraph(cell, ParagraphStyle('TD', fontName='Helvetica', fontSize=7.5, leading=9.5, textColor=colors.HexColor('#334155')))
                formatted_row.append(p)
            while len(formatted_row) < num_cols:
                formatted_row.append(Paragraph("", body_style))
            table_data.append(formatted_row)

        t = Table(table_data, colWidths=[col_width]*num_cols)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F8FAFC')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('LEFTPADDING', (0, 0), (-1, -1), 4),
            ('RIGHTPADDING', (0, 0), (-1, -1), 4),
        ]))
        return t

    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        if stripped.startswith("```"):
            if in_code_block:
                in_code_block = False
                code_text = "<br/>".join([c.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;") for c in code_buffer])
                story.append(Paragraph(code_text, code_style))
                code_buffer = []
            else:
                in_code_block = True
                code_buffer = []
            i += 1
            continue

        if in_code_block:
            code_buffer.append(line)
            i += 1
            continue

        if stripped.startswith("|") and stripped.endswith("|"):
            table_buffer.append(stripped)
            i += 1
            continue
        else:
            if table_buffer:
                tbl = flush_table(table_buffer)
                if tbl:
                    story.append(tbl)
                    story.append(Spacer(1, 4))
                table_buffer = []

        if not stripped:
            i += 1
            continue

        if stripped.startswith("# RAILBLOCK:"):
            story.append(Paragraph(stripped[2:], title_style))
            story.append(Paragraph("Rapid Reference Cheatsheet for SIH Jury Evaluation", subtitle_style))
            story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0284C7'), spaceBefore=2, spaceAfter=8))
            i += 1
            continue

        if stripped.startswith("## "):
            story.append(HRFlowable(width="100%", thickness=0.75, color=colors.HexColor('#CBD5E0'), spaceBefore=8, spaceAfter=4))
            story.append(Paragraph(stripped[3:], h1_style))
            i += 1
            continue

        if stripped.startswith("### "):
            story.append(Paragraph(stripped[4:], h2_style))
            i += 1
            continue

        if stripped.startswith("- ") or stripped.startswith("* "):
            formatted = stripped[2:].replace("**", "<b>", 1).replace("**", "</b>", 1)
            formatted = re.sub(r"\*\*(.*?)\*\*", r"<b>\1</b>", formatted)
            story.append(Paragraph(f"• {formatted}", bullet_style))
            i += 1
            continue

        formatted = re.sub(r"\*\*(.*?)\*\*", r"<b>\1</b>", stripped)
        formatted = re.sub(r"\*(.*?)\*", r"<i>\1</i>", formatted)
        formatted = re.sub(r"`(.*?)`", r"<font face='Courier'><b>\1</b></font>", formatted)
        story.append(Paragraph(formatted, body_style))
        i += 1

    if table_buffer:
        tbl = flush_table(table_buffer)
        if tbl:
            story.append(tbl)

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated PDF at: {pdf_path}")

if __name__ == "__main__":
    build_pdf()
