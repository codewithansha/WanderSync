import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Compass, Utensils, Mountain, Sun, Sparkles, DollarSign, Clock, Train, Footprints, Car, Check } from 'lucide-react';

export default function Onboarding() {
  const navigate = useNavigate();
  const [styles, setStyles] = useState(['Culture', 'Food & Dining']);
  const [interests, setInterests] = useState(['History & Relics', 'Museums & Art', 'Photography Spots']);
  const [budget, setBudget] = useState('Moderate');
  const [pace, setPace] = useState('Balanced');
  const [transport, setTransport] = useState('Public Transit');

  const toggleItem = (list, setList, item) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  const sectionStyle = { marginBottom: '2.5rem' };
  const sectionHeadStyle = { fontSize: '1.1rem', color: 'var(--dark-navy)', fontWeight: 700, marginBottom: '0.25rem' };
  const sectionSubStyle = { fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' };

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '0 1.25rem', animation: 'wsPageIn 0.35s ease-out' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2.75rem' }}>
        <span className="badge badge-blue" style={{ marginBottom: '0.85rem' }}>Step 1 of 1 • Personalization</span>
        <h1 style={{ fontSize: '2.35rem', color: 'var(--dark-navy)', marginBottom: '0.55rem', letterSpacing: '-0.03em' }}>
          Calibrate Your Travel Profile
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: '580px', margin: '0 auto' }}>
          Help WanderSync's AI engine align with your personal travel rhythm, taste, and comfort zone.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card" style={{
        padding: '2.75rem',
        boxShadow: '0 20px 40px -8px rgba(15,23,42,0.1)',
        borderRadius: 'var(--radius-2xl)',
        border: '1.5px solid var(--border-color)',
      }}>

        {/* 1. Travel Style */}
        <div style={sectionStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <div style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: 'var(--primary-blue-subtle)', color: 'var(--primary-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800 }}>1</div>
            <h3 style={sectionHeadStyle}>Primary Travel Style</h3>
          </div>
          <p style={sectionSubStyle}>What kind of vibe defines your ideal journey?</p>
          <div className="selection-grid">
            {[
              { id: 'Culture', title: 'Culture', desc: 'Heritage, arts & local traditions' },
              { id: 'Food & Dining', title: 'Food & Dining', desc: 'Street markets & culinary gems' },
              { id: 'Adventure', title: 'Adventure', desc: 'Hiking, sports & outdoor thrills' },
              { id: 'Relaxed', title: 'Relaxed', desc: 'Leisure, slow days & wellness' },
              { id: 'Luxury', title: 'Luxury', desc: 'Fine dining & 5-star comfort' },
              { id: 'Budget / Solo', title: 'Budget / Solo', desc: 'Smart spending & authentic life' }
            ].map(item => (
              <div
                key={item.id}
                className={`selection-card ${styles.includes(item.id) ? 'selected' : ''}`}
                onClick={() => toggleItem(styles, setStyles, item.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="selection-card-title">{item.title}</span>
                  {styles.includes(item.id) && (
                    <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--primary-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Check size={12} color="white" />
                    </span>
                  )}
                </div>
                <span className="selection-card-desc">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '0 0 2.5rem' }} />

        {/* 2. Specific Interests */}
        <div style={sectionStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <div style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: 'var(--secondary-green-subtle)', color: 'var(--secondary-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800 }}>2</div>
            <h3 style={sectionHeadStyle}>Core Interests</h3>
          </div>
          <p style={sectionSubStyle}>Activities you prioritize when exploring new cities.</p>
          <div className="selection-grid">
            {['History & Relics', 'Museums & Art', 'Nature & Parks', 'Architecture', 'Photography Spots', 'Local Shopping', 'Beaches & Coast', 'Nightlife & Bars'].map(item => (
              <div
                key={item}
                className={`selection-card ${interests.includes(item) ? 'selected' : ''}`}
                onClick={() => toggleItem(interests, setInterests, item)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="selection-card-title">{item}</span>
                  {interests.includes(item) && (
                    <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--primary-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Check size={12} color="white" />
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '0 0 2.5rem' }} />

        {/* 3. Budget Profile */}
        <div style={sectionStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <div style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: '#FFF7ED', color: '#EA580C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800 }}>3</div>
            <h3 style={sectionHeadStyle}>Budget Profile</h3>
          </div>
          <p style={sectionSubStyle}>Target daily expenditure excluding flights.</p>
          <div className="selection-grid">
            {[
              { id: 'Budget', title: 'Budget', desc: 'Under $100 / day' },
              { id: 'Moderate', title: 'Moderate', desc: '$100 – $250 / day' },
              { id: 'Premium', title: 'Premium', desc: '$250 – $500 / day' },
              { id: 'Luxury', title: 'Luxury', desc: '$500+ / day' }
            ].map(item => (
              <div
                key={item.id}
                className={`selection-card ${budget === item.id ? 'selected' : ''}`}
                onClick={() => setBudget(item.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="selection-card-title">{item.title}</span>
                  {budget === item.id && (
                    <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--primary-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Check size={12} color="white" />
                    </span>
                  )}
                </div>
                <span className="selection-card-desc">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '0 0 2.5rem' }} />

        {/* 4. Travel Pace */}
        <div style={sectionStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <div style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: 'var(--accent-purple-subtle)', color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800 }}>4</div>
            <h3 style={sectionHeadStyle}>Travel Pace</h3>
          </div>
          <p style={sectionSubStyle}>How many activities per day do you prefer?</p>
          <div className="selection-grid">
            {[
              { id: 'Relaxed', title: 'Relaxed', desc: '2–3 stops per day' },
              { id: 'Balanced', title: 'Balanced', desc: '4–5 stops per day' },
              { id: 'Intensive', title: 'Intensive', desc: '6–8 stops per day' },
            ].map(item => (
              <div
                key={item.id}
                className={`selection-card ${pace === item.id ? 'selected' : ''}`}
                onClick={() => setPace(item.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="selection-card-title">{item.title}</span>
                  {pace === item.id && (
                    <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--primary-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Check size={12} color="white" />
                    </span>
                  )}
                </div>
                <span className="selection-card-desc">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '0 0 2.5rem' }} />

        {/* 5. Preferred Transport */}
        <div style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <div style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: '#EFF6FF', color: 'var(--primary-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800 }}>5</div>
            <h3 style={sectionHeadStyle}>Preferred Transport</h3>
          </div>
          <p style={sectionSubStyle}>How do you prefer to get around?</p>
          <div className="selection-grid">
            {[
              { id: 'Public Transit', title: 'Public Transit', desc: 'Metro, bus, tram' },
              { id: 'Walking', title: 'Walking', desc: 'Explore on foot' },
              { id: 'Taxi / Rideshare', title: 'Taxi / Rideshare', desc: 'Uber, Grab, etc.' },
              { id: 'Rental Car', title: 'Rental Car', desc: 'Drive yourself' },
            ].map(item => (
              <div
                key={item.id}
                className={`selection-card ${transport === item.id ? 'selected' : ''}`}
                onClick={() => setTransport(item.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="selection-card-title">{item.title}</span>
                  {transport === item.id && (
                    <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--primary-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Check size={12} color="white" />
                    </span>
                  )}
                </div>
                <span className="selection-card-desc">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-full btn-lg" style={{ fontSize: '1.05rem' }}>
          <Sparkles size={18} />
          Save My Travel Profile & Go to Dashboard
          <ArrowRight size={16} />
        </button>
      </form>
    </div>
  );
}
