import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { buildProjectPath, getRolePrefixFromPath } from '../../utils/roleRoutes'

const API = 'http://localhost:3000'

const cx = (...classes) => classes.filter(Boolean).join(' ')

const STATUS_CFG = {
  TODO: {
    label: 'To Do',
    icon: '\u25CB',
    textClass: 'text-[var(--ss-muted)]',
    softClass: 'bg-[rgba(123,175,142,0.1)]',
    columnClass: 'bg-[rgba(123,175,142,0.06)]',
    activeColumnClass: 'bg-[rgba(123,175,142,0.08)] border-[rgba(123,175,142,0.4)] shadow-[0_0_0_1px_rgba(123,175,142,0.14)]',
    badgeClass: 'border-[rgba(123,175,142,0.3)] bg-[rgba(123,175,142,0.1)] text-[var(--ss-muted)]',
    selectClass: 'border-[rgba(123,175,142,0.3)] bg-[rgba(123,175,142,0.1)] text-[var(--ss-muted)]',
    dropClass: 'border-[rgba(123,175,142,0.5)] text-[rgba(123,175,142,0.8)]',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    icon: '\u25D1',
    textClass: 'text-[var(--ss-info)]',
    softClass: 'bg-[rgba(96,165,250,0.1)]',
    columnClass: 'bg-[rgba(96,165,250,0.04)]',
    activeColumnClass: 'bg-[rgba(96,165,250,0.08)] border-[rgba(96,165,250,0.4)] shadow-[0_0_0_1px_rgba(96,165,250,0.14)]',
    badgeClass: 'border-[rgba(96,165,250,0.3)] bg-[rgba(96,165,250,0.1)] text-[var(--ss-info)]',
    selectClass: 'border-[rgba(96,165,250,0.3)] bg-[rgba(96,165,250,0.1)] text-[var(--ss-info)]',
    dropClass: 'border-[rgba(96,165,250,0.5)] text-[rgba(96,165,250,0.82)]',
  },
  IN_REVIEW: {
    label: 'In Review',
    icon: '\u25D5',
    textClass: 'text-[var(--ss-warning)]',
    softClass: 'bg-[rgba(251,191,36,0.1)]',
    columnClass: 'bg-[rgba(251,191,36,0.04)]',
    activeColumnClass: 'bg-[rgba(251,191,36,0.08)] border-[rgba(251,191,36,0.4)] shadow-[0_0_0_1px_rgba(251,191,36,0.14)]',
    badgeClass: 'border-[rgba(251,191,36,0.3)] bg-[rgba(251,191,36,0.1)] text-[var(--ss-warning)]',
    selectClass: 'border-[rgba(251,191,36,0.3)] bg-[rgba(251,191,36,0.1)] text-[var(--ss-warning)]',
    dropClass: 'border-[rgba(251,191,36,0.5)] text-[rgba(251,191,36,0.82)]',
  },
  DONE: {
    label: 'Done',
    icon: '\u25CF',
    textClass: 'text-[var(--ss-accent)]',
    softClass: 'bg-[rgba(62,224,127,0.1)]',
    columnClass: 'bg-[rgba(62,224,127,0.04)]',
    activeColumnClass: 'bg-[rgba(62,224,127,0.08)] border-[rgba(62,224,127,0.4)] shadow-[0_0_0_1px_rgba(62,224,127,0.14)]',
    badgeClass: 'border-[rgba(62,224,127,0.3)] bg-[rgba(62,224,127,0.1)] text-[var(--ss-accent)]',
    selectClass: 'border-[rgba(62,224,127,0.3)] bg-[rgba(62,224,127,0.1)] text-[var(--ss-accent)]',
    dropClass: 'border-[rgba(62,224,127,0.5)] text-[rgba(62,224,127,0.82)]',
  },
}

const PRIORITY_CFG = {
  LOW: {
    label: 'Low',
    icon: '\u2193',
    textClass: 'text-[var(--ss-muted)]',
    buttonClass: 'border-[rgba(123,175,142,0.3)] bg-[rgba(123,175,142,0.1)] text-[var(--ss-muted)]',
    activeButtonClass: 'border-[rgba(123,175,142,0.45)] bg-[rgba(123,175,142,0.18)] text-[var(--ss-muted)]',
  },
  MEDIUM: {
    label: 'Medium',
    icon: '\u2192',
    textClass: 'text-[var(--ss-info)]',
    buttonClass: 'border-[rgba(96,165,250,0.3)] bg-[rgba(96,165,250,0.1)] text-[var(--ss-info)]',
    activeButtonClass: 'border-[rgba(96,165,250,0.45)] bg-[rgba(96,165,250,0.18)] text-[var(--ss-info)]',
  },
  HIGH: {
    label: 'High',
    icon: '\u2191',
    textClass: 'text-[var(--ss-warning)]',
    buttonClass: 'border-[rgba(251,191,36,0.3)] bg-[rgba(251,191,36,0.1)] text-[var(--ss-warning)]',
    activeButtonClass: 'border-[rgba(251,191,36,0.45)] bg-[rgba(251,191,36,0.18)] text-[var(--ss-warning)]',
  },
  URGENT: {
    label: 'Urgent',
    icon: '\u26A1',
    textClass: 'text-[var(--ss-danger)]',
    buttonClass: 'border-[rgba(248,113,113,0.3)] bg-[rgba(248,113,113,0.1)] text-[var(--ss-danger)]',
    activeButtonClass: 'border-[rgba(248,113,113,0.45)] bg-[rgba(248,113,113,0.18)] text-[var(--ss-danger)]',
  },
}

const BG = () => (
  <>
    <div className="fixed inset-0 pointer-events-none ss-radial-top" />
    <div className="fixed inset-0 pointer-events-none opacity-[0.03] ss-grid-overlay" />
  </>
)

const dueTextClass = (days) => {
  if (days < 0) return 'text-[var(--ss-danger)]'
  if (days <= 2) return 'text-[var(--ss-warning)]'
  return 'ss-text-muted'
}

const dueBadgeClass = (days) => {
  if (days < 0) return 'border-[rgba(248,113,113,0.2)] bg-[rgba(248,113,113,0.1)] text-[var(--ss-danger)]'
  if (days <= 2) return 'border-[rgba(251,191,36,0.2)] bg-[rgba(251,191,36,0.1)] text-[var(--ss-warning)]'
  return 'border-[rgba(123,175,142,0.25)] bg-[rgba(40,98,58,0.1)] text-[var(--ss-muted)]'
}

const inputClass =
  'w-full rounded-xl px-4 py-3 text-[13px] outline-none ss-input-field'

const iconButtonClass =
  'flex items-center gap-2 rounded-xl border px-4 py-2 text-[11px] font-semibold transition-all'

const sectionLabelClass =
  'mb-2 text-[10px] font-bold uppercase tracking-[0.15em] ss-text-muted'

const fadedMutedClass = 'text-[rgba(123,175,142,0.4)]'
const faintMutedClass = 'text-[rgba(123,175,142,0.3)]'

const daysLeft = (due) => (due ? Math.ceil((new Date(due) - new Date()) / 86400000) : null)

const fmtDate = (date, opts = { day: 'numeric', month: 'short' }) =>
  date ? new Date(date).toLocaleDateString('en-IN', opts) : null

const statBadgeClass = (status) => STATUS_CFG[status]?.badgeClass || 'ss-badge'
const progressWidthClass = (percent) => `ss-w-${Math.max(0, Math.min(100, Math.round(Number(percent) || 0)))}`

function Badge({ children, className = '' }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest',
        className
      )}
    >
      {children}
    </span>
  )
}

