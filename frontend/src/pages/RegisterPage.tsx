/**
 * RegisterPage.tsx — New player registration with class-based avatar selection.
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const AVATARS = [
  { id: 'warrior', emoji: '⚔️', label: 'Warrior', desc: '⚔️ Casts Fire Balls and deals heavy physical damage!' },
  { id: 'mage',    emoji: '🧙', label: 'Mage',    desc: '🧙 Casts powerful Water Spells and commands coding elements.' },
  { id: 'ranger',  emoji: '🏹', label: 'Ranger',  desc: '🏹 Shoots fire arrows with precision speed and range.' },
  { id: 'rogue',   emoji: '🗡️', label: 'Rogue',   desc: '🗡️ Fast double-strike critical attacks to break locks.' },
]

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [avatar,   setAvatar]   = useState('warrior')
  const [showPass, setShowPass] = useState(false)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const selectedClass = AVATARS.find(a => a.id === avatar)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Quick client-side check
    if (username.trim().length < 2) {
      setError('Username must be at least 2 characters.')
      setLoading(false)
      return
    }

    try {
      await register(username.trim(), email.trim(), password, avatar)
      navigate('/dashboard')
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: any } } })?.response?.data?.detail
      let errorMsg = 'Registration failed. Try a different username.'
      if (typeof detail === 'string') {
        errorMsg = detail
      } else if (Array.isArray(detail) && detail.length > 0) {
        errorMsg = detail[0].msg || JSON.stringify(detail)
      } else if (detail && typeof detail === 'object') {
        errorMsg = JSON.stringify(detail)
      }
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-4 scanlines relative">

      <div className="mb-6 text-center">
        <h1 className="font-pixel text-gold text-lg leading-loose drop-shadow-[0_0_12px_#ffd700]">
          SKILL<span className="text-green">TREE</span>
        </h1>
        <p className="font-vt text-[#888] text-xl">Create your player profile</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="pixel-border bg-dim p-8 flex flex-col gap-4 w-full max-w-sm"
      >
        <p className="font-pixel text-[0.6rem] text-gold text-center">NEW PLAYER REGISTER</p>

        {error && (
          <div className="pixel-border-red bg-[#ff444411] p-3">
            <p className="font-vt text-red-400 text-lg leading-snug">{error}</p>
          </div>
        )}

        {/* Avatar picker */}
        <div className="flex flex-col gap-2">
          <label className="font-pixel text-[0.45rem] text-[#888]">SELECT CLASS</label>
          <div className="grid grid-cols-4 gap-2">
            {AVATARS.map(a => (
              <button
                key={a.id}
                type="button"
                onClick={() => setAvatar(a.id)}
                className={`flex flex-col items-center gap-1 p-2 pixel-border transition-all
                  ${avatar === a.id ? 'pixel-border-gold bg-[#ffd70022]' : 'border-border'}`}
              >
                <span className="text-2xl">{a.emoji}</span>
                <span className="font-pixel text-[0.35rem] text-[#aaa]">{a.label}</span>
              </button>
            ))}
          </div>
          {/* Dynamic class explanation */}
          {selectedClass && (
            <div className="pixel-border bg-navy bg-opacity-70 p-2 mt-1 border-dashed">
              <p className="font-vt text-gold text-sm leading-snug">{selectedClass.desc}</p>
            </div>
          )}
        </div>

        {/* Username */}
        <div className="flex flex-col gap-1.5">
          <label className="font-pixel text-[0.45rem] text-[#888]">USERNAME</label>
          <input
            id="reg-username"
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            className="bg-navy border-2 border-border p-3 font-vt text-xl text-gold focus:border-gold focus:outline-none"
            placeholder="e.g. CodeKnight"
            autoFocus
          />
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label className="font-pixel text-[0.45rem] text-[#888]">EMAIL (OPTIONAL)</label>
          <input
            id="reg-email"
            type="text"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="bg-navy border-2 border-border p-3 font-vt text-xl text-gold focus:border-gold focus:outline-none"
            placeholder="email@example.com (or leave blank)"
          />
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <label className="font-pixel text-[0.45rem] text-[#888]">PASSWORD</label>
          <input
            id="reg-password"
            type={showPass ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="bg-navy border-2 border-border p-3 font-vt text-xl text-gold focus:border-gold focus:outline-none"
            placeholder="••••••••"
          />
        </div>

        {/* Show password checkbox */}
        <div className="flex items-center gap-2 select-none cursor-pointer" onClick={() => setShowPass(s => !s)}>
          <div className={`w-5 h-5 pixel-border flex items-center justify-center shrink-0
            ${showPass ? 'bg-[#ffd70033] border-gold text-gold' : 'border-border'}`}
          >
            {showPass && '✓'}
          </div>
          <span className="font-pixel text-[0.4rem] text-[#aaa]">SHOW PASSWORD</span>
        </div>

        <button
          id="reg-submit"
          type="submit"
          disabled={loading}
          className="pixel-btn pixel-btn-green w-full mt-2"
        >
          {loading ? 'CREATING...' : '✨ BEGIN JOURNEY'}
        </button>

        <p className="font-vt text-[#888] text-center text-lg mt-1">
          Already a player?{' '}
          <Link to="/login" className="text-gold hover:text-green transition-colors">
            Log in
          </Link>
        </p>
      </form>
    </div>
  )
}
