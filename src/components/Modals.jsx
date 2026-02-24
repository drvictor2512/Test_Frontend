import React from 'react'
import UserCard from '../UserCard'
import { basenameFromUrl, downloadFile } from '../utils/mediaHelpers'
import { createConversation, leaveGroup, transferGroupOwnership, getConversations } from '../api'

export default function Modals({
    // Profile card
    showProfile, setShowProfile,
    // Create group
    showCreateGroup, setShowCreateGroup,
    groupName, setGroupName,
    selectedFriends, setSelectedFriends,
    friends, getStatus, formatRelative,
    fetchConversations, setActivePage,
    // Rename group
    showRenameModal, setShowRenameModal,
    renameInput, setRenameInput,
    selectedConv,
    submitRenameGroup,
    // Add friend modal
    showAddFriendModal, setShowAddFriendModal,
    searchEmail, setSearchEmail,
    doSearch,
    searchResult,
    openDirectWithUser,
    doAddFriend,
    // Friend request modal
    showFriendReqModal, setShowFriendReqModal,
    friendReqTarget, setFriendReqTarget,
    friendReqMsg, setFriendReqMsg,
    submitFriendRequest,
    // Image modal
    showImageModal, imageModalUrl, imageModalName,
    closeImageModal,
    // User profile modal
    showUserProfile, setShowUserProfile,
    profileUser,
    currentUser,
    handleUnfriend,
    // Invite link modal
    showInviteModal, setShowInviteModal,
    inviteCode,
    // Join modal
    showJoinModal, setShowJoinModal,
    joinCode, setJoinCode,
    openConversation,
    // Transfer ownership modal
    showTransferModal, setShowTransferModal,
    transferConvId,
    transferTarget, setTransferTarget,
    conversations,
    groupPanelConv,
    setGroupPanelConv, setShowGroupPanel,
    selectedConvRef, setSelectedConv, setMessages,
}) {
    return (
        <>
            {/* My profile card */}
            {showProfile && (
                <div style={{ position: 'absolute', top: 80, right: 16 }}>
                    <UserCard onClose={() => setShowProfile(false)} />
                </div>
            )}

            {/* Create group */}
            {showCreateGroup && (
                <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ background: '#fff', padding: 16, width: 600, borderRadius: 8 }}>
                        <h3>Tạo nhóm mới</h3>
                        <input placeholder="Tên nhóm" value={groupName} onChange={e => setGroupName(e.target.value)} style={{ width: '100%', marginBottom: 8 }} />
                        <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid #eee', padding: 8 }}>
                            {friends.map(f => (
                                <label key={f._id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: 6 }}>
                                    <input type="checkbox" checked={selectedFriends.includes(f._id)} onChange={(e) => {
                                        if (e.target.checked) setSelectedFriends(prev => [...prev, f._id])
                                        else setSelectedFriends(prev => prev.filter(id => id !== f._id))
                                    }} />
                                    <div style={{ position: 'relative' }}>
                                        <img src={f.avatarUrl || 'https://via.placeholder.com/40'} alt="a" style={{ width: 40, height: 40, borderRadius: '50%' }} />
                                        {(() => {
                                            const st = getStatus(f._id)
                                            return st ? <span className={`status-badge ${st.status === 'online' ? 'online' : 'offline'}`} title={st.status === 'online' ? 'Online' : (st.lastSeen ? formatRelative(st.lastSeen) : '—')} style={{ right: -4, bottom: -4 }} /> : null
                                        })()}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{f.name}</div>
                                        <div style={{ fontSize: 12, color: '#666' }}>{f.email}</div>
                                    </div>
                                </label>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                            <button className="ghost" onClick={() => setShowCreateGroup(false)}>Hủy</button>
                            <button className="primary" onClick={async () => {
                                if (!groupName) return alert('Nhập tên nhóm')
                                if (selectedFriends.length === 0) return alert('Chọn ít nhất một bạn bè')
                                try {
                                    await createConversation({ type: 'GROUP', name: groupName, memberIds: selectedFriends })
                                    setShowCreateGroup(false)
                                    setGroupName('')
                                    setSelectedFriends([])
                                    await fetchConversations()
                                    setActivePage('conversations')
                                } catch (err) {
                                    alert(err.message || 'Lỗi tạo nhóm (kiểm tra bạn bè)')
                                }
                            }}>Tạo</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Rename group */}
            {showRenameModal && selectedConv && (
                <div className="modal-backdrop">
                    <div className="modal">
                        <h3>Đổi tên nhóm</h3>
                        <div style={{ marginTop: 8 }}>
                            <input value={renameInput} onChange={e => setRenameInput(e.target.value)} placeholder="Tên nhóm" style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', background: '#08101a', color: '#e6eef9' }} />
                        </div>
                        <div className="modal-actions">
                            <button className="group-action-btn" onClick={() => setShowRenameModal(false)}>Hủy</button>
                            <button className="group-action-btn primary" onClick={submitRenameGroup}>Lưu</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add friend */}
            {showAddFriendModal && (
                <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div className="add-friend-modal">
                        <div className="modal-header">
                            <div style={{ fontWeight: 700 }}>Thêm bạn</div>
                            <button className="ghost" onClick={() => setShowAddFriendModal(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div className="search-row">
                                <input placeholder="Tìm bằng email" value={searchEmail} onChange={e => setSearchEmail(e.target.value)} style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid #e6eef6' }} />
                                <button className="primary" onClick={doSearch}>Tìm</button>
                            </div>
                            <div style={{ marginTop: 8 }}>
                                <div style={{ fontSize: 13, color: '#64748b', marginBottom: 6 }}>Kết quả gần nhất</div>
                                {searchResult ? (
                                    <div className="result-item">
                                        <div style={{ position: 'relative' }}>
                                            <img className="small-avatar" src={searchResult.avatarUrl || 'https://via.placeholder.com/44'} alt="a" />
                                            {(() => {
                                                const st = getStatus(searchResult._id)
                                                return st ? <span className={`status-badge ${st.status === 'online' ? 'online' : 'offline'}`} title={st.status === 'online' ? 'Online' : (st.lastSeen ? formatRelative(st.lastSeen) : '—')} style={{ right: -6, bottom: -6 }} /> : null
                                            })()}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600 }}>{searchResult.name}</div>
                                            <div className="meta">{searchResult.email}</div>
                                        </div>
                                        <div className="actions">
                                            <button className="primary" onClick={() => openDirectWithUser(searchResult._id)}>Nhắn</button>
                                            {!friends.find(fr => String(fr._id) === String(searchResult._id)) && <button className="ghost" onClick={() => doAddFriend(searchResult)}>Kết bạn</button>}
                                            {friends.find(fr => String(fr._id) === String(searchResult._id)) && <div style={{ color: '#0b66ff', fontWeight: 600, padding: '6px 8px', borderRadius: 8 }}>Bạn bè</div>}
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ color: '#94a3b8' }}>Chưa có kết quả</div>
                                )}
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                            <button className="ghost" onClick={() => setShowAddFriendModal(false)}>Hủy</button>
                            <button className="primary" onClick={doSearch}>Tìm kiếm</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Friend request */}
            {showFriendReqModal && friendReqTarget && (
                <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9000 }}>
                    <div style={{ background: '#fff', borderRadius: 12, padding: 24, width: 380, boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                            <img src={friendReqTarget.avatarUrl || 'https://via.placeholder.com/48'} alt="avatar" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} />
                            <div>
                                <div style={{ fontWeight: 700, fontSize: 16 }}>{friendReqTarget.name}</div>
                                <div style={{ color: '#64748b', fontSize: 13 }}>{friendReqTarget.email}</div>
                            </div>
                        </div>
                        <div style={{ marginBottom: 12 }}>
                            <label style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>Lời nhắn kèm lời mời (tùy chọn)</label>
                            <textarea
                                value={friendReqMsg}
                                onChange={e => setFriendReqMsg(e.target.value)}
                                maxLength={300}
                                rows={3}
                                placeholder="Xin chào, mình muốn kết bạn với bạn!"
                                style={{ width: '100%', marginTop: 6, padding: 8, borderRadius: 8, border: '1px solid #e2e8f0', resize: 'none', fontSize: 14, boxSizing: 'border-box' }}
                            />
                            <div style={{ textAlign: 'right', fontSize: 12, color: '#94a3b8' }}>{friendReqMsg.length}/300</div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button className="ghost" onClick={() => { setShowFriendReqModal(false); setFriendReqTarget(null) }}>Hủy</button>
                            <button className="primary" onClick={submitFriendRequest}>Gửi lời mời</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Image viewer */}
            {showImageModal && imageModalUrl && (
                <div onClick={closeImageModal} style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, flexDirection: 'column', gap: 16 }}>
                    <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '85vh' }} onClick={e => e.stopPropagation()}>
                        <img src={imageModalUrl} alt={imageModalName || 'image'} style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: 8, display: 'block' }} />
                        <button onClick={closeImageModal} title="Đóng" style={{ position: 'absolute', top: -16, right: -16, background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', borderRadius: '50%', width: 32, height: 32, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>✕</button>
                    </div>
                    <button onClick={() => downloadFile(imageModalUrl, imageModalName || 'image')} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#1d4ed8', color: '#fff', padding: '8px 20px', borderRadius: 8, border: 'none', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>⬇ Tải về</button>
                </div>
            )}

            {/* User profile */}
            {showUserProfile && profileUser && (
                <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 12 }}>
                    <div className="profile-modal">
                        <div className="profile-banner">
                            {profileUser.bannerUrl ? <img src={profileUser.bannerUrl} alt="banner" /> : <div className="banner-fallback" />}
                            <div className="profile-avatar-large">
                                <img src={profileUser.avatarUrl || 'https://via.placeholder.com/120'} alt="avatar" />
                            </div>
                        </div>
                        <div className="profile-content">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: 20, fontWeight: 800 }}>{profileUser.name || 'Người dùng'}</div>
                                    <div style={{ color: '#64748b', marginTop: 4 }}>{profileUser.email || '—'}</div>
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {currentUser && String(profileUser._id) !== String(currentUser._id) && (
                                        <>
                                            <button className="primary" onClick={() => openDirectWithUser(profileUser._id)}>Nhắn</button>
                                            {friends.some(f => String(f._id) === String(profileUser._id)) ? (
                                                <button className="ghost" onClick={() => handleUnfriend(profileUser._id)}>Huỷ kết bạn</button>
                                            ) : (
                                                <button className="ghost" onClick={() => doAddFriend(profileUser)}>Kết bạn</button>
                                            )}
                                        </>
                                    )}
                                    <button className="primary" onClick={() => setShowUserProfile(false)}>Đóng</button>
                                </div>
                            </div>
                            <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <div><strong>Ngày sinh:</strong> {profileUser.dateOfBirth ? new Date(profileUser.dateOfBirth).toLocaleDateString() : '—'}</div>
                                <div><strong>Giới tính:</strong> {profileUser.gender || '—'}</div>
                                <div><strong>Đã xác thực:</strong> {typeof profileUser.verified !== 'undefined' ? (profileUser.verified ? 'Có' : 'Không') : '—'}</div>
                                <div><strong>Tham gia:</strong> {profileUser.createdAt ? new Date(profileUser.createdAt).toLocaleDateString() : '—'}</div>
                            </div>
                            <div style={{ marginTop: 12 }}>
                                <div style={{ fontWeight: 700, marginBottom: 6 }}>Giới thiệu</div>
                                <div style={{ color: '#374151' }}>{profileUser.bio || '—'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Invite link */}
            {showInviteModal && (
                <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9500 }}>
                    <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 400, boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
                        <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 12 }}>🔗 Link mời nhóm</div>
                        <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>Chia sẻ mã này để ai cũng có thể tham gia nhóm</div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: '#f1f5f9', borderRadius: 8, padding: '8px 12px', marginBottom: 16 }}>
                            <span style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 700, letterSpacing: 3, flex: 1 }}>{inviteCode}</span>
                            <button className="primary" style={{ padding: '6px 14px', fontSize: 13 }} onClick={() => {
                                navigator.clipboard.writeText(inviteCode).then(() => alert('Đã sao chép mã nhóm!')).catch(() => alert('Không sao chép được'))
                            }}>Sao chép</button>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="ghost" onClick={() => setShowInviteModal(false)}>Đóng</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Join by code */}
            {showJoinModal && (
                <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9500 }}>
                    <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 380, boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
                        <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 12 }}>Tham gia nhóm qua mã</div>
                        <input
                            placeholder="Nhập mã nhóm..."
                            value={joinCode}
                            onChange={e => setJoinCode(e.target.value)}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 16, fontFamily: 'monospace', letterSpacing: 2, boxSizing: 'border-box', marginBottom: 16 }}
                        />
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button className="ghost" onClick={() => setShowJoinModal(false)}>Hủy</button>
                            <button className="primary" onClick={async () => {
                                const code = (joinCode || '').trim()
                                if (!code) return alert('Nhập mã nhóm')
                                try {
                                    const { joinGroupByInvite } = await import('../api')
                                    const res = await joinGroupByInvite(code)
                                    setShowJoinModal(false)
                                    await fetchConversations()
                                    if (res.conversationId) {
                                        const fresh = (await getConversations()).conversations.find(c => String(c._id) === String(res.conversationId))
                                        if (fresh) { await openConversation(fresh); setActivePage('conversations') }
                                    }
                                } catch (e) { alert(e.message || 'Mã không hợp lệ') }
                            }}>Tham gia</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Transfer ownership */}
            {showTransferModal && transferConvId && (() => {
                const conv = conversations.find(c => String(c._id) === String(transferConvId)) || groupPanelConv
                const others = (conv?.participants || []).filter(p => String(p._id || p.userId) !== String(currentUser?._id))
                return (
                    <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9500 }}>
                        <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 400, boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
                            <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 6 }}>Chuyển quyền trưởng nhóm</div>
                            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 14 }}>Chọn thành viên sẽ tiếp nhận quyền trưởng nhóm trước khi bạn rời</div>
                            <select value={transferTarget} onChange={e => setTransferTarget(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 16, fontSize: 14 }}>
                                {others.map(p => {
                                    const pid = String(p._id || p.userId)
                                    return <option key={pid} value={pid}>{p.name || pid} {p.role ? `(${p.role})` : ''}</option>
                                })}
                            </select>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                <button className="ghost" onClick={() => setShowTransferModal(false)}>Hủy</button>
                                <button className="primary" onClick={async () => {
                                    if (!transferTarget) return alert('Chọn thành viên')
                                    try {
                                        await transferGroupOwnership({ conversationId: transferConvId, newOwnerId: transferTarget })
                                        setShowTransferModal(false)
                                        await leaveGroup({ conversationId: transferConvId })
                                        setConversations(prev => prev.filter(c => String(c._id) !== String(transferConvId)))
                                        setGroupPanelConv(null)
                                        setShowGroupPanel(false)
                                        if (selectedConvRef.current && String(selectedConvRef.current._id) === String(transferConvId)) {
                                            setSelectedConv(null); selectedConvRef.current = null; setMessages([])
                                        }
                                        fetchConversations()
                                    } catch (e) { alert(e.message || 'Lỗi') }
                                }}>Chuyển quyền và rời nhóm</button>
                            </div>
                        </div>
                    </div>
                )
            })()}
        </>
    )
}
