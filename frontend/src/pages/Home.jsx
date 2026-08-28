import React, { useState, useEffect } from 'react';
import Hero from '../components/Hero';
import AIPreview from '../components/AIPreview';
import HowItWorks from '../components/HowItWorks';
import FeaturesGrid from '../components/FeaturesGrid';
import DestinationsSection from '../components/DestinationsSection';
import CTASection from '../components/CTASection';
import { fetchDestinations } from '../services/api';

export default function Home() {
  const [destinations, setDestinations] = useState([]);

  useEffect(() => {
    fetchDestinations()
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setDestinations(data.slice(0, 10));
        }
      })
      .catch(err => console.warn("Failed to load home destinations:", err));
  }, []);

  return (
    <div className="home-page-cinematic">
      {/* 1. Cinematic Full-Bleed Hero */}
      <Hero />

      {/* 2. AI Synthesis & Live Journey Preview */}
      <div className="container-cinematic">
        <AIPreview />
      </div>

      {/* 3. 3-Step Process (Photographic Layered Visuals) */}
      <div className="container-cinematic">
        <HowItWorks />
      </div>

      {/* 4. Unified AI Capabilities (Dark Luxury Matrix with Central Visual) */}
      <div className="full-width-dark-section">
        <div className="container-cinematic">
          <FeaturesGrid />
        </div>
      </div>

      {/* 5. Curated Destinations Horizontal Carousel */}
      <div className="container-cinematic">
        <DestinationsSection destinations={destinations} />
      </div>

      {/* 6. Cinematic CTA Banner */}
      <div className="container-cinematic">
        <CTASection />
      </div>
    </div>
  );
}

