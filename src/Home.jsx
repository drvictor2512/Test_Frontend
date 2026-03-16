import React, { useEffect, useState, useRef } from 'react'
import { io as socketIOClient } from 'socket.io-client'
import {
    getConversations, getMessages, getFriends, createConversation,
    searchUserByEmail, sendFriendRequest, getFriendRequests,
    getProfile, unfriend, getUserById, sendDirectMessage, sendGroupMessage,
    renameGroup, addGroupMember, removeGroupMember, assignDeputy,
    leaveGroup, recallMessage, markConversationRead, getGroupInviteLink,
    transferGroupOwnership, getBlockedUsers, getAIConversation, getAIMessages, clearAIMessages
} from './api'
import Sidebar from './components/Sidebar'
import ChatWindow from './components/ChatWindow'
import InfoPanel from './components/InfoPanel'
import Modals from './components/Modals'

const AI_BOT_ID = '000000000000000000000001'
const AI_BOT_NAME = 'Zting AI Chatbot'
const AI_BOT_AVATAR = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Google_Gemini_logo.svg/120px-Google_Gemini_logo.svg.png'
const AI_STREAM_ID = '__ai_streaming__'
const AI_WELCOME_MSG = {
    _id: '__ai_welcome__',
    content: `Xin chào! Tôi là ${AI_BOT_NAME} — trợ lý AI được tích hợp trong ứng dụng chat này.\n\nTôi có thể giúp bạn:\n📚 Hỗ trợ học tập — giải thích khái niệm, tóm tắt tài liệu, hướng dẫn bài tập\n💬 Tư vấn cuộc sống — lời khuyên tích cực về thói quen, sức khoẻ, mối quan hệ\n🖼️ Phân tích ảnh & file — gửi hình ảnh hoặc tài liệu để tôi phân tích\n\nHãy hỏi tôi bất cứ điều gì trong phạm vi trên! 😊`,
    senderId: { _id: AI_BOT_ID, name: AI_BOT_NAME, avatarUrl: AI_BOT_AVATAR },
    createdAt: new Date().toISOString(),
    _isWelcome: true,
}

