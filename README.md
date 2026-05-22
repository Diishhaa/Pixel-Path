# Pixel-Path 
— Gamified Adaptive Learning Platform

SkillTree is a gamified, adaptive tutoring system designed to teach programming courses (such as Python) through an interactive RPG-style web app. It generates branching course roadmaps automatically from YouTube playlists and evaluates real-time quiz performance via animated pixel-art combat screens.

---

## 🚀 Features

- **AI Content Ingestion**: Automatically consumes YouTube playlist metadata and transcripts via Gemini AI to generate a structured course graph (nodes, edges, quizzes, remedial check-loops).
- **Adaptive Routing Engine**: Evaluates answers in real-time, routing users to **Remedial** (fail), **Essential** (pass), or **Fast-Track** (ace) nodes.
- **RPG Battle UI**: Features 2D animated elemental bosses (Fire Reaper / Water Spectre) and projectile magic attack animations running in pure React.
- **Retro Gaming Theme**: Styled with neon glow boxes, thick double-pixel borders, Scanline overlays, and Google Fonts (`Press Start 2P`, `VT323`, `Silkscreen`).
- **Player Stats Engine**: Calculates level, XP progress, and streaks, saving progress atomically.

---

## 🛠️ Project Structure

```
SkillTree/
├── backend/            # FastAPI Backend
│   ├── routers/        # API endpoints (Auth, Courses, Users, Quizzes)
│   ├── database.py     # SQLite Database setup
│   ├── models.py       # SQL Alchemy data models
│   ├── schemas.py      # Pydantic schemas
│   ├── adaptive.py     # Adaptive routing engine
│   └── ingestion.py    # YouTube parser & Gemini course builder CLI
└── frontend/           # Vite + React + TypeScript Frontend
    ├── public/assets/  # 2D Spritesheets & Tilemaps
    └── src/
        ├── components/ # BattleScreen, TiledBackground, AnimatedSprite, NodeMap
        ├── pages/      # DashboardPage, CoursePage, VideoPage, AuthPages
        └── api/        # Axios API Client with JWT authorization
```

---

## 📦 Local Running Setup

### Prerequisites
- **Python 3.10+**
- **Node.js 18+**
- A **Google Gemini API Key** (for ingestion)

---

### Step 1: Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment and activate it:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure your environment variables:
   - Duplicate `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Open `.env` and configure your settings:
     ```env
     GEMINI_API_KEY=your_gemini_api_key_here
     DATABASE_URL=sqlite:///./skilltree.db
     JWT_SECRET=supersecretkey123
     ```

---

### Step 2: Course Ingestion (Run Once)
To populate your database with nodes, quizzes, and edges from a YouTube playlist:

```bash
# Inside the activated backend environment:
python ingestion.py "https://www.youtube.com/playlist?list=YOUR_PLAYLIST_ID" --course "Python Programming Quest"
```
*This parses the videos, calls the Gemini model to extract structured nodes/questions, builds the DAG edges, and saves them to `backend/skilltree.db`.*

---

### Step 3: Start the Backend Server

```bash
uvicorn main:app --reload --port 8000
```
*The interactive API docs will be available at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).*

---

### Step 4: Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install Node packages:
   ```bash
   npm install
   ```

3. Launch the Vite development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to the local server URL (usually [http://localhost:5173](http://localhost:5173)).

---

## ⚔️ Game Mechanics Guide

1. **Register & Select Avatar**: Create a profile, select a retro character avatar color, and get placed on your dashboard (Player Hub).
2. **Launch a Quest**: Select a course to load the **Swamp Journey Map**. Checkpoints are loaded dynamically above a tiled poisonous swamp.
3. **Fight Bosses**: 
   - Enter a node, watch the video, and click **⚔ BATTLE!** to initiate combat.
   - Answer multiple-choice, fill-in-the-blank, or bug-fix code questions.
   - Correct attacks strike the **Fire Reaper / Water Spectre** boss with animated elemental magic. Incorrect answers strike back.
4. **Adaptive Paths**: 
   - Acing the stage (>85% score) opens a **Fast-Track** skip node.
   - Scraping through (50-85%) allows normal **Essential** progress.
   - Failing (<50% score) routes you into a **Remedial** side-quest to review the concepts.
