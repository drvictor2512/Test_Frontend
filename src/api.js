import axios from 'axios'

const BASE = 'https://chatapp-backend-cfys.onrender.com'

const client = axios.create({
    baseURL: BASE,
    headers: { 'Content-Type': 'application/json' }
})

async function handle(postPromise) {
    try {
        const res = await postPromise
        if (!res || typeof res.status !== 'number') {
            throw new Error('Invalid response from server')
        }
        return res.data
    } catch (err) {
        const payload = err?.response?.data || { message: err.message }
        throw payload
    }
}

export function signup(payload) {
    return handle(client.post('/auth/signup', payload))
}

export function signin(payload) {
    return handle(client.post('/auth/signin', payload))
}

export function sendOtp(payload) {
    return handle(client.post('/auth/otp', payload))
}

export function verifyOtp(payload) {
    return handle(client.post('/auth/verify-otp', payload))
}

export function changePassword(payload) {
    const token = localStorage.getItem('token')
    if (!token) return Promise.reject({ message: 'No token' })
    return handle(client.post('/auth/change-password', payload, { headers: { Authorization: `Bearer ${token}` } }))
}

export function getProfile() {
    const token = localStorage.getItem('token')
    if (!token) return Promise.reject({ message: 'No token' })
    return handle(client.get('/user/profile', { headers: { Authorization: `Bearer ${token}` } }))
}

// --- Conversations & messages
export function getConversations() {
    const token = localStorage.getItem('token')
    if (!token) return Promise.reject({ message: 'No token' })
    return handle(client.get('/conversations', { headers: { Authorization: `Bearer ${token}` } }))
}

export function createConversation(payload) {
    const token = localStorage.getItem('token')
    if (!token) return Promise.reject({ message: 'No token' })
    return handle(client.post('/conversations', payload, { headers: { Authorization: `Bearer ${token}` } }))
}

export function getMessages(conversationId, params = {}) {
    const token = localStorage.getItem('token')
    if (!token) return Promise.reject({ message: 'No token' })
    return handle(client.get(`/conversations/${conversationId}/messages`, { headers: { Authorization: `Bearer ${token}` }, params }))
}

export function markConversationRead(conversationId) {
    const token = localStorage.getItem('token')
    if (!token) return Promise.reject({ message: 'No token' })
    return handle(client.patch(`/conversations/${conversationId}/read`, {}, { headers: { Authorization: `Bearer ${token}` } }))
}

export async function sendDirectMessage(formData) {
    const token = localStorage.getItem('token')
    if (!token) return Promise.reject({ message: 'No token' })
    try {
        const res = await client.post('/messages/direct', formData, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } })
        return res.data
    } catch (err) {
        const payload = err?.response?.data || { message: err.message }
        throw payload
    }
}

export async function sendGroupMessage(formData) {
    const token = localStorage.getItem('token')
    if (!token) return Promise.reject({ message: 'No token' })
    try {
        const res = await client.post('/messages/group', formData, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } })
        return res.data
    } catch (err) {
        const payload = err?.response?.data || { message: err.message }
        throw payload
    }
}

// --- Friends
export function getFriends() {
    const token = localStorage.getItem('token')
    if (!token) return Promise.reject({ message: 'No token' })
    return handle(client.get('/friends', { headers: { Authorization: `Bearer ${token}` } }))
}

export function getFriendRequests() {
    const token = localStorage.getItem('token')
    if (!token) return Promise.reject({ message: 'No token' })
    return handle(client.get('/friends/requests', { headers: { Authorization: `Bearer ${token}` } }))
}

export function sendFriendRequest(payload) {
    const token = localStorage.getItem('token')
    if (!token) return Promise.reject({ message: 'No token' })
    return handle(client.post('/friends/requests', payload, { headers: { Authorization: `Bearer ${token}` } }))
}

export function acceptFriendRequest(requestId) {
    const token = localStorage.getItem('token')
    if (!token) return Promise.reject({ message: 'No token' })
    return handle(client.post(`/friends/requests/${requestId}/accept`, {}, { headers: { Authorization: `Bearer ${token}` } }))
}

export function declineFriendRequest(requestId) {
    const token = localStorage.getItem('token')
    if (!token) return Promise.reject({ message: 'No token' })
    return handle(client.post(`/friends/requests/${requestId}/decline`, {}, { headers: { Authorization: `Bearer ${token}` } }))
}

export function unfriend(otherUserId) {
    const token = localStorage.getItem('token')
    if (!token) return Promise.reject({ message: 'No token' })
    return handle(client.delete(`/friends/${otherUserId}`, { headers: { Authorization: `Bearer ${token}` } }))
}

// --- User search
export function searchUserByEmail(email) {
    const token = localStorage.getItem('token')
    if (!token) return Promise.reject({ message: 'No token' })
    return handle(client.get('/user/search', { headers: { Authorization: `Bearer ${token}` }, params: { email } }))
}

export function getUserById(userId) {
    const token = localStorage.getItem('token')
    if (!token) return Promise.reject({ message: 'No token' })
    return handle(client.get(`/user/${userId}`, { headers: { Authorization: `Bearer ${token}` } }))
}

// Group management
export function renameGroup(payload) {
    const token = localStorage.getItem('token')
    if (!token) return Promise.reject({ message: 'No token' })
    return handle(client.post('/conversations/group/rename', payload, { headers: { Authorization: `Bearer ${token}` } }))
}

