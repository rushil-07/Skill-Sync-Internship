import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const API = 'http://localhost:3000'

const STATUS_CFG = {
  PLANNING: {
    text: 'text-[#60A5FA]',
    bg: 'bg-[rgba(96,165,250,0.12)]',
    border: 'border-[rgba(96,165,250,0.22)]',
    fill: 'fill-[#60A5FA]',
    label: 'Planning',
    icon: '\u25F7',
  },
  ACTIVE: {
    text: 'text-[#3EE07F]',
    bg: 'bg-[rgba(62,224,127,0.12)]',
    border: 'border-[rgba(62,224,127,0.22)]',
    fill: 'fill-[#3EE07F]',
    label: 'Active',
    icon: '\u25B6',
  },
  COMPLETED: {
    text: 'text-[#FBBF24]',
    bg: 'bg-[rgba(251,191,36,0.12)]',
    border: 'border-[rgba(251,191,36,0.22)]',
    fill: 'fill-[#FBBF24]',
    label: 'Completed',
    icon: '\u2713',
  },
  ON_HOLD: {
    text: 'text-[#F87171]',
    bg: 'bg-[rgba(248,113,113,0.12)]',
    border: 'border-[rgba(248,113,113,0.22)]',
    fill: 'fill-[#F87171]',
    label: 'On Hold',
    icon: '\u23F8',
  },
}

const TASK_STATUS_CFG = {
  TODO: { text: 'text-[#7BAF8E]', fill: 'fill-[#7BAF8E]', label: 'To Do', icon: '\u25CB' },
  IN_PROGRESS: { text: 'text-[#60A5FA]', fill: 'fill-[#60A5FA]', label: 'In Progress', icon: '\u25D1' },
  IN_REVIEW: { text: 'text-[#FBBF24]', fill: 'fill-[#FBBF24]', label: 'In Review', icon: '\u25D5' },
  DONE: { text: 'text-[#3EE07F]', fill: 'fill-[#3EE07F]', label: 'Done', icon: '\u25CF' },
}

const PRIORITY_CFG = {
  LOW: { text: 'text-[#7BAF8E]', icon: '\u2193' },
  MEDIUM: { text: 'text-[#60A5FA]', icon: '\u2192' },
  HIGH: { text: 'text-[#FBBF24]', icon: '\u2191' },
  URGENT: { text: 'text-[#F87171]', icon: '\u26A1' },
}

const ALERT_CFG = {
  OVERLOAD: {
    text: 'text-[#F87171]',
    bg: 'bg-[rgba(248,113,113,0.1)]',
    border: 'border-[rgba(248,113,113,0.2)]',
    icon: '\u26A0',
  },
  RISK: {
    text: 'text-[#FBBF24]',
    bg: 'bg-[rgba(251,191,36,0.1)]',
    border: 'border-[rgba(251,191,36,0.2)]',
    icon: '\u26A1',
  },
  DEADLINE: {
    text: 'text-[#60A5FA]',
    bg: 'bg-[rgba(96,165,250,0.1)]',
    border: 'border-[rgba(96,165,250,0.2)]',
    icon: '\u25F7',
  },
  WARNING: {
    text: 'text-[#7BAF8E]',
    bg: 'bg-[rgba(123,175,142,0.1)]',
    border: 'border-[rgba(123,175,142,0.2)]',
    icon: '\u25C8',
  },
}

