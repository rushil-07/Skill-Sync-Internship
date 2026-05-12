import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import axios from 'axios'

const API = 'http://localhost:3000'

const STRENGTH_CFG = [
  { label: 'Too short', text: 'text-[#7BAF8E]', fill: 'bg-[rgba(123,175,142,0.2)]' },
  { label: 'Weak', text: 'text-[#F87171]', fill: 'bg-[rgba(248,113,113,0.3)]' },
  { label: 'Fair', text: 'text-[#FBBF24]', fill: 'bg-[rgba(251,191,36,0.3)]' },
  { label: 'Good', text: 'text-[#60A5FA]', fill: 'bg-[rgba(96,165,250,0.3)]' },
  { label: 'Strong', text: 'text-[#3EE07F]', fill: 'bg-[rgba(62,224,127,0.3)]' },
]

const getStrength = (pwd) => {
  let score = 0
  if (pwd.length >= 8) score++
  if (/[A-Z]/.test(pwd)) score++
  if (/[0-9]/.test(pwd)) score++
  if (/[^A-Za-z0-9]/.test(pwd)) score++
  return score
}

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [focusP, setFocusP] = useState(false)
  const [focusC, setFocusC] = useState(false)

  useEffect(() => {
    if (!token) {
      setVerifying(false)
      setTokenValid(false)
      return
    }

    axios.post(`${API}/api/auth/verify-token`, { token })
      .then(r => setTokenValid(r.data.valid))
      .catch(() => setTokenValid(false))
      .finally(() => setVerifying(false))
  }, [token])

  const strength = getStrength(password)
  const strengthCfg = STRENGTH_CFG[Math.min(strength, STRENGTH_CFG.length - 1)]
  const passwordsMatch = password && confirm && password === confirm
  const canSubmit = password.length >= 8 && passwordsMatch && !loading

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit) return

    setLoading(true)
    setError('')

    try {
      await axios.post(`${API}/api/auth/reset-password`, { token, password })
      setDone(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const confirmBorderClass = confirm
    ? passwordsMatch
      ? 'border-[rgba(62,224,127,0.4)]'
      : 'border-[rgba(248,113,113,0.4)]'
    : focusC
      ? 'border-[rgba(62,224,127,0.4)]'
      : 'border-[rgba(40,98,58,0.3)]'

  return (
    <div className="ss-auth-shell min-h-screen px-4 font-sans flex items-center justify-center">
      <div className="ss-radial-zero fixed inset-0 pointer-events-none" />
      <div className="ss-grid-overlay fixed inset-0 pointer-events-none opacity-[0.03]" />

      <div className="relative z-10 w-full max-w-[400px]">
        <div className="mb-8 text-center">
          <button onClick={() => navigate('/')} className="inline-flex items-center gap-0">
            <span className="text-[28px] font-semibold tracking-wide text-[#F0FAF4]">Skill</span>
            <span className="text-[28px] font-semibold text-[#3EE07F]">Sync</span>
          </button>
        </div>

        <div className="ss-card-heavy ss-card-line-strong relative rounded-2xl p-8">
          {verifying && (
            <div className="py-8 text-center">
              <div className="ss-spinner mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2" />
              <p className="text-[13px] text-[#7BAF8E]">Verifying reset link...</p>
            </div>
          )}

          {!verifying && !tokenValid && (
            <div className="py-4 text-center">
              <div className="ss-reset-warning mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl text-[28px]">
                ⚠
              </div>
              <h2 className="mb-3 text-[20px] font-bold text-[#F0FAF4]">Link expired</h2>
              <p className="mb-6 text-[13px] leading-relaxed text-[#7BAF8E]">
                This reset link is invalid or has expired. Reset links are valid for 30 minutes.
              </p>
              <Link to="/forgot-password" className="ss-auth-btn-primary inline-block rounded-xl px-6 py-2.5 text-[13px] font-semibold transition-all">
                Request new link →
              </Link>
            </div>
          )}

          {!verifying && tokenValid && !done && (
            <>
              <div className="mb-8 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[rgba(62,224,127,0.2)] bg-[rgba(62,224,127,0.08)] text-[24px]">
                  🔒
                </div>
                <h1 className="mb-2 text-[22px] font-bold text-[#F0FAF4]">Set new password</h1>
                <p className="text-[13px] text-[#7BAF8E]">Choose a strong password for your account</p>
              </div>

              {error && (
                <div className="ss-error-box mb-4 rounded-xl px-4 py-3 text-[13px]">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-[#7BAF8E]">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      onFocus={() => setFocusP(true)}
                      onBlur={() => setFocusP(false)}
                      placeholder="Min. 8 characters"
                      required
                      autoFocus
                      className={`w-full rounded-xl px-4 py-3 pr-12 text-[13px] outline-none transition-all ss-input-field ${focusP ? 'border-[rgba(62,224,127,0.4)]' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(s => !s)}
                      className="ss-auth-icon-btn absolute right-3 top-1/2 -translate-y-1/2 text-[14px] transition-colors"
                    >
                      {showPwd ? '🙈' : '👁'}
                    </button>
                  </div>

                  {password && (
                    <div className="mt-2">
                      <div className="mb-1 flex gap-1">
                        {[1, 2, 3, 4].map(item => (
                          <div
                            key={item}
                            className={[
                              'h-1 flex-1 rounded-full transition-all',
                              item <= strength ? strengthCfg.fill : 'bg-[rgba(40,98,58,0.2)]',
                            ].join(' ')}
                          />
                        ))}
                      </div>
                      <p className={`text-[10px] font-semibold ${strengthCfg.text}`}>
                        {strengthCfg.label}
                        {strength < 4 && (
                          <span className="font-normal text-[rgba(123,175,142,0.5)]">
                            {' · '}
                            {!(/[A-Z]/.test(password)) && 'Add uppercase · '}
                            {!(/[0-9]/.test(password)) && 'Add number · '}
                            {!(/[^A-Za-z0-9]/.test(password)) && 'Add symbol'}
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-[#7BAF8E]">
                    Confirm Password
                  </label>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    onFocus={() => setFocusC(true)}
                    onBlur={() => setFocusC(false)}
                    placeholder="Repeat your password"
                    required
                    className={`w-full rounded-xl px-4 py-3 text-[13px] outline-none transition-all ss-input-field ${confirmBorderClass}`}
                  />
                  {confirm && !passwordsMatch && (
                    <p className="mt-1.5 text-[11px] text-[#F87171]">Passwords don't match</p>
                  )}
                  {passwordsMatch && (
                    <p className="mt-1.5 text-[11px] text-[#3EE07F]">✓ Passwords match</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="ss-auth-btn-primary mt-2 w-full rounded-xl py-3 text-[14px] font-semibold transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-[rgba(240,250,244,0.3)] border-t-[#F0FAF4]" />
                      Saving...
                    </span>
                  ) : 'Reset Password →'}
                </button>
              </form>
            </>
          )}

          {done && (
            <div className="py-4 text-center">
              <div className="ss-reset-success mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl text-[32px]">
                ✓
              </div>
              <h2 className="mb-3 text-[20px] font-bold text-[#F0FAF4]">Password reset!</h2>
              <p className="mb-2 text-[13px] leading-relaxed text-[#7BAF8E]">
                Your password has been updated successfully.
              </p>
              <p className="mb-6 text-[12px] text-[rgba(123,175,142,0.5)]">
                Redirecting to login in 3 seconds...
              </p>
              <Link to="/login" className="ss-auth-btn-primary inline-block rounded-xl px-6 py-2.5 text-[13px] font-semibold">
                Go to Login →
              </Link>
            </div>
          )}

          {!done && (
            <div className="mt-6 border-t border-[rgba(40,98,58,0.2)] pt-5 text-center">
              <Link to="/login" className="ss-auth-link-muted text-[13px] font-medium transition-colors hover:underline">
                ← Back to login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
