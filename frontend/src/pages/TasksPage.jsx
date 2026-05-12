import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { buildProjectPath, getRolePrefixFromPath } from '../utils/roleRoutes'

const API = 'http://localhost:3000'

const STATUS_CFG = {
  TODO: {
    icon: '○',
    label: 'To Do',
    colorClass: 'text-[#7BAF8E]',
    bgClass: 'bg-[rgba(123,175,142,0.12)]',
    badgeClass: 'border-[rgba(123,175,142,0.25)] bg-[rgba(123,175,142,0.12)] text-[#7BAF8E]',
    buttonClass: 'border-[rgba(123,175,142,0.25)] bg-[rgba(123,175,142,0.12)] text-[#7BAF8E]',
    barColor: '#7BAF8E',
  },
  IN_PROGRESS: {
    icon: '◑',
    label: 'In Progress',
    colorClass: 'text-blue-400',
    bgClass: 'bg-blue-400/12',
    badgeClass: 'border-blue-400/25 bg-blue-400/12 text-blue-400',
    buttonClass: 'border-blue-400/25 bg-blue-400/12 text-blue-400',
    barColor: '#60A5FA',
  },
  IN_REVIEW: {
    icon: '◕',
    label: 'In Review',
    colorClass: 'text-yellow-400',
    bgClass: 'bg-yellow-400/12',
    badgeClass: 'border-yellow-400/25 bg-yellow-400/12 text-yellow-400',
    buttonClass: 'border-yellow-400/25 bg-yellow-400/12 text-yellow-400',
    barColor: '#FBBF24',
  },
  DONE: {
    icon: '●',
    label: 'Done',
    colorClass: 'text-emerald-400',
    bgClass: 'bg-emerald-400/12',
    badgeClass: 'border-emerald-400/25 bg-emerald-400/12 text-emerald-400',
    buttonClass: 'border-emerald-400/25 bg-emerald-400/12 text-emerald-400',
    barColor: '#3EE07F',
  },
}

const PRIORITY_CFG = {
  LOW: {
    icon: '↓',
    colorClass: 'text-[#7BAF8E]',
    bgClass: 'bg-[rgba(123,175,142,0.1)]',
    buttonClass: 'border-[rgba(123,175,142,0.25)] bg-[rgba(123,175,142,0.1)] text-[#7BAF8E]',
  },
  MEDIUM: {
    icon: '→',
    colorClass: 'text-blue-400',
    bgClass: 'bg-blue-400/10',
    buttonClass: 'border-blue-400/25 bg-blue-400/10 text-blue-400',
  },
  HIGH: {
    icon: '↑',
    colorClass: 'text-yellow-400',
    bgClass: 'bg-yellow-400/10',
    buttonClass: 'border-yellow-400/25 bg-yellow-400/10 text-yellow-400',
  },
  URGENT: {
    icon: '⚡',
    colorClass: 'text-red-400',
    bgClass: 'bg-red-400/10',
    buttonClass: 'border-red-400/25 bg-red-400/10 text-red-400',
  },
}

const BG = () => (
  <>
    <div className="ss-radial-upper fixed inset-0 pointer-events-none" />
    <div className="ss-grid-overlay fixed inset-0 pointer-events-none opacity-[0.035]" />
  </>
)

const SurfaceCard = ({ children, className = '', onClick }) => (
  <div
    onClick={onClick}
    className={`relative rounded-2xl border border-[#3EE07F]/13 bg-[linear-gradient(160deg,_#162B1E_0%,_#0F2027_60%)] shadow-[0_0_0_1px_rgba(40,98,58,0.12),0_12px_40px_rgba(15,32,39,0.6)] ${onClick ? 'cursor-pointer' : ''} ${className}`}
  >
    <div className="absolute top-0 left-6 right-6 h-px rounded-full bg-[linear-gradient(90deg,transparent,rgba(62,224,127,0.2),transparent)]" />
    {children}
  </div>
)

const Badge = ({ children, className = '' }) => (
  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${className}`}>
    {children}
  </span>
)

const Avatar = ({ name, size = 'md' }) => {
  const sizes = size === 'sm'
    ? 'h-5 w-5 rounded-md text-[9px]'
    : size === 'lg'
      ? 'h-7 w-7 rounded-lg text-[10px]'
      : 'h-6 w-6 rounded-lg text-[10px]'

  return (
    <div className={`flex items-center justify-center font-bold text-[#0F2027] ${sizes} bg-[linear-gradient(135deg,_#28623A,_#3EE07F)]`}>
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  )
}

