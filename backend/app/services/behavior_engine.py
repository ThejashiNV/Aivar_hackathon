from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.agent import Agent
from app.models.behavior import AgentBehaviorLog
from app.models.action import Action
from app.models.evaluation import Evaluation


def get_behavioral_risk(db: Session, agent: Agent) -> tuple[float, dict]:
    """Calculate behavioral risk score (0-100) and return contributing factors."""
    factors = {}
    score = 0.0

    trust_penalty = max(0, (50 - agent.trust_score)) * 1.5
    factors["trust_score"] = round(agent.trust_score, 1)
    factors["trust_penalty"] = round(trust_penalty, 1)
    score += trust_penalty

    violation_penalty = min(agent.violations * 8.0, 30.0)
    factors["violations"] = agent.violations
    factors["violation_penalty"] = round(violation_penalty, 1)
    score += violation_penalty

    one_hour_ago = datetime.now(timezone.utc) - timedelta(hours=1)
    recent_count = (
        db.query(func.count(Action.id))
        .filter(Action.agent_id == agent.id, Action.created_at >= one_hour_ago)
        .scalar()
        or 0
    )
    frequency_penalty = 0.0
    if recent_count > 10:
        frequency_penalty = min((recent_count - 10) * 2.0, 15.0)
    factors["recent_action_count"] = recent_count
    factors["frequency_penalty"] = round(frequency_penalty, 1)
    score += frequency_penalty

    recent_rejections = (
        db.query(func.count(Action.id))
        .filter(
            Action.agent_id == agent.id,
            Action.status == "rejected",
            Action.created_at >= one_hour_ago,
        )
        .scalar()
        or 0
    )
    rejection_penalty = min(recent_rejections * 12.0, 30.0)
    factors["recent_rejections"] = recent_rejections
    factors["rejection_penalty"] = round(rejection_penalty, 1)
    score += rejection_penalty

    return min(score, 100.0), factors


def update_agent_trust(db: Session, agent: Agent, event_type: str, severity: float = 0.0):
    """Update the agent's trust score based on an event and log it."""
    delta = 0.0
    if event_type == "action_rejected":
        delta = -12.0
        agent.violations += 1
    elif event_type == "policy_violation":
        delta = -15.0
        agent.violations += 1
    elif event_type == "action_approved":
        delta = 1.5
    elif event_type == "action_autonomous":
        delta = 0.5
    elif event_type == "suspicious_frequency":
        delta = -8.0

    agent.trust_score = max(0.0, min(100.0, agent.trust_score + delta))
    agent.total_actions += 1

    log = AgentBehaviorLog(
        agent_id=agent.id,
        event_type=event_type,
        severity=severity,
        details={"trust_delta": delta, "new_trust": agent.trust_score},
    )
    db.add(log)
    db.flush()
