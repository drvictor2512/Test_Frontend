import React, { useState } from 'react'
import { signup, signin, sendOtp, forgotPassword, resetPassword } from './api'
import './auth.css'

export default function AuthPage({ onLogin }) {
    const [mode, setMode] = useState('login') // 'login' | 'register' | 'forgot'
    const [form, setForm] = useState({ email: '', password: '', name: '', gender: '', dateOfBirth: '', otp: '' })
    const [message, setMessage] = useState('')
    const [otpNeeded, setOtpNeeded] = useState(false)
    const [otp, setOtp] = useState('')
    const [loading, setLoading] = useState(false)

    // Forgot password states
    const [forgotStep, setForgotStep] = useState(1) // 1: enter email, 2: enter OTP + new password
    const [forgotEmail, setForgotEmail] = useState('')
    const [forgotOtp, setForgotOtp] = useState('')
    const [forgotNewPassword, setForgotNewPassword] = useState('')
    const [forgotConfirmPassword, setForgotConfirmPassword] = useState('')

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

    const switchMode = (newMode) => {
        setMode(newMode)
        setMessage('')
        setOtpNeeded(false)
        setForgotStep(1)
        setForgotEmail('')
        setForgotOtp('')
        setForgotNewPassword('')
        setForgotConfirmPassword('')
    }

    const doSignup = async (e) => {
        e.preventDefault()
        setMessage('')
        setLoading(true)
        try {
            const payload = { email: form.email, password: form.password, name: form.name }
            if (form.gender) payload.gender = form.gender
            if (form.dateOfBirth) payload.dateOfBirth = form.dateOfBirth
            const res = await signup(payload)
            setMessage(res.message || 'Đăng ký thành công. Vui lòng gửi OTP để xác thực.')
            switchMode('login')
        } catch (err) {
            setMessage(err.message || 'Lỗi đăng ký')
        } finally {
            setLoading(false)
        }
    }

    const doSendOtp = async () => {
        setMessage('')
        setLoading(true)
        try {
            const res = await sendOtp({ email: form.email })
            setMessage(res.message || 'Đã gửi OTP. Kiểm tra email.')
        } catch (err) {
            setMessage(err.message || 'Lỗi gửi OTP')
        } finally {
            setLoading(false)
        }
    }

    const doSignin = async (e) => {
        e.preventDefault()
        setMessage('')
        setLoading(true)
        try {
            const payload = { email: form.email, password: form.password }
            if (otp) payload.otp = otp
            const res = await signin(payload)
            setMessage(res.message || 'Đăng nhập thành công')
            setOtpNeeded(false)
            if (res.token) {
                localStorage.setItem('token', res.token)
                onLogin && onLogin(true)
            }
        } catch (err) {
            if (err.otpRequired) {
                setOtpNeeded(true)
                setMessage('Đã gửi mã OTP. Vui lòng kiểm tra email.')
                try {
                    await sendOtp({ email: form.email })
                } catch (sErr) {
                    setMessage((sErr && sErr.message) ? sErr.message : 'Không thể gửi OTP tự động')
                }
            } else {
                setMessage(err.message || 'Lỗi đăng nhập')
            }
        } finally {
            setLoading(false)
        }
    }

    const verifyOtpAndSignin = async (e) => {
        e && e.preventDefault()
        setMessage('')
        setLoading(true)
        try {
            const payload = { email: form.email, password: form.password, otp }
            const res = await signin(payload)
            setMessage(res.message || 'Đăng nhập thành công')
            setOtpNeeded(false)
            if (res.token) {
                localStorage.setItem('token', res.token)
                onLogin && onLogin(true)
            }
        } catch (err) {
            setMessage(err.message || 'Lỗi xác thực OTP')
        } finally {
            setLoading(false)
        }
    }

    // Step 1: Send OTP to email
    const doSendForgotOtp = async (e) => {
        e.preventDefault()
        if (!forgotEmail) return setMessage('Vui lòng nhập email')
        setMessage('')
        setLoading(true)
        try {
            const res = await forgotPassword({ email: forgotEmail })
            setMessage(res.message || 'Đã gửi OTP đến email của bạn')
            setForgotStep(2)
        } catch (err) {
            setMessage(err.message || 'Lỗi gửi OTP')
        } finally {
            setLoading(false)
        }
    }

    // Step 2: Reset password with OTP
    const doResetPassword = async (e) => {
        e.preventDefault()
        if (forgotNewPassword !== forgotConfirmPassword) return setMessage('Mật khẩu xác nhận không khớp')
        if (forgotNewPassword.length < 8) return setMessage('Mật khẩu mới phải có ít nhất 8 ký tự')
        setMessage('')
        setLoading(true)
        try {
            const res = await resetPassword({ email: forgotEmail, otp: forgotOtp, newPassword: forgotNewPassword })
            setMessage(res.message || 'Đặt lại mật khẩu thành công!')
            // Auto return to login after success
            setTimeout(() => switchMode('login'), 1500)
        } catch (err) {
            setMessage(err.message || 'Lỗi đặt lại mật khẩu')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-root">
            <div className="card glass">
                <div className="brand">
                    <div className="logo">💬</div>
                    <div>
                        <h2>ChatApp — Test</h2>
                        <div className="sub">Giao diện kiểm thử đăng nhập / OTP</div>
                    </div>
                </div>

                {/* Tabs: only show for login/register */}
                {mode !== 'forgot' && (
                    <div className="tabs">
                        <button className={mode === 'login' ? 'active' : ''} onClick={() => switchMode('login')} disabled={loading}>Đăng nhập</button>
                        <button className={mode === 'register' ? 'active' : ''} onClick={() => switchMode('register')} disabled={loading}>Đăng ký</button>
                    </div>
                )}

                {/* Register form */}
                {mode === 'register' && (
                    <form onSubmit={doSignup} className="form">
                        <input name="name" placeholder="Tên" value={form.name} onChange={handleChange} required />
                        <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
                        <input name="password" type="password" placeholder="Mật khẩu" value={form.password} onChange={handleChange} required />
                        <input name="dateOfBirth" type="date" value={form.dateOfBirth || ''} onChange={handleChange} />
                        <select name="gender" value={form.gender} onChange={handleChange}>
                            <option value="">Chọn giới tính (tùy chọn)</option>
                            <option value="Nam">Nam</option>
                            <option value="Nữ">Nữ</option>
                        </select>
                        <button type="submit" className="primary" disabled={loading}>{loading ? 'Vui lòng chờ...' : 'Đăng ký'}</button>
                    </form>
                )}

                {/* Login form */}
                {mode === 'login' && (
                    <form onSubmit={otpNeeded ? verifyOtpAndSignin : doSignin} className="form">
                        <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
                        <input name="password" type="password" placeholder="Mật khẩu" value={form.password} onChange={handleChange} required />
                        {otpNeeded && (
                            <input name="otp" placeholder="OTP" value={otp} onChange={(e) => setOtp(e.target.value)} autoFocus />
                        )}
                        <div className="actions">
                            <button type="submit" className="primary" disabled={loading}>
                                {loading ? (otpNeeded ? 'Đang xác thực...' : 'Đang xử lý...') : (otpNeeded ? 'Xác thực OTP' : 'Đăng nhập')}
                            </button>
                            {otpNeeded && (
                                <button type="button" onClick={doSendOtp} disabled={loading} className="ghost">Gửi lại OTP</button>
                            )}
                        </div>
                        <button type="button" className="forgot-link" onClick={() => switchMode('forgot')} disabled={loading}>
                            Quên mật khẩu?
                        </button>
                    </form>
                )}

                {/* Forgot password flow */}
                {mode === 'forgot' && (
                    <div className="forgot-container">
                        <div className="forgot-header">
                            <button className="back-btn" onClick={() => switchMode('login')} disabled={loading}>← Quay lại</button>
                            <h3 className="forgot-title">Quên mật khẩu</h3>
                        </div>

                        {/* Step indicators */}
                        <div className="step-indicator">
                            <div className={`step ${forgotStep >= 1 ? 'active' : ''}`}>
                                <div className="step-dot">1</div>
                                <span>Xác minh email</span>
                            </div>
                            <div className="step-line" />
                            <div className={`step ${forgotStep >= 2 ? 'active' : ''}`}>
                                <div className="step-dot">2</div>
                                <span>Đặt lại mật khẩu</span>
                            </div>
                        </div>

                        {/* Step 1: Email entry */}
                        {forgotStep === 1 && (
                            <form onSubmit={doSendForgotOtp} className="form">
                                <p className="forgot-desc">Nhập địa chỉ email của bạn. Chúng tôi sẽ gửi mã OTP để xác minh.</p>
                                <input
                                    type="email"
                                    placeholder="Địa chỉ email"
                                    value={forgotEmail}
                                    onChange={e => setForgotEmail(e.target.value)}
                                    required
                                    autoFocus
                                />
                                <button type="submit" className="primary" disabled={loading}>
                                    {loading ? 'Đang gửi...' : 'Gửi mã OTP'}
                                </button>
                            </form>
                        )}

                        {/* Step 2: OTP + new password */}
                        {forgotStep === 2 && (
                            <form onSubmit={doResetPassword} className="form">
                                <p className="forgot-desc">Nhập mã OTP đã gửi đến <strong>{forgotEmail}</strong> và mật khẩu mới.</p>
                                <input
                                    type="text"
                                    placeholder="Mã OTP"
                                    value={forgotOtp}
                                    onChange={e => setForgotOtp(e.target.value)}
                                    required
                                    autoFocus
                                    maxLength={6}
                                    className="otp-input"
                                />
                                <input
                                    type="password"
                                    placeholder="Mật khẩu mới (ít nhất 8 ký tự)"
                                    value={forgotNewPassword}
                                    onChange={e => setForgotNewPassword(e.target.value)}
                                    required
                                />
                                <input
                                    type="password"
                                    placeholder="Xác nhận mật khẩu mới"
                                    value={forgotConfirmPassword}
                                    onChange={e => setForgotConfirmPassword(e.target.value)}
                                    required
                                />
                                <div className="actions">
                                    <button type="submit" className="primary" disabled={loading}>
                                        {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
                                    </button>
                                    <button type="button" className="ghost" onClick={doSendForgotOtp} disabled={loading}>
                                        Gửi lại OTP
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                )}

                {message && <div className={`message ${message.includes('thành công') || message.includes('Đã gửi') ? 'success' : ''}`}>{message}</div>}
                {mode !== 'forgot' && <div className="hint">Token lưu trong localStorage sau đăng nhập để test API</div>}
            </div>
        </div>
    )
}

