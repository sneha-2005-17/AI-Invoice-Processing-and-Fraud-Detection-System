from datetime import datetime, timezone
from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.enums import InvoiceStatus, RiskLevel, RoleName


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Role(Base):
    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(32), unique=True, default=RoleName.USER.value)
    description: Mapped[str | None] = mapped_column(String(255))
    users: Mapped[list["User"]] = relationship(back_populates="role")


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(255))
    password_hash: Mapped[str] = mapped_column(String(255))
    role_id: Mapped[int] = mapped_column(ForeignKey("roles.id"))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    role: Mapped[Role] = relationship(back_populates="users")
    invoices: Mapped[list["Invoice"]] = relationship(back_populates="uploaded_by")


class Vendor(Base):
    __tablename__ = "vendors"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    gst_number: Mapped[str | None] = mapped_column(String(32), index=True)
    risk_score: Mapped[float] = mapped_column(Float, default=25)
    is_approved: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Invoice(Base):
    __tablename__ = "invoices"

    id: Mapped[int] = mapped_column(primary_key=True)
    invoice_number: Mapped[str | None] = mapped_column(String(128), index=True)
    vendor_id: Mapped[int | None] = mapped_column(ForeignKey("vendors.id"))
    uploaded_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    invoice_date: Mapped[datetime | None] = mapped_column(Date)
    gst_number: Mapped[str | None] = mapped_column(String(32))
    tax_amount: Mapped[float] = mapped_column(Float, default=0)
    total_amount: Mapped[float] = mapped_column(Float, default=0)
    line_items: Mapped[list[dict]] = mapped_column(JSON, default=list)
    raw_text: Mapped[str | None] = mapped_column(Text)
    original_filename: Mapped[str] = mapped_column(String(255))
    storage_path: Mapped[str] = mapped_column(String(512))
    status: Mapped[str] = mapped_column(String(32), default=InvoiceStatus.UPLOADED.value)
    analysis_result: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    vendor: Mapped[Vendor | None] = relationship()
    uploaded_by: Mapped[User] = relationship(back_populates="invoices")
    fraud_result: Mapped["FraudResult"] = relationship(back_populates="invoice", uselist=False, cascade="all, delete-orphan")




class FraudResult(Base):
    __tablename__ = "fraud_results"

    id: Mapped[int] = mapped_column(primary_key=True)
    invoice_id: Mapped[int] = mapped_column(
        ForeignKey("invoices.id"),
        unique=True,
    )


    risk_score: Mapped[int] = mapped_column(Integer)
    risk_level: Mapped[str] = mapped_column(String(16), default=RiskLevel.LOW.value)
    flags: Mapped[list[dict]] = mapped_column(JSON, default=list)
    explanation: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    invoice: Mapped[Invoice] = relationship(back_populates="fraud_result")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    actor_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    action: Mapped[str] = mapped_column(String(128), index=True)
    entity_type: Mapped[str] = mapped_column(String(64))
    entity_id: Mapped[str | None] = mapped_column(String(64))
    metadata_json: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class UploadedDocument(Base):
    __tablename__ = "uploaded_documents"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(255))
    document_type: Mapped[str] = mapped_column(String(64))
    storage_path: Mapped[str] = mapped_column(String(512))
    uploaded_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class RagChunk(Base):
    __tablename__ = "rag_chunks"

    id: Mapped[int] = mapped_column(primary_key=True)
    document_id: Mapped[int] = mapped_column(ForeignKey("uploaded_documents.id"))
    chunk_index: Mapped[int] = mapped_column(Integer)
    content: Mapped[str] = mapped_column(Text)
    source_reference: Mapped[str] = mapped_column(String(255))
    embedding_id: Mapped[str] = mapped_column(String(255), unique=True)


class Feedback(Base):
    __tablename__ = "feedback"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    target_type: Mapped[str] = mapped_column(String(64))
    target_id: Mapped[str] = mapped_column(String(64))
    score: Mapped[int] = mapped_column(Integer)
    comment: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[int] = mapped_column(primary_key=True)
    report_type: Mapped[str] = mapped_column(String(64))
    title: Mapped[str] = mapped_column(String(255))
    storage_path: Mapped[str] = mapped_column(String(512))
    format: Mapped[str] = mapped_column(String(16))
    created_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
