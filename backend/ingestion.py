"""
ingestion.py — One-time course ingestion script.

Usage:
    python ingestion.py <youtube_playlist_url> --course "Python Fundamentals"

What it does:
  1. Fetches all video URLs/titles from the playlist via yt-dlp
  2. For each video, downloads the auto-generated transcript
  3. Sends the transcript to Gemini and asks it to produce:
       - A node title, type, and summary
       - 3 quiz questions (MCQ, fill-in-the-blank, code analysis)
  4. Stores everything directly in the SQLite DB

Run this ONCE per playlist. Re-running will create a duplicate course.
"""

import argparse
import json
import os
import sys
import time

import google.generativeai as genai
import yt_dlp
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, NoTranscriptFound

from database import engine
from models import Base, Course, Edge, Node, Question

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------
load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("❌ ERROR: GEMINI_API_KEY not set in .env file.")
    sys.exit(1)

genai.configure(api_key=api_key)
gemini = genai.GenerativeModel("gemini-1.5-flash")

# ---------------------------------------------------------------------------
# Step 1: Get all video info from the playlist
# ---------------------------------------------------------------------------
def get_playlist_videos(playlist_url: str) -> list[dict]:
    """Returns a list of {id, title, url} dicts for every video in the playlist."""
    print("📋 Fetching playlist info...")
    ydl_opts = {
        "quiet": True,
        "extract_flat": True,  # don't download, just get metadata
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(playlist_url, download=False)
            videos = []
            for entry in info.get("entries", []):
                if entry and entry.get("id"):
                    videos.append({
                        "id":    entry["id"],
                        "title": entry.get("title", "Untitled"),
                        "url":   f"https://www.youtube.com/watch?v={entry['id']}",
                    })
            return videos
    except Exception as e:
        print(f"❌ Could not fetch playlist: {e}")
        sys.exit(1)


# ---------------------------------------------------------------------------
# Step 2: Get transcript for a single video
# ---------------------------------------------------------------------------
def get_transcript(video_id: str, max_chars: int = 8000) -> str | None:
    """
    Tries to fetch the English transcript.
    Truncates to max_chars to stay within Gemini's context limits.
    Returns None if no transcript is available.
    """
    try:
        segments = YouTubeTranscriptApi.get_transcript(video_id, languages=["en"])
        full_text = " ".join(seg["text"] for seg in segments)
        return full_text[:max_chars]
    except (TranscriptsDisabled, NoTranscriptFound):
        return None
    except Exception as e:
        print(f"   ⚠ Transcript error: {e}")
        return None


# ---------------------------------------------------------------------------
# Step 3: Ask Gemini to generate structured node data
# ---------------------------------------------------------------------------
GEMINI_PROMPT_TEMPLATE = """
You are an instructional designer building a Python programming course.
Given the YouTube video title and its transcript, generate structured learning content.

Video Title: {title}
Transcript:
{transcript}

Return ONLY a single valid JSON object with NO markdown fences, NO explanation.
The JSON must follow this exact schema:

{{
  "title": "short descriptive topic name (max 6 words)",
  "node_type": "essential",
  "summary": "2-3 sentence plain-English summary of what this video teaches",
  "questions": [
    {{
      "level": 1,
      "type": "mcq",
      "question": "A clear multiple-choice question about the video content",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": "The exact text of the correct option",
      "xp": 10
    }},
    {{
      "level": 2,
      "type": "fib",
      "question": "Complete the sentence: To define a function in Python, use the ___ keyword.",
      "options": [],
      "answer": "def",
      "xp": 20
    }},
    {{
      "level": 3,
      "type": "code",
      "question": "Find the bug:\\n\\ndef greet(name):\\n    print('Hello, ' + Name)\\n\\nWhat is wrong?",
      "options": [],
      "answer": "Variable 'Name' should be lowercase 'name' — Python is case-sensitive.",
      "xp": 30
    }}
  ]
}}

Rules:
- node_type must be exactly one of: essential, remedial, fast_track
- Most videos should be "essential". Use "remedial" for very basic recap content.
- options must be a JSON array of 4 strings for MCQ, and [] for FIB and code questions.
- answer must be the complete correct answer as a plain string.
"""


def generate_node_data(title: str, transcript: str) -> dict | None:
    """Calls Gemini and parses the returned JSON. Returns None on failure."""
    prompt = GEMINI_PROMPT_TEMPLATE.format(title=title, transcript=transcript)
    try:
        response = gemini.generate_content(prompt)
        raw = response.text.strip()

        # Gemini sometimes wraps output in ```json ... ``` — strip it
        if raw.startswith("```"):
            parts = raw.split("```")
            # parts[1] is the content between first pair of backticks
            raw = parts[1].strip()
            if raw.startswith("json"):
                raw = raw[4:].strip()

        return json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"   ❌ JSON parse error: {e}")
        print(f"   Raw response: {raw[:300]}")
        return None
    except Exception as e:
        print(f"   ❌ Gemini error: {e}")
        return None


