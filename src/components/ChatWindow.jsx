import React from 'react'
import EmojiPicker from 'emoji-picker-react'
import CombinedAvatar from './CombinedAvatar'
import { isImageUrl, isVideoUrl, isGifUrl, isDocumentUrl, basenameFromUrl, downloadFile } from '../utils/mediaHelpers'
import { deleteGroup, unblockUser } from '../api'

const AI_BOT_NAME = 'Chatbox AI'
const AI_BOT_AVATAR = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Google_Gemini_logo.svg/120px-Google_Gemini_logo.svg.png'

export default function ChatWindow({
    selectedConv,
    currentUser,
    messages,
    aiTyping,
    sendMessage,
    handleRecallMessage,
    handleClearAI,
    otherParticipant,
    getStatus,
    formatRelative,
    openUserProfile,
    onlineStatus,
    showGroupPanel, setShowGroupPanel, setGroupPanelConv, setInfoPanelCollapsed,
    setShowRenameModal, setRenameInput,
    fetchConversations, setSelectedConv, selectedConvRef, setMessages,
    openImageModal,
    messagesEndRef,
    blockedUsers, setBlockedUsers,
    blockedByOtherUserIds,
    pendingFile, setPendingFile, fileInputRef,
    msgInput,
    showEmojiPicker, setShowEmojiPicker,
    showGifPicker, setShowGifPicker,
}) {
    if (!selectedConv) {
        return (
            <div className="chat-column">
                <div className="header"><div>Chọn cuộc trò chuyện để hiển thị</div></div>
                <div className="messages" />
            </div>
        )
    }

    const isAIConv = !!selectedConv.isAI
    const isGroup = selectedConv.type === 'GROUP'
    const other = !isGroup && !isAIConv ? otherParticipant(selectedConv.participants) : null

    return (
        <div className="chat-column">
            {/* Header */}
            <div className="header">
                {isAIConv ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                            <img src={AI_BOT_AVATAR} alt="Gemini AI" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', background: '#e8f4fd' }} />
                            <div>
                                <div style={{ fontWeight: 700 }}>{AI_BOT_NAME}</div>
                                <div style={{ fontSize: 13, color: '#64748b' }}>AI Assistant • Hỗ trợ học tập &amp; cuộc sống</div>
                            </div>
                        </div>
                        <button className="ghost" title="Làm mới cuộc trò chuyện" onClick={handleClearAI} style={{ fontSize: 13 }}>🔄 Làm mới</button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                            <div style={{ position: 'relative' }}>
                                {isGroup ? (
                                    <CombinedAvatar participants={selectedConv.participants} size={80} />
                                ) : (
                                    <>
                                        <img
                                            src={other?.avatarUrl || 'https://via.placeholder.com/80'}
                                            alt="avatar"
                                            className="conv-header-avatar"
                                            onClick={() => { if (!isGroup && other) openUserProfile(other) }}
                                        />
                                        {other && (() => {
                                            const st = getStatus(other._id)
                                            return st ? (
                                                <span className={`status-badge ${st.status === 'online' ? 'online' : 'offline'}`} title={st.status === 'online' ? 'Online' : formatRelative(st.lastSeen)} />
                                            ) : null
                                        })()}
                                    </>
                                )}
                            </div>
                            <div>
                                <div style={{ fontWeight: 700 }}>
                                    {isGroup
                                        ? (selectedConv.groupName || (selectedConv.groupId ? selectedConv.groupId.name : 'Nhóm'))
                                        : (other?.name || 'Trò chuyện')}
                                </div>
                                <div style={{ fontSize: 13, color: '#64748b' }}>
                                    {isGroup ? `${(selectedConv.participants || []).length} thành viên` : (() => {
                                        if (!other) return 'Người dùng'
                                        const st = onlineStatus[String(other._id)]
                                        if (st) {
                                            if (st.status === 'online') return 'Online'
                                            if (st.lastSeen) return formatRelative(st.lastSeen)
                                            return 'Offline'
                                        }
                                        return 'Offline'
                                    })()}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <button className="ghost" title="Thông tin" onClick={() => {
                                const opening = !showGroupPanel
                                setShowGroupPanel(opening)
                                setGroupPanelConv(selectedConv)
                                if (opening) setInfoPanelCollapsed({ members: false, media: false, files: false })
                            }}>ℹ️</button>
                            {isGroup && (
                                <>
                                    <button className="ghost" onClick={() => {
                                        const cur = selectedConv.groupName || (selectedConv.groupId && selectedConv.groupId.name) || ''
                                        setRenameInput(cur)
                                        setShowRenameModal(true)
                                    }}>Đổi tên</button>
                                    <button className="ghost" onClick={async () => {
                                        if (!window.confirm('Bạn có chắc muốn xóa nhóm này?')) return
                                        try {
                                            await deleteGroup(selectedConv._id)
                                            await fetchConversations()
                                            setSelectedConv(null)
                                            selectedConvRef.current = null
                                            setMessages([])
                                        } catch (err) { alert(err.message || 'Lỗi') }
                                    }}>Xóa</button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Messages */}
            <div className="messages">
                {messages.map(m => {
                    const sender = m.senderId || { _id: m.senderId, name: m.senderName, avatarUrl: m.senderAvatar }
                    const isOwn = currentUser && String(sender._id) === String(currentUser._id)
                    const msgDate = m.createdAt ? (() => {
                        const d = new Date(m.createdAt)
                        const today = new Date()
                        const isToday = d.toDateString() === today.toDateString()
                        const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                        if (isToday) return time
                        return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')} ${time}`
                    })() : ''
                    if (m.isSystem) return (
                        <div key={m._id} style={{ textAlign: 'center', margin: '8px 0' }}>
                            <span style={{ background: 'rgba(0,0,0,0.08)', color: '#64748b', fontSize: 12, borderRadius: 12, padding: '3px 12px', display: 'inline-block' }}>{m.content}</span>
                        </div>
                    )
                    return (
                        <div key={m._id} className={`message-item ${isOwn ? 'own' : ''}`}>
                            <div style={{ position: 'relative' }}>
                                <img className="msg-avatar" src={(sender && sender.avatarUrl) || 'https://via.placeholder.com/40'} alt="avatar" onClick={() => openUserProfile(sender)} />
                                {sender && sender._id && (() => {
                                    const st = getStatus(sender._id)
                                    return st ? <span className={`status-badge ${st.status === 'online' ? 'online' : 'offline'}`} title={st.status === 'online' ? 'Online' : (st.lastSeen ? formatRelative(st.lastSeen) : '—')} /> : null
                                })()}
                            </div>
                            <div className="message-body">
                                <div className="message-sender">{sender?.name || m.senderName || (isOwn ? 'Bạn' : 'Người dùng')}</div>
                                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, flexDirection: isOwn ? 'row-reverse' : 'row' }}>
                                    <div className={`message-bubble ${isOwn ? 'own' : ''}`}>
                                        {m.isRecalled ? (
                                            <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: 13 }}>Tin nhắn đã được thu hồi</span>
                                        ) : m.fileUrl ? (
                                            <>
                                                {isGifUrl(m.fileUrl) ? (
                                                    <img src={m.fileUrl} alt="gif" className="message-image" style={{ cursor: 'zoom-in' }} onClick={() => openImageModal(m.fileUrl)} />
                                                ) : isImageUrl(m.fileUrl) ? (
                                                    <img src={m.fileUrl} alt="attachment" className="message-image" style={{ cursor: 'zoom-in' }} onClick={() => openImageModal(m.fileUrl)} />
                                                ) : isVideoUrl(m.fileUrl) ? (
                                                    <video controls className="message-video"><source src={m.fileUrl} /></video>
                                                ) : (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <span className="message-file">📎 {basenameFromUrl(m.fileUrl)}</span>
                                                        <button onClick={() => downloadFile(m.fileUrl, basenameFromUrl(m.fileUrl))} title="Tải về" style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: 18, lineHeight: 1, cursor: 'pointer', padding: 0 }}>⬇</button>
                                                    </div>
                                                )}
                                                {m.content && <div style={{ marginTop: 4 }}>{m.content}</div>}
                                            </>
                                        ) : isGifUrl(m.content) ? (
                                            <img src={m.content} alt="gif" className="message-image" style={{ cursor: 'zoom-in' }} onClick={() => openImageModal(m.content)} />
                                        ) : isImageUrl(m.content) ? (
                                            <img src={m.content} alt="image" className="message-image" style={{ cursor: 'zoom-in' }} onClick={() => openImageModal(m.content)} />
                                        ) : isVideoUrl(m.content) ? (
                                            <video controls className="message-video"><source src={m.content} /></video>
                                        ) : isDocumentUrl(m.content) ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span className="message-file">📎 {basenameFromUrl(m.content)}</span>
                                                <button onClick={() => downloadFile(m.content, basenameFromUrl(m.content))} title="Tải về" style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: 18, lineHeight: 1, cursor: 'pointer', padding: 0 }}>⬇</button>
                                            </div>
                                        ) : (
                                            <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                                {m.content}
                                                {m._streaming && <span className="ai-streaming-cursor" />}
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start', gap: 2, minWidth: 0 }}>
                                        {msgDate && <span style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap' }}>{msgDate}</span>}
                                        {isOwn && !m.isRecalled && (
                                            <button
                                                onClick={() => handleRecallMessage(m._id)}
                                                title="Thu hồi"
                                                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 11, cursor: 'pointer', padding: 0, whiteSpace: 'nowrap' }}
                                            >Thu hồi</button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div style={{ padding: '8px 12px', borderTop: '1px solid #eef3fb' }}>
                {selectedConv.type === 'DIRECT' && !selectedConv.isAI && (() => {
                    const otherId = other ? String(other._id) : null
                    if (!otherId || !blockedUsers.includes(otherId)) return null
                    return (
                        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '7px 12px', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                            <span style={{ fontSize: 13, color: '#dc2626' }}>🚫 Bạn đã chặn người này</span>
                            <button className="ghost" style={{ fontSize: 12, padding: '3px 10px', color: '#dc2626', borderColor: '#fecaca', flexShrink: 0 }}
                                onClick={async () => { try { await unblockUser(otherId); setBlockedUsers(prev => prev.filter(id => id !== otherId)) } catch (e) { alert(e.message || 'Lỗi') } }}>Bỏ chặn</button>
                        </div>
                    )
                })()}
                {selectedConv.type === 'DIRECT' && !selectedConv.isAI && (() => {
                    const otherId = other ? String(other._id) : null
                    if (!otherId || !blockedByOtherUserIds.has(otherId)) return null
                    return (
                        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '7px 12px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 13, color: '#dc2626' }}>🚫 Bạn đã bị chặn bởi người này</span>
                        </div>
                    )
                })()}
                {pendingFile && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, padding: '4px 8px', background: '#f1f5f9', borderRadius: 8 }}>
                        <span style={{ fontSize: 13, color: '#334155' }}>📎 {pendingFile.name}</span>
                        <button onClick={() => { setPendingFile(null); fileInputRef.current && (fileInputRef.current.value = null) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 16, lineHeight: 1 }}>✕</button>
                    </div>
                )}
                {(() => {
                    if (!selectedConv || selectedConv.isAI || selectedConv.type !== 'DIRECT') return false
                    const otherId = other ? String(other._id) : null
                    return (otherId && blockedUsers.includes(otherId)) || (otherId && blockedByOtherUserIds.has(otherId))
                })() ? (
                    <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: '6px 0' }}>Không thể gửi tin nhắn trong cuộc trò chuyện này</div>
                ) : (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input
                            ref={msgInput}
                            placeholder={selectedConv?.isAI ? 'Hỏi Gemini AI...' : 'Nhập tin nhắn...'}
                            style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #e6f0ff' }}
                            onKeyDown={async e => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    const content = msgInput.current.value
                                    if (!content && !pendingFile) return
                                    await sendMessage({ content: content || undefined, file: pendingFile || undefined })
                                    setPendingFile(null)
                                    if (fileInputRef.current) fileInputRef.current.value = null
                                }
                            }}
                            disabled={aiTyping}
                        />
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
                            style={{ display: 'none' }}
                            onChange={e => {
                                const f = e.target.files && e.target.files[0]
                                if (!f) return
                                setPendingFile(f)
                            }}
                        />
                        {!selectedConv?.isAI && <button className="ghost" title="Thêm emoji" onClick={() => setShowEmojiPicker(true)}>😊</button>}
                        {!selectedConv?.isAI && <button className="ghost" title="Chọn GIF" onClick={() => setShowGifPicker(true)}>GIF</button>}
                        <button className="ghost" title="Đính kèm file" onClick={() => fileInputRef.current && fileInputRef.current.click()}>📎</button>
                        <button className="primary" disabled={aiTyping} onClick={async () => {
                            const content = msgInput.current.value
                            if (!content && !pendingFile) return alert('Nhập nội dung hoặc chọn file')
                            await sendMessage({ content: content || undefined, file: pendingFile || undefined })
                            setPendingFile(null)
                            if (fileInputRef.current) fileInputRef.current.value = null
                        }}>{aiTyping ? '⏳ Đang trả lời...' : 'Gửi'}</button>
                    </div>
                )}
                {aiTyping && selectedConv?.isAI && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
                        <img src={AI_BOT_AVATAR} alt="AI" style={{ width: 28, height: 28, borderRadius: '50%' }} />
                        <span style={{ fontSize: 13, color: '#64748b', fontStyle: 'italic' }}>Gemini AI đang trả lời...</span>
                    </div>
                )}
            </div>

            {/* GIF Picker */}
            {showGifPicker && (
                <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ background: '#fff', padding: 12, borderRadius: 8, width: 600 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontWeight: 700 }}>Chọn GIF</div>
                            <button className="ghost" onClick={() => setShowGifPicker(false)}>Đóng</button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginTop: 12 }}>
                            {[
                                'https://media.giphy.com/media/3o6ZsY1pxGZfP6fWqg/giphy.gif',
                                'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
                                'https://media.giphy.com/media/26xBwdIuRJiAiJd3i/giphy.gif',
                                'https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif'
                            ].map(url => (
                                <img key={url} src={url} alt="gif" style={{ width: '100%', height: 120, objectFit: 'cover', cursor: 'pointer' }} onClick={async () => {
                                    await sendMessage({ content: url })
                                    setShowGifPicker(false)
                                }} />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Emoji Picker */}
            {showEmojiPicker && (
                <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ background: '#fff', padding: 12, borderRadius: 8, width: 420 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontWeight: 700 }}>Chọn emoji</div>
                            <button className="ghost" onClick={() => setShowEmojiPicker(false)}>Đóng</button>
                        </div>
                        <div style={{ marginTop: 12 }}>
                            <EmojiPicker onEmojiClick={(emojiData) => {
                                const emoji = emojiData?.emoji || emojiData
                                msgInput.current.value = (msgInput.current.value || '') + (emoji || '')
                                msgInput.current.focus()
                                setShowEmojiPicker(false)
                            }} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
