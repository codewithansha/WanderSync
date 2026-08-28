import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchTrip } from '../services/api';
import TripSubNav from '../components/TripSubNav';
import { DollarSign, TrendingDown, PieChart, PlusCircle, AlertTriangle, CheckCircle, ShieldCheck, Info } from 'lucide-react';

export default function TripBudget() {
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

  if (loading) return <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>Loading Budget...</div>;
  if (!trip) return (
    <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
      <h2>Journey Not Found</h2>
      <Link to="/planner" className="btn btn-primary" style={{ marginTop: '1rem' }}>Go to Planner</Link>
    </div>
  );

  const b = trip.budget_breakdown || {};
  const s = trip.summary || {};
  const sym = trip.trip?.currency_symbol || trip.currency || '$';
  const cur = trip.trip?.currency || trip.currency_code || 'USD';
  
  const targetBudget = b.target_budget || trip.trip?.budget || s.target_budget || 1;
  const totalEstimated = b.total || s.estimated_total || 0;
  const remaining = s.remaining_budget !== undefined ? s.remaining_budget : (targetBudget - totalEstimated);
  const isOver = s.status === 'over_budget' || remaining < 0;
  const spentPct = targetBudget > 0 ? Math.min(200, Math.round((totalEstimated / targetBudget) * 100)) : 100;
  const durationDays = trip.trip?.days || trip.duration_days || (trip.days?.length || 1);

  const categories = [
    { label: 'Accommodation', amount: b.accommodation || 0, color: '#0B5ED7' },
    { label: 'Food & Dining', amount: b.food || 0, color: '#F59E0B' },
    { label: 'Transportation', amount: b.transportation || 0, color: '#10B981' },
    { label: 'Activities & Attractions', amount: b.activities || 0, color: '#8B5CF6' },
    { label: 'Miscellaneous & Contingency', amount: (b.miscellaneous || 0) + (b.contingency || 0), color: '#64748B' },
  ].map(cat => ({
    ...cat,
    pct: targetBudget > 0 ? Math.round((cat.amount / targetBudget) * 100) : 0
  }));

  return (
    <>
      <TripSubNav tripId={trip.trip_id || trip.id || tripId} />

      <div className="container" style={{ marginTop: '20px', marginBottom: '20px' }}>
        {/* Over-budget or Optimized Notice */}
        {isOver ? (
          <div style={{
            background: '#FEF2F2',
            border: '1.5px solid #FCA5A5',
            borderRadius: '12px',
            padding: '1.25rem 1.5rem',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1rem'
          }}>
            <AlertTriangle size={24} color="#DC2626" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 700, color: '#991B1B', marginBottom: '0.25rem', fontSize: '1rem' }}>
                Budget Constraint Notice — Over Target Budget
              </div>
              <div style={{ color: '#B91C1C', fontSize: '0.875rem', lineHeight: '1.5' }}>
                Estimated total ({sym}{totalEstimated.toLocaleString()} {cur}) exceeds your target budget of {sym}{targetBudget.toLocaleString()} {cur} by {sym}{Math.abs(remaining).toLocaleString()} {cur}.
                {b.optimization_applied && ' WanderSync applied automated budget optimization to reduce activity and accommodation allocations.'}
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            background: '#F0FDF4',
            border: '1.5px solid #86EFAC',
            borderRadius: '12px',
            padding: '1rem 1.25rem',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <ShieldCheck size={20} color="#16A34A" />
            <div style={{ color: '#166534', fontSize: '0.9rem', fontWeight: 600 }}>
              Calculations verified by WanderSync Python Decimal Engine. Within target budget.
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', color: 'var(--dark-navy)', margin: '0 0 0.25rem' }}>Budget Planner</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0 }}>
              Deterministic cost breakdown for {trip.trip?.destination || trip.destination}
            </p>
          </div>
          <Link to={`/trips/${trip.trip_id || trip.id || tripId}/assistant`} className="btn btn-primary">
            Ask AI to Reduce Budget
          </Link>
        </div>

        {/* Budget Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
          <div className="card" style={{ textAlign: 'center', padding: '1.75rem', border: '1px solid var(--border-focus)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Total Estimated</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--dark-navy)' }}>{sym}{totalEstimated.toLocaleString()}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>target: {sym}{targetBudget.toLocaleString()} {cur}</div>
          </div>

          <div className="card" style={{ textAlign: 'center', padding: '1.75rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              {isOver ? 'Over Budget' : 'Remaining'}
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: isOver ? '#DC2626' : 'var(--secondary-green)' }}>
              {isOver ? `+${sym}${Math.abs(remaining).toLocaleString()}` : `${sym}${remaining.toLocaleString()}`}
            </div>
            <div style={{ fontSize: '0.85rem', color: isOver ? '#DC2626' : 'var(--secondary-green)', fontWeight: 600 }}>
              {isOver ? 'Exceeds Target' : 'Under Budget'}
            </div>
          </div>

          <div className="card" style={{ textAlign: 'center', padding: '1.75rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Daily Average</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--dark-navy)' }}>
              {sym}{Math.round(totalEstimated / durationDays).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>per day ({durationDays} days)</div>
          </div>

          <div className="card" style={{ textAlign: 'center', padding: '1.75rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Budget Usage</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: spentPct > 100 ? '#DC2626' : spentPct > 85 ? '#D97706' : 'var(--primary-blue)' }}>
              {spentPct}%
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>of target allocation</div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.4rem', color: 'var(--dark-navy)', marginBottom: '1.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PieChart size={20} /> Category Breakdown
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {categories.map((cat, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{ width: 14, height: 14, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
                    <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--dark-navy)' }}>{cat.label}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--dark-navy)' }}>{sym}{cat.amount.toLocaleString()}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>{cat.pct}%</span>
                  </div>
                </div>
                <div style={{ height: 10, background: 'var(--border-color)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min(100, cat.pct)}%`,
                    background: cat.color,
                    borderRadius: 'var(--radius-full)',
                    transition: 'width 0.8s ease'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Estimation Disclaimer */}
        <div style={{ padding: '1rem', border: '1px dashed var(--border-color)', borderRadius: '10px', color: 'var(--text-muted)', fontSize: '0.82rem', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
          <Info size={15} color="var(--primary-blue)" style={{ flexShrink: 0 }} /> Accommodation and transit rates are calculated using regional indices and style multiplier rules. Live airline and hotel booking inventories require direct provider checkout.
        </div>
      </div>
    </>
  );
}
