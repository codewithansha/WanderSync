/**
 * WanderSync API Service
 * All communication between React and Flask backend.
 * API keys are NEVER exposed here — they live in .env server-side.
 */

const API_BASE = "/api";
const DEFAULT_TIMEOUT = 15000;
const GENERATION_TIMEOUT = 60000;

// ── Core fetch wrapper ──────────────────────────────────────────────────────

async function apiFetch(url, options = {}, timeout = DEFAULT_TIMEOUT) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, {
      ...options,
      credentials: "include",
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      let errBody = {};
      try { errBody = await res.json(); } catch (_) {}
      throw new Error(
        errBody.error || errBody.details?.[0] || `Request failed (${res.status})`
      );
    }
    return res.json();
  } catch (err) {
    clearTimeout(timer);
    if (err.name === "AbortError") throw new Error("Request timed out. Please try again.");
    throw err;
  }
}

function post(url, body, timeout) {
  return apiFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }, timeout);
}

// ── Journey Generation ───────────────────────────────────────────────────────

/**
 * Start async journey generation.
 * @param {Object} formData — full planner form payload
 * @returns {Promise<{trip_id: string, status: string}>}
 */
export async function generateJourney(formData) {
  return post(`${API_BASE}/journey/generate`, formData, GENERATION_TIMEOUT);
}

/**
 * Poll generation status.
 * @param {string} tripId
 * @returns {Promise<{status: string, progress: number, message: string, error?: string}>}
 */
export async function getJourneyStatus(tripId) {
  return apiFetch(`${API_BASE}/journey/${tripId}/status`, {}, 10000);
}

/**
 * Fetch completed journey.
 * Backend is source of truth; localStorage is a read-through cache.
 * @param {string} tripId
 */
export async function fetchTrip(tripId) {
  if (!tripId) return null;

  // Try localStorage cache first for instant UI
  let cached = null;
  try {
    const raw = localStorage.getItem(`wandersync_journey_${tripId}`);
    if (raw) cached = JSON.parse(raw);
  } catch (_) {}

  try {
    const data = await apiFetch(`${API_BASE}/journey/${tripId}`, {}, 12000);
    if (data && (data.status === "completed" || data.days)) {
      // Backend is source of truth — update cache
      try {
        localStorage.setItem(`wandersync_journey_${tripId}`, JSON.stringify(data));
      } catch (_) {}
      return data;
    }
    // Journey not yet complete — return cached while backend works
    return cached || data;
  } catch (err) {
    // Network error — fall back to cache with warning
    console.warn("Backend fetch failed, using localStorage cache:", err.message);
    if (cached) return cached;
    throw err;
  }
}

/**
 * Request a chatbot-driven modification to a journey.
 */
export async function modifyJourney(tripId, instruction, history = []) {
  return post(`${API_BASE}/journey/${tripId}/modify`, { instruction, history }, 35000);
}

// ── Itinerary Validation ────────────────────────────────────────────────────

/**
 * Validate a completed itinerary and return confidence score + checks.
 * @param {string} tripId
 * @returns {Promise<Object>}
 */
export async function validateItinerary(tripId) {
  return post(`${API_BASE}/journey/${tripId}/validate`, {}, 15000);
}

// ── Places ────────────────────────────────────────────────────────────────────

/**
 * Destination autocomplete via Google Places API (proxied through Flask).
 */
export async function autocompleteDestination(query) {
  if (!query || query.length < 2) return [];
  try {
    return await apiFetch(
      `${API_BASE}/places/autocomplete?q=${encodeURIComponent(query)}`,
      {},
      6000,
    );
  } catch (_) {
    return [];
  }
}

/**
 * Fetch the curated destination catalog for the Explore page.
 * Results are enriched with real Google Places data and cached on the server.
 * @returns {Promise<Array>}
 */
export async function fetchDestinations() {
  try {
    return await apiFetch(`${API_BASE}/places/destinations`, {}, 30000);
  } catch (err) {
    console.warn("fetchDestinations failed:", err.message);
    return [];
  }
}

/**
 * Search destinations live via Google Places (used by Explore search bar for
 * destinations not in the curated catalog).
 * @param {string} query
 * @returns {Promise<Array>}
 */
export async function searchDestinations(query) {
  if (!query || query.length < 2) return [];
  try {
    return await apiFetch(
      `${API_BASE}/places/search?q=${encodeURIComponent(query)}`,
      {},
      12000,
    );
  } catch (_) {
    return [];
  }
}

// ── Chat ──────────────────────────────────────────────────────────────────────

/**
 * Send a message to the context-aware AI chatbot.
 */
export async function sendChatMessage({ query, tripId, history = [], pdfContext = "" }) {
  return post(
    `${API_BASE}/chat`,
    { query, trip_id: tripId, history, pdf_context: pdfContext },
    35000,
  );
}

