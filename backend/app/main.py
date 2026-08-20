from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db, SessionLocal
from app.seed import seed_data, seed_realistic_data
from app.api import actions, agents, policies, dashboard, demo


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    db = SessionLocal()
    try:
        seed_data(db)
        seed_realistic_data(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="Guardian AI",
    description="Adaptive Autonomy Control Plane for AI Agents",
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(actions.router)
app.include_router(agents.router)
app.include_router(policies.router)
app.include_router(dashboard.router)
app.include_router(demo.router)


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "service": "Guardian AI",
    }
