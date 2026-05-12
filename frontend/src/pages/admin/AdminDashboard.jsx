import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { buildProjectPath, getRolePrefixFromRole } from '../../utils/roleRoutes'

const API = 'http://localhost:3000'

const ROLE_CFG = {
  ADMIN: {
    text: 'text-[#3EE07F]',
    bg: 'bg-[rgba(62,224,127,0.1)]',
    border: 'border-[rgba(62,224,127,0.22)]',
    label: 'Admin',
  },
  PROJECT_MANAGER: {
    text: 'text-[#60A5FA]',
    bg: 'bg-[rgba(96,165,250,0.1)]',
    border: 'border-[rgba(96,165,250,0.22)]',
    label: 'PM',
  },
  MEMBER: {
    text: 'text-[#A78BFA]',
    bg: 'bg-[rgba(167,139,250,0.1)]',
    border: 'border-[rgba(167,139,250,0.22)]',
    label: 'Member',
  },
}

const STATUS_CFG = {
  PLANNING: {
    text: 'text-[#60A5FA]',
    bg: 'bg-[rgba(96,165,250,0.1)]',
    border: 'border-[rgba(96,165,250,0.22)]',
    fill: 'fill-[#60A5FA]',
    label: 'Planning',
  },
  ACTIVE: {
    text: 'text-[#3EE07F]',
    bg: 'bg-[rgba(62,224,127,0.1)]',
    border: 'border-[rgba(62,224,127,0.22)]',
    fill: 'fill-[#3EE07F]',
    label: 'Active',
  },
  COMPLETED: {
    text: 'text-[#FBBF24]',
    bg: 'bg-[rgba(251,191,36,0.1)]',
    border: 'border-[rgba(251,191,36,0.22)]',
    fill: 'fill-[#FBBF24]',
    label: 'Completed',
  },
  ON_HOLD: {
    text: 'text-[#F87171]',
    bg: 'bg-[rgba(248,113,113,0.1)]',
    border: 'border-[rgba(248,113,113,0.22)]',
    fill: 'fill-[#F87171]',
    label: 'On Hold',
  },
}

const PROF_CFG = {
  BEGINNER: { text: 'text-[#7BAF8E]', fill: 'fill-[#7BAF8E]' },
  INTERMEDIATE: { text: 'text-[#60A5FA]', fill: 'fill-[#60A5FA]' },
  ADVANCED: { text: 'text-[#FBBF24]', fill: 'fill-[#FBBF24]' },
  EXPERT: { text: 'text-[#3EE07F]', fill: 'fill-[#3EE07F]' },
}

const TASK_STATUS_BREAKDOWN = [
  { key: 'TODO', label: 'To Do', className: 'text-[#7BAF8E]', fill: 'fill-[#7BAF8E]' },
  { key: 'IN_PROGRESS', label: 'In Progress', className: 'text-[#60A5FA]', fill: 'fill-[#60A5FA]' },
  { key: 'IN_REVIEW', label: 'In Review', className: 'text-[#FBBF24]', fill: 'fill-[#FBBF24]' },
  { key: 'DONE', label: 'Done', className: 'text-[#3EE07F]', fill: 'fill-[#3EE07F]' },
]

const BG = () => (
  <>
    <div className="ss-radial-upper fixed inset-0 pointer-events-none" />
    <div className="ss-grid-overlay fixed inset-0 pointer-events-none opacity-[0.03]" />
  </>
)

const Card = ({ children, className = '', onClick }) => (
  <div
    onClick={onClick}
    className={`ss-card ss-card-line relative rounded-2xl ${onClick ? 'cursor-pointer transition-all hover:border-[rgba(62,224,127,0.3)]' : ''} ${className}`}
  >
    {children}
  </div>
)

const SectionTitle = ({ children, action }) => (
  <div className="mb-5 flex items-center justify-between">
    <h2 className="text-[13px] font-bold uppercase tracking-widest text-[#7BAF8E]">{children}</h2>
    {action}
  </div>
)

