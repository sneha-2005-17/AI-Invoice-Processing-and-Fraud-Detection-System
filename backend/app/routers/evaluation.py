from fastapi import APIRouter, Depends
from app.dependencies import require_roles
from app.models.entities import User
from app.models.enums import RoleName
from app.schemas.evaluation import EvaluationSummary
from app.services.evaluation_service import EvaluationService

router = APIRouter(prefix="/evaluation", tags=["Evaluation"])


@router.get("/summary", response_model=EvaluationSummary)
def summary(_: User = Depends(require_roles(RoleName.ADMIN, RoleName.ANALYST))) -> EvaluationSummary:
    return EvaluationService().summary()
