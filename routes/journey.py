"""
WanderSync Journey Routes
/api/journey/generate  — Start real async journey generation
/api/journey/<id>/status — Poll generation progress
/api/journey/<id>      — Fetch completed journey
/api/journey/<id>/modify — Chatbot-driven modification
"""
import uuid
import logging
import threading
from datetime import datetime
from decimal import Decimal
from flask import Blueprint, request, jsonify

journey_bp = Blueprint("journey", __name__, url_prefix="/api/journey")
logger = logging.getLogger(__name__)

# ── In-memory journey store ────────────────────────────────────────────────────
# Backend is source of truth.
# Frontend localStorage is a read-through cache only.
JOURNEY_STORE: dict = {}
_lock = threading.Lock()


def _set(trip_id: str, **kwargs):
    with _lock:
        if trip_id in JOURNEY_STORE:
            JOURNEY_STORE[trip_id].update(kwargs)


# ── Routes ────────────────────────────────────────────────────────────────────

@journey_bp.route("/generate", methods=["POST"])
def generate():
    data = request.get_json() or {}

    from utils.validation import validate_journey_request
    errors = validate_journey_request(data)
    if errors:
        return jsonify({"error": "Validation failed", "details": errors}), 400

    trip_id = str(uuid.uuid4())

    with _lock:
        JOURNEY_STORE[trip_id] = {
            "trip_id":            trip_id,
            "status":             "queued",
            "progress":           0,
            "generation_message": "Journey queued",
            "created_at":         datetime.utcnow().isoformat(),
            "user_input":         data,
            "error":              None,
            "journey":            None,
        }

    thread = threading.Thread(
        target=_generate_background,
        args=(trip_id, data),
        daemon=True,
        name=f"journey-{trip_id[:8]}",
    )
    thread.start()

    return jsonify({
        "trip_id": trip_id,
        "status":  "queued",
        "message": "Generation started. Poll /api/journey/{trip_id}/status",
    })


@journey_bp.route("/<trip_id>/status", methods=["GET"])
def status(trip_id):
    with _lock:
        entry = JOURNEY_STORE.get(trip_id)
    if not entry:
        return jsonify({"error": "Journey not found"}), 404

    resp = {
        "trip_id":  trip_id,
        "status":   entry["status"],
        "progress": entry["progress"],
        "message":  entry["generation_message"],
    }
    if entry.get("error"):
        resp["error"] = entry["error"]
    return jsonify(resp)


@journey_bp.route("/<trip_id>", methods=["GET"])
def get_journey(trip_id):
    with _lock:
        entry = JOURNEY_STORE.get(trip_id)
    if not entry:
        return jsonify({"error": "Journey not found"}), 404

    if entry["status"] != "completed":
        return jsonify({
            "trip_id":  trip_id,
            "status":   entry["status"],
            "progress": entry["progress"],
            "message":  entry["generation_message"],
            "error":    entry.get("error"),
        }), 202

    return jsonify(entry["journey"])


@journey_bp.route("/<trip_id>/modify", methods=["POST"])
@journey_bp.route("/<trip_id>/modify_engine", methods=["POST"])
def modify(trip_id):
    data = request.get_json(silent=True) or {}
    instruction = (data.get("instruction") or data.get("query") or "").strip()
    history = data.get("history", [])
    locked_ids = data.get("locked_activity_ids") or []
    client_journey = data.get("journey") or data.get("current_journey")

    if not instruction:
        return jsonify({"error": "instruction required"}), 400

    with _lock:
        entry = JOURNEY_STORE.get(trip_id)
        if not entry and client_journey and isinstance(client_journey, dict) and client_journey.get("days"):
            JOURNEY_STORE[trip_id] = {
                "trip_id": trip_id,
                "status": "completed",
                "progress": 100,
                "journey": client_journey
            }
            entry = JOURNEY_STORE[trip_id]

    if not entry or entry.get("status") != "completed" or not entry.get("journey"):
        if client_journey and isinstance(client_journey, dict) and client_journey.get("days"):
            entry = {"journey": client_journey, "status": "completed"}
        else:
            return jsonify({"error": "Journey not ready"}), 400

    journey = entry.get("journey", {})

    try:
        from services.journey_modification_service import modify_journey_engine
        from utils.journey_revision import get_revision_count
        success, updated_journey, changes, summary, err_msg = modify_journey_engine(
            trip_id=trip_id,
            journey=journey,
            instruction=instruction,
            locked_activity_ids=locked_ids
        )
        if success:
            _set(trip_id, journey=updated_journey)
            return jsonify({
                "success": True,
                "changes": changes,
                "journey": updated_journey,
                "summary": summary,
                "response": summary,
                "revisions_count": get_revision_count(trip_id),
                "trip_id": trip_id
            })
        else:
            return jsonify({
                "success": False,
                "error": err_msg or "Could not modify journey safely",
                "summary": err_msg,
                "response": err_msg or "Could not modify journey safely",
                "journey": journey,
                "trip_id": trip_id
            }), 422
    except Exception as e:
        logger.error(f"Modify failed: {e}")
        return jsonify({"error": f"AI modification service unavailable: {e}"}), 500


