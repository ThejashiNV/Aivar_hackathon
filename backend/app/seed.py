import uuid
from datetime import datetime, timezone, timedelta

from sqlalchemy.orm import Session
from app.models import Agent, Policy
from app.models.action import Action
from app.models.evaluation import Evaluation
from app.models.review import Review
from app.models.audit import AuditEvent
from app.models.behavior import AgentBehaviorLog


DEFAULT_RISK_WEIGHTS = {
    "action_weight": 0.45,
    "context_weight": 0.15,
    "behavior_weight": 0.40,
}

DEFAULT_AGENTS = [
    {"name": "FinanceAgent", "description": "Handles financial operations, billing, and payment processing", "agent_type": "finance"},
    {"name": "SupportAgent", "description": "Customer support operations and ticket management", "agent_type": "support"},
    {"name": "DataAgent", "description": "Data analytics, reporting, and bulk data operations", "agent_type": "data"},
]

EXTENDED_AGENTS = [
    {"name": "HRAssistant", "description": "Employee onboarding, payroll updates, and HR compliance workflows", "agent_type": "hr"},
    {"name": "ProcurementBot", "description": "Purchase order creation, vendor management, and procurement approvals", "agent_type": "procurement"},
    {"name": "SalesAssistant", "description": "CRM updates, lead scoring, and sales pipeline automation", "agent_type": "sales"},
    {"name": "CodeReviewAgent", "description": "Automated code review, dependency scanning, and CI/CD pipeline operations", "agent_type": "engineering"},
    {"name": "SecurityMonitor", "description": "Threat detection, access log analysis, and security incident response", "agent_type": "security"},
    {"name": "EmailAutomation", "description": "Automated email campaigns, customer notifications, and newsletter delivery", "agent_type": "communications"},
    {"name": "DocProcessor", "description": "Document classification, OCR processing, and contract analysis", "agent_type": "document"},
    {"name": "MarketingAgent", "description": "Campaign analytics, A/B test management, and social media scheduling", "agent_type": "marketing"},
    {"name": "OpsManager", "description": "Infrastructure monitoring, deployment orchestration, and incident management", "agent_type": "operations"},
]

