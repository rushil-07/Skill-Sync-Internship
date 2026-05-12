import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../hooks/useNotifications'
import { normalizeProjectLinkForRole } from '../utils/roleRoutes'
import axios from 'axios'

const API = 'http://localhost:3000'

const TYPE_CFG = {
    TASK_ASSIGNED: { icon: '✓', label: 'Task Assigned',   color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
    MENTION:       { icon: '@', label: 'Mention',         color: 'text-blue-400',    bg: 'bg-blue-400/10',    border: 'border-blue-400/20'    },
    COMMENT:       { icon: '💬',label: 'Comment',         color: 'text-yellow-400',  bg: 'bg-yellow-400/10',  border: 'border-yellow-400/20'  },
    DEADLINE:      { icon: '⏰',label: 'Deadline',        color: 'text-red-400',     bg: 'bg-red-400/10',     border: 'border-red-400/20'     },
    STATUS_CHANGED:{ icon: '⬡', label: 'Status Changed',  color: 'text-purple-400',  bg: 'bg-purple-400/10',  border: 'border-purple-400/20'  },
    PROJECT_JOINED:{ icon: '◫', label: 'Project Joined',  color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
    ALERT:         { icon: '⚠', label: 'Alert',           color: 'text-red-400',     bg: 'bg-red-400/10',     border: 'border-red-400/20'     },
}

const FILTERS = ['ALL', 'UNREAD', 'TASK_ASSIGNED', 'MENTION', 'COMMENT', 'ALERT']

const PREFERENCE_ORDER = [
    'TASK_ASSIGNED',
    'MENTION',
    'COMMENT',
    'DEADLINE',
    'STATUS_CHANGED',
    'PROJECT_JOINED',
    'ALERT',
    'PROJECT_MATCH',
    'PROJECT_INTEREST',
    'PROJECT_CHAT',
]

function timeAgo(date) {
    const s = Math.floor((new Date() - new Date(date)) / 1000)
    if (s < 60)    return 'just now'
    if (s < 3600)  return `${Math.floor(s / 60)}m ago`
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`
    return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function NotificationsPage({ userId, role }) {
    const navigate  = useNavigate()
    const [filter, setFilter] = useState('ALL')
    const [preferences, setPreferences] = useState({})
    const [prefSaving, setPrefSaving] = useState('')

    const {
        notifications, unreadCount, loading,
        markRead, markAllRead, deleteOne, clearAll,
    } = useNotifications(userId)

    useEffect(() => {
        axios.get(`${API}/api/notifications/preferences`, { withCredentials: true })
            .then(res => setPreferences(res.data.preferences || {}))
            .catch(() => {})
    }, [])

    const filtered = notifications.filter(n => {
        if (filter === 'ALL')    return true
        if (filter === 'UNREAD') return !n.is_read
        return n.type === filter
    })

    const handleClick = (notif) => {
        if (!notif.is_read) markRead(notif._id)
        if (notif.link) navigate(normalizeProjectLinkForRole(notif.link, role))
    }

    const handleTogglePreference = async (type) => {
        const next = { ...preferences, [type]: !preferences[type] }
        setPreferences(next)
        setPrefSaving(type)
        try {
            const res = await axios.put(
                `${API}/api/notifications/preferences`,
                { preferences: next },
                { withCredentials: true }
            )
            setPreferences(res.data.preferences || next)
        } catch (err) {
            setPreferences(prev => ({ ...prev, [type]: !next[type] }))
        } finally {
            setPrefSaving('')
        }
    }

    if (loading) return (
        <div className="ss-bg-app min-h-screen flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-2 border-emerald-400/20 border-t-emerald-400
                                rounded-full animate-spin" />
                <span className="text-sm text-[#7BAF8E]">Loading notifications...</span>
            </div>
        </div>
    )

    return (
        <div className="ss-bg-app min-h-screen font-sans">

            {/* Background */}
            <div className="ss-radial-zero fixed inset-0 pointer-events-none" />
            <div className="ss-grid-overlay fixed inset-0 pointer-events-none opacity-[0.03]" />

            <div className="relative z-10 max-w-[720px] mx-auto px-6 py-10">

                {/* Header */}
                <div className="flex items-start justify-between mb-8">
                    <div>
                        <button onClick={() => navigate(-1)}
                            className="text-xs font-medium text-[#7BAF8E] hover:text-[#F0FAF4]
                                       transition-colors mb-2 block">
                            ← Back
                        </button>
                        <h1 className="text-2xl font-bold text-[#F0FAF4]">Notifications</h1>
                        <p className="text-sm text-[#7BAF8E] mt-1">
                            {unreadCount > 0
                                ? <span><span className="text-emerald-400 font-semibold">{unreadCount}</span> unread</span>
                                : 'All caught up'}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        {unreadCount > 0 && (
                            <button onClick={markAllRead}
                                className="px-4 py-2 rounded-xl text-xs font-semibold
                                           text-emerald-400 border border-emerald-400/25
                                           bg-emerald-400/10 hover:bg-emerald-400/18 transition-all">
                                ✓ Mark all read
                            </button>
                        )}
                        {notifications.length > 0 && (
                            <button onClick={clearAll}
                                className="px-4 py-2 rounded-xl text-xs font-semibold
                                           text-red-400 border border-red-400/25
                                           bg-red-400/10 hover:bg-red-400/18 transition-all">
                                🗑 Clear all
                            </button>
                        )}
                    </div>
                </div>

                {/* Filter pills */}
                <div className="flex gap-2 flex-wrap mb-6">
                    {FILTERS.map(f => {
                        const cfg = TYPE_CFG[f]
                        const count = f === 'ALL'    ? notifications.length
                                    : f === 'UNREAD' ? unreadCount
                                    : notifications.filter(n => n.type === f).length
                        return (
                            <button key={f} onClick={() => setFilter(f)}
                                className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold
                                            uppercase tracking-wide transition-all border
                                            ${filter === f
                                                ? `${cfg?.bg || 'bg-[#28623A]/25'} ${cfg?.color || 'text-emerald-400'} ${cfg?.border || 'border-emerald-400/40'}`
                                                : 'bg-[#0F2027]/50 text-[#7BAF8E] border-[#28623A]/30'
                                            }`}>
                                {f === 'ALL' ? `All (${count})` : f === 'UNREAD' ? `Unread (${count})` : `${cfg?.icon} ${cfg?.label} (${count})`}
                            </button>
                        )
                    })}
                </div>

                <div className="ss-card rounded-2xl p-5 mb-6">
                    <div className="flex items-start justify-between gap-3 mb-4">
                        <div>
                            <h2 className="text-sm font-bold text-[#F0FAF4]">Notification Preferences</h2>
                            <p className="text-xs text-[#7BAF8E] mt-1">
                                Choose which updates should keep reaching you.
                            </p>
                        </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-2">
                        {PREFERENCE_ORDER.map(type => {
                            const cfg = TYPE_CFG[type]
                            const enabled = preferences[type] !== false
                            return (
                                <button
                                    key={type}
                                    onClick={() => handleTogglePreference(type)}
                                    className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                                        enabled
                                            ? 'bg-[#28623A]/14 border-[#3EE07F]/18'
                                            : 'bg-[#0F2027]/55 border-[#28623A]/30'
                                    } ${prefSaving && prefSaving !== type ? 'opacity-60' : ''}`}
                                >
                                    <div>
                                        <div className={`text-[11px] font-bold uppercase tracking-wide ${cfg?.color || 'text-emerald-400'}`}>
                                            {cfg?.label || type.replaceAll('_', ' ')}
                                        </div>
                                        <div className="text-[11px] text-[#7BAF8E] mt-1">
                                            {enabled ? 'Enabled' : 'Muted'}
                                        </div>
                                    </div>
                                    <span
                                        className={`w-12 h-6 rounded-full p-1 transition-all ${
                                            enabled ? 'bg-[#3EE07F]/18' : 'bg-[#28623A]/35'
                                        }`}
                                    >
                                        <span
                                            className={`block w-4 h-4 rounded-full transition-all ${
                                                enabled
                                                    ? 'translate-x-6 bg-[#3EE07F]'
                                                    : 'translate-x-0 bg-[rgba(123,175,142,0.7)]'
                                            }`}
                                        />
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Notification list */}
                <div className="rounded-2xl overflow-hidden border border-[#3EE07F]/13 bg-[linear-gradient(160deg,_#162B1E_0%,_#0F2027_60%)] shadow-[0_0_0_1px_rgba(40,98,58,0.12),0_16px_48px_rgba(15,32,39,0.65)]">

                    <div className="mx-auto h-px w-3/4 bg-[linear-gradient(90deg,transparent,rgba(62,224,127,0.2),transparent)]" />

                    {filtered.length === 0
                        ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-[#28623A]/15
                                                flex items-center justify-center text-3xl">
                                    🔔
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-semibold text-[#F0FAF4]">No notifications</p>
                                    <p className="text-xs text-[#7BAF8E] mt-1">
                                        {filter === 'ALL' ? "You're all caught up!" : `No ${filter.toLowerCase().replace('_', ' ')} notifications`}
                                    </p>
                                </div>
                            </div>
                        )
                        : filtered.map((notif, i) => {
                            const cfg = TYPE_CFG[notif.type] || TYPE_CFG.ALERT
                            return (
                                <div key={notif._id}
                                     className={`flex items-start gap-4 px-5 py-4 cursor-pointer
                                                 transition-all duration-150 hover:bg-[#28623A]/10
                                                 ${i < filtered.length - 1 ? 'border-b border-[#28623A]/20' : ''}
                                                 ${!notif.is_read ? 'bg-[#28623A]/05' : ''}`}
                                     onClick={() => handleClick(notif)}>

                                    {/* Unread indicator */}
                                    <div className="flex flex-col items-center gap-2 shrink-0 pt-0.5">
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center
                                                         text-sm font-bold ${cfg.bg} ${cfg.color}
                                                         border ${cfg.border}`}>
                                            {cfg.icon}
                                        </div>
                                        {!notif.is_read && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                        )}
                                    </div>

                                    {/* Body */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className={`text-[11px] font-bold uppercase tracking-widest
                                                                       px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                                                        {cfg.label}
                                                    </span>
                                                </div>
                                                <p className={`text-sm font-semibold leading-snug
                                                               ${!notif.is_read ? 'text-[#F0FAF4]' : 'text-[#7BAF8E]'}`}>
                                                    {notif.title}
                                                </p>
                                                <p className="text-xs text-[#7BAF8E] mt-1 leading-relaxed">
                                                    {notif.message}
                                                </p>
                                                <p className="text-[10px] text-[#7BAF8E]/50 mt-1.5">
                                                    {timeAgo(notif.created_at)}
                                                </p>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-1 shrink-0">
                                                {!notif.is_read && (
                                                    <button
                                                        onClick={e => { e.stopPropagation(); markRead(notif._id) }}
                                                        className="w-7 h-7 rounded-lg flex items-center justify-center
                                                                   text-[#7BAF8E] hover:text-emerald-400
                                                                   hover:bg-emerald-400/10 transition-all text-xs"
                                                        title="Mark as read">
                                                        ✓
                                                    </button>
                                                )}
                                                <button
                                                    onClick={e => { e.stopPropagation(); deleteOne(notif._id) }}
                                                    className="w-7 h-7 rounded-lg flex items-center justify-center
                                                               text-[#7BAF8E]/40 hover:text-red-400
                                                               hover:bg-red-400/10 transition-all text-xs"
                                                    title="Delete">
                                                    ✕
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    }
                </div>

                <p className="text-center text-xs text-[#7BAF8E]/30 mt-6">
                    Showing {filtered.length} of {notifications.length} notifications
                </p>
            </div>
        </div>
    )
}
