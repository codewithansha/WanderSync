import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot, User, ArrowRight, Clock, MapPin, Sparkles, Check, CheckCircle2, Shield, Calendar, DollarSign, CloudSun, Compass, Navigation } from 'lucide-react';

export default function AIPreview() {
  const [activeDay, setActiveDay] = useState(1);

  const itinerarySteps = [
    {
      time: '08:45 AM',
      title: 'Fushimi Inari-Taisha Torii Tunnel',
      category: 'Culture & Photography',
      duration: '2h 15m',
      cost: 'Free Admission',
      desc: 'Early arrival avoids peak congestion; hike up the thousands of vermilion torii gates to the Yotsutsuji intersection viewpoint.',
      badge: 'Verified Landmark',
      badgeColor: '#0B5ED7',
      img: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=600&q=80',
      transit: '18 min train via Keihan Line',
      weatherStatus: 'Sunny • 21°C',
    },
    {
      time: '12:15 PM',
      title: 'Nishiki Market Culinary Discovery',
      category: 'Gastronomy & Local Life',
      duration: '1h 45m',
      cost: '¥2,800 (~$19)',
      desc: 'Savor freshly grilled unagi skewers, artisanal matcha warabi mochi, and authentic Kyoto dashi broth along 400-year-old corridors.',
      badge: 'Top Food Route',
      badgeColor: '#10B981',
      img: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=600&q=80',
      transit: '12 min direct bus #207',
      weatherStatus: 'Ideal for covered market walk',
    },
    {
      time: '03:30 PM',
      title: 'Kiyomizu-dera & Higashiyama Streets',
      category: 'UNESCO Heritage & Sunset',
      duration: '2h 30m',
      cost: '¥400 (~$3)',
      desc: 'Marvel at the monumental wooden stage cantilevered over maple hills without single nails, followed by evening tea in Sannenzaka.',
      badge: 'Golden Hour Pick',
      badgeColor: '#8B5CF6',
      img: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=600&q=80',
      transit: 'End of Day • Return to Gion',
      weatherStatus: 'Golden sunset at 05:42 PM',
    }
  ];

  return (
    <section className="ai-synthesis-section">
      {/* Background Ambient Glows */}
      <div className="synthesis-ambient-glow" />

      {/* Floating Glassmorphic Container */}
      <div className="ai-synthesis-glass-card">
        {/* Terminal / AI Engine Header Bar */}
        <div className="synthesis-header-bar">
          <div className="synthesis-dots-cluster">
            <span className="synth-dot synth-dot-red" />
            <span className="synth-dot synth-dot-amber" />
            <span className="synth-dot synth-dot-green" />
            <span className="synth-label">
              <Sparkles size={13} className="synth-label-sparkle" />
              WANDER-CORE v3.4 • MULTI-CONSTRAINT JOURNEY SYNTHESIS
            </span>
          </div>

          <div className="synthesis-status-chip">
            <span className="synth-live-ping" />
            <span className="synth-live-text">Real-Time Synthesis Complete</span>
          </div>
        </div>

        {/* User Prompt Interaction Row */}
        <div className="synthesis-prompt-row">
          <div className="synth-user-avatar">
            <User size={18} />
          </div>
          <div className="synth-user-speech-bubble">
            <span className="synth-user-quote-mark">“</span>
            I want a 5-day cultural & culinary immersion in Kyoto for 2 travelers. Moderate pacing, authentic local dining, zero backtracking, and budget under $190/day.
            <span className="synth-user-quote-mark">”</span>
          </div>
        </div>

        {/* Live AI Synthesis Checklist */}
        <div className="synth-checklist-strip">
          <div className="synth-check-item">
            <span className="synth-check-badge"><Check size={12} strokeWidth={3} /></span>
            <span>Flight & Transit Synced</span>
          </div>
          <div className="synth-check-item">
            <span className="synth-check-badge"><Check size={12} strokeWidth={3} /></span>
            <span>Zero Geographic Backtracking</span>
          </div>
          <div className="synth-check-item">
            <span className="synth-check-badge"><Check size={12} strokeWidth={3} /></span>
            <span>Budget Balanced ($185/day)</span>
          </div>
          <div className="synth-check-item">
            <span className="synth-check-badge"><Check size={12} strokeWidth={3} /></span>
            <span>Weather Risk Monitored</span>
          </div>
        </div>

        {/* Generated Itinerary Blueprint Card */}
        <div className="synth-itinerary-blueprint">
          {/* Blueprint Header */}
          <div className="synth-blueprint-top">
            <div className="synth-blueprint-info">
              <div className="synth-blueprint-badges">
                <span className="badge badge-emerald">
                  <Sparkles size={11} /> 99.4% AI Match
                </span>
                <span className="badge badge-blue">
                  <MapPin size={11} /> Kyoto, Japan
                </span>
                <span className="badge badge-navy">
                  <Calendar size={11} /> 5 Days / 4 Nights
                </span>
              </div>
              <h3 className="synth-blueprint-title">
                Kyoto Heritage, Shrines & Culinary Alleys
              </h3>
              <p className="synth-blueprint-subtitle">
                Engineered for optimal daylight, minimal transit fatigue, and authentic Japanese hospitality.
              </p>
            </div>

            <div className="synth-blueprint-action">
              <Link to="/trips/tokyo-cultural-2026" className="btn btn-synth-view">
                <span>View Full Itinerary</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>

          {/* Day Selector Pill Tabs */}
          <div className="synth-day-tabs">
            {[1, 2, 3, 4, 5].map((d) => (
              <button
                key={d}
                onClick={() => setActiveDay(d)}
                className={`synth-day-btn ${activeDay === d ? 'is-active' : ''}`}
              >
                Day 0{d}
              </button>
            ))}
            <span className="synth-day-indicator-text">Showing Curated Day {activeDay} Route</span>
          </div>

          {/* Timeline Route Nodes */}
          <div className="synth-timeline-track">
            {itinerarySteps.map((step, idx) => (
              <div key={idx} className="synth-timeline-node-card">
                {/* Node connector line */}
                <div className="synth-node-connector">
                  <div className="synth-node-dot" style={{ background: step.badgeColor }}>
                    <span>{idx + 1}</span>
                  </div>
                  {idx < itinerarySteps.length - 1 && <div className="synth-node-line" />}
                </div>

                {/* Node Content */}
                <div className="synth-node-card-body">
                  <div className="synth-node-photo-wrap">
                    <img src={step.img} alt={step.title} className="synth-node-photo" loading="lazy" />
                    <span className="synth-node-time-tag">
                      <Clock size={11} /> {step.time}
                    </span>
                  </div>

                  <div className="synth-node-details">
                    <div className="synth-node-meta-row">
                      <span className="synth-node-cat" style={{ color: step.badgeColor }}>
                        {step.category}
                      </span>
                      <span className="synth-node-duration">
                        <Clock size={12} /> {step.duration}
                      </span>
                      <span className="synth-node-cost">
                        <DollarSign size={12} /> {step.cost}
                      </span>
                    </div>

                    <h4 className="synth-node-heading">{step.title}</h4>
                    <p className="synth-node-desc">{step.desc}</p>

                    <div className="synth-node-footer-tags">
                      <span className="synth-transit-badge">
                        <Navigation size={11} /> {step.transit}
                      </span>
                      <span className="synth-weather-badge">
                        <CloudSun size={11} /> {step.weatherStatus}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* AI Intelligence Footer Strip */}
          <div className="synth-intelligence-footer">
            <div className="synth-intel-sources">
              <span className="synth-intel-title">Verified Data Sources:</span>
              <span className="badge badge-outline-pill">Google Places (New API)</span>
              <span className="badge badge-outline-pill">OpenAI GPT-4o</span>
              <span className="badge badge-outline-pill">Google Gemini</span>
              <span className="badge badge-outline-pill">Open-Meteo Weather</span>
            </div>
            <div className="synth-intel-confidence">
              <Shield size={14} color="#10B981" />
              <span>Itinerary Confidence Score: <strong>98/100</strong></span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

