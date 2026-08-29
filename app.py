
import os
import logging
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

app = Flask(__name__, static_folder="frontend/dist", static_url_path="")
app.secret_key = os.environ.get("SESSION_SECRET", os.environ.get("SECRET_KEY", "wandersync-session-secret-2026-secure"))
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_SECURE"] = False  # False for local HTTP development

# Allow React dev server (Vite port 3000) and production with credentials (cookies)
CORS(
    app,
    resources={r"/api/*": {"origins": "*"}},
    supports_credentials=True,
)


# ── Register Blueprints ────────────────────────────────────────────────────────
from routes.journey import journey_bp
from routes.journey_modification import modification_bp
from routes.places  import places_bp
from routes.chat    import chat_bp
from routes.auth    import auth_bp
from database.mongodb import check_mongo_health

app.register_blueprint(journey_bp)
app.register_blueprint(modification_bp)
app.register_blueprint(places_bp)
app.register_blueprint(chat_bp)
app.register_blueprint(auth_bp)

# ── Minimal guest user endpoint (Legacy fallback) ──────────────────────────────
@app.route("/api/user", methods=["GET"])
def api_get_user():
    """Guest/demo user fallback. Real auth is served via /api/auth/me."""
    return jsonify({
        "name":               "Explorer",
        "email":              "guest@wandersync.io",
        "location":           "Anywhere in the World",
        "travel_style":       "Balanced",
        "trips_count":        0,
        "saved_places":       0,
        "countries_explored": 0,
        "joined":             "2026",
        "is_guest":           True,
    })


# ── Health check ───────────────────────────────────────────────────────────────
@app.route("/api/health", methods=["GET"])
def health():
    checks = {}
    checks["google_places"] = bool(os.getenv("GOOGLE_PLACES_API_KEY"))
    checks["gemini"]        = bool(os.getenv("GEMINI_API_KEY"))
    checks["openai"]        = bool(os.getenv("OPENAI_API_KEY"))
    checks["mongodb"]       = check_mongo_health()
    all_ok = checks["google_places"] and checks["gemini"] and checks["mongodb"]
    return jsonify({
        "status":  "ok" if all_ok else "degraded",
        "apis":    checks,
    }), 200 if all_ok else 503


# ── Serve Uploaded Profile Avatars ───────────────────────────────────────────
# ── Serve Uploaded Profile Avatars ───────────────────────────────────────────
UPLOAD_FOLDER = os.path.join(app.root_path, "uploads", "profiles")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route("/uploads/profiles/<path:filename>")
def serve_profile_image(filename):
    logger.info("Profile image requested: %s", filename)
    logger.info("Looking in: %s", UPLOAD_FOLDER)

    return send_from_directory(
        UPLOAD_FOLDER,
        filename
    )

# ── Serve React SPA (production build) ────────────────────────────────────────
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_react(path):
    dist = app.static_folder
    if dist and path != "" and os.path.exists(os.path.join(dist, path)):
        return send_from_directory(dist, path)
    if dist and os.path.exists(os.path.join(dist, "index.html")):
        return send_from_directory(dist, "index.html")
    return "WanderSync backend running. Start the React dev server for the UI.", 200


if __name__ == "__main__":
    logger.info("Starting WanderSync backend on port 5000")
    app.run(debug=True, port=5000)
