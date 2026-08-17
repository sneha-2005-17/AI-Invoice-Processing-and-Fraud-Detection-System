from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.entities import FraudResult, Invoice, Vendor
from app.models.enums import RiskLevel
from app.schemas.invoice import FraudFlag


class FraudDetectionService:
    def analyze(self, db: Session, invoice: Invoice) -> FraudResult:
        flags: list[FraudFlag] = []
        score = 0

        duplicate_count = (
            db.query(func.count(Invoice.id))
            .filter(Invoice.invoice_number == invoice.invoice_number, Invoice.id != invoice.id)
            .scalar()
        )
        if invoice.invoice_number and duplicate_count:
            flags.append(FraudFlag(code="DUPLICATE_INVOICE", severity="high", message="Invoice number was used before."))
            score += 35

        if invoice.total_amount and invoice.tax_amount:
            expected_tax = round(invoice.total_amount * 0.18 / 1.18, 2)
            if abs(invoice.tax_amount - expected_tax) > max(10, expected_tax * 0.1):
                flags.append(
                    FraudFlag(
                        code="GST_MISMATCH",
                        severity="medium",
                        message="GST amount differs from expected tax calculation.",
                        evidence={"expected_tax": expected_tax, "observed_tax": invoice.tax_amount},
                    )
                )
                score += 20

        avg_amount = db.query(func.avg(Invoice.total_amount)).scalar() or 0
        if avg_amount and invoice.total_amount > avg_amount * 2.5:
            flags.append(FraudFlag(code="AMOUNT_ANOMALY", severity="medium", message="Invoice amount is unusually high."))
            score += 20

        vendor: Vendor | None = invoice.vendor
        if not vendor or not vendor.is_approved:
            flags.append(FraudFlag(code="UNKNOWN_VENDOR", severity="medium", message="Vendor is not approved."))
            score += 15
        elif vendor.risk_score >= 70:
            flags.append(FraudFlag(code="VENDOR_RISK", severity="high", message="Vendor has elevated risk history."))
            score += 25

        if not invoice.gst_number:
            flags.append(FraudFlag(code="MISSING_GST", severity="low", message="GST number was not extracted."))
            score += 10

        score = min(100, score)
        level = RiskLevel.HIGH.value if score >= 70 else RiskLevel.MEDIUM.value if score >= 35 else RiskLevel.LOW.value
        explanation = self.explain(score, level, flags)

        result = db.query(FraudResult).filter(FraudResult.invoice_id == invoice.id).first()
        if not result:
            result = FraudResult(invoice_id=invoice.id, risk_score=score, risk_level=level, flags=[], explanation=explanation)
            db.add(result)
        result.risk_score = score
        result.risk_level = level
        result.flags = [flag.model_dump() for flag in flags]
        result.explanation = explanation
        db.commit()
        db.refresh(result)
        return result

    def explain(self, score: int, level: str, flags: list[FraudFlag]) -> str:
        if not flags:
            return f"Risk score is {score}. No material fraud indicators were found."
        flag_text = "; ".join(flag.message for flag in flags)
        return f"Risk score is {score} ({level}) because: {flag_text}"
