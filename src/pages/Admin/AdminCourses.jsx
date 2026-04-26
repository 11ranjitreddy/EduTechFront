import React, { useState, useEffect } from 'react';
import Button from '../../components/Button';
import { useAuth } from '../../context/AuthContext';
import './AdminCourses.css';
import { useNavigate } from 'react-router-dom';

import { COURSE_URL as BASE_URL } from '../../config/api';

const emptyForm = {
    title: '', description: '', instructor: '',
    price: '', originalPrice: '', category: '', image: ''
};

const inputStyle = {
    width: '100%', padding: '0.75rem',
    border: '2px solid #E5E7EB', borderRadius: '8px',
    fontSize: '0.95rem', boxSizing: 'border-box',
    marginTop: '0.4rem', outline: 'none'
};

const labelStyle = {
    display: 'block', marginBottom: '0.2rem',
    fontWeight: '600', fontSize: '0.9rem', color: '#374151'
};

const AdminCourses = () => {
    const { user } = useAuth();
    const [courses, setCourses] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCourse, setEditingCourse] = useState(null);
    const [formData, setFormData] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if (user?.accessToken) fetchCourses();
    }, [user]);

    const getToken = () => user?.accessToken;

    const fetchCourses = async () => {
        try {
            const response = await fetch(`${BASE_URL}/admin/all`, {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            const data = await response.json();
            setCourses(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to load courses');
        } finally {
            setLoading(false);
        }
    };

    const openAddModal = () => {
        setEditingCourse(null);
        setFormData(emptyForm);
        setFormError('');
        setShowModal(true);
    };

    const openEditModal = (course) => {
        setEditingCourse(course);
        setFormData({
            title: course.title || '', description: course.description || '',
            instructor: course.instructor || '', price: course.price || '',
            originalPrice: course.originalPrice || '',
            category: course.category || '', image: course.image || ''
        });
        setFormError('');
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setFormError('');
        if (!formData.title || !formData.instructor || !formData.price || !formData.category) {
            setFormError('Please fill in all required fields');
            return;
        }
        setSaving(true);
        try {
            const url = editingCourse ? `${BASE_URL}/${editingCourse.id}` : BASE_URL;
            const method = editingCourse ? 'PUT' : 'POST';
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify({
                    ...formData,
                    price: parseFloat(formData.price),
                    originalPrice: parseFloat(formData.originalPrice) || null
                })
            });
            if (!response.ok) throw new Error('Failed to save course');
            setShowModal(false);
            fetchCourses();
        } catch (err) {
            setFormError('Failed to save course. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const toggleStatus = async (id) => {
        try {
            await fetch(`${BASE_URL}/${id}/status`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            fetchCourses();
        } catch (err) {
            console.error('Failed to toggle status');
        }
    };

    const deleteCourse = async (id) => {
        if (window.confirm('Are you sure you want to delete this course?')) {
            try {
                await fetch(`${BASE_URL}/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${getToken()}` }
                });
                fetchCourses();
            } catch (err) {
                console.error('Failed to delete course');
            }
        }
    };

    const filteredCourses = courses.filter(c =>
        c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.instructor?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="admin-courses">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Manage Courses</h1>
                    <p className="admin-page-subtitle">Add, edit, or remove courses from the platform.</p>
                </div>
                <Button variant="primary" onClick={openAddModal}>+ Add New Course</Button>
            </div>

            <div className="admin-card table-container">
                <div className="table-header-filters">
                    <div className="admin-search-box">
                        <input type="text" placeholder="Search courses..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </div>

                {loading ? (
                    <p style={{ padding: '2rem', textAlign: 'center' }}>Loading...</p>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Course Name</th>
                                <th>Instructor</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Students</th>
                                <th>Status</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCourses.map(course => (
                                <tr key={course.id}>
                                    <td>
                                        <div className="course-title-cell">
                                            <div className="course-avatar-mini">
                                                {course.title.charAt(0)}
                                            </div>
                                            <span>{course.title}</span>
                                        </div>
                                    </td>
                                    <td>{course.instructor}</td>
                                    <td><span className="badge category">{course.category}</span></td>
                                    <td>₹{course.price}</td>
                                    <td>{course.students?.toLocaleString()}</td>
                                    <td>
                                        <span className={`status-pill ${course.status?.toLowerCase()}`}>
                                            {course.status}
                                        </span>
                                    </td>
                                    <td className="text-right">
                                        <div className="action-btns">
                                            <button className="icon-btn-edit" title="Edit"
                                                onClick={() => openEditModal(course)}>✏️</button>
                                            <button className="icon-btn-curriculum"
                                                title="Manage Curriculum"
                                                onClick={() => navigate(`/admin/courses/${course.id}/curriculum`)}>
                                                🎬</button>
                                            <button className="icon-btn-status"
                                                title={course.status === 'LIVE' ? 'Unpublish' : 'Publish'}
                                                onClick={() => toggleStatus(course.id)}>
                                                {course.status === 'LIVE' ? '⏸️' : '▶️'}
                                            </button>
                                            <button className="icon-btn-delete" title="Delete"
                                                onClick={() => deleteCourse(course.id)}>🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                {!loading && filteredCourses.length === 0 && (
                    <div className="empty-state">No courses found.</div>
                )}
            </div>

            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0,
                    width: '100vw', height: '100vh',
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{
                        background: 'white', borderRadius: '16px',
                        padding: '2rem', width: '100%', maxWidth: '560px',
                        maxHeight: '90vh', overflowY: 'auto',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                    }}>
                        <div style={{
                            display: 'flex', justifyContent: 'space-between',
                            alignItems: 'center', marginBottom: '1.5rem'
                        }}>
                            <h2 style={{ margin: 0 }}>
                                {editingCourse ? '✏️ Edit Course' : '➕ Add New Course'}
                            </h2>
                            <button onClick={() => setShowModal(false)} style={{
                                background: 'none', border: 'none',
                                fontSize: '1.5rem', cursor: 'pointer'
                            }}>×</button>
                        </div>

                        {formError && (
                            <div style={{
                                background: '#FEE2E2', color: '#DC2626',
                                padding: '0.75rem', borderRadius: '8px',
                                marginBottom: '1rem', fontSize: '0.9rem'
                            }}>
                                {formError}
                            </div>
                        )}

                        <form onSubmit={handleSave}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={labelStyle}>Title <span style={{ color: 'red' }}>*</span></label>
                                    <input type="text" placeholder="Course title"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        style={inputStyle} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Description</label>
                                    <textarea placeholder="Course description"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Instructor <span style={{ color: 'red' }}>*</span></label>
                                    <input type="text" placeholder="Instructor name"
                                        value={formData.instructor}
                                        onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                                        style={inputStyle} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Category <span style={{ color: 'red' }}>*</span></label>
                                    <select value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        style={inputStyle}>
                                        <option value="">Select category</option>
                                        <option value="Python">Python</option>
                                        <option value="Java">Java</option>
                                        <option value="Web Dev">Web Dev</option>
                                        <option value="App Dev">App Dev</option>
                                        <option value="AI / ML">AI / ML</option>
                                        <option value="Design">Design</option>
                                    </select>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={labelStyle}>Price (₹) <span style={{ color: 'red' }}>*</span></label>
                                        <input type="number" placeholder="499"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                            style={inputStyle} />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Original Price (₹)</label>
                                        <input type="number" placeholder="1999"
                                            value={formData.originalPrice}
                                            onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                                            style={inputStyle} />
                                    </div>
                                </div>
                                <div>
                                    <label style={labelStyle}>Image URL</label>
                                    <input type="text" placeholder="https://..."
                                        value={formData.image}
                                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                        style={inputStyle} />
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                    <button type="button" onClick={() => setShowModal(false)} style={{
                                        flex: 1, padding: '0.85rem',
                                        border: '2px solid #E5E7EB', borderRadius: '8px',
                                        background: 'white', cursor: 'pointer',
                                        fontWeight: '600', fontSize: '0.95rem'
                                    }}>Cancel</button>
                                    <button type="submit" disabled={saving} style={{
                                        flex: 1, padding: '0.85rem',
                                        background: saving ? '#9CA3AF' : '#4F46E5',
                                        color: 'white', border: 'none', borderRadius: '8px',
                                        cursor: saving ? 'not-allowed' : 'pointer',
                                        fontWeight: '600', fontSize: '0.95rem'
                                    }}>
                                        {saving ? 'Saving...' : editingCourse ? 'Update Course' : 'Add Course'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>a
                </div>
            )}
        </div>
    );
};

export default AdminCourses;