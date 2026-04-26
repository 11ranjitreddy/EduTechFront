import React, { useState } from 'react';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { CONTACT_URL } from '../config/api';
import './Contact.css';

const Contact = () => {
    const { user } = useAuth();
    const [form, setForm] = useState({
        subject: '',
        message: ''
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.subject || !form.message) {
            setError('Please fill in all fields');
            return;
        }
        if (!user) {
            setError('Please login to send a message');
            return;
        }
        setLoading(true);
        setError('');

        try {
            const token = user?.accessToken;
            const res = await fetch(CONTACT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    studentEmail: user?.email,
                    studentName: user?.fullName || user?.email,
                    subject: form.subject,
                    message: form.message
                })
            });

            if (res.ok) {
                setSuccess(true);
                setForm({ subject: '', message: '' });
            } else {
                setError('Failed to send message. Please try again.');
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="contact-page container">
            <div className="contact-wrapper">

                {/* ✅ Left side - contact info (kept exactly same) */}
                <div className="contact-info">
                    <h1 className="contact-title">Get in Touch</h1>
                    <p className="contact-desc">
                        Have questions? We'd love to hear from you.
                    </p>

                    <div className="contact-details">
                        <div className="detail-item">
                            <span className="icon">📍</span>
                            <p>123 Education Lane, Tech City, TC 90210</p>
                        </div>
                        <div className="detail-item">
                            <span className="icon">📞</span>
                            <p>+91 98765 43210</p>
                        </div>
                        <div className="detail-item">
                            <span className="icon">✉️</span>
                            <p>support@edtech.com</p>
                        </div>
                        <div className="detail-item">
                            <span className="icon">🕐</span>
                            <p>Mon-Fri, 9AM - 6PM IST</p>
                        </div>
                    </div>
                </div>

                {/* ✅ Right side - form */}
                <div className="contact-form-container">

                    {success ? (
                        // ✅ Success message
                        <div style={{ textAlign: 'center', padding: '3rem' }}>
                            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
                            <h3 style={{ color: '#10B981', marginBottom: '0.5rem' }}>
                                Message Sent!
                            </h3>
                            <p style={{ color: '#6B7280', marginBottom: '1.5rem' }}>
                                We'll get back to you within 24 hours at{' '}
                                <strong>{user?.email}</strong>
                            </p>
                            <Button
                                variant="primary"
                                onClick={() => setSuccess(false)}
                            >
                                Send Another Message
                            </Button>
                        </div>
                    ) : (
                        // ✅ Contact form
                        <form className="contact-form" onSubmit={handleSubmit}>

                            {error && (
                                <div style={{
                                    padding: '0.75rem', background: '#FEE2E2',
                                    color: '#DC2626', borderRadius: '8px',
                                    marginBottom: '1rem', fontSize: '0.9rem'
                                }}>
                                    {error}
                                </div>
                            )}

                            {/* Auto-filled name */}
                            <div className="form-group">
                                <label>Name</label>
                                <input
                                    type="text"
                                    value={user?.fullName || user?.email || ''}
                                    disabled
                                    style={{ background: '#F8FAFC', color: '#6B7280' }}
                                />
                            </div>

                            {/* Auto-filled email */}
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={user?.email || ''}
                                    disabled
                                    style={{ background: '#F8FAFC', color: '#6B7280' }}
                                />
                            </div>

                            {/* Subject dropdown */}
                            <div className="form-group">
                                <label>Subject *</label>
                                <select
                                    value={form.subject}
                                    onChange={e => setForm({ ...form, subject: e.target.value })}
                                    required
                                    style={{
                                        width: '100%', padding: '0.75rem',
                                        border: '1px solid #E5E7EB',
                                        borderRadius: '8px', fontSize: '0.95rem',
                                        outline: 'none', background: 'white'
                                    }}
                                >
                                    <option value="">Select a subject</option>
                                    <option value="Course Access Issue">Course Access Issue</option>
                                    <option value="Payment Issue">Payment Issue</option>
                                    <option value="Technical Problem">Technical Problem</option>
                                    <option value="Certificate Issue">Certificate Issue</option>
                                    <option value="Live Class Issue">Live Class Issue</option>
                                    <option value="Account Issue">Account Issue</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            {/* Message */}
                            <div className="form-group">
                                <label>Message *</label>
                                <textarea
                                    placeholder="Describe your issue in detail..."
                                    value={form.message}
                                    onChange={e => setForm({ ...form, message: e.target.value })}
                                    rows="5"
                                    required
                                />
                            </div>

                            {!user && (
                                <p style={{
                                    color: '#F59E0B', fontSize: '0.85rem',
                                    marginBottom: '1rem'
                                }}>
                                    ⚠️ Please <a href="/login">login</a> to send a message
                                </p>
                            )}

                            <Button
                                variant="primary"
                                type="submit"
                                className="btn-block"
                                disabled={loading || !user}
                            >
                                {loading ? 'Sending...' : '📩 Send Message'}
                            </Button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Contact;