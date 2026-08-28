import React from 'react';
import { MessageSquare, Cpu, ShieldCheck, ArrowUpRight, Sparkles, MapPin, Compass } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      number: '01',
      tag: 'Natural Input',
      title: 'Tell Us Your Plans',
      desc: 'Share your dream destination, travel style, pacing preference, and budget in simple conversational English.',
      icon: <MessageSquare size={26} />,
      accentColor: '#0B5ED7',
      accentBg: 'rgba(11, 94, 215, 0.12)',
      bgImage: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80',
      highlightBadge: 'Any Language or Vibe',
    },
    {
      number: '02',
      tag: 'Neural Synthesis',
      title: 'AI Builds Your Journey',
      desc: 'Our algorithms balance opening hours, geographical proximity, transit times, weather risks, and expense estimates.',
      icon: <Cpu size={26} />,
      accentColor: '#10B981',
      accentBg: 'rgba(16, 185, 129, 0.12)',
      bgImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
      highlightBadge: 'Multi-Constraint Solver',
    },
    {
      number: '03',
      tag: 'Live Companion',
      title: 'Travel With Confidence',
      desc: 'Interactive maps, day timelines, real-time weather alerts, and a conversational AI companion always at your side.',
      icon: <ShieldCheck size={26} />,
      accentColor: '#8B5CF6',
      accentBg: 'rgba(139, 92, 246, 0.12)',
      bgImage: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80',
      highlightBadge: 'Zero Math Hallucinations',
    }
  ];

  return (
    <section className="how-it-works-premium-section">
      {/* Section Heading */}
      <div className="section-header-center">
        <div className="badge badge-emerald">
          <Sparkles size={12} />
          <span>Frictionless 3-Step Journey</span>
        </div>
        <h2 className="section-title-large">
          How WanderSync Works
        </h2>
        <p className="section-subtitle">
          From conversational prompt to a complete, mathematically verified schedule in seconds.
        </p>
      </div>

      {/* 3 Large Visual Cards Grid */}
      <div className="how-cards-grid">
        {steps.map((step, idx) => (
          <div key={idx} className="how-visual-card">
            {/* Card Background Image with Subtle Ken Burns Zoom on Hover */}
            <div
              className="how-card-bg-image"
              style={{ backgroundImage: `url("${step.bgImage}")` }}
            />

            {/* Dark Gradient Overlay */}
            <div className="how-card-overlay" />

            {/* Top Row: Number & Icon */}
            <div className="how-card-top">
              <span className="how-card-number">{step.number}</span>
              <div 
                className="how-card-icon-wrap"
                style={{ 
                  backgroundColor: step.accentBg,
                  color: step.accentColor,
                  borderColor: `${step.accentColor}44`
                }}
              >
                {step.icon}
              </div>
            </div>

            {/* Middle Badge */}
            <div className="how-card-middle">
              <span 
                className="how-card-tag-pill"
                style={{
                  color: step.accentColor,
                  backgroundColor: step.accentBg,
                  borderColor: `${step.accentColor}33`
                }}
              >
                {step.highlightBadge}
              </span>
            </div>

            {/* Bottom Content */}
            <div className="how-card-content">
              <h3 className="how-card-title">{step.title}</h3>
              <p className="how-card-desc">{step.desc}</p>
            </div>

            {/* Subtle Accent Glow Indicator */}
            <div 
              className="how-card-glow-bar" 
              style={{ backgroundColor: step.accentColor }} 
            />
          </div>
        ))}
      </div>
    </section>
  );
}

