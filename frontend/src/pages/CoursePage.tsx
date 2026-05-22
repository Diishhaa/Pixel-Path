/**
 * CoursePage.tsx — The scrollable road map for a single course.
 * Shows all nodes in order with lock/completion state.
 * Uses a TiledBackground containing ground tiles and scattered props.
 */

import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { courseApi, NodeOut } from '../api/api'
import NodeMap from '../components/NodeMap'
import TiledBackground from '../components/TiledBackground'

export default function CoursePage() {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const id = Number(courseId)

  const [nodes,   setNodes]   = useState<NodeOut[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    courseApi.getNodes(id)
      .then(r => setNodes(r.data))
      .catch(() => setError('Failed to load course nodes.'))
      .finally(() => setLoading(false))
  }, [id])

  return (
    <TiledBackground groundIndex="02" showProps={true}>
      <div className="min-h-screen flex flex-col bg-navy bg-opacity-70 scanlines">
        
        {/* ── Header ── */}
        <header className="pixel-border bg-dim bg-opacity-95 flex items-center justify-between px-6 py-4 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="pixel-btn pixel-btn-gold text-[0.5rem] px-4 py-2.5"
            >
              ◀ HUB
            </button>
            <h1 className="font-pixel text-gold text-[0.65rem] tracking-wider">SWAMP JOURNEY MAP</h1>
          </div>
          {!loading && !error && nodes.length > 0 && (
            <p className="font-pixel text-[0.45rem] text-[#888] hidden sm:block">
              COMPLETED: {nodes.filter(n => n.is_completed).length} / {nodes.length}
            </p>
          )}
        </header>

        {/* ── Content ── */}
        <main className="flex-1 overflow-y-auto px-4 py-6 z-10">
          {loading && (
            <div className="flex flex-col items-center justify-center h-64">
              <p className="font-pixel text-[0.55rem] text-gold text-center animate-blink">
                RENDERING SWAMP MAP...
              </p>
            </div>
          )}
          {error && (
            <p className="font-pixel text-[0.5rem] text-red-400 text-center mt-20">{error}</p>
          )}
          {!loading && !error && nodes.length === 0 && (
            <div className="pixel-border bg-dim p-6 max-w-md mx-auto text-center mt-20">
              <p className="font-vt text-[#888] text-xl">No checkpoints mapped to this path yet.</p>
              <p className="font-vt text-[#666] text-lg mt-1">Run ingestion script to populate quest nodes.</p>
            </div>
          )}
          {!loading && !error && nodes.length > 0 && (
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-6">
                <div className="inline-block pixel-border bg-dim bg-opacity-90 px-4 py-2">
                  <p className="font-vt text-[#ccc] text-xl">
                    ⚔ Navigate the path. Level up your code by beating the challenges.
                  </p>
                </div>
              </div>
              
              <NodeMap courseId={id} nodes={nodes} />
            </div>
          )}
        </main>
      </div>
    </TiledBackground>
  )
}
