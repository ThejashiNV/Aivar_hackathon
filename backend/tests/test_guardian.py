from app.models import Agent


def get_finance_agent_id(client):
    res = client.get("/api/v1/agents")
    agents = res.json()
    return next(a["id"] for a in agents if a["name"] == "FinanceAgent")


def get_agent_id_by_name(client, name):
    res = client.get("/api/v1/agents")
    agents = res.json()
    return next(a["id"] for a in agents if a["name"] == name)


# --- Health ---

def test_health(client):
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["service"] == "Guardian AI"


# --- Risk Routing ---

def test_low_risk_autonomous(client):
    agent_id = get_finance_agent_id(client)
    res = client.post("/api/v1/actions/evaluate", json={
        "agent_id": agent_id,
        "action_type": "read",
        "resource_type": "customer_record",
        "description": "Read one customer",
        "parameters": {"record_count": 1},
    })
    assert res.status_code == 200
    data = res.json()
    assert data["evaluation"]["decision"] == "autonomous"
    assert data["evaluation"]["risk_score"] < 30
    assert data["action"]["status"] == "executed"


def test_medium_risk_confirmation(client):
    agent_id = get_finance_agent_id(client)
    res = client.post("/api/v1/actions/evaluate", json={
        "agent_id": agent_id,
        "action_type": "update",
        "resource_type": "billing",
        "description": "Update billing",
        "parameters": {"record_count": 1, "financial_impact": True, "amount": 500, "contains_pii": True},
    })
    assert res.status_code == 200
    data = res.json()
    assert data["evaluation"]["decision"] == "confirm"
    assert 30 < data["evaluation"]["risk_score"] <= 60
    assert data["action"]["status"] == "pending"


def test_high_risk_review(client):
    agent_id = get_finance_agent_id(client)
    res = client.post("/api/v1/actions/evaluate", json={
        "agent_id": agent_id,
        "action_type": "delete",
        "resource_type": "customer_record",
        "description": "Bulk delete",
        "parameters": {"record_count": 4500, "contains_pii": True, "gdpr_relevant": True},
    })
    assert res.status_code == 200
    data = res.json()
    assert data["evaluation"]["decision"] == "full_review"
    assert data["evaluation"]["risk_score"] > 60
    assert data["action"]["status"] == "pending"


# --- Approval / Rejection ---

def test_review_approval(client):
    agent_id = get_finance_agent_id(client)
    eval_res = client.post("/api/v1/actions/evaluate", json={
        "agent_id": agent_id,
        "action_type": "update",
        "resource_type": "billing",
        "description": "Update billing",
        "parameters": {"record_count": 1, "financial_impact": True, "amount": 500, "contains_pii": True},
    })
    action_id = eval_res.json()["action"]["id"]

    approve_res = client.post(f"/api/v1/actions/{action_id}/approve", json={
        "reviewer": "admin",
        "reason": "Verified",
    })
    assert approve_res.status_code == 200
    assert approve_res.json()["decision"] == "approved"


def test_review_rejection(client):
    agent_id = get_finance_agent_id(client)
    eval_res = client.post("/api/v1/actions/evaluate", json={
        "agent_id": agent_id,
        "action_type": "delete",
        "resource_type": "customer_record",
        "description": "Bulk delete",
        "parameters": {"record_count": 4500, "contains_pii": True, "gdpr_relevant": True},
    })
    action_id = eval_res.json()["action"]["id"]

    reject_res = client.post(f"/api/v1/actions/{action_id}/reject", json={
        "reviewer": "admin",
        "reason": "Not authorized",
    })
    assert reject_res.status_code == 200
    assert reject_res.json()["decision"] == "rejected"


def test_cannot_execute_pending_review(client):
    agent_id = get_finance_agent_id(client)
    eval_res = client.post("/api/v1/actions/evaluate", json={
        "agent_id": agent_id,
        "action_type": "delete",
        "resource_type": "customer_record",
        "description": "Bulk delete",
        "parameters": {"record_count": 4500, "contains_pii": True, "gdpr_relevant": True},
    })
    action_id = eval_res.json()["action"]["id"]

    exec_res = client.post(f"/api/v1/actions/{action_id}/execute")
    assert exec_res.status_code == 403


# --- Execute Success ---

def test_execute_after_approval(client):
    agent_id = get_finance_agent_id(client)
    eval_res = client.post("/api/v1/actions/evaluate", json={
        "agent_id": agent_id,
        "action_type": "update",
        "resource_type": "billing",
        "description": "Update billing",
        "parameters": {"record_count": 1, "financial_impact": True, "amount": 500, "contains_pii": True},
    })
    action_id = eval_res.json()["action"]["id"]

    client.post(f"/api/v1/actions/{action_id}/approve", json={"reviewer": "admin", "reason": "ok"})
    exec_res = client.post(f"/api/v1/actions/{action_id}/execute")
    assert exec_res.status_code == 200
    assert exec_res.json()["status"] == "executed"


