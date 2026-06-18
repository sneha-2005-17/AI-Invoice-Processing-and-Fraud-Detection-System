from pathlib import Path
from uuid import uuid4
import csv
from sqlalchemy.orm import Session
from app.core.config import get_settings
from app.models.entities import Invoice, Report, User


class ReportService:
    def __init__(self) -> None:
        self.settings = get_settings()

    def create_invoice_report(self, db: Session, invoice_id: int, fmt: str, user: User) -> Report:
        invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
        if not invoice:
            raise ValueError("Invoice not found")
        report_dir = Path(self.settings.report_dir)
        report_dir.mkdir(parents=True, exist_ok=True)
        if fmt == "csv":
            path = report_dir / f"invoice-{invoice.id}-{uuid4().hex}.csv"
            row = self._invoice_row(invoice)
            with path.open("w", newline="", encoding="utf-8") as report_file:
                writer = csv.DictWriter(report_file, fieldnames=list(row.keys()))
                writer.writeheader()
                writer.writerow(row)
        else:
            path = report_dir / f"invoice-{invoice.id}-{uuid4().hex}.pdf"
            self._write_pdf(path, invoice)
            fmt = "pdf"
        report = Report(
            report_type="invoice_summary",
            title=f"Invoice {invoice.invoice_number or invoice.id} Summary",
            storage_path=str(path),
            format=fmt,
            created_by_id=user.id,
        )
        db.add(report)
        db.commit()
        db.refresh(report)
        return report

    def _invoice_row(self, invoice: Invoice) -> dict:
        fraud = invoice.fraud_result
        return {
            "invoice_id": invoice.id,
            "invoice_number": invoice.invoice_number,
            "vendor": invoice.vendor.name if invoice.vendor else None,
            "total_amount": invoice.total_amount,
            "tax_amount": invoice.tax_amount,
            "risk_score": fraud.risk_score if fraud else None,
            "risk_level": fraud.risk_level if fraud else None,
        }

    def _write_pdf(self, path: Path, invoice: Invoice) -> None:
        try:
            from reportlab.lib.pagesizes import letter
            from reportlab.pdfgen import canvas
        except ImportError as exc:
            raise RuntimeError("PDF report generation requires reportlab to be installed.") from exc

        fraud = invoice.fraud_result
        pdf = canvas.Canvas(str(path), pagesize=letter)
        y = 750
        pdf.setFont("Helvetica-Bold", 16)
        pdf.drawString(72, y, "Fraud Investigation Report")
        pdf.setFont("Helvetica", 11)
        for label, value in self._invoice_row(invoice).items():
            y -= 24
            pdf.drawString(72, y, f"{label}: {value}")
        if fraud:
            y -= 36
            pdf.drawString(72, y, "Explanation:")
            y -= 18
            pdf.drawString(72, y, fraud.explanation[:95])
        pdf.save()
