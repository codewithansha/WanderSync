import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Clock, DollarSign, Star, Sparkles } from 'lucide-react';

export default function DestinationCard({ destination }) {
  const { city, country, image, description, duration_hint, avg_budget, badge, rating } = destination;

  return (
    <div className="destination-card-luxury">
      {/* Image & Gradient Banner Wrap */}
      <div className="dest-card-media">
        <img src={image} alt={city} className="dest-card-img" loading="lazy" />
        
        {/* Subtle Dark Vignette Overlay */}
        <div className="dest-card-vignette" />

        {/* Top Badges Row */}
        <div className="dest-card-top-badges">
          {badge && (
            <span className="dest-card-badge-pill">
              <Sparkles size={11} /> {badge}
            </span>
          )}
          <span className="dest-card-rating-pill">
            <Star size={11} fill="#F59E0B" color="#F59E0B" /> {rating || '4.9'}
          </span>
        </div>

        {/* Bottom Floating Location Banner */}
        <div className="dest-card-loc-banner">
          <div className="dest-card-loc-tag">
            <MapPin size={13} className="dest-card-pin-icon" />
            <span className="dest-card-loc-city">{city}</span>
            <span className="dest-card-loc-sep">,</span>
            <span className="dest-card-loc-country">{country}</span>
          </div>
        </div>
      </div>

      {/* Body Content */}
      <div className="dest-card-body">
        <p className="dest-card-desc">{description}</p>

        {/* Meta Stats Row (Duration & Budget) */}
        <div className="dest-card-stats-row">
          {duration_hint && (
            <div className="dest-card-stat-item">
              <Clock size={13} className="dest-card-stat-icon" />
              <span>{duration_hint}</span>
            </div>
          )}
          {avg_budget && (
            <div className="dest-card-stat-item dest-card-stat-budget">
              <DollarSign size={13} className="dest-card-stat-icon" />
              <span>{avg_budget}</span>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="dest-card-footer">
          <Link
            to={`/planner?destination=${encodeURIComponent(`${city}, ${country}`)}`}
            className="btn btn-dest-plan"
          >
            <span>Plan Itinerary</span>
            <ArrowRight size={14} className="dest-btn-arrow" />
          </Link>
        </div>
      </div>
    </div>
  );
}

