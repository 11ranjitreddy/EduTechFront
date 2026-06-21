import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import Button from '../components/Button';
import { Eye, EyeOff } from 'lucide-react';
import './Auth.css';
import API_URL from '../config/api';

const BASE_URL = `${API_URL}/api/v1/auth`;

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(
                `${BASE_URL}/reset-password?token=${token}&newPassword=${newPassword}`,
                { method: 'POST' }
            );
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Reset failed');

            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="auth-page">
                <div className="auth-card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem' }}>❌</div>
                    <h2>Invalid Reset Link</h2>
                    <p>This reset link is invalid or has expired.</p>
                    <Link to="/forgot-password" className="auth-link">Request a new link</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-logo">EdTech.</div>

                {!success ? (
                    <>
                        <h1 className="auth-title">Set New Password</h1>
                        <p className="auth-subtitle">Enter your new password below</p>

                        {error && <div className="error-message">{error}</div>}

                        <form className="auth-form" onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="newPassword">New Password</label>
                                <div className="password-input-wrapper">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="newPassword"
                                        placeholder="Enter new password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                    />
                                    <button type="button" className="password-toggle"
                                        onClick={() => setShowPassword(!showPassword)}>
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="confirmPassword">Confirm Password</label>
                                <div className="password-input-wrapper">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="confirmPassword"
                                        placeholder="Confirm new password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <Button variant="primary" type="submit" className="btn-block"
                                style={{ marginTop: '1rem' }} disabled={loading}>
                                {loading ? 'Resetting...' : 'Reset Password'}
                            </Button>
                        </form>
                    </>
                ) : (
                    <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                        <div style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}>✅</div>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>Password Reset!</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                            Your password has been reset successfully.<br />
                            Redirecting to login...
                        </p>
                        <Link to="/login" className="auth-link">Go to Login</Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResetPassword;