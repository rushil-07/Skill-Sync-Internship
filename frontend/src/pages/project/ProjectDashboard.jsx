import { useState, useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { buildProjectMilestonesPath, buildProjectPath, buildProjectTasksPath, getRolePrefixFromPath } from '../../utils/roleRoutes'

const API = 'http://localhost:3000'

const STATUS_CFG = {
  PLANNING: { color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/25', label: 'Planning', icon: '◷' },
  ACTIVE: { color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/25', label: 'Active', icon: '▶' },
  COMPLETED: { color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/25', label: 'Completed', icon: '✓' },
  ON_HOLD: { color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/25', label: 'On Hold', icon: '⏸' },
}
const TASK_STATUS_CFG = {
  TODO: { color: 'text-[#7BAF8E]', bar: '#7BAF8E', label: 'To Do', icon: '○' },
  IN_PROGRESS: { color: 'text-blue-400', bar: '#60A5FA', label: 'In Progress', icon: '◑' },
  IN_REVIEW: { color: 'text-yellow-400', bar: '#FBBF24', label: 'In Review', icon: '◕' },
  DONE: { color: 'text-emerald-400', bar: '#3EE07F', label: 'Done', icon: '●' },
}
const PRIORITY_CFG = {
  URGENT: { color: 'text-red-400', label: 'Urgent', icon: '⚡' },
  HIGH: { color: 'text-yellow-400', label: 'High', icon: '↑' },
  MEDIUM: { color: 'text-blue-400', label: 'Medium', icon: '→' },
  LOW: { color: 'text-[#7BAF8E]', label: 'Low', icon: '↓' },
}
const ALERT_CFG = {
  DEADLINE: { color: 'text-red-400', bg: 'bg-red-400/5', border: 'border-red-400/20', icon: '⏰' },
  DEADLINES: { color: 'text-red-400', bg: 'bg-red-400/5', border: 'border-red-400/20', icon: '⏰' },
  RISK: { color: 'text-red-400', bg: 'bg-red-400/5', border: 'border-red-400/20', icon: '⚡' },
  OVERLOAD: { color: 'text-yellow-400', bg: 'bg-yellow-400/5', border: 'border-yellow-400/20', icon: '⚠' },
  STALLED: { color: 'text-yellow-400', bg: 'bg-yellow-400/5', border: 'border-yellow-400/20', icon: '⏸' },
  MILESTONE: { color: 'text-blue-400', bg: 'bg-blue-400/5', border: 'border-blue-400/20', icon: '⬡' },
  SKILL_GAP: { color: 'text-red-400', bg: 'bg-red-400/5', border: 'border-red-400/20', icon: '◈' },
  SCHEDULE: { color: 'text-yellow-400', bg: 'bg-yellow-400/5', border: 'border-yellow-400/20', icon: '🗓' },
  WARNING: { color: 'text-[#7BAF8E]', bg: 'bg-[#28623A]/8', border: 'border-[#28623A]/20', icon: '◈' },
}
const MILESTONE_STATUS_CFG = {
  PENDING: { color: 'text-blue-400', bg: 'bg-blue-400/10', icon: '◷' },
  COMPLETED: { color: 'text-emerald-400', bg: 'bg-emerald-400/10', icon: '✓' },
  MISSED: { color: 'text-red-400', bg: 'bg-red-400/10', icon: '✕' },
}

const capColor = (p) => p >= 85 ? 'text-red-400' : p >= 65 ? 'text-yellow-400' : 'text-emerald-400'
const capBar = (p) => p >= 85 ? '#F87171' : p >= 65 ? '#FBBF24' : '#3EE07F'
const fmtDate = (d, opts = { day: 'numeric', month: 'short' }) => d ? new Date(d).toLocaleDateString('en-IN', opts) : '-'
const fmtMins = (m) => !m ? '0m' : m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60 > 0 ? m % 60 + 'm' : ''}`
const timeAgo = (d) => { const s = Math.floor((new Date() - new Date(d)) / 1000); if (s < 60) return 'just now'; if (s < 3600) return `${Math.floor(s / 60)}m ago`; if (s < 86400) return `${Math.floor(s / 3600)}h ago`; return `${Math.floor(s / 86400)}d ago` }
const trendColor = (direction) => direction === 'IMPROVING' ? 'text-emerald-400' : direction === 'DECLINING' ? 'text-red-400' : 'text-yellow-400'
const trendBadge = (direction) => direction === 'IMPROVING' ? 'bg-emerald-400/10' : direction === 'DECLINING' ? 'bg-red-400/10' : 'bg-yellow-400/10'
const trendLabel = (direction) => direction === 'IMPROVING' ? 'Improving' : direction === 'DECLINING' ? 'Declining' : direction === 'NEW' ? 'New' : 'Stable'

const BG = () => (
  <>
    <div className="ss-radial-zero fixed inset-0 pointer-events-none" />
    <div className="ss-grid-overlay fixed inset-0 pointer-events-none opacity-[0.03]" />
  </>
)

const Card = ({ children, className = '' }) => (
  <div className={`relative rounded-2xl border border-[#3EE07F]/13 bg-[linear-gradient(160deg,_#162B1E_0%,_#0F2027_60%)] shadow-[0_0_0_1px_rgba(40,98,58,0.12),0_16px_48px_rgba(15,32,39,0.65)] ${className}`}>
    <div className="absolute top-0 left-8 right-8 h-px rounded-full bg-[linear-gradient(90deg,transparent,rgba(62,224,127,0.2),transparent)]" />
    {children}
  </div>
)

const SectionTitle = ({ children, action }) => (
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-[13px] font-bold uppercase tracking-widest text-[#7BAF8E]">{children}</h2>
    {action}
  </div>
)

const RING_SIZE_CLASS = {
  72: 'h-[72px] w-[72px]',
  80: 'h-20 w-20',
  100: 'h-[100px] w-[100px]',
}

const progressWidthClass = (percent) => `ss-w-${Math.max(0, Math.min(100, Math.round(Number(percent) || 0)))}`

const solidFillClass = (color) => {
  switch (color) {
    case '#7BAF8E': return 'bg-[#7BAF8E]'
    case '#60A5FA': return 'bg-[#60A5FA]'
    case '#FBBF24': return 'bg-[#FBBF24]'
    case '#3EE07F': return 'bg-[#3EE07F]'
    case '#F87171': return 'bg-[#F87171]'
    case 'currentColor': return 'bg-current'
    default: return 'bg-[#3EE07F]'
  }
}

const gradientFillClass = (from, to) => {
  if (from === '#28623A' && to === '#60A5FA') return 'bg-[linear-gradient(90deg,#28623A,#60A5FA)]'
  return 'bg-[linear-gradient(90deg,#28623A,#3EE07F)]'
}

const Ring = ({ pct, size = 80, stroke = 8, color = '#3EE07F' }) => {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div className={`relative flex shrink-0 items-center justify-center ${RING_SIZE_CLASS[size] || 'h-20 w-20'}`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(40,98,58,0.2)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${(pct / 100) * c} ${c}`} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[15px] font-bold text-[#F0FAF4] leading-none">{pct}%</span>
      </div>
    </div>
  )
}

const SolidProgressBar = ({ pct, color, heightClass = 'h-1.5' }) => (
  <div className={`${heightClass} overflow-hidden rounded-full bg-[#28623A]/20`}>
    <div className={`ss-progress-fill ${solidFillClass(color)} ${progressWidthClass(pct)}`} />
  </div>
)

const GradientProgressBar = ({ pct, gradientId, from, to, heightClass = 'h-2' }) => (
  <div className={`${heightClass} relative overflow-hidden rounded-full bg-[#28623A]/20`}>
    <div className={`ss-progress-fill ${gradientFillClass(from, to)} ${progressWidthClass(pct)}`} />
  </div>
)

export default function ProjectDashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const { projectId } = useParams()
  const routePrefix = getRolePrefixFromPath(location.pathname)
  const [data, setData] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('overview')


  useEffect(() => { fetchDashboard() }, [projectId])

  const fetchDashboard = async () => {
    setLoading(true)
    try {
      const [dashboardRes, analyticsRes] = await Promise.all([
        axios.get(`${API}/api/pm/project/${projectId}/dashboard`, { withCredentials: true }),
        axios.get(`${API}/api/ai/projects/${projectId}/predictive-analytics`, { withCredentials: true }),
      ])

      setData(dashboardRes.data)
      setAnalytics(analyticsRes.data)
    } catch (err) {
      if (err.response?.status === 401) navigate('/login')
      else setError('Failed to load project dashboard.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="ss-bg-app min-h-screen flex items-center justify-center">
      <BG />
      <div className="flex flex-col items-center gap-3 relative z-10">
        <div className="w-10 h-10 border-2 border-emerald-400/20 border-t-emerald-400 rounded-full animate-spin" />
        <span className="text-sm text-[#7BAF8E]">Loading dashboard...</span>
      </div>
    </div>
  )

  if (error) return (
    <div className="ss-bg-app min-h-screen flex items-center justify-center">
      <BG />
      <div className="relative z-10 rounded-2xl border border-[rgba(248,113,113,0.2)] bg-[linear-gradient(160deg,_#162B1E,_#0F2027)] p-8 text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <button onClick={fetchDashboard} className="px-5 py-2 rounded-xl text-sm font-semibold bg-[#28623A] text-[#F0FAF4]">Retry</button>
      </div>
    </div>
  )

  const {
    project,
    progress,
    tasks,
    team_workload,
    upcoming_milestones,
    milestone_summary,
    alerts: dashboardAlerts,
    recent_activity,
    total_time_logged,
  } = data
  const aiAlerts = (analytics?.alerts || []).map(alert => ({
    ...alert,
    hint:
      alert.type === 'SKILL_GAP' ? 'Run skill gap analysis and cover missing skills.' :
        alert.type === 'OVERLOAD' ? 'Rebalance work or reduce team load.' :
          alert.type === 'DEADLINES' ? 'Review overdue tasks and unblock critical work.' :
            alert.type === 'SCHEDULE' ? 'Project progress is lagging behind the timeline.' :
              'AI-generated project risk signal.',
  }))
  const s = STATUS_CFG[project.status] || STATUS_CFG.PLANNING
  const TABS = ['overview', 'team', 'milestones', 'activity']
  const allAlerts = [...(dashboardAlerts || []), ...aiAlerts]
  const displayedScore = analytics?.success_score ?? project.ai_success_score
  const highAlerts = allAlerts.filter(a => a.severity === 'HIGH')


  return (
    <div className="ss-bg-app min-h-screen font-sans">
      <BG />
      <div className="relative z-10 max-w-[1200px] mx-auto px-6 py-10">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <button onClick={() => navigate(buildProjectPath(routePrefix, projectId))}
              className="text-xs font-medium text-[#7BAF8E] hover:text-[#F0FAF4] transition-colors mb-2 block">← Back to Project</button>
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="text-2xl font-bold text-[#F0FAF4]">{project.name}</h1>
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${s.color} ${s.bg} border ${s.border}`}>{s.icon} {s.label}</span>
              {displayedScore != null && (
                <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${displayedScore >= 70 ? 'text-emerald-400 bg-emerald-400/10' : displayedScore >= 50 ? 'text-yellow-400 bg-yellow-400/10' : 'text-red-400 bg-red-400/10'}`}>
                  ⚡ {displayedScore}%
                </span>
              )}

            </div>
            <p className="text-sm text-[#7BAF8E]">
              {project.team_size} member{project.team_size !== 1 ? 's' : ''} · {tasks.total} task{tasks.total !== 1 ? 's' : ''} · {fmtMins(total_time_logged)} logged
              {highAlerts.length > 0 && <> · <span className="text-red-400 font-semibold">{highAlerts.length} risk{highAlerts.length !== 1 ? 's' : ''}</span></>}
            </p>
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <button onClick={() => navigate(buildProjectTasksPath(routePrefix, projectId))}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-emerald-400 bg-emerald-400/10 border border-emerald-400/25 hover:bg-emerald-400/18 transition-all">◫ Tasks →</button>
            <button onClick={() => navigate(buildProjectMilestonesPath(routePrefix, projectId))}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-blue-400 bg-blue-400/10 border border-blue-400/25 hover:bg-blue-400/18 transition-all">⬡ Milestones →</button>
            <button onClick={fetchDashboard}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#7BAF8E] border border-[#28623A]/30 hover:text-[#F0FAF4] transition-all">↻</button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-6 gap-4 mb-7">
          {[
            { label: 'Task Completion', value: `${progress.task_completion}%`, color: 'text-emerald-400', icon: '●' },
            { label: 'Total Tasks', value: tasks.total, color: 'text-[#F0FAF4]', icon: '◫' },
            { label: 'Overdue', value: tasks.overdue, color: tasks.overdue > 0 ? 'text-red-400' : 'text-[#7BAF8E]', icon: '⚠' },
            { label: 'Milestones', value: `${milestone_summary.completed}/${milestone_summary.total}`, color: 'text-blue-400', icon: '⬡' },
            { label: 'Time Logged', value: fmtMins(total_time_logged), color: 'text-yellow-400', icon: '⏱' },
            { label: 'Alerts', value: allAlerts.length, color: allAlerts.length > 0 ? 'text-red-400' : 'text-[#7BAF8E]', icon: '⚡' },
          ].map(s => (
            <Card key={s.label} className="px-[18px] py-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-base">{s.icon}</span>
                <span className={`text-[22px] font-bold leading-none ${s.color}`}>{s.value}</span>
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-[#7BAF8E]">{s.label}</div>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <div className="mb-7 flex gap-1 rounded-xl border border-[rgba(40,98,58,0.3)] bg-[rgba(15,32,39,0.6)] p-1">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 rounded-lg py-2.5 text-xs font-semibold capitalize transition-all ${
                activeTab === tab
                  ? 'border border-emerald-400/20 bg-[linear-gradient(135deg,_#28623A,_#1A4D2E)] text-[#F0FAF4]'
                  : 'border border-transparent text-[#7BAF8E]'
              }`}>
              {tab}
              {tab === 'activity' && recent_activity.length > 0 && <span className="ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-400/10 text-emerald-400">{recent_activity.length}</span>}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-12 gap-5">

            {/* Progress + timeline + task breakdown */}
            <Card className="col-span-4 p-6">
              <SectionTitle>Project Progress</SectionTitle>
              <div className="flex items-center justify-around mb-5">
                {[
                  { pct: progress.task_completion, label: 'Tasks', color: '#3EE07F' },
                  { pct: milestone_summary.progress, label: 'Milestones', color: '#60A5FA' },
                  { pct: progress.timeline_pct || 0, label: 'Timeline', color: '#FBBF24' },
                ].map(r => (
                  <div key={r.label} className="text-center">
                    <Ring pct={r.pct} size={72} color={r.color} />
                    <p className="text-[10px] text-[#7BAF8E] mt-2 uppercase tracking-widest">{r.label}</p>
                  </div>
                ))}
              </div>
              {progress.timeline_pct !== null && (
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1.5 text-[10px] text-[#7BAF8E]">
                    <span>{project.start_date ? fmtDate(project.start_date) : '—'}</span>
                    <span className={progress.days_left < 0 ? 'text-red-400 font-bold' : progress.days_left <= 7 ? 'text-yellow-400 font-bold' : 'text-[#7BAF8E]'}>
                      {progress.days_left === null ? '—' : progress.days_left < 0 ? `${Math.abs(progress.days_left)}d overdue` : progress.days_left === 0 ? 'Due today' : `${progress.days_left}d left`}
                    </span>
                    <span>{project.end_date ? fmtDate(project.end_date) : '—'}</span>
                  </div>
                  <GradientProgressBar
                    pct={progress.timeline_pct}
                    gradientId="timeline-progress"
                    from="#28623A"
                    to="#FBBF24"
                  />
                </div>
              )}
              <div className="space-y-2">
                {Object.entries(TASK_STATUS_CFG).map(([key, cfg]) => {
                  const count = tasks.by_status[key] || 0
                  const pct = tasks.total > 0 ? (count / tasks.total) * 100 : 0
                  return (
                    <div key={key}>
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-[11px] font-medium ${cfg.color}`}>{cfg.icon} {cfg.label}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] font-bold ${cfg.color}`}>{count}</span>
                          <span className="text-[10px] text-[#7BAF8E]">{Math.round(pct)}%</span>
                        </div>
                      </div>
                      <SolidProgressBar pct={pct} color={cfg.bar} />
                    </div>
                  )
                })}
              </div>
            </Card>

            {/* Risk Alerts */}
            <Card className="col-span-4 p-6">
              <SectionTitle action={allAlerts.length > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-red-400 bg-red-400/10">{allAlerts.length}</span>}>
                Risk Alerts
              </SectionTitle>

              {allAlerts.length === 0
                ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-400/10 flex items-center justify-center text-2xl">✓</div>
                    <p className="text-sm text-[#7BAF8E]">No risks detected</p>
                  </div>
                )
                : allAlerts.map((a, i) => {
                  const cfg = ALERT_CFG[a.type] || ALERT_CFG.WARNING
                  return (
                    <div key={i} className={`flex items-start gap-3 p-3.5 rounded-xl mb-2.5 border ${cfg.bg} ${cfg.border}`}>
                      <span className={`text-base shrink-0 mt-0.5 ${cfg.color}`}>{cfg.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[12px] font-semibold mb-0.5 ${cfg.color}`}>{a.message}</p>
                        <p className="text-[11px] text-[#7BAF8E]">{a.hint || 'AI-generated project risk signal.'}</p>
                      </div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${a.severity === 'HIGH' ? 'text-red-400 bg-red-400/10' : a.severity === 'MEDIUM' ? 'text-yellow-400 bg-yellow-400/10' : 'text-[#7BAF8E] bg-[#28623A]/10'}`}>
                        {a.severity}
                      </span>
                    </div>
                  )
                })}
            </Card>


            {/* Upcoming Milestones */}
            <Card className="col-span-4 p-6">
              <SectionTitle action={<button onClick={() => navigate(buildProjectMilestonesPath(routePrefix, projectId))} className="text-[11px] font-semibold text-emerald-400 hover:underline">View all →</button>}>Upcoming Milestones</SectionTitle>
              {upcoming_milestones.length === 0
                ? <div className="flex flex-col items-center justify-center py-10 gap-3"><div className="w-12 h-12 rounded-xl bg-blue-400/10 flex items-center justify-center text-2xl">⬡</div><p className="text-sm text-[#7BAF8E]">No upcoming milestones</p></div>
                : upcoming_milestones.map(m => {
                  const isOD = m.status === 'PENDING' && m.days_left < 0; const cfg = MILESTONE_STATUS_CFG[isOD ? 'MISSED' : m.status] || MILESTONE_STATUS_CFG.PENDING; return (
                    <div key={m._id} className="flex items-center gap-3 p-3 rounded-xl mb-2 bg-[#28623A]/6 border border-[#28623A]/25 hover:border-emerald-400/20 transition-colors">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${cfg.bg} ${cfg.color}`}>{cfg.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold text-[#F0FAF4] truncate">{m.title}</p>
                        <p className="text-[10px] text-[#7BAF8E]">{fmtDate(m.due_date, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                      <span className={`text-[10px] font-bold shrink-0 ${m.days_left < 0 ? 'text-red-400' : m.days_left <= 3 ? 'text-yellow-400' : 'text-[#7BAF8E]'}`}>
                        {m.days_left < 0 ? `${Math.abs(m.days_left)}d OD` : m.days_left === 0 ? 'Today' : `${m.days_left}d`}
                      </span>
                    </div>
                  )
                })
              }
            </Card>

            {/* Priority breakdown */}
            <Card className="col-span-6 p-6">
              <SectionTitle>Tasks by Priority</SectionTitle>
              <div className="grid grid-cols-4 gap-3">
                {Object.entries(PRIORITY_CFG).map(([key, cfg]) => {
                  const count = tasks.by_priority[key] || 0
                  const pct = tasks.total > 0 ? Math.round((count / tasks.total) * 100) : 0
                  return (
                    <div key={key} className="p-4 rounded-xl text-center bg-[#28623A]/8 border border-[#28623A]/25">
                      <div className={`text-2xl font-bold mb-1 ${cfg.color}`}>{count}</div>
                      <div className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${cfg.color}`}>{cfg.icon} {cfg.label}</div>
                      <div className={cfg.color}>
                        <SolidProgressBar pct={pct} color="currentColor" heightClass="h-1" />
                      </div>
                      <div className="text-[9px] text-[#7BAF8E] mt-1">{pct}%</div>
                    </div>
                  )
                })}
              </div>
            </Card>

            {/* AI Score */}
            <Card className="col-span-6 p-6">
              <SectionTitle>AI Success Score</SectionTitle>

              {displayedScore == null
                ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-3">
                    <div className="w-12 h-12 rounded-xl bg-yellow-400/10 flex items-center justify-center text-2xl">⚡</div>
                    <p className="text-sm text-[#7BAF8E]">Score not yet calculated</p>
                  </div>
                )
                : (
                  <div className="space-y-5">
                    <div className="flex items-center gap-8">
                      <Ring
                        pct={displayedScore}
                        size={100}
                        stroke={10}
                        color={displayedScore >= 70 ? '#3EE07F' : displayedScore >= 50 ? '#FBBF24' : '#F87171'}
                      />
                      <div className="flex-1">
                        <div className={`text-4xl font-bold mb-1 ${displayedScore >= 70 ? 'text-emerald-400' : displayedScore >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {displayedScore}%
                        </div>
                        <p className="text-sm font-semibold text-[#F0FAF4] mb-1">
                          {displayedScore >= 70 ? 'On track for success' : displayedScore >= 50 ? 'Moderate risk' : 'High risk'}
                        </p>
                        <p className="text-xs text-[#7BAF8E]">
                          {analytics ? 'Live AI analytics are included below.' : 'Stored project score only.'}
                        </p>
                      </div>
                    </div>

                    {analytics && (
                      <>
                        {!!analytics.trend && (
                          <div className="p-4 rounded-xl bg-[#28623A]/8 border border-[#28623A]/25">
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#7BAF8E]">Trend Learning</p>
                                <p className="text-[12px] text-[#F0FAF4] mt-1">
                                  Historical checkpoints are now influencing the live project score.
                                </p>
                              </div>
                              <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${trendColor(analytics.trend.direction)} ${trendBadge(analytics.trend.direction)}`}>
                                {trendLabel(analytics.trend.direction)}
                              </div>
                            </div>

                            <div className="grid grid-cols-4 gap-3 mb-4">
                              {[
                                ['Change vs last', `${analytics.trend.score_change > 0 ? '+' : ''}${analytics.trend.score_change}%`],
                                ['Avg recent', `${analytics.trend.average_recent_score ?? displayedScore}%`],
                                ['Volatility', `${analytics.trend.volatility}%`],
                                ['Learning adj.', `${analytics.learning_adjustment > 0 ? '+' : ''}${analytics.learning_adjustment}%`],
                              ].map(([label, value]) => (
                                <div key={label} className="p-3 rounded-xl bg-[#0F2027]/55 border border-[#28623A]/25">
                                  <div className="text-lg font-bold text-[#F0FAF4]">{value}</div>
                                  <div className="text-[10px] uppercase tracking-widest text-[#7BAF8E]">{label}</div>
                                </div>
                              ))}
                            </div>

                            {!!analytics.trend.snapshots?.length && (
                              <div className="mb-4">
                                <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-2 text-[#7BAF8E]">Recent Checkpoints</p>
                                <div className="grid grid-cols-4 gap-2">
                                  {analytics.trend.snapshots.slice(-4).map((snap, index) => (
                                    <div key={`${snap.captured_at}-${index}`} className="p-3 rounded-xl bg-[#0F2027]/55 border border-[#28623A]/25">
                                      <div className="text-[16px] font-bold text-[#F0FAF4]">{snap.success_score}%</div>
                                      <div className="text-[10px] text-[#7BAF8E]">{timeAgo(snap.captured_at)}</div>
                                      <div className="text-[9px] text-[#7BAF8E] mt-1">
                                        Raw {snap.raw_success_score}% {snap.history_adjustment ? `(${snap.history_adjustment > 0 ? '+' : ''}${snap.history_adjustment})` : ''}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {!!analytics.learning_insights?.length && (
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-2 text-[#7BAF8E]">Learned Insights</p>
                                <div className="space-y-2">
                                  {analytics.learning_insights.map((item, index) => (
                                    <div key={index} className="p-3 rounded-xl bg-[#0F2027]/55 border border-[#28623A]/25 text-[12px] text-[#F0FAF4]">
                                      {item}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="grid grid-cols-3 gap-3">
                          {[
                            ['Completion', analytics.factors.completion_rate],
                            ['Skill Coverage', analytics.factors.skill_coverage_pct],
                            ['Timeline Health', analytics.factors.timeline_health],
                            ['Capacity Health', analytics.factors.capacity_health],
                            ['Milestones', analytics.factors.milestone_health],
                            ['Overdue Rate', analytics.factors.overdue_rate],
                          ].map(([label, value]) => (
                            <div key={label} className="p-3 rounded-xl bg-[#28623A]/8 border border-[#28623A]/25">
                              <div className="text-lg font-bold text-[#F0FAF4]">{value}%</div>
                              <div className="text-[10px] uppercase tracking-widest text-[#7BAF8E]">{label}</div>
                            </div>
                          ))}
                        </div>

                        {!!analytics.suggested_adjustments?.length && (
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-2 text-[#7BAF8E]">Suggested Adjustments</p>
                            <div className="space-y-2">
                              {analytics.suggested_adjustments.map((item, index) => (
                                <div key={index} className="p-3 rounded-xl bg-[#28623A]/8 border border-[#28623A]/25 text-[12px] text-[#F0FAF4]">
                                  {item}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
            </Card>


          </div>
        )}

        {/* ── TEAM TAB ── */}
        {activeTab === 'team' && (
          <div>
            {team_workload.length === 0
              ? <Card className="p-16 text-center"><div className="text-4xl mb-4">👥</div><p className="text-base font-semibold text-[#F0FAF4] mb-1">No team members yet</p><button onClick={() => navigate(buildProjectPath(routePrefix, projectId))} className="mt-3 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#28623A]/20 text-emerald-400 border border-emerald-400/25 hover:bg-[#28623A]/35 transition-all">Manage Team →</button></Card>
              : <>
                <div className="grid grid-cols-4 gap-4 mb-6">
                  {[
                    { label: 'Team Size', value: team_workload.length, color: 'text-[#F0FAF4]' },
                    { label: 'Avg Capacity', value: `${Math.round(team_workload.reduce((s, m) => s + m.current_capacity_percentage, 0) / team_workload.length)}%`, color: 'text-emerald-400' },
                    { label: 'Total Tasks', value: team_workload.reduce((s, m) => s + m.total, 0), color: 'text-blue-400' },
                    { label: 'Overloaded', value: team_workload.filter(m => m.current_capacity_percentage >= 85).length, color: 'text-red-400' },
                  ].map(s => (
                    <Card key={s.label} className="px-5 py-4">
                      <div className={`text-2xl font-bold mb-1 ${s.color}`}>{s.value}</div>
                      <div className="text-[10px] uppercase tracking-widest text-[#7BAF8E]">{s.label}</div>
                    </Card>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {team_workload.map(m => (
                    <Card key={m._id} className="px-6 py-5">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="ss-avatar flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold">{m.username[0].toUpperCase()}</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-[#F0FAF4]">{m.username}</span>
                            <span className={`text-base font-bold ${capColor(m.current_capacity_percentage)}`}>{m.current_capacity_percentage}%</span>
                          </div>
                          <div className="mt-1.5">
                            <SolidProgressBar pct={m.current_capacity_percentage} color={capBar(m.current_capacity_percentage)} heightClass="h-2" />
                          </div>
                          <p className="text-[10px] text-[#7BAF8E] mt-1">{m.availability_hours_per_week}h/week available</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        {[
                          { label: 'Total', value: m.total, color: 'text-[#F0FAF4]' },
                          { label: 'Active', value: m.in_progress, color: 'text-blue-400' },
                          { label: 'Done', value: m.done, color: 'text-emerald-400' },
                          { label: 'Overdue', value: m.overdue, color: m.overdue > 0 ? 'text-red-400' : 'text-[#7BAF8E]' },
                        ].map(s => (
                          <div key={s.label} className="p-2 rounded-lg text-center bg-[#28623A]/8 border border-[#28623A]/20">
                            <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
                            <div className="text-[9px] uppercase tracking-wide text-[#7BAF8E] mt-0.5">{s.label}</div>
                          </div>
                        ))}
                      </div>
                      {m.total_minutes > 0 && <div className="flex items-center justify-between text-[11px]"><span className="text-[#7BAF8E]">Time logged</span><span className="font-semibold text-yellow-400">{fmtMins(m.total_minutes)}</span></div>}
                      {m.total > 0 && <div className="mt-2"><div className="mb-1 flex justify-between text-[10px] text-[#7BAF8E]"><span>Completion</span><span>{Math.round((m.done / m.total) * 100)}%</span></div><SolidProgressBar pct={(m.done / m.total) * 100} color="#3EE07F" /></div>}
                    </Card>
                  ))}
                </div>
              </>
            }
          </div>
        )}

        {/* ── MILESTONES TAB ── */}
        {activeTab === 'milestones' && (
          <div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Total', value: milestone_summary.total, color: 'text-[#F0FAF4]' },
                { label: 'Completed', value: milestone_summary.completed, color: 'text-emerald-400' },
                { label: 'Remaining', value: milestone_summary.total - milestone_summary.completed, color: 'text-blue-400' },
              ].map(s => (
                <Card key={s.label} className="px-5 py-4 text-center">
                  <div className={`text-3xl font-bold mb-1 ${s.color}`}>{s.value}</div>
                  <div className="text-[10px] uppercase tracking-widest text-[#7BAF8E]">{s.label}</div>
                </Card>
              ))}
            </div>
            {upcoming_milestones.length === 0
              ? <Card className="p-16 text-center"><div className="text-4xl mb-4">⬡</div><p className="text-base font-semibold text-[#F0FAF4] mb-1">No upcoming milestones</p><button onClick={() => navigate(buildProjectMilestonesPath(routePrefix, projectId))} className="mt-3 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#28623A]/20 text-emerald-400 border border-emerald-400/25">Manage Milestones →</button></Card>
              : <div className="space-y-3">
                {upcoming_milestones.map(m => {
                  const isOD = m.status === 'PENDING' && m.days_left < 0; const cfg = MILESTONE_STATUS_CFG[isOD ? 'MISSED' : m.status] || MILESTONE_STATUS_CFG.PENDING; return (
                    <Card key={m._id} className="px-6 py-[18px]">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold shrink-0 ${cfg.bg} ${cfg.color}`}>{cfg.icon}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#F0FAF4]">{m.title}</p>
                          {m.description && <p className="text-xs text-[#7BAF8E] mt-0.5 truncate">{m.description}</p>}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-semibold text-[#F0FAF4]">{fmtDate(m.due_date, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                          <p className={`text-[11px] font-bold mt-0.5 ${m.days_left < 0 ? 'text-red-400' : m.days_left <= 3 ? 'text-yellow-400' : 'text-[#7BAF8E]'}`}>
                            {m.days_left < 0 ? `${Math.abs(m.days_left)}d overdue` : m.days_left === 0 ? 'Due today' : `${m.days_left}d remaining`}
                          </p>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            }
            <div className="text-center mt-5">
              <button onClick={() => navigate(buildProjectMilestonesPath(routePrefix, projectId))} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-emerald-400 bg-emerald-400/10 border border-emerald-400/25 hover:bg-emerald-400/18 transition-all">View & Manage All Milestones →</button>
            </div>
          </div>
        )}

        {/* ── ACTIVITY TAB ── */}
        {activeTab === 'activity' && (
          <Card className="p-6">
            <SectionTitle>Recent Activity ({recent_activity.length})</SectionTitle>
            {recent_activity.length === 0
              ? <div className="flex flex-col items-center justify-center py-12 gap-3"><div className="text-4xl">◫</div><p className="text-sm text-[#7BAF8E]">No activity yet</p></div>
              : recent_activity.map((a, i) => (
                <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl mb-2 bg-[#28623A]/6 border border-[#28623A]/20 hover:border-emerald-400/20 transition-colors">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 bg-emerald-400/10 text-emerald-400 font-bold">{a.type === 'COMMENT' ? '💬' : '◈'}</div>
                  <div className="flex-1 min-w-0">
                    {a.type === 'TASK_HISTORY'
                      ? <p className="text-xs text-[#F0FAF4]"><span className="font-semibold">{a.task_title}</span><span className="text-[#7BAF8E]"> — {a.field} changed</span>{a.new_value && <span className="text-emerald-400"> → {String(a.new_value)}</span>}</p>
                      : <p className="text-xs text-[#F0FAF4]"><span className="font-semibold text-emerald-400">{a.author}</span><span className="text-[#7BAF8E]"> commented on </span><span className="font-semibold">{a.task_title}</span>{a.content && <span className="text-[#7BAF8E]">: "{a.content.slice(0, 60)}{a.content.length > 60 ? '...' : ''}"</span>}</p>
                    }
                    <p className="text-[10px] text-[#7BAF8E]/50 mt-1">{timeAgo(a.created_at)}</p>
                  </div>
                </div>
              ))
            }
          </Card>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-10 pt-5 border-t border-[#28623A]/15">
          <p className="text-xs text-[#7BAF8E]/30">SkillSync · Project Dashboard</p>
          <p className="text-xs text-[#7BAF8E]/30">{project.start_date && project.end_date ? `${fmtDate(project.start_date)} → ${fmtDate(project.end_date)}` : 'No timeline set'}</p>
        </div>
      </div>
    </div>
  )
}