export default function Home({ onLogout }) {
    // ── State ──────────────────────────────────────────────────────────────────
    const [showProfile, setShowProfile] = useState(false)
    const [conversations, setConversations] = useState([])
    const [selectedConv, setSelectedConv] = useState(null)
    const [messages, setMessages] = useState([])
    const [friends, setFriends] = useState([])
    const [currentUser, setCurrentUser] = useState(null)
    const [activePage, setActivePage] = useState('conversations')
    const [searchEmail, setSearchEmail] = useState('')
    const [searchResult, setSearchResult] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchMessage, setSearchMessage] = useState('')
    const [showAddFriendModal, setShowAddFriendModal] = useState(false)
    const [loading, setLoading] = useState(false)
    const [showCreateGroup, setShowCreateGroup] = useState(false)
    const [groupName, setGroupName] = useState('')
    const [selectedFriends, setSelectedFriends] = useState([])
    const [showGroupPanel, setShowGroupPanel] = useState(false)
    const [groupPanelConv, setGroupPanelConv] = useState(null)
    const [infoPanelCollapsed, setInfoPanelCollapsed] = useState({ members: false, media: false, files: false })
    const [showRenameModal, setShowRenameModal] = useState(false)
    const [renameInput, setRenameInput] = useState('')
    const [openMemberMenu, setOpenMemberMenu] = useState(null)
    const [friendsView, setFriendsView] = useState('list')
    const [friendRequests, setFriendRequests] = useState({ sent: [], receive: [] })
    const [profileUser, setProfileUser] = useState(null)
    const [showUserProfile, setShowUserProfile] = useState(false)
    const [pendingFile, setPendingFile] = useState(null)
    const [showFriendReqModal, setShowFriendReqModal] = useState(false)
    const [friendReqTarget, setFriendReqTarget] = useState(null)
    const [friendReqMsg, setFriendReqMsg] = useState('')
    const [showGifPicker, setShowGifPicker] = useState(false)
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const [showImageModal, setShowImageModal] = useState(false)
    const [imageModalUrl, setImageModalUrl] = useState(null)
    const [imageModalName, setImageModalName] = useState(null)
    const [showInviteModal, setShowInviteModal] = useState(false)
    const [inviteCode, setInviteCode] = useState('')
    const [showJoinModal, setShowJoinModal] = useState(false)
    const [joinCode, setJoinCode] = useState('')
    const [showTransferModal, setShowTransferModal] = useState(false)
    const [transferTarget, setTransferTarget] = useState('')
    const [transferConvId, setTransferConvId] = useState(null)
    const [onlineStatus, setOnlineStatus] = useState({})
    const [blockedUsers, setBlockedUsers] = useState([])
    const [blockedByOtherUserIds, setBlockedByOtherUserIds] = useState(new Set())
    const [aiTyping, setAiTyping] = useState(false)

    // ── Refs ───────────────────────────────────────────────────────────────────
    const socketRef = useRef(null)
    const selectedConvRef = useRef(null)
    const msgInput = useRef()
    const fileInputRef = useRef()
    const messagesEndRef = useRef()

    // ── Helpers ────────────────────────────────────────────────────────────────
    const otherParticipant = (participants) => {
        if (!participants || participants.length === 0) return null
        try {
            if (currentUser && currentUser._id) {
                return participants.find(p => String(p._id) !== String(currentUser._id)) || participants[0]
            }
        } catch (e) { }
        return participants[0]
    }

    const getStatus = (userId) => {
        if (!userId) return null
        return onlineStatus[String(userId)] || null
    }

    const formatRelative = (ts) => {
        if (!ts) return ''
        let t = null
        if (typeof ts === 'number') t = ts
        else if (typeof ts === 'string') { const p = Date.parse(ts); if (!isNaN(p)) t = p }
        else if (ts instanceof Date) t = ts.getTime()
        if (!t) return ''
        const diff = Date.now() - Number(t)
        if (diff < 1000 * 10) return 'vừa mới'
        const secs = Math.floor(diff / 1000)
        if (secs < 60) return `${secs} giây trước`
        const mins = Math.floor(secs / 60)
        if (mins < 60) return `${mins} phút trước`
        const hrs = Math.floor(mins / 60)
        if (hrs < 24) return `${hrs} giờ trước`
        const days = Math.floor(hrs / 24)
        if (days < 30) return `${days} ngày trước`
        const months = Math.floor(days / 30)
        if (months < 12) return `${months} tháng trước`
        return `${Math.floor(months / 12)} năm trước`
    }

    const openImageModal = (url) => {
        if (!url) return
        setImageModalUrl(url)
        try {
            const u = new URL(url)
            const parts = u.pathname.split('/')
            setImageModalName(decodeURIComponent(parts.pop() || parts.pop() || ''))
        } catch { setImageModalName(null) }
        setShowImageModal(true)
    }
    const closeImageModal = () => { setShowImageModal(false); setImageModalUrl(null); setImageModalName(null) }

    // ── Memos ──────────────────────────────────────────────────────────────────
    const filteredFriends = React.useMemo(() => {
        const q = (searchQuery || '').trim().toLowerCase()
        if (!q) return friends
        return friends.filter(f => (f.name || '').toLowerCase().includes(q) || (f.email || '').toLowerCase().includes(q))
    }, [friends, searchQuery])

    const filteredConversations = React.useMemo(() => {
        const q = (searchQuery || '').trim().toLowerCase()
        if (!q) return conversations
        return conversations.filter(conv => {
            if (conv.type === 'DIRECT') {
                const other = (conv.participants || []).find(p => String(p._id) !== String(conv._id))
                return (other?.name || '').toLowerCase().includes(q) || (other?.email || '').toLowerCase().includes(q)
            }
            if ((conv.groupName || conv.name || '').toLowerCase().includes(q)) return true
            return (conv.participants || []).some(p => (p.name || '').toLowerCase().includes(q))
        })
    }, [conversations, searchQuery])

    // ── Effects ────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    useEffect(() => {
        fetchConversations()
        fetchFriends()
        fetchFriendRequests()
        fetchCurrentUser()
        getBlockedUsers().then(res => setBlockedUsers((res.blockedUsers || []).map(u => String(u._id || u)))).catch(() => { })
    }, [])

    useEffect(() => {
        if (!currentUser) return
        try {
            const socket = socketIOClient('https://chatapp-backend-eiae.onrender.com')
            socketRef.current = socket
            socket.on('connect', () => socket.emit('join', { userId: currentUser._id }))

            socket.on('new_message', async (message) => {
                try {
                    if (!message || !message._id) return
                    try {
                        if (message.senderId && typeof message.senderId !== 'object') {
                            if (String(message.senderId) === String(currentUser?._id)) {
                                message.senderId = { _id: message.senderId, name: currentUser.name, avatarUrl: currentUser.avatarUrl }
                            } else if (message.senderName || message.senderAvatar) {
                                message.senderId = { _id: message.senderId, name: message.senderName || 'Người dùng', avatarUrl: message.senderAvatar }
                            } else {
                                message.senderId = { _id: message.senderId }
                            }
                        }
                    } catch (e) { }
                    setMessages(prev => {
                        if (prev.some(m => String(m._id) === String(message._id))) return prev
                        if (selectedConvRef.current && String(message.conversationId) === String(selectedConvRef.current._id)) return [...prev, message]
                        return prev
                    })
                    setConversations(prev => {
                        if (!message?.conversationId) return prev
                        const convId = String(message.conversationId)
                        const idx = prev.findIndex(c => String(c._id) === convId)
                        if (idx === -1) { fetchConversations().catch(() => { }); return prev }
                        const updated = [...prev]
                        const isActiveConv = selectedConvRef.current && String(selectedConvRef.current._id) === convId
                        const isOwnMessage = message.senderId && String(message.senderId._id || message.senderId) === String(currentUser?._id)
                        const prevUnread = updated[idx].unreadCounts || {}
                        const myKey = String(currentUser?._id)
                        const newUnread = (!isActiveConv && !isOwnMessage)
                            ? { ...prevUnread, [myKey]: (prevUnread[myKey] || 0) + 1 }
                            : prevUnread
                        const conv = { ...updated[idx], lastMessage: message, lastMessageAt: message.createdAt || new Date().toISOString(), unreadCounts: newUnread }
                        updated.splice(idx, 1)
                        updated.unshift(conv)
                        return updated
                    })
                } catch (e) { console.error('Error handling socket new_message', e) }
            })

            socket.on('user_status', (payload) => {
                try {
                    if (!payload?.userId) return
                    setOnlineStatus(prev => ({ ...prev, [String(payload.userId)]: { status: payload.status, lastSeen: payload.lastSeen } }))
                } catch (e) { }
            })

            socket.on('online_users', (data) => {
                try {
                    if (!data || !Array.isArray(data.users)) return
                    const map = {}
                    data.users.forEach(u => { if (u?.userId) map[String(u.userId)] = { status: u.status, lastSeen: u.lastSeen } })
                    setOnlineStatus(prev => ({ ...prev, ...map }))
                } catch (e) { }
            })

            socket.on('message_recalled', ({ messageId }) => {
                setMessages(prev => prev.map(m => String(m._id) === String(messageId) ? { ...m, isRecalled: true, content: null, fileUrl: null } : m))
            })

            socket.on('you_were_blocked', ({ blockerId }) => {
                if (!blockerId) return
                setBlockedByOtherUserIds(prev => { const next = new Set(prev); next.add(String(blockerId)); return next })
            })
            socket.on('you_were_unblocked', ({ unblockerId }) => {
                if (!unblockerId) return
                setBlockedByOtherUserIds(prev => { const next = new Set(prev); next.delete(String(unblockerId)); return next })
            })

            socket.on('friend_request', ({ request }) => {
                if (!request) return
                setFriendRequests(prev => ({
                    ...prev,
                    receive: prev.receive.some(r => String(r._id) === String(request._id)) ? prev.receive : [request, ...prev.receive]
                }))
            })
            socket.on('friend_accepted', ({ friend }) => {
                if (!friend) return
                setFriends(prev => prev.some(f => String(f._id) === String(friend._id)) ? prev : [...prev, friend])
            })
            socket.on('friend_declined', ({ requestId }) => {
                setFriendRequests(prev => ({ ...prev, sent: prev.sent.filter(r => String(r._id) !== String(requestId)) }))
            })
            socket.on('unfriended', ({ userId }) => {
                setFriends(prev => prev.filter(f => String(f._id) !== String(userId)))
            })

            socket.on('group_updated', async (payload) => {
                try {
                    await fetchConversations()
                    if (payload?.conversationId) {
                        if (payload.deleted) {
                            if (selectedConvRef.current && String(payload.conversationId) === String(selectedConvRef.current._id)) {
                                setSelectedConv(null); selectedConvRef.current = null; setMessages([])
                            }
                            setGroupPanelConv(prev => prev && String(prev._id) === String(payload.conversationId) ? null : prev)
                            setShowGroupPanel(false)
                        } else {
                            const fresh = (await getConversations()).conversations.find(c => String(c._id) === String(payload.conversationId))
                            if (fresh) {
                                if (selectedConvRef.current && String(payload.conversationId) === String(selectedConvRef.current._id)) {
                                    await fetchMessages(selectedConvRef.current)
                                    setSelectedConv(fresh); selectedConvRef.current = fresh
                                }
                                setGroupPanelConv(prev => prev && String(prev._id) === String(payload.conversationId) ? fresh : prev)
                            }
                        }
                    }
                } catch (e) { console.error('Error handling group_updated', e) }
            })

            socket.on('ai_user_message', ({ message } = {}) => {
                if (!message) return
                setMessages(prev => prev.some(m => String(m._id) === String(message._id)) ? prev : [...prev, message])
            })
            socket.on('ai_chunk', ({ text } = {}) => {
                if (!text) return
                setMessages(prev => {
                    const hasStreaming = prev.some(m => m._id === AI_STREAM_ID)
                    if (hasStreaming) return prev.map(m => m._id === AI_STREAM_ID ? { ...m, content: (m.content || '') + text } : m)
                    return [...prev, {
                        _id: AI_STREAM_ID, content: text,
                        senderId: { _id: AI_BOT_ID, name: AI_BOT_NAME, avatarUrl: AI_BOT_AVATAR },
                        conversationId: selectedConvRef.current?._id,
                        createdAt: new Date().toISOString(), _streaming: true,
                    }]
                })
            })
            socket.on('ai_done', ({ message } = {}) => {
                if (!message) return
                setMessages(prev => prev.map(m => m._id === AI_STREAM_ID ? { ...message, _streaming: false } : m))
                setAiTyping(false)
            })
            socket.on('ai_error', ({ message: errMsg } = {}) => {
                setMessages(prev => prev.filter(m => m._id !== AI_STREAM_ID))
                alert(errMsg || 'Lỗi AI')
                setAiTyping(false)
            })
        } catch (e) { console.error('Socket init failed', e) }
        return () => { try { socketRef.current?.disconnect() } catch (e) { } }
    }, [currentUser])

    // ── Data fetchers ──────────────────────────────────────────────────────────
    const fetchCurrentUser = async () => {
        try { const res = await getProfile(); setCurrentUser(res.user) } catch (err) { console.error(err) }
    }

    const fetchConversations = async () => {
        try {
            const res = await getConversations()
            const serverConvs = res.conversations || []
            setConversations(prev => serverConvs.map(sc => {
                const existing = prev.find(ec => String(ec._id) === String(sc._id))
                if (!existing) return sc
                const localUc = existing.unreadCounts || {}
                const serverUc = sc.unreadCounts || {}
                const mergedUc = { ...serverUc }
                Object.keys(localUc).forEach(key => { if ((localUc[key] || 0) > (mergedUc[key] || 0)) mergedUc[key] = localUc[key] })
                return { ...sc, unreadCounts: mergedUc }
            }))
            return serverConvs
        } catch (err) { console.error(err) }
    }

    const fetchMessages = async (conv) => {
        try {
            const res = conv.isAI ? await getAIMessages(conv._id) : await getMessages(conv._id)
            setMessages(res.messages || [])
        } catch (err) { console.error(err); setMessages([]) }
    }

    const fetchFriends = async () => {
        try { const res = await getFriends(); setFriends(res.friends || []) } catch (err) { console.error(err) }
    }

    const fetchFriendRequests = async () => {
        try {
            const res = await getFriendRequests()
            setFriendRequests({ sent: res.sent || [], receive: res.receive || [] })
        } catch (err) { console.error(err) }
    }

    // ── Conversation actions ───────────────────────────────────────────────────
    const openConversation = async (conv) => {
        try {
            const prev = selectedConvRef.current
            if (prev?._id && prev._id !== conv._id) {
                try { socketRef.current?.emit('leaveConversation', { conversationId: prev._id }) } catch (e) { }
            }
        } catch (e) { }
        setSelectedConv(conv); selectedConvRef.current = conv
        await fetchMessages(conv)
        try { await markConversationRead(conv._id) } catch (e) { }
        setConversations(prev => prev.map(c => {
            if (String(c._id) !== String(conv._id)) return c
            const uc = { ...(c.unreadCounts || {}) }
            if (currentUser?._id) uc[String(currentUser._id)] = 0
            return { ...c, unreadCounts: uc }
        }))
        try { socketRef.current?.emit('joinConversation', { conversationId: conv._id }) } catch (e) { }
    }

    const resolveUserDetails = async (userOrId) => {
        if (!userOrId) return null
        const id = typeof userOrId === 'string' || typeof userOrId === 'number' ? String(userOrId) : String(userOrId._id || userOrId.id)
        if (typeof userOrId === 'object' && (userOrId.name || userOrId.email)) {
            const hasFull = !!(userOrId.email && (userOrId.createdAt || userOrId.dateOfBirth || userOrId.bio || typeof userOrId.verified !== 'undefined'))
            if (hasFull) return userOrId
            if (id) { try { const res = await getUserById(id); if (res?.user) return res.user } catch { } }
            return userOrId
        }
        const fromFriends = friends.find(f => String(f._id) === id)
        if (fromFriends) return fromFriends
        for (const c of conversations) {
            const p = (c.participants || []).find(p => String(p._id) === id)
            if (p && (p.name || p.email || p.avatarUrl)) return p
        }
        for (const m of messages) {
            const s = m.senderId
            if (s && String(s._id) === id && (s.name || s.email)) return s
        }
        if (id) { try { const res = await getUserById(id); if (res?.user) return res.user } catch { } }
        if (userOrId.email) { try { const res = await searchUserByEmail(userOrId.email); return res.user || userOrId } catch { return userOrId } }
        return userOrId
    }

    const openUserProfile = async (user) => {
        if (!user) return
        const u = typeof user === 'string' || typeof user === 'number' ? { _id: user } : user
        const full = await resolveUserDetails(u)
        setProfileUser(full || u); setShowUserProfile(true)
    }

    const openDirectWithUser = async (userId) => {
        try {
            const existing = conversations.find(c =>
                c.type === 'DIRECT' && !c._isPending &&
                (c.participants || []).some(p => String(p._id) === String(userId))
            )
            if (existing) {
                setSelectedConv(existing); selectedConvRef.current = existing
                await fetchMessages(existing); setActivePage('conversations'); return
            }
            const userDetails = await resolveUserDetails({ _id: userId })
            const pendingConv = {
                _isPending: true, _pendingUserId: String(userId), type: 'DIRECT',
                participants: [
                    ...(currentUser ? [{ _id: String(currentUser._id), name: currentUser.name, avatarUrl: currentUser.avatarUrl }] : []),
                    { _id: String(userId), name: userDetails?.name || 'Người dùng', avatarUrl: userDetails?.avatarUrl || '' }
                ],
                lastMessage: null, lastMessageAt: null,
            }
            setSelectedConv(pendingConv); selectedConvRef.current = pendingConv; setMessages([]); setActivePage('conversations')
        } catch (err) { alert(err.message || 'Không thể mở cuộc trò chuyện') }
    }

    // ── Group management ───────────────────────────────────────────────────────
    const handleAddMember = async (conversationId, memberId) => {
        try {
            await addGroupMember({ conversationId, memberId })
            await fetchConversations()
            if (selectedConvRef.current && String(selectedConvRef.current._id) === String(conversationId)) {
                const fresh = (await getConversations()).conversations.find(c => String(c._id) === String(conversationId))
                if (fresh) { setSelectedConv(fresh); selectedConvRef.current = fresh }
            }
        } catch (err) { alert(err.message || 'Lỗi thêm thành viên') }
    }

    const handleRemoveMember = async (conversationId, memberId) => {
        if (!window.confirm('Bạn có chắc muốn xóa thành viên này khỏi nhóm?')) return
        try {
            await removeGroupMember({ conversationId, memberId })
            await fetchConversations()
            if (selectedConvRef.current && String(selectedConvRef.current._id) === String(conversationId)) {
                const fresh = (await getConversations()).conversations.find(c => String(c._id) === String(conversationId))
                if (fresh) { setSelectedConv(fresh); selectedConvRef.current = fresh }
            }
        } catch (err) { alert(err.message || 'Lỗi xóa thành viên') }
    }

    const handleToggleDeputy = async (conversationId, memberId, makeDeputy) => {
        try {
            await assignDeputy({ conversationId, memberId, action: makeDeputy ? 'assign' : 'remove' })
            await fetchConversations()
            if (selectedConvRef.current && String(selectedConvRef.current._id) === String(conversationId)) {
                const fresh = (await getConversations()).conversations.find(c => String(c._id) === String(conversationId))
                if (fresh) { setSelectedConv(fresh); selectedConvRef.current = fresh }
            }
        } catch (err) { alert(err.message || 'Lỗi cập nhật quyền') }
    }

    const handleLeaveGroup = async (conversationId) => {
        const conv = conversations.find(c => String(c._id) === String(conversationId)) || groupPanelConv
        if (conv) {
            const myPart = (conv.participants || []).find(p => String(p._id || p.userId) === String(currentUser?._id))
            if (myPart && myPart.role === 'Trưởng nhóm') {
                const others = (conv.participants || []).filter(p => String(p._id || p.userId) !== String(currentUser?._id))
                if (others.length === 0) return alert('Không có thành viên nào khác để chuyển quyền')
                setTransferConvId(conversationId)
                setTransferTarget(others[0]._id || others[0].userId || '')
                setShowTransferModal(true); return
            }
        }
        if (!window.confirm('Bạn có chắc muốn rời nhóm?')) return
        try {
            await leaveGroup({ conversationId })
            setConversations(prev => prev.filter(c => String(c._id) !== String(conversationId)))
            setGroupPanelConv(null); setShowGroupPanel(false)
            if (selectedConvRef.current && String(selectedConvRef.current._id) === String(conversationId)) {
                setSelectedConv(null); selectedConvRef.current = null; setMessages([])
            }
            fetchConversations()
        } catch (err) { alert(err.message || 'Lỗi khi rời nhóm') }
    }

    const submitRenameGroup = async () => {
        if (!selectedConv?._id) return
        const newName = (renameInput || '').trim()
        if (!newName) return alert('Tên không được rỗng')
        try {
            await renameGroup({ conversationId: selectedConv._id, name: newName })
            await fetchConversations()
            setSelectedConv(prev => prev ? ({ ...prev, groupName: newName, name: newName }) : prev)
            setShowRenameModal(false); alert('Đổi tên thành công')
        } catch (err) { alert(err.message || 'Lỗi khi đổi tên') }
    }

    const openAIChat = async () => {
        try {
            const res = await getAIConversation()
            const conv = res.conversation
            setSelectedConv(conv); selectedConvRef.current = conv
            try {
                const msgRes = await getAIMessages(conv._id)
                const msgs = msgRes.messages || []
                setMessages(msgs.length === 0 ? [{ ...AI_WELCOME_MSG, createdAt: new Date().toISOString() }] : msgs)
            } catch { setMessages([{ ...AI_WELCOME_MSG, createdAt: new Date().toISOString() }]) }
            setActivePage('conversations'); setShowGroupPanel(false)
        } catch (err) { alert(err.message || 'Không thể mở chat AI') }
    }

    const handleClearAI = async () => {
        if (!selectedConv?.isAI) return
        if (!window.confirm('Xóa toàn bộ lịch sử chat AI? Hành động này không thể hoàn tác.')) return
        try {
            await clearAIMessages(selectedConv._id)
            setMessages([{ ...AI_WELCOME_MSG, createdAt: new Date().toISOString() }])
        } catch (err) { alert(err.message || 'Lỗi khi làm mới cuộc trò chuyện') }
    }

    // ── Message actions ────────────────────────────────────────────────────────
    const sendMessage = async ({ content, file } = {}) => {
        if (!selectedConv) return alert('Chọn cuộc trò chuyện trước')
        if (!content && !file) return alert('Nhập nội dung hoặc chọn file')

        if (selectedConv.isAI) {
            if (!socketRef.current) return alert('Chưa kết nối socket')
            const token = localStorage.getItem('token')
            if (!token) return alert('Chưa đăng nhập')
            if (msgInput.current) msgInput.current.value = ''
            setAiTyping(true)
            const payload = { token, content: content || undefined }
            if (file) {
                const reader = new FileReader()
                reader.onload = () => {
                    payload.file = { data: reader.result.split(',')[1], mimeType: file.type }
                    socketRef.current.emit('ai_message', payload)
                }
                reader.onerror = () => { setAiTyping(false); alert('Không thể đọc file') }
                reader.readAsDataURL(file)
            } else { socketRef.current.emit('ai_message', payload) }
            return
        }

        let activeConv = selectedConv
        if (activeConv._isPending) {
            try {
                const created = await createConversation({ type: 'DIRECT', memberIds: [activeConv._pendingUserId] })
                const freshList = await fetchConversations()
                activeConv = (freshList || []).find(c => String(c._id) === String(created._id)) || created
                setSelectedConv(activeConv); selectedConvRef.current = activeConv
            } catch (err) { return alert(err.message || 'Không thể tạo cuộc trò chuyện') }
        }

        const form = new FormData()
        if (content) form.append('content', content)
        if (activeConv?._id) form.append('conversationId', activeConv._id)
        if (activeConv?.type === 'DIRECT') {
            const other = otherParticipant(activeConv.participants)
            if (other?._id) form.append('recipientId', other._id)
        }
        if (file) form.append('image', file)

        try {
            let res = activeConv?.type === 'DIRECT' ? await sendDirectMessage(form) : await sendGroupMessage(form)
            let created = res?.message || null
            if (msgInput.current) msgInput.current.value = ''
            if (created && selectedConvRef.current && String(created.conversationId) === String(selectedConvRef.current._id)) {
                try {
                    if (created.senderId && typeof created.senderId !== 'object') {
                        if (String(created.senderId) === String(currentUser?._id)) {
                            created.senderId = { _id: created.senderId, name: currentUser.name, avatarUrl: currentUser.avatarUrl }
                        } else {
                            created.senderId = { _id: created.senderId, name: created.senderName || 'Người dùng', avatarUrl: created.senderAvatar }
                        }
                    }
                } catch (e) { }
                setMessages(prev => prev.some(m => String(m._id) === String(created._id)) ? prev : [...prev, created])
                setConversations(prev => {
                    const convId = String(created.conversationId)
                    const idx = prev.findIndex(c => String(c._id) === convId)
                    if (idx === -1) { fetchConversations().catch(() => { }); return prev }
                    const updated = [...prev]
                    const conv = { ...updated[idx], lastMessage: created, lastMessageAt: created.createdAt || new Date().toISOString() }
                    updated.splice(idx, 1); updated.unshift(conv)
                    return updated
                })
            }
            await fetchConversations()
        } catch (err) {
            if (err.message?.includes('bị chặn bởi người này')) {
                const other = otherParticipant(activeConv.participants)
                if (other?._id) setBlockedByOtherUserIds(prev => { const next = new Set(prev); next.add(String(other._id)); return next })
                return
            }
            alert(err.message || 'Lỗi gửi tin nhắn')
        }
    }

    const handleRecallMessage = async (messageId) => {
        try {
            await recallMessage(messageId)
            setMessages(prev => prev.map(m => String(m._id) === String(messageId) ? { ...m, isRecalled: true, content: null, fileUrl: null } : m))
        } catch (err) { alert(err.message || 'Lỗi thu hồi tin nhắn') }
    }

    // ── Friend actions ─────────────────────────────────────────────────────────
    const doSearch = async () => {
        setSearchMessage(''); setSearchResult(null)
        if (!searchEmail) return setSearchMessage('Nhập email để tìm')
        setLoading(true)
        try { const res = await searchUserByEmail(searchEmail); setSearchResult(res.user) }
        catch (err) { setSearchMessage(err.message || 'Không tìm thấy') }
        finally { setLoading(false) }
    }

    const doAddFriend = (user) => { setFriendReqTarget(user); setFriendReqMsg(''); setShowFriendReqModal(true) }

    const submitFriendRequest = async () => {
        if (!friendReqTarget) return
        try {
            await sendFriendRequest({ to: friendReqTarget._id, message: friendReqMsg.trim() || undefined })
            alert('Đã gửi lời mời kết bạn')
            setShowFriendReqModal(false); setFriendReqTarget(null); setFriendReqMsg('')
        } catch (err) { alert(err.message || 'Lỗi gửi yêu cầu') }
    }

    const handleUnfriend = async (userId) => {
        if (!window.confirm('Bạn có chắc muốn huỷ kết bạn với người này?')) return
        try {
            await unfriend(userId); alert('Đã huỷ kết bạn')
            await fetchFriends(); await fetchFriendRequests(); setShowUserProfile(false)
        } catch (err) { alert(err.message || 'Lỗi huỷ kết bạn') }
    }

    const handleLogout = () => { localStorage.removeItem('token'); onLogout?.() }

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div className="app-shell">
            <Sidebar
                activePage={activePage}
                setActivePage={setActivePage}
                friendRequests={friendRequests}
                fetchFriendRequests={fetchFriendRequests}
                fetchFriends={fetchFriends}
                searchEmail={searchEmail}
                setSearchEmail={setSearchEmail}
                setSearchQuery={setSearchQuery}
                loading={loading}
                doSearch={doSearch}
                searchMessage={searchMessage}
                searchResult={searchResult}
                setShowAddFriendModal={setShowAddFriendModal}
                setShowCreateGroup={setShowCreateGroup}
                setJoinCode={setJoinCode}
                setShowJoinModal={setShowJoinModal}
                friends={friends}
                openDirectWithUser={openDirectWithUser}
                doAddFriend={doAddFriend}
                filteredConversations={filteredConversations}
                filteredFriends={filteredFriends}
                selectedConv={selectedConv}
                openConversation={openConversation}
                currentUser={currentUser}
                otherParticipant={otherParticipant}
                getStatus={getStatus}
                formatRelative={formatRelative}
                conversations={conversations}
                friendsView={friendsView}
                setFriendsView={setFriendsView}
                onlineStatus={onlineStatus}
                handleLogout={handleLogout}
                openAIChat={openAIChat}
                setShowProfile={setShowProfile}
                openUserProfile={openUserProfile}
            />

            <section className="main-area">
                <ChatWindow
                    selectedConv={selectedConv}
                    currentUser={currentUser}
                    messages={messages}
                    aiTyping={aiTyping}
                    sendMessage={sendMessage}
                    handleRecallMessage={handleRecallMessage}
                    handleClearAI={handleClearAI}
                    otherParticipant={otherParticipant}
                    getStatus={getStatus}
                    formatRelative={formatRelative}
                    openUserProfile={openUserProfile}
                    onlineStatus={onlineStatus}
                    showGroupPanel={showGroupPanel}
                    setShowGroupPanel={setShowGroupPanel}
                    setGroupPanelConv={setGroupPanelConv}
                    setInfoPanelCollapsed={setInfoPanelCollapsed}
                    setShowRenameModal={setShowRenameModal}
                    setRenameInput={setRenameInput}
                    fetchConversations={fetchConversations}
                    setSelectedConv={setSelectedConv}
                    selectedConvRef={selectedConvRef}
                    setMessages={setMessages}
                    openImageModal={openImageModal}
                    messagesEndRef={messagesEndRef}
                    blockedUsers={blockedUsers}
                    setBlockedUsers={setBlockedUsers}
                    blockedByOtherUserIds={blockedByOtherUserIds}
                    pendingFile={pendingFile}
                    setPendingFile={setPendingFile}
                    fileInputRef={fileInputRef}
                    msgInput={msgInput}
                    showEmojiPicker={showEmojiPicker}
                    setShowEmojiPicker={setShowEmojiPicker}
                    showGifPicker={showGifPicker}
                    setShowGifPicker={setShowGifPicker}
                />

                {showGroupPanel && groupPanelConv && (
                    <InfoPanel
                        groupPanelConv={groupPanelConv}
                        currentUser={currentUser}
                        otherParticipant={otherParticipant}
                        getStatus={getStatus}
                        formatRelative={formatRelative}
                        onlineStatus={onlineStatus}
                        openUserProfile={openUserProfile}
                        infoPanelCollapsed={infoPanelCollapsed}
                        setInfoPanelCollapsed={setInfoPanelCollapsed}
                        setShowGroupPanel={setShowGroupPanel}
                        getGroupInviteLink={getGroupInviteLink}
                        setInviteCode={setInviteCode}
                        setShowInviteModal={setShowInviteModal}
                        setRenameInput={setRenameInput}
                        setShowRenameModal={setShowRenameModal}
                        handleLeaveGroup={handleLeaveGroup}
                        blockedUsers={blockedUsers}
                        setBlockedUsers={setBlockedUsers}
                        messages={messages}
                        openImageModal={openImageModal}
                        selectedFriends={selectedFriends}
                        setSelectedFriends={setSelectedFriends}
                        friends={friends}
                        handleAddMember={handleAddMember}
                        doAddFriend={doAddFriend}
                        friendRequests={friendRequests}
                        openMemberMenu={openMemberMenu}
                        setOpenMemberMenu={setOpenMemberMenu}
                        handleToggleDeputy={handleToggleDeputy}
                        handleRemoveMember={handleRemoveMember}
                    />
                )}
            </section>

            <Modals
                showProfile={showProfile}
                setShowProfile={setShowProfile}
                showCreateGroup={showCreateGroup}
                setShowCreateGroup={setShowCreateGroup}
                groupName={groupName}
                setGroupName={setGroupName}
                selectedFriends={selectedFriends}
                setSelectedFriends={setSelectedFriends}
                friends={friends}
                getStatus={getStatus}
                formatRelative={formatRelative}
                fetchConversations={fetchConversations}
                setActivePage={setActivePage}
                showRenameModal={showRenameModal}
                setShowRenameModal={setShowRenameModal}
                renameInput={renameInput}
                setRenameInput={setRenameInput}
                selectedConv={selectedConv}
                submitRenameGroup={submitRenameGroup}
                showAddFriendModal={showAddFriendModal}
                setShowAddFriendModal={setShowAddFriendModal}
                searchEmail={searchEmail}
                setSearchEmail={setSearchEmail}
                doSearch={doSearch}
                searchResult={searchResult}
                openDirectWithUser={openDirectWithUser}
                doAddFriend={doAddFriend}
                showFriendReqModal={showFriendReqModal}
                setShowFriendReqModal={setShowFriendReqModal}
                friendReqTarget={friendReqTarget}
                setFriendReqTarget={setFriendReqTarget}
                friendReqMsg={friendReqMsg}
                setFriendReqMsg={setFriendReqMsg}
                submitFriendRequest={submitFriendRequest}
                showImageModal={showImageModal}
                imageModalUrl={imageModalUrl}
                imageModalName={imageModalName}
                closeImageModal={closeImageModal}
                showUserProfile={showUserProfile}
                setShowUserProfile={setShowUserProfile}
                profileUser={profileUser}
                currentUser={currentUser}
                handleUnfriend={handleUnfriend}
                showInviteModal={showInviteModal}
                setShowInviteModal={setShowInviteModal}
                inviteCode={inviteCode}
                showJoinModal={showJoinModal}
                setShowJoinModal={setShowJoinModal}
                joinCode={joinCode}
                setJoinCode={setJoinCode}
                openConversation={openConversation}
                showTransferModal={showTransferModal}
                setShowTransferModal={setShowTransferModal}
                transferConvId={transferConvId}
                transferTarget={transferTarget}
                setTransferTarget={setTransferTarget}
                conversations={conversations}
                groupPanelConv={groupPanelConv}
                setConversations={setConversations}
                setGroupPanelConv={setGroupPanelConv}
                setShowGroupPanel={setShowGroupPanel}
                selectedConvRef={selectedConvRef}
                setSelectedConv={setSelectedConv}
                setMessages={setMessages}
            />
        </div>
    )
}
