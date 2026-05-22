#!/bin/bash
# ---------------------------------------------------------------------------
# start_project.sh — Helper script to run SkillTree local server.
# Run this on your local machine to boot up both backend & frontend.
# ---------------------------------------------------------------------------

echo "🎮 Starting SkillTree Launch Sequence..."

# 1. Setup backend environment variables
if [ ! -f "backend/.env" ]; then
    echo "⚙️ Creating backend/.env from .env.example..."
    cp backend/.env.example backend/.env
    echo "⚠️ NOTE: Please open backend/.env and set your GEMINI_API_KEY for AI ingestion!"
fi

# 2. Start the Backend (FastAPI)
echo "🐍 Setting up Python Virtual Environment..."
cd backend
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate

echo "📦 Installing backend requirements..."
pip install -r requirements.txt

echo "🛢️ Checking database initialization..."
# Running ingestion with a dummy run or dry-run to ensure tables are created
python3 -c "
import main
print('SQLite database initialized successfully!')
"

echo "⚡ Starting FastAPI Server on port 8000..."
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

# 3. Start the Frontend (Vite + React)
echo "⚛️ Setting up Frontend Node Packages..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies (this may take a minute)..."
    npm install
fi

echo "🚀 Starting Vite Dev Server on port 5173..."
npm run dev &
FRONTEND_PID=$!
cd ..

# 4. Handle Shutdown / Cleanup on Ctrl+C
cleanup() {
    echo -e "\n🛑 Shutting down servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "🎮 Offline. Goodbye, player!"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Keep script running to monitor logs
wait
