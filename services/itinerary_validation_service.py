"""
WanderSync Itinerary Validation Service
Deterministic, rule-based validation of generated itineraries.
No AI is used for scoring — all checks are computed from actual data.
"""
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

# ── Scoring weights (must sum to ~1.0) ────────────────────────────────────────
WEIGHTS = {
    "places":       0.18,
    "coordinates":  0.14,
    "schedule":     0.16,
    "travel":       0.10,
    "budget":       0.16,
    "completeness": 0.10,
    "daily_balance": 0.08,
    "duplicates":   0.08,
}

# ── Confidence level thresholds ───────────────────────────────────────────────
LEVEL_EXCELLENT = 90
LEVEL_GOOD = 75
LEVEL_FAIR = 60


def _parse_time(t):
    """Parse 'HH:MM' string to minutes since midnight. Returns None on failure."""
    try:
        parts = t.strip().split(":")
        return int(parts[0]) * 60 + int(parts[1])
    except Exception:
        return None


def _haversine_km(lat1, lng1, lat2, lng2):
    import math
    R = 6371.0
    dlat = math.radians(float(lat2) - float(lat1))
    dlng = math.radians(float(lng2) - float(lng1))
    a = (math.sin(dlat / 2) ** 2
         + math.cos(math.radians(float(lat1)))
         * math.cos(math.radians(float(lat2)))
         * math.sin(dlng / 2) ** 2)
    return R * 2 * math.asin(math.sqrt(max(0, min(1, a))))


# ── Individual checks ────────────────────────────────────────────────────────

def validate_places(days):
    total = 0
    verified = 0
    for day in days:
        for act in day.get("activities", []):
            total += 1
            if act.get("data_source") == "google_places" and act.get("place_id"):
                verified += 1
            elif act.get("data_source") == "ai_curated" and act.get("title"):
                verified += 1

    if total == 0:
        return {"score": 50, "verified": 0, "total": 0,
                "message": "No activities found in itinerary."}

    ratio = verified / total
    score = int(ratio * 100)
    msg = f"{verified} of {total} places verified."
    if verified < total:
        msg += f" {total - verified} could not be fully verified."
    return {"score": score, "verified": verified, "total": total, "message": msg}


def validate_coordinates(days):
    total = 0
    valid = 0
    issues = []

    for day in days:
        for act in day.get("activities", []):
            total += 1
            coords = act.get("coordinates", {})
            lat = coords.get("lat")
            lng = coords.get("lng")

            if lat is None or lng is None:
                issues.append(f"Day {day.get('day_number')}: {act.get('title')} — missing coordinates")
                continue

            try:
                lat, lng = float(lat), float(lng)
            except (TypeError, ValueError):
                issues.append(f"Day {day.get('day_number')}: {act.get('title')} — invalid coordinate format")
                continue

            if lat == 0.0 and lng == 0.0:
                issues.append(f"Day {day.get('day_number')}: {act.get('title')} — coordinates not set")
                continue

            if -90 <= lat <= 90 and -180 <= lng <= 180:
                valid += 1
            else:
                issues.append(f"Day {day.get('day_number')}: {act.get('title')} — out-of-range coordinates")

    if total == 0:
        return {"score": 50, "valid": 0, "total": 0, "issues": [],
                "message": "No activities to validate."}

    ratio = valid / total
    score = int(ratio * 100)
    msg = f"{valid} of {total} locations have valid coordinates."
    if issues:
        msg += f" {len(issues)} issue(s) found."
    return {"score": score, "valid": valid, "total": total, "issues": issues[:5], "message": msg}


def validate_schedule(days):
    conflicts = []
    total_activities = 0
    valid_days = 0

    for day in days:
        activities = day.get("activities", [])
        if not activities:
            continue
        total_activities += len(activities)
        day_has_conflict = False

        sorted_acts = sorted(activities, key=lambda a: _parse_time(a.get("time", "00:00")) or 0)

        for i in range(len(sorted_acts) - 1):
            curr = sorted_acts[i]
            nxt = sorted_acts[i + 1]
            curr_end = _parse_time(curr.get("end_time", ""))
            next_start = _parse_time(nxt.get("time", ""))

            if curr_end is not None and next_start is not None:
                if curr_end > next_start + 5:
                    conflicts.append({
                        "day": day.get("day_number"),
                        "activity_a": curr.get("title"),
                        "activity_b": nxt.get("title"),
                        "message": f"Day {day.get('day_number')}: \"{curr.get('title')}\" ends after \"{nxt.get('title')}\" starts"
                    })
                    day_has_conflict = True

            curr_dur = curr.get("duration_minutes", 0)
            if curr_dur is not None and curr_dur <= 0:
                conflicts.append({
                    "day": day.get("day_number"),
                    "activity_a": curr.get("title"),
                    "activity_b": None,
                    "message": f"Day {day.get('day_number')}: \"{curr.get('title')}\" has invalid duration"
                })
                day_has_conflict = True

        if not day_has_conflict:
            valid_days += 1

    total_days = len([d for d in days if d.get("activities")])
    if total_days == 0:
        return {"score": 50, "conflicts": [], "message": "No scheduled activities."}

    conflict_count = len(conflicts)
    if conflict_count == 0:
        score = 100
        msg = "No scheduling conflicts found."
    elif conflict_count <= 2:
        score = 80
        msg = f"{conflict_count} minor scheduling issue(s) detected."
    else:
        score = max(40, 100 - conflict_count * 15)
        msg = f"{conflict_count} scheduling conflicts detected."

    return {"score": score, "conflicts": conflicts[:8], "message": msg}


