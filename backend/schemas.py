"""
schemas.py — Pydantic request/response models for all API routes.
These define the shape of JSON in and out of every endpoint.
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# ---------------------------------------------------------------------------
# AUTH
# ---------------------------------------------------------------------------
class RegisterRequest(BaseModel):
    username: str
    email: Optional[str] = None
    password: str
    avatar: Optional[str] = "warrior"


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ---------------------------------------------------------------------------
# USER / PLAYER PROFILE
# ---------------------------------------------------------------------------
class UserProfile(BaseModel):
    id: int
    username: str
    email: str
    xp: int
    level: int
    level_title: str
    streak: int
    avatar: str
    created_at: datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# COURSES & NODES
# ---------------------------------------------------------------------------
class CourseOut(BaseModel):
    id: int
    title: str
    description: str
    created_at: datetime

    class Config:
        from_attributes = True


class NodeOut(BaseModel):
    id: int
    course_id: int
    title: str
    youtube_url: str
    node_type: str          # essential | remedial | fast_track
    summary: str
    order_index: int
    is_completed: bool = False   # injected per-user by the route
    is_locked: bool = True       # injected per-user by the route

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# QUESTIONS
# ---------------------------------------------------------------------------
class QuestionOut(BaseModel):
    id: int
    level: int              # 1=MCQ, 2=FIB, 3=Code
    q_type: str             # mcq | fib | code
    question_text: str
    options: list[str]      # empty list for FIB/code
    xp_reward: int
    # NOTE: correct_answer is NOT included — never expose it to the frontend

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# QUIZ SUBMISSION
# ---------------------------------------------------------------------------
class AnswerItem(BaseModel):
    question_id: int
    answer: str             # the user's submitted answer text


class QuizSubmitRequest(BaseModel):
    node_id: int
    answers: list[AnswerItem]


class QuizResult(BaseModel):
    score_percent: float          # 0–100
    xp_earned: int
    result: str                   # "fail" | "pass" | "ace"
    correct_count: int
    total_count: int
    next_node_id: Optional[int]   # None if course is complete
    next_node_title: Optional[str]
    next_node_type: Optional[str]
    # Per-question breakdown for the battle screen
    breakdown: list[dict]         # [{question_id, correct, xp_awarded}]


# ---------------------------------------------------------------------------
# USER PROGRESS SUMMARY
# ---------------------------------------------------------------------------
class ProgressItem(BaseModel):
    node_id: int
    node_title: str
    node_type: str
    completed: bool
    score: float
    attempts: int

    class Config:
        from_attributes = True


class CourseProgressOut(BaseModel):
    course_id: int
    course_title: str
    total_nodes: int
    completed_nodes: int
    completion_percent: float
    nodes: list[ProgressItem]