# ---------------------------------------------------------------------------
# Step 4: Save everything to the database
# ---------------------------------------------------------------------------
def save_to_db(course_name: str, video_nodes: list[dict], db: Session) -> None:
    """
    Inserts the course, all nodes, their questions, and linear edges into the DB.
    video_nodes is a list of dicts returned by generate_node_data, with an extra
    'youtube_url' key added by the caller.
    """
    # Create the course
    course = Course(title=course_name, description=f"Auto-generated Python course")
    db.add(course)
    db.flush()  # get course.id before adding nodes
    print(f"\n✅ Created course '{course_name}' (id={course.id})")

    created_nodes: list[Node] = []

    for idx, data in enumerate(video_nodes):
        node = Node(
            course_id=course.id,
            title=data.get("title", f"Video {idx + 1}"),
            youtube_url=data["youtube_url"],
            node_type=data.get("node_type", "essential"),
            summary=data.get("summary", ""),
            order_index=idx,
        )
        db.add(node)
        db.flush()  # get node.id

        # Add questions
        for q in data.get("questions", []):
            question = Question(
                node_id=node.id,
                level=q.get("level", 1),
                q_type=q.get("type", "mcq"),
                question_text=q.get("question", ""),
                options=json.dumps(q.get("options", [])),
                correct_answer=q.get("answer", ""),
                xp_reward=q.get("xp", 10),
            )
            db.add(question)

        created_nodes.append(node)
        q_count = len(data.get("questions", []))
        print(f"   ✅ [{idx+1}] {node.title} ({node.node_type}) — {q_count} questions")

    # Create linear edges along the essential path
    # For now: sequential chain. The adaptive engine will resolve branches at runtime.
    edge_count = 0
    for i in range(len(created_nodes) - 1):
        edge = Edge(
            from_node_id=created_nodes[i].id,
            to_node_id=created_nodes[i + 1].id,
            condition="pass",
        )
        db.add(edge)
        edge_count += 1

    db.commit()
    print(f"\n🔗 Created {edge_count} edges (linear path)")
    print(f"🎉 Ingestion complete — {len(created_nodes)} nodes in '{course_name}'")


# ---------------------------------------------------------------------------
# Main pipeline
# ---------------------------------------------------------------------------
def ingest(playlist_url: str, course_name: str) -> None:
    print(f"\n🎮 SkillTree Ingestion Pipeline")
    print(f"   Course : {course_name}")
    print(f"   URL    : {playlist_url}")
    print("=" * 55)

    # Ensure all tables exist (safe to run multiple times)
    Base.metadata.create_all(engine)

    # Step 1: Get playlist videos
    videos = get_playlist_videos(playlist_url)
    if not videos:
        print("❌ No videos found in playlist.")
        return
    print(f"   Found {len(videos)} videos\n")

    # Step 2 + 3: Process each video individually
    node_data_list: list[dict] = []

    for i, video in enumerate(videos):
        print(f"[{i+1}/{len(videos)}] {video['title'][:65]}")

        transcript = get_transcript(video["id"])
        if not transcript:
            print("   ⏭ Skipping — no transcript available\n")
            continue

        print("   🤖 Asking Gemini...")
        data = generate_node_data(video["title"], transcript)

        if data is None:
            print("   ⏭ Skipping — Gemini failed to return valid JSON\n")
            continue

        # Attach the YouTube URL for DB storage
        data["youtube_url"] = video["url"]
        node_data_list.append(data)

        # Small delay to respect Gemini rate limits (free tier: ~15 req/min)
        time.sleep(2)

    if not node_data_list:
        print("\n❌ No nodes were generated. Check transcripts and Gemini key.")
        return

    # Step 4: Save to DB
    print(f"\n💾 Saving {len(node_data_list)} nodes to database...")
    with Session(engine) as db:
        save_to_db(course_name, node_data_list, db)


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="SkillTree one-time course ingestion from a YouTube playlist."
    )
    parser.add_argument("playlist_url", help="Full YouTube playlist URL")
    parser.add_argument(
        "--course",
        default="Python Fundamentals",
        help='Name for the course (default: "Python Fundamentals")',
    )
    args = parser.parse_args()
    ingest(args.playlist_url, args.course)
