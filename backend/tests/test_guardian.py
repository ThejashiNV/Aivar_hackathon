from app.models import Agent


def get_finance_agent_id(client):
    res = client.get("/api/v1/agents")
    agents = res.json()
    return next(a["id"] for a in agents if a["name"] == "FinanceAgent")


def test_health(client):
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["service"] == "Guardian AI"


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


def test_dashboard(client):
    res = client.get("/api/v1/dashboard/summary")
    assert res.status_code == 200
    data = res.json()
    assert "total_actions" in data
    assert "agent_stats" in data


def test_demo_run(client):
    res = client.post("/api/v1/demo/run", json={"scenario": "all"})
    assert res.status_code == 200
    data = res.json()
    assert len(data["actions"]) == 4
    assert data["actions"][0]["evaluation"]["decision"] == "autonomous"
    assert data["actions"][2]["evaluation"]["decision"] == "full_review"
