"""
WanderSync — Authentication & User Data Blueprint
Guest-First Architecture: Register, Login, Logout, Session Me, Profile Avatar, and Saved Trips.
"""
import os
import uuid
import logging
from datetime import datetime, timezone
from bson import ObjectId
from flask import Blueprint, request, jsonify, session, current_app
from werkzeug.security import generate_password_hash, check_password_hash
from database.mongodb import get_users_collection, get_saved_trips_collection

logger = logging.getLogger(__name__)

auth_bp = Blueprint("auth", __name__, url_prefix="/api")

# ── Profile Image Security & Storage Configuration ───────────────────────────
ALLOWED_IMAGE_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}
ALLOWED_IMAGE_MIMES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB


def _get_upload_dir() -> str:
    """Return the absolute path to uploads/profiles directory, creating it if needed."""
    root = current_app.root_path if current_app else os.path.abspath(os.path.dirname(__file__))
    upload_dir = os.path.join(root, "uploads", "profiles")
    os.makedirs(upload_dir, exist_ok=True)
    return upload_dir


def _process_and_save_profile_image(file_storage):
    """
    Validate and securely save an uploaded profile image.
    Enforces extension, MIME type, max file size (5MB), and generates a unique filename.
    Returns metadata dict on success or raises ValueError on invalid input.
    """
    if not file_storage or not file_storage.filename:
        return None

    raw_filename = file_storage.filename.strip()
    if not raw_filename or "." not in raw_filename:
        raise ValueError("Invalid image format. Allowed formats: JPG, JPEG, PNG, WEBP.")

    ext = raw_filename.rsplit(".", 1)[1].lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise ValueError(f"Unsupported image extension .{ext}. Allowed formats: JPG, JPEG, PNG, WEBP.")

    # Validate MIME type if provided by client/browser
    mime = (file_storage.content_type or "").lower()
    if mime and mime not in ALLOWED_IMAGE_MIMES and mime != "application/octet-stream":
        raise ValueError("Invalid image MIME type. Allowed formats: JPG, JPEG, PNG, WEBP.")

    # Check file size by reading stream or seeking
    file_storage.seek(0, os.SEEK_END)
    size = file_storage.tell()
    file_storage.seek(0)  # reset stream position

    if size > MAX_IMAGE_SIZE_BYTES:
        raise ValueError(f"Image size ({size / (1024*1024):.1f}MB) exceeds the maximum allowed limit of 5MB.")
    if size == 0:
        raise ValueError("The uploaded image file is empty.")

    # Generate a cryptographically secure random filename (never use original filename)
    unique_filename = f"avatar_{uuid.uuid4().hex}.{ext}"
    upload_dir = _get_upload_dir()
    target_path = os.path.join(upload_dir, unique_filename)

    file_storage.save(target_path)
    logger.info(f"Profile avatar saved: {unique_filename} ({size} bytes)")

    return {
        "url": f"/uploads/profiles/{unique_filename}",
        "filename": unique_filename,
        "mime_type": mime or f"image/{'jpeg' if ext in ('jpg', 'jpeg') else ext}",
        "size_bytes": size,
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
    }


def _delete_old_profile_image_file(filename: str):
    """Safely delete an old profile image from the server filesystem."""
    if not filename:
        return
    try:
        upload_dir = _get_upload_dir()
        target_path = os.path.join(upload_dir, filename)
        if os.path.exists(target_path) and os.path.isfile(target_path):
            os.remove(target_path)
            logger.info(f"Old profile image deleted from disk: {filename}")
    except Exception as e:
        logger.warning(f"Could not delete old image file {filename}: {e}")


