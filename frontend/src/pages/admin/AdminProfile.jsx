import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'

const API = 'http://localhost:3000'

const LEVEL_CFG = {
  BEGINNER:     { text: 'text-[#7BAF8E]', bg: 'bg-[rgba(123,175,142,0.15)]', fill: 'fill-[#7BAF8E]', pct: 25 },
  INTERMEDIATE: { text: 'text-[#60A5FA]', bg: 'bg-[rgba(96,165,250,0.15)]', fill: 'fill-[#60A5FA]', pct: 50 },
  ADVANCED:     { text: 'text-[#FBBF24]', bg: 'bg-[rgba(251,191,36,0.15)]', fill: 'fill-[#FBBF24]', pct: 75 },
  EXPERT:       { text: 'text-[#3EE07F]', bg: 'bg-[rgba(62,224,127,0.15)]', fill: 'fill-[#3EE07F]', pct: 100 },
}

const ROLES = [
  { value: 'MEMBER', label: 'Team Member', desc: 'Work on tasks and projects' },
  { value: 'PROJECT_MANAGER', label: 'Project Manager', desc: 'Create projects, assemble teams with AI' },
  { value: 'ADMIN', label: 'Administrator', desc: 'Full system access' },
]

const ACT_ICON = {
  TASK: '✓',
  PROJECT: '◫',
  SKILL: '◈',
  COMMENT: '💬',
  SYSTEM: '⚙',
}

