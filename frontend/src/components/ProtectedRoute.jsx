import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Shield, UserPlus, LogIn, Sparkles } from 'lucide-react';

export default function ProtectedRoute({ children, featureName = 'this feature' }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '6rem 0' }}>
        <div className="spinner-pulse" style={{ margin: '0 auto 1.5rem' }}></div>
        <p style={{ color: 'var(--text-muted)' }}>Verifying your workspace...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return children;
  }

  // Polite Guest Login Guard Card
  return (
    <div className="container-narrow" style={{ maxWidth: '540px', margin: '3rem auto' }}>
      <div className="card" style={{ padding: '3rem 2rem', textAlign: 'center', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: '#EFF6FF',
          color: 'var(--primary-blue)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
          boxShadow: '0 4px 12px rgba(11, 94, 215, 0.15)'
        }}>
          <Lock size={30} />
        </div>

        <h2 style={{ fontSize: '1.75rem', color: 'var(--dark-navy)', marginBottom: '0.75rem', fontWeight: 800 }}>
          Account Required
        </h2>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.98rem', lineHeight: 1.6, marginBottom: '2rem' }}>
          Please sign in or create a free account to access {featureName}, your travel history, and persistent journeys.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
            className="btn btn-primary btn-lg"
            style={{ flex: 1, minWidth: '160px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <LogIn size={18} /> Sign In
          </Link>

          <Link
            to={`/register?redirect=${encodeURIComponent(location.pathname)}`}
            className="btn btn-outline btn-lg"
            style={{ flex: 1, minWidth: '160px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <UserPlus size={18} /> Create Account
          </Link>
        </div>

        <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Looking to plan a new trip right away?{' '}
          <Link to="/planner" style={{ color: 'var(--primary-blue)', fontWeight: 700 }}>
            Use the Guest Planner with zero login →
          </Link>
        </div>
      </div>
    </div>
  );
}