def _format_user(user_doc):
    """Safely format user document for JSON responses without sensitive fields."""
    if not user_doc:
        return None

    # Handle profile_image metadata -> expose public URL or None
    raw_img = user_doc.get("profile_image")
    profile_image_url = None
    if isinstance(raw_img, dict):
        profile_image_url = raw_img.get("url")
    elif isinstance(raw_img, str) and raw_img.strip():
        profile_image_url = raw_img.strip()

    return {
        "id": str(user_doc.get("_id")),
        "name": user_doc.get("name", "Traveler"),
        "email": user_doc.get("email", ""),
        "profile_image": profile_image_url,
        "created_at": user_doc.get("created_at", "").isoformat() if isinstance(user_doc.get("created_at"), datetime) else str(user_doc.get("created_at", "")),
        "last_login_at": user_doc.get("last_login_at", "").isoformat() if isinstance(user_doc.get("last_login_at"), datetime) else str(user_doc.get("last_login_at", "")),
        "preferred_currency": user_doc.get("preferred_currency", "PKR"),
        "travel_style": user_doc.get("travel_style", "Balanced"),
        "bio": user_doc.get("bio", ""),
        "location": user_doc.get("location", ""),
    }


# ── 1. Register API ──────────────────────────────────────────────────────────

@auth_bp.route("/auth/register", methods=["POST"])
def register():
    """
    Register a new user in MongoDB and establish server session.
    Supports both multipart/form-data (with optional profile_image upload)
    and JSON payloads.
    """
    is_multipart = request.content_type and "multipart/form-data" in request.content_type
    if is_multipart:
        data = request.form
        file_obj = request.files.get("profile_image")
    else:
        data = request.get_json(silent=True) or {}
        file_obj = None

    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not name:
        return jsonify({"error": "Full name is required"}), 400
    if not email or "@" not in email:
        return jsonify({"error": "A valid email address is required"}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    # Process optional profile image if attached
    profile_image_meta = None
    if file_obj and file_obj.filename:
        try:
            profile_image_meta = _process_and_save_profile_image(file_obj)
        except ValueError as ve:
            return jsonify({"error": str(ve)}), 400
        except Exception as exc:
            logger.error(f"Avatar upload failed during registration: {exc}")
            return jsonify({"error": "Failed to process profile image upload"}), 500

    try:
        users = get_users_collection()

        # Check duplicate email
        existing = users.find_one({"email": email})
        if existing:
            # If upload was saved, clean it up since registration is rejected
            if profile_image_meta and profile_image_meta.get("filename"):
                _delete_old_profile_image_file(profile_image_meta["filename"])
            return jsonify({"error": "An account with this email address already exists."}), 409

        now = datetime.now(timezone.utc)
        user_doc = {
            "name": name,
            "email": email,
            "password_hash": generate_password_hash(password),
            "profile_image": profile_image_meta,
            "created_at": now,
            "updated_at": now,
            "last_login_at": now,
            "preferred_currency": data.get("preferred_currency", "PKR"),
            "travel_style": data.get("travel_style", "Balanced"),
            "location": data.get("location", ""),
            "bio": data.get("bio", ""),
        }

        result = users.insert_one(user_doc)
        user_id = str(result.inserted_id)
        user_doc["_id"] = result.inserted_id

        # Establish server session
        session["user_id"] = user_id
        session.permanent = True

        logger.info(f"New user registered: {email} (ID: {user_id}) | Has avatar: {bool(profile_image_meta)}")
        return jsonify({
            "success": True,
            "authenticated": True,
            "user": _format_user(user_doc),
            "message": "Account created successfully"
        }), 201

    except Exception as e:
        logger.error(f"Registration error: {e}")
        if profile_image_meta and profile_image_meta.get("filename"):
            _delete_old_profile_image_file(profile_image_meta["filename"])
        return jsonify({"error": f"Registration failed: {str(e)}"}), 500


# ── 2. Login API ─────────────────────────────────────────────────────────────

@auth_bp.route("/auth/login", methods=["POST"])
def login():
    """
    Authenticate user credentials, update last login, establish server session.
    POST /api/auth/login
    Body: { "email": "...", "password": "..." }
    """
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    try:
        users = get_users_collection()
        user = users.find_one({"email": email})

        if not user or not check_password_hash(user.get("password_hash", ""), password):
            return jsonify({"error": "Invalid email address or password"}), 401

        now = datetime.now(timezone.utc)
        users.update_one({"_id": user["_id"]}, {"$set": {"last_login_at": now}})
        user["last_login_at"] = now

        # Establish session
        session["user_id"] = str(user["_id"])
        session.permanent = True

        logger.info(f"User logged in: {email} (ID: {user['_id']})")
        return jsonify({
            "success": True,
            "authenticated": True,
            "user": _format_user(user),
            "message": "Logged in successfully"
        }), 200

    except Exception as e:
        logger.error(f"Login error: {e}")
        return jsonify({"error": f"Login failed: {str(e)}"}), 500


# ── 3. Logout API ────────────────────────────────────────────────────────────

@auth_bp.route("/auth/logout", methods=["POST"])
def logout():
    """
    Clear server session and log user out.
    POST /api/auth/logout
    """
    user_id = session.pop("user_id", None)
    session.clear()
    logger.info(f"User logged out: {user_id}")
    return jsonify({
        "success": True,
        "authenticated": False,
        "message": "Logged out successfully"
    }), 200


# ── 4. Current User Session Check ────────────────────────────────────────────

@auth_bp.route("/auth/me", methods=["GET"])
def get_current_user():
    """
    Inspect server session. Returns authenticated user data with profile_image or unauthenticated state.
    GET /api/auth/me
    """
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"authenticated": False, "user": None}), 200

    try:
        users = get_users_collection()
        try:
            oid = ObjectId(user_id)
        except Exception:
            session.pop("user_id", None)
            return jsonify({"authenticated": False, "user": None}), 200

        user = users.find_one({"_id": oid})
        if not user:
            session.pop("user_id", None)
            return jsonify({"authenticated": False, "user": None}), 200

        return jsonify({
            "authenticated": True,
            "user": _format_user(user)
        }), 200

    except Exception as e:
        logger.error(f"Error checking session /auth/me: {e}")
        return jsonify({"authenticated": False, "user": None}), 200


