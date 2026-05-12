import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

const API_BASE = 'http://localhost:3000'

const ROLES = [
  { value: 'MEMBER', label: 'Team Member', desc: 'Work on assigned tasks and projects' },
  { value: 'PROJECT_MANAGER', label: 'Project Manager', desc: 'Create projects and assemble teams with AI' },
]

const SKILL_SUGGESTIONS = [
  'React', 'Node.js', 'Python', 'TypeScript', 'MongoDB', 'AWS', 'Docker',
  'UI/UX', 'Leadership', 'Scrum', 'DevOps', 'AI/ML', 'FastAPI', 'GraphQL',
]

const strengthFill = [
  '',
  'bg-[#F87171]',
  'bg-[#FBBF24]',
  'bg-[#3EE07F]',
  'bg-[#3EE07F]',
]

const strengthText = [
  '',
  'text-[#F87171]',
  'text-[#FBBF24]',
  'text-[#3EE07F]',
  'text-[#3EE07F]',
]

function inputClasses(focused, error) {
  return [
    'w-full rounded-xl px-4 py-3 text-[14px] outline-none transition-colors ss-auth-input',
    error ? 'ss-auth-input-error' : '',
    focused ? 'border-[rgba(62,224,127,0.45)]' : '',
  ].join(' ').trim()
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [focused, setFocused] = useState({})
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'MEMBER',
    bio: '',
    profile_picture_url: '',
    availability_hours_per_week: 40,
    current_capacity_percentage: '',
    skills: [],
  })
  const [skillInput, setSkillInput] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setFieldErrors(prev => ({ ...prev, [e.target.name]: '' }))
    setError('')
  }

  const addSkill = (skill) => {
    const trimmed = skill.trim()
    if (trimmed && !form.skills.includes(trimmed)) {
      setForm(prev => ({ ...prev, skills: [...prev.skills, trimmed] }))
    }
    setSkillInput('')
  }

  const removeSkill = (skill) => {
    setForm(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }))
  }

  const handleSkillKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && skillInput.trim()) {
      e.preventDefault()
      addSkill(skillInput)
    }
    if (e.key === 'Backspace' && !skillInput && form.skills.length) {
      removeSkill(form.skills[form.skills.length - 1])
    }
  }

  const validateStep1 = () => {
    const errs = {}
    if (!form.username.trim()) errs.username = 'Username is required'
    else if (form.username.length < 3) errs.username = 'Min 3 characters'
    if (!form.email.trim()) errs.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email'
    if (!form.password) errs.password = 'Password is required'
    else if (form.password.length < 8) errs.password = 'Min 8 characters'
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match'
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleNext = (e) => {
    e.preventDefault()
    if (validateStep1()) setStep(2)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const payload = {
      username: form.username,
      email: form.email,
      password: form.password,
      role: form.role,
    }

    if (form.bio.trim()) payload.bio = form.bio.trim()
    if (form.profile_picture_url.trim()) payload.profile_picture_url = form.profile_picture_url.trim()
    if (form.availability_hours_per_week) payload.availability_hours_per_week = Number(form.availability_hours_per_week)
    if (form.current_capacity_percentage !== '') payload.current_capacity_percentage = Number(form.current_capacity_percentage)
    if (form.skills.length > 0) payload.skills = form.skills

    try {
      const res = await axios.post(`${API_BASE}/api/auth/register`, payload, { withCredentials: true })
      const { role } = res.data.user
      if (role === 'ADMIN') navigate('/admin/dashboard')
      else if (role === 'PROJECT_MANAGER') navigate('/pm/dashboard')
      else navigate('/dashboard')
    } catch (err) {
      if (err.response?.status === 409) setError('An account with this username or email already exists.')
      else setError(err.response?.data?.message || 'Registration failed. Please try again.')
      setStep(1)
    } finally {
      setLoading(false)
    }
  }

  const pwStrength = form.password.length >= 12 ? 4 : form.password.length >= 10 ? 3 : form.password.length >= 8 ? 2 : form.password.length > 0 ? 1 : 0
  const pwLabel = ['', 'Too short', 'Weak', 'Good', 'Strong'][pwStrength]
  const passwordsMatch = form.confirmPassword && form.confirmPassword === form.password

  const Label = ({ children, required }) => (
    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-[#7BAF8E]">
      {children} {required && <span className="text-[#3EE07F]">*</span>}
    </label>
  )

  const FieldError = ({ name }) => (
    fieldErrors[name]
      ? <p className="mt-1.5 text-[11px] text-[#F87171]">{fieldErrors[name]}</p>
      : null
  )

  return (
    <div className="ss-auth-shell relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_50%_35%,rgba(40,98,58,0.18)_0%,transparent_70%)]" />
      <div className="ss-grid-overlay absolute inset-0 pointer-events-none opacity-[0.04]" />
      <div className="ss-auth-corner-blob-tr-soft absolute top-0 right-0 h-80 w-80 rounded-full pointer-events-none" />
      <div className="ss-auth-corner-blob-bl-soft absolute bottom-0 left-0 h-72 w-72 rounded-full pointer-events-none" />

      <div className="relative z-10 w-full max-w-[480px]">
        <div className="mb-8 flex items-center justify-center gap-2.5">
          <div className="ss-auth-logo-badge flex h-9 w-9 items-center justify-center rounded-xl text-[15px] font-bold">S</div>
          <span className="ss-auth-logo text-[22px] font-semibold tracking-wide">
            Skill<span className="ss-auth-logo-accent">Sync</span>
          </span>
        </div>

        <div className="ss-auth-card-soft ss-card-line-strong relative rounded-2xl p-8">
          <div className="mb-7 flex items-start justify-between">
            <div>
              <h1 className="mb-1.5 text-[24px] font-bold text-[#F0FAF4]">
                {step === 1 ? 'Create account' : 'Complete profile'}
              </h1>
              <p className="text-[13px] text-[#7BAF8E]">
                {step === 1 ? 'Set up your SkillSync account' : 'Optional - you can skip anytime'}
              </p>
            </div>

            <div className="mt-1 shrink-0 flex items-center gap-1.5">
              {[1, 2].map((item, index) => (
                <div key={item} className="flex items-center gap-1.5">
                  <div
                    className={[
                      'flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-bold transition-all',
                      step >= item
                        ? 'border-[rgba(62,224,127,0.3)] bg-gradient-to-br from-[#28623A] to-[#1A4D2E] text-[#F0FAF4]'
                        : 'border-[rgba(40,98,58,0.2)] bg-[rgba(40,98,58,0.15)] text-[#7BAF8E]',
                    ].join(' ')}
                  >
                    {item}
                  </div>
                  {index === 0 && (
                    <div className={['h-px w-5', step >= 2 ? 'bg-[rgba(62,224,127,0.4)]' : 'bg-[rgba(40,98,58,0.2)]'].join(' ')} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="ss-error-box mb-5 flex items-start gap-3 rounded-xl px-4 py-3">
              <span className="mt-0.5 shrink-0 text-[14px] text-[#F87171]">⚠</span>
              <p className="text-[12px] leading-relaxed text-[#FCA5A5]">{error}</p>
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleNext} className="space-y-4">
              <div>
                <Label required>Username</Label>
                <input
                  name="username"
                  placeholder="e.g. arjun_dev"
                  value={form.username}
                  onChange={handleChange}
                  required
                  className={inputClasses(focused.username, fieldErrors.username)}
                  onFocus={() => setFocused(prev => ({ ...prev, username: true }))}
                  onBlur={() => setFocused(prev => ({ ...prev, username: false }))}
                />
                <FieldError name="username" />
              </div>

              <div>
                <Label required>Email</Label>
                <input
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className={inputClasses(focused.email, fieldErrors.email)}
                  onFocus={() => setFocused(prev => ({ ...prev, email: true }))}
                  onBlur={() => setFocused(prev => ({ ...prev, email: false }))}
                />
                <FieldError name="email" />
              </div>

              <div>
                <Label required>Password</Label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 8 characters"
                    value={form.password}
                    onChange={handleChange}
                    required
                    className={`${inputClasses(focused.password, fieldErrors.password)} pr-12`}
                    onFocus={() => setFocused(prev => ({ ...prev, password: true }))}
                    onBlur={() => setFocused(prev => ({ ...prev, password: false }))}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="ss-auth-icon-btn absolute right-3.5 top-1/2 -translate-y-1/2 text-[15px] transition-colors"
                  >
                    {showPassword ? '🙈' : '👁'}
                  </button>
                </div>
                <FieldError name="password" />
                {form.password && (
                  <div className="mt-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map(item => (
                        <div
                          key={item}
                          className={[
                            'h-1 flex-1 rounded-full transition-all',
                            item <= pwStrength ? strengthFill[pwStrength] : 'bg-[rgba(40,98,58,0.2)]',
                          ].join(' ')}
                        />
                      ))}
                    </div>
                    <p className={`mt-1 text-[10px] ${strengthText[pwStrength]}`}>{pwLabel}</p>
                  </div>
                )}
              </div>

              <div>
                <Label required>Confirm Password</Label>
                <input
                  name="confirmPassword"
                  type="password"
                  placeholder="Repeat your password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                  className={inputClasses(focused.confirmPassword, fieldErrors.confirmPassword)}
                  onFocus={() => setFocused(prev => ({ ...prev, confirmPassword: true }))}
                  onBlur={() => setFocused(prev => ({ ...prev, confirmPassword: false }))}
                />
                {fieldErrors.confirmPassword ? (
                  <p className="mt-1.5 text-[11px] text-[#F87171]">{fieldErrors.confirmPassword}</p>
                ) : passwordsMatch ? (
                  <p className="mt-1.5 text-[11px] text-[#3EE07F]">✓ Passwords match</p>
                ) : null}
              </div>

              <div>
                <Label required>Role</Label>
                <div className="grid grid-cols-2 gap-3">
                  {ROLES.map(role => (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, role: role.value }))}
                      className={[
                        'rounded-xl p-3.5 text-left transition-all',
                        form.role === role.value ? 'ss-role-card ss-role-card-active' : 'ss-role-card',
                      ].join(' ')}
                    >
                      <div className={`mb-0.5 text-[12px] font-semibold ${form.role === role.value ? 'text-[#3EE07F]' : 'text-[#F0FAF4]'}`}>
                        {role.label}
                      </div>
                      <div className="text-[10px] leading-relaxed text-[#7BAF8E]">{role.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" className="ss-auth-btn-primary mt-1 w-full rounded-xl py-3.5 text-[14px] font-semibold tracking-wide transition-all">
                Next - Complete Profile →
              </button>

              <button
                type="button"
                onClick={() => {
                  if (validateStep1()) {
                    setStep(2)
                    setTimeout(() => document.querySelector('#submit-btn')?.click(), 50)
                  }
                }}
                className="ss-auth-btn-secondary w-full rounded-xl py-2.5 text-[13px] font-medium transition-all"
              >
                Skip optional fields & Register
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Bio</Label>
                <textarea
                  name="bio"
                  rows={3}
                  placeholder="Tell your team about yourself..."
                  value={form.bio}
                  onChange={handleChange}
                  className={`${inputClasses(focused.bio, false)} resize-none`}
                  onFocus={() => setFocused(prev => ({ ...prev, bio: true }))}
                  onBlur={() => setFocused(prev => ({ ...prev, bio: false }))}
                />
              </div>

              <div>
                <Label>Profile Picture URL</Label>
                <input
                  name="profile_picture_url"
                  type="url"
                  placeholder="https://example.com/avatar.jpg"
                  value={form.profile_picture_url}
                  onChange={handleChange}
                  className={inputClasses(focused.profile_picture_url, false)}
                  onFocus={() => setFocused(prev => ({ ...prev, profile_picture_url: true }))}
                  onBlur={() => setFocused(prev => ({ ...prev, profile_picture_url: false }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Hours / Week</Label>
                  <input
                    name="availability_hours_per_week"
                    type="number"
                    min="1"
                    max="80"
                    value={form.availability_hours_per_week}
                    onChange={handleChange}
                    className={inputClasses(focused.avail, false)}
                    onFocus={() => setFocused(prev => ({ ...prev, avail: true }))}
                    onBlur={() => setFocused(prev => ({ ...prev, avail: false }))}
                  />
                  <p className="mt-1 text-[10px] text-[rgba(123,175,142,0.5)]">Default: 40</p>
                </div>

                <div>
                  <Label>Capacity %</Label>
                  <input
                    name="current_capacity_percentage"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0 - 100"
                    value={form.current_capacity_percentage}
                    onChange={handleChange}
                    className={inputClasses(focused.cap, false)}
                    onFocus={() => setFocused(prev => ({ ...prev, cap: true }))}
                    onBlur={() => setFocused(prev => ({ ...prev, cap: false }))}
                  />
                </div>
              </div>

              <div>
                <Label>Skills</Label>
                <div className="ss-input-shell flex min-h-[48px] flex-wrap items-center gap-2 rounded-xl px-3 py-2 transition-colors">
                  {form.skills.map(skill => (
                    <span key={skill} className="ss-chip-selected inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium">
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="leading-none text-[rgba(62,224,127,0.6)] transition-colors hover:text-red-400"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                  <input
                    value={skillInput}
                    onChange={e => setSkillInput(e.target.value)}
                    onKeyDown={handleSkillKeyDown}
                    onFocus={() => setFocused(prev => ({ ...prev, skills: true }))}
                    onBlur={() => setFocused(prev => ({ ...prev, skills: false }))}
                    placeholder={form.skills.length === 0 ? 'Type a skill, press Enter...' : ''}
                    className="min-w-[120px] flex-1 bg-transparent py-1 text-[13px] text-[#F0FAF4] outline-none"
                  />
                </div>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  {SKILL_SUGGESTIONS.filter(skill => !form.skills.includes(skill)).slice(0, 8).map(skill => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => addSkill(skill)}
                      className="ss-chip rounded-full px-2.5 py-1 text-[10px] transition-all"
                    >
                      + {skill}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-[rgba(40,98,58,0.22)] bg-[rgba(40,98,58,0.12)] p-3.5">
                <div className="mb-2.5 text-[10px] uppercase tracking-[0.15em] text-[#7BAF8E]">Registering as</div>
                <div className="flex items-center gap-3">
                  <div className="ss-auth-logo-badge flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold">
                    {form.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-[#F0FAF4]">{form.username}</div>
                    <div className="text-[11px] text-[#7BAF8E]">
                      {form.email} · <span className="text-[#3EE07F]">{form.role === 'PROJECT_MANAGER' ? 'Project Manager' : 'Team Member'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="ss-auth-btn-secondary rounded-xl px-5 py-3 text-[13px] font-medium transition-all"
                >
                  ← Back
                </button>
                <button
                  id="submit-btn"
                  type="submit"
                  disabled={loading}
                  className="ss-auth-btn-primary flex-1 rounded-xl py-3 text-[14px] font-semibold transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-[rgba(240,250,244,0.3)] border-t-[#F0FAF4]" />
                      Creating account...
                    </span>
                  ) : 'Create Account →'}
                </button>
              </div>
            </form>
          )}

          <div className="my-6 flex items-center gap-3">
            <div className="ss-auth-divider h-px flex-1" />
            <span className="text-[11px] text-[rgba(123,175,142,0.4)]">HAVE AN ACCOUNT</span>
            <div className="ss-auth-divider h-px flex-1" />
          </div>

          <p className="text-center text-[13px] text-[#7BAF8E]">
            <Link to="/login" className="ss-auth-link font-semibold hover:underline">
              Sign in instead
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
