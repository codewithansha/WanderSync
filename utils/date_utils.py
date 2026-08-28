"""
WanderSync Date Utilities
All date arithmetic is performed in Python — never delegated to AI.
"""
from datetime import datetime, date, timedelta

DATE_FORMAT = "%Y-%m-%d"
DISPLAY_FORMAT = "%A, %b %d"
DISPLAY_FORMAT_FULL = "%A, %B %d, %Y"


def parse_date(date_str: str) -> date:
    try:
        return datetime.strptime(date_str, DATE_FORMAT).date()
    except (ValueError, TypeError):
        raise ValueError(f"Invalid date format '{date_str}'. Expected YYYY-MM-DD.")


def calculate_trip_duration(start_str: str, end_str: str) -> dict:
    """
    Nights = end - start (nights away from home).
    Days  = nights + 1 (calendar days including arrival & departure).
    e.g. Sep 10 → Sep 15 = 5 nights, 6 days
    """
    start = parse_date(start_str)
    end = parse_date(end_str)

    if end <= start:
        raise ValueError("End date must be after start date.")

    nights = (end - start).days
    days = nights + 1

    return {
        "start_date": start_str,
        "end_date": end_str,
        "nights": nights,
        "days": days,
        "start_date_display": start.strftime(DISPLAY_FORMAT_FULL),
        "end_date_display": end.strftime(DISPLAY_FORMAT_FULL),
        "dates_short": f"{start.strftime('%b %d')} - {end.strftime('%b %d, %Y')}",
    }


def get_dates_for_days(start_str: str, num_days: int) -> list:
    """Return list of YYYY-MM-DD strings for each trip day."""
    start = parse_date(start_str)
    return [(start + timedelta(days=i)).strftime(DATE_FORMAT) for i in range(num_days)]


def get_display_dates(start_str: str, num_days: int) -> list:
    """Return display strings like 'Wednesday, Sep 10'."""
    start = parse_date(start_str)
    return [(start + timedelta(days=i)).strftime(DISPLAY_FORMAT) for i in range(num_days)]


def format_display_date(date_str: str) -> str:
    try:
        return datetime.strptime(date_str, DATE_FORMAT).strftime(DISPLAY_FORMAT)
    except Exception:
        return date_str
