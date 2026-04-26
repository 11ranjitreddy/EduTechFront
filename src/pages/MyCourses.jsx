import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Award, BookOpen, BarChart3 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import './MyCourses.css';

import { ENROLLMENT_URL } from '../config/api';

const MyCourses = () => {
    const { user } = useAuth();
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.email) {
            const token = user?.accessToken;
            fetch(`${ENROLLMENT_URL}/my?studentEmail=${user.email}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
                .then(res => {
                    if (!res.ok) throw new Error('Unauthorized');
                    return res.json();
                })
                .then(data => setEnrollments(Array.isArray(data) ? data : []))
                .catch(err => console.error('Failed to load enrollments:', err))
                .finally(() => setLoading(false));
        }
    }, [user]);

    const totalCourses = enrollments.length;
    const completedCourses = enrollments.filter(e => e.progress === 100).length;
    const inProgressCourses = enrollments.filter(
        e => e.progress > 0 && e.progress < 100
    ).length;

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '5rem' }}>
                <p>Loading your courses...</p>
            </div>
        );
    }

    return (
        <div className="my-courses-page">
            <div className="container">
                <div className="my-courses-header">
                    <div>
                        <h1>My Learning</h1>
                        <p>Welcome back, {user?.name || 'Learner'}! Continue your journey.</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: '#EEF2FF' }}>
                            <BookOpen size={24} color="#4F46E5" />
                        </div>
                        <div className="stat-info">
                            <span className="stat-number">{totalCourses}</span>
                            <span className="stat-label">Enrolled Courses</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: '#FEF3C7' }}>
                            <BarChart3 size={24} color="#F59E0B" />
                        </div>
                        <div className="stat-info">
                            <span className="stat-number">{inProgressCourses}</span>
                            <span className="stat-label">In Progress</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: '#D1FAE5' }}>
                            <Award size={24} color="#10B981" />
                        </div>
                        <div className="stat-info">
                            <span className="stat-number">{completedCourses}</span>
                            <span className="stat-label">Completed</span>
                        </div>
                    </div>
                </div>

                {/* Course List */}
                {totalCourses > 0 ? (
                    <div className="enrolled-courses">
                        <h2>Your Courses</h2>
                        <div className="courses-list">
                            {enrollments.map((enrollment) => (
                                <div key={enrollment.id} className="enrolled-course-card">
                                    <img
                                        src={enrollment.courseImage ||
                                            'https://placehold.co/200x120/png?text=Course'}
                                        alt={enrollment.courseTitle}
                                        className="course-thumbnail"
                                    />
                                    <div className="course-info">
                                        <h3>{enrollment.courseTitle}</h3>
                                        <p className="course-instructor">
                                            by {enrollment.instructor}
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
                                            <Button variant="primary">
                                                <Play size={16} />
                                                {enrollment.progress > 0 ? 'Continue' : 'Start'}
                                            </Button>
                                        </Link>
                                        {enrollment.progress === 100 && (
                                            <Link to={`/certificate/${enrollment.courseId}`}>
                                                <button style={{
                                                    padding: '0.6rem 1.25rem',
                                                    background: '#10B981',
                                                    color: 'white', border: 'none',
                                                    borderRadius: '8px', cursor: 'pointer',
                                                    fontWeight: '600', marginTop: '0.5rem'
                                                }}>
                                                    🏆 Get Certificate
                                                </button>
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="empty-state">
                        <BookOpen size={64} />
                        <h2>No courses yet</h2>
                        <p>You haven't enrolled in any courses. Start your learning journey today!</p>
                        <Link to="/courses">
                            <Button variant="primary">Browse Courses</Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyCourses;