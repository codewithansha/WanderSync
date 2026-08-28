import React, { useState, useEffect, useCallback } from 'react';
import DestinationCard from '../components/DestinationCard';
import { fetchDestinations } from '../services/api';
import { Search, Compass, RefreshCw, AlertCircle } from 'lucide-react';

const CATEGORIES = ['All', 'Culture', 'Nature', 'Adventure', 'Food', 'Popular'];

// Loading skeleton card
function DestinationCardSkeleton() {
  return (
    <div className="destination-card" style={{ overflow: 'hidden' }} >
      <div
        className="destination-card-img-wrap"
        style={{
          background: 'linear-gradient(90deg, var(--border-color) 25%, #e8e8f0 50%, var(--border-color) 75%)',
          backgroundSize: '200% 100%',
          animation: 'skeleton-shimmer 1.5s infinite',
          height: '200px',
        }}
      />
      <div className="destination-card-body" style={{ gap: '0.75rem', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: '1.2rem', width: '60%', borderRadius: '6px', background: 'var(--border-color)', animation: 'skeleton-shimmer 1.5s infinite' }} />
        <div style={{ height: '0.9rem', width: '40%', borderRadius: '6px', background: 'var(--border-color)', animation: 'skeleton-shimmer 1.5s infinite' }} />
        <div style={{ height: '0.85rem', width: '90%', borderRadius: '6px', background: 'var(--border-color)', animation: 'skeleton-shimmer 1.5s infinite' }} />
        <div style={{ height: '0.85rem', width: '75%', borderRadius: '6px', background: 'var(--border-color)', animation: 'skeleton-shimmer 1.5s infinite' }} />
      </div>
    </div>
  );
}

export default function Explore() {
  const [destinations, setDestinations] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const url = force
        ? '/api/places/destinations?refresh=1'
        : '/api/places/destinations';
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error(`Server error (${res.status})`);
      const data = await res.json();
      setDestinations(data);
      setFiltered(data);
    } catch (err) {
      setError(err.message || 'Could not load destinations. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Client-side filter whenever category / query / destinations change
  useEffect(() => {
    let result = destinations;
    if (activeCategory !== 'All') {
      result = result.filter(
        d => (d.category || '').toLowerCase() === activeCategory.toLowerCase()
      );
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(d =>
        (d.city || '').toLowerCase().includes(q) ||
        (d.country || '').toLowerCase().includes(q) ||
        (d.description || '').toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [activeCategory, query, destinations]);

  return (
    <div className="container" style={{ marginTop: '20px', marginBottom: '20px' }}>
      {/* Shimmer keyframe (injected once) */}
      <style>{`
        @keyframes skeleton-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem', maxWidth: '700px', margin: '0 auto 2.5rem' }}>
        <h1 style={{ fontSize: '2.5rem', color: 'var(--dark-navy)', marginBottom: '0.5rem' }}>
          Explore Destinations
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
          Browse our curated catalog of world-class destinations and generate an AI itinerary in seconds.
        </p>
      </div>

      {/* Search + Filter Controls */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search destinations, countries, experiences…"
            style={{ paddingLeft: '2.75rem' }}
            value={query}
            onChange={e => setQuery(e.target.value)}
            disabled={loading}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`btn btn-sm ${activeCategory === cat ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveCategory(cat)}
              disabled={loading}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results meta row */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600, margin: 0 }}>
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
              Loading destinations…
            </span>
          ) : (
            <>
              Showing{' '}
              <strong style={{ color: 'var(--dark-navy)' }}>{filtered.length}</strong>{' '}
              destination{filtered.length !== 1 ? 's' : ''}
              {activeCategory !== 'All' && ` in ${activeCategory}`}
              {query && ` matching "${query}"`}
            </>
          )}
        </p>
        {!loading && destinations.length > 0 && (
          <button
            className="btn btn-outline btn-sm"
            onClick={() => load(true)}
            title="Refresh destination data from Google Places"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}
          >
            <RefreshCw size={13} /> Refresh
          </button>
        )}
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div className="destinations-grid">
          {Array.from({ length: 12 }).map((_, i) => (
            <DestinationCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
          <AlertCircle size={48} style={{ margin: '0 auto 1rem', color: '#e53e3e', opacity: 0.7 }} />
          <h3 style={{ color: 'var(--dark-navy)', marginBottom: '0.5rem' }}>Couldn't load destinations</h3>
          <p style={{ marginBottom: '1.5rem' }}>{error}</p>
          <button className="btn btn-primary" onClick={() => load()}>
            Try Again
          </button>
        </div>
      )}

      {/* Destinations Grid */}
      {!loading && !error && filtered.length > 0 && (
        <div className="destinations-grid">
          {filtered.map((d, idx) => (
            <DestinationCard key={d.id || idx} destination={d} />
          ))}
        </div>
      )}

      {/* Empty state (after load, no results) */}
      {!loading && !error && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
          <Compass size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
          <h3 style={{ color: 'var(--dark-navy)', marginBottom: '0.5rem' }}>No destinations found</h3>
          <p>Try adjusting your search or selecting a different category.</p>
          {query && (
            <button className="btn btn-outline" style={{ marginTop: '1rem' }} onClick={() => setQuery('')}>
              Clear search
            </button>
          )}
        </div>
      )}
    </div>
  );
}
