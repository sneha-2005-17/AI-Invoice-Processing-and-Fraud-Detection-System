from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.entities import Invoice, User
from app.schemas.invoice import FraudResultResponse, InvoiceResponse, DocumentChatRequest
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
        analysis_result=invoice.analysis_result,
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


@router.delete("/{invoice_id}")
def delete_invoice(invoice_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> dict:
    import logging
    from fastapi import HTTPException
    from app.core.config import get_settings
    from app.models.entities import Invoice

    logger = logging.getLogger(__name__)
    settings = get_settings()

    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        logger.warning(f"Delete failed: Invoice {invoice_id} not found.")
        raise HTTPException(status_code=404, detail="Invoice not found")
    if user.role.name == "user" and invoice.uploaded_by_id != user.id:
        logger.warning(f"Delete failed: User {user.id} has insufficient privileges to delete invoice {invoice_id}.")
        raise HTTPException(status_code=403, detail="Insufficient privileges")

    # Delete uploaded file
    deleted_file = False
    try:
        from pathlib import Path
        if invoice.storage_path:
            p = Path(invoice.storage_path)
            if p.exists():
                p.unlink()
                deleted_file = True
    except Exception as e:
        logger.error(f"Failed to delete storage file {invoice.storage_path} for invoice {invoice_id}: {str(e)}")
        deleted_file = False

    # Delete vectors from Chroma (only if invoice vectors were created)
    deleted_vectors = 0
    try:
        import chromadb
        client = chromadb.HttpClient(host=settings.chroma_host, port=settings.chroma_port)
        collection = client.get_collection("finance_policy_chunks")

        # Keep embedding_id contract consistent with ingest logic
        # Invoice chunks will use embedding ids prefixed with: doc-invoice-{invoice_id}-<index>
        # We delete by ids if present.
        prefix = f"doc-invoice-{invoice.id}-"
        # Chroma doesn't support wildcard delete; we query ids by stored RagChunk rows if available.
        from app.models.entities import RagChunk
        ids = [rc.embedding_id for rc in db.query(RagChunk).filter(RagChunk.content != None).filter(RagChunk.embedding_id.like(f"{prefix}%")).all()]
        if ids:
            collection.delete(ids=ids)
            deleted_vectors = len(ids)
    except Exception as e:
        logger.info(f"No vectors deleted from Chroma for invoice {invoice_id} (or Chroma unavailable): {str(e)}")
        deleted_vectors = 0

    # Delete DB rows with transaction handling
    try:
        db.delete(invoice)
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Database error during deletion of invoice {invoice_id}: {str(e)}")
        if "integrity" in str(e).lower() or "constraint" in str(e).lower():
            raise HTTPException(
                status_code=409,
                detail=f"Database deletion conflict (foreign key constraint): {str(e)}"
            )
        raise HTTPException(
            status_code=500,
            detail=f"Database deletion failed: {str(e)}"
        )

    logger.info(f"Invoice {invoice_id} deleted successfully. Deleted file: {deleted_file}, Deleted vectors: {deleted_vectors}")
    return {"success": True, "invoice_id": str(invoice_id), "deleted_vectors": deleted_vectors, "deleted_file": deleted_file}



@router.post("/{invoice_id}/chat")
async def chat_with_invoice(
    invoice_id: int,
    payload: DocumentChatRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:

    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Invoice not found")
    if user.role.name == "user" and invoice.uploaded_by_id != user.id:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Insufficient privileges")

    from app.core.security import has_prompt_injection, sanitize_text
    safe_question = sanitize_text(payload.question)
    if has_prompt_injection(safe_question):
        return {"answer": "This question was blocked because it resembles a prompt injection attempt."}

    import google.generativeai as genai
    from app.core.config import get_settings
    settings = get_settings()

    context = invoice.raw_text or "No text content available for this document."

    prompt = (
        "You are an AI assistant answering questions about a specific uploaded document.\n"
        "You must answer the question based strictly on the document text provided below.\n"
        "If the answer cannot be found in the document, reply: 'I cannot find the answer in the document.'\n\n"
        f"Document Content:\n{context}\n\n"
        f"Question: {safe_question}\n\n"
        "Answer:"
    )

    if settings.gemini_api_key:
        try:
            genai.configure(api_key=settings.gemini_api_key)
            model = genai.GenerativeModel(settings.gemini_model)
            response = model.generate_content(prompt)
            answer = response.text
        except Exception as e:
            answer = f"Error calling Gemini: {str(e)}"
    else:
        # Fallback text search
        words = [w.strip().lower() for w in safe_question.split() if len(w.strip()) > 3]
        matching_lines = []
        if words:
            for line in context.splitlines():
                if any(word in line.lower() for word in words):
                    matching_lines.append(line.strip())
        if matching_lines:
            answer = "Fallback scan matches:\n" + "\n".join(matching_lines[:5])
        else:
            answer = "I cannot find the answer in the document (Fallback Search)."

    return {"answer": answer}
