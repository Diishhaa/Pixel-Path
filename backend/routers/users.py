"""
routers/users.py — Player profile and progress endpoints.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from auth_utils import get_current_user
from database import get_db
from models import Course, Node, User, UserProgress
from schemas import CourseProgressOut, ProgressItem, UserProfile

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserProfile)
def get_profile(current_user: User = Depends(get_current_user)):
    """Returns the logged-in player's profile card."""
    return current_user


@router.get("/me/progress", response_model=list[CourseProgressOut])
def get_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns progress for every course — used by the dashboard."""
    courses = db.query(Course).all()
    result = []

    for course in courses:
        nodes = db.query(Node).filter(Node.course_id == course.id).all()
        node_ids = [n.id for n in nodes]

        progress_rows = (
            db.query(UserProgress)
            .filter(
                UserProgress.user_id == current_user.id,
                UserProgress.node_id.in_(node_ids),
            )
            .all()
        )
        progress_map = {p.node_id: p for p in progress_rows}

        items = []
        for node in nodes:
            p = progress_map.get(node.id)
            items.append(
                ProgressItem(
                    node_id=node.id,
                    node_title=node.title,
                    node_type=node.node_type,
                    completed=p.completed if p else False,
                    score=p.score if p else 0.0,
                    attempts=p.attempts if p else 0,
                )
            )

        completed_count = sum(1 for i in items if i.completed)
        total = len(nodes)
        pct = round((completed_count / total) * 100, 1) if total > 0 else 0.0

        result.append(
            CourseProgressOut(
                course_id=course.id,
                course_title=course.title,
                total_nodes=total,
                completed_nodes=completed_count,
                completion_percent=pct,
                nodes=items,
            )
        )

    return result
