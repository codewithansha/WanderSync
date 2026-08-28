import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchSavedTrips, deleteSavedTrip } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MapPin, Calendar, Users, Bookmark, ExternalLink, Trash2, Plus, Sparkles, ArrowRight, Bot, DollarSign } from 'lucide-react';

export default function SavedTrips() {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const loadTrips = async () => {
    setLoading(true);
    try {
      const res = await fetchSavedTrips();
      setTrips(res.trips || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load saved journeys.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTrips(); }, []);

  const handleDelete = async (tripId, e) => {
    e.preventDefault();
    if (!window.confirm('Are you sure you want to remove this journey from your saved plans?')) return;
    setDeletingId(tripId);
    try {
      await deleteSavedTrip(tripId);
      setTrips(prev => prev.filter(t => t.id !== tripId && t.trip_id !== tripId && t.saved_id !== tripId));
    } catch (err) {
      alert('Failed to delete trip: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="container" style={{ marginTop: '20px', marginBottom: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.1rem', color: 'var(--dark-navy)', margin: '0 0 0.3rem', letterSpacing: '-0.025em' }}>
            Saved Journeys
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0 }}>
            {trips.length} journey{trips.length === 1 ? '' : 's'} saved to <strong style={{ color: 'var(--dark-navy)' }}>{user?.name || 'your'}</strong>'s workspace
          </p>
        </div>
        <Link to="/planner" className="btn btn-primary">
          <Plus size={16} /> Plan New Journey
        </Link>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '5rem 0' }}>
          <div className="spinner-pulse" style={{ margin: '0 auto 1.5rem' }}></div>
          <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Loading your saved itineraries from MongoDB...</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="card" style={{ padding: '2rem', textAlign: 'center', borderColor: '#FECACA', background: '#FEF2F2' }}>
          <p style={{ color: '#DC2626', fontWeight: 600, marginBottom: '1rem' }}>{error}</p>
          <button onClick={loadTrips} className="btn btn-outline">Retry</button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && trips.length === 0 && (
        <div style={{ textAlign: 'center', padding: '5rem 0' }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'var(--primary-blue-subtle)', color: 'var(--primary-blue)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.5rem', boxShadow: '0 4px 16px rgba(11,94,215,0.12)'
          }}>
            <Bookmark size={40} />
          </div>
          <h3 style={{ fontSize: '1.45rem', color: 'var(--dark-navy)', marginBottom: '0.6rem', letterSpacing: '-0.02em' }}>
            No saved journeys yet
          </h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto 2rem', lineHeight: 1.6 }}>
            Plan a personalized AI journey and click "Save Plan" to store it here.
          </p>
          <Link to="/planner" className="btn btn-primary btn-lg">
            <Sparkles size={16} /> Start Planning
          </Link>
        </div>
      )}

      {/* Trip cards */}
      {!loading && !error && trips.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
          {trips.map((t) => {
            const dest = t.destination || t.trip?.destination || 'Custom Destination';
            const title = t.title || t.trip?.itinerary_title || `Trip to ${dest}`;
            const dates = t.dates || (t.trip?.start_date ? `${t.trip.start_date} – ${t.trip.end_date}` : 'Custom Dates');
            const cost = t.total_estimated_cost || t.trip?.summary?.estimated_total || 0;
            const currency = t.currency || t.trip?.currency || 'PKR';
            const tripId = t.trip_id || t.id;
            const isDeleting = deletingId === tripId;

            return (
              <div key={t.saved_id || t.id} className="card" style={{
                padding: '1.85rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1.5rem',
                alignItems: 'center',
                borderRadius: 'var(--radius-xl)',
                border: '1.5px solid var(--border-color)',
                transition: 'transform var(--transition), box-shadow var(--transition), border-color var(--transition)',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)'; e.currentTarget.style.borderColor = 'var(--border-focus)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
              >
                {/* Info column */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.65rem', flexWrap: 'wrap' }}>
                    <span className="badge badge-green">Saved Journey</span>
                    <span className="badge badge-blue">{t.days_count || 1} Days</span>
                  </div>
                  <h2 style={{ fontSize: '1.3rem', color: 'var(--dark-navy)', margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>{title}</h2>
                  <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                      <MapPin size={14} color="var(--primary-blue)" /> {dest}
                    </span>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                      <Calendar size={14} color="var(--secondary-green)" /> {dates}
                    </span>
                  </div>
                </div>

                {/* Cost column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estimated Cost</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                    <span style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--dark-navy)', fontFamily: 'var(--font-heading)' }}>
                      {cost.toLocaleString()}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>{currency}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Saved on {t.saved_at ? new Date(t.saved_at).toLocaleDateString() : 'Recent'}
                  </div>
                </div>

                {/* Actions column */}
                <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <Link to={`/trips/${tripId}`} className="btn btn-primary btn-sm">
                    Open Itinerary <ExternalLink size={13} />
                  </Link>
                  <Link to={`/trips/${tripId}/assistant`} className="btn btn-outline btn-sm">
                    <Bot size={13} /> AI Maestro
                  </Link>
                  <button
                    onClick={(e) => handleDelete(tripId, e)}
                    className="btn btn-outline btn-sm"
                    style={{ color: '#EF4444', borderColor: '#FECACA' }}
                    title="Remove saved journey"
                    disabled={isDeleting}
                  >
                    {isDeleting
                      ? <span style={{ display: 'inline-block', width: 13, height: 13, border: '2px solid #EF4444', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                      : <Trash2 size={14} />
                    }
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
