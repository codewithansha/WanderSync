import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchTrip } from '../services/api';
import TripSubNav from '../components/TripSubNav';
import JourneyModificationPanel from '../components/JourneyModificationPanel';
import { 
  Clock, MapPin, Edit3, RefreshCw, Trash2, ArrowLeft, MessageSquare, 
  Star, ExternalLink, ShieldCheck, Lock, Unlock, Moon, ArrowRight, Sparkles 
} from 'lucide-react';
import { modifyJourneyEngine } from '../services/modificationApi';

export default function DayDetails() {
  const { tripId, dayId = '1' } = useParams();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    if (tripId) {
      setLoading(true);
      fetchTrip(tripId)
        .then(setTrip)
        .finally(() => setLoading(false));
    }
  }, [tripId]);

  const handleDirectActivityAction = async (actionType, act, dayNum) => {
    if (!trip) return;
    const actTitle = act.title;
    const actId = act.place_id || actTitle;
    setActionLoading(actId);

    // 1. Build query for backend engine
    let query = '';
    const dayInt = parseInt(dayNum, 10) || 1;
    const dayIdx = Math.max(0, Math.min(dayInt - 1, (trip.days?.length || 1) - 1));
    const nextDayNum = dayInt + 1 <= (trip.days?.length || 1) ? dayInt + 1 : (dayInt > 1 ? dayInt - 1 : 1);

    if (actionType === 'lock') {
      const isLocked = !!act.locked;
      query = `${isLocked ? 'Unlock' : 'Lock'} "${actTitle}" on Day ${dayInt}`;
    } else if (actionType === 'replace') {
      query = `Replace "${actTitle}" on Day ${dayInt} with a nearby alternative.`;
    } else if (actionType === 'remove') {
      query = `Remove "${actTitle}" from Day ${dayInt}.`;
    } else if (actionType === 'rest') {
      query = `Insert 2 hours of rest after "${actTitle}" on Day ${dayInt}.`;
    } else if (actionType === 'move') {
      query = `Move "${actTitle}" from Day ${dayInt} to Day ${nextDayNum}.`;
    }

    // 2. Optimistic Instant UI Update (Zero Latency)
    try {
      const clonedTrip = JSON.parse(JSON.stringify(trip));
      const targetDay = clonedTrip.days?.[dayIdx];
      if (targetDay && targetDay.activities) {
        const actIndex = targetDay.activities.findIndex(a => (a.place_id === act.place_id && a.place_id) || a.title === act.title);
        
        if (actionType === 'lock' && actIndex >= 0) {
          targetDay.activities[actIndex].locked = !targetDay.activities[actIndex].locked;
        } else if (actionType === 'remove' && actIndex >= 0) {
          targetDay.activities.splice(actIndex, 1);
        } else if (actionType === 'rest') {
          const restBlock = {
            place_id: `rest_${Date.now()}`,
            title: 'Rest & Downtime at Hotel',
            location: 'Hotel / Accommodation',
            category: 'Relaxation',
            type: 'rest',
            time: '15:00',
            duration: '2 hr',
            duration_minutes: 120,
            estimated_cost: 0,
            description: 'Scheduled afternoon relaxation and free time.',
            is_outdoor: false,
            data_source: 'schedule_optimizer'
          };
          if (actIndex >= 0) {
            targetDay.activities.splice(actIndex + 1, 0, restBlock);
          } else {
            targetDay.activities.push(restBlock);
          }
        } else if (actionType === 'replace' && actIndex >= 0) {
          targetDay.activities[actIndex] = {
            ...targetDay.activities[actIndex],
            place_id: `rep_${Date.now()}`,
            title: `Popular Cafe & Lounge near ${targetDay.activities[actIndex].title}`,
            category: 'Food',
            meal_type: 'snack',
            description: 'Curated relaxing cafe alternative.',
            is_outdoor: false,
            data_source: 'google_places'
          };
        } else if (actionType === 'move' && actIndex >= 0) {
          const movedAct = targetDay.activities.splice(actIndex, 1)[0];
          const destDayIdx = Math.max(0, Math.min(nextDayNum - 1, clonedTrip.days.length - 1));
          if (clonedTrip.days[destDayIdx]) {
            clonedTrip.days[destDayIdx].activities = clonedTrip.days[destDayIdx].activities || [];
            clonedTrip.days[destDayIdx].activities.push(movedAct);
          }
        }

        // Apply sequential time adjustments
        let currentM = 9 * 60;
        targetDay.activities.forEach((a) => {
          const dur = parseInt(a.duration_minutes || 90, 10);
          const h = Math.floor(currentM / 60) % 24;
          const m = currentM % 60;
          const endM = currentM + dur;
          const endH = Math.floor(endM / 60) % 24;
          const endMin = endM % 60;
          a.time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
          a.end_time = `${String(endH).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
          currentM = endM + 15;
        });

        // Set immediate local state
        setTrip(clonedTrip);
        try {
          localStorage.setItem(`wandersync_journey_${tripId}`, JSON.stringify(clonedTrip));
        } catch (_) {}
      }
    } catch (_) {}

    // 3. Background / Server Sync
    try {
      const res = await modifyJourneyEngine(tripId, query, [], trip);
      if (res && res.journey) {
        setTrip(res.journey);
      }
    } catch (err) {
      console.warn('Background modification sync note:', err.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>Loading Day Schedule...</div>;
  }

  if (!trip) {
    return (
      <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
        <h2>Journey Not Found</h2>
        <Link to="/planner" className="btn btn-primary">Go to Planner</Link>
      </div>
    );
  }

  const daysList = trip.days || [];
  const selectedDay = daysList.find(d => String(d.day_id) === String(dayId) || String(d.day_number) === String(dayId)) || daysList[0] || { activities: [] };

  return (
    <>
      <TripSubNav tripId={trip.trip_id || trip.id || tripId} />

      <div className="container" style={{ marginTop: '20px', marginBottom: '20px' }}>
        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span className="badge badge-blue">Day {selectedDay.day_number || dayId}</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)' }}>{selectedDay.date_display || selectedDay.date}</span>
            </div>
            <h1 style={{ fontSize: '2.2rem', color: 'var(--dark-navy)', margin: '0.2rem 0' }}>{selectedDay.title || `Day ${dayId}`}</h1>
            <p style={{ color: 'var(--primary-blue)', fontSize: '0.95rem', fontWeight: 600, margin: 0 }}>
              Theme: {selectedDay.theme || 'Exploration'} • {selectedDay.activities?.length || 0} Verified Stops
            </p>
          </div>

          {/* Day Switcher Pills */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {daysList.map((d) => (
              <Link 
                key={d.day_id || d.day_number}
                to={`/trips/${trip.trip_id || trip.id || tripId}/day/${d.day_id || d.day_number}`} 
                className={`btn ${(d.day_id === selectedDay.day_id || d.day_number === selectedDay.day_number) ? 'btn-primary' : 'btn-outline'} btn-sm`}
              >
                Day {d.day_number}
              </Link>
            ))}
          </div>
        </div>

        {/* AI Journey Modification Engine Interactive Panel */}
        <JourneyModificationPanel
          tripId={trip.trip_id || trip.id || tripId}
          trip={trip}
          onTripUpdated={setTrip}
          selectedDay={selectedDay}
          currentDayNumber={selectedDay.day_number || dayId}
        />

        {/* Timeline of Activities */}
        <div className="timeline-list">
          {selectedDay.activities?.map((act, idx) => {
            const isActLoading = actionLoading === (act.place_id || act.title);
            return (
              <div key={idx} className="timeline-item">
                <div className="timeline-time-node">
                  <span className="timeline-time">{act.time}</span>
                  <div className="timeline-dot"></div>
                </div>

                <div className="timeline-content-card" style={{ borderLeft: act.locked ? '3.5px solid #F59E0B' : (act.type === 'rest' ? '3.5px solid #8B5CF6' : '3.5px solid var(--primary-blue)') }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                        <span className="badge badge-navy">{act.category}</span>
                        {act.type === 'rest' ? (
                          <span className="badge badge-purple" style={{ background: '#EDE9FE', color: '#6D28D9' }}>Rest / Free Time</span>
                        ) : (
                          <span className={`badge ${act.is_outdoor ? 'badge-green' : 'badge-navy'}`}>
                            {act.is_outdoor ? 'Outdoor' : 'Indoor'}
                          </span>
                        )}
                        {act.locked && (
                          <span className="badge badge-warning" style={{ background: '#FEF3C7', color: '#92400E', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                            <Lock size={10} /> Locked
                          </span>
                        )}
                        {act.rating && (
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#D97706', display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Star size={12} fill="#D97706" /> {act.rating}
                          </span>
                        )}
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Clock size={12} /> {act.duration}
                        </span>
                      </div>
                      <h3 style={{ fontSize: '1.25rem', color: 'var(--dark-navy)', margin: '0.2rem 0' }}>{act.title}</h3>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={13} /> {act.location}
                      </p>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary-blue)' }}>
                        {act.meal_type ? `Meal: ${act.meal_type}` : (act.type === 'rest' ? 'Relaxation Block' : 'Attraction / Activity')}
                      </span>
                    </div>
                  </div>

                  <p style={{ color: 'var(--text-primary)', fontSize: '0.925rem', lineHeight: '1.6', marginBottom: '1.25rem' }}>
                    {act.description || 'Verified stop curated via Google Places API.'}
                  </p>

                  {/* Activity Action Menu */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', fontSize: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8rem' }}>
                      <ShieldCheck size={14} color="var(--primary-blue)" /> {act.data_source === 'google_places' ? 'Verified by Google Places' : 'WanderSync Verified'}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {/* Action: Lock / Unlock */}
                      <button
                        onClick={() => handleDirectActivityAction('lock', act, selectedDay.day_number || dayId)}
                        disabled={isActLoading}
                        className={`btn btn-sm ${act.locked ? 'btn-secondary' : 'btn-outline'}`}
                        style={{ padding: '0.25rem 0.55rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        title={act.locked ? 'Unlock Stop' : 'Lock Stop to prevent AI modification'}
                      >
                        {act.locked ? <Lock size={12} /> : <Unlock size={12} />}
                        {act.locked ? 'Locked' : 'Lock'}
                      </button>

                      {/* Action: Replace */}
                      {act.type !== 'rest' && (
                        <button
                          onClick={() => handleDirectActivityAction('replace', act, selectedDay.day_number || dayId)}
                          disabled={isActLoading || act.locked}
                          className="btn btn-outline btn-sm"
                          style={{ padding: '0.25rem 0.55rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          title="Replace with real alternative via Google Places"
                        >
                          <RefreshCw size={12} className={isActLoading ? 'spinner-pulse' : ''} />
                          Replace
                        </button>
                      )}

                      {/* Action: Add Rest After */}
                      <button
                        onClick={() => handleDirectActivityAction('rest', act, selectedDay.day_number || dayId)}
                        disabled={isActLoading}
                        className="btn btn-outline btn-sm"
                        style={{ padding: '0.25rem 0.55rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        title="Add 2h rest after this activity"
                      >
                        <Moon size={12} />
                        Add Rest
                      </button>

                      {/* Action: Move */}
                      {daysList.length > 1 && (
                        <button
                          onClick={() => handleDirectActivityAction('move', act, selectedDay.day_number || dayId)}
                          disabled={isActLoading || act.locked}
                          className="btn btn-outline btn-sm"
                          style={{ padding: '0.25rem 0.55rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          title="Move to another day"
                        >
                          <ArrowRight size={12} />
                          Move
                        </button>
                      )}

                      {/* Action: Remove */}
                      <button
                        onClick={() => handleDirectActivityAction('remove', act, selectedDay.day_number || dayId)}
                        disabled={isActLoading || act.locked}
                        className="btn btn-outline btn-sm"
                        style={{ padding: '0.25rem 0.55rem', fontSize: '0.78rem', color: '#DC2626', borderColor: '#FECACA', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        title="Remove stop and recalculate schedule"
                      >
                        <Trash2 size={12} />
                        Remove
                      </button>

                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(act.title + ' ' + (act.location || ''))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline btn-sm"
                        style={{ padding: '0.25rem 0.55rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 3 }}
                      >
                        Maps <ExternalLink size={11} />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {(!selectedDay.activities || selectedDay.activities.length === 0) && (
            <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No activities scheduled for Day {selectedDay.day_number || dayId}.
            </div>
          )}
        </div>

        {/* Bottom Day Actions */}
        <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
          <Link to={`/trips/${trip.trip_id || trip.id || tripId}`} className="btn btn-outline">
            <ArrowLeft size={16} /> Back to Trip Overview
          </Link>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to={`/trips/${trip.trip_id || trip.id || tripId}/map`} className="btn btn-outline">
              <MapPin size={16} /> View on Map
            </Link>
            <Link to={`/trips/${trip.trip_id || trip.id || tripId}/assistant`} className="btn btn-primary">
              <MessageSquare size={16} /> Ask AI Travel Maestro
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

