import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import {
  buildProfilePath,
  buildProjectPath,
  buildProjectTasksPath,
  getRolePrefixFromPath,
  getRolePrefixFromRole,
} from '../utils/roleRoutes'

const API = 'http://localhost:3000'

const TYPE_OPTIONS = [
  { key: 'all', label: 'All' },
  { key: 'projects', label: 'Projects' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'users', label: 'People' },
]

const STATUS_OPTIONS = [
  { key: '', label: 'Any Status' },
  { key: 'PLANNING', label: 'Planning' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'ON_HOLD', label: 'On Hold' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'TODO', label: 'To Do' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'IN_REVIEW', label: 'In Review' },
  { key: 'DONE', label: 'Done' },
]

const PAGE = {
  bg: '#0F2027',
  card: 'linear-gradient(160deg, #162B1E 0%, #0F2027 60%)',
  cardB: 'rgba(62,224,127,0.13)',
  border: 'rgba(40,98,58,0.3)',
  text: '#F0FAF4',
  muted: '#7BAF8E',
  accent: '#3EE07F',
  input: 'rgba(15,32,39,0.85)',
}

const BG = () => (
  <>
    <div className="ss-radial-top fixed inset-0 pointer-events-none" />
    <div className="ss-grid-overlay fixed inset-0 pointer-events-none opacity-[0.03]" />
  </>
)

const fmtDate = (date) => new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

const initials = (name = '?') => name.slice(0, 2).toUpperCase()

