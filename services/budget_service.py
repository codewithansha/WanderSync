"""
WanderSync Budget Engine
All monetary arithmetic uses Python Decimal — never delegated to AI.
Calculates: accommodation, food, transport, activities, miscellaneous,
            contingency, total, remaining, over-budget amount.
"""
import logging
from decimal import Decimal, ROUND_HALF_UP, InvalidOperation

logger = logging.getLogger(__name__)

# ── Exchange rates (approximate fixed, indexed to USD) ─────────────────────────
CURRENCY_TO_USD: dict = {
    "USD": Decimal("1"),
    "PKR": Decimal("1") / Decimal("280"),
    "EUR": Decimal("1") / Decimal("0.92"),
    "GBP": Decimal("1") / Decimal("0.79"),
    "AED": Decimal("1") / Decimal("3.67"),
    "JPY": Decimal("1") / Decimal("150"),
    "AUD": Decimal("1") / Decimal("1.55"),
    "CAD": Decimal("1") / Decimal("1.36"),
    "SGD": Decimal("1") / Decimal("1.34"),
    "INR": Decimal("1") / Decimal("83"),
    "TRY": Decimal("1") / Decimal("32"),
    "ZAR": Decimal("1") / Decimal("18.5"),
    "IDR": Decimal("1") / Decimal("15600"),
    "THB": Decimal("1") / Decimal("35"),
    "BRL": Decimal("1") / Decimal("5"),
    "MXN": Decimal("1") / Decimal("17"),
    "SAR": Decimal("1") / Decimal("3.75"),
    "KWD": Decimal("3.26"),
    "QAR": Decimal("1") / Decimal("3.64"),
    "OMR": Decimal("2.6"),
    "CNY": Decimal("1") / Decimal("7.25"),
    "KRW": Decimal("1") / Decimal("1350"),
    "HKD": Decimal("1") / Decimal("7.82"),
    "CHF": Decimal("1") / Decimal("0.9"),
    "SEK": Decimal("1") / Decimal("10.5"),
    "NOK": Decimal("1") / Decimal("10.5"),
    "DKK": Decimal("1") / Decimal("6.9"),
    "NZD": Decimal("1") / Decimal("1.65"),
}

# ── Destination cost indices (USD/person/night or /day) ───────────────────────
# Format: {accommodation_per_night, food_per_day, transport_per_day, activities_per_day}
# These are PER ROOM/UNIT for accommodation, PER PERSON for others.
DESTINATION_COSTS: dict = {
    "dubai":       {"acc": 130, "food": 50, "trans": 25, "act": 45},
    "abu dhabi":   {"acc": 110, "food": 45, "trans": 22, "act": 38},
    "paris":       {"acc": 150, "food": 60, "trans": 20, "act": 50},
    "london":      {"acc": 160, "food": 55, "trans": 25, "act": 45},
    "new york":    {"acc": 190, "food": 65, "trans": 20, "act": 55},
    "tokyo":       {"acc": 95,  "food": 40, "trans": 15, "act": 35},
    "osaka":       {"acc": 80,  "food": 35, "trans": 12, "act": 30},
    "bali":        {"acc": 40,  "food": 18, "trans": 12, "act": 22},
    "bangkok":     {"acc": 35,  "food": 15, "trans": 8,  "act": 20},
    "istanbul":    {"acc": 55,  "food": 22, "trans": 10, "act": 25},
    "rome":        {"acc": 120, "food": 50, "trans": 15, "act": 38},
    "barcelona":   {"acc": 110, "food": 45, "trans": 12, "act": 36},
    "amsterdam":   {"acc": 140, "food": 50, "trans": 15, "act": 42},
    "sydney":      {"acc": 140, "food": 55, "trans": 20, "act": 45},
    "melbourne":   {"acc": 125, "food": 50, "trans": 18, "act": 40},
    "singapore":   {"acc": 130, "food": 38, "trans": 15, "act": 42},
    "cape town":   {"acc": 65,  "food": 28, "trans": 15, "act": 32},
    "karachi":     {"acc": 30,  "food": 10, "trans": 5,  "act": 15},
    "lahore":      {"acc": 25,  "food": 8,  "trans": 4,  "act": 12},
    "islamabad":   {"acc": 28,  "food": 9,  "trans": 5,  "act": 14},
    "miami":       {"acc": 160, "food": 55, "trans": 22, "act": 45},
    "los angeles": {"acc": 170, "food": 60, "trans": 25, "act": 50},
    "toronto":     {"acc": 150, "food": 50, "trans": 18, "act": 42},
    "maldives":    {"acc": 280, "food": 70, "trans": 30, "act": 60},
    "default":     {"acc": 90,  "food": 40, "trans": 18, "act": 35},
}

# ── Travel style multipliers ───────────────────────────────────────────────────
STYLE_MULT: dict = {
    "Budget":   Decimal("0.55"),
    "Balanced": Decimal("1.00"),
    "Premium":  Decimal("1.85"),
    "Luxury":   Decimal("3.50"),
}


def _d(v) -> Decimal:
    """Safe Decimal conversion."""
    try:
        return Decimal(str(v))
    except InvalidOperation:
        return Decimal("0")