const Field = ({ label, value, onChange, type = 'text', placeholder, rows, required }) => {
  const [focused, setFocused] = useState(false)
  const Tag = rows ? 'textarea' : 'input'

  return (
    <div>
      {label && (
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.15em] text-[#7BAF8E]">
          {label}{required && <span className="text-[#3EE07F]"> *</span>}
        </label>
      )}
      <Tag
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className={`w-full rounded-[12px] bg-[rgba(15,32,39,0.85)] px-[14px] py-[10px] text-[13px] text-[#F0FAF4] outline-none transition-colors ${rows ? 'resize-none' : ''} ${focused ? 'border border-[rgba(62,224,127,0.4)]' : 'border border-[rgba(40,98,58,0.3)]'}`}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
  )
}

const ProgressBarSvg = ({ pct, from, to, height = 8 }) => {
  const widthClass = `ss-w-${Math.max(0, Math.min(100, Math.round(Number(pct) || 0)))}`
  const fillClass = from === '#28623A' && to === '#3EE07F'
    ? 'bg-[linear-gradient(90deg,#28623A,#3EE07F)]'
    : 'bg-[linear-gradient(90deg,#28623A,#60A5FA)]'
  return (
    <div className={`ss-progress-fill ${fillClass} ${widthClass}`} />
  )
}

const SolidProgressSvg = ({ pct, color, height = 8 }) => {
  const widthClass = `ss-w-${Math.max(0, Math.min(100, Math.round(Number(pct) || 0)))}`
  const fillClass = color === '#7BAF8E'
    ? 'bg-[#7BAF8E]'
    : color === '#60A5FA'
      ? 'bg-[#60A5FA]'
      : color === '#FBBF24'
        ? 'bg-[#FBBF24]'
        : color === '#F87171'
          ? 'bg-[#F87171]'
          : 'bg-[#3EE07F]'
  return <div className={`ss-progress-fill ${fillClass} ${widthClass}`} />
}

const formatDueDate = (date) =>
  date
    ? new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—'

const getDaysLeft = (date) =>
  date ? Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24)) : null

