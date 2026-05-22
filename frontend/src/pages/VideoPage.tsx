/**
 * VideoPage.tsx — Video Focus View + Battle Quiz Screen.
 *
 * Flow:
 *  1. Embedded YouTube player (video watches don't need tracking)
 *  2. User clicks "⚔ BATTLE!" → battle screen slides in
 *  3. Questions answered one at a time — correct = attack, wrong = get hit
 *  4. All questions answered → show result screen
 *  5. Victory/Defeat → navigate to next node or retry
 */

import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { courseApi, quizApi, QuestionOut, QuizResult } from '../api/api'
import { useAuth } from '../context/AuthContext'
import BattleScreen from '../components/BattleScreen'

type Phase = 'video' | 'battle' | 'result'

export default function VideoPage() {
  const { courseId, nodeId } = useParams<{ courseId: string; nodeId: string }>()
  const navigate = useNavigate()
  const { refreshUser } = useAuth()

  const cId = Number(courseId)
  const nId = Number(nodeId)

  const [questions, setQuestions] = useState<QuestionOut[]>([])
  const [phase,     setPhase]     = useState<Phase>('video')
  const [result,    setResult]    = useState<QuizResult | null>(null)
  const [nodeTitle, setNodeTitle] = useState('Loading...')
  const [videoUrl,  setVideoUrl]  = useState('')
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    // Load node details from the nodes list
    courseApi.getNodes(cId).then(r => {
      const node = r.data.find(n => n.id === nId)
      if (node) {
        setNodeTitle(node.title)
        setVideoUrl(node.youtube_url)
      }
    })
    courseApi.getQuestions(cId, nId)
      .then(r => setQuestions(r.data))
      .finally(() => setLoading(false))
  }, [cId, nId])

  // Convert YouTube watch URL to embed URL
  const toEmbedUrl = (url: string) => {
    const match = url.match(/[?&]v=([^&]+)/)
    return match ? `https://www.youtube.com/embed/${match[1]}?rel=0` : url
  }

  const handleBattleComplete = async (answers: { question_id: number; answer: string }[]) => {
    const res = await quizApi.submit(nId, answers)
    setResult(res.data)
    await refreshUser()   // update XP/level in the global PlayerCard
    setPhase('result')
  }

  const handleContinue = () => {
    if (result?.next_node_id) {
      navigate(`/courses/${cId}/nodes/${result.next_node_id}`)
    } else {
      navigate(`/courses/${cId}`)
    }
  }

  // ── VIDEO PHASE ────────────────────────────────────────────────────
  if (phase === 'video') {
    return (
      <div className="min-h-screen bg-navy flex flex-col">
        <header className="pixel-border bg-dim flex items-center gap-4 px-6 py-3">
          <button
            onClick={() => navigate(`/courses/${cId}`)}
            className="pixel-btn pixel-btn-gold text-[0.45rem] px-3 py-2"
          >
            ◀ MAP
          </button>
          <h1 className="font-pixel text-gold text-[0.55rem] leading-relaxed flex-1 truncate">
            {nodeTitle}
          </h1>
        </header>

        <main className="flex-1 flex flex-col items-center gap-6 p-6">
          {/* YouTube embed */}
          <div className="pixel-border w-full max-w-3xl" style={{ aspectRatio: '16/9' }}>
            {videoUrl ? (
              <iframe
                src={toEmbedUrl(videoUrl)}
                className="w-full h-full"
                allowFullScreen
                title={nodeTitle}
              />
            ) : (
              <div className="w-full h-full bg-dim flex items-center justify-center">
                <p className="font-pixel text-[0.5rem] text-[#888] animate-blink">
                  LOADING VIDEO...
                </p>
              </div>
            )}
          </div>

          {/* "Start battle" instruction */}
          {!loading && questions.length > 0 && (
            <div className="pixel-border-gold bg-[#ffd70011] p-6 max-w-3xl w-full text-center">
              <p className="font-vt text-[#aaa] text-xl mb-4">
                Watched the video? Time to fight!
              </p>
              <p className="font-vt text-[#666] text-lg mb-5">
                {questions.length} questions · {questions.reduce((s, q) => s + q.xp_reward, 0)} XP available
              </p>
              <button
                id="start-battle-btn"
                onClick={() => setPhase('battle')}
                className="pixel-btn pixel-btn-gold text-base px-8 py-4"
              >
                ⚔ BATTLE!
              </button>
            </div>
          )}

          {loading && (
            <p className="font-pixel text-[0.5rem] text-[#888] animate-blink">LOADING BATTLE...</p>
          )}
        </main>
      </div>
    )
  }

  // ── BATTLE PHASE ───────────────────────────────────────────────────
  if (phase === 'battle') {
    return (
      <BattleScreen
        questions={questions}
        onComplete={handleBattleComplete}
      />
    )
  }

  // ── RESULT PHASE ───────────────────────────────────────────────────
  const isVictory = result?.result !== 'fail'
  const isAce     = result?.result === 'ace'

  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center p-6 scanlines relative">

      {/* Result banner */}
      <div className={`pixel-border p-8 max-w-md w-full text-center flex flex-col gap-5
        ${isVictory ? (isAce ? 'pixel-border-gold' : 'pixel-border-green') : 'pixel-border-red'}`}
      >
        <h2 className={`font-pixel text-lg drop-shadow-[0_0_12px_currentColor]
          ${isVictory ? (isAce ? 'text-gold' : 'text-green') : 'text-red-400'}`}
        >
          {isAce ? '🏆 PERFECT!' : isVictory ? '⚔ VICTORY!' : '💀 DEFEAT...'}
        </h2>

        <div className="flex justify-center gap-8 font-vt text-xl">
          <div className="text-center">
            <p className="text-[#888] text-lg">SCORE</p>
            <p className="text-gold text-2xl">{result?.score_percent}%</p>
          </div>
          <div className="text-center">
            <p className="text-[#888] text-lg">XP EARNED</p>
            <p className="text-gold text-2xl">+{result?.xp_earned}</p>
          </div>
          <div className="text-center">
            <p className="text-[#888] text-lg">CORRECT</p>
            <p className="text-gold text-2xl">{result?.correct_count}/{result?.total_count}</p>
          </div>
        </div>

        {/* Per-question breakdown */}
        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
          {result?.breakdown.map((b, i) => (
            <div
              key={b.question_id}
              className={`flex items-center gap-3 p-2 pixel-border text-left
                ${b.correct ? 'border-green bg-[#00ff8811]' : 'border-red-400 bg-[#ff444411]'}`}
            >
              <span className="text-xl">{b.correct ? '✅' : '❌'}</span>
              <div className="flex-1 min-w-0">
                <p className="font-vt text-sm text-[#888]">Q{i + 1} (L{b.level})</p>
                {!b.correct && (
                  <p className="font-vt text-green text-sm truncate">
                    ✓ {b.correct_answer}
                  </p>
                )}
              </div>
              <span className="font-pixel text-[0.4rem] text-gold shrink-0">
                +{b.xp_awarded}
              </span>
            </div>
          ))}
        </div>

        {/* Next node info */}
        {result?.next_node_title && (
          <div className="pixel-border p-3 bg-dim">
            <p className="font-pixel text-[0.45rem] text-[#888]">NEXT CHECKPOINT</p>
            <p className="font-vt text-gold text-xl mt-1">{result.next_node_title}</p>
            <p className="font-vt text-[#888] text-lg">{result.next_node_type?.replace('_', ' ')}</p>
          </div>
        )}

        <div className="flex gap-3">
          {/* Retry on fail */}
          {!isVictory && (
            <button
              onClick={() => { setPhase('battle'); setResult(null) }}
              className="pixel-btn pixel-btn-red flex-1"
            >
              🔄 RETRY
            </button>
          )}
          <button
            id="result-continue-btn"
            onClick={handleContinue}
            className={`pixel-btn flex-1 ${isVictory ? 'pixel-btn-green' : 'pixel-btn-gold'}`}
          >
            {result?.next_node_id ? '▶ NEXT' : '🏠 MAP'}
          </button>
        </div>
      </div>
    </div>
  )
}
