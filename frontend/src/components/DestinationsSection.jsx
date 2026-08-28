import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DestinationCard from './DestinationCard';
import { ArrowRight, Compass, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

const FALLBACK_DESTINATIONS = [
  {
    id: 'paris',
    city: 'Paris',
    country: 'France',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
    description: 'The City of Light captivates with the Eiffel Tower, world-class museums, and legendary bistros tucked along cobbled boulevards.',
    duration_hint: '4–7 days',
    avg_budget: '$150–$300/day',
    badge: 'Trending',
    rating: 4.9
  },
  {
    id: 'tokyo',
    city: 'Tokyo',
    country: 'Japan',
    image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
    description: 'A futuristic metropolis where bullet trains, neon-lit districts, ancient shrines, and the finest ramen on earth coexist effortlessly.',
    duration_hint: '5–10 days',
    avg_budget: '$100–$250/day',
    badge: "Editor's Pick",
    rating: 4.9
  },
  {
    id: 'dubai',
    city: 'Dubai',
    country: 'UAE',
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80',
    description: 'Desert luxury meets sky-high ambition — from the Burj Khalifa to souks overflowing with spices and gold.',
    duration_hint: '3–6 days',
    avg_budget: '$200–$500/day',
    badge: 'Luxury',
    rating: 4.8
  },
  {
    id: 'bali',
    city: 'Bali',
    country: 'Indonesia',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80',
    description: 'Rice terraces, sacred temples, surf-ready beaches, and vibrant night markets make Bali an endlessly rewarding island escape.',
    duration_hint: '7–14 days',
    avg_budget: '$50–$150/day',
    badge: 'Best Value',
    rating: 4.8
  },
  {
    id: 'swiss_alps',
    city: 'Swiss Alps',
    country: 'Switzerland',
    image: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=800&q=80',
    description: 'Breathtaking alpine vistas, world-class ski trails, glacier express trains, and pristine mountain villages.',
    duration_hint: '5–8 days',
    avg_budget: '$220–$450/day',
    badge: 'Scenic Wonder',
    rating: 5.0
  },
  {
    id: 'new_york',
    city: 'New York',
    country: 'USA',
    image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80',
    description: 'The city that never sleeps delivers iconic skylines, Broadway shows, world-renowned food markets, and boundless energy.',
    duration_hint: '4–8 days',
    avg_budget: '$200–$400/day',
    badge: 'Iconic',
    rating: 4.7
  }
];

export default function DestinationsSection({ destinations = [] }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);

  const list = destinations && destinations.length > 0 ? destinations : FALLBACK_DESTINATIONS;

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll > 0) {
      setScrollProgress(Math.min(1, Math.max(0, scrollLeft / maxScroll)));
    }
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll, { passive: true });
      window.addEventListener('resize', checkScroll);
    }
    return () => {
      if (el) el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [list]);

  const scrollBy = (offset) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <section className="curated-destinations-section">
      {/* Header Row */}
      <div className="curated-header-row">
        <div className="curated-header-left">
          <div className="badge badge-emerald">
            <Compass size={12} />
            <span>Google Places Verified Catalog</span>
          </div>
          <h2 className="section-title-large">
            Curated Global Destinations
          </h2>
          <p className="section-subtitle">
            Explore world-renowned destinations calibrated for instant AI itinerary generation.
          </p>
        </div>

        {/* Action & Controls Right */}
        <div className="curated-header-right">
          <div className="carousel-nav-buttons">
            <button
              onClick={() => scrollBy(-380)}
              disabled={!canScrollLeft}
              className={`carousel-nav-btn ${!canScrollLeft ? 'is-disabled' : ''}`}
              aria-label="Previous destinations"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => scrollBy(380)}
              disabled={!canScrollRight}
              className={`carousel-nav-btn ${!canScrollRight ? 'is-disabled' : ''}`}
              aria-label="Next destinations"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <Link to="/explore" className="btn btn-outline curated-explore-all-btn">
            <span>Browse All</span>
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      {/* Horizontal Carousel Track */}
      <div className="destinations-carousel-container">
        <div className="destinations-carousel-track" ref={scrollRef}>
          {list.map((d, idx) => (
            <div key={d.id || idx} className="carousel-slide-item">
              <DestinationCard destination={d} />
            </div>
          ))}
        </div>
      </div>

      {/* Progress & Pagination Dots */}
      <div className="carousel-bottom-indicators">
        <div className="carousel-progress-bar">
          <div 
            className="carousel-progress-fill" 
            style={{ width: `${Math.max(15, scrollProgress * 100)}%` }} 
          />
        </div>
      </div>
    </section>
  );
}

