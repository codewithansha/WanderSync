import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Sparkles, CheckCircle, AlertCircle, ArrowRight, RefreshCw, Compass, Cpu, MapPin, DollarSign, Bot } from 'lucide-react';
import { getJourneyStatus } from '../services/api';

const STAGE_LABELS = {
  queued: 'Journey request queued...',
  validating: 'Validating travel dates & preferences...',
  resolving_destination: 'Resolving destination coordinates with Google Maps...',
  discovering_places: 'Discovering verified attractions & dining via Google Places...',
  building_itinerary: 'Structuring optimized daily itinerary (OpenAI GPT-4o)...',
  calculating_budget: 'Calculating budget with Python Decimal Engine...',
  optimizing: 'Verifying budget limits & optimizing itinerary...',
  personalizing: 'Personalizing descriptions & local tips (Gemini AI)...',
  completed: 'Your journey is ready!',
  failed: 'Generation failed'
};

const PIPELINE_STEPS = [
  { id: 'dest',   icon: <MapPin size={16} />,    label: 'Resolving destination with Google Places API',    threshold: 25, color: 'var(--primary-blue)' },
  { id: 'places', icon: <Compass size={16} />,   label: 'Discovering verified attractions & dining',        threshold: 45, color: 'var(--secondary-green)' },
  { id: 'ai',     icon: <Cpu size={16} />,        label: 'Building structured itinerary (OpenAI GPT-4o)',   threshold: 65, color: '#8B5CF6' },
  { id: 'budget', icon: <DollarSign size={16} />, label: 'Deterministic budget calculation & optimization',  threshold: 85, color: '#F59E0B' },
  { id: 'final',  icon: <Bot size={16} />,        label: 'Personalizing descriptions & tips (Gemini AI)',   threshold: 100, color: '#EC4899' },
];

