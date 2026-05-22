/**
 * ProtectedRoute.tsx — Redirect to /login if the user is not authenticated.
 */

import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-navy">
        <p className="font-pixel text-gold text-xs animate-blink">LOADING...</p>
      </div>
    )
  }

  return token ? <>{children}</> : <Navigate to="/login" replace />
}
