from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.entities import Invoice, User
from app.schemas.invoice import FraudResultResponse, InvoiceResponse
from app.services.audit_service import write_audit
from app.services.invoice_service import InvoiceService

router = APIRouter(prefix="/invoices", tags=["Invoices"])


def serialize_invoice(invoice: Invoice) -> InvoiceResponse:
    fraud = invoice.fraud_result
    return InvoiceResponse(
        id=invoice.id,
        invoice_number=invoice.invoice_number,
        vendor_name=invoice.vendor.name if invoice.vendor else None,
        invoice_date=invoice.invoice_date,
        gst_number=invoice.gst_number,
        tax_amount=invoice.tax_amount,
        total_amount=invoice.total_amount,
        status=invoice.status,
        created_at=invoice.created_at,
        fraud_result=FraudResultResponse(
            risk_score=fraud.risk_score,
            risk_level=fraud.risk_level,
            flags=fraud.flags,
            explanation=fraud.explanation,
        )
        if fraud
        else None,
    )


@router.post("/upload", response_model=InvoiceResponse)
async def upload_invoice(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> InvoiceResponse:
    invoice = await InvoiceService().upload_and_process(db, file, user)
    write_audit(db, "invoice.uploaded", "invoice", actor_id=user.id, entity_id=str(invoice.id))
    return serialize_invoice(invoice)


@router.get("", response_model=list[InvoiceResponse])
def list_invoices(db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> list[InvoiceResponse]:
    query = db.query(Invoice).order_by(Invoice.created_at.desc())
    if user.role.name == "user":
        query = query.filter(Invoice.uploaded_by_id == user.id)
    return [serialize_invoice(invoice) for invoice in query.limit(100).all()]


@router.get("/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(invoice_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> InvoiceResponse:
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Invoice not found")
    if user.role.name == "user" and invoice.uploaded_by_id != user.id:
        from fastapi import HTTPException

        raise HTTPException(status_code=403, detail="Insufficient privileges")
    return serialize_invoice(invoice)
