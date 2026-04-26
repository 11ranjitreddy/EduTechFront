import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './LiveClasses.css';

import { LIVECLASS_URL } from '../config/api';

const LiveClasses = () => {
    const { isAuthenticated } = useAuth();
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            const res = await fetch(`${LIVECLASS_URL}/upcoming`);
            const data = await res.json();
            setClasses(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to load live classes:', err);
        } finally {
            setLoading(false);
        }
    };

    const getTimeUntil = (scheduledAt) => {
        const now = new Date();
        const scheduled = new Date(scheduledAt);
        const diff = scheduled - now;

        if (diff < 0) return 'Started';
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) return `In ${days} day${days > 1 ? 's' : ''}`;
        if (hours > 0) return `In ${hours}h ${mins}m`;
        return `In ${mins} minutes`;
    };

    const formatDateTime = (dt) => {
        return new Date(dt).toLocaleString('en-IN', {
            weekday: 'long', day: '2-digit',
            month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const isLive = (cls) => cls.status === 'LIVE';
    const isStartingSoon = (cls) => {
        const diff = new Date(cls.scheduledAt) - new Date();
        return diff > 0 && diff < 30 * 60 * 1000; // within 30 mins
    };

    const filteredClasses = classes.filter(cls => {
        if (filter === 'LIVE') return isLive(cls);
        if (filter === 'SOON') return isStartingSoon(cls);
        return true;
    });

    if (loading) return (
        <div style={{ textAlign: 'center', padding: '5rem' }}>
            Loading live classes...
        </div>
    );

    return (
        <div className="live-classes-page">
            <div className="container">
                {/* Header */}
                <div className="live-header">
                    <div>
                        <h1 className="live-title">
                            🎥 Live Classes
                        </h1>
                        <p className="live-subtitle">
                            Join interactive live sessions with expert instructors
                        </p>
                    </div>
                    {/* Live indicator */}
                    {classes.some(c => c.status === 'LIVE') && (
                        <div className="live-indicator">
                            <span className="live-dot" />
                            Live Now Available!
                        </div>
                    )}
                </div>

                {/* Filters */}
                <div className="live-filters">
                    {['ALL', 'LIVE', 'SOON'].map(f => (
                        <button
                            key={f}
                            className={`live-filter-btn ${filter === f ? 'active' : ''}`}
                            onClick={() => setFilter(f)}
                        >
                            {f === 'ALL' && '📋 All Classes'}
                            {f === 'LIVE' && '🔴 Live Now'}
                            {f === 'SOON' && '⏰ Starting Soon'}
                        </button>
                    ))}
                </div>

                {/* Classes Grid */}
                {filteredClasses.length === 0 ? (
                    <div className="live-empty">
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📅</div>
                        <h2>No live classes available</h2>
                        <p>Check back later for upcoming sessions</p>
                    </div>
                ) : (
                    <div className="live-grid">
                        {filteredClasses.map(cls => (
                            <div
                                key={cls.id}
                                className={`live-card ${isLive(cls) ? 'live-active' : ''} 
                                    ${isStartingSoon(cls) ? 'live-soon' : ''}`}
                            >
                                {/* Status badge */}
                                <div className="live-card-badge">
                                    {isLive(cls) ? (
                                        <span className="badge-live">
                                            <span className="badge-dot" /> LIVE
                                        </span>
                                    ) : isStartingSoon(cls) ? (
                                        <span className="badge-soon">
                                            ⏰ Starting Soon
                                        </span>
                                    ) : (
                                        <span className="badge-upcoming">
                                            📅 Upcoming
                                        </span>
                                    )}
                                </div>

                                {/* Card Content */}
                                <div className="live-card-content">
                                    <h3 className="live-card-title">{cls.title}</h3>
                                    {cls.description && (
                                        <p className="live-card-desc">{cls.description}</p>
                                    )}

                                    <div className="live-card-meta">
                                        {cls.instructor && (
                                            <div className="live-meta-item">
                                                <span>👤</span>
                                                <span>{cls.instructor}</span>
                                            </div>
                                        )}
                                        <div className="live-meta-item">
                                            <span>📅</span>
                                            <span>{formatDateTime(cls.scheduledAt)}</span>
                                        </div>
                                        <div className="live-meta-item countdown">
                                            <span>⏱</span>
                                            <span>{getTimeUntil(cls.scheduledAt)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Join Button - FIXED: Added missing <a> tags */}
                                <div className="live-card-footer">
                                    {isAuthenticated ? (
                                        <a
                                            href={cls.meetLink}
                                            target="_blank"
                                            rel="noreferrer"
                                            className={`btn-join ${isLive(cls) ? 'btn-join-live' : 'btn-join-upcoming'}`}
                                        >
                                            {isLive(cls) ? '🔴 Join Now' : '🔗 Get Link'}
                                        </a>
                                    ) : (
                                        <a
                                            href="/login"
                                            className="btn-join btn-join-upcoming"
                                        >
                                            Login to Join
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LiveClasses;