"""
routers/courses.py — Course listing and node graph endpoints.
"""

import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from auth_utils import get_current_user
from database import get_db
from models import Course, Node, User, UserProgress
from schemas import CourseOut, NodeOut, QuestionOut

router = APIRouter(prefix="/courses", tags=["Courses"])


@router.get("", response_model=list[CourseOut])
def list_courses(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),  # must be logged in
):
    """Returns all available courses."""
    return db.query(Course).all()


@router.get("/{course_id}/nodes", response_model=list[NodeOut])
def get_course_nodes(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns all nodes for a course, annotated with is_completed and is_locked
    for the current user. A node is unlocked if:
      - It is the first node (order_index == 0), OR
      - Any of its incoming-edge source nodes are completed by this user.
    """
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    nodes = (
        db.query(Node)
        .filter(Node.course_id == course_id)
        .order_by(Node.order_index)
        .all()
    )

    # Fetch all progress rows for this user + these nodes in one query
    node_ids = [n.id for n in nodes]
    progress_rows = (
        db.query(UserProgress)
        .filter(
            UserProgress.user_id == current_user.id,
            UserProgress.node_id.in_(node_ids),
        )
        .all()
    )
    completed_set = {p.node_id for p in progress_rows if p.completed}

    result = []
    for node in nodes:
        # Determine lock status
        if node.order_index == 0:
            locked = False
        else:
            # Unlocked if any predecessor is completed
            parent_ids = [e.from_node_id for e in node.incoming_edges]
            locked = not any(pid in completed_set for pid in parent_ids)

        result.append(
            NodeOut(
                id=node.id,
                course_id=node.course_id,
                title=node.title,
                youtube_url=node.youtube_url,
                node_type=node.node_type,
                summary=node.summary,
                order_index=node.order_index,
                is_completed=node.id in completed_set,
                is_locked=locked,
            )
        )

    return result


@router.get("/{course_id}/nodes/{node_id}/questions", response_model=list[QuestionOut])
def get_node_questions(
    course_id: int,
    node_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """
    Returns questions for a node — WITHOUT the correct_answer field.
    The answer is only revealed after submission via /quiz/submit.
    """
    node = db.query(Node).filter(
        Node.id == node_id, Node.course_id == course_id
    ).first()
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")

    return [
        QuestionOut(
            id=q.id,
            level=q.level,
            q_type=q.q_type,
            question_text=q.question_text,
            options=json.loads(q.options or "[]"),
            xp_reward=q.xp_reward,
        )
        for q in node.questions
    ]
