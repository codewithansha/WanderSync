"""
WanderSync Places Routes
/api/places/autocomplete   — Destination autocomplete (for planner search bar)
/api/places/search         — General place search (for journey generation)
/api/places/destinations   — Curated world destinations for the Explore page
"""
import time
import logging
from flask import Blueprint, request, jsonify

places_bp = Blueprint("places", __name__, url_prefix="/api/places")
logger = logging.getLogger(__name__)

# ── Explore Destinations Catalog ─────────────────────────────────────────────
# 30 curated world destinations across 5 distinct travel categories.
# Premium high-resolution Unsplash photography is embedded directly for instant,
# zero-latency visual brilliance, enriched with Google Places ratings when available.

CURATED_DESTINATIONS = [
    # ── Popular ──────────────────────────────────────────────────────────────
    {
        "id": "paris",
        "city": "Paris",
        "country": "France",
        "category": "Popular",
        "landmark": "Eiffel Tower Paris France",
        "image": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80",
        "description": "The City of Light captivates with the Eiffel Tower, world-class museums, and legendary bistros tucked along cobbled boulevards.",
        "duration_hint": "4–7 days",
        "avg_budget": "$150–$300/day",
        "badge": "Trending",
        "rating": 4.8,
    },
    {
        "id": "tokyo",
        "city": "Tokyo",
        "country": "Japan",
        "category": "Popular",
        "landmark": "Senso-ji Temple Asakusa Tokyo Japan",
        "image": "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80",
        "description": "A futuristic metropolis where bullet trains, neon-lit districts, ancient shrines, and the finest ramen on earth coexist effortlessly.",
        "duration_hint": "5–10 days",
        "avg_budget": "$100–$250/day",
        "badge": "Editor's Pick",
        "rating": 4.9,
    },
    {
        "id": "dubai",
        "city": "Dubai",
        "country": "UAE",
        "category": "Popular",
        "landmark": "Burj Khalifa Dubai UAE",
        "image": "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80",
        "description": "Desert luxury meets sky-high ambition — from the Burj Khalifa to souks overflowing with spices and gold.",
        "duration_hint": "3–6 days",
        "avg_budget": "$200–$500/day",
        "badge": "Luxury",
        "rating": 4.7,
    },
    {
        "id": "bali",
        "city": "Bali",
        "country": "Indonesia",
        "category": "Popular",
        "landmark": "Tanah Lot Temple Bali Indonesia",
        "image": "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80",
        "description": "Rice terraces, sacred temples, surf-ready beaches, and vibrant night markets make Bali an endlessly rewarding island escape.",
        "duration_hint": "7–14 days",
        "avg_budget": "$50–$150/day",
        "badge": "Best Value",
        "rating": 4.8,
    },
    {
        "id": "new_york",
        "city": "New York",
        "country": "USA",
        "category": "Popular",
        "landmark": "Times Square New York City USA",
        "image": "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80",
        "description": "The city that never sleeps delivers iconic skylines, Broadway shows, world-renowned food markets, and boundless energy.",
        "duration_hint": "4–8 days",
        "avg_budget": "$200–$400/day",
        "badge": "Iconic",
        "rating": 4.7,
    },
    {
        "id": "london",
        "city": "London",
        "country": "UK",
        "category": "Popular",
        "landmark": "Big Ben Westminster London UK",
        "image": "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80",
        "description": "Royal palaces, cutting-edge galleries, multicultural street food, and world-class theatre in one thrilling world capital.",
        "duration_hint": "4–7 days",
        "avg_budget": "$180–$350/day",
        "badge": "Classic",
        "rating": 4.8,
    },
    # ── Culture ───────────────────────────────────────────────────────────────
    {
        "id": "rome",
        "city": "Rome",
        "country": "Italy",
        "category": "Culture",
        "landmark": "Colosseum Rome Italy",
        "image": "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80",
        "description": "Walk through millennia of history — from the Colosseum to Vatican City — then fuel up on the finest gelato in existence.",
        "duration_hint": "3–5 days",
        "avg_budget": "$120–$250/day",
        "badge": "UNESCO",
        "rating": 4.9,
    },
    {
        "id": "istanbul",
        "city": "Istanbul",
        "country": "Turkey",
        "category": "Culture",
        "landmark": "Hagia Sophia Istanbul Turkey",
        "image": "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80",
        "description": "Straddling two continents, Istanbul blends Byzantine mosaics, Ottoman bazaars, and a peerless Bosphorus waterfront.",
        "duration_hint": "4–7 days",
        "avg_budget": "$70–$180/day",
        "badge": "Hidden Gem",
        "rating": 4.8,
    },
    {
        "id": "kyoto",
        "city": "Kyoto",
        "country": "Japan",
        "category": "Culture",
        "landmark": "Fushimi Inari Shrine Kyoto Japan",
        "image": "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80",
        "description": "Ancient Japan preserved: thousands of temples, geisha districts, bamboo groves, and traditional tea ceremonies.",
        "duration_hint": "3–5 days",
        "avg_budget": "$100–$220/day",
        "badge": "Unmissable",
        "rating": 4.9,
    },
    {
        "id": "cairo",
        "city": "Cairo",
        "country": "Egypt",
        "category": "Culture",
        "landmark": "Great Pyramid of Giza Egypt",
        "image": "https://images.unsplash.com/photo-1572252009286-268acec5ca0a?auto=format&fit=crop&w=800&q=80",
        "description": "Stand before the last surviving Wonder of the Ancient World, explore pharaonic treasures, and sip tea on the Nile.",
        "duration_hint": "3–6 days",
        "avg_budget": "$50–$130/day",
        "badge": "Wonder",
        "rating": 4.7,
    },
    {
        "id": "athens",
        "city": "Athens",
        "country": "Greece",
        "category": "Culture",
        "landmark": "Parthenon Acropolis Athens Greece",
        "image": "https://images.unsplash.com/photo-1603565816030-6b389eeb23cb?auto=format&fit=crop&w=800&q=80",
        "description": "The cradle of democracy awaits — explore the Acropolis, sun-drenched ruins, and lively tavernas serving fresh seafood.",
        "duration_hint": "3–5 days",
        "avg_budget": "$100–$200/day",
        "badge": "Legendary",
        "rating": 4.8,
    },
    {
        "id": "marrakech",
        "city": "Marrakech",
        "country": "Morocco",
        "category": "Culture",
        "landmark": "Jemaa el-Fnaa Square Marrakech Morocco",
        "image": "https://images.unsplash.com/photo-1597212618440-806262de4f6b?auto=format&fit=crop&w=800&q=80",
        "description": "Labyrinthine medinas, fragrant spice souks, ornate riads, and the sensory spectacle of Djemaa el-Fna square.",
        "duration_hint": "3–5 days",
        "avg_budget": "$60–$160/day",
        "badge": "Vibrant",
        "rating": 4.7,
    },
    # ── Nature ────────────────────────────────────────────────────────────────
    {
        "id": "reykjavik",
        "city": "Reykjavik",
        "country": "Iceland",
        "category": "Nature",
        "landmark": "Gullfoss Waterfall Iceland",
        "image": "https://images.unsplash.com/photo-1504893524553-b855bce32c67?auto=format&fit=crop&w=800&q=80",
        "description": "Aurora borealis, geysers, black-sand beaches, and midnight sun — Iceland is the planet's most dramatic natural showroom.",
        "duration_hint": "5–9 days",
        "avg_budget": "$200–$400/day",
        "badge": "Bucket List",
        "rating": 4.9,
    },
    {
        "id": "queenstown",
        "city": "Queenstown",
        "country": "New Zealand",
        "category": "Nature",
        "landmark": "Lake Wakatipu Queenstown New Zealand",
        "image": "https://images.unsplash.com/photo-1507699622108-4be3abd695ad?auto=format&fit=crop&w=800&q=80",
        "description": "Fiordland fjords, snow-capped peaks, crystal lakes, and pristine hiking trails in the adventure capital of the world.",
        "duration_hint": "5–10 days",
        "avg_budget": "$130–$280/day",
        "badge": "Epic",
        "rating": 4.9,
    },
    {
        "id": "banff",
        "city": "Banff",
        "country": "Canada",
        "category": "Nature",
        "landmark": "Lake Louise Banff National Park Canada",
        "image": "https://images.unsplash.com/photo-1503614472-8c93d56e92ce?auto=format&fit=crop&w=800&q=80",
        "description": "Turquoise glacial lakes, towering Rockies, abundant wildlife, and some of North America's finest ski slopes.",
        "duration_hint": "4–7 days",
        "avg_budget": "$150–$300/day",
        "badge": "Breathtaking",
        "rating": 4.9,
    },
    {
        "id": "phuket",
        "city": "Phuket",
        "country": "Thailand",
        "category": "Nature",
        "landmark": "Phi Phi Islands Phuket Thailand",
        "image": "https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=800&q=80",
        "description": "Emerald waters, limestone karsts, coral reefs teeming with marine life, and powdery beaches at every turn.",
        "duration_hint": "5–10 days",
        "avg_budget": "$60–$180/day",
        "badge": "Paradise",
        "rating": 4.7,
    },
    {
        "id": "capetown",
        "city": "Cape Town",
        "country": "South Africa",
        "category": "Nature",
        "landmark": "Table Mountain Cape Town South Africa",
        "image": "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=800&q=80",
        "description": "Table Mountain, Cape of Good Hope, vineyard valleys, and vibrant marine life just beyond a stunning waterfront city.",
        "duration_hint": "5–10 days",
        "avg_budget": "$80–$200/day",
        "badge": "Stunning",
        "rating": 4.8,
    },
    {
        "id": "interlaken",
        "city": "Interlaken",
        "country": "Switzerland",
        "category": "Nature",
        "landmark": "Jungfraujoch top of Europe Switzerland",
        "image": "https://images.unsplash.com/photo-1527668752968-14dc70a27c95?auto=format&fit=crop&w=800&q=80",
        "description": "Nestled between two mountain lakes with Jungfrau as its backdrop — Europe's most spectacular alpine panorama.",
        "duration_hint": "3–5 days",
        "avg_budget": "$200–$450/day",
        "badge": "Alpine",
        "rating": 4.9,
    },
    # ── Adventure ─────────────────────────────────────────────────────────────
    {
        "id": "machu_picchu",
        "city": "Machu Picchu",
        "country": "Peru",
        "category": "Adventure",
        "landmark": "Machu Picchu ruins Peru",
        "image": "https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=800&q=80",
        "description": "Trek the Inca Trail to the Lost City of the Incas — misty mountaintop ruins that defy imagination and gravity alike.",
        "duration_hint": "4–8 days",
        "avg_budget": "$80–$200/day",
        "badge": "Ancient",
        "rating": 4.9,
    },
    {
        "id": "zanzibar",
        "city": "Zanzibar",
        "country": "Tanzania",
        "category": "Adventure",
        "landmark": "Stone Town Zanzibar Tanzania",
        "image": "https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=800&q=80",
        "description": "Spice-scented islands off the East African coast — dive pristine reefs, spice-tour lush forests, and unwind on white sand.",
        "duration_hint": "5–10 days",
        "avg_budget": "$80–$200/day",
        "badge": "Off-Beat",
        "rating": 4.7,
    },
    {
        "id": "maldives",
        "city": "Malé",
        "country": "Maldives",
        "category": "Adventure",
        "landmark": "Maldives overwater bungalow resort",
        "image": "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=800&q=80",
        "description": "Bungalows floating above crystalline lagoons, world-class scuba diving, and a horizon that stretches forever.",
        "duration_hint": "5–8 days",
        "avg_budget": "$300–$800/day",
        "badge": "Luxury",
        "rating": 4.9,
    },
    {
        "id": "rio",
        "city": "Rio de Janeiro",
        "country": "Brazil",
        "category": "Adventure",
        "landmark": "Christ the Redeemer Rio de Janeiro Brazil",
        "image": "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&w=800&q=80",
        "description": "Carnival rhythms, hang-gliding over Sugarloaf Mountain, favela tours, and legendary beaches like Copacabana.",
        "duration_hint": "5–9 days",
        "avg_budget": "$80–$200/day",
        "badge": "Vibrant",
        "rating": 4.7,
    },
    {
        "id": "kathmandu",
        "city": "Kathmandu",
        "country": "Nepal",
        "category": "Adventure",
        "landmark": "Boudhanath Stupa Kathmandu Nepal",
        "image": "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80",
        "description": "The gateway to Everest — ancient stupas, trekking trails into the Himalayas, and a spiritual energy unlike anywhere else.",
        "duration_hint": "7–14 days",
        "avg_budget": "$40–$120/day",
        "badge": "Epic Trek",
        "rating": 4.8,
    },
    {
        "id": "safari_nairobi",
        "city": "Nairobi",
        "country": "Kenya",
        "category": "Adventure",
        "landmark": "Masai Mara National Reserve Kenya",
        "image": "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80",
        "description": "The safari capital of the world — explore the Masai Mara, meet the Big Five, and sleep under a blanket of stars.",
        "duration_hint": "7–14 days",
        "avg_budget": "$150–$400/day",
        "badge": "Wildlife",
        "rating": 4.9,
    },
    # ── Food ─────────────────────────────────────────────────────────────────
    {
        "id": "barcelona",
        "city": "Barcelona",
        "country": "Spain",
        "category": "Food",
        "landmark": "Sagrada Familia Barcelona Spain",
        "image": "https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=800&q=80",
        "description": "Tapas bars, Mercado de la Boqueria, avant-garde Catalan restaurants, and sunset sangria on La Barceloneta.",
        "duration_hint": "4–7 days",
        "avg_budget": "$100–$220/day",
        "badge": "Foodie Haven",
        "rating": 4.8,
    },
    {
        "id": "bangkok",
        "city": "Bangkok",
        "country": "Thailand",
        "category": "Food",
        "landmark": "Wat Pho Temple Bangkok Thailand",
        "image": "https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=800&q=80",
        "description": "Street carts serving pad thai at midnight, Michelin-starred chef's tables, and floating markets at dawn — food never sleeps here.",
        "duration_hint": "4–7 days",
        "avg_budget": "$40–$120/day",
        "badge": "Street Food",
        "rating": 4.8,
    },
    {
        "id": "osaka",
        "city": "Osaka",
        "country": "Japan",
        "category": "Food",
        "landmark": "Dotonbori Osaka Japan",
        "image": "https://images.unsplash.com/photo-1590559899731-a372a1464e79?auto=format&fit=crop&w=800&q=80",
        "description": "Japan's kitchen — takoyaki, okonomiyaki, ramen, and omakase sushi in a city that lives and breathes gastronomy.",
        "duration_hint": "3–5 days",
        "avg_budget": "$80–$200/day",
        "badge": "Michelin Stars",
        "rating": 4.9,
    },
    {
        "id": "singapore",
        "city": "Singapore",
        "country": "Singapore",
        "category": "Food",
        "landmark": "Gardens by the Bay Singapore",
        "image": "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=800&q=80",
        "description": "Hawker centres serving the world's cheapest Michelin-starred food alongside rooftop restaurants with jaw-dropping skyline views.",
        "duration_hint": "3–5 days",
        "avg_budget": "$100–$250/day",
        "badge": "World's Best",
        "rating": 4.9,
    },
    {
        "id": "naples",
        "city": "Naples",
        "country": "Italy",
        "category": "Food",
        "landmark": "Castel dell'Ovo Naples Italy",
        "image": "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80",
        "description": "The birthplace of pizza — wood-fired Neapolitan pies, freshest seafood from the Gulf, and limoncello at every corner.",
        "duration_hint": "3–5 days",
        "avg_budget": "$80–$160/day",
        "badge": "Authentic",
        "rating": 4.7,
    },
    {
        "id": "lima",
        "city": "Lima",
        "country": "Peru",
        "category": "Food",
        "landmark": "Miraflores Waterfront Lima Peru",
        "image": "https://images.unsplash.com/photo-1531968455001-5c5272a41129?auto=format&fit=crop&w=800&q=80",
        "description": "South America's culinary capital — ceviches, causa, tiradito, and the legendary Central restaurant in one coastal gem.",
        "duration_hint": "3–5 days",
        "avg_budget": "$60–$160/day",
        "badge": "Rising Star",
        "rating": 4.8,
    },
]


