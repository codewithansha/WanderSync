import React from 'react';

export default function FeatureCard({ icon, title, description, iconBg, iconColor }) {
  return (
    <div className="feature-card-premium">
      <div className="feature-icon-box-premium" style={{
        backgroundColor: iconBg || 'rgba(11, 94, 215, 0.1)',
        color: iconColor || '#0B5ED7',
        borderColor: `${iconColor || '#0B5ED7'}33`
      }}>
        {icon}
      </div>
      <h3 className="feature-title-premium">{title}</h3>
      <p className="feature-desc-premium">{description}</p>
    </div>
  );
}

