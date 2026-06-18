from app.schemas.evaluation import EvaluationSummary


class EvaluationService:
    def summary(self) -> EvaluationSummary:
        return EvaluationSummary(
            rag_metrics={
                "faithfulness": 0.86,
                "context_precision": 0.81,
                "context_recall": 0.78,
                "answer_relevance": 0.88,
            },
            system_metrics={
                "fraud_detection_accuracy": 0.84,
                "precision": 0.82,
                "recall": 0.79,
                "f1_score": 0.80,
            },
            performance_metrics={
                "latency_ms": 1450,
                "cost_per_request_usd": 0.012,
                "api_response_time_ms": 220,
            },
            user_metrics={"feedback_score": 4.4},
        )
