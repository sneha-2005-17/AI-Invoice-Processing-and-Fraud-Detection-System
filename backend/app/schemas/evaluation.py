from pydantic import BaseModel


class EvaluationSummary(BaseModel):
    rag_metrics: dict[str, float]
    system_metrics: dict[str, float]
    performance_metrics: dict[str, float]
    user_metrics: dict[str, float]
