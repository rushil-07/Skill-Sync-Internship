import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { io } from 'socket.io-client'
import axios from 'axios'

const API = 'http://localhost:3000'

const BG = () => (
  <>
    <div className="ss-radial-top fixed inset-0 pointer-events-none" />
    <div className="ss-grid-overlay fixed inset-0 pointer-events-none opacity-[0.03]" />
  </>
)

const fmtTime = (date) => new Date(date).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

const Avatar = ({ user, small = false }) => (
  <div className={`ss-avatar overflow-hidden rounded-xl flex items-center justify-center font-bold ${small ? 'h-9 w-9 text-[11px]' : 'h-11 w-11 text-[12px]'}`}>
    {user?.profile_picture_url
      ? <img src={user.profile_picture_url} alt={user.username} className="h-full w-full object-cover" />
      : (user?.username || '?').slice(0, 2).toUpperCase()}
  </div>
)

export default function MessagesPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [currentUser, setCurrentUser] = useState(null)
  const [conversations, setConversations] = useState([])
  const [thread, setThread] = useState([])
  const [threadUser, setThreadUser] = useState(null)
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [threadLoading, setThreadLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [showPicker, setShowPicker] = useState(false)
  const [pickerQuery, setPickerQuery] = useState('')
  const [pickerLoading, setPickerLoading] = useState(false)
  const [pickerResults, setPickerResults] = useState([])

  const selectedUserId = params.get('user') || ''

  const selectedConversation = useMemo(
    () => conversations.find(c => String(c.other_user?._id) === selectedUserId) || null,
    [conversations, selectedUserId]
  )

  useEffect(() => {
    let active = true

    const fetchConversations = async () => {
      setLoading(true)
      try {
        const res = await axios.get(`${API}/api/messages/conversations`, { withCredentials: true })
        if (!active) return
        setCurrentUser(res.data.current_user)
        setConversations(res.data.conversations || [])
      } catch (err) {
        if (!active) return
        if (err.response?.status === 401) navigate('/login')
        else setError(err.response?.data?.message || 'Failed to load conversations.')
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchConversations()
    return () => { active = false }
  }, [navigate])

  useEffect(() => {
    if (!currentUser?._id) return

    const socket = io(API, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    })

    socket.on('connect', () => {
      socket.emit('join', currentUser._id)
    })

    socket.on('direct_message', (incoming) => {
      const senderId = String(incoming.sender_id?._id || incoming.sender_id)
      const recipientId = String(incoming.recipient_id?._id || incoming.recipient_id)
      const otherUser = senderId === String(currentUser._id) ? incoming.recipient_id : incoming.sender_id

      setConversations(prev => {
        const existing = prev.find(c => String(c.other_user?._id) === String(otherUser?._id))
        if (existing) {
          return prev
            .map(c => String(c.other_user?._id) === String(otherUser?._id)
              ? {
                  ...c,
                  other_user: otherUser,
                  last_message: incoming,
                  unread_count: recipientId === String(currentUser._id) && String(otherUser?._id) !== selectedUserId
                    ? (c.unread_count || 0) + 1
                    : c.unread_count,
                }
              : c)
            .sort((a, b) => new Date(b.last_message.created_at) - new Date(a.last_message.created_at))
        }

        return [{
          other_user: otherUser,
          last_message: incoming,
          unread_count: recipientId === String(currentUser._id) ? 1 : 0,
        }, ...prev]
      })

      if (String(otherUser?._id) === selectedUserId) {
        setThread(prev => [...prev, incoming])
      }
    })

    return () => socket.disconnect()
  }, [currentUser?._id, selectedUserId])

  useEffect(() => {
    if (!selectedUserId) {
      setThread([])
      setThreadUser(null)
      return
    }

    let active = true
    const fetchThread = async () => {
      setThreadLoading(true)
      try {
        const res = await axios.get(`${API}/api/messages/${selectedUserId}`, { withCredentials: true })
        if (!active) return
        setThread(res.data.messages || [])
        setThreadUser(res.data.other_user || null)
        setConversations(prev => prev.map(c => String(c.other_user?._id) === selectedUserId ? { ...c, unread_count: 0 } : c))
      } catch (err) {
        if (!active) return
        setError(err.response?.data?.message || 'Failed to load this conversation.')
      } finally {
        if (active) setThreadLoading(false)
      }
    }

    fetchThread()
    return () => { active = false }
  }, [selectedUserId])

  const openConversation = (userId) => {
    const next = new URLSearchParams(params)
    next.set('user', userId)
    setParams(next)
    setShowPicker(false)
    setPickerQuery('')
    setPickerResults([])
  }

  useEffect(() => {
    if (!showPicker) return

    if (!pickerQuery.trim()) {
      setPickerResults([])
      return
    }

    let active = true
    const timer = setTimeout(async () => {
      setPickerLoading(true)
      try {
        const res = await axios.get(`${API}/api/search/global`, {
          params: { q: pickerQuery.trim(), type: 'users' },
          withCredentials: true,
        })
        if (!active) return
        setPickerResults((res.data.results?.users || []).filter(user => String(user._id) !== String(currentUser?._id)))
      } catch {
        if (active) setPickerResults([])
      } finally {
        if (active) setPickerLoading(false)
      }
    }, 250)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [showPicker, pickerQuery, currentUser?._id])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!selectedUserId || !draft.trim()) return

    setSending(true)
    try {
      const res = await axios.post(
        `${API}/api/messages/${selectedUserId}`,
        { content: draft.trim() },
        { withCredentials: true }
      )
      const message = res.data.message
      setDraft('')
      setThread(prev => [...prev, message])
      setConversations(prev => {
        const otherUser = message.recipient_id
        const existing = prev.find(c => String(c.other_user?._id) === selectedUserId)
        if (existing) {
          return prev
            .map(c => String(c.other_user?._id) === selectedUserId ? { ...c, last_message: message } : c)
            .sort((a, b) => new Date(b.last_message.created_at) - new Date(a.last_message.created_at))
        }
        return [{
          other_user: otherUser,
          last_message: message,
          unread_count: 0,
        }, ...prev]
      })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message.')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="ss-bg-app min-h-screen flex items-center justify-center">
        <BG />
        <div className="relative z-10 flex flex-col items-center gap-3">
          <div className="ss-spinner h-10 w-10 animate-spin rounded-full border-2" />
          <span className="text-[13px] text-[#7BAF8E]">Loading messages...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="ss-bg-app min-h-screen font-sans">
      <BG />

      <div className="relative z-10 mx-auto max-w-[1180px] px-6 py-8">
        <div className="mb-6">
          <h1 className="mb-1 text-[24px] font-bold text-[#F0FAF4]">Direct Messages</h1>
          <p className="text-[13px] text-[#7BAF8E]">Private conversations with teammates and managers.</p>
        </div>

        {error && (
          <div className="ss-error-box mb-4 rounded-xl px-4 py-3 text-[12px]">
            {error}
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[340px,1fr]">
          <div className="ss-card overflow-hidden rounded-2xl">
            <div className="border-b border-[rgba(40,98,58,0.3)] px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[13px] font-bold uppercase tracking-[0.16em] text-[#F0FAF4]">Inbox</h2>
                <button
                  onClick={() => setShowPicker(prev => !prev)}
                  className="ss-btn-accent rounded-lg px-3 py-1.5 text-[11px] font-semibold"
                >
                  + New Message
                </button>
              </div>
            </div>

            {showPicker && (
              <div className="space-y-3 border-b border-[rgba(40,98,58,0.3)] bg-[rgba(40,98,58,0.08)] p-4">
                <input
                  value={pickerQuery}
                  onChange={e => setPickerQuery(e.target.value)}
                  placeholder="Search teammate or user..."
                  className="ss-input-field w-full rounded-xl px-4 py-3 text-[13px]"
                />

                {pickerLoading ? (
                  <p className="text-[12px] text-[#7BAF8E]">Searching people...</p>
                ) : !pickerQuery.trim() ? (
                  <p className="text-[12px] text-[#7BAF8E]">Type a name, email, or skill to find someone.</p>
                ) : !pickerResults.length ? (
                  <p className="text-[12px] text-[#7BAF8E]">No matching users found.</p>
                ) : (
                  <div className="space-y-2">
                    {pickerResults.map(user => (
                      <button
                        key={user._id}
                        onClick={() => openConversation(user._id)}
                        className="w-full rounded-xl border border-[rgba(40,98,58,0.3)] bg-[rgba(15,32,39,0.48)] p-3 text-left"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar user={user} small />
                          <div className="min-w-0">
                            <div className="truncate text-[12px] font-semibold text-[#F0FAF4]">{user.username}</div>
                            <div className="truncate text-[11px] text-[#7BAF8E]">{user.email}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!conversations.length ? (
              <div className="p-6 text-[12px] text-[#7BAF8E]">
                No conversations yet. Start one with the New Message button.
              </div>
            ) : (
              <div>
                {conversations.map(conversation => (
                  <button
                    key={conversation.other_user._id}
                    onClick={() => openConversation(conversation.other_user._id)}
                    className={[
                      'w-full border-b border-[rgba(40,98,58,0.3)] px-4 py-4 text-left transition-all',
                      String(conversation.other_user._id) === selectedUserId ? 'bg-[rgba(62,224,127,0.08)]' : 'bg-transparent',
                    ].join(' ')}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar user={conversation.other_user} small />
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <span className="truncate text-[13px] font-semibold text-[#F0FAF4]">
                            {conversation.other_user.username}
                          </span>
                          {conversation.unread_count > 0 && (
                            <span className="rounded-full bg-[rgba(62,224,127,0.12)] px-2 py-0.5 text-[10px] font-bold text-[#3EE07F]">
                              {conversation.unread_count}
                            </span>
                          )}
                        </div>
                        <p className="truncate text-[11px] text-[#7BAF8E]">{conversation.last_message?.content}</p>
                        <p className="mt-1 text-[10px] text-[rgba(123,175,142,0.5)]">
                          {conversation.last_message?.created_at ? fmtTime(conversation.last_message.created_at) : ''}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="ss-card min-h-[68vh] overflow-hidden rounded-2xl">
            {selectedUserId && (threadUser || selectedConversation?.other_user) ? (
              <>
                <div className="flex items-center gap-3 border-b border-[rgba(40,98,58,0.3)] px-5 py-4">
                  <Avatar user={threadUser || selectedConversation?.other_user} />
                  <div>
                    <div className="text-[14px] font-semibold text-[#F0FAF4]">{(threadUser || selectedConversation?.other_user)?.username}</div>
                    <div className="text-[11px] text-[#7BAF8E]">{(threadUser || selectedConversation?.other_user)?.role?.replace('_', ' ')}</div>
                  </div>
                </div>

                <div className="space-y-3 p-5">
                  {threadLoading ? (
                    <p className="text-[12px] text-[#7BAF8E]">Loading conversation...</p>
                  ) : !thread.length ? (
                    <p className="text-[12px] text-[#7BAF8E]">No messages yet. Say hello.</p>
                  ) : (
                    thread.map(message => {
                      const mine = String(message.sender_id?._id || message.sender_id) === String(currentUser?._id)
                      return (
                        <div key={message._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={[
                              'max-w-[72%] rounded-2xl border px-4 py-3',
                              mine
                                ? 'border-[rgba(62,224,127,0.25)] bg-[rgba(62,224,127,0.14)]'
                                : 'border-[rgba(40,98,58,0.3)] bg-[rgba(40,98,58,0.14)]',
                            ].join(' ')}
                          >
                            <p className="text-[13px] leading-relaxed text-[#F0FAF4]">{message.content}</p>
                            <p className="mt-2 text-[10px] text-[#7BAF8E]">{fmtTime(message.created_at)}</p>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                <form onSubmit={handleSend} className="flex gap-3 border-t border-[rgba(40,98,58,0.3)] p-4">
                  <input
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    placeholder={`Message ${(threadUser || selectedConversation?.other_user)?.username}...`}
                    className="ss-input-field flex-1 rounded-xl px-4 py-3 text-[13px]"
                  />
                  <button
                    type="submit"
                    disabled={sending || !draft.trim()}
                    className="ss-btn-primary rounded-xl px-5 py-3 text-[12px] font-semibold disabled:opacity-50"
                  >
                    {sending ? 'Sending...' : 'Send'}
                  </button>
                </form>
              </>
            ) : (
              <div className="flex h-full flex-1 flex-col items-center justify-center px-8 text-center">
                <div className="mb-3 text-[42px]">💭</div>
                <h2 className="mb-2 text-[18px] font-bold text-[#F0FAF4]">Pick a conversation</h2>
                <p className="text-[13px] text-[#7BAF8E]">
                  Select someone from your inbox, or click New Message to start a conversation.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
