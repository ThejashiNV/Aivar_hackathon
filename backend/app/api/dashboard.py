from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import Agent, Action, Evaluation
from app.schemas.schemas import DashboardSummary, ActionSummary, AgentOut

router = APIRouter(prefix="/api/v1/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def get_dashboard(db: Session = Depends(get_db)):
    total = db.query(func.count(Action.id)).scalar() or 0

    autonomous = (
        db.query(func.count(Evaluation.id))
        .filter(Evaluation.decision == "autonomous")
        .scalar() or 0
    )
    confirm = (
        db.query(func.count(Evaluation.id))
        .filter(Evaluation.decision == "confirm")
        .scalar() or 0
    )
    full_review = (
        db.query(func.count(Evaluation.id))
        .filter(Evaluation.decision == "full_review")
        .scalar() or 0
    )
    rejected = (
        db.query(func.count(Action.id))
        .filter(Action.status == "rejected")
        .scalar() or 0
    )
    approved = (
        db.query(func.count(Action.id))
        .filter(Action.status == "approved")
        .scalar() or 0
    )
    pending = (
        db.query(func.count(Action.id))
        .filter(Action.status == "pending")
        .scalar() or 0
    )

    avg_risk = db.query(func.avg(Evaluation.risk_score)).scalar() or 0.0

    recent_raw = (
        db.query(Action)
        .order_by(Action.created_at.desc())
        .limit(10)
        .all()
    )
    recent_actions = [
        ActionSummary(
            id=a.id,
            agent_id=a.agent_id,
            agent_name=a.agent.name if a.agent else "",
            action_type=a.action_type,
            resource_type=a.resource_type,
            description=a.description,
            status=a.status,
            risk_score=a.evaluation.risk_score if a.evaluation else None,
            decision=a.evaluation.decision if a.evaluation else None,
            created_at=a.created_at,
        )
        for a in recent_raw
    ]

    agents = db.query(Agent).order_by(Agent.name).all()
    agent_stats = [AgentOut.model_validate(a) for a in agents]

    return DashboardSummary(
        total_actions=total,
        autonomous_count=autonomous,
        confirm_count=confirm,
        full_review_count=full_review,
        rejected_count=rejected,
        approved_count=approved,
        pending_reviews=pending,
        average_risk=round(avg_risk, 1),
        recent_actions=recent_actions,
        agent_stats=agent_stats,
    )
