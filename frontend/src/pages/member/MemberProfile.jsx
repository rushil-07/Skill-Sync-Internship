import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const API = 'http://localhost:3000'

const LEVEL_CFG = {
  BEGINNER: { text: 'text-[#7BAF8E]', bg: 'bg-[rgba(123,175,142,0.15)]', border: 'border-[rgba(123,175,142,0.25)]', fill: 'fill-[#7BAF8E]', pct: 25 },
  INTERMEDIATE: { text: 'text-[#60A5FA]', bg: 'bg-[rgba(96,165,250,0.15)]', border: 'border-[rgba(96,165,250,0.25)]', fill: 'fill-[#60A5FA]', pct: 50 },
  ADVANCED: { text: 'text-[#FBBF24]', bg: 'bg-[rgba(251,191,36,0.15)]', border: 'border-[rgba(251,191,36,0.25)]', fill: 'fill-[#FBBF24]', pct: 75 },
  EXPERT: { text: 'text-[#3EE07F]', bg: 'bg-[rgba(62,224,127,0.15)]', border: 'border-[rgba(62,224,127,0.25)]', fill: 'fill-[#3EE07F]', pct: 100 },
}

const REC_STATUS_CFG = {
  NOT_STARTED: { text: 'text-[#7BAF8E]', bg: 'bg-[rgba(123,175,142,0.12)]', border: 'border-[rgba(123,175,142,0.25)]', fill: 'fill-[#7BAF8E]', label: 'Not Started' },
  IN_PROGRESS: { text: 'text-[#60A5FA]', bg: 'bg-[rgba(96,165,250,0.12)]', border: 'border-[rgba(96,165,250,0.25)]', fill: 'fill-[#60A5FA]', label: 'In Progress' },
  COMPLETED: { text: 'text-[#3EE07F]', bg: 'bg-[rgba(62,224,127,0.12)]', border: 'border-[rgba(62,224,127,0.25)]', fill: 'fill-[#3EE07F]', label: 'Completed' },
}