/**
 * Send an image with a message.
 */
export async function sendChatWithImage({ query, imageFile, tripId }) {
  const form = new FormData();
  form.append("query", query);
  form.append("image", imageFile);
  if (tripId) form.append("trip_id", tripId);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 35000);
  try {
    const res = await fetch(`${API_BASE}/chat_with_image`, {
      method: "POST",
      credentials: "include",
      body: form,
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`Upload failed (${res.status})`);
    return res.json();
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

/**
 * Upload and extract text from a PDF document.
 */
export async function uploadPdfDocument(file) {
  const form = new FormData();
  form.append("pdf", file);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 35000);
  try {
    const res = await fetch(`${API_BASE}/upload_pdf`, {
      method: "POST",
      credentials: "include",
      body: form,
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`Upload failed (${res.status})`);
    return res.json();
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

/**
 * Translate text via the AI chat tools endpoint.
 */
export async function translateText({ text, targetLanguage }) {
  return post(
    `${API_BASE}/chat`,
    { operation: "translate", text, target_language: targetLanguage },
    35000,
  );
}

/**
 * Optimize text via the AI chat tools endpoint.
 */
export async function optimizeText({ text, style }) {
  return post(
    `${API_BASE}/chat`,
    { operation: "optimize", text, style },
    35000,
  );
}

// ── Authentication & User Session ───────────────────────────────────────────

/**
 * Register a new user account (supports both plain object and FormData with avatar image).
 */
export async function registerUser(payload) {
  if (payload instanceof FormData) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 35000);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        credentials: "include",
        body: payload,
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) {
        let errBody = {};
        try { errBody = await res.json(); } catch (_) {}
        throw new Error(errBody.error || `Registration failed (${res.status})`);
      }
      return res.json();
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  }

  return post(`${API_BASE}/auth/register`, payload);
}

/**
 * Upload or replace the authenticated user's profile avatar photo.
 * @param {File} imageFile
 */
export async function uploadProfilePhoto(imageFile) {
  const form = new FormData();
  form.append("profile_image", imageFile);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 35000);
  try {
    const res = await fetch(`${API_BASE}/auth/profile/photo`, {
      method: "POST",
      credentials: "include",
      body: form,
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      let errBody = {};
      try { errBody = await res.json(); } catch (_) {}
      throw new Error(errBody.error || `Upload failed (${res.status})`);
    }
    return res.json();
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

/**
 * Remove the authenticated user's profile avatar photo.
 */
export async function removeProfilePhoto() {
  return apiFetch(`${API_BASE}/auth/profile/photo`, {
    method: "DELETE",
  });
}

/**
 * Log in with existing credentials.
 */
export async function loginUser({ email, password }) {
  return post(`${API_BASE}/auth/login`, { email, password });
}

/**
 * Log out and clear current server session.
 */
export async function logoutUser() {
  return post(`${API_BASE}/auth/logout`, {});
}

/**
 * Check active session and get current authenticated user data.
 */
export async function getAuthMe() {
  try {
    return await apiFetch(`${API_BASE}/auth/me`, {}, 5000);
  } catch (_) {
    return { authenticated: false, user: null };
  }
}

/**
 * Update authenticated user profile fields.
 */
export async function updateUserProfile(profileData) {
  return apiFetch(`${API_BASE}/auth/profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profileData),
  });
}

// ── Saved Journeys / History ────────────────────────────────────────────────

/**
 * Save a journey to the authenticated user's MongoDB account.
 */
export async function saveUserTrip(tripId, tripData) {
  return post(`${API_BASE}/user/saved-trips`, {
    trip_id: tripId,
    trip: tripData,
  });
}

/**
 * Fetch all journeys saved by the current user.
 */
export async function fetchSavedTrips() {
  return apiFetch(`${API_BASE}/user/saved-trips`, {}, 10000);
}

/**
 * Delete a saved journey by ID.
 */
export async function deleteSavedTrip(tripId) {
  return apiFetch(`${API_BASE}/user/saved-trips/${tripId}`, {
    method: "DELETE",
  });
}

// ── Legacy / Health ──────────────────────────────────────────────────────────

export async function fetchUser() {
  try {
    const auth = await getAuthMe();
    if (auth.authenticated && auth.user) return auth.user;
    return await apiFetch(`${API_BASE}/user`, {}, 5000);
  } catch (_) {
    return { name: "Explorer", trips_count: 0, saved_places: 0, countries_explored: 0 };
  }
}

export async function checkHealth() {
  try {
    return await apiFetch(`${API_BASE}/health`, {}, 5000);
  } catch (_) {
    return { status: "unknown" };
  }
}