def validate_travel_distances(days):
    warnings = []
    total_transitions = 0
    reasonable = 0

    for day in days:
        activities = day.get("activities", [])
        coords_list = []
        for act in activities:
            c = act.get("coordinates", {})
            lat, lng = c.get("lat"), c.get("lng")
            if lat and lng and not (float(lat) == 0 and float(lng) == 0):
                coords_list.append((float(lat), float(lng), act.get("title")))

        for i in range(len(coords_list) - 1):
            total_transitions += 1
            lat1, lng1, name_a = coords_list[i]
            lat2, lng2, name_b = coords_list[i + 1]
            dist = _haversine_km(lat1, lng1, lat2, lng2)

            if dist <= 30:
                reasonable += 1
            else:
                warnings.append({
                    "day": day.get("day_number"),
                    "from": name_a,
                    "to": name_b,
                    "distance_km": round(dist, 1),
                    "message": f"Day {day.get('day_number')}: {dist:.1f} km between \"{name_a}\" and \"{name_b}\""
                })

    if total_transitions == 0:
        return {"score": 75, "warnings": [],
                "message": "Insufficient location data for distance checks."}

    ratio = reasonable / total_transitions
    score = int(ratio * 100)
    msg = f"{reasonable} of {total_transitions} transitions are reasonable."
    if warnings:
        msg += f" {len(warnings)} long-distance transition(s)."
    return {"score": score, "warnings": warnings[:5], "message": msg}


def validate_budget(summary):
    if not summary:
        return {"score": 70, "message": "Budget data unavailable."}

    status = summary.get("status", "")
    pct = summary.get("percent_used", 0)

    if status == "within_budget":
        if pct <= 85:
            score = 100
            msg = "Well within your selected budget."
        elif pct <= 100:
            score = 90
            msg = "Within budget with moderate spending."
        else:
            score = 75
            msg = "Within budget but near the limit."
    else:
        over_by = pct - 100
        if over_by <= 15:
            score = 65
            msg = f"Slightly over budget by {over_by:.0f}%."
        elif over_by <= 40:
            score = 45
            msg = f"Significantly over budget by {over_by:.0f}%."
        else:
            score = 25
            msg = f"Substantially over budget by {over_by:.0f}%."

    return {"score": score, "percent_used": pct, "status": status, "message": msg}


def validate_completeness(days):
    required_fields = ["title", "time", "location", "duration_minutes"]
    total = 0
    complete = 0
    incomplete_items = []

    for day in days:
        for act in day.get("activities", []):
            total += 1
            missing = [f for f in required_fields if not act.get(f)]
            if not missing:
                complete += 1
            else:
                incomplete_items.append({
                    "day": day.get("day_number"),
                    "activity": act.get("title", "Unknown"),
                    "missing": missing,
                })

    if total == 0:
        return {"score": 50, "message": "No activities to check."}

    ratio = complete / total
    score = int(ratio * 100)
    msg = f"{complete} of {total} activities have complete information."
    if incomplete_items:
        msg += f" {len(incomplete_items)} with missing details."
    return {"score": score, "complete": complete, "total": total,
            "incomplete": incomplete_items[:5], "message": msg}


def validate_daily_balance(days):
    if not days:
        return {"score": 50, "message": "No days in itinerary."}

    warnings = []
    for day in days:
        acts = day.get("activities", [])
        count = len(acts)
        day_num = day.get("day_number")

        if count == 0:
            warnings.append(f"Day {day_num}: No activities scheduled")
        elif count > 8:
            warnings.append(f"Day {day_num}: Very packed day with {count} activities")
        elif count == 1:
            warnings.append(f"Day {day_num}: Only 1 activity — light day")

        total_minutes = sum(a.get("duration_minutes", 0) for a in acts)
        if total_minutes > 720:
            warnings.append(f"Day {day_num}: {total_minutes // 60}+ hours of activities — may be exhausting")

    issue_count = len(warnings)
    total_days = len(days)

    if issue_count == 0:
        score = 100
        msg = "All days have a balanced schedule."
    elif issue_count <= total_days // 2:
        score = 80
        msg = f"{issue_count} day(s) could be better balanced."
    else:
        score = max(40, 100 - issue_count * 12)
        msg = f"{issue_count} day(s) have balance concerns."

    return {"score": score, "warnings": warnings[:6], "message": msg}


