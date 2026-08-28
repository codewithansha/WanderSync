import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Sparkles, MapPin, Calendar, Users, DollarSign, Globe,
  Home, Navigation, ChevronDown, X, Loader, ArrowRight,
  Plane, Star, Sunset, Camera, ShoppingBag, Trees,
  BookOpen, Baby, Moon, UtensilsCrossed, Palette,
  Mountain, Landmark, AlertCircle, Mic
} from 'lucide-react';
import { generateJourney, autocompleteDestination } from '../services/api';
import useSpeechRecognition from '../hooks/useSpeechRecognition';

const INTERESTS = [
  { id: 'Food', icon: UtensilsCrossed, label: 'Food & Dining' },
  { id: 'Culture', icon: Palette, label: 'Culture & Arts' },
  { id: 'Shopping', icon: ShoppingBag, label: 'Shopping' },
  { id: 'Adventure', icon: Mountain, label: 'Adventure' },
  { id: 'Nature', icon: Trees, label: 'Nature' },
  { id: 'History', icon: Landmark, label: 'History' },
  { id: 'Family', icon: Users, label: 'Family Friendly' },
  { id: 'Photography', icon: Camera, label: 'Photography' },
  { id: 'Nightlife', icon: Moon, label: 'Nightlife' },
];

const TRAVEL_STYLES = [
  { id: 'Budget', label: 'Budget', desc: 'Best value, affordable stays', color: '#10b981' },
  { id: 'Balanced', label: 'Balanced', desc: 'Comfort meets value', color: 'var(--primary-blue)' },
  { id: 'Premium', label: 'Premium', desc: 'Superior comfort & dining', color: '#8b5cf6' },
  { id: 'Luxury', label: 'Luxury', desc: 'Exclusive, world-class experience', color: '#f59e0b' },
];

const CURRENCIES = [
  { code: 'PKR', name: 'PKR — Pakistani Rupee' },
  { code: 'USD', name: 'USD — US Dollar' },
  { code: 'EUR', name: 'EUR — Euro' },
  { code: 'GBP', name: 'GBP — British Pound' },
  { code: 'AED', name: 'AED — UAE Dirham' },
  { code: 'JPY', name: 'JPY — Japanese Yen' },
  { code: 'AUD', name: 'AUD — Australian Dollar' },
  { code: 'CAD', name: 'CAD — Canadian Dollar' },
  { code: 'SGD', name: 'SGD — Singapore Dollar' },
  { code: 'INR', name: 'INR — Indian Rupee' },
  { code: 'TRY', name: 'TRY — Turkish Lira' },
  { code: 'ZAR', name: 'ZAR — South African Rand' },
  { code: 'SAR', name: 'SAR — Saudi Riyal' },
];

const ACCOMMODATIONS = ['Hotel', 'Apartment', 'Hostel', 'Resort', 'Any'];
const TRANSPORTS = ['Any', 'Public Transport', 'Walking', 'Taxi', 'Rental Car'];

function today() {
  return new Date().toISOString().split('T')[0];
}
function plusDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

