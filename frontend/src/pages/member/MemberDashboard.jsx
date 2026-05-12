import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { buildProjectPath, buildProjectTasksPath, getRolePrefixFromRole } from '../../utils/roleRoutes'

const API = 'http://localhost:3000'

const STATUS_CFG = {
  TODO: {
    text: 'text-[#7BAF8E]',
    bg: 'bg-[rgba(123,175,142,0.1)]',
    border: 'border-[rgba(123,175,142,0.25)]',
    fill: 'fill-[#7BAF8E]',
    label: 'To Do',
    icon: '\u25CB',
  },
  IN_PROGRESS: {
    text: 'text-[#60A5FA]',
    bg: 'bg-[rgba(96,165,250,0.1)]',
    border: 'border-[rgba(96,165,250,0.25)]',
    fill: 'fill-[#60A5FA]',
    label: 'In Progress',
    icon: '\u25D1',
  },
  IN_REVIEW: {
    text: 'text-[#FBBF24]',
    bg: 'bg-[rgba(251,191,36,0.1)]',
    border: 'border-[rgba(251,191,36,0.25)]',
    fill: 'fill-[#FBBF24]',
    label: 'In Review',
    icon: '\u25D5',
  },
  DONE: {
    text: 'text-[#3EE07F]',
    bg: 'bg-[rgba(62,224,127,0.1)]',
    border: 'border-[rgba(62,224,127,0.25)]',
    fill: 'fill-[#3EE07F]',
    label: 'Done',
    icon: '\u25CF',
  },
}

const PRIORITY_CFG = {
  LOW: { text: 'text-[#7BAF8E]', icon: '\u2193' },
  MEDIUM: { text: 'text-[#60A5FA]', icon: '\u2192' },
  HIGH: { text: 'text-[#FBBF24]', icon: '\u2191' },
  URGENT: { text: 'text-[#F87171]', icon: '\u26A1' },
}

const PROF_CFG = {
  BEGINNER: {
    text: 'text-[#7BAF8E]',
    bg: 'bg-[rgba(123,175,142,0.12)]',
    border: 'border-[rgba(123,175,142,0.25)]',
    fill: 'fill-[#7BAF8E]',
    pct: 25,
  },
  INTERMEDIATE: {
    text: 'text-[#60A5FA]',
    bg: 'bg-[rgba(96,165,250,0.12)]',
    border: 'border-[rgba(96,165,250,0.25)]',
    fill: 'fill-[#60A5FA]',
    pct: 50,
  },
  ADVANCED: {
    text: 'text-[#FBBF24]',
    bg: 'bg-[rgba(251,191,36,0.12)]',
    border: 'border-[rgba(251,191,36,0.25)]',
    fill: 'fill-[#FBBF24]',
    pct: 75,
  },
  EXPERT: {
    text: 'text-[#3EE07F]',
    bg: 'bg-[rgba(62,224,127,0.12)]',
    border: 'border-[rgba(62,224,127,0.25)]',
    fill: 'fill-[#3EE07F]',
    pct: 100,
  },
}

const REC_STATUS_CFG = {
  NOT_STARTED: {
    text: 'text-[#7BAF8E]',
    bg: 'bg-[rgba(123,175,142,0.1)]',
    border: 'border-[rgba(123,175,142,0.25)]',
    fill: 'fill-[#7BAF8E]',
    label: 'Not Started',
  },
  IN_PROGRESS: {
    text: 'text-[#60A5FA]',
    bg: 'bg-[rgba(96,165,250,0.1)]',
    border: 'border-[rgba(96,165,250,0.25)]',
    fill: 'fill-[#60A5FA]',
    label: 'In Progress',
  },
  COMPLETED: {
    text: 'text-[#3EE07F]',
    bg: 'bg-[rgba(62,224,127,0.1)]',
    border: 'border-[rgba(62,224,127,0.25)]',
    fill: 'fill-[#3EE07F]',
    label: 'Completed',
  },
}

const ACT_ICON = {
  TASK: '\u2713',
  PROJECT: '\u25EB',
  SKILL: '\u25C8',
  COMMENT: '\uD83D\uDCAC',
  SYSTEM: '\u2B21',
}

const BG = () => (
  <>
    <div className="ss-radial-upper fixed inset-0 pointer-events-none" />
    <div className="ss-grid-overlay fixed inset-0 pointer-events-none opacity-[0.03]" />
  </>
)

const Card = ({ children, className = '', onClick }) => (
  <div
    onClick={onClick}
    className={`ss-card ss-card-line relative rounded-2xl ${onClick ? 'cursor-pointer transition-all hover:border-[rgba(62,224,127,0.25)]' : ''} ${className}`}
  >
    {children}
  </div>
)

