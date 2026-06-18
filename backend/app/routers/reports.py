from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.entities import User
from app.services.report_service import ReportService

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.post("/invoice/{invoice_id}")
def create_invoice_report(
    invoice_id: int,
    fmt: str = "pdf",
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    try:
        report = ReportService().create_invoice_report(db, invoice_id, fmt, user)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return {"id": report.id, "title": report.title, "format": report.format, "download_url": f"/api/reports/{report.id}/download"}


@router.get("/{report_id}/download")
def download_report(report_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    from app.models.entities import Report

    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return FileResponse(report.storage_path, filename=f"{report.title}.{report.format}")
