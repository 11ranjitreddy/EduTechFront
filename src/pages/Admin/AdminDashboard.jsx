import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import './AdminDashboard.css';

import { COURSE_URL, AUTH_URL, LIVECLASS_URL, CONTACT_URL } from '../../config/api';

const AdminDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        totalCourses: 0, liveCourses: 0,
        draftCourses: 0, totalStudents: 0
    });
    const [topCourses, setTopCourses] = useState([]);
    const [liveClasses, setLiveClasses] = useState([]);
    const [contacts, setContacts] = useState([]); // ✅ Added contacts state
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        title: '', description: '', instructor: '',
        meetLink: '', courseId: '', scheduledAt: ''
    });

    useEffect(() => {
        fetchStats();
        fetchLiveClasses();
        fetchContacts(); // ✅ Added contacts fetch
    }, [user]);

    const getToken = () => user?.accessToken;

    const fetchStats = () => {
        const token = getToken();
        const headers = { 'Authorization': `Bearer ${token}` };

        fetch(`${COURSE_URL}/stats`, { headers })
            .then(res => res.json())
            .then(data => setStats(prev => ({
                ...prev,
                totalCourses: data.totalCourses,
                liveCourses: data.liveCourses,
                draftCourses: data.draftCourses
            })))
            .catch(err => console.error(err));

        fetch(`${AUTH_URL}/admin/students`, { headers })
            .then(res => res.json())
            .then(data => setStats(prev => ({
                ...prev,
                totalStudents: Array.isArray(data) ? data.length : 0
            })))
            .catch(err => console.error(err));

        fetch(`${COURSE_URL}/top`, { headers })
            .then(res => res.json())
            .then(data => setTopCourses(Array.isArray(data) ? data : []))
            .catch(err => console.error(err));
    };

    const fetchLiveClasses = () => {
        const token = getToken();
        fetch(`${LIVECLASS_URL}/admin/all`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => setLiveClasses(Array.isArray(data) ? data : []))
            .catch(err => console.error(err));
    };

    // ✅ Added fetchContacts function
    const fetchContacts = () => {
        const token = getToken();
        fetch(`${CONTACT_URL}/admin/all`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => setContacts(Array.isArray(data) ? data : []))
            .catch(err => console.error(err));
    };

    // ✅ Added handleContactStatus function
    const handleContactStatus = async (id, status) => {
        try {
            const token = getToken();
            await fetch(`${CONTACT_URL}/${id}/status?status=${status}`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchContacts();
        } catch (err) {
            console.error(err);
        }
    };

    const handleSchedule = async (e) => {
        e.preventDefault();
        if (!form.title || !form.meetLink || !form.scheduledAt) return;
        setSaving(true);

        console.log('FORM DATA BEING SENT:', JSON.stringify(form));
        console.log('scheduledAt value:', form.scheduledAt);
        console.log('scheduledAt length:', form.scheduledAt?.length);

        try {
            const token = getToken();
            const res = await fetch(LIVECLASS_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...form,
                    status: 'HOLD'
                })
            });
            console.log('Response status:', res.status);
            const data = await res.json();
            console.log('Response data:', data);

            setForm({
                title: '', description: '', instructor: '',
                meetLink: '', courseId: '', scheduledAt: ''
            });
            setShowForm(false);
            fetchLiveClasses();
        } catch (err) {
            console.error('Failed to schedule:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this live class?')) return;
        try {
            const token = getToken();
            await fetch(`${LIVECLASS_URL}/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchLiveClasses();
        } catch (err) {
            console.error('Failed to delete:', err);
        }
    };

    const handleStatusChange = async (id, status) => {
        try {
            const token = getToken();
            await fetch(`${LIVECLASS_URL}/${id}/status?status=${status}`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchLiveClasses();
        } catch (err) {
            console.error('Failed to update status:', err);
        }
    };

    const formatDateTime = (dt) => {
        if (!dt) return '-';
        return new Date(dt).toLocaleString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const statCards = [
        { label: 'Total Students', value: stats.totalStudents?.toLocaleString(), color: '#4F46E5' },
        { label: 'Active Courses', value: stats.liveCourses, color: '#10B981' },
        { label: 'Total Courses', value: stats.totalCourses, color: '#F59E0B' },
        { label: 'Draft Courses', value: stats.draftCourses, color: '#EC4899' },
    ];

    const inputStyle = {
        width: '100%', padding: '0.7rem',
        border: '2px solid #E5E7EB', borderRadius: '8px',
        fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none'
    };

    const labelStyle = {
        display: 'block', fontSize: '0.85rem',
        fontWeight: '600', color: '#6B7280', marginBottom: '0.4rem'
    };

    return (
        <div className="admin-dashboard">
            <div className="stats-grid">
                {statCards.map((stat, i) => (
                    <div key={i} className="stat-card">
                        <div className="stat-header">
                            <p className="stat-label">{stat.label}</p>
                        </div>
                        <h2 className="stat-value">{stat.value}</h2>
                        <div className="stat-progress-bg">
                            <div className="stat-progress-bar"
                                style={{ width: '70%', backgroundColor: stat.color }} />
                        </div>
                    </div>
                ))}
            </div>

            <div className="dashboard-grid">
                <div className="recent-activity card">
                    <h3>Recent Activity</h3>
                    <div className="activity-list">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="activity-item">
                                <div className="activity-dot"></div>
                                <div className="activity-content">
                                    <p><strong>New Student joined:</strong> enrolled in a course</p>
                                    <small>{i} hour{i > 1 ? 's' : ''} ago</small>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="top-courses card">
                    <h3>Top Performing Courses</h3>
                    <div className="course-performance-list">
                        {topCourses.map((c, i) => (
                            <div key={i} className="performance-item">
                                <p className="course-name">{c.title}</p>
                                <div className="performance-stats">
                                    <span>{c.students} students</span>
                                    <small className="growth">⭐ {c.rating}</small>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Live Classes Section */}
            <div className="card" style={{ marginTop: '2rem' }}>
                <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', marginBottom: '1.5rem'
                }}>
                    <div>
                        <h3 style={{ margin: 0 }}>🎥 Live Classes</h3>
                        <p style={{ margin: '0.25rem 0 0', color: '#6B7280', fontSize: '0.9rem' }}>
                            Schedule and manage live sessions
                        </p>
                    </div>
                    <button onClick={() => setShowForm(!showForm)} style={{
                        padding: '0.6rem 1.25rem', background: '#4F46E5',
                        color: 'white', border: 'none', borderRadius: '8px',
                        cursor: 'pointer', fontWeight: '600'
                    }}>
                        {showForm ? '✕ Cancel' : '+ Schedule Class'}
                    </button>
                </div>

                {showForm && (
                    <form onSubmit={handleSchedule} style={{
                        background: '#F8FAFC', borderRadius: '12px',
                        padding: '1.5rem', marginBottom: '1.5rem',
                        border: '2px dashed #4F46E5'
                    }}>
                        <h4 style={{ margin: '0 0 1rem', color: '#4F46E5' }}>
                            Schedule New Live Class
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={labelStyle}>Title *</label>
                                <input type="text" placeholder="e.g. Python Basics Live Session"
                                    value={form.title}
                                    onChange={e => setForm({ ...form, title: e.target.value })}
                                    style={inputStyle} required />
                            </div>
                            <div>
                                <label style={labelStyle}>Instructor</label>
                                <input type="text" placeholder="Instructor name"
                                    value={form.instructor}
                                    onChange={e => setForm({ ...form, instructor: e.target.value })}
                                    style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Google Meet / Zoom Link *</label>
                                <input type="text" placeholder="https://meet.google.com/..."
                                    value={form.meetLink}
                                    onChange={e => setForm({ ...form, meetLink: e.target.value })}
                                    style={inputStyle} required />
                            </div>
                            <div>
                                <label style={labelStyle}>Date & Time *</label>
                                <input type="datetime-local" value={form.scheduledAt}
                                    onChange={e => setForm({ ...form, scheduledAt: e.target.value })}
                                    style={inputStyle} required />
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={labelStyle}>Description</label>
                                <textarea placeholder="What will be covered in this session..."
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                    rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                            <button type="button" onClick={() => setShowForm(false)} style={{
                                padding: '0.6rem 1.25rem', background: 'white',
                                border: '2px solid #E5E7EB', borderRadius: '8px',
                                cursor: 'pointer', fontWeight: '600'
                            }}>Cancel</button>
                            <button type="submit" disabled={saving} style={{
                                padding: '0.6rem 1.25rem',
                                background: saving ? '#9CA3AF' : '#4F46E5',
                                color: 'white', border: 'none', borderRadius: '8px',
                                cursor: 'pointer', fontWeight: '600'
                            }}>
                                {saving ? 'Scheduling...' : '📅 Schedule Class'}
                            </button>
                        </div>
                    </form>
                )}

                {liveClasses.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#9CA3AF' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
                        <p>No live classes scheduled yet</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {liveClasses.map(cls => (
                            <div key={cls.id} style={{
                                padding: '1.25rem', background: '#F8FAFC',
                                borderRadius: '10px', border: '1px solid #E5E7EB',
                                display: 'flex', justifyContent: 'space-between',
                                alignItems: 'center', gap: '1rem'
                            }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{
                                        display: 'flex', alignItems: 'center',
                                        gap: '0.75rem', marginBottom: '0.4rem'
                                    }}>
                                        <span style={{ fontSize: '1.2rem' }}>🎥</span>
                                        <h4 style={{ margin: 0, fontSize: '1rem' }}>{cls.title}</h4>
                                        <span style={{
                                            padding: '0.2rem 0.5rem', borderRadius: '9999px',
                                            fontSize: '0.7rem', fontWeight: '600',
                                            background: cls.status === 'LIVE' ? '#DCFCE7' :
                                                cls.status === 'COMPLETED' ? '#F1F5F9' :
                                                cls.status === 'HOLD' ? '#FEF3C7' : '#EEF2FF',
                                            color: cls.status === 'LIVE' ? '#166534' :
                                                cls.status === 'COMPLETED' ? '#475569' :
                                                cls.status === 'HOLD' ? '#92400E' : '#4F46E5'
                                        }}>
                                            {cls.status === 'LIVE' ? '🔴 LIVE' :
                                             cls.status === 'COMPLETED' ? '✅ Completed' :
                                             cls.status === 'HOLD' ? '⏸️ On Hold' : '📅 Upcoming'}
                                        </span>
                                    </div>
                                    {cls.description && (
                                        <p style={{ margin: '0 0 0.4rem', fontSize: '0.85rem', color: '#6B7280' }}>
                                            {cls.description}
                                        </p>
                                    )}
                                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#9CA3AF' }}>
                                        <span>📅 {formatDateTime(cls.scheduledAt)}</span>
                                        {cls.instructor && <span>👤 {cls.instructor}</span>}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
                                    {cls.status === 'HOLD' && (
                                        <button onClick={() => {
                                            window.open(cls.meetLink, '_blank');
                                            handleStatusChange(cls.id, 'UPCOMING');
                                        }} style={{
                                            padding: '0.4rem 0.75rem', background: '#EEF2FF',
                                            color: '#4F46E5', border: 'none', borderRadius: '6px',
                                            cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem'
                                        }}>▶️ Start</button>
                                    )}

                                    {cls.status === 'UPCOMING' && (
                                        <>
                                            <button onClick={() => handleStatusChange(cls.id, 'HOLD')} style={{
                                                padding: '0.4rem 0.75rem', background: '#FEF3C7',
                                                color: '#92400E', border: 'none', borderRadius: '6px',
                                                cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem'
                                            }}>⏸️ Hold</button>
                                            <button onClick={() => handleStatusChange(cls.id, 'LIVE')} style={{
                                                padding: '0.4rem 0.75rem', background: '#DCFCE7',
                                                color: '#166534', border: 'none', borderRadius: '6px',
                                                cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem'
                                            }}>🔴 Go Live</button>
                                        </>
                                    )}

                                    {cls.status === 'LIVE' && (
                                        <button onClick={() => handleStatusChange(cls.id, 'COMPLETED')} style={{
                                            padding: '0.4rem 0.75rem', background: '#F1F5F9',
                                            color: '#475569', border: 'none', borderRadius: '6px',
                                            cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem'
                                        }}>✅ End Class</button>
                                    )}

                                    <a href={cls.meetLink} target="_blank" rel="noreferrer" style={{
                                        padding: '0.4rem 0.75rem', background: '#4F46E5',
                                        color: 'white', borderRadius: '6px',
                                        textDecoration: 'none', fontWeight: '600', fontSize: '0.8rem'
                                    }}>🔗 Open Link</a>

                                    <button onClick={() => handleDelete(cls.id)} style={{
                                        padding: '0.4rem', background: 'none',
                                        border: 'none', cursor: 'pointer', fontSize: '1rem'
                                    }}>🗑️</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ✅ Support Tickets Section */}
            <div className="card" style={{ marginTop: '2rem' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: 0 }}>📩 Support Tickets</h3>
                    <p style={{ margin: '0.25rem 0 0', color: '#6B7280', fontSize: '0.9rem' }}>
                        Student contact requests
                    </p>
                </div>

                {contacts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#9CA3AF' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                        <p>No support tickets yet</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {contacts.map(ct => (
                            <div key={ct.id} style={{
                                padding: '1.25rem', background: '#F8FAFC',
                                borderRadius: '10px', border: '1px solid #E5E7EB'
                            }}>
                                <div style={{
                                    display: 'flex', justifyContent: 'space-between',
                                    alignItems: 'flex-start', gap: '1rem'
                                }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            display: 'flex', alignItems: 'center',
                                            gap: '0.75rem', marginBottom: '0.5rem'
                                        }}>
                                            <span style={{ fontSize: '1.2rem' }}>🎫</span>
                                            <h4 style={{ margin: 0 }}>{ct.subject}</h4>
                                            <span style={{
                                                padding: '0.2rem 0.5rem',
                                                borderRadius: '9999px',
                                                fontSize: '0.7rem', fontWeight: '600',
                                                background: ct.status === 'RESOLVED' ? '#DCFCE7' :
                                                    ct.status === 'IN_PROGRESS' ? '#FEF3C7' : '#EEF2FF',
                                                color: ct.status === 'RESOLVED' ? '#166534' :
                                                    ct.status === 'IN_PROGRESS' ? '#92400E' : '#4F46E5'
                                            }}>
                                                {ct.status === 'RESOLVED' ? '✅ Resolved' :
                                                 ct.status === 'IN_PROGRESS' ? '🔄 In Progress' : '🆕 Open'}
                                            </span>
                                        </div>
                                        <p style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', color: '#374151' }}>
                                            {ct.message}
                                        </p>
                                        <div style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>
                                            <span>📧 {ct.studentEmail}</span>
                                            <span style={{ marginLeft: '1rem' }}>
                                                🕐 {new Date(ct.createdAt).toLocaleString('en-IN')}
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{
                                        display: 'flex', gap: '0.5rem',
                                        flexShrink: 0, flexDirection: 'column'
                                    }}>
                                        {ct.status === 'OPEN' && (
                                            <button onClick={() => handleContactStatus(ct.id, 'IN_PROGRESS')}
                                                style={{
                                                    padding: '0.4rem 0.75rem', background: '#FEF3C7',
                                                    color: '#92400E', border: 'none', borderRadius: '6px',
                                                    cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem'
                                                }}>
                                                🔄 In Progress
                                            </button>
                                        )}
                                        {ct.status === 'IN_PROGRESS' && (
                                            <button onClick={() => handleContactStatus(ct.id, 'RESOLVED')}
                                                style={{
                                                    padding: '0.4rem 0.75rem', background: '#DCFCE7',
                                                    color: '#166534', border: 'none', borderRadius: '6px',
                                                    cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem'
                                                }}>
                                                ✅ Resolve
                                            </button>
                                        )}
                                        <button onClick={() => handleContactStatus(ct.id, 'OPEN')}
                                            style={{
                                                padding: '0.4rem 0.75rem', background: '#EEF2FF',
                                                color: '#4F46E5', border: 'none', borderRadius: '6px',
                                                cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem'
                                            }}>
                                            🔁 Reopen
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;