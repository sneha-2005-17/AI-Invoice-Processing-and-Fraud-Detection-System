from enum import StrEnum


class RoleName(StrEnum):
    ADMIN = "admin"
    ANALYST = "analyst"
    USER = "user"


class InvoiceStatus(StrEnum):
    UPLOADED = "uploaded"
    EXTRACTED = "extracted"
    REVIEWED = "reviewed"
    REJECTED = "rejected"


class RiskLevel(StrEnum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
