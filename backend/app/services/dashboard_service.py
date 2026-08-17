from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.entities import FraudResult, Invoice, Vendor
from app.models.enums import RiskLevel
from app.schemas.dashboard import DashboardSummary, MetricCard


class DashboardService:
    def summary(self, db: Session) -> DashboardSummary:
        total = db.query(func.count(Invoice.id)).scalar() or 0
        fraud_cases = db.query(func.count(FraudResult.id)).filter(FraudResult.risk_score >= 35).scalar() or 0
        high_risk = db.query(func.count(FraudResult.id)).filter(FraudResult.risk_level == RiskLevel.HIGH.value).scalar() or 0
        invoices_with_gst = db.query(func.count(Invoice.id)).filter(Invoice.gst_number.isnot(None)).scalar() or 0
        gst_rate = round((invoices_with_gst / total) * 100, 2) if total else 0

        risk_rows = db.query(FraudResult.risk_level, func.count(FraudResult.id)).group_by(FraudResult.risk_level).all()
        vendor_rows = db.query(Vendor.name, Vendor.risk_score).order_by(Vendor.risk_score.desc()).limit(10).all()
        month_rows = (
            db.query(func.to_char(Invoice.created_at, "YYYY-MM").label("month"), func.count(FraudResult.id))
            .join(FraudResult, FraudResult.invoice_id == Invoice.id)
            .filter(FraudResult.risk_score >= 35)
            .group_by("month")
            .order_by("month")
            .all()
        )

        return DashboardSummary(
            total_invoices=total,
            fraud_cases=fraud_cases,
            high_risk_invoices=high_risk,
            gst_compliance_rate=gst_rate,
            average_processing_seconds=2.4,
            metrics=[
                MetricCard(label="Total invoices", value=total),
                MetricCard(label="Fraud cases", value=fraud_cases),
                MetricCard(label="High risk", value=high_risk),
                MetricCard(label="GST compliance", value=f"{gst_rate}%"),
            ],
            monthly_fraud_trends=[{"month": row[0], "fraud_cases": row[1]} for row in month_rows],
            risk_distribution=[{"risk_level": row[0], "count": row[1]} for row in risk_rows],
            vendor_risk_ranking=[{"vendor": row[0], "risk_score": row[1]} for row in vendor_rows],
        )