const ACT_ICON = {
  TASK: '✓',
  PROJECT: '◫',
  SKILL: '◈',
  COMMENT: '💬',
  SYSTEM: '⬡',
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

const Field = ({ label, name, value, onChange, type = 'text', placeholder, rows, min, max }) => {
  const Tag = rows ? 'textarea' : 'input'
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.15em] text-[#7BAF8E]">{label}</label>
      <Tag
        name={name}
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
      {ACT_ICON[item.target_type] || '◉'}
    </div>
    <div className="min-w-0 flex-1">
      {compact ? (
        <>
          <div className="text-[12px] text-[rgba(240,250,244,0.8)]">
            <span className="font-medium">{item.action}</span> <span className="text-[#3EE07F]">{item.target}</span>
          </div>
          <div className="text-[10px] text-[rgba(123,175,142,0.5)]">
            {new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </div>
        </>
      ) : (
        <>
          <div className="text-[13px] text-[rgba(240,250,244,0.85)]">
            <span className="font-semibold">{item.action}</span> — <span className="text-[#3EE07F]">{item.target}</span>
          </div>
          <div className="mt-0.5 text-[11px] text-[rgba(123,175,142,0.5)]">
            {item.target_type} · {new Date(item.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
        </>
      )}
    </div>
    {!compact && <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#3EE07F]" />}
  </div>
)

export default function MemberProfile() {
  const navigate = useNavigate()
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

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
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
    } catch (err) {
      if (err.response?.status === 401) navigate('/login')
      else setError('Failed to load profile. Please refresh.')
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
      showToast(`⚠ ${err.response?.data?.message || 'Update failed'}`)
    } finally {
      setSaving(false)
    }
  }

  const addSkill = async (e) => {
    e.preventDefault()
    setSkillErr('')
    try {
      await axios.post(
        `${API}/api/skills/profile/add`,
        { skill_name: skillForm.name, proficiency_level: skillForm.proficiency_level },
        { withCredentials: true }
      )
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
      await axios.put(`${API}/api/skills/profile/${id}`, { proficiency_level: level }, { withCredentials: true })
      fetchAll()
    } catch (err) {
      console.error(err)
    }
  }

  const deleteSkill = async (id) => {
    if (!confirm('Remove this skill?')) return
    try {
      await axios.delete(`${API}/api/skills/profile/${id}`, { withCredentials: true })
      fetchAll()
      showToast('✓ Skill removed')
    } catch (err) {
      console.error(err)
    }
  }

  const addRec = async (e) => {
    e.preventDefault()
    try {
      await axios.post(`${API}/api/profile/recommendations`, recForm, { withCredentials: true })
      setRecModal(false)
      fetchAll()
      showToast('✓ Recommendation added')
    } catch (err) {
      console.error(err)
    }
  }

  const deleteRec = async (id) => {
    try {
      await axios.delete(`${API}/api/profile/recommendations/${id}`, { withCredentials: true })
      setRecs(prev => prev.filter(rec => rec._id !== id))
      showToast('✓ Removed')
    } catch (err) {
      console.error(err)
    }
  }

  const updateRecProgress = async (rec, patch) => {
    try {
      const res = await axios.put(`${API}/api/profile/recommendations/${rec._id}`, patch, { withCredentials: true })
      setRecs(prev => prev.map(item => item._id === rec._id ? res.data.recommendation : item))
      showToast('✓ Progress updated')
    } catch (err) {
      showToast(`⚠ ${err.response?.data?.message || 'Failed to update progress'}`)
    }
  }

  if (loading) {
    return (
      <div className="ss-bg-app min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="ss-spinner h-10 w-10 animate-spin rounded-full border-2" />
          <span className="text-[13px] text-[#7BAF8E]">Loading your profile...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="ss-bg-app min-h-screen flex items-center justify-center">
        <div className="ss-card rounded-2xl p-8 text-center border border-[rgba(239,68,68,0.2)]">
          <div className="mb-3 text-[32px]">⚠</div>
          <p className="text-[#F87171]">{error}</p>
          <button onClick={fetchAll} className="ss-btn-primary mt-4 rounded-xl px-5 py-2 text-[13px] font-semibold">
            Retry
          </button>
        </div>
      </div>
    )
  }

  const tabs = ['overview', 'skills', 'learning', 'activity', 'metrics']
  const capacity = profile.current_capacity_percentage || 0
  const capacityFill = capacity >= 85 ? 'fill-[#F87171]' : capacity >= 65 ? 'fill-[#FBBF24]' : 'fill-[#3EE07F]'

  return (
    <div className="ss-bg-app min-h-screen font-sans">
      <BG />
      <div className="relative z-10 mx-auto max-w-[1050px] px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="text-[13px] font-medium text-[#7BAF8E] transition-colors hover:text-[#F0FAF4]"
          >
            ← Back to Dashboard
          </button>

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
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#28623A] to-[#3EE07F] text-[26px] font-bold text-[#0F2027] shadow-[0_0_0_3px_rgba(62,224,127,0.2)]">
                {profile.profile_picture_url
                  ? <img src={profile.profile_picture_url} alt={profile.username} className="h-full w-full object-cover" />
                  : profile.username.slice(0, 2).toUpperCase()}
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-[#0F2027] bg-[#3EE07F]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0F2027]" />
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex flex-wrap items-center gap-3">
                <h1 className="text-[22px] font-bold text-[#F0FAF4]">{profile.username}</h1>
                <Badge className="border-[rgba(123,175,142,0.25)] bg-[rgba(123,175,142,0.12)] text-[#7BAF8E]">Team Member</Badge>
              </div>
              <p className="mb-3 text-[13px] text-[#7BAF8E]">{profile.email}</p>
              {profile.bio ? (
                <p className="max-w-[480px] text-[13px] leading-relaxed text-[rgba(240,250,244,0.75)]">{profile.bio}</p>
              ) : (
                <p className="text-[13px] italic text-[rgba(123,175,142,0.4)]">No bio yet — click Edit Profile to add one</p>
              )}
              {profile.created_at && (
                <p className="mt-2 text-[11px] text-[rgba(123,175,142,0.5)]">
                  Member since {new Date(profile.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
            </div>

            <div className="shrink-0 flex flex-col items-end gap-4">
              <Btn onClick={() => setEditMode(prev => !prev)} variant="ghost">
                {editMode ? '✕ Cancel' : '✎ Edit Profile'}
              </Btn>
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

          {editMode && (
            <div className="mt-6 space-y-4 border-t border-[rgba(40,98,58,0.2)] pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Field
                    label="Bio"
                    name="bio"
                    value={editForm.bio}
                    rows={3}
                    placeholder="Tell your team about yourself..."
                    onChange={e => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                  />
                </div>
                <Field
                  label="Profile Picture URL"
                  name="profile_picture_url"
                  value={editForm.profile_picture_url}
                  placeholder="https://example.com/avatar.jpg"
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
            { label: 'On-time Rate', value: `${metrics?.on_time_delivery_rate || 0}%`, icon: '◷', className: 'text-[#FBBF24]' },
            { label: 'Collab Score', value: `${metrics?.collaboration_score || 0}`, icon: '⬡', className: 'text-[#3EE07F]' },
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
                'flex-1 rounded-lg py-2 text-[12px] font-semibold capitalize transition-all border',
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
              ) : profile.skills.slice(0, 5).map(skill => {
                const cfg = LEVEL_CFG[skill.proficiency_level]
                return (
                  <div key={skill._id} className="mb-3">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-[13px] font-medium text-[#F0FAF4]">{skill.skill_name || skill.name}</span>
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
              })}
            </Card>

            <Card>
              <SectionTitle>Project History</SectionTitle>
              {!profile.project_history?.length ? (
                <p className="text-[13px] text-[#7BAF8E]">No projects yet.</p>
              ) : profile.project_history.slice(0, 5).map((projectHistory, index) => (
                <div key={index} className="mb-2 flex items-center gap-3 rounded-xl border border-[rgba(40,98,58,0.3)] bg-[rgba(40,98,58,0.1)] p-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[rgba(40,98,58,0.3)] text-[11px] font-bold text-[#3EE07F]">
                    {(projectHistory.project_id?.name || 'P')[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12px] font-semibold text-[#F0FAF4]">{projectHistory.project_id?.name || 'Project'}</div>
                    <div className="text-[10px] text-[#7BAF8E]">{projectHistory.role_in_project}</div>
                  </div>
                  <Badge className={projectHistory.status === 'COMPLETED' ? 'border-[rgba(62,224,127,0.2)] bg-[rgba(62,224,127,0.1)] text-[#3EE07F]' : 'border-[rgba(96,165,250,0.2)] bg-[rgba(96,165,250,0.1)] text-[#60A5FA]'}>
                    {projectHistory.status}
                  </Badge>
                </div>
              ))}
            </Card>

            <Card>
              <SectionTitle action={<button onClick={() => setActiveTab('activity')} className="text-[11px] font-semibold text-[#3EE07F] hover:underline">View all →</button>}>
                Recent Activity
              </SectionTitle>
              {!activity.length ? (
                <p className="text-[13px] text-[#7BAF8E]">No activity yet.</p>
              ) : (
                activity.slice(0, 5).map((item, index) => <ActivityRow key={index} item={item} compact />)
              )}
            </Card>

            <Card>
              <SectionTitle action={<button onClick={() => setActiveTab('learning')} className="text-[11px] font-semibold text-[#3EE07F] hover:underline">View all →</button>}>
                Learning Goals
              </SectionTitle>
              {!recs.length ? (
                <p className="text-[13px] text-[#7BAF8E]">No recommendations yet.</p>
              ) : recs.slice(0, 3).map(rec => {
                const statusCfg = REC_STATUS_CFG[rec.status] || REC_STATUS_CFG.NOT_STARTED
                return (
                  <div key={rec._id} className="mb-2 rounded-xl border border-[rgba(40,98,58,0.3)] bg-[rgba(40,98,58,0.1)] p-3">
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <span className="text-[12px] font-semibold text-[#F0FAF4]">{rec.skill_name}</span>
                      <div className="flex items-center gap-1.5">
                        <Badge className={rec.priority === 'HIGH' ? 'border-[rgba(248,113,113,0.2)] bg-[rgba(248,113,113,0.1)] text-[#F87171]' : rec.priority === 'MEDIUM' ? 'border-[rgba(251,191,36,0.2)] bg-[rgba(251,191,36,0.1)] text-[#FBBF24]' : 'border-[rgba(123,175,142,0.2)] bg-[rgba(123,175,142,0.1)] text-[#7BAF8E]'}>
                          {rec.priority}
                        </Badge>
                        <Badge className={`${statusCfg.text} ${statusCfg.bg} ${statusCfg.border}`}>{statusCfg.label}</Badge>
                      </div>
                    </div>
                    {rec.course_name && <div className="text-[11px] text-[#3EE07F]">📚 {rec.course_name}</div>}
                  </div>
                )
              })}
            </Card>
          </div>
        )}

        {activeTab === 'skills' && (
          <Card>
            <SectionTitle action={<Btn small onClick={() => setSkillModal(true)}>+ Add Skill</Btn>}>My Skills</SectionTitle>
            {!profile.skills?.length ? (
              <div className="py-12 text-center">
                <div className="mb-3 text-[40px]">◈</div>
                <p className="mb-1 text-[14px] font-medium text-[#F0FAF4]">No skills added yet</p>
                <p className="mb-5 text-[12px] text-[#7BAF8E]">Add skills to get matched with the right projects</p>
                <Btn onClick={() => setSkillModal(true)}>Add First Skill →</Btn>
              </div>
            ) : profile.skills.map(skill => {
              const cfg = LEVEL_CFG[skill.proficiency_level]
              return (
                <div
                  key={skill._id}
                  className="mb-3 flex items-center gap-4 rounded-xl border border-[rgba(40,98,58,0.3)] bg-[rgba(40,98,58,0.08)] p-4 transition-all hover:border-[rgba(62,224,127,0.2)]"
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[14px] font-bold ${cfg.bg} ${cfg.text}`}>
                    {(skill.skill_name || skill.name || '?')[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-[14px] font-semibold text-[#F0FAF4]">{skill.skill_name || skill.name}</span>
                      {skill.verified && <Badge className="border-[rgba(62,224,127,0.2)] bg-[rgba(62,224,127,0.1)] text-[#3EE07F]">✓ Verified</Badge>}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-32 rounded-full bg-[rgba(40,98,58,0.25)]">
                        <ProgressBar percent={cfg.pct} fillClass={cfg.fill} />
                      </div>
                      <span className="text-[10px] text-[#7BAF8E]">
                        {skill.last_used ? new Date(skill.last_used).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'Not recorded'}
                      </span>
                    </div>
                  </div>
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
                </div>
              )
            })}
          </Card>
        )}

        {activeTab === 'learning' && (
          <Card>
            <SectionTitle action={<Btn small onClick={() => setRecModal(true)}>+ Add Goal</Btn>}>Learning Recommendations</SectionTitle>
            {!recs.length ? (
              <div className="py-12 text-center">
                <div className="mb-3 text-[40px]">📚</div>
                <p className="mb-1 text-[14px] font-medium text-[#F0FAF4]">No recommendations yet</p>
                <p className="text-[12px] text-[#7BAF8E]">Your PM will add suggestions, or add your own learning goals</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {recs.map(rec => {
                  const statusCfg = REC_STATUS_CFG[rec.status] || REC_STATUS_CFG.NOT_STARTED
                  const progressPct = Number(rec.progress_pct || 0)

                  return (
                    <div
                      key={rec._id}
                      className="group relative rounded-xl border border-[rgba(40,98,58,0.3)] bg-[rgba(40,98,58,0.1)] p-5 transition-all hover:border-[rgba(62,224,127,0.25)]"
                    >
                      <button
                        onClick={() => deleteRec(rec._id)}
                        className="absolute right-3 top-3 hidden h-6 w-6 items-center justify-center rounded-lg bg-[rgba(248,113,113,0.1)] text-[11px] text-[#F87171] group-hover:flex"
                      >
                        ✕
                      </button>
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <span className="text-[14px] font-bold text-[#F0FAF4]">{rec.skill_name}</span>
                        <div className="flex items-center gap-1.5">
                          <Badge className={rec.priority === 'HIGH' ? 'border-[rgba(248,113,113,0.2)] bg-[rgba(248,113,113,0.1)] text-[#F87171]' : rec.priority === 'MEDIUM' ? 'border-[rgba(251,191,36,0.2)] bg-[rgba(251,191,36,0.1)] text-[#FBBF24]' : 'border-[rgba(123,175,142,0.2)] bg-[rgba(123,175,142,0.1)] text-[#7BAF8E]'}>
                            {rec.priority}
                          </Badge>
                          <Badge className={`${statusCfg.text} ${statusCfg.bg} ${statusCfg.border}`}>{statusCfg.label}</Badge>
                        </div>
                      </div>
                      <div className="mb-3 flex items-center gap-2 text-[11px] text-[#7BAF8E]">
                        <span>{rec.current_level}</span>
                        <span className="text-[#3EE07F]">→</span>
                        <span className="font-semibold text-[#3EE07F]">{rec.target_level}</span>
                      </div>
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
                      {rec.course_name && (
                        rec.course_url
                          ? <a href={rec.course_url} target="_blank" rel="noreferrer" className="mb-1 block text-[12px] font-medium text-[#3EE07F] hover:underline">📚 {rec.course_name}</a>
                          : <p className="mb-1 text-[12px] font-medium text-[#3EE07F]">📚 {rec.course_name}</p>
                      )}
                      {rec.reason && <p className="text-[11px] text-[#7BAF8E]">{rec.reason}</p>}
                      <div className="mt-4 flex flex-wrap gap-2">
                        {rec.status !== 'IN_PROGRESS' && rec.status !== 'COMPLETED' && (
                          <Btn
                            small
                            variant="ghost"
                            onClick={() => updateRecProgress(rec, {
                              status: 'IN_PROGRESS',
                              progress_pct: Math.max(progressPct, 25),
                              progress_note: 'Started learning plan',
                            })}
                          >
                            Start
                          </Btn>
                        )}
                        {rec.status !== 'COMPLETED' && (
                          <Btn
                            small
                            variant="ghost"
                            onClick={() => updateRecProgress(rec, {
                              status: progressPct + 25 >= 100 ? 'COMPLETED' : 'IN_PROGRESS',
                              progress_pct: Math.min(progressPct + 25, 100),
                              progress_note: 'Advanced learning progress',
                            })}
                          >
                            +25%
                          </Btn>
                        )}
                        {rec.status !== 'COMPLETED' && (
                          <Btn
                            small
                            onClick={() => updateRecProgress(rec, {
                              status: 'COMPLETED',
                              progress_pct: 100,
                              progress_note: 'Completed learning recommendation',
                            })}
                          >
                            Mark Complete
                          </Btn>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        )}

        {activeTab === 'activity' && (
          <Card>
            <SectionTitle>Activity Feed</SectionTitle>
            {!activity.length ? (
              <p className="text-[13px] text-[#7BAF8E]">No activity recorded yet.</p>
            ) : (
              activity.map((item, index) => <ActivityRow key={index} item={item} />)
            )}
          </Card>
        )}

        {activeTab === 'metrics' && (
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <SectionTitle>Performance Metrics</SectionTitle>
              {!metrics ? (
                <p className="text-[13px] text-[#7BAF8E]">No metrics yet.</p>
              ) : (
                <div className="space-y-5">
                  {[
                    { label: 'On-time Delivery Rate', value: metrics.on_time_delivery_rate || 0, className: 'text-[#3EE07F]', fill: 'fill-[#3EE07F]' },
                    { label: 'Collaboration Score', value: metrics.collaboration_score || 0, className: 'text-[#60A5FA]', fill: 'fill-[#60A5FA]' },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="mb-2 flex justify-between">
                        <span className="text-[13px] font-medium text-[#F0FAF4]">{item.label}</span>
                        <span className={`text-[18px] font-bold ${item.className}`}>{item.value}%</span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-[rgba(40,98,58,0.2)]">
                        <ProgressBar percent={item.value} fillClass={item.fill} />
                      </div>
                    </div>
                  ))}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    {[
                      { label: 'Tasks Completed', value: metrics.tasks_completed || 0, className: 'text-[#3EE07F]' },
                      { label: 'Tasks Overdue', value: metrics.tasks_overdue || 0, className: 'text-[#F87171]' },
                    ].map(item => (
                      <div key={item.label} className="rounded-xl border border-[rgba(40,98,58,0.3)] bg-[rgba(40,98,58,0.1)] p-4 text-center">
                        <div className={`text-[28px] font-bold ${item.className}`}>{item.value}</div>
                        <div className="mt-1 text-[11px] uppercase tracking-wide text-[#7BAF8E]">{item.label}</div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-[rgba(123,175,142,0.45)]">
                    Last calculated: {metrics.last_calculated ? new Date(metrics.last_calculated).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Never'}
                  </p>
                </div>
              )}
            </Card>

            <Card>
              <SectionTitle>Skill Coverage</SectionTitle>
              {!profile.skills?.length ? (
                <p className="text-[13px] text-[#7BAF8E]">No skills added yet.</p>
              ) : (
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
              )}
            </Card>
          </div>
        )}
      </div>

      {skillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,26,18,0.85)] px-4 backdrop-blur-[6px]">
          <div className="ss-card-heavy ss-card-line relative w-full max-w-[400px] rounded-2xl p-7">
            <h3 className="mb-1 text-[17px] font-bold text-[#F0FAF4]">Add New Skill</h3>
            <p className="mb-5 text-[12px] text-[#7BAF8E]">Add a skill with your proficiency level</p>
            {skillErr && <div className="ss-error-box mb-4 rounded-xl px-3 py-2.5 text-[12px]">{skillErr}</div>}
            <form onSubmit={addSkill} className="space-y-4">
              <Field
                label="Skill Name *"
                value={skillForm.name}
                placeholder="e.g. React, Python, Leadership"
                onChange={e => setSkillForm(prev => ({ ...prev, name: e.target.value }))}
              />
              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-[#7BAF8E]">Proficiency Level *</label>
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
                <Btn variant="ghost" onClick={() => { setSkillModal(false); setSkillErr('') }}>Cancel</Btn>
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
            <h3 className="mb-1 text-[17px] font-bold text-[#F0FAF4]">Add Learning Goal</h3>
            <p className="mb-5 text-[12px] text-[#7BAF8E]">Track a skill you want to develop</p>
            <form onSubmit={addRec} className="space-y-4">
              <Field
                label="Skill Name *"
                value={recForm.skill_name}
                placeholder="e.g. MongoDB, AWS"
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
                  {['LOW', 'MEDIUM', 'HIGH'].map(priority => (
                    <button
                      key={priority}
                      type="button"
                      onClick={() => setRecForm(prev => ({ ...prev, priority }))}
                      className={[
                        'flex-1 rounded-xl py-2 text-[11px] font-semibold transition-all border border-[rgba(40,98,58,0.3)]',
                        recForm.priority === priority
                          ? priority === 'HIGH'
                            ? 'bg-[rgba(248,113,113,0.15)] text-[#F87171]'
                            : priority === 'MEDIUM'
                              ? 'bg-[rgba(251,191,36,0.12)] text-[#FBBF24]'
                              : 'bg-[rgba(123,175,142,0.12)] text-[#7BAF8E]'
                          : 'bg-[rgba(15,32,39,0.6)] text-[#7BAF8E]',
                      ].join(' ')}
                    >
                      {priority}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <Btn variant="ghost" onClick={() => setRecModal(false)}>Cancel</Btn>
                <button
                  type="submit"
                  disabled={!recForm.skill_name}
                  className="ss-btn-primary flex-1 rounded-xl py-2.5 text-[12px] font-semibold disabled:opacity-50"
                >
                  Save Goal →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
