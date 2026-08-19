# Guardian AI

**Adaptive Autonomy Control Plane for AI Agents**

Guardian AI is a runtime governance system that dynamically evaluates every AI agent action and determines the appropriate autonomy level: **Autonomous**, **Confirm**, or **Full Human Review**.

Unlike static rule engines, Guardian AI uses **Contextual Adaptive Autonomy** — the same action can receive different risk scores depending on context and behavioral history.

## Core Architecture

```
AI Agent → Guardian Gateway → Risk Analysis → Decision → Execute/Review → Audit
```

### Risk Model (3 Dimensions)

| Dimension | Factors |
|-----------|---------|
| **Action Risk** | Reversibility, data scope, sensitivity, financial impact, regulatory |
| **Context Risk** | Environment, time of day, external communication |
| **Behavioral Risk** | Trust score, violations, rejection history, action frequency |

**Final Risk Score** (0-100) → routed by configurable policy thresholds:
- 0–30: AUTONOMOUS (auto-execute)
- 31–60: CONFIRM (user approval)
- 61–100: FULL REVIEW (authorized reviewer)

### Key Differentiator

The same billing update by the same agent:
- **Before violations**: Risk 31.8 → CONFIRM
- **After behavioral degradation**: Risk 62.8 → FULL REVIEW

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, TypeScript, Vite, Tailwind CSS, Recharts |
| Backend | Python, FastAPI, Pydantic v2, SQLAlchemy 2.0 |
| Database | PostgreSQL (Supabase) / SQLite (dev) |
| LLM | Gemini API (optional, for explanations) |
| Deployment | Render (frontend + backend), Supabase |

## Quick Start

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # Edit with your database URL
PYTHONPATH=. uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Visit http://localhost:5173

### Run Tests

```bash
cd backend
PYTHONPATH=. pytest tests/ -v
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes (production) |
| `GEMINI_API_KEY` | Google Gemini API key | No (fallback works) |
| `CORS_ORIGINS` | Allowed frontend origins | Yes |
| `VITE_API_URL` | Backend API URL (frontend) | Yes (production) |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/v1/actions/evaluate` | Evaluate an agent action |
| POST | `/api/v1/actions/{id}/approve` | Approve a pending action |
| POST | `/api/v1/actions/{id}/reject` | Reject a pending action |
| POST | `/api/v1/actions/{id}/execute` | Execute an approved action |
| GET | `/api/v1/actions` | List all actions |
| GET | `/api/v1/actions/{id}` | Action detail with audit trail |
| GET | `/api/v1/agents` | List all agents |
| GET | `/api/v1/agents/{id}/profile` | Agent risk profile |
| GET | `/api/v1/policies/active` | Current governance policy |
| PUT | `/api/v1/policies/active` | Update policy (creates new version) |
| GET | `/api/v1/dashboard/summary` | Dashboard metrics |
| POST | `/api/v1/demo/run` | Run live demo scenario |

## Demo

Click **Run Live Demo** in the UI to watch Guardian evaluate 4 actions in sequence:

1. **Low Risk Read** → Score ~9 → AUTONOMOUS → Auto-executed
2. **Medium Risk Update** → Score ~32 → CONFIRM → Approved
3. **High Risk Delete** → Score ~62 → FULL REVIEW → Rejected
4. **Behavioral Escalation** → Same update, Score ~63 → FULL REVIEW (escalated due to degraded trust)

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application
│   │   ├── config.py            # Settings
│   │   ├── database.py          # SQLAlchemy setup
│   │   ├── seed.py              # Seed data
│   │   ├── models/              # SQLAlchemy models
│   │   ├── schemas/             # Pydantic schemas
│   │   ├── api/                 # API routes
│   │   └── services/
│   │       ├── risk_engine.py   # Action/context risk scoring
│   │       ├── behavior_engine.py # Behavioral risk + trust
│   │       ├── decision_engine.py # Policy routing + explanation
│   │       └── audit_service.py # Audit event logging
│   └── tests/
├── frontend/
│   └── src/
│       ├── api.ts               # API client
│       ├── pages/               # Dashboard, ActionFeed, ReviewQueue, etc.
│       └── components/          # RiskBadge, StatusBadge, Layout
└── docs/
```

## License

Built for the Aivar Innovations Agentic AI Hackathon 2026.