const BG = () => (
  <>
    <div className="fixed inset-0 pointer-events-none ss-radial-zero" />
    <div className="fixed inset-0 pointer-events-none opacity-[0.03] ss-grid-overlay" />
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
    <h2 className="text-[14px] font-bold uppercase tracking-widest text-[#7BAF8E]">{children}</h2>
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

const capacityTone = (pct) => (
  pct >= 85
    ? {
        text: 'text-[#F87171]',
        fill: 'fill-[#F87171]',
        badge: 'bg-[rgba(248,113,113,0.1)] text-[#F87171]',
        label: 'Overloaded',
      }
    : pct >= 65
      ? {
          text: 'text-[#FBBF24]',
          fill: 'fill-[#FBBF24]',
          badge: 'bg-[rgba(251,191,36,0.1)] text-[#FBBF24]',
          label: 'Busy',
        }
      : {
          text: 'text-[#3EE07F]',
          fill: 'fill-[#3EE07F]',
          badge: 'bg-[rgba(62,224,127,0.1)] text-[#3EE07F]',
          label: 'Available',
        }
)

const fmtDate = (value) => (
  value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No due date'
)

function RedistributionModal({
  open,
  loading,
  error,
  data,
  busyMap,
  onClose,
  onReassign,
  onOpenTasks,
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 ss-modal-backdrop">
      <div className="ss-modal-card ss-card-line-strong relative w-full max-w-[760px] rounded-2xl p-6">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-[18px] font-bold text-[#F0FAF4]">Redistribution Suggestions</h3>
            <p className="mt-1 text-[12px] text-[#7BAF8E]">
              {data?.overloaded_member
                ? `${data.overloaded_member.username} is currently at ${data.overloaded_member.current_capacity_percentage}% capacity.`
                : 'Review suggested task moves for overloaded team members.'}
            </p>
          </div>
          <button onClick={onClose} className="ss-btn-ghost rounded-xl px-4 py-2 text-[12px] font-medium">
            Close
          </button>
        </div>

        {loading && (
          <div className="py-12 text-center">
            <div className="ss-spinner mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2" />
            <p className="text-[12px] text-[#7BAF8E]">Generating redistribution suggestions...</p>
          </div>
        )}

        {!loading && error && (
          <div className="ss-error-box mb-4 rounded-xl px-4 py-3 text-[12px]">{error}</div>
        )}

        {!loading && !error && (!data?.task_moves || data.task_moves.length === 0) && (
          <div className="py-10 text-center">
            <div className="mb-3 text-[34px]">{'\u2713'}</div>
            <p className="text-[14px] font-semibold text-[#F0FAF4]">No redistribution needed right now</p>
            <p className="mt-1 text-[12px] text-[#7BAF8E]">There are no strong reassignment suggestions for this member at the moment.</p>
          </div>
        )}

        {!loading && !error && !!data?.task_moves?.length && (
          <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
            {data.task_moves.map(move => {
              const isBusy = !!busyMap[move.task._id]
              const priorityCfg = PRIORITY_CFG[move.task.priority] || PRIORITY_CFG.LOW
              return (
                <div key={move.task._id} className="ss-panel-strong rounded-xl p-4">
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-semibold text-[#F0FAF4]">{move.task.title}</div>
                      <div className="mt-0.5 text-[11px] text-[#7BAF8E]">
                        {move.project.name} {'\u2022'} {TASK_STATUS_CFG[move.task.status]?.label || move.task.status} {'\u2022'} Due {fmtDate(move.task.due_date)}
                      </div>
                    </div>
                    <Badge className={`${priorityCfg.text} border-[rgba(40,98,58,0.2)] bg-[rgba(40,98,58,0.15)]`}>
                      {priorityCfg.icon} {move.task.priority}
                    </Badge>
                  </div>

                  <div className="mb-3 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-[rgba(248,113,113,0.2)] bg-[rgba(248,113,113,0.08)] p-3">
                      <div className="mb-1 text-[9px] uppercase tracking-widest text-[#FCA5A5]">Current Assignee</div>
                      <div className="text-[12px] font-semibold text-[#F0FAF4]">{move.current_assignee.username}</div>
                      <div className="text-[10px] text-[#FCA5A5]">{move.current_assignee.current_capacity_percentage}% capacity</div>
                    </div>
                    <div className="rounded-xl border border-[rgba(62,224,127,0.2)] bg-[rgba(62,224,127,0.08)] p-3">
                      <div className="mb-1 text-[9px] uppercase tracking-widest text-[#3EE07F]">Suggested Assignee</div>
                      <div className="text-[12px] font-semibold text-[#F0FAF4]">{move.suggested_assignee.username}</div>
                      <div className="text-[10px] text-[#3EE07F]">
                        {move.suggested_assignee.current_capacity_percentage}% capacity {'\u2022'} Score {move.suggested_assignee.score}
                      </div>
                    </div>
                  </div>

                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {(move.suggested_assignee.reasons || []).map(reason => (
                      <span key={reason} className="rounded-full bg-[rgba(96,165,250,0.1)] px-2 py-0.5 text-[9px] font-semibold text-[#60A5FA]">
                        {reason}
                      </span>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => onReassign(move)}
                      disabled={isBusy}
                      className="ss-btn-accent rounded-xl px-4 py-2 text-[11px] font-semibold disabled:opacity-60"
                    >
                      {isBusy ? 'Reassigning...' : 'Reassign'}
                    </button>
                    <button
                      onClick={() => onOpenTasks(move.project._id)}
                      className="ss-btn-ghost rounded-xl px-4 py-2 text-[11px] font-semibold"
                    >
                      View Tasks {'\u2192'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default function PMDashboard() {
  const navigate = useNavigate()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  const [alertActionBusy, setAlertActionBusy] = useState({})
  const [actionError, setActionError] = useState('')
  const [redistributionOpen, setRedistributionOpen] = useState(false)
  const [redistributionLoading, setRedistributionLoading] = useState(false)
  const [redistributionError, setRedistributionError] = useState('')
  const [redistributionData, setRedistributionData] = useState(null)
  const [redistributionBusy, setRedistributionBusy] = useState({})

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    setLoading(true)
    setActionError('')
    try {
      const dashRes = await axios.get(`${API}/api/pm/dashboard`, { withCredentials: true })
      setData(dashRes.data)
    } catch (err) {
      if (err.response?.status === 401) navigate('/login')
      else if (err.response?.status === 403) navigate('/dashboard')
      else setError('Failed to load dashboard.')
    } finally {
      setLoading(false)
    }
  }

  const handleAlertResponse = async (alert, action, navigateAfter = false) => {
    const busyKey = `${alert.alert_key}:${action}`
    setAlertActionBusy(prev => ({ ...prev, [busyKey]: true }))
    setActionError('')

    try {
      await axios.post(`${API}/api/pm/alerts/respond`, {
        alert_key: alert.alert_key,
        action,
        alert_type: alert.type,
        message: alert.message,
        project_id: alert.project?._id || null,
        member_id: alert.user?._id || null,
      }, { withCredentials: true })

      setData(prev => ({
        ...prev,
        alerts: prev.alerts.filter(item => item.alert_key !== alert.alert_key),
      }))

      if (navigateAfter) {
        if (alert.type === 'OVERLOAD') setActiveTab('team')
        else if (alert.type === 'DEADLINE') setActiveTab('projects')
        else if (alert.action_link) navigate(alert.action_link)
      }
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to update alert')
    } finally {
      setAlertActionBusy(prev => {
        const next = { ...prev }
        delete next[busyKey]
        return next
      })
    }
  }

  const handleOpenRedistribution = async (alert) => {
    if (!alert.user?._id) return
    setRedistributionOpen(true)
    setRedistributionLoading(true)
    setRedistributionError('')
    setRedistributionData(null)

    try {
      const res = await axios.get(`${API}/api/pm/alerts/redistribution-suggestions`, {
        params: { userId: alert.user._id },
        withCredentials: true,
      })
      setRedistributionData(res.data)
    } catch (err) {
      setRedistributionError(err.response?.data?.message || 'Failed to get redistribution suggestions')
    } finally {
      setRedistributionLoading(false)
    }
  }

  const handleReassignTask = async (move) => {
    setRedistributionBusy(prev => ({ ...prev, [move.task._id]: true }))
    setRedistributionError('')

    try {
      await axios.put(`${API}/api/tasks/${move.task._id}`, {
        assigned_to: move.suggested_assignee._id,
      }, { withCredentials: true })

      setRedistributionData(prev => ({
        ...prev,
        task_moves: (prev?.task_moves || []).filter(item => item.task._id !== move.task._id),
      }))

      await fetchDashboard()
    } catch (err) {
      setRedistributionError(err.response?.data?.message || 'Failed to reassign task')
    } finally {
      setRedistributionBusy(prev => {
        const next = { ...prev }
        delete next[move.task._id]
        return next
      })
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

  const { stats, projects, upcoming_deadlines, alerts, team_capacity, task_status_chart } = data
  const tabs = ['overview', 'projects', 'team', 'alerts']
  const overallCompletion = stats.total_tasks > 0 ? Math.round((task_status_chart.DONE / stats.total_tasks) * 100) : 0

  return (
    <div className="ss-bg-app min-h-screen font-sans">
      <BG />
      <div className="relative z-10 mx-auto max-w-[1200px] px-6 py-10">
        <div className="mb-10 flex items-start justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2.5">
              <div className="ss-avatar flex h-9 w-9 items-center justify-center rounded-xl text-[14px] font-bold">
                {data?.pm_username?.slice(0, 2).toUpperCase() || 'PM'}
              </div>
              <div>
                <div className="text-[12px] font-semibold uppercase tracking-widest text-[#7BAF8E]">Project Manager</div>
                <div className="text-[16px] font-bold leading-tight text-[#F0FAF4]">Welcome back, {data?.pm_username || 'PM'}</div>
              </div>
            </div>
            <p className="text-[13px] text-[#7BAF8E]">
              {stats.active_projects} active project{stats.active_projects !== 1 ? 's' : ''} {'\u00B7'}{' '}
              {stats.overdue_tasks > 0
                ? <span className="text-[#F87171]">{stats.overdue_tasks} overdue task{stats.overdue_tasks !== 1 ? 's' : ''}</span>
                : <span className="text-[#3EE07F]">All tasks on track</span>}
              {alerts.length > 0 && <> {'\u00B7'} <span className="text-[#FBBF24]">{alerts.length} alert{alerts.length !== 1 ? 's' : ''}</span></>}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/pm/profile')} className="ss-btn-ghost rounded-xl px-4 py-2 text-[12px] font-semibold">
              My Profile
            </button>
            <button onClick={() => navigate('/pm/projects', { state: { openCreate: true } })} className="ss-btn-primary flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-semibold">
              + New Project
            </button>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-6 gap-4">
          {[
            { label: 'Total Projects', value: stats.total_projects, className: 'text-[#F0FAF4]', icon: '\u25EB' },
            { label: 'Active', value: stats.active_projects, className: 'text-[#3EE07F]', icon: '\u25B6' },
            { label: 'Total Tasks', value: stats.total_tasks, className: 'text-[#60A5FA]', icon: '\u25C8' },
            { label: 'Completed', value: stats.done_tasks, className: 'text-[#FBBF24]', icon: '\u25CF' },
            { label: 'Overdue', value: stats.overdue_tasks, className: stats.overdue_tasks > 0 ? 'text-[#F87171]' : 'text-[#7BAF8E]', icon: '\u26A0' },
            { label: 'Team Size', value: stats.team_size, className: 'text-[#3EE07F]', icon: '\uD83D\uDC65' },
          ].map(item => (
            <Card key={item.label} className="px-[18px] py-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[16px]">{item.icon}</span>
                <span className={`text-[24px] font-bold leading-none ${item.className}`}>{item.value}</span>
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-[#7BAF8E]">{item.label}</div>
            </Card>
          ))}
        </div>

        <div className="mb-7 flex gap-1 rounded-xl border border-[rgba(40,98,58,0.3)] bg-[rgba(15,32,39,0.6)] p-1">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={[
                'relative flex-1 rounded-lg border py-2.5 text-[12px] font-semibold capitalize transition-all',
                activeTab === tab
                  ? 'border-[rgba(62,224,127,0.2)] bg-gradient-to-br from-[#28623A] to-[#1A4D2E] text-[#F0FAF4]'
                  : 'border-transparent bg-transparent text-[#7BAF8E]',
              ].join(' ')}
            >
              {tab}
              {tab === 'alerts' && alerts.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#F87171] text-[9px] font-bold text-white">
                  {alerts.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {actionError && (
          <div className="ss-error-box mb-5 rounded-xl px-4 py-3 text-[12px]">{actionError}</div>
        )}

        {activeTab === 'overview' && (
          <div className="grid grid-cols-12 gap-5">
            <Card className="col-span-5 p-6">
              <SectionTitle>Tasks by Status</SectionTitle>
              <div className="space-y-3">
                {Object.entries(TASK_STATUS_CFG).map(([key, cfg]) => {
                  const count = task_status_chart[key] || 0
                  const pct = stats.total_tasks > 0 ? (count / stats.total_tasks) * 100 : 0
                  return (
                    <div key={key}>
                      <div className="mb-1.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={cfg.text}>{cfg.icon}</span>
                          <span className="text-[12px] font-medium text-[#F0FAF4]">{cfg.label}</span>
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

              {stats.total_tasks > 0 && (
                <div className="mt-5 flex items-center gap-4 border-t border-[rgba(40,98,58,0.3)] pt-5">
                  <div className="text-[32px] font-bold text-[#3EE07F]">{overallCompletion}%</div>
                  <div>
                    <div className="text-[13px] font-semibold text-[#F0FAF4]">Overall Completion</div>
                    <div className="text-[11px] text-[#7BAF8E]">{task_status_chart.DONE} of {stats.total_tasks} tasks done</div>
                  </div>
                </div>
              )}
            </Card>

            <Card className="col-span-7 p-6">
              <SectionTitle action={<button onClick={() => navigate('/pm/projects')} className="text-[11px] font-semibold text-[#3EE07F] hover:underline">View all {'\u2192'}</button>}>
                Upcoming Deadlines
              </SectionTitle>
              {!upcoming_deadlines.length ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="mb-2 text-[32px]">{'\uD83C\uDF89'}</div>
                  <p className="text-[13px] font-medium text-[#F0FAF4]">No upcoming deadlines</p>
                  <p className="mt-1 text-[11px] text-[#7BAF8E]">Everything is on track</p>
                </div>
              ) : (
                upcoming_deadlines.map(task => {
                  const priorityCfg = PRIORITY_CFG[task.priority] || PRIORITY_CFG.LOW
                  const statusCfg = TASK_STATUS_CFG[task.status] || TASK_STATUS_CFG.TODO
                  const dueClass = task.days_left < 0
                    ? 'border-[rgba(248,113,113,0.2)] bg-[rgba(248,113,113,0.1)] text-[#F87171]'
                    : task.days_left <= 2
                      ? 'border-[rgba(251,191,36,0.2)] bg-[rgba(251,191,36,0.1)] text-[#FBBF24]'
                      : 'border-[rgba(40,98,58,0.2)] bg-[rgba(40,98,58,0.1)] text-[#7BAF8E]'
                  return (
                    <div
                      key={task._id}
                      onClick={() => navigate(`/pm/projects/${task.project_id}/tasks`)}
                      className="ss-panel-strong mb-2 flex cursor-pointer items-center gap-3 rounded-xl p-3 transition-all hover:border-[rgba(62,224,127,0.25)]"
                    >
                      <span className={`shrink-0 text-[16px] ${priorityCfg.text}`}>{priorityCfg.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[12px] font-semibold text-[#F0FAF4]">{task.title}</div>
                        {task.assigned_to && <div className="text-[10px] text-[#7BAF8E]">{'\u2192'} {task.assigned_to.username}</div>}
                      </div>
                      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${dueClass}`}>
                        {task.days_left < 0 ? `${Math.abs(task.days_left)}d overdue` : task.days_left === 0 ? 'Due today' : `${task.days_left}d`}
                      </span>
                      <Badge className={`${statusCfg.text} border-[rgba(40,98,58,0.2)] bg-[rgba(40,98,58,0.15)]`}>{statusCfg.label}</Badge>
                    </div>
                  )
                })
              )}
            </Card>

            <Card className="col-span-6 p-6">
              <SectionTitle>AI Alerts</SectionTitle>
              {!alerts.length ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="mb-2 text-[32px] text-[#3EE07F]">{'\u2713'}</div>
                  <p className="text-[13px] font-medium text-[#F0FAF4]">No alerts</p>
                  <p className="mt-1 text-[11px] text-[#7BAF8E]">Your projects look healthy</p>
                </div>
              ) : (
                alerts.map((alert, index) => {
                  const cfg = ALERT_CFG[alert.type] || ALERT_CFG.WARNING
                  const isBusy = !!alertActionBusy[`${alert.alert_key}:ACTION_TAKEN`] || !!alertActionBusy[`${alert.alert_key}:DISMISSED`]
                  return (
                    <div key={index} className={`mb-2.5 flex items-start gap-3 rounded-xl border p-3.5 ${cfg.bg} ${cfg.border}`}>
                      <span className={`mt-0.5 shrink-0 text-[16px] ${cfg.text}`}>{cfg.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className={`mb-0.5 text-[12px] font-semibold ${cfg.text}`}>{alert.message}</div>
                        <div className="text-[11px] text-[#7BAF8E]">{alert.hint}</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {alert.type === 'OVERLOAD' && alert.user?._id && (
                            <button onClick={() => handleOpenRedistribution(alert)} className="rounded-lg border border-[rgba(96,165,250,0.2)] bg-[rgba(96,165,250,0.1)] px-3 py-1.5 text-[10px] font-semibold text-[#60A5FA]">
                              Suggest Redistribution
                            </button>
                          )}
                          <button
                            onClick={() => handleAlertResponse(alert, 'ACTION_TAKEN', true)}
                            disabled={isBusy}
                            className={`rounded-lg border px-3 py-1.5 text-[10px] font-semibold disabled:opacity-60 ${cfg.bg} ${cfg.border} ${cfg.text}`}
                          >
                            {alertActionBusy[`${alert.alert_key}:ACTION_TAKEN`] ? 'Opening...' : alert.action_label || 'Take Action'}
                          </button>
                          <button
                            onClick={() => handleAlertResponse(alert, 'DISMISSED')}
                            disabled={isBusy}
                            className="rounded-lg border border-[rgba(40,98,58,0.3)] bg-[rgba(40,98,58,0.12)] px-3 py-1.5 text-[10px] font-semibold text-[#7BAF8E] disabled:opacity-60"
                          >
                            {alertActionBusy[`${alert.alert_key}:DISMISSED`] ? 'Saving...' : 'Dismiss'}
                          </button>
                        </div>
                      </div>
                      <Badge className={`${cfg.text} ${cfg.bg} ${cfg.border}`}>{alert.type}</Badge>
                    </div>
                  )
                })
              )}
            </Card>

            <Card className="col-span-6 p-6">
              <SectionTitle action={<button onClick={() => setActiveTab('team')} className="text-[11px] font-semibold text-[#3EE07F] hover:underline">View all {'\u2192'}</button>}>
                Team Capacity
              </SectionTitle>
              {!team_capacity.length ? (
                <p className="text-[13px] text-[#7BAF8E]">No team members assigned yet.</p>
              ) : (
                team_capacity.slice(0, 5).map(member => {
                  const tone = capacityTone(member.current_capacity_percentage)
                  return (
                    <div key={member._id} className="mb-3 flex items-center gap-3">
                      <div className="ss-avatar flex h-8 w-8 items-center justify-center rounded-lg text-[11px] font-bold">
                        {member.username[0].toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center justify-between">
                          <span className="truncate text-[12px] font-semibold text-[#F0FAF4]">{member.username}</span>
                          <span className={`ml-2 shrink-0 text-[11px] font-bold ${tone.text}`}>{member.current_capacity_percentage}%</span>
                        </div>
                        <ProgressBar percent={member.current_capacity_percentage} fillClass={tone.fill} heightClass="h-1.5" />
                      </div>
                    </div>
                  )
                })
              )}
            </Card>
          </div>
        )}

        {activeTab === 'projects' && (
          <div>
            <div className="mb-5 flex items-center justify-between">
              <p className="text-[13px] text-[#7BAF8E]">{projects.length} project{projects.length !== 1 ? 's' : ''} total</p>
              <button onClick={() => navigate('/pm/projects')} className="rounded-xl border border-[rgba(62,224,127,0.25)] bg-[rgba(62,224,127,0.1)] px-4 py-2 text-[12px] font-semibold text-[#3EE07F]">
                Manage All Projects {'\u2192'}
              </button>
            </div>

            {!projects.length ? (
              <div className="py-20 text-center">
                <div className="mb-4 text-[48px]">{'\u25EB'}</div>
                <h3 className="mb-2 text-[18px] font-bold text-[#F0FAF4]">No projects yet</h3>
                <p className="mb-6 text-[13px] text-[#7BAF8E]">Create your first project to start assembling teams</p>
                <button onClick={() => navigate('/pm/projects')} className="ss-btn-primary rounded-xl px-6 py-3 text-[13px] font-semibold">
                  + Create Project {'\u2192'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-5">
                {projects.map(project => {
                  const statusCfg = STATUS_CFG[project.status] || STATUS_CFG.PLANNING
                  return (
                    <Card key={project._id} onClick={() => navigate(`/pm/projects/${project._id}`)} className="p-[20px_24px]">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="mb-1 truncate text-[15px] font-bold text-[#F0FAF4]">{project.name}</h3>
                          <p className="line-clamp-1 text-[11px] text-[#7BAF8E]">{project.description || 'No description'}</p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1.5">
                          <Badge className={`${statusCfg.text} ${statusCfg.bg} ${statusCfg.border}`}>{statusCfg.icon} {statusCfg.label}</Badge>
                          {project.ai_success_score !== null && project.ai_success_score !== undefined && (
                            <Badge className={`${project.ai_success_score >= 70 ? 'text-[#3EE07F]' : project.ai_success_score >= 50 ? 'text-[#FBBF24]' : 'text-[#F87171]'} border-[rgba(40,98,58,0.2)] bg-[rgba(40,98,58,0.15)]`}>
                              {'\u26A1'} {project.ai_success_score}%
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="mb-1.5 flex items-center justify-between">
                          <span className="text-[10px] font-semibold uppercase tracking-widest text-[#7BAF8E]">Progress</span>
                          <span className="text-[12px] font-bold text-[#3EE07F]">{project.progress}%</span>
                        </div>
                        <ProgressBar percent={project.progress} fillClass="fill-[#3EE07F]" />
                      </div>

                      <div className="mb-3 grid grid-cols-4 gap-2">
                        {Object.entries(TASK_STATUS_CFG).map(([key, cfg]) => (
                          <div key={key} className="ss-panel-strong rounded-lg p-2 text-center">
                            <div className={`text-[14px] font-bold ${cfg.text}`}>{project.tasks[key] || 0}</div>
                            <div className="mt-0.5 text-[8px] uppercase tracking-wide text-[#7BAF8E]">{cfg.label}</div>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between border-t border-[rgba(40,98,58,0.3)] pt-2">
                        <div className="flex -space-x-1.5">
                          {(project.team_members || []).slice(0, 4).map((member, index) => (
                            <div key={index} className="ss-avatar flex h-6 w-6 items-center justify-center rounded-md border-2 border-[#0F2027] text-[9px] font-bold">
                              {(member.username || '?')[0].toUpperCase()}
                            </div>
                          ))}
                          {project.team_members?.length > 4 && (
                            <div className="flex h-6 w-6 items-center justify-center rounded-md border-2 border-[#0F2027] bg-[rgba(40,98,58,0.3)] text-[8px] font-bold text-[#3EE07F]">
                              +{project.team_members.length - 4}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          {project.days_left !== null && (
                            <span className={`text-[10px] font-semibold ${project.days_left < 0 ? 'text-[#F87171]' : project.days_left <= 7 ? 'text-[#FBBF24]' : 'text-[#7BAF8E]'}`}>
                              {project.days_left < 0 ? `${Math.abs(project.days_left)}d OD` : `${project.days_left}d left`}
                            </span>
                          )}
                          <button
                            onClick={e => {
                              e.stopPropagation()
                              navigate(`/pm/projects/${project._id}/tasks`)
                            }}
                            className="ss-btn-accent rounded-lg px-2.5 py-1 text-[10px] font-semibold"
                          >
                            Tasks {'\u2192'}
                          </button>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'team' && (
          <div>
            {!team_capacity.length ? (
              <div className="py-20 text-center">
                <div className="mb-4 text-[48px]">{'\uD83D\uDC65'}</div>
                <h3 className="mb-2 text-[18px] font-bold text-[#F0FAF4]">No team members yet</h3>
                <p className="text-[13px] text-[#7BAF8E]">Add team members to your projects to see their capacity here</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {team_capacity.map(member => {
                  const tone = capacityTone(member.current_capacity_percentage)
                  return (
                    <Card key={member._id} className="p-[20px_24px]">
                      <div className="flex items-center gap-4">
                        <div className="ss-avatar flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-[16px] font-bold">
                          {member.username[0].toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center justify-between">
                            <span className="text-[14px] font-bold text-[#F0FAF4]">{member.username}</span>
                            <span className={`text-[16px] font-bold ${tone.text}`}>{member.current_capacity_percentage}%</span>
                          </div>
                          <div className="mb-1.5">
                            <ProgressBar percent={member.current_capacity_percentage} fillClass={tone.fill} />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-[#7BAF8E]">{member.availability_hours_per_week}h / week available</span>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${tone.badge}`}>{tone.label}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'alerts' && (
          <div>
            {!alerts.length ? (
              <div className="py-20 text-center">
                <div className="mb-4 text-[48px] text-[#3EE07F]">{'\u2713'}</div>
                <h3 className="mb-2 text-[18px] font-bold text-[#F0FAF4]">All clear!</h3>
                <p className="text-[13px] text-[#7BAF8E]">No alerts. Your projects and team are in good shape.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {alerts.map((alert, index) => {
                  const cfg = ALERT_CFG[alert.type] || ALERT_CFG.WARNING
                  const isBusy = !!alertActionBusy[`${alert.alert_key}:ACTION_TAKEN`] || !!alertActionBusy[`${alert.alert_key}:DISMISSED`]
                  return (
                    <div key={index} className={`flex items-start gap-4 rounded-2xl border p-5 ${cfg.bg} ${cfg.border}`}>
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-[20px] ${cfg.bg} ${cfg.border} ${cfg.text}`}>
                        {cfg.icon}
                      </div>
                      <div className="flex-1">
                        <div className="mb-1 flex items-start justify-between gap-3">
                          <h3 className={`text-[14px] font-semibold ${cfg.text}`}>{alert.message}</h3>
                          <Badge className={`${cfg.text} ${cfg.bg} ${cfg.border}`}>{alert.type}</Badge>
                        </div>
                        <p className="mb-3 text-[12px] text-[#7BAF8E]">{alert.hint}</p>
                        <div className="mb-2 flex flex-wrap gap-2">
                          {alert.type === 'OVERLOAD' && alert.user?._id && (
                            <button onClick={() => handleOpenRedistribution(alert)} className="rounded-xl border border-[rgba(96,165,250,0.2)] bg-[rgba(96,165,250,0.1)] px-3 py-1.5 text-[11px] font-semibold text-[#60A5FA]">
                              Suggest Redistribution
                            </button>
                          )}
                          <button
                            onClick={() => handleAlertResponse(alert, 'ACTION_TAKEN', true)}
                            disabled={isBusy}
                            className={`rounded-xl border px-3 py-1.5 text-[11px] font-semibold disabled:opacity-60 ${cfg.bg} ${cfg.border} ${cfg.text}`}
                          >
                            {alertActionBusy[`${alert.alert_key}:ACTION_TAKEN`] ? 'Opening...' : alert.action_label || 'Take Action'}
                          </button>
                          <button
                            onClick={() => handleAlertResponse(alert, 'DISMISSED')}
                            disabled={isBusy}
                            className="rounded-xl border border-[rgba(40,98,58,0.3)] bg-transparent px-3 py-1.5 text-[11px] font-semibold text-[#7BAF8E] disabled:opacity-60"
                          >
                            {alertActionBusy[`${alert.alert_key}:DISMISSED`] ? 'Saving...' : 'Dismiss'}
                          </button>
                        </div>
                        <div className="flex gap-2">
                          {alert.project && (
                            <button onClick={() => navigate(`/pm/projects/${alert.project._id}`)} className={`rounded-xl border px-3 py-1.5 text-[11px] font-semibold ${cfg.bg} ${cfg.border} ${cfg.text}`}>
                              View Project {'\u2192'}
                            </button>
                          )}
                          {alert.project && (
                            <button onClick={() => navigate(`/pm/projects/${alert.project._id}/tasks`)} className="rounded-xl border border-[rgba(40,98,58,0.3)] bg-[rgba(40,98,58,0.15)] px-3 py-1.5 text-[11px] font-semibold text-[#7BAF8E]">
                              View Tasks {'\u2192'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        <div className="mt-10 flex items-center justify-between border-t border-[rgba(40,98,58,0.3)] pt-5">
          <p className="text-[11px] text-[rgba(123,175,142,0.4)]">Data refreshed on load {'\u00B7'} SkillSync PM Dashboard</p>
          <button onClick={fetchDashboard} className="ss-btn-ghost flex items-center gap-2 rounded-xl px-4 py-2 text-[11px] font-semibold">
            {'\u21BB'} Refresh
          </button>
        </div>
      </div>

      <RedistributionModal
        open={redistributionOpen}
        loading={redistributionLoading}
        error={redistributionError}
        data={redistributionData}
        busyMap={redistributionBusy}
        onClose={() => setRedistributionOpen(false)}
        onReassign={handleReassignTask}
        onOpenTasks={(projectId) => navigate(`/pm/projects/${projectId}/tasks`)}
      />
    </div>
  )
}