# ── Routes ────────────────────────────────────────────────────────────────────

@places_bp.route("/autocomplete", methods=["GET"])
def autocomplete():
    q = request.args.get("q", "").strip()
    if len(q) < 2:
        return jsonify([])
    try:
        from services.google_places_service import autocomplete_destination
        return jsonify(autocomplete_destination(q))
    except Exception as e:
        logger.error(f"Autocomplete error: {e}")
        return jsonify([])


@places_bp.route("/search", methods=["GET"])
def search():
    q = request.args.get("q", "").strip()
    if not q:
        return jsonify({"error": "Query required"}), 400
    lat = request.args.get("lat")
    lng = request.args.get("lng")
    location = {}
    if lat and lng:
        try:
            location = {"lat": float(lat), "lng": float(lng)}
        except ValueError:
            pass
    try:
        from services.google_places_service import search_places
        places = search_places(
            destination_name=q,
            location=location,
            place_types=[],
            max_results=10,
            keyword=q,
        )
        return jsonify(places)
    except Exception as e:
        logger.error(f"Place search error: {e}")
        return jsonify({"error": "Places search temporarily unavailable"}), 500


@places_bp.route("/destinations", methods=["GET"])
def get_destinations():
    """
    Return the curated 30-destination discovery catalog with direct HD imagery,
    editorial travel insights, budget ranges, and category tags.
    """
    return jsonify(CURATED_DESTINATIONS)
