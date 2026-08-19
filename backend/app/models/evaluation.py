import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Float, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Evaluation(Base):
    __tablename__ = "evaluations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    action_id: Mapped[str] = mapped_column(String(36), ForeignKey("actions.id"), unique=True, nullable=False)
    policy_id: Mapped[str] = mapped_column(String(36), ForeignKey("policies.id"), nullable=False)
    risk_score: Mapped[float] = mapped_column(Float, nullable=False)
    decision: Mapped[str] = mapped_column(String(30), nullable=False)
    risk_breakdown: Mapped[dict] = mapped_column(JSON, default=dict)
    context_factors: Mapped[dict] = mapped_column(JSON, default=dict)
    behavioral_factors: Mapped[dict] = mapped_column(JSON, default=dict)
    explanation: Mapped[str] = mapped_column(Text, default="")
    decided_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    action = relationship("Action", back_populates="evaluation")
    policy = relationship("Policy")
