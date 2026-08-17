from sqlalchemy.orm import Session
from app.models.entities import AuditLog


def write_audit(
    db: Session,
    action: str,
    entity_type: str,
    actor_id: int | None = None,
    entity_id: str | None = None,
    metadata: dict | None = None,
) -> None:
    db.add(
        AuditLog(
            actor_id=actor_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            metadata_json=metadata or {},
        )
    )
    db.commit()