DEMO_ACTIONS = [
    # FinanceAgent — varied financial operations
    {"agent": "FinanceAgent", "action_type": "read", "resource_type": "financial", "description": "Retrieve Q3 revenue report for board presentation", "parameters": {"record_count": 1}, "hours_ago": 72},
    {"agent": "FinanceAgent", "action_type": "update", "resource_type": "billing", "description": "Adjust enterprise billing tier for Acme Corp annual renewal", "parameters": {"financial_impact": True, "amount": 24000, "contains_pii": True}, "hours_ago": 65},
    {"agent": "FinanceAgent", "action_type": "create", "resource_type": "financial", "description": "Generate invoice #INV-2026-4471 for professional services", "parameters": {"financial_impact": True, "amount": 8500}, "hours_ago": 48},
    {"agent": "FinanceAgent", "action_type": "update", "resource_type": "billing", "description": "Process refund $2,340 for duplicate charge on account #AC-9912", "parameters": {"financial_impact": True, "amount": 2340}, "hours_ago": 36},
    {"agent": "FinanceAgent", "action_type": "delete", "resource_type": "financial", "description": "Remove expired payment methods for 850 dormant accounts", "parameters": {"record_count": 850, "contains_pii": True}, "hours_ago": 24},

    # SupportAgent — customer support operations
    {"agent": "SupportAgent", "action_type": "read", "resource_type": "customer_record", "description": "Look up customer profile for ticket #TK-88210", "parameters": {"record_count": 1}, "hours_ago": 70},
    {"agent": "SupportAgent", "action_type": "update", "resource_type": "customer_record", "description": "Update shipping address for customer after relocation request", "parameters": {"contains_pii": True}, "hours_ago": 60},
    {"agent": "SupportAgent", "action_type": "create", "resource_type": "customer_record", "description": "Create escalation ticket for unresolved billing dispute", "parameters": {"record_count": 1}, "hours_ago": 50},
    {"agent": "SupportAgent", "action_type": "read", "resource_type": "logs", "description": "Pull chat transcript history for quality assurance review", "parameters": {"record_count": 25}, "hours_ago": 30},
    {"agent": "SupportAgent", "action_type": "update", "resource_type": "customer_record", "description": "Merge duplicate customer profiles after identity verification", "parameters": {"record_count": 2, "contains_pii": True}, "hours_ago": 18},

    # DataAgent — analytics operations
    {"agent": "DataAgent", "action_type": "read", "resource_type": "analytics", "description": "Extract daily active user metrics for product dashboard", "parameters": {"record_count": 1}, "hours_ago": 68},
    {"agent": "DataAgent", "action_type": "execute", "resource_type": "analytics", "description": "Run nightly ETL pipeline for customer segmentation model", "parameters": {"record_count": 15000}, "hours_ago": 55},
    {"agent": "DataAgent", "action_type": "delete", "resource_type": "analytics", "description": "Purge stale analytics cache older than 90 days", "parameters": {"record_count": 4200}, "hours_ago": 40},
    {"agent": "DataAgent", "action_type": "create", "resource_type": "analytics", "description": "Generate weekly churn prediction report", "parameters": {"record_count": 1}, "hours_ago": 20},
    {"agent": "DataAgent", "action_type": "read", "resource_type": "user_data", "description": "Query anonymized user behavior data for A/B test analysis", "parameters": {"record_count": 500}, "hours_ago": 8},

    # HRAssistant — HR operations
    {"agent": "HRAssistant", "action_type": "update", "resource_type": "user_data", "description": "Update payroll direct deposit for employee #EMP-3341", "parameters": {"contains_pii": True, "financial_impact": True, "amount": 6800}, "hours_ago": 66},
    {"agent": "HRAssistant", "action_type": "create", "resource_type": "user_data", "description": "Provision new hire onboarding package for engineering team", "parameters": {"record_count": 3, "contains_pii": True}, "hours_ago": 52},
    {"agent": "HRAssistant", "action_type": "read", "resource_type": "user_data", "description": "Generate headcount report for quarterly business review", "parameters": {"record_count": 240}, "hours_ago": 38},
    {"agent": "HRAssistant", "action_type": "delete", "resource_type": "user_data", "description": "Archive terminated employee records per retention policy", "parameters": {"record_count": 12, "contains_pii": True, "gdpr_relevant": True}, "hours_ago": 14},

    # ProcurementBot — purchase operations
    {"agent": "ProcurementBot", "action_type": "create", "resource_type": "financial", "description": "Create purchase order PO-2026-0892 for cloud infrastructure", "parameters": {"financial_impact": True, "amount": 45000}, "hours_ago": 64},
    {"agent": "ProcurementBot", "action_type": "update", "resource_type": "financial", "description": "Amend vendor contract terms for SaaS license renewal", "parameters": {"financial_impact": True, "amount": 12000}, "hours_ago": 44},
    {"agent": "ProcurementBot", "action_type": "read", "resource_type": "financial", "description": "Pull vendor payment history for annual audit", "parameters": {"record_count": 50}, "hours_ago": 28},

    # SalesAssistant — CRM operations
    {"agent": "SalesAssistant", "action_type": "update", "resource_type": "customer_record", "description": "Update opportunity stage to 'Closed Won' for deal #D-5519", "parameters": {"financial_impact": True, "amount": 85000}, "hours_ago": 62},
    {"agent": "SalesAssistant", "action_type": "create", "resource_type": "customer_record", "description": "Register new enterprise lead from trade show contacts", "parameters": {"record_count": 5, "contains_pii": True}, "hours_ago": 46},
    {"agent": "SalesAssistant", "action_type": "read", "resource_type": "analytics", "description": "Generate pipeline forecast report for sales standup", "parameters": {"record_count": 1}, "hours_ago": 22},
    {"agent": "SalesAssistant", "action_type": "update", "resource_type": "customer_record", "description": "Bulk update account ownership after territory realignment", "parameters": {"record_count": 120, "contains_pii": True}, "hours_ago": 6},

    # CodeReviewAgent — engineering operations
    {"agent": "CodeReviewAgent", "action_type": "read", "resource_type": "logs", "description": "Scan dependency tree for known CVE vulnerabilities", "parameters": {"record_count": 340}, "hours_ago": 58},
    {"agent": "CodeReviewAgent", "action_type": "execute", "resource_type": "system_config", "description": "Trigger CI/CD deployment pipeline for staging environment", "parameters": {"environment": "staging"}, "hours_ago": 42},
    {"agent": "CodeReviewAgent", "action_type": "update", "resource_type": "system_config", "description": "Rotate API keys for third-party integration services", "parameters": {"contains_pii": False}, "hours_ago": 16},

    # SecurityMonitor — security operations
    {"agent": "SecurityMonitor", "action_type": "read", "resource_type": "logs", "description": "Analyze failed login attempts across all service accounts", "parameters": {"record_count": 2800}, "hours_ago": 56},
    {"agent": "SecurityMonitor", "action_type": "execute", "resource_type": "system_config", "description": "Revoke compromised API token for external webhook integration", "parameters": {}, "hours_ago": 34},
    {"agent": "SecurityMonitor", "action_type": "update", "resource_type": "system_config", "description": "Update firewall rules to block suspicious IP range 185.x.x.x", "parameters": {}, "hours_ago": 10},
    {"agent": "SecurityMonitor", "action_type": "delete", "resource_type": "user_data", "description": "Purge session tokens for 3 accounts flagged in breach alert", "parameters": {"record_count": 3, "contains_pii": True}, "hours_ago": 4},

    # EmailAutomation — communications
    {"agent": "EmailAutomation", "action_type": "execute", "resource_type": "customer_record", "description": "Send payment reminder emails to 1,200 overdue accounts", "parameters": {"record_count": 1200, "external_communication": True}, "hours_ago": 54},
    {"agent": "EmailAutomation", "action_type": "create", "resource_type": "customer_record", "description": "Draft welcome email sequence for new trial signups", "parameters": {"record_count": 85, "external_communication": True}, "hours_ago": 32},
    {"agent": "EmailAutomation", "action_type": "read", "resource_type": "analytics", "description": "Fetch email open rates and CTR for last campaign", "parameters": {"record_count": 1}, "hours_ago": 12},

    # DocProcessor — document operations
    {"agent": "DocProcessor", "action_type": "read", "resource_type": "customer_record", "description": "Extract key terms from vendor contract PDF for review", "parameters": {"record_count": 1}, "hours_ago": 50},
    {"agent": "DocProcessor", "action_type": "create", "resource_type": "customer_record", "description": "Generate NDA document from template for new partnership", "parameters": {"contains_pii": True}, "hours_ago": 26},
    {"agent": "DocProcessor", "action_type": "update", "resource_type": "customer_record", "description": "Classify and tag 340 unprocessed support documents", "parameters": {"record_count": 340}, "hours_ago": 5},

    # MarketingAgent — marketing operations
    {"agent": "MarketingAgent", "action_type": "read", "resource_type": "analytics", "description": "Pull conversion funnel data for Q3 campaign performance", "parameters": {"record_count": 1}, "hours_ago": 47},
    {"agent": "MarketingAgent", "action_type": "update", "resource_type": "customer_record", "description": "Update audience segments based on new behavioral cohorts", "parameters": {"record_count": 3500, "contains_pii": True}, "hours_ago": 25},
    {"agent": "MarketingAgent", "action_type": "execute", "resource_type": "customer_record", "description": "Launch retargeting campaign for cart abandonment segment", "parameters": {"record_count": 2200, "external_communication": True}, "hours_ago": 3},

    # OpsManager — infrastructure operations
    {"agent": "OpsManager", "action_type": "read", "resource_type": "system_config", "description": "Check health status of all production microservices", "parameters": {"record_count": 1}, "hours_ago": 45},
    {"agent": "OpsManager", "action_type": "execute", "resource_type": "system_config", "description": "Scale up web tier from 4 to 8 instances for traffic spike", "parameters": {"environment": "production"}, "hours_ago": 15},
    {"agent": "OpsManager", "action_type": "update", "resource_type": "system_config", "description": "Update production database connection pool limits", "parameters": {"environment": "production"}, "hours_ago": 7},
    {"agent": "OpsManager", "action_type": "delete", "resource_type": "logs", "description": "Rotate and archive production logs older than 30 days", "parameters": {"record_count": 18000}, "hours_ago": 2},

    # High-risk operations that trigger FULL_REVIEW
    {"agent": "OpsManager", "action_type": "delete", "resource_type": "system_config", "description": "Decommission legacy production cluster and wipe all node data", "parameters": {"record_count": 2400, "environment": "production", "contains_pii": True, "financial_impact": True, "amount": 120000}, "hours_ago": 1},
    {"agent": "SecurityMonitor", "action_type": "delete", "resource_type": "user_data", "description": "Emergency bulk purge of 5,000 compromised user accounts and credentials", "parameters": {"record_count": 5000, "contains_pii": True, "gdpr_relevant": True, "financial_impact": True, "amount": 0}, "hours_ago": 2.5},
    {"agent": "HRAssistant", "action_type": "delete", "resource_type": "user_data", "description": "GDPR right-to-erasure: permanently delete all PII for 800 EU users", "parameters": {"record_count": 800, "contains_pii": True, "gdpr_relevant": True, "financial_impact": True, "amount": 0}, "hours_ago": 9},
    {"agent": "FinanceAgent", "action_type": "delete", "resource_type": "financial", "description": "Write off $250K in uncollectable receivables and archive associated records", "parameters": {"record_count": 1500, "contains_pii": True, "financial_impact": True, "amount": 250000}, "hours_ago": 11},
]