const formatMinutes = (mins) =>
  mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`

const TaskModal = ({ mode = 'create', initial = {}, projectId, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    title: initial.title || '',
    description: initial.description || '',
    assigned_to: initial.assigned_to?._id || initial.assigned_to || '',
    priority: initial.priority || 'MEDIUM',
    due_date: initial.due_date ? initial.due_date.slice(0, 10) : '',
    status: initial.status || 'TODO',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)
    setError('')

    const payload = { title: form.title, project_id: projectId }
    if (form.description) payload.description = form.description
    if (form.assigned_to) payload.assigned_to = form.assigned_to
    if (form.priority) payload.priority = form.priority
    if (form.due_date) payload.due_date = form.due_date
    if (form.status) payload.status = form.status

    try {
      if (mode === 'create') {
        const res = await axios.post(`${API}/api/tasks`, payload, { withCredentials: true })
        onSuccess(res.data.task, 'create')
      } else {
        const res = await axios.put(`${API}/api/tasks/${initial._id}`, payload, { withCredentials: true })
        onSuccess(res.data.task, 'edit')
      }
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,26,18,0.88)] px-4 backdrop-blur-[8px]">
      <div className="relative w-full max-w-[500px] rounded-2xl border border-[#3EE07F]/13 bg-[linear-gradient(160deg,_#162B1E,_#0F2027)] p-7 shadow-[0_32px_80px_rgba(15,32,39,0.95)]">
        <div className="absolute top-0 left-10 right-10 h-px rounded-full bg-[linear-gradient(90deg,transparent,rgba(62,224,127,0.35),transparent)]" />
        <h3 className="mb-1 text-[18px] font-bold text-[#F0FAF4]">{mode === 'create' ? 'Create Task' : 'Edit Task'}</h3>
        <p className="mb-6 text-[12px] text-[#7BAF8E]">{mode === 'create' ? 'Add a new task to this project' : 'Update task details'}</p>

        {error && <div className="mb-4 rounded-xl border border-red-400/20 bg-red-400/8 px-3 py-2.5 text-[12px] text-[#FCA5A5]">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Title" value={form.title} required placeholder="e.g. Fix login bug" onChange={e => set('title', e.target.value)} />
          <Field label="Description" value={form.description} rows={3} placeholder="What needs to be done?" onChange={e => set('description', e.target.value)} />

          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-[#7BAF8E]">Priority</label>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(PRIORITY_CFG).map(([key, cfg]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => set('priority', key)}
                  className={`rounded-xl border py-2 text-[10px] font-bold uppercase tracking-wide transition-all ${
                    form.priority === key
                      ? cfg.buttonClass
                      : 'border-[rgba(40,98,58,0.3)] bg-[rgba(15,32,39,0.6)] text-[#7BAF8E]'
                  }`}
                >
                  {cfg.icon} {key}
                </button>
              ))}
            </div>
          </div>

          {mode === 'edit' && (
            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-[#7BAF8E]">Status</label>
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(STATUS_CFG).map(([key, cfg]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => set('status', key)}
                    className={`rounded-xl border py-2 text-[10px] font-bold uppercase tracking-wide transition-all ${
                      form.status === key
                        ? cfg.buttonClass
                        : 'border-[rgba(40,98,58,0.3)] bg-[rgba(15,32,39,0.6)] text-[#7BAF8E]'
                    }`}
                  >
                    {cfg.icon} {cfg.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Field label="Due Date" type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} />

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="rounded-xl border border-[rgba(40,98,58,0.3)] px-5 py-2.5 text-[12px] font-medium text-[#7BAF8E]">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !form.title}
              className={`flex-1 rounded-xl border border-[#3EE07F]/20 bg-[linear-gradient(135deg,_#28623A,_#1A4D2E)] py-2.5 text-[12px] font-semibold text-[#F0FAF4] ${saving || !form.title ? 'cursor-not-allowed opacity-50' : 'opacity-100'}`}
            >
              {saving ? 'Saving...' : mode === 'create' ? 'Create Task →' : 'Save Changes →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const TaskDrawer = ({ task, currentUser, onClose, onUpdate, onDelete }) => {
  const [comment, setComment] = useState('')
  const [commenting, setCommenting] = useState(false)
  const [subtaskTitle, setSubtaskTitle] = useState('')
  const [addingSub, setAddingSub] = useState(false)
  const [timerRunning, setTimerRunning] = useState(!!task.active_timer?.started_at)
  const [manualMins, setManualMins] = useState('')
  const [manualNote, setManualNote] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const intervalRef = useRef(null)

  const isPM = currentUser.role === 'PROJECT_MANAGER' || currentUser.role === 'ADMIN'

  useEffect(() => {
    if (timerRunning && task.active_timer?.started_at) {
      const update = () => {
        const secs = Math.floor((Date.now() - new Date(task.active_timer.started_at)) / 1000)
        setElapsed(secs)
      }
      update()
      intervalRef.current = setInterval(update, 1000)
    }
    return () => clearInterval(intervalRef.current)
  }, [timerRunning, task.active_timer?.started_at])

  const formatElapsed = (s) =>
    `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const handleStatusChange = async (newStatus) => {
    try {
      const res = await axios.put(`${API}/api/tasks/${task._id}`, { status: newStatus }, { withCredentials: true })
      onUpdate(res.data.task)
    } catch (err) {
      console.error(err)
    }
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!comment.trim()) return
    setCommenting(true)
    try {
      const res = await axios.post(`${API}/api/tasks/${task._id}/comments`, { content: comment }, { withCredentials: true })
      setComment('')
      onUpdate({ ...task, comments: [...task.comments, res.data.comment] })
    } catch (err) {
      console.error(err)
    } finally {
      setCommenting(false)
    }
  }

  const handleDeleteComment = async (commentId) => {
    try {
      await axios.delete(`${API}/api/tasks/${task._id}/comments/${commentId}`, { withCredentials: true })
      onUpdate({ ...task, comments: task.comments.filter(c => c._id !== commentId) })
    } catch (err) {
      console.error(err)
    }
  }

  const handleToggleSubtask = async (subtaskId) => {
    try {
      const res = await axios.put(`${API}/api/tasks/${task._id}/subtasks/${subtaskId}`, {}, { withCredentials: true })
      onUpdate({ ...task, subtasks: task.subtasks.map(s => s._id === subtaskId ? res.data.subtask : s) })
    } catch (err) {
      console.error(err)
    }
  }

  const handleAddSubtask = async (e) => {
    e.preventDefault()
    if (!subtaskTitle.trim()) return
    setAddingSub(true)
    try {
      const res = await axios.post(`${API}/api/tasks/${task._id}/subtasks`, { title: subtaskTitle }, { withCredentials: true })
      setSubtaskTitle('')
      onUpdate({ ...task, subtasks: [...task.subtasks, res.data.subtask] })
    } catch (err) {
      console.error(err)
    } finally {
      setAddingSub(false)
    }
  }

  const handleStartTimer = async () => {
    try {
      await axios.post(`${API}/api/tasks/${task._id}/timer/start`, {}, { withCredentials: true })
      setTimerRunning(true)
    } catch (err) {
      console.error(err)
    }
  }

  const handleStopTimer = async () => {
    try {
      const res = await axios.post(`${API}/api/tasks/${task._id}/timer/stop`, {}, { withCredentials: true })
      setTimerRunning(false)
      clearInterval(intervalRef.current)
      onUpdate({ ...task, total_time_minutes: res.data.total_time_minutes, active_timer: { user: null, started_at: null } })
    } catch (err) {
      console.error(err)
    }
  }

  const handleManualLog = async (e) => {
    e.preventDefault()
    if (!manualMins) return
    try {
      const res = await axios.post(`${API}/api/tasks/${task._id}/timer/manual`, { duration_minutes: Number(manualMins), note: manualNote }, { withCredentials: true })
      setManualMins('')
      setManualNote('')
      onUpdate({ ...task, total_time_minutes: res.data.total_time_minutes })
    } catch (err) {
      console.error(err)
    }
  }

  const completedSubs = task.subtasks?.filter(s => s.completed).length || 0
  const totalSubs = task.subtasks?.length || 0
  const statusCfg = STATUS_CFG[task.status]
  const priorityCfg = PRIORITY_CFG[task.priority]
  const daysLeft = getDaysLeft(task.due_date)

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1" />
      <div
        className="relative h-full w-full max-w-[560px] overflow-y-auto border-l border-[#3EE07F]/13 bg-[linear-gradient(180deg,_#162B1E_0%,_#0F2027_30%)] shadow-[-24px_0_80px_rgba(15,32,39,0.8)]"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-[rgba(40,98,58,0.3)] bg-[rgba(22,43,30,0.95)] px-6 py-4 backdrop-blur-[12px]">
          <div className="min-w-0 flex-1">
            <h2 className="mb-1.5 text-[17px] font-bold leading-tight text-[#F0FAF4]">{task.title}</h2>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={statusCfg.badgeClass}>{statusCfg.icon} {statusCfg.label}</Badge>
              <Badge className={`${priorityCfg.buttonClass}`}>{priorityCfg.icon} {task.priority}</Badge>
              {daysLeft !== null && (
                <Badge className={daysLeft < 0 ? 'border-red-400/25 bg-red-400/10 text-[#F87171]' : daysLeft <= 3 ? 'border-yellow-400/25 bg-yellow-400/10 text-[#FBBF24]' : 'border-[rgba(40,98,58,0.3)] bg-[rgba(40,98,58,0.1)] text-[#7BAF8E]'}>
                  {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {isPM && (
              <button onClick={() => onDelete(task._id)} className="flex h-8 w-8 items-center justify-center rounded-lg text-[13px] text-[rgba(248,113,113,0.5)] transition-all hover:bg-red-400/10 hover:text-[#F87171]">
                🗑
              </button>
            )}
            <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-[16px] text-[#7BAF8E] transition-all hover:bg-[rgba(40,98,58,0.2)] hover:text-[#F0FAF4]">
              ✕
            </button>
          </div>
        </div>

        <div className="space-y-6 px-6 py-5">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#7BAF8E]">Status</p>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(STATUS_CFG).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => handleStatusChange(key)}
                  className={`rounded-xl border py-2 text-[10px] font-bold uppercase tracking-wide transition-all ${
                    task.status === key
                      ? cfg.buttonClass
                      : 'border-[rgba(40,98,58,0.3)] bg-[rgba(15,32,39,0.5)] text-[#7BAF8E]'
                  }`}
                >
                  {cfg.icon} {cfg.label}
                </button>
              ))}
            </div>
          </div>

          {task.description && (
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#7BAF8E]">Description</p>
              <p className="text-[13px] leading-relaxed text-[rgba(240,250,244,0.75)]">{task.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-[rgba(40,98,58,0.3)] bg-[rgba(40,98,58,0.1)] p-3">
              <div className="mb-1.5 text-[10px] uppercase tracking-widest text-[#7BAF8E]">Assigned To</div>
              {task.assigned_to ? (
                <div className="flex items-center gap-2">
                  <Avatar name={task.assigned_to.username} />
                  <span className="text-[12px] font-semibold text-[#F0FAF4]">{task.assigned_to.username}</span>
                </div>
              ) : (
                <span className="text-[12px] text-[rgba(123,175,142,0.4)]">Unassigned</span>
              )}
            </div>
            <div className="rounded-xl border border-[rgba(40,98,58,0.3)] bg-[rgba(40,98,58,0.1)] p-3">
              <div className="mb-1.5 text-[10px] uppercase tracking-widest text-[#7BAF8E]">Due Date</div>
              <span className={`text-[12px] font-semibold ${daysLeft !== null && daysLeft < 0 ? 'text-[#F87171]' : 'text-[#F0FAF4]'}`}>
                {formatDueDate(task.due_date)}
              </span>
            </div>
          </div>

          {!!task.dependencies?.length && (
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#7BAF8E]">Dependencies</p>
              {task.dependencies.map(dep => {
                const depCfg = STATUS_CFG[dep.status] || STATUS_CFG.TODO
                return (
                  <div key={dep._id} className="mb-2 flex items-center gap-2 rounded-xl border border-[rgba(40,98,58,0.3)] bg-[rgba(40,98,58,0.08)] p-2.5">
                    <span className={depCfg.colorClass}>{depCfg.icon}</span>
                    <span className="text-[12px] text-[#F0FAF4]">{dep.title}</span>
                    <Badge className={depCfg.badgeClass}>{dep.status}</Badge>
                  </div>
                )
              })}
            </div>
          )}

          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#7BAF8E]">
                Subtasks {totalSubs > 0 && <span className="text-[#3EE07F]">({completedSubs}/{totalSubs})</span>}
              </p>
            </div>
            {totalSubs > 0 && (
              <div className="mb-3">
                <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-[rgba(40,98,58,0.2)]">
                  <ProgressBarSvg pct={totalSubs > 0 ? (completedSubs / totalSubs) * 100 : 0} from="#28623A" to="#3EE07F" height={6} />
                </div>
                {task.subtasks.map(sub => (
                  <div key={sub._id} className="mb-1.5 flex items-center gap-3 rounded-xl border border-[rgba(40,98,58,0.3)] bg-[rgba(40,98,58,0.07)] px-3 py-2.5 transition-all">
                    <button
                      onClick={() => handleToggleSubtask(sub._id)}
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${sub.completed ? 'border-[#3EE07F] bg-emerald-400/20 text-[#3EE07F]' : 'border-[rgba(40,98,58,0.3)] bg-[rgba(40,98,58,0.2)] text-transparent'}`}
                    >
                      ✓
                    </button>
                    <span className={`flex-1 text-[12px] ${sub.completed ? 'text-[#7BAF8E] line-through' : 'text-[#F0FAF4]'}`}>{sub.title}</span>
                  </div>
                ))}
              </div>
            )}
            {isPM && (
              <form onSubmit={handleAddSubtask} className="flex gap-2">
                <input
                  value={subtaskTitle}
                  onChange={e => setSubtaskTitle(e.target.value)}
                  placeholder="Add subtask..."
                  className="flex-1 rounded-xl border border-[rgba(40,98,58,0.3)] bg-[rgba(15,32,39,0.85)] px-3 py-2 text-[12px] text-[#F0FAF4] outline-none"
                />
                <button
                  type="submit"
                  disabled={addingSub || !subtaskTitle}
                  className={`rounded-xl bg-[linear-gradient(135deg,_#28623A,_#1A4D2E)] px-3 py-2 text-[11px] font-semibold text-[#F0FAF4] ${!subtaskTitle ? 'cursor-not-allowed opacity-40' : 'opacity-100'}`}
                >
                  + Add
                </button>
              </form>
            )}
          </div>

          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#7BAF8E]">Time Tracking</p>
            <div className="mb-3 rounded-xl border border-[rgba(40,98,58,0.3)] bg-[rgba(40,98,58,0.1)] p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="mb-1 text-[10px] uppercase tracking-widest text-[#7BAF8E]">Total Logged</div>
                  <div className="text-[20px] font-bold text-[#3EE07F]">{formatMinutes(task.total_time_minutes || 0)}</div>
                </div>
                {timerRunning && (
                  <div className="text-right">
                    <div className="mb-1 text-[10px] uppercase tracking-widest text-[#FBBF24]">Running</div>
                    <div className="font-mono text-[18px] font-bold text-[#FBBF24]">{formatElapsed(elapsed)}</div>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {!timerRunning ? (
                  <button onClick={handleStartTimer} className="flex-1 rounded-xl border border-emerald-400/25 bg-emerald-400/12 py-2 text-[11px] font-semibold text-[#3EE07F]">
                    ▶ Start Timer
                  </button>
                ) : (
                  <button onClick={handleStopTimer} className="flex-1 rounded-xl border border-red-400/20 bg-red-400/10 py-2 text-[11px] font-semibold text-[#F87171]">
                    ⏹ Stop Timer
                  </button>
                )}
              </div>
            </div>

            <form onSubmit={handleManualLog} className="flex gap-2">
              <input
                type="number"
                value={manualMins}
                onChange={e => setManualMins(e.target.value)}
                placeholder="Minutes"
                className="w-24 rounded-xl border border-[rgba(40,98,58,0.3)] bg-[rgba(15,32,39,0.85)] px-3 py-2 text-[12px] text-[#F0FAF4] outline-none"
              />
              <input
                value={manualNote}
                onChange={e => setManualNote(e.target.value)}
                placeholder="Note (optional)"
                className="flex-1 rounded-xl border border-[rgba(40,98,58,0.3)] bg-[rgba(15,32,39,0.85)] px-3 py-2 text-[12px] text-[#F0FAF4] outline-none"
              />
              <button
                type="submit"
                disabled={!manualMins}
                className={`rounded-xl border border-blue-400/20 bg-blue-400/10 px-3 py-2 text-[11px] font-semibold text-blue-400 ${!manualMins ? 'cursor-not-allowed opacity-40' : 'opacity-100'}`}
              >
                Log
              </button>
            </form>
          </div>

          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#7BAF8E]">Comments ({task.comments?.length || 0})</p>
            {task.comments?.map(c => (
              <div key={c._id} className="mb-4 flex gap-3">
                <Avatar name={c.author?.username} size="lg" />
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-[12px] font-semibold text-[#F0FAF4]">{c.author?.username}</span>
                    <span className="text-[10px] text-[rgba(123,175,142,0.5)]">
                      {new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {(c.author?._id === currentUser.id || isPM) && (
                      <button onClick={() => handleDeleteComment(c._id)} className="ml-auto text-[10px] text-[rgba(248,113,113,0.3)] transition-all hover:text-[#F87171]">
                        ✕
                      </button>
                    )}
                  </div>
                  <p className="text-[13px] leading-relaxed text-[rgba(240,250,244,0.8)]">
                    {c.content.split(/(@\w+)/g).map((part, i) =>
                      part.startsWith('@')
                        ? <span key={i} className="font-semibold text-[#3EE07F]">{part}</span>
                        : <span key={i}>{part}</span>
                    )}
                  </p>
                </div>
              </div>
            ))}

            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Add a comment... use @username to mention"
                className="flex-1 rounded-xl border border-[rgba(40,98,58,0.3)] bg-[rgba(15,32,39,0.85)] px-4 py-2.5 text-[12px] text-[#F0FAF4] outline-none"
              />
              <button
                type="submit"
                disabled={commenting || !comment.trim()}
                className={`rounded-xl bg-[linear-gradient(135deg,_#28623A,_#1A4D2E)] px-4 py-2.5 text-[11px] font-semibold text-[#F0FAF4] transition-all ${!comment.trim() ? 'cursor-not-allowed opacity-40' : 'opacity-100'}`}
              >
                Send
              </button>
            </form>
          </div>

          {!!task.history?.length && (
            <div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#7BAF8E]">History</p>
              {task.history.slice().reverse().slice(0, 10).map((h, i) => (
                <div key={i} className="mb-2.5 flex items-start gap-3">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#7BAF8E]" />
                  <div>
                    <span className="text-[11px] text-[rgba(240,250,244,0.65)]">
                      <span className="text-[#3EE07F]">{h.changed_by?.username || 'Someone'}</span>
                      {' changed '}<span className="font-semibold text-[#F0FAF4]">{h.field}</span>
                      {h.old_value && <> from <span className="text-[#7BAF8E]">{String(h.old_value)}</span></>}
                      {h.new_value && <> to <span className="text-[#3EE07F]">{String(h.new_value)}</span></>}
                    </span>
                    <div className="mt-0.5 text-[10px] text-[rgba(123,175,142,0.4)]">
                      {new Date(h.changed_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const TaskCard = ({ task, onClick }) => {
  const statusCfg = STATUS_CFG[task.status]
  const priorityCfg = PRIORITY_CFG[task.priority]
  const completedSubs = task.subtasks?.filter(s => s.completed).length || 0
  const totalSubs = task.subtasks?.length || 0
  const daysLeft = getDaysLeft(task.due_date)

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-xl border border-[rgba(40,98,58,0.3)] bg-[rgba(40,98,58,0.07)] p-4 transition-all hover:border-emerald-400/25"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <span className="flex-1 text-[13px] font-semibold leading-tight text-[#F0FAF4]">{task.title}</span>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className={`text-[11px] font-bold ${priorityCfg.colorClass}`}>{priorityCfg.icon}</span>
        </div>
      </div>
      {task.description && <p className="mb-3 line-clamp-1 text-[11px] leading-relaxed text-[#7BAF8E]">{task.description}</p>}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Badge className={statusCfg.badgeClass}>{statusCfg.icon} {statusCfg.label}</Badge>
          {totalSubs > 0 && <span className="text-[10px] text-[#7BAF8E]">{completedSubs}/{totalSubs} subtasks</span>}
        </div>
        <div className="flex items-center gap-2">
          {task.total_time_minutes > 0 && (
            <span className="text-[10px] text-[#7BAF8E]">⏱ {task.total_time_minutes < 60 ? `${task.total_time_minutes}m` : `${Math.floor(task.total_time_minutes / 60)}h`}</span>
          )}
          {daysLeft !== null && (
            <span className={`text-[10px] font-semibold ${daysLeft < 0 ? 'text-[#F87171]' : daysLeft <= 3 ? 'text-[#FBBF24]' : 'text-[#7BAF8E]'}`}>
              {daysLeft < 0 ? `${Math.abs(daysLeft)}d OD` : `${daysLeft}d`}
            </span>
          )}
          {task.assigned_to && <Avatar name={task.assigned_to.username} size="sm" />}
        </div>
      </div>
    </div>
  )
}

export default function TasksPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { projectId } = useParams()
  const routePrefix = getRolePrefixFromPath(location.pathname)

  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentUser, setCurrentUser] = useState(null)
  const [toast, setToast] = useState('')
  const [createModal, setCreateModal] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [openTask, setOpenTask] = useState(null)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [search, setSearch] = useState('')

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const isPM = currentUser?.role === 'PROJECT_MANAGER' || currentUser?.role === 'ADMIN'

  useEffect(() => { fetchAll() }, [projectId])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [tasksRes, meRes] = await Promise.all([
        axios.get(`${API}/api/tasks/project/${projectId}`, { withCredentials: true }),
        axios.get(`${API}/api/profile/me`, { withCredentials: true }),
      ])
      setTasks(tasksRes.data.tasks || [])
      setCurrentUser(meRes.data.user)
    } catch (err) {
      if (err.response?.status === 401) navigate('/login')
      else setError('Failed to load tasks.')
    } finally {
      setLoading(false)
    }
  }

  const handleModalSuccess = (task, mode) => {
    if (mode === 'create') {
      setTasks(prev => [task, ...prev])
      showToast('✓ Task created')
    } else {
      setTasks(prev => prev.map(t => t._id === task._id ? task : t))
      showToast('✓ Task updated')
    }
  }

  const handleTaskUpdate = (updatedTask) => {
    setTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t))
    setOpenTask(updatedTask)
  }

  const handleDelete = async (taskId) => {
    if (!confirm('Delete this task?')) return
    try {
      await axios.delete(`${API}/api/tasks/${taskId}`, { withCredentials: true })
      setTasks(prev => prev.filter(t => t._id !== taskId))
      setOpenTask(null)
      showToast('✓ Task deleted')
    } catch {
      showToast('⚠ Delete failed')
    }
  }

  const filtered = tasks.filter(t => {
    const matchStatus = statusFilter === 'ALL' || t.status === statusFilter
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const counts = tasks.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1
    return acc
  }, {})

  if (loading) return (
    <div className="ss-bg-app flex min-h-screen items-center justify-center">
      <BG />
      <div className="relative z-10 flex flex-col items-center gap-3">
        <div className="ss-spinner h-10 w-10 rounded-full border-2 animate-spin" />
        <span className="text-[13px] text-[#7BAF8E]">Loading tasks...</span>
      </div>
    </div>
  )

  if (error) return (
    <div className="ss-bg-app flex min-h-screen items-center justify-center">
      <BG />
      <div className="relative z-10 rounded-2xl border border-red-400/20 bg-[linear-gradient(160deg,_#162B1E_0%,_#0F2027_60%)] p-8 text-center shadow-[0_0_0_1px_rgba(40,98,58,0.12),0_12px_40px_rgba(15,32,39,0.6)]">
        <p className="text-[#F87171]">{error}</p>
        <button onClick={fetchAll} className="mt-4 rounded-xl bg-[#28623A] px-5 py-2 text-[13px] font-semibold text-[#F0FAF4]">
          Retry
        </button>
      </div>
    </div>
  )

  return (
    <div className="ss-bg-app min-h-screen font-sans">
      <BG />
      <div className="relative z-10 mx-auto max-w-[1100px] px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <button onClick={() => navigate(buildProjectPath(routePrefix, projectId))} className="mb-2 block text-[12px] font-medium text-[#7BAF8E] transition-all hover:text-[#F0FAF4]">
              ← Back to Project
            </button>
            <h1 className="text-[24px] font-bold text-[#F0FAF4]">Tasks</h1>
            <p className="mt-0.5 text-[13px] text-[#7BAF8E]">
              {tasks.length} total · {counts.IN_PROGRESS || 0} in progress · {counts.DONE || 0} done
            </p>
          </div>
          <div className="flex items-center gap-3">
            {toast && (
              <div className={`rounded-full border px-4 py-2 text-[12px] font-semibold ${toast.startsWith('✓') ? 'border-emerald-400/25 bg-emerald-400/12 text-[#3EE07F]' : 'border-red-400/20 bg-red-400/10 text-[#F87171]'}`}>
                {toast}
              </div>
            )}
            {isPM && (
              <button onClick={() => setCreateModal(true)} className="flex items-center gap-2 rounded-xl border border-[#3EE07F]/20 bg-[linear-gradient(135deg,_#28623A,_#1A4D2E)] px-5 py-2.5 text-[13px] font-semibold text-[#F0FAF4] transition-all hover:shadow-[0_8px_28px_rgba(62,224,127,0.18)]">
                + Create Task
              </button>
            )}
          </div>
        </div>

        <div className="mb-6 grid grid-cols-4 gap-4">
          {Object.entries(STATUS_CFG).map(([key, cfg]) => (
            <SurfaceCard
              key={key}
              className="cursor-pointer px-5 py-4"
              onClick={() => setStatusFilter(statusFilter === key ? 'ALL' : key)}
            >
              <div className="mb-1 flex items-center justify-between">
                <span className={`text-[18px] ${cfg.colorClass}`}>{cfg.icon}</span>
                <span className={`text-[22px] font-bold ${cfg.colorClass}`}>{counts[key] || 0}</span>
              </div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-[#7BAF8E]">{cfg.label}</div>
            </SurfaceCard>
          ))}
        </div>

        {tasks.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <div className="relative min-w-[200px] flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] text-[#7BAF8E]">🔍</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search tasks..."
                className="w-full rounded-xl border border-[rgba(40,98,58,0.3)] bg-[rgba(15,32,39,0.85)] py-2.5 pl-9 pr-4 text-[13px] text-[#F0FAF4] outline-none"
              />
            </div>
            <div className="flex gap-1.5">
              {['ALL', ...Object.keys(STATUS_CFG)].map(key => {
                const cfg = STATUS_CFG[key]
                return (
                  <button
                    key={key}
                    onClick={() => setStatusFilter(key)}
                    className={`rounded-xl border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-all ${
                      statusFilter === key
                        ? key === 'ALL'
                          ? 'border-emerald-400/25 bg-[rgba(40,98,58,0.25)] text-[#3EE07F]'
                          : cfg.buttonClass
                        : 'border-[rgba(40,98,58,0.3)] bg-[rgba(15,32,39,0.5)] text-[#7BAF8E]'
                    }`}
                  >
                    {key === 'ALL' ? `All (${tasks.length})` : `${cfg.icon} ${cfg.label}`}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {tasks.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mb-4 text-[48px]">◫</div>
            <h3 className="mb-2 text-[18px] font-bold text-[#F0FAF4]">No tasks yet</h3>
            <p className="mb-6 text-[13px] text-[#7BAF8E]">Create the first task for this project</p>
            {isPM && (
              <button onClick={() => setCreateModal(true)} className="rounded-xl border border-[#3EE07F]/20 bg-[linear-gradient(135deg,_#28623A,_#1A4D2E)] px-6 py-3 text-[13px] font-semibold text-[#F0FAF4]">
                + Create First Task
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(task => (
              <TaskCard key={task._id} task={task} onClick={() => setOpenTask(task)} />
            ))}
            {filtered.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-[14px] text-[#7BAF8E]">No tasks match your filters</p>
                <button onClick={() => { setSearch(''); setStatusFilter('ALL') }} className="mt-3 rounded-xl border border-[rgba(40,98,58,0.3)] bg-[rgba(40,98,58,0.2)] px-4 py-2 text-[12px] font-semibold text-[#3EE07F]">
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {createModal && <TaskModal mode="create" projectId={projectId} onClose={() => setCreateModal(false)} onSuccess={handleModalSuccess} />}
      {editTarget && <TaskModal mode="edit" initial={editTarget} projectId={projectId} onClose={() => setEditTarget(null)} onSuccess={handleModalSuccess} />}
      {openTask && currentUser && (
        <TaskDrawer
          task={openTask}
          currentUser={currentUser}
          onClose={() => setOpenTask(null)}
          onUpdate={handleTaskUpdate}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
