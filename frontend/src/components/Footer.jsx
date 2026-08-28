import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowUp, MapPin, Phone, Mail, Home, Sparkles, Luggage, 
  Compass, CreditCard, CloudSun, MessageSquare, Bookmark, 
  User, HelpCircle, ExternalLink 
} from 'lucide-react';

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="footer-cinematic-master">
      {/* Full Footer Neon Skyline Background Layer */}
      <div className="footer-neon-bg-layer" aria-hidden="true">
        <img 
          src="/images/neon-skyline.png" 
          alt="Neon Skyline World Background" 
          className="footer-neon-bg-image" 
          loading="lazy" 
        />
        <div className="footer-neon-bg-overlay" />
      </div>

      {/* Atmospheric Ambient Glow Orbs */}
      <div className="footer-atmospheric-glows" aria-hidden="true">
        <div className="glow-orb orb-purple" />
        <div className="glow-orb orb-blue" />
        <div className="glow-orb orb-cyan" />
      </div>

      {/* 1. Back to Top Bar */}
      <div 
        className="footer-cinematic-top-bar" 
        onClick={scrollToTop} 
        role="button" 
        tabIndex={0} 
        aria-label="Back to Top"
      >
        <span className="top-bar-text">Back to Top</span>
        <ArrowUp size={16} className="top-bar-icon" />
      </div>

      {/* 2. Main Footer Body */}
      <div className="container footer-cinematic-body">
        
        {/* Contact Information Cards (Horizontal) */}
        <div className="footer-contact-glass-row">
          <div className="footer-contact-glass-card">
            <div className="contact-glass-sphere sphere-purple">
              <MapPin size={20} />
            </div>
            <div className="contact-glass-info">
              <h4>Find Us</h4>
              <p>D.H.A. Phase 8 Karachi, Sindh 75500, Pakistan</p>
            </div>
          </div>

          <div className="footer-contact-glass-card">
            <div className="contact-glass-sphere sphere-blue">
              <Phone size={20} />
            </div>
            <div className="contact-glass-info">
              <h4>Call Us</h4>
              <p>+92 123 4567890 • +1 (800) WANDER-AI</p>
            </div>
          </div>

          <div className="footer-contact-glass-card">
            <div className="contact-glass-sphere sphere-cyan">
              <Mail size={20} />
            </div>
            <div className="contact-glass-info">
              <h4>Mail Us</h4>
              <p>wandersync@gmail.com • support@wandersync.ai</p>
            </div>
          </div>
        </div>

        <div className="footer-cinematic-divider" />

        {/* 3. 4-Column Main Grid */}
        <div className="footer-cinematic-grid">
          
          {/* Column 1: WanderSync Brand */}
          <div className="footer-col-branding">
            <div className="footer-brand-emblem-glow">
              <img src="/images/logo.png" alt="WanderSync" className="footer-brand-logo-img" />
            </div>
            <h3 className="footer-brand-heading">
              Wander<span className="brand-gradient-text">Sync</span>
            </h3>
            <p className="footer-brand-tagline">
              AI-powered travel planner that creates personalized itineraries for unforgettable journeys.
            </p>
            <div className="footer-brand-accent-line" />
          </div>

          {/* Column 2: Useful Links (Dual Columns) */}
          <div className="footer-col-useful-links">
            <h4 className="footer-column-title">
              Useful Links
              <span className="title-cyan-accent" />
            </h4>
            <div className="footer-links-dual-grid">
              <ul className="footer-links-column-list">
                <li>
                  <Link to="/" className="cinematic-nav-link">
                    <Home size={15} className="link-icon" /> <span>Home</span>
                  </Link>
                </li>
                <li>
                  <Link to="/planner" className="cinematic-nav-link">
                    <Sparkles size={15} className="link-icon" /> <span>AI Planner</span>
                  </Link>
                </li>
                <li>
                  <Link to="/saved-trips" className="cinematic-nav-link">
                    <Luggage size={15} className="link-icon" /> <span>My Trips</span>
                  </Link>
                </li>
                <li>
                  <Link to="/explore" className="cinematic-nav-link">
                    <Compass size={15} className="link-icon" /> <span>Explore Destinations</span>
                  </Link>
                </li>
                <li>
                  <Link to="/trips/tokyo-cultural-2026/budget" className="cinematic-nav-link">
                    <CreditCard size={15} className="link-icon" /> <span>Budget Planner</span>
                  </Link>
                </li>
              </ul>

              <ul className="footer-links-column-list">
                <li>
                  <Link to="/trips/tokyo-cultural-2026/weather" className="cinematic-nav-link">
                    <CloudSun size={15} className="link-icon" /> <span>Weather Alerts</span>
                  </Link>
                </li>
                <li>
                  <Link to="/trips/tokyo-cultural-2026/assistant" className="cinematic-nav-link">
                    <MessageSquare size={15} className="link-icon" /> <span>AI Assistant</span>
                  </Link>
                </li>
                <li>
                  <Link to="/saved-trips" className="cinematic-nav-link">
                    <Bookmark size={15} className="link-icon" /> <span>Saved Trips</span>
                  </Link>
                </li>
                <li>
                  <Link to="/profile" className="cinematic-nav-link">
                    <User size={15} className="link-icon" /> <span>Profile & Settings</span>
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard" className="cinematic-nav-link">
                    <HelpCircle size={15} className="link-icon" /> <span>Help & Support</span>
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Column 3: Follow Us */}
          <div className="footer-col-socials">
            <h4 className="footer-column-title">
              Follow Us
              <span className="title-cyan-accent" />
            </h4>
            <div className="footer-social-glass-grid">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-glass-btn btn-facebook" aria-label="Facebook">
                <svg width="17" height="17" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.891h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-glass-btn btn-twitter" aria-label="Twitter / X">
                <svg width="17" height="17" fill="currentColor" viewBox="0 0 24 24"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-glass-btn btn-instagram" aria-label="Instagram">
                <svg width="17" height="17" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-glass-btn btn-twitter" aria-label="Twitter / X">
                <svg width="17" height="17" fill="currentColor" viewBox="0 0 24 24"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-glass-btn btn-instagram" aria-label="Instagram">
                <svg width="17" height="17" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="social-glass-btn btn-youtube" aria-label="YouTube">
                <svg width="17" height="17" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
              <a href="https://whatsapp.com" target="_blank" rel="noopener noreferrer" className="social-glass-btn btn-whatsapp" aria-label="WhatsApp">
                <svg width="17" height="17" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.972.582 1.942.879 2.796.879 3.182 0 5.767-2.586 5.768-5.766.001-3.18-2.585-5.766-5.768-5.766zm9.969 5.768c0 5.518-4.482 10-10 10-1.748 0-3.385-.45-4.819-1.238l-7.181 1.883 1.916-6.993c-.886-1.488-1.398-3.232-1.398-5.094 0-5.518 4.482-10 10-10 5.518 0 10 4.482 10 10z"/></svg>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="social-glass-btn btn-linkedin" aria-label="LinkedIn">
                <svg width="17" height="17" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
              </a>
            </div>
          </div>

          {/* Column 4: Our Location (Glass Blueprint Card) */}
          <div className="footer-col-location">
            <h4 className="footer-column-title">
              Our Location
              <span className="title-cyan-accent" />
            </h4>
            <div className="footer-glass-map-card">
              <div className="glass-map-header">
                <span className="glass-map-city">D.H.A. Phase 8</span>
                <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="glass-map-cta-btn">
                  View on Maps <ExternalLink size={11} style={{ display: 'inline', marginLeft: 3 }} />
                </a>
              </div>
              <div className="glass-map-radar-body">
                <div className="radar-pulse-beacon">
                  <MapPin size={22} className="radar-pin-icon" />
                </div>
                <div className="radar-hq-badge">
                  <span>WanderSync HQ</span>
                </div>
              </div>
              <div className="glass-map-footer-meta">
                <span>Google</span>
                <span>Map data ©2026</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 4. Bottom Copyright Bar */}
      <div className="footer-cinematic-copyright-bar">
        <p>&copy; 2026 WanderSync Inc. All rights reserved.</p>
      </div>
    </footer>
  );
}