@journey_bp.route("/<trip_id>/validate", methods=["POST"])
def validate(trip_id):
    with _lock:
        entry = JOURNEY_STORE.get(trip_id)
    if not entry:
        return jsonify({"error": "Journey not found"}), 404
    if entry.get("status") != "completed" or not entry.get("journey"):
        return jsonify({"error": "Journey not ready for validation"}), 400

    try:
        from services.itinerary_validation_service import validate_itinerary
        result = validate_itinerary(entry["journey"])
        _set(trip_id, journey={**entry["journey"], "validation": result})
        return jsonify(result)
    except Exception as e:
        logger.error(f"Validation failed for {trip_id}: {e}")
        return jsonify({
            "confidence_score": 0,
            "confidence_level": "Unavailable",
            "summary": "Validation is temporarily unavailable. Your itinerary is still available.",
            "checks": [],
            "warnings": [],
        }), 200


@journey_bp.route("/<trip_id>/undo", methods=["POST"])
def undo(trip_id):
    from utils.journey_revision import get_revision_count, pop_revision
    with _lock:
        entry = JOURNEY_STORE.get(trip_id)
    if not entry:
        return jsonify({"success": False, "error": "Journey not found"}), 404
    prev = pop_revision(trip_id)
    if not prev:
        return jsonify({
            "success": False,
            "error": "No previous revisions available to undo.",
            "revisions_count": 0
        }), 400
    _set(trip_id, journey=prev)
    return jsonify({
        "success": True,
        "journey": prev,
        "message": "Previous itinerary restored.",
        "summary": "✓ Previous itinerary restored.",
        "revisions_count": get_revision_count(trip_id)
    }), 200


@journey_bp.route("/<trip_id>/revisions", methods=["GET"])
def revisions(trip_id):
    from utils.journey_revision import get_revision_count
    return jsonify({
        "trip_id": trip_id,
        "revisions_count": get_revision_count(trip_id)
    }), 200



# ── Background generation pipeline ────────────────────────────────────────────