def validate_duplicates(days):
    duplicates = []

    for day in days:
        seen = {}
        for act in day.get("activities", []):
            pid = act.get("place_id", "")
            if not pid:
                continue
            if pid in seen:
                duplicates.append({
                    "day": day.get("day_number"),
                    "place": act.get("title"),
                    "message": f"Day {day.get('day_number')}: \"{act.get('title')}\" appears more than once"
                })
            else:
                seen[pid] = True

    if not duplicates:
        return {"score": 100, "message": "No duplicate activities found."}

    score = max(50, 100 - len(duplicates) * 20)
    msg = f"{len(duplicates)} possible duplicate(s) detected."
    return {"score": score, "duplicates": duplicates[:5], "message": msg}


# ── Main validation entry point ──────────────────────────────────────────────

def validate_itinerary(journey):
    """
    Run all validation checks on a completed journey object.
    Returns structured validation result with confidence score.
    """
    if not journey or not journey.get("days"):
        return {
            "confidence_score": 0,
            "confidence_level": "Unavailable",
            "summary": "No itinerary data available to validate.",
            "checks": [],
            "warnings": [],
        }

    days = journey.get("days", [])
    summary = journey.get("summary", {})

    results = {}

    results["places"] = validate_places(days)
    results["coordinates"] = validate_coordinates(days)
    results["schedule"] = validate_schedule(days)
    results["travel"] = validate_travel_distances(days)
    results["budget"] = validate_budget(summary)
    results["completeness"] = validate_completeness(days)
    results["daily_balance"] = validate_daily_balance(days)
    results["duplicates"] = validate_duplicates(days)

    # Calculate weighted score
    weighted_score = sum(
        results[key]["score"] * WEIGHTS[key]
        for key in WEIGHTS
        if key in results
    )
    confidence_score = min(100, max(0, round(weighted_score)))

    if confidence_score >= LEVEL_EXCELLENT:
        level = "Excellent"
    elif confidence_score >= LEVEL_GOOD:
        level = "Good"
    elif confidence_score >= LEVEL_FAIR:
        level = "Fair"
    else:
        level = "Needs Review"

    checks = [
        {
            "id": "places",
            "label": "Places verified",
            "status": _status(results["places"]["score"]),
            "message": results["places"]["message"],
        },
        {
            "id": "coordinates",
            "label": "Location coordinates",
            "status": _status(results["coordinates"]["score"]),
            "message": results["coordinates"]["message"],
        },
        {
            "id": "schedule",
            "label": "Schedule consistency",
            "status": _status(results["schedule"]["score"]),
            "message": results["schedule"]["message"],
        },
        {
            "id": "travel",
            "label": "Travel feasibility",
            "status": _status(results["travel"]["score"]),
            "message": results["travel"]["message"],
        },
        {
            "id": "budget",
            "label": "Budget consistency",
            "status": _status(results["budget"]["score"]),
            "message": results["budget"]["message"],
        },
        {
            "id": "completeness",
            "label": "Activity completeness",
            "status": _status(results["completeness"]["score"]),
            "message": results["completeness"]["message"],
        },
        {
            "id": "daily_balance",
            "label": "Daily balance",
            "status": _status(results["daily_balance"]["score"]),
            "message": results["daily_balance"]["message"],
        },
        {
            "id": "duplicates",
            "label": "Duplicate detection",
            "status": _status(results["duplicates"]["score"]),
            "message": results["duplicates"]["message"],
        },
    ]

    # Collect all warnings across checks
    all_warnings = []
    for r in results.values():
        for w in r.get("issues", [])[:3]:
            all_warnings.append(w if isinstance(w, str) else w.get("message", str(w)))
        for w in r.get("conflicts", [])[:3]:
            all_warnings.append(w.get("message", str(w)))
        for w in r.get("warnings", [])[:3]:
            all_warnings.append(w if isinstance(w, str) else w.get("message", str(w)))
        for w in r.get("duplicates", [])[:3]:
            all_warnings.append(w.get("message", str(w)))
        for item in r.get("incomplete", [])[:3]:
            all_warnings.append(
                f"Day {item.get('day')}: \"{item.get('activity')}\" missing {', '.join(item.get('missing', []))}"
            )

    # Build human-readable summary
    passed = sum(1 for c in checks if c["status"] == "passed")
    warn_count = sum(1 for c in checks if c["status"] == "warning")
    if passed == len(checks):
        summary_text = "Your itinerary looks well planned and consistent."
    elif warn_count <= 2:
        summary_text = "Your itinerary is mostly solid with a few items to review."
    else:
        summary_text = "Your itinerary has some items that may need attention."

    return {
        "confidence_score": confidence_score,
        "confidence_level": level,
        "summary": summary_text,
        "checks": checks,
        "warnings": all_warnings[:10],
    }


def _status(score):
    if score >= 80:
        return "passed"
    if score >= 55:
        return "warning"
    return "failed"
