import { useState, useEffect, useCallback, useRef } from 'react'
import { io } from 'socket.io-client'
import axios from 'axios'

const API = 'http://localhost:3000'

export function useNotifications(userId) {
    const [notifications, setNotifications] = useState([])
    const [unreadCount,   setUnreadCount]   = useState(0)
    const [loading,       setLoading]       = useState(true)
    const socketRef = useRef(null)

    // ── Initial fetch ─────────────────────────────────────────────────────────
    const fetchNotifications = useCallback(async () => {
        if (!userId) return
        try {
            const res = await axios.get(`${API}/api/notifications?limit=40`, { withCredentials: true })
            setNotifications(res.data.notifications || [])
            setUnreadCount(res.data.unread_count    || 0)
        } catch (err) {
            console.error('fetchNotifications error:', err)
        } finally {
            setLoading(false)
        }
    }, [userId])

    // ── Socket connection ─────────────────────────────────────────────────────
    useEffect(() => {
        if (!userId) return

        fetchNotifications()

        const socket = io(API, {
            withCredentials: true,
            transports: ['websocket', 'polling'],
        })

        socket.on('connect', () => {
            socket.emit('join', userId)
        })

        // New notification pushed from server
        socket.on('notification', (notif) => {
            setNotifications(prev => [notif, ...prev])
            setUnreadCount(prev => prev + 1)
        })

        socket.on('connect_error', (err) => {
            console.warn('Socket connect error:', err.message)
        })

        socketRef.current = socket

        return () => {
            socket.disconnect()
            socketRef.current = null
        }
    }, [userId])

    // ── Mark one read ─────────────────────────────────────────────────────────
    const markRead = useCallback(async (id) => {
        try {
            await axios.put(`${API}/api/notifications/${id}/read`, {}, { withCredentials: true })
            setNotifications(prev =>
                prev.map(n => n._id === id ? { ...n, is_read: true } : n)
            )
            setUnreadCount(prev => Math.max(0, prev - 1))
        } catch (err) {
            console.error('markRead error:', err)
        }
    }, [])

    // ── Mark all read ─────────────────────────────────────────────────────────
    const markAllRead = useCallback(async () => {
        try {
            await axios.put(`${API}/api/notifications/read-all`, {}, { withCredentials: true })
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
            setUnreadCount(0)
        } catch (err) {
            console.error('markAllRead error:', err)
        }
    }, [])

    // ── Delete one ────────────────────────────────────────────────────────────
    const deleteOne = useCallback(async (id) => {
        try {
            await axios.delete(`${API}/api/notifications/${id}`, { withCredentials: true })
            setNotifications(prev => {
                const notif = prev.find(n => n._id === id)
                if (notif && !notif.is_read) setUnreadCount(c => Math.max(0, c - 1))
                return prev.filter(n => n._id !== id)
            })
        } catch (err) {
            console.error('deleteOne error:', err)
        }
    }, [])

    // ── Clear all ─────────────────────────────────────────────────────────────
    const clearAll = useCallback(async () => {
        try {
            await axios.delete(`${API}/api/notifications`, { withCredentials: true })
            setNotifications([])
            setUnreadCount(0)
        } catch (err) {
            console.error('clearAll error:', err)
        }
    }, [])

    return {
        notifications,
        unreadCount,
        loading,
        markRead,
        markAllRead,
        deleteOne,
        clearAll,
        refetch: fetchNotifications,
    }
}