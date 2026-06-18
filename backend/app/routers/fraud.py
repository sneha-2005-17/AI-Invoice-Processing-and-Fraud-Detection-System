from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.dependencies import require_roles
from app.models.entities import Invoice, User
from app.models.enums import RoleName
from app.routers.invoices import serialize_invoice
from app.schemas.invoice import InvoiceResponse
from app.services.fraud_service import FraudDetectionService

router = APIRouter(prefix="/fraud", tags=["Fraud Detection"])


@router.post("/{invoice_id}/reanalyze", response_model=InvoiceResponse)
def reanalyze(
    invoice_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(RoleName.ADMIN, RoleName.ANALYST)),
) -> InvoiceResponse:
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    FraudDetectionService().analyze(db, invoice)
    db.refresh(invoice)
    return serialize_invoice(invoice)
