import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Plus, Plane, MapPin, Globe, ArrowRight, Clock, DollarSign, Activity, Compass, Calendar, Bot, TrendingUp } from 'lucide-react';
import { fetchSavedTrips } from '../services/api';
import { useAuth } from '../context/AuthContext';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

export default function Dashboard() {
  const { user } = useAuth();
  const [recentTrips, setRecentTrips] = useState([]);
  const [prompt, setPrompt] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Fetch saved trips from MongoDB
    fetchSavedTrips()
      .then(res => {
        if (res && res.trips && res.trips.length > 0) {
          setRecentTrips(res.trips);
        } else {
          // Fallback to local storage cache if no saved trips yet
          try {
            const keys = Object.keys(localStorage).filter(k => k.startsWith('wandersync_journey_'));
            const stored = keys.map(k => {
              try { return JSON.parse(localStorage.getItem(k)); } catch (_) { return null; }
            }).filter(Boolean);
            setRecentTrips(stored);
          } catch (_) { }
        }
      })
      .catch(() => { });
  }, []);

  const handleQuickPlan = (e) => {
    e.preventDefault();
    if (prompt) {
      navigate(`/planner?destination=${encodeURIComponent(prompt)}`);
    } else {
      navigate('/planner');
    }
  };

  const latestTrip = recentTrips[0];

  const initials = (user?.name || 'U')
    .split(' ')
    .map(p => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const QUICK_PROMPTS = [
    '5 days in Tokyo', '7 days in Paris', 'Weekend in Dubai', '4 days in Istanbul'
  ];

  const stats = [
    {
      icon: <Plane size={22} />,
      value: recentTrips.length || user?.trips_count || 0,
      label: 'Saved Journeys',
      bg: 'var(--primary-blue-subtle)',
      color: 'var(--primary-blue)',
    },
    {
      icon: <MapPin size={22} />,
      value: recentTrips.reduce((acc, t) => acc + (t.places_used?.length || 0), 0) || 12,
      label: 'Places Discovered',
      bg: 'var(--secondary-green-subtle)',
      color: 'var(--secondary-green)',
    },
    {
      icon: <TrendingUp size={22} />,
      value: '100%',
      label: 'Real AI & Data',
      bg: 'var(--accent-purple-subtle)',
      color: 'var(--accent-purple)',
    },
  ];

  return (
    <div className="container" style={{ paddingBottom: '4rem' , marginTop: '20px', marginBottom: '20px' }}>

      {/* ── Personalized Header ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        margin: '2rem 0 2.5rem', flexWrap: 'wrap', gap: '1.25rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: user?.profile_image ? '#F1F5F9' : 'var(--gradient-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 800, fontSize: '1.45rem',
            overflow: 'hidden', flexShrink: 0,
            boxShadow: '0 4px 16px rgba(11,94,215,0.25)',
            border: user?.profile_image ? '3px solid var(--primary-blue)' : '3px solid rgba(255,255,255,0.3)',
          }}>
            {user?.profile_image ? (
              <img src={user.profile_image} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : initials}
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600, margin: '0 0 0.2rem' }}>
              {getGreeting()},
            </p>
            <h1 style={{ fontSize: '2rem', color: 'var(--dark-navy)', margin: 0, letterSpacing: '-0.025em' }}>
              {user?.name || 'Explorer'}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', margin: '0.25rem 0 0' }}>
              Where should AI take you on your next exploration?
            </p>
          </div>
        </div>
        <Link to="/planner" className="btn btn-primary btn-lg">
          <Plus size={18} /> Plan a New Journey
        </Link>
      </div>

      {/* ── Quick AI Prompt Box ── */}
      <div className="card" style={{
        padding: '1.75rem', marginBottom: '2.5rem',
        border: '1.5px solid var(--border-focus)',
        background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
        borderRadius: 'var(--radius-xl)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 'var(--radius-sm)',
            background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Bot size={18} color="white" />
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--dark-navy)' }}>AI Journey Planner</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Powered by OpenAI GPT-4o & Gemini</div>
          </div>
        </div>
        <form onSubmit={handleQuickPlan} style={{ display: 'flex', gap: '0.85rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <Sparkles size={17} style={{
              position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)',
              color: 'var(--primary-blue)', pointerEvents: 'none'
            }} />
            <input
              type="text"
              className="form-input"
              placeholder="Where would you like to go? (e.g. 5 days in Dubai with food and shopping...)"
              style={{ paddingLeft: '2.75rem', fontSize: '0.95rem' }}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ flexShrink: 0 }}>
            Launch Planner <ArrowRight size={15} />
          </button>
        </form>
        {/* Quick prompt chips */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.85rem', flexWrap: 'wrap' }}>
          {QUICK_PROMPTS.map((p) => (
            <button key={p} type="button" onClick={() => { setPrompt(p); navigate(`/planner?destination=${encodeURIComponent(p)}`); }}
              style={{
                background: 'var(--bg-subtle)', color: 'var(--text-secondary)',
                border: '1px solid var(--border-color)', borderRadius: 'var(--radius-full)',
                padding: '0.3rem 0.85rem', fontSize: '0.8rem', fontWeight: 600,
                cursor: 'pointer', transition: 'var(--transition)', fontFamily: 'var(--font-main)'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary-blue-subtle)'; e.currentTarget.style.color = 'var(--primary-blue)'; e.currentTarget.style.borderColor = 'var(--border-focus)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-subtle)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.25rem', marginBottom: '3rem' }}>
        {stats.map((s, i) => (
          <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.5rem' }}>
            <div style={{
              width: 52, height: 52, borderRadius: 'var(--radius-md)',
              background: s.bg, color: s.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              boxShadow: `0 2px 8px ${s.color}22`
            }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--dark-navy)', lineHeight: 1.1, fontFamily: 'var(--font-heading)' }}>
                {s.value}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500, marginTop: '0.15rem' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Latest Journey Hero Card or Empty State ── */}
      {latestTrip ? (
        <div style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h2 style={{ fontSize: '1.45rem', color: 'var(--dark-navy)', margin: 0, letterSpacing: '-0.02em' }}>Your Latest Journey</h2>
            <Link to={`/trips/${latestTrip.trip_id || latestTrip.id}`} style={{ fontWeight: 700, color: 'var(--primary-blue)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              View Full Itinerary <ArrowRight size={14} />
            </Link>
          </div>

          <div className="card" style={{
            padding: '2.25rem',
            background: 'linear-gradient(135deg, #7600ff 0%, #0068ff 55%, #38bdf8 100%)',
            color: 'white',
            borderRadius: 'var(--radius-xl)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            flexWrap: 'wrap', gap: '1.5rem', border: 'none',
            boxShadow: '0 20px 40px -8px rgba(15,23,42,0.35)',
            position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: '-20%', right: '5%', width: 300, height: 300, background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <span className="badge" style={{ background: 'white', color: '#7600ff', borderColor: 'rgba(255,255,255,0.2)', marginBottom: '0.85rem', display: 'inline-flex' }}>
                {latestTrip.trip?.duration || `${latestTrip.days?.length || 0} Days`}
              </span>
              <h3 style={{ fontSize: '1.85rem', color: 'white', marginBottom: '0.6rem', letterSpacing: '-0.025em' }}>
                {latestTrip.title || latestTrip.trip?.destination}
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.92rem', margin: 0, display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <MapPin size={14} color="#FFFFFF" /> {latestTrip.trip?.destination || latestTrip.destination}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <Calendar size={14} color="#FFFFFF" /> {latestTrip.trip?.dates_display || latestTrip.dates}
                </span>
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
              <Link to={`/trips/${latestTrip.trip_id || latestTrip.id}`} className="btn btn-lg"
                style={{ background: 'white', color: '#7600ff', fontWeight: 700 }}>
                Open Itinerary
              </Link>
              <Link to={`/trips/${latestTrip.trip_id || latestTrip.id}/assistant`} className="btn btn-lg"
                style={{ background: '#7600ff', color: 'white', border: '1px solid rgba(255,255,255,0.25)', backdropFilter: 'blur(8px)' }}>
                <Bot size={16} /> AI Maestro
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="card" style={{
          padding: '4rem 2rem', textAlign: 'center', marginBottom: '3rem',
          background: 'linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%)',
          borderRadius: 'var(--radius-xl)', border: '2px dashed var(--border-color)'
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'var(--primary-blue-subtle)', color: 'var(--primary-blue)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.25rem', boxShadow: '0 4px 16px rgba(11,94,215,0.12)'
          }}>
            <Compass size={36} />
          </div>
          <h3 style={{ fontSize: '1.45rem', color: 'var(--dark-navy)', marginBottom: '0.6rem', letterSpacing: '-0.02em' }}>
            No journeys planned yet
          </h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto 2rem', fontSize: '0.95rem', lineHeight: 1.6 }}>
            Start your first AI-crafted journey using Google Places, OpenAI GPT-4o, and Gemini.
          </p>
          <Link to="/planner" className="btn btn-primary btn-lg">
            <Plus size={18} /> Plan Your First Journey
          </Link>
        </div>
      )}
    </div>
  );
}
