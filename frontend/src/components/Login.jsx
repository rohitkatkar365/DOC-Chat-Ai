import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from './Toast'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Login({ onSwitch }) {
  const { login } = useAuth()
  const toast = useToast()
  const [form, setForm]     = useState({ email: '', password: '' })
  const [touched, setTouched] = useState({})
  const [loading, setLoading] = useState(false)

  function handle(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  function blur(e) {
    setTouched(t => ({ ...t, [e.target.name]: true }))
  }

  function validate() {
    if (!form.email && !form.password) {
      toast('All fields are required.', 'error'); return false
    }
    if (!form.email) {
      toast('Email is required.', 'error'); return false
    }
    if (!EMAIL_RE.test(form.email)) {
      toast('Enter a valid email address.', 'error'); return false
    }
    if (!form.password) {
      toast('Password is required.', 'error'); return false
    }
    return true
  }

  function fieldError(name) {
    if (!touched[name]) return false
    if (name === 'email')    return !form.email || !EMAIL_RE.test(form.email)
    if (name === 'password') return !form.password
    return false
  }

  async function submit(e) {
    e.preventDefault()
    setTouched({ email: true, password: true })
    if (!validate()) return
    setLoading(true)
    const result = await login(form)
    setLoading(false)
    if (!result.ok) toast(result.error, 'error')
    else toast('Login successfully!', 'success')
  }

  return (
    <div className="auth-overlay">
      <div className="bg-orbs">
        <div className="orb orb-1" /><div className="orb orb-2" />
        <div className="orb orb-3" /><div className="orb orb-4" />
      </div>
      <div className="bg-grid" />

      <div className="auth-card">
        <div className="auth-logo">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <rect width="36" height="36" rx="10" fill="url(#g1)" />
            <path d="M10 26V10h10l6 6v10H10z" fill="none" stroke="white" strokeWidth="1.8" strokeLinejoin="round"/>
            <path d="M20 10v6h6" fill="none" stroke="white" strokeWidth="1.8" strokeLinejoin="round"/>
            <path d="M14 18h8M14 22h5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                <stop stopColor="#6366f1"/><stop offset="1" stopColor="#8b5cf6"/>
              </linearGradient>
            </defs>
          </svg>
          <span>DocuChat AI</span>
        </div>

        <h2 className="auth-title">Welcome back</h2>
        <p className="auth-sub">Sign in to your account</p>

        <form onSubmit={submit} className="auth-form" noValidate>
          <div className="auth-field">
            <label>Email</label>
            <input
              type="email" name="email" placeholder="you@example.com"
              value={form.email} onChange={handle} onBlur={blur}
              autoComplete="email"
              className={fieldError('email') ? 'input-error' : ''}
            />
            {fieldError('email') && (
              <span className="field-hint">
                {!form.email ? 'Email is required.' : 'Enter a valid email address.'}
              </span>
            )}
          </div>
          <div className="auth-field">
            <label>Password</label>
            <input
              type="password" name="password" placeholder="••••••••"
              value={form.password} onChange={handle} onBlur={blur}
              autoComplete="current-password"
              className={fieldError('password') ? 'input-error' : ''}
            />
            {fieldError('password') && (
              <span className="field-hint">Password is required.</span>
            )}
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account?{' '}
          <button type="button" onClick={onSwitch}>Create one</button>
        </p>
      </div>
    </div>
  )
}
