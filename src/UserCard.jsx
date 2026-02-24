import React, { useEffect, useState } from 'react'
import { getProfile, updateProfile, uploadAvatar, uploadBanner, changePassword } from './api'
import './usercard.css'

export default function UserCard({ onClose }) {
    const [user, setUser] = useState(null)
    const [editing, setEditing] = useState(false)
    const [form, setForm] = useState({ name: '', dateOfBirth: '', bio: '', gender: '', bannerUrl: '' })
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [showChangePassword, setShowChangePassword] = useState(false)
    const [cpForm, setCpForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' })
    const [cpMessage, setCpMessage] = useState('')
    const [cpLoading, setCpLoading] = useState(false)

    useEffect(() => {
        fetchProfile()
    }, [])

    const fetchProfile = async () => {
        try {
            const res = await getProfile()
            setUser(res.user)
            setForm({
                name: res.user.name || '',
                dateOfBirth: res.user.dateOfBirth ? new Date(res.user.dateOfBirth).toISOString().slice(0, 10) : '',
                bio: res.user.bio || '',
                gender: res.user.gender || '',
                bannerUrl: res.user.bannerUrl || ''
            })
        } catch (err) {
            setMessage(err.message || 'Không thể lấy thông tin')
        }
    }

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

    const save = async () => {
        setLoading(true)
        setMessage('')
        try {
            const payload = { name: form.name }
            if (form.dateOfBirth) payload.dateOfBirth = form.dateOfBirth
            if (form.bio !== undefined) payload.bio = form.bio
            if (form.gender !== undefined) payload.gender = form.gender
            if (form.bannerUrl !== undefined) payload.bannerUrl = form.bannerUrl
            const res = await updateProfile(payload)
            setUser(res.user)
            setEditing(false)
            setMessage('Cập nhật thành công')
        } catch (err) {
            setMessage(err.message || 'Lỗi')
        } finally {
            setLoading(false)
        }
    }

    const handleFile = async (e) => {
        const file = e.target.files[0]
        if (!file) return
        // Client-side validation: only allow image types
        if (!file.type || !file.type.startsWith('image/')) {
            setMessage('Chỉ cho phép file hình ảnh cho avatar')
            return
        }
        setLoading(true)
        setMessage('')
        try {
            const res = await uploadAvatar(file)
            // backend returns avatarUrl in res
            await fetchProfile()
            setMessage('Avatar cập nhật')
        } catch (err) {
            setMessage(err.message || 'Lỗi upload')
        } finally {
            setLoading(false)
        }
    }

    const handleCpChange = (e) => setCpForm({ ...cpForm, [e.target.name]: e.target.value })

    const doChangePassword = async (e) => {
        e.preventDefault()
        setCpMessage('')
        if (cpForm.newPassword !== cpForm.confirmPassword) return setCpMessage('Mật khẩu xác nhận không khớp')
        if (cpForm.newPassword.length < 8) return setCpMessage('Mật khẩu mới phải có ít nhất 8 ký tự')
        setCpLoading(true)
        try {
            const res = await changePassword({ oldPassword: cpForm.oldPassword, newPassword: cpForm.newPassword })
            setCpMessage(res.message || 'Đổi mật khẩu thành công')
            setCpForm({ oldPassword: '', newPassword: '', confirmPassword: '' })
            setTimeout(() => { setShowChangePassword(false); setCpMessage('') }, 1800)
        } catch (err) {
            setCpMessage(err.message || 'Lỗi đổi mật khẩu')
        } finally {
            setCpLoading(false)
        }
    }

    const handleBannerFile = async (e) => {
        const file = e.target.files[0]
        if (!file) return
        // Client-side validation: only allow image types for banner
        if (!file.type || !file.type.startsWith('image/')) {
            setMessage('Chỉ cho phép file hình ảnh cho banner')
            return
        }
        setLoading(true)
        setMessage('')
        try {
            const res = await uploadBanner(file)
            await fetchProfile()
            setMessage('Banner cập nhật')
        } catch (err) {
            setMessage(err.message || 'Lỗi upload banner')
        } finally {
            setLoading(false)
        }
    }

    if (!user) return (
        <div className="user-card">Đang tải...</div>
    )

    return (
        <div className="user-card">
            <div className="banner">
                {user.bannerUrl ? <img src={user.bannerUrl} alt="banner" /> : <div className="banner-fallback" />}
                <div className="avatar">
                    <img src={user.avatarUrl || 'https://via.placeholder.com/80'} alt="avatar" />
                </div>
            </div>
            <div className="content">
                <div className="header-row">
                    <div>
                        <div className="name">{user.name}</div>
                        <div className="email">{user.email}</div>
                        <div className="meta">Ngày sinh: {user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().slice(0, 10) : '—'} · Giới tính: {user.gender || '—'}</div>
                    </div>
                    <div className="controls">
                        <label className="upload">
                            Tải ảnh
                            <input type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
                        </label>
                        <label className="upload">
                            Tải banner
                            <input type="file" accept="image/*" onChange={handleBannerFile} style={{ display: 'none' }} />
                        </label>
                    </div>
                </div>

                {!editing && (
                    <div className="bio">{user.bio || 'Chưa có giới thiệu'}</div>
                )}

                {editing && (
                    <div className="edit-fields">
                        <input name="name" value={form.name} onChange={handleChange} />
                        <input name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={handleChange} />
                        <textarea name="bio" value={form.bio} onChange={handleChange} placeholder="Giới thiệu ngắn" />
                        <select name="gender" value={form.gender} onChange={handleChange}>
                            <option value="">Chọn giới tính</option>
                            <option value="Nam">Nam</option>
                            <option value="Nữ">Nữ</option>
                        </select>
                        <input name="bannerUrl" value={form.bannerUrl} onChange={handleChange} placeholder="Banner URL (hoặc dán link)" />
                        <div className="actions">
                            <button className="primary" onClick={save} disabled={loading}>{loading ? 'Đang lưu...' : 'Lưu'}</button>
                            <button className="ghost" onClick={() => setEditing(false)}>Hủy</button>
                        </div>
                    </div>
                )}

                {message && <div className="message">{message}</div>}

                {/* Change password section */}
                {showChangePassword && (
                    <form className="cp-form" onSubmit={doChangePassword}>
                        <div className="cp-title">🔒 Đổi mật khẩu</div>
                        <input
                            name="oldPassword"
                            type="password"
                            placeholder="Mật khẩu hiện tại"
                            value={cpForm.oldPassword}
                            onChange={handleCpChange}
                            autoFocus
                            required
                        />
                        <input
                            name="newPassword"
                            type="password"
                            placeholder="Mật khẩu mới (ít nhất 8 ký tự)"
                            value={cpForm.newPassword}
                            onChange={handleCpChange}
                            required
                        />
                        <input
                            name="confirmPassword"
                            type="password"
                            placeholder="Xác nhận mật khẩu mới"
                            value={cpForm.confirmPassword}
                            onChange={handleCpChange}
                            required
                        />
                        {cpMessage && (
                            <div className={`cp-message ${cpMessage.includes('thành công') ? 'success' : 'error'}`}>
                                {cpMessage}
                            </div>
                        )}
                        <div className="cp-actions">
                            <button type="submit" className="primary" disabled={cpLoading}>
                                {cpLoading ? 'Đang lưu...' : 'Xác nhận'}
                            </button>
                            <button type="button" className="ghost" onClick={() => { setShowChangePassword(false); setCpMessage(''); setCpForm({ oldPassword: '', newPassword: '', confirmPassword: '' }) }}>
                                Hủy
                            </button>
                        </div>
                    </form>
                )}

                <div className="footer-row">
                    <button className="ghost" onClick={() => setEditing(!editing)}>{editing ? 'Hủy' : 'Chỉnh sửa'}</button>
                    <button className="ghost" onClick={() => { setShowChangePassword(v => !v); setCpMessage('') }}>🔒 Đổi mật khẩu</button>
                    <button className="ghost" onClick={onClose}>Đóng</button>
                </div>
            </div>
        </div>
    )
}
