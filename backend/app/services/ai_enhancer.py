import logging
from app.config import settings

logger = logging.getLogger(__name__)

_model = None


def _get_model():
    global _model
    if _model is not None:
        return _model
    if not settings.GEMINI_API_KEY:
        return None
    try:
        import google.generativeai as genai
        genai.configure(api_key=settings.GEMINI_API_KEY)
        _model = genai.GenerativeModel("gemini-1.5-flash")
        return _model
    except Exception as e:
        logger.warning("Failed to initialize Gemini: %s", e)
        return None


def enhance_explanation(
    deterministic_explanation: str,
    risk_score: float,
    decision: str,
    action_type: str,
    resource_type: str,
    risk_breakdown: dict,
    behavioral_factors: dict,
) -> str:
    model = _get_model()
    if model is None:
        return deterministic_explanation

    prompt = (
        "You are Guardian AI, an autonomous governance system. "
        "Given the following risk evaluation, write a concise 2-3 sentence insight "
        "explaining why this action was classified this way and what the agent should "
        "be aware of. Be specific about the risk factors. Do not repeat the score number.\n\n"
        f"Action: {action_type} on {resource_type}\n"
        f"Risk Score: {risk_score}/100\n"
        f"Decision: {decision}\n"
        f"Top Risk Factors: {risk_breakdown}\n"
        f"Behavioral Factors: {behavioral_factors}\n"
        f"Base Explanation: {deterministic_explanation}\n\n"
        "AI Insight (2-3 sentences, professional tone):"
    )

    try:
        response = model.generate_content(prompt)
        ai_text = response.text.strip()
        if ai_text:
            return f"{deterministic_explanation}\n\nAI Insight: {ai_text}"
    except Exception as e:
        logger.warning("Gemini enhancement failed: %s", e)

    return deterministic_explanation
