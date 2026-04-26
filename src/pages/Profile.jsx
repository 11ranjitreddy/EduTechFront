import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './Profile.css';

import { ENROLLMENT_URL, PAYMENT_URL, COURSE_URL, AUTH_URL } from '../config/api';

const Profile = () => {
    const { user, logout, setUser } = useAuth(); // Add setUser from auth context
    const { enrolledCourseIds } = useCart();
    const navigate = useNavigate();

    const [enrollments, setEnrollments] = useState([]);
    const [payments, setPayments] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(user?.name || '');
    const [editPhone, setEditPhone] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, [user]);

    useEffect(() => {
        // Update edit fields when user changes
        if (user) {
            setEditName(user.name || '');
            setEditPhone(user.phone || '');
        }
    }, [user]);

    const fetchData = async () => {
        if (!user?.email) return;
        try {
            const token = user?.accessToken;

            const [enrollRes, paymentRes] = await Promise.all([
                fetch(`${ENROLLMENT_URL}/my?studentEmail=${user.email}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${PAYMENT_URL}/history?studentEmail=${user.email}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            const enrollData = await enrollRes.json();
            const paymentData = await paymentRes.json();

            setEnrollments(Array.isArray(enrollData) ? enrollData : []);
            setPayments(Array.isArray(paymentData) ? paymentData : []);

            // ✅ Fetch course details with token
            if (Array.isArray(enrollData) && enrollData.length > 0) {
                const courseDetails = await Promise.all(
                    enrollData.map(e =>
                        fetch(`${COURSE_URL}/${e.courseId}`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        })
                        .then(r => r.ok ? r.json() : null)
                        .catch(() => null)
                    )
                );
                setCourses(courseDetails.filter(Boolean));
            }
        } catch (err) {
            console.error('Failed to load profile data:', err);
        } finally {
            setLoading(false);
        }
    };

    // ✅ Integrated save profile function
    const handleSaveProfile = async () => {
        setIsSaving(true);
        try {
            const token = user?.accessToken;
            const res = await fetch(`${AUTH_URL}/profile/update`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    fullName: editName,
                    phone: editPhone
                })
            });

            if (res.ok) {
                const updatedUserData = await res.json();
                // ✅ Update context and localStorage with new user data
                const updatedUser = { 
                    ...user, 
                    name: updatedUserData.fullName || editName,
                    phone: updatedUserData.phone || editPhone
                };
                setUser(updatedUser);
                localStorage.setItem('edtech_user', JSON.stringify(updatedUser));
                setIsEditing(false);
                alert('Profile updated successfully!');
            } else {
                const errorData = await res.json();
                alert(errorData.message || 'Failed to update profile');
            }
        } catch (err) {
            console.error('Failed to update profile:', err);
            alert('Network error. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/auth');
    };

    const totalCourses = enrollments.length;
    const completedCourses = enrollments.filter(e => e.progress === 100).length;
    const inProgressCourses = enrollments.filter(
        e => e.progress > 0 && e.progress < 100
    ).length;
    const avgProgress = totalCourses > 0
        ? Math.round(
            enrollments.reduce((acc, e) => acc + (e.progress || 0), 0) / totalCourses
          )
        : 0;
    const totalSpent = payments
        .filter(p => p.status === 'SUCCESS')
        .reduce((acc, p) => acc + (p.amount || 0), 0);

    const getInitials = (name) => {
        if (!name) return 'S';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    };

    if (loading) return (
        <div style={{ textAlign: 'center', padding: '5rem' }}>
            Loading profile...
        </div>
    );

    return (
        <div className="profile-page">
            <div className="container">

                {/* Profile Hero */}
                <div className="profile-hero">
                    <div className="profile-avatar-large">
                        {getInitials(user?.name)}
                    </div>
                    <div className="profile-hero-info">
                        <h1>{user?.name || user?.email}</h1>
                        <p>{user?.email}</p>
                        <div className="profile-badges">
                            <span className="profile-badge">🎓 Student</span>
                            <span className="profile-badge">📚 {totalCourses} Courses</span>
                            {completedCourses > 0 && (
                                <span className="profile-badge green">
                                    ✅ {completedCourses} Completed
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="profile-hero-actions">
                        <button
                            className="btn-edit-profile"
                            onClick={() => setIsEditing(!isEditing)}
                        >
                            ✏️ Edit Profile
                        </button>
                        <button
                            className="btn-logout-profile"
                            onClick={handleLogout}
                        >
                            Logout
                        </button>
                    </div>
                </div>

                {/* Edit Profile Form */}
                {isEditing && (
                    <div className="edit-profile-card">
                        <h3>Edit Profile</h3>
                        <div className="edit-profile-grid">
                            <div className="edit-field">
                                <label>Full Name</label>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    placeholder="Your full name"
                                    disabled={isSaving}
                                />
                            </div>
                            <div className="edit-field">
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={user?.email || ''}
                                    readOnly
                                    style={{ background: '#F9FAFB', cursor: 'not-allowed' }}
                                    disabled={isSaving}
                                />
                            </div>
                            <div className="edit-field">
                                <label>Phone</label>
                                <input
                                    type="tel"
                                    value={editPhone}
                                    onChange={(e) => setEditPhone(e.target.value)}
                                    placeholder="+91 98765 43210"
                                    disabled={isSaving}
                                />
                            </div>
                            <div className="edit-field">
                                <label>Role</label>
                                <input
                                    type="text"
                                    value={user?.role || 'Student'}
                                    readOnly
                                    style={{ background: '#F9FAFB', cursor: 'not-allowed' }}
                                    disabled={isSaving}
                                />
                            </div>
                        </div>
                        <div className="edit-actions">
                            <button
                                className="btn-cancel-edit"
                                onClick={() => setIsEditing(false)}
                                disabled={isSaving}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn-save-edit"
                                onClick={handleSaveProfile}
                                disabled={isSaving}
                            >
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Stats Grid */}
                <div className="profile-stats">
                    {[
                        { icon: '📚', value: totalCourses, label: 'Enrolled Courses', color: '#EEF2FF' },
                        { icon: '✅', value: completedCourses, label: 'Completed', color: '#DCFCE7' },
                        { icon: '⚡', value: inProgressCourses, label: 'In Progress', color: '#FEF3C7' },
                        { icon: '📈', value: `${avgProgress}%`, label: 'Avg Progress', color: '#EDE9FE' },
                        { icon: '💰', value: `₹${totalSpent}`, label: 'Total Spent', color: '#FCE7F3' }
                    ].map((stat, i) => (
                        <div key={i} className="profile-stat-card">
                            <div className="profile-stat-icon" style={{ background: stat.color }}>
                                {stat.icon}
                            </div>
                            <div>
                                <div className="profile-stat-value">{stat.value}</div>
                                <div className="profile-stat-label">{stat.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div className="profile-tabs">
                    {['overview', 'courses', 'payments'].map(tab => (
                        <button
                            key={tab}
                            className={`profile-tab ${activeTab === tab ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab === 'overview' && '📊 Overview'}
                            {tab === 'courses' && '📚 My Courses'}
                            {tab === 'payments' && '💳 Payment History'}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="profile-content">

                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div className="overview-grid">
                            <div className="profile-card">
                                <h3>Account Information</h3>
                                <div className="info-list">
                                    {[
                                        { label: 'Full Name', value: user?.name || '-' },
                                        { label: 'Email', value: user?.email },
                                        { label: 'Role', value: user?.role || 'Student' },
                                        { label: 'Member Since', value: 'Recently Joined' }
                                    ].map((item, i) => (
                                        <div key={i} className="info-row">
                                            <span className="info-label">{item.label}</span>
                                            <span className="info-value">{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="profile-card">
                                <h3>Learning Summary</h3>
                                <div className="info-list">
                                    {[
                                        { label: 'Total Courses', value: totalCourses },
                                        { label: 'Completed', value: completedCourses },
                                        { label: 'In Progress', value: inProgressCourses },
                                        { label: 'Avg Progress', value: `${avgProgress}%` }
                                    ].map((item, i) => (
                                        <div key={i} className="info-row">
                                            <span className="info-label">{item.label}</span>
                                            <span className="info-value"
                                                style={{ fontWeight: '700', color: '#4F46E5' }}>
                                                {item.value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ marginTop: '1rem' }}>
                                    <div style={{
                                        display: 'flex', justifyContent: 'space-between',
                                        marginBottom: '0.5rem', fontSize: '0.85rem'
                                    }}>
                                        <span style={{ color: '#6B7280' }}>Overall Progress</span>
                                        <span style={{ fontWeight: '600' }}>{avgProgress}%</span>
                                    </div>
                                    <div style={{
                                        height: '10px', background: '#E5E7EB',
                                        borderRadius: '9999px', overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            width: `${avgProgress}%`, height: '100%',
                                            background: 'linear-gradient(90deg, #4F46E5, #7C3AED)',
                                            borderRadius: '9999px', transition: 'width 0.5s ease'
                                        }} />
                                    </div>
                                </div>
                            </div>

                            <div className="profile-card" style={{ gridColumn: '1 / -1' }}>
                                <h3>Recent Courses</h3>
                                {enrollments.length === 0 ? (
                                    <div style={{
                                        textAlign: 'center', padding: '2rem', color: '#9CA3AF'
                                    }}>
                                        No courses enrolled yet.{' '}
                                        <Link to="/courses"
                                            style={{ color: '#4F46E5', fontWeight: '600' }}>
                                            Browse courses
                                        </Link>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {enrollments.slice(0, 3).map((enrollment, i) => {
                                            const course = courses[i];
                                            return (
                                                <div key={enrollment.id} style={{
                                                    display: 'flex', alignItems: 'center',
                                                    gap: '1rem', padding: '1rem',
                                                    background: '#F8FAFC', borderRadius: '10px'
                                                }}>
                                                    <div style={{
                                                        width: '48px', height: '48px',
                                                        background: '#4F46E5', borderRadius: '10px',
                                                        display: 'flex', alignItems: 'center',
                                                        justifyContent: 'center', color: 'white',
                                                        fontWeight: '700', fontSize: '1.2rem',
                                                        flexShrink: 0
                                                    }}>
                                                        {course?.title?.charAt(0) || '?'}
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: '600' }}>
                                                            {course?.title || 'Loading...'}
                                                        </div>
                                                        <div style={{
                                                            display: 'flex', alignItems: 'center',
                                                            gap: '1rem', marginTop: '0.4rem'
                                                        }}>
                                                            <div style={{
                                                                flex: 1, height: '6px',
                                                                background: '#E5E7EB',
                                                                borderRadius: '9999px',
                                                                overflow: 'hidden', maxWidth: '200px'
                                                            }}>
                                                                <div style={{
                                                                    width: `${enrollment.progress || 0}%`,
                                                                    height: '100%',
                                                                    background: 'linear-gradient(90deg, #4F46E5, #7C3AED)',
                                                                    borderRadius: '9999px'
                                                                }} />
                                                            </div>
                                                            <span style={{
                                                                fontSize: '0.8rem', color: '#6B7280'
                                                            }}>
                                                                {enrollment.progress || 0}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <Link to={`/learn/${enrollment.courseId}`}
                                                        style={{
                                                            padding: '0.5rem 1rem',
                                                            background: '#4F46E5', color: 'white',
                                                            borderRadius: '8px',
                                                            textDecoration: 'none',
                                                            fontSize: '0.85rem', fontWeight: '600'
                                                        }}>
                                                        Continue
                                                    </Link>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Courses Tab */}
                    {activeTab === 'courses' && (
                        <div>
                            {enrollments.length === 0 ? (
                                <div className="empty-state">
                                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📚</div>
                                    <h2>No courses yet</h2>
                                    <p>Start learning by enrolling in a course</p>
                                    <Link to="/courses">
                                        <button style={{
                                            padding: '0.75rem 2rem', background: '#4F46E5',
                                            color: 'white', border: 'none', borderRadius: '8px',
                                            cursor: 'pointer', fontWeight: '600', marginTop: '1rem'
                                        }}>
                                            Browse Courses
                                        </button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="courses-list">
                                    {enrollments.map((enrollment, i) => {
                                        const course = courses[i];
                                        return (
                                            <div key={enrollment.id} className="enrolled-course-card">
                                                <img
                                                    src={course?.image ||
                                                        'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=300'}
                                                    alt={course?.title}
                                                    className="course-thumbnail"
                                                />
                                                <div className="course-info">
                                                    <h3>{course?.title || 'Loading...'}</h3>
                                                    <p className="course-instructor">
                                                        by {course?.instructor}
                                                    </p>
                                                    <div className="progress-section">
                                                        <div className="progress-bar">
                                                            <div
                                                                className="progress-fill"
                                                                style={{
                                                                    width: `${enrollment.progress || 0}%`
                                                                }}
                                                            />
                                                        </div>
                                                        <span className="progress-text">
                                                            {enrollment.progress || 0}% complete
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="course-actions">
                                                    <Link to={`/learn/${enrollment.courseId}`}>
                                                        <button style={{
                                                            padding: '0.6rem 1.25rem',
                                                            background: '#4F46E5', color: 'white',
                                                            border: 'none', borderRadius: '8px',
                                                            cursor: 'pointer', fontWeight: '600'
                                                        }}>
                                                            {enrollment.progress === 100
                                                                ? '🔁 Review'
                                                                : enrollment.progress > 0
                                                                ? '▶ Continue'
                                                                : '▶ Start'}
                                                        </button>
                                                    </Link>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Payments Tab */}
                    {activeTab === 'payments' && (
                        <div>
                            {payments.length === 0 ? (
                                <div className="empty-state">
                                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>💳</div>
                                    <h2>No payments yet</h2>
                                    <p>Your payment history will appear here</p>
                                </div>
                            ) : (
                                <div style={{
                                    background: 'white', borderRadius: '12px',
                                    border: '1px solid #E5E7EB', overflow: 'hidden'
                                }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ background: '#F8FAFC' }}>
                                                {['Order ID', 'Amount', 'Status', 'Date'].map(h => (
                                                    <th key={h} style={{
                                                        padding: '1rem 1.5rem', textAlign: 'left',
                                                        fontSize: '0.75rem', fontWeight: '600',
                                                        color: '#6B7280', textTransform: 'uppercase',
                                                        letterSpacing: '0.05em',
                                                        borderBottom: '1px solid #E5E7EB'
                                                    }}>
                                                        {h}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {payments.map(payment => (
                                                <tr key={payment.id}
                                                    style={{ borderBottom: '1px solid #F1F5F9' }}>
                                                    <td style={{ padding: '1rem 1.5rem' }}>
                                                        <span style={{
                                                            fontFamily: 'monospace',
                                                            fontSize: '0.85rem', color: '#6B7280'
                                                        }}>
                                                            {payment.razorpayOrderId
                                                                ? payment.razorpayOrderId.substring(0, 18) + '...'
                                                                : `#${payment.id}`}
                                                        </span>
                                                    </td>
                                                    <td style={{
                                                        padding: '1rem 1.5rem',
                                                        fontWeight: '700', color: '#4F46E5'
                                                    }}>
                                                        ₹{payment.amount}
                                                    </td>
                                                    <td style={{ padding: '1rem 1.5rem' }}>
                                                        <span style={{
                                                            padding: '0.25rem 0.625rem',
                                                            borderRadius: '9999px',
                                                            fontSize: '0.75rem', fontWeight: '600',
                                                            background:
                                                                payment.status === 'SUCCESS' ? '#DCFCE7'
                                                                : payment.status === 'FAILED' ? '#FEE2E2'
                                                                : '#F1F5F9',
                                                            color:
                                                                payment.status === 'SUCCESS' ? '#166534'
                                                                : payment.status === 'FAILED' ? '#991B1B'
                                                                : '#475569'
                                                        }}>
                                                            {payment.status === 'SUCCESS' ? '✅ Success'
                                                            : payment.status === 'FAILED' ? '❌ Failed'
                                                            : '⏳ Pending'}
                                                        </span>
                                                    </td>
                                                    <td style={{
                                                        padding: '1rem 1.5rem',
                                                        fontSize: '0.85rem', color: '#6B7280'
                                                    }}>
                                                        {formatDate(payment.createdAt)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;