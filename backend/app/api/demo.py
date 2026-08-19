import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Agent, Action, AgentBehaviorLog, AuditEvent, Evaluation, Review
from app.schemas.schemas import (
    ActionEvaluateRequest,
    ActionEvaluateResponse,
    DemoRunRequest,
    DemoRunResponse,
    ReviewRequest,
)
from app.api.actions import evaluate_action, reject_action, approve_action

router = APIRouter(prefix="/api/v1/demo", tags=["demo"])

DEMO_SCENARIOS = [
    {
        "name": "low_risk_read",
        "label": "Low Risk: Read single customer profile",
        "request": ActionEvaluateRequest(
            agent_id="",
            action_type="read",
            resource_type="customer_record",
            description="Read single customer profile for order lookup",
            parameters={"record_count": 1},
        ),
    },
    {
        "name": "medium_risk_update",
        "label": "Medium Risk: Update customer billing",
        "request": ActionEvaluateRequest(
            agent_id="",
            action_type="update",
            resource_type="billing",
            description="Update customer billing address and payment method",
            parameters={"record_count": 1, "financial_impact": True, "amount": 500, "contains_pii": True},
        ),
    },
    {
        "name": "high_risk_delete",
        "label": "High Risk: Bulk delete 4500 customer records",
        "request": ActionEvaluateRequest(
            agent_id="",
            action_type="delete",
            resource_type="customer_record",
            description="Bulk delete 4500 inactive customer records from production database",
            parameters={"record_count": 4500, "contains_pii": True, "gdpr_relevant": True, "environment": "production"},
        ),
    },
    {
        "name": "escalation_retest",
        "label": "Behavioral Escalation: Same billing update after violations",
        "request": ActionEvaluateRequest(
            agent_id="",
            action_type="update",
            resource_type="billing",
            description="Update customer billing address (repeat after behavioral degradation)",
            parameters={"record_count": 1, "financial_impact": True, "amount": 500, "contains_pii": True},
        ),
    },
]


@router.post("/run", response_model=DemoRunResponse)
def run_demo(req: DemoRunRequest = DemoRunRequest(), db: Session = Depends(get_db)):
    finance_agent = db.query(Agent).filter(Agent.name == "FinanceAgent").first()
    if not finance_agent:
        from app.seed import seed_data
        seed_data(db)
        finance_agent = db.query(Agent).filter(Agent.name == "FinanceAgent").first()

    finance_agent.trust_score = 50.0
    finance_agent.violations = 0
    finance_agent.total_actions = 0

    agent_action_ids = [
        a[0] for a in db.query(Action.id).filter(Action.agent_id == finance_agent.id).all()
    ]
    if agent_action_ids:
        db.query(AuditEvent).filter(AuditEvent.action_id.in_(agent_action_ids)).delete(synchronize_session=False)
        db.query(Review).filter(Review.action_id.in_(agent_action_ids)).delete(synchronize_session=False)
        db.query(Evaluation).filter(Evaluation.action_id.in_(agent_action_ids)).delete(synchronize_session=False)
        db.query(Action).filter(Action.id.in_(agent_action_ids)).delete(synchronize_session=False)
    db.query(AuditEvent).filter(AuditEvent.agent_id == finance_agent.id, AuditEvent.action_id.is_(None)).delete(synchronize_session=False)
    db.query(AgentBehaviorLog).filter(AgentBehaviorLog.agent_id == finance_agent.id).delete(synchronize_session=False)
    db.flush()

    session_id = str(uuid.uuid4())[:8]
    results: list[ActionEvaluateResponse] = []

    scenarios = DEMO_SCENARIOS
    if req.scenario != "all":
        scenarios = [s for s in DEMO_SCENARIOS if s["name"] == req.scenario]
        if not scenarios:
            scenarios = DEMO_SCENARIOS

    for i, scenario in enumerate(scenarios):
        eval_req = scenario["request"].model_copy()
        eval_req.agent_id = finance_agent.id

        result = evaluate_action(eval_req, db)
        results.append(result)

        if scenario["name"] == "high_risk_delete":
            reject_action(
                result.action.id,
                ReviewRequest(reviewer="admin", reason="Bulk deletion requires VP approval"),
                db,
            )
            from app.services.behavior_engine import update_agent_trust
            update_agent_trust(db, finance_agent, "policy_violation", severity=0.8)
            update_agent_trust(db, finance_agent, "suspicious_frequency", severity=0.5)
            db.commit()
            db.refresh(finance_agent)

        if scenario["name"] == "medium_risk_update" and i < len(scenarios) - 1:
            if result.evaluation.decision in ("confirm", "full_review"):
                approve_action(
                    result.action.id,
                    ReviewRequest(reviewer="admin", reason="Verified billing update"),
                    db,
                )

    return DemoRunResponse(
        demo_session_id=session_id,
        actions=results,
        message=f"Demo completed: {len(results)} actions evaluated",
    )
