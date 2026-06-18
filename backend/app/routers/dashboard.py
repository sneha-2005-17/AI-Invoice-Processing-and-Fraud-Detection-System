from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.dependencies import require_roles
from app.models.entities import User
from app.models.enums import RoleName
from app.schemas.dashboard import DashboardSummary
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.ADMIN, RoleName.ANALYST, RoleName.USER)),
) -> DashboardSummary:
    return DashboardService().summary(db, current_user)
