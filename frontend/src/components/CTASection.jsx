import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Globe2, Compass, ShieldCheck } from 'lucide-react';

export default function CTASection() {
  return (
    <section className="cta-cinematic-section">
      {/* Background Photographic Layer with Parallax Depth */}
      <div
        className="cta-bg-image"
        style={{
          backgroundImage: `url("/images/journey.webp")`
        }}
      />

      {/* Cinematic Dark Vignette & Mesh Lighting */}
      <div className="cta-dark-vignette" />
      <div className="cta-ambient-mesh cta-ambient-left" />
      <div className="cta-ambient-mesh cta-ambient-right" />

      {/* Content Container */}
      <div className="cta-inner-content">
        {/* Top Floating Badge */}
        <div className="cta-badge-pill">
          <Globe2 size={13} className="cta-globe-icon" />
          <span>START YOUR EXTRAORDINARY TRIP</span>
        </div>

        {/* Large Cinematic Heading */}
        <h2 className="cta-headline">
          Ready to plan your next<br />
          <span className="cta-gradient-glow-text">extraordinary journey?</span>
        </h2>

        {/* Subtitle */}
        <p className="cta-subheading">
          Leave endless tabs, fragmented notes, and spreadsheet chaos behind. Generate a flawlessly sequenced, AI-verified itinerary in under 15 seconds.
        </p>

        {/* Action Buttons */}
        <div className="cta-button-cluster">
          <Link to="/planner" className="btn btn-hero-primary cta-btn-glow">
            <Sparkles size={18} className="cta-icon-spark" />
            <span>Plan My Journey Now</span>
          </Link>
          <Link to="/explore" className="btn btn-hero-glass cta-btn-glass">
            <Compass size={18} className="cta-icon-compass" />
            <span>Explore Curated Destinations</span>
          </Link>
        </div>

        {/* Micro Confidence Markers */}
        <div className="cta-confidence-strip">
          <span>✓ Free instant generation</span>
          <span>•</span>
          <span>✓ Google Places Verified</span>
          <span>•</span>
          <span>✓ Export to PDF & Calendar</span>
        </div>
      </div>
    </section>
  );
}

