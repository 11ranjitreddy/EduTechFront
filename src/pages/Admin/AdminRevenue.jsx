import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import './AdminRevenue.css';

import { PAYMENT_URL, COURSE_URL } from '../../config/api';

const AdminRevenue = () => {
    const { user } = useAuth();
    const [payments, setPayments] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');

    useEffect(() => {
        if (user?.accessToken) fetchData();
    }, [user]);

    const fetchData = async () => {
        try {
            const token = user?.accessToken;
            const headers = { 'Authorization': `Bearer ${token}` };

            const [paymentsRes, coursesRes] = await Promise.all([
                fetch(`${PAYMENT_URL}/admin/all`, { headers }),
                fetch(`${COURSE_URL}/admin/all`, { headers })
            ]);
            const paymentsData = await paymentsRes.json();
            const coursesData = await coursesRes.json();
            setPayments(Array.isArray(paymentsData) ? paymentsData : []);
            setCourses(Array.isArray(coursesData) ? coursesData : []);
        } catch (err) {
            console.error('Failed to load revenue data:', err);
        } finally {
            setLoading(false);
        }
    };

    // ✅ Stats calculations
    const totalRevenue = payments
        .filter(p => p.status === 'SUCCESS')
        .reduce((acc, p) => acc + (p.amount || 0), 0);

    const totalTransactions = payments.filter(p => p.status === 'SUCCESS').length;
    const pendingPayments = payments.filter(p => p.status === 'PENDING').length;
    const failedPayments = payments.filter(p => p.status === 'FAILED').length;

    const avgOrderValue = totalTransactions > 0
        ? (totalRevenue / totalTransactions).toFixed(2)
        : 0;

    // ✅ Revenue per course
    const revenuePerCourse = courses.map(course => {
        const coursePayments = payments.filter(p =>
            p.status === 'SUCCESS' &&
            p.courseIds?.includes(course.id)
        );
        return {
            ...course,
            revenue: coursePayments.reduce((acc, p) => acc + (p.amount || 0), 0),
            sales: course.students || 0
        };
    }).sort((a, b) => b.revenue - a.revenue);

    // ✅ Monthly revenue
    const monthlyRevenue = payments
        .filter(p => p.status === 'SUCCESS')
        .reduce((acc, payment) => {
            const date = new Date(payment.createdAt);
            const month = date.toLocaleString('default', {
                month: 'short', year: 'numeric'
            });
            acc[month] = (acc[month] || 0) + payment.amount;
            return acc;
        }, {});

    const monthlyData = Object.entries(monthlyRevenue)
        .slice(-6)
        .map(([month, revenue]) => ({ month, revenue }));

    const maxRevenue = Math.max(...monthlyData.map(d => d.revenue), 1);

    // ✅ Filter payments
    const filteredPayments = payments.filter(p => {
        const matchSearch = p.studentEmail?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
            p.razorpayOrderId?.toLowerCase()
            .includes(searchTerm.toLowerCase());
        const matchStatus = filterStatus === 'ALL' || p.status === filterStatus;
        return matchSearch && matchStatus;
    });

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    if (loading) return (
        <div style={{ textAlign: 'center', padding: '5rem' }}>
            Loading revenue data...
        </div>
    );

    return (
        <div className="admin-revenue">
            {/* Header */}
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Revenue</h1>
                    <p className="admin-page-subtitle">
                        Track payments and financial performance
                    </p>
                </div>
                <button
                    onClick={fetchData}
                    style={{
                        background: 'white', border: '1px solid #E5E7EB',
                        padding: '0.6rem 1.25rem', borderRadius: '8px',
                        cursor: 'pointer', fontWeight: '600',
                        fontSize: '0.9rem', color: '#374151'
                    }}
                >
                    🔄 Refresh
                </button>
            </div>

            {/* ✅ Stats Cards */}
            <div className="revenue-stats">
                <div className="revenue-stat-card primary">
                    <div className="stat-icon">💰</div>
                    <div className="stat-info">
                        <span className="stat-value">₹{totalRevenue.toLocaleString()}</span>
                        <span className="stat-label">Total Revenue</span>
                    </div>
                </div>
                <div className="revenue-stat-card green">
                    <div className="stat-icon">✅</div>
                    <div className="stat-info">
                        <span className="stat-value">{totalTransactions}</span>
                        <span className="stat-label">Successful Payments</span>
                    </div>
                </div>
                <div className="revenue-stat-card blue">
                    <div className="stat-icon">📊</div>
                    <div className="stat-info">
                        <span className="stat-value">₹{avgOrderValue}</span>
                        <span className="stat-label">Avg Order Value</span>
                    </div>
                </div>
                <div className="revenue-stat-card yellow">
                    <div className="stat-icon">⏳</div>
                    <div className="stat-info">
                        <span className="stat-value">{pendingPayments}</span>
                        <span className="stat-label">Pending Payments</span>
                    </div>
                </div>
            </div>

            {/* ✅ Monthly Revenue Chart */}
            {monthlyData.length > 0 && (
                <div className="admin-card revenue-chart-card">
                    <h3>Monthly Revenue</h3>
                    <div className="bar-chart">
                        {monthlyData.map((item, index) => (
                            <div key={index} className="bar-item">
                                <div className="bar-value">₹{item.revenue.toLocaleString()}</div>
                                <div
                                    className="bar"
                                    style={{
                                        height: `${(item.revenue / maxRevenue) * 180}px`
                                    }}
                                />
                                <div className="bar-label">{item.month}</div>
                            </div>
                        ))}
                    </div>
                    {monthlyData.length === 0 && (
                        <div style={{
                            textAlign: 'center', padding: '3rem',
                            color: '#9CA3AF'
                        }}>
                            No revenue data yet
                        </div>
                    )}
                </div>
            )}

            {/* ✅ Revenue per Course */}
            <div className="admin-card" style={{ marginBottom: '2rem' }}>
                <div style={{
                    padding: '1.5rem',
                    borderBottom: '1px solid var(--border)'
                }}>
                    <h3 style={{ margin: 0 }}>Revenue by Course</h3>
                </div>
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Course</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Students</th>
                            <th>Status</th>
                            <th className="text-right">Revenue</th>
                        </tr>
                    </thead>
                    <tbody>
                        {revenuePerCourse.map(course => (
                            <tr key={course.id}>
                                <td>
                                    <div className="course-title-cell">
                                        <div className="course-avatar-mini">
                                            {course.title?.charAt(0)}
                                        </div>
                                        <span>{course.title}</span>
                                    </div>
                                </td>
                                <td>
                                    <span className="badge category">
                                        {course.category}
                                    </span>
                                </td>
                                <td>₹{course.price}</td>
                                <td>{course.students?.toLocaleString() || 0}</td>
                                <td>
                                    <span className={`status-pill ${course.status?.toLowerCase()}`}>
                                        {course.status}
                                    </span>
                                </td>
                                <td className="text-right">
                                    <span style={{
                                        fontWeight: '700',
                                        color: '#4F46E5',
                                        fontSize: '1rem'
                                    }}>
                                        ₹{(course.price * (course.students || 0)).toLocaleString()}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {revenuePerCourse.length === 0 && (
                    <div className="empty-state">No courses found</div>
                )}
            </div>

            {/* ✅ Payment Transactions Table */}
            <div className="admin-card table-container">
                <div className="table-header-filters" style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', gap: '1rem', flexWrap: 'wrap'
                }}>
                    <h3 style={{ margin: 0 }}>Payment Transactions</h3>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        {/* Search */}
                        <div className="admin-search-box">
                            <input
                                type="text"
                                placeholder="Search by email or order ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ width: '250px' }}
                            />
                        </div>
                        {/* Filter */}
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            style={{
                                padding: '0.6rem 1rem',
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                                fontSize: '0.9rem',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="ALL">All Status</option>
                            <option value="SUCCESS">Success</option>
                            <option value="PENDING">Pending</option>
                            <option value="FAILED">Failed</option>
                        </select>
                    </div>
                </div>

                {filteredPayments.length === 0 ? (
                    <div className="empty-state">
                        {payments.length === 0
                            ? '💳 No payments yet — waiting for first purchase!'
                            : 'No payments match your search'}
                    </div>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Student</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Payment ID</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPayments.map(payment => (
                                <tr key={payment.id}>
                                    <td>
                                        <span style={{
                                            fontFamily: 'monospace',
                                            fontSize: '0.8rem',
                                            color: '#6B7280'
                                        }}>
                                            {payment.razorpayOrderId
                                                ? payment.razorpayOrderId.substring(0, 20) + '...'
                                                : `#${payment.id}`}
                                        </span>
                                    </td>
                                    <td>{payment.studentEmail}</td>
                                    <td>
                                        <span style={{ fontWeight: '600' }}>
                                            ₹{payment.amount?.toLocaleString()}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`status-pill ${
                                            payment.status === 'SUCCESS' ? 'live' :
                                            payment.status === 'FAILED' ? 'failed' : 'draft'
                                        }`}>
                                            {payment.status === 'SUCCESS' ? '✅ Success' :
                                             payment.status === 'FAILED' ? '❌ Failed' :
                                             '⏳ Pending'}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: '0.85rem', color: '#6B7280' }}>
                                        {formatDate(payment.createdAt)}
                                    </td>
                                    <td>
                                        <span style={{
                                            fontFamily: 'monospace',
                                            fontSize: '0.8rem',
                                            color: '#6B7280'
                                        }}>
                                            {payment.razorpayPaymentId
                                                ? payment.razorpayPaymentId.substring(0, 15) + '...'
                                                : '-'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default AdminRevenue;