# ── 5. User Profile Update & Photo Management ────────────────────────────────

@auth_bp.route("/auth/profile/photo", methods=["POST"])
def upload_profile_photo():
    """
    Upload or replace the authenticated user's profile avatar.
    POST /api/auth/profile/photo
    FormData: profile_image (file)
    """
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Authentication required"}), 401

    file_obj = request.files.get("profile_image")
    if not file_obj or not file_obj.filename:
        return jsonify({"error": "No image file provided"}), 400

    try:
        new_meta = _process_and_save_profile_image(file_obj)
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as exc:
        logger.error(f"Avatar processing error: {exc}")
        return jsonify({"error": "Failed to process uploaded image"}), 500

    try:
        users = get_users_collection()
        oid = ObjectId(user_id)
        current_user = users.find_one({"_id": oid})
        if not current_user:
            if new_meta and new_meta.get("filename"):
                _delete_old_profile_image_file(new_meta["filename"])
            return jsonify({"error": "User not found"}), 404

        old_meta = current_user.get("profile_image")
        old_filename = old_meta.get("filename") if isinstance(old_meta, dict) else None

        now = datetime.now(timezone.utc)
        users.update_one(
            {"_id": oid},
            {"$set": {"profile_image": new_meta, "updated_at": now}}
        )

        # Clean up old file from disk now that database is updated successfully
        if old_filename and old_filename != new_meta.get("filename"):
            _delete_old_profile_image_file(old_filename)

        updated_user = users.find_one({"_id": oid})
        logger.info(f"User {user_id} updated profile avatar to {new_meta.get('filename')}")
        return jsonify({
            "success": True,
            "user": _format_user(updated_user),
            "message": "Profile photo updated successfully"
        }), 200

    except Exception as e:
        logger.error(f"Error updating profile photo: {e}")
        if new_meta and new_meta.get("filename"):
            _delete_old_profile_image_file(new_meta["filename"])
        return jsonify({"error": f"Failed to update profile photo: {str(e)}"}), 500


@auth_bp.route("/auth/profile/photo", methods=["DELETE"])
def remove_profile_photo():
    """
    Remove current user's profile avatar from database and disk.
    DELETE /api/auth/profile/photo
    """
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Authentication required"}), 401

    try:
        users = get_users_collection()
        oid = ObjectId(user_id)
        current_user = users.find_one({"_id": oid})
        if not current_user:
            return jsonify({"error": "User not found"}), 404

        old_meta = current_user.get("profile_image")
        old_filename = old_meta.get("filename") if isinstance(old_meta, dict) else None

        now = datetime.now(timezone.utc)
        users.update_one(
            {"_id": oid},
            {"$set": {"profile_image": None, "updated_at": now}}
        )

        if old_filename:
            _delete_old_profile_image_file(old_filename)

        updated_user = users.find_one({"_id": oid})
        logger.info(f"User {user_id} removed profile avatar")
        return jsonify({
            "success": True,
            "user": _format_user(updated_user),
            "message": "Profile photo removed successfully"
        }), 200

    except Exception as e:
        logger.error(f"Error removing profile photo: {e}")
        return jsonify({"error": f"Failed to remove profile photo: {str(e)}"}), 500


@auth_bp.route("/auth/profile", methods=["PUT"])
def update_profile():
    """
    Update authenticated user profile fields.
    PUT /api/auth/profile
    """
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Authentication required"}), 401

    is_multipart = request.content_type and "multipart/form-data" in request.content_type
    if is_multipart:
        data = request.form
        file_obj = request.files.get("profile_image")
    else:
        data = request.get_json(silent=True) or {}
        file_obj = None

    updates = {}
    if "name" in data and data["name"].strip():
        updates["name"] = data["name"].strip()
    if "preferred_currency" in data and data["preferred_currency"].strip():
        updates["preferred_currency"] = data["preferred_currency"].strip()
    if "travel_style" in data and data["travel_style"].strip():
        updates["travel_style"] = data["travel_style"].strip()
    if "location" in data:
        updates["location"] = data["location"].strip()
    if "bio" in data:
        updates["bio"] = data["bio"].strip()

    # If photo removal was requested via text payload
    if data.get("remove_photo") == "true" or data.get("remove_photo") is True:
        updates["profile_image"] = None

    # Handle image upload if attached
    new_photo_meta = None
    if file_obj and file_obj.filename:
        try:
            new_photo_meta = _process_and_save_profile_image(file_obj)
            updates["profile_image"] = new_photo_meta
        except ValueError as ve:
            return jsonify({"error": str(ve)}), 400
        except Exception as exc:
            logger.error(f"Profile photo upload in PUT error: {exc}")
            return jsonify({"error": "Failed to process profile image"}), 500

    if not updates:
        return jsonify({"error": "No valid fields to update"}), 400

    updates["updated_at"] = datetime.now(timezone.utc)

    try:
        users = get_users_collection()
        oid = ObjectId(user_id)
        current_user = users.find_one({"_id": oid})
        if not current_user:
            return jsonify({"error": "User not found"}), 404

        old_meta = current_user.get("profile_image")
        old_filename = old_meta.get("filename") if isinstance(old_meta, dict) else None

        users.update_one({"_id": oid}, {"$set": updates})

        # If a new image was set or image was removed, clean up old file
        if (new_photo_meta or updates.get("profile_image") is None) and old_filename:
            if not new_photo_meta or old_filename != new_photo_meta.get("filename"):
                _delete_old_profile_image_file(old_filename)

        updated_user = users.find_one({"_id": oid})
        return jsonify({
            "success": True,
            "user": _format_user(updated_user),
            "message": "Profile updated successfully"
        }), 200

    except Exception as e:
        logger.error(f"Profile update error: {e}")
        if new_photo_meta and new_photo_meta.get("filename"):
            _delete_old_profile_image_file(new_photo_meta["filename"])
        return jsonify({"error": f"Failed to update profile: {str(e)}"}), 500


# ── 6. Protected: Saved Trips / History ──────────────────────────────────────

