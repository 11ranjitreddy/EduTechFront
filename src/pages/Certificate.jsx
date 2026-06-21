import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Certificate.css';
import API_URL from '../config/api';

const COURSE_URL = `${API_URL}/api/v1/courses`;
const ENROLLMENT_URL = `${API_URL}/api/v1/enrollments`;

const Certificate = () => {
    const { courseId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const certificateRef = useRef(null);

    const [course, setCourse] = useState(null);
    const [enrollment, setEnrollment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notEligible, setNotEligible] = useState(false);

    useEffect(() => {
        fetchData();
    }, [courseId, user]);

    const fetchData = async () => {
        if (!user?.email) return;
        try {
            const [courseRes, enrollRes] = await Promise.all([
                fetch(`${COURSE_URL}/${courseId}`),
                fetch(`${ENROLLMENT_URL}/my?studentEmail=${user.email}`)
            ]);

            const courseData = await courseRes.json();
            const enrollments = await enrollRes.json();

            const found = enrollments.find(
                e => String(e.courseId) === String(courseId)
            );

            setCourse(courseData);
            setEnrollment(found);

            // ✅ Only show certificate if 100% complete
            if (!found || found.progress < 100) {
                setNotEligible(true);
            }
        } catch (err) {
            console.error('Failed to load certificate:', err);
        } finally {
            setLoading(false);
        }
    };

    // ✅ Print / Download certificate
    const handleDownload = () => {
        window.print();
    };

    const formatDate = () => {
        return new Date().toLocaleDateString('en-IN', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
    };

    const certificateId = `CERT-${courseId}-${user?.email?.split('@')[0].toUpperCase()}-${Date.now().toString().slice(-6)}`;

    if (loading) return (
        <div style={{ textAlign: 'center', padding: '5rem' }}>
            Loading certificate...
        </div>
    );

    // ✅ Not eligible
    if (notEligible) return (
        <div style={{
            textAlign: 'center', padding: '5rem',
            maxWidth: '500px', margin: '0 auto'
        }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔒</div>
            <h2 style={{ marginBottom: '0.5rem' }}>Certificate Not Available</h2>
            <p style={{ color: '#6B7280', marginBottom: '2rem' }}>
                Complete 100% of the course to unlock your certificate.
                You're currently at {enrollment?.progress || 0}% progress.
            </p>
            <div style={{
                background: '#F1F5F9', borderRadius: '12px',
                padding: '1rem', marginBottom: '2rem'
            }}>
                <div style={{
                    height: '10px', background: '#E5E7EB',
                    borderRadius: '9999px', overflow: 'hidden'
                }}>
                    <div style={{
                        width: `${enrollment?.progress || 0}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #4F46E5, #7C3AED)',
                        borderRadius: '9999px'
                    }} />
                </div>
                <p style={{
                    margin: '0.5rem 0 0',
                    fontSize: '0.9rem', color: '#6B7280'
                }}>
                    {enrollment?.progress || 0}% Complete
                </p>
            </div>
            <Link to={`/learn/${courseId}`}>
                <button style={{
                    padding: '0.85rem 2rem',
                    background: '#4F46E5', color: 'white',
                    border: 'none', borderRadius: '10px',
                    cursor: 'pointer', fontWeight: '600',
                    fontSize: '1rem'
                }}>
                    ▶ Continue Learning
                </button>
            </Link>
        </div>
    );

    return (
        <div className="certificate-page">
            {/* ✅ Action buttons - hidden when printing */}
            <div className="certificate-actions no-print">
                <Link to="/my-courses" className="cert-back-btn">
                    ← Back to My Courses
                </Link>
                <button
                    onClick={handleDownload}
                    className="cert-download-btn"
                >
                    ⬇️ Download Certificate
                </button>
            </div>

            {/* ✅ Certificate */}
            <div className="certificate-wrapper" ref={certificateRef}>
                <div className="certificate">
                    {/* Top decorative border */}
                    <div className="cert-border-top" />

                    {/* Header */}
                    <div className="cert-header">
                        <div className="cert-logo">
                            EdTech<span className="cert-dot">.</span>
                        </div>
                        <div className="cert-tagline">
                            Excellence in Online Education
                        </div>
                    </div>

                    {/* Certificate of Completion text */}
                    <div className="cert-title-section">
                        <p className="cert-presents">
                            This is to certify that
                        </p>
                        <h1 className="cert-student-name">
                            {user?.name || user?.email?.split('@')[0]}
                        </h1>
                        <p className="cert-completed-text">
                            has successfully completed the course
                        </p>
                        <h2 className="cert-course-name">
                            {course?.title}
                        </h2>
                    </div>

                    {/* Course details */}
                    <div className="cert-details">
                        <div className="cert-detail-item">
                            <span className="cert-detail-label">Instructor</span>
                            <span className="cert-detail-value">{course?.instructor}</span>
                        </div>
                        <div className="cert-detail-divider" />
                        <div className="cert-detail-item">
                            <span className="cert-detail-label">Category</span>
                            <span className="cert-detail-value">{course?.category}</span>
                        </div>
                        <div className="cert-detail-divider" />
                        <div className="cert-detail-item">
                            <span className="cert-detail-label">Completed On</span>
                            <span className="cert-detail-value">{formatDate()}</span>
                        </div>
                    </div>

                    {/* Signature section */}
                    <div className="cert-signature-section">
                        <div className="cert-signature">
                            <div className="cert-signature-line" />
                            <p className="cert-signatory">{course?.instructor}</p>
                            <p className="cert-signatory-title">Course Instructor</p>
                        </div>
                        <div className="cert-seal">
                            <div className="cert-seal-inner">
                                <div style={{ fontSize: '2rem' }}>🏆</div>
                                <div style={{ fontSize: '0.5rem', fontWeight: '700' }}>
                                    CERTIFIED
                                </div>
                            </div>
                        </div>
                        <div className="cert-signature">
                            <div className="cert-signature-line" />
                            <p className="cert-signatory">EdTech Platform</p>
                            <p className="cert-signatory-title">Director of Education</p>
                        </div>
                    </div>

                    {/* Certificate ID */}
                    <div className="cert-footer">
                        <p className="cert-id">
                            Certificate ID: {certificateId}
                        </p>
                        <p className="cert-verify">
                            Verify at: edtech.com/verify
                        </p>
                    </div>

                    {/* Bottom decorative border */}
                    <div className="cert-border-bottom" />
                </div>
            </div>
        </div>
    );
};

export default Certificate;