def _round2(v: Decimal) -> Decimal:
    return v.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _round0(v: Decimal) -> Decimal:
    return v.quantize(Decimal("1"), rounding=ROUND_HALF_UP)


def to_usd(amount: Decimal, currency: str) -> Decimal:
    rate = CURRENCY_TO_USD.get(currency.upper(), Decimal("1"))
    return _round2(amount * rate)


def from_usd(usd: Decimal, currency: str) -> Decimal:
    rate = CURRENCY_TO_USD.get(currency.upper(), Decimal("1"))
    if rate == Decimal("0"):
        return usd
    return _round2(usd / rate)


def _get_dest_costs(destination: str) -> dict:
    key = destination.lower().split(",")[0].strip()
    return DESTINATION_COSTS.get(key, DESTINATION_COSTS["default"])


def estimate_trip_cost(
    destination: str,
    nights: int,
    days: int,
    travelers: int,
    travel_style: str,
    currency: str,
) -> dict:
    """
    Estimate total trip cost in user's currency using destination cost indices.
    All arithmetic done with Decimal. Returns breakdown dict with Decimal values.
    """
    costs = _get_dest_costs(destination)
    mult = STYLE_MULT.get(travel_style, Decimal("1"))

    n = _d(nights)
    d = _d(days)
    t = _d(travelers)

    # Accommodation: per room per night (1 room per 2 adults, minimum 1)
    rooms = max(Decimal("1"), (t / Decimal("2")).quantize(Decimal("1"), rounding=ROUND_HALF_UP))
    acc_usd = _d(costs["acc"]) * n * rooms * mult

    # Food, transport, activities: per person per day
    food_usd  = _d(costs["food"])  * d * t * mult
    trans_usd = _d(costs["trans"]) * d * t * mult
    act_usd   = _d(costs["act"])   * d * t * mult

    # Miscellaneous: 8% of above
    misc_usd = (acc_usd + food_usd + trans_usd + act_usd) * Decimal("0.08")
    total_usd = acc_usd + food_usd + trans_usd + act_usd + misc_usd

    def conv(v):
        return _round0(from_usd(v, currency))

    return {
        "accommodation":  conv(acc_usd),
        "food":           conv(food_usd),
        "transportation": conv(trans_usd),
        "activities":     conv(act_usd),
        "miscellaneous":  conv(misc_usd),
        "contingency":    Decimal("0"),
        "total":          conv(total_usd),
        "currency":       currency,
        "nights":         nights,
        "days":           days,
        "travelers":      travelers,
        "per_person":     _round0(conv(total_usd) / t),
        "per_day":        _round0(conv(total_usd) / d),
        "usd_equivalent": _round2(total_usd),
        "optimization_applied": False,
        "optimization_attempts": 0,
    }


def assess_budget(budget: Decimal, estimated: Decimal, currency: str) -> dict:
    """
    Honestly compare budget vs. estimated cost.
    Never says 'within budget' when over budget.
    """
    remaining = budget - estimated
    over_amount = max(Decimal("0"), -remaining)
    status = "within_budget" if remaining >= Decimal("0") else "over_budget"
    pct = _round2(estimated / budget * Decimal("100")) if budget > 0 else Decimal("0")
    feasible = (status == "within_budget") or (over_amount / budget < Decimal("0.5"))

    return {
        "status":         status,
        "budget":         budget,
        "estimated_total": estimated,
        "remaining":      remaining,
        "over_amount":    over_amount,
        "percent_used":   float(pct),
        "is_feasible":    feasible,
        "currency":       currency,
    }


def optimize_for_budget(
    breakdown: dict,
    budget: Decimal,
    max_attempts: int = 3,
) -> dict:
    """
    Iteratively reduce costs to approach budget.
    Bounded — never creates an infinite loop.
    Reduces activities first, then food, then accommodation (with floor).
    """
    current = dict(breakdown)
    total = current["total"]
    attempt = 0

    while attempt < max_attempts and total > budget:
        # 15% reduction each pass, applied to flexible categories
        factor = Decimal("0.85")

        current["activities"]    = _round0(current["activities"]    * factor)
        current["food"]          = _round0(current["food"]          * factor)
        current["miscellaneous"] = _round0(current["miscellaneous"] * factor)

        # Accommodation: reduce but floor at 20% of budget
        acc_floor = _round0(budget * Decimal("0.20"))
        current["accommodation"] = max(
            _round0(current["accommodation"] * factor),
            acc_floor,
        )

        # Recalculate total
        total = (
            current["accommodation"] +
            current["food"] +
            current["transportation"] +
            current["activities"] +
            current["miscellaneous"]
        )
        current["total"] = total
        attempt += 1

    travelers = _d(current.get("travelers", 1))
    days_val  = _d(current.get("days", 1))
    current["total"]                = _round0(total)
    current["per_person"]           = _round0(total / travelers)
    current["per_day"]              = _round0(total / days_val)
    current["optimization_applied"] = attempt > 0
    current["optimization_attempts"] = attempt
    return current


def serialize_breakdown(breakdown: dict) -> dict:
    """Convert Decimal values to float for JSON serialisation."""
    return {k: float(v) if isinstance(v, Decimal) else v for k, v in breakdown.items()}
