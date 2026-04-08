import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from './Toast'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Register({ onSwitch }) {
  const { register } = useAuth()
  const toast = useToast()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [touched, setTouched] = useState({})
  const [loading, setLoading] = useState(false)

  function handle(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }
  function blur(e) {
    setTouched(t => ({ ...t, [e.target.name]: true }))
  }

  function validate() {
    if (!form.name)  { toast('Name is required.', 'error'); return false }
    if (!form.email) { toast('Email is required.', 'error'); return false }
    if (!EMAIL_RE.test(form.email)) { toast('Enter a valid email address.', 'error'); return false }
    if (!form.password) { toast('Password is required.', 'error'); return false }
    if (form.password.length < 6) { toast('Password must be at least 6 characters.', 'error'); return false }
    return true
  }

  function fieldError(name) {
    if (!touched[name]) return false
    if (name === 'name')     return !form.name
    if (name === 'email')    return !form.email || !EMAIL_RE.test(form.email)
    if (name === 'password') return !form.password || form.password.length < 6
    return false
  }

  async function submit(e) {
    e.preventDefault()
    setTouched({ name: true, email: true, password: true })
    if (!validate()) return
    setLoading(true)
    const result = await register(form)
    setLoading(false)
    if (!result.ok) toast(result.error, 'error')
    else toast('Account created!', 'success')
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
            <rect width="36" height="36" rx="10" fill="url(#g2)" />
            <path d="M10 26V10h10l6 6v10H10z" fill="none" stroke="white" strokeWidth="1.8" strokeLinejoin="round"/>
            <path d="M20 10v6h6" fill="none" stroke="white" strokeWidth="1.8" strokeLinejoin="round"/>
            <path d="M14 18h8M14 22h5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            <defs>
              <linearGradient id="g2" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                <stop stopColor="#6366f1"/><stop offset="1" stopColor="#8b5cf6"/>
              </linearGradient>
            </defs>
          </svg>
          <span>DocuChat AI</span>
        </div>

        <h2 className="auth-title">Create your account</h2>
        <p className="auth-sub">Get started in seconds</p>

        <form onSubmit={submit} className="auth-form" noValidate>
          <div className="auth-field">
            <label>Name</label>
            <input
              type="text" name="name" placeholder="Your name"
              value={form.name} onChange={handle} onBlur={blur}
              autoComplete="name"
              className={fieldError('name') ? 'input-error' : ''}
            />
            {fieldError('name') && <span className="field-hint">Name is required.</span>}
          </div>
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
              type="password" name="password" placeholder="At least 6 characters"
              value={form.password} onChange={handle} onBlur={blur}
              autoComplete="new-password"
              className={fieldError('password') ? 'input-error' : ''}
            />
            {fieldError('password') && (
              <span className="field-hint">
                {!form.password ? 'Password is required.' : 'Password must be at least 6 characters.'}
              </span>
            )}
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Creating account…' : 'Sign Up'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?{' '}
          <button type="button" onClick={onSwitch}>Sign in</button>
        </p>
      </div>
    </div>
  )
}