REVIEWERS = ["Sarah Chen", "James Rodriguez", "Priya Patel", "Marcus Thompson", "admin"]

REVIEW_REASONS_APPROVED = [
    "Verified against compliance checklist — approved",
    "Business justification confirmed by department head",
    "Risk assessment reviewed, within acceptable parameters",
    "Standard operating procedure — approved per policy",
    "Manual verification complete, data integrity confirmed",
    "Approved after cross-referencing with audit trail",
]

REVIEW_REASONS_REJECTED = [
    "Exceeds single-transaction authorization limit",
    "Missing required secondary approval for PII access",
    "Scope too broad — reduce batch size and resubmit",
    "Insufficient business justification provided",
    "Flagged by compliance team for regulatory review",
    "Denied — conflicts with data retention policy",
]


def seed_data(db: Session):
    existing_policy = db.query(Policy).filter(Policy.is_active == True).first()
    if not existing_policy:
        policy = Policy(
            name="Default Governance Policy",
            version=1,
            autonomous_threshold=30.0,
            confirm_threshold=60.0,
            risk_weights=DEFAULT_RISK_WEIGHTS,
            is_active=True,
        )
        db.add(policy)

    for agent_data in DEFAULT_AGENTS:
        existing = db.query(Agent).filter(Agent.name == agent_data["name"]).first()
        if not existing:
            db.add(Agent(**agent_data))

    db.commit()


