import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'

const API = 'http://localhost:3000'

const LEVEL_CFG = {
  BEGINNER: {
    text: 'text-[#7BAF8E]',
    bg: 'bg-[rgba(123,175,142,0.15)]',
    border: 'border-[rgba(123,175,142,0.28)]',
    fill: 'fill-[#7BAF8E]',
    pct: 25,
  },
  INTERMEDIATE: {
    text: 'text-[#60A5FA]',
    bg: 'bg-[rgba(96,165,250,0.15)]',
    border: 'border-[rgba(96,165,250,0.28)]',
    fill: 'fill-[#60A5FA]',
    pct: 50,
  },
  ADVANCED: {
    text: 'text-[#FBBF24]',
    bg: 'bg-[rgba(251,191,36,0.15)]',
    border: 'border-[rgba(251,191,36,0.28)]',
    fill: 'fill-[#FBBF24]',
    pct: 75,
  },
  EXPERT: {
    text: 'text-[#3EE07F]',
    bg: 'bg-[rgba(62,224,127,0.15)]',
    border: 'border-[rgba(62,224,127,0.28)]',
    fill: 'fill-[#3EE07F]',
    pct: 100,
  },
}

const REC_STATUS_CFG = {
  NOT_STARTED: {
    text: 'text-[#7BAF8E]',
    bg: 'bg-[rgba(123,175,142,0.12)]',
    border: 'border-[rgba(123,175,142,0.25)]',
    fill: 'fill-[#7BAF8E]',
    label: 'Not Started',
  },
  IN_PROGRESS: {
    text: 'text-[#60A5FA]',
    bg: 'bg-[rgba(96,165,250,0.12)]',
    border: 'border-[rgba(96,165,250,0.25)]',
    fill: 'fill-[#60A5FA]',
    label: 'In Progress',
  },
  COMPLETED: {
    text: 'text-[#3EE07F]',
    bg: 'bg-[rgba(62,224,127,0.12)]',
    border: 'border-[rgba(62,224,127,0.25)]',
    fill: 'fill-[#3EE07F]',
    label: 'Completed',
  },
}

const PRIORITY_CFG = {
  LOW: {
    text: 'text-[#7BAF8E]',
    bg: 'bg-[rgba(123,175,142,0.1)]',
    border: 'border-[rgba(123,175,142,0.2)]',
  },
  MEDIUM: {
    text: 'text-[#FBBF24]',
    bg: 'bg-[rgba(251,191,36,0.1)]',
    border: 'border-[rgba(251,191,36,0.2)]',
  },
  HIGH: {
    text: 'text-[#F87171]',
    bg: 'bg-[rgba(248,113,113,0.1)]',
    border: 'border-[rgba(248,113,113,0.2)]',
  },
}

const ACTIVITY_ICON = {
  TASK: '✓',
  PROJECT: '◫',
  SKILL: '◈',
  COMMENT: '💬',
  SYSTEM: '◎',
}

const BG = () => (
  <>
    <div className="ss-radial-upper fixed inset-0 pointer-events-none" />
    <div className="ss-grid-overlay fixed inset-0 pointer-events-none opacity-[0.035]" />
  </>
)

const Card = ({ children, className = '' }) => (
  <div className={`ss-card ss-card-line relative rounded-2xl p-6 ${className}`}>
    {children}
  </div>
)

const SectionTitle = ({ children, action }) => (
  <div className="mb-5 flex items-center justify-between">
    <h2 className="text-[15px] font-bold text-[#F0FAF4]">{children}</h2>
    {action}
  </div>
)

const Badge = ({ children, className = '' }) => (
  <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${className}`}>
    {children}
  </span>
)

const Btn = ({ children, onClick, variant = 'primary', disabled, small = false, type = 'button', className = '' }) => {
  const variantClass = {
    primary: 'ss-btn-primary',
    ghost: 'ss-btn-ghost',
    accent: 'ss-btn-accent',
    danger: 'ss-btn-danger',
  }[variant]

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${variantClass} rounded-xl font-semibold transition-all disabled:opacity-50 ${small ? 'px-3 py-1.5 text-[11px]' : 'px-5 py-2.5 text-[12px]'} ${className}`}
    >
      {children}
    </button>
  )
}

