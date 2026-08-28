"""
WanderSync Money Utilities — currency symbols, formatting, exchange rates.
All arithmetic is done in budget_service.py using Decimal.
"""

CURRENCY_SYMBOLS = {
    "USD": "$", "PKR": "₨", "EUR": "€", "GBP": "£",
    "AED": "AED ", "JPY": "¥", "AUD": "A$", "CAD": "C$",
    "SGD": "S$", "INR": "₹", "TRY": "₺", "ZAR": "R",
    "IDR": "Rp ", "THB": "฿", "BRL": "R$", "MXN": "MX$",
    "SAR": "SAR ", "KWD": "KD ", "QAR": "QR ", "OMR": "OMR ",
    "CNY": "¥", "KRW": "₩", "HKD": "HK$", "TWD": "NT$",
    "CHF": "CHF ", "SEK": "kr ", "NOK": "kr ", "DKK": "kr ",
    "NZD": "NZ$",
}

CURRENCY_NAMES = {
    "USD": "US Dollar", "PKR": "Pakistani Rupee", "EUR": "Euro",
    "GBP": "British Pound", "AED": "UAE Dirham", "JPY": "Japanese Yen",
    "AUD": "Australian Dollar", "CAD": "Canadian Dollar",
    "SGD": "Singapore Dollar", "INR": "Indian Rupee",
    "TRY": "Turkish Lira", "ZAR": "South African Rand",
    "IDR": "Indonesian Rupiah", "THB": "Thai Baht",
}

SUPPORTED_CURRENCIES = sorted(CURRENCY_SYMBOLS.keys())


def get_symbol(currency: str) -> str:
    return CURRENCY_SYMBOLS.get(currency.upper(), currency)


def format_amount(amount: float, currency: str, show_decimals: bool = False) -> str:
    symbol = get_symbol(currency)
    if show_decimals:
        return f"{symbol}{amount:,.2f}"
    return f"{symbol}{int(round(amount)):,}"
