from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Policy
from app.schemas.schemas import PolicyOut, PolicyUpdate
from app.services.audit_service import create_audit_event

router = APIRouter(prefix="/api/v1/policies", tags=["policies"])


@router.get("/active", response_model=PolicyOut)
def get_active_policy(db: Session = Depends(get_db)):
    policy = db.query(Policy).filter(Policy.is_active == True).order_by(Policy.version.desc()).first()
    if not policy:
        raise HTTPException(404, "No active policy found")
    return PolicyOut.model_validate(policy)


@router.put("/active", response_model=PolicyOut)
def update_policy(req: PolicyUpdate, db: Session = Depends(get_db)):
    current = db.query(Policy).filter(Policy.is_active == True).order_by(Policy.version.desc()).first()
    if not current:
        raise HTTPException(404, "No active policy found")

    current.is_active = False
    db.flush()

    new_policy = Policy(
        name=current.name,
        version=current.version + 1,
        autonomous_threshold=req.autonomous_threshold if req.autonomous_threshold is not None else current.autonomous_threshold,
        confirm_threshold=req.confirm_threshold if req.confirm_threshold is not None else current.confirm_threshold,
        risk_weights=req.risk_weights if req.risk_weights is not None else current.risk_weights,
        is_active=True,
    )
    db.add(new_policy)
    db.flush()

    create_audit_event(
        db, "POLICY_CHANGED",
        actor="system",
        details={
            "old_version": current.version,
            "new_version": new_policy.version,
            "changes": req.model_dump(exclude_none=True),
        },
    )
    db.commit()
    db.refresh(new_policy)
    return PolicyOut.model_validate(new_policy)
