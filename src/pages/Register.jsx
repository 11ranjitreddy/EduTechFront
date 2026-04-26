import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import { Eye, EyeOff, Mail } from 'lucide-react';
import './Auth.css';

import { AUTH_URL as BASE_URL } from '../config/api';

const Register = () => {
    const [step, setStep] = useState(1);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        countryCode: '+91',
        mobile: '',
        password: '',
        confirmPassword: ''
    });
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [otpTimer, setOtpTimer] = useState(60);
    const [canResend, setCanResend] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if (step === 2 && otpTimer > 0) {
            const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
            return () => clearTimeout(timer);
        } else if (otpTimer === 0) {
            setCanResend(true);
        }
    }, [step, otpTimer]);

    const calculatePasswordStrength = (password) => {
        if (password.length === 0) return '';
        if (password.length < 6) return 'weak';
        if (password.length < 10) return 'medium';
        if (password.length >= 10 && /[A-Z]/.test(password) && /[0-9]/.test(password)) return 'strong';
        return 'medium';
    };

    const handlePasswordChange = (e) => {
        const newPassword = e.target.value;
        setFormData({ ...formData, password: newPassword });
        setPasswordStrength(calculatePasswordStrength(newPassword));
    };

    // ✅ Real API - Send OTP
    const handleSendOTP = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.fullName || !formData.email || !formData.mobile ||
            !formData.password || !formData.confirmPassword) {
            setError('Please fill in all fields');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.mobile.length < 10) {
            setError('Please enter a valid mobile number');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(
                `${BASE_URL}/send-otp?email=${formData.email}`,
                { method: 'POST' }
            );
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to send OTP');

            setStep(2);
            setOtpTimer(60);
            setCanResend(false);
        } catch (err) {
            setError(err.message || 'Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (index, value) => {
        if (value.length > 1) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        if (value && index < 5) {
            document.getElementById(`otp-${index + 1}`)?.focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            document.getElementById(`otp-${index - 1}`)?.focus();
        }
    };

    // ✅ Real API - Verify OTP + Register
    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setError('');
        const otpValue = otp.join('');

        if (otpValue.length !== 6) {
            setError('Please enter complete OTP');
            return;
        }

        setLoading(true);
        try {
            // Step 1: Verify OTP
            const verifyResponse = await fetch(
                `${BASE_URL}/verify-otp?email=${formData.email}&otp=${otpValue}`,
                { method: 'POST' }
            );
            const verifyData = await verifyResponse.json();
            if (!verifyResponse.ok) throw new Error(verifyData.message || 'Invalid OTP');

            // Step 2: Register user
            const registerResponse = await fetch(`${BASE_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fullName: formData.fullName,
                    email: formData.email,
                    password: formData.password,
                    mobile: formData.mobile
                })
            });
            const registerData = await registerResponse.json();
            if (!registerResponse.ok) throw new Error(registerData.message || 'Registration failed');

            navigate('/login');
        } catch (err) {
            setError(err.message || 'Verification failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // ✅ Real API - Resend OTP
    const handleResendOTP = async () => {
        if (!canResend) return;
        setError('');
        setLoading(true);
        try {
            const response = await fetch(
                `${BASE_URL}/send-otp?email=${formData.email}`,
                { method: 'POST' }
            );
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to resend OTP');

            setOtpTimer(60);
            setCanResend(false);
            setOtp(['', '', '', '', '', '']);
        } catch (err) {
            setError(err.message || 'Failed to resend OTP');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card" style={{ maxWidth: step === 2 ? '500px' : '450px' }}>
                <div className="auth-logo">EdTech.</div>

                {step === 1 ? (
                    <>
                        <h1 className="auth-title">Create Your Account</h1>
                        <p className="auth-subtitle">Start learning with verified access</p>

                        {error && <div className="error-message">{error}</div>}

                        <form className="auth-form" onSubmit={handleSendOTP}>
                            <div className="form-group">
                                <label htmlFor="fullName">Full Name</label>
                                <input
                                    type="text"
                                    id="fullName"
                                    placeholder="John Doe"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="email">Email Address</label>
                                <input
                                    type="email"
                                    id="email"
                                    placeholder="you@example.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="mobile">Mobile Number</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <select
                                        value={formData.countryCode}
                                        onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                                        style={{
                                            padding: '0.85rem 0.75rem',
                                            border: '2px solid #e5e7eb',
                                            borderRadius: '12px',
                                            fontSize: '0.95rem',
                                            width: '100px'
                                        }}
                                    >
                                        <option value="+91">🇮🇳 +91</option>
                                        <option value="+1">🇺🇸 +1</option>
                                        <option value="+44">🇬🇧 +44</option>
                                        <option value="+61">🇦🇺 +61</option>
                                    </select>
                                    <input
                                        type="tel"
                                        id="mobile"
                                        placeholder="9876543210"
                                        value={formData.mobile}
                                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '') })}
                                        maxLength="10"
                                        style={{ flex: 1 }}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="password">Password</label>
                                <div className="password-input-wrapper">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="password"
                                        placeholder="Create a strong password"
                                        value={formData.password}
                                        onChange={handlePasswordChange}
                                    />
                                    <button type="button" className="password-toggle"
                                        onClick={() => setShowPassword(!showPassword)}>
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                                {formData.password && (
                                    <>
                                        <div className="password-strength">
                                            <div className={`password-strength-bar ${passwordStrength}`}></div>
                                        </div>
                                        <div className="password-strength-text">
                                            Password strength: {passwordStrength || 'none'}
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="form-group">
                                <label htmlFor="confirmPassword">Confirm Password</label>
                                <div className="password-input-wrapper">
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        id="confirmPassword"
                                        placeholder="Re-enter your password"
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    />
                                    <button type="button" className="password-toggle"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            <Button variant="primary" type="submit" className="btn-block"
                                style={{ marginTop: '1rem' }} disabled={loading}>
                                {loading ? 'Sending OTP...' : 'Send OTP'}
                            </Button>
                        </form>

                        <div className="auth-divider">or</div>

                        <button className="google-btn" onClick={() => alert('Google OAuth coming soon')}>
                            <svg className="google-icon" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Sign up with Google
                        </button>

                        <div className="auth-footer">
                            Already have an account? <Link to="/login" className="auth-link">Log in</Link>
                        </div>
                    </>
                ) : (
                    <>
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{
                                width: '60px', height: '60px',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                borderRadius: '50%', display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 1rem'
                            }}>
                                <Mail size={30} color="white" />
                            </div>
                            <h1 className="auth-title">Verify Your Email</h1>
                            <p className="auth-subtitle">
                                We've sent a 6-digit code to<br />
                                <strong>{formData.email}</strong>
                            </p>
                        </div>

                        {error && <div className="error-message">{error}</div>}

                        <form className="auth-form" onSubmit={handleVerifyOTP}>
                            <div className="form-group">
                                <label style={{ textAlign: 'center', display: 'block', marginBottom: '1rem' }}>
                                    Enter OTP
                                </label>
                                <div style={{
                                    display: 'flex', gap: '0.5rem',
                                    justifyContent: 'center', marginBottom: '1.5rem'
                                }}>
                                    {otp.map((digit, index) => (
                                        <input
                                            key={index}
                                            id={`otp-${index}`}
                                            type="text"
                                            maxLength="1"
                                            value={digit}
                                            onChange={(e) => handleOtpChange(index, e.target.value)}
                                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                            style={{
                                                width: '50px', height: '50px',
                                                textAlign: 'center', fontSize: '1.5rem',
                                                fontWeight: '600', border: '2px solid #e5e7eb',
                                                borderRadius: '12px'
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                                {otpTimer > 0 ? (
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                        Resend OTP in <strong>{otpTimer}s</strong>
                                    </p>
                                ) : (
                                    <button type="button" onClick={handleResendOTP}
                                        style={{
                                            background: 'none', border: 'none',
                                            color: 'var(--primary)', fontWeight: '600',
                                            cursor: 'pointer', fontSize: '0.9rem'
                                        }}>
                                        Resend OTP
                                    </button>
                                )}
                            </div>

                            <Button variant="primary" type="submit" className="btn-block" disabled={loading}>
                                {loading ? 'Verifying...' : 'Verify & Create Account'}
                            </Button>

                            <div className="auth-footer" style={{ marginTop: '1.5rem' }}>
                                <button type="button" onClick={() => setStep(1)}
                                    style={{
                                        background: 'none', border: 'none',
                                        color: 'var(--text-secondary)',
                                        cursor: 'pointer', fontSize: '0.9rem'
                                    }}>
                                    ← Back to registration
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default Register;