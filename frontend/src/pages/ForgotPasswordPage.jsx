import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'

const API = 'http://localhost:3000'

const BG = () => (
  <>
    <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_50%_0%,rgba(40,98,58,0.18)_0%,transparent_65%)]" />
    <div className="ss-grid-overlay fixed inset-0 pointer-events-none opacity-[0.03]" />
  </>
)

export default function ForgotPasswordPage() {
  const navigate = useNavigate()

  const [email,     setEmail]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [sent,      setSent]      = useState(false)
  const [error,     setError]     = useState('')
  const [focused,   setFocused]   = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    setError('')

    try {
      await axios.post(`${API}/api/auth/forgot-password`, { email: email.trim() })
      setSent(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ss-bg-app min-h-screen flex items-center justify-center px-4 font-sans">
      <BG />

      <div className="relative z-10 w-full max-w-[400px]">

        {/* Logo */}
        <div className="text-center mb-8">
          <button onClick={() => navigate('/')} className="inline-flex items-center gap-0">
            <span className="text-[28px] font-semibold tracking-wide text-[#F0FAF4]">Skill</span>
            <span className="text-[28px] font-semibold text-[#3EE07F]">Sync</span>
          </button>
        </div>

        {/* Card */}
        <div className="ss-card-heavy ss-card-line-strong relative rounded-2xl p-8">

          {!sent ? (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#3EE07F]/20 bg-[#3EE07F]/8 text-[24px]">
                  🔑
                </div>
                <h1 className="mb-2 text-[22px] font-bold text-[#F0FAF4]">Forgot password?</h1>
                <p className="text-[13px] leading-relaxed text-[#7BAF8E]">
                  Enter your email and we'll send you a link to reset your password
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="ss-error-box mb-4 rounded-xl px-4 py-3 text-[13px]">
                  {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-[#7BAF8E]">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    placeholder="you@company.com"
                    required
                    autoFocus
                    className={`w-full rounded-xl bg-[rgba(15,32,39,0.85)] px-4 py-3 text-[13px] text-[#F0FAF4] outline-none transition-all ${focused ? 'border border-[rgba(62,224,127,0.4)]' : 'border border-[rgba(40,98,58,0.3)]'}`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className={`w-full rounded-xl border border-[#3EE07F]/20 bg-[linear-gradient(135deg,_#28623A,_#1A4D2E)] py-3 text-[14px] font-semibold text-[#F0FAF4] transition-all ${loading || !email.trim() ? 'opacity-50 shadow-none' : 'opacity-100 shadow-[0_8px_24px_rgba(62,224,127,0.15)]'}`}>
                  {loading
                    ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[rgba(240,250,244,0.3)] border-t-[#F0FAF4]" />
                        Sending...
                      </span>
                    )
                    : 'Send Reset Link →'
                  }
                </button>
              </form>
            </>
          ) : (
            /* Success state */
            <div className="text-center py-4">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#3EE07F]/25 bg-[#3EE07F]/10 text-[28px]">
                ✉️
              </div>
              <h2 className="mb-3 text-[20px] font-bold text-[#F0FAF4]">Check your inbox</h2>
              <p className="mb-2 text-[13px] leading-relaxed text-[#7BAF8E]">
                If an account exists for <span className="font-semibold text-[#3EE07F]">{email}</span>,
                we've sent a password reset link.
              </p>
              <p className="mb-8 text-[12px] text-[rgba(123,175,142,0.6)]">
                The link expires in 30 minutes. Check your spam folder if you don't see it.
              </p>
              <button
                onClick={() => { setSent(false); setEmail('') }}
                className="text-[12px] font-semibold text-[#7BAF8E] hover:underline">
                Try a different email
              </button>
            </div>
          )}

          {/* Back to login */}
          <div className="mt-6 border-t border-[rgba(40,98,58,0.2)] pt-5 text-center">
            <Link to="/login"
              className="text-[13px] font-medium text-[#7BAF8E] transition-colors hover:underline">
              ← Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