def test_cannot_execute_rejected(client):
    agent_id = get_finance_agent_id(client)
    eval_res = client.post("/api/v1/actions/evaluate", json={
        "agent_id": agent_id,
        "action_type": "delete",
        "resource_type": "customer_record",
        "description": "Bulk delete",
        "parameters": {"record_count": 4500, "contains_pii": True, "gdpr_relevant": True},
    })
    action_id = eval_res.json()["action"]["id"]
    client.post(f"/api/v1/actions/{action_id}/reject", json={"reviewer": "admin", "reason": "no"})

    exec_res = client.post(f"/api/v1/actions/{action_id}/execute")
    assert exec_res.status_code == 403


def test_cannot_double_approve(client):
    agent_id = get_finance_agent_id(client)
    eval_res = client.post("/api/v1/actions/evaluate", json={
        "agent_id": agent_id,
        "action_type": "update",
        "resource_type": "billing",
        "description": "Update billing",
        "parameters": {"record_count": 1, "financial_impact": True, "amount": 500, "contains_pii": True},
    })
    action_id = eval_res.json()["action"]["id"]

    first = client.post(f"/api/v1/actions/{action_id}/approve", json={"reviewer": "admin", "reason": "ok"})
    assert first.status_code == 200

    second = client.post(f"/api/v1/actions/{action_id}/approve", json={"reviewer": "admin", "reason": "again"})
    assert second.status_code == 400


# --- Behavioral ---

def test_behavioral_escalation(client):
    agent_id = get_finance_agent_id(client)

    first = client.post("/api/v1/actions/evaluate", json={
        "agent_id": agent_id,
        "action_type": "update",
        "resource_type": "billing",
        "description": "Billing update",
        "parameters": {"record_count": 1, "financial_impact": True, "amount": 500, "contains_pii": True},
    })
    first_score = first.json()["evaluation"]["risk_score"]

    delete_res = client.post("/api/v1/actions/evaluate", json={
        "agent_id": agent_id,
        "action_type": "delete",
        "resource_type": "customer_record",
        "description": "Bulk delete",
        "parameters": {"record_count": 4500, "contains_pii": True, "gdpr_relevant": True},
    })
    delete_id = delete_res.json()["action"]["id"]
    client.post(f"/api/v1/actions/{delete_id}/reject", json={"reviewer": "admin", "reason": "Denied"})

    second = client.post("/api/v1/actions/evaluate", json={
        "agent_id": agent_id,
        "action_type": "update",
        "resource_type": "billing",
        "description": "Same billing update",
        "parameters": {"record_count": 1, "financial_impact": True, "amount": 500, "contains_pii": True},
    })
    second_score = second.json()["evaluation"]["risk_score"]

    assert second_score > first_score, f"Expected escalation: {second_score} > {first_score}"


# --- Audit ---

def test_audit_creation(client):
    agent_id = get_finance_agent_id(client)
    eval_res = client.post("/api/v1/actions/evaluate", json={
        "agent_id": agent_id,
        "action_type": "read",
        "resource_type": "customer_record",
        "description": "Read",
        "parameters": {"record_count": 1},
    })
    action_id = eval_res.json()["action"]["id"]

    detail = client.get(f"/api/v1/actions/{action_id}")
    assert detail.status_code == 200
    events = detail.json()["audit_events"]
    assert len(events) > 0
    assert any(e["event_type"] == "ACTION_EVALUATED" for e in events)


# --- Policy ---

def test_policy_versioning(client):
    policy = client.get("/api/v1/policies/active")
    assert policy.status_code == 200
    v1 = policy.json()["version"]

    updated = client.put("/api/v1/policies/active", json={
        "autonomous_threshold": 25.0,
    })
    assert updated.status_code == 200
    assert updated.json()["version"] == v1 + 1
    assert updated.json()["autonomous_threshold"] == 25.0


def test_policy_update_weights(client):
    updated = client.put("/api/v1/policies/active", json={
        "risk_weights": {"action_weight": 0.50, "context_weight": 0.20, "behavior_weight": 0.30},
    })
    assert updated.status_code == 200
    weights = updated.json()["risk_weights"]
    assert weights["action_weight"] == 0.50
    assert weights["context_weight"] == 0.20


# --- Dashboard ---

def test_dashboard(client):
    res = client.get("/api/v1/dashboard/summary")
    assert res.status_code == 200
    data = res.json()
    assert "total_actions" in data
    assert "agent_stats" in data


# --- Demo ---