const Field = ({ label, value, onChange, type = 'text', placeholder, rows, min, max }) => {
  const Tag = rows ? 'textarea' : 'input'

  return (
    <div>
      {label && <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.15em] text-[#7BAF8E]">{label}</label>}
      <Tag
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        min={min}
        max={max}
        className={`ss-input-field w-full rounded-xl px-3.5 py-2.5 text-[13px] ${rows ? 'resize-none' : ''}`}
      />
    </div>
  )
}

const progressWidthClass = (percent) => `ss-w-${Math.max(0, Math.min(100, Math.round(Number(percent) || 0)))}`
const toBarFillClass = (fillClass) => fillClass.replace(/^fill-/, 'bg-')

const ProgressBar = ({ percent, fillClass }) => {
  return (
    <div className="h-full w-full">
      <div className={`ss-progress-fill ${toBarFillClass(fillClass)} ${progressWidthClass(percent)}`} />
    </div>
  )
}

const ActivityRow = ({ item, compact = false }) => (
  <div className={`rounded-xl border border-[rgba(40,98,58,0.3)] bg-[rgba(40,98,58,0.07)] transition-all hover:border-[rgba(62,224,127,0.2)] ${compact ? 'flex items-start gap-3 p-3' : 'mb-3 flex items-start gap-4 p-4'}`}>
    <div className={`shrink-0 rounded-xl bg-[rgba(40,98,58,0.25)] text-[#3EE07F] ${compact ? 'flex h-7 w-7 items-center justify-center text-[13px]' : 'flex h-9 w-9 items-center justify-center text-[15px]'}`}>
      {ACTIVITY_ICON[item.target_type] || '◎'}
    </div>
    <div className="min-w-0 flex-1">
      {compact ? (
        <>
          <div className="text-[12px] text-[rgba(240,250,244,0.8)]">
            <span className="font-medium">{item.action}</span> <span className="text-[#3EE07F]">{item.target}</span>
          </div>
          <div className="text-[10px] text-[rgba(123,175,142,0.5)]">
            {new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </div>
        </>
      ) : (
        <>
          <div className="text-[13px] text-[rgba(240,250,244,0.85)]">
            <span className="font-semibold">{item.action}</span> — <span className="text-[#3EE07F]">{item.target}</span>
          </div>
          <div className="mt-0.5 text-[11px] text-[rgba(123,175,142,0.5)]">
            {new Date(item.created_at).toLocaleString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </>
      )}
    </div>
  </div>
)

export default function PMProfile() {
  const navigate = useNavigate()
  const { userId } = useParams()
  const isViewingMember = !!userId

  const [profile, setProfile] = useState(null)
  const [metrics, setMetrics] = useState(null)
  const [activity, setActivity] = useState([])
  const [recs, setRecs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [editForm, setEditForm] = useState({
    bio: '',
    profile_picture_url: '',
    availability_hours_per_week: 40,
    current_capacity_percentage: 0,
  })
  const [skillModal, setSkillModal] = useState(false)
  const [skillForm, setSkillForm] = useState({ name: '', proficiency_level: 'BEGINNER' })
  const [skillErr, setSkillErr] = useState('')
  const [recModal, setRecModal] = useState(false)
  const [recForm, setRecForm] = useState({
    skill_name: '',
    current_level: 'NONE',
    target_level: 'BEGINNER',
    reason: '',
    course_name: '',
    course_url: '',
    priority: 'MEDIUM',
  })
  const [recSaving, setRecSaving] = useState(false)

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  useEffect(() => {
    fetchAll()
  }, [userId])

  const fetchAll = async () => {
    setLoading(true)
    try {
      if (isViewingMember) {
        const profileRes = await axios.get(`${API}/api/profile/${userId}`, { withCredentials: true })
        setProfile(profileRes.data.user)
        setRecs(profileRes.data.user.learning_recommendations || [])
      } else {
        const [profileRes, metricsRes, activityRes, recsRes] = await Promise.all([
          axios.get(`${API}/api/profile/me`, { withCredentials: true }),
          axios.get(`${API}/api/profile/metrics`, { withCredentials: true }),
          axios.get(`${API}/api/profile/activity?limit=20`, { withCredentials: true }),
          axios.get(`${API}/api/profile/recommendations`, { withCredentials: true }),
        ])

        setProfile(profileRes.data.user)
        setMetrics(metricsRes.data.metrics)
        setActivity(activityRes.data.activity || [])
        setRecs(recsRes.data.recommendations || [])
        setEditForm({
          bio: profileRes.data.user.bio || '',
          profile_picture_url: profileRes.data.user.profile_picture_url || '',
          availability_hours_per_week: profileRes.data.user.availability_hours_per_week || 40,
          current_capacity_percentage: profileRes.data.user.current_capacity_percentage || 0,
        })
      }
    } catch (err) {
      if (err.response?.status === 401) navigate('/login')
      else setError('Failed to load profile.')
    } finally {
      setLoading(false)
    }
  }

  const saveProfile = async () => {
    setSaving(true)
    try {
      const res = await axios.put(`${API}/api/profile/me`, editForm, { withCredentials: true })
      setProfile(res.data.user)
      setEditMode(false)
      showToast('✓ Profile updated')
    } catch (err) {
      showToast('⚠ Update failed')
    } finally {
      setSaving(false)
    }
  }

  const addSkill = async (e) => {
    e.preventDefault()
    setSkillErr('')
    try {
      await axios.post(`${API}/api/profile/skills`, skillForm, { withCredentials: true })
      setSkillModal(false)
      setSkillForm({ name: '', proficiency_level: 'BEGINNER' })
      fetchAll()
      showToast('✓ Skill added')
    } catch (err) {
      setSkillErr(err.response?.data?.message || 'Failed')
    }
  }

  const updateSkill = async (id, level) => {
    try {
      await axios.put(`${API}/api/profile/skills/${id}`, { proficiency_level: level }, { withCredentials: true })
      fetchAll()
    } catch (err) {
      console.error(err)
    }
  }

  const deleteSkill = async (id) => {
    if (!confirm('Remove this skill?')) return
    try {
      await axios.delete(`${API}/api/profile/skills/${id}`, { withCredentials: true })
      fetchAll()
      showToast('✓ Removed')
    } catch (err) {
      console.error(err)
    }
  }

  const addRecToMember = async (e) => {
    e.preventDefault()
    setRecSaving(true)
    try {
      const endpoint = isViewingMember
        ? `${API}/api/profile/${userId}/recommendations`
        : `${API}/api/profile/recommendations`
      await axios.post(endpoint, recForm, { withCredentials: true })
      setRecModal(false)
      setRecForm({
        skill_name: '',
        current_level: 'NONE',
        target_level: 'BEGINNER',
        reason: '',
        course_name: '',
        course_url: '',
        priority: 'MEDIUM',
      })
      fetchAll()
      showToast('✓ Recommendation sent')
    } catch (err) {
      showToast('⚠ Failed')
    } finally {
      setRecSaving(false)
    }
  }

  const renderRecommendationCard = (rec) => {
    const statusCfg = REC_STATUS_CFG[rec.status] || REC_STATUS_CFG.NOT_STARTED
    const priorityCfg = PRIORITY_CFG[rec.priority] || PRIORITY_CFG.LOW
    const progressPct = Number(rec.progress_pct || 0)

    return (
      <div
        key={rec._id}
        className="rounded-xl border border-[rgba(40,98,58,0.3)] bg-[rgba(40,98,58,0.1)] p-5 transition-all hover:border-[rgba(62,224,127,0.2)]"
      >
        <div className="mb-2 flex items-start justify-between gap-2">
          <span className="text-[14px] font-bold text-[#F0FAF4]">{rec.skill_name}</span>
          <div className="flex items-center gap-1.5">
            <Badge className={`${priorityCfg.text} ${priorityCfg.bg} ${priorityCfg.border}`}>{rec.priority}</Badge>
            <Badge className={`${statusCfg.text} ${statusCfg.bg} ${statusCfg.border}`}>{statusCfg.label}</Badge>
          </div>
        </div>

        <div className="mb-2 flex items-center gap-2 text-[11px] text-[#7BAF8E]">
          <span>{rec.current_level}</span>
          <span className="font-semibold text-[#3EE07F]">→</span>
          <span className="font-semibold text-[#3EE07F]">{rec.target_level}</span>
        </div>

        {(rec.course_name || rec.reason || rec.progress_pct || rec.last_updated_at) && (
          <div className="mb-3">
            <div className="mb-1 flex items-center justify-between text-[10px] text-[#7BAF8E]">
              <span>Progress</span>
              <span className={statusCfg.text}>{progressPct}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[rgba(40,98,58,0.2)]">
              <ProgressBar percent={progressPct} fillClass={statusCfg.fill} />
            </div>
            {rec.last_updated_at && (
              <div className="mt-1 text-[10px] text-[rgba(123,175,142,0.55)]">
                Updated {new Date(rec.last_updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            )}
          </div>
        )}

        {rec.course_name && (
          rec.course_url ? (
            <a href={rec.course_url} target="_blank" rel="noreferrer" className="mb-1 block text-[12px] font-medium text-[#3EE07F] hover:underline">
              📚 {rec.course_name}
            </a>
          ) : (
            <p className="mb-1 text-[12px] font-medium text-[#3EE07F]">📚 {rec.course_name}</p>
          )
        )}

        {rec.reason && <p className="text-[11px] text-[#7BAF8E]">{rec.reason}</p>}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="ss-bg-app min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="ss-spinner h-10 w-10 animate-spin rounded-full border-2" />
          <span className="text-[13px] text-[#7BAF8E]">Loading profile...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="ss-bg-app min-h-screen flex items-center justify-center">
        <div className="ss-card rounded-2xl border border-[rgba(239,68,68,0.2)] p-8 text-center">
          <p className="text-[#F87171]">{error}</p>
          <button onClick={fetchAll} className="ss-btn-primary mt-4 rounded-xl px-5 py-2 text-[13px] font-semibold">
            Retry
          </button>
        </div>
      </div>
    )
  }

  const ownTabs = ['overview', 'skills', 'learning', 'activity', 'metrics']
  const memberTabs = ['overview', 'skills', 'recommendations']
  const tabs = isViewingMember ? memberTabs : ownTabs

  const capacity = profile.current_capacity_percentage || 0
  const capacityFill = capacity >= 85 ? 'fill-[#F87171]' : capacity >= 65 ? 'fill-[#FBBF24]' : 'fill-[#3EE07F]'
  const roleBadgeClass = profile.role === 'PROJECT_MANAGER'
    ? 'border-[rgba(62,224,127,0.25)] bg-[rgba(62,224,127,0.1)] text-[#3EE07F]'
    : 'border-[rgba(96,165,250,0.25)] bg-[rgba(96,165,250,0.1)] text-[#60A5FA]'

  return (
    <div className="ss-bg-app min-h-screen font-sans">
      <BG />
      <div className="relative z-10 mx-auto max-w-[1050px] px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={() => navigate('/pm/dashboard')}
            className="text-[13px] font-medium text-[#7BAF8E] transition-colors hover:text-[#F0FAF4]"
          >
            ← Back to Dashboard
          </button>

          <div className="flex items-center gap-2 rounded-full border border-[rgba(62,224,127,0.2)] bg-[rgba(62,224,127,0.08)] px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#3EE07F]" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-[#3EE07F]">
              {isViewingMember ? 'Viewing Team Member' : 'Project Manager'}
            </span>
          </div>

          {toast && (
            <div
              className={[
                'rounded-full border px-4 py-2 text-[12px] font-semibold',
                toast.startsWith('✓')
                  ? 'border-[rgba(62,224,127,0.25)] bg-[rgba(62,224,127,0.12)] text-[#3EE07F]'
                  : 'border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.1)] text-[#F87171]',
              ].join(' ')}
            >
              {toast}
            </div>
          )}
        </div>

        <Card className="mb-6">
          <div className="flex flex-wrap items-start gap-6">
            <div className="relative shrink-0">
              <div
                className={[
                  'flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl text-[26px] font-bold text-[#0F2027]',
                  isViewingMember
                    ? 'bg-gradient-to-br from-[#1A3A5C] to-[#3B82F6] shadow-[0_0_0_3px_rgba(96,165,250,0.2)]'
                    : 'bg-gradient-to-br from-[#28623A] to-[#3EE07F] shadow-[0_0_0_3px_rgba(62,224,127,0.2)]',
                ].join(' ')}
              >
                {profile.profile_picture_url
                  ? <img src={profile.profile_picture_url} alt={profile.username} className="h-full w-full object-cover" />
                  : profile.username.slice(0, 2).toUpperCase()}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex flex-wrap items-center gap-3">
                <h1 className="text-[22px] font-bold text-[#F0FAF4]">{profile.username}</h1>
                <Badge className={roleBadgeClass}>
                  {profile.role === 'PROJECT_MANAGER' ? 'Project Manager' : 'Team Member'}
                </Badge>
              </div>
              <p className="mb-2 text-[13px] text-[#7BAF8E]">{profile.email}</p>
              {profile.bio ? (
                <p className="max-w-[480px] text-[13px] leading-relaxed text-[rgba(240,250,244,0.75)]">{profile.bio}</p>
              ) : (
                <p className="text-[13px] italic text-[rgba(123,175,142,0.4)]">
                  {isViewingMember ? 'No bio provided' : 'No bio yet — click Edit Profile'}
                </p>
              )}
            </div>

            <div className="flex shrink-0 flex-col items-end gap-3">
              {!isViewingMember ? (
                <Btn variant="ghost" onClick={() => setEditMode(prev => !prev)}>
                  {editMode ? '✕ Cancel' : '✎ Edit Profile'}
                </Btn>
              ) : (
                <Btn variant="accent" onClick={() => setRecModal(true)}>+ Add Recommendation</Btn>
              )}

              {isViewingMember && (
                <Btn variant="ghost" onClick={() => navigate(`/messages?user=${profile._id}`)}>Message Member</Btn>
              )}

              <div className="text-right">
                <div className="mb-1.5 text-[10px] uppercase tracking-widest text-[#7BAF8E]">Workload</div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-28 rounded-full bg-[rgba(40,98,58,0.25)]">
                    <ProgressBar percent={capacity} fillClass={capacityFill} />
                  </div>
                  <span className="text-[13px] font-bold text-[#3EE07F]">{capacity}%</span>
                </div>
                <p className="mt-1 text-[11px] text-[#7BAF8E]">{profile.availability_hours_per_week}h / week</p>
              </div>
            </div>
          </div>

          {editMode && !isViewingMember && (
            <div className="mt-6 space-y-4 border-t border-[rgba(40,98,58,0.2)] pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Field
                    label="Bio"
                    value={editForm.bio}
                    rows={3}
                    placeholder="Tell your team about yourself..."
                    onChange={e => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                  />
                </div>
                <Field
                  label="Profile Picture URL"
                  value={editForm.profile_picture_url}
                  placeholder="https://..."
                  onChange={e => setEditForm(prev => ({ ...prev, profile_picture_url: e.target.value }))}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Field
                    label="Hours / Week"
                    type="number"
                    min="1"
                    max="80"
                    value={editForm.availability_hours_per_week}
                    onChange={e => setEditForm(prev => ({ ...prev, availability_hours_per_week: Number(e.target.value) }))}
                  />
                  <Field
                    label="Capacity %"
                    type="number"
                    min="0"
                    max="100"
                    value={editForm.current_capacity_percentage}
                    onChange={e => setEditForm(prev => ({ ...prev, current_capacity_percentage: Number(e.target.value) }))}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Btn variant="ghost" onClick={() => setEditMode(false)}>Cancel</Btn>
                <Btn onClick={saveProfile} disabled={saving}>{saving ? 'Saving...' : 'Save Changes →'}</Btn>
              </div>
            </div>
          )}
        </Card>

        <div className="mb-6 grid grid-cols-4 gap-4">
          {[
            { label: 'Skills', value: profile.skills?.length || 0, icon: '◈', className: 'text-[#3EE07F]' },
            { label: 'Projects', value: profile.project_history?.length || 0, icon: '◫', className: 'text-[#60A5FA]' },
            { label: 'On-time Rate', value: !isViewingMember ? `${metrics?.on_time_delivery_rate || 0}%` : '—', icon: '◷', className: 'text-[#FBBF24]' },
            { label: 'Recs Sent', value: recs.length, icon: '📚', className: 'text-[#3EE07F]' },
          ].map(item => (
            <Card key={item.label} className="px-5 py-[18px]">
              <div className="mb-1.5 flex items-center justify-between">
                <span className={`text-[18px] ${item.className}`}>{item.icon}</span>
                <span className={`text-[22px] font-bold ${item.className}`}>{item.value}</span>
              </div>
              <div className="text-[11px] font-medium uppercase tracking-wide text-[#7BAF8E]">{item.label}</div>
            </Card>
          ))}
        </div>

        <div className="mb-6 flex gap-1 rounded-xl border border-[rgba(40,98,58,0.3)] bg-[rgba(15,32,39,0.6)] p-1">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={[
                'flex-1 rounded-lg border py-2 text-[12px] font-semibold capitalize transition-all',
                activeTab === tab
                  ? 'border-[rgba(62,224,127,0.2)] bg-gradient-to-br from-[#28623A] to-[#1A4D2E] text-[#F0FAF4]'
                  : 'border-transparent bg-transparent text-[#7BAF8E]',
              ].join(' ')}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <SectionTitle action={<button onClick={() => setActiveTab('skills')} className="text-[11px] font-semibold text-[#3EE07F] hover:underline">View all →</button>}>
                Skill Profile
              </SectionTitle>
              {!profile.skills?.length ? (
                <p className="text-[13px] text-[#7BAF8E]">No skills added yet.</p>
              ) : (
                profile.skills.slice(0, 5).map(skill => {
                  const cfg = LEVEL_CFG[skill.proficiency_level]
                  return (
                    <div key={skill._id} className="mb-3">
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-[13px] font-medium text-[#F0FAF4]">{skill.name}</span>
                        <div className="flex items-center gap-1.5">
                          {skill.verified && <Badge className="border-[rgba(62,224,127,0.2)] bg-[rgba(62,224,127,0.1)] text-[#3EE07F]">✓ Verified</Badge>}
                          <Badge className={`${cfg.text} ${cfg.bg} ${cfg.border}`}>{skill.proficiency_level}</Badge>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full bg-[rgba(40,98,58,0.2)]">
                        <ProgressBar percent={cfg.pct} fillClass={cfg.fill} />
                      </div>
                    </div>
                  )
                })
              )}
            </Card>

            <Card>
              <SectionTitle>Project History</SectionTitle>
              {!profile.project_history?.length ? (
                <p className="text-[13px] text-[#7BAF8E]">No projects yet.</p>
              ) : (
                profile.project_history.slice(0, 5).map((projectHistory, index) => (
                  <div key={index} className="mb-2 flex items-center gap-3 rounded-xl border border-[rgba(40,98,58,0.3)] bg-[rgba(40,98,58,0.1)] p-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[rgba(40,98,58,0.3)] text-[11px] font-bold text-[#3EE07F]">
                      {(projectHistory.project_id?.name || 'P')[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12px] font-semibold text-[#F0FAF4]">{projectHistory.project_id?.name || 'Project'}</div>
                      <div className="text-[10px] text-[#7BAF8E]">{projectHistory.role_in_project}</div>
                    </div>
                    <Badge className={projectHistory.status === 'COMPLETED'
                      ? 'border-[rgba(62,224,127,0.2)] bg-[rgba(62,224,127,0.1)] text-[#3EE07F]'
                      : 'border-[rgba(96,165,250,0.2)] bg-[rgba(96,165,250,0.1)] text-[#60A5FA]'}>
                      {projectHistory.status}
                    </Badge>
                  </div>
                ))
              )}
            </Card>

            {!isViewingMember && (
              <>
                <Card>
                  <SectionTitle action={<button onClick={() => setActiveTab('activity')} className="text-[11px] font-semibold text-[#3EE07F] hover:underline">View all →</button>}>
                    Recent Activity
                  </SectionTitle>
                  {!activity.length ? (
                    <p className="text-[13px] text-[#7BAF8E]">No activity yet.</p>
                  ) : (
                    activity.slice(0, 4).map((item, index) => <ActivityRow key={index} item={item} compact />)
                  )}
                </Card>

                <Card>
                  <SectionTitle>Performance Overview</SectionTitle>
                  {metrics && (
                    <div className="space-y-4">
                      {[
                        { label: 'On-time Delivery', value: metrics.on_time_delivery_rate || 0, className: 'text-[#3EE07F]', fill: 'fill-[#3EE07F]' },
                        { label: 'Collaboration', value: metrics.collaboration_score || 0, className: 'text-[#60A5FA]', fill: 'fill-[#60A5FA]' },
                      ].map(item => (
                        <div key={item.label}>
                          <div className="mb-1.5 flex justify-between">
                            <span className="text-[12px] text-[#F0FAF4]">{item.label}</span>
                            <span className={`text-[14px] font-bold ${item.className}`}>{item.value}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-[rgba(40,98,58,0.2)]">
                            <ProgressBar percent={item.value} fillClass={item.fill} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </>
            )}
          </div>
        )}

        {activeTab === 'skills' && (
          <Card>
            <SectionTitle action={!isViewingMember && <Btn small onClick={() => setSkillModal(true)}>+ Add Skill</Btn>}>
              {isViewingMember ? `${profile.username}'s Skills` : 'My Skills'}
            </SectionTitle>

            {!profile.skills?.length ? (
              <div className="py-10 text-center">
                <div className="mb-3 text-[36px]">◈</div>
                <p className="text-[13px] text-[#7BAF8E]">No skills added yet</p>
                {!isViewingMember && <Btn small onClick={() => setSkillModal(true)} className="mt-3">Add Skill</Btn>}
              </div>
            ) : (
              profile.skills.map(skill => {
                const cfg = LEVEL_CFG[skill.proficiency_level]
                return (
                  <div key={skill._id} className="mb-3 flex items-center gap-4 rounded-xl border border-[rgba(40,98,58,0.3)] bg-[rgba(40,98,58,0.08)] p-4 transition-all hover:border-[rgba(62,224,127,0.2)]">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[14px] font-bold ${cfg.bg} ${cfg.text}`}>
                      {skill.name[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-[14px] font-semibold text-[#F0FAF4]">{skill.name}</span>
                        {skill.verified && <Badge className="border-[rgba(62,224,127,0.2)] bg-[rgba(62,224,127,0.1)] text-[#3EE07F]">✓ Verified</Badge>}
                      </div>
                      <div className="h-1.5 w-32 rounded-full bg-[rgba(40,98,58,0.25)]">
                        <ProgressBar percent={cfg.pct} fillClass={cfg.fill} />
                      </div>
                    </div>

                    {isViewingMember ? (
                      <Badge className={`${cfg.text} ${cfg.bg} ${cfg.border}`}>{skill.proficiency_level}</Badge>
                    ) : (
                      <>
                        <select
                          value={skill.proficiency_level}
                          onChange={e => updateSkill(skill._id, e.target.value)}
                          className={`rounded-lg border px-3 py-1.5 text-[11px] font-semibold outline-none ${cfg.bg} ${cfg.text} ${cfg.border}`}
                        >
                          {['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'].map(level => <option key={level} value={level}>{level}</option>)}
                        </select>
                        <button
                          onClick={() => deleteSkill(skill._id)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-[12px] text-[rgba(123,175,142,0.4)] transition-all hover:bg-[rgba(248,113,113,0.1)] hover:text-[#F87171]"
                        >
                          ✕
                        </button>
                      </>
                    )}
                  </div>
                )
              })
            )}
          </Card>
        )}

        {activeTab === 'recommendations' && isViewingMember && (
          <Card>
            <SectionTitle action={<Btn small variant="accent" onClick={() => setRecModal(true)}>+ Add Recommendation</Btn>}>
              Learning Recommendations for {profile.username}
            </SectionTitle>

            {!recs.length ? (
              <div className="py-10 text-center">
                <div className="mb-3 text-[36px]">📚</div>
                <p className="mb-4 text-[13px] text-[#7BAF8E]">No recommendations yet — add one for this team member</p>
                <Btn variant="accent" onClick={() => setRecModal(true)}>Add First Recommendation →</Btn>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {recs.map(renderRecommendationCard)}
              </div>
            )}
          </Card>
        )}

        {activeTab === 'learning' && !isViewingMember && (
          <Card>
            <SectionTitle>My Learning Goals</SectionTitle>
            {!recs.length ? (
              <p className="text-[13px] text-[#7BAF8E]">No recommendations yet.</p>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {recs.map(renderRecommendationCard)}
              </div>
            )}
          </Card>
        )}

        {activeTab === 'activity' && !isViewingMember && (
          <Card>
            <SectionTitle>Activity Feed</SectionTitle>
            {!activity.length ? (
              <p className="text-[13px] text-[#7BAF8E]">No activity yet.</p>
            ) : (
              activity.map((item, index) => <ActivityRow key={index} item={item} />)
            )}
          </Card>
        )}

        {activeTab === 'metrics' && !isViewingMember && (
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <SectionTitle>Performance Metrics</SectionTitle>
              {metrics && (
                <div className="space-y-5">
                  {[
                    { label: 'On-time Delivery', value: metrics.on_time_delivery_rate || 0, className: 'text-[#3EE07F]', fill: 'fill-[#3EE07F]' },
                    { label: 'Collaboration', value: metrics.collaboration_score || 0, className: 'text-[#60A5FA]', fill: 'fill-[#60A5FA]' },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="mb-2 flex justify-between">
                        <span className="text-[13px] font-medium text-[#F0FAF4]">{item.label}</span>
                        <span className={`text-[18px] font-bold ${item.className}`}>{item.value}%</span>
                      </div>
                      <div className="h-3 rounded-full bg-[rgba(40,98,58,0.2)]">
                        <ProgressBar percent={item.value} fillClass={item.fill} />
                      </div>
                    </div>
                  ))}

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Completed', value: metrics.tasks_completed || 0, className: 'text-[#3EE07F]' },
                      { label: 'Overdue', value: metrics.tasks_overdue || 0, className: 'text-[#F87171]' },
                    ].map(item => (
                      <div key={item.label} className="rounded-xl border border-[rgba(40,98,58,0.3)] bg-[rgba(40,98,58,0.1)] p-4 text-center">
                        <div className={`text-[28px] font-bold ${item.className}`}>{item.value}</div>
                        <div className="mt-1 text-[11px] uppercase tracking-wide text-[#7BAF8E]">{item.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            <Card>
              <SectionTitle>Skill Coverage</SectionTitle>
              {profile.skills?.length ? (
                Object.entries(
                  profile.skills.reduce((acc, skill) => {
                    acc[skill.proficiency_level] = (acc[skill.proficiency_level] || 0) + 1
                    return acc
                  }, {})
                ).map(([level, count]) => {
                  const cfg = LEVEL_CFG[level]
                  return (
                    <div key={level} className="mb-3 flex items-center gap-4">
                      <div className={`w-24 shrink-0 text-[11px] font-semibold ${cfg.text}`}>{level}</div>
                      <div className="h-2 flex-1 rounded-full bg-[rgba(40,98,58,0.2)]">
                        <ProgressBar percent={(count / profile.skills.length) * 100} fillClass={cfg.fill} />
                      </div>
                      <span className={`w-5 text-right text-[12px] font-bold ${cfg.text}`}>{count}</span>
                    </div>
                  )
                })
              ) : (
                <p className="text-[13px] text-[#7BAF8E]">No skills yet.</p>
              )}
            </Card>
          </div>
        )}
      </div>

      {skillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,26,18,0.85)] px-4 backdrop-blur-[6px]">
          <div className="ss-card-heavy ss-card-line relative w-full max-w-[400px] rounded-2xl p-7">
            <h3 className="mb-1 text-[17px] font-bold text-[#F0FAF4]">Add Skill</h3>
            <p className="mb-5 text-[12px] text-[#7BAF8E]">Add to your skill profile</p>
            {skillErr && <div className="ss-error-box mb-4 rounded-xl px-3 py-2.5 text-[12px]">{skillErr}</div>}
            <form onSubmit={addSkill} className="space-y-4">
              <Field
                label="Skill Name *"
                value={skillForm.name}
                placeholder="e.g. React, AWS"
                onChange={e => setSkillForm(prev => ({ ...prev, name: e.target.value }))}
              />
              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-[#7BAF8E]">Proficiency *</label>
                <div className="grid grid-cols-2 gap-2">
                  {['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'].map(level => {
                    const cfg = LEVEL_CFG[level]
                    const active = skillForm.proficiency_level === level
                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setSkillForm(prev => ({ ...prev, proficiency_level: level }))}
                        className={[
                          'rounded-xl py-2.5 text-[11px] font-semibold transition-all border',
                          active ? `${cfg.bg} ${cfg.text} ${cfg.border}` : 'border-[rgba(40,98,58,0.3)] bg-[rgba(15,32,39,0.6)] text-[#7BAF8E]',
                        ].join(' ')}
                      >
                        {level}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <Btn variant="ghost" onClick={() => setSkillModal(false)}>Cancel</Btn>
                <button
                  type="submit"
                  disabled={!skillForm.name}
                  className="ss-btn-primary flex-1 rounded-xl py-2.5 text-[12px] font-semibold disabled:opacity-50"
                >
                  Add Skill →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {recModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,26,18,0.85)] px-4 backdrop-blur-[6px]">
          <div className="ss-card-heavy ss-card-line relative max-h-[90vh] w-full max-w-[460px] overflow-y-auto rounded-2xl p-7">
            <h3 className="mb-1 text-[17px] font-bold text-[#F0FAF4]">
              {isViewingMember ? `Add Recommendation for ${profile.username}` : 'Add Learning Goal'}
            </h3>
            <p className="mb-5 text-[12px] text-[#7BAF8E]">
              {isViewingMember ? "This will appear in the member's learning dashboard" : 'Track a skill you want to develop'}
            </p>
            <form onSubmit={addRecToMember} className="space-y-4">
              <Field
                label="Skill Name *"
                value={recForm.skill_name}
                placeholder="e.g. MongoDB, Docker"
                onChange={e => setRecForm(prev => ({ ...prev, skill_name: e.target.value }))}
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.15em] text-[#7BAF8E]">Current Level</label>
                  <select
                    value={recForm.current_level}
                    onChange={e => setRecForm(prev => ({ ...prev, current_level: e.target.value }))}
                    className="ss-input-field w-full rounded-xl px-3 py-2.5 text-[13px]"
                  >
                    {['NONE', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'].map(level => <option key={level} value={level}>{level}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.15em] text-[#7BAF8E]">Target Level *</label>
                  <select
                    value={recForm.target_level}
                    onChange={e => setRecForm(prev => ({ ...prev, target_level: e.target.value }))}
                    className="ss-input-field w-full rounded-xl px-3 py-2.5 text-[13px]"
                  >
                    {['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'].map(level => <option key={level} value={level}>{level}</option>)}
                  </select>
                </div>
              </div>
              <Field
                label="Course Name"
                value={recForm.course_name}
                placeholder="e.g. MongoDB University M001"
                onChange={e => setRecForm(prev => ({ ...prev, course_name: e.target.value }))}
              />
              <Field
                label="Course URL"
                value={recForm.course_url}
                placeholder="https://..."
                onChange={e => setRecForm(prev => ({ ...prev, course_url: e.target.value }))}
              />
              <Field
                label="Reason"
                value={recForm.reason}
                rows={2}
                placeholder="Why this skill?"
                onChange={e => setRecForm(prev => ({ ...prev, reason: e.target.value }))}
              />
              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-[#7BAF8E]">Priority</label>
                <div className="flex gap-2">
                  {['LOW', 'MEDIUM', 'HIGH'].map(priority => {
                    const cfg = PRIORITY_CFG[priority]
                    const active = recForm.priority === priority
                    return (
                      <button
                        key={priority}
                        type="button"
                        onClick={() => setRecForm(prev => ({ ...prev, priority }))}
                        className={[
                          'flex-1 rounded-xl border py-2 text-[11px] font-semibold transition-all',
                          active ? `${cfg.bg} ${cfg.text} ${cfg.border}` : 'border-[rgba(40,98,58,0.3)] bg-[rgba(15,32,39,0.6)] text-[#7BAF8E]',
                        ].join(' ')}
                      >
                        {priority}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <Btn variant="ghost" onClick={() => setRecModal(false)}>Cancel</Btn>
                <button
                  type="submit"
                  disabled={recSaving || !recForm.skill_name}
                  className="ss-btn-primary flex-1 rounded-xl py-2.5 text-[12px] font-semibold disabled:opacity-50"
                >
                  {recSaving ? 'Sending...' : 'Send Recommendation →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
