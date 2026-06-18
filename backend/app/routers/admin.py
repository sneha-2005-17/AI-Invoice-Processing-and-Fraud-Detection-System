from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.dependencies import require_roles
from app.models.entities import AuditLog, User, Vendor
from app.models.enums import RoleName

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/audit-logs")
def audit_logs(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(RoleName.ADMIN)),
) -> list[dict]:
    rows = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(100).all()
    return [
        {
            "id": row.id,
            "action": row.action,
            "entity_type": row.entity_type,
            "entity_id": row.entity_id,
            "metadata": row.metadata_json,
            "created_at": row.created_at,
        }
        for row in rows
    ]


@router.get("/vendors")
def vendors(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(RoleName.ADMIN, RoleName.ANALYST)),
) -> list[dict]:
    return [
        {"id": vendor.id, "name": vendor.name, "gst_number": vendor.gst_number, "risk_score": vendor.risk_score, "approved": vendor.is_approved}
        for vendor in db.query(Vendor).order_by(Vendor.risk_score.desc()).limit(100).all()
    ]
