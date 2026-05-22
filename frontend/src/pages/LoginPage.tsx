/**
 * LoginPage.tsx — Pixel-art styled login form with show-password toggle.
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate  = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username.trim(), password)
      navigate('/dashboard')
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: any } } })?.response?.data?.detail
      let errorMsg = 'Invalid username or password.'
      if (typeof detail === 'string') {
        errorMsg = detail
      } else if (Array.isArray(detail) && detail.length > 0) {
        errorMsg = detail[0].msg || JSON.stringify(detail)
      }
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-4 scanlines relative">

      {/* Title */}
      <div className="mb-8 text-center">
        <h1 className="font-pixel text-gold text-lg leading-loose drop-shadow-[0_0_12px_#ffd700]">
          SKILL<span className="text-green">TREE</span>
        </h1>
        <p className="font-vt text-[#888] text-xl">Level up your Python skills</p>
      </div>

      {/* Card */}
      <form
        onSubmit={handleSubmit}
        className="pixel-border bg-dim p-8 flex flex-col gap-5 w-full max-w-sm"
      >
        <p className="font-pixel text-[0.6rem] text-gold text-center">PLAYER LOGIN</p>

        {error && (
          <div className="pixel-border-red bg-[#ff444411] p-3">
            <p className="font-vt text-red-400 text-lg">{error}</p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="font-pixel text-[0.5rem] text-[#888]">USERNAME</label>
          <input
            id="login-username"
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            className="bg-navy border-2 border-border p-3 font-vt text-xl text-gold focus:border-gold focus:outline-none"
            placeholder="Enter username..."
            autoFocus
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-pixel text-[0.5rem] text-[#888]">PASSWORD</label>
          <input
            id="login-password"
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
          id="login-submit"
          type="submit"
          disabled={loading}
          className="pixel-btn pixel-btn-gold w-full mt-2"
        >
          {loading ? 'LOGGING IN...' : '▶ START GAME'}
        </button>

        <p className="font-vt text-[#888] text-center text-lg">
          New player?{' '}
          <Link to="/register" className="text-green hover:text-gold transition-colors">
            Create account
          </Link>
        </p>
      </form>

    </div>
  )
}
