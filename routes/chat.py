"""
WanderSync Chat Routes
/api/chat             — Context-aware Gemini / OpenAI AI Chatbot
/api/chat_with_image  — Multimodal Gemini Image Analysis
/api/upload_pdf       — Travel document OCR & text extraction
"""
import logging
from flask import Blueprint, request, jsonify

chat_bp = Blueprint("chat", __name__, url_prefix="/api")
logger = logging.getLogger(__name__)


@chat_bp.route("/chat", methods=["POST"])
def api_chat():
    """
    Handle natural language chat queries with dynamic journey context and chat history.
    """
    data = request.get_json(silent=True) or {}
    query = (data.get("query") or data.get("message") or "").strip()
    trip_id = data.get("trip_id")
    history = data.get("history") or []
    doc_ctx = data.get("pdf_context") or ""
    client_journey_ctx = data.get("journey_context") or ""
    operation = data.get("operation")

    # Handle translate / optimize tool operations
    if operation in ("translate", "optimize"):
        text = (data.get("text") or "").strip()
        if len(text) > 5000:
            return jsonify({
                "success": False,
                "message": "Text is too long. Please use fewer than 5,000 characters."
            }), 400

        try:
            from services.ai_service import translate_text, optimize_text, SUPPORTED_LANGUAGES

            if operation == "translate":
                target_language = (data.get("target_language") or "").strip()
                if not text:
                    return jsonify({"success": False, "message": "No text to translate."}), 400
                if not target_language:
                    return jsonify({"success": False, "message": "Please select a target language."}), 400
                result = translate_text(text, target_language)
                return jsonify({
                    "success": True, "operation": "translate",
                    "result": result, "target_language": target_language,
                }), 200

            if operation == "optimize":
                style = (data.get("style") or "").strip()
                if not text:
                    return jsonify({"success": False, "message": "No text to optimize."}), 400
                if not style:
                    return jsonify({"success": False, "message": "Please select an optimization style."}), 400
                result = optimize_text(text, style)
                return jsonify({
                    "success": True, "operation": "optimize",
                    "result": result, "style": style,
                }), 200

        except ValueError as ve:
            return jsonify({"success": False, "message": str(ve)}), 400
        except Exception as tool_err:
            logger.error(f"[CHAT TOOL ERROR] {operation} failed: {tool_err}")
            return jsonify({
                "success": False,
                "message": f"{'Translation' if operation == 'translate' else 'Text optimization'} is temporarily unavailable. Please try again.",
            }), 500

    if not query:
        return jsonify({"success": False, "error": "Message is required", "message": "Message is required"}), 400

    # Build journey context from live backend store or client
    journey_ctx = client_journey_ctx
    if trip_id:
        try:
            from routes.journey import JOURNEY_STORE, build_journey_context, _lock
            with _lock:
                entry = JOURNEY_STORE.get(trip_id)
            if entry and entry.get("journey"):
                journey_ctx = build_journey_context(entry["journey"])
        except Exception as e:
            logger.warning(f"Could not load journey context from store for {trip_id}: {e}")

    if doc_ctx:
        journey_ctx += f"\n\nATTACHED DOCUMENT CONTEXT:\n{doc_ctx[:3000]}"

    # Check if this is an explicit modification command for an active trip
    is_modification_request = any(w in query.lower() for w in [
        "replace", "remove", "delete", "add rest", "want to rest", "don't want", "dont want",
        "move the", "move day", "less tiring", "more free time", "make cheaper", "reduce cost",
        "optimize route", "indoor backup", "it's going to rain", "undo that", "undo change"
    ])
    if trip_id and is_modification_request:
        try:
            from services.journey_modification_service import modify_journey_engine
            from routes.journey import JOURNEY_STORE, _lock, _set
            with _lock:
                entry = JOURNEY_STORE.get(trip_id)
            if entry and entry.get("journey"):
                success, updated_journey, changes, summary, err_msg = modify_journey_engine(
                    trip_id=trip_id,
                    journey=entry["journey"],
                    instruction=query
                )
                if success:
                    _set(trip_id, journey=updated_journey)
                    return jsonify({
                        "success": True,
                        "answer": f"{summary}\n\nYour active itinerary has been updated accordingly.",
                        "message": summary,
                        "journey": updated_journey,
                        "changes": changes,
                        "trip_id": trip_id,
                        "is_real_ai": True,
                        "provider": "gemini_modification_engine"
                    }), 200
        except Exception as mod_err:
            logger.warning(f"Chat modification hook fallback to general chat: {mod_err}")

    try:
        from services.ai_service import chat_gemini
        answer = chat_gemini(query=query, journey_context=journey_ctx, history=history)
        
        return jsonify({
            "success": True,
            "answer": answer,
            "message": answer,
            "trip_id": trip_id,
            "is_real_ai": True,
            "provider": "gemini"
        }), 200

    except Exception as e:
        logger.error(f"[CHAT ROUTE ERROR] Failed to generate AI response: {e}")
        return jsonify({
            "success": False,
            "error": "AI_PROVIDER_UNAVAILABLE",
            "message": "The AI service is temporarily unavailable. Please try again in a moment.",
            "answer": "The AI service is temporarily unavailable. Please try again in a moment."
        }), 500


@chat_bp.route("/chat/tools", methods=["GET"])
def api_chat_tools():
    """Return available languages and optimization styles for the tools panel."""
    from services.ai_service import SUPPORTED_LANGUAGES, OPTIMIZATION_STYLES
    return jsonify({
        "languages": SUPPORTED_LANGUAGES,
        "styles": [
            {"id": k, "label": v.split(".")[0] if "." in v else v}
            for k, v in OPTIMIZATION_STYLES.items()
        ],
    })


@chat_bp.route("/chat_with_image", methods=["POST"])
def api_chat_with_image():
    query = request.form.get("query") or request.form.get("message") or "Analyze this travel image"
    trip_id = request.form.get("trip_id")
    image_file = request.files.get("image")

    journey_ctx = ""
    if trip_id:
        try:
            from routes.journey import JOURNEY_STORE, build_journey_context, _lock
            with _lock:
                entry = JOURNEY_STORE.get(trip_id)
            if entry and entry.get("journey"):
                journey_ctx = build_journey_context(entry["journey"])
        except Exception:
            pass

    try:
        from ai_engine_gemini import get_travel_answer_with_image
        answer, encoded_image = get_travel_answer_with_image(query, image_file, context=journey_ctx)
        return jsonify({
            "success": True,
            "answer": answer,
            "message": answer,
            "image": encoded_image,
            "trip_id": trip_id,
            "is_real_ai": True,
            "provider": "gemini"
        }), 200
    except Exception as e:
        logger.error(f"[CHAT IMAGE ERROR] {e}")
        return jsonify({
            "success": False,
            "error": "AI_PROVIDER_UNAVAILABLE",
            "message": f"Failed to analyze image: {str(e)}"
        }), 500


@chat_bp.route("/upload_pdf", methods=["POST"])
def api_upload_pdf():
    if "pdf" not in request.files and "file" not in request.files:
        return jsonify({"error": "No PDF file uploaded"}), 400
    file = request.files.get("pdf") or request.files.get("file")
    from pdf_processing import extract_text_from_pdf
    text = extract_text_from_pdf(file)
    return jsonify({"filename": file.filename, "text": text, "length": len(text)})
