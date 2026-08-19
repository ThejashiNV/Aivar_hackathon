from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


# --- Agent ---
class AgentOut(BaseModel):
    id: str
    name: str
    description: str
    agent_type: str
    trust_score: float
    total_actions: int
    violations: int
    created_at: datetime

    model_config = {"from_attributes": True}


class AgentProfile(AgentOut):
    recent_actions: list["ActionSummary"] = []
    behavior_logs: list["BehaviorLogOut"] = []
    risk_trend: list[float] = []


# --- Policy ---
class PolicyOut(BaseModel):
    id: str
    name: str
    version: int
    autonomous_threshold: float
    confirm_threshold: float
    risk_weights: dict
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class PolicyUpdate(BaseModel):
    autonomous_threshold: Optional[float] = None
    confirm_threshold: Optional[float] = None
    risk_weights: Optional[dict] = None


# --- Action ---
class ActionEvaluateRequest(BaseModel):
    agent_id: str
    action_type: str = Field(..., description="read, update, delete, create, execute")
    resource_type: str = Field(..., description="customer_record, billing, system_config, etc.")
    description: str = ""
    parameters: dict = Field(default_factory=dict)


class ActionSummary(BaseModel):
    id: str
    agent_id: str
    agent_name: str = ""
    action_type: str
    resource_type: str
    description: str
    status: str
    risk_score: Optional[float] = None
    decision: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class RiskBreakdown(BaseModel):
    reversibility: float = 0
    data_scope: float = 0
    sensitivity: float = 0
    financial_impact: float = 0
    destructive: float = 0
    regulatory: float = 0
    context: float = 0
    behavioral: float = 0


class EvaluationOut(BaseModel):
    id: str
    action_id: str
    policy_id: str
    risk_score: float
    decision: str
    risk_breakdown: dict
    context_factors: dict
    behavioral_factors: dict
    explanation: str
    decided_at: datetime

    model_config = {"from_attributes": True}


class ActionEvaluateResponse(BaseModel):
    action: ActionSummary
    evaluation: EvaluationOut


class ActionDetailOut(BaseModel):
    action: ActionSummary
    evaluation: Optional[EvaluationOut] = None
    review: Optional["ReviewOut"] = None
    audit_events: list["AuditEventOut"] = []
    parameters: dict = {}


# --- Review ---
class ReviewRequest(BaseModel):
    reviewer: str = "admin"
    reason: str = ""


class ReviewOut(BaseModel):
    id: str
    action_id: str
    reviewer: str
    decision: str
    reason: str
    decided_at: datetime

    model_config = {"from_attributes": True}


# --- Audit ---
class AuditEventOut(BaseModel):
    id: str
    action_id: Optional[str]
    agent_id: Optional[str]
    event_type: str
    actor: str
    details: dict
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Behavior ---
class BehaviorLogOut(BaseModel):
    id: str
    agent_id: str
    event_type: str
    severity: float
    details: dict
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Dashboard ---
class DashboardSummary(BaseModel):
    total_actions: int = 0
    autonomous_count: int = 0
    confirm_count: int = 0
    full_review_count: int = 0
    rejected_count: int = 0
    approved_count: int = 0
    pending_reviews: int = 0
    average_risk: float = 0.0
    recent_actions: list[ActionSummary] = []
    agent_stats: list[AgentOut] = []


# --- Demo ---
class DemoRunRequest(BaseModel):
    scenario: str = "all"


class DemoRunResponse(BaseModel):
    demo_session_id: str
    actions: list[ActionEvaluateResponse] = []
    message: str = ""
