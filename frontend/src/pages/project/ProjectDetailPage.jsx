import { useState, useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import {
  buildProjectDashboardPath,
  buildProjectMilestonesPath,
  buildProjectPath,
  buildProjectSkillsPath,
  buildProjectTasksPath,
  getProjectListPath,
  getRolePrefixFromPath,
} from '../../utils/roleRoutes'

const API = 'http://localhost:3000'

const STATUS_CFG = {
  PLANNING: { text: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20', label: 'Planning', icon: '◷' },
  ACTIVE: { text: 'text-[#3EE07F]', bg: 'bg-[#3EE07F]/10', border: 'border-[#3EE07F]/20', label: 'Active', icon: '▶' },
  COMPLETED: { text: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20', label: 'Completed', icon: '✓' },
  ON_HOLD: { text: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20', label: 'On Hold', icon: '⏸' },
}

const PROF_CFG = {
  BEGINNER: { text: 'text-[#7BAF8E]', bg: 'bg-[#7BAF8E]/10', border: 'border-[#7BAF8E]/20' },
  INTERMEDIATE: { text: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
  ADVANCED: { text: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20' },
  EXPERT: { text: 'text-[#3EE07F]', bg: 'bg-[#3EE07F]/10', border: 'border-[#3EE07F]/20' },
}

const capText = (p) => p >= 85 ? 'text-red-400' : p >= 65 ? 'text-yellow-400' : 'text-[#3EE07F]'
const capBg = (p) => p >= 85 ? 'bg-red-400' : p >= 65 ? 'bg-yellow-400' : 'bg-[#3EE07F]'
const dlText = (d) => d === null ? '' : d < 0 ? 'text-red-400' : d <= 7 ? 'text-yellow-400' : 'text-[#3EE07F]'

const BG = () => (
  <>
    <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_50%_20%,rgba(40,98,58,0.14)_0%,transparent_65%)]" />
    <div className="fixed inset-0 pointer-events-none opacity-[0.035] [background-image:linear-gradient(rgba(240,250,244,1)_1px,transparent_1px),linear-gradient(90deg,rgba(240,250,244,1)_1px,transparent_1px)] [background-size:60px_60px]" />
  </>
)

const Card = ({ children, className = '' }) => (
  <div className={`rounded-2xl p-6 relative bg-gradient-to-br from-[#162B1E] to-[#0F2027] border border-[rgba(62,224,127,0.13)] shadow-[0_0_0_1px_rgba(40,98,58,0.15),0_20px_60px_rgba(15,32,39,0.7)] ${className}`}>
    <div className="absolute top-0 left-8 right-8 h-px rounded-full bg-gradient-to-r from-transparent via-[rgba(62,224,127,0.25)] to-transparent" />
    {children}
  </div>
)

const SectionTitle = ({ children, action }) => (
  <div className="flex items-center justify-between mb-5">
    <h2 className="font-bold text-[15px] text-[#F0FAF4]">{children}</h2>
    {action}
  </div>
)

const Field = ({ label, value, onChange, type = 'text', placeholder, rows, required }) => {
  const [focus, setFocus] = useState(false)
  const Tag = rows ? 'textarea' : 'input'

  return (
    <div>
      {label && (
        <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] mb-1.5 text-[#7BAF8E]">
          {label}{required && <span className="text-[#3EE07F]"> *</span>}
        </label>
      )}

      <Tag
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className={`w-full bg-[rgba(15,32,39,0.85)] rounded-xl px-3.5 py-2.5 text-[#F0FAF4] text-[13px] outline-none transition-colors ${rows ? 'resize-none' : ''} ${focus ? 'border border-[rgba(62,224,127,0.4)]' : 'border border-[rgba(40,98,58,0.3)]'}`}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
      />
    </div>
  )
}

const InfoRow = ({ label, value, colorClass = 'text-[#F0FAF4]' }) => (
  <div className="flex items-center justify-between p-3 rounded-xl bg-[rgba(40,98,58,0.08)] border border-[rgba(40,98,58,0.3)]">
    <span className="text-[11px] uppercase tracking-wide font-medium text-[#7BAF8E]">{label}</span>
    <span className={`text-[13px] font-semibold ${colorClass}`}>{value || '—'}</span>
  </div>
)

const EMPTY_REC_FORM = {
  user_id: '',
  skill_name: '',
  current_level: 'NONE',
  target_level: 'BEGINNER',
  reason: '',
  course_name: '',
  course_url: '',
  priority: 'MEDIUM',
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

const TeamReviewModal = ({
  open,
  onClose,
  reviewMembers,
  setReviewMembers,
  allMembers,
  onSave,
  saving,
}) => {
  const [search, setSearch] = useState('')

  if (!open) return null

  const selectedIds = reviewMembers.map(m => m._id.toString())

  const addMember = (member) => {
    if (selectedIds.includes(member._id.toString())) return
    setReviewMembers(prev => [...prev, member])
  }

  const removeMember = (memberId) => {
    setReviewMembers(prev => prev.filter(m => m._id.toString() !== memberId.toString()))
  }

  const availableMembers = allMembers.filter(member => {
    const notSelected = !selectedIds.includes(member._id.toString())
    const matchSearch =
      !search ||
      member.username.toLowerCase().includes(search.toLowerCase()) ||
      member.email?.toLowerCase().includes(search.toLowerCase())
    return notSelected && matchSearch
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-[rgba(10,26,18,0.88)] backdrop-blur-[8px]">
      <div className="ss-card-heavy ss-card-line-strong relative w-full max-w-[760px] rounded-2xl p-7">

        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <h3 className="font-bold text-[18px] text-[#F0FAF4]">Modify Suggested Team</h3>
            <p className="text-[12px] mt-1 text-[#7BAF8E]">
              Review the AI team and adjust members before saving
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-[12px] font-medium border border-[rgba(40,98,58,0.3)] text-[#7BAF8E] hover:text-[#F0FAF4] transition-colors"
          >
            Close
          </button>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-3 text-[#7BAF8E]">
              Selected Team
            </p>
            <div className="space-y-2 max-h-[320px] overflow-y-auto">
              {!reviewMembers.length ? (
                <p className="text-[12px] text-[#7BAF8E]">No members selected</p>
              ) : (
                reviewMembers.map(member => (
                  <div
                    key={member._id}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[rgba(40,98,58,0.08)] border border-[rgba(40,98,58,0.3)]"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold bg-gradient-to-br from-[#28623A] to-[#3EE07F] text-[#0F2027]">
                        {member.username?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="text-[12px] font-semibold text-[#F0FAF4]">{member.username}</div>
                        <div className="text-[10px] text-[#7BAF8E]">
                          {member.current_capacity_percentage || 0}% capacity
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeMember(member._id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-400/10"
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-3 text-[#7BAF8E]">
              Add Members
            </p>

            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search members..."
              className="w-full mb-3 rounded-xl px-3 py-2 text-[12px] outline-none bg-[rgba(15,32,39,0.85)] border border-[rgba(40,98,58,0.3)] text-[#F0FAF4]"
            />

            <div className="space-y-2 max-h-[320px] overflow-y-auto">
              {availableMembers.map(member => (
                <div
                  key={member._id}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[rgba(15,32,39,0.45)] border border-[rgba(40,98,58,0.3)]"
                >
                  <div>
                    <div className="text-[12px] font-semibold text-[#F0FAF4]">{member.username}</div>
                    <div className="text-[10px] text-[#7BAF8E]">
                      {member.current_capacity_percentage || 0}% capacity • {member.skills?.length || 0} skills
                    </div>
                  </div>
                  <button
                    onClick={() => addMember(member)}
                    className="px-3 py-1.5 rounded-lg text-[10px] font-semibold bg-[#3EE07F]/10 text-[#3EE07F] border border-[#3EE07F]/20"
                  >
                    Add
                  </button>
                </div>
              ))}

              {!availableMembers.length && (
                <p className="text-[12px] text-[#7BAF8E]">No more members available</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-[12px] font-medium text-[#7BAF8E] border border-[rgba(40,98,58,0.3)]"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving || !reviewMembers.length}
            className="px-6 py-2.5 rounded-xl text-[12px] font-semibold bg-gradient-to-br from-[#28623A] to-[#1A4D2E] text-[#F0FAF4] border border-[#3EE07F]/20 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Team'}
          </button>
        </div>
      </div>
    </div>
  )
}


const RecommendationModal = ({
  open,
  onClose,
  members,
  form,
  setForm,
  onMemberChange,
  onSubmit,
  saving,
}) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-[rgba(10,26,18,0.88)] backdrop-blur-[8px]">
      <div className="ss-card-heavy ss-card-line-strong relative max-h-[90vh] w-full max-w-[520px] overflow-y-auto rounded-2xl p-7">

        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <h3 className="font-bold text-[18px] text-[#F0FAF4]">Send Learning Recommendation</h3>
            <p className="text-[12px] mt-1 text-[#7BAF8E]">
              This will appear on the selected member's learning dashboard.
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-[12px] font-medium border border-[rgba(40,98,58,0.3)] text-[#7BAF8E] hover:text-[#F0FAF4] transition-colors"
          >
            Close
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] mb-1.5 text-[#7BAF8E]">
              Team Member <span className="text-[#3EE07F]"> *</span>
            </label>
            <select
              value={form.user_id}
              onChange={e => onMemberChange(e.target.value)}
              className="w-full rounded-xl px-3.5 py-2.5 text-[13px] outline-none bg-[rgba(15,32,39,0.85)] border border-[rgba(40,98,58,0.3)] text-[#F0FAF4]"
            >
              <option value="">Select a member</option>
              {members.map(member => (
                <option key={member._id} value={member._id}>
                  {member.username}
                </option>
              ))}
            </select>
          </div>

          <Field
            label="Skill Name"
            required
            value={form.skill_name}
            placeholder="e.g. React, Docker, MongoDB"
            onChange={e => setForm(prev => ({ ...prev, skill_name: e.target.value }))}
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] mb-1.5 text-[#7BAF8E]">
                Current Level
              </label>
              <select
                value={form.current_level}
                onChange={e => setForm(prev => ({ ...prev, current_level: e.target.value }))}
                className="w-full rounded-xl px-3.5 py-2.5 text-[13px] outline-none bg-[rgba(15,32,39,0.85)] border border-[rgba(40,98,58,0.3)] text-[#F0FAF4]"
              >
                {['NONE', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'].map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] mb-1.5 text-[#7BAF8E]">
                Target Level <span className="text-[#3EE07F]"> *</span>
              </label>
              <select
                value={form.target_level}
                onChange={e => setForm(prev => ({ ...prev, target_level: e.target.value }))}
                className="w-full rounded-xl px-3.5 py-2.5 text-[13px] outline-none bg-[rgba(15,32,39,0.85)] border border-[rgba(40,98,58,0.3)] text-[#F0FAF4]"
              >
                {['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'].map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>
          </div>

          <Field
            label="Course Name"
            value={form.course_name}
            placeholder="e.g. React - The Complete Guide"
            onChange={e => setForm(prev => ({ ...prev, course_name: e.target.value }))}
          />

          <Field
            label="Course URL"
            value={form.course_url}
            placeholder="https://..."
            onChange={e => setForm(prev => ({ ...prev, course_url: e.target.value }))}
          />

          <Field
            label="Reason"
            rows={3}
            value={form.reason}
            placeholder="Explain why this skill matters for this project."
            onChange={e => setForm(prev => ({ ...prev, reason: e.target.value }))}
          />

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] mb-2 text-[#7BAF8E]">
              Priority
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['LOW', 'MEDIUM', 'HIGH'].map(priority => (
                <button
                  key={priority}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, priority }))}
                  className={[
                    'border border-[rgba(40,98,58,0.3)] py-2 rounded-xl text-[10px] font-bold uppercase tracking-wide transition-all',
                    form.priority === priority
                      ? priority === 'HIGH'
                        ? 'bg-[rgba(248,113,113,0.15)] text-[#F87171]'
                        : priority === 'MEDIUM'
                          ? 'bg-[rgba(251,191,36,0.12)] text-[#FBBF24]'
                          : 'bg-[rgba(123,175,142,0.12)] text-[#7BAF8E]'
                      : 'bg-[rgba(15,32,39,0.6)] text-[#7BAF8E]',
                  ].join(' ')}
                >
                  {priority}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-[12px] font-medium text-[#7BAF8E] border border-[rgba(40,98,58,0.3)]"
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              disabled={saving || !form.user_id || !form.skill_name.trim()}
              className="flex-1 py-2.5 rounded-xl text-[12px] font-semibold bg-gradient-to-br from-[#28623A] to-[#1A4D2E] text-[#F0FAF4] border border-[#3EE07F]/20 disabled:opacity-50"
            >
              {saving ? 'Sending...' : 'Send Recommendation'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProjectDetailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const routePrefix = getRolePrefixFromPath(location.pathname)

  const [project, setProject] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [currentUserRole, setCurrentUserRole] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDel, setShowDel] = useState(false)
  const [toast, setToast] = useState('')

  const [form, setForm] = useState({
    name: '',
    description: '',
    status: 'PLANNING',
    start_date: '',
    end_date: '',
    budget: '',
  })

  const [allSkills, setAllSkills] = useState([])
  const [skillSearch, setSkillSearch] = useState('')
  const [skillPicker, setSkillPicker] = useState(false)
  const [selSkill, setSelSkill] = useState(null)
  const [selProf, setSelProf] = useState('INTERMEDIATE')
  const [addingSkill, setAddingSkill] = useState(false)
  const [removingSkill, setRemovingSkill] = useState(null)

  const [allMembers, setAllMembers] = useState([])
  const [memberPicker, setMemberPicker] = useState(false)
  const [memberSearch, setMemberSearch] = useState('')
  const [addingMember, setAddingMember] = useState(false)
  const [removingMember, setRemovingMember] = useState(null)

  const [teamAssembly, setTeamAssembly] = useState([])
  const [skillGap, setSkillGap] = useState(null)
  const [aiBusy, setAiBusy] = useState(false)
  const [aiError, setAiError] = useState('')

  const [reviewTeamOpen, setReviewTeamOpen] = useState(false)
  const [reviewMembers, setReviewMembers] = useState([])
  const [applyingTeam, setApplyingTeam] = useState(false)
  const [rejectedStrategies, setRejectedStrategies] = useState([])
  const [recModalOpen, setRecModalOpen] = useState(false)
  const [recSaving, setRecSaving] = useState(false)
  const [recForm, setRecForm] = useState(EMPTY_REC_FORM)
  const [chatMessages, setChatMessages] = useState([])
  const [chatLoading, setChatLoading] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [chatSending, setChatSending] = useState(false)

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const resetRecommendationForm = () => {
    setRecForm(EMPTY_REC_FORM)
    setRecModalOpen(false)
  }

  const getMemberSkillLevel = (memberId, skillName) => {
    if (!memberId || !skillName) return 'NONE'

    const member = project?.team_members?.find(m => m._id.toString() === memberId.toString())
    if (!member) return 'NONE'

    const memberSkill = (member.skills || []).find(skill =>
      skill.skill_name?.toLowerCase() === skillName.toLowerCase()
    )

    return memberSkill?.proficiency_level || 'NONE'
  }

  const handleRecommendationMemberChange = (memberId) => {
    setRecForm(prev => ({
      ...prev,
      user_id: memberId,
      current_level: getMemberSkillLevel(memberId, prev.skill_name),
    }))
  }

  const openRecommendationModal = ({
    memberId = '',
    skillName = '',
    targetLevel = 'BEGINNER',
    reason = '',
    courseName = '',
    courseUrl = '',
    priority = 'MEDIUM',
  } = {}) => {
    setRecForm({
      ...EMPTY_REC_FORM,
      user_id: memberId,
      skill_name: skillName,
      current_level: getMemberSkillLevel(memberId, skillName),
      target_level: targetLevel,
      reason,
      course_name: courseName,
      course_url: courseUrl,
      priority,
    })
    setRecModalOpen(true)
  }

  const handleSendRecommendation = async () => {
    if (!recForm.user_id || !recForm.skill_name.trim()) return

    setRecSaving(true)
    try {
      await axios.post(
        `${API}/api/profile/${recForm.user_id}/recommendations`,
        {
          skill_name: recForm.skill_name,
          current_level: recForm.current_level,
          target_level: recForm.target_level,
          reason: recForm.reason,
          course_name: recForm.course_name,
          course_url: recForm.course_url,
          priority: recForm.priority,
        },
        { withCredentials: true }
      )

      resetRecommendationForm()
      showToast('✓ Recommendation sent')
    } catch (err) {
      showToast('⚠ ' + (err.response?.data?.message || 'Failed to send recommendation'))
    } finally {
      setRecSaving(false)
    }
  }

  const fetchAiInsights = async () => {
    setAiBusy(true)
    setAiError('')
    setRejectedStrategies([])
    try {
      const [teamRes, skillGapRes] = await Promise.all([
        axios.get(`${API}/api/ai/projects/${id}/team-assembly`, { withCredentials: true }),
        axios.get(`${API}/api/ai/projects/${id}/skill-gap`, { withCredentials: true }),
      ])

      setTeamAssembly(teamRes.data.recommendations || [])
      setSkillGap(skillGapRes.data)
    } catch (err) {
      setAiError(err.response?.data?.message || 'Failed to load AI insights.')
    } finally {
      setAiBusy(false)
    }
  }

  const refreshAiIfLoaded = () => {
    if (teamAssembly.length || skillGap) fetchAiInsights()
  }

  const applySelectedTeam = async (memberIds, successMessage) => {
  setApplyingTeam(true)
  try {
    const res = await axios.put(
      `${API}/api/project/${id}/team-selection`,
      { memberIds },
      { withCredentials: true }
    )

    setProject(res.data.project)
    setReviewTeamOpen(false)
    showToast(successMessage)
    await fetchAiInsights()
  } catch (err) {
    showToast('⚠ ' + (err.response?.data?.message || 'Failed to update project team'))
  } finally {
    setApplyingTeam(false)
  }
}

const handleAcceptAiTeam = async (rec) => {
  const confirmed = window.confirm('This will replace the current project team with the selected AI suggestion. Continue?')
  if (!confirmed) return

  const memberIds = rec.suggested_team.map(member => member._id)
  await applySelectedTeam(memberIds, '✓ AI team accepted')
}

const handleModifyAiTeam = (rec) => {
  setReviewMembers(rec.suggested_team)
  setReviewTeamOpen(true)
}

const handleSaveReviewedTeam = async () => {
  const memberIds = reviewMembers.map(member => member._id)
  await applySelectedTeam(memberIds, '✓ Team updated from AI suggestion')
}

const handleRejectAiTeam = (strategy) => {
  setRejectedStrategies(prev => [...prev, strategy])
  showToast('✓ AI team suggestion rejected')
}


  const fetchProject = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${API}/api/project/get-project/${id}`)
      const p = res.data.project
      setProject(p)
      setForm({
        name: p.name || '',
        description: p.description || '',
        status: p.status || 'PLANNING',
        start_date: p.start_date ? p.start_date.slice(0, 10) : '',
        end_date: p.end_date ? p.end_date.slice(0, 10) : '',
        budget: p.budget || '',
      })
    } catch (err) {
      setError(err.response?.status === 404 ? 'Project not found.' : 'Failed to load project.')
    } finally {
      setLoading(false)
    }
  }

  const fetchProjectChat = async () => {
    setChatLoading(true)
    try {
      const res = await axios.get(`${API}/api/project/${id}/chat`, { withCredentials: true })
      setChatMessages(res.data.messages || [])
    } catch {
      setChatMessages([])
    } finally {
      setChatLoading(false)
    }
  }

  const handleSendChatMessage = async (e) => {
    e.preventDefault()
    if (!chatInput.trim()) return

    setChatSending(true)
    try {
      const res = await axios.post(
        `${API}/api/project/${id}/chat`,
        { content: chatInput.trim() },
        { withCredentials: true }
      )
      setChatMessages(prev => [...prev, res.data.chat_message])
      setChatInput('')
    } catch (err) {
      showToast('⚠ ' + (err.response?.data?.message || 'Failed to send message'))
    } finally {
      setChatSending(false)
    }
  }

  useEffect(() => {
    fetchProject()
    fetchProjectChat()
    axios.get(`${API}/api/profile/me`, { withCredentials: true }).then(r => {
      setCurrentUser(r.data.user || null)
      setCurrentUserRole(r.data.user?.role || '')
    }).catch(() => {
      setCurrentUser(null)
      setCurrentUserRole('')
    })
    axios.get(`${API}/api/skills`, { withCredentials: true }).then(r => setAllSkills(r.data.skills || [])).catch(console.error)
    axios.get(`${API}/api/project/users`, { withCredentials: true }).then(r => setAllMembers(r.data.users || [])).catch(console.error)
  }, [id])

  const handleSave = async () => {
    if (!form.name.trim()) return

    setSaving(true)
    try {
      const payload = { name: form.name }
      if (form.description) payload.description = form.description
      if (form.status) payload.status = form.status
      if (form.start_date) payload.start_date = new Date(form.start_date).toISOString()
      if (form.end_date) payload.end_date = new Date(form.end_date).toISOString()
      if (form.budget) payload.budget = Number(form.budget)

      const res = await axios.put(`${API}/api/project/update-project/${id}`, payload, { withCredentials: true })
      setProject(res.data)
      setEditMode(false)
      showToast('✓ Project updated')
    } catch (err) {
      showToast('⚠ ' + (err.response?.data?.error || 'Update failed'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await axios.delete(`${API}/api/project/delete-project/${id}`, { withCredentials: true })
      navigate(getProjectListPath(routePrefix))
    } catch {
      showToast('⚠ Delete failed')
      setDeleting(false)
    }
  }

  const handleAddRequiredSkill = async () => {
    if (!selSkill) return

    setAddingSkill(true)
    try {
      await axios.post(
        `${API}/api/skills/project/${id}/add`,
        { skill_id: selSkill._id, required_proficiency: selProf },
        { withCredentials: true }
      )

      const res = await axios.get(`${API}/api/project/get-project/${id}`)
      setProject(res.data.project)
      setSelSkill(null)
      setSkillPicker(false)
      setSkillSearch('')
      showToast(`✓ "${selSkill.name}" added`)
    } catch (err) {
      showToast('⚠ ' + (err.response?.data?.message || 'Failed'))
    } finally {
      setAddingSkill(false)
    }

    refreshAiIfLoaded()
  }

  const handleRemoveRequiredSkill = async (reqSkillId, skillName) => {
    setRemovingSkill(reqSkillId)
    try {
      await axios.delete(`${API}/api/skills/project/${id}/${reqSkillId}`, { withCredentials: true })
      setProject(prev => ({
        ...prev,
        required_skills: prev.required_skills.filter(s => s._id !== reqSkillId),
      }))
      showToast(`✓ "${skillName}" removed`)
    } catch {
      showToast('⚠ Failed')
    } finally {
      setRemovingSkill(null)
    }

    refreshAiIfLoaded()
  }

  const handleAddMember = async (userId, username) => {
    setAddingMember(true)
    try {
      const res = await axios.post(`${API}/api/project/${id}/team`, { userId }, { withCredentials: true })
      setProject(prev => ({
        ...prev,
        team_members: [...(prev.team_members || []), res.data.member],
      }))
      setMemberPicker(false)
      setMemberSearch('')
      showToast(`✓ ${username} added`)
    } catch (err) {
      showToast('⚠ ' + (err.response?.data?.message || 'Failed'))
    } finally {
      setAddingMember(false)
    }

    refreshAiIfLoaded()
  }

  const handleRemoveMember = async (userId, username) => {
    setRemovingMember(userId)
    try {
      await axios.delete(`${API}/api/project/${id}/team/${userId}`, { withCredentials: true })
      setProject(prev => ({
        ...prev,
        team_members: prev.team_members.filter(m => (m._id || m).toString() !== userId),
      }))
      showToast(`✓ ${username} removed`)
    } catch (err) {
      showToast('⚠ ' + (err.response?.data?.message || 'Failed'))
    } finally {
      setRemovingMember(null)
    }

    refreshAiIfLoaded()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F2027] flex items-center justify-center">
        <BG />
        <div className="flex flex-col items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-full border-2 border-[rgba(62,224,127,0.2)] border-t-[#3EE07F] animate-spin" />
          <span className="text-[13px] text-[#7BAF8E]">Loading project...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0F2027] flex items-center justify-center">
        <BG />
        <div className="relative z-10 text-center p-8 rounded-2xl bg-gradient-to-br from-[#162B1E] to-[#0F2027] border border-red-500/20">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => navigate(getProjectListPath(routePrefix))}
            className="px-5 py-2 rounded-xl text-[13px] font-semibold bg-[#28623A] text-[#F0FAF4]"
          >
            ← Back
          </button>
        </div>
      </div>
    )
  }

  const s = STATUS_CFG[project.status] || STATUS_CFG.PLANNING
  const daysLeft = project.end_date ? Math.ceil((new Date(project.end_date) - new Date()) / 86400000) : null
  const duration = project.start_date && project.end_date ? Math.ceil((new Date(project.end_date) - new Date(project.start_date)) / 86400000) : null
  const timelinePct = duration && daysLeft !== null ? Math.min(100, Math.max(0, ((duration - daysLeft) / duration) * 100)) : 0
  const isManager = currentUserRole === 'PROJECT_MANAGER' || currentUserRole === 'ADMIN'

  return (
    <div className="min-h-screen font-sans bg-[#0F2027]">
      <BG />

      <div className="relative z-10 max-w-[1050px] mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <button
            onClick={() => navigate(getProjectListPath(routePrefix))}
            className="text-[13px] font-medium text-[#7BAF8E] hover:text-[#F0FAF4] transition-colors"
          >
            ← Back to Projects
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            {toast && (
              <span className={`px-4 py-2 rounded-full text-[12px] font-semibold border ${toast.startsWith('✓') ? 'bg-[#3EE07F]/10 text-[#3EE07F] border-[#3EE07F]/25' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                {toast}
              </span>
            )}

            {isManager && (
              <button
                onClick={fetchAiInsights}
                className="px-4 py-2 rounded-xl text-[12px] font-semibold bg-yellow-400/10 text-yellow-400 border border-yellow-400/25 hover:bg-yellow-400/20 transition-colors"
              >
                {aiBusy ? 'Loading AI...' : '⚡ AI Insights'}
              </button>
            )}

            <button
              onClick={() => navigate(buildProjectTasksPath(routePrefix, id))}
              className="px-4 py-2 rounded-xl text-[12px] font-semibold bg-[#3EE07F]/10 text-[#3EE07F] border border-[#3EE07F]/25 hover:bg-[#3EE07F]/20 transition-colors"
            >
              ◫ View Tasks →
            </button>

            <button
              onClick={() => navigate(buildProjectMilestonesPath(routePrefix, id))}
              className="px-4 py-2 rounded-xl text-[12px] font-semibold bg-blue-400/10 text-blue-400 border border-blue-400/25 hover:bg-blue-400/20 transition-colors"
            >
              ⬡ Milestones →
            </button>

            <button
              onClick={() => navigate(buildProjectSkillsPath(routePrefix, id))}
              className="px-4 py-2 rounded-xl text-[12px] font-semibold bg-yellow-400/10 text-yellow-400 border border-yellow-400/25 hover:bg-yellow-400/20 transition-colors"
            >
              ◈ Skills →
            </button>

            {isManager && (
              <button
                onClick={() => navigate(buildProjectDashboardPath(routePrefix, id))}
                className="px-4 py-2 rounded-xl text-xs font-semibold transition-all text-purple-400 bg-purple-400/10 border border-purple-400/25 hover:bg-purple-400/18"
              >
                📊 Dashboard →
              </button>
            )}

            {isManager && (
              <button
                onClick={() => setEditMode(e => !e)}
                className={`px-4 py-2 rounded-xl text-[12px] font-semibold border transition-colors ${editMode ? 'bg-[#3EE07F]/10 text-[#3EE07F] border-[#3EE07F]/25' : 'bg-[rgba(40,98,58,0.15)] text-[#7BAF8E] border-[rgba(40,98,58,0.3)] hover:text-[#F0FAF4]'}`}
              >
                {editMode ? '✕ Cancel' : '✎ Edit Project'}
              </button>
            )}

            {isManager && (
              <button
                onClick={() => setShowDel(true)}
                className="px-4 py-2 rounded-xl text-[12px] font-semibold bg-red-400/10 text-red-400 border border-red-400/20 hover:bg-red-400/15 transition-colors"
              >
                🗑 Delete
              </button>
            )}
          </div>
        </div>

        <Card className="mb-6">
          {!editMode ? (
            <div>
              <div className="flex items-start gap-5 flex-wrap">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-[24px] font-bold shrink-0 border ${s.bg} ${s.border} ${s.text}`}>
                  {project.name[0]?.toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    <h1 className="font-bold text-[24px] text-[#F0FAF4]">{project.name}</h1>
                    <span className={`text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${s.text} ${s.bg} ${s.border}`}>
                      {s.icon} {s.label}
                    </span>
                    {project.ai_success_score != null && (
                      <span className="text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-yellow-400/10 text-yellow-400 border border-yellow-400/25">
                        ⚡ AI Score: {project.ai_success_score}%
                      </span>
                    )}
                  </div>

                  <p className={`text-[14px] leading-relaxed max-w-[600px] ${project.description ? 'text-[rgba(240,250,244,0.75)]' : 'text-[rgba(123,175,142,0.4)]'}`}>
                    {project.description || 'No description provided'}
                  </p>
                </div>

                {daysLeft !== null && (
                  <div className="shrink-0 text-right">
                    <div className="text-[10px] uppercase tracking-widest mb-1 text-[#7BAF8E]">Deadline</div>
                    <div className={`text-[22px] font-bold ${dlText(daysLeft)}`}>{Math.abs(daysLeft)}d</div>
                    <div className={`text-[10px] ${dlText(daysLeft)}`}>{daysLeft < 0 ? 'Overdue' : 'remaining'}</div>
                  </div>
                )}
              </div>

              {project.start_date && project.end_date && (
                <div className="mt-5">
                  <div className="flex justify-between text-[11px] mb-2 text-[#7BAF8E]">
                    <span>{new Date(project.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <span>{duration} day project</span>
                    <span>{new Date(project.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>

                  <div className="h-2 rounded-full overflow-hidden bg-[rgba(40,98,58,0.2)]">
                    <ProgressBar percent={timelinePct} fillClass={daysLeft < 0 ? 'fill-red-400' : 'fill-[#3EE07F]'} />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-2 rounded-full animate-pulse bg-[#3EE07F]" />
                <span className="text-[11px] font-semibold uppercase tracking-widest text-[#3EE07F]">Editing Project</span>
              </div>

              <Field
                label="Project Name"
                required
                value={form.name}
                placeholder="Project name"
                onChange={e => set('name', e.target.value)}
              />

              <Field
                label="Description"
                rows={3}
                value={form.description}
                placeholder="Project description"
                onChange={e => set('description', e.target.value)}
              />

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] mb-2 text-[#7BAF8E]">Status</label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(STATUS_CFG).map(([key, cfg]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => set('status', key)}
                      className={`py-2 rounded-xl text-[10px] font-bold uppercase tracking-wide transition-all border ${form.status === key ? `${cfg.bg} ${cfg.text} ${cfg.border}` : 'bg-[rgba(15,32,39,0.6)] text-[#7BAF8E] border-[rgba(40,98,58,0.3)]'}`}
                    >
                      {cfg.icon} {cfg.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Field label="Start Date" type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} />
                <Field label="End Date" type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)} />
                <Field label="Budget (₹)" type="number" value={form.budget} placeholder="e.g. 500000" onChange={e => set('budget', e.target.value)} />
              </div>

              <div className="flex gap-3 justify-end pt-1">
                <button
                  onClick={() => setEditMode(false)}
                  className="px-5 py-2.5 rounded-xl text-[12px] font-medium text-[#7BAF8E] border border-[rgba(40,98,58,0.3)] hover:text-[#F0FAF4] transition-colors"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSave}
                  disabled={saving || !form.name}
                  className="px-7 py-2.5 rounded-xl text-[12px] font-semibold bg-gradient-to-br from-[#28623A] to-[#1A4D2E] text-[#F0FAF4] border border-[#3EE07F]/20 hover:shadow-[0_6px_20px_rgba(62,224,127,0.18)] transition-all disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes →'}
                </button>
              </div>
            </div>
          )}
        </Card>

        <div className="grid grid-cols-3 gap-5 mb-6">
          {[
            { label: 'Team Members', value: project.team_members?.length || 0, colorClass: 'text-[#3EE07F]', icon: '👥' },
            { label: 'Budget', value: project.budget ? `₹${project.budget.toLocaleString('en-IN')}` : '—', colorClass: 'text-blue-400', icon: '💰' },
            { label: 'AI Score', value: project.ai_success_score != null ? `${project.ai_success_score}%` : 'Pending', colorClass: 'text-yellow-400', icon: '⚡' },
          ].map(chip => (
            <Card key={chip.label} className="!p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[18px] bg-[rgba(40,98,58,0.2)] border border-[rgba(40,98,58,0.3)]">
                  {chip.icon}
                </div>
                <div>
                  <div className={`text-[20px] font-bold ${chip.colorClass}`}>{chip.value}</div>
                  <div className="text-[10px] uppercase tracking-wide text-[#7BAF8E]">{chip.label}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-5">
          <Card>
            <SectionTitle>Project Details</SectionTitle>
            <div className="space-y-2">
              <InfoRow label="Status" value={`${s.icon} ${s.label}`} colorClass={s.text} />
              <InfoRow label="Created By" value={project.created_by?.username} />
              <InfoRow label="Project Manager" value={project.project_manager?.username} />
              <InfoRow label="Start Date" value={project.start_date ? new Date(project.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : null} />
              <InfoRow label="End Date" value={project.end_date ? new Date(project.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : null} />
              <InfoRow label="Duration" value={duration ? `${duration} days` : null} />
              <InfoRow label="Budget" value={project.budget ? `₹${project.budget.toLocaleString('en-IN')}` : null} colorClass="text-blue-400" />
              <InfoRow label="AI Success Score" value={project.ai_success_score != null ? `${project.ai_success_score}%` : 'Not calculated'} colorClass="text-yellow-400" />
            </div>
          </Card>

          <div className="space-y-5">
            <Card>
              <SectionTitle action={isManager ? (
                <button
                  onClick={() => { setMemberPicker(p => !p); setMemberSearch('') }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-colors border ${memberPicker ? 'bg-[#3EE07F]/15 text-[#3EE07F] border-[#3EE07F]/30' : 'bg-[rgba(40,98,58,0.15)] text-[#7BAF8E] border-[rgba(40,98,58,0.3)] hover:text-[#F0FAF4]'}`}
                >
                  {memberPicker ? '✕ Cancel' : '+ Add Member'}
                </button>
              ) : null}>
                Team Members ({project.team_members?.length || 0})
              </SectionTitle>

              {isManager && memberPicker && (
                <div className="mb-4 p-4 rounded-xl bg-[rgba(40,98,58,0.06)] border border-[rgba(40,98,58,0.3)]">
                  <div className="relative mb-3">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-[#7BAF8E]">🔍</span>
                    <input
                      autoFocus
                      value={memberSearch}
                      onChange={e => setMemberSearch(e.target.value)}
                      placeholder="Search members..."
                      className="w-full pl-8 pr-4 py-2 rounded-xl text-[12px] bg-[rgba(15,32,39,0.85)] border border-[rgba(40,98,58,0.3)] focus:border-[rgba(62,224,127,0.4)] text-[#F0FAF4] outline-none"
                    />
                  </div>

                  <div className="max-h-52 overflow-y-auto space-y-1.5">
                    {allMembers
                      .filter(u => {
                        const notInTeam = !project.team_members?.find(m => (m._id || m).toString() === u._id.toString())
                        const matchSearch = !memberSearch || u.username.toLowerCase().includes(memberSearch.toLowerCase()) || u.email.toLowerCase().includes(memberSearch.toLowerCase())
                        return notInTeam && matchSearch
                      })
                      .map(u => (
                        <div
                          key={u._id}
                          onClick={() => !addingMember && handleAddMember(u._id, u.username)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer bg-[rgba(15,32,39,0.4)] border border-[rgba(40,98,58,0.3)] hover:bg-[rgba(62,224,127,0.06)] hover:border-[rgba(62,224,127,0.25)] transition-colors"
                        >
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 bg-gradient-to-br from-[#28623A] to-[#3EE07F] text-[#0F2027]">
                            {u.username[0].toUpperCase()}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="text-[12px] font-semibold text-[#F0FAF4] truncate">{u.username}</div>
                            <div className="text-[10px] text-[#7BAF8E] truncate">{u.email}</div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className={`text-[11px] font-bold ${capText(u.current_capacity_percentage || 0)}`}>{u.current_capacity_percentage || 0}%</div>
                            <div className="text-[9px] text-[#7BAF8E]">load</div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="text-[11px] font-bold text-[#3EE07F]">{u.skills?.length || 0}</div>
                            <div className="text-[9px] text-[#7BAF8E]">skills</div>
                          </div>
                        </div>
                      ))}

                    {allMembers.filter(u => !project.team_members?.find(m => (m._id || m).toString() === u._id.toString())).length === 0 && (
                      <p className="text-[12px] text-center py-4 text-[#7BAF8E]">All members already added</p>
                    )}

                    {allMembers.length === 0 && (
                      <p className="text-[12px] text-center py-4 text-[#7BAF8E]">No members found</p>
                    )}
                  </div>
                </div>
              )}

              {!project.team_members?.length ? (
                <div className="text-center py-6">
                  <p className="text-[13px] text-[#7BAF8E]">No members assigned yet</p>
                  <p className="text-[11px] mt-1 text-[rgba(123,175,142,0.4)]">Click "+ Add Member" to build your team</p>
                </div>
              ) : project.team_members.map(m => {
                const memberId = (m._id || m)?.toString()
                const username = m.username || '...'
                const capacity = m.current_capacity_percentage || 0
                const isRemoving = removingMember === memberId

                return (
                  <div key={memberId} className="flex items-center gap-3 p-3 rounded-xl mb-2 group bg-[rgba(40,98,58,0.08)] border border-[rgba(40,98,58,0.3)] hover:border-[rgba(62,224,127,0.2)] transition-colors">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[12px] font-bold shrink-0 bg-gradient-to-br from-[#28623A] to-[#3EE07F] text-[#0F2027]">
                      {username[0]?.toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold text-[#F0FAF4]">{username}</div>
                      {m.email && <div className="text-[10px] text-[#7BAF8E]">{m.email}</div>}
                    </div>

                    {m._id && (
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="w-16 h-1.5 rounded-full overflow-hidden bg-[rgba(40,98,58,0.2)]">
                          <ProgressBar percent={capacity} fillClass={capacity >= 85 ? 'fill-red-400' : capacity >= 65 ? 'fill-yellow-400' : 'fill-[#3EE07F]'} />
                        </div>
                        <span className={`text-[10px] font-bold w-7 text-right ${capText(capacity)}`}>{capacity}%</span>
                      </div>
                    )}

                    {isManager && (
                      <button
                        onClick={() => openRecommendationModal({ memberId, priority: 'MEDIUM' })}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-semibold text-blue-400 bg-blue-400/10 border border-blue-400/20 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        Recommend
                      </button>
                    )}

                    {isManager && (
                      <button
                        onClick={() => handleRemoveMember(memberId, username)}
                        disabled={isRemoving}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[12px] opacity-0 group-hover:opacity-100 text-red-400/50 hover:text-red-400 hover:bg-red-400/10 transition-all"
                      >
                        {isRemoving ? '...' : '✕'}
                      </button>
                    )}
                  </div>
                )
              })}
            </Card>

            <Card>
              <SectionTitle action={isManager ? (
                <button
                  onClick={() => { setSkillPicker(p => !p); setSelSkill(null); setSkillSearch('') }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-colors border ${skillPicker ? 'bg-yellow-400/15 text-yellow-400 border-yellow-400/30' : 'bg-[rgba(40,98,58,0.15)] text-[#7BAF8E] border-[rgba(40,98,58,0.3)] hover:text-[#F0FAF4]'}`}
                >
                  {skillPicker ? '✕ Cancel' : '+ Add Skill'}
                </button>
              ) : null}>
                Required Skills
              </SectionTitle>

              {isManager && skillPicker && (
                <div className="mb-4 p-4 rounded-xl bg-[rgba(40,98,58,0.06)] border border-[rgba(40,98,58,0.3)]">
                  <div className="relative mb-3">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-[#7BAF8E]">🔍</span>
                    <input
                      autoFocus
                      value={skillSearch}
                      onChange={e => setSkillSearch(e.target.value)}
                      placeholder="Search skills..."
                      className="w-full pl-8 pr-4 py-2 rounded-xl text-[12px] bg-[rgba(15,32,39,0.85)] border border-[rgba(40,98,58,0.3)] focus:border-[rgba(62,224,127,0.4)] text-[#F0FAF4] outline-none"
                    />
                  </div>

                  <div className="max-h-44 overflow-y-auto space-y-1.5 mb-3">
                    {allSkills
                      .filter(s => !skillSearch || s.name.toLowerCase().includes(skillSearch.toLowerCase()))
                      .filter(s => !project.required_skills?.find(r => r.skill_id === s._id || r.skill_id?._id === s._id))
                      .slice(0, 20)
                      .map(s => (
                        <div
                          key={s._id}
                          onClick={() => setSelSkill(selSkill?._id === s._id ? null : s)}
                          className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-colors border ${selSkill?._id === s._id ? 'bg-yellow-400/10 border-yellow-400/35' : 'bg-[rgba(15,32,39,0.4)] border-[rgba(40,98,58,0.3)] hover:bg-[rgba(62,224,127,0.04)]'}`}
                        >
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border ${selSkill?._id === s._id ? 'bg-yellow-400/20 border-yellow-400' : 'bg-[rgba(40,98,58,0.2)] border-[rgba(40,98,58,0.3)]'}`}>
                            {selSkill?._id === s._id && <span className="text-[9px] text-yellow-400">✓</span>}
                          </div>

                          <span className="text-[12px] font-medium flex-1 text-[#F0FAF4]">{s.name}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-yellow-400/10 text-yellow-400">
                            {s.category}
                          </span>
                        </div>
                      ))}

                    {allSkills.length === 0 && (
                      <p className="text-[12px] text-center py-4 text-[#7BAF8E]">No skills in taxonomy yet.</p>
                    )}
                  </div>

                  {selSkill && (
                    <div className="pt-3 border-t border-[rgba(40,98,58,0.2)]">
                      <p className="text-[11px] mb-2 text-[#7BAF8E]">
                        Min proficiency for <span className="text-yellow-400 font-bold">{selSkill.name}</span>:
                      </p>

                      <div className="grid grid-cols-4 gap-2 mb-3">
                        {Object.entries(PROF_CFG).map(([key, cfg]) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setSelProf(key)}
                            className={`py-2 rounded-xl text-[10px] font-bold uppercase tracking-wide transition-all border ${selProf === key ? `${cfg.bg} ${cfg.text} ${cfg.border}` : 'bg-[rgba(15,32,39,0.6)] text-[#7BAF8E] border-[rgba(40,98,58,0.3)]'}`}
                          >
                            {key}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={handleAddRequiredSkill}
                        disabled={addingSkill}
                        className="w-full py-2.5 rounded-xl text-[12px] font-semibold bg-gradient-to-br from-[#28623A] to-[#1A4D2E] text-[#F0FAF4] border border-[#3EE07F]/20 hover:shadow-[0_6px_20px_rgba(62,224,127,0.18)] transition-all disabled:opacity-50"
                      >
                        {addingSkill ? 'Adding...' : `Add "${selSkill.name}" (${selProf}) →`}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {!project.required_skills?.length ? (
                <div className="text-center py-6">
                  <p className="text-[13px] text-[#7BAF8E]">No skills defined yet</p>
                  <p className="text-[11px] mt-1 text-[rgba(123,175,142,0.4)]">Click "+ Add Skill" to define requirements</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {project.required_skills.map(rs => {
                    const cfg = PROF_CFG[rs.required_proficiency] || PROF_CFG.INTERMEDIATE

                    return (
                      <div key={rs._id} className="flex items-center gap-3 px-4 py-3 rounded-xl group bg-[rgba(40,98,58,0.08)] border border-[rgba(40,98,58,0.3)] hover:border-[rgba(62,224,127,0.2)] transition-colors">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-bold shrink-0 ${cfg.bg} ${cfg.text}`}>
                          {(rs.skill_name || '?')[0]}
                        </div>

                        <span className="text-[13px] font-semibold flex-1 text-[#F0FAF4]">{rs.skill_name || 'Unknown skill'}</span>

                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${cfg.text} ${cfg.bg} ${cfg.border}`}>
                          {rs.required_proficiency || 'INTERMEDIATE'}+
                        </span>

                        {isManager && (
                          <button
                            onClick={() => handleRemoveRequiredSkill(rs._id, rs.skill_name)}
                            disabled={removingSkill === rs._id}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-[12px] opacity-0 group-hover:opacity-100 text-red-400/50 hover:text-red-400 hover:bg-red-400/10 transition-all"
                          >
                            {removingSkill === rs._id ? '...' : '✕'}
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5 mt-6">
          <Card className="col-span-2">
            <SectionTitle>Project Chat</SectionTitle>

            {chatLoading ? (
              <p className="text-[12px] text-[#7BAF8E]">Loading messages...</p>
            ) : !chatMessages.length ? (
              <div className="text-center py-6">
                <p className="text-[13px] text-[#F0FAF4]">No messages yet</p>
                <p className="text-[11px] mt-1 text-[rgba(123,175,142,0.5)]">Start the conversation with your project team.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1 mb-4">
                {chatMessages.map(msg => {
                  const mine = currentUser?._id && msg.sender?._id?.toString() === currentUser._id.toString()
                  return (
                    <div
                      key={msg._id}
                      className={`p-3 rounded-xl border ${mine ? 'bg-[#3EE07F]/10 border-[#3EE07F]/20' : 'bg-[rgba(40,98,58,0.08)] border-[rgba(40,98,58,0.3)]'}`}
                    >
                      <div className="flex items-center justify-between gap-3 mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold bg-gradient-to-br from-[#28623A] to-[#3EE07F] text-[#0F2027]">
                            {(msg.sender?.username || '?')[0].toUpperCase()}
                          </div>
                          <span className="text-[12px] font-semibold text-[#F0FAF4]">
                            {msg.sender?.username || 'Unknown'}
                          </span>
                        </div>
                        <span className="text-[10px] text-[rgba(123,175,142,0.5)]">
                          {new Date(msg.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <p className="text-[12px] leading-relaxed text-[rgba(240,250,244,0.78)]">
                        {msg.content.split(/(@\w+)/g).map((part, i) =>
                          part.startsWith('@')
                            ? <span key={i} className="text-[#3EE07F] font-semibold">{part}</span>
                            : <span key={i}>{part}</span>
                        )}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}

            <form onSubmit={handleSendChatMessage} className="flex gap-2">
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Send a message... @mention someone"
                className="flex-1 rounded-xl px-3 py-2.5 text-[12px] outline-none bg-[rgba(15,32,39,0.85)] border border-[rgba(40,98,58,0.3)] text-[#F0FAF4]"
              />
              <button
                type="submit"
                disabled={chatSending || !chatInput.trim()}
                className="px-4 py-2.5 rounded-xl text-[11px] font-semibold bg-gradient-to-br from-[#28623A] to-[#1A4D2E] text-[#F0FAF4] border border-[#3EE07F]/20 disabled:opacity-50"
              >
                {chatSending ? 'Sending...' : 'Send'}
              </button>
            </form>
          </Card>

          <Card>
            <SectionTitle>Smart Team Assembly</SectionTitle>

            {aiError && (
              <p className="text-[12px] text-red-400 mb-3">{aiError}</p>
            )}

            {!teamAssembly.length ? (
  <p className="text-[12px] text-[#7BAF8E]">
    Run AI Insights to generate recommended team compositions.
  </p>
) : (
  <div className="space-y-3">
    {teamAssembly
      .filter(rec => !rejectedStrategies.includes(rec.strategy))
      .map(rec => (
        <div
          key={rec.strategy}
          className="p-4 rounded-xl bg-[rgba(40,98,58,0.08)] border border-[rgba(40,98,58,0.3)]"
        >
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <div className="text-[13px] font-bold text-[#F0FAF4]">{rec.title}</div>
              <div className="text-[11px] text-[#7BAF8E]">{rec.justification}</div>
            </div>
            <div className="text-right">
              <div className="text-[18px] font-bold text-yellow-400">{rec.coverage_pct}%</div>
              <div className="text-[9px] text-[#7BAF8E]">coverage</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-2">
            {rec.suggested_team.map(member => (
              <span
                key={member._id}
                className="text-[10px] font-semibold px-2 py-1 rounded-full bg-[#3EE07F]/10 text-[#3EE07F]"
              >
                {member.username}
              </span>
            ))}
          </div>

          <div className="text-[10px] text-[#7BAF8E] mb-3">
            Team size {rec.team_size} • Avg capacity {rec.average_capacity_pct}% • Avg performance {rec.average_performance_score}
          </div>

          {isManager && (
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => handleAcceptAiTeam(rec)}
                disabled={applyingTeam}
                className="px-3 py-1.5 rounded-lg text-[10px] font-semibold bg-[#3EE07F]/10 text-[#3EE07F] border border-[#3EE07F]/20 disabled:opacity-50"
              >
                Accept Team
              </button>

              <button
                onClick={() => handleModifyAiTeam(rec)}
                disabled={applyingTeam}
                className="px-3 py-1.5 rounded-lg text-[10px] font-semibold bg-blue-400/10 text-blue-400 border border-blue-400/20 disabled:opacity-50"
              >
                Modify Team
              </button>

              <button
                onClick={() => handleRejectAiTeam(rec.strategy)}
                disabled={applyingTeam}
                className="px-3 py-1.5 rounded-lg text-[10px] font-semibold bg-red-400/10 text-red-400 border border-red-400/20 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          )}
        </div>
      ))}

    {!teamAssembly.filter(rec => !rejectedStrategies.includes(rec.strategy)).length && (
      <p className="text-[12px] text-[#7BAF8E]">
        All AI suggestions were rejected. Run AI Insights again to regenerate them.
      </p>
    )}
  </div>
)}


          </Card>

          <Card>
            <SectionTitle>Skill Gap Analysis</SectionTitle>

            {!skillGap ? (
              <p className="text-[12px] text-[#7BAF8E]">
                Run AI Insights to evaluate skill coverage and learning recommendations.
              </p>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <InfoRow label="Coverage" value={`${skillGap.coverage_pct}%`} colorClass="text-yellow-400" />
                  <InfoRow label="Covered" value={skillGap.covered_count} colorClass="text-[#3EE07F]" />
                  <InfoRow label="Missing" value={skillGap.missing_count} colorClass="text-red-400" />
                </div>

                {skillGap.report.map(item => (
                  <div
                    key={item.skill_name}
                    className="p-3 rounded-xl bg-[rgba(40,98,58,0.08)] border border-[rgba(40,98,58,0.3)]"
                  >
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <div className="text-[12px] font-semibold text-[#F0FAF4]">{item.skill_name}</div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.priority === 'HIGH'
                            ? 'text-red-400 bg-red-400/10'
                            : item.priority === 'MEDIUM'
                              ? 'text-yellow-400 bg-yellow-400/10'
                              : 'text-[#7BAF8E] bg-[#7BAF8E]/10'
                        }`}>
                          {item.priority || 'MEDIUM'} Priority
                        </span>
                        <div className={`text-[10px] font-bold ${item.covered ? 'text-[#3EE07F]' : item.status === 'UNDER_COVERED' ? 'text-yellow-400' : 'text-red-400'}`}>
                          {item.status}
                        </div>
                      </div>
                    </div>

                    {!!item.recommendations?.length && (
                      <div className="space-y-1.5">
                        <div className="text-[11px] text-[#7BAF8E]">
                          {item.recommendations[0].reason || 'Action recommended for this skill.'}
                        </div>
                        {item.recommendations[0].course_name && (
                          item.recommendations[0].course_url ? (
                            <a
                              href={item.recommendations[0].course_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex text-[11px] font-semibold text-blue-400 hover:underline"
                            >
                              Course: {item.recommendations[0].course_name}
                            </a>
                          ) : (
                            <div className="text-[11px] font-semibold text-blue-400">
                              Course: {item.recommendations[0].course_name}
                            </div>
                          )
                        )}
                      </div>
                    )}

                    {isManager && !!project.team_members?.length && (
                      <div className="flex gap-2 flex-wrap mt-3">
                        <button
                          onClick={() => openRecommendationModal({
                            memberId: item.under_proficient_members?.[0]?.user_id || '',
                            skillName: item.skill_name,
                            targetLevel: item.required_proficiency || 'BEGINNER',
                            reason: item.recommendations?.[0]?.reason || `Improve ${item.skill_name} coverage for this project.`,
                            courseName: item.recommendations?.[0]?.course_name || '',
                            courseUrl: item.recommendations?.[0]?.course_url || '',
                            priority: item.recommendations?.[0]?.priority || item.priority || (item.status === 'MISSING' ? 'HIGH' : 'MEDIUM'),
                          })}
                          className="px-3 py-1.5 rounded-lg text-[10px] font-semibold bg-blue-400/10 text-blue-400 border border-blue-400/20"
                        >
                          Recommend Learning
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="mt-5 flex items-center justify-between px-4 py-3 rounded-xl bg-[rgba(40,98,58,0.06)] border border-[rgba(40,98,58,0.3)]">
          <div className="text-[11px] text-[rgba(123,175,142,0.5)]">
            Project ID: <span className="font-mono">{project._id}</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-[rgba(123,175,142,0.5)]">
            <span>Created: {new Date(project.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            <span>Updated: {new Date(project.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
        </div>
      </div>

      <RecommendationModal
        open={recModalOpen}
        onClose={resetRecommendationForm}
        members={project?.team_members || []}
        form={recForm}
        setForm={setRecForm}
        onMemberChange={handleRecommendationMemberChange}
        onSubmit={handleSendRecommendation}
        saving={recSaving}
      />

            <TeamReviewModal
        open={reviewTeamOpen}
        onClose={() => setReviewTeamOpen(false)}
        reviewMembers={reviewMembers}
        setReviewMembers={setReviewMembers}
        allMembers={allMembers}
        onSave={handleSaveReviewedTeam}
        saving={applyingTeam}
      />

      {showDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-[rgba(10,26,18,0.88)] backdrop-blur-sm">
          <div className="w-full max-w-[400px] rounded-2xl p-7 relative bg-gradient-to-br from-[#1E1212] to-[#0F2027] border border-red-500/20 shadow-[0_32px_80px_rgba(15,32,39,0.95)]">
            <div className="absolute top-0 left-10 right-10 h-px rounded-full bg-gradient-to-r from-transparent via-red-400/30 to-transparent" />
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-[22px] mb-4 bg-red-400/10 border border-red-400/20">🗑</div>
            <h3 className="font-bold text-[17px] mb-2 text-[#F0FAF4]">Delete Project?</h3>
            <p className="text-[14px] font-semibold mb-4 text-red-400">"{project.name}"</p>
            <p className="text-[11px] mb-6 text-[rgba(123,175,142,0.6)]">
              This action cannot be undone. All project data will be permanently removed.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDel(false)}
                className="flex-1 py-2.5 rounded-xl text-[12px] font-medium text-[#7BAF8E] border border-[rgba(40,98,58,0.3)] hover:text-[#F0FAF4] transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-[12px] font-semibold bg-red-400/10 text-red-400 border border-red-400/25 hover:bg-red-400/20 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