export default function Planner() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    destination: searchParams.get('destination') || '',
    origin: searchParams.get('origin') || '',
    start_date: plusDays(7),
    end_date: plusDays(12),
    adults: 2,
    children: 0,
    budget: '',
    currency: 'USD',
    travel_style: 'Balanced',
    interests: ['Culture', 'Food'],
    accommodation: 'Hotel',
    transportation: 'Any',
  });

  const [suggestions, setSuggestions] = useState([]);
  const [showSugg, setShowSugg] = useState(false);
  const [loadingSugg, setLoadingSugg] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const suggTimer = useRef(null);
  const suggRef = useRef(null);

  const {
    isListening, isSupported: voiceSupported, error: voiceError,
    startListening, stopListening, clearError: clearVoiceError
  } = useSpeechRecognition();

  const handleVoiceInput = () => {
    if (isListening) { stopListening(); return; }
    startListening((text) => set('destination', text));
  };

  const nights = (() => {
    if (!form.start_date || !form.end_date) return 0;
    const diff = (new Date(form.end_date) - new Date(form.start_date)) / 86400000;
    return Math.max(0, diff);
  })();
  const totalTravelers = Number(form.adults) + Number(form.children);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (suggRef.current && !suggRef.current.contains(e.target)) {
        setShowSugg(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Destination autocomplete
  useEffect(() => {
    clearTimeout(suggTimer.current);
    if (form.destination.length < 2) { setSuggestions([]); return; }
    setLoadingSugg(true);
    suggTimer.current = setTimeout(async () => {
      const results = await autocompleteDestination(form.destination);
      setSuggestions(results);
      setShowSugg(results.length > 0);
      setLoadingSugg(false);
    }, 350);
    return () => clearTimeout(suggTimer.current);
  }, [form.destination]);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const toggleInterest = (id) => {
    setForm(prev => ({
      ...prev,
      interests: prev.interests.includes(id)
        ? prev.interests.filter(i => i !== id)
        : [...prev.interests, id],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.destination.trim()) { setError('Please enter a destination.'); return; }
    if (!form.start_date) { setError('Please select a start date.'); return; }
    if (!form.end_date) { setError('Please select an end date.'); return; }
    if (nights <= 0) { setError('End date must be after start date.'); return; }
    if (!form.budget || Number(form.budget) <= 0) { setError('Please enter a valid budget.'); return; }
    if (form.interests.length === 0) { setError('Please select at least one interest.'); return; }

    const payload = {
      ...form,
      travelers: totalTravelers,
      adults: Number(form.adults),
      children: Number(form.children),
      budget: Number(form.budget),
    };

    setSubmitting(true);
    try {
      const result = await generateJourney(payload);
      navigate(`/planner/generating?trip_id=${result.trip_id}&destination=${encodeURIComponent(form.destination)}`);
    } catch (err) {
      setError(err.message || 'Failed to start journey generation. Please try again.');
      setSubmitting(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '0.85rem 1rem',
    border: '1.5px solid var(--border-color)',
    borderRadius: '10px',
    fontSize: '0.95rem',
    background: 'white',
    color: 'var(--dark-navy)',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.82rem',
    fontWeight: 700,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: '0.5rem',
  };

  const cardStyle = {
    background: 'white',
    borderRadius: '16px',
    padding: '1.75rem',
    marginBottom: '1.25rem',
    border: '1px solid var(--border-color)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  };

  return (
    <div style={{ background: 'var(--light-gray)', minHeight: '100vh', paddingBottom: '4rem' }}>
      {/* Hero header */}
      <div
        style={{
          position: 'relative',
          backgroundImage: `
      linear-gradient(
        135deg,
        rgba(5, 15, 30, 0.78) 0%,
        rgba(8, 35, 70, 0.58) 50%,
        rgba(5, 15, 30, 0.72) 100%
      ),
      url('/images/plan.webp')
    `,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          padding: '3.5rem 1.5rem 3rem',
          marginBottom: '2rem',
          borderRadius: '0 0 24px 24px',
          overflow: 'hidden',
        }}
      >
        <div
          className="container"
          style={{
            maxWidth: '760px',
            position: 'relative',
            zIndex: 2,
            textAlign: 'left',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '0.9rem',
            }}
          >
            <Sparkles size={24} color="#4FC3F7" />

            <span
              style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#67D5FF',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                textShadow: '0 2px 10px rgba(0,0,0,0.7)',
              }}
            >
              AI Journey Planner
            </span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(2rem, 4vw, 2.8rem)',
              color: '#ffffff',
              fontWeight: 800,
              lineHeight: 1.15,
              marginBottom: '0.85rem',
              letterSpacing: '-0.025em',
              textShadow: `
          0 2px 6px rgba(0,0,0,0.85),
          0 6px 20px rgba(0,0,0,0.6)
        `,
            }}
          >
            Where do you want to go?
          </h1>

          <p
            style={{
              color: 'rgba(255,255,255,0.92)',
              fontSize: '1rem',
              lineHeight: 1.6,
              margin: 0,
              maxWidth: '680px',
              textShadow: `
          0 2px 6px rgba(0,0,0,0.9),
          0 4px 14px rgba(0,0,0,0.6)
        `,
            }}
          >
            Real places from Google Maps. Real itinerary from AI. Real budget calculations.
          </p>
        </div>
      </div>

      <div className="container" style={{ maxWidth: '760px' }}>
        <form onSubmit={handleSubmit}>

          {/* ── Destination & Origin ─────────────────────────────────── */}
          <div style={cardStyle}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--dark-navy)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={18} color="var(--primary-blue)" /> Destination
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {/* Destination with autocomplete */}
              <div style={{ position: 'relative' }} ref={suggRef}>
                <label style={labelStyle}>Destination *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="e.g. Dubai, Paris, Tokyo..."
                    value={form.destination}
                    onChange={e => { set('destination', e.target.value); setShowSugg(true); }}
                    onFocus={() => suggestions.length > 0 && setShowSugg(true)}
                    style={{ ...inputStyle, paddingRight: voiceSupported ? '4.5rem' : '2.5rem' }}
                    autoComplete="off"
                    required
                  />
                  {loadingSugg && (
                    <Loader size={16} style={{ position: 'absolute', right: voiceSupported ? '2.75rem' : '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', animation: 'spin 1s linear infinite' }} />
                  )}
                  {voiceSupported && (
                    <button
                      type="button"
                      onClick={handleVoiceInput}
                      onMouseEnter={() => voiceError && clearVoiceError()}
                      title={isListening ? 'Stop listening' : 'Voice input — say a destination'}
                      aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: isListening ? '#ef4444' : 'var(--text-muted)',
                        padding: '0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '4px',
                        transition: 'color 0.2s',
                      }}
                    >
                      <Mic size={18} style={isListening ? { animation: 'voice-pulse 1.2s ease-in-out infinite' } : undefined} />
                    </button>
                  )}
                </div>
                {voiceError && (
                  <div style={{ fontSize: '0.78rem', color: '#ef4444', marginTop: '0.35rem' }}>{voiceError}</div>
                )}
                {isListening && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--primary-blue)', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'voice-pulse 1.2s ease-in-out infinite' }} />
                    Listening... speak your destination
                  </div>
                )}
                {showSugg && suggestions.length > 0 && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                    background: 'white', border: '1.5px solid var(--border-color)',
                    borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    marginTop: '4px', overflow: 'hidden',
                  }}>
                    {suggestions.map((s, i) => (
                      <div
                        key={i}
                        style={{ padding: '0.75rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: i < suggestions.length - 1 ? '1px solid var(--border-color)' : 'none', fontSize: '0.9rem', color: 'var(--dark-navy)' }}
                        onMouseDown={() => { set('destination', s.text); setShowSugg(false); }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--light-gray)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'white'}
                      >
                        <MapPin size={14} color="var(--primary-blue)" />
                        {s.text}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Origin */}
              <div>
                <label style={labelStyle}>Flying From</label>
                <input
                  type="text"
                  placeholder="e.g. Karachi, London..."
                  value={form.origin}
                  onChange={e => set('origin', e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          {/* ── Dates ────────────────────────────────────────────────── */}
          <div style={cardStyle}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--dark-navy)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={18} color="var(--primary-blue)" /> Travel Dates
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={labelStyle}>Departure Date *</label>
                <input
                  type="date"
                  value={form.start_date}
                  min={today()}
                  onChange={e => set('start_date', e.target.value)}
                  style={inputStyle}
                  required
                />
              </div>
              <div>
                <label style={labelStyle}>Return Date *</label>
                <input
                  type="date"
                  value={form.end_date}
                  min={form.start_date || today()}
                  onChange={e => set('end_date', e.target.value)}
                  style={inputStyle}
                  required
                />
              </div>
            </div>
            {nights > 0 && (
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <span style={{ background: 'var(--light-blue)', color: 'var(--primary-blue)', borderRadius: '20px', padding: '0.4rem 1rem', fontSize: '0.85rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Moon size={14} /> {nights} night{nights !== 1 ? 's' : ''}
                </span>
                <span style={{ background: '#f0fdf4', color: '#16a34a', borderRadius: '20px', padding: '0.4rem 1rem', fontSize: '0.85rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Calendar size={14} /> {nights + 1} day{nights + 1 !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>

          {/* ── Travelers ─────────────────────────────────────────────── */}
          <div style={cardStyle}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--dark-navy)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={18} color="var(--primary-blue)" /> Travelers
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Adults *</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button type="button" onClick={() => set('adults', Math.max(1, form.adults - 1))} style={{ width: 36, height: 36, borderRadius: '50%', border: '1.5px solid var(--border-color)', background: 'white', cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>−</button>
                  <span style={{ fontSize: '1.3rem', fontWeight: 700, minWidth: 28, textAlign: 'center', color: 'var(--dark-navy)' }}>{form.adults}</span>
                  <button type="button" onClick={() => set('adults', form.adults + 1)} style={{ width: 36, height: 36, borderRadius: '50%', border: '1.5px solid var(--border-color)', background: 'white', cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>+</button>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Children</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button type="button" onClick={() => set('children', Math.max(0, form.children - 1))} style={{ width: 36, height: 36, borderRadius: '50%', border: '1.5px solid var(--border-color)', background: 'white', cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>−</button>
                  <span style={{ fontSize: '1.3rem', fontWeight: 700, minWidth: 28, textAlign: 'center', color: 'var(--dark-navy)' }}>{form.children}</span>
                  <button type="button" onClick={() => set('children', form.children + 1)} style={{ width: 36, height: 36, borderRadius: '50%', border: '1.5px solid var(--border-color)', background: 'white', cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>+</button>
                </div>
              </div>
            </div>
            {totalTravelers > 0 && (
              <p style={{ marginTop: '0.75rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                Total: <strong style={{ color: 'var(--dark-navy)' }}>{totalTravelers} traveler{totalTravelers !== 1 ? 's' : ''}</strong>
              </p>
            )}
          </div>

          {/* ── Budget ─────────────────────────────────────────────────── */}
          <div style={cardStyle}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--dark-navy)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <DollarSign size={18} color="var(--primary-blue)" /> Budget
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Total Budget *</label>
                <input
                  type="number"
                  placeholder="e.g. 300000"
                  value={form.budget}
                  min="1"
                  step="any"
                  onChange={e => set('budget', e.target.value)}
                  style={inputStyle}
                  required
                />
              </div>
              <div>
                <label style={labelStyle}>Currency *</label>
                <select
                  value={form.currency}
                  onChange={e => set('currency', e.target.value)}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  {CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            {form.budget && nights > 0 && totalTravelers > 0 && (
              <p style={{ marginTop: '0.75rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                ≈ <strong style={{ color: 'var(--dark-navy)' }}>{form.currency} {Number((form.budget / (nights + 1) / totalTravelers)).toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong> per person per day
              </p>
            )}
          </div>

          {/* ── Travel Style ──────────────────────────────────────────── */}
          <div style={cardStyle}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--dark-navy)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Star size={18} color="var(--primary-blue)" /> Travel Style
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
              {TRAVEL_STYLES.map(s => (
                <label key={s.id} style={{ cursor: 'pointer' }}>
                  <input type="radio" name="travel_style" value={s.id} checked={form.travel_style === s.id} onChange={() => set('travel_style', s.id)} style={{ display: 'none' }} />
                  <div style={{
                    border: form.travel_style === s.id ? `2px solid ${s.color}` : '1.5px solid var(--border-color)',
                    borderRadius: '12px', padding: '1rem',
                    background: form.travel_style === s.id ? `${s.color}10` : 'white',
                    transition: 'all 0.2s',
                  }}>
                    <div style={{ fontWeight: 700, color: form.travel_style === s.id ? s.color : 'var(--dark-navy)', marginBottom: '0.25rem' }}>{s.label}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* ── Interests ─────────────────────────────────────────────── */}
          <div style={cardStyle}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--dark-navy)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={18} color="var(--primary-blue)" /> Interests
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
              Select what matters most — AI will discover real matching places via Google Maps.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
              {INTERESTS.map(i => {
                const selected = form.interests.includes(i.id);
                const IconComponent = i.icon;
                return (
                  <button
                    type="button"
                    key={i.id}
                    onClick={() => toggleInterest(i.id)}
                    style={{
                      border: selected ? '2px solid var(--primary-blue)' : '1.5px solid var(--border-color)',
                      borderRadius: '10px', padding: '0.65rem 0.5rem', cursor: 'pointer',
                      background: selected ? 'var(--light-blue)' : 'white',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem',
                      transition: 'all 0.2s',
                    }}
                  >
                    <IconComponent size={20} color={selected ? 'var(--primary-blue)' : 'var(--text-muted)'} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: selected ? 'var(--primary-blue)' : 'var(--dark-navy)' }}>{i.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Accommodation & Transport ─────────────────────────────── */}
          <div style={cardStyle}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--dark-navy)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Home size={18} color="var(--primary-blue)" /> Preferences
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Accommodation</label>
                <select value={form.accommodation} onChange={e => set('accommodation', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  {ACCOMMODATIONS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Transportation</label>
                <select value={form.transportation} onChange={e => set('transportation', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  {TRANSPORTS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* ── Error ─────────────────────────────────────────────────── */}
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <AlertCircle size={20} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontWeight: 600, color: '#dc2626', marginBottom: '0.25rem' }}>Please fix the following:</div>
                <div style={{ color: '#ef4444', fontSize: '0.9rem' }}>{error}</div>
              </div>
            </div>
          )}

          {/* ── Submit ────────────────────────────────────────────────── */}
          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              padding: '1.1rem',
              background: submitting ? 'var(--text-muted)' : 'linear-gradient(135deg, #7600ff 0%, #0068ff 55%, #38bdf8 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '14px',
              fontSize: '1.05rem',
              fontWeight: 700,
              cursor: submitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.6rem',
              transition: 'all 0.2s',
              boxShadow: submitting ? 'none' : '0 4px 15px rgba(21,101,192,0.4)',
            }}
          >
            {submitting ? (
              <><Loader size={20} style={{ animation: 'spin 1s linear infinite' }} /> Starting AI Generation...</>
            ) : (
              <><Sparkles size={20} /> Generate My Journey <ArrowRight size={20} /></>
            )}
          </button>

          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.75rem' }}>
            Real places from Google Maps · AI-powered itinerary · No fake data
          </p>
        </form>
      </div>
    </div>
  );
}
