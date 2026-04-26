import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './Navbar.css';

const Navbar = () => {
  const { cartCount } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  const getUserInitials = () => {
    if (!user?.name) return 'U';
    return user.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
        navigate(`/courses?search=${encodeURIComponent(searchQuery)}`);
        setIsSearchOpen(false);
        setSearchQuery('');
    }
};

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">

        {/* LEFT - LOGO */}
        <Link to="/" className="navbar-logo">
          EdTech<span className="dot">.</span>
        </Link>

        {/* SEARCH BAR - Desktop */}
        <form onSubmit={handleSearch} className="navbar-search">
          <button type="submit" className="search-btn">🔍</button>
          <input
            type="text"
            className="search-input"
            placeholder="Search courses, tutorials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

        {/* RIGHT SIDE */}
        <div className="navbar-right">

          {/* LINKS */}
          <div className="navbar-links">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/courses" className="nav-link">Courses</Link>
            
            {/* LIVE CLASS - HIGHLIGHTED */}
            <Link to="/live-classes" className="nav-link live-class-link">
              Live Class
              <span className="live-badge">LIVE</span>
              <span className="live-dot"></span>
            </Link>
            
            <Link to="/contact" className="nav-link">Contact</Link>
          </div>

          {/* AUTH + CART */}
          <div className="navbar-auth">

            {/* Mobile Search Toggle */}
            <button 
              className="mobile-search-toggle"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              🔍
            </button>

            <Link to="/cart" className="cart-icon">
              🛒
              {cartCount > 0 && (
                <span className="cart-badge">{cartCount}</span>
              )}
            </Link>

            {isAuthenticated ? (
              <div className="profile-container" ref={dropdownRef}>
                <div 
                  className="profile-trigger"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <div className="profile-avatar">
                    {getUserInitials()}
                  </div>
                  <span className="user-name">{user?.name}</span>
                  <span className={`chevron-icon ${isDropdownOpen ? 'rotated' : ''}`}>
                    ▼
                  </span>
                </div>

                {/* PROFILE DROPDOWN - ONLY PROFILE & LOGOUT */}
                <div className={`profile-dropdown ${isDropdownOpen ? 'open' : ''}`}>
                  <div className="dropdown-header">
                    <strong>{user?.name}</strong>
                    <div className="dropdown-email">{user?.email}</div>
                  </div>
                  
                  <button 
                    className="dropdown-item"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      navigate('/profile');
                    }}
                  >
                    <span className="dropdown-icon">👤</span>
                    My Profile
                  </button>
                  
                  <div className="dropdown-divider"></div>
                  
                  <button 
                    className="dropdown-item logout-item"
                    onClick={handleLogout}
                  >
                    <span className="dropdown-icon">🚪</span>
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <button className="btn-primary" onClick={() => navigate('/login')}>
                Login
              </button>
            )}

          </div>

        </div>
      </div>

      {/* Mobile Search Bar */}
      {isSearchOpen && (
        <form onSubmit={handleSearch} className="mobile-search">
          <input
            type="text"
            className="mobile-search-input"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          <button type="submit" className="mobile-search-btn">Search</button>
        </form>
      )}
    </nav>
  );
};

export default Navbar;