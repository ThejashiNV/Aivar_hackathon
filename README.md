# Guardian AI

**Adaptive Autonomy Control Plane for AI Agents**

> Aivar Innovations Agentic AI Hackathon 2026 | PS-9.1: Graduated Autonomy Engine

Guardian AI is a runtime governance system that dynamically evaluates every AI agent action and determines the appropriate autonomy level: **Autonomous**, **Confirm**, or **Full Human Review**.

Unlike static rule engines, Guardian AI uses **Contextual Adaptive Autonomy** — the same action can receive different risk scores depending on context and behavioral history.

## Core Architecture

```
AI Agent → Guardian Gateway → Risk Analysis → Decision → Execute/Review → Audit
```

### Risk Model (3 Dimensions)

| Dimension | Weight | Factors |
|-----------|--------|---------|
| **Action Risk** | 0.45 | Reversibility, data scope, sensitivity, financial impact, destructive potential, regulatory |
| **Context Risk** | 0.15 | Environment (production/staging), time of day, external communication |
| **Behavioral Risk** | 0.40 | Trust score, violations, rejection history, action frequency |

**Final Risk Score** (0-100) = action_risk * 0.45 + context_risk * 0.15 + behavioral_risk * 0.40

Routed by configurable policy thresholds:
- **0-30**: AUTONOMOUS (auto-execute)
- **31-60**: CONFIRM (user approval needed)
- **61-100**: FULL REVIEW (authorized reviewer required)

### Key Differentiator: Behavioral Escalation

The same billing update by the same agent:
- **Before violations**: Risk 31.8 → CONFIRM
- **After rejection + trust decay**: Risk 62.8 → FULL REVIEW

The risk scoring is **deterministic** — no LLM decides the risk level. Gemini AI optionally enhances explanations but never overrides the safety-critical risk calculation.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, Recharts |
| Backend | Python 3.11, FastAPI, Pydantic v2, SQLAlchemy 2.0 |
| Database | SQLite (local dev) / PostgreSQL via psycopg3 (production) |
| AI Enhancement | Google Gemini API (optional, graceful degradation) |
| Deployment | Render (frontend + backend), Supabase (PostgreSQL) |

## Quick Start

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
PYTHONPATH=. uvicorn app.main:app --reload --port 8000
```

No database configuration needed for local dev — defaults to SQLite.

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

29 tests covering risk routing, approval/rejection flows, behavioral escalation, demo idempotency, edge cases, and policy versioning.

## Environment Variables

### Backend

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | SQLite connection string (local dev) | No (defaults to `sqlite:///./guardian.db`) |
| `DB_HOST` | PostgreSQL host | Production only |
| `DB_PORT` | PostgreSQL port | No (defaults to 5432) |
| `DB_USER` | PostgreSQL user | Production only |
| `DB_PASSWORD` | PostgreSQL password | Production only |
| `DB_NAME` | PostgreSQL database name | No (defaults to `postgres`) |
| `GEMINI_API_KEY` | Google Gemini API key | No (app works without it) |
| `CORS_ORIGINS` | Allowed frontend origins (comma-separated) | No (defaults to localhost) |

When `DB_HOST` is set, the app uses `sqlalchemy.engine.URL.create()` to safely construct the PostgreSQL connection URL, handling passwords with special characters.

### Frontend

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_URL` | Backend API URL | Production only (dev uses Vite proxy) |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/v1/actions/evaluate` | Evaluate an agent action |
| POST | `/api/v1/actions/{id}/approve` | Approve a pending action |
| POST | `/api/v1/actions/{id}/reject` | Reject a pending action |
| POST | `/api/v1/actions/{id}/execute` | Execute an approved action |
| GET | `/api/v1/actions` | List actions (filterable by status, decision) |
| GET | `/api/v1/actions/{id}` | Action detail with audit trail |
| GET | `/api/v1/agents` | List all agents |
| GET | `/api/v1/agents/{id}/profile` | Agent risk profile with behavior logs |
| GET | `/api/v1/policies/active` | Current governance policy |
| PUT | `/api/v1/policies/active` | Update policy (creates new version) |
| GET | `/api/v1/dashboard/summary` | Dashboard metrics |
| POST | `/api/v1/demo/run` | Run live demo scenario |

## Frontend Pages

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/` | Real-time governance overview with stats, charts, trust scores |
| Action Feed | `/actions` | Filterable list of all evaluated actions |
| Action Detail | `/actions/:id` | Risk breakdown chart, context/behavioral factors, audit trail |
| Review Queue | `/reviews` | Pending actions requiring human review with approve/reject |
| Agents | `/agents` | Agent profiles with trust scores |
| Agent Detail | `/agents/:id` | Risk trend chart, behavior timeline, action history |
| Policy Settings | `/policy` | Configurable thresholds and risk weight sliders |
| Demo | `/demo` | Interactive 4-step demo with behavioral escalation |

## Demo

Click **Run Live Demo** in the UI to watch Guardian evaluate 4 actions in sequence:

1. **Low Risk Read** — Score ~9 → AUTONOMOUS → Auto-executed
2. **Medium Risk Update** — Score ~32 → CONFIRM → Approved
3. **High Risk Delete** — Score ~62 → FULL REVIEW → Rejected
4. **Behavioral Escalation** — Same update, Score ~63 → FULL REVIEW (escalated due to degraded trust from step 3 rejection)

## AI Enhancement (Optional)

When a `GEMINI_API_KEY` is configured, Guardian AI uses Gemini 1.5 Flash to generate enhanced explanations for risk evaluations. The AI provides additional context about risk factors and recommendations while the core risk scoring remains fully deterministic.

Without the API key, the system works identically — it just uses the built-in deterministic explanations.

## Project Structure

```
guardian-ai/
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI application + lifespan
│   │   ├── config.py               # Settings (env vars)
│   │   ├── database.py             # SQLAlchemy setup (SQLite/PostgreSQL)
│   │   ├── seed.py                 # Agent seed data
│   │   ├── models/
│   │   │   └── models.py           # Action, Agent, Evaluation, Review, AuditEvent, etc.
│   │   ├── schemas/
│   │   │   └── schemas.py          # Pydantic request/response schemas
│   │   ├── api/
│   │   │   ├── actions.py          # Evaluate, approve, reject, execute endpoints
│   │   │   ├── agents.py           # Agent listing and profiles
│   │   │   ├── dashboard.py        # Dashboard summary metrics
│   │   │   ├── demo.py             # Demo scenario runner
│   │   │   └── policies.py         # Policy CRUD with versioning
│   │   └── services/
│   │       ├── risk_engine.py      # Action + context risk scoring
│   │       ├── behavior_engine.py  # Behavioral risk + trust management
│   │       ├── decision_engine.py  # Policy routing + explanation generation
│   │       ├── audit_service.py    # Audit event logging
│   │       └── ai_enhancer.py      # Gemini AI explanation enhancement
│   ├── tests/
│   │   ├── conftest.py             # Test fixtures (in-memory SQLite)
│   │   └── test_guardian.py        # 29 tests
│   ├── requirements.txt
│   ├── runtime.txt                 # Python 3.11.9 for Render
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api.ts                  # API client with type definitions
│   │   ├── App.tsx                 # Router setup
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── ActionFeed.tsx
│   │   │   ├── ActionDetail.tsx
│   │   │   ├── ReviewQueue.tsx
│   │   │   ├── Agents.tsx
│   │   │   ├── AgentDetail.tsx
│   │   │   ├── PolicySettings.tsx
│   │   │   ├── Demo.tsx
│   │   │   └── NotFound.tsx
│   │   └── components/
│   │       ├── Layout.tsx          # Responsive sidebar with mobile hamburger
│   │       ├── RiskBadge.tsx
│   │       └── StatusBadge.tsx
│   ├── .env.example
│   └── vite.config.ts             # Dev proxy to backend
├── render.yaml                     # Render deployment blueprint
├── .gitignore
└── README.md
```

## Deployment

The project includes a `render.yaml` blueprint for Render deployment:
- **Backend**: Python web service with Gunicorn
- **Frontend**: Static site built with Vite

Set `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, and `DB_PORT` as environment variables for PostgreSQL. Optionally set `GEMINI_API_KEY` for AI-enhanced explanations.

## License

Built for the Aivar Innovations Agentic AI Hackathon 2026.