const SectionTitle = ({ children, action }) => (
  <div className="mb-4 flex items-center justify-between">
    <h2 className="text-[13px] font-bold uppercase tracking-widest text-[#7BAF8E]">{children}</h2>
    {action}
  </div>
)

const Badge = ({ children, className = '' }) => (
  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${className}`}>
    {children}
  </span>
)

const Btn = ({ children, onClick, variant = 'primary', disabled = false, className = '' }) => {
  const variants = {
    primary: 'ss-btn-primary',
    ghost: 'ss-btn-ghost',
    accent: 'ss-btn-accent',
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${variants[variant]} rounded-xl px-4 py-2 text-[12px] font-semibold disabled:opacity-60 ${className}`}
    >
      {children}
    </button>
  )
}

const progressWidthClass = (percent) => `ss-w-${Math.max(0, Math.min(100, Math.round(Number(percent) || 0)))}`
const toBarFillClass = (fillClass) => fillClass.replace(/^fill-/, 'bg-')

const ProgressBar = ({ percent, fillClass, heightClass = 'h-2', bgClass = 'bg-[rgba(40,98,58,0.2)]' }) => {
  return (
    <div className={`${heightClass} overflow-hidden rounded-full ${bgClass}`}>
      <div className={`ss-progress-fill ${toBarFillClass(fillClass)} ${progressWidthClass(percent)}`} />
    </div>
  )
}

const toneForCapacity = (percent) => (
  percent >= 85
    ? {
        text: 'text-[#F87171]',
        fill: 'fill-[#F87171]',
        label: 'Overloaded',
      }
    : percent >= 65
      ? {
          text: 'text-[#FBBF24]',
          fill: 'fill-[#FBBF24]',
          label: 'Busy',
        }
      : {
          text: 'text-[#3EE07F]',
          fill: 'fill-[#3EE07F]',
          label: 'Available',
        }
)

const toneForDaysLeft = (days) => (
  days < 0
    ? { text: 'text-[#F87171]', bg: 'bg-[rgba(248,113,113,0.1)]' }
    : days <= 2
      ? { text: 'text-[#FBBF24]', bg: 'bg-[rgba(251,191,36,0.1)]' }
      : { text: 'text-[#7BAF8E]', bg: 'bg-[rgba(40,98,58,0.1)]' }
)

const scoreTone = (score) => (
  score >= 80 ? 'text-[#3EE07F]' : score >= 50 ? 'text-[#FBBF24]' : 'text-[#60A5FA]'
)

const fmtDate = (value, opts = { day: 'numeric', month: 'short' }) => (
  value ? new Date(value).toLocaleDateString('en-IN', opts) : '\u2014'
)

const daysLeft = (value) => (
  value ? Math.ceil((new Date(value) - new Date()) / 86400000) : null
)

const normalizeAiMatches = (matches = []) =>
  matches.map(match => ({
    project: {
      _id: match.project_id,
      name: match.project_name,
      description: match.description,
      status: match.status,
      ai_success_score: match.ai_success_score,
      team_size: match.team_size,
      start_date: match.start_date,
      end_date: match.end_date,
      budget: match.budget,
    },
    match_score: match.match_score,
    matched_skills: (match.matched_skills || []).map(skill => skill.skill_name),
    under_proficient_skills: match.under_proficient_skills || [],
    missing_skills: match.missing_skills || [],
    interest_expressed: !!match.interest_expressed,
    total_required:
      (match.matched_skills || []).length +
      (match.under_proficient_skills || []).length +
      (match.missing_skills || []).length,
  }))

