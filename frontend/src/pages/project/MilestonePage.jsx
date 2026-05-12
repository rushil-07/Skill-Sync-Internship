import { useState, useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { buildProjectPath, buildProjectTasksPath, getRolePrefixFromPath } from '../../utils/roleRoutes'

const API = 'http://localhost:3000'

const T = {
  bg: '#0F2027',
  accent: '#3EE07F',
  muted: '#7BAF8E',
  text: '#F0FAF4',
}

const STATUS_CFG = {
  PENDING: {
    icon: '◷',
    label: 'Pending',
    colorHex: '#60A5FA',
    colorClass: 'text-blue-400',
    bgClass: 'bg-blue-400/12',
    badgeClass: 'border-blue-400/30 bg-blue-400/12 text-blue-400',
    cardBorderClass: 'border-blue-400/25',
    cardHoverClass: 'hover:border-blue-400/50',
    lineStrongClass: 'bg-[linear-gradient(to_bottom,rgba(96,165,250,0.6),rgba(96,165,250,0.3))]',
    lineSoftClass: 'bg-[linear-gradient(to_bottom,rgba(96,165,250,0.3),rgba(40,98,58,0.2))]',
    glowLineClass: 'bg-[linear-gradient(90deg,transparent,rgba(96,165,250,0.3),transparent)]',
    nodeShadowClass: 'shadow-[0_0_0_4px_rgba(96,165,250,0.08),0_0_20px_rgba(96,165,250,0.12)]',
  },
  COMPLETED: {
    icon: '✓',
    label: 'Completed',
    colorHex: '#3EE07F',
    colorClass: 'text-emerald-400',
    bgClass: 'bg-emerald-400/12',
    badgeClass: 'border-emerald-400/30 bg-emerald-400/12 text-emerald-400',
    cardBorderClass: 'border-emerald-400/25',
    cardHoverClass: 'hover:border-emerald-400/50',
    lineStrongClass: 'bg-[linear-gradient(to_bottom,rgba(62,224,127,0.6),rgba(62,224,127,0.3))]',
    lineSoftClass: 'bg-[linear-gradient(to_bottom,rgba(62,224,127,0.3),rgba(40,98,58,0.2))]',
    glowLineClass: 'bg-[linear-gradient(90deg,transparent,rgba(62,224,127,0.3),transparent)]',
    nodeShadowClass: 'shadow-[0_0_0_4px_rgba(62,224,127,0.08),0_0_20px_rgba(62,224,127,0.12)]',
  },
  MISSED: {
    icon: '✕',
    label: 'Missed',
    colorHex: '#F87171',
    colorClass: 'text-red-400',
    bgClass: 'bg-red-400/12',
    badgeClass: 'border-red-400/30 bg-red-400/12 text-red-400',
    cardBorderClass: 'border-red-400/25',
    cardHoverClass: 'hover:border-red-400/50',
    lineStrongClass: 'bg-[linear-gradient(to_bottom,rgba(248,113,113,0.6),rgba(248,113,113,0.3))]',
    lineSoftClass: 'bg-[linear-gradient(to_bottom,rgba(248,113,113,0.3),rgba(40,98,58,0.2))]',
    glowLineClass: 'bg-[linear-gradient(90deg,transparent,rgba(248,113,113,0.3),transparent)]',
    nodeShadowClass: 'shadow-[0_0_0_4px_rgba(248,113,113,0.08),0_0_20px_rgba(248,113,113,0.12)]',
  },
}

const BG = () => (
  <>
    <div className="ss-radial-zero fixed inset-0 pointer-events-none" />
    <div className="ss-grid-overlay fixed inset-0 pointer-events-none opacity-[0.03]" />
  </>
)

const SurfaceCard = ({ children, className = '' }) => (
  <div className={`relative rounded-2xl border border-[#3EE07F]/13 bg-[linear-gradient(160deg,_#162B1E_0%,_#0F2027_60%)] shadow-[0_0_0_1px_rgba(40,98,58,0.12),0_16px_48px_rgba(15,32,39,0.65)] ${className}`}>
    <div className="absolute top-0 left-8 right-8 h-px rounded-full bg-[linear-gradient(90deg,transparent,rgba(62,224,127,0.25),transparent)]" />
    {children}
  </div>
)

const fmtDate = (d, opts = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  d ? new Date(d).toLocaleDateString('en-IN', opts) : '—'

const daysLeft = (d) => d ? Math.ceil((new Date(d) - new Date()) / 86400000) : null

const ProgressBarSvg = ({ pct, from, to, markerColor, height = 12 }) => {
  const widthClass = `ss-w-${Math.max(0, Math.min(100, Math.round(Number(pct) || 0)))}`
  const fillClass = from === '#28623A' && to === '#60A5FA'
    ? 'bg-[linear-gradient(90deg,#28623A,#60A5FA)]'
    : 'bg-[linear-gradient(90deg,#28623A,#3EE07F)]'
  return (
    <div className={`relative h-full ${widthClass}`}>
      <div className={`ss-progress-fill ${fillClass}`} />
      {markerColor && <div className="absolute top-0 right-0 h-full w-[2px] rounded-full bg-[#3EE07F]" />}
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

const MilestoneModal = ({ mode = 'create', initial = {}, projectId, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    title: initial.title || '',
    description: initial.description || '',
    due_date: initial.due_date ? initial.due_date.slice(0, 10) : '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.due_date) return
    setSaving(true)
    setError('')

    const payload = { title: form.title.trim(), due_date: form.due_date }
    if (form.description.trim()) payload.description = form.description.trim()

    try {
      if (mode === 'create') {
        const res = await axios.post(`${API}/api/milestones/project/${projectId}`, payload, { withCredentials: true })
        onSuccess(res.data.milestone, 'create')
      } else {
        const res = await axios.put(`${API}/api/milestones/project/${projectId}/${initial._id}`, payload, { withCredentials: true })
        onSuccess(res.data.milestone, 'edit')
      }
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save milestone')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,26,18,0.88)] px-4 backdrop-blur-[8px]">
      <div className="relative w-full max-w-[460px] rounded-2xl border border-[#3EE07F]/13 bg-[linear-gradient(160deg,_#162B1E,_#0F2027)] p-7 shadow-[0_32px_80px_rgba(15,32,39,0.95)]">
        <div className="absolute top-0 left-10 right-10 h-px rounded-full bg-[linear-gradient(90deg,transparent,rgba(62,224,127,0.35),transparent)]" />

        <h3 className="mb-1 text-[18px] font-bold text-[#F0FAF4]">
          {mode === 'create' ? '◻ Add Milestone' : '✎ Edit Milestone'}
        </h3>
        <p className="mb-6 text-[12px] text-[#7BAF8E]">
          {mode === 'create' ? 'Mark a key deliverable on the timeline' : 'Update milestone details'}
        </p>

        {error && <div className="mb-4 rounded-xl border border-red-400/20 bg-red-400/8 px-3 py-2.5 text-[12px] text-[#FCA5A5]">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Title" value={form.title} required placeholder="e.g. Auth module complete" onChange={e => set('title', e.target.value)} />
          <Field label="Description" value={form.description} rows={3} placeholder="What should be delivered by this milestone?" onChange={e => set('description', e.target.value)} />
          <Field label="Due Date" type="date" value={form.due_date} required onChange={e => set('due_date', e.target.value)} />

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="rounded-xl border border-[rgba(40,98,58,0.3)] px-5 py-2.5 text-[12px] font-medium text-[#7BAF8E]">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !form.title || !form.due_date}
              className={`flex-1 rounded-xl border border-[#3EE07F]/20 bg-[linear-gradient(135deg,_#28623A,_#1A4D2E)] py-2.5 text-[13px] font-semibold text-[#F0FAF4] transition-all ${saving || !form.title || !form.due_date ? 'cursor-not-allowed opacity-50' : 'opacity-100 hover:shadow-[0_8px_24px_rgba(62,224,127,0.18)]'}`}
            >
              {saving
                ? <span className="flex items-center justify-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-[rgba(240,250,244,0.3)] border-t-[#F0FAF4]" />Saving...</span>
                : mode === 'create' ? 'Add Milestone →' : 'Save Changes →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const DeleteConfirm = ({ milestone, onClose, onConfirm, deleting }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,26,18,0.88)] px-4 backdrop-blur-[8px]">
    <div className="relative w-full max-w-[380px] rounded-2xl border border-red-400/20 bg-[linear-gradient(160deg,_#1E1212,_#0F2027)] p-7 shadow-[0_32px_80px_rgba(15,32,39,0.95)]">
      <div className="absolute top-0 left-10 right-10 h-px rounded-full bg-[linear-gradient(90deg,transparent,rgba(248,113,113,0.3),transparent)]" />
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-red-400/20 bg-red-400/10 text-[20px]">🗑</div>
      <h3 className="mb-1 text-[16px] font-bold text-[#F0FAF4]">Delete Milestone?</h3>
      <p className="mb-4 text-[13px] font-semibold text-[#F87171]">"{milestone.title}"</p>
      <p className="mb-6 text-[11px] text-[rgba(123,175,142,0.6)]">This milestone will be permanently removed from the timeline.</p>
      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 rounded-xl border border-[rgba(40,98,58,0.3)] py-2.5 text-[12px] font-medium text-[#7BAF8E]">Cancel</button>
        <button onClick={onConfirm} disabled={deleting} className={`flex-1 rounded-xl border border-red-400/25 bg-red-400/12 py-2.5 text-[12px] font-semibold text-[#F87171] ${deleting ? 'cursor-not-allowed opacity-50' : 'opacity-100'}`}>
          {deleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  </div>
)

const TimelineNode = ({ milestone, index, isPM, isFirst, isLast, onComplete, onReopen, onEdit, onDelete, completing }) => {
  const dl = daysLeft(milestone.due_date)
  const isOverdue = milestone.status === 'PENDING' && dl < 0
  const effectiveStatus = isOverdue ? 'MISSED' : milestone.status
  const cfg = STATUS_CFG[effectiveStatus]
  const side = index % 2 === 0 ? 'left' : 'right'

  return (
    <div className="relative flex items-start">
      <div className="absolute left-1/2 z-10 flex -translate-x-1/2 flex-col items-center">
        {!isFirst && <div className={`h-10 w-0.5 ${cfg.lineStrongClass}`} />}
        <div className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 text-[16px] font-bold ${cfg.bgClass} ${cfg.colorClass} ${cfg.nodeShadowClass}`}>
          {cfg.icon}
        </div>
        {!isLast && <div className={`min-h-[40px] w-0.5 flex-1 ${cfg.lineSoftClass}`} />}
      </div>

      <div className={`w-5/12 pb-8 ${side === 'left' ? 'mr-auto pr-8' : 'ml-auto pl-8'}`}>
        <div className={`group relative rounded-2xl border bg-[linear-gradient(160deg,_#162B1E_0%,_#0F2027_60%)] p-5 shadow-[0_0_0_1px_rgba(40,98,58,0.12),0_12px_40px_rgba(15,32,39,0.6)] transition-all ${cfg.cardBorderClass} ${cfg.cardHoverClass}`}>
          <div className={`absolute top-0 left-6 right-6 h-px rounded-full ${cfg.glowLineClass}`} />

          <div className="mb-2 flex items-start justify-between gap-2">
            <h3 className="flex-1 text-[14px] font-bold leading-snug text-[#F0FAF4]">{milestone.title}</h3>
            {isPM && (
              <div className="flex shrink-0 gap-1 opacity-0 transition-all group-hover:opacity-100">
                <button onClick={() => onEdit(milestone)} className="flex h-7 w-7 items-center justify-center rounded-lg text-[12px] text-[#7BAF8E] transition-all hover:bg-emerald-400/10 hover:text-[#3EE07F]">✎</button>
                <button onClick={() => onDelete(milestone)} className="flex h-7 w-7 items-center justify-center rounded-lg text-[12px] text-[rgba(248,113,113,0.4)] transition-all hover:bg-red-400/10 hover:text-[#F87171]">🗑</button>
              </div>
            )}
          </div>

          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${cfg.badgeClass}`}>
              {cfg.icon} {effectiveStatus === 'MISSED' ? 'Missed' : cfg.label}
            </span>
            {milestone.status === 'PENDING' && dl !== null && (
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${dl < 0 ? 'bg-red-400/10 text-[#F87171]' : dl <= 3 ? 'bg-yellow-400/10 text-[#FBBF24]' : 'bg-[rgba(40,98,58,0.1)] text-[#7BAF8E]'}`}>
                {dl < 0 ? `${Math.abs(dl)}d overdue` : dl === 0 ? 'Due today' : `${dl}d remaining`}
              </span>
            )}
          </div>

          {milestone.description && <p className="mb-3 text-[12px] leading-relaxed text-[rgba(240,250,244,0.65)]">{milestone.description}</p>}

          <div className="mb-3 flex items-center gap-2">
            <span className="text-[11px] text-[#7BAF8E]">📅</span>
            <span className={`text-[12px] font-semibold ${isOverdue ? 'text-[#F87171]' : 'text-[#F0FAF4]'}`}>{fmtDate(milestone.due_date)}</span>
            {milestone.completed_at && <span className="text-[11px] text-[#7BAF8E]">· Completed {fmtDate(milestone.completed_at)}</span>}
          </div>

          {!!milestone.linked_tasks?.length && (
            <div className="mb-3">
              <div className="mb-1.5 text-[10px] uppercase tracking-widest text-[#7BAF8E]">Linked Tasks</div>
              <div className="space-y-1">
                {milestone.linked_tasks.map(task => (
                  <div key={task._id} className="flex items-center gap-2 rounded-lg border border-[rgba(40,98,58,0.3)] bg-[rgba(40,98,58,0.1)] px-2.5 py-1.5">
                    <span className={`text-[10px] ${task.status === 'DONE' ? 'text-[#3EE07F]' : 'text-[#7BAF8E]'}`}>{task.status === 'DONE' ? '●' : '○'}</span>
                    <span className="text-[11px] text-[#F0FAF4]">{task.title}</span>
                    <span className={`ml-auto text-[9px] font-semibold uppercase ${task.status === 'DONE' ? 'text-[#3EE07F]' : 'text-[#7BAF8E]'}`}>{task.status?.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isPM && (
            <div className="border-t border-[rgba(40,98,58,0.2)] pt-2">
              {milestone.status !== 'COMPLETED' ? (
                <button
                  onClick={() => onComplete(milestone._id)}
                  disabled={completing === milestone._id}
                  className="w-full rounded-xl border border-emerald-400/25 bg-emerald-400/10 py-2 text-[11px] font-semibold text-[#3EE07F] transition-all hover:bg-emerald-400/18 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {completing === milestone._id ? '...' : '✓ Mark as Complete'}
                </button>
              ) : (
                <button
                  onClick={() => onReopen(milestone._id)}
                  className="w-full rounded-xl border border-[rgba(40,98,58,0.3)] bg-[rgba(123,175,142,0.08)] py-2 text-[11px] font-semibold text-[#7BAF8E] transition-all hover:text-[#F0FAF4]"
                >
                  ↩ Reopen
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const ProgressSummary = ({ milestones, project }) => {
  const total = milestones.length
  const completed = milestones.filter(m => m.status === 'COMPLETED').length
  const missed = milestones.filter(m => m.status === 'PENDING' && daysLeft(m.due_date) < 0).length
  const pending = total - completed - missed
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0

  const projStart = project?.start_date ? new Date(project.start_date) : null
  const projEnd = project?.end_date ? new Date(project.end_date) : null
  const now = new Date()
  const timelinePct = projStart && projEnd
    ? Math.min(100, Math.max(0, Math.round(((now - projStart) / (projEnd - projStart)) * 100)))
    : null

  return (
    <SurfaceCard className="mb-8 p-6">
      <div className="mb-5 grid grid-cols-4 gap-6">
        {[
          { label: 'Total', value: total, colorClass: 'text-[#F0FAF4]' },
          { label: 'Completed', value: completed, colorClass: 'text-[#3EE07F]' },
          { label: 'Pending', value: pending, colorClass: 'text-blue-400' },
          { label: 'Overdue', value: missed, colorClass: missed > 0 ? 'text-[#F87171]' : 'text-[#7BAF8E]' },
        ].map(s => (
          <div key={s.label} className="text-center">
            <div className={`text-[28px] font-bold ${s.colorClass}`}>{s.value}</div>
            <div className="mt-1 text-[10px] uppercase tracking-widest text-[#7BAF8E]">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-[#7BAF8E]">Milestone Completion</span>
          <span className="text-[14px] font-bold text-[#3EE07F]">{pct}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-[rgba(40,98,58,0.2)]">
          <ProgressBarSvg pct={pct} from="#28623A" to="#3EE07F" height={12} />
        </div>
      </div>

      {timelinePct !== null && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-[#7BAF8E]">Project Timeline</span>
            <div className="flex items-center gap-3 text-[10px] text-[#7BAF8E]">
              <span>{fmtDate(project.start_date, { day: 'numeric', month: 'short' })}</span>
              <span className="text-[#3EE07F]">{timelinePct}% elapsed</span>
              <span>{fmtDate(project.end_date, { day: 'numeric', month: 'short' })}</span>
            </div>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[rgba(40,98,58,0.2)]">
            <ProgressBarSvg pct={timelinePct} from="#28623A" to="#60A5FA" markerColor="#3EE07F" height={8} />
          </div>
        </div>
      )}
    </SurfaceCard>
  )
}

export default function MilestonesPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { projectId } = useParams()
  const routePrefix = getRolePrefixFromPath(location.pathname)

  const [milestones, setMilestones] = useState([])
  const [project, setProject] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [createModal, setCreateModal] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [completing, setCompleting] = useState(null)

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000) }
  const isPM = currentUser?.role === 'PROJECT_MANAGER' || currentUser?.role === 'ADMIN'

  useEffect(() => { fetchAll() }, [projectId])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [mRes, meRes] = await Promise.all([
        axios.get(`${API}/api/milestones/project/${projectId}`, { withCredentials: true }),
        axios.get(`${API}/api/profile/me`, { withCredentials: true }),
      ])
      setMilestones(mRes.data.milestones || [])
      setProject(mRes.data.project)
      setCurrentUser(meRes.data.user)
    } catch (err) {
      if (err.response?.status === 401) navigate('/login')
      else setError('Failed to load milestones.')
    } finally { setLoading(false) }
  }

  const handleComplete = async (milestoneId) => {
    setCompleting(milestoneId)
    try {
      const res = await axios.put(`${API}/api/milestones/project/${projectId}/${milestoneId}/complete`, {}, { withCredentials: true })
      setMilestones(prev => prev.map(m => m._id === milestoneId ? res.data.milestone : m))
      showToast('✓ Milestone completed!')
    } catch {
      showToast('⚠ Failed')
    } finally {
      setCompleting(null)
    }
  }

  const handleReopen = async (milestoneId) => {
    try {
      const res = await axios.put(`${API}/api/milestones/project/${projectId}/${milestoneId}/reopen`, {}, { withCredentials: true })
      setMilestones(prev => prev.map(m => m._id === milestoneId ? res.data.milestone : m))
      showToast('✓ Milestone reopened')
    } catch {
      showToast('⚠ Failed')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await axios.delete(`${API}/api/milestones/project/${projectId}/${deleteTarget._id}`, { withCredentials: true })
      setMilestones(prev => prev.filter(m => m._id !== deleteTarget._id))
      setDeleteTarget(null)
      showToast('✓ Milestone deleted')
    } catch {
      showToast('⚠ Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  const handleModalSuccess = (milestone, mode) => {
    if (mode === 'create') {
      setMilestones(prev => [...prev, milestone].sort((a, b) => new Date(a.due_date) - new Date(b.due_date)))
      showToast('✓ Milestone added')
    } else {
      setMilestones(prev => prev.map(m => m._id === milestone._id ? milestone : m))
      showToast('✓ Milestone updated')
    }
  }

  if (loading) return (
    <div className="ss-bg-app min-h-screen flex items-center justify-center">
      <BG />
      <div className="relative z-10 flex flex-col items-center gap-3">
        <div className="ss-spinner h-10 w-10 rounded-full border-2 animate-spin" />
        <span className="text-[13px] text-[#7BAF8E]">Loading milestones...</span>
      </div>
    </div>
  )

  if (error) return (
    <div className="ss-bg-app min-h-screen flex items-center justify-center">
      <BG />
      <div className="relative z-10 rounded-2xl border border-red-400/20 bg-[linear-gradient(160deg,_#162B1E_0%,_#0F2027_60%)] p-8 text-center shadow-[0_0_0_1px_rgba(40,98,58,0.12),0_16px_48px_rgba(15,32,39,0.65)]">
        <p className="mb-4 text-[#F87171]">{error}</p>
        <button onClick={fetchAll} className="rounded-xl bg-[#28623A] px-5 py-2 text-[13px] font-semibold text-[#F0FAF4]">Retry</button>
      </div>
    </div>
  )

  return (
    <div className="ss-bg-app min-h-screen font-sans">
      <BG />
      <div className="relative z-10 mx-auto max-w-[900px] px-6 py-10">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <button onClick={() => navigate(buildProjectPath(routePrefix, projectId))} className="mb-2 block text-[12px] font-medium text-[#7BAF8E] transition-all hover:text-[#F0FAF4]">
              ← Back to Project
            </button>
            <div className="flex items-center gap-3">
              <h1 className="text-[24px] font-bold text-[#F0FAF4]">{project?.name} — Timeline</h1>
            </div>
            <p className="mt-1 text-[13px] text-[#7BAF8E]">
              {milestones.length} milestone{milestones.length !== 1 ? 's' : ''} · {milestones.filter(m => m.status === 'COMPLETED').length} completed
            </p>
          </div>

          <div className="mt-1 flex items-center gap-3">
            {toast && <div className={`rounded-full border px-4 py-2 text-[12px] font-semibold ${toast.startsWith('✓') ? 'border-emerald-400/25 bg-emerald-400/12 text-[#3EE07F]' : 'border-red-400/20 bg-red-400/10 text-[#F87171]'}`}>{toast}</div>}
            <button onClick={() => navigate(buildProjectTasksPath(routePrefix, projectId))} className="rounded-xl border border-[rgba(40,98,58,0.3)] bg-transparent px-4 py-2 text-[12px] font-semibold text-[#7BAF8E] transition-all hover:border-[rgba(40,98,58,0.5)] hover:text-[#F0FAF4]">
              ⬛ Kanban →
            </button>
            {isPM && (
              <button onClick={() => setCreateModal(true)} className="flex items-center gap-2 rounded-xl border border-[#3EE07F]/20 bg-[linear-gradient(135deg,_#28623A,_#1A4D2E)] px-5 py-2.5 text-[13px] font-semibold text-[#F0FAF4] transition-all hover:shadow-[0_8px_24px_rgba(62,224,127,0.18)]">
                + Add Milestone
              </button>
            )}
          </div>
        </div>

        {milestones.length > 0 && <ProgressSummary milestones={milestones} project={project} />}

        {milestones.length === 0 ? (
          <SurfaceCard className="py-24 text-center">
            <div className="mb-4 text-[52px]">◻</div>
            <h3 className="mb-2 text-[18px] font-bold text-[#F0FAF4]">No milestones yet</h3>
            <p className="mx-auto mb-6 max-w-[320px] text-[13px] text-[#7BAF8E]">Add milestones to mark key deliverables on your project timeline</p>
            {isPM && (
              <button onClick={() => setCreateModal(true)} className="rounded-xl border border-[#3EE07F]/20 bg-[linear-gradient(135deg,_#28623A,_#1A4D2E)] px-6 py-3 text-[13px] font-semibold text-[#F0FAF4]">
                + Add First Milestone →
              </button>
            )}
          </SurfaceCard>
        ) : (
          <div className="relative">
            <div className="absolute top-5 bottom-5 left-1/2 w-0.5 -translate-x-1/2 bg-[linear-gradient(to_bottom,rgba(40,98,58,0.4),rgba(40,98,58,0.1))]" />
            {milestones.map((milestone, i) => (
              <TimelineNode
                key={milestone._id}
                milestone={milestone}
                index={i}
                isPM={isPM}
                isFirst={i === 0}
                isLast={i === milestones.length - 1}
                onComplete={handleComplete}
                onReopen={handleReopen}
                onEdit={setEditTarget}
                onDelete={setDeleteTarget}
                completing={completing}
              />
            ))}
          </div>
        )}
      </div>

      {createModal && <MilestoneModal mode="create" projectId={projectId} onClose={() => setCreateModal(false)} onSuccess={handleModalSuccess} />}
      {editTarget && <MilestoneModal mode="edit" initial={editTarget} projectId={projectId} onClose={() => setEditTarget(null)} onSuccess={handleModalSuccess} />}
      {deleteTarget && <DeleteConfirm milestone={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} deleting={deleting} />}
    </div>
  )
}
