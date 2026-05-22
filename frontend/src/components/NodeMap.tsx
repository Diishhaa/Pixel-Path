/**
 * NodeMap.tsx — The scrollable course road map.
 * Displays nodes as checkpoints connected by a dashed road.
 * Clicking an unlocked node navigates to the video page.
 */

import { useNavigate } from 'react-router-dom'
import { NodeOut } from '../api/api'

const NODE_ICONS: Record<string, string> = {
  essential:  '⭐',
  remedial:   '📚',
  fast_track: '⚡',
}

const NODE_COLORS: Record<string, string> = {
  essential:  '#ffd700',
  remedial:   '#4488ff',
  fast_track: '#bb44ff',
}

interface Props {
  courseId: number
  nodes: NodeOut[]
}

export default function NodeMap({ courseId, nodes }: Props) {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center gap-0 py-4">
      {nodes.map((node, idx) => (
        <div key={node.id} className="flex flex-col items-center">

          {/* ── Road segment (not shown for first node) ── */}
          {idx > 0 && <div className="node-road h-10" />}

          {/* ── Checkpoint node ── */}
          <button
            disabled={node.is_locked}
            onClick={() => navigate(`/courses/${courseId}/nodes/${node.id}`)}
            className={`
              relative flex items-center gap-4 w-full max-w-sm p-3
              pixel-border transition-all duration-150
              ${node.is_locked
                ? 'opacity-40 cursor-not-allowed border-border'
                : 'cursor-pointer hover:-translate-y-0.5 active:translate-y-0.5'}
              ${node.is_completed
                ? 'pixel-border-green bg-[#00ff8811]'
                : !node.is_locked
                  ? 'pixel-border-gold bg-[#ffd70011]'
                  : 'bg-dim'}
            `}
          >
            {/* Icon / lock */}
            <span className="text-2xl shrink-0">
              {node.is_locked ? '🔒' : node.is_completed ? '✅' : NODE_ICONS[node.node_type]}
            </span>

            {/* Info */}
            <div className="flex flex-col gap-0.5 text-left">
              <p
                className="font-pixel text-[0.5rem] leading-relaxed"
                style={{ color: NODE_COLORS[node.node_type] }}
              >
                {node.title}
              </p>
              <p className="font-vt text-[#888] text-sm">
                {node.node_type.replace('_', ' ').toUpperCase()}
              </p>
            </div>

            {/* Completion badge */}
            {node.is_completed && (
              <span className="absolute right-3 font-pixel text-green text-[0.45rem]">DONE</span>
            )}
          </button>
        </div>
      ))}
    </div>
  )
}
