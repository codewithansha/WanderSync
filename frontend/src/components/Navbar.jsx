import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, Sparkles, User, LogOut, Bookmark, Compass, LayoutDashboard, Home } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  const isActive = (path) => location.pathname === path;
  const close = () => setIsOpen(false);

  const handleLogout = async () => {
    close();
    await logout();
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const initials = (user?.name || 'U')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const hasPhoto = Boolean(user?.profile_image && !imageError);

  return (
    <header className={`site-header-floating ${isScrolled ? 'is-scrolled' : ''}`}>
      <div className="container nav-floating-inner">
        {/* Brand Logo */}
        <Link to="/" className="brand-logo-luxury" aria-label="WanderSync Home" onClick={close}>
          <div className="brand-logo-emblem">
            <img src="/images/logo.png" alt="WanderSync Emblem" className="brand-logo-img" />
          </div>
          <div className="brand-logo-text-wrap">
            <img src="/images/logotext.png" alt="WanderSync" className="brand-logotext-img" />
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="desktop-nav-cluster">
          <ul className="nav-pill-list">
            <li>
              <Link to="/" className={`nav-pill-link ${isActive('/') ? 'is-active' : ''}`}>
                <Home size={14} className="nav-pill-icon" />
                <span>Home</span>
              </Link>
            </li>
            <li>
              <Link to="/explore" className={`nav-pill-link ${isActive('/explore') ? 'is-active' : ''}`}>
                <Compass size={14} className="nav-pill-icon" />
                <span>Explore</span>
              </Link>
            </li>
            {isAuthenticated && (
              <>
                <li>
                  <Link to="/saved-trips" className={`nav-pill-link ${isActive('/saved-trips') ? 'is-active' : ''}`}>
                    <Bookmark size={14} className="nav-pill-icon" />
                    <span>Saved Trips</span>
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard" className={`nav-pill-link ${isActive('/dashboard') ? 'is-active' : ''}`}>
                    <LayoutDashboard size={14} className="nav-pill-icon" />
                    <span>Dashboard</span>
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>

        {/* Right Actions Cluster */}
        <div className="nav-right-actions">
          {isAuthenticated ? (
            <div className="nav-auth-user-row">
              <Link to="/profile" className="nav-user-profile-pill" title="View Profile">
                <div className="nav-avatar-ring">
                  {hasPhoto ? (
                    <img 
                      src={user.profile_image} 
                      alt={user.name} 
                      className="nav-avatar-photo"
                      onError={() => setImageError(true)} 
                    />
                  ) : (
                    <span className="nav-avatar-initials">{initials}</span>
                  )}
                  <span className="nav-online-status" />
                </div>
                <span className="nav-user-first-name">
                  {user?.name?.split(' ')[0] || 'Profile'}
                </span>
              </Link>

              <Link to="/planner" className="btn btn-nav-plan">
                <Sparkles size={14} className="nav-plan-spark" />
                <span>Plan</span>
              </Link>
            </div>
          ) : (
            <div className="nav-guest-actions">
              <Link to="/login" className="btn btn-nav-signin">
                Sign In
              </Link>
              <Link to="/planner" className="btn btn-nav-plan">
                <Sparkles size={14} className="nav-plan-spark" />
                <span>Plan Journey</span>
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button 
            className="mobile-nav-toggle" 
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle navigation menu" 
            aria-expanded={isOpen}
          >
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {isOpen && (
        <div className="mobile-drawer-overlay" onClick={close}>
          <div className="mobile-drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-drawer-header">
              <div className="brand-logo-luxury">
                <div className="brand-logo-emblem">
                  <img src="/images/logo.png" alt="WanderSync" className="brand-logo-img" />
                </div>
                <span className="brand-name-main">Wander<span className="brand-name-accent">Sync</span></span>
              </div>
              <button className="mobile-drawer-close" onClick={close} aria-label="Close menu">
                <X size={20} />
              </button>
            </div>

            <ul className="mobile-drawer-links">
              <li>
                <Link to="/" className={`mobile-nav-item ${isActive('/') ? 'is-active' : ''}`} onClick={close}>
                  <Home size={18} />
                  <span>Home</span>
                </Link>
              </li>
              <li>
                <Link to="/explore" className={`mobile-nav-item ${isActive('/explore') ? 'is-active' : ''}`} onClick={close}>
                  <Compass size={18} />
                  <span>Explore Destinations</span>
                </Link>
              </li>
              {isAuthenticated && (
                <>
                  <li>
                    <Link to="/saved-trips" className={`mobile-nav-item ${isActive('/saved-trips') ? 'is-active' : ''}`} onClick={close}>
                      <Bookmark size={18} />
                      <span>Saved Trips</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/dashboard" className={`mobile-nav-item ${isActive('/dashboard') ? 'is-active' : ''}`} onClick={close}>
                      <LayoutDashboard size={18} />
                      <span>Dashboard</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/profile" className={`mobile-nav-item ${isActive('/profile') ? 'is-active' : ''}`} onClick={close}>
                      <User size={18} />
                      <span>My Profile</span>
                    </Link>
                  </li>
                </>
              )}
            </ul>

            <div className="mobile-drawer-footer">
              {isAuthenticated ? (
                <>
                  <Link to="/planner" className="btn btn-hero-primary btn-full" onClick={close}>
                    <Sparkles size={16} />
                    <span>Plan New Journey</span>
                  </Link>
                  <button onClick={handleLogout} className="btn btn-outline btn-full mobile-signout-btn">
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn btn-outline btn-full" onClick={close}>
                    Sign In
                  </Link>
                  <Link to="/planner" className="btn btn-hero-primary btn-full" onClick={close}>
                    <Sparkles size={16} />
                    <span>Plan My Journey</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

