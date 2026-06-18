from pydantic import BaseModel


class MetricCard(BaseModel):
    label: str
    value: int | float | str
    delta: str | None = None


class DashboardSummary(BaseModel):
    total_invoices: int
    fraud_cases: int
    high_risk_invoices: int
    gst_compliance_rate: float
    average_processing_seconds: float
    metrics: list[MetricCard]
    monthly_fraud_trends: list[dict]
    risk_distribution: list[dict]
    vendor_risk_ranking: list[dict]