const Badge = ({ children, className = '' }) => (
  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${className}`}>
    {children}
  </span>
)

const progressWidthClass = (percent) => `ss-w-${Math.max(0, Math.min(100, Math.round(Number(percent) || 0)))}`
const toBarFillClass = (fillClass) => fillClass.replace(/^fill-/, 'bg-')

const ProgressBar = ({ percent, fillClass, bgClass = 'bg-[rgba(40,98,58,0.2)]', heightClass = 'h-2' }) => {
  return (
    <div className={`${heightClass} overflow-hidden rounded-full ${bgClass}`}>
      <div className={`ss-progress-fill ${toBarFillClass(fillClass)} ${progressWidthClass(percent)}`} />
    </div>
  )
}

const StackedBar = ({ segments }) => (
  <div className="flex h-2 overflow-hidden rounded-full bg-[rgba(40,98,58,0.2)]">
    {segments.map((segment, index) => (
      segment.width > 0 ? <div key={index} className={`${toBarFillClass(segment.fill)} ${progressWidthClass(segment.width)}`} /> : null
    ))}
  </div>
)

const RatioBar = ({ leftValue, rightValue, leftFill, rightFill }) => {
  const maxValue = Math.max(leftValue, rightValue, 1)
  const leftPct = Math.min(100, (leftValue / maxValue) * 100)
  const rightPct = Math.min(100, (rightValue / maxValue) * 100)

  return (
    <div className="flex h-5 gap-1">
      <div className="min-w-0 flex-1 rounded-l-full bg-[rgba(248,113,113,0.08)]">
        <div className={`ss-progress-fill ${toBarFillClass(leftFill)} ${progressWidthClass(leftPct)}`} />
      </div>
      <div className="min-w-0 flex-1 rounded-r-full bg-[rgba(62,224,127,0.08)]">
        <div className={`ss-progress-fill ${toBarFillClass(rightFill)} ${progressWidthClass(rightPct)}`} />
      </div>
    </div>
  )
}

const capTone = (percent) => (
  percent >= 85
    ? { text: 'text-[#F87171]', fill: 'fill-[#F87171]', bg: 'bg-[rgba(248,113,113,0.1)]', border: 'border-[rgba(248,113,113,0.2)]', label: 'Overloaded' }
    : percent >= 65
      ? { text: 'text-[#FBBF24]', fill: 'fill-[#FBBF24]', bg: 'bg-[rgba(251,191,36,0.1)]', border: 'border-[rgba(251,191,36,0.2)]', label: 'Busy' }
      : { text: 'text-[#3EE07F]', fill: 'fill-[#3EE07F]', bg: 'bg-[rgba(62,224,127,0.1)]', border: 'border-[rgba(62,224,127,0.2)]', label: 'Available' }
)

const fmtDate = (dateValue) => (
  dateValue
    ? new Date(dateValue).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—'
)

export default function AdminDashboard() {
  const navigate = useNavigate()
  const adminPrefix = getRolePrefixFromRole('ADMIN')

  const [data, setData] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [userSearch, setUserSearch] = useState('')
  const [changingRole, setChangingRole] = useState(null)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    setLoading(true)
    try {
      const [dashRes, meRes] = await Promise.all([
        axios.get(`${API}/api/admin/dashboard`, { withCredentials: true }),
        axios.get(`${API}/api/profile/me`, { withCredentials: true }),
      ])
      setData(dashRes.data)
      setUser(meRes.data.user)
    } catch (err) {
      if (err.response?.status === 401) navigate('/login')
      else if (err.response?.status === 403) navigate('/dashboard')
      else setError('Failed to load dashboard.')
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (userId, newRole) => {
    setChangingRole(userId)
    try {
      await axios.put(`${API}/api/admin/users/${userId}/role`, { role: newRole }, { withCredentials: true })
      setData(prev => ({
        ...prev,
        user_table: prev.user_table.map(userRow => userRow._id === userId ? { ...userRow, role: newRole } : userRow),
      }))
    } catch (err) {
      console.error(err)
    } finally {
      setChangingRole(null)
    }
  }

  if (loading) {
    return (
      <div className="ss-bg-app min-h-screen flex items-center justify-center">
        <BG />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="ss-spinner h-12 w-12 animate-spin rounded-full border-2" />
          <span className="text-[13px] text-[#7BAF8E]">Loading admin dashboard...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="ss-bg-app min-h-screen flex items-center justify-center">
        <BG />
        <div className="ss-card relative z-10 rounded-2xl border border-[rgba(239,68,68,0.2)] p-8 text-center">
          <p className="mb-4 text-[#F87171]">{error}</p>
          <button onClick={fetchDashboard} className="ss-btn-primary rounded-xl px-5 py-2.5 text-[13px] font-semibold">
            Retry
          </button>
        </div>
      </div>
    )
  }

  const {
    stats,
    capacity,
    capacity_summary,
    project_stats,
    success_rate,
    avg_ai_score,
    task_by_status,
    task_completion_rate,
    workload_dist,
    skill_matrix,
    org_skill_gap,
    activity_logs,
    user_table,
    recent_projects,
  } = data

  const tabs = ['overview', 'users', 'projects', 'skills', 'activity']

  const filteredUsers = user_table.filter(userRow => {
    const matchRole = roleFilter === 'ALL' || userRow.role === roleFilter
    const term = userSearch.trim().toLowerCase()
    const matchSearch = !term
      || userRow.username.toLowerCase().includes(term)
      || userRow.email.toLowerCase().includes(term)
    return matchRole && matchSearch
  })

  return (
    <div className="ss-bg-app min-h-screen font-sans">
      <BG />
      <div className="relative z-10 mx-auto max-w-[1200px] px-6 py-10">
        <div className="mb-10 flex items-start justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#28623A] to-[#3EE07F] text-[14px] font-bold text-[#0F2027]">
                {user?.username?.slice(0, 2).toUpperCase() || 'AD'}
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-widest text-[#7BAF8E]">Administrator</div>
                <div className="text-[16px] font-bold leading-tight text-[#F0FAF4]">
                  Welcome, {user?.username}
                </div>
              </div>
            </div>
            <p className="text-[13px] text-[#7BAF8E]">
              {stats.total_users} users · {stats.total_projects} projects · {stats.total_tasks} tasks
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin/profile')}
              className="ss-btn-ghost rounded-xl px-4 py-2 text-[12px] font-semibold"
            >
              My Profile
            </button>
            <button
              onClick={() => navigate('/admin/skills')}
              className="rounded-xl border border-[rgba(251,191,36,0.25)] bg-[rgba(251,191,36,0.1)] px-4 py-2 text-[12px] font-semibold text-[#FBBF24] transition-all"
            >
              ◈ Skill Taxonomy
            </button>
            <button
              onClick={fetchDashboard}
              className="ss-btn-primary rounded-xl px-4 py-2 text-[12px] font-semibold"
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-5 gap-4">
          {[
            { label: 'Total Users', value: stats.total_users, icon: '👥', className: 'text-[#F0FAF4]' },
            { label: 'Projects', value: stats.total_projects, icon: '◫', className: 'text-[#60A5FA]' },
            { label: 'Tasks', value: stats.total_tasks, icon: '◈', className: 'text-[#3EE07F]' },
            { label: 'Task Completion', value: `${task_completion_rate}%`, icon: '●', className: 'text-[#FBBF24]' },
            { label: 'Success Rate', value: `${success_rate}%`, icon: '⚡', className: stats.overdue_tasks > 0 ? 'text-[#F87171]' : 'text-[#3EE07F]' },
          ].map(card => (
            <Card key={card.label} className="px-[18px] py-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[18px]">{card.icon}</span>
                <span className={`text-[24px] font-bold leading-none ${card.className}`}>{card.value}</span>
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-[#7BAF8E]">{card.label}</div>
            </Card>
          ))}
        </div>

        <div className="mb-7 flex gap-1 rounded-xl border border-[rgba(40,98,58,0.3)] bg-[rgba(15,32,39,0.6)] p-1">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={[
                'flex-1 rounded-lg border py-2.5 text-[12px] font-semibold capitalize transition-all',
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
          <div className="grid grid-cols-12 gap-5">
            <Card className="col-span-4 p-6">
              <SectionTitle>Org Capacity</SectionTitle>
              <div className="mb-5 grid grid-cols-3 gap-3">
                {[
                  { label: 'Overloaded', value: capacity_summary.overloaded, className: 'text-[#F87171]' },
                  { label: 'Busy', value: capacity_summary.busy, className: 'text-[#FBBF24]' },
                  { label: 'Available', value: capacity_summary.available, className: 'text-[#3EE07F]' },
                ].map(card => (
                  <div key={card.label} className="rounded-xl border border-[rgba(40,98,58,0.3)] bg-[rgba(40,98,58,0.08)] p-3 text-center">
                    <div className={`text-[20px] font-bold ${card.className}`}>{card.value}</div>
                    <div className="mt-1 text-[9px] uppercase tracking-widest text-[#7BAF8E]">{card.label}</div>
                  </div>
                ))}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-[#F0FAF4]">Avg Load</span>
                  <span className={`text-[16px] font-bold ${capTone(capacity_summary.avg_capacity).text}`}>
                    {capacity_summary.avg_capacity}%
                  </span>
                </div>
                <ProgressBar percent={capacity_summary.avg_capacity} fillClass={capTone(capacity_summary.avg_capacity).fill} heightClass="h-3" />
              </div>

              <div className="mt-4 space-y-2">
                {capacity.slice(0, 5).map(member => (
                  <div key={member._id} className="flex items-center gap-2">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-[#28623A] to-[#3EE07F] text-[9px] font-bold text-[#0F2027]">
                      {member.username[0].toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-0.5 flex justify-between">
                        <span className="truncate text-[11px] text-[#F0FAF4]">{member.username}</span>
                        <span className={`text-[10px] font-bold ${capTone(member.current_capacity_percentage).text}`}>
                          {member.current_capacity_percentage}%
                        </span>
                      </div>
                      <ProgressBar percent={member.current_capacity_percentage} fillClass={capTone(member.current_capacity_percentage).fill} heightClass="h-1" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="col-span-4 p-6">
              <SectionTitle>Project Status</SectionTitle>
              <div className="mb-5 space-y-3">
                {Object.entries(STATUS_CFG).map(([key, cfg]) => {
                  const count = project_stats[key] || 0
                  const pct = stats.total_projects > 0 ? (count / stats.total_projects) * 100 : 0
                  return (
                    <div key={key}>
                      <div className="mb-1.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] font-semibold ${cfg.text}`}>{cfg.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[12px] font-bold ${cfg.text}`}>{count}</span>
                          <span className="text-[10px] text-[#7BAF8E]">{Math.round(pct)}%</span>
                        </div>
                      </div>
                      <ProgressBar percent={pct} fillClass={cfg.fill} />
                    </div>
                  )
                })}
              </div>
              <div className="flex items-center justify-between border-t border-[rgba(40,98,58,0.2)] pt-3">
                <span className="text-[12px] text-[#F0FAF4]">Overall Success Rate</span>
                <span className={`text-[20px] font-bold ${success_rate >= 70 ? 'text-[#3EE07F]' : success_rate >= 40 ? 'text-[#FBBF24]' : 'text-[#F87171]'}`}>
                  {success_rate}%
                </span>
              </div>
              {avg_ai_score !== null && (
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[11px] text-[#7BAF8E]">Avg AI Score</span>
                  <span className="text-[14px] font-bold text-[#FBBF24]">⚡ {avg_ai_score}%</span>
                </div>
              )}
            </Card>

            <Card className="col-span-4 p-6">
              <SectionTitle>Task Breakdown</SectionTitle>
              {TASK_STATUS_BREAKDOWN.map(item => {
                const count = task_by_status[item.key] || 0
                const pct = stats.total_tasks > 0 ? (count / stats.total_tasks) * 100 : 0
                return (
                  <div key={item.key} className="mb-3">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-[12px] font-medium text-[#F0FAF4]">{item.label}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-[12px] font-bold ${item.className}`}>{count}</span>
                        <span className="text-[10px] text-[#7BAF8E]">{Math.round(pct)}%</span>
                      </div>
                    </div>
                    <ProgressBar percent={pct} fillClass={item.fill} />
                  </div>
                )
              })}
              <div className="flex items-center justify-between border-t border-[rgba(40,98,58,0.2)] pt-3">
                <span className="text-[12px] text-[#F0FAF4]">Completion Rate</span>
                <span className={`text-[20px] font-bold ${task_completion_rate >= 70 ? 'text-[#3EE07F]' : 'text-[#FBBF24]'}`}>
                  {task_completion_rate}%
                </span>
              </div>
            </Card>

            <Card className="col-span-6 p-6">
              <SectionTitle action={<button onClick={() => navigate('/admin/skills')} className="text-[11px] font-semibold text-[#3EE07F] hover:underline">Manage →</button>}>
                Org Skill Gap
              </SectionTitle>
              {!org_skill_gap.length ? (
                <p className="text-[13px] text-[#7BAF8E]">No skill requirements defined yet.</p>
              ) : (
                org_skill_gap.map((skill, index) => (
                  <div key={index} className="mb-3 flex items-center gap-3">
                    <div className="w-28 truncate text-[11px] font-semibold text-[#F0FAF4]">{skill.name}</div>
                    <div className="flex-1">
                      <RatioBar
                        leftValue={skill.demand}
                        rightValue={skill.supply}
                        leftFill="fill-[rgba(248,113,113,0.35)]"
                        rightFill="fill-[rgba(62,224,127,0.28)]"
                      />
                      <div className="mt-1 flex items-center justify-between text-[9px]">
                        <span className="font-bold text-[#F87171]">{skill.demand}</span>
                        <span className="font-bold text-[#3EE07F]">{skill.supply}</span>
                      </div>
                    </div>
                    <div className="w-14 text-right">
                      {skill.gap > 0 ? (
                        <span className="rounded-full bg-[rgba(248,113,113,0.1)] px-1.5 py-0.5 text-[10px] font-bold text-[#F87171]">-{skill.gap}</span>
                      ) : (
                        <span className="text-[10px] font-bold text-[#3EE07F]">✓</span>
                      )}
                    </div>
                  </div>
                ))
              )}
              {!!org_skill_gap.length && (
                <div className="mt-4 flex gap-4 border-t border-[rgba(40,98,58,0.2)] pt-3 text-[10px] text-[#7BAF8E]">
                  <span><span className="text-[#F87171]">■</span> Demand (required by projects)</span>
                  <span><span className="text-[#3EE07F]">■</span> Supply (team members)</span>
                </div>
              )}
            </Card>

            <Card className="col-span-6 p-6">
              <SectionTitle action={<button onClick={() => setActiveTab('users')} className="text-[11px] font-semibold text-[#3EE07F] hover:underline">View all →</button>}>
                Resource Utilization
              </SectionTitle>
              {!workload_dist.length ? (
                <p className="text-[13px] text-[#7BAF8E]">No task assignments yet.</p>
              ) : (
                workload_dist.map((member, index) => {
                  const tone = capTone(member.capacity)
                  return (
                    <div key={index} className="mb-3 flex items-center gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#28623A] to-[#3EE07F] text-[10px] font-bold text-[#0F2027]">
                        {member.username[0].toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center justify-between">
                          <span className="truncate text-[12px] font-semibold text-[#F0FAF4]">{member.username}</span>
                          <span className="ml-2 shrink-0 text-[11px] text-[#7BAF8E]">{member.task_count} task{member.task_count !== 1 ? 's' : ''}</span>
                        </div>
                        <ProgressBar percent={member.capacity} fillClass={tone.fill} heightClass="h-1.5" />
                      </div>
                      <span className={`w-8 shrink-0 text-right text-[11px] font-bold ${tone.text}`}>{member.capacity}%</span>
                    </div>
                  )
                })
              )}
            </Card>
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <div className="relative min-w-[200px] flex-1">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] text-[#7BAF8E]">🔍</span>
                <input
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  placeholder="Search users..."
                  className="ss-input-field w-full rounded-xl py-2.5 pl-9 pr-4 text-[13px]"
                />
              </div>

              <div className="flex gap-1.5">
                {['ALL', 'MEMBER', 'PROJECT_MANAGER', 'ADMIN'].map(role => {
                  const cfg = ROLE_CFG[role]
                  const count = role === 'ALL' ? user_table.length : user_table.filter(userRow => userRow.role === role).length
                  const active = roleFilter === role
                  return (
                    <button
                      key={role}
                      onClick={() => setRoleFilter(role)}
                      className={[
                        'rounded-xl border px-3 py-1.5 text-[11px] font-semibold transition-all',
                        active
                          ? `${cfg?.bg || 'bg-[rgba(40,98,58,0.25)]'} ${cfg?.text || 'text-[#3EE07F]'} ${cfg?.border || 'border-[rgba(62,224,127,0.25)]'}`
                          : 'border-[rgba(40,98,58,0.3)] bg-[rgba(15,32,39,0.5)] text-[#7BAF8E]',
                      ].join(' ')}
                    >
                      {role === 'ALL' ? `All (${count})` : role === 'PROJECT_MANAGER' ? `PM (${count})` : `${role.charAt(0) + role.slice(1).toLowerCase()} (${count})`}
                    </button>
                  )
                })}
              </div>
            </div>

            <Card className="overflow-hidden">
              <table className="w-full">
                <thead className="border-b border-[rgba(40,98,58,0.3)] bg-[rgba(40,98,58,0.1)]">
                  <tr>
                    {['User', 'Role', 'Skills', 'Capacity', 'Joined', 'Actions'].map(header => (
                      <th key={header} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#7BAF8E]">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {!filteredUsers.length ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-[#7BAF8E]">No users match</td>
                    </tr>
                  ) : (
                    filteredUsers.map((userRow, index) => {
                      const roleCfg = ROLE_CFG[userRow.role] || ROLE_CFG.MEMBER
                      const tone = capTone(userRow.capacity)
                      return (
                        <tr
                          key={userRow._id}
                          className={`border-b border-[rgba(40,98,58,0.3)] transition-colors hover:bg-[rgba(40,98,58,0.08)] ${index % 2 === 0 ? 'bg-transparent' : 'bg-[rgba(40,98,58,0.03)]'}`}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#28623A] to-[#3EE07F] text-[11px] font-bold text-[#0F2027]">
                                {userRow.username[0].toUpperCase()}
                              </div>
                              <div>
                                <button onClick={() => navigate(`/admin/profile/${userRow._id}`)} className="block text-[13px] font-semibold text-[#F0FAF4] hover:underline">
                                  {userRow.username}
                                </button>
                                <div className="text-[10px] text-[#7BAF8E]">{userRow.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={userRow.role}
                              onChange={e => handleRoleChange(userRow._id, e.target.value)}
                              disabled={changingRole === userRow._id}
                              className={`cursor-pointer rounded-lg border px-2 py-1 text-[10px] font-bold uppercase outline-none ${roleCfg.bg} ${roleCfg.text} ${roleCfg.border} disabled:opacity-60`}
                            >
                              <option value="MEMBER">Member</option>
                              <option value="PROJECT_MANAGER">PM</option>
                              <option value="ADMIN">Admin</option>
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-[13px] font-semibold text-[#3EE07F]">{userRow.skills_count}</span>
                            <span className="ml-1 text-[10px] text-[#7BAF8E]">skill{userRow.skills_count !== 1 ? 's' : ''}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-20">
                                <ProgressBar percent={userRow.capacity} fillClass={tone.fill} heightClass="h-1.5" />
                              </div>
                              <span className={`text-[11px] font-semibold ${tone.text}`}>{userRow.capacity}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-[11px] text-[#7BAF8E]">{fmtDate(userRow.created_at)}</span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => navigate(`/admin/profile/${userRow._id}`)}
                              className="rounded-lg border border-[rgba(40,98,58,0.3)] bg-[rgba(40,98,58,0.15)] px-3 py-1.5 text-[11px] font-semibold text-[#7BAF8E] transition-all hover:border-[rgba(62,224,127,0.25)] hover:text-[#F0FAF4]"
                            >
                              View →
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
              <div className="border-t border-[rgba(40,98,58,0.3)] px-4 py-3">
                <p className="text-[11px] text-[#7BAF8E]">
                  Showing {filteredUsers.length} of {user_table.length} users
                </p>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="grid grid-cols-2 gap-5">
            {recent_projects.map(project => {
              const statusCfg = STATUS_CFG[project.status] || STATUS_CFG.PLANNING
              return (
                <Card
                  key={project._id}
                  className="p-5"
                  onClick={() => navigate(buildProjectPath(adminPrefix, project._id))}
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="mb-1 truncate text-[14px] font-bold text-[#F0FAF4]">{project.name}</h3>
                      <div className="text-[11px] text-[#7BAF8E]">by {project.created_by}</div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <Badge className={`${statusCfg.text} ${statusCfg.bg} ${statusCfg.border}`}>{statusCfg.label}</Badge>
                      {project.ai_success_score !== null && project.ai_success_score !== undefined && (
                        <span className="text-[10px] font-bold text-[#FBBF24]">⚡ {project.ai_success_score}%</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#7BAF8E]">
                    <span>👥 {project.team_size} member{project.team_size !== 1 ? 's' : ''}</span>
                    <span>{fmtDate(project.created_at)}</span>
                  </div>
                </Card>
              )
            })}
            {!recent_projects.length && (
              <div className="col-span-2 py-16 text-center text-[#7BAF8E]">No projects created yet</div>
            )}
          </div>
        )}

        {activeTab === 'skills' && (
          <div className="grid grid-cols-2 gap-6">
            <Card className="p-6">
              <SectionTitle action={<button onClick={() => navigate('/admin/skills')} className="text-[11px] font-semibold text-[#3EE07F] hover:underline">Manage Taxonomy →</button>}>
                Skill Matrix (Top 15)
              </SectionTitle>
              {!skill_matrix.length ? (
                <p className="text-[13px] text-[#7BAF8E]">No skills on any profile yet.</p>
              ) : (
                skill_matrix.map((skill, index) => {
                  const segments = Object.entries(PROF_CFG).map(([level, cfg]) => ({
                    width: skill.total > 0 ? ((skill[level] || 0) / skill.total) * 100 : 0,
                    fill: cfg.fill,
                  }))

                  return (
                    <div key={index} className="mb-4">
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-[12px] font-semibold text-[#F0FAF4]">{skill.name}</span>
                        <span className="text-[11px] font-bold text-[#3EE07F]">{skill.total} user{skill.total !== 1 ? 's' : ''}</span>
                      </div>
                      <StackedBar segments={segments} />
                      <div className="mt-1 flex flex-wrap gap-2">
                        {Object.entries(PROF_CFG).map(([level, cfg]) => {
                          const count = skill[level] || 0
                          return count > 0 ? (
                            <span key={level} className={`text-[9px] ${cfg.text}`}>
                              {level.charAt(0)}: {count}
                            </span>
                          ) : null
                        })}
                      </div>
                    </div>
                  )
                })
              )}
            </Card>

            <Card className="p-6">
              <SectionTitle>Org Skill Gap Analysis</SectionTitle>
              {!org_skill_gap.length ? (
                <p className="text-[13px] text-[#7BAF8E]">No project skill requirements defined yet.</p>
              ) : (
                org_skill_gap.map((skill, index) => (
                  <div
                    key={index}
                    className={`mb-3 rounded-xl border p-3.5 ${skill.gap > 0 ? 'border-[rgba(248,113,113,0.2)] bg-[rgba(248,113,113,0.06)]' : 'border-[rgba(62,224,127,0.15)] bg-[rgba(62,224,127,0.04)]'}`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[13px] font-semibold text-[#F0FAF4]">{skill.name}</span>
                      {skill.gap > 0 ? (
                        <span className="rounded-full bg-[rgba(248,113,113,0.1)] px-2 py-0.5 text-[11px] font-bold text-[#F87171]">
                          Gap: {skill.gap}
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-[#3EE07F]">✓ Covered</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-[11px] text-[#7BAF8E]">
                      <span>Demanded by <span className="font-bold text-[#F87171]">{skill.demand}</span> project{skill.demand !== 1 ? 's' : ''}</span>
                      <span>Available in <span className="font-bold text-[#3EE07F]">{skill.supply}</span> profile{skill.supply !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                ))
              )}
            </Card>
          </div>
        )}

        {activeTab === 'activity' && (
          <Card className="p-6">
            <SectionTitle>User Activity Logs ({activity_logs.length})</SectionTitle>
            {!activity_logs.length ? (
              <p className="text-[13px] text-[#7BAF8E]">No activity recorded yet.</p>
            ) : (
              activity_logs.map((activity, index) => {
                const roleCfg = ROLE_CFG[activity.user_role] || ROLE_CFG.MEMBER
                return (
                  <div key={index} className="mb-3 flex items-start gap-4 rounded-xl border border-[rgba(40,98,58,0.3)] bg-[rgba(40,98,58,0.06)] p-4 transition-all hover:border-[rgba(62,224,127,0.2)]">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#28623A] to-[#3EE07F] text-[11px] font-bold text-[#0F2027]">
                      {activity.username?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-0.5 flex flex-wrap items-center gap-2">
                        <span className="text-[12px] font-bold text-[#F0FAF4]">{activity.username}</span>
                        <Badge className={`${roleCfg.text} ${roleCfg.bg} ${roleCfg.border}`}>
                          {activity.user_role === 'PROJECT_MANAGER' ? 'PM' : activity.user_role}
                        </Badge>
                      </div>
                      <div className="text-[13px] text-[rgba(240,250,244,0.8)]">
                        <span className="font-medium">{activity.action}</span> — <span className="text-[#3EE07F]">{activity.target}</span>
                      </div>
                      <div className="mt-0.5 text-[11px] text-[rgba(123,175,142,0.5)]">
                        {activity.target_type} · {activity.created_at ? new Date(activity.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </div>
                    </div>
                    <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#3EE07F]" />
                  </div>
                )
              })
            )}
          </Card>
        )}

        <div className="mt-10 flex items-center justify-between border-t border-[rgba(40,98,58,0.15)] pt-5">
          <p className="text-[11px] text-[rgba(123,175,142,0.4)]">SkillSync Admin Dashboard · Data refreshed on load</p>
          <p className="text-[11px] text-[rgba(123,175,142,0.4)]">
            {stats.total_users} users · {stats.total_projects} projects · {stats.total_tasks} tasks
          </p>
        </div>
      </div>
    </div>
  )
}
