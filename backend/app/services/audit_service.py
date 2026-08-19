from sqlalchemy.orm import Session
from app.models.audit import AuditEvent


def create_audit_event(
    db: Session,
    event_type: str,
    action_id: str | None = None,
    agent_id: str | None = None,
    actor: str = "system",
    details: dict | None = None,
) -> AuditEvent:
    event = AuditEvent(
        action_id=action_id,
        agent_id=agent_id,
        event_type=event_type,
        actor=actor,
        details=details or {},
    )
    db.add(event)
    db.flush()
    return event
