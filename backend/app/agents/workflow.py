from typing import TypedDict
from langgraph.graph import END, StateGraph
from sqlalchemy.orm import Session
from app.models.entities import Invoice
from app.rag.policy_assistant import PolicyAssistant
from app.services.fraud_service import FraudDetectionService


class InvoiceWorkflowState(TypedDict, total=False):
    invoice_id: int
    analysis: dict
    fraud: dict
    compliance: dict
    explanation: str
    report: dict


class InvoiceAgentWorkflow:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.fraud_service = FraudDetectionService()
        self.policy = PolicyAssistant()
        self.graph = self._build_graph()

    def run(self, invoice_id: int) -> InvoiceWorkflowState:
        return self.graph.invoke({"invoice_id": invoice_id})

    def _build_graph(self):
        graph = StateGraph(InvoiceWorkflowState)
        graph.add_node("invoice_analysis", self.invoice_analysis_agent)
        graph.add_node("fraud_detection", self.fraud_detection_agent)
        graph.add_node("compliance", self.compliance_agent)
        graph.add_node("explanation", self.explanation_agent)
        graph.add_node("report", self.report_agent)
        graph.set_entry_point("invoice_analysis")
        graph.add_edge("invoice_analysis", "fraud_detection")
        graph.add_edge("fraud_detection", "compliance")
        graph.add_edge("compliance", "explanation")
        graph.add_edge("explanation", "report")
        graph.add_edge("report", END)
        return graph.compile()

    def invoice_analysis_agent(self, state: InvoiceWorkflowState) -> InvoiceWorkflowState:
        invoice = self._invoice(state["invoice_id"])
        state["analysis"] = {
            "invoice_number": invoice.invoice_number,
            "vendor": invoice.vendor.name if invoice.vendor else None,
            "total_amount": invoice.total_amount,
            "tax_amount": invoice.tax_amount,
            "line_item_count": len(invoice.line_items or []),
        }
        return state

    def fraud_detection_agent(self, state: InvoiceWorkflowState) -> InvoiceWorkflowState:
        invoice = self._invoice(state["invoice_id"])
        result = self.fraud_service.analyze(self.db, invoice)
        state["fraud"] = {
            "risk_score": result.risk_score,
            "risk_level": result.risk_level,
            "flags": result.flags,
        }
        return state

    def compliance_agent(self, state: InvoiceWorkflowState) -> InvoiceWorkflowState:
        question = f"Which finance policies apply to invoice {state['analysis'].get('invoice_number')}?"
        answer = self.policy.answer(question)
        state["compliance"] = answer.model_dump()
        return state

    def explanation_agent(self, state: InvoiceWorkflowState) -> InvoiceWorkflowState:
        state["explanation"] = (
            f"Invoice risk is {state['fraud']['risk_level']} with score {state['fraud']['risk_score']}. "
            f"Compliance context: {state['compliance']['answer'][:300]}"
        )
        return state

    def report_agent(self, state: InvoiceWorkflowState) -> InvoiceWorkflowState:
        state["report"] = {
            "title": f"Invoice {state['analysis'].get('invoice_number')} investigation summary",
            "sections": ["analysis", "fraud", "compliance", "explanation"],
        }
        return state

    def _invoice(self, invoice_id: int) -> Invoice:
        invoice = self.db.query(Invoice).filter(Invoice.id == invoice_id).first()
        if not invoice:
            raise ValueError("Invoice not found")
        return invoice
