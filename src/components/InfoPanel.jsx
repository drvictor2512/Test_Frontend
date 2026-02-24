import React from 'react'
import CombinedAvatar from './CombinedAvatar'
import { isImageUrl, isVideoUrl, isGifUrl, isDocumentUrl, basenameFromUrl, downloadFile } from '../utils/mediaHelpers'
import { blockUser, unblockUser } from '../api'

export default function InfoPanel({
    groupPanelConv,
    currentUser,
    otherParticipant,
    getStatus,
    formatRelative,
    onlineStatus,
    openUserProfile,
    infoPanelCollapsed, setInfoPanelCollapsed,
    setShowGroupPanel,
    getGroupInviteLink, setInviteCode, setShowInviteModal,
    setRenameInput, setShowRenameModal,
    handleLeaveGroup,
    blockedUsers, setBlockedUsers,
    messages,
    openImageModal,
    selectedFriends, setSelectedFriends,
    friends,
    handleAddMember,
    doAddFriend,
    friendRequests,
    openMemberMenu, setOpenMemberMenu,
    handleToggleDeputy, handleRemoveMember,
}) {
    return (
        <div className="info-sidebar">
            {/* Header */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>
                    {groupPanelConv.type === 'GROUP' ? 'Thông tin nhóm' : 'Thông tin'}
                </div>
                <button className="ghost" style={{ padding: '4px 8px', fontSize: 16, lineHeight: 1 }} onClick={() => setShowGroupPanel(false)}>✕</button>
            </div>

            {/* Avatar + Name */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 16px 16px', borderBottom: '1px solid #e2e8f0' }}>
                {groupPanelConv.type === 'GROUP' ? (
                    <>
                        <CombinedAvatar participants={groupPanelConv.participants} size={72} />
                        <div style={{ fontWeight: 700, fontSize: 16, marginTop: 10, textAlign: 'center', color: '#0f172a' }}>
                            {groupPanelConv.groupName || (groupPanelConv.groupId && groupPanelConv.groupId.name) || 'Nhóm'}
                        </div>
                        <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                            {(groupPanelConv.participants || []).length} thành viên
                        </div>
                        {(() => {
                            const myPart = (groupPanelConv.participants || []).find(p => String(p._id || p.userId) === String(currentUser?._id))
                            const canLeave = !!myPart
                            return (
                                <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                                    <button className="ghost" style={{ fontSize: 12, padding: '5px 10px' }} onClick={async () => { try { const res = await getGroupInviteLink(groupPanelConv._id); setInviteCode(res.inviteCode); setShowInviteModal(true) } catch (e) { alert(e.message || 'Lỗi') } }}>🔗 Link mời</button>
                                    <button className="ghost" style={{ fontSize: 12, padding: '5px 10px' }} onClick={() => { const cur = groupPanelConv.groupName || (groupPanelConv.groupId && groupPanelConv.groupId.name) || ''; setRenameInput(cur); setShowRenameModal(true) }}>✏️ Đổi tên</button>
                                    {canLeave && <button className="group-action-btn danger" style={{ fontSize: 12, padding: '5px 10px' }} onClick={() => handleLeaveGroup(groupPanelConv._id)}>🚪 Rời nhóm</button>}
                                </div>
                            )
                        })()}
                    </>
                ) : (() => {
                    const other = otherParticipant(groupPanelConv.participants)
                    const st = other ? onlineStatus[String(other._id)] : null
                    const statusText = !st ? 'Offline' : st.status === 'online' ? 'Online' : (st.lastSeen ? formatRelative(st.lastSeen) : 'Offline')
                    return (
                        <>
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                                <img src={other?.avatarUrl || 'https://via.placeholder.com/72'} alt="avatar" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', cursor: 'pointer', border: '2px solid #e2e8f0' }} onClick={() => other && openUserProfile(other)} />
                                {st && <span className={`status-badge ${st.status === 'online' ? 'online' : 'offline'}`} style={{ position: 'absolute', bottom: 2, right: 2, width: 14, height: 14, border: '2px solid #f4f8ff' }} />}
                            </div>
                            <div style={{ fontWeight: 700, fontSize: 16, marginTop: 10, color: '#0f172a' }}>{other?.name || 'Người dùng'}</div>
                            <div style={{ fontSize: 13, color: st?.status === 'online' ? '#22c55e' : '#64748b', marginTop: 4 }}>{statusText}</div>
                            {(() => {
                                const otherId = other ? String(other._id) : null
                                const isBlocked = otherId && blockedUsers.includes(otherId)
                                return otherId ? (
                                    <button
                                        className={isBlocked ? 'ghost' : 'group-action-btn danger'}
                                        style={{ marginTop: 12, fontSize: 13, padding: '6px 16px' }}
                                        onClick={async () => {
                                            try {
                                                if (isBlocked) {
                                                    await unblockUser(otherId)
                                                    setBlockedUsers(prev => prev.filter(id => id !== otherId))
                                                } else {
                                                    if (!window.confirm(`Chặn ${other?.name || 'người này'}? Bạn sẽ không thể gửi tin nhắn cho nhau.`)) return
                                                    await blockUser(otherId)
                                                    setBlockedUsers(prev => [...prev, otherId])
                                                }
                                            } catch (e) { alert(e.message || 'Lỗi') }
                                        }}
                                    >
                                        {isBlocked ? '✅ Bỏ chặn' : '🚫 Chặn'}
                                    </button>
                                ) : null
                            })()}
                        </>
                    )
                })()}
            </div>

            {/* Members section – GROUP only */}
            {groupPanelConv.type === 'GROUP' && (
                <div style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => setInfoPanelCollapsed(prev => ({ ...prev, members: !prev.members }))}>
                        <span style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>👥 Thành viên ({(groupPanelConv.participants || []).length})</span>
                        <span style={{ fontSize: 11, color: '#64748b' }}>{infoPanelCollapsed.members ? '▶' : '▼'}</span>
                    </div>
                    {!infoPanelCollapsed.members && (
                        <div style={{ padding: '0 12px 12px' }}>
                            {(groupPanelConv.participants || []).map(p => {
                                const pid = String(p._id || p.userId)
                                const displayName = p.name || pid
                                const ownerId = groupPanelConv.groupId?.ownerId || groupPanelConv.ownerId
                                const deputyIds = groupPanelConv.groupId?.deputyIds || groupPanelConv.deputyIds || []
                                const isOwner = ownerId && String(ownerId) === String(currentUser?._id)
                                const isDeputy = Array.isArray(deputyIds) && deputyIds.map(String).includes(String(currentUser?._id))
                                const isSelf = pid === String(currentUser?._id)
                                const isFriend = friends.some(f => String(f._id) === pid)
                                const hasPending = friendRequests?.sent?.some(r => String(r.toUserId?._id || r.toUserId) === pid)
                                const ownerIdStr = ownerId ? String(ownerId) : ''
                                const deputyIdStrs = Array.isArray(deputyIds) ? deputyIds.map(String) : []
                                const isTargetOwner = p.role === 'Trưởng nhóm' || (ownerIdStr && ownerIdStr === pid)
                                const isTargetDeputy = p.role === 'Phó nhóm' || deputyIdStrs.includes(pid)
                                const canManage = !isSelf && !isTargetOwner && (isOwner || isDeputy)
                                return (
                                    <div key={pid} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', position: 'relative', borderBottom: '1px solid #f1f5f9' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, cursor: 'pointer', minWidth: 0 }}
                                            onClick={() => { openUserProfile(p); setOpenMemberMenu(null) }}>
                                            <img src={p.avatarUrl || 'https://via.placeholder.com/36'} alt="a" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                                            <div style={{ minWidth: 0 }}>
                                                <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
                                                {(isTargetOwner || isTargetDeputy) && <div style={{ fontSize: 11, color: isTargetOwner ? '#f59e0b' : '#60a5fa' }}>{p.role || ''}</div>}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
                                            {!isSelf && !isFriend && !hasPending && (
                                                <button className="ghost" style={{ fontSize: 11, padding: '3px 7px' }} onClick={() => doAddFriend({ _id: pid, name: displayName, avatarUrl: p.avatarUrl })}>+Bạn</button>
                                            )}
                                            {!isSelf && hasPending && <span style={{ fontSize: 11, color: '#94a3b8' }}>Đã gửi</span>}
                                            {canManage && (
                                                <button className="group-action-btn" onClick={e => { e.stopPropagation(); setOpenMemberMenu(openMemberMenu === pid ? null : pid) }} style={{ width: 28, height: 28, borderRadius: 14, fontSize: 18, padding: 0, lineHeight: '28px', textAlign: 'center' }}>⋯</button>
                                            )}
                                        </div>
                                        {openMemberMenu === pid && canManage && (
                                            <div style={{ position: 'absolute', right: 0, top: 40, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 20, minWidth: 160 }}>
                                                {isOwner && (
                                                    <button style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#334155' }}
                                                        onClick={() => { handleToggleDeputy(groupPanelConv._id, pid, !isTargetDeputy); setOpenMemberMenu(null) }}>
                                                        {isTargetDeputy ? '⬇ Bỏ phó nhóm' : '⬆ Phân phó nhóm'}
                                                    </button>
                                                )}
                                                {(isOwner || (isDeputy && !isTargetDeputy)) && (
                                                    <button style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#ef4444', borderTop: '1px solid #f1f5f9' }}
                                                        onClick={() => { handleRemoveMember(groupPanelConv._id, pid); setOpenMemberMenu(null) }}>🗑 Xoá thành viên</button>
                                                )}
                                                <button style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#64748b', borderTop: '1px solid #f1f5f9' }} onClick={() => setOpenMemberMenu(null)}>Đóng</button>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                            <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
                                <select onChange={e => setSelectedFriends([e.target.value])} style={{ flex: 1, fontSize: 12, padding: '5px 8px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', color: '#374151' }}>
                                    <option value="">Thêm thành viên...</option>
                                    {friends.filter(f => !(groupPanelConv.participants || []).some(p => String(p._id || p.userId) === String(f._id))).map(f => <option key={f._id} value={f._id}>{f.name || f.email}</option>)}
                                </select>
                                <button className="primary" style={{ fontSize: 12, padding: '5px 10px' }} onClick={async () => { if (!selectedFriends || selectedFriends.length === 0 || !selectedFriends[0]) return alert('Chọn thành viên'); await handleAddMember(groupPanelConv._id, selectedFriends[0]) }}>Thêm</button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Media section */}
            {(() => {
                const mediaMessages = messages.filter(m => !m.isRecalled && (
                    (m.fileUrl && (isImageUrl(m.fileUrl) || isVideoUrl(m.fileUrl) || isGifUrl(m.fileUrl))) ||
                    (!m.fileUrl && (isImageUrl(m.content) || isVideoUrl(m.content) || isGifUrl(m.content)))
                ))
                return (
                    <div style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', cursor: 'pointer', userSelect: 'none' }}
                            onClick={() => setInfoPanelCollapsed(prev => ({ ...prev, media: !prev.media }))}>
                            <span style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>🖼️ Ảnh/Video ({mediaMessages.length})</span>
                            <span style={{ fontSize: 11, color: '#64748b' }}>{infoPanelCollapsed.media ? '▶' : '▼'}</span>
                        </div>
                        {!infoPanelCollapsed.media && (
                            <div style={{ padding: '0 12px 12px', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 3 }}>
                                {mediaMessages.slice(0, 12).map(m => {
                                    const url = m.fileUrl || m.content
                                    return isVideoUrl(url) ? (
                                        <video key={m._id} src={url} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 4, cursor: 'pointer', background: '#000' }} onClick={() => openImageModal(url)} />
                                    ) : (
                                        <img key={m._id} src={url} alt="media" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 4, cursor: 'zoom-in' }} onClick={() => openImageModal(url)} />
                                    )
                                })}
                                {mediaMessages.length === 0 && <div style={{ gridColumn: '1/-1', color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: '8px 0' }}>Chưa có ảnh/video</div>}
                            </div>
                        )}
                    </div>
                )
            })()}

            {/* Files section */}
            {(() => {
                const fileMessages = messages.filter(m => !m.isRecalled && (
                    (m.fileUrl && isDocumentUrl(m.fileUrl)) ||
                    (!m.fileUrl && isDocumentUrl(m.content))
                ))
                return (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', cursor: 'pointer', userSelect: 'none' }}
                            onClick={() => setInfoPanelCollapsed(prev => ({ ...prev, files: !prev.files }))}>
                            <span style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>📁 File ({fileMessages.length})</span>
                            <span style={{ fontSize: 11, color: '#64748b' }}>{infoPanelCollapsed.files ? '▶' : '▼'}</span>
                        </div>
                        {!infoPanelCollapsed.files && (
                            <div style={{ padding: '0 12px 12px' }}>
                                {fileMessages.slice(0, 10).map(m => {
                                    const url = m.fileUrl || m.content
                                    return (
                                        <div key={m._id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                                            <span style={{ fontSize: 20, flexShrink: 0 }}>📎</span>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: 12, fontWeight: 500, color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{basenameFromUrl(url)}</div>
                                                <div style={{ fontSize: 11, color: '#94a3b8' }}>{m.createdAt ? new Date(m.createdAt).toLocaleDateString('vi-VN') : ''}</div>
                                            </div>
                                            <button onClick={() => downloadFile(url, basenameFromUrl(url))} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: 16, flexShrink: 0, padding: 4 }} title="Tải về">⬇</button>
                                        </div>
                                    )
                                })}
                                {fileMessages.length === 0 && <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: '8px 0' }}>Chưa có file</div>}
                            </div>
                        )}
                    </div>
                )
            })()}
        </div>
    )
}
