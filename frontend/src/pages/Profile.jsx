import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile, uploadProfilePhoto, removeProfilePhoto } from '../services/api';
import {
  User, Mail, Globe, Bell, Shield, LogOut, Camera, Check,
  Calendar, Trash2, Upload, AlertCircle, Sparkles, MapPin,
  CreditCard, Compass, Lock, ChevronRight, CheckCircle2
} from 'lucide-react';

const TABS = [
  { id: 'profile', label: 'Profile & Identity', icon: <User size={16} />, desc: 'Personal details & avatar' },
  { id: 'preferences', label: 'Travel Preferences', icon: <Compass size={16} />, desc: 'AI style & currency' },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={16} />, desc: 'Alerts & updates' },
  { id: 'security', label: 'Security & Session', icon: <Shield size={16} />, desc: 'Password & session' },
];

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

export default function Profile() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('profile');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState(null);
  const [imageLoadError, setImageLoadError] = useState(false);

  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    location: '',
    bio: '',
    preferred_currency: 'PKR',
    travel_style: 'Balanced'
  });

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        location: user.location || '',
        bio: user.bio || '',
        preferred_currency: user.preferred_currency || 'PKR',
        travel_style: user.travel_style || 'Balanced'
      });
      setImageLoadError(false);
    }
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updateUserProfile({
        name: form.name,
        location: form.location,
        bio: form.bio,
        preferred_currency: form.preferred_currency,
        travel_style: form.travel_style,
      });
      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError(null);
    const ext = file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setAvatarError('Invalid image format. Allowed formats: JPG, PNG, WEBP.');
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setAvatarError(`Image must be 5MB or smaller (${(file.size / (1024 * 1024)).toFixed(1)}MB selected).`);
      return;
    }
    setAvatarUploading(true);
    try {
      await uploadProfilePhoto(file);
      await refreshUser();
      setImageLoadError(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setAvatarError(err.message || 'Failed to upload photo.');
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePhotoRemove = async () => {
    if (!window.confirm('Are you sure you want to remove your profile photo?')) return;
    setAvatarUploading(true);
    setAvatarError(null);
    try {
      await removeProfilePhoto();
      await refreshUser();
      setImageLoadError(false);
    } catch (err) {
      setAvatarError(err.message || 'Failed to remove photo.');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const initials = (form.name || user?.name || 'T')
    .split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2) || 'T';

  const hasPhoto = Boolean(user?.profile_image && !imageLoadError);

  return (
    <div className="profile-page-wrapper">
      {/* Background Decorative Mesh Orbs */}
      <div className="profile-ambient-mesh" aria-hidden="true">
        <div className="profile-mesh-orb profile-orb-blue" />
        <div className="profile-mesh-orb profile-orb-purple" />
      </div>

      <div className="container profile-page-container">

        {/* Page Header */}
        <div className="profile-page-header">
          <div className="profile-header-badge">
            <Sparkles size={13} className="badge-sparkle-icon" />
            <span>ACCOUNT & TRAVEL IDENTITY</span>
          </div>
          <h1 className="profile-header-title">Profile & Settings</h1>
          <p className="profile-header-subtitle">
            Manage your WanderSync account, personalized AI preferences, and travel identity.
          </p>
        </div>

        <div className="profile-main-layout">

          {/* ── Left Sidebar ── */}
          <aside className="profile-sidebar-card">
            {/* Avatar & User Summary */}
            <div className="profile-avatar-block">
              <div className="profile-avatar-ring-wrap" onClick={() => fileInputRef.current?.click()} title="Click to change profile photo">
                <div className="profile-avatar-circle">
                  {hasPhoto ? (
                    <img
                      src={user.profile_image}
                      alt={user.name}
                      className="profile-avatar-img"
                      onError={() => setImageLoadError(true)}
                    />
                  ) : (
                    <span className="profile-avatar-initials">{initials}</span>
                  )}
                  {/* Camera Hover Overlay */}
                  <div className="profile-avatar-hover-overlay">
                    <Camera size={22} />
                    <span>Edit</span>
                  </div>
                </div>
                {/* Active Online Indicator */}
                <span className="profile-online-badge" />
              </div>

              <h2 className="profile-sidebar-name">{form.name || user?.name || 'Traveler'}</h2>
              <div className="profile-sidebar-email">
                <Mail size={13} />
                <span>{user?.email || 'user@wandersync.ai'}</span>
              </div>

              <div className="profile-voyager-chip">
                <Sparkles size={12} color="#0068FF" />
                <span>Verified Voyager</span>
              </div>

              {user?.created_at && (
                <div className="profile-member-date">
                  <Calendar size={12} />
                  <span>Joined {new Date(user.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/jpg"
              style={{ display: 'none' }}
              onChange={handlePhotoSelect}
            />

            {/* Sidebar Tab Navigation */}
            <nav className="profile-nav-menu" aria-label="Profile Sections">
              {TABS.map(tab => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    className={`profile-nav-btn ${isActive ? 'is-active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                    type="button"
                  >
                    <div className="nav-btn-icon-sphere">
                      {tab.icon}
                    </div>
                    <div className="nav-btn-text-block">
                      <span className="nav-btn-label">{tab.label}</span>
                      <span className="nav-btn-desc">{tab.desc}</span>
                    </div>
                    <ChevronRight size={14} className="nav-btn-chevron" />
                  </button>
                );
              })}

              <div className="profile-nav-divider" />

              <button
                onClick={handleLogout}
                className="profile-signout-btn"
                type="button"
              >
                <div className="signout-icon-sphere">
                  <LogOut size={15} />
                </div>
                <span>Sign Out</span>
              </button>
            </nav>
          </aside>

          {/* ── Right Content Panel ── */}
          <main className="profile-content-panel">

            {/* Alerts */}
            {error && (
              <div className="profile-alert-banner alert-danger">
                <AlertCircle size={17} className="alert-icon" />
                <span>{error}</span>
              </div>
            )}
            {avatarError && (
              <div className="profile-alert-banner alert-danger">
                <AlertCircle size={17} className="alert-icon" />
                <span>{avatarError}</span>
              </div>
            )}
            {saved && (
              <div className="profile-alert-banner alert-success">
                <CheckCircle2 size={17} className="alert-icon" />
                <span>Changes saved successfully to your WanderSync profile!</span>
              </div>
            )}

            {/* ── TAB 1: Profile & Identity ── */}
            {activeTab === 'profile' && (
              <div className="profile-tab-content">
                <div className="profile-section-heading-wrap">
                  <h2 className="profile-section-title">Profile & Identity</h2>
                  <p className="profile-section-subtitle">
                    Customize your public traveler profile and personal information.
                  </p>
                </div>

                {/* Photo Upload Box */}
                <div className="profile-photo-banner-card">
                  <div className="photo-banner-avatar-preview">
                    {hasPhoto ? (
                      <img
                        src={user.profile_image}
                        alt={user.name}
                        className="banner-avatar-img"
                        onError={() => setImageLoadError(true)}
                      />
                    ) : (
                      <span className="banner-avatar-initials">{initials}</span>
                    )}
                  </div>
                  <div className="photo-banner-details">
                    <div className="photo-banner-title">Profile Photo</div>
                    <div className="photo-banner-meta">JPG, PNG or WEBP • Maximum 5MB file size</div>
                    <div className="photo-banner-actions">
                      <button
                        type="button"
                        disabled={avatarUploading}
                        className="btn-photo-upload"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload size={14} />
                        <span>{avatarUploading ? 'Uploading...' : hasPhoto ? 'Change Photo' : 'Upload Photo'}</span>
                      </button>
                      {hasPhoto && (
                        <button
                          type="button"
                          disabled={avatarUploading}
                          className="btn-photo-remove"
                          onClick={handlePhotoRemove}
                        >
                          <Trash2 size={14} />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <form onSubmit={handleSave} className="profile-form-grid">
                  <div className="form-fields-2col">
                    <div className="profile-form-group">
                      <label htmlFor="prof-name" className="profile-input-label">
                        Full Name
                      </label>
                      <div className="profile-input-wrapper">
                        <User size={16} className="input-affix-icon" />
                        <input
                          id="prof-name"
                          type="text"
                          className="profile-text-input"
                          value={form.name}
                          onChange={e => setForm({ ...form, name: e.target.value })}
                          required
                          placeholder="Your full name"
                        />
                      </div>
                    </div>

                    <div className="profile-form-group">
                      <label htmlFor="prof-email" className="profile-input-label">
                        Email Address <span className="label-badge-readonly">Read-only</span>
                      </label>
                      <div className="profile-input-wrapper is-disabled">
                        <Lock size={15} className="input-affix-icon" />
                        <input
                          id="prof-email"
                          type="email"
                          className="profile-text-input"
                          value={form.email}
                          disabled
                        />
                      </div>
                    </div>

                    <div className="profile-form-group">
                      <label htmlFor="prof-location" className="profile-input-label">
                        Location / Origin
                      </label>
                      <div className="profile-input-wrapper">
                        <MapPin size={16} className="input-affix-icon" />
                        <input
                          id="prof-location"
                          type="text"
                          placeholder="e.g. Karachi, Pakistan"
                          className="profile-text-input"
                          value={form.location}
                          onChange={e => setForm({ ...form, location: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="profile-form-group">
                      <label htmlFor="prof-currency" className="profile-input-label">
                        Preferred Currency
                      </label>
                      <div className="profile-input-wrapper">
                        <CreditCard size={16} className="input-affix-icon" />
                        <select
                          id="prof-currency"
                          className="profile-select-input"
                          value={form.preferred_currency}
                          onChange={e => setForm({ ...form, preferred_currency: e.target.value })}
                        >
                          <option value="PKR">PKR — Pakistani Rupee</option>
                          <option value="USD">USD — US Dollar</option>
                          <option value="EUR">EUR — Euro</option>
                          <option value="GBP">GBP — British Pound</option>
                          <option value="AED">AED — UAE Dirham</option>
                          <option value="SAR">SAR — Saudi Riyal</option>
                          <option value="JPY">JPY — Japanese Yen</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="profile-form-group full-width-group">
                    <label htmlFor="prof-bio" className="profile-input-label">
                      Traveler Bio
                    </label>
                    <textarea
                      id="prof-bio"
                      placeholder="Tell us about your favorite travel destinations or travel style..."
                      className="profile-textarea-input"
                      value={form.bio}
                      onChange={e => setForm({ ...form, bio: e.target.value })}
                      rows={2}
                    />
                  </div>

                  <div className="profile-form-footer">
                    <button
                      type="submit"
                      disabled={saving}
                      className="profile-save-btn"
                    >
                      {saved ? (
                        <><Check size={16} /> Saved!</>
                      ) : saving ? (
                        <><span className="btn-spinner" /> Saving...</>
                      ) : (
                        <><Sparkles size={16} /> Save Changes</>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ── TAB 2: Travel Preferences ── */}
            {activeTab === 'preferences' && (
              <div className="profile-tab-content">
                <div className="profile-section-heading-wrap">
                  <h2 className="profile-section-title">Travel Preferences</h2>
                  <p className="profile-section-subtitle">
                    These settings guide the WanderSync AI engine when tailoring itineraries, budgets, and recommendations.
                  </p>
                </div>

                <form onSubmit={handleSave} className="profile-form-grid">
                  <div className="form-fields-2col">
                    <div className="profile-form-group">
                      <label className="profile-input-label">Default Travel Style</label>
                      <div className="profile-input-wrapper">
                        <Compass size={16} className="input-affix-icon" />
                        <select
                          className="profile-select-input"
                          value={form.travel_style}
                          onChange={e => setForm({ ...form, travel_style: e.target.value })}
                        >
                          <option value="Budget">Budget — Cost-Effective & Hostels</option>
                          <option value="Balanced">Balanced — Comfort & Smart Spending</option>
                          <option value="Premium">Premium — High-End & Boutique Hotels</option>
                          <option value="Luxury">Luxury — 5-Star & First-Class</option>
                        </select>
                      </div>
                    </div>

                    <div className="profile-form-group">
                      <label className="profile-input-label">Preferred Currency</label>
                      <div className="profile-input-wrapper">
                        <CreditCard size={16} className="input-affix-icon" />
                        <select
                          className="profile-select-input"
                          value={form.preferred_currency}
                          onChange={e => setForm({ ...form, preferred_currency: e.target.value })}
                        >
                          <option value="PKR">PKR — Pakistani Rupee</option>
                          <option value="USD">USD — US Dollar</option>
                          <option value="EUR">EUR — Euro</option>
                          <option value="GBP">GBP — British Pound</option>
                          <option value="AED">AED — UAE Dirham</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="preference-feature-box">
                    <div className="feature-box-icon">
                      <Sparkles size={20} color="#0068FF" />
                    </div>
                    <div className="feature-box-text">
                      <h4>AI Auto-Optimization</h4>
                      <p>WanderSync uses your selected travel style to dynamically balance activity pace, dining choices, and hotel recommendations.</p>
                    </div>
                  </div>

                  <div className="profile-form-footer">
                    <button type="submit" disabled={saving} className="profile-save-btn">
                      {saved ? <><Check size={16} /> Saved!</> : <><Sparkles size={16} /> Save Preferences</>}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ── TAB 3: Notifications ── */}
            {activeTab === 'notifications' && (
              <div className="profile-tab-content">
                <div className="profile-section-heading-wrap">
                  <h2 className="profile-section-title">Notification Preferences</h2>
                  <p className="profile-section-subtitle">
                    Control how and when you receive travel alerts and schedule reminders.
                  </p>
                </div>

                <div className="notifications-settings-list">
                  <div className="notification-item-card">
                    <div className="notif-item-left">
                      <div className="notif-icon-sphere sphere-blue">
                        <Bell size={18} />
                      </div>
                      <div>
                        <h4>Itinerary Schedule Alerts</h4>
                        <p>Receive live notifications for upcoming activities and transit schedules.</p>
                      </div>
                    </div>
                    <span className="badge badge-green">Enabled</span>
                  </div>

                  <div className="notification-item-card">
                    <div className="notif-item-left">
                      <div className="notif-icon-sphere sphere-purple">
                        <CreditCard size={18} />
                      </div>
                      <div>
                        <h4>Budget & Expense Thresholds</h4>
                        <p>Get notified when expenses approach your set daily or total budget limit.</p>
                      </div>
                    </div>
                    <span className="badge badge-green">Enabled</span>
                  </div>

                  <div className="notification-item-card">
                    <div className="notif-item-left">
                      <div className="notif-icon-sphere sphere-cyan">
                        <Globe size={18} />
                      </div>
                      <div>
                        <h4>Weather & Safety Radar</h4>
                        <p>Real-time updates for adverse weather conditions in your destination cities.</p>
                      </div>
                    </div>
                    <span className="badge badge-green">Enabled</span>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 4: Security ── */}
            {activeTab === 'security' && (
              <div className="profile-tab-content">
                <div className="profile-section-heading-wrap">
                  <h2 className="profile-section-title">Security & Session</h2>
                  <p className="profile-section-subtitle">
                    Manage your authenticated session and workspace security settings.
                  </p>
                </div>

                <div className="security-status-card">
                  <div className="security-header-row">
                    <div className="security-badge-group">
                      <div className="security-icon-circle">
                        <Shield size={20} color="#10B981" />
                      </div>
                      <div>
                        <h4>Active Secure Session</h4>
                        <p>Signed in as <strong style={{ color: 'var(--dark-navy)' }}>{user?.email}</strong></p>
                      </div>
                    </div>
                    <span className="badge badge-green">Protected</span>
                  </div>
                  <div className="security-info-footer">
                    <span>MongoDB Session Store • HttpOnly Cookie • SHA-256 Token Protection</span>
                  </div>
                </div>

                <div className="security-actions-wrap">
                  <button
                    onClick={handleLogout}
                    className="btn-danger-outline"
                    type="button"
                  >
                    <LogOut size={16} />
                    <span>Sign Out of WanderSync Everywhere</span>
                  </button>
                </div>
              </div>
            )}

          </main>

        </div>
      </div>
    </div>
  );
}

