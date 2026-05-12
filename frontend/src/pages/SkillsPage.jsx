import { useState, useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { buildProjectPath, getProjectListPath, getRolePrefixFromPath } from '../utils/roleRoutes'

const API = 'http://localhost:3000'

const CATEGORIES = ['Frontend', 'Backend', 'Mobile', 'DevOps', 'Data & AI', 'Design', 'Management', 'Soft Skills', 'QA & Testing', 'Other']

const PROFICIENCY_CFG = {
  BEGINNER: { text: 'text-[#7BAF8E]', bg: 'bg-[rgba(123,175,142,0.12)]', border: 'border-[rgba(123,175,142,0.25)]', fill: 'fill-[#7BAF8E]', pct: 25 },
  INTERMEDIATE: { text: 'text-[#60A5FA]', bg: 'bg-[rgba(96,165,250,0.12)]', border: 'border-[rgba(96,165,250,0.25)]', fill: 'fill-[#60A5FA]', pct: 50 },
  ADVANCED: { text: 'text-[#FBBF24]', bg: 'bg-[rgba(251,191,36,0.12)]', border: 'border-[rgba(251,191,36,0.25)]', fill: 'fill-[#FBBF24]', pct: 75 },
  EXPERT: { text: 'text-[#3EE07F]', bg: 'bg-[rgba(62,224,127,0.12)]', border: 'border-[rgba(62,224,127,0.25)]', fill: 'fill-[#3EE07F]', pct: 100 },
}

const CAT_STYLES = {
  Frontend:      { text: 'text-[#60A5FA]', bg: 'bg-[rgba(96,165,250,0.15)]', dot: 'bg-[#60A5FA]', line: 'bg-[rgba(96,165,250,0.12)]', border: 'border-[rgba(96,165,250,0.25)]' },
  Backend:       { text: 'text-[#A78BFA]', bg: 'bg-[rgba(167,139,250,0.15)]', dot: 'bg-[#A78BFA]', line: 'bg-[rgba(167,139,250,0.12)]', border: 'border-[rgba(167,139,250,0.25)]' },
  Mobile:        { text: 'text-[#34D399]', bg: 'bg-[rgba(52,211,153,0.15)]', dot: 'bg-[#34D399]', line: 'bg-[rgba(52,211,153,0.12)]', border: 'border-[rgba(52,211,153,0.25)]' },
  DevOps:        { text: 'text-[#FBBF24]', bg: 'bg-[rgba(251,191,36,0.15)]', dot: 'bg-[#FBBF24]', line: 'bg-[rgba(251,191,36,0.12)]', border: 'border-[rgba(251,191,36,0.25)]' },
  'Data & AI':   { text: 'text-[#F87171]', bg: 'bg-[rgba(248,113,113,0.15)]', dot: 'bg-[#F87171]', line: 'bg-[rgba(248,113,113,0.12)]', border: 'border-[rgba(248,113,113,0.25)]' },
  Design:        { text: 'text-[#F472B6]', bg: 'bg-[rgba(244,114,182,0.15)]', dot: 'bg-[#F472B6]', line: 'bg-[rgba(244,114,182,0.12)]', border: 'border-[rgba(244,114,182,0.25)]' },
  Management:    { text: 'text-[#3EE07F]', bg: 'bg-[rgba(62,224,127,0.15)]', dot: 'bg-[#3EE07F]', line: 'bg-[rgba(62,224,127,0.12)]', border: 'border-[rgba(62,224,127,0.25)]' },
  'Soft Skills': { text: 'text-[#94A3B8]', bg: 'bg-[rgba(148,163,184,0.15)]', dot: 'bg-[#94A3B8]', line: 'bg-[rgba(148,163,184,0.12)]', border: 'border-[rgba(148,163,184,0.25)]' },
  'QA & Testing':{ text: 'text-[#FB923C]', bg: 'bg-[rgba(251,146,60,0.15)]', dot: 'bg-[#FB923C]', line: 'bg-[rgba(251,146,60,0.12)]', border: 'border-[rgba(251,146,60,0.25)]' },
  Other:         { text: 'text-[#7BAF8E]', bg: 'bg-[rgba(123,175,142,0.15)]', dot: 'bg-[#7BAF8E]', line: 'bg-[rgba(123,175,142,0.12)]', border: 'border-[rgba(123,175,142,0.25)]' },
}

const BG = () => (
  <>
    <div className="ss-radial-top fixed inset-0 pointer-events-none" />
    <div className="ss-grid-overlay fixed inset-0 pointer-events-none opacity-[0.03]" />
  </>
)

const Card = ({ children, className = '' }) => (
  <div className={`ss-card relative rounded-2xl p-6 ${className}`}>
    <div className="absolute left-8 right-8 top-0 h-px rounded-full bg-gradient-to-r from-transparent via-[rgba(62,224,127,0.2)] to-transparent" />
    {children}
  </div>
)

const Badge = ({ children, className = '' }) => (
  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${className}`}>
    {children}
  </span>
)

const Field = ({ label, value, onChange, type = 'text', placeholder, required }) => {
  return (
    <div>
      {label && (
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.15em] text-[#7BAF8E]">
          {label}{required && <span className="text-[#3EE07F]"> *</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="ss-input-field w-full rounded-xl px-4 py-2.5 text-[13px]"
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

const AddSkillModal = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({ name: '', category: 'Other', description: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    setError('')

    try {
      const res = await axios.post(`${API}/api/skills`, form, { withCredentials: true })
      onSuccess(res.data.skill)
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create skill')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,26,18,0.88)] px-4 backdrop-blur-[8px]">
      <div className="ss-card-heavy ss-card-line-strong relative w-full max-w-[440px] rounded-2xl p-7">
        <h3 className="mb-1 text-[17px] font-bold text-[#F0FAF4]">Add to Taxonomy</h3>
        <p className="mb-5 text-[12px] text-[#7BAF8E]">Add a new skill to the global skill list</p>

        {error && (
          <div className="ss-error-box mb-4 rounded-xl px-3 py-2.5 text-[12px]">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field
            label="Skill Name"
            value={form.name}
            required
            placeholder="e.g. React, Python, Scrum"
            onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
          />

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.15em] text-[#7BAF8E]">
              Category
            </label>
            <select
              value={form.category}
              onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
              className="ss-input-field w-full rounded-xl px-4 py-2.5 text-[13px]"
            >
              {CATEGORIES.map(category => <option key={category} value={category}>{category}</option>)}
            </select>
          </div>

          <Field
            label="Description (optional)"
            value={form.description}
            placeholder="Brief description of this skill"
            onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
          />

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="ss-btn-ghost rounded-xl px-5 py-2.5 text-[12px] font-medium">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !form.name}
              className="ss-btn-primary flex-1 rounded-xl py-2.5 text-[12px] font-semibold disabled:opacity-50"
            >
              {saving ? 'Adding...' : 'Add Skill →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const SkillGapPanel = ({ projectId }) => {
  const [gap, setGap] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get(`${API}/api/skills/gap/${projectId}`, { withCredentials: true })
      .then(r => setGap(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [projectId])

  if (loading) {
    return (
      <div className="py-8 text-center">
        <div className="ss-spinner mx-auto h-6 w-6 animate-spin rounded-full border-2" />
      </div>
    )
  }

  if (!gap) return <p className="text-[13px] text-[#7BAF8E]">Could not load gap analysis.</p>

  const coverageFill = gap.coverage_pct >= 80 ? 'fill-[#3EE07F]' : gap.coverage_pct >= 50 ? 'fill-[#FBBF24]' : 'fill-[#F87171]'

  return (
    <div>
      <div className="mb-6 grid grid-cols-3 gap-4">
        {[
          { label: 'Coverage', value: `${gap.coverage_pct}%`, color: gap.coverage_pct >= 80 ? 'text-[#3EE07F]' : gap.coverage_pct >= 50 ? 'text-[#FBBF24]' : 'text-[#F87171]' },
          { label: 'Skills Covered', value: `${gap.total_required - gap.gaps}/${gap.total_required}`, color: 'text-[#3EE07F]' },
          { label: 'Gaps Found', value: gap.gaps, color: gap.gaps === 0 ? 'text-[#7BAF8E]' : 'text-[#F87171]' },
        ].map(item => (
          <div key={item.label} className="rounded-xl border border-[rgba(40,98,58,0.3)] bg-[rgba(40,98,58,0.08)] p-4 text-center">
            <div className={`text-[24px] font-bold ${item.color}`}>{item.value}</div>
            <div className="mt-1 text-[10px] uppercase tracking-widest text-[#7BAF8E]">{item.label}</div>
          </div>
        ))}
      </div>

      <div className="mb-6">
        <div className="h-3 overflow-hidden rounded-full bg-[rgba(40,98,58,0.2)]">
          <ProgressBar percent={gap.coverage_pct} fillClass={coverageFill} />
        </div>
      </div>

      <div className="space-y-3">
        {gap.report.map(item => {
          const cfg = PROFICIENCY_CFG[item.required_proficiency]
          return (
            <div
              key={item.skill_id}
              className={[
                'rounded-xl p-4',
                item.gap
                  ? 'border border-[rgba(248,113,113,0.2)] bg-[rgba(248,113,113,0.06)]'
                  : 'border border-[rgba(62,224,127,0.15)] bg-[rgba(62,224,127,0.05)]',
              ].join(' ')}
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className={`text-[14px] ${item.gap ? 'text-[#F87171]' : 'text-[#3EE07F]'}`}>{item.gap ? '✕' : '✓'}</span>
                  <span className="text-[13px] font-semibold text-[#F0FAF4]">{item.skill_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#7BAF8E]">Need:</span>
                  <Badge className={`${cfg.text} ${cfg.bg} ${cfg.border}`}>{item.required_proficiency}</Badge>
                </div>
              </div>

              {item.team_coverage.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {item.team_coverage.map((member, index) => {
                    const memberCfg = PROFICIENCY_CFG[member.proficiency_level]
                    return (
                      <div
                        key={index}
                        className={[
                          'flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px]',
                          member.meets_requirement
                            ? 'border border-[rgba(62,224,127,0.2)] bg-[rgba(62,224,127,0.1)]'
                            : 'border border-[rgba(248,113,113,0.2)] bg-[rgba(248,113,113,0.1)]',
                        ].join(' ')}
                      >
                        <span className={member.meets_requirement ? 'text-[#3EE07F]' : 'text-[#F87171]'}>{member.meets_requirement ? '✓' : '✕'}</span>
                        <span className="text-[#F0FAF4]">{member.username}</span>
                        <Badge className={`${memberCfg.text} ${memberCfg.bg} ${memberCfg.border}`}>{member.proficiency_level}</Badge>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="mt-1 text-[11px] text-[rgba(248,113,113,0.7)]">No team member has this skill</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function SkillsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const routePrefix = getRolePrefixFromPath(location.pathname)
  const { projectId } = useParams()

  const [skills, setSkills] = useState([])
  const [grouped, setGrouped] = useState({})
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('ALL')
  const [activeTab, setActiveTab] = useState(projectId ? 'gap' : 'taxonomy')
  const [addModal, setAddModal] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [selSkill, setSelSkill] = useState(null)
  const [selProf, setSelProf] = useState('INTERMEDIATE')
  const [addingReq, setAddingReq] = useState(false)

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const isAdmin = currentUser?.role === 'ADMIN'
  const isPM = currentUser?.role === 'PROJECT_MANAGER' || isAdmin

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [skillsRes, meRes] = await Promise.all([
        axios.get(`${API}/api/skills`, { withCredentials: true }),
        axios.get(`${API}/api/profile/me`, { withCredentials: true }),
      ])
      setSkills(skillsRes.data.skills || [])
      setGrouped(skillsRes.data.grouped || {})
      setCurrentUser(meRes.data.user)
    } catch (err) {
      if (err.response?.status === 401) navigate('/login')
      else setError('Failed to load skills.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (skillId, skillName) => {
    if (!confirm(`Delete "${skillName}" from the global taxonomy? This will remove it from all profiles and projects.`)) return
    setDeleting(skillId)
    try {
      await axios.delete(`${API}/api/skills/${skillId}`, { withCredentials: true })
      setSkills(prev => prev.filter(skill => skill._id !== skillId))
      showToast(`✓ "${skillName}" deleted from taxonomy`)
    } catch {
      showToast('⚠ Failed to delete')
    } finally {
      setDeleting(null)
    }
  }

  const handleAddRequiredSkill = async () => {
    if (!selSkill || !projectId) return
    setAddingReq(true)
    try {
      await axios.post(
        `${API}/api/skills/project/${projectId}/add`,
        { skill_id: selSkill._id, required_proficiency: selProf },
        { withCredentials: true }
      )
      setSelSkill(null)
      showToast(`✓ "${selSkill.name}" added as required skill`)
    } catch (err) {
      showToast(`⚠ ${err.response?.data?.message || 'Failed'}`)
    } finally {
      setAddingReq(false)
    }
  }

  const filtered = skills.filter(skill => {
    const matchCategory = catFilter === 'ALL' || skill.category === catFilter
    const matchSearch = !search || skill.name.toLowerCase().includes(search.toLowerCase())
    return matchCategory && matchSearch
  })

  const tabs = projectId ? ['gap', 'taxonomy', 'add required'] : ['taxonomy']

  if (loading) {
    return (
      <div className="ss-bg-app min-h-screen flex items-center justify-center">
        <BG />
        <div className="relative z-10 flex flex-col items-center gap-3">
          <div className="ss-spinner h-10 w-10 animate-spin rounded-full border-2" />
          <span className="text-[13px] text-[#7BAF8E]">Loading skills...</span>
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
          <button onClick={fetchAll} className="ss-btn-primary rounded-xl px-5 py-2 text-[13px] font-semibold">
            Retry
          </button>
        </div>
      </div>
    )
  }

  const mostUsed = [...skills].sort((a, b) => b.usage_count - a.usage_count)[0]?.name || '—'

  return (
    <div className="ss-bg-app min-h-screen font-sans">
      <BG />
      <div className="relative z-10 mx-auto max-w-[1050px] px-6 py-10">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <button
              onClick={() => navigate(projectId ? buildProjectPath(routePrefix, projectId) : getProjectListPath(routePrefix))}
              className="mb-2 block text-[12px] font-medium text-[#7BAF8E] transition-colors hover:text-[#F0FAF4]"
            >
              ← {projectId ? 'Back to Project' : 'Back'}
            </button>
            <h1 className="text-[24px] font-bold text-[#F0FAF4]">{projectId ? 'Project Skills' : 'Skill Taxonomy'}</h1>
            <p className="mt-1 text-[13px] text-[#7BAF8E]">
              {skills.length} skills across {Object.keys(grouped).length} categories
            </p>
          </div>

          <div className="mt-1 flex items-center gap-3">
            {toast && (
              <div
                className={[
                  'rounded-full px-4 py-2 text-[12px] font-semibold border',
                  toast.startsWith('✓')
                    ? 'border-[rgba(62,224,127,0.25)] bg-[rgba(62,224,127,0.12)] text-[#3EE07F]'
                    : 'border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.1)] text-[#F87171]',
                ].join(' ')}
              >
                {toast}
              </div>
            )}

            {isAdmin && (
              <button
                onClick={() => setAddModal(true)}
                className="ss-btn-primary rounded-xl px-5 py-2.5 text-[13px] font-semibold transition-all hover:shadow-[0_8px_24px_rgba(62,224,127,0.18)]"
              >
                + Add Skill
              </button>
            )}
          </div>
        </div>

        <div className="mb-7 grid grid-cols-4 gap-4">
          {[
            { label: 'Total Skills', value: skills.length, color: 'text-[#F0FAF4]' },
            { label: 'Verified', value: skills.filter(skill => skill.verified).length, color: 'text-[#3EE07F]' },
            { label: 'Categories', value: Object.keys(grouped).length, color: 'text-[#60A5FA]' },
            { label: 'Most Used', value: mostUsed, color: 'text-[#FBBF24]', small: true },
          ].map(item => (
            <Card key={item.label} className="px-5 py-4">
              <div className={`mb-1 font-bold ${item.small ? 'text-[14px]' : 'text-[24px]'} ${item.color}`}>{item.value}</div>
              <div className="text-[10px] uppercase tracking-widest text-[#7BAF8E]">{item.label}</div>
            </Card>
          ))}
        </div>

        {tabs.length > 1 && (
          <div className="mb-6 flex gap-1 rounded-xl border border-[rgba(40,98,58,0.3)] bg-[rgba(15,32,39,0.6)] p-1">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={[
                  'flex-1 rounded-lg py-2 text-[12px] font-semibold capitalize transition-all',
                  activeTab === tab
                    ? 'border border-[rgba(62,224,127,0.2)] bg-gradient-to-br from-[#28623A] to-[#1A4D2E] text-[#F0FAF4]'
                    : 'border border-transparent bg-transparent text-[#7BAF8E]',
                ].join(' ')}
              >
                {tab}
              </button>
            ))}
          </div>
        )}

        {activeTab === 'gap' && projectId && (
          <Card>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-[15px] font-bold text-[#F0FAF4]">Skill Gap Analysis</h2>
              <span className="text-[11px] text-[#7BAF8E]">Team skills vs project requirements</span>
            </div>
            <SkillGapPanel projectId={projectId} />
          </Card>
        )}

        {activeTab === 'add required' && projectId && isPM && (
          <Card>
            <h2 className="mb-5 text-[15px] font-bold text-[#F0FAF4]">Add Required Skill to Project</h2>

            <div className="relative mb-4">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] text-[#7BAF8E]">🔍</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search skills..."
                className="ss-input-field w-full rounded-xl py-2.5 pl-9 pr-4 text-[13px]"
              />
            </div>

            <div className="mb-5 max-h-64 space-y-1.5 overflow-y-auto pr-1">
              {filtered.map(skill => {
                const categoryStyle = CAT_STYLES[skill.category] || CAT_STYLES.Other
                const selected = selSkill?._id === skill._id

                return (
                  <div
                    key={skill._id}
                    className={[
                      'flex cursor-pointer items-center gap-3 rounded-xl p-3 transition-all',
                      selected
                        ? 'border border-[rgba(62,224,127,0.35)] bg-[rgba(62,224,127,0.12)]'
                        : 'border border-[rgba(40,98,58,0.3)] bg-[rgba(40,98,58,0.07)]',
                    ].join(' ')}
                    onClick={() => setSelSkill(selected ? null : skill)}
                  >
                    <div className={[
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border',
                      selected
                        ? 'border-[#3EE07F] bg-[rgba(62,224,127,0.25)]'
                        : 'border-[rgba(40,98,58,0.3)] bg-[rgba(40,98,58,0.2)]',
                    ].join(' ')}>
                      {selected && <span className="text-[10px] text-[#3EE07F]">✓</span>}
                    </div>

                    <div className="min-w-0 flex-1">
                      <span className="text-[13px] font-semibold text-[#F0FAF4]">{skill.name}</span>
                    </div>

                    <Badge className={`${categoryStyle.text} ${categoryStyle.bg} ${categoryStyle.border}`}>{skill.category}</Badge>
                    {skill.verified && <Badge className="border-[rgba(62,224,127,0.2)] bg-[rgba(62,224,127,0.1)] text-[#3EE07F]">✓</Badge>}
                  </div>
                )
              })}
            </div>

            {selSkill && (
              <div className="mb-4 rounded-xl border border-[rgba(62,224,127,0.2)] bg-[rgba(62,224,127,0.06)] p-4">
                <div className="mb-3 flex items-center gap-3">
                  <span className="text-[13px] font-semibold text-[#3EE07F]">{selSkill.name}</span>
                  <span className="text-[11px] text-[#7BAF8E]">— minimum proficiency required:</span>
                </div>

                <div className="mb-4 grid grid-cols-4 gap-2">
                  {Object.entries(PROFICIENCY_CFG).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => setSelProf(key)}
                      className={[
                        'rounded-xl py-2 text-[10px] font-bold uppercase tracking-wide transition-all border',
                        selProf === key
                          ? `${cfg.bg} ${cfg.text} ${cfg.border}`
                          : 'border-[rgba(40,98,58,0.3)] bg-[rgba(15,32,39,0.6)] text-[#7BAF8E]',
                      ].join(' ')}
                    >
                      {key}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleAddRequiredSkill}
                  disabled={addingReq}
                  className="ss-btn-primary w-full rounded-xl py-2.5 text-[12px] font-semibold disabled:opacity-50"
                >
                  {addingReq ? 'Adding...' : `Add "${selSkill.name}" (${selProf}) →`}
                </button>
              </div>
            )}
          </Card>
        )}

        {activeTab === 'taxonomy' && (
          <div>
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <div className="relative min-w-[200px] flex-1">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] text-[#7BAF8E]">🔍</span>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search skills..."
                  className="ss-input-field w-full rounded-xl py-2.5 pl-9 pr-4 text-[13px]"
                />
              </div>

              <div className="flex flex-wrap gap-1.5">
                {['ALL', ...CATEGORIES].map(category => {
                  const cfg = CAT_STYLES[category] || CAT_STYLES.Management
                  const active = catFilter === category
                  return (
                    <button
                      key={category}
                      onClick={() => setCatFilter(category)}
                      className={[
                        'rounded-xl px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-all border',
                        active
                          ? `${cfg.bg} ${cfg.text} ${cfg.border}`
                          : 'border-[rgba(40,98,58,0.3)] bg-[rgba(15,32,39,0.5)] text-[#7BAF8E]',
                      ].join(' ')}
                    >
                      {category === 'ALL' ? `All (${skills.length})` : category}
                    </button>
                  )
                })}
              </div>
            </div>

            {Object.entries(
              filtered.reduce((acc, skill) => {
                if (!acc[skill.category]) acc[skill.category] = []
                acc[skill.category].push(skill)
                return acc
              }, {})
            ).map(([category, categorySkills]) => {
              const categoryStyle = CAT_STYLES[category] || CAT_STYLES.Other

              return (
                <div key={category} className="mb-6">
                  <div className="mb-3 flex items-center gap-3">
                    <div className={`h-2 w-2 shrink-0 rounded-full ${categoryStyle.dot}`} />
                    <h3 className={`text-[12px] font-bold uppercase tracking-widest ${categoryStyle.text}`}>{category}</h3>
                    <div className={`h-px flex-1 ${categoryStyle.line}`} />
                    <span className="text-[11px] text-[#7BAF8E]">{categorySkills.length}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {categorySkills.map(skill => (
                      <div
                        key={skill._id}
                        className="group flex items-center gap-3 rounded-xl border border-[rgba(40,98,58,0.3)] bg-[rgba(40,98,58,0.07)] p-3.5 transition-all hover:border-[rgba(62,224,127,0.2)]"
                      >
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[13px] font-bold ${categoryStyle.bg} ${categoryStyle.text}`}>
                          {skill.name[0]}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="mb-0.5 flex items-center gap-2">
                            <span className="truncate text-[13px] font-semibold text-[#F0FAF4]">{skill.name}</span>
                            {skill.verified && (
                              <span className="shrink-0 rounded-full bg-[rgba(62,224,127,0.1)] px-1.5 py-0.5 text-[9px] font-bold text-[#3EE07F]">✓</span>
                            )}
                          </div>
                          <div className="text-[10px] text-[#7BAF8E]">
                            {skill.usage_count} user{skill.usage_count !== 1 ? 's' : ''}
                            {skill.description && ` · ${skill.description.slice(0, 30)}${skill.description.length > 30 ? '...' : ''}`}
                          </div>
                        </div>

                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(skill._id, skill.name)}
                            disabled={deleting === skill._id}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-[12px] text-[rgba(248,113,113,0.5)] opacity-0 transition-all hover:bg-[rgba(248,113,113,0.1)] hover:text-[#F87171] group-hover:opacity-100"
                          >
                            {deleting === skill._id ? '...' : '✕'}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}

            {filtered.length === 0 && (
              <div className="py-16 text-center">
                <div className="mb-3 text-[40px]">◈</div>
                <p className="text-[14px] font-medium text-[#F0FAF4]">No skills found</p>
                <p className="mt-1 text-[12px] text-[#7BAF8E]">
                  {search ? 'Try a different search term' : isAdmin ? 'Add the first skill to the taxonomy' : 'No skills in the taxonomy yet'}
                </p>
                {isAdmin && !search && (
                  <button
                    onClick={() => setAddModal(true)}
                    className="ss-btn-primary mt-4 rounded-xl px-5 py-2.5 text-[12px] font-semibold"
                  >
                    + Add First Skill →
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {addModal && (
        <AddSkillModal
          onClose={() => setAddModal(false)}
          onSuccess={(newSkill) => {
            setSkills(prev => [...prev, newSkill].sort((a, b) => a.name.localeCompare(b.name)))
            showToast(`✓ "${newSkill.name}" added to taxonomy`)
          }}
        />
      )}
    </div>
  )
}
