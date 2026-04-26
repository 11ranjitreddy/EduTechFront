import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, CheckCircle, ChevronDown, ChevronUp, Lock } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

import { COURSE_URL as BASE_URL } from '../config/api';

const CourseDetail = () => {
    const { id } = useParams();
    const { addToCart, cart, enrolledCourseIds } = useCart();
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const [course, setCourse] = useState(null);
    const [curriculum, setCurriculum] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedSections, setExpandedSections] = useState({});
    const [added, setAdded] = useState(false);

    const isInCart = cart.some(item => String(item.id) === String(id));
    const isOwned = enrolledCourseIds?.includes(String(id));

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [courseRes, curriculumRes] = await Promise.all([
                    fetch(`${BASE_URL}/${id}`),
                    fetch(`${BASE_URL}/${id}/curriculum`)
                ]);
                const courseData = await courseRes.json();
                const curriculumData = await curriculumRes.json();
                setCourse(courseData);
                setCurriculum(Array.isArray(curriculumData) ? curriculumData : []);

                // ✅ Expand first section by default
                if (curriculumData?.length > 0) {
                    setExpandedSections({ [curriculumData[0].id]: true });
                }
            } catch (err) {
                console.error('Failed to load course');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleAddToCart = () => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: `/course/${id}` } });
            return;
        }
        if (isOwned) {
            navigate(`/learn/${id}`);
            return;
        }
        if (isInCart) {
            navigate('/cart');
            return;
        }
        addToCart(course);
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
    };

    const toggleSection = (sectionId) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionId]: !prev[sectionId]
        }));
    };

    // ✅ Total videos count
    const totalVideos = curriculum.reduce(
        (acc, s) => acc + (s.videos?.length || 0), 0
    );

    if (loading) return (
        <div style={{ textAlign: 'center', padding: '5rem' }}>Loading...</div>
    );
    if (!course) return (
        <div style={{ textAlign: 'center', padding: '5rem' }}>Course not found</div>
    );

    return (
        <div className="course-detail">
            {/* ✅ Hero Section */}
            <div style={{ background: '#111827', color: 'white', padding: '3rem 0' }}>
                <div className="container" style={{ display: 'flex', gap: '3rem', alignItems: 'center' }}>
                    <div style={{ flex: 2 }}>
                        {/* Category badge */}
                        <span style={{
                            background: '#4F46E5', color: 'white',
                            padding: '0.25rem 0.75rem', borderRadius: '9999px',
                            fontSize: '0.8rem', fontWeight: '600',
                            marginBottom: '1rem', display: 'inline-block'
                        }}>
                            {course.category}
                        </span>

                        <h1 style={{
                            color: 'white', fontSize: '2.2rem',
                            marginBottom: '1rem', lineHeight: 1.3
                        }}>
                            {course.title}
                        </h1>

                        <p style={{
                            fontSize: '1.05rem', color: '#D1D5DB',
                            marginBottom: '1.5rem', lineHeight: 1.6
                        }}>
                            {course.description || 'Master this subject with hands-on projects and expert instruction.'}
                        </p>

                        <div style={{
                            display: 'flex', gap: '1.5rem',
                            alignItems: 'center', marginBottom: '1.5rem',
                            flexWrap: 'wrap'
                        }}>
                            <div style={{
                                background: '#F59E0B', color: 'black',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '4px', fontWeight: 'bold'
                            }}>
                                ⭐ {course.rating || '4.5'}
                            </div>
                            <span style={{ color: '#F3F4F6' }}>
                                by <span style={{ color: '#818CF8', fontWeight: '600' }}>
                                    {course.instructor}
                                </span>
                            </span>
                            <span style={{ color: '#9CA3AF' }}>
                                👥 {course.students?.toLocaleString()} students
                            </span>
                            {totalVideos > 0 && (
                                <span style={{ color: '#9CA3AF' }}>
                                    🎬 {totalVideos} videos
                                </span>
                            )}
                            {curriculum.length > 0 && (
                                <span style={{ color: '#9CA3AF' }}>
                                    📚 {curriculum.length} sections
                                </span>
                            )}
                        </div>

                        {/* ✅ Price + CTA */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                            <div>
                                <span style={{
                                    fontSize: '2rem', fontWeight: '700',
                                    color: 'white'
                                }}>
                                    ₹{course.price}
                                </span>
                                {course.originalPrice && (
                                    <span style={{
                                        fontSize: '1.1rem',
                                        textDecoration: 'line-through',
                                        color: '#9CA3AF', marginLeft: '0.75rem'
                                    }}>
                                        ₹{course.originalPrice}
                                    </span>
                                )}
                                {course.originalPrice && (
                                    <span style={{
                                        background: '#10B981', color: 'white',
                                        padding: '0.2rem 0.5rem', borderRadius: '4px',
                                        fontSize: '0.85rem', fontWeight: '600',
                                        marginLeft: '0.75rem'
                                    }}>
                                        {Math.round(((course.originalPrice - course.price) / course.originalPrice) * 100)}% OFF
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={handleAddToCart}
                                style={{
                                    padding: '0.85rem 2rem',
                                    background: isOwned ? '#10B981' : '#4F46E5',
                                    color: 'white', border: 'none',
                                    borderRadius: '10px', fontSize: '1rem',
                                    fontWeight: '600', cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {isOwned ? '▶ Continue Learning' :
                                 isInCart ? '🛒 Go to Cart' :
                                 added ? '✓ Added to Cart!' :
                                 `🛒 Add to Cart`}
                            </button>
                        </div>
                    </div>

                    {/* Course Image */}
                    <div style={{ flex: 1 }}>
                        <img
                            src={course.image || 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=600'}
                            alt={course.title}
                            style={{
                                width: '100%', borderRadius: '12px',
                                boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* ✅ Main Content */}
            <div className="container" style={{
                padding: '3rem 1.5rem',
                display: 'flex', gap: '3rem'
            }}>
                {/* Left Column */}
                <div style={{ flex: 2 }}>

                    {/* What you'll learn */}
                    <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>What you'll learn</h2>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr', gap: '1rem'
                        }}>
                            {[
                                'Hands-on projects',
                                'Industry best practices',
                                'Certificate of completion',
                                'Lifetime access',
                                'Expert instruction',
                                'Real-world examples'
                            ].map((feat, i) => (
                                <div key={i} style={{ display: 'flex', gap: '0.75rem' }}>
                                    <CheckCircle size={20} color="#10B981" />
                                    <span>{feat}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ✅ Real Curriculum */}
                    <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
                        <div style={{
                            display: 'flex', justifyContent: 'space-between',
                            alignItems: 'center', marginBottom: '1.5rem'
                        }}>
                            <h2 style={{ margin: 0 }}>Course Content</h2>
                            <span style={{ color: '#6B7280', fontSize: '0.9rem' }}>
                                {curriculum.length} sections • {totalVideos} videos
                            </span>
                        </div>

                        {curriculum.length === 0 ? (
                            <div style={{
                                textAlign: 'center', padding: '2rem',
                                color: '#9CA3AF', background: '#F9FAFB',
                                borderRadius: '8px'
                            }}>
                                Curriculum coming soon
                            </div>
                        ) : (
                            <div style={{
                                border: '1px solid #E5E7EB',
                                borderRadius: '8px', overflow: 'hidden'
                            }}>
                                {curriculum.map((section, sIndex) => (
                                    <div key={section.id}>
                                        {/* Section Header */}
                                        <div
                                            onClick={() => toggleSection(section.id)}
                                            style={{
                                                padding: '1rem 1.5rem',
                                                background: '#F8FAFC',
                                                borderBottom: '1px solid #E5E7EB',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                cursor: 'pointer',
                                                userSelect: 'none'
                                            }}
                                        >
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center', gap: '0.75rem'
                                            }}>
                                                {expandedSections[section.id]
                                                    ? <ChevronUp size={18} color="#6B7280" />
                                                    : <ChevronDown size={18} color="#6B7280" />
                                                }
                                                <span style={{ fontWeight: '600' }}>
                                                    Section {sIndex + 1}: {section.title}
                                                </span>
                                            </div>
                                            <span style={{
                                                fontSize: '0.85rem', color: '#6B7280'
                                            }}>
                                                {section.videos?.length || 0} videos
                                            </span>
                                        </div>

                                        {/* ✅ Videos List */}
                                        {expandedSections[section.id] && (
                                            <div>
                                                {section.videos?.length === 0 ? (
                                                    <div style={{
                                                        padding: '1rem 1.5rem',
                                                        color: '#9CA3AF',
                                                        fontSize: '0.9rem'
                                                    }}>
                                                        No videos yet
                                                    </div>
                                                ) : (
                                                    section.videos?.map((video, vIndex) => (
                                                        <div
                                                            key={video.id}
                                                            style={{
                                                                padding: '0.85rem 1.5rem',
                                                                borderBottom: '1px solid #F1F5F9',
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center',
                                                                background: 'white'
                                                            }}
                                                        >
                                                            <div style={{
                                                                display: 'flex',
                                                                alignItems: 'center', gap: '0.75rem'
                                                            }}>
                                                                {video.isFree ? (
                                                                    <Play size={16} color="#4F46E5" />
                                                                ) : (
                                                                    <Lock size={16} color="#9CA3AF" />
                                                                )}
                                                                <span style={{
                                                                    fontSize: '0.9rem',
                                                                    color: video.isFree ? '#111827' : '#6B7280'
                                                                }}>
                                                                    {vIndex + 1}. {video.title}
                                                                </span>
                                                                {video.isFree && (
                                                                    <span style={{
                                                                        background: '#DCFCE7',
                                                                        color: '#166534',
                                                                        padding: '0.1rem 0.4rem',
                                                                        borderRadius: '9999px',
                                                                        fontSize: '0.7rem',
                                                                        fontWeight: '600'
                                                                    }}>
                                                                        Free Preview
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {video.duration && (
                                                                <span style={{
                                                                    fontSize: '0.85rem',
                                                                    color: '#9CA3AF'
                                                                }}>
                                                                    ⏱ {video.duration}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column */}
                <div style={{ flex: 1 }}>
                    {/* Instructor Card */}
                    <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                        <h3 style={{ marginBottom: '1rem' }}>Instructor</h3>
                        <div style={{
                            display: 'flex', gap: '1rem',
                            alignItems: 'center', marginBottom: '1rem'
                        }}>
                            <div style={{
                                width: '64px', height: '64px',
                                background: '#4F46E5', borderRadius: '50%',
                                display: 'flex', alignItems: 'center',
                                justifyContent: 'center', color: 'white',
                                fontSize: '1.5rem', fontWeight: '700'
                            }}>
                                {course.instructor?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>
                                    {course.instructor}
                                </div>
                                <div style={{
                                    fontSize: '0.9rem',
                                    color: 'var(--text-secondary)'
                                }}>
                                    {course.category} Expert
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Course Details Card */}
                    <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                        <h3 style={{ marginBottom: '1rem' }}>Course Details</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {[
                                { label: 'Category', value: course.category },
                                { label: 'Rating', value: `⭐ ${course.rating || '4.5'}` },
                                { label: 'Students', value: course.students?.toLocaleString() },
                                { label: 'Sections', value: curriculum.length },
                                { label: 'Videos', value: totalVideos },
                                { label: 'Price', value: `₹${course.price}`, highlight: true },
                            ].map((item, i) => (
                                <div key={i} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    paddingBottom: '0.75rem',
                                    borderBottom: '1px solid #F1F5F9'
                                }}>
                                    <span style={{ color: '#6B7280' }}>{item.label}</span>
                                    <span style={{
                                        fontWeight: '600',
                                        color: item.highlight ? '#4F46E5' : '#111827'
                                    }}>
                                        {item.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ✅ Sticky CTA */}
                    <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                        <div style={{
                            fontSize: '2rem', fontWeight: '700',
                            color: '#4F46E5', marginBottom: '0.5rem'
                        }}>
                            ₹{course.price}
                        </div>
                        {course.originalPrice && (
                            <div style={{
                                textDecoration: 'line-through',
                                color: '#9CA3AF', marginBottom: '1rem'
                            }}>
                                ₹{course.originalPrice}
                            </div>
                        )}
                        <button
                            onClick={handleAddToCart}
                            style={{
                                width: '100%', padding: '0.85rem',
                                background: isOwned ? '#10B981' : '#4F46E5',
                                color: 'white', border: 'none',
                                borderRadius: '10px', fontSize: '1rem',
                                fontWeight: '600', cursor: 'pointer',
                                marginBottom: '0.75rem'
                            }}
                        >
                            {isOwned ? '▶ Continue Learning' :
                             isInCart ? '🛒 Go to Cart' :
                             added ? '✓ Added!' :
                             '🛒 Add to Cart'}
                        </button>
                        <p style={{
                            fontSize: '0.8rem',
                            color: '#9CA3AF', margin: 0
                        }}>
                            🔒 Secure payment • Lifetime access
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseDetail;