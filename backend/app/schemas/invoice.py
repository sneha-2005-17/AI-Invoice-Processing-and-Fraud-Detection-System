from datetime import date, datetime
from pydantic import BaseModel


class ExtractedInvoiceData(BaseModel):
    invoice_number: str | None = None
    vendor_name: str | None = None
    invoice_date: date | None = None
    gst_number: str | None = None
    tax_amount: float = 0
    total_amount: float = 0
    line_items: list[dict] = []
    raw_text: str = ""


class FraudFlag(BaseModel):
    code: str
    severity: str
    message: str
    evidence: dict = {}


class FraudResultResponse(BaseModel):
    risk_score: int
    risk_level: str
    flags: list[FraudFlag]
    explanation: str


class InvoiceResponse(BaseModel):
    id: int
    invoice_number: str | None
    vendor_name: str | None
    invoice_date: date | None
    gst_number: str | None
    tax_amount: float
    total_amount: float
    status: str
    created_at: datetime
    fraud_result: FraudResultResponse | None = None
    analysis_result: dict | None = None


class DocumentChatRequest(BaseModel):
    question: str
