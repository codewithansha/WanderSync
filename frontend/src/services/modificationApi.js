/**
 * WanderSync AI Journey Modification Engine API Service
 * Handles live modifications, revision history, and undo requests.
 */

const API_BASE = '/api';

/**
 * Request a structural natural-language modification to an itinerary.
 * @param {string} tripId
 * @param {string} instruction
 * @param {Array<string>} lockedActivityIds
 * @returns {Promise<{success: boolean, changes: Array, journey: Object, summary: string, revisions_count: number}>}
 */
export async function modifyJourneyEngine(tripId, instruction, lockedActivityIds = [], currentJourney = null) {
  if (!tripId || !instruction) {
    throw new Error('Trip ID and modification instruction are required.');
  }

  // Load from cache if not passed
  let journeyToPass = currentJourney;
  if (!journeyToPass) {
    try {
      const raw = localStorage.getItem(`wandersync_journey_${tripId}`);
      if (raw) journeyToPass = JSON.parse(raw);
    } catch (_) {}
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45000);

  const payload = {
    instruction: instruction.trim(),
    locked_activity_ids: lockedActivityIds,
    journey: journeyToPass
  };

  try {
    let res = await fetch(`${API_BASE}/journey/${tripId}/modify_engine`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    // Fallback to /modify if /modify_engine is 404
    if (res.status === 404) {
      res = await fetch(`${API_BASE}/journey/${tripId}/modify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
        signal: controller.signal
      });
    }

    clearTimeout(timer);

    const rawText = await res.text();
    let data = {};
    try {
      data = rawText ? JSON.parse(rawText) : {};
    } catch (jsonErr) {
      throw new Error(`Server returned unexpected response (${res.status}): ${rawText.slice(0, 100)}`);
    }

    if (!res.ok || data.success === false) {
      throw new Error(data.error || data.summary || `Failed to modify journey (${res.status})`);
    }

    // Sync to localStorage read-through cache
    if (data.journey) {
      try {
        localStorage.setItem(`wandersync_journey_${tripId}`, JSON.stringify(data.journey));
      } catch (_) {}
    }

    return data;
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      throw new Error('Modification request timed out. Please try again.');
    }
    throw err;
  }
}

/**
 * Undo the most recent journey modification.
 * @param {string} tripId
 * @returns {Promise<{success: boolean, journey: Object, message: string, revisions_count: number}>}
 */
export async function undoJourneyModification(tripId) {
  if (!tripId) throw new Error('Trip ID required.');

  try {
    const res = await fetch(`${API_BASE}/journey/${tripId}/undo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({})
    });

    const rawText = await res.text();
    let data = {};
    try {
      data = rawText ? JSON.parse(rawText) : {};
    } catch (_) {
      throw new Error(`Server returned unexpected response (${res.status})`);
    }

    if (!res.ok || data.success === false) {
      throw new Error(data.error || 'No previous revision available to undo.');
    }

    if (data.journey) {
      try {
        localStorage.setItem(`wandersync_journey_${tripId}`, JSON.stringify(data.journey));
      } catch (_) {}
    }

    return data;
  } catch (err) {
    throw err;
  }
}

/**
 * Get available undo revision count for the trip.
 * @param {string} tripId
 * @returns {Promise<{revisions_count: number}>}
 */
export async function fetchJourneyRevisions(tripId) {
  if (!tripId) return { revisions_count: 0 };
  try {
    const res = await fetch(`${API_BASE}/journey/${tripId}/revisions`, {
      credentials: 'include'
    });
    if (!res.ok) return { revisions_count: 0 };
    const rawText = await res.text();
    return rawText ? JSON.parse(rawText) : { revisions_count: 0 };
  } catch (_) {
    return { revisions_count: 0 };
  }
}
