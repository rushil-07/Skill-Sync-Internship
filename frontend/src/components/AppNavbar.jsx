import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import NotificationBell from './NotificationBell'
import { useNotifications } from '../hooks/useNotifications'

const API = 'http://localhost:3000'

const ROLE_NAV = {
    MEMBER: [
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Messages',  path: '/messages'  },
        { label: 'Profile',   path: '/profile'   },
    ],
    PROJECT_MANAGER: [
        { label: 'Dashboard', path: '/pm/dashboard'  },
        { label: 'Messages',  path: '/messages'      },
        { label: 'Projects',  path: '/pm/projects'   },
        { label: 'Profile',   path: '/pm/profile'    },
    ],
    ADMIN: [
        { label: 'Dashboard', path: '/admin/dashboard' },
        { label: 'Messages',  path: '/messages'        },
        { label: 'Users',     path: '/admin/dashboard' },
        { label: 'Skills',    path: '/admin/skills'    },
        { label: 'Profile',   path: '/admin/profile'   },
    ],
}

export default function AppNavbar({ currentUser = null }) {
    const navigate  = useNavigate()
    const location  = useLocation()
    const [user,    setUser]    = useState(currentUser)
    const [menuOpen,setMenuOpen]= useState(false)
    const [searchInput, setSearchInput] = useState('')

    // Fetch once if not passed as prop (fallback for pages not wrapped in AuthLayout)
    useEffect(() => {
        if (currentUser) { setUser(currentUser); return }
        axios.get(`${API}/api/profile/me`, { withCredentials: true })
            .then(r => setUser(r.data.user))
            .catch(() => {})
    }, [currentUser])

    useEffect(() => {
        const params = new URLSearchParams(location.search)
        setSearchInput(location.pathname === '/search' ? (params.get('q') || '') : '')
    }, [location.pathname, location.search])

    const {
        notifications, unreadCount,
        markRead, markAllRead, clearAll,
    } = useNotifications(user?._id)

    const handleLogout = async () => {
        try {
            await axios.post(`${API}/api/auth/logout`, {}, { withCredentials: true })
        } catch {}
        navigate('/login')
    }

    const handleSearchSubmit = (e) => {
        e.preventDefault()
        const q = searchInput.trim()
        if (!q) {
            navigate('/search')
            return
        }
        navigate(`/search?q=${encodeURIComponent(q)}`)
    }

    const links = ROLE_NAV[user?.role] || []
    const isActive = (path) => location.pathname === path ||
                               location.pathname.startsWith(path + '/')

    return (
        <nav className="fixed top-0 left-0 right-0 z-40 border-b border-[#28623A]/20 bg-[rgba(15,32,39,0.92)] backdrop-blur-md">
            <div className="max-w-[1200px] mx-auto px-6 h-14 flex items-center justify-between gap-6">

                {/* ── Logo ── */}
                <button onClick={() => navigate(links[0]?.path || '/dashboard')}
                    className="flex items-center gap-0 shrink-0">
                    <span className="text-xl font-semibold text-[#F0FAF4] tracking-wide">Skill</span>
                    <span className="text-xl text-emerald-400">Sync</span>
                </button>

                {/* ── Links ── */}
                <div className="hidden md:flex items-center gap-1 flex-1">
                    {links.map(link => (
                        <button key={link.path} onClick={() => navigate(link.path)}
                            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all
                                        ${isActive(link.path)
                                            ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20'
                                            : 'text-[#7BAF8E] hover:text-[#F0FAF4] hover:bg-[#28623A]/20'
                                        }`}>
                            {link.label}
                        </button>
                    ))}
                </div>

                {/* ── Right side ── */}
                <form onSubmit={handleSearchSubmit} className="hidden lg:block flex-1 max-w-[300px]">
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#7BAF8E]">⌕</span>
                        <input
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Search projects, tasks, people..."
                            className="w-full rounded-xl border border-[#28623A]/30 bg-[rgba(15,32,39,0.85)] py-2 pl-8 pr-3 text-sm text-[#F0FAF4] outline-none"
                        />
                    </div>
                </form>

                <div className="flex items-center gap-2 shrink-0">

                    {/* Notification Bell */}
                    {user && (
                        <NotificationBell
                            notifications={notifications}
                            unreadCount={unreadCount}
                            onMarkRead={markRead}
                            onMarkAllRead={markAllRead}
                            onClearAll={clearAll}
                            role={user?.role}
                        />
                    )}

                    {/* User menu */}
                    {user && (
                        <div className="relative">
                            <button
                                onClick={() => setMenuOpen(o => !o)}
                                className="flex items-center gap-2 pl-1 pr-3 py-1.5 rounded-xl
                                           hover:bg-[#28623A]/20 transition-all">
                                {/* Avatar */}
                                <div className="ss-avatar w-7 h-7 overflow-hidden rounded-lg flex items-center justify-center text-[11px] font-bold">
                                    {user.profile_picture_url
                                        ? <img src={user.profile_picture_url} alt={user.username}
                                               className="w-full h-full object-cover" />
                                        : user.username?.slice(0, 2).toUpperCase()
                                    }
                                </div>
                                <span className="text-sm font-medium text-[#F0FAF4] hidden sm:block">
                                    {user.username}
                                </span>
                                <span className="text-[#7BAF8E] text-xs">▾</span>
                            </button>

                            {menuOpen && (
                                <div className="absolute right-0 top-11 w-48 overflow-hidden rounded-xl border border-[#3EE07F]/13 bg-[linear-gradient(160deg,_#162B1E,_#0F2027)] shadow-[0_16px_48px_rgba(15,32,39,0.9)]">
                                    {/* Role badge */}
                                    <div className="px-4 py-2.5 border-b border-[#28623A]/30">
                                        <p className="text-xs text-[#7BAF8E]">{user.email}</p>
                                        <span className="text-[10px] font-bold uppercase tracking-widest
                                                         text-emerald-400 bg-emerald-400/10
                                                         px-2 py-0.5 rounded-full mt-1 inline-block">
                                            {user.role === 'PROJECT_MANAGER' ? 'PM' : user.role}
                                        </span>
                                    </div>
                                    {[
                                        { label: 'My Profile', path: user.role === 'ADMIN' ? '/admin/profile' : user.role === 'PROJECT_MANAGER' ? '/pm/profile' : '/profile' },
                                        { label: 'Messages', path: '/messages' },
                                        { label: 'Notifications', path: '/notifications' },
                                    ].map(item => (
                                        <button key={item.path}
                                            onClick={() => { navigate(item.path); setMenuOpen(false) }}
                                            className="w-full text-left px-4 py-2.5 text-sm text-[#7BAF8E]
                                                       hover:text-[#F0FAF4] hover:bg-[#28623A]/20
                                                       transition-all flex items-center justify-between">
                                            {item.label}
                                            {item.label === 'Notifications' && unreadCount > 0 && (
                                                <span className="text-[10px] font-bold px-1.5 py-0.5
                                                                 rounded-full bg-red-500 text-white">
                                                    {unreadCount}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                    <div className="border-t border-[#28623A]/30">
                                        <button onClick={handleLogout}
                                            className="w-full text-left px-4 py-2.5 text-sm
                                                       text-red-400/70 hover:text-red-400
                                                       hover:bg-red-400/10 transition-all">
                                            Sign out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </nav>
    )
}