def test_demo_run(client):
    res = client.post("/api/v1/demo/run", json={"scenario": "all"})
    assert res.status_code == 200
    data = res.json()
    assert len(data["actions"]) == 4
    assert data["actions"][0]["evaluation"]["decision"] == "autonomous"
    assert data["actions"][2]["evaluation"]["decision"] == "full_review"


def test_demo_idempotent(client):
    first = client.post("/api/v1/demo/run", json={"scenario": "all"})
    assert first.status_code == 200
    second = client.post("/api/v1/demo/run", json={"scenario": "all"})
    assert second.status_code == 200
    assert len(second.json()["actions"]) == 4
    scores_1 = [a["evaluation"]["risk_score"] for a in first.json()["actions"]]
    scores_2 = [a["evaluation"]["risk_score"] for a in second.json()["actions"]]
    for s1, s2 in zip(scores_1, scores_2):
        assert abs(s1 - s2) < 5, f"Demo not idempotent: {s1} vs {s2}"


# --- Agent Endpoints ---

def test_list_agents(client):
    res = client.get("/api/v1/agents")
    assert res.status_code == 200
    agents = res.json()
    assert len(agents) == 3
    names = [a["name"] for a in agents]
    assert "FinanceAgent" in names
    assert "SupportAgent" in names
    assert "DataAgent" in names


def test_agent_profile(client):
    agent_id = get_finance_agent_id(client)
    res = client.get(f"/api/v1/agents/{agent_id}/profile")
    assert res.status_code == 200
    data = res.json()
    assert data["name"] == "FinanceAgent"
    assert "recent_actions" in data
    assert "behavior_logs" in data
    assert "risk_trend" in data


def test_agent_profile_not_found(client):
    res = client.get("/api/v1/agents/nonexistent-id/profile")
    assert res.status_code == 404


# --- Action Listing with Filters ---

def test_action_list_filter_by_status(client):
    agent_id = get_finance_agent_id(client)
    client.post("/api/v1/actions/evaluate", json={
        "agent_id": agent_id,
        "action_type": "read",
        "resource_type": "customer_record",
        "description": "Read",
        "parameters": {"record_count": 1},
    })
    res = client.get("/api/v1/actions?status=executed")
    assert res.status_code == 200
    for a in res.json():
        assert a["status"] == "executed"


def test_action_list_filter_by_decision(client):
    agent_id = get_finance_agent_id(client)
    client.post("/api/v1/actions/evaluate", json={
        "agent_id": agent_id,
        "action_type": "read",
        "resource_type": "customer_record",
        "description": "Read",
        "parameters": {"record_count": 1},
    })
    res = client.get("/api/v1/actions?decision=autonomous")
    assert res.status_code == 200
    for a in res.json():
        assert a["decision"] == "autonomous"


# --- Edge Cases ---

def test_evaluate_nonexistent_agent(client):
    res = client.post("/api/v1/actions/evaluate", json={
        "agent_id": "nonexistent-id",
        "action_type": "read",
        "resource_type": "logs",
        "description": "test",
        "parameters": {},
    })
    assert res.status_code == 404


def test_approve_nonexistent_action(client):
    res = client.post("/api/v1/actions/nonexistent/approve", json={"reviewer": "admin", "reason": "test"})
    assert res.status_code == 404


def test_reject_nonexistent_action(client):
    res = client.post("/api/v1/actions/nonexistent/reject", json={"reviewer": "admin", "reason": "test"})
    assert res.status_code == 404


def test_execute_nonexistent_action(client):
    res = client.post("/api/v1/actions/nonexistent/execute")
    assert res.status_code == 404


def test_action_detail_not_found(client):
    res = client.get("/api/v1/actions/nonexistent")
    assert res.status_code == 404


# --- Unknown action/resource types get default risk ---

def test_unknown_action_type_defaults(client):
    agent_id = get_finance_agent_id(client)
    res = client.post("/api/v1/actions/evaluate", json={
        "agent_id": agent_id,
        "action_type": "custom_action",
        "resource_type": "logs",
        "description": "Unknown action type",
        "parameters": {"record_count": 1},
    })
    assert res.status_code == 200
    assert res.json()["evaluation"]["risk_score"] >= 0


# --- AI Enhancer Graceful Degradation ---

def test_explanation_exists(client):
    agent_id = get_finance_agent_id(client)
    res = client.post("/api/v1/actions/evaluate", json={
        "agent_id": agent_id,
        "action_type": "update",
        "resource_type": "billing",
        "description": "Update billing",
        "parameters": {"record_count": 1, "financial_impact": True, "amount": 500},
    })
    assert res.status_code == 200
    explanation = res.json()["evaluation"]["explanation"]
    assert len(explanation) > 20
    assert "Risk Score" in explanation
