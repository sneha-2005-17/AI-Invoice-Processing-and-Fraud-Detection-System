from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.entities import FraudResult, Invoice, Vendor, User
from app.models.enums import RiskLevel
from app.schemas.dashboard import DashboardSummary, MetricCard


class DashboardService:
    def summary(self, db: Session, user: User) -> DashboardSummary:
        invoice_filter = []
        if user.role.name == "user":
            invoice_filter.append(Invoice.uploaded_by_id == user.id)

        total = db.query(func.count(Invoice.id)).filter(*invoice_filter).scalar() or 0
        
        fraud_query = db.query(func.count(FraudResult.id)).join(Invoice, FraudResult.invoice_id == Invoice.id).filter(*invoice_filter)
        fraud_cases = fraud_query.filter(FraudResult.risk_score >= 35).scalar() or 0
        high_risk = fraud_query.filter(FraudResult.risk_level == RiskLevel.HIGH.value).scalar() or 0
        
        invoices_with_gst = db.query(func.count(Invoice.id)).filter(Invoice.gst_number.isnot(None)).filter(*invoice_filter).scalar() or 0
        gst_rate = round((invoices_with_gst / total) * 100, 2) if total else 0

        risk_rows = (
            db.query(FraudResult.risk_level, func.count(FraudResult.id))
            .join(Invoice, FraudResult.invoice_id == Invoice.id)
            .filter(*invoice_filter)
            .group_by(FraudResult.risk_level)
            .all()
        )
        
        vendor_query = db.query(Vendor.name, Vendor.risk_score).order_by(Vendor.risk_score.desc())
        if user.role.name == "user":
            vendor_rows = (
                vendor_query.join(Invoice, Invoice.vendor_id == Vendor.id)
                .filter(*invoice_filter)
                .group_by(Vendor.id, Vendor.name, Vendor.risk_score)
                .limit(10)
                .all()
            )
        else:
            vendor_rows = vendor_query.limit(10).all()

        month_expression = (
            func.strftime("%Y-%m", Invoice.created_at)
            if db.bind and db.bind.dialect.name == "sqlite"
            else func.to_char(Invoice.created_at, "YYYY-MM")
        )
        month_rows = (
            db.query(month_expression.label("month"), func.count(FraudResult.id))
            .join(FraudResult, FraudResult.invoice_id == Invoice.id)
            .filter(FraudResult.risk_score >= 35)
            .filter(*invoice_filter)
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
