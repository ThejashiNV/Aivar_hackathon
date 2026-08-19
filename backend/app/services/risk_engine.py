from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models.agent import Agent
from app.services.behavior_engine import get_behavioral_risk


ACTION_TYPE_RISK = {
    "delete": {"reversibility": 35, "destructive": 25},
    "update": {"reversibility": 15, "destructive": 8},
    "create": {"reversibility": 8, "destructive": 0},
    "read": {"reversibility": 0, "destructive": 0},
    "execute": {"reversibility": 20, "destructive": 15},
}

RESOURCE_SENSITIVITY = {
    "customer_record": 15,
    "billing": 22,
    "financial": 28,
    "system_config": 25,
    "user_data": 18,
    "analytics": 8,
    "logs": 5,
}


def calculate_action_risk(action_type: str, resource_type: str, parameters: dict) -> tuple[float, dict]:
    """Calculate risk from the action itself. Returns (score, breakdown)."""
    breakdown = {}

    type_risks = ACTION_TYPE_RISK.get(action_type, {"reversibility": 5, "destructive": 5})
    breakdown["reversibility"] = type_risks.get("reversibility", 5)
    breakdown["destructive"] = type_risks.get("destructive", 5)

    sensitivity = RESOURCE_SENSITIVITY.get(resource_type, 8)
    breakdown["sensitivity"] = sensitivity

    record_count = parameters.get("record_count", 1)
    if record_count > 1000:
        data_scope = 35
    elif record_count > 100:
        data_scope = 25
    elif record_count > 10:
        data_scope = 15
    elif record_count > 1:
        data_scope = 8
    else:
        data_scope = 3
    breakdown["data_scope"] = data_scope

    financial_impact = 0
    if parameters.get("financial_impact"):
        amount = parameters.get("amount", 0)
        if amount > 10000:
            financial_impact = 20
        elif amount > 1000:
            financial_impact = 12
        elif amount > 100:
            financial_impact = 6
        else:
            financial_impact = 3
    breakdown["financial_impact"] = financial_impact

    regulatory = 0
    if parameters.get("contains_pii"):
        regulatory += 15
    if parameters.get("contains_phi"):
        regulatory += 18
    if parameters.get("gdpr_relevant"):
        regulatory += 12
    breakdown["regulatory"] = min(regulatory, 30)

    action_score = sum(breakdown.values())
    return action_score, breakdown


def calculate_context_risk(parameters: dict) -> tuple[float, dict]:
    """Calculate risk from contextual factors."""
    factors = {}
    score = 0.0

    now = datetime.now(timezone.utc)
    hour = now.hour
    if hour < 6 or hour > 22:
        factors["off_hours"] = True
        score += 8
    else:
        factors["off_hours"] = False

    env = parameters.get("environment", "production")
    if env == "production":
        score += 5
        factors["environment"] = "production"
    elif env == "staging":
        score += 2
        factors["environment"] = "staging"
    else:
        factors["environment"] = env

    if parameters.get("external_communication"):
        score += 10
        factors["external_communication"] = True

    factors["context_score"] = round(score, 1)
    return score, factors


def calculate_total_risk(
    db: Session,
    agent: Agent,
    action_type: str,
    resource_type: str,
    parameters: dict,
    policy_weights: dict,
) -> tuple[float, dict, dict, dict]:
    """
    Calculate the total normalized risk score.
    Returns (total_score, risk_breakdown, context_factors, behavioral_factors).
    """
    action_score, action_breakdown = calculate_action_risk(action_type, resource_type, parameters)
    context_score, context_factors = calculate_context_risk(parameters)
    behavioral_score, behavioral_factors = get_behavioral_risk(db, agent)

    w_action = policy_weights.get("action_weight", 0.50)
    w_context = policy_weights.get("context_weight", 0.20)
    w_behavior = policy_weights.get("behavior_weight", 0.30)

    raw_total = (
        action_score * w_action
        + context_score * w_context
        + behavioral_score * w_behavior
    )

    total = min(max(round(raw_total, 1), 0), 100)

    risk_breakdown = {
        "reversibility": round(action_breakdown["reversibility"] * w_action, 1),
        "data_scope": round(action_breakdown["data_scope"] * w_action, 1),
        "sensitivity": round(action_breakdown["sensitivity"] * w_action, 1),
        "financial_impact": round(action_breakdown["financial_impact"] * w_action, 1),
        "destructive": round(action_breakdown["destructive"] * w_action, 1),
        "regulatory": round(action_breakdown["regulatory"] * w_action, 1),
        "context": round(context_score * w_context, 1),
        "behavioral": round(behavioral_score * w_behavior, 1),
    }

    return total, risk_breakdown, context_factors, behavioral_factors
