import React, { useState } from 'react'
import { signup, signin, sendOtp, verifyOtp, forgotPassword, resetPassword } from './api'
import './auth.css'

export default function AuthPage({ onLogin }) {
    const [mode, setMode] = useState('login') // 'login' | 'register' | 'forgot'
    const [form, setForm] = useState({ email: '', password: '', name: '', gender: '', dateOfBirth: '' })
    const [message, setMessage] = useState('')
    const [registerStep, setRegisterStep] = useState(1) // 1: fill form, 2: verify OTP
    const [signupOtp, setSignupOtp] = useState('')
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
        setRegisterStep(1)
        setSignupOtp('')
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
            await signup(payload)
            // Tự động gửi OTP sau khi đăng ký thành công
            await sendOtp({ email: form.email })
            setRegisterStep(2)
            setMessage('Đăng ký thành công! OTP đã được gửi đến email của bạn.')
        } catch (err) {
            setMessage(err.message || 'Lỗi đăng ký')
        } finally {
            setLoading(false)
        }
    }

    const doResendOtp = async () => {
        setMessage('')
        setLoading(true)
        try {
            await sendOtp({ email: form.email })
            setMessage('Đã gửi lại OTP. Kiểm tra email.')
        } catch (err) {
            setMessage(err.message || 'Lỗi gửi OTP')
        } finally {
            setLoading(false)
        }
    }

    const doVerifyOtp = async (e) => {
        e.preventDefault()
        if (!signupOtp) {
            setMessage('Vui lòng nhập mã OTP')
            return
        }
        setMessage('')
        setLoading(true)
        try {
            const res = await verifyOtp({ email: form.email, otp: signupOtp })
            setMessage(res.message || 'Xác thực thành công!')
            setTimeout(() => switchMode('login'), 1200)
        } catch (err) {
            setMessage(err.message || 'OTP không hợp lệ')
        } finally {
            setLoading(false)
        }
    }

    const doSignin = async (e) => {
        e.preventDefault()
        setMessage('')
        setLoading(true)
        try {
            const res = await signin({ email: form.email, password: form.password })
            setMessage(res.message || 'Đăng nhập thành công')
            if (res.token) {
                localStorage.setItem('token', res.token)
                onLogin && onLogin(true)
            }
        } catch (err) {
            setMessage(err.message || 'Lỗi đăng nhập')
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

                {/* Register form - Step 1: fill info */}
                {mode === 'register' && registerStep === 1 && (
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
                        <button type="submit" className="primary" disabled={loading}>
                            {loading ? 'Vui lòng chờ...' : 'Đăng ký'}
                        </button>
                    </form>
                )}

                {/* Register form - Step 2: verify OTP */}
                {mode === 'register' && registerStep === 2 && (
                    <form onSubmit={doVerifyOtp} className="form">
                        <p style={{ fontSize: 14, color: '#94a3b8', margin: '4px 0 8px' }}>
                            Mã OTP đã được gửi đến <strong>{form.email}</strong>
                        </p>
                        <input
                            type="text"
                            placeholder="Nhập mã OTP"
                            value={signupOtp}
                            onChange={e => setSignupOtp(e.target.value)}
                            maxLength={6}
                            className="otp-input"
                            autoFocus
                            required
                        />
                        <button type="submit" className="primary" disabled={loading}>
                            {loading ? 'Đang xác thực...' : 'Xác thực tài khoản'}
                        </button>
                        <button type="button" className="ghost" onClick={doResendOtp} disabled={loading}>
                            Gửi lại OTP
                        </button>
                    </form>
                )}

                {/* Login form */}
                {mode === 'login' && (
                    <form onSubmit={doSignin} className="form">
                        <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
                        <input name="password" type="password" placeholder="Mật khẩu" value={form.password} onChange={handleChange} required />
                        <button type="submit" className="primary" disabled={loading}>
                            {loading ? 'Đang xử lý...' : 'Đăng nhập'}
                        </button>
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

