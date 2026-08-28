import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Compass, ChevronLeft, ChevronRight, MapPin, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';
const REV_SLOT_COUNT = 7;
const REV_MASTER_SPEED = 1000;

const getRandomTransition = () => {
  const transitions = [
    'top',
    'bottom',
    'left',
    'right',
    'top-left',
    'top-right',
    'bottom-left',
    'bottom-right',
  ];

  return transitions[Math.floor(Math.random() * transitions.length)];
};
const HERO_DESTINATIONS = [
  {
    city: 'Paris',
    country: 'France',
    landmark: 'Eiffel Tower & Seine River',
    tag: 'Cultural Capital',
    image: '/images/hero-paris.jpg',
    fallback: '/images/hero-bg.jpg',
    vibe: 'Romantic art, legendary bistros & historic boulevards',
  },
  {
    city: 'Tokyo',
    country: 'Japan',
    landmark: 'Senso-ji & Shinjuku Skyline',
    tag: 'Futuristic Heritage',
    image: '/images/hero-tokyo.jpg',
    fallback: '/images/hero-bg.jpg',
    vibe: 'Neon nightscapes, ancient temples & world-class gastronomy',
  },
  {
    city: 'Swiss Alps',
    country: 'Switzerland',
    landmark: 'Matterhorn & Zermatt Valleys',
    tag: 'Alpine Majesty',
    image: '/images/hero-swiss-alps.jpg',
    fallback: '/images/hero-bg.jpg',
    vibe: 'Glacier railways, pristine peaks & alpine serenity',
  },
  {
    city: 'Dubai',
    country: 'UAE',
    landmark: 'Burj Khalifa & Marina Dunes',
    tag: 'Modern Oasis',
    image: '/images/hero-dubai.jpg',
    fallback: '/images/hero-bg.jpg',
    vibe: 'Skyline wonders, desert safaris & luxury waterfronts',
  },
  {
    city: 'Bali',
    country: 'Indonesia',
    landmark: 'Ubud Rice Terraces & Uluwatu',
    tag: 'Tropical Sanctuary',
    image: '/images/hero-bali.jpg',
    fallback: '/images/hero-bg.jpg',
    vibe: 'Emerald terraces, sacred cliff temples & coastal bliss',
  },
  {
    city: 'Santorini',
    country: 'Greece',
    landmark: 'Oia Caldera & Aegean Sunsets',
    tag: 'Mediterranean Gem',
    image: '/images/hero-bg.jpg',
    fallback: '/images/hero-bg.jpg',
    vibe: 'Whitewashed domes, cobalt waters & volcanic cliffs',
  }
];

