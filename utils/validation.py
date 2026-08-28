"""
WanderSync Input Validation — all validation before any API call.
"""
from datetime import date, datetime

REQUIRED_FIELDS = ["destination", "start_date", "end_date", "travelers", "budget", "currency"]

VALID_CURRENCIES = [
    "USD", "PKR", "EUR", "GBP", "AED", "JPY", "AUD", "CAD",
    "SGD", "INR", "TRY", "ZAR", "IDR", "THB", "BRL", "MXN",
    "SAR", "KWD", "QAR", "OMR", "CNY", "KRW", "HKD", "CHF",
    "SEK", "NOK", "DKK", "NZD", "TWD",
]
VALID_STYLES = ["Budget", "Balanced", "Premium", "Luxury"]
VALID_INTERESTS = ["Food", "Culture", "Shopping", "Adventure", "Nature", "History", "Family", "Photography", "Nightlife"]
VALID_ACCOMMODATIONS = ["Hotel", "Apartment", "Hostel", "Resort", "Any"]
VALID_TRANSPORTS = ["Walking", "Public Transport", "Taxi", "Rental Car", "Any"]
MAX_NIGHTS = 60
MAX_TRAVELERS = 50


def validate_journey_request(data: dict) -> list:
    """
    Validate all journey generation parameters.
    Returns a list of human-readable error strings.
    Empty list means valid.
    """
    errors = []

    # Required presence
    for field in REQUIRED_FIELDS:
        if data.get(field) in (None, "", []):
            errors.append(f"'{field}' is required.")
    if errors:
        return errors

    # Destination
    dest = str(data.get("destination", "")).strip()
    if len(dest) < 2:
        errors.append("Destination name is too short.")

    # Dates
    try:
        start = datetime.strptime(data["start_date"], "%Y-%m-%d").date()
        end = datetime.strptime(data["end_date"], "%Y-%m-%d").date()

        if end <= start:
            errors.append("End date must be after start date.")
        if start < date.today():
            errors.append("Start date cannot be in the past.")
        nights = (end - start).days
        if nights < 1:
            errors.append("Trip must be at least 1 night.")
        if nights > MAX_NIGHTS:
            errors.append(f"Trip cannot exceed {MAX_NIGHTS} nights.")
    except (ValueError, KeyError):
        errors.append("Invalid date format. Use YYYY-MM-DD.")

    # Travelers
    try:
        t = int(data.get("travelers", 0))
        if t < 1:
            errors.append("At least 1 traveler is required.")
        if t > MAX_TRAVELERS:
            errors.append(f"Maximum {MAX_TRAVELERS} travelers allowed.")
    except (ValueError, TypeError):
        errors.append("'travelers' must be a valid integer.")

    # Budget
    try:
        b = float(data.get("budget", 0))
        if b <= 0:
            errors.append("Budget must be greater than zero.")
    except (ValueError, TypeError):
        errors.append("'budget' must be a valid number.")

    # Currency
    currency = str(data.get("currency", "")).upper()
    if currency not in VALID_CURRENCIES:
        errors.append(f"Unsupported currency '{currency}'.")

    # Optional fields
    style = data.get("travel_style")
    if style and style not in VALID_STYLES:
        errors.append(f"Invalid travel_style '{style}'. Choose from: {', '.join(VALID_STYLES)}.")

    interests = data.get("interests", [])
    if interests:
        invalid = [i for i in interests if i not in VALID_INTERESTS]
        if invalid:
            errors.append(f"Unknown interests: {', '.join(invalid)}.")

    return errors
