"""
adaptive.py — The core routing engine.

Given a quiz score percentage and the current node, this module decides:
  - "fail"  (<50%)  → find a REMEDIAL node
  - "pass"  (50–85%) → find the next ESSENTIAL node
  - "ace"   (>85%)  → find a FAST_TRACK node (or fall back to essential)

It also handles XP awarding and streak calculation.
"""

from datetime import date, datetime
from sqlalchemy.orm import Session

from models import Edge, Node, User, UserProgress


# ---------------------------------------------------------------------------
# Score thresholds
# ---------------------------------------------------------------------------
FAIL_THRESHOLD = 50.0
ACE_THRESHOLD  = 85.0


def classify_score(score_percent: float) -> str:
    """Returns 'fail', 'pass', or 'ace' based on score."""
    if score_percent < FAIL_THRESHOLD:
        return "fail"
    elif score_percent <= ACE_THRESHOLD:
        return "pass"
    else:
        return "ace"


# ---------------------------------------------------------------------------
# Next-node resolution
# ---------------------------------------------------------------------------
def get_next_node(current_node: Node, result: str, db: Session) -> Node | None:
    """
    Walks the edge graph to find the appropriate next node.

    Priority for each result:
      ace  → prefer fast_track edge → fall back to pass edge
      pass → prefer pass edge
      fail → prefer fail edge → fall back to pass edge (if no remedial exists)
    """
    edges: list[Edge] = (
        db.query(Edge)
        .filter(Edge.from_node_id == current_node.id)
        .all()
    )

    if not edges:
        return None  # end of course

    # Build a lookup by condition
    edge_map: dict[str, Edge] = {e.condition: e for e in edges}

    # Determine preferred edge order
    if result == "ace":
        priority = ["ace", "pass"]
    elif result == "pass":
        priority = ["pass", "ace"]
    else:  # fail
        priority = ["fail", "pass"]

    chosen_edge = None
    for condition in priority:
        if condition in edge_map:
            chosen_edge = edge_map[condition]
            break

    if not chosen_edge:
        return None

    return db.query(Node).filter(Node.id == chosen_edge.to_node_id).first()


# ---------------------------------------------------------------------------
# XP + Level + Streak update
# ---------------------------------------------------------------------------
def update_player_stats(user: User, xp_earned: int, db: Session) -> None:
    """Awards XP, recalculates level/title, and updates daily streak."""
    from models import xp_to_level  # avoid circular at module level

    user.xp += xp_earned
    user.level, user.level_title = xp_to_level(user.xp)

    # Streak: if last_active was yesterday → increment; today → keep; else reset
    today = date.today()
    last = user.last_active.date() if user.last_active else None

    if last is None or last < today:
        # Check if it was exactly yesterday
        from datetime import timedelta
        yesterday = today - timedelta(days=1)
        if last == yesterday:
            user.streak += 1
        elif last != today:
            user.streak = 1  # reset

    user.last_active = datetime.utcnow()
    db.add(user)


# ---------------------------------------------------------------------------
# Record / update progress for a node
# ---------------------------------------------------------------------------
def record_progress(
    user_id: int,
    node_id: int,
    score_percent: float,
    result: str,
    db: Session,
) -> UserProgress:
    """
    Upserts a UserProgress row. If the user retries, keeps the best score.
    """
    progress = (
        db.query(UserProgress)
        .filter(UserProgress.user_id == user_id, UserProgress.node_id == node_id)
        .first()
    )

    if not progress:
        progress = UserProgress(
            user_id=user_id,
            node_id=node_id,
            attempts=0,
            score=0.0,
            completed=False
        )
        db.add(progress)

    if progress.attempts is None:
        progress.attempts = 0
    if progress.score is None:
        progress.score = 0.0

    progress.attempts += 1
    # Keep the best score across attempts
    if score_percent > progress.score:
        progress.score = score_percent

    if result in ("pass", "ace") and not progress.completed:
        progress.completed = True
        progress.completed_at = datetime.utcnow()

    return progress
