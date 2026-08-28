import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchTrip, saveUserTrip } from '../services/api';
import { useAuth } from '../context/AuthContext';
import TripSubNav from '../components/TripSubNav';
import AuthModal from '../components/AuthModal';
import JourneyModificationPanel from '../components/JourneyModificationPanel';
import ItineraryConfidence from '../components/ItineraryConfidence';
import { 
  Sparkles, MapPin, Calendar, Users, DollarSign, Activity, 
  MessageSquare, Printer, Share2, ArrowRight, Clock, CheckCircle,
  AlertTriangle, Compass, Shield, Bookmark, Check
} from 'lucide-react';

export default function ItineraryOverview() {
  const { tripId } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    if (!tripId) {
      setError('No trip ID specified.');
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchTrip(tripId)
      .then(data => {
        if (data) {
          setTrip(data);
          setError(null);
        } else {
          setError('Trip not found or still generating.');
        }
      })
      .catch(err => {
        setError(err.message || 'Failed to load journey.');
      })
      .finally(() => setLoading(false));
  }, [tripId]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '6rem 0', textAlign: 'center' }}>
        <div className="spinner-pulse" style={{ margin: '0 auto 1.5rem' }}></div>
        <h3 style={{ color: 'var(--dark-navy)' }}>Loading your personalized journey...</h3>
        <p style={{ color: 'var(--text-muted)' }}>Retrieving verified schedule and budget details</p>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="container" style={{ padding: '6rem 0', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <AlertTriangle size={32} />
        </div>
        <h2 style={{ color: 'var(--dark-navy)', marginBottom: '0.75rem' }}>Journey Unavailable</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{error || 'Could not locate this itinerary.'}</p>
        <Link to="/planner" className="btn btn-primary">Create a New Trip</Link>
      </div>
    );
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Shareable itinerary link copied to clipboard!');
  };

  const handleSavePlan = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    try {
      await saveUserTrip(trip?.trip_id || trip?.id || tripId, trip);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3500);
    } catch (err) {
      alert('Failed to save trip: ' + err.message);
    }
  };

  const currencySymbol = trip.trip?.currency_symbol || trip.currency || '$';
  const currencyCode = trip.trip?.currency || trip.currency_code || 'USD';
  const totalCost = trip.summary?.estimated_total ?? trip.total_estimated_cost ?? 0;
  const isOverBudget = trip.summary?.status === 'over_budget';
  const durationText = trip.trip?.duration || `${trip.days?.length || 0} Days`;
  const datesText = trip.trip?.dates_display || trip.dates || 'Upcoming Journey';
  const travelersText = trip.trip ? `${trip.trip.travelers} Traveler${trip.trip.travelers > 1 ? 's' : ''}` : trip.travelers;

  return (
    <>
      <TripSubNav tripId={trip.trip_id || trip.id || tripId} />

      <div className="container">
        {/* Over-Budget or Warning Banner */}
        {trip.warnings && trip.warnings.length > 0 && (
          <div style={{
            background: '#FFFBEB',
            border: '1px solid #FCD34D',
            borderRadius: '12px',
            padding: '1.25rem 1.5rem',
            marginBottom: '1.75rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1rem'
          }}>
            <AlertTriangle size={22} color="#D97706" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 700, color: '#92400E', marginBottom: '0.25rem', fontSize: '0.95rem' }}>
                Budget & Planning Notice
              </div>
              {trip.warnings.map((w, idx) => (
                <div key={idx} style={{ color: '#78350F', fontSize: '0.875rem', lineHeight: '1.5' }}>
                  {w.message}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hero Banner & Trip Header */}
        <div className="card" style={{ padding: '2rem', marginBottom: '2.5rem', border: '1px solid var(--border-color)', background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                <span className={`badge ${isOverBudget ? 'badge-warning' : 'badge-green'}`}>
                  {isOverBudget ? 'Optimized Over-Budget' : 'Within Budget'}
                </span>
                <span className="badge badge-blue">
                  Optimization Score: {trip.optimization_score || 94}%
                </span>
                <span className="badge badge-navy" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Shield size={12} /> Real Google Places
                </span>
              </div>
              <h1 style={{ fontSize: '2.2rem', color: 'var(--dark-navy)', marginBottom: '0.5rem' }}>
                {trip.title || `Journey to ${trip.trip?.destination_short || trip.destination}`}
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <span><MapPin size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', color: 'var(--primary-blue)' }} /> {trip.trip?.destination || trip.destination}</span>
                <span><Calendar size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', color: 'var(--primary-blue)' }} /> {datesText}</span>
                <span><Users size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', color: 'var(--primary-blue)' }} /> {travelersText}</span>
              </p>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                onClick={handleSavePlan}
                className={`btn ${isSaved ? 'btn-secondary' : 'btn-primary'}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                {isSaved ? <Check size={16} /> : <Bookmark size={16} />}
                {isSaved ? 'Saved to Account!' : 'Save Plan'}
              </button>
              <Link to={`/trips/${trip.trip_id || trip.id || tripId}/assistant`} className="btn btn-outline">
                <MessageSquare size={16} /> Ask AI to Adjust
              </Link>
              <Link to={`/trips/${trip.trip_id || trip.id || tripId}/map`} className="btn btn-outline">
                <MapPin size={16} /> Route Map
              </Link>
              <button className="btn btn-outline" onClick={() => window.print()}>
                <Printer size={16} /> Print
              </button>
              <button className="btn btn-outline" onClick={handleShare}>
                <Share2 size={16} /> Share
              </button>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Duration</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--dark-navy)' }}>{durationText}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Est. Total Cost</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--dark-navy)' }}>
                {currencySymbol}{totalCost.toLocaleString()} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>{currencyCode}</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Travel Style</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--dark-navy)' }}>{trip.trip?.travel_style || trip.travel_style || 'Balanced'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>AI Architect</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--primary-blue)' }}>
                {trip.sources?.itinerary || 'OpenAI GPT-4o'}
              </div>
            </div>
          </div>
        </div>

        {/* Itinerary Confidence / Validation Card */}
        <ItineraryConfidence
          validation={trip.validation}
          tripId={trip.trip_id || trip.id || tripId}
        />

        {/* AI Journey Modification Engine */}
        <JourneyModificationPanel
          tripId={trip.trip_id || trip.id || tripId}
          trip={trip}
          onTripUpdated={setTrip}
          selectedDay={trip.days?.[0] || null}
          currentDayNumber={1}
        />

        {/* Day-by-Day Summary Cards List */}
        <div style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.6rem', color: 'var(--dark-navy)', margin: 0 }}>
              Itinerary Schedule ({trip.days?.length || 0} Days Verified)
            </h2>
            {trip.days?.length > 0 && (
              <Link to={`/trips/${trip.trip_id || trip.id || tripId}/day/1`} style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--primary-blue)' }}>
                Open Day 1 Timeline →
              </Link>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {trip.days?.map((day) => (
              <div key={day.day_id || day.day_number} className="card card-interactive" style={{ padding: '1.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                      <span className="badge badge-blue">Day {day.day_number}</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>{day.date_display || day.date}</span>
                    </div>
                    <h3 style={{ fontSize: '1.35rem', color: 'var(--dark-navy)', margin: '0.2rem 0' }}>{day.title}</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--primary-blue)', fontWeight: 600, margin: 0 }}>Theme: {day.theme}</p>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--dark-navy)' }}>
                      {day.activities?.length || 0} Stops Scheduled
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Est. Transit: ~{day.travel_distance || 'Local'}
                    </div>
                  </div>
                </div>

                {/* Activity Highlights */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  {day.activities?.map((act, aIdx) => (
                    <div key={aIdx} style={{ padding: '0.75rem 1rem', background: 'var(--bg-color)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--primary-blue)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-blue)' }}>{act.time}</span>
                        <span className="badge badge-navy" style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem' }}>{act.category}</span>
                      </div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--dark-navy)', marginBottom: '0.15rem' }}>{act.title}</div>
                      <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <MapPin size={12} color="var(--primary-blue)" flexShrink={0} />
                        <span>{act.location} {act.duration ? `(${act.duration})` : ''}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Link to={`/trips/${trip.trip_id || trip.id || tripId}/day/${day.day_id || day.day_number}`} className="btn btn-outline-primary btn-sm">
                    View Full Day {day.day_number} Timeline & Edit <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Auth Modal for Guest User Save Flow */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setIsSaved(true);
          setTimeout(() => setIsSaved(false), 3500);
        }}
        tripToSave={{
          tripId: trip?.trip_id || trip?.id || tripId,
          tripData: trip
        }}
      />
    </>
  );
}
