from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.dependencies import get_current_user, require_roles
from app.models.entities import User
from app.models.enums import RoleName
from app.rag.policy_assistant import PolicyAssistant
from app.schemas.rag import PolicyAnswer, PolicyQuestion

router = APIRouter(prefix="/rag", tags=["RAG Policy Assistant"])


@router.post("/documents")
async def upload_policy_document(
    file: UploadFile = File(...),
    document_type: str = Form("finance_policy"),
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(RoleName.ADMIN)),
) -> dict:
    document = await PolicyAssistant().ingest(db, file, document_type, user)
    return {"id": document.id, "title": document.title, "document_type": document.document_type}


@router.post("/chat", response_model=PolicyAnswer)
def chat(payload: PolicyQuestion, _: User = Depends(get_current_user)) -> PolicyAnswer:
    return PolicyAssistant().answer(payload.question)
