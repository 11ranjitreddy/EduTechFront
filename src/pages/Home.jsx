import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';
import CourseCard from '../components/CourseCard';
import { COURSE_URL } from '../config/api'; // ✅ ADDED
import './Home.css';

const Home = () => {
    const [featuredCourses, setFeaturedCourses] = useState([]);
    const [loadingCourses, setLoadingCourses] = useState(true);

    const categories = [
        { name: 'Python', icon: '🐍', color: '#ffecb3' },
        { name: 'Java', icon: '☕', color: '#e3f2fd' },
        { name: 'App Dev', icon: '📱', color: '#f3e5f5' },
        { name: 'Web Dev', icon: '🌐', color: '#e0f2f1' },
        { name: 'AI / ML', icon: '🤖', color: '#fbe9e7' },
        { name: 'Design', icon: '🎨', color: '#f1f8e9' },
    ];

    useEffect(() => {
        fetch(`${COURSE_URL}/top`) // ✅ FIXED
            .then(res => res.json())
            .then(data => setFeaturedCourses(data))
            .catch(err => console.error('Failed to load courses:', err))
            .finally(() => setLoadingCourses(false));
    }, []);

    return (
        <div className="home-page">
            <section className="hero-section">
                <div className="container hero-container">
                    <div className="hero-content">
                        <span className="hero-badge">Build your future</span>
                        <h1 className="hero-title">
                            Upgrade Your Skills. <br />
                            <span className="text-highlight">Learn From Industry Experts.</span>
                        </h1>
                        <p className="hero-subtitle">
                            Access world-class courses, live classes, and mentorship to advance your career.
                            Join a community of over 10,000+ learners today.
                        </p>
                        <div className="hero-cta-group">
                            <Link to="/courses">
                                <Button variant="primary" className="hero-btn">Explore Courses</Button>
                            </Link>
                            <Link to="/live-classes">
                                <Button variant="secondary" className="hero-btn">Join Live Classes</Button>
                            </Link>
                        </div>
                    </div>
                    <div className="hero-image-wrapper">
                        <div className="hero-blob"></div>
                        <div className="hero-visual">
                            <div className="floating-card card-1">
                                <span className="icon">💻</span>
                                <div>
                                    <h4>Web Development</h4>
                                    <p>In Progress</p>
                                </div>
                            </div>
                            <div className="floating-card card-2">
                                <span className="icon">🎓</span>
                                <div>
                                    <h4>Certified</h4>
                                    <p>Top Instructor</p>
                                </div>
                            </div>
                            <img
                                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                                alt="Students learning"
                                className="hero-main-img"
                            />
                        </div>
                    </div>
                </div>
            </section>

            <section className="categories-section">
                <div className="container">
                    <div className="section-header text-center">
                        <h2 className="section-title">Explore Categories</h2>
                        <p className="section-subtitle">Find the perfect course to start your learning journey</p>
                    </div>
                    <div className="categories-grid">
                        {categories.map((cat) => (
                            <Link
                                to={`/courses?category=${cat.name}`}
                                key={cat.name}
                                className="category-card"
                                style={{ '--hover-color': cat.color }}
                            >
                                <span className="category-icon">{cat.icon}</span>
                                <h3 className="category-name">{cat.name}</h3>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            <section className="featured-section" style={{ padding: '4rem 0', background: 'var(--background)' }}>
                <div className="container">
                    <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
                        <div>
                            <h2 className="section-title">Explore Top Courses</h2>
                            <p className="section-subtitle">Hand-picked courses to get you started</p>
                        </div>
                        <Link to="/courses">
                            <Button variant="outline">View All Courses</Button>
                        </Link>
                    </div>

                    {loadingCourses ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                            Loading courses...
                        </div>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                            gap: '2rem',
                            marginTop: '2rem'
                        }}>
                            {featuredCourses.map(course => (
                                <CourseCard key={course.id} course={course} />
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default Home;