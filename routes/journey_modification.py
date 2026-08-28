"""
WanderSync Journey Modification Routes
Dedicated, isolated blueprint for journey modifications, undo history, and schedule revisions.
"""
import logging
from flask import Blueprint, request, jsonify, session
from routes.journey import JOURNEY_STORE, _lock, _set
from utils.journey_revision import get_revision_count, pop_revision
from services.journey_modification_service import modify_journey_engine

modification_bp = Blueprint("journey_modification", __name__, url_prefix="/api/journey")
logger = logging.getLogger(__name__)


@modification_bp.route("/<trip_id>/modify_engine", methods=["POST"])
@modification_bp.route("/<trip_id>/modify", methods=["POST"])
def modify_journey_endpoint(trip_id: str):
    """
    Apply natural-language modifications to an active journey.
    """
    data = request.get_json(silent=True) or {}
    instruction = (data.get("instruction") or data.get("query") or "").strip()
    locked_ids = data.get("locked_activity_ids") or data.get("lock_ids") or []
    client_journey = data.get("journey") or data.get("current_journey")
    
    if not instruction:
        return jsonify({"success": False, "error": "Instruction is required"}), 400

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
        
    if not entry:
        return jsonify({"success": False, "error": "Journey not found"}), 404
    if entry.get("status") != "completed" or not entry.get("journey"):
        if client_journey and isinstance(client_journey, dict) and client_journey.get("days"):
            entry["journey"] = client_journey
            entry["status"] = "completed"
        else:
            return jsonify({"success": False, "error": "Journey is not yet ready for modification"}), 400

    current_journey = entry["journey"]
    
    try:
        success, updated_journey, changes, summary, err_msg = modify_journey_engine(
            trip_id=trip_id,
            journey=current_journey,
            instruction=instruction,
            locked_activity_ids=locked_ids
        )
        
        if not success:
            return jsonify({
                "success": False,
                "error": err_msg or "Modification could not be safely applied.",
                "summary": err_msg,
                "journey": current_journey
            }), 422

        # Update in-memory store
        _set(trip_id, journey=updated_journey)
        
        # If user is logged in, optionally sync to saved MongoDB collection if present
        user_id = session.get("user_id")
        if user_id:
            try:
                from database.mongodb import get_db
                db = get_db()
                if db is not None:
                    db.saved_trips.update_one(
                        {"user_id": user_id, "trip_id": trip_id},
                        {"$set": {"trip": updated_journey, "updated_at": updated_journey.get("created_at")}},
                        upsert=False
                    )
            except Exception as db_err:
                logger.warning(f"Could not persist modified journey to MongoDB for user {user_id}: {db_err}")

        return jsonify({
            "success": True,
            "changes": changes,
            "journey": updated_journey,
            "summary": summary,
            "revisions_count": get_revision_count(trip_id),
            "response": summary # Backward compatibility with chatbot queries
        }), 200

    except Exception as e:
        logger.error(f"[{trip_id[:8]}] Modification execution failed: {e}", exc_info=True)
        return jsonify({
            "success": False,
            "error": f"Modification engine encountered an issue: {str(e)}",
            "journey": current_journey
        }), 500


@modification_bp.route("/<trip_id>/undo", methods=["POST"])
def undo_journey_endpoint(trip_id: str):
    """
    Revert journey to previous revision snapshot.
    """
    with _lock:
        entry = JOURNEY_STORE.get(trip_id)
        
    if not entry:
        return jsonify({"success": False, "error": "Journey not found"}), 404

    previous_journey = pop_revision(trip_id)
    if not previous_journey:
        return jsonify({
            "success": False,
            "error": "No previous revisions available to undo.",
            "revisions_count": 0
        }), 400

    # Restore snapshot in store
    _set(trip_id, journey=previous_journey)
    
    return jsonify({
        "success": True,
        "journey": previous_journey,
        "message": "Previous itinerary restored.",
        "summary": "✓ Previous itinerary restored.",
        "revisions_count": get_revision_count(trip_id)
    }), 200


@modification_bp.route("/<trip_id>/revisions", methods=["GET"])
def get_revisions_endpoint(trip_id: str):
    """
    Get number of available undo steps for trip.
    """
    return jsonify({
        "trip_id": trip_id,
        "revisions_count": get_revision_count(trip_id)
    }), 200
