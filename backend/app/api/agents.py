from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Agent, Action, AgentBehaviorLog, Evaluation
from app.schemas.schemas import AgentOut, AgentProfile, ActionSummary, BehaviorLogOut

router = APIRouter(prefix="/api/v1/agents", tags=["agents"])


@router.get("", response_model=list[AgentOut])
def list_agents(db: Session = Depends(get_db)):
    agents = db.query(Agent).order_by(Agent.name).all()
    return [AgentOut.model_validate(a) for a in agents]


@router.get("/{agent_id}/profile", response_model=AgentProfile)
def get_agent_profile(agent_id: str, db: Session = Depends(get_db)):
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(404, "Agent not found")

    recent_actions_raw = (
        db.query(Action)
        .filter(Action.agent_id == agent.id)
        .order_by(Action.created_at.desc())
        .limit(20)
        .all()
    )
    recent_actions = []
    for a in recent_actions_raw:
        recent_actions.append(
            ActionSummary(
                id=a.id,
                agent_id=a.agent_id,
                agent_name=agent.name,
                action_type=a.action_type,
                resource_type=a.resource_type,
                description=a.description,
                status=a.status,
                risk_score=a.evaluation.risk_score if a.evaluation else None,
                decision=a.evaluation.decision if a.evaluation else None,
                created_at=a.created_at,
            )
        )

    behavior_logs = (
        db.query(AgentBehaviorLog)
        .filter(AgentBehaviorLog.agent_id == agent.id)
        .order_by(AgentBehaviorLog.created_at.desc())
        .limit(20)
        .all()
    )

    risk_scores = (
        db.query(Evaluation.risk_score)
        .join(Action)
        .filter(Action.agent_id == agent.id)
        .order_by(Evaluation.decided_at.desc())
        .limit(20)
        .all()
    )
    risk_trend = [r[0] for r in reversed(risk_scores)]

    return AgentProfile(
        **AgentOut.model_validate(agent).model_dump(),
        recent_actions=recent_actions,
        behavior_logs=[BehaviorLogOut.model_validate(b) for b in behavior_logs],
        risk_trend=risk_trend,
    )
