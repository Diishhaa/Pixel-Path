"""
main.py — FastAPI application with all routers registered.
Run with: uvicorn main:app --reload
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine
from models import Base
from routers import auth, courses, quiz, users

# Create all DB tables on startup (safe / idempotent)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SkillTree API",
    description="Gamified adaptive Python learning platform",
    version="0.2.0",
)

# ── CORS — allow the Vite dev server ──────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(courses.router)
app.include_router(quiz.router)


# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def root():
    return {"message": "SkillTree API is running 🎮", "version": "0.2.0"}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}