def _generate_background(trip_id: str, params: dict):
    try:
        from services.google_places_service import search_destination, search_places_by_interests
        from services.ai_service import (
            generate_itinerary_openai, generate_itinerary_gemini_fallback,
            enrich_activity_descriptions,
        )
        from services.budget_service import (
            estimate_trip_cost, assess_budget, optimize_for_budget, serialize_breakdown,
        )
        from services.itinerary_service import merge_itinerary_with_places, build_fallback_schedule
        from services.personalization_service import record_journey, store_preference_embedding
        from utils.date_utils import calculate_trip_duration, get_display_dates
        from utils.money_utils import get_symbol, format_amount

        destination    = params.get("destination", "").strip()
        origin         = params.get("origin", "").strip()
        start_date     = params.get("start_date")
        end_date       = params.get("end_date")
        travelers      = int(params.get("travelers", 2))
        adults         = int(params.get("adults", travelers))
        children       = int(params.get("children", 0))
        budget         = Decimal(str(params.get("budget", 0)))
        currency       = params.get("currency", "USD").upper()
        travel_style   = params.get("travel_style", "Balanced")
        interests      = params.get("interests", ["Culture", "Food"])
        accommodation  = params.get("accommodation", "Any")
        transportation = params.get("transportation", "Any")

        # ── 1. Resolve destination ────────────────────────────────────────────
        _set(trip_id, status="resolving_destination", progress=10,
             generation_message=f"Resolving destination: {destination}")

        dest_place = search_destination(destination)
        if not dest_place:
            _set(trip_id, status="failed", progress=0,
                 error=f"Destination '{destination}' not found. Please check the name and try again.")
            return

        dest_location = dest_place.get("location", {})
        dest_name     = dest_place.get("name", destination)
        dest_address  = dest_place.get("address", destination)
        logger.info(f"[{trip_id[:8]}] Resolved: {dest_name} @ lat={dest_location.get('lat')}")

        # ── 2. Calculate duration (Python — never AI) ──────────────────────────
        duration  = calculate_trip_duration(start_date, end_date)
        nights    = duration["nights"]
        days      = duration["days"]
        disp_dates = get_display_dates(start_date, days)

        # ── 3. Discover real places from Google Places API ─────────────────────
        _set(trip_id, status="discovering_places", progress=25,
             generation_message=f"Discovering real places in {dest_name} via Google Places")

        places_by_interest = search_places_by_interests(
            destination_name=dest_name,
            location=dest_location,
            interests=interests,
            travel_style=travel_style,
            max_per_category=12,
        )

        total_places = sum(len(v) for v in places_by_interest.values())
        if total_places == 0:
            logger.info(f"[{trip_id[:8]}] Google Places returned 0 places — using AI itinerary engine to curate authentic experiences in {dest_name}")
            for cat in (interests or ["Culture", "Food", "Nature", "Adventure"]):
                if cat not in places_by_interest:
                    places_by_interest[cat] = []
        else:
            logger.info(f"[{trip_id[:8]}] {total_places} real places discovered via Google Places")

        # ── 4. OpenAI structured itinerary generation ──────────────────────────
        _set(trip_id, status="building_itinerary", progress=45,
             generation_message="Building personalized itinerary (OpenAI GPT-4o)")

        prefs = {
            "destination":   dest_name,
            "origin":        origin,
            "travelers":     travelers,
            "adults":        adults,
            "children":      children,
            "travel_style":  travel_style,
            "interests":     interests,
            "accommodation": accommodation,
            "transportation": transportation,
        }
        date_params = {
            "start_date": start_date,
            "end_date":   end_date,
            "nights":     nights,
            "days":       days,
        }

        ai_schedule = generate_itinerary_openai(places_by_interest, prefs, date_params)
        ai_provider = "OpenAI GPT-4o"

        if not ai_schedule:
            logger.warning(f"[{trip_id[:8]}] OpenAI failed — trying Gemini fallback")
            _set(trip_id, generation_message="OpenAI unavailable — using Gemini AI fallback")
            ai_schedule = generate_itinerary_gemini_fallback(places_by_interest, prefs, date_params)
            ai_provider = "Google Gemini (fallback)"

        # ── 5. Merge AI schedule with real place data ─────────────────────────
        if ai_schedule and ai_schedule.get("days"):
            merged_days = merge_itinerary_with_places(
                ai_schedule=ai_schedule,
                places_by_category=places_by_interest,
                display_dates=disp_dates,
                destination_location=dest_location,
            )
        else:
            logger.warning(f"[{trip_id[:8]}] Both AI providers failed — using fallback schedule")
            ai_provider = "WanderSync Fallback Engine"
            merged_days = build_fallback_schedule(
                places_by_category=places_by_interest,
                days=days,
                display_dates=disp_dates,
                travel_style=travel_style,
            )

        # Pad if AI returned fewer days than requested
        while len(merged_days) < days:
            n = len(merged_days) + 1
            merged_days.append({
                "day_number": n, "day_id": str(n),
                "date": disp_dates[n-1] if n-1 < len(disp_dates) else "",
                "date_display": disp_dates[n-1] if n-1 < len(disp_dates) else "",
                "title": f"Day {n} — Free Exploration",
                "theme": "Leisure",
                "activities": [], "activities_count": 0,
                "estimated_cost": 0, "travel_distance": "N/A",
            })
        merged_days = merged_days[:days]

        # ── 6. Python budget engine (Decimal) ─────────────────────────────────
        _set(trip_id, status="calculating_budget", progress=65,
             generation_message="Calculating budget breakdown (Python engine)")

        breakdown = estimate_trip_cost(
            destination=dest_name,
            nights=nights,
            days=days,
            travelers=travelers,
            travel_style=travel_style,
            currency=currency,
        )

        # ── 7. Budget assessment + optimization ───────────────────────────────
        _set(trip_id, status="optimizing", progress=75,
             generation_message="Verifying budget constraints")

        assessment = assess_budget(budget, breakdown["total"], currency)

        if assessment["status"] == "over_budget":
            _set(trip_id, generation_message="Over budget — optimizing itinerary")
            breakdown = optimize_for_budget(breakdown, budget, max_attempts=3)
            assessment = assess_budget(budget, breakdown["total"], currency)

        # ── 8. Gemini personalization + descriptions ───────────────────────────
        _set(trip_id, status="personalizing", progress=88,
             generation_message="Personalizing your experience (Gemini AI)")

        merged_days = enrich_activity_descriptions(merged_days, dest_name, travel_style)

        # ── 9. Record for personalization ──────────────────────────────────────
        user_id = "guest"
        record_journey(user_id, dest_name, interests, travel_style, destination)

        # Store embedding asynchronously (non-blocking)
        embedding_thread = threading.Thread(
            target=store_preference_embedding,
            args=(user_id, f"{dest_name} {travel_style} {' '.join(interests)}"),
            daemon=True,
        )
        embedding_thread.start()

        # ── 10. Build warnings ─────────────────────────────────────────────────
        warnings = []
        if assessment["status"] == "over_budget":
            warnings.append({
                "type": "over_budget",
                "message": (
                    f"Estimated cost ({format_amount(float(assessment['estimated_total']), currency)}) "
                    f"exceeds your budget ({format_amount(float(budget), currency)}) "
                    f"by {format_amount(float(assessment['over_amount']), currency)}. "
                    f"We've optimized where possible. Consider a longer timeframe or higher budget."
                ),
            })
        if assessment["status"] == "over_budget" and not assessment["is_feasible"]:
            warnings.append({
                "type": "infeasible",
                "message": (
                    f"This trip may not realistically fit within your budget for {dest_name}. "
                    f"Consider a shorter trip, fewer travelers, or a higher budget."
                ),
            })

        # ── 11. Collect places used ────────────────────────────────────────────
        seen_ids: set = set()
        places_used = []
        for day in merged_days:
            for act in day.get("activities", []):
                pid = act.get("place_id", "")
                if pid and pid not in seen_ids:
                    seen_ids.add(pid)
                    places_used.append({
                        "place_id":    pid,
                        "name":        act.get("title"),
                        "address":     act.get("location"),
                        "coordinates": act.get("coordinates"),
                        "category":    act.get("category"),
                        "rating":      act.get("rating"),
                        "data_source": "google_places",
                    })

        # ── 12. Assemble final journey object ──────────────────────────────────
        sym = get_symbol(currency)
        title = (ai_schedule.get("itinerary_title") if ai_schedule
                 else f"{dest_name} Journey")

        # ── 13. Run itinerary validation ────────────────────────────────────────
        from services.itinerary_validation_service import validate_itinerary

        journey = {
            # Core identifiers
            "trip_id":    trip_id,
            "id":         trip_id,
            "created_at": datetime.utcnow().isoformat(),
            "status":     "completed",

            # Trip parameters
            "trip": {
                "destination":          dest_address or dest_name,
                "destination_short":    dest_name,
                "destination_place_id": dest_place.get("place_id"),
                "destination_location": dest_location,
                "origin":               origin,
                "start_date":           start_date,
                "end_date":             end_date,
                "start_date_display":   duration["start_date_display"],
                "end_date_display":     duration["end_date_display"],
                "dates_display":        duration["dates_short"],
                "days":                 days,
                "nights":               nights,
                "duration":             f"{days} Days / {nights} Nights",
                "travelers":            travelers,
                "adults":               adults,
                "children":             children,
                "budget":               float(budget),
                "currency":             currency,
                "currency_symbol":      sym,
                "travel_style":         travel_style,
                "interests":            interests,
                "accommodation":        accommodation,
                "transportation":       transportation,
            },

            # Budget summary
            "summary": {
                "estimated_total":     float(breakdown["total"]),
                "target_budget":       float(budget),
                "remaining_budget":    float(assessment["remaining"]),
                "status":              assessment["status"],
                "percent_used":        assessment["percent_used"],
                "over_amount":         float(assessment.get("over_amount", 0)),
                "optimization_applied": breakdown.get("optimization_applied", False),
                "currency":            currency,
                "currency_symbol":     sym,
            },

            # Full budget breakdown
            "budget_breakdown": {
                **serialize_breakdown(breakdown),
                "target_budget": float(budget),
            },

            # Daily itinerary
            "days": merged_days,

            # Metadata
            "places_used":  places_used,
            "warnings":     warnings,
            "sources": {
                "places":      "Google Places API (Real World Data)",
                "itinerary":   ai_provider,
                "chatbot":     "Google Gemini AI",
                "budget":      "WanderSync Python Budget Engine (Decimal)",
                "embeddings":  "OpenAI text-embedding-3-small",
            },

            # Legacy fields for existing UI components
            "title":                title,
            "destination":          dest_address or dest_name,
            "country":              dest_name.split(",")[-1].strip() if "," in dest_name else dest_name,
            "dates":                f"{start_date} - {end_date}",
            "duration_days":        days,
            "travelers":            f"{travelers} {'Traveler' if travelers == 1 else 'Travelers'}",
            "travel_style":         travel_style,
            "pace":                 travel_style,
            "budget_tier":          travel_style,
            "total_estimated_cost": float(breakdown["total"]),
            "currency_code":        currency,
            "currency":             sym,
            "optimization_score":   _opt_score(assessment, merged_days),
            "summary_text":         (
                f"A {days}-day {travel_style.lower()} journey to {dest_name} "
                f"for {travelers} traveler{'s' if travelers > 1 else ''}."
            ),
        }

        # Run validation on the assembled journey
        try:
            validation_result = validate_itinerary(journey)
            journey["validation"] = validation_result
        except Exception as ve:
            logger.warning(f"[{trip_id[:8]}] Validation failed: {ve}")
            journey["validation"] = {
                "confidence_score": 0,
                "confidence_level": "Unavailable",
                "summary": "Validation is temporarily unavailable.",
                "checks": [],
                "warnings": [],
            }

        _set(trip_id,
             status="completed",
             progress=100,
             generation_message="Your journey is ready!",
             journey=journey)

        logger.info(f"[{trip_id[:8]}] Generation complete — {days} days, "
                    f"{len(places_used)} real places, budget status: {assessment['status']}")

    except Exception as e:
        msg = str(e)
        logger.error(f"[{trip_id[:8]}] Generation failed: {msg}", exc_info=True)

        # Provide a user-friendly error
        if "API" in msg or "quota" in msg.lower() or "rate" in msg.lower():
            user_msg = "An API service is temporarily unavailable. Please try again in a moment."
        elif "destination" in msg.lower() or "found" in msg.lower():
            user_msg = f"Could not find destination '{params.get('destination', '')}'. Please check the name."
        elif "date" in msg.lower():
            user_msg = "Invalid dates. Please check your travel dates."
        else:
            user_msg = "Journey generation failed. Please try again."

        _set(trip_id, status="failed", progress=0, error=user_msg)


