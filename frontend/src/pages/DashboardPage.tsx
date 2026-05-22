/**
 * DashboardPage.tsx — Player Hub / Home screen.
 * Shows PlayerCard + all courses with progress rings.
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { courseApi, CourseOut, userApi, CourseProgressOut } from '../api/api'
import PlayerCard from '../components/PlayerCard'
import { useAuth } from '../context/AuthContext'

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [courses,  setCourses]  = useState<CourseOut[]>([])
  const [progress, setProgress] = useState<Record<number, CourseProgressOut>>({})
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    Promise.all([courseApi.list(), userApi.getProgress()])
      .then(([cRes, pRes]) => {
        setCourses(cRes.data)
        const map: Record<number, CourseProgressOut> = {}
        pRes.data.forEach(p => { map[p.course_id] = p })
        setProgress(map)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-navy flex flex-col">

      {/* ── Top bar ── */}
      <header className="pixel-border bg-dim flex items-center justify-between px-6 py-3">
        <h1 className="font-pixel text-gold text-[0.7rem] drop-shadow-[0_0_8px_#ffd700]">
          SKILL<span className="text-green">TREE</span>
        </h1>
        <div className="flex items-center gap-4">
          <span className="font-vt text-gold text-xl">
            {user?.username} · LVL {user?.level}
          </span>
          <button onClick={logout} className="pixel-btn pixel-btn-red text-[0.45rem] px-3 py-2">
            LOGOUT
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 gap-0 overflow-hidden">

        {/* Sidebar */}
        <PlayerCard />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6">
          <h2 className="font-pixel text-[0.65rem] text-gold mb-6">
            📜 YOUR QUESTS
          </h2>

          {loading ? (
            <p className="font-pixel text-[0.5rem] text-[#888] animate-blink">LOADING...</p>
          ) : courses.length === 0 ? (
            <div className="pixel-border p-6 text-center">
              <p className="font-vt text-[#888] text-xl">No courses found.</p>
              <p className="font-vt text-[#555] text-lg mt-1">
                Run the ingestion script to add a course.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {courses.map(course => {
                const p = progress[course.id]
                const pct = p?.completion_percent ?? 0
                const done = p?.completed_nodes ?? 0
                const total = p?.total_nodes ?? 0

                return (
                  <button
                    key={course.id}
                    id={`course-${course.id}`}
                    onClick={() => navigate(`/courses/${course.id}`)}
                    className="pixel-border bg-dim p-5 flex flex-col gap-3 text-left
                               hover:-translate-y-1 transition-transform duration-150 cursor-pointer"
                  >
                    {/* Title */}
                    <p className="font-pixel text-[0.55rem] text-gold leading-relaxed">
                      {course.title}
                    </p>

                    {/* Description */}
                    <p className="font-vt text-[#888] text-lg leading-tight line-clamp-2">
                      {course.description || 'A Python learning quest'}
                    </p>

                    {/* Progress bar */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between">
                        <span className="font-pixel text-[0.4rem] text-[#888]">PROGRESS</span>
                        <span className="font-vt text-gold text-sm">{done}/{total}</span>
                      </div>
                      <div className="xp-bar-track">
                        <div className="xp-bar-fill" style={{ width: `${pct}%` }} />
                      </div>
                    </div>

                    <p className="font-pixel text-[0.45rem] text-green">
                      ▶ ENTER QUEST
                    </p>
                  </button>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
