"""
routers/quiz.py — Quiz submission: the heart of the adaptive engine.

POST /quiz/submit
  1. Validates all answers against the DB (server-side, never trust client)
  2. Calculates score %
  3. Classifies result: fail / pass / ace
  4. Finds the next node via the adaptive engine
  5. Awards XP, updates level + streak
  6. Records progress
  7. Returns full breakdown for the battle screen animations
"""

import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from adaptive import (
    classify_score,
    get_next_node,
    record_progress,
    update_player_stats,
)
from auth_utils import get_current_user
from database import get_db
from models import Node, Question, User
from schemas import AnswerItem, QuizResult, QuizSubmitRequest

router = APIRouter(prefix="/quiz", tags=["Quiz"])


def _normalize(text: str) -> str:
    """Case-insensitive, whitespace-stripped comparison helper."""
    return text.strip().lower()


@router.post("/submit", response_model=QuizResult)
def submit_quiz(
    body: QuizSubmitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # ── 1. Load the node ─────────────────────────────────────────────────────
    node = db.query(Node).filter(Node.id == body.node_id).first()
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")

    # ── 2. Load all questions for this node ──────────────────────────────────
    questions: list[Question] = node.questions
    if not questions:
        raise HTTPException(status_code=400, detail="This node has no questions")

    # Build a quick lookup: question_id → Question
    q_map: dict[int, Question] = {q.id: q for q in questions}

    # ── 3. Grade each submitted answer ───────────────────────────────────────
    answer_map: dict[int, str] = {a.question_id: a.answer for a in body.answers}
    breakdown = []
    total_xp_possible = 0
    xp_earned = 0
    correct_count = 0

    for q in questions:
        total_xp_possible += q.xp_reward
        user_answer = answer_map.get(q.id, "")
        is_correct = _normalize(user_answer) == _normalize(q.correct_answer)

        awarded = q.xp_reward if is_correct else 0
        if is_correct:
            correct_count += 1
            xp_earned += awarded

        breakdown.append({
            "question_id": q.id,
            "level": q.level,
            "q_type": q.q_type,
            "correct": is_correct,
            "user_answer": user_answer,
            "correct_answer": q.correct_answer,   # reveal after submission
            "xp_awarded": awarded,
        })

    # ── 4. Calculate score % ─────────────────────────────────────────────────
    total_count = len(questions)
    score_percent = round((correct_count / total_count) * 100, 1) if total_count else 0.0
    result = classify_score(score_percent)

    # ── 5. Find next node ─────────────────────────────────────────────────────
    next_node = get_next_node(node, result, db)

    # ── 6. Update player stats (XP, level, streak) ───────────────────────────
    update_player_stats(current_user, xp_earned, db)

    # ── 7. Record progress ────────────────────────────────────────────────────
    record_progress(current_user.id, node.id, score_percent, result, db)

    db.commit()

    # ── 8. Return full result for the battle screen ───────────────────────────
    return QuizResult(
        score_percent=score_percent,
        xp_earned=xp_earned,
        result=result,
        correct_count=correct_count,
        total_count=total_count,
        next_node_id=next_node.id if next_node else None,
        next_node_title=next_node.title if next_node else None,
        next_node_type=next_node.node_type if next_node else None,
        breakdown=breakdown,
    )
