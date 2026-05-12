import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { normalizeProjectLinkForRole } from '../utils/roleRoutes'

const TYPE_CFG = {
    TASK_ASSIGNED: { icon: '✓', color: 'text-emerald-400',  bg: 'bg-emerald-400/10'  },
    MENTION:       { icon: '@', color: 'text-blue-400',     bg: 'bg-blue-400/10'     },
    COMMENT:       { icon: '💬', color: 'text-yellow-400',  bg: 'bg-yellow-400/10'   },
    DEADLINE:      { icon: '⏰', color: 'text-red-400',     bg: 'bg-red-400/10'      },
    STATUS_CHANGED:{ icon: '⬡', color: 'text-purple-400',  bg: 'bg-purple-400/10'   },
    PROJECT_JOINED:{ icon: '◫', color: 'text-emerald-400', bg: 'bg-emerald-400/10'  },
    ALERT:         { icon: '⚠', color: 'text-red-400',     bg: 'bg-red-400/10'      },
}

function timeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000)
    if (seconds < 60)   return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400)return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
}

export default function NotificationBell({ notifications, unreadCount, onMarkRead, onMarkAllRead, onClearAll, role }) {
    const [open, setOpen]   = useState(false)
    const dropdownRef       = useRef(null)
    const navigate          = useNavigate()

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const handleClick = (notif) => {
        if (!notif.is_read) onMarkRead(notif._id)
        if (notif.link) {
            navigate(normalizeProjectLinkForRole(notif.link, role))
            setOpen(false)
        }
    }

    const preview = notifications.slice(0, 8)

    return (
        <div className="relative" ref={dropdownRef}>

            {/* ── Bell button ── */}
            <button
                onClick={() => setOpen(o => !o)}
                className="relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200
                           hover:bg-[#28623A]/30 focus:outline-none"
                aria-label="Notifications">
                {/* Bell icon */}
                <svg className="w-5 h-5 text-[#7BAF8E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>

                {/* Unread badge */}
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1
                                     bg-red-500 text-white text-[10px] font-bold rounded-full
                                     flex items-center justify-center leading-none">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* ── Dropdown ── */}
            {open && (
                <div className="absolute right-0 top-12 z-50 w-[360px] overflow-hidden rounded-2xl border border-[#3EE07F]/13 bg-[linear-gradient(160deg,_#162B1E_0%,_#0F2027_60%)] shadow-[0_24px_80px_rgba(15,32,39,0.9)]">

                    {/* Top glow line */}
                    <div className="mx-auto h-px w-3/4 bg-[linear-gradient(90deg,transparent,rgba(62,224,127,0.3),transparent)]" />

                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3
                                    border-b border-[#28623A]/30">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-[#F0FAF4]">Notifications</span>
                            {unreadCount > 0 && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full
                                                 bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
                                    {unreadCount} new
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button onClick={onMarkAllRead}
                                    className="text-[11px] font-semibold text-[#7BAF8E]
                                               hover:text-[#3EE07F] transition-colors">
                                    Mark all read
                                </button>
                            )}
                            {notifications.length > 0 && (
                                <button onClick={onClearAll}
                                    className="text-[11px] font-semibold text-[#7BAF8E]/60
                                               hover:text-red-400 transition-colors">
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>

                    {/* List */}
                    <div className="max-h-[420px] overflow-y-auto">
                        {preview.length === 0
                            ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-[#28623A]/20
                                                    flex items-center justify-center text-2xl">
                                        🔔
                                    </div>
                                    <p className="text-sm text-[#7BAF8E]">No notifications yet</p>
                                </div>
                            )
                            : preview.map(notif => {
                                const cfg = TYPE_CFG[notif.type] || TYPE_CFG.ALERT
                                return (
                                    <div
                                        key={notif._id}
                                        onClick={() => handleClick(notif)}
                                        className={`flex items-start gap-3 px-4 py-3 cursor-pointer
                                                    border-b border-[#28623A]/20 transition-all duration-150
                                                    hover:bg-[#28623A]/10
                                                    ${!notif.is_read ? 'bg-[#28623A]/08' : ''}`}>

                                        {/* Type icon */}
                                        <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center
                                                         text-sm font-bold ${cfg.bg} ${cfg.color}`}>
                                            {cfg.icon}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className={`text-[12px] font-semibold leading-snug
                                                               ${!notif.is_read ? 'text-[#F0FAF4]' : 'text-[#7BAF8E]'}`}>
                                                    {notif.title}
                                                </p>
                                                {!notif.is_read && (
                                                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 mt-1" />
                                                )}
                                            </div>
                                            <p className="text-[11px] text-[#7BAF8E] mt-0.5 leading-snug line-clamp-2">
                                                {notif.message}
                                            </p>
                                            <p className="text-[10px] text-[#7BAF8E]/50 mt-1">
                                                {timeAgo(notif.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                )
                            })
                        }
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="border-t border-[#28623A]/30">
                            <button
                                onClick={() => { navigate('/notifications'); setOpen(false) }}
                                className="w-full py-3 text-[12px] font-semibold text-[#7BAF8E]
                                           hover:text-[#3EE07F] transition-colors text-center">
                                View all notifications →
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