const ROLE_LABEL = {
  ADMIN: 'Administrator',
  PROJECT_MANAGER: 'Project Manager',
  MEMBER: 'Team Member',
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

const InfoRow = ({ label, value, mono, accentClass = 'text-[#F0FAF4]' }) => (
  <div className="flex items-start justify-between gap-4 rounded-xl border border-[rgba(40,98,58,0.3)] bg-[rgba(40,98,58,0.08)] p-3">
    <span className="shrink-0 text-[11px] font-medium uppercase tracking-wide text-[#7BAF8E]">{label}</span>
    <span className={`break-all text-right text-[12px] font-semibold ${mono ? 'font-mono text-[10px]' : ''} ${accentClass}`}>{value || '—'}</span>
  </div>
)

const Field = ({ label, value, onChange, type = 'text', placeholder, rows }) => {
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

const StatCard = ({ icon, value, label, valueClass = 'text-[#F0FAF4]', compact }) => (
  <Card className="px-[22px] py-5">
    <div className="mb-2 flex items-center justify-between">
      <span className="text-[20px]">{icon}</span>
      <span className={`font-bold leading-none ${compact ? 'text-[20px]' : 'text-[26px]'} ${valueClass}`}>{value}</span>
    </div>
    <div className="text-[11px] font-semibold uppercase tracking-widest text-[#7BAF8E]">{label}</div>
  </Card>
)

const ActivityCard = ({ item, compact = false }) => (
  <div className={`rounded-xl border border-[rgba(40,98,58,0.3)] bg-[rgba(40,98,58,0.07)] transition-all hover:border-[rgba(62,224,127,0.2)] ${compact ? 'flex items-start gap-3 p-3' : 'mb-3 flex items-start gap-4 p-4'}`}>
    <div className={`shrink-0 rounded-xl bg-[rgba(40,98,58,0.2)] text-[#3EE07F] ${compact ? 'flex h-7 w-7 items-center justify-center text-[13px]' : 'flex h-9 w-9 items-center justify-center text-[15px]'}`}>
      {ACT_ICON[item.target_type] || '⚙'}
    </div>
    <div className="min-w-0 flex-1">
      {compact ? (
        <>
          <div className="truncate text-[12px] text-[rgba(240,250,244,0.8)]">
            <span className="font-medium">{item.action}</span>
          </div>
          <div className="truncate text-[11px] text-[#3EE07F]">{item.target}</div>
          <div className="mt-0.5 text-[10px] text-[rgba(123,175,142,0.5)]">
            {new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </div>
        </>
      ) : (
        <>
          <div className="text-[13px] text-[rgba(240,250,244,0.85)]">
            <span className="font-semibold">{item.action}</span>
            {' — '}
            <span className="text-[#3EE07F]">{item.target}</span>
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

export default function AdminProfile() {
  const navigate = useNavigate()
  const { userId } = useParams()
  const isViewingUser = !!userId

  const [profile, setProfile] = useState(null)
  const [activity, setActivity] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [activeTab, setActiveTab] = useState('overview')
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [editForm, setEditForm] = useState({ bio: '', profile_picture_url: '' })

  const [newRole, setNewRole] = useState('')
  const [roleChanging, setRoleChanging] = useState(false)
  const [verifyingSkill, setVerifyingSkill] = useState(null)

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  useEffect(() => { fetchAll() }, [userId])

  const fetchAll = async () => {
    setLoading(true)
    try {
      if (isViewingUser) {
        const res = await axios.get(`${API}/api/profile/${userId}`, { withCredentials: true })
        setProfile(res.data.user)
        setNewRole(res.data.user.role)
      } else {
        const [profileRes, activityRes, statsRes] = await Promise.all([
          axios.get(`${API}/api/profile/me`, { withCredentials: true }),
          axios.get(`${API}/api/profile/activity?limit=20`, { withCredentials: true }),
          axios.get(`${API}/api/admin/stats`, { withCredentials: true }),
        ])
        setProfile(profileRes.data.user)
        setActivity(activityRes.data.activity || [])
        setStats(statsRes.data)
        setEditForm({
          bio: profileRes.data.user.bio || '',
          profile_picture_url: profileRes.data.user.profile_picture_url || '',
        })
        setNewRole(profileRes.data.user.role)
      }
    } catch (err) {
      if (err.response?.status === 401) navigate('/login')
      else if (err.response?.status === 403) navigate('/admin/dashboard')
      else setError('Failed to load profile.')
    } finally {
      setLoading(false)
    }
  }

  const saveProfile = async () => {
    setSaving(true)
    try {
      const payload = {}
      if (editForm.bio.trim()) payload.bio = editForm.bio.trim()
      if (editForm.profile_picture_url.trim()) payload.profile_picture_url = editForm.profile_picture_url.trim()

      if (Object.keys(payload).length === 0) {
        showToast('⚠ Nothing to update')
        setSaving(false)
        return
      }

      const res = await axios.put(`${API}/api/profile/me`, payload, { withCredentials: true })
      setProfile(res.data.user)
      setEditMode(false)
      showToast('✓ Profile updated')
    } catch {
      showToast('⚠ Update failed')
    } finally {
      setSaving(false)
    }
  }

  const changeRole = async () => {
    if (!userId || newRole === profile.role) return
    setRoleChanging(true)
    try {
      await axios.put(`${API}/api/admin/users/${userId}/role`, { role: newRole }, { withCredentials: true })
      fetchAll()
      showToast(`✓ Role changed to ${newRole}`)
    } catch (err) {
      showToast(`⚠ ${err.response?.data?.message || 'Failed to change role'}`)
    } finally {
      setRoleChanging(false)
    }
  }

  const verifySkill = async (skillId, currentVerified) => {
    setVerifyingSkill(skillId)
    try {
      await axios.put(`${API}/api/admin/users/${userId}/verify-skill/${skillId}`, {}, { withCredentials: true })
      fetchAll()
      showToast(`✓ Skill ${!currentVerified ? 'verified' : 'unverified'}`)
    } catch {
      showToast('⚠ Failed')
    } finally {
      setVerifyingSkill(null)
    }
  }

  if (loading) {
    return (
      <div className="ss-bg-app min-h-screen flex items-center justify-center">
        <BG />
        <div className="relative z-10 flex flex-col items-center gap-3">
          <div className="ss-spinner h-10 w-10 animate-spin rounded-full border-2" />
          <span className="text-[13px] text-[#7BAF8E]">Loading profile...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="ss-bg-app min-h-screen flex items-center justify-center">
        <BG />
        <div className="ss-card relative z-10 rounded-2xl border border-[rgba(239,68,68,0.2)] p-8 text-center">
          <p className="text-[#F87171]">{error}</p>
          <button onClick={fetchAll} className="ss-btn-primary mt-4 rounded-xl px-5 py-2 text-[13px] font-semibold">
            Retry
          </button>
        </div>
      </div>
    )
  }

  const ownTabs = ['overview', 'activity', 'system']
  const userTabs = ['overview', 'skills', 'admin controls']
  const tabs = isViewingUser ? userTabs : ownTabs

  const ownStatsCards = [
    { label: 'Total Users', value: stats?.total_users ?? '—', icon: '👥', valueClass: 'text-[#F0FAF4]' },
    { label: 'Project Managers', value: stats?.total_pms ?? '—', icon: '◫', valueClass: 'text-[#60A5FA]' },
    { label: 'Team Members', value: stats?.total_members ?? '—', icon: '◈', valueClass: 'text-[#3EE07F]' },
  ]

  const userStatsCards = [
    { label: 'Account Role', value: ROLE_LABEL[profile.role] || profile.role, icon: '⚙', valueClass: 'text-[#3EE07F]', compact: true },
    { label: 'Skills Listed', value: profile.skills?.length || 0, icon: '◈', valueClass: 'text-[#60A5FA]', compact: true },
    { label: 'Projects', value: profile.project_history?.length || 0, icon: '◫', valueClass: 'text-[#FBBF24]', compact: true },
  ]

  return (
    <div className="ss-bg-app min-h-screen font-sans">
      <BG />
      <div className="relative z-10 mx-auto max-w-[1050px] px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="text-[13px] font-medium text-[#7BAF8E] transition-colors hover:text-[#F0FAF4]"
          >
            ← Back to Admin Dashboard
          </button>

          <div className="flex items-center gap-2 rounded-full border border-[rgba(62,224,127,0.18)] bg-[rgba(62,224,127,0.07)] px-3 py-1.5">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#3EE07F]" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#3EE07F]">
              {isViewingUser ? 'Admin — Viewing User' : 'Administrator'}
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
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#28623A] to-[#3EE07F] text-[26px] font-bold text-[#0F2027] shadow-[0_0_0_3px_rgba(62,224,127,0.2),0_0_24px_rgba(62,224,127,0.08)]">
                {profile.profile_picture_url
                  ? <img src={profile.profile_picture_url} alt={profile.username} className="h-full w-full object-cover" />
                  : profile.username.slice(0, 2).toUpperCase()}
              </div>
              <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#0F2027] bg-[#28623A] text-[11px] text-[#3EE07F]">
                ⚙
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex flex-wrap items-center gap-3">
                <h1 className="text-[22px] font-bold text-[#F0FAF4]">{profile.username}</h1>
                <span className="rounded-full border border-[rgba(62,224,127,0.25)] bg-[rgba(62,224,127,0.1)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-[#3EE07F]">
                  {ROLE_LABEL[profile.role] || profile.role}
                </span>
              </div>
              <p className="mb-2 text-[13px] text-[#7BAF8E]">{profile.email}</p>
              {profile.bio ? (
                <p className="max-w-[500px] text-[13px] leading-relaxed text-[rgba(240,250,244,0.75)]">{profile.bio}</p>
              ) : (
                <p className="text-[13px] italic text-[rgba(123,175,142,0.4)]">
                  {isViewingUser ? 'No bio provided' : 'No bio yet — click Edit Profile to add one'}
                </p>
              )}
              <p className="mt-2 text-[11px] text-[rgba(123,175,142,0.4)]">
                Member since {profile.created_at
                  ? new Date(profile.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                  : '—'}
              </p>
            </div>

            {!isViewingUser && (
              <button
                onClick={() => setEditMode(prev => !prev)}
                className={[
                  'shrink-0 rounded-xl px-4 py-2 text-[12px] font-semibold transition-all border',
                  editMode
                    ? 'border-[rgba(62,224,127,0.25)] bg-[rgba(62,224,127,0.1)] text-[#3EE07F]'
                    : 'border-[rgba(40,98,58,0.3)] bg-transparent text-[#7BAF8E]',
                ].join(' ')}
              >
                {editMode ? '✕ Cancel' : '✎ Edit Profile'}
              </button>
            )}
          </div>

          {editMode && !isViewingUser && (
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
                <div className="col-span-2">
                  <Field
                    label="Profile Picture URL"
                    value={editForm.profile_picture_url}
                    placeholder="https://example.com/avatar.jpg"
                    onChange={e => setEditForm(prev => ({ ...prev, profile_picture_url: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button onClick={() => setEditMode(false)} className="ss-btn-ghost rounded-xl px-5 py-2.5 text-[12px] font-medium">
                  Cancel
                </button>
                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="ss-btn-primary rounded-xl px-6 py-2.5 text-[12px] font-semibold transition-all disabled:opacity-50 hover:shadow-[0_8px_24px_rgba(62,224,127,0.15)]"
                >
                  {saving ? 'Saving...' : 'Save Changes →'}
                </button>
              </div>
            </div>
          )}
        </Card>

        <div className="mb-6 grid grid-cols-3 gap-4">
          {(isViewingUser ? userStatsCards : ownStatsCards).map(card => (
            <StatCard
              key={card.label}
              icon={card.icon}
              value={card.value}
              label={card.label}
              valueClass={card.valueClass}
              compact={card.compact}
            />
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

        {activeTab === 'overview' && !isViewingUser && (
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <SectionTitle>Account Details</SectionTitle>
              <div className="space-y-2">
                <InfoRow label="Username" value={profile.username} />
                <InfoRow label="Email" value={profile.email} />
                <InfoRow label="Role" value="Administrator" accentClass="text-[#3EE07F]" />
                <InfoRow label="User ID" value={profile._id} mono />
                <InfoRow
                  label="Created"
                  value={profile.created_at ? new Date(profile.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                />
                <InfoRow
                  label="Last Updated"
                  value={profile.updated_at ? new Date(profile.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                />
              </div>
            </Card>

            <Card>
              <SectionTitle>Organisation Overview</SectionTitle>
              {stats ? (
                <div className="space-y-3">
                  {[
                    { label: 'Total Users', value: stats.total_users, className: 'text-[#F0FAF4]', fill: 'fill-[#F0FAF4]', max: stats.total_users },
                    { label: 'Team Members', value: stats.total_members, className: 'text-[#3EE07F]', fill: 'fill-[#3EE07F]', max: stats.total_users },
                    { label: 'Project Managers', value: stats.total_pms, className: 'text-[#60A5FA]', fill: 'fill-[#60A5FA]', max: stats.total_users },
                    { label: 'Administrators', value: stats.total_admins, className: 'text-[#FBBF24]', fill: 'fill-[#FBBF24]', max: stats.total_users },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-[12px] font-medium text-[#F0FAF4]">{item.label}</span>
                        <span className={`text-[14px] font-bold ${item.className}`}>{item.value}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[rgba(40,98,58,0.2)]">
                        <ProgressBar percent={item.max > 0 ? (item.value / item.max) * 100 : 0} fillClass={item.fill} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] text-[#7BAF8E]">Stats unavailable.</p>
              )}
            </Card>

            <Card className="col-span-2">
              <SectionTitle action={
                <button onClick={() => setActiveTab('activity')} className="text-[11px] font-semibold text-[#3EE07F] hover:underline">
                  View all →
                </button>
              }>
                Recent Activity
              </SectionTitle>
              {!activity.length ? (
                <p className="text-[13px] text-[#7BAF8E]">No activity recorded yet.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {activity.slice(0, 6).map((item, index) => (
                    <ActivityCard key={index} item={item} compact />
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {activeTab === 'activity' && !isViewingUser && (
          <Card>
            <SectionTitle>Activity Feed</SectionTitle>
            {!activity.length ? (
              <p className="text-[13px] text-[#7BAF8E]">No activity yet.</p>
            ) : (
              activity.map((item, index) => <ActivityCard key={index} item={item} />)
            )}
          </Card>
        )}

        {activeTab === 'system' && !isViewingUser && (
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <SectionTitle>Account Metadata</SectionTitle>
              <div className="space-y-2">
                <InfoRow label="User ID" value={profile._id} mono />
                <InfoRow label="Username" value={profile.username} />
                <InfoRow label="Email" value={profile.email} />
                <InfoRow label="Role" value={profile.role} accentClass="text-[#3EE07F]" />
                <InfoRow
                  label="Created"
                  value={profile.created_at ? new Date(profile.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                />
                <InfoRow
                  label="Last Updated"
                  value={profile.updated_at ? new Date(profile.updated_at).toLocaleString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                />
              </div>
            </Card>

            <Card>
              <SectionTitle>Organisation Stats</SectionTitle>
              {stats ? (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Total Users', value: stats.total_users, className: 'text-[#F0FAF4]' },
                    { label: 'Team Members', value: stats.total_members, className: 'text-[#3EE07F]' },
                    { label: 'Project Managers', value: stats.total_pms, className: 'text-[#60A5FA]' },
                    { label: 'Administrators', value: stats.total_admins, className: 'text-[#FBBF24]' },
                  ].map(item => (
                    <div key={item.label} className="rounded-xl border border-[rgba(40,98,58,0.3)] bg-[rgba(40,98,58,0.1)] p-4 text-center">
                      <div className={`text-[28px] font-bold ${item.className}`}>{item.value}</div>
                      <div className="mt-1 text-[10px] uppercase tracking-wide text-[#7BAF8E]">{item.label}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] text-[#7BAF8E]">Stats unavailable.</p>
              )}
            </Card>
          </div>
        )}

        {activeTab === 'overview' && isViewingUser && (
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <SectionTitle>User Details</SectionTitle>
              <div className="space-y-2">
                <InfoRow label="User ID" value={profile._id} mono />
                <InfoRow label="Username" value={profile.username} />
                <InfoRow label="Email" value={profile.email} />
                <InfoRow
                  label="Role"
                  value={ROLE_LABEL[profile.role] || profile.role}
                  accentClass={profile.role === 'ADMIN' ? 'text-[#3EE07F]' : profile.role === 'PROJECT_MANAGER' ? 'text-[#60A5FA]' : 'text-[#7BAF8E]'}
                />
                <InfoRow
                  label="Created"
                  value={profile.created_at ? new Date(profile.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                />
                <InfoRow
                  label="Last Updated"
                  value={profile.updated_at ? new Date(profile.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                />
                <InfoRow label="Hours / Week" value={`${profile.availability_hours_per_week || 40}h`} />
                <InfoRow
                  label="Capacity"
                  value={`${profile.current_capacity_percentage || 0}%`}
                  accentClass={(profile.current_capacity_percentage || 0) >= 85 ? 'text-[#F87171]' : (profile.current_capacity_percentage || 0) >= 65 ? 'text-[#FBBF24]' : 'text-[#3EE07F]'}
                />
              </div>
            </Card>

            <Card>
              <SectionTitle>Bio</SectionTitle>
              {profile.bio ? (
                <p className="text-[14px] leading-relaxed text-[rgba(240,250,244,0.75)]">{profile.bio}</p>
              ) : (
                <p className="text-[13px] italic text-[rgba(123,175,142,0.4)]">No bio provided</p>
              )}

              {!!profile.project_history?.length && (
                <div className="mt-5 border-t border-[rgba(40,98,58,0.2)] pt-5">
                  <div className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[#7BAF8E]">Projects</div>
                  {profile.project_history.slice(0, 3).map((projectHistory, index) => (
                    <div key={index} className="mb-2 flex items-center gap-3 rounded-xl border border-[rgba(40,98,58,0.3)] bg-[rgba(40,98,58,0.1)] p-2.5">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[rgba(40,98,58,0.3)] text-[11px] font-bold text-[#3EE07F]">
                        {(projectHistory.project_id?.name || 'P')[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[12px] font-semibold text-[#F0FAF4]">
                          {projectHistory.project_id?.name || 'Project'}
                        </div>
                      </div>
                      <span
                        className={[
                          'rounded-full px-2 py-0.5 text-[9px] font-bold uppercase',
                          projectHistory.status === 'COMPLETED'
                            ? 'bg-[rgba(62,224,127,0.1)] text-[#3EE07F]'
                            : 'bg-[rgba(96,165,250,0.1)] text-[#60A5FA]',
                        ].join(' ')}
                      >
                        {projectHistory.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {activeTab === 'skills' && isViewingUser && (
          <Card>
            <SectionTitle>{profile.username}'s Skills</SectionTitle>
            {!profile.skills?.length ? (
              <div className="py-10 text-center">
                <div className="mb-3 text-[36px]">◈</div>
                <p className="text-[13px] text-[#7BAF8E]">No skills listed on this profile</p>
              </div>
            ) : (
              profile.skills.map(skill => {
                const cfg = LEVEL_CFG[skill.proficiency_level]
                return (
                  <div
                    key={skill._id}
                    className="mb-3 flex items-center gap-4 rounded-xl border border-[rgba(40,98,58,0.3)] bg-[rgba(40,98,58,0.08)] p-4 transition-all hover:border-[rgba(62,224,127,0.2)]"
                  >
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[14px] font-bold ${cfg.bg} ${cfg.text}`}>
                      {skill.name[0]}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-[14px] font-semibold text-[#F0FAF4]">{skill.name}</span>
                        {skill.verified && (
                          <span className="rounded-full bg-[rgba(62,224,127,0.12)] px-2 py-0.5 text-[9px] font-bold uppercase text-[#3EE07F]">
                            ✓ Verified
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-32 rounded-full bg-[rgba(40,98,58,0.25)]">
                          <ProgressBar percent={cfg.pct} fillClass={cfg.fill} />
                        </div>
                        <span className={`text-[10px] font-semibold ${cfg.text}`}>{skill.proficiency_level}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => verifySkill(skill._id, skill.verified)}
                      disabled={verifyingSkill === skill._id}
                      className={[
                        'rounded-xl px-3 py-1.5 text-[11px] font-semibold transition-all border',
                        skill.verified
                          ? 'border-[rgba(248,113,113,0.25)] bg-[rgba(248,113,113,0.1)] text-[#F87171]'
                          : 'border-[rgba(62,224,127,0.25)] bg-[rgba(62,224,127,0.1)] text-[#3EE07F]',
                        verifyingSkill === skill._id ? 'opacity-50' : '',
                      ].join(' ')}
                    >
                      {verifyingSkill === skill._id ? '...' : skill.verified ? '✕ Unverify' : '✓ Verify'}
                    </button>
                  </div>
                )
              })
            )}
          </Card>
        )}

        {activeTab === 'admin controls' && isViewingUser && (
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <SectionTitle>Role Management</SectionTitle>
              <p className="mb-5 text-[12px] text-[#7BAF8E]">
                Change this user's role. Changes take effect immediately.
              </p>

              <div className="mb-5 space-y-2">
                {ROLES.map(role => (
                  <button
                    key={role.value}
                    onClick={() => setNewRole(role.value)}
                    className={[
                      'w-full rounded-xl p-4 text-left transition-all border',
                      newRole === role.value
                        ? 'border-[rgba(62,224,127,0.35)] bg-[rgba(40,98,58,0.25)]'
                        : 'border-[rgba(40,98,58,0.3)] bg-[rgba(15,32,39,0.5)]',
                    ].join(' ')}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className={`mb-0.5 text-[13px] font-semibold ${newRole === role.value ? 'text-[#3EE07F]' : 'text-[#F0FAF4]'}`}>
                          {role.label}
                        </div>
                        <div className="text-[11px] text-[#7BAF8E]">{role.desc}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {profile.role === role.value && (
                          <span className="rounded-full border border-[rgba(62,224,127,0.2)] bg-[rgba(62,224,127,0.1)] px-2 py-0.5 text-[9px] font-bold uppercase text-[#3EE07F]">
                            Current
                          </span>
                        )}
                        {newRole === role.value && profile.role !== role.value && (
                          <span className="rounded-full border border-[rgba(251,191,36,0.2)] bg-[rgba(251,191,36,0.1)] px-2 py-0.5 text-[9px] font-bold uppercase text-[#FBBF24]">
                            Selected
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={changeRole}
                disabled={roleChanging || newRole === profile.role}
                className="ss-btn-primary w-full rounded-xl py-3 text-[13px] font-semibold transition-all disabled:opacity-40 hover:shadow-[0_8px_24px_rgba(62,224,127,0.15)]"
              >
                {roleChanging ? 'Updating...' : newRole === profile.role ? 'No Change' : `Apply → ${newRole === 'PROJECT_MANAGER' ? 'Project Manager' : newRole}`}
              </button>

              {newRole !== profile.role && (
                <p className="mt-2.5 flex items-center gap-1.5 text-[11px] text-[#FBBF24]">
                  <span>⚠</span> This changes user permissions immediately.
                </p>
              )}
            </Card>

            <Card>
              <SectionTitle>User Metadata</SectionTitle>
              <div className="space-y-2">
                <InfoRow label="User ID" value={profile._id} mono />
                <InfoRow label="Username" value={profile.username} />
                <InfoRow label="Email" value={profile.email} />
                <InfoRow label="Current Role" value={profile.role === 'PROJECT_MANAGER' ? 'Project Manager' : profile.role} accentClass="text-[#3EE07F]" />
                <InfoRow
                  label="Created"
                  value={profile.created_at ? new Date(profile.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                />
                <InfoRow
                  label="Last Updated"
                  value={profile.updated_at ? new Date(profile.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                />
                <InfoRow label="Skills" value={profile.skills?.length || 0} />
                <InfoRow label="Projects" value={profile.project_history?.length || 0} />
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
