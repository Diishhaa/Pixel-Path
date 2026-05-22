/**
 * AuthContext.tsx — Global auth state: token, profile, login, logout.
 * Wrap the app in <AuthProvider> and use useAuth() anywhere.
 */

import React, { createContext, useContext, useEffect, useState } from 'react'
import { authApi, userApi, UserProfile } from '../api/api'

interface AuthContextType {
  token: string | null
  user: UserProfile | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string, avatar?: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken]   = useState<string | null>(localStorage.getItem('token'))
  const [user,  setUser]    = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // On mount: if we have a token, fetch the profile
  useEffect(() => {
    if (token) {
      userApi.getProfile()
        .then(r => setUser(r.data))
        .catch(() => { localStorage.removeItem('token'); setToken(null) })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [token])

  const login = async (username: string, password: string) => {
    const { data } = await authApi.login(username, password)
    localStorage.setItem('token', data.access_token)
    setToken(data.access_token)
    const profile = await userApi.getProfile()
    setUser(profile.data)
  }

  const register = async (username: string, email: string, password: string, avatar = 'warrior') => {
    const { data } = await authApi.register(username, email, password, avatar)
    localStorage.setItem('token', data.access_token)
    setToken(data.access_token)
    const profile = await userApi.getProfile()
    setUser(profile.data)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  const refreshUser = async () => {
    const profile = await userApi.getProfile()
    setUser(profile.data)
  }

  return (
    <AuthContext.Provider value={{ token, user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
