from pydantic import BaseModel, Field


class PolicyQuestion(BaseModel):
    question: str = Field(min_length=3, max_length=2000)
    invoice_id: int | None = None


class Citation(BaseModel):
    source: str
    excerpt: str


class PolicyAnswer(BaseModel):
    answer: str
    citations: list[Citation]
    blocked: bool = False
    source_document: str | None = None
    section_reference: str | None = None
    confidence_score: str | None = None