# ── Context builder for chatbot ───────────────────────────────────────────────

def build_journey_context(journey: dict) -> str:
    """Build human-readable context string for AI chatbot."""
    if not journey:
        return ""
    t = journey.get("trip", {})
    s = journey.get("summary", {})
    b = journey.get("budget_breakdown", {})
    cur = t.get("currency", "")
    sym = t.get("currency_symbol", "")

    lines = [
        f"DESTINATION: {t.get('destination')}",
        f"ORIGIN: {t.get('origin', 'N/A')}",
        f"DATES: {t.get('start_date')} to {t.get('end_date')} ({t.get('days')} days, {t.get('nights')} nights)",
        f"TRAVELERS: {t.get('travelers')} ({t.get('adults')} adults, {t.get('children')} children)",
        f"TRAVEL STYLE: {t.get('travel_style')}",
        f"INTERESTS: {', '.join(t.get('interests', []))}",
        f"USER BUDGET: {sym}{t.get('budget'):,.0f} {cur}",
        f"ESTIMATED COST: {sym}{s.get('estimated_total', 0):,.0f} {cur}",
        f"BUDGET STATUS: {s.get('status')} | Remaining: {sym}{s.get('remaining_budget', 0):,.0f} {cur}",
        "",
        "BUDGET BREAKDOWN:",
        f"  Accommodation:  {sym}{b.get('accommodation', 0):,.0f}",
        f"  Food:           {sym}{b.get('food', 0):,.0f}",
        f"  Transportation: {sym}{b.get('transportation', 0):,.0f}",
        f"  Activities:     {sym}{b.get('activities', 0):,.0f}",
        f"  Miscellaneous:  {sym}{b.get('miscellaneous', 0):,.0f}",
        f"  TOTAL:          {sym}{b.get('total', 0):,.0f}",
        "",
        "ITINERARY:",
    ]

    for day in journey.get("days", []):
        lines.append(f"\nDay {day['day_number']} — {day.get('title')} ({day.get('date_display', day.get('date', ''))})")
        for act in day.get("activities", []):
            cost = act.get("estimated_cost", 0)
            cost_str = f"${cost}/person" if cost else "Free/included"
            lines.append(f"  {act.get('time')} - {act.get('title')} @ {act.get('location', 'N/A')} ({cost_str})")
            if act.get("rating"):
                lines[-1] += f" [Rating: {act['rating']}]"

    return "\n".join(lines)


def _opt_score(assessment: dict, days: list) -> int:
    base = 95 if assessment["status"] == "within_budget" else max(50, 85 - int(assessment.get("percent_used", 100) - 100))
    acts = sum(d.get("activities_count", 0) for d in days)
    return min(100, base + (5 if acts >= len(days) * 3 else 0))


def serialize_breakdown(breakdown: dict) -> dict:
    from decimal import Decimal as _D
    return {k: float(v) if isinstance(v, _D) else v for k, v in breakdown.items()}