export default function Hero() {
  const [transitionKey, setTransitionKey] = useState(0);
  const [transitionDirection, setTransitionDirection] = useState('top');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState(null);
  const timerRef = useRef(null);

  const nextSlide = useCallback(() => {
    setTransitionDirection(getRandomTransition());
    setTransitionKey((prev) => prev + 1);

    setCurrentIndex((prev) => (prev + 1) % HERO_DESTINATIONS.length);
  }, []);

  const prevSlide = useCallback(() => {
    setTransitionDirection(getRandomTransition());
    setTransitionKey((prev) => prev + 1);

    setCurrentIndex(
      (prev) =>
        (prev - 1 + HERO_DESTINATIONS.length) %
        HERO_DESTINATIONS.length
    );
  }, []);

  // Auto-advance slides every 5.5s
  useEffect(() => {
    if (isPaused) return;
    timerRef.current = setInterval(nextSlide, 5500);
    return () => clearInterval(timerRef.current);
  }, [nextSlide, isPaused]);

  // Touch swipe support
  const handleTouchStart = (e) => setTouchStartX(e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    if (touchStartX === null) return;
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 45) {
      if (diff > 0) nextSlide();
      else prevSlide();
    }
    setTouchStartX(null);
  };

  // Preload destination images for instant transitions
  useEffect(() => {
    HERO_DESTINATIONS.forEach((dest) => {
      const img = new Image();
      img.src = dest.image;
    });
  }, []);

  const currentDest = HERO_DESTINATIONS[currentIndex];

  return (
    <div className="main_slider_area">
      <div
        className="fullwidthbanner-container fullscreen-container tp-simpleresponsive hero-cinematic-wrapper"
        id="slider_rev"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Background Carousel Slides with RevSlider 7-Slot Transition + Ken Burns */}
        <div className="hero-carousel-track">
          {HERO_DESTINATIONS.map((dest, idx) => {
            const isActive = idx === currentIndex;
            return (
              <div
                key={dest.city}
                className={`hero-cinematic-slide ${isActive ? 'is-active' : ''}`}
                aria-hidden={!isActive}
              >
                {/* Continuous Ken Burns Background Layer */}
                <div
                  className="hero-slide-image"
                  style={{
                    backgroundImage: `url(${dest.image})`
                  }}
                />

                {/* Revolution Slider 7-Slot Curtain Reveal on Slide Change */}
                {isActive && (
                  <div
                    className={`revslider-slots-wrapper rev-direction-${transitionDirection}`}
                    key={`slots-${currentIndex}-${transitionKey}`}
                    aria-hidden="true"
                  >
                    {Array.from({ length: REV_SLOT_COUNT }).map((_, slotIdx) => {
                      const slotWidth = 100 / REV_SLOT_COUNT;
                      const left = slotIdx * slotWidth;

                      return (
                        <div
                          key={`${currentIndex}-${transitionKey}-${slotIdx}`}
                          className="revslider-slot"
                          style={{
                            left: `${left}%`,
                            width: `${slotWidth + 0.15}%`,
                            backgroundImage: `url("${currentDest.image}"), url("${currentDest.fallback}")`,
                            backgroundPosition: `${slotIdx * 100 / (REV_SLOT_COUNT - 1)}% center`,
                            backgroundSize: `${REV_SLOT_COUNT * 100}% 100%`,
                            animationDelay: `${slotIdx * 55}ms`,
                            animationDuration: `${REV_MASTER_SPEED}ms`,
                            '--slot-index': slotIdx,
                            '--slot-count': REV_SLOT_COUNT,
                          }}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Revolution Slider Bannertimer at bottom of hero */}
        <div className="tp-bannertimer" aria-hidden="true">
          <div className="tp-bannertimer-bar" key={`timer-${currentIndex}`} />
        </div>

        {/* Cinematic Dark Vignette & Mesh Overlays */}
        <div className="hero-cinematic-overlay" />
        <div className="hero-ambient-glow hero-ambient-glow-left" />
        <div className="hero-ambient-glow hero-ambient-glow-right" />

        {/* Floating Animated Particle Sparkles Layer */}
        <div className="hero-particles-layer" aria-hidden="true">
          <span className="particle particle-1" />
          <span className="particle particle-2" />
          <span className="particle particle-3" />
          <span className="particle particle-4" />
          <span className="particle particle-5" />
          <span className="particle particle-6" />
          <span className="particle particle-7" />
          <span className="particle particle-8" />
        </div>

        {/* Hero Central Content */}
        <div className="hero-cinematic-content">
          {/* Dynamic Location Chip */}
          <div className="hero-location-chip animate-fade-in">
            <span className="hero-pulse-dot" />
            <MapPin size={13} className="hero-location-icon" />
            <span className="hero-location-name">{currentDest.city}, {currentDest.country}</span>
            <span className="hero-location-divider">•</span>
            <span className="hero-location-landmark">{currentDest.landmark}</span>
          </div>

          {/* AI Powered Badge */}
          <div className="hero-ai-badge">
            <Sparkles size={14} className="hero-badge-sparkle" />
            <span>AI-POWERED TRAVEL PLANNING</span>
          </div>

          {/* Main Cinematic Heading */}
          <h1 className="hero-cinematic-title">
            Your Journey.{' '}
            <span className="hero-gradient-ai-text">Reimagined by AI.</span>
          </h1>

          {/* Hero Subtitle */}
          <p className="hero-cinematic-desc">
            Tell WanderSync where you want to wander. Our intelligent itinerary maestro crafts an extraordinary, minute-by-minute journey harmonized for pacing, budget, and local atmosphere.
          </p>

          {/* CTA Button Group */}
          <div className="hero-cinematic-ctas">
            <Link to="/planner" className="btn btn-hero-primary">
              <Sparkles size={19} className="hero-btn-icon" />
              <span>Plan My Journey</span>
            </Link>
            <Link to="/explore" className="btn btn-hero-glass">
              <Compass size={19} className="hero-btn-icon" />
              <span>Explore Destinations</span>
            </Link>
          </div>

          {/* Trust Badges Bar */}
          <div className="hero-trust-bar">
            <div className="hero-trust-item">
              <CheckCircle2 size={15} color="#10B981" />
              <span>Google Places Verified</span>
            </div>
            <div className="hero-trust-item">
              <Zap size={15} color="#38BDF8" />
              <span>GPT-4o & Gemini Multimodal</span>
            </div>
            <div className="hero-trust-item">
              <ShieldCheck size={15} color="#A78BFA" />
              <span>Real Time Currency & Budget Sync</span>
            </div>
          </div>
        </div>

        {/* Revolution Slider Navigation Arrows */}
        <button
          onClick={prevSlide}
          className="tparrows tp-leftarrow default hero-nav-arrow hero-nav-prev"
          aria-label="Previous destination"
          title="Previous destination"
        >
          <ChevronLeft size={22} />
        </button>
        <button
          onClick={nextSlide}
          className="tparrows tp-rightarrow default hero-nav-arrow hero-nav-next"
          aria-label="Next destination"
          title="Next destination"
        >
          <ChevronRight size={22} />
        </button>

        {/* Revolution Slider Bullets / Bottom Pagination Bar */}
        <div className="tp-bullets tp-thumbs hero-carousel-pagination">
          {HERO_DESTINATIONS.map((dest, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={dest.city}
                onClick={() => setCurrentIndex(idx)}
                className={`bullet hero-page-pill ${isActive ? 'selected is-active' : ''}`}
                aria-label={`Go to ${dest.city}`}
                title={`${dest.city}, ${dest.country}`}
              >
                <span className="hero-pill-track">
                  {isActive && <span className="hero-pill-fill" />}
                </span>
                <span className="hero-pill-label">{dest.city}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
