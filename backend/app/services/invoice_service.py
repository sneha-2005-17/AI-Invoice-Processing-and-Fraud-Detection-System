from pathlib import Path
from uuid import uuid4
from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session
from app.core.config import get_settings
from app.models.entities import Invoice, User, Vendor
from app.models.enums import InvoiceStatus
from app.services.fraud_service import FraudDetectionService
from app.services.ocr_service import OCRService

ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".tiff", ".bmp"}
MAX_UPLOAD_BYTES = 15 * 1024 * 1024


class InvoiceService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.ocr = OCRService()
        self.fraud = FraudDetectionService()

    async def upload_and_process(self, db: Session, file: UploadFile, user: User) -> Invoice:
        suffix = Path(file.filename or "").suffix.lower()
        if suffix not in ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail="Unsupported invoice file type")
        content = await file.read()
        if len(content) > MAX_UPLOAD_BYTES:
            raise HTTPException(status_code=400, detail="File exceeds 15MB limit")

        upload_dir = Path(self.settings.upload_dir)
        upload_dir.mkdir(parents=True, exist_ok=True)
        stored_name = f"{uuid4().hex}{suffix}"
        storage_path = upload_dir / stored_name
        storage_path.write_bytes(content)

        text = self.ocr.extract_text(str(storage_path))
        extracted = self.ocr.parse_invoice(text)
        vendor = self._get_or_create_vendor(db, extracted.vendor_name, extracted.gst_number)
        invoice = Invoice(
            invoice_number=extracted.invoice_number,
            vendor_id=vendor.id if vendor else None,
            uploaded_by_id=user.id,
            invoice_date=extracted.invoice_date,
            gst_number=extracted.gst_number,
            tax_amount=extracted.tax_amount,
            total_amount=extracted.total_amount,
            line_items=extracted.line_items,
            raw_text=extracted.raw_text,
            original_filename=file.filename or stored_name,
            storage_path=str(storage_path),
            status=InvoiceStatus.EXTRACTED.value,
        )
        db.add(invoice)
        db.commit()
        db.refresh(invoice)
        self.fraud.analyze(db, invoice)
        db.refresh(invoice)
        return invoice

    def _get_or_create_vendor(self, db: Session, name: str | None, gst_number: str | None) -> Vendor | None:
        if not name:
            return None
        vendor = db.query(Vendor).filter(Vendor.name == name).first()
        if vendor:
            return vendor
        vendor = Vendor(name=name, gst_number=gst_number, risk_score=40, is_approved=False)
        db.add(vendor)
        db.commit()
        db.refresh(vendor)
        return vendor
