import { createContext, useContext, useEffect, useState, useCallback } from 'react'

const API = '/api'
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [user, setUser]   = useState(null)
  const [loading, setLoading] = useState(true)

  // Load current user from token
  useEffect(() => {
    let cancelled = false
    async function loadMe() {
      if (!token) { setUser(null); setLoading(false); return }
      try {
        const res = await fetch(`${API}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!res.ok) throw new Error('unauthorized')
        const data = await res.json()
        if (!cancelled) setUser(data.user)
      } catch {
        if (!cancelled) {
          localStorage.removeItem('token')
          setToken(null)
          setUser(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadMe()
    return () => { cancelled = true }
  }, [token])

  const login = useCallback(async ({ email, password }) => {
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (!res.ok) return { ok: false, error: data.error || 'Login failed' }
      localStorage.setItem('token', data.token)
      setToken(data.token)
      setUser(data.user)
      return { ok: true }
    } catch (e) {
      return { ok: false, error: 'Network error' }
    }
  }, [])

  const register = useCallback(async ({ name, email, password }) => {
    try {
      const res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      })
      const data = await res.json()
      if (!res.ok) return { ok: false, error: data.error || 'Registration failed' }
      localStorage.setItem('token', data.token)
      setToken(data.token)
      setUser(data.user)
      return { ok: true }
    } catch (e) {
      return { ok: false, error: 'Network error' }
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }, [])

  const authFetch = useCallback((url, options = {}) => {
    const headers = { ...(options.headers || {}) }
    if (token) headers.Authorization = `Bearer ${token}`
    return fetch(url, { ...options, headers })
  }, [token])

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
