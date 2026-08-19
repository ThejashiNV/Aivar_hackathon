from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Agent, Action, Policy, Evaluation, Review
from app.schemas.schemas import (
    ActionEvaluateRequest,
    ActionEvaluateResponse,
    ActionSummary,
    ActionDetailOut,
    ReviewRequest,
    ReviewOut,
    EvaluationOut,
    AuditEventOut,
)
from app.services.risk_engine import calculate_total_risk
from app.services.decision_engine import make_decision, generate_explanation
from app.services.behavior_engine import update_agent_trust
from app.services.audit_service import create_audit_event

router = APIRouter(prefix="/api/v1/actions", tags=["actions"])


def _action_summary(action: Action) -> ActionSummary:
    return ActionSummary(
        id=action.id,
        agent_id=action.agent_id,
        agent_name=action.agent.name if action.agent else "",
        action_type=action.action_type,
        resource_type=action.resource_type,
        description=action.description,
        status=action.status,
        risk_score=action.evaluation.risk_score if action.evaluation else None,
        decision=action.evaluation.decision if action.evaluation else None,
        created_at=action.created_at,
    )


@router.post("/evaluate", response_model=ActionEvaluateResponse)
def evaluate_action(req: ActionEvaluateRequest, db: Session = Depends(get_db)):
    agent = db.query(Agent).filter(Agent.id == req.agent_id).first()
    if not agent:
        raise HTTPException(404, "Agent not found")

    policy = db.query(Policy).filter(Policy.is_active == True).order_by(Policy.version.desc()).first()
    if not policy:
        raise HTTPException(500, "No active policy found")

    risk_score, risk_breakdown, context_factors, behavioral_factors = calculate_total_risk(
        db, agent, req.action_type, req.resource_type, req.parameters, policy.risk_weights
    )

    decision = make_decision(risk_score, policy)
    explanation = generate_explanation(
        risk_score, decision, risk_breakdown, context_factors,
        behavioral_factors, req.action_type, req.resource_type,
    )

    action = Action(
        agent_id=agent.id,
        action_type=req.action_type,
        resource_type=req.resource_type,
        description=req.description,
        parameters=req.parameters,
        status="executed" if decision == "autonomous" else "pending",
    )
    db.add(action)
    db.flush()

    evaluation = Evaluation(
        action_id=action.id,
        policy_id=policy.id,
        risk_score=risk_score,
        decision=decision,
        risk_breakdown=risk_breakdown,
        context_factors=context_factors,
        behavioral_factors=behavioral_factors,
        explanation=explanation,
    )
    db.add(evaluation)
    db.flush()

    create_audit_event(
        db, "ACTION_EVALUATED", action.id, agent.id,
        actor=f"agent:{agent.name}",
        details={"risk_score": risk_score, "decision": decision},
    )

    if decision == "autonomous":
        update_agent_trust(db, agent, "action_autonomous")
        create_audit_event(
            db, "ACTION_EXECUTED", action.id, agent.id,
            actor="system",
            details={"auto_executed": True},
        )

    db.commit()
    db.refresh(action)
    db.refresh(evaluation)

    return ActionEvaluateResponse(
        action=_action_summary(action),
        evaluation=EvaluationOut.model_validate(evaluation),
    )


@router.get("", response_model=list[ActionSummary])
def list_actions(
    status: str | None = None,
    decision: str | None = None,
    agent_id: str | None = None,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    q = db.query(Action).order_by(Action.created_at.desc())
    if status:
        q = q.filter(Action.status == status)
    if agent_id:
        q = q.filter(Action.agent_id == agent_id)
    if decision:
        q = q.join(Evaluation).filter(Evaluation.decision == decision)
    actions = q.limit(limit).all()
    return [_action_summary(a) for a in actions]


@router.get("/{action_id}", response_model=ActionDetailOut)
def get_action(action_id: str, db: Session = Depends(get_db)):
    action = db.query(Action).filter(Action.id == action_id).first()
    if not action:
        raise HTTPException(404, "Action not found")

    eval_out = EvaluationOut.model_validate(action.evaluation) if action.evaluation else None
    review_out = ReviewOut.model_validate(action.review) if action.review else None
    audits = [AuditEventOut.model_validate(e) for e in action.audit_events.order_by("created_at").all()]

    return ActionDetailOut(
        action=_action_summary(action),
        evaluation=eval_out,
        review=review_out,
        audit_events=audits,
        parameters=action.parameters,
    )


@router.post("/{action_id}/approve", response_model=ReviewOut)
def approve_action(action_id: str, req: ReviewRequest, db: Session = Depends(get_db)):
    action = db.query(Action).filter(Action.id == action_id).first()
    if not action:
        raise HTTPException(404, "Action not found")
    if action.status != "pending":
        raise HTTPException(400, f"Action is already '{action.status}', cannot approve")
    if not action.evaluation:
        raise HTTPException(400, "Action has not been evaluated")
    if action.evaluation.decision == "autonomous":
        raise HTTPException(400, "Autonomous actions do not need approval")

    review = Review(
        action_id=action.id,
        reviewer=req.reviewer,
        decision="approved",
        reason=req.reason,
    )
    db.add(review)
    action.status = "approved"

    update_agent_trust(db, action.agent, "action_approved")
    create_audit_event(
        db, "ACTION_APPROVED", action.id, action.agent_id,
        actor=f"reviewer:{req.reviewer}",
        details={"reason": req.reason},
    )

    db.commit()
    db.refresh(review)
    return ReviewOut.model_validate(review)


@router.post("/{action_id}/reject", response_model=ReviewOut)
def reject_action(action_id: str, req: ReviewRequest, db: Session = Depends(get_db)):
    action = db.query(Action).filter(Action.id == action_id).first()
    if not action:
        raise HTTPException(404, "Action not found")
    if action.status != "pending":
        raise HTTPException(400, f"Action is already '{action.status}', cannot reject")

    review = Review(
        action_id=action.id,
        reviewer=req.reviewer,
        decision="rejected",
        reason=req.reason,
    )
    db.add(review)
    action.status = "rejected"

    update_agent_trust(db, action.agent, "action_rejected")
    create_audit_event(
        db, "ACTION_REJECTED", action.id, action.agent_id,
        actor=f"reviewer:{req.reviewer}",
        details={"reason": req.reason},
    )

    db.commit()
    db.refresh(review)
    return ReviewOut.model_validate(review)


@router.post("/{action_id}/execute")
def execute_action(action_id: str, db: Session = Depends(get_db)):
    action = db.query(Action).filter(Action.id == action_id).first()
    if not action:
        raise HTTPException(404, "Action not found")

    if action.status == "executed":
        raise HTTPException(400, "Action already executed")
    if action.status == "rejected":
        raise HTTPException(403, "Rejected actions cannot be executed")
    if action.status == "pending":
        if action.evaluation and action.evaluation.decision in ("confirm", "full_review"):
            raise HTTPException(
                403,
                f"Action requires {action.evaluation.decision} — approve it first",
            )

    if action.status != "approved" and not (action.evaluation and action.evaluation.decision == "autonomous"):
        raise HTTPException(403, "Action must be approved before execution")

    action.status = "executed"
    create_audit_event(
        db, "ACTION_EXECUTED", action.id, action.agent_id,
        actor="system",
        details={},
    )
    db.commit()
    return {"action_id": action.id, "status": "executed"}
