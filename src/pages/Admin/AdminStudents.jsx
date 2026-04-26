import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import './AdminStudents.css';

import { AUTH_URL, ENROLLMENT_URL } from '../../config/api';

const AdminStudents = () => {
    const { user } = useAuth();
    const [students, setStudents] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.accessToken) fetchStudents();
    }, [user]);

    const fetchStudents = async () => {
        try {
            const token = user?.accessToken;
            const headers = { 'Authorization': `Bearer ${token}` };

            const [studentsRes, statsRes] = await Promise.all([
                fetch(`${AUTH_URL}/admin/students`, { headers }),
                fetch(`${ENROLLMENT_URL}/stats`, { headers })
            ]);

            const studentsData = await studentsRes.json();
            const statsData = await statsRes.json();

            const studentsList = Array.isArray(studentsData) ? studentsData : [];
            const statsList = Array.isArray(statsData) ? statsData : [];

            const merged = studentsList.map(student => {
                const stats = statsList.find(s => s.studentEmail === student.email);
                return {
                    ...student,
                    courses: stats?.totalCourses || 0,
                    avgProgress: Math.round(stats?.avgProgress || 0)
                };
            });

            setStudents(merged);
        } catch (err) {
            console.error('Failed to load students:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredStudents = students.filter(s =>
        s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="admin-students">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Enrolled Students</h1>
                    <p className="admin-page-subtitle">Monitor student progress and platform engagement.</p>
                </div>
                <div className="admin-header-actions">
                    <button className="btn btn-outline">Export Data</button>
                </div>
            </div>

            <div className="admin-card table-container">
                <div className="table-header-filters">
                    <div className="admin-search-box">
                        <input
                            type="text"
                            placeholder="Find students..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <p style={{ padding: '2rem', textAlign: 'center' }}>Loading students...</p>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Email</th>
                                <th>Joined</th>
                                <th>Courses</th>
                                <th>Avg. Progress</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.map(student => (
                                <tr key={student.id}>
                                    <td>
                                        <div className="student-profile-cell">
                                            <div className="student-avatar">
                                                {student.name?.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="student-name">{student.name}</span>
                                        </div>
                                    </td>
                                    <td>{student.email}</td>
                                    <td>{student.joined
                                        ? new Date(student.joined).toLocaleDateString()
                                        : 'N/A'}
                                    </td>
                                    <td>{student.courses}</td>
                                    <td>
                                        <div className="progress-cell">
                                            <div className="progress-track">
                                                <div className="progress-fill"
                                                    style={{ width: `${student.avgProgress}%` }} />
                                            </div>
                                            <span className="progress-text">{student.avgProgress}%</span>
                                        </div>
                                    </td>
                                    <td className="text-right">
                                        <button className="icon-btn-view" title="View Profile">👁️</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                {!loading && filteredStudents.length === 0 && (
                    <div className="empty-state">No students found.</div>
                )}
            </div>
        </div>
    );
};

export default AdminStudents;