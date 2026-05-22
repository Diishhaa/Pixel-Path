/**
 * PlayerCard.tsx — The player's RPG profile sidebar card.
 * Shows avatar sprite placeholder, level, XP bar, and streak.
 */

import { useAuth } from '../context/AuthContext'

// XP needed to reach next level milestone
const LEVEL_XP = [0, 200, 500, 1000, 2000]

function xpToNextLevel(currentXp: number, level: number): { current: number; needed: number } {
  const nextThreshold = LEVEL_XP[level] ?? LEVEL_XP[LEVEL_XP.length - 1]
  const prevThreshold = LEVEL_XP[level - 1] ?? 0
  return {
    current: currentXp - prevThreshold,
    needed:  nextThreshold - prevThreshold,
  }
}

// Sprite colours per avatar name — drop real sprite sheets in here later
const AVATAR_COLORS: Record<string, string> = {
  warrior: '#4488ff',
  mage:    '#bb44ff',
  ranger:  '#00ff88',
  rogue:   '#ff4444',
}

export default function PlayerCard() {
  const { user } = useAuth()
  if (!user) return null

  const { current, needed } = xpToNextLevel(user.xp, user.level)
  const pct = Math.min(100, Math.round((current / needed) * 100))
  const avatarColor = AVATAR_COLORS[user.avatar] ?? '#ffd700'

  return (
    <aside className="pixel-border bg-dim p-4 flex flex-col gap-4 min-w-[220px]">

      {/* ── Avatar placeholder ── */}
      <div className="flex flex-col items-center gap-2">
        <div
          className="w-20 h-20 sprite-placeholder pixel-border flex items-center justify-center text-4xl"
          style={{ background: avatarColor + '22', borderColor: avatarColor }}
          title="Avatar sprite placeholder — drop sprite sheet here"
        >
          🧙
        </div>
        <p className="font-pixel text-gold text-[0.55rem] text-center leading-relaxed">
          {user.username}
        </p>
      </div>

      {/* ── Level badge ── */}
      <div className="pixel-border-gold bg-navy p-2 text-center">
        <p className="font-pixel text-[0.5rem] text-gold">
          LVL {user.level}
        </p>
        <p className="font-vt text-gold text-lg">{user.level_title}</p>
      </div>

      {/* ── XP bar ── */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center">
          <span className="font-pixel text-[0.45rem] text-gold">XP</span>
          <span className="font-vt text-gold text-base">{user.xp}</span>
        </div>
        <div className="xp-bar-track">
          <div className="xp-bar-fill" style={{ width: `${pct}%` }} />
        </div>
        <p className="font-vt text-[#888] text-sm text-right">
          {current} / {needed} to next level
        </p>
      </div>

      {/* ── Streak ── */}
      <div className="flex items-center gap-3 pixel-border p-2">
        <span className="text-2xl animate-float">🔥</span>
        <div>
          <p className="font-pixel text-[0.45rem] text-red-400">STREAK</p>
          <p className="font-vt text-gold text-xl">{user.streak} days</p>
        </div>
      </div>

    </aside>
  )
}
