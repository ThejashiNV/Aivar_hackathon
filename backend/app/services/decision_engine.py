from app.models.policy import Policy


def make_decision(risk_score: float, policy: Policy) -> str:
    """Route the action based on risk score and policy thresholds."""
    if risk_score <= policy.autonomous_threshold:
        return "autonomous"
    elif risk_score <= policy.confirm_threshold:
        return "confirm"
    else:
        return "full_review"


def generate_explanation(
    risk_score: float,
    decision: str,
    risk_breakdown: dict,
    context_factors: dict,
    behavioral_factors: dict,
    action_type: str,
    resource_type: str,
) -> str:
    """Generate a deterministic human-readable explanation."""
    parts = []

    top_factors = sorted(
        [(k, v) for k, v in risk_breakdown.items() if v > 0],
        key=lambda x: x[1],
        reverse=True,
    )

    decision_label = {
        "autonomous": "AUTONOMOUS execution",
        "confirm": "USER CONFIRMATION",
        "full_review": "FULL HUMAN REVIEW",
    }.get(decision, decision.upper())

    parts.append(
        f"Risk Score: {risk_score}/100 → {decision_label}."
    )

    if top_factors:
        factor_strs = [f"{k.replace('_', ' ')} (+{v})" for k, v in top_factors[:4]]
        parts.append(f"Top risk factors: {', '.join(factor_strs)}.")

    if behavioral_factors.get("trust_penalty", 0) > 5:
        parts.append(
            f"Agent trust is low ({behavioral_factors.get('trust_score', 'N/A')}/100), "
            f"adding +{behavioral_factors['trust_penalty']} behavioral risk."
        )

    if behavioral_factors.get("recent_rejections", 0) > 0:
        parts.append(
            f"Agent has {behavioral_factors['recent_rejections']} recent rejected action(s)."
        )

    if context_factors.get("off_hours"):
        parts.append("Action requested during off-hours, increasing context risk.")

    if risk_score > 80:
        parts.append(
            f"This {action_type} on {resource_type} carries significant risk and "
            "requires authorized review before execution."
        )
    elif risk_score > 50:
        parts.append(
            f"This {action_type} on {resource_type} requires confirmation before proceeding."
        )
    else:
        parts.append(
            f"This {action_type} on {resource_type} is within safe operating parameters."
        )

    return " ".join(parts)