function SearchSection({ title, count, children }) {
  return (
    <div className="ss-card rounded-2xl overflow-hidden">
      <div className="ss-border-theme flex items-center justify-between border-b px-5 py-4">
        <h2 className="text-[13px] font-bold uppercase tracking-[0.16em] text-[#F0FAF4]">{title}</h2>
        <span className="rounded-full bg-[#3EE07F]/10 px-2 py-0.5 text-[10px] font-bold text-[#3EE07F]">
          {count}
        </span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

export default function SearchPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [params, setParams] = useSearchParams()
  const [data, setData] = useState({ counts: { projects: 0, tasks: 0, users: 0, total: 0 }, results: { projects: [], tasks: [], users: [] } })
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const query = params.get('q') || ''
  const type = params.get('type') || 'all'
  const status = params.get('status') || ''

  const routePrefix = currentUser ? getRolePrefixFromRole(currentUser.role) : getRolePrefixFromPath(location.pathname)

  useEffect(() => {
    axios.get(`${API}/api/profile/me`, { withCredentials: true })
      .then(res => setCurrentUser(res.data.user))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!query.trim()) {
      setData({ counts: { projects: 0, tasks: 0, users: 0, total: 0 }, results: { projects: [], tasks: [], users: [] } })
      setError('')
      return
    }

    const fetchResults = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await axios.get(`${API}/api/search/global`, {
          params: { q: query, type, status },
          withCredentials: true,
        })
        setData(res.data)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to search right now.')
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [query, type, status])

  const updateParam = (key, value) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next)
  }

  return (
    <div className="ss-bg-app min-h-screen font-sans">
      <BG />

      <div className="relative z-10 max-w-[1180px] mx-auto px-6 py-8">
        <div className="mb-6">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7BAF8E]">
            Search & Filtering
          </p>
          <h1 className="mb-2 text-[26px] font-bold text-[#F0FAF4]">
            Results for {query ? `"${query}"` : 'your workspace'}
          </h1>
          <p className="text-[13px] text-[#7BAF8E]">
            Search across projects, tasks, and people you can access.
          </p>
        </div>

        <div className="ss-card mb-6 rounded-2xl p-4">
          <div className="flex flex-wrap gap-2 mb-4">
            {TYPE_OPTIONS.map(option => (
              <button
                key={option.key}
                onClick={() => updateParam('type', option.key === 'all' ? '' : option.key)}
                className={`rounded-xl border px-4 py-2 text-[11px] font-semibold transition-all ${
                  (type || 'all') === option.key
                    ? 'border-[#3EE07F]/25 bg-[#3EE07F]/12 text-[#3EE07F]'
                    : 'border-[rgba(40,98,58,0.3)] bg-[rgba(15,32,39,0.55)] text-[#7BAF8E]'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-[#7BAF8E]">
                Status Filter
              </label>
              <select
                value={status}
                onChange={e => updateParam('status', e.target.value)}
                disabled={(type || 'all') === 'users'}
                className={`min-w-[180px] rounded-xl border border-[rgba(40,98,58,0.3)] bg-[rgba(15,32,39,0.85)] px-3 py-2 text-[12px] text-[#F0FAF4] outline-none ${
                  (type || 'all') === 'users' ? 'opacity-50' : 'opacity-100'
                }`}
              >
                {STATUS_OPTIONS.map(option => (
                  <option key={option.key || 'all-status'} value={option.key}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className="ml-auto flex items-center gap-2 text-[11px] text-[#7BAF8E]">
              <span>Total matches</span>
              <span className="rounded-full bg-[#3EE07F]/10 px-2 py-0.5 font-bold text-[#3EE07F]">
                {data.counts.total}
              </span>
            </div>
          </div>
        </div>

        {!query.trim() && (
          <div className="text-center py-24">
            <div className="text-[48px] mb-3">⌕</div>
            <h2 className="mb-2 text-[18px] font-bold text-[#F0FAF4]">Start with a keyword</h2>
            <p className="text-[13px] text-[#7BAF8E]">
              Try a project name, task title, teammate, or skill.
            </p>
          </div>
        )}

        {query.trim() && loading && (
          <div className="flex flex-col items-center gap-3 py-24">
            <div className="ss-spinner h-10 w-10 animate-spin rounded-full border-2" />
            <span className="text-[13px] text-[#7BAF8E]">Searching workspace...</span>
          </div>
        )}

        {query.trim() && !loading && error && (
          <div className="ss-card rounded-2xl border border-[rgba(239,68,68,0.2)] py-16 text-center">
            <p className="text-[13px] text-[#FCA5A5]">{error}</p>
          </div>
        )}

        {query.trim() && !loading && !error && (
          <div className="space-y-5">
            {((type || 'all') === 'all' || type === 'projects') && (
              <SearchSection title="Projects" count={data.counts.projects}>
                {!data.results.projects.length ? (
                  <p className="text-[12px] text-[#7BAF8E]">No matching projects.</p>
                ) : (
                  <div className="grid md:grid-cols-2 gap-3">
                    {data.results.projects.map(project => (
                      <button
                        key={project._id}
                        onClick={() => navigate(buildProjectPath(routePrefix, project._id))}
                        className="rounded-xl border border-[rgba(40,98,58,0.3)] bg-[rgba(40,98,58,0.08)] p-4 text-left transition-all"
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <div className="mb-1 text-[14px] font-semibold text-[#F0FAF4]">{project.name}</div>
                            <div className="text-[11px] text-[#7BAF8E]">
                              {project.project_manager?.username ? `PM: ${project.project_manager.username}` : 'Project workspace'}
                            </div>
                          </div>
                          <span className="rounded-full bg-[#3EE07F]/10 px-2 py-0.5 text-[10px] font-bold text-[#3EE07F]">
                            {project.status}
                          </span>
                        </div>

                        {project.description && (
                          <p className="mb-3 line-clamp-2 text-[12px] leading-relaxed text-[rgba(240,250,244,0.76)]">
                            {project.description}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-1.5">
                          {(project.required_skills || []).slice(0, 4).map(skill => (
                            <span
                              key={skill._id || `${project._id}-${skill.skill_name}`}
                              className="rounded-full bg-[#3EE07F]/8 px-2 py-0.5 text-[10px] font-semibold text-[#3EE07F]"
                            >
                              {skill.skill_name}
                            </span>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </SearchSection>
            )}

            {((type || 'all') === 'all' || type === 'tasks') && (
              <SearchSection title="Tasks" count={data.counts.tasks}>
                {!data.results.tasks.length ? (
                  <p className="text-[12px] text-[#7BAF8E]">No matching tasks.</p>
                ) : (
                  <div className="space-y-3">
                    {data.results.tasks.map(task => (
                      <div key={task._id} className="rounded-xl border border-[rgba(40,98,58,0.3)] bg-[rgba(40,98,58,0.08)] p-4">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <div className="mb-1 text-[14px] font-semibold text-[#F0FAF4]">{task.title}</div>
                            <div className="text-[11px] text-[#7BAF8E]">
                              {task.project_id?.name || 'Task'}{task.assigned_to?.username ? ` • Assigned to ${task.assigned_to.username}` : ' • Unassigned'}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <span className="rounded-full bg-[#60A5FA]/10 px-2 py-0.5 text-[10px] font-bold text-[#60A5FA]">
                              {task.priority}
                            </span>
                            <span className="rounded-full bg-[#3EE07F]/10 px-2 py-0.5 text-[10px] font-bold text-[#3EE07F]">
                              {task.status}
                            </span>
                          </div>
                        </div>

                        {task.description && (
                          <p className="mb-3 line-clamp-2 text-[12px] leading-relaxed text-[rgba(240,250,244,0.76)]">
                            {task.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="text-[11px] text-[#7BAF8E]">
                            {task.due_date ? `Due ${fmtDate(task.due_date)}` : 'No due date'}
                          </span>
                          {task.project_id?._id && (
                            <button
                              onClick={() => navigate(buildProjectTasksPath(routePrefix, task.project_id._id))}
                              className="rounded-lg border border-[#3EE07F]/20 bg-[#3EE07F]/12 px-3 py-1.5 text-[11px] font-semibold text-[#3EE07F]"
                            >
                              Open Task Board
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SearchSection>
            )}

            {((type || 'all') === 'all' || type === 'users') && (
              <SearchSection title="People" count={data.counts.users}>
                {!data.results.users.length ? (
                  <p className="text-[12px] text-[#7BAF8E]">No matching people.</p>
                ) : (
                  <div className="grid md:grid-cols-2 gap-3">
                    {data.results.users.map(user => {
                      const profilePath = buildProfilePath(routePrefix, user._id, currentUser?._id)
                      return (
                        <div key={user._id} className="rounded-xl border border-[rgba(40,98,58,0.3)] bg-[rgba(40,98,58,0.08)] p-4">
                          <div className="flex items-start gap-3 mb-3">
                            <div
                              className="ss-avatar flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl text-[12px] font-bold"
                            >
                              {user.profile_picture_url
                                ? <img src={user.profile_picture_url} alt={user.username} className="w-full h-full object-cover" />
                                : initials(user.username)}
                            </div>
                            <div className="flex-1">
                              <div className="text-[14px] font-semibold text-[#F0FAF4]">{user.username}</div>
                              <div className="text-[11px] text-[#7BAF8E]">{user.email}</div>
                              <div className="mt-1 text-[10px] text-[#3EE07F]">
                                {user.role.replace('_', ' ')} • {user.current_capacity_percentage || 0}% capacity
                              </div>
                            </div>
                          </div>

                          {user.bio && (
                            <p className="mb-3 line-clamp-2 text-[12px] leading-relaxed text-[rgba(240,250,244,0.76)]">
                              {user.bio}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {(user.skills || []).slice(0, 4).map(skill => (
                              <span
                                key={skill._id || `${user._id}-${skill.skill_name}`}
                                className="rounded-full bg-[#3EE07F]/8 px-2 py-0.5 text-[10px] font-semibold text-[#3EE07F]"
                              >
                                {skill.skill_name}
                              </span>
                            ))}
                          </div>

                          <div className="flex gap-2 flex-wrap items-center">
                            {profilePath && (
                              <button
                                onClick={() => navigate(profilePath)}
                                className="rounded-lg border border-[#3EE07F]/20 bg-[#3EE07F]/12 px-3 py-1.5 text-[11px] font-semibold text-[#3EE07F]"
                              >
                                Open Profile
                              </button>
                            )}
                            {currentUser && String(user._id) !== String(currentUser._id) && (
                              <button
                                onClick={() => navigate(`/messages?user=${user._id}`)}
                                className="rounded-lg border border-[#60A5FA]/20 bg-[#60A5FA]/10 px-3 py-1.5 text-[11px] font-semibold text-[#60A5FA]"
                              >
                                Message
                              </button>
                            )}
                            {!profilePath && (
                              <span className="text-[11px] text-[#7BAF8E]">
                                Profile view not available for this role
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </SearchSection>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
