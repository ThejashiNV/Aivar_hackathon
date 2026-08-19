from sqlalchemy.orm import Session
from app.models import Agent, Policy


DEFAULT_RISK_WEIGHTS = {
    "action_weight": 0.45,
    "context_weight": 0.15,
    "behavior_weight": 0.40,
}

DEFAULT_AGENTS = [
    {"name": "FinanceAgent", "description": "Handles financial operations, billing, and payment processing", "agent_type": "finance"},
    {"name": "SupportAgent", "description": "Customer support operations and ticket management", "agent_type": "support"},
    {"name": "DataAgent", "description": "Data analytics, reporting, and bulk data operations", "agent_type": "data"},
]


def seed_data(db: Session):
    existing_policy = db.query(Policy).filter(Policy.is_active == True).first()
    if not existing_policy:
        policy = Policy(
            name="Default Governance Policy",
            version=1,
            autonomous_threshold=30.0,
            confirm_threshold=60.0,
            risk_weights=DEFAULT_RISK_WEIGHTS,
            is_active=True,
        )
        db.add(policy)

    for agent_data in DEFAULT_AGENTS:
        existing = db.query(Agent).filter(Agent.name == agent_data["name"]).first()
        if not existing:
            db.add(Agent(**agent_data))

    db.commit()