export default function Generating() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tripId = searchParams.get('trip_id');
  const destination = searchParams.get('destination') || 'your destination';

  const [status, setStatus] = useState('queued');
  const [progress, setProgress] = useState(10);
  const [message, setMessage] = useState('Initiating AI Journey Generation...');
  const [error, setError] = useState(null);
  const pollTimerRef = useRef(null);

  useEffect(() => {
    if (!tripId) {
      setError('No journey ID provided. Please start from the planner.');
      return;
    }

    let isMounted = true;
    let attempts = 0;
    const maxAttempts = 120;

    const checkStatus = async () => {
      try {
        attempts++;
        const res = await getJourneyStatus(tripId);
        if (!isMounted) return;

        setStatus(res.status);
        if (res.progress !== undefined) setProgress(res.progress);
        if (res.message) setMessage(res.message);

        if (res.status === 'completed') {
          clearInterval(pollTimerRef.current);
          setTimeout(() => { if (isMounted) navigate(`/trips/${tripId}`); }, 800);
        } else if (res.status === 'failed') {
          clearInterval(pollTimerRef.current);
          setError(res.error || 'Failed to generate journey. Please try again.');
        } else if (attempts >= maxAttempts) {
          clearInterval(pollTimerRef.current);
          setError('Generation is taking longer than expected. Please check your connection.');
        }
      } catch (err) {
        if (!isMounted) return;
        console.warn('Status poll attempt error:', err.message);
        if (attempts >= 15 && !error) {
          setError('Could not connect to the WanderSync server. Is the backend running?');
          clearInterval(pollTimerRef.current);
        }
      }
    };

    checkStatus();
    pollTimerRef.current = setInterval(checkStatus, 1500);
    return () => { isMounted = false; if (pollTimerRef.current) clearInterval(pollTimerRef.current); };
  }, [tripId, navigate]);

  return (
    <div style={{ maxWidth: '660px', margin: '3rem auto', padding: '0 1.25rem', animation: 'wsPageIn 0.4s ease-out' }}>
      <div className="generating-card">

        {!error ? (
          <>
            {/* Animated spinner with glow ring */}
            <div style={{ position: 'relative', width: 90, height: 90, margin: '0 auto 2.25rem' }}>
              <div style={{
                position: 'absolute', inset: -6,
                borderRadius: '50%',
                background: 'conic-gradient(from 0deg, rgba(11,94,215,0.15), rgba(16,185,129,0.08), rgba(11,94,215,0.15))',
                animation: 'spin 3s linear infinite',
              }} />
              <div style={{
                width: 90, height: 90, borderRadius: '50%',
                border: '4px solid var(--primary-blue-subtle)',
                borderTopColor: 'var(--primary-blue)',
                animation: 'spin 0.9s linear infinite',
                boxShadow: '0 4px 20px rgba(11,94,215,0.22)',
              }} />
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Sparkles size={28} color="var(--primary-blue)" />
              </div>
            </div>

            {/* Badge & title */}
            <span className="badge badge-blue" style={{ marginBottom: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--secondary-green)', display: 'inline-block', animation: 'wsPulseGlow 1.5s infinite' }} />
              Real AI Pipeline Active
            </span>

            <h1 style={{ fontSize: '1.95rem', color: 'var(--dark-navy)', marginBottom: '0.5rem', letterSpacing: '-0.025em' }}>
              Crafting your journey
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '2rem', lineHeight: 1.55 }}>
              Connecting Google Places, OpenAI, and Gemini for <strong style={{ color: 'var(--dark-navy)' }}>{destination}</strong>...
            </p>

            {/* Progress bar */}
            <div style={{ marginBottom: '2.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
                <span style={{ maxWidth: '75%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {STAGE_LABELS[status] || message}
                </span>
                <span style={{ color: 'var(--primary-blue)', flexShrink: 0 }}>{progress}%</span>
              </div>
              <div style={{ height: 10, background: 'var(--bg-subtle)', borderRadius: 'var(--radius-full)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                <div style={{
                  height: '100%',
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, var(--primary-blue) 0%, #0d9488 50%, var(--secondary-green) 100%)',
                  borderRadius: 'var(--radius-full)',
                  transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)',
                  boxShadow: '0 0 10px rgba(11,94,215,0.3)',
                }} />
              </div>
            </div>

            {/* Pipeline verification steps */}
            <ul className="progress-steps-list" style={{ maxWidth: '100%' }}>
              {PIPELINE_STEPS.map((s, idx) => {
                const done = progress >= s.threshold;
                const active = !done && progress >= (idx * 20 + 10);
                return (
                  <li key={s.id} className={`progress-step-item ${done ? 'completed' : active ? 'active' : ''}`}>
                    <span className="step-indicator" style={done ? { background: s.color, borderColor: s.color } : active ? { borderColor: s.color, borderTopColor: 'transparent' } : {}}>
                      {done ? <CheckCircle size={13} /> : s.icon}
                    </span>
                    <span style={{ fontSize: '0.88rem' }}>{s.label}</span>
                  </li>
                );
              })}
            </ul>

            <div style={{
              borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', marginTop: '0.5rem',
              display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem',
              color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600
            }}>
              <Compass size={13} /> Deterministic calculations • Real Google Maps data • OpenAI GPT-4o
            </div>
          </>
        ) : (
          <div style={{ padding: '1rem 0' }}>
            <div style={{
              width: 68, height: 68, borderRadius: '50%',
              background: '#FEF2F2', color: '#DC2626',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.75rem',
              boxShadow: '0 4px 14px rgba(220,38,38,0.15)'
            }}>
              <AlertCircle size={34} />
            </div>
            <h2 style={{ fontSize: '1.65rem', color: 'var(--dark-navy)', marginBottom: '0.6rem', letterSpacing: '-0.025em' }}>
              Generation Notice
            </h2>
            <p style={{ color: '#DC2626', fontSize: '0.95rem', marginBottom: '2rem', maxWidth: '480px', margin: '0 auto 2rem', lineHeight: 1.55 }}>
              {error}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <Link to="/planner" className="btn btn-primary">Return to Planner</Link>
              <button onClick={() => window.location.reload()} className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <RefreshCw size={14} /> Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
