"""
models.py — All SQLAlchemy ORM models for SkillTree.

Graph structure:
  Course → has many Nodes
  Node   → connected by Edges (from_node → to_node, with condition)
  Node   → has many Questions
  User   → tracks progress via UserProgress
"""

import json
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean,
    DateTime, ForeignKey, Text
)
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    pass


# ---------------------------------------------------------------------------
# LEVEL SYSTEM HELPER
# ---------------------------------------------------------------------------
LEVEL_THRESHOLDS = [
    (0,    1, "Apprentice"),
    (200,  2, "Mage"),
    (500,  3, "Wizard"),
    (1000, 4, "Archmage"),
    (2000, 5, "Grand Sage"),
]

def xp_to_level(xp: int) -> tuple[int, str]:
    """Returns (level_number, level_title) for a given XP amount."""
    level, title = 1, "Apprentice"
    for threshold, lvl, name in LEVEL_THRESHOLDS:
        if xp >= threshold:
            level, title = lvl, name
    return level, title


# ---------------------------------------------------------------------------
# USER
# ---------------------------------------------------------------------------
class User(Base):
    __tablename__ = "users"

    id            = Column(Integer, primary_key=True, index=True)
    username      = Column(String(50), unique=True, nullable=False)
    email         = Column(String(100), unique=False, nullable=True)
    password_hash = Column(String(255), nullable=False)
    xp            = Column(Integer, default=0)
    level         = Column(Integer, default=1)
    level_title   = Column(String(50), default="Apprentice")
    streak        = Column(Integer, default=0)
    last_active   = Column(DateTime, default=datetime.utcnow)
    # sprite name — placeholder for 2D asset, e.g. "warrior", "mage"
    avatar        = Column(String(50), default="warrior")
    created_at    = Column(DateTime, default=datetime.utcnow)

    progress = relationship("UserProgress", back_populates="user", cascade="all, delete-orphan")

    def update_level(self):
        self.level, self.level_title = xp_to_level(self.xp)


# ---------------------------------------------------------------------------
# COURSE
# ---------------------------------------------------------------------------
class Course(Base):
    __tablename__ = "courses"

    id          = Column(Integer, primary_key=True, index=True)
    title       = Column(String(200), nullable=False)
    description = Column(Text, default="")
    created_at  = Column(DateTime, default=datetime.utcnow)

    nodes = relationship("Node", back_populates="course", cascade="all, delete-orphan")


# ---------------------------------------------------------------------------
# NODE (a single video + its quiz)
# ---------------------------------------------------------------------------
class Node(Base):
    __tablename__ = "nodes"

    id          = Column(Integer, primary_key=True, index=True)
    course_id   = Column(Integer, ForeignKey("courses.id"), nullable=False)
    title       = Column(String(200), nullable=False)
    youtube_url = Column(String(500), nullable=False)
    # essential | remedial | fast_track
    node_type   = Column(String(20), default="essential")
    summary     = Column(Text, default="")
    order_index = Column(Integer, default=0)

    course         = relationship("Course", back_populates="nodes")
    questions      = relationship("Question", back_populates="node", cascade="all, delete-orphan")
    outgoing_edges = relationship(
        "Edge", foreign_keys="Edge.from_node_id",
        back_populates="from_node", cascade="all, delete-orphan"
    )
    incoming_edges = relationship(
        "Edge", foreign_keys="Edge.to_node_id",
        back_populates="to_node", cascade="all, delete-orphan"
    )
    progress = relationship("UserProgress", back_populates="node", cascade="all, delete-orphan")


# ---------------------------------------------------------------------------
# EDGE (directed connection between nodes)
# ---------------------------------------------------------------------------
class Edge(Base):
    __tablename__ = "edges"

    id           = Column(Integer, primary_key=True, index=True)
    from_node_id = Column(Integer, ForeignKey("nodes.id"), nullable=False)
    to_node_id   = Column(Integer, ForeignKey("nodes.id"), nullable=False)
    # pass → normal progress | fail → remedial | ace → fast_track
    condition    = Column(String(20), default="pass")

    from_node = relationship("Node", foreign_keys=[from_node_id], back_populates="outgoing_edges")
    to_node   = relationship("Node", foreign_keys=[to_node_id],   back_populates="incoming_edges")


# ---------------------------------------------------------------------------
# QUESTION
# ---------------------------------------------------------------------------
class Question(Base):
    __tablename__ = "questions"

    id             = Column(Integer, primary_key=True, index=True)
    node_id        = Column(Integer, ForeignKey("nodes.id"), nullable=False)
    level          = Column(Integer, default=1)        # 1=MCQ, 2=FIB, 3=Code
    q_type         = Column(String(20), default="mcq") # mcq | fib | code
    question_text  = Column(Text, nullable=False)
    options        = Column(Text, default="[]")        # JSON list of strings
    correct_answer = Column(Text, nullable=False)
    xp_reward      = Column(Integer, default=10)

    node = relationship("Node", back_populates="questions")

    def get_options(self) -> list:
        return json.loads(self.options or "[]")


# ---------------------------------------------------------------------------
# USER PROGRESS (one row per user per node)
# ---------------------------------------------------------------------------
class UserProgress(Base):
    __tablename__ = "user_progress"

    id           = Column(Integer, primary_key=True, index=True)
    user_id      = Column(Integer, ForeignKey("users.id"), nullable=False)
    node_id      = Column(Integer, ForeignKey("nodes.id"), nullable=False)
    completed    = Column(Boolean, default=False)
    score        = Column(Float, default=0.0)   # percentage 0–100
    attempts     = Column(Integer, default=0)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="progress")
    node = relationship("Node", back_populates="progress")
