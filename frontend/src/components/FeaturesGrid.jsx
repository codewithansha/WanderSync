import React, { useState } from 'react';
import { Compass, Zap, DollarSign, CloudSun, MapPin, MessageSquare, Sparkles, Globe2, Activity, Cpu, Network, ShieldCheck } from 'lucide-react';

export default function FeaturesGrid() {
  const [activeFeature, setActiveFeature] = useState(0);

  const capabilities = [
    {
      id: 0,
      title: 'Personalized Itineraries',
      tag: 'Bespoke AI Curation',
      desc: 'Every activity is matched to your specific pace, cultural interests, culinary passions, and group composition.',
      icon: <Compass size={22} />,
      accent: '#0B5ED7',
      accentGlow: 'rgba(11, 94, 215, 0.35)',
      metric: '99.4% User Alignment',
    },
    {
      id: 1,
      title: 'Smart Routing & Transit',
      tag: 'Zero Backtracking',
      desc: 'Chronologically sequenced stops with real distances, traffic patterns, and train schedules to eliminate wasted hours.',
      icon: <Zap size={22} />,
      accent: '#F59E0B',
      accentGlow: 'rgba(245, 158, 11, 0.35)',
      metric: 'Saves 2.5 hrs/day',
    },
    {
      id: 2,
      title: 'Budget Intelligence',
      tag: 'Real-Time Precision',
      desc: 'Granular cost breakdowns across lodging, dining, transit, and tickets with instant 1-click budget re-balancing.',
      icon: <DollarSign size={22} />,
      accent: '#10B981',
      accentGlow: 'rgba(16, 185, 129, 0.35)',
      metric: 'Zero Hidden Costs',
    },
    {
      id: 3,
      title: 'Weather Awareness',
      tag: 'Conflict Avoidance',
      desc: 'Automated meteorological detection dynamically shifts outdoor visits when rain or high temperatures are forecast.',
      icon: <CloudSun size={22} />,
      accent: '#38BDF8',
      accentGlow: 'rgba(56, 189, 248, 0.35)',
      metric: 'Live Radar Sync',
    },
    {
      id: 4,
      title: 'Interactive Maps',
      tag: 'Spatial Coordination',
      desc: 'Synchronized map pins, route polylines, and day-by-day filter layers directly connected to your timeline.',
      icon: <MapPin size={22} />,
      accent: '#F43F5E',
      accentGlow: 'rgba(244, 63, 94, 0.35)',
      metric: 'Google Places Powered',
    },
    {
      id: 5,
      title: 'AI Travel Assistant',
      tag: 'Conversational Companion',
      desc: 'Swap activities, request translation cards, find instant dinner reservations, or modify pacing on the fly.',
      icon: <MessageSquare size={22} />,
      accent: '#8B5CF6',
      accentGlow: 'rgba(139, 92, 246, 0.35)',
      metric: '24/7 Context-Aware',
    }
  ];

  return (
    <section className="features-matrix-section">
      {/* Dark Luxury Backdrop Overlays */}
      <div className="matrix-backdrop-glow" />

      {/* Header */}
      <div className="section-header-center">
        <div className="badge badge-emerald">
          <Cpu size={12} />
          <span>Unified Intelligence Engine</span>
        </div>
        <h2 className="section-title-large" style={{ color: 'var(--white)' }}>
          Intelligent Travel Capabilities
        </h2>
        <p className="section-subtitle" style={{ color: '#94A3B8' }}>
          AI connects every dimension of your journey — routes, pricing, opening hours, and weather — in a unified matrix.
        </p>
      </div>

      {/* Interactive Travel Matrix Layout */}
      <div className="matrix-interactive-wrapper">
        
        {/* Left Column Floating Nodes (3 items) */}
        <div className="matrix-column matrix-col-left">
          {capabilities.slice(0, 3).map((item) => {
            const isSelected = activeFeature === item.id;
            return (
              <div
                key={item.id}
                onMouseEnter={() => setActiveFeature(item.id)}
                onClick={() => setActiveFeature(item.id)}
                className={`matrix-glass-card ${isSelected ? 'is-selected' : ''}`}
                style={{
                  borderColor: isSelected ? item.accent : 'rgba(255,255,255,0.1)',
                  boxShadow: isSelected ? `0 12px 30px ${item.accentGlow}` : 'none',
                }}
              >
                <div className="matrix-card-header">
                  <div 
                    className="matrix-icon-box"
                    style={{ 
                      backgroundColor: `${item.accent}18`, 
                      color: item.accent,
                      borderColor: `${item.accent}44` 
                    }}
                  >
                    {item.icon}
                  </div>
                  <div className="matrix-card-meta">
                    <span className="matrix-tag" style={{ color: item.accent }}>{item.tag}</span>
                    <h4 className="matrix-title">{item.title}</h4>
                  </div>
                </div>
                <p className="matrix-desc">{item.desc}</p>
                <div className="matrix-footer-metric">
                  <span className="matrix-metric-pill" style={{ color: item.accent, borderColor: `${item.accent}33` }}>
                    {item.metric}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Central Animated World Hub Visual */}
        <div className="matrix-central-hub">
          {/* Orbital Radar Rings */}
          <div className="hub-orbital-ring hub-ring-outer" />
          <div className="hub-orbital-ring hub-ring-middle" />
          <div className="hub-orbital-ring hub-ring-inner" />

          {/* Central Hologram Globe Sphere */}
          <div className="hub-core-sphere">
            <div className="hub-core-pulse" />
            <Globe2 size={52} className="hub-globe-icon" />
            <span className="hub-core-title">WANDER-AI</span>
            <span className="hub-core-status">
              <span className="hub-status-blink" />
              {capabilities[activeFeature].title}
            </span>
          </div>

          {/* Glowing Animated Network Nodes */}
          <div className="hub-pin hub-pin-1" title="Tokyo Node">
            <span className="hub-pin-point" />
            <span className="hub-pin-label">Tokyo</span>
          </div>
          <div className="hub-pin hub-pin-2" title="Paris Node">
            <span className="hub-pin-point" />
            <span className="hub-pin-label">Paris</span>
          </div>
          <div className="hub-pin hub-pin-3" title="New York Node">
            <span className="hub-pin-point" />
            <span className="hub-pin-label">New York</span>
          </div>
          <div className="hub-pin hub-pin-4" title="Dubai Node">
            <span className="hub-pin-point" />
            <span className="hub-pin-label">Dubai</span>
          </div>
        </div>

        {/* Right Column Floating Nodes (3 items) */}
        <div className="matrix-column matrix-col-right">
          {capabilities.slice(3, 6).map((item) => {
            const isSelected = activeFeature === item.id;
            return (
              <div
                key={item.id}
                onMouseEnter={() => setActiveFeature(item.id)}
                onClick={() => setActiveFeature(item.id)}
                className={`matrix-glass-card ${isSelected ? 'is-selected' : ''}`}
                style={{
                  borderColor: isSelected ? item.accent : 'rgba(255,255,255,0.1)',
                  boxShadow: isSelected ? `0 12px 30px ${item.accentGlow}` : 'none',
                }}
              >
                <div className="matrix-card-header">
                  <div 
                    className="matrix-icon-box"
                    style={{ 
                      backgroundColor: `${item.accent}18`, 
                      color: item.accent,
                      borderColor: `${item.accent}44` 
                    }}
                  >
                    {item.icon}
                  </div>
                  <div className="matrix-card-meta">
                    <span className="matrix-tag" style={{ color: item.accent }}>{item.tag}</span>
                    <h4 className="matrix-title">{item.title}</h4>
                  </div>
                </div>
                <p className="matrix-desc">{item.desc}</p>
                <div className="matrix-footer-metric">
                  <span className="matrix-metric-pill" style={{ color: item.accent, borderColor: `${item.accent}33` }}>
                    {item.metric}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}

