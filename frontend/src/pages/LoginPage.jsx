import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

const API_BASE = 'http://localhost:3000'

export default function LoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ identity: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const isEmail = form.identity.includes('@')
    const payload = {
      password: form.password,
      ...(isEmail ? { email: form.identity } : { username: form.identity }),
    }

    try {
      const res = await axios.post(`${API_BASE}/api/auth/login`, payload, { withCredentials: true })
      const { role } = res.data.user
      if (role === 'ADMIN') navigate('/admin/dashboard')
      else if (role === 'PROJECT_MANAGER') navigate('/pm/dashboard')
      else navigate('/dashboard')
    } catch (err) {
      if (err.response?.status === 404) setError('No account found with that username or email.')
      else if (err.response?.status === 401) setError('Incorrect password. Please try again.')
      else setError(err.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ss-auth-shell min-h-screen relative flex items-center justify-center overflow-hidden px-4">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_50%_40%,rgba(40,98,58,0.18)_0%,transparent_70%)]" />
      <div className="ss-grid-overlay absolute inset-0 pointer-events-none opacity-[0.04]" />
      <div className="ss-auth-corner-blob-tr absolute top-0 right-0 h-72 w-72 rounded-full pointer-events-none" />
      <div className="ss-auth-corner-blob-bl absolute bottom-0 left-0 h-64 w-64 rounded-full pointer-events-none" />

      <div className="relative z-10 w-full max-w-[420px]">
        <div className="mb-8 flex items-center justify-center gap-2.5">
          <div className="ss-auth-logo-badge flex h-9 w-9 items-center justify-center rounded-xl text-[15px] font-bold">S</div>
          <span className="ss-auth-logo text-[22px] font-semibold tracking-wide">
            Skill<span className="ss-auth-logo-accent">Sync</span>
          </span>
        </div>

        <div className="ss-auth-card ss-card-line relative rounded-2xl p-8">
          <div className="mb-7">
            <h1 className="mb-1.5 text-[24px] font-bold text-[#F0FAF4]">Welcome back</h1>
            <p className="text-[13px] text-[#7BAF8E]">Sign in to your SkillSync account</p>
          </div>

          {error && (
            <div className="ss-error-box mb-5 flex items-start gap-3 rounded-xl px-4 py-3">
              <span className="mt-0.5 shrink-0 text-[14px] text-[#F87171]">⚠</span>
              <p className="text-[12px] leading-relaxed text-[#FCA5A5]">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-[#7BAF8E]">
                Username or Email
              </label>
              <input
                name="identity"
                type="text"
                autoComplete="username"
                placeholder="Enter username or email"
                value={form.identity}
                onChange={handleChange}
                required
                className="ss-auth-input w-full rounded-xl px-4 py-3 text-[14px]"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#7BAF8E]">
                  Password
                </label>
                <Link to="/forgot-password" className="ss-auth-link text-[11px] font-medium hover:underline">
                  Forgot password?
                </Link>
              </div>

              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className="ss-auth-input w-full rounded-xl px-4 py-3 pr-12 text-[14px]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="ss-auth-icon-btn absolute right-3.5 top-1/2 -translate-y-1/2 text-[15px] transition-colors"
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !form.identity || !form.password}
              className="ss-auth-btn-primary w-full rounded-xl py-3.5 text-[14px] font-semibold tracking-wide transition-all duration-200 mt-1 disabled:opacity-45"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[rgba(240,250,244,0.3)] border-t-[#F0FAF4]" />
                  Signing in...
                </span>
              ) : 'Sign In →'}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="ss-auth-divider h-px flex-1" />
            <span className="text-[11px] text-[rgba(123,175,142,0.4)]">OR</span>
            <div className="ss-auth-divider h-px flex-1" />
          </div>

          <p className="text-center text-[13px] text-[#7BAF8E]">
            Don't have an account?{' '}
            <Link to="/get-started" className="ss-auth-link font-semibold hover:underline">
              Create one free
            </Link>
          </p>
        </div>

        <p className="ss-auth-footer mt-6 text-center text-[11px] tracking-wide">
          Protected by JWT · SkillSync © 2026
        </p>
      </div>
    </div>
  )
}
