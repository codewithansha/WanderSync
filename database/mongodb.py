"""
WanderSync — MongoDB Database Service
Shared singleton connection manager with automatic index creation.
"""
import os
import logging
from pymongo import MongoClient, ASCENDING
from pymongo.errors import PyMongoError

logger = logging.getLogger(__name__)

_mongo_client = None
_db = None


def get_db():
    """
    Get or initialize the shared MongoDB database connection.
    Returns the database instance or raises RuntimeError if connection fails.
    """
    global _mongo_client, _db
    if _db is not None:
        return _db

    uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017/wandersync")
    db_name = os.getenv("MONGODB_DATABASE", "wandersync")

    try:
        _mongo_client = MongoClient(
            uri,
            serverSelectionTimeoutMS=3000,
            connectTimeoutMS=3000,
        )
        # Test connection
        _mongo_client.admin.command("ping")
        _db = _mongo_client[db_name]
        logger.info(f"Connected to MongoDB database: {db_name}")

        # Ensure indexes
        _init_indexes(_db)

        return _db
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB at {uri}: {e}")
        raise RuntimeError(f"MongoDB connection failed: {e}")


def _init_indexes(db):
    """
    Ensure essential unique and lookup indexes exist.
    """
    try:
        # Unique normalized email index for users
        db.users.create_index([("email", ASCENDING)], unique=True, background=True)
        # Fast query index for saved trips by user
        db.saved_trips.create_index([("user_id", ASCENDING)], background=True)
        # Expire index for sessions (30 days)
        db.sessions.create_index([("created_at", ASCENDING)], expireAfterSeconds=2592000, background=True)
        logger.info("MongoDB indexes verified.")
    except Exception as e:
        logger.warning(f"Could not create MongoDB indexes: {e}")


def get_users_collection():
    db = get_db()
    return db.users


def get_saved_trips_collection():
    db = get_db()
    return db.saved_trips


def get_sessions_collection():
    db = get_db()
    return db.sessions


def check_mongo_health():
    """Returns True if MongoDB is reachable, False otherwise."""
    try:
        db = get_db()
        db.command("ping")
        return True
    except Exception:
        return False
