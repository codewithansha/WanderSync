"""
WanderSync Journey Revision History & Undo Utility
Maintains an in-memory stack of journey revisions per trip for instant undo/redo.
"""
import copy
import logging
from typing import Optional, Dict, List

logger = logging.getLogger(__name__)

# Max revisions kept in memory per trip
MAX_REVISIONS = 20

# In-memory revision store: { trip_id: [journey_snapshot_1, journey_snapshot_2, ...] }
_REVISION_HISTORY: Dict[str, List[dict]] = {}


def push_revision(trip_id: str, journey: dict) -> None:
    """Save a snapshot of the journey before modification."""
    if not trip_id or not journey:
        return
    if trip_id not in _REVISION_HISTORY:
        _REVISION_HISTORY[trip_id] = []
    
    # Store deep copy so subsequent modifications do not mutate the history snapshot
    snapshot = copy.deepcopy(journey)
    _REVISION_HISTORY[trip_id].append(snapshot)
    
    # Prune oldest if exceeds max
    if len(_REVISION_HISTORY[trip_id]) > MAX_REVISIONS:
        _REVISION_HISTORY[trip_id].pop(0)
        
    logger.info(f"[{trip_id[:8]}] Pushed revision snapshot. Total revisions: {len(_REVISION_HISTORY[trip_id])}")


def pop_revision(trip_id: str) -> Optional[dict]:
    """Retrieve and pop the most recent previous journey snapshot."""
    if not trip_id or trip_id not in _REVISION_HISTORY or not _REVISION_HISTORY[trip_id]:
        return None
    
    snapshot = _REVISION_HISTORY[trip_id].pop()
    logger.info(f"[{trip_id[:8]}] Popped revision snapshot. Remaining revisions: {len(_REVISION_HISTORY[trip_id])}")
    return snapshot


def get_revision_count(trip_id: str) -> int:
    """Return count of available undo snapshots for trip."""
    if not trip_id or trip_id not in _REVISION_HISTORY:
        return 0
    return len(_REVISION_HISTORY[trip_id])


def clear_revisions(trip_id: str) -> None:
    """Clear history for a trip."""
    if trip_id in _REVISION_HISTORY:
        del _REVISION_HISTORY[trip_id]
