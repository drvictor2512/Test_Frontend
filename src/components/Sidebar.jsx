import React from 'react'
import CombinedAvatar from './CombinedAvatar'
import { acceptFriendRequest, declineFriendRequest } from '../api'

export default function Sidebar({
    activePage, setActivePage,
    friendRequests, fetchFriendRequests, fetchFriends,
    searchEmail, setSearchEmail, setSearchQuery,
    loading, doSearch, searchMessage, searchResult,
    setShowAddFriendModal, setShowCreateGroup, setJoinCode, setShowJoinModal,
    friends, openDirectWithUser, doAddFriend,
    filteredConversations, filteredFriends,
    selectedConv, openConversation, currentUser,
    otherParticipant, getStatus, formatRelative,
    conversations,
    friendsView, setFriendsView,
    onlineStatus,
    handleLogout,
    openAIChat,
    setShowProfile,
}) {
    return (
        <aside className="sidebar">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 20 }}>💬 ChatApp</div>
                <div>
                    <button className="ghost" title="Chat với AI" onClick={openAIChat}>🤖</button>
                    <button className="ghost" onClick={() => setShowProfile(s => !s)}>👤</button>
                    <button className="ghost" onClick={handleLogout}>Đăng xuất</button>
                </div>
            </div>

            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <button className={activePage === 'conversations' ? 'primary' : 'ghost'} onClick={() => setActivePage('conversations')}>Tin nhắn</button>
                <button className={activePage === 'friends' ? 'primary' : 'ghost'} style={{ position: 'relative' }} onClick={() => setActivePage('friends')}>
                    Bạn bè
                    {(friendRequests.receive?.length || 0) > 0 && (
                        <span style={{ position: 'absolute', top: -6, right: -6, background: '#ef4444', color: '#fff', borderRadius: '999px', minWidth: 17, height: 17, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', lineHeight: 1, pointerEvents: 'none' }}>
                            {friendRequests.receive.length > 99 ? '99+' : friendRequests.receive.length}
                        </span>
                    )}
                </button>
            </div>

            {activePage === 'conversations' && (
                <div style={{ marginTop: 12 }}>
                    <div className="list-section">
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <input
                                className="search-input"
                                placeholder="Tìm theo tên hoặc email"
                                value={searchEmail}
                                onChange={e => { setSearchEmail(e.target.value); setSearchQuery(e.target.value) }}
                            />
                            <div className="search-icons">
                                <button title="Thêm bạn" className="icon-btn" onClick={() => setShowAddFriendModal(true)}>➕</button>
                                <button title="Tạo nhóm" className="icon-btn" onClick={() => setShowCreateGroup(true)}>👥</button>
                                <button title="Tham gia nhóm qua mã" className="icon-btn" onClick={() => { setJoinCode(''); setShowJoinModal(true) }}>🔗</button>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                            <button className="primary" onClick={doSearch} disabled={loading}>{loading ? 'Đang...' : 'Tìm'}</button>
                        </div>
                        {searchMessage && <div style={{ color: '#ffd6d6', marginTop: 6 }}>{searchMessage}</div>}
                        {searchResult && (
                            <div style={{ marginTop: 8 }}>
                                <div className="friend-item">
                                    <img src={searchResult.avatarUrl || 'https://via.placeholder.com/48'} alt="avatar" />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, color: '#fff' }}>{searchResult.name}</div>
                                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>{searchResult.email}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button className="primary" onClick={() => openDirectWithUser(searchResult._id)}>Nhắn</button>
                                        {!friends.find(fr => String(fr._id) === String(searchResult._id)) && (
                                            <button className="ghost" onClick={() => doAddFriend(searchResult)}>Kết bạn</button>
                                        )}
                                        {friends.find(fr => String(fr._id) === String(searchResult._id)) && (
                                            <div style={{ padding: '6px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', color: '#fff' }}>Đã là bạn</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
                        <h4 style={{ color: '#fff', marginTop: 12 }}>Cuộc trò chuyện</h4>
                        <div className="conversation-list">
                            {filteredConversations.filter(conv => !conv.isAI).map(conv => {
                                const other = conv.type === 'DIRECT' ? otherParticipant(conv.participants) : null
                                const avatar = other ? (other.avatarUrl || 'https://via.placeholder.com/44') : 'https://via.placeholder.com/44'
                                const title = conv.type === 'DIRECT' ? (other?.name || 'Direct') : (conv.groupName || conv.group?.name || 'Group')
                                return (
                                    <div key={conv._id} onClick={() => openConversation(conv)} className={`conversation-item ${selectedConv && selectedConv._id === conv._id ? 'active' : ''}`} style={{ position: 'relative' }}>
                                        <div style={{ position: 'relative' }} onClick={e => { e.stopPropagation(); if (conv.type === 'DIRECT') other && (() => { })() }}>
                                            {conv.type === 'GROUP' ? (
                                                <CombinedAvatar participants={conv.participants} size={44} />
                                            ) : (
                                                <>
                                                    <img src={avatar} className="conv-avatar" alt="av" />
                                                    {other && (() => {
                                                        const st = getStatus(other._id)
                                                        return st ? (
                                                            <span className={`status-badge ${st.status === 'online' ? 'online' : 'offline'}`} title={st.status === 'online' ? 'Online' : formatRelative(st.lastSeen)} />
                                                        ) : null
                                                    })()}
                                                </>
                                            )}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div className="title">{title}</div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    {(() => {
                                                        const last = conv.lastMessageAt || (conv.lastMessage && conv.lastMessage.createdAt)
                                                        const rightText = last ? formatRelative(last) : ''
                                                        return rightText ? (<div style={{ fontSize: 12, color: '#94a3b8' }}>{rightText}</div>) : null
                                                    })()}
                                                    {(() => {
                                                        const unread = currentUser && conv.unreadCounts ? (conv.unreadCounts[String(currentUser._id)] || 0) : 0
                                                        return unread > 0 ? (
                                                            <div style={{ background: '#ef4444', color: '#fff', borderRadius: 999, minWidth: 18, height: 18, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>{unread > 99 ? '99+' : unread}</div>
                                                        ) : null
                                                    })()}
                                                </div>
                                            </div>
                                            <div className="preview">{conv.lastMessage?.content || ''}</div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}

            {activePage === 'friends' && (
                <div style={{ marginTop: 12 }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                        <button className={friendsView === 'list' ? 'primary' : 'ghost'} onClick={() => setFriendsView('list')}>Bạn bè</button>
                        <button className={friendsView === 'groups' ? 'primary' : 'ghost'} onClick={() => setFriendsView('groups')}>Nhóm</button>
                        <button className={friendsView === 'requests' ? 'primary' : 'ghost'} style={{ position: 'relative' }} onClick={() => setFriendsView('requests')}>
                            Lời mời
                            {(friendRequests.receive?.length || 0) > 0 && (
                                <span style={{ position: 'absolute', top: -6, right: -6, background: '#ef4444', color: '#fff', borderRadius: '999px', minWidth: 17, height: 17, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', lineHeight: 1, pointerEvents: 'none' }}>
                                    {friendRequests.receive.length > 99 ? '99+' : friendRequests.receive.length}
                                </span>
                            )}
                        </button>
                        <button className={friendsView === 'groupRequests' ? 'primary' : 'ghost'} onClick={() => setFriendsView('groupRequests')}>Lời mời nhóm</button>
                        <div style={{ marginLeft: 'auto' }}>
                            <button className="primary" onClick={() => setShowCreateGroup(true)}>Tạo nhóm</button>
                        </div>
                    </div>

                    {friendsView === 'list' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {filteredFriends.map(f => (
                                <div key={f._id} className="friend-item">
                                    <div style={{ position: 'relative' }}>
                                        <img src={f.avatarUrl || 'https://via.placeholder.com/40'} alt="a" />
                                        {(() => {
                                            const st = getStatus(f._id)
                                            return st ? <span className={`status-badge ${st.status === 'online' ? 'online' : 'offline'}`} title={st.status === 'online' ? 'Online' : formatRelative(st.lastSeen)} /> : null
                                        })()}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, color: '#fff' }}>{f.name}</div>
                                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>{f.email}</div>
                                    </div>
                                    <div>
                                        <button className="primary" onClick={() => openDirectWithUser(f._id)}>Nhắn</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {friendsView === 'groups' && (
                        <div>
                            <h4 style={{ marginTop: 6 }}>Nhóm của bạn</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {(conversations.filter(c => c.type === 'GROUP') || []).map(g => (
                                    <div key={g._id} className="friend-item">
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 700, color: '#fff' }}>{g.groupName || g.group?.name || 'Nhóm'}</div>
                                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>{(g.participants || []).length} thành viên</div>
                                        </div>
                                        <div>
                                            <button className="primary" onClick={() => { openConversation(g); setActivePage('conversations') }}>Mở</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {friendsView === 'requests' && (
                        <div>
                            <h4 style={{ marginTop: 6 }}>Lời mời kết bạn</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {(friendRequests.receive || []).map(r => (
                                    <div key={r._id} className="friend-item">
                                        <div style={{ position: 'relative' }}>
                                            <img src={(r.fromUserId && r.fromUserId.avatarUrl) || 'https://via.placeholder.com/40'} alt="a" />
                                            {r.fromUserId && (() => {
                                                const st = getStatus(r.fromUserId._id || r.fromUserId)
                                                return st ? <span className={`status-badge ${st.status === 'online' ? 'online' : 'offline'}`} title={st.status === 'online' ? 'Online' : formatRelative(st.lastSeen)} /> : null
                                            })()}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, color: '#fff' }}>{(r.fromUserId && r.fromUserId.name) || 'Người dùng'}</div>
                                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>{(r.fromUserId && r.fromUserId.email) || ''}</div>
                                            {r.message && <div style={{ fontSize: 12, color: '#cbd5e1', marginTop: 4, fontStyle: 'italic' }}>"{r.message}"</div>}
                                        </div>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button className="primary" onClick={async () => { try { await acceptFriendRequest(r._id); await fetchFriendRequests(); await fetchFriends(); } catch (err) { alert(err.message || 'Lỗi') } }}>Chấp nhận</button>
                                            <button className="ghost" onClick={async () => { try { await declineFriendRequest(r._id); await fetchFriendRequests(); } catch (err) { alert(err.message || 'Lỗi') } }}>Từ chối</button>
                                        </div>
                                    </div>
                                ))}
                                {(friendRequests.sent || []).map(r => (
                                    <div key={r._id} className="friend-item">
                                        <div style={{ position: 'relative' }}>
                                            <img src={(r.toUserId && r.toUserId.avatarUrl) || 'https://via.placeholder.com/40'} alt="a" />
                                            {r.toUserId && (() => {
                                                const st = getStatus(r.toUserId._id || r.toUserId)
                                                return st ? <span className={`status-badge ${st.status === 'online' ? 'online' : 'offline'}`} title={st.status === 'online' ? 'Online' : (st.lastSeen ? formatRelative(st.lastSeen) : '—')} /> : null
                                            })()}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, color: '#fff' }}>{(r.toUserId && r.toUserId.name) || 'Người dùng'}</div>
                                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>{(r.toUserId && r.toUserId.email) || ''}</div>
                                        </div>
                                        <div style={{ color: '#94a3b8', padding: '6px 10px', borderRadius: 8 }}>Đã gửi</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {friendsView === 'groupRequests' && (
                        <div>
                            <h4 style={{ marginTop: 6 }}>Lời mời vào nhóm</h4>
                            <div style={{ color: '#94a3b8' }}>Không có lời mời vào nhóm (chưa có endpoint trên server).</div>
                        </div>
                    )}
                </div>
            )}
        </aside>
    )
}