@auth_bp.route("/user/saved-trips", methods=["GET"])
def get_saved_trips():
    """
    Fetch all journeys saved by the currently authenticated user.
    GET /api/user/saved-trips
    """
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Authentication required to access saved journeys"}), 401

    try:
        trips_col = get_saved_trips_collection()
        cursor = trips_col.find({"user_id": user_id}).sort("saved_at", -1)

        saved = []
        for doc in cursor:
            doc_id = str(doc.get("_id"))
            trip_data = doc.get("trip_data", {})
            saved.append({
                "id": doc.get("trip_id") or doc_id,
                "saved_id": doc_id,
                "trip_id": doc.get("trip_id"),
                "destination": doc.get("destination", trip_data.get("destination", "Unknown")),
                "title": doc.get("title", trip_data.get("itinerary_title", "Custom Journey")),
                "dates": doc.get("dates", ""),
                "travelers": doc.get("travelers", 1),
                "total_estimated_cost": doc.get("total_estimated_cost", 0),
                "currency": doc.get("currency", "PKR"),
                "status": doc.get("status", "Saved"),
                "days_count": doc.get("days_count", len(trip_data.get("days", []))),
                "saved_at": doc.get("saved_at", "").isoformat() if isinstance(doc.get("saved_at"), datetime) else str(doc.get("saved_at", "")),
                "trip": trip_data,
            })

        return jsonify({"success": True, "trips": saved, "count": len(saved)}), 200

    except Exception as e:
        logger.error(f"Error fetching saved trips: {e}")
        return jsonify({"error": f"Failed to fetch saved trips: {str(e)}"}), 500


@auth_bp.route("/user/saved-trips", methods=["POST"])
def save_trip():
    """
    Save a journey to the logged-in user's MongoDB account.
    POST /api/user/saved-trips
    Body: { "trip_id": "...", "trip": {...} }
    """
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Authentication required to save journeys"}), 401

    data = request.get_json(silent=True) or {}
    trip_id = data.get("trip_id") or f"saved_{int(datetime.now().timestamp())}"
    trip_data = data.get("trip") or data

    dest = trip_data.get("destination") or trip_data.get("trip", {}).get("destination") or "Custom Destination"
    title = trip_data.get("itinerary_title") or trip_data.get("trip", {}).get("itinerary_title") or f"Trip to {dest}"
    dates_str = ""
    if trip_data.get("start_date") and trip_data.get("end_date"):
        dates_str = f"{trip_data.get('start_date')} – {trip_data.get('end_date')}"
    elif trip_data.get("dates"):
        dates_str = str(trip_data.get("dates"))

    cost = trip_data.get("budget_breakdown", {}).get("total") or trip_data.get("total_estimated_cost") or 0
    curr = trip_data.get("currency") or "PKR"
    days_count = len(trip_data.get("days", [])) or trip_data.get("days_count", 1)

    try:
        trips_col = get_saved_trips_collection()
        now = datetime.now(timezone.utc)

        # Upsert by user_id and trip_id
        filter_doc = {"user_id": user_id, "trip_id": trip_id}
        update_doc = {
            "$set": {
                "user_id": user_id,
                "trip_id": trip_id,
                "destination": dest,
                "title": title,
                "dates": dates_str,
                "total_estimated_cost": float(cost) if cost else 0.0,
                "currency": curr,
                "days_count": days_count,
                "status": "Saved",
                "saved_at": now,
                "trip_data": trip_data,
            }
        }
        trips_col.update_one(filter_doc, update_doc, upsert=True)
        logger.info(f"Journey {trip_id} saved for user {user_id}")

        return jsonify({
            "success": True,
            "message": "Journey successfully saved to your account!",
            "trip_id": trip_id
        }), 200

    except Exception as e:
        logger.error(f"Error saving trip: {e}")
        return jsonify({"error": f"Failed to save trip: {str(e)}"}), 500


@auth_bp.route("/user/saved-trips/<trip_id>", methods=["DELETE"])
def delete_saved_trip(trip_id):
    """
    Remove a saved journey from the user's account.
    DELETE /api/user/saved-trips/<trip_id>
    """
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Authentication required"}), 401

    try:
        trips_col = get_saved_trips_collection()
        res = trips_col.delete_one({"user_id": user_id, "trip_id": trip_id})
        if res.deleted_count == 0:
            try:
                trips_col.delete_one({"user_id": user_id, "_id": ObjectId(trip_id)})
            except Exception:
                pass

        return jsonify({"success": True, "message": "Journey removed from saved plans"}), 200

    except Exception as e:
        logger.error(f"Error deleting saved trip: {e}")
        return jsonify({"error": f"Failed to delete trip: {str(e)}"}), 500