def seed_realistic_data(db: Session):
    """Populate the database with realistic demo data. Idempotent — skips if data already exists."""
    marker = db.query(Agent).filter(Agent.name == "HRAssistant").first()
    if marker:
        return

    policy = db.query(Policy).filter(Policy.is_active == True).first()
    if not policy:
        seed_data(db)
        policy = db.query(Policy).filter(Policy.is_active == True).first()

    policy_id = policy.id
    weights = policy.risk_weights
    w_action = weights.get("action_weight", 0.45)
    w_context = weights.get("context_weight", 0.15)

    from app.services.risk_engine import calculate_action_risk, ACTION_TYPE_RISK, RESOURCE_SENSITIVITY

    for agent_data in EXTENDED_AGENTS:
        existing = db.query(Agent).filter(Agent.name == agent_data["name"]).first()
        if not existing:
            db.add(Agent(**agent_data))
    db.flush()

    agent_map = {a.name: a for a in db.query(Agent).all()}

    now = datetime.now(timezone.utc)

    policy_v0 = Policy(
        name="Default Governance Policy",
        version=0,
        autonomous_threshold=25.0,
        confirm_threshold=55.0,
        risk_weights={"action_weight": 0.50, "context_weight": 0.20, "behavior_weight": 0.30},
        is_active=False,
        created_at=now - timedelta(days=14),
    )
    db.add(policy_v0)

    db.add(AuditEvent(
        event_type="POLICY_UPDATED",
        actor="admin",
        details={"old_version": 0, "new_version": 1, "change": "Adjusted weights to emphasize behavioral risk"},
        created_at=now - timedelta(days=7),
    ))

    import random
    rng = random.Random(42)

    created_actions = []

    for spec in DEMO_ACTIONS:
        agent = agent_map[spec["agent"]]
        ts = now - timedelta(hours=spec["hours_ago"], minutes=rng.randint(0, 59))

        action_score_raw, action_breakdown = calculate_action_risk(
            spec["action_type"], spec["resource_type"], spec["parameters"],
        )

        context_score = 5.0
        context_factors = {"off_hours": False, "environment": "production", "context_score": 5.0}
        if spec["parameters"].get("environment") == "staging":
            context_score = 2.0
            context_factors = {"off_hours": False, "environment": "staging", "context_score": 2.0}
        if spec["parameters"].get("external_communication"):
            context_score += 10
            context_factors["external_communication"] = True
            context_factors["context_score"] = context_score

        trust = agent.trust_score
        behavioral_score = max(0, (50 - trust)) * 1.5
        behavioral_factors = {
            "trust_score": round(trust, 1),
            "trust_penalty": round(behavioral_score, 1),
            "violations": agent.violations,
            "violation_penalty": round(min(agent.violations * 8.0, 30.0), 1),
            "recent_action_count": 0,
            "frequency_penalty": 0.0,
            "recent_rejections": 0,
            "rejection_penalty": 0.0,
        }
        behavioral_score += min(agent.violations * 8.0, 30.0)
        w_behavior = weights.get("behavior_weight", 0.40)

        raw_total = (
            action_score_raw * w_action
            + context_score * w_context
            + behavioral_score * w_behavior
        )
        risk_score = min(max(round(raw_total, 1), 0), 100)

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

        if risk_score <= policy.autonomous_threshold:
            decision = "autonomous"
        elif risk_score <= policy.confirm_threshold:
            decision = "confirm"
        else:
            decision = "full_review"

        decision_label = {"autonomous": "AUTONOMOUS execution", "confirm": "USER CONFIRMATION", "full_review": "FULL HUMAN REVIEW"}.get(decision)
        top_factors = sorted([(k, v) for k, v in risk_breakdown.items() if v > 0], key=lambda x: x[1], reverse=True)
        factor_strs = [f"{k.replace('_', ' ')} (+{v})" for k, v in top_factors[:4]]
        explanation = f"Risk Score: {risk_score}/100 → {decision_label}. Top risk factors: {', '.join(factor_strs)}."

        if decision == "autonomous":
            status = "executed"
        else:
            status = "pending"

        action_id = str(uuid.uuid4())
        action = Action(
            id=action_id,
            agent_id=agent.id,
            action_type=spec["action_type"],
            resource_type=spec["resource_type"],
            description=spec["description"],
            parameters=spec["parameters"],
            status=status,
            created_at=ts,
        )
        db.add(action)

        evaluation = Evaluation(
            action_id=action_id,
            policy_id=policy_id,
            risk_score=risk_score,
            decision=decision,
            risk_breakdown=risk_breakdown,
            context_factors=context_factors,
            behavioral_factors=behavioral_factors,
            explanation=explanation,
            decided_at=ts + timedelta(seconds=1),
        )
        db.add(evaluation)

        db.add(AuditEvent(
            action_id=action_id,
            agent_id=agent.id,
            event_type="ACTION_EVALUATED",
            actor=f"agent:{agent.name}",
            details={"risk_score": risk_score, "decision": decision},
            created_at=ts + timedelta(seconds=1),
        ))

        if decision == "autonomous":
            trust_delta = 0.5
            agent.trust_score = min(100.0, agent.trust_score + trust_delta)
            agent.total_actions += 1
            db.add(AgentBehaviorLog(
                agent_id=agent.id,
                event_type="action_autonomous",
                severity=0.0,
                details={"trust_delta": trust_delta, "new_trust": round(agent.trust_score, 1)},
                created_at=ts + timedelta(seconds=2),
            ))

        elif decision in ("confirm", "full_review"):
            coin = rng.random()
            if coin < 0.30:
                # Leave pending (for review queue)
                pass
            elif coin < 0.75:
                # Approve
                reviewer = rng.choice(REVIEWERS)
                reason = rng.choice(REVIEW_REASONS_APPROVED)
                review_ts = ts + timedelta(minutes=rng.randint(5, 120))
                action.status = "approved"
                db.add(Review(
                    action_id=action_id,
                    reviewer=reviewer,
                    decision="approved",
                    reason=reason,
                    decided_at=review_ts,
                ))
                db.add(AuditEvent(
                    action_id=action_id,
                    agent_id=agent.id,
                    event_type="ACTION_APPROVED",
                    actor=f"reviewer:{reviewer}",
                    details={"reason": reason},
                    created_at=review_ts,
                ))
                trust_delta = 1.5
                agent.trust_score = min(100.0, agent.trust_score + trust_delta)
                agent.total_actions += 1
                db.add(AgentBehaviorLog(
                    agent_id=agent.id,
                    event_type="action_approved",
                    severity=0.0,
                    details={"trust_delta": trust_delta, "new_trust": round(agent.trust_score, 1)},
                    created_at=review_ts + timedelta(seconds=1),
                ))
            else:
                # Reject
                reviewer = rng.choice(REVIEWERS)
                reason = rng.choice(REVIEW_REASONS_REJECTED)
                review_ts = ts + timedelta(minutes=rng.randint(10, 90))
                action.status = "rejected"
                db.add(Review(
                    action_id=action_id,
                    reviewer=reviewer,
                    decision="rejected",
                    reason=reason,
                    decided_at=review_ts,
                ))
                db.add(AuditEvent(
                    action_id=action_id,
                    agent_id=agent.id,
                    event_type="ACTION_REJECTED",
                    actor=f"reviewer:{reviewer}",
                    details={"reason": reason},
                    created_at=review_ts,
                ))
                trust_delta = -12.0
                agent.trust_score = max(0.0, agent.trust_score + trust_delta)
                agent.violations += 1
                agent.total_actions += 1
                db.add(AgentBehaviorLog(
                    agent_id=agent.id,
                    event_type="action_rejected",
                    severity=0.5,
                    details={"trust_delta": trust_delta, "new_trust": round(agent.trust_score, 1)},
                    created_at=review_ts + timedelta(seconds=1),
                ))

        created_actions.append((action, decision))

    db.add(AuditEvent(
        event_type="SYSTEM_START",
        actor="system",
        details={"message": "Guardian AI control plane initialized"},
        created_at=now - timedelta(days=10),
    ))
    db.add(AuditEvent(
        event_type="AGENT_REGISTERED",
        actor="system",
        details={"agents_added": [a["name"] for a in EXTENDED_AGENTS]},
        created_at=now - timedelta(days=9),
    ))
    db.add(AuditEvent(
        event_type="SYSTEM_HEALTH_CHECK",
        actor="system",
        details={"status": "healthy", "db_latency_ms": 2.1, "uptime_hours": 168},
        created_at=now - timedelta(days=2),
    ))

    db.commit()