function Avatar({ name, size = 6 }) {
  const sizeClass = size === 6 ? 'h-6 w-6 min-w-6 min-h-6' : 'h-5 w-5 min-w-5 min-h-5'

  return (
    <div
      className={cx(
        'flex items-center justify-center rounded-lg text-[9px] font-bold shrink-0 ss-avatar',
        sizeClass
      )}
    >
      {(name || '?')[0].toUpperCase()}
    </div>
  )
}

function BarProgress({ value }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[rgba(40,98,58,0.2)]">
      <div className={`ss-progress-fill bg-[var(--ss-accent)] ${progressWidthClass(value)}`} />
    </div>
  )
}

function MiniTaskCard({ task, onClick, draggable, onDragStart, onDragEnd, dimmed }) {
  const priority = PRIORITY_CFG[task.priority]
  const days = daysLeft(task.due_date)

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={cx(
        'cursor-pointer select-none rounded-xl border p-3 transition-all',
        dimmed
          ? 'border-[var(--ss-border)] bg-[rgba(40,98,58,0.04)] opacity-45'
          : 'border-[var(--ss-border)] bg-[rgba(40,98,58,0.1)] hover:border-[rgba(62,224,127,0.3)] hover:bg-[rgba(40,98,58,0.18)]'
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <span className="flex-1 text-[12px] font-semibold leading-snug ss-text-theme">{task.title}</span>
        <span className={cx('shrink-0 text-[13px]', priority.textClass)}>{priority.icon}</span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-1">
        <div className="flex items-center gap-1.5">
          {task.assigned_to && <Avatar name={task.assigned_to.username} size={5} />}
          {task.subtasks?.length > 0 && (
            <span className="text-[9px] ss-text-muted">
              {task.subtasks.filter((subtask) => subtask.completed).length}/{task.subtasks.length}
            </span>
          )}
        </div>

        {days !== null && (
          <span className={cx('text-[9px] font-bold', dueTextClass(days))}>
            {days < 0 ? `${Math.abs(days)}d OD` : days === 0 ? 'Today' : `${days}d`}
          </span>
        )}
      </div>
    </div>
  )
}

function KanbanView({ tasks, onTaskClick, onStatusChange, isPM }) {
  const [draggingId, setDraggingId] = useState(null)
  const [overColumn, setOverColumn] = useState(null)
  const [localTasks, setLocalTasks] = useState(tasks)

  useEffect(() => setLocalTasks(tasks), [tasks])

  const handleDragStart = (event, taskId) => {
    if (!isPM) return
    setDraggingId(taskId)
    event.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (event, column) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    setOverColumn(column)
  }

  const handleDrop = async (event, newStatus) => {
    event.preventDefault()
    setOverColumn(null)
    if (!draggingId) return

    const task = localTasks.find((item) => item._id === draggingId)
    if (!task || task.status === newStatus) {
      setDraggingId(null)
      return
    }

    setLocalTasks((prev) => prev.map((item) => (item._id === draggingId ? { ...item, status: newStatus } : item)))
    setDraggingId(null)

    try {
      await onStatusChange(draggingId, newStatus)
    } catch {
      setLocalTasks(tasks)
    }
  }

  const columns = Object.entries(STATUS_CFG).map(([key, cfg]) => ({
    key,
    ...cfg,
    tasks: localTasks.filter((task) => task.status === key),
  }))

  return (
    <div className="flex min-h-[calc(100vh-280px)] gap-4 overflow-x-auto pb-4">
      {columns.map((column) => (
        <div
          key={column.key}
          className={cx(
            'flex min-w-[260px] max-w-[320px] flex-1 flex-col rounded-2xl border transition-all',
            column.columnClass,
            overColumn === column.key ? column.activeColumnClass : 'border-[var(--ss-border)]'
          )}
          onDragOver={(event) => handleDragOver(event, column.key)}
          onDrop={(event) => handleDrop(event, column.key)}
          onDragLeave={() => setOverColumn(null)}
        >
          <div className="flex items-center justify-between border-b px-4 py-3.5 ss-border-theme">
            <div className="flex items-center gap-2">
              <span className={column.textClass}>{column.icon}</span>
              <span className={cx('text-[12px] font-bold uppercase tracking-widest', column.textClass)}>
                {column.label}
              </span>
            </div>
            <span className={cx('rounded-full px-2 py-0.5 text-[11px] font-bold', column.softClass, column.textClass)}>
              {column.tasks.length}
            </span>
          </div>

          {overColumn === column.key && draggingId && (
            <div className={cx('mx-3 mt-3 rounded-xl border-2 border-dashed py-4 text-center text-[11px] font-semibold', column.dropClass)}>
              Drop here
            </div>
          )}

          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {column.tasks.length === 0 && overColumn !== column.key && (
              <div className="py-8 text-center">
                <p className="text-[11px] text-[rgba(123,175,142,0.3)]">{isPM ? 'Drag tasks here' : 'No tasks'}</p>
              </div>
            )}

            {column.tasks.map((task) => (
              <MiniTaskCard
                key={task._id}
                task={task}
                draggable={isPM}
                dimmed={draggingId === task._id}
                onDragStart={(event) => handleDragStart(event, task._id)}
                onDragEnd={() => {
                  setDraggingId(null)
                  setOverColumn(null)
                }}
                onClick={() => onTaskClick(task)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function ListView({ tasks, onTaskClick, onStatusChange, isPM }) {
  const [sortField, setSortField] = useState('created_at')
  const [sortDir, setSortDir] = useState('desc')
  const [filter, setFilter] = useState('ALL')

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const sortIcon = (field) => {
    if (sortField !== field) return ''
    return sortDir === 'asc' ? ' \u2191' : ' \u2193'
  }

  const filtered = tasks
    .filter((task) => filter === 'ALL' || task.status === filter)
    .sort((a, b) => {
      let first = a[sortField]
      let second = b[sortField]

      if (sortField === 'priority') {
        const order = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
        first = order[a.priority]
        second = order[b.priority]
      }

      if (sortField === 'due_date') {
        first = first ? new Date(first) : Infinity
        second = second ? new Date(second) : Infinity
      }

      if (sortField === 'status') {
        const order = { TODO: 0, IN_PROGRESS: 1, IN_REVIEW: 2, DONE: 3 }
        first = order[a.status]
        second = order[b.status]
      }

      if (first < second) return sortDir === 'asc' ? -1 : 1
      if (first > second) return sortDir === 'asc' ? 1 : -1
      return 0
    })

  const TH = ({ label, field, right = false }) => (
    <th
      className={cx(
        'select-none py-3 px-4 text-[10px] font-bold uppercase tracking-widest transition-all',
        right ? 'text-right' : 'text-left',
        sortField === field ? 'ss-text-accent' : 'ss-text-muted',
        'cursor-pointer'
      )}
      onClick={() => toggleSort(field)}
    >
      {label}
      {sortIcon(field)}
    </th>
  )

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {['ALL', ...Object.keys(STATUS_CFG)].map((key) => {
          const cfg = STATUS_CFG[key]
          const count = key === 'ALL' ? tasks.length : tasks.filter((task) => task.status === key).length

          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cx(
                'rounded-xl border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-all',
                filter === key
                  ? key === 'ALL'
                    ? 'border-[rgba(62,224,127,0.35)] bg-[rgba(40,98,58,0.25)] ss-text-accent'
                    : cfg.badgeClass
                  : 'border-[var(--ss-border)] bg-[rgba(15,32,39,0.5)] ss-text-muted'
              )}
            >
              {key === 'ALL' ? `All (${count})` : `${cfg.icon} ${cfg.label} (${count})`}
            </button>
          )
        })}
      </div>

      <div className="relative overflow-hidden rounded-2xl ss-card ss-card-line">
        <table className="w-full">
          <thead className="border-b border-[var(--ss-border)] bg-[rgba(40,98,58,0.12)]">
            <tr>
              <TH label="Task" field="title" />
              <TH label="Status" field="status" />
              <TH label="Priority" field="priority" />
              <TH label="Assignee" field="assigned_to" />
              <TH label="Due Date" field="due_date" />
              <TH label="Subtasks" field="subtasks" />
              <th className="py-3 px-4 text-right text-[10px] font-bold uppercase tracking-widest ss-text-muted">Time</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center">
                  <p className="text-[13px] ss-text-muted">No tasks match this filter</p>
                </td>
              </tr>
            ) : (
              filtered.map((task, index) => {
                const status = STATUS_CFG[task.status]
                const priority = PRIORITY_CFG[task.priority]
                const days = daysLeft(task.due_date)
                const completedSubs = task.subtasks?.filter((subtask) => subtask.completed).length || 0
                const totalSubs = task.subtasks?.length || 0

                return (
                  <tr
                    key={task._id}
                    className={cx(
                      'cursor-pointer border-b border-[var(--ss-border)] transition-all hover:bg-[rgba(40,98,58,0.1)]',
                      index % 2 === 0 ? 'bg-transparent' : 'bg-[rgba(40,98,58,0.03)]'
                    )}
                    onClick={() => onTaskClick(task)}
                  >
                    <td className="px-4 py-3.5">
                      <div className="text-[13px] font-semibold ss-text-theme">{task.title}</div>
                      {task.description && (
                        <div className="mt-0.5 max-w-[220px] truncate text-[10px] ss-text-muted">{task.description}</div>
                      )}
                    </td>

                    <td className="px-4 py-3.5" onClick={(event) => event.stopPropagation()}>
                      {isPM ? (
                        <select
                          value={task.status}
                          onChange={(event) => onStatusChange(task._id, event.target.value)}
                          className={cx(
                            'cursor-pointer rounded-lg border px-2 py-1 text-[10px] font-bold uppercase outline-none',
                            status.selectClass
                          )}
                        >
                          {Object.entries(STATUS_CFG).map(([key, cfg]) => (
                            <option key={key} value={key}>
                              {cfg.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <Badge className={status.badgeClass}>
                          {status.icon} {status.label}
                        </Badge>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className={cx('text-[12px] font-bold', priority.textClass)}>
                        {priority.icon} {priority.label}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      {task.assigned_to ? (
                        <div className="flex items-center gap-2">
                          <Avatar name={task.assigned_to.username} size={6} />
                          <span className="text-[12px] ss-text-theme">{task.assigned_to.username}</span>
                        </div>
                      ) : (
                        <span className={cx('text-[11px]', fadedMutedClass)}>Unassigned</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      {task.due_date ? (
                        <div>
                          <div className={cx('text-[12px] font-medium', dueTextClass(days))}>
                            {fmtDate(task.due_date, { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                          <div className={cx('text-[10px]', dueTextClass(days))}>
                            {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today' : `${days}d left`}
                          </div>
                        </div>
                      ) : (
                        <span className={cx('text-[11px]', fadedMutedClass)}>No date</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      {totalSubs > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16">
                            <BarProgress value={(completedSubs / totalSubs) * 100} />
                          </div>
                          <span className="text-[10px] ss-text-muted">
                            {completedSubs}/{totalSubs}
                          </span>
                        </div>
                      ) : (
                        <span className={cx('text-[10px]', faintMutedClass)}>-</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <span className={cx('text-[11px]', task.total_time_minutes > 0 ? 'ss-text-muted' : faintMutedClass)}>
                        {task.total_time_minutes > 0
                          ? task.total_time_minutes < 60
                            ? `${task.total_time_minutes}m`
                            : `${Math.floor(task.total_time_minutes / 60)}h${task.total_time_minutes % 60 > 0 ? ` ${task.total_time_minutes % 60}m` : ''}`
                          : '-'}
                      </span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-[11px] ss-text-muted">
        Showing {filtered.length} of {tasks.length} tasks
      </p>
    </div>
  )
}

function CalendarView({ tasks, onTaskClick }) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11)
      setYear((value) => value - 1)
    } else {
      setMonth((value) => value - 1)
    }
  }

  const nextMonth = () => {
    if (month === 11) {
      setMonth(0)
      setYear((value) => value + 1)
    } else {
      setMonth((value) => value + 1)
    }
  }

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const tasksByDay = {}
  for (const task of tasks) {
    if (!task.due_date) continue
    const date = new Date(task.due_date)
    if (date.getFullYear() === year && date.getMonth() === month) {
      const day = date.getDate()
      if (!tasksByDay[day]) tasksByDay[day] = []
      tasksByDay[day].push(task)
    }
  }

  const undatedTasks = tasks.filter((task) => !task.due_date)
  const MONTHS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const cells = []
  for (let index = firstDay - 1; index >= 0; index -= 1) cells.push({ day: daysInPrevMonth - index, type: 'prev' })
  for (let day = 1; day <= daysInMonth; day += 1) cells.push({ day, type: 'curr' })
  const remaining = 42 - cells.length
  for (let day = 1; day <= remaining; day += 1) cells.push({ day, type: 'next' })

  const isToday = (day) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear()

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="flex h-9 w-9 items-center justify-center rounded-xl border bg-[rgba(40,98,58,0.15)] text-[16px] transition-all ss-border-theme ss-text-muted hover:bg-[rgba(40,98,58,0.3)] hover:ss-text-theme"
        >
          {'\u2039'}
        </button>

        <div className="text-center">
          <h2 className="text-[18px] font-bold ss-text-theme">
            {MONTHS[month]} {year}
          </h2>
          <p className="text-[11px] ss-text-muted">
            {Object.values(tasksByDay).flat().length} task{Object.values(tasksByDay).flat().length !== 1 ? 's' : ''} with due dates this month
          </p>
        </div>

        <button
          onClick={nextMonth}
          className="flex h-9 w-9 items-center justify-center rounded-xl border bg-[rgba(40,98,58,0.15)] text-[16px] transition-all ss-border-theme ss-text-muted hover:bg-[rgba(40,98,58,0.3)] hover:ss-text-theme"
        >
          {'\u203A'}
        </button>
      </div>

      <div className="mb-2 grid grid-cols-7">
        {DAYS.map((day) => (
          <div key={day} className="py-2 text-center text-[10px] font-bold uppercase tracking-widest ss-text-muted">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, index) => {
          const dayTasks = cell.type === 'curr' ? tasksByDay[cell.day] || [] : []
          const currentDay = cell.type === 'curr' && isToday(cell.day)
          const allDone = dayTasks.length > 0 && dayTasks.every((task) => task.status === 'DONE')

          return (
            <div
              key={`${cell.type}-${cell.day}-${index}`}
              className={cx(
                'relative min-h-[90px] rounded-xl border p-2 transition-all',
                cell.type !== 'curr'
                  ? 'border-[rgba(40,98,58,0.1)] bg-[rgba(15,32,39,0.3)] opacity-40'
                  : currentDay
                    ? 'border-[rgba(62,224,127,0.3)] bg-[rgba(62,224,127,0.06)]'
                    : 'border-[var(--ss-border)] bg-[rgba(40,98,58,0.06)]'
              )}
            >
              <div className="mb-1.5 flex items-center justify-between">
                <span
                  className={cx(
                    'flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-bold',
                    currentDay
                      ? 'bg-[var(--ss-accent)] text-[var(--ss-bg)]'
                      : cell.type !== 'curr'
                        ? 'text-[rgba(123,175,142,0.4)]'
                        : 'ss-text-theme'
                  )}
                >
                  {cell.day}
                </span>

                {dayTasks.length > 0 && (
                  <span
                    className={cx(
                      'rounded-full px-1.5 py-0.5 text-[9px] font-bold',
                      allDone
                        ? 'bg-[rgba(62,224,127,0.15)] text-[var(--ss-accent)]'
                        : 'bg-[rgba(248,113,113,0.15)] text-[var(--ss-danger)]'
                    )}
                  >
                    {dayTasks.length}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                {dayTasks.slice(0, 3).map((task) => {
                  const status = STATUS_CFG[task.status]
                  const priority = PRIORITY_CFG[task.priority]

                  return (
                    <div
                      key={task._id}
                      className={cx(
                        'truncate rounded-lg border px-1.5 py-0.5 text-[9px] font-semibold transition-all',
                        status.softClass,
                        status.textClass,
                        status.badgeClass
                      )}
                      onClick={() => onTaskClick(task)}
                      title={task.title}
                    >
                      {priority.icon} {task.title}
                    </div>
                  )
                })}

                {dayTasks.length > 3 && (
                  <div className="rounded-lg bg-[rgba(40,98,58,0.2)] py-0.5 text-center text-[9px] font-semibold ss-text-muted">
                    +{dayTasks.length - 3} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {undatedTasks.length > 0 && (
        <div className="mt-6 rounded-2xl p-5 ss-card">
          <h3 className="mb-4 text-[11px] font-bold uppercase tracking-widest ss-text-muted">
            No Due Date ({undatedTasks.length})
          </h3>

          <div className="grid grid-cols-3 gap-2">
            {undatedTasks.map((task) => {
              const status = STATUS_CFG[task.status]
              const priority = PRIORITY_CFG[task.priority]

              return (
                <div
                  key={task._id}
                  className="flex cursor-pointer items-center gap-2 rounded-xl border bg-[rgba(40,98,58,0.08)] p-2.5 transition-all ss-border-theme hover:border-[rgba(62,224,127,0.25)]"
                  onClick={() => onTaskClick(task)}
                >
                  <span className={cx('text-[12px]', priority.textClass)}>{priority.icon}</span>
                  <span className="flex-1 truncate text-[11px] font-medium ss-text-theme">{task.title}</span>
                  <Badge className={status.badgeClass}>{status.icon}</Badge>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function TaskDrawer({ task, isPM, onClose, onUpdate, onDelete }) {
  const [comment, setComment] = useState('')
  const [commenting, setCommenting] = useState(false)
  const [subtaskTitle, setSubtaskTitle] = useState('')
  const [timerRunning, setTimerRunning] = useState(Boolean(task.active_timer?.started_at))
  const [elapsed, setElapsed] = useState(0)
  const [manualMins, setManualMins] = useState('')
  const [uploadingAttachment, setUploadingAttachment] = useState(false)
  const [attachmentError, setAttachmentError] = useState('')
  const intervalRef = useRef(null)

  const [aiSuggestions, setAiSuggestions] = useState(null)
  const [suggesting, setSuggesting] = useState(false)
  const [suggestionError, setSuggestionError] = useState('')

  useEffect(() => {
    setAiSuggestions(null)
    setSuggestionError('')
    setTimerRunning(Boolean(task.active_timer?.started_at))
  }, [task._id, task.active_timer?.started_at])

  useEffect(() => {
    if (timerRunning && task.active_timer?.started_at) {
      const update = () => setElapsed(Math.floor((Date.now() - new Date(task.active_timer.started_at)) / 1000))
      update()
      intervalRef.current = setInterval(update, 1000)
    }

    return () => clearInterval(intervalRef.current)
  }, [timerRunning, task.active_timer?.started_at])

  const formatElapsed = (seconds) =>
    `${String(Math.floor(seconds / 3600)).padStart(2, '0')}:${String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`

  const formatMinutes = (minutes) =>
    minutes < 60 ? `${minutes}m` : `${Math.floor(minutes / 60)}h${minutes % 60 > 0 ? ` ${minutes % 60}m` : ''}`

  const handleStatusChange = async (status) => {
    try {
      const res = await axios.put(`${API}/api/tasks/${task._id}`, { status }, { withCredentials: true })
      onUpdate(res.data.task)
    } catch (err) {
      console.error(err)
    }
  }

  const handleAddComment = async (event) => {
    event.preventDefault()
    if (!comment.trim()) return

    setCommenting(true)
    try {
      const res = await axios.post(
        `${API}/api/tasks/${task._id}/comments`,
        { content: comment },
        { withCredentials: true }
      )
      setComment('')
      onUpdate({ ...task, comments: [...(task.comments || []), res.data.comment] })
    } catch (err) {
      console.error(err)
    } finally {
      setCommenting(false)
    }
  }

  const handleToggleSubtask = async (subId) => {
    try {
      const res = await axios.put(`${API}/api/tasks/${task._id}/subtasks/${subId}`, {}, { withCredentials: true })
      onUpdate({
        ...task,
        subtasks: task.subtasks.map((subtask) => (subtask._id === subId ? res.data.subtask : subtask)),
      })
    } catch (err) {
      console.error(err)
    }
  }

  const handleAddSubtask = async (event) => {
    event.preventDefault()
    if (!subtaskTitle.trim()) return

    try {
      const res = await axios.post(
        `${API}/api/tasks/${task._id}/subtasks`,
        { title: subtaskTitle },
        { withCredentials: true }
      )
      setSubtaskTitle('')
      onUpdate({ ...task, subtasks: [...(task.subtasks || []), res.data.subtask] })
    } catch (err) {
      console.error(err)
    }
  }

  const handleTimer = async (action) => {
    try {
      const res = await axios.post(`${API}/api/tasks/${task._id}/timer/${action}`, {}, { withCredentials: true })

      if (action === 'start') {
        setTimerRunning(true)
        onUpdate({
          ...task,
          active_timer: { ...(task.active_timer || {}), started_at: new Date().toISOString() },
        })
      } else {
        setTimerRunning(false)
        clearInterval(intervalRef.current)
        onUpdate({
          ...task,
          total_time_minutes: res.data.total_time_minutes,
          active_timer: null,
        })
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleManualLog = async (event) => {
    event.preventDefault()
    if (!manualMins) return

    try {
      const res = await axios.post(
        `${API}/api/tasks/${task._id}/timer/manual`,
        { duration_minutes: Number(manualMins) },
        { withCredentials: true }
      )
      setManualMins('')
      onUpdate({ ...task, total_time_minutes: res.data.total_time_minutes })
    } catch (err) {
      console.error(err)
    }
  }

  const handleUploadAttachment = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setUploadingAttachment(true)
    setAttachmentError('')

    try {
      const formData = new FormData()
      formData.append('attachment', file)

      const res = await axios.post(`${API}/api/tasks/${task._id}/attachments`, formData, {
        withCredentials: true,
      })

      onUpdate(res.data.task)
    } catch (err) {
      setAttachmentError(err.response?.data?.message || 'Failed to upload attachment.')
    } finally {
      setUploadingAttachment(false)
    }
  }

  const handleDeleteAttachment = async (attachmentId) => {
    if (!confirm('Delete this attachment?')) return

    setAttachmentError('')
    try {
      const res = await axios.delete(`${API}/api/tasks/${task._id}/attachments/${attachmentId}`, {
        withCredentials: true,
      })
      onUpdate(res.data.task)
    } catch (err) {
      setAttachmentError(err.response?.data?.message || 'Failed to delete attachment.')
    }
  }

  const handleSuggestAssignees = async () => {
    setSuggesting(true)
    setSuggestionError('')
    try {
      const res = await axios.post(
        `${API}/api/ai/tasks/${task._id}/assignee-suggestions`,
        { persist_suggestion: false },
        { withCredentials: true }
      )
      setAiSuggestions(res.data)
    } catch (err) {
      setSuggestionError(err.response?.data?.message || 'Failed to get AI suggestions.')
    } finally {
      setSuggesting(false)
    }
  }

  const handleApplySuggestion = async (userId) => {
    try {
      const res = await axios.put(
        `${API}/api/tasks/${task._id}`,
        { assigned_to: userId },
        { withCredentials: true }
      )
      setAiSuggestions((prev) =>
        prev
          ? {
              ...prev,
              best_suggestion: prev.suggestions?.find((candidate) => candidate._id === userId) || prev.best_suggestion,
            }
          : prev
      )
      onUpdate(res.data.task)
    } catch (err) {
      setSuggestionError(err.response?.data?.message || 'Failed to assign task.')
    }
  }

  const status = STATUS_CFG[task.status]
  const priority = PRIORITY_CFG[task.priority]
  const days = daysLeft(task.due_date)
  const completedSubs = task.subtasks?.filter((subtask) => subtask.completed).length || 0
  const totalSubs = task.subtasks?.length || 0
  const attachments = task.attachments || []

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1" />

      <div
        className="h-full w-full max-w-[540px] overflow-y-auto border-l bg-[linear-gradient(180deg,#162B1E_0%,#0F2027_25%)] shadow-[-24px_0_80px_rgba(15,32,39,0.85)] border-[var(--ss-card-border)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 border-b border-[var(--ss-border)] bg-[rgba(22,43,30,0.97)] px-6 py-4 backdrop-blur-[12px]">
          <div className="mb-2 flex items-start justify-between gap-3">
            <h2 className="flex-1 text-[16px] font-bold leading-tight ss-text-theme">{task.title}</h2>

            <div className="flex shrink-0 gap-1">
              {isPM && (
                <button
                  onClick={() => onDelete(task._id)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--ss-danger)]/60 transition-all hover:bg-[rgba(248,113,113,0.1)] hover:text-[var(--ss-danger)]"
                >
                  {'\u{1F5D1}'}
                </button>
              )}

              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[16px] transition-all ss-text-muted hover:bg-[rgba(40,98,58,0.2)] hover:ss-text-theme"
              >
                {'\u2715'}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <Badge className={status.badgeClass}>
              {status.icon} {status.label}
            </Badge>
            <Badge className={cx(priority.buttonClass, 'uppercase')}>{priority.icon} {task.priority}</Badge>
            {days !== null && (
              <Badge className={dueBadgeClass(days)}>
                {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today' : `${days}d left`}
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div>
            <p className={sectionLabelClass}>Status</p>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(STATUS_CFG).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => handleStatusChange(key)}
                  className={cx(
                    'rounded-xl border py-2 text-[9px] font-bold uppercase tracking-wide transition-all',
                    task.status === key
                      ? cfg.badgeClass
                      : 'border-[var(--ss-border)] bg-[rgba(15,32,39,0.5)] ss-text-muted'
                  )}
                >
                  {cfg.icon} {cfg.label}
                </button>
              ))}
            </div>
          </div>

          {task.description && (
            <div>
              <p className={sectionLabelClass}>Description</p>
              <p className="text-[13px] leading-relaxed text-[rgba(240,250,244,0.75)]">{task.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border bg-[rgba(40,98,58,0.1)] p-3 ss-border-theme">
              <div className="mb-1.5 text-[9px] uppercase tracking-widest ss-text-muted">Assigned To</div>
              {task.assigned_to ? (
                <div className="flex items-center gap-2">
                  <Avatar name={task.assigned_to.username} />
                  <span className="text-[12px] font-semibold ss-text-theme">{task.assigned_to.username}</span>
                </div>
              ) : (
                <span className={cx('text-[11px]', fadedMutedClass)}>Unassigned</span>
              )}
            </div>

            <div className="rounded-xl border bg-[rgba(40,98,58,0.1)] p-3 ss-border-theme">
              <div className="mb-1.5 text-[9px] uppercase tracking-widest ss-text-muted">Due Date</div>
              <span className={cx('text-[12px] font-semibold', days !== null && days < 0 ? 'text-[var(--ss-danger)]' : 'ss-text-theme')}>
                {task.due_date ? fmtDate(task.due_date, { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
              </span>
            </div>
          </div>

          {isPM && (
            <div className="rounded-xl border bg-[rgba(40,98,58,0.08)] p-4 ss-border-theme">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] ss-text-muted">AI Assignee Suggestions</p>
                  <p className="text-[11px] text-[rgba(123,175,142,0.7)]">Uses skill match, capacity, workload, and performance.</p>
                </div>

                <button
                  onClick={handleSuggestAssignees}
                  disabled={suggesting}
                  className="rounded-xl border px-3 py-2 text-[11px] font-semibold ss-btn-accent disabled:opacity-60"
                >
                  {suggesting ? 'Thinking...' : 'Suggest Assignee'}
                </button>
              </div>

              {suggestionError && <div className="mb-3 text-[11px] text-red-400">{suggestionError}</div>}

              {!aiSuggestions?.suggestions?.length ? (
                <p className="text-[11px] text-[rgba(123,175,142,0.5)]">Run AI suggestion to see the best assignee options.</p>
              ) : (
                <div className="space-y-2">
                  {aiSuggestions.suggestions.map((candidate, index) => (
                    <div
                      key={candidate._id}
                      className="rounded-xl border border-[rgba(40,98,58,0.3)] bg-[rgba(15,32,39,0.45)] p-3"
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={candidate.username} />
                          <div>
                            <div className="text-[12px] font-semibold ss-text-theme">
                              {index === 0 ? 'Top match: ' : ''}
                              {candidate.username}
                            </div>
                            <div className="text-[10px] ss-text-muted">
                              Score {candidate.score} • {candidate.current_capacity_percentage}% capacity
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleApplySuggestion(candidate._id)}
                          className="rounded-lg border border-[rgba(96,165,250,0.2)] bg-[rgba(96,165,250,0.1)] px-3 py-1.5 text-[10px] font-semibold text-[var(--ss-info)]"
                        >
                          Assign
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {candidate.reasons.map((reason) => (
                          <span
                            key={reason}
                            className="rounded-full bg-[rgba(62,224,127,0.08)] px-2 py-0.5 text-[9px] font-semibold text-[var(--ss-accent)]"
                          >
                            {reason}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div>
            <p className={sectionLabelClass}>
              Subtasks {totalSubs > 0 && <span className="ss-text-accent">({completedSubs}/{totalSubs})</span>}
            </p>

            {totalSubs > 0 && (
              <>
                <div className="mb-2">
                  <BarProgress value={(completedSubs / totalSubs) * 100} />
                </div>

                {task.subtasks.map((subtask) => (
                  <div
                    key={subtask._id}
                    className="mb-1.5 flex items-center gap-3 rounded-xl border bg-[rgba(40,98,58,0.07)] px-3 py-2 ss-border-theme"
                  >
                    <button
                      onClick={() => handleToggleSubtask(subtask._id)}
                      className={cx(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all',
                        subtask.completed
                          ? 'border-[var(--ss-accent)] bg-[rgba(62,224,127,0.2)]'
                          : 'border-[var(--ss-border)] bg-[rgba(40,98,58,0.2)]'
                      )}
                    >
                      {subtask.completed && <span className="text-[10px] ss-text-accent">{'\u2713'}</span>}
                    </button>

                    <span
                      className={cx(
                        'flex-1 text-[12px]',
                        subtask.completed ? 'line-through ss-text-muted' : 'ss-text-theme'
                      )}
                    >
                      {subtask.title}
                    </span>
                  </div>
                ))}
              </>
            )}

            {isPM && (
              <form onSubmit={handleAddSubtask} className="mt-2 flex gap-2">
                <input
                  value={subtaskTitle}
                  onChange={(event) => setSubtaskTitle(event.target.value)}
                  placeholder="Add subtask..."
                  className="flex-1 rounded-xl px-3 py-2 text-[12px] outline-none ss-input-field"
                />
                <button
                  type="submit"
                  disabled={!subtaskTitle}
                  className="rounded-xl px-3 py-2 text-[11px] font-semibold ss-btn-primary disabled:opacity-40"
                >
                  + Add
                </button>
              </form>
            )}
          </div>

          <div>
            <p className={sectionLabelClass}>Time Tracking</p>

            <div className="mb-2 rounded-xl border bg-[rgba(40,98,58,0.1)] p-4 ss-border-theme">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="mb-0.5 text-[9px] uppercase tracking-widest ss-text-muted">Total Logged</div>
                  <div className="text-[18px] font-bold ss-text-accent">{formatMinutes(task.total_time_minutes || 0)}</div>
                </div>

                {timerRunning && (
                  <div className="text-right">
                    <div className="mb-0.5 text-[9px] uppercase tracking-widest text-[var(--ss-warning)]">Running</div>
                    <div className="font-mono text-[16px] font-bold text-[var(--ss-warning)]">{formatElapsed(elapsed)}</div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {!timerRunning ? (
                  <button
                    onClick={() => handleTimer('start')}
                    className="flex-1 rounded-xl border bg-[rgba(62,224,127,0.12)] py-2 text-[11px] font-semibold text-[var(--ss-accent)] border-[rgba(62,224,127,0.25)]"
                  >
                    {'\u25B6'} Start
                  </button>
                ) : (
                  <button
                    onClick={() => handleTimer('stop')}
                    className="flex-1 rounded-xl border bg-[rgba(248,113,113,0.1)] py-2 text-[11px] font-semibold text-[var(--ss-danger)] border-[rgba(248,113,113,0.2)]"
                  >
                    {'\u23F9'} Stop
                  </button>
                )}
              </div>
            </div>

            <form onSubmit={handleManualLog} className="flex gap-2">
              <input
                type="number"
                value={manualMins}
                onChange={(event) => setManualMins(event.target.value)}
                placeholder="Minutes"
                className="w-24 rounded-xl px-3 py-2 text-[12px] outline-none ss-input-field"
              />
              <button
                type="submit"
                disabled={!manualMins}
                className="rounded-xl border border-[rgba(96,165,250,0.2)] bg-[rgba(96,165,250,0.1)] px-3 py-2 text-[11px] font-semibold text-[var(--ss-info)] disabled:opacity-40"
              >
                Log
              </button>
            </form>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] ss-text-muted">
                Attachments ({attachments.length})
              </p>
              <label className="cursor-pointer rounded-xl border border-[rgba(62,224,127,0.25)] bg-[rgba(62,224,127,0.1)] px-3 py-1.5 text-[10px] font-semibold text-[var(--ss-accent)]">
                {uploadingAttachment ? 'Uploading...' : '+ Upload'}
                <input
                  type="file"
                  className="hidden"
                  disabled={uploadingAttachment}
                  onChange={handleUploadAttachment}
                />
              </label>
            </div>

            {attachmentError && (
              <div className="mb-2 rounded-xl border border-red-400/20 bg-red-400/8 px-3 py-2 text-[11px] text-[#FCA5A5]">
                {attachmentError}
              </div>
            )}

            {attachments.length === 0 ? (
              <p className="text-[11px] text-[rgba(123,175,142,0.5)]">No attachments uploaded yet.</p>
            ) : (
              <div className="space-y-2">
                {attachments.map((attachment) => (
                  <div
                    key={attachment._id}
                    className="flex items-center gap-3 rounded-xl border bg-[rgba(40,98,58,0.07)] px-3 py-2 ss-border-theme"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[rgba(40,98,58,0.3)] bg-[rgba(15,32,39,0.55)] text-[13px]">
                      {'\u{1F4CE}'}
                    </div>
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noreferrer"
                      className="min-w-0 flex-1 truncate text-[12px] font-semibold ss-text-theme hover:text-[var(--ss-accent)]"
                    >
                      {attachment.name}
                    </a>
                    <span className="text-[10px] ss-text-muted">
                      {attachment.size_bytes ? `${Math.ceil(attachment.size_bytes / 1024)} KB` : ''}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteAttachment(attachment._id)}
                      className="rounded-lg px-2 py-1 text-[10px] font-semibold text-[rgba(248,113,113,0.75)] hover:bg-red-400/10 hover:text-[var(--ss-danger)]"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.15em] ss-text-muted">
              Comments ({task.comments?.length || 0})
            </p>

            {(task.comments || []).map((commentItem) => (
              <div key={commentItem._id} className="mb-3 flex gap-3">
                <Avatar name={commentItem.author?.username} />
                <div className="flex-1">
                  <div className="mb-0.5 flex items-center gap-2">
                    <span className="text-[11px] font-semibold ss-text-theme">{commentItem.author?.username}</span>
                    <span className="text-[9px] text-[rgba(123,175,142,0.5)]">
                      {fmtDate(commentItem.created_at, {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <p className="text-[12px] leading-relaxed text-[rgba(240,250,244,0.75)]">
                    {commentItem.content.split(/(@\w+)/g).map((part, index) =>
                      part.startsWith('@') ? (
                        <span key={index} className="font-semibold ss-text-accent">
                          {part}
                        </span>
                      ) : (
                        <span key={index}>{part}</span>
                      )
                    )}
                  </p>
                </div>
              </div>
            ))}

            <form onSubmit={handleAddComment} className="mt-2 flex gap-2">
              <input
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Add a comment... @mention someone"
                className="flex-1 rounded-xl px-3 py-2.5 text-[12px] outline-none ss-input-field"
              />
              <button
                type="submit"
                disabled={commenting || !comment.trim()}
                className="rounded-xl px-4 py-2.5 text-[11px] font-semibold ss-btn-primary disabled:opacity-40"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProjectViews() {
  const location = useLocation()
  const navigate = useNavigate()
  const { projectId } = useParams()
  const routePrefix = getRolePrefixFromPath(location.pathname)

  const [tasks, setTasks] = useState([])
  const [project, setProject] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [view, setView] = useState('kanban')
  const [openTask, setOpenTask] = useState(null)
  const [toast, setToast] = useState('')
  const [search, setSearch] = useState('')
  const [createModal, setCreateModal] = useState(false)
  const [assignmentModeSaving, setAssignmentModeSaving] = useState(false)

  const showToast = (message) => {
    setToast(message)
    setTimeout(() => setToast(''), 3000)
  }

  const isPM = currentUser?.role === 'PROJECT_MANAGER' || currentUser?.role === 'ADMIN'

  useEffect(() => {
    fetchAll()
  }, [projectId])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [tasksRes, meRes, projectRes] = await Promise.all([
        axios.get(`${API}/api/tasks/project/${projectId}`, { withCredentials: true }),
        axios.get(`${API}/api/profile/me`, { withCredentials: true }),
        axios.get(`${API}/api/project/get-project/${projectId}`, { withCredentials: true }),
      ])
      setTasks(tasksRes.data.tasks || [])
      setCurrentUser(meRes.data.user)
      setProject(projectRes.data.project)
    } catch (err) {
      if (err.response?.status === 401) navigate('/login')
      else setError('Failed to load tasks.')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const res = await axios.put(`${API}/api/tasks/${taskId}`, { status: newStatus }, { withCredentials: true })
      setTasks((prev) => prev.map((task) => (task._id === taskId ? res.data.task : task)))
      if (openTask?._id === taskId) setOpenTask(res.data.task)
      showToast(`\u2713 Moved to ${STATUS_CFG[newStatus].label}`)
      return res.data.task
    } catch (err) {
      showToast('\u26A0 Failed to update status')
      throw err
    }
  }

  const handleTaskUpdate = (updated) => {
    setTasks((prev) => prev.map((task) => (task._id === updated._id ? { ...task, ...updated } : task)))
    setOpenTask((prev) => (prev && prev._id === updated._id ? { ...prev, ...updated } : updated))
  }

  const handleDelete = async (taskId) => {
    if (!confirm('Delete this task?')) return
    try {
      await axios.delete(`${API}/api/tasks/${taskId}`, { withCredentials: true })
      setTasks((prev) => prev.filter((task) => task._id !== taskId))
      setOpenTask(null)
      showToast('\u2713 Task deleted')
    } catch {
      showToast('\u26A0 Delete failed')
    }
  }

  const handleAssignmentModeChange = async (mode) => {
    setAssignmentModeSaving(true)
    try {
      const res = await axios.put(
        `${API}/api/project/update-project/${projectId}`,
        { task_assignment_mode: mode },
        { withCredentials: true }
      )
      setProject(res.data)
      showToast(mode === 'AUTO_ASSIGN_TOP_MATCH' ? '\u2713 Auto-assign enabled' : '\u2713 Manual approval enabled')
    } catch {
      showToast('\u26A0 Failed to update assignment mode')
    } finally {
      setAssignmentModeSaving(false)
    }
  }

  const filtered = search ? tasks.filter((task) => task.title.toLowerCase().includes(search.toLowerCase())) : tasks

  const counts = tasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1
    return acc
  }, {})

  if (loading) {
    return (
      <div className="min-h-screen ss-bg-app">
        <BG />
        <div className="relative z-10 flex min-h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 rounded-full border-2 animate-spin ss-spinner" />
            <span className="text-[13px] ss-text-muted">Loading tasks...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen ss-bg-app">
        <BG />
        <div className="relative z-10 flex min-h-screen items-center justify-center">
          <div className="rounded-2xl border border-[rgba(239,68,68,0.2)] p-8 text-center ss-card">
            <p className="mb-4 text-[var(--ss-danger)]">{error}</p>
            <button onClick={fetchAll} className="rounded-xl bg-[var(--ss-mid)] px-5 py-2 text-[13px] font-semibold ss-text-theme">
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen font-sans ss-bg-app">
      <BG />

      <div className={cx('relative z-10 mx-auto px-6 py-8', view === 'kanban' ? 'max-w-[1400px]' : 'max-w-[1100px]')}>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <button
              onClick={() => navigate(buildProjectPath(routePrefix, projectId))}
              className="mb-1.5 block text-[12px] font-medium transition-all ss-text-muted hover:ss-text-theme"
            >
              {'\u2190'} Back to Project
            </button>

            <div className="flex items-center gap-3">
              <h1 className="text-[22px] font-bold ss-text-theme">Tasks</h1>
              <div className="flex items-center gap-1.5">
                {Object.entries(STATUS_CFG).map(([key, cfg]) => (
                  <span key={key} className={cx('rounded-full px-2 py-0.5 text-[10px] font-bold', cfg.softClass, cfg.textClass)}>
                    {cfg.icon} {counts[key] || 0}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {toast && (
              <div
                className={cx(
                  'rounded-full border px-4 py-2 text-[12px] font-semibold',
                  toast.startsWith('\u2713')
                    ? 'border-[rgba(62,224,127,0.25)] bg-[rgba(62,224,127,0.12)] text-[var(--ss-accent)]'
                    : 'border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.1)] text-[var(--ss-danger)]'
                )}
              >
                {toast}
              </div>
            )}

            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[12px] ss-text-muted">
                {'\u{1F50D}'}
              </span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search tasks..."
                className="w-[180px] rounded-xl py-2 pr-4 pl-8 text-[12px] outline-none ss-input-field"
              />
            </div>

            <div className="flex gap-1 rounded-xl border border-[var(--ss-border)] bg-[rgba(15,32,39,0.6)] p-1">
              {[
                { key: 'kanban', label: '\u2B1B Kanban' },
                { key: 'list', label: '\u2630 List' },
                { key: 'calendar', label: '\u{1F4C5} Calendar' },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setView(item.key)}
                  className={cx(
                    'rounded-lg border px-4 py-2 text-[11px] font-semibold transition-all',
                    view === item.key
                      ? 'border-[rgba(62,224,127,0.2)] ss-btn-primary'
                      : 'border-transparent bg-transparent ss-text-muted'
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {isPM && project && (
              <div className="flex gap-1 rounded-xl border border-[var(--ss-border)] bg-[rgba(15,32,39,0.6)] p-1">
                {[
                  { key: 'MANUAL_APPROVAL', label: 'Manual Approval' },
                  { key: 'AUTO_ASSIGN_TOP_MATCH', label: 'Auto Assign Top Match' },
                ].map((mode) => (
                  <button
                    key={mode.key}
                    onClick={() => handleAssignmentModeChange(mode.key)}
                    disabled={assignmentModeSaving}
                    className={cx(
                      'rounded-lg border px-4 py-2 text-[11px] font-semibold transition-all disabled:opacity-70',
                      (project.task_assignment_mode || 'MANUAL_APPROVAL') === mode.key
                        ? 'border-[rgba(62,224,127,0.2)] ss-btn-primary'
                        : 'border-transparent bg-transparent ss-text-muted'
                    )}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            )}

            {isPM && (
              <button
                onClick={() => setCreateModal(true)}
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[12px] font-semibold transition-all ss-btn-primary hover:shadow-[0_6px_20px_rgba(62,224,127,0.18)]"
              >
                + Task
              </button>
            )}
          </div>
        </div>

        {tasks.length === 0 ? (
          <div className="py-24 text-center">
            <div className="mb-4 text-[52px]">{'\u25EB'}</div>
            <h3 className="mb-2 text-[18px] font-bold ss-text-theme">No tasks yet</h3>
            <p className="text-[13px] ss-text-muted">
              {isPM ? 'Create the first task for this project' : 'No tasks have been assigned yet'}
            </p>
          </div>
        ) : (
          <>
            {view === 'kanban' && (
              <KanbanView tasks={filtered} onTaskClick={setOpenTask} onStatusChange={handleStatusChange} isPM={isPM} />
            )}
            {view === 'list' && (
              <ListView tasks={filtered} onTaskClick={setOpenTask} onStatusChange={handleStatusChange} isPM={isPM} />
            )}
            {view === 'calendar' && <CalendarView tasks={filtered} onTaskClick={setOpenTask} />}
          </>
        )}
      </div>

      {openTask && currentUser && (
        <TaskDrawer
          task={openTask}
          currentUser={currentUser}
          isPM={isPM}
          onClose={() => setOpenTask(null)}
          onUpdate={handleTaskUpdate}
          onDelete={handleDelete}
        />
      )}

      {createModal && (
        <CreateTaskModal
          projectId={projectId}
          assignmentMode={project?.task_assignment_mode || 'MANUAL_APPROVAL'}
          onClose={() => setCreateModal(false)}
          onSuccess={(newTask, successMessage) => {
            setTasks((prev) => [newTask, ...prev])
            showToast(successMessage || '\u2713 Task created')
          }}
        />
      )}
    </div>
  )
}

function CreateTaskModal({ projectId, assignmentMode, onClose, onSuccess }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    due_date: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [createdTask, setCreatedTask] = useState(null)
  const [aiSuggestions, setAiSuggestions] = useState(null)
  const [suggesting, setSuggesting] = useState(false)
  const [suggestionError, setSuggestionError] = useState('')
  const [assigningId, setAssigningId] = useState(null)

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const handleClose = () => {
    if (createdTask) onSuccess(createdTask, '\u2713 Task created')
    onClose()
  }

  const fetchAssigneeSuggestions = async (task) => {
    setSuggesting(true)
    setSuggestionError('')
    try {
      const res = await axios.post(
        `${API}/api/ai/tasks/${task._id}/assignee-suggestions`,
        { persist_suggestion: false },
        { withCredentials: true }
      )
      setAiSuggestions(res.data)
    } catch (err) {
      setSuggestionError(err.response?.data?.message || 'Failed to get AI suggestions.')
    } finally {
      setSuggesting(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.title.trim()) return

    setSaving(true)
    setError('')

    const payload = {
      title: form.title,
      project_id: projectId,
      priority: form.priority,
    }
    if (form.description) payload.description = form.description
    if (form.due_date) payload.due_date = form.due_date

    try {
      const res = await axios.post(`${API}/api/tasks`, payload, { withCredentials: true })

      if (assignmentMode === 'AUTO_ASSIGN_TOP_MATCH') {
        onSuccess(
          res.data.task,
          res.data.auto_assigned ? '\u2713 Task created and auto-assigned' : '\u2713 Task created'
        )
        onClose()
        return
      }

      setCreatedTask(res.data.task)
      await fetchAssigneeSuggestions(res.data.task)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create task')
    } finally {
      setSaving(false)
    }
  }

  const handleAssignSuggestion = async (candidate) => {
    if (!createdTask) return

    setAssigningId(candidate._id)
    setSuggestionError('')

    try {
      const res = await axios.put(
        `${API}/api/tasks/${createdTask._id}`,
        { assigned_to: candidate._id },
        { withCredentials: true }
      )
      onSuccess(res.data.task, '\u2713 Task created and assigned')
      onClose()
    } catch (err) {
      setSuggestionError(err.response?.data?.message || 'Failed to assign suggested user.')
    } finally {
      setAssigningId(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-[8px] ss-modal-backdrop">
      <div className="relative w-full max-w-[620px] rounded-2xl p-7 ss-modal-card ss-card-line-strong">
        {!createdTask ? (
          <>
            <h3 className="mb-1 text-[18px] font-bold ss-text-theme">Create Task</h3>
            <p className="mb-6 text-[12px] ss-text-muted">
              Add a new task to this project. Assignment mode:{' '}
              {assignmentMode === 'AUTO_ASSIGN_TOP_MATCH' ? 'Auto Assign Top Match' : 'Manual Approval'}
            </p>

            {error && <div className="mb-4 rounded-xl px-3 py-2.5 text-[12px] ss-error-box">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.15em] ss-text-muted">
                  Title <span className="ss-text-accent">*</span>
                </label>
                <input
                  value={form.title}
                  onChange={(event) => set('title', event.target.value)}
                  placeholder="e.g. Fix login bug"
                  autoFocus
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.15em] ss-text-muted">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(event) => set('description', event.target.value)}
                  placeholder="What needs to be done?"
                  rows={3}
                  className={cx(inputClass, 'resize-none')}
                />
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] ss-text-muted">
                  Priority
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(PRIORITY_CFG).map(([key, cfg]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => set('priority', key)}
                      className={cx(
                        'rounded-xl border py-2 text-[10px] font-bold uppercase tracking-wide transition-all',
                        form.priority === key
                          ? cfg.activeButtonClass
                          : 'border-[var(--ss-border)] bg-[rgba(15,32,39,0.6)] ss-text-muted'
                      )}
                    >
                      {cfg.icon} {key}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.15em] ss-text-muted">
                  Due Date
                </label>
                <input
                  type="date"
                  value={form.due_date}
                  onChange={(event) => set('due_date', event.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={onClose} className="rounded-xl px-5 py-2.5 text-[12px] font-medium ss-btn-ghost">
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving || !form.title.trim()}
                  className="flex-1 rounded-xl py-2.5 text-[13px] font-semibold transition-all ss-btn-primary disabled:opacity-50 hover:shadow-[0_8px_24px_rgba(62,224,127,0.18)]"
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 rounded-full border-2 border-[rgba(240,250,244,0.3)] border-t-[var(--ss-text)] animate-spin" />
                      Creating...
                    </span>
                  ) : (
                    'Create Task \u2192'
                  )}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <h3 className="mb-1 text-[18px] font-bold ss-text-theme">Review AI Assignee Suggestion</h3>
            <p className="mb-5 text-[12px] ss-text-muted">The task was created. Approve a suggested assignee or keep it unassigned.</p>

            <div className="mb-4 rounded-xl border bg-[rgba(40,98,58,0.08)] p-3 ss-border-theme">
              <div className="text-[12px] font-semibold ss-text-theme">{createdTask.title}</div>
              <div className="text-[10px] ss-text-muted">
                Priority {form.priority}
                {form.due_date ? ` • Due ${form.due_date}` : ''}
              </div>
            </div>

            {suggesting && (
              <div className="py-8 text-center">
                <div className="mx-auto mb-3 h-8 w-8 rounded-full border-2 animate-spin ss-spinner" />
                <p className="text-[12px] ss-text-muted">Generating assignee suggestions...</p>
              </div>
            )}

            {suggestionError && <div className="mb-4 rounded-xl px-3 py-2.5 text-[12px] ss-error-box">{suggestionError}</div>}

            {!suggesting && !aiSuggestions?.suggestions?.length && (
              <div className="mb-4 rounded-xl border bg-[rgba(40,98,58,0.08)] p-4 text-[12px] ss-border-theme ss-text-muted">
                No assignee suggestions found. Add team members to this project first, then try again.
              </div>
            )}

            {!suggesting && Boolean(aiSuggestions?.suggestions?.length) && (
              <div className="mb-4 space-y-3">
                {aiSuggestions.suggestions.map((candidate, index) => (
                  <div
                    key={candidate._id}
                    className="rounded-xl border border-[var(--ss-border)] bg-[rgba(15,32,39,0.45)] p-4"
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={candidate.username} />
                        <div>
                          <div className="text-[12px] font-semibold ss-text-theme">
                            {index === 0 ? 'Top match: ' : ''}
                            {candidate.username}
                          </div>
                          <div className="text-[10px] ss-text-muted">
                            Score {candidate.score} • {candidate.current_capacity_percentage}% capacity
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAssignSuggestion(candidate)}
                        disabled={Boolean(assigningId)}
                        className="rounded-lg border border-[rgba(96,165,250,0.2)] bg-[rgba(96,165,250,0.1)] px-3 py-1.5 text-[10px] font-semibold text-[var(--ss-info)] disabled:opacity-60"
                      >
                        {assigningId === candidate._id ? 'Assigning...' : 'Assign'}
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {(candidate.reasons || []).map((reason) => (
                        <span
                          key={reason}
                          className="rounded-full bg-[rgba(62,224,127,0.08)] px-2 py-0.5 text-[9px] font-semibold text-[var(--ss-accent)]"
                        >
                          {reason}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={handleClose} className="rounded-xl px-5 py-2.5 text-[12px] font-medium ss-btn-ghost">
                Keep Unassigned
              </button>

              {aiSuggestions?.best_suggestion && (
                <button
                  type="button"
                  onClick={() => handleAssignSuggestion(aiSuggestions.best_suggestion)}
                  disabled={Boolean(assigningId)}
                  className="flex-1 rounded-xl py-2.5 text-[13px] font-semibold transition-all ss-btn-primary disabled:opacity-50"
                >
                  {assigningId === aiSuggestions.best_suggestion._id ? 'Assigning...' : 'Assign Top Match ->'}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ProjectViews