export function addGroupMember(payload) {
    const token = localStorage.getItem('token')
    if (!token) return Promise.reject({ message: 'No token' })
    return handle(client.post('/conversations/group/add-member', payload, { headers: { Authorization: `Bearer ${token}` } }))
}

export function removeGroupMember(payload) {
    const token = localStorage.getItem('token')
    if (!token) return Promise.reject({ message: 'No token' })
    return handle(client.post('/conversations/group/remove-member', payload, { headers: { Authorization: `Bearer ${token}` } }))
}

export function assignDeputy(payload) {
    const token = localStorage.getItem('token')
    if (!token) return Promise.reject({ message: 'No token' })
    return handle(client.post('/conversations/group/assign-deputy', payload, { headers: { Authorization: `Bearer ${token}` } }))
}

export function deleteGroup(conversationId) {
    const token = localStorage.getItem('token')
    if (!token) return Promise.reject({ message: 'No token' })
    return handle(client.delete(`/conversations/group/${conversationId}`, { headers: { Authorization: `Bearer ${token}` } }))
}

export function leaveGroup(payload) {
    const token = localStorage.getItem('token')
    if (!token) return Promise.reject({ message: 'No token' })
    return handle(client.post('/conversations/group/leave', payload, { headers: { Authorization: `Bearer ${token}` } }))
}

export function recallMessage(messageId) {
    const token = localStorage.getItem('token')
    if (!token) return Promise.reject({ message: 'No token' })
    return handle(client.patch(`/messages/${messageId}/recall`, {}, { headers: { Authorization: `Bearer ${token}` } }))
}

export function updateProfile(payload) {
    const token = localStorage.getItem('token')
    if (!token) return Promise.reject({ message: 'No token' })
    return handle(client.put('/user/profile', payload, { headers: { Authorization: `Bearer ${token}` } }))
}

export async function uploadAvatar(file) {
    const token = localStorage.getItem('token')
    if (!token) return Promise.reject({ message: 'No token' })
    const form = new FormData()
    form.append('image', file)
    try {
        const res = await client.post('/user/avatar', form, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } })
        return res.data
    } catch (err) {
        const payload = err?.response?.data || { message: err.message }
        throw payload
    }
}

export async function uploadBanner(file) {
    const token = localStorage.getItem('token')
    if (!token) return Promise.reject({ message: 'No token' })
    const form = new FormData()
    form.append('image', file)
    try {
        const res = await client.post('/user/banner', form, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } })
        return res.data
    } catch (err) {
        const payload = err?.response?.data || { message: err.message }
        throw payload
    }
}

export function forgotPassword(payload) {
    return handle(client.post('/auth/forgot-password', payload))
}

export function resetPassword(payload) {
    return handle(client.post('/auth/reset-password', payload))
}

export function getGroupInviteLink(conversationId) {
    const token = localStorage.getItem('token')
    if (!token) return Promise.reject({ message: 'No token' })
    return handle(client.get(`/conversations/${conversationId}/invite`, { headers: { Authorization: `Bearer ${token}` } }))
}

export function joinGroupByInvite(inviteCode) {
    const token = localStorage.getItem('token')
    if (!token) return Promise.reject({ message: 'No token' })
    return handle(client.post('/conversations/group/join-invite', { inviteCode }, { headers: { Authorization: `Bearer ${token}` } }))
}

export function transferGroupOwnership(payload) {
    const token = localStorage.getItem('token')
    if (!token) return Promise.reject({ message: 'No token' })
    return handle(client.post('/conversations/group/transfer-owner', payload, { headers: { Authorization: `Bearer ${token}` } }))
}

export function blockUser(targetId) {
    const token = localStorage.getItem('token')
    if (!token) return Promise.reject({ message: 'No token' })
    return handle(client.post('/user/block', { targetId }, { headers: { Authorization: `Bearer ${token}` } }))
}

export function unblockUser(targetId) {
    const token = localStorage.getItem('token')
    if (!token) return Promise.reject({ message: 'No token' })
    return handle(client.post('/user/unblock', { targetId }, { headers: { Authorization: `Bearer ${token}` } }))
}

export function getBlockedUsers() {
    const token = localStorage.getItem('token')
    if (!token) return Promise.reject({ message: 'No token' })
    return handle(client.get('/user/blocked', { headers: { Authorization: `Bearer ${token}` } }))
}

// --- AI Chat
export function getAIConversation() {
    const token = localStorage.getItem('token')
    if (!token) return Promise.reject({ message: 'No token' })
    return handle(client.get('/ai/conversation', { headers: { Authorization: `Bearer ${token}` } }))
}

export function getAIMessages(conversationId, params = {}) {
    const token = localStorage.getItem('token')
    if (!token) return Promise.reject({ message: 'No token' })
    return handle(client.get('/ai/messages', { headers: { Authorization: `Bearer ${token}` }, params: { conversationId, ...params } }))
}

export function clearAIMessages(conversationId) {
    const token = localStorage.getItem('token')
    if (!token) return Promise.reject({ message: 'No token' })
    return handle(client.delete('/ai/messages', { headers: { Authorization: `Bearer ${token}` }, params: { conversationId } }))
}

export default { signup, signin, sendOtp, changePassword, forgotPassword, resetPassword }
