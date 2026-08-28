import React, { useState, useEffect } from 'react';
import { validateItinerary } from '../services/api';
import { Shield, CheckCircle, AlertTriangle, XCircle, ChevronDown, ChevronUp, Loader } from 'lucide-react';

const LEVEL_COLORS = {
  Excellent: { bg: '#ECFDF5', border: '#A7F3D0', text: '#065F46', accent: '#10B981' },
  Good:      { bg: '#EFF6FF', border: '#BFDBFE', text: '#1E40AF', accent: '#3B82F6' },
  Fair:      { bg: '#FFFBEB', border: '#FCD34D', text: '#92400E', accent: '#D97706' },
  'Needs Review': { bg: '#FEF2F2', border: '#FECACA', text: '#991B1B', accent: '#EF4444' },
  Unavailable:   { bg: '#F8FAFC', border: '#E2E8F0', text: '#64748B', accent: '#94A3B8' },
};

const STATUS_ICONS = {
  passed:  { icon: CheckCircle, color: '#10B981' },
  warning: { icon: AlertTriangle, color: '#D97706' },
  failed:  { icon: XCircle, color: '#EF4444' },
};

export default function ItineraryConfidence({ validation, tripId }) {
  const [data, setData] = useState(validation || null);
  const [loading, setLoading] = useState(!validation);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (validation) {
      setData(validation);
      setLoading(false);
      return;
    }
    if (!tripId) { setLoading(false); return; }

    validateItinerary(tripId)
      .then(result => setData(result))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [tripId, validation]);

  if (loading) {
    return (
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Loader size={20} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary-blue)' }} />
        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Analyzing your itinerary...</span>
      </div>
    );
  }

  if (error || !data || !data.checks?.length) {
    if (data?.confidence_level === 'Unavailable' || error) {
      return (
        <div className="card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.75rem', background: '#F8FAFC', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            <Shield size={16} />
            <span>Validation is temporarily unavailable. Your itinerary is still available.</span>
          </div>
        </div>
      );
    }
    return null;
  }

  const colors = LEVEL_COLORS[data.confidence_level] || LEVEL_COLORS.Unavailable;
  const passedChecks = data.checks.filter(c => c.status === 'passed');
  const warningChecks = data.checks.filter(c => c.status === 'warning');
  const failedChecks = data.checks.filter(c => c.status === 'failed');

  return (
    <div className="card" style={{ padding: 0, marginBottom: '1.75rem', overflow: 'hidden', border: `1.5px solid ${colors.border}` }}>

      {/* Header */}
      <div style={{
        padding: '1.5rem 1.75rem',
        background: `linear-gradient(135deg, ${colors.bg} 0%, #FFFFFF 100%)`,
        borderBottom: `1px solid ${colors.border}`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
              <Shield size={20} color={colors.accent} />
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: colors.text, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Itinerary Confidence
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 800, color: colors.accent, lineHeight: 1 }}>
                {data.confidence_score}%
              </span>
              <span style={{
                fontSize: '0.9rem', fontWeight: 700, color: colors.text,
                background: colors.bg, padding: '0.25rem 0.75rem', borderRadius: '20px',
                border: `1px solid ${colors.border}`,
              }}>
                {data.confidence_level}
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '0.6rem 0 0', lineHeight: 1.5 }}>
              {data.summary}
            </p>
          </div>

          {/* Score ring */}
          <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
            <svg viewBox="0 0 36 36" style={{ width: 72, height: 72, transform: 'rotate(-90deg)' }}>
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="#E2E8F0" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15.5" fill="none"
                stroke={colors.accent}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${data.confidence_score * 0.974} 100`}
                style={{ transition: 'stroke-dasharray 0.6s ease' }}
              />
            </svg>
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.85rem', fontWeight: 800, color: colors.accent,
            }}>
              {data.confidence_score}
            </div>
          </div>
        </div>
      </div>

      {/* Quick check summary */}
      <div style={{ padding: '1.25rem 1.75rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {data.checks.map(check => {
            const StatusIcon = STATUS_ICONS[check.status]?.icon || CheckCircle;
            const iconColor = STATUS_ICONS[check.status]?.color || '#10B981';
            return (
              <div key={check.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem' }}>
                <StatusIcon size={15} color={iconColor} style={{ flexShrink: 0 }} />
                <span style={{ fontWeight: 600, color: 'var(--dark-navy)', minWidth: '160px' }}>{check.label}</span>
                <span style={{ color: 'var(--text-muted)', flex: 1 }}>{check.message}</span>
              </div>
            );
          })}
        </div>

        {/* Expand/Collapse details */}
        {(warningChecks.length > 0 || failedChecks.length > 0 || data.warnings?.length > 0) && (
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              marginTop: '1rem',
              background: 'none',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              fontSize: '0.825rem',
              fontWeight: 600,
              color: 'var(--primary-blue)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            {expanded ? 'Hide' : 'View'} validation details
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}

        {/* Expanded details */}
        {expanded && (
          <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            {failedChecks.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  Issues
                </div>
                {failedChecks.map(c => (
                  <div key={c.id} style={{ padding: '0.5rem 0.75rem', background: '#FEF2F2', borderRadius: '6px', marginBottom: '0.35rem', fontSize: '0.825rem', color: '#991B1B' }}>
                    <strong>{c.label}:</strong> {c.message}
                  </div>
                ))}
              </div>
            )}

            {warningChecks.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  Warnings
                </div>
                {warningChecks.map(c => (
                  <div key={c.id} style={{ padding: '0.5rem 0.75rem', background: '#FFFBEB', borderRadius: '6px', marginBottom: '0.35rem', fontSize: '0.825rem', color: '#92400E' }}>
                    <strong>{c.label}:</strong> {c.message}
                  </div>
                ))}
              </div>
            )}

            {data.warnings?.length > 0 && (
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  All Findings
                </div>
                {data.warnings.map((w, i) => (
                  <div key={i} style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                    <AlertTriangle size={13} color="#D97706" style={{ marginTop: 2, flexShrink: 0 }} />
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
