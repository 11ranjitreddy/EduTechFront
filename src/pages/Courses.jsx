import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import CourseCard from '../components/CourseCard';
import './Courses.css';

import { COURSE_URL as BASE_URL } from '../config/api';

const categoryMap = {
    'all': 'All',
    'python': 'Python',
    'java': 'Java',
    'web-dev': 'Web Dev',
    'app-dev': 'App Dev',
    'ai-ml': 'AI / ML',
    'design': 'Design'
};

const Courses = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const urlCategory = searchParams.get('category');
    const urlSearch = searchParams.get('search');

    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const categories = ['All', 'Python', 'Java', 'Web Dev', 'App Dev', 'AI / ML', 'Design'];

    // ✅ Sync URL params
    useEffect(() => {
        if (urlSearch) {
            setSearchQuery(urlSearch);
            setSelectedCategory('All');
        } else if (urlCategory && categoryMap[urlCategory]) {
            setSelectedCategory(categoryMap[urlCategory]);
            setSearchQuery('');
        } else {
            setSelectedCategory('All');
            setSearchQuery('');
        }
    }, [urlCategory, urlSearch]);

    // ✅ Fetch courses
    useEffect(() => {
        const fetchCourses = async () => {
            setLoading(true);
            setError('');
            try {
                let url;

                if (searchQuery.trim()) {
                    // ✅ Search API
                    url = `${BASE_URL}/search?query=${encodeURIComponent(searchQuery)}`;
                } else if (selectedCategory === 'All') {
                    url = BASE_URL;
                } else {
                    url = `${BASE_URL}?category=${selectedCategory}`;
                }

                const response = await fetch(url);
                const data = await response.json();
                setCourses(Array.isArray(data) ? data : []);
            } catch (err) {
                setError('Failed to load courses');
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, [selectedCategory, searchQuery]);

    const handleCategoryChange = (cat) => {
        setSelectedCategory(cat);
        setSearchQuery('');
        const slug = Object.keys(categoryMap).find(key => categoryMap[key] === cat);
        if (slug && slug !== 'all') setSearchParams({ category: slug });
        else setSearchParams({});
    };

    // ✅ Local search handler
    const handleLocalSearch = (e) => {
        const val = e.target.value;
        setSearchQuery(val);
        if (val.trim()) {
            setSearchParams({ search: val });
        } else {
            setSearchParams({});
        }
    };

    return (
        <div className="courses-page container">
            <div className="courses-header">
                <h1 className="page-title">
                    {searchQuery ? `Search results for "${searchQuery}"` : 'All Courses'}
                </h1>
                <p className="page-subtitle">
                    Broaden your knowledge with our extensive course library.
                </p>
            </div>

            {/* ✅ Search bar inside courses page too */}
            <div style={{
                marginBottom: '2rem',
                display: 'flex',
                gap: '1rem',
                alignItems: 'center'
            }}>
                <input
                    type="text"
                    placeholder="Search courses, topics, instructors..."
                    value={searchQuery}
                    onChange={handleLocalSearch}
                    style={{
                        flex: 1, padding: '0.75rem 1rem',
                        border: '2px solid #E5E7EB',
                        borderRadius: '8px', fontSize: '0.95rem',
                        outline: 'none'
                    }}
                />
                {searchQuery && (
                    <button
                        onClick={() => {
                            setSearchQuery('');
                            setSearchParams({});
                        }}
                        style={{
                            padding: '0.75rem 1rem',
                            background: '#F1F5F9',
                            border: 'none', borderRadius: '8px',
                            cursor: 'pointer', fontWeight: '600'
                        }}
                    >
                        Clear ✕
                    </button>
                )}
            </div>

            <div className="courses-layout">
                <aside className="filters-sidebar">
                    <div className="filter-group">
                        <h3 className="filter-title">Categories</h3>
                        <ul className="filter-list">
                            {categories.map(cat => (
                                <li key={cat}>
                                    <button
                                        className={`filter-btn ${selectedCategory === cat && !searchQuery ? 'active' : ''}`}
                                        onClick={() => handleCategoryChange(cat)}
                                    >
                                        {cat}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="filter-group">
                        <h3 className="filter-title">Price</h3>
                        <div className="price-range">
                            <label><input type="checkbox" /> Free</label>
                            <label><input type="checkbox" /> Paid</label>
                        </div>
                    </div>
                </aside>

                <div className="courses-content">
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '3rem' }}>
                            <p>Loading courses...</p>
                        </div>
                    ) : error ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'red' }}>
                            <p>{error}</p>
                        </div>
                    ) : courses.length === 0 ? (
                        <div className="no-results" style={{ textAlign: 'center', padding: '3rem' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                            <h3>No courses found</h3>
                            <p style={{ color: '#6B7280' }}>
                                {searchQuery
                                    ? `No results for "${searchQuery}" — try different keywords`
                                    : 'No courses in this category yet'}
                            </p>
                        </div>
                    ) : (
                        <div className="courses-grid">
                            {courses.map(course => (
                                <CourseCard key={course.id} course={course} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Courses;