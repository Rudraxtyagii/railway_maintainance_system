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
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 750, "RAILBLOCK v3.0 — ML-ASSISTED CONSTRAINT OPTIMIZATION INTEGRATION REPORT")
            self.setFont("Helvetica", 8)
            self.setFillColor(colors.HexColor("#718096"))
            self.drawRightString(612 - 54, 750, "SYSTEM ARCHITECTURE & FORENSIC VERIFICATION")
            self.setStrokeColor(colors.HexColor("#CBD5E0"))
            self.setLineWidth(0.5)
            self.line(54, 742, 612 - 54, 742)

        # Footer
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#718096"))
        self.drawString(54, 36, "INDIAN RAILWAYS MISSION-CRITICAL DECISION SUPPORT | GROUND TRUTH VERIFICATION")
        self.drawRightString(612 - 54, 36, f"Page {self._pageNumber} of {page_count}")
        self.setStrokeColor(colors.HexColor("#CBD5E0"))
        self.setLineWidth(0.5)
        self.line(54, 48, 612 - 54, 48)
        self.restoreState()

def build_pdf():
    workspace_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    md_path = os.path.join(workspace_dir, "ML_CSP_INTEGRATION_REPORT.md")
    pdf_path = os.path.join(workspace_dir, "ML_CSP_INTEGRATION_REPORT.pdf")

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
        spaceAfter=6
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor('#4F46E5'),
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
        fontSize=10.5,
        leading=13,
        textColor=colors.HexColor('#1E293B'),
        spaceBefore=9,
        spaceAfter=3,
        keepWithNext=True
    )
    h3_style = ParagraphStyle(
        'H3',
        parent=styles['Heading3'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=11.5,
        textColor=colors.HexColor('#334155'),
        spaceBefore=7,
        spaceAfter=2,
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
        spaceAfter=2.5
    )
    code_style = ParagraphStyle(
        'CodeSnippet',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=7,
        leading=9,
        textColor=colors.HexColor('#0F172A'),
        backColor=colors.HexColor('#F8FAFC'),
        borderPadding=4,
        spaceAfter=5
    )
    callout_style = ParagraphStyle(
        'Callout',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8.5,
        leading=11.5,
        textColor=colors.HexColor('#1E3A8A'),
        backColor=colors.HexColor('#EFF6FF'),
        borderPadding=6,
        spaceBefore=5,
        spaceAfter=5
    )

    story = []
    lines = md_text.split("\n")
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
                # Clean Markdown
                c_clean = re.sub(r"\[([^\]]+)\]\([^\)]+\)", r"\1", cell)
                c_clean = re.sub(r"\*\*([^\*]+)\*\*", r"<b>\1</b>", c_clean)
                c_clean = re.sub(r"`([^`]+)`", r"<font face='Courier'>\1</font>", c_clean)
                
                style = ParagraphStyle(
                    'TableCell',
                    parent=styles['Normal'],
                    fontName='Helvetica-Bold' if row_idx == 0 else 'Helvetica',
                    fontSize=7.5 if num_cols > 4 else 8,
                    leading=9.5 if num_cols > 4 else 10.5,
                    textColor=colors.HexColor('#0F172A') if row_idx == 0 else colors.HexColor('#334155')
                )
                formatted_row.append(Paragraph(c_clean, style))
            table_data.append(formatted_row)
            
        t = Table(table_data, colWidths=[col_width] * num_cols)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F1F5F9')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('LEFTPADDING', (0, 0), (-1, -1), 4),
            ('RIGHTPADDING', (0, 0), (-1, -1), 4),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ]))
        return t

    for line in lines:
        stripped = line.strip()
        
        # Handle code blocks
        if stripped.startswith("```"):
            if in_code_block:
                in_code_block = False
                code_text = "<br/>".join([c.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace(" ", "&nbsp;") for c in code_buffer])
                story.append(Paragraph(code_text, code_style))
                code_buffer = []
            else:
                in_code_block = True
                code_buffer = []
            continue

        if in_code_block:
            code_buffer.append(line)
            continue

        # Handle tables
        if stripped.startswith("|") and stripped.endswith("|"):
            table_buffer.append(line)
            continue
        elif table_buffer:
            t = flush_table(table_buffer)
            if t:
                story.append(t)
                story.append(Spacer(1, 4))
            table_buffer = []

        if not stripped:
            continue

        # Clean markdown formatting for inline text
        fmt = line
        fmt = re.sub(r"\[([^\]]+)\]\([^\)]+\)", r"\1", fmt)
        fmt = re.sub(r"\*\*([^\*]+)\*\*", r"<b>\1</b>", fmt)
        fmt = re.sub(r"\*([^\*]+)\*", r"<i>\1</i>", fmt)
        fmt = re.sub(r"`([^`]+)`", r"<font face='Courier'>\1</font>", fmt)

        if stripped.startswith("# "):
            story.append(Paragraph(fmt[2:], title_style))
            story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#4F46E5"), spaceAfter=8))
        elif stripped.startswith("## "):
            story.append(Spacer(1, 4))
            story.append(Paragraph(fmt[3:], h1_style))
            story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#CBD5E1"), spaceAfter=4))
        elif stripped.startswith("### "):
            story.append(Paragraph(fmt[4:], h2_style))
        elif stripped.startswith("#### "):
            story.append(Paragraph(fmt[5:], h3_style))
        elif stripped.startswith("> "):
            callout_text = fmt[2:].replace("> [!NOTE]", "").replace("> [!IMPORTANT]", "").replace("> [!TIP]", "").strip()
            story.append(Paragraph(callout_text, callout_style))
        elif stripped.startswith("- ") or stripped.startswith("* "):
            story.append(Paragraph(f"• {fmt[2:]}", bullet_style))
        elif re.match(r"^\d+\.\s", stripped):
            num_match = re.match(r"^(\d+\.)\s*(.*)", fmt)
            if num_match:
                story.append(Paragraph(f"<b>{num_match.group(1)}</b> {num_match.group(2)}", bullet_style))
        else:
            story.append(Paragraph(fmt, body_style))

    if table_buffer:
        t = flush_table(table_buffer)
        if t:
            story.append(t)

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated PDF: {pdf_path}")

if __name__ == "__main__":
    build_pdf()
