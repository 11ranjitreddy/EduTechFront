import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Play, CheckCircle, PlayCircle, Circle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SmartDashboard from '../components/SmartDashboard';
import TabbedContent from '../components/TabbedContent';
import FloatingActions from '../components/FloatingActions';
import './CourseLearningV2.css';

import { COURSE_URL, ENROLLMENT_URL } from '../config/api';

const CourseLearningV2 = () => {
    const { id } = useParams();
    const { user } = useAuth();

    const [course, setCourse] = useState(null);
    const [sections, setSections] = useState([]);
    const [enrollment, setEnrollment] = useState(null);
    const [loading, setLoading] = useState(true);

    const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
    const [currentVideo, setCurrentVideo] = useState(null);
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);

    // ✅ Fetch course + curriculum + enrollment
    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [courseRes, curriculumRes] = await Promise.all([
                    fetch(`${COURSE_URL}/${id}`),
                    fetch(`${COURSE_URL}/${id}/curriculum`)
                ]);

                const courseData = await courseRes.json();
                const curriculumData = await curriculumRes.json();

                setCourse(courseData);
                setSections(Array.isArray(curriculumData) ? curriculumData : []);

                // Set first video as default
                if (curriculumData?.length > 0 && curriculumData[0].videos?.length > 0) {
                    setCurrentVideo(curriculumData[0].videos[0]);
                }

                // Fetch enrollment for progress
                if (user?.email) {
                    const enrollRes = await fetch(
                        `${ENROLLMENT_URL}/my?studentEmail=${user.email}`,
                         {
        headers: {
            'Authorization': `Bearer ${user.accessToken}`
        }
    }
                        
                    );
                    const enrollments = await enrollRes.json();
                    const found = enrollments.find(e => String(e.courseId) === String(id));
                    setEnrollment(found || null);
                }
            } catch (err) {
                console.error('Failed to load course:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchAll();
    }, [id, user]);

    // ✅ Extract YouTube embed URL
    const getYouTubeEmbed = (url) => {
        const match = url?.match(
            /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\n?#]+)/
        );
        return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1` : null;
    };

    // ✅ Get YouTube thumbnail
    const getYouTubeThumbnail = (url) => {
        const match = url?.match(
            /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\n?#]+)/
        );
        return match
            ? `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg`
            : 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800';
    };

    // ✅ Update progress in DB
    const updateProgress = async (progress) => {
        if (!enrollment?.id) return;
        try {
        await fetch(`${ENROLLMENT_URL}/${enrollment.id}/progress`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.accessToken}`
            },
            body: JSON.stringify({ progress })
        });
            setEnrollment(prev => ({ ...prev, progress }));
        } catch (err) {
            console.error('Failed to update progress:', err);
        }
    };

    // ✅ When student clicks a video
    const handleVideoSelect = (video, sectionIndex) => {
        setCurrentVideo(video);
        setCurrentSectionIndex(sectionIndex);
        setIsVideoPlaying(true);

        // Calculate progress based on video position
        const totalVideos = sections.reduce(
            (acc, s) => acc + (s.videos?.length || 0), 0
        );
        let videoPosition = 0;
        sections.forEach((section, si) => {
            if (si < sectionIndex) {
                videoPosition += section.videos?.length || 0;
            }
        });
        const currentSection = sections[sectionIndex];
        const videoIndex = currentSection?.videos?.findIndex(v => v.id === video.id) || 0;
        videoPosition += videoIndex + 1;

        const newProgress = Math.round((videoPosition / totalVideos) * 100);
        updateProgress(newProgress);
    };

    // Total videos and progress
    const totalVideos = sections.reduce(
        (acc, s) => acc + (s.videos?.length || 0), 0
    );
    const courseProgress = enrollment?.progress || 0;

    // Build lessons list for TabbedContent
    const allLessons = sections.flatMap((section, si) =>
        (section.videos || []).map((video, vi) => ({
            id: video.id,
            title: video.title,
            duration: video.duration || '--',
            type: 'Video',
            completed: false,
            isFree: video.isFree,
            sectionIndex: si,
            video
        }))
    );

    if (loading) return (
        <div style={{ textAlign: 'center', padding: '5rem', fontSize: '1.2rem' }}>
            Loading course...
        </div>
    );

    if (!course) return (
        <div style={{ textAlign: 'center', padding: '5rem' }}>
            Course not found.
        </div>
    );

    return (
        <div className="course-learning-v2">
            {/* Header */}
            <header className="learning-header">
                <Link to="/my-courses" className="back-link">
                    <ArrowLeft size={20} />
                    <span>Back to My Courses</span>
                </Link>
                <h1>{course.title}</h1>
            </header>

            <div className="learning-layout">
                {/* LEFT SIDEBAR - Sections Journey Map */}
                <aside className="journey-sidebar">
                    <div className="journey-header">
                        <h3>Course Roadmap</h3>
                        <span className="progress-badge">{courseProgress}%</span>
                    </div>

                    {sections.length === 0 ? (
                        <div style={{
                            padding: '2rem 1rem',
                            textAlign: 'center',
                            color: '#9CA3AF',
                            fontSize: '0.85rem'
                        }}>
                            No content yet
                        </div>
                    ) : (
                        <div className="journey-modules">
                            {sections.map((section, index) => {
                                const isCompleted = index < currentSectionIndex;
                                const isCurrent = index === currentSectionIndex;
                                const isUpcoming = index > currentSectionIndex;

                                return (
                                    <div
                                        key={section.id}
                                        className={`journey-module 
                                            ${isCompleted ? 'completed' : ''} 
                                            ${isCurrent ? 'current' : ''} 
                                            ${isUpcoming ? 'upcoming' : ''}`}
                                        onClick={() => setCurrentSectionIndex(index)}
                                    >
                                        <div className="module-connector">
                                            <div className="connector-line" />
                                            <div className="module-node">
                                                {isCompleted && <CheckCircle size={18} />}
                                                {isCurrent && <PlayCircle size={18} />}
                                                {isUpcoming && <Circle size={18} />}
                                            </div>
                                        </div>
                                        <div className="module-info">
                                            <span className="module-number">
                                                Section {index + 1}
                                            </span>
                                            <span className="module-title">
                                                {section.title}
                                            </span>
                                            <span style={{
                                                fontSize: '0.75rem',
                                                color: '#9CA3AF'
                                            }}>
                                                {section.videos?.length || 0} videos
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </aside>

                {/* CENTER - Video Player */}
                <main className="content-center">
                    <div className="video-player">
                        {!isVideoPlaying || !currentVideo ? (
                            // ✅ Thumbnail with play button
                            <div
                                className="video-placeholder"
                                onClick={() => {
                                    if (currentVideo) setIsVideoPlaying(true);
                                }}
                                style={{ cursor: currentVideo ? 'pointer' : 'default' }}
                            >
                                <img
                                    src={currentVideo
                                        ? getYouTubeThumbnail(currentVideo.videoUrl)
                                        : 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800'
                                    }
                                    alt="Video thumbnail"
                                />
                                <div className="play-overlay">
                                    {currentVideo ? (
                                        <div className="play-btn">
                                            <Play size={40} fill="white" />
                                        </div>
                                    ) : (
                                        <div style={{
                                            background: 'rgba(0,0,0,0.7)',
                                            color: 'white',
                                            padding: '1rem 2rem',
                                            borderRadius: '8px',
                                            fontSize: '1rem'
                                        }}>
                                            No videos available yet
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            // ✅ YouTube embed player
                            <div className="video-active" style={{ position: 'relative', paddingTop: '56.25%' }}>
                                {getYouTubeEmbed(currentVideo.videoUrl) ? (
                                    <iframe
                                        src={getYouTubeEmbed(currentVideo.videoUrl)}
                                        title={currentVideo.title}
                                        style={{
                                            position: 'absolute',
                                            top: 0, left: 0,
                                            width: '100%', height: '100%',
                                            border: 'none'
                                        }}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                ) : (
                                    <div style={{
                                        position: 'absolute', top: 0, left: 0,
                                        width: '100%', height: '100%',
                                        display: 'flex', alignItems: 'center',
                                        justifyContent: 'center',
                                        background: '#1a1a2e', color: 'white'
                                    }}>
                                        Invalid video URL
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Current video title */}
                        {currentVideo && (
                            <div style={{
                                padding: '1rem 1.5rem',
                                background: 'white',
                                borderTop: '1px solid #E5E7EB'
                            }}>
                                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>
                                    {currentVideo.title}
                                </h3>
                                {currentVideo.duration && (
                                    <p style={{
                                        margin: '0.25rem 0 0',
                                        fontSize: '0.85rem',
                                        color: '#6B7280'
                                    }}>
                                        ⏱ {currentVideo.duration}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ✅ Certificate Section - Show when 100% complete */}
                    {courseProgress === 100 && (
                        <div style={{
                            margin: '1rem',
                            padding: '1.5rem',
                            background: 'linear-gradient(135deg, #10B981, #059669)',
                            borderRadius: '12px',
                            textAlign: 'center',
                            color: 'white'
                        }}>
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏆</div>
                            <h3 style={{ margin: '0 0 0.5rem' }}>Course Completed!</h3>
                            <p style={{ margin: '0 0 1rem', opacity: 0.9 }}>
                                Congratulations! You've completed this course.
                            </p>
                            <Link to={`/certificate/${id}`}>
                                <button style={{
                                    padding: '0.6rem 1.5rem',
                                    background: 'white',
                                    color: '#10B981',
                                    border: 'none', 
                                    borderRadius: '8px',
                                    cursor: 'pointer', 
                                    fontWeight: '700'
                                }}>
                                    🎓 Get Certificate
                                </button>
                            </Link>
                        </div>
                    )}

                    {/* ✅ Tabbed Content with real lessons */}
                    <TabbedContent
    lessons={allLessons}
    assignments={[]}
    //discussions={[]}
    resources={[]}
    certificateProgress={courseProgress}
    currentLessonIndex={0}
    courseId={id}
    onLessonSelect={(index) => {
        const lesson = allLessons[index];
        if (lesson) {
            handleVideoSelect(lesson.video, lesson.sectionIndex);
        }
    }}
/>
                </main>

                {/* RIGHT SIDEBAR */}
                <aside className="dashboard-sidebar">
                    <SmartDashboard
                        courseProgress={courseProgress}
                        timeSpent="0h 0m"
                        streak={1}
                        xp={courseProgress * 10}
                        badges={courseProgress === 100 ? 1 : 0}
                        lastLesson={{
                            title: currentVideo?.title || 'Start Learning',
                            duration: currentVideo?.duration || '--'
                        }}
                        recommendedLesson={{
                            title: allLessons[1]?.title || 'Next Lesson',
                            duration: allLessons[1]?.duration || '--'
                        }}
                        instructor={{
                            name: course.instructor,
                            title: 'Course Instructor',
                            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100'
                        }}
                    />
                </aside>
            </div>

            <FloatingActions />
        </div>
    );
};

export default CourseLearningV2;