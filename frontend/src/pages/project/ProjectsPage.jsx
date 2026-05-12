import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'

const API = 'http://localhost:3000'

const T = {
  bg: '#0F2027',
  card: 'linear-gradient(160deg, #162B1E 0%, #0F2027 60%)',
  cardB: 'rgba(62,224,127,0.13)',
  border: 'rgba(40,98,58,0.3)',
  borderHi: 'rgba(62,224,127,0.4)',
  accent: '#3EE07F',
  mid: '#28623A',
  dark: '#1A4D2E',
  text: '#F0FAF4',
  muted: '#7BAF8E',
  input: 'rgba(15,32,39,0.85)',
}

const STATUS_CFG = {
  PLANNING: { label: 'Planning', icon: '◷', colorClass: 'text-blue-400', bgClass: 'bg-blue-400/12', borderClass: 'border-blue-400/25' },
  ACTIVE: { label: 'Active', icon: '▶', colorClass: 'text-emerald-400', bgClass: 'bg-emerald-400/12', borderClass: 'border-emerald-400/25' },
  COMPLETED: { label: 'Completed', icon: '✓', colorClass: 'text-yellow-400', bgClass: 'bg-yellow-400/12', borderClass: 'border-yellow-400/25' },
  ON_HOLD: { label: 'On Hold', icon: '⏸', colorClass: 'text-red-400', bgClass: 'bg-red-400/12', borderClass: 'border-red-400/25' },
}

const BG = () => (
  <>
    <div className="ss-radial-upper fixed inset-0 pointer-events-none" />
    <div className="ss-grid-overlay fixed inset-0 pointer-events-none opacity-[0.035]" />
  </>
)

const Card = ({ children, className = '', onClick }) => (
  <div
    onClick={onClick}
    className={`ss-card ss-card-line relative rounded-2xl p-6 ${onClick ? 'cursor-pointer' : ''} ${className}`}
  >
    {children}
  </div>
)

const Badge = ({ children, className = '' }) => (
  <span
    className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${className}`}
  >
    {children}
  </span>
)

const Field = ({ label, value, onChange, type = 'text', placeholder, rows, required, name }) => {
  const [focus, setFocus] = useState(false)
  const Tag = rows ? 'textarea' : 'input'

  return (
    <div>
      {label && (
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.15em] text-[#7BAF8E]">
          {label}
          {required && <span className="text-[#3EE07F]"> *</span>}
        </label>
      )}
      <Tag
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        required={required}
        className={`w-full rounded-[12px] bg-[rgba(15,32,39,0.85)] px-[14px] py-[10px] text-[13px] text-[#F0FAF4] outline-none transition-colors ${rows ? 'resize-none' : ''} ${focus ? 'border border-[rgba(62,224,127,0.4)]' : 'border border-[rgba(40,98,58,0.3)]'}`}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
      />
    </div>
  )
}

const Btn = ({ children, onClick, variant = 'primary', disabled, small, type = 'button' }) => {
  const styles = {
    primary: 'border border-[#3EE07F]/20 bg-[linear-gradient(135deg,_#28623A,_#1A4D2E)] text-[#F0FAF4]',
    ghost: 'border border-[rgba(40,98,58,0.3)] bg-transparent text-[#7BAF8E]',
    danger: 'border border-[rgba(248,113,113,0.2)] bg-[rgba(248,113,113,0.08)] text-[#F87171]',
    accent: 'border border-[#3EE07F]/25 bg-[#3EE07F]/10 text-[#3EE07F]',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl font-semibold transition-all ${small ? 'px-3 py-1.5 text-[11px]' : 'px-5 py-2.5 text-[12px]'} ${styles[variant]} ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer opacity-100'}`}
    >
      {children}
    </button>
  )
}

const EmptyState = ({ onCreateClick }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[rgba(40,98,58,0.3)] bg-[rgba(40,98,58,0.15)] text-[28px]">
      ◫
    </div>
    <h3 className="mb-2 text-[18px] font-bold text-[#F0FAF4]">No projects yet</h3>
    <p className="mb-6 max-w-75 text-[13px] text-[#7BAF8E]">
      Create your first project to start assembling teams with AI
    </p>
    <Btn onClick={onCreateClick}>+ Create First Project</Btn>
  </div>
)

const buildMilestoneDueDate = (index, total, startDate, endDate) => {
  const start = startDate ? new Date(startDate) : new Date()
  const end = endDate ? new Date(endDate) : new Date(start.getTime() + total * 7 * 24 * 60 * 60 * 1000)
  const ratio = (index + 1) / (total + 1)
  return new Date(start.getTime() + (end.getTime() - start.getTime()) * ratio).toISOString()
}

const CONFIDENCE_CFG = {
  HIGH: { badgeClass: 'border-emerald-400/25 bg-emerald-400/12 text-emerald-400' },
  MEDIUM: { badgeClass: 'border-yellow-400/25 bg-yellow-400/12 text-yellow-400' },
  LOW: { badgeClass: 'border-red-400/25 bg-red-400/12 text-red-400' },
}

const BriefParserModal = ({
  open,
  onClose,
  briefText,
  setBriefText,
  briefFile,
  setBriefFile,
  onParse,
  parsing,
  parserError,
  parserNotes,
  parserPreview,
  parsedSkills,
  parsedMilestones,
  onApply,
}) => {
  if (!open) return null

  const reviewSkills = parserPreview?.parsed_project?.required_skills || parsedSkills
  const reviewMilestones = parserPreview?.parsed_project?.milestones || parsedMilestones

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-[rgba(10,26,18,0.9)] px-4 py-8 backdrop-blur-[10px]">
      <div className="relative mx-auto w-full max-w-[720px] rounded-2xl border border-[#3EE07F]/13 bg-[linear-gradient(160deg,_#162B1E,_#0F2027)] p-7 shadow-[0_32px_80px_rgba(15,32,39,0.95)]">
        <div className="absolute top-0 left-10 right-10 h-px rounded-full bg-[linear-gradient(90deg,transparent,rgba(62,224,127,0.35),transparent)]" />

        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <h3 className="text-[18px] font-bold text-[#F0FAF4]">AI Project Brief Parser</h3>
            <p className="mt-1 text-[12px] text-[#7BAF8E]">
              Paste a brief and let AI prefill the project details
            </p>
          </div>
          <Btn variant="ghost" small onClick={onClose}>Close</Btn>
        </div>

        <div className="space-y-4">
          <div>
            <div className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.15em] text-[#7BAF8E]">
              Upload Brief
            </div>
            <label
              className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-[rgba(40,98,58,0.3)] bg-[rgba(15,32,39,0.85)] px-4 py-3 text-[#F0FAF4]"
            >
              <div className="min-w-0">
                <div className="text-[12px] font-semibold truncate">
                  {briefFile ? briefFile.name : 'Choose a PDF, DOCX, TXT, or MD file'}
                </div>
                <div className="mt-1 text-[10px] text-[#7BAF8E]">
                  Upload a project brief document or paste text below
                </div>
              </div>
              <span className="text-[11px] font-semibold text-[#3EE07F]">
                Browse
              </span>
              <input
                type="file"
                accept=".pdf,.docx,.txt,.md"
                className="hidden"
                onChange={e => setBriefFile(e.target.files?.[0] || null)}
              />
            </label>
            {briefFile && (
              <button
                type="button"
                onClick={() => setBriefFile(null)}
                className="mt-1.5 text-[10px] font-semibold text-[#F87171]"
              >
                Remove file
              </button>
            )}
          </div>
          <Field
            label="Project Brief"
            rows={8}
            value={briefText}
            placeholder="Paste the client brief, scope, timeline, required skills, and budget here..."
            onChange={e => setBriefText(e.target.value)}
          />

          {parserError && (
            <div className="rounded-xl border border-red-400/20 bg-red-400/8 px-3 py-2.5 text-[12px] text-[#FCA5A5]">
              {parserError}
            </div>
          )}

          <div className="flex items-center gap-3">
            <Btn variant="accent" onClick={onParse} disabled={parsing || (!briefText.trim() && !briefFile)}>
              {parsing ? 'Parsing...' : '⚡ Parse Brief'}
            </Btn>
            {!!parserNotes.length && (
              <span className="text-[11px] text-[#7BAF8E]">
                {parserNotes[0]}
              </span>
            )}
          </div>

          {!!parserPreview?.confidence && (
            <div className="space-y-4 rounded-2xl border border-[rgba(40,98,58,0.3)] bg-[rgba(40,98,58,0.08)] p-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#7BAF8E]">
                    Extraction Review
                  </div>
                  <div className="mt-1 text-[12px] text-[#F0FAF4]">
                    Review the extracted fields and their confidence before applying them.
                  </div>
                </div>
                <Badge className={CONFIDENCE_CFG[parserPreview.confidence.overall_level]?.badgeClass || 'border-[rgba(40,98,58,0.3)] bg-[rgba(40,98,58,0.2)] text-[#7BAF8E]'}>
                  {parserPreview.confidence.overall_level} {parserPreview.confidence.overall_score}%
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {Object.entries(parserPreview.confidence.field_confidence || {}).map(([field, item]) => (
                  <div
                    key={field}
                    className="rounded-xl border border-[rgba(40,98,58,0.3)] bg-[rgba(15,32,39,0.45)] p-3"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7BAF8E]">
                        {field.replaceAll('_', ' ')}
                      </span>
                      <Badge className={CONFIDENCE_CFG[item.level]?.badgeClass || 'border-[rgba(40,98,58,0.3)] bg-[rgba(40,98,58,0.2)] text-[#7BAF8E]'}>
                        {item.level} {item.score}%
                      </Badge>
                    </div>
                    <div className="text-[11px] text-[#F0FAF4]">{item.note}</div>
                  </div>
                ))}
              </div>

              {!!parserPreview.extraction_notes?.length && (
                <div className="space-y-1">
                  {parserPreview.extraction_notes.map(note => (
                    <div key={note} className="text-[11px] text-[#7BAF8E]"> - {note}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end">
                <Btn onClick={onApply}>Apply to Form</Btn>
              </div>
            </div>
          )}

          {!!reviewSkills.length && (
            <div>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#7BAF8E]">
                Detected Skills
              </div>
              <div className="flex flex-wrap gap-1.5">
                {reviewSkills.map(skill => (
                  <span
                    key={skill.skill_id || skill.skill_name}
                    className="rounded-full bg-yellow-400/10 px-2 py-0.5 text-[9px] font-semibold text-yellow-400"
                  >
                    {skill.skill_name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {!!reviewMilestones.length && (
            <div className="text-[11px] text-[#7BAF8E]">
              {reviewMilestones.length} milestone{reviewMilestones.length !== 1 ? 's' : ''} prepared from this brief
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const ProjectModal = ({ mode = 'create', initial = {}, onClose, onSuccess }) => {
  const EMPTY = {
    name: '',
    description: '',
    status: 'PLANNING',
    start_date: '',
    end_date: '',
    budget: '',
  }

  const [form, setForm] = useState(
    mode === 'edit'
      ? {
          name: initial.name || '',
          description: initial.description || '',
          status: initial.status || 'PLANNING',
          start_date: initial.start_date ? initial.start_date.slice(0, 10) : '',
          end_date: initial.end_date ? initial.end_date.slice(0, 10) : '',
          budget: initial.budget || '',
        }
      : EMPTY
  )

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [parserOpen, setParserOpen] = useState(false)
  const [briefText, setBriefText] = useState('')
  const [briefFile, setBriefFile] = useState(null)
  const [parsing, setParsing] = useState(false)
  const [parserError, setParserError] = useState('')
  const [parserNotes, setParserNotes] = useState([])
  const [parserPreview, setParserPreview] = useState(null)
  const [parsedSkills, setParsedSkills] = useState([])
  const [parsedMilestones, setParsedMilestones] = useState([])

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const handleParseBrief = async () => {
    if (!briefText.trim() && !briefFile) return

    setParsing(true)
    setError('')
    setParserError('')
    setParserPreview(null)

    try {
      const formData = new FormData()
      formData.append('project_name', form.name)
      if (briefText.trim()) formData.append('brief_text', briefText)
      if (briefFile) formData.append('brief_file', briefFile)

      const res = await axios.post(`${API}/api/ai/project-brief/parse`, formData, {
        withCredentials: true,
      })

      const nextNotes =
        res.data.uploaded_file_name
          ? [`Parsed from ${res.data.uploaded_file_name}.`, ...(res.data.extraction_notes || [])]
          : (res.data.extraction_notes || [])

      setParserPreview({
        ...res.data,
        extraction_notes: nextNotes,
      })
      setParserNotes(nextNotes)
    } catch (err) {
      setParserError(err.response?.data?.message || 'Failed to parse project brief.')
    } finally {
      setParsing(false)
    }
  }

  const applyParsedBrief = () => {
    if (!parserPreview?.parsed_project) return

    const parsed = parserPreview.parsed_project

    setForm(prev => ({
      ...prev,
      name: parsed.name || prev.name,
      description: parsed.description || prev.description,
      budget: parsed.budget || prev.budget,
    }))

    setParsedSkills(parsed.required_skills || [])
    setParsedMilestones(parsed.milestones || [])
    setParserNotes(parserPreview.extraction_notes || [])
    setParserOpen(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    const payload = { name: form.name }
    if (form.description) payload.description = form.description
    if (form.status) payload.status = form.status
    if (form.start_date) payload.start_date = new Date(form.start_date).toISOString()
    if (form.end_date) payload.end_date = new Date(form.end_date).toISOString()
    if (form.budget) payload.budget = Number(form.budget)

    try {
      if (mode === 'create') {
        const res = await axios.post(`${API}/api/project/create-project`, payload, { withCredentials: true })
        const createdProject = res.data.project

        if (parsedSkills.length) {
          await Promise.allSettled(
            parsedSkills.map(skill =>
              axios.post(
                `${API}/api/skills/project/${createdProject._id}/add`,
                {
                  skill_id: skill.skill_id,
                  required_proficiency: skill.required_proficiency || 'INTERMEDIATE',
                },
                { withCredentials: true }
              )
            )
          )
        }

        if (parsedMilestones.length) {
          await Promise.allSettled(
            parsedMilestones.map((milestone, index) =>
              axios.post(
                `${API}/api/milestones/project/${createdProject._id}`,
                {
                  title: milestone.title,
                  description: milestone.description,
                  due_date: buildMilestoneDueDate(index, parsedMilestones.length, form.start_date, form.end_date),
                },
                { withCredentials: true }
              )
            )
          )
        }

        onSuccess(res.data.project, 'create')
      } else {
        const res = await axios.put(`${API}/api/project/update-project/${initial._id}`, payload, { withCredentials: true })
        onSuccess(res.data, 'edit')
      }

      onClose()
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,26,18,0.88)] px-4 backdrop-blur-[8px]">
        <div className="relative w-full max-w-130 rounded-2xl border border-[#3EE07F]/13 bg-[linear-gradient(160deg,_#162B1E,_#0F2027)] p-8 shadow-[0_32px_80px_rgba(15,32,39,0.95)]">
          <div className="absolute top-0 left-10 right-10 h-px rounded-full bg-[linear-gradient(90deg,transparent,rgba(62,224,127,0.35),transparent)]" />

          <div className="flex items-start justify-between gap-3 mb-1">
            <div>
              <h3 className="text-[19px] font-bold text-[#F0FAF4]">
                {mode === 'create' ? 'Create New Project' : 'Edit Project'}
              </h3>
              <p className="mt-1 text-[12px] text-[#7BAF8E]">
                {mode === 'create' ? 'Fill in the details to get started' : 'Update project information'}
              </p>
            </div>

            {mode === 'create' && (
              <Btn variant="accent" small onClick={() => setParserOpen(true)}>
                ⚡ Use AI Parser
              </Btn>
            )}
          </div>

          <div className="mb-7" />

          {error && (
            <div className="mb-5 flex items-start gap-2 rounded-xl border border-red-400/20 bg-red-400/8 px-4 py-3">
              <span className="text-[#F87171]">⚠</span>
              <p className="text-[12px] text-[#FCA5A5]">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field
              label="Project Name"
              value={form.name}
              required
              placeholder="e.g. SkillSync Web Platform"
              onChange={e => set('name', e.target.value)}
            />

            <Field
              label="Description"
              value={form.description}
              rows={3}
              placeholder="What is this project about?"
              onChange={e => set('description', e.target.value)}
            />

            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-[#7BAF8E]">
                Status
              </label>
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(STATUS_CFG).map(([key, cfg]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => set('status', key)}
                    className={`rounded-xl border py-2 text-[10px] font-bold uppercase tracking-wide transition-all ${
                      form.status === key
                        ? `${cfg.bgClass} ${cfg.colorClass} ${cfg.borderClass}`
                        : 'border-[rgba(40,98,58,0.3)] bg-[rgba(15,32,39,0.6)] text-[#7BAF8E]'
                    }`}
                  >
                    {cfg.icon} {cfg.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Start Date" type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} />
              <Field label="End Date" type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)} />
            </div>

            <Field
              label="Budget (₹)"
              type="number"
              value={form.budget}
              placeholder="e.g. 500000"
              onChange={e => set('budget', e.target.value)}
            />

            {!!parserNotes.length && mode === 'create' && (
              <div className="text-[11px] text-[#7BAF8E]">
                {parserNotes[0]}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
              <button
                type="submit"
                disabled={saving || !form.name}
                className={`flex-1 rounded-xl border border-[#3EE07F]/20 bg-[linear-gradient(135deg,_#28623A,_#1A4D2E)] py-3 text-[13px] font-semibold text-[#F0FAF4] transition-all ${
                  saving || !form.name ? 'cursor-not-allowed opacity-50' : 'opacity-100 hover:shadow-[0_8px_28px_rgba(62,224,127,0.18)]'
                }`}
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[rgba(240,250,244,0.3)] border-t-[#F0FAF4]" />
                    {mode === 'create' ? 'Creating...' : 'Saving...'}
                  </span>
                ) : mode === 'create' ? 'Create Project →' : 'Save Changes →'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <BriefParserModal
        open={parserOpen}
        onClose={() => setParserOpen(false)}
        briefText={briefText}
        setBriefText={setBriefText}
        briefFile={briefFile}
        setBriefFile={setBriefFile}
        onParse={handleParseBrief}
        parsing={parsing}
        parserError={parserError}
        parserNotes={parserNotes}
        parserPreview={parserPreview}
        parsedSkills={parsedSkills}
        parsedMilestones={parsedMilestones}
        onApply={applyParsedBrief}
      />
    </>
  )
}

const DeleteModal = ({ project, onClose, onConfirm, deleting }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,26,18,0.88)] px-4 backdrop-blur-[8px]">
    <div className="relative w-full max-w-100 rounded-2xl border border-red-400/20 bg-[linear-gradient(160deg,_#1E1212,_#0F2027)] p-7 shadow-[0_32px_80px_rgba(15,32,39,0.95)]">
      <div className="absolute top-0 left-10 right-10 h-px rounded-full bg-[linear-gradient(90deg,transparent,rgba(248,113,113,0.3),transparent)]" />
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-red-400/20 bg-red-400/10 text-[22px]">
        🗑
      </div>
      <h3 className="mb-2 text-[17px] font-bold text-[#F0FAF4]">Delete Project?</h3>
      <p className="mb-1 text-[13px] text-[#7BAF8E]">You're about to permanently delete</p>
      <p className="mb-5 text-[14px] font-semibold text-[#F87171]">"{project.name}"</p>
      <p className="mb-6 text-[11px] text-[rgba(123,175,142,0.6)]">
        This action cannot be undone. All project data will be removed.
      </p>
      <div className="flex gap-3">
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <button
          onClick={onConfirm}
          disabled={deleting}
          className={`flex-1 rounded-xl border border-red-400/25 bg-red-400/12 py-2.5 text-[12px] font-semibold text-[#F87171] transition-all ${deleting ? 'cursor-not-allowed opacity-50' : 'opacity-100'}`}
        >
          {deleting ? 'Deleting...' : 'Yes, Delete Project'}
        </button>
      </div>
    </div>
  </div>
)

const ProjectCard = ({ project, onEdit, onDelete, onClick }) => {
  const s = STATUS_CFG[project.status] || STATUS_CFG.PLANNING
  const daysLeft = project.end_date
    ? Math.ceil((new Date(project.end_date) - new Date()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div
      className="group relative cursor-pointer rounded-2xl border border-[#3EE07F]/13 bg-[linear-gradient(160deg,_#162B1E_0%,_#0F2027_60%)] p-5 shadow-[0_0_0_1px_rgba(40,98,58,0.12),0_12px_40px_rgba(15,32,39,0.6)] transition-all hover:border-emerald-400/25"
      onClick={onClick}
    >
      <div className="absolute top-0 left-6 right-6 h-px rounded-full bg-[linear-gradient(90deg,transparent,rgba(62,224,127,0.2),transparent)]" />

      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="mb-1 truncate text-[15px] font-bold text-[#F0FAF4]">{project.name}</h3>
          <p className="line-clamp-2 text-[12px] leading-relaxed text-[#7BAF8E]">
            {project.description || 'No description provided'}
          </p>
        </div>

        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all shrink-0" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => onEdit(project)}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-[rgba(40,98,58,0.2)] text-[13px] text-[#7BAF8E] transition-all hover:bg-[rgba(40,98,58,0.4)] hover:text-[#3EE07F]"
          >
            ✎
          </button>
          <button
            onClick={() => onDelete(project)}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-400/8 text-[13px] text-[rgba(248,113,113,0.5)] transition-all hover:bg-red-400/15 hover:text-[#F87171]"
          >
            🗑
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Badge className={`${s.colorClass} ${s.bgClass} ${s.borderClass}`}>{s.icon} {s.label}</Badge>
        {project.ai_success_score !== null && project.ai_success_score !== undefined && (
          <Badge className="border-yellow-400/25 bg-yellow-400/10 text-yellow-400">⚡ AI {project.ai_success_score}%</Badge>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-xl border border-[rgba(40,98,58,0.3)] bg-[rgba(40,98,58,0.1)] p-2">
          <div className="text-[14px] font-bold text-[#3EE07F]">{project.team_members?.length || 0}</div>
          <div className="mt-0.5 text-[9px] uppercase tracking-wide text-[#7BAF8E]">Members</div>
        </div>
        <div className="rounded-xl border border-[rgba(40,98,58,0.3)] bg-[rgba(40,98,58,0.1)] p-2">
          <div className="text-[14px] font-bold text-blue-400">
            {project.budget ? `₹${(project.budget / 1000).toFixed(0)}K` : '—'}
          </div>
          <div className="mt-0.5 text-[9px] uppercase tracking-wide text-[#7BAF8E]">Budget</div>
        </div>
        <div className="rounded-xl border border-[rgba(40,98,58,0.3)] bg-[rgba(40,98,58,0.1)] p-2">
          <div className={`text-[14px] font-bold ${daysLeft === null ? 'text-[#7BAF8E]' : daysLeft < 0 ? 'text-[#F87171]' : daysLeft <= 7 ? 'text-[#FBBF24]' : 'text-[#3EE07F]'}`}>
            {daysLeft === null ? '—' : daysLeft < 0 ? `${Math.abs(daysLeft)}d OD` : `${daysLeft}d`}
          </div>
          <div className="mt-0.5 text-[9px] uppercase tracking-wide text-[#7BAF8E]">
            {daysLeft === null ? 'No deadline' : daysLeft < 0 ? 'Overdue' : 'Left'}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-[rgba(40,98,58,0.2)] pt-3">
        <div className="text-[10px] text-[rgba(123,175,142,0.5)]">
          by {project.created_by?.username || 'Unknown'}
        </div>
        <div className="text-[10px] text-[rgba(123,175,142,0.5)]">
          {new Date(project.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
      </div>
    </div>
  )
}

export default function ProjectsPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  const [createModal, setCreateModal] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const [statusFilter, setStatusFilter] = useState('ALL')
  const [search, setSearch] = useState('')

  const showToast = msg => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const fetchProjects = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${API}/api/project/get-projects`, { withCredentials: true })
      setProjects(res.data.projects || [])
    } catch (err) {
      if (err.response?.status === 401) navigate('/login')
      else if (err.response?.status === 403) navigate('/dashboard')
      else setError('Failed to load projects. Please refresh.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
  if (location.state?.openCreate) {
    setCreateModal(true)
    navigate(location.pathname, { replace: true, state: {} })
  }
}, [location, navigate])


  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await axios.delete(`${API}/api/project/delete-project/${deleteTarget._id}`, { withCredentials: true })
      setProjects(prev => prev.filter(project => project._id !== deleteTarget._id))
      setDeleteTarget(null)
      showToast('✓ Project deleted')
    } catch (err) {
      showToast('⚠ ' + (err.response?.data?.error || 'Failed to delete'))
    } finally {
      setDeleting(false)
    }
  }

  const handleModalSuccess = () => {
    showToast('✓ Project saved successfully')
    fetchProjects()
  }

  const filtered = projects.filter(project => {
    const matchStatus = statusFilter === 'ALL' || project.status === statusFilter
    const matchSearch =
      !search ||
      project.name.toLowerCase().includes(search.toLowerCase()) ||
      project.description?.toLowerCase().includes(search.toLowerCase())

    return matchStatus && matchSearch
  })

  const counts = projects.reduce((acc, project) => {
    acc[project.status] = (acc[project.status] || 0) + 1
    return acc
  }, {})

  if (loading) {
    return (
      <div className="ss-bg-app min-h-screen flex items-center justify-center">
        <BG />
        <div className="flex flex-col items-center gap-3 relative z-10">
          <div className="ss-spinner h-10 w-10 rounded-full border-2 animate-spin" />
          <span className="text-[13px] text-[#7BAF8E]">Loading projects...</span>
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
          <button onClick={fetchProjects} className="mt-4 rounded-xl bg-[#28623A] px-5 py-2 text-[13px] font-semibold text-[#F0FAF4]">
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="ss-bg-app min-h-screen font-sans">
      <BG />

      <div className="relative z-10 max-w-[1150px] mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => navigate('/pm/dashboard')}
              className="mb-2 block text-[12px] font-medium text-[#7BAF8E] transition-all hover:text-[#F0FAF4]"
            >
              ← Back to Dashboard
            </button>
            <h1 className="font-bold text-[26px] text-[#F0FAF4]">Projects</h1>
            <p className="mt-0.5 text-[13px] text-[#7BAF8E]">
              {projects.length} total · {counts.ACTIVE || 0} active
            </p>
          </div>

          <div className="flex items-center gap-3">
            {toast && (
              <div
                className={`rounded-full border px-4 py-2 text-[12px] font-semibold ${
                  toast.startsWith('✓')
                    ? 'border-emerald-400/25 bg-emerald-400/12 text-[#3EE07F]'
                    : 'border-red-400/20 bg-red-400/10 text-[#F87171]'
                }`}
              >
                {toast}
              </div>
            )}

            <button
              onClick={() => setCreateModal(true)}
              className="flex items-center gap-2 rounded-xl border border-[#3EE07F]/20 bg-[linear-gradient(135deg,_#28623A,_#1A4D2E)] px-5 py-2.5 text-[13px] font-semibold text-[#F0FAF4] transition-all hover:shadow-[0_8px_28px_rgba(62,224,127,0.18)]"
            >
              + Create Project
            </button>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-4 mb-7">
          {[
            { label: 'Total', value: projects.length, colorClass: 'text-[#F0FAF4]' },
            { label: 'Planning', value: counts.PLANNING || 0, colorClass: 'text-blue-400' },
            { label: 'Active', value: counts.ACTIVE || 0, colorClass: 'text-[#3EE07F]' },
            { label: 'Completed', value: counts.COMPLETED || 0, colorClass: 'text-yellow-400' },
            { label: 'On Hold', value: counts.ON_HOLD || 0, colorClass: 'text-[#F87171]' },
          ].map(stat => (
            <div key={stat.label} className="ss-card relative rounded-xl p-4">
              <div className={`mb-1 text-[24px] font-bold ${stat.colorClass}`}>{stat.value}</div>
              <div className="text-[10px] font-medium uppercase tracking-widest text-[#7BAF8E]">{stat.label}</div>
            </div>
          ))}
        </div>

        {projects.length > 0 && (
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <div className="relative flex-1 min-w-[220px]">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] text-[#7BAF8E]">🔍</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search projects..."
                className="w-full rounded-xl border border-[rgba(40,98,58,0.3)] bg-[rgba(15,32,39,0.85)] py-2.5 pl-9 pr-4 text-[13px] text-[#F0FAF4] outline-none"
              />
            </div>

            <div className="flex gap-1.5 flex-wrap">
              {['ALL', ...Object.keys(STATUS_CFG)].map(key => {
                const cfg = STATUS_CFG[key]
                const isActive = statusFilter === key

                return (
                  <button
                    key={key}
                    onClick={() => setStatusFilter(key)}
                    className={`rounded-xl border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-all ${
                      isActive
                        ? key === 'ALL'
                          ? 'border-emerald-400/25 bg-[rgba(40,98,58,0.25)] text-[#3EE07F]'
                          : `${cfg.borderClass} ${cfg.bgClass} ${cfg.colorClass}`
                        : 'border-[rgba(40,98,58,0.3)] bg-[rgba(15,32,39,0.5)] text-[#7BAF8E]'
                    }`}
                  >
                    {key === 'ALL' ? `All (${projects.length})` : `${cfg.icon} ${cfg.label} (${counts[key] || 0})`}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {projects.length === 0 ? (
          <EmptyState onCreateClick={() => setCreateModal(true)} />
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="mb-1 text-[15px] font-medium text-[#F0FAF4]">No projects match your filters</p>
            <p className="text-[13px] text-[#7BAF8E]">Try clearing the search or changing the status filter</p>
            <button
              onClick={() => {
                setSearch('')
                setStatusFilter('ALL')
              }}
              className="mt-4 rounded-xl border border-[rgba(40,98,58,0.3)] bg-[rgba(40,98,58,0.2)] px-4 py-2 text-[12px] font-semibold text-[#3EE07F]"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-5">
            {filtered.map(project => (
              <ProjectCard
                key={project._id}
                project={project}
                onEdit={proj => setEditTarget(proj)}
                onDelete={proj => setDeleteTarget(proj)}
                onClick={() => navigate(`/pm/projects/${project._id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {createModal && (
        <ProjectModal
          mode="create"
          onClose={() => setCreateModal(false)}
          onSuccess={handleModalSuccess}
        />
      )}

      {editTarget && (
        <ProjectModal
          mode="edit"
          initial={editTarget}
          onClose={() => setEditTarget(null)}
          onSuccess={handleModalSuccess}
        />
      )}

      {deleteTarget && (
        <DeleteModal
          project={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          deleting={deleting}
        />
      )}
    </div>
  )
}

