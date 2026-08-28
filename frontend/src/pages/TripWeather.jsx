import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchTrip } from '../services/api';
import TripSubNav from '../components/TripSubNav';
import { Sun, Cloud, CloudRain, Wind, AlertCircle, Info, Compass } from 'lucide-react';

export default function TripWeather() {
  const { tripId } = useParams();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tripId) {
      setLoading(true);
      fetchTrip(tripId)
        .then(setTrip)
        .finally(() => setLoading(false));
    }
  }, [tripId]);

  if (loading) return <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>Loading Weather...</div>;
  if (!trip) return (
    <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
      <h2>Journey Not Found</h2>
      <Link to="/planner" className="btn btn-primary">Go to Planner</Link>
    </div>
  );

  const destName = trip.trip?.destination_short || trip.destination || 'your destination';
  const dates = trip.trip?.dates_display || trip.dates;

  return (
    <>
      <TripSubNav tripId={trip.trip_id || trip.id || tripId} />

      <div className="container" style={{ marginTop: '20px', marginBottom: '20px' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', color: 'var(--dark-navy)', margin: '0 0 0.25rem' }}>Weather & Seasonal Climate</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0 }}>
            Travel climate expectations for {destName} ({dates}).
          </p>
        </div>

        {/* Live Weather Source Notice */}
        <div style={{
          background: '#EFF6FF',
          border: '1px solid #BFDBFE',
          borderRadius: '12px',
          padding: '1.25rem 1.5rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '1rem'
        }}>
          <Info size={22} color="var(--primary-blue)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontWeight: 700, color: 'var(--dark-navy)', marginBottom: '0.25rem', fontSize: '0.95rem' }}>
              Live Weather Service Status
            </div>
            <div style={{ color: 'var(--text-primary)', fontSize: '0.875rem', lineHeight: 1.5 }}>
              Live real-time satellite weather requires a dedicated live weather provider (e.g. OpenWeatherMap). 
              For now, WanderSync provides seasonal climate guidance and indoor/outdoor itinerary tagging powered by Google Places.
            </div>
          </div>
        </div>

        {/* Climate Guidance Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
          <div className="card" style={{ padding: '1.75rem', textAlign: 'center' }}>
            <Sun size={32} color="#F59E0B" style={{ margin: '0 auto 0.75rem' }} />
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Travel Preparation</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--dark-navy)', marginBottom: '0.5rem' }}>Layered Clothing</div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
              Carry comfortable walking shoes and light layers for varied indoor/outdoor microclimates in {destName}.
            </p>
          </div>

          <div className="card" style={{ padding: '1.75rem', textAlign: 'center' }}>
            <CloudRain size={32} color="var(--primary-blue)" style={{ margin: '0 auto 0.75rem' }} />
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Rain Contingency</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--dark-navy)', marginBottom: '0.5rem' }}>Indoor Attractions</div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
              Your itinerary includes museum, dining, and cultural stops that are fully rain-proof.
            </p>
          </div>

          <div className="card" style={{ padding: '1.75rem', textAlign: 'center' }}>
            <Compass size={32} color="#8B5CF6" style={{ margin: '0 auto 0.75rem' }} />
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>AI Adaptive Concierge</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--dark-navy)', marginBottom: '0.5rem' }}>Ask AI Assistant</div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
              Use the AI Travel Maestro at any time during your trip to reschedule outdoor stops if bad weather occurs.
            </p>
          </div>
        </div>

        {/* Ask AI button */}
        <div style={{ textAlign: 'center' }}>
          <Link to={`/trips/${trip.trip_id || trip.id || tripId}/assistant`} className="btn btn-primary btn-lg">
            Ask AI Travel Maestro for Packing & Weather Tips
          </Link>
        </div>
      </div>
    </>
  );
}