const TaskRow = ({ task, onStatusChange }) => {
  const statusCfg = STATUS_CFG[task.status] || STATUS_CFG.TODO
  const priorityCfg = PRIORITY_CFG[task.priority] || PRIORITY_CFG.LOW
  const dueDelta = daysLeft(task.due_date)
  const dayTone = dueDelta === null ? null : toneForDaysLeft(dueDelta)
  const subtaskPct = task.subtasks?.total > 0 ? (task.subtasks.done / task.subtasks.total) * 100 : 0

  return (
    <div className="group flex items-center gap-3 rounded-xl border border-[rgba(40,98,58,0.3)] bg-[rgba(40,98,58,0.06)] px-4 py-3 transition-all hover:border-[rgba(62,224,127,0.2)]">
      <span className={`shrink-0 text-[14px] ${priorityCfg.text}`}>{priorityCfg.icon}</span>

      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-semibold text-[#F0FAF4]">{task.title}</div>
        {task.project && <div className="truncate text-[10px] text-[#7BAF8E]">{task.project.name}</div>}
      </div>

      {task.subtasks?.total > 0 && (
        <div className="flex shrink-0 items-center gap-1.5">
          <div className="h-1 w-12 rounded-full bg-[rgba(40,98,58,0.2)]">
            <ProgressBar percent={subtaskPct} fillClass="fill-[#3EE07F]" heightClass="h-1" />
          </div>
          <span className="text-[9px] text-[#7BAF8E]">
            {task.subtasks.done}/{task.subtasks.total}
          </span>
        </div>
      )}

      {dueDelta !== null && (
        <span className={`shrink-0 text-[10px] font-semibold ${dayTone.text}`}>
          {dueDelta < 0 ? `${Math.abs(dueDelta)}d OD` : dueDelta === 0 ? 'Today' : `${dueDelta}d`}
        </span>
      )}

      <select
        value={task.status}
        onChange={e => onStatusChange(task._id, e.target.value)}
        onClick={e => e.stopPropagation()}
        className={`shrink-0 cursor-pointer rounded-lg border px-2 py-1 text-[10px] font-bold uppercase outline-none ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
      >
        {Object.entries(STATUS_CFG).map(([key, cfg]) => (
          <option key={key} value={key}>{cfg.label}</option>
        ))}
      </select>
    </div>
  )
}

export default function MemberDashboard() {
  const navigate = useNavigate()
  const memberPrefix = getRolePrefixFromRole('MEMBER')

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  const [taskFilter, setTaskFilter] = useState('ALL')
  const [expressingProjectId, setExpressingProjectId] = useState(null)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    setLoading(true)
    try {
      const [dashboardRes, matchesRes] = await Promise.all([
        axios.get(`${API}/api/member/dashboard`, { withCredentials: true }),
        axios.get(`${API}/api/ai/projects/matches/me`, { withCredentials: true }),
      ])

      setData({
        ...dashboardRes.data,
        matched_projects: normalizeAiMatches(matchesRes.data.matches),
      })
    } catch (err) {
      if (err.response?.status === 401) navigate('/login')
      else setError('Failed to load dashboard.')
    } finally {
      setLoading(false)
    }
  }

  const handleExpressInterest = async (projectId) => {
    setExpressingProjectId(projectId)
    try {
      await axios.post(`${API}/api/member/projects/${projectId}/interest`, {}, { withCredentials: true })
      setData(prev => ({
        ...prev,
        matched_projects: prev.matched_projects.map(match =>
          match.project._id === projectId ? { ...match, interest_expressed: true } : match
        ),
      }))
    } catch (err) {
      console.error(err)
    } finally {
      setExpressingProjectId(null)
    }
  }

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await axios.put(`${API}/api/tasks/${taskId}`, { status: newStatus }, { withCredentials: true })
      setData(prev => {
        const previousTask = prev.my_tasks.find(task => task._id === taskId)
        const previousStatusKey = previousTask?.status?.toLowerCase()
        return {
          ...prev,
          my_tasks: prev.my_tasks.map(task => task._id === taskId ? { ...task, status: newStatus } : task),
          task_stats: previousStatusKey
            ? {
                ...prev.task_stats,
                [previousStatusKey]: prev.task_stats[previousStatusKey] - 1,
              }
            : prev.task_stats,
        }
      })
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div className="ss-bg-app min-h-screen flex items-center justify-center">
        <BG />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="ss-spinner h-12 w-12 animate-spin rounded-full border-2" />
          <span className="text-[13px] text-[#7BAF8E]">Loading dashboard...</span>
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
    user,
    task_stats,
    my_tasks,
    upcoming_deadlines,
    matched_projects,
    workload,
    recommendations,
    recent_activity,
    metrics,
    my_projects,
  } = data

  const tabs = ['overview', 'my tasks', 'projects', 'skills & growth']
  const filteredTasks = taskFilter === 'ALL' ? my_tasks : my_tasks.filter(task => task.status === taskFilter)
  const completionPct = task_stats.total > 0 ? Math.round((task_stats.done / task_stats.total) * 100) : 0
  const workloadTone = toneForCapacity(workload.capacity_percentage)
  const hoursPct = workload.hours_available_per_week > 0
    ? Math.min(100, (workload.hours_logged_this_week / workload.hours_available_per_week) * 100)
    : 0
  const activeCount = task_stats.in_progress + task_stats.in_review

  return (
    <div className="ss-bg-app min-h-screen font-sans">
      <BG />
      <div className="relative z-10 mx-auto max-w-[1200px] px-6 py-10">
        <div className="mb-10 flex items-start justify-between">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#28623A] to-[#3EE07F] text-[15px] font-bold text-[#0F2027]">
                {user.profile_picture_url
                  ? <img src={user.profile_picture_url} alt={user.username} className="h-full w-full object-cover" />
                  : user.username.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-widest text-[#7BAF8E]">Team Member</div>
                <div className="text-[18px] font-bold leading-tight text-[#F0FAF4]">Welcome back, {user.username}</div>
              </div>
            </div>
            <p className="text-[13px] text-[#7BAF8E]">
              {activeCount} task{activeCount !== 1 ? 's' : ''} in progress
              {task_stats.overdue > 0 && <> {'\u00B7'} <span className="text-[#F87171]">{task_stats.overdue} overdue</span></>}
              {upcoming_deadlines.length > 0 && <> {'\u00B7'} <span className="text-[#FBBF24]">{upcoming_deadlines.length} due soon</span></>}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Btn variant="ghost" onClick={() => navigate('/profile')}>My Profile</Btn>
            <Btn onClick={fetchDashboard}>{'\u21BB'} Refresh</Btn>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-6 gap-4">
          {[
            { label: 'Total Tasks', value: task_stats.total, className: 'text-[#F0FAF4]', icon: '\u25EB' },
            { label: 'In Progress', value: task_stats.in_progress, className: 'text-[#60A5FA]', icon: '\u25D1' },
            { label: 'In Review', value: task_stats.in_review, className: 'text-[#FBBF24]', icon: '\u25D5' },
            { label: 'Done', value: task_stats.done, className: 'text-[#3EE07F]', icon: '\u25CF' },
            { label: 'Overdue', value: task_stats.overdue, className: task_stats.overdue > 0 ? 'text-[#F87171]' : 'text-[#7BAF8E]', icon: '\u26A0' },
            { label: 'Completion', value: `${completionPct}%`, className: completionPct >= 70 ? 'text-[#3EE07F]' : 'text-[#FBBF24]', icon: '\u2B21' },
          ].map(card => (
            <Card key={card.label} className="px-[18px] py-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[16px]">{card.icon}</span>
                <span className={`text-[22px] font-bold leading-none ${card.className}`}>{card.value}</span>
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
              <SectionTitle>Current Workload</SectionTitle>

              <div className="mb-5 flex items-center gap-4">
                <div className="relative h-20 w-20 shrink-0">
                  <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(40,98,58,0.2)" strokeWidth="8" />
                    <circle
                      cx="40"
                      cy="40"
                      r="32"
                      fill="none"
                      stroke={workload.capacity_percentage >= 85 ? '#F87171' : workload.capacity_percentage >= 65 ? '#FBBF24' : '#3EE07F'}
                      strokeWidth="8"
                      strokeDasharray={`${(workload.capacity_percentage / 100) * 201} 201`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-[15px] font-bold ${workloadTone.text}`}>{workload.capacity_percentage}%</span>
                  </div>
                </div>

                <div>
                  <div className="mb-1 text-[13px] font-semibold text-[#F0FAF4]">{workloadTone.label}</div>
                  <div className="text-[11px] text-[#7BAF8E]">
                    {workload.active_tasks} active task{workload.active_tasks !== 1 ? 's' : ''}
                  </div>
                  <div className="text-[11px] text-[#7BAF8E]">
                    {workload.hours_available_per_week}h / week available
                  </div>
                </div>
              </div>

              <div className="mb-3 rounded-xl border border-[rgba(40,98,58,0.3)] bg-[rgba(40,98,58,0.08)] p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-[#F0FAF4]">Hours Logged This Week</span>
                  <span className="text-[16px] font-bold text-[#3EE07F]">{workload.hours_logged_this_week}h</span>
                </div>
                <ProgressBar percent={hoursPct} fillClass="fill-[#3EE07F]" />
                <div className="mt-1 text-[10px] text-[#7BAF8E]">of {workload.hours_available_per_week}h available</div>
              </div>

              {(metrics.on_time_delivery_rate > 0 || metrics.collaboration_score > 0) && (
                <div className="space-y-2">
                  {[
                    { label: 'On-time Rate', value: metrics.on_time_delivery_rate || 0, fill: 'fill-[#3EE07F]', className: 'text-[#3EE07F]' },
                    { label: 'Collab Score', value: metrics.collaboration_score || 0, fill: 'fill-[#60A5FA]', className: 'text-[#60A5FA]' },
                  ].map(metric => (
                    <div key={metric.label}>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-[11px] text-[#F0FAF4]">{metric.label}</span>
                        <span className={`text-[12px] font-bold ${metric.className}`}>{metric.value}%</span>
                      </div>
                      <ProgressBar percent={metric.value} fillClass={metric.fill} heightClass="h-1.5" />
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="col-span-8 p-6">
              <SectionTitle action={<button onClick={() => setActiveTab('my tasks')} className="text-[11px] font-semibold text-[#3EE07F] hover:underline">View all {'\u2192'}</button>}>
                Upcoming Deadlines
              </SectionTitle>
              {!upcoming_deadlines.length ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="mb-2 text-[32px]">{'\uD83C\uDF89'}</div>
                  <p className="text-[13px] font-medium text-[#F0FAF4]">No upcoming deadlines</p>
                  <p className="mt-1 text-[11px] text-[#7BAF8E]">You&apos;re all caught up!</p>
                </div>
              ) : (
                upcoming_deadlines.map(task => {
                  const priorityCfg = PRIORITY_CFG[task.priority] || PRIORITY_CFG.LOW
                  const statusCfg = STATUS_CFG[task.status] || STATUS_CFG.TODO
                  const dayTone = toneForDaysLeft(task.days_left)
                  return (
                    <div
                      key={task._id}
                      onClick={() => navigate(task.project ? buildProjectTasksPath(memberPrefix, task.project._id) : '#')}
                      className="mb-2 flex cursor-pointer items-center gap-3 rounded-xl border border-[rgba(40,98,58,0.3)] bg-[rgba(40,98,58,0.06)] p-3 transition-all hover:border-[rgba(62,224,127,0.25)]"
                    >
                      <span className={`shrink-0 text-[14px] ${priorityCfg.text}`}>{priorityCfg.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[12px] font-semibold text-[#F0FAF4]">{task.title}</div>
                        {task.project && <div className="text-[10px] text-[#7BAF8E]">{task.project.name}</div>}
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${dayTone.text} ${dayTone.bg}`}>
                        {task.days_left < 0 ? `${Math.abs(task.days_left)}d overdue` : task.days_left === 0 ? 'Today' : `${task.days_left}d`}
                      </span>
                      <Badge className={`${statusCfg.text} ${statusCfg.bg} ${statusCfg.border}`}>{statusCfg.icon} {statusCfg.label}</Badge>
                    </div>
                  )
                })
              )}
            </Card>

            <Card className="col-span-6 p-6">
              <SectionTitle action={<button onClick={() => setActiveTab('projects')} className="text-[11px] font-semibold text-[#3EE07F] hover:underline">View all {'\u2192'}</button>}>
                Available Projects (Skill Matched)
              </SectionTitle>
              {!matched_projects.length ? (
                <div className="py-8 text-center">
                  <div className="mb-2 text-[32px]">{'\u25EB'}</div>
                  <p className="text-[13px] text-[#F0FAF4]">No matching projects yet</p>
                  <p className="mx-auto mt-1 max-w-[220px] text-[11px] text-[#7BAF8E]">Add skills to your profile to get matched with projects</p>
                  <Btn variant="ghost" onClick={() => navigate('/profile')} className="mt-3 px-4 py-2 text-[11px]">
                    Update Skills {'\u2192'}
                  </Btn>
                </div>
              ) : (
                matched_projects.map(({ project, match_score, matched_skills, total_required, interest_expressed }) => (
                  <div key={project._id} className="mb-3 rounded-xl border border-[rgba(40,98,58,0.3)] bg-[rgba(40,98,58,0.07)] p-4 transition-all hover:border-[rgba(62,224,127,0.25)]">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-semibold text-[#F0FAF4]">{project.name}</div>
                        {project.description && (
                          <div className="mt-0.5 truncate text-[10px] text-[#7BAF8E]">{project.description}</div>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <div className={`text-[18px] font-bold leading-none ${scoreTone(match_score)}`}>{match_score}%</div>
                        <div className="text-[9px] uppercase tracking-wide text-[#7BAF8E]">match</div>
                      </div>
                    </div>
                    <ProgressBar percent={match_score} fillClass={match_score >= 80 ? 'fill-[#3EE07F]' : match_score >= 50 ? 'fill-[#FBBF24]' : 'fill-[#60A5FA]'} heightClass="h-1.5" />
                    {matched_skills.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {matched_skills.slice(0, 4).map(skill => (
                          <span key={skill} className="rounded-full bg-[rgba(62,224,127,0.1)] px-2 py-0.5 text-[9px] font-semibold text-[#3EE07F]">
                            {'\u2713'} {skill}
                          </span>
                        ))}
                        {matched_skills.length > 4 && <span className="text-[9px] text-[#7BAF8E]">+{matched_skills.length - 4} more</span>}
                      </div>
                    )}
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[10px] text-[#7BAF8E]">
                        {matched_skills.length}/{total_required} skills matched
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleExpressInterest(project._id)}
                          disabled={interest_expressed || expressingProjectId === project._id}
                          className={[
                            'rounded-xl border px-3 py-1.5 text-[10px] font-semibold transition-all disabled:opacity-60',
                            interest_expressed
                              ? 'border-[rgba(96,165,250,0.2)] bg-[rgba(96,165,250,0.1)] text-[#60A5FA]'
                              : 'border-[rgba(62,224,127,0.2)] bg-[rgba(62,224,127,0.1)] text-[#3EE07F]',
                          ].join(' ')}
                        >
                          {expressingProjectId === project._id ? 'Saving...' : interest_expressed ? 'Interested' : 'Express Interest'}
                        </button>
                        <Badge className={project.status === 'ACTIVE' ? 'border-[rgba(62,224,127,0.2)] bg-[rgba(62,224,127,0.1)] text-[#3EE07F]' : 'border-[rgba(96,165,250,0.2)] bg-[rgba(96,165,250,0.1)] text-[#60A5FA]'}>
                          {project.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </Card>

            <Card className="col-span-6 p-6">
              <SectionTitle action={<button onClick={() => navigate('/profile')} className="text-[11px] font-semibold text-[#3EE07F] hover:underline">Full history {'\u2192'}</button>}>
                Recent Activity
              </SectionTitle>
              {!recent_activity.length ? (
                <p className="text-[13px] text-[#7BAF8E]">No activity recorded yet.</p>
              ) : (
                recent_activity.map((item, index) => (
                  <div key={index} className="mb-3 flex items-start gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[rgba(40,98,58,0.15)] text-[12px] text-[#3EE07F]">
                      {ACT_ICON[item.target_type] || '\u2B21'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[12px] text-[rgba(240,250,244,0.8)]">
                        <span className="font-medium">{item.action}</span> {'\u2014'} <span className="text-[#3EE07F]">{item.target}</span>
                      </div>
                      <div className="mt-0.5 text-[10px] text-[rgba(123,175,142,0.5)]">
                        {fmtDate(item.created_at, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </Card>
          </div>
        )}

        {activeTab === 'my tasks' && (
          <div>
            <div className="mb-5 flex flex-wrap gap-2">
              {['ALL', ...Object.keys(STATUS_CFG)].map(key => {
                const cfg = STATUS_CFG[key]
                const count = key === 'ALL' ? my_tasks.length : my_tasks.filter(task => task.status === key).length
                const active = taskFilter === key
                return (
                  <button
                    key={key}
                    onClick={() => setTaskFilter(key)}
                    className={[
                      'rounded-xl border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-all',
                      active
                        ? `${cfg?.bg || 'bg-[rgba(40,98,58,0.25)]'} ${cfg?.text || 'text-[#3EE07F]'} ${cfg?.border || 'border-[rgba(62,224,127,0.25)]'}`
                        : 'border-[rgba(40,98,58,0.3)] bg-[rgba(15,32,39,0.5)] text-[#7BAF8E]',
                    ].join(' ')}
                  >
                    {key === 'ALL' ? `All (${count})` : `${cfg.icon} ${cfg.label} (${count})`}
                  </button>
                )
              })}
            </div>

            <Card className="py-2">
              {!filteredTasks.length ? (
                <div className="py-12 text-center">
                  <div className="mb-3 text-[40px]">{'\u25EB'}</div>
                  <p className="text-[14px] font-medium text-[#F0FAF4]">No tasks yet</p>
                  <p className="mt-1 text-[12px] text-[#7BAF8E]">
                    {taskFilter === 'ALL' ? 'No tasks have been assigned to you yet' : `No ${STATUS_CFG[taskFilter]?.label} tasks`}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 px-2 py-2">
                  {filteredTasks.map(task => (
                    <TaskRow key={task._id} task={task} onStatusChange={handleStatusChange} />
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="grid grid-cols-2 gap-5">
            <div>
              <h3 className="mb-4 text-[12px] font-bold uppercase tracking-widest text-[#7BAF8E]">My Projects ({my_projects.length})</h3>
              {!my_projects.length ? (
                <Card className="px-6 py-10">
                  <div className="text-center">
                    <div className="mb-3 text-[36px]">{'\u25EB'}</div>
                    <p className="text-[13px] text-[#7BAF8E]">No projects assigned yet</p>
                  </div>
                </Card>
              ) : (
                my_projects.map(project => (
                  <Card
                    key={project._id}
                    onClick={() => navigate(buildProjectTasksPath(memberPrefix, project._id))}
                    className="mb-3 cursor-pointer px-6 py-5"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-[14px] font-bold text-[#F0FAF4]">{project.name}</div>
                        <Badge className={`${(STATUS_CFG[project.status] || STATUS_CFG.TODO).text} ${(STATUS_CFG[project.status] || STATUS_CFG.TODO).bg} ${(STATUS_CFG[project.status] || STATUS_CFG.TODO).border}`}>
                          {project.status}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-[22px] font-bold text-[#3EE07F]">{project.progress}%</div>
                        <div className="text-[10px] text-[#7BAF8E]">complete</div>
                      </div>
                    </div>
                    <ProgressBar percent={project.progress} fillClass="fill-[#3EE07F]" />
                    <div className="mt-2 text-[11px] text-[#7BAF8E]">
                      {project.tasks.done}/{project.tasks.total} tasks done
                    </div>
                  </Card>
                ))
              )}
            </div>

            <div>
              <h3 className="mb-4 text-[12px] font-bold uppercase tracking-widest text-[#7BAF8E]">Available Projects {'\u2014'} Skill Matched ({matched_projects.length})</h3>
              {!matched_projects.length ? (
                <Card className="px-6 py-10">
                  <div className="text-center">
                    <div className="mb-3 text-[36px]">{'\u25C8'}</div>
                    <p className="mb-2 text-[13px] text-[#F0FAF4]">No skill-matched projects</p>
                    <p className="mb-4 text-[11px] text-[#7BAF8E]">Add skills to your profile to get matched</p>
                    <Btn variant="ghost" onClick={() => navigate('/profile')} className="px-4 py-2 text-[11px]">
                      Update Profile {'\u2192'}
                    </Btn>
                  </div>
                </Card>
              ) : (
                matched_projects.map(({ project, match_score, matched_skills, total_required, interest_expressed }) => (
                  <Card key={project._id} className="mb-3 px-6 py-5">
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div>
                        <div className="mb-1 text-[14px] font-bold text-[#F0FAF4]">{project.name}</div>
                        <Badge className={project.status === 'ACTIVE' ? 'border-[rgba(62,224,127,0.2)] bg-[rgba(62,224,127,0.1)] text-[#3EE07F]' : 'border-[rgba(96,165,250,0.2)] bg-[rgba(96,165,250,0.1)] text-[#60A5FA]'}>
                          {project.status}
                        </Badge>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className={`text-[22px] font-bold ${scoreTone(match_score)}`}>{match_score}%</div>
                        <div className="text-[10px] text-[#7BAF8E]">skill match</div>
                      </div>
                    </div>
                    <ProgressBar percent={match_score} fillClass={match_score >= 80 ? 'fill-[#3EE07F]' : match_score >= 50 ? 'fill-[#FBBF24]' : 'fill-[#60A5FA]'} heightClass="h-1.5" />
                    <div className="mb-2 mt-3 flex flex-wrap gap-1.5">
                      {matched_skills.slice(0, 4).map(skill => (
                        <span key={skill} className="rounded-full bg-[rgba(62,224,127,0.1)] px-2 py-0.5 text-[9px] font-semibold text-[#3EE07F]">
                          {'\u2713'} {skill}
                        </span>
                      ))}
                    </div>
                    <div className="text-[10px] text-[#7BAF8E]">
                      {matched_skills.length}/{total_required} required skills matched
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <button
                        onClick={() => navigate(buildProjectPath(memberPrefix, project._id))}
                        className="rounded-xl border border-[rgba(96,165,250,0.2)] bg-[rgba(96,165,250,0.1)] px-3 py-1.5 text-[10px] font-semibold text-[#60A5FA] transition-all"
                      >
                        View Project
                      </button>
                      <button
                        onClick={() => handleExpressInterest(project._id)}
                        disabled={interest_expressed || expressingProjectId === project._id}
                        className={[
                          'rounded-xl border px-3 py-1.5 text-[10px] font-semibold transition-all disabled:opacity-60',
                          interest_expressed
                            ? 'border-[rgba(96,165,250,0.2)] bg-[rgba(96,165,250,0.1)] text-[#60A5FA]'
                            : 'border-[rgba(62,224,127,0.2)] bg-[rgba(62,224,127,0.1)] text-[#3EE07F]',
                        ].join(' ')}
                      >
                        {expressingProjectId === project._id ? 'Saving...' : interest_expressed ? 'Interested' : 'Express Interest'}
                      </button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'skills & growth' && (
          <div className="grid grid-cols-2 gap-6">
            <Card className="p-6">
              <SectionTitle action={<button onClick={() => navigate('/profile')} className="text-[11px] font-semibold text-[#3EE07F] hover:underline">Manage {'\u2192'}</button>}>
                My Skills ({user.skills?.length || 0})
              </SectionTitle>
              {!user.skills?.length ? (
                <div className="py-8 text-center">
                  <div className="mb-3 text-[36px]">{'\u25C8'}</div>
                  <p className="mb-3 text-[13px] text-[#7BAF8E]">No skills added yet</p>
                  <Btn variant="ghost" onClick={() => navigate('/profile')} className="px-4 py-2 text-[11px]">
                    Add Skills {'\u2192'}
                  </Btn>
                </div>
              ) : (
                user.skills.map(skill => {
                  const cfg = PROF_CFG[skill.proficiency_level] || PROF_CFG.BEGINNER
                  return (
                    <div key={skill._id} className="mb-4">
                      <div className="mb-1.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-semibold text-[#F0FAF4]">{skill.skill_name || skill.name}</span>
                          {skill.verified && (
                            <span className="rounded-full bg-[rgba(62,224,127,0.12)] px-1.5 py-0.5 text-[9px] font-bold text-[#3EE07F]">{'\u2713'}</span>
                          )}
                        </div>
                        <Badge className={`${cfg.text} ${cfg.bg} ${cfg.border}`}>{skill.proficiency_level}</Badge>
                      </div>
                      <ProgressBar percent={cfg.pct} fillClass={cfg.fill} heightClass="h-1.5" />
                    </div>
                  )
                })
              )}
            </Card>

            <Card className="p-6">
              <SectionTitle action={<button onClick={() => navigate('/profile')} className="text-[11px] font-semibold text-[#3EE07F] hover:underline">View all {'\u2192'}</button>}>
                Skill Development Recommendations
              </SectionTitle>
              {!recommendations.length ? (
                <div className="py-8 text-center">
                  <div className="mb-3 text-[36px]">{'\uD83D\uDCDA'}</div>
                  <p className="text-[13px] text-[#F0FAF4]">No recommendations yet</p>
                  <p className="mt-1 text-[11px] text-[#7BAF8E]">Your PM will suggest learning resources based on project needs</p>
                </div>
              ) : (
                recommendations.map(rec => {
                  const statusCfg = REC_STATUS_CFG[rec.status] || REC_STATUS_CFG.NOT_STARTED
                  const priorityClass =
                    rec.priority === 'HIGH'
                      ? 'border-[rgba(248,113,113,0.2)] bg-[rgba(248,113,113,0.1)] text-[#F87171]'
                      : rec.priority === 'MEDIUM'
                        ? 'border-[rgba(251,191,36,0.2)] bg-[rgba(251,191,36,0.1)] text-[#FBBF24]'
                        : 'border-[rgba(123,175,142,0.2)] bg-[rgba(123,175,142,0.1)] text-[#7BAF8E]'
                  const progressPct = Number(rec.progress_pct || 0)

                  return (
                    <div key={rec._id} className="mb-3 rounded-xl border border-[rgba(40,98,58,0.3)] bg-[rgba(40,98,58,0.08)] p-4 transition-all hover:border-[rgba(62,224,127,0.25)]">
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <span className="text-[13px] font-bold text-[#F0FAF4]">{rec.skill_name}</span>
                        <div className="flex items-center gap-1.5">
                          <Badge className={priorityClass}>{rec.priority}</Badge>
                          <Badge className={`${statusCfg.text} ${statusCfg.bg} ${statusCfg.border}`}>{statusCfg.label}</Badge>
                        </div>
                      </div>
                      <div className="mb-2 flex items-center gap-2 text-[11px] text-[#7BAF8E]">
                        <span>{rec.current_level}</span>
                        <span className="text-[#3EE07F]">{'\u2192'}</span>
                        <span className="font-bold text-[#3EE07F]">{rec.target_level}</span>
                      </div>
                      <div className="mb-3">
                        <div className="mb-1 flex items-center justify-between text-[10px] text-[#7BAF8E]">
                          <span>Progress</span>
                          <span className={statusCfg.text}>{progressPct}%</span>
                        </div>
                        <ProgressBar percent={progressPct} fillClass={statusCfg.fill} heightClass="h-1.5" />
                      </div>
                      {rec.course_name && (
                        rec.course_url
                          ? <a href={rec.course_url} target="_blank" rel="noreferrer" className="block text-[11px] font-medium text-[#3EE07F] hover:underline">{'\uD83D\uDCDA'} {rec.course_name}</a>
                          : <p className="text-[11px] font-medium text-[#3EE07F]">{'\uD83D\uDCDA'} {rec.course_name}</p>
                      )}
                      {rec.reason && <p className="mt-1 text-[11px] text-[#7BAF8E]">{rec.reason}</p>}
                    </div>
                  )
                })
              )}
            </Card>
          </div>
        )}

        <div className="mt-10 flex items-center justify-between border-t border-[rgba(40,98,58,0.15)] pt-5">
          <p className="text-[11px] text-[rgba(123,175,142,0.4)]">SkillSync {'\u00B7'} Data refreshed on load</p>
          <button onClick={fetchDashboard} className="text-[11px] font-semibold text-[rgba(123,175,142,0.4)] transition-colors hover:text-[#7BAF8E]">
            {'\u21BB'} Refresh data
          </button>
        </div>
      </div>
    </div>
  )
}
