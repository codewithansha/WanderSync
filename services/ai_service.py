"""
WanderSync AI Service — Multi-Provider Architecture (Gemini + OpenAI Fallback).

Primary roles:
  Google Gemini  → Conversational chatbot (AI Maestro), live itinerary modifications, enrichments
  OpenAI GPT-4o  → Structured itinerary generation, robust fallback chatbot
"""
import os
import json
import logging
import time
from typing import Optional, Tuple

logger = logging.getLogger(__name__)

# Fallback chain of active Gemini models
GEMINI_MODELS = [
    os.getenv("GEMINI_MODEL", "gemini-3.5-flash"),
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-flash-lite-latest",
    "gemini-3.6-flash",
]

_openai_client = None
_gemini_client = None


def _get_openai():
    global _openai_client
    if _openai_client is None:
        key = os.getenv("OPENAI_API_KEY", "").strip()
        if not key:
            raise ValueError("OPENAI_API_KEY is not configured in .env")
        from openai import OpenAI
        _openai_client = OpenAI(api_key=key, max_retries=1, timeout=20.0)
    return _openai_client


def _get_gemini():
    global _gemini_client
    if _gemini_client is None:
        key = os.getenv("GEMINI_API_KEY", "").strip()
        if not key:
            raise ValueError("GEMINI_API_KEY is not configured in .env")
        try:
            from google import genai
            _gemini_client = genai.Client(api_key=key)
        except ImportError:
            raise RuntimeError("google-genai is not installed. Run: pip install google-genai")
    return _gemini_client


# ── System Prompts ─────────────────────────────────────────────────────────────

ITINERARY_SYSTEM = """You are WanderSync's AI Itinerary Architect powered by OpenAI GPT-4o / Gemini.

CRITICAL RULES:
1. You MUST ONLY use place_ids from the provided REAL PLACES LIST.
2. NEVER invent, hallucinate, or add any place not in the provided list.
3. If a meal slot has no suitable place in the list, skip it — do not invent a restaurant.
4. Return ONLY valid JSON matching the schema exactly — no extra text.
5. Distribute activities geographically: group nearby places on the same day.
6. Realistic timing: leave travel gaps between distant stops.
7. Activities per day based on travel_style: Budget=3, Balanced=4, Premium=4, Luxury=3.
8. Include morning, afternoon, and evening slots."""

CHATBOT_SYSTEM = """You are WanderSync — an elite, context-aware AI Travel Concierge & Maestro.

You have full real-time context of the traveler's current itinerary, verified places, budget, and travel preferences.

Your capabilities:
- Provide specific, culturally rich, and practical travel guidance for the destination
- Answer questions directly based on the active journey context
- Explain budget allocations using verified numbers (do not invent currency conversions)
- Suggest itinerary modifications, hidden gems, and dining spots (describe authentic styles)
- Advise on weather expectations, cultural etiquette, transit, and local safety tips

Guidelines:
- Never hallucinate fake addresses or invented attractions
- Format responses cleanly with Markdown (bold headings, bullet points, concise sections)
- Be inspiring, sophisticated, warm, and highly actionable"""


# ── 1. Context-Aware Chatbot (Gemini Primary + Resilient Model Chain + OpenAI Fallback) ──

def chat_gemini(query: str, journey_context: str = "", history: list = None) -> str:
    """
    Generate conversational travel answer.
    Tries resilient Gemini models in sequence, then falls back to OpenAI.
    """
    logger.info(f"[CHAT] Request received: query='{query[:60]}...' | trip_context_len={len(journey_context)}")
    
    gemini_key_present = bool(os.getenv("GEMINI_API_KEY"))
    openai_key_present = bool(os.getenv("OPENAI_API_KEY"))
    logger.info(f"[CHAT] API keys configured -> Gemini: {gemini_key_present}, OpenAI: {openai_key_present}")

    full_query = query
    if journey_context:
        full_query = f"### CURRENT TRIP & ITINERARY CONTEXT:\n{journey_context}\n\n### TRAVELER MESSAGE:\n{query}"

    # Try Gemini models chain
    if gemini_key_present:
        try:
            client = _get_gemini()
            from google.genai import types as genai_types

            # Prepare multi-turn chat contents
            contents = []
            if history and isinstance(history, list):
                for msg in history[:-1]:
                    role = "user" if msg.get("role") in ["user", "human"] else "model"
                    txt = (msg.get("content") or msg.get("text") or "").strip()
                    if txt:
                        contents.append({"role": role, "parts": [{"text": txt}]})
            contents.append({"role": "user", "parts": [{"text": full_query}]})

            # Try models in chain
            last_gemini_error = None
            for model_name in GEMINI_MODELS:
                try:
                    logger.info(f"[CHAT] Attempting Gemini model: {model_name}")
                    start_t = time.time()
                    response = client.models.generate_content(
                        model=model_name,
                        contents=contents,
                        config=genai_types.GenerateContentConfig(
                            system_instruction=CHATBOT_SYSTEM,
                            temperature=0.7,
                            max_output_tokens=2048,
                        ),
                    )
                    elapsed = round((time.time() - start_t) * 1000)
                    if response and response.text:
                        logger.info(f"[CHAT] SUCCESS via Gemini [{model_name}] in {elapsed}ms")
                        return response.text
                except Exception as model_err:
                    last_gemini_error = model_err
                    logger.warning(f"[CHAT] Model {model_name} failed: {model_err}")
                    continue

            logger.error(f"[CHAT ERROR] All Gemini models exhausted. Last error: {last_gemini_error}")
        except Exception as e:
            logger.error(f"[CHAT ERROR] Gemini initialization/execution error: {e}")

    # Fallback to OpenAI
    logger.info("[CHAT] Initiating OpenAI GPT-4o fallback...")
    return _chat_openai_fallback(query, journey_context, history)


def _chat_openai_fallback(query: str, journey_context: str = "", history: list = None) -> str:
    """OpenAI fallback for conversational chat, with intelligent built-in concierge fallback."""
    openai_key = os.getenv("OPENAI_API_KEY", "").strip()
    if openai_key:
        try:
            client = _get_openai()
            messages = [{"role": "system", "content": CHATBOT_SYSTEM}]

            if history and isinstance(history, list):
                for msg in history[:-1]:
                    role = "user" if msg.get("role") in ["user", "human"] else "assistant"
                    txt = (msg.get("content") or msg.get("text") or "").strip()
                    if txt:
                        messages.append({"role": role, "content": txt})

            user_content = query
            if journey_context:
                user_content = f"Journey Context:\n{journey_context}\n\nQuestion: {query}"
            messages.append({"role": "user", "content": user_content})

            for oai_model in ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"]:
                try:
                    logger.info(f"[CHAT] Attempting OpenAI model: {oai_model}")
                    response = client.chat.completions.create(
                        model=oai_model,
                        messages=messages,
                        temperature=0.7,
                        max_tokens=1500,
                        timeout=20,
                    )
                    res_text = response.choices[0].message.content
                    if res_text:
                        logger.info(f"[CHAT] SUCCESS via OpenAI [{oai_model}]")
                        return res_text
                except Exception as oai_err:
                    logger.warning(f"[CHAT] OpenAI model {oai_model} failed: {oai_err}")
                    continue

        except Exception as e:
            logger.warning(f"[CHAT] OpenAI fallback skipped: {e}")

    # Fallback to WanderSync Concierge Assistant
    return _generate_concierge_fallback(query, journey_context)


def _generate_concierge_fallback(query: str, journey_context: str = "") -> str:
    """Context-aware local travel concierge response generator."""
    q_lower = (query or "").lower()

    # Extract destination from context if present
    dest = "your destination"
    if journey_context:
        for line in journey_context.splitlines():
            if line.startswith("DESTINATION:"):
                dest = line.split(":", 1)[1].strip()
                break

    # Budget & Cost queries
    if any(w in q_lower for w in ["budget", "cost", "money", "price", "expensive", "cheap", "spend"]):
        return (
            f"### 💰 Budget & Expense Guidance for {dest}\n\n"
            f"Based on your active trip plan, here are practical budget recommendations:\n\n"
            f"- **Daily Allocation**: Keep track of accommodation and dining as primary expense categories.\n"
            f"- **Local Currency**: Use local ATMs or cards with low foreign transaction fees for better exchange rates.\n"
            f"- **Smart Savings**: Booking landmark tickets in advance and utilizing local transit or walking tours offers great value.\n\n"
            f"*Tip: You can adjust activities and budget allocations anytime in the **Trip Budget** tab.*"
        )

    # Weather & Packing queries
    if any(w in q_lower for w in ["weather", "pack", "clothes", "wear", "rain", "temperature", "climate"]):
        return (
            f"### 🌤️ Weather & Packing Tips for {dest}\n\n"
            f"To make the most of your journey to {dest}:\n\n"
            f"- **Footwear**: Pack comfortable walking shoes suitable for exploring historical districts and cobblestone streets.\n"
            f"- **Layering**: Bring light, breathable layers for daytime and a warm jacket or sweater for evenings.\n"
            f"- **Essentials**: Don't forget a universal power adapter, portable power bank, and a compact umbrella.\n\n"
            f"*Check the **Weather** tab for 7-day forecasts and hourly precipitation.*"
        )

    # Itinerary, places, & recommendation queries
    if any(w in q_lower for w in ["day", "itinerary", "places", "visit", "recommend", "food", "eat", "restaurant", "hotel", "must see"]):
        return (
            f"### 📍 Itinerary & Discovery for {dest}\n\n"
            f"Here is how to experience the best of {dest}:\n\n"
            f"1. **Morning (09:00 - 12:00)**: Start early at primary iconic landmarks and cultural sights to avoid peak crowds.\n"
            f"2. **Midday (12:30 - 15:00)**: Enjoy authentic regional cuisine at local bistros and explore vibrant neighborhood markets.\n"
            f"3. **Evening (17:30 - 21:00)**: Catch scenic sunset viewpoints followed by dinner and illuminated evening strolls.\n\n"
            f"*You can customize stops, lock favorites, or reorder days directly in your **Itinerary** view.*"
        )

    # General travel guidance
    return (
        f"### ✈️ WanderSync Travel Concierge — {dest}\n\n"
        f"I'm here to assist with your journey to **{dest}**! Here are a few things I can help you with:\n\n"
        f"- 🗺️ **Itinerary Customization**: Reordering stops, adding dining spots, or optimizing day pacing.\n"
        f"- 💵 **Budget Optimization**: Analyzing costs and maximizing value across categories.\n"
        f"- 🌍 **Local Insights**: Recommending authentic cultural experiences, hidden gems, and safety tips.\n\n"
        f"Feel free to ask specific questions about your daily schedule, budget, or destination highlights!"
    )


# ── 2. OpenAI: Structured Itinerary Generation (PRIMARY) ─────────────────────────

def generate_itinerary_openai(
    places_by_category: dict,
    preferences: dict,
    dates: dict,
) -> Optional[dict]:
    """
    Generate structured day-by-day itinerary using OpenAI GPT-4o.
    Only selects from real Google Places data provided.
    """
    try:
        client = _get_openai()

        available = []
        for cat, places in places_by_category.items():
            for p in places:
                available.append({
                    "place_id":    p["place_id"],
                    "name":        p["name"],
                    "address":     p.get("address", ""),
                    "category":    cat,
                    "rating":      p.get("rating"),
                    "price_level": p.get("price_level", "PRICE_LEVEL_UNSPECIFIED"),
                    "types":       p.get("types", [])[:3],
                    "lat":         p.get("location", {}).get("lat"),
                    "lng":         p.get("location", {}).get("lng"),
                })

        nights = dates.get("nights", 1)
        days = dates.get("days", 1)
        start = dates.get("start_date", "2026-09-01")
        dest = preferences.get('destination', 'the destination')

        if available:
            places_clause = f"AVAILABLE REAL PLACES — you MUST select from these place_ids:\n{json.dumps(available, indent=2)}"
        else:
            places_clause = f"Curate authentic, world-famous real attractions, historic landmarks, and top culinary stops in {dest}."

        user_prompt = f"""Create a comprehensive {days}-day itinerary ({nights} nights) for {dest}.

TRIP DETAILS:
- Destination: {dest}
- Origin: {preferences.get('origin', 'N/A')}
- Travelers: {preferences.get('travelers', 2)} ({preferences.get('adults', 2)} adults, {preferences.get('children', 0)} children)
- Travel Style: {preferences.get('travel_style', 'Balanced')}
- Interests: {', '.join(preferences.get('interests', ['Culture', 'Food', 'Nature']))}
- Accommodation: {preferences.get('accommodation', 'Any')}
- Transportation: {preferences.get('transportation', 'Any')}

{places_clause}

Return ONLY this JSON schema:
{{
  "itinerary_title": "Creative trip title for {dest}",
  "days": [
    {{
      "day_number": 1,
      "date": "{start}",
      "title": "Catchy day title",
      "theme": "Day theme (2-4 words)",
      "activities": [
        {{
          "place_id": "place_id_or_attraction_name",
          "place_name": "Specific real name of attraction, monument, museum or restaurant",
          "category": "Culture|Food|Nature|Adventure|Shopping",
          "start_time": "09:00",
          "end_time": "11:00",
          "duration_minutes": 120,
          "meal_type": "breakfast|lunch|dinner|snack|null",
          "estimated_cost_per_person_usd": 15,
          "notes": "1-2 sentence practical tip for this stop"
        }}
      ]
    }}
  ]
}}

Day dates: Day 1 = {start}, increment by one calendar day per day.
Include 3-4 distinct activities per day for every single day from Day 1 to Day {days}.
"""

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": ITINERARY_SYSTEM},
                {"role": "user",   "content": user_prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
            max_tokens=4000,
            timeout=45,
        )

        text = response.choices[0].message.content
        result = json.loads(text)

        if not result.get("days") or not isinstance(result["days"], list):
            logger.warning("OpenAI returned invalid itinerary structure")
            return None

        logger.info(f"OpenAI generated itinerary: {len(result['days'])} days")
        return result

    except Exception as e:
        logger.error(f"OpenAI itinerary generation failed: {e}")
        return None


# ── 3. Gemini: Structured Itinerary Fallback ─────────────────────────────────────

def generate_itinerary_gemini_fallback(
    places_by_category: dict,
    preferences: dict,
    dates: dict,
) -> Optional[dict]:
    """
    Itinerary generation using Gemini (runs as primary or fallback).
    Produces 3-4 rich real activities per day for the entire trip duration.
    """
    try:
        client = _get_gemini()

        available = []
        for cat, places in places_by_category.items():
            for p in places[:10]:
                available.append({
                    "place_id": p.get("place_id", ""),
                    "name":     p.get("name", ""),
                    "category": cat,
                    "rating":   p.get("rating"),
                    "lat":      p.get("location", {}).get("lat"),
                    "lng":      p.get("location", {}).get("lng"),
                })

        days = dates.get("days", 1)
        start = dates.get("start_date", "2026-09-01")
        dest = preferences.get('destination', 'the destination')

        if available:
            places_clause = f"Select from these real places:\n{json.dumps(available, indent=1)}"
        else:
            places_clause = f"Curate real, famous attractions, iconic sights, and top restaurants in {dest}."

        prompt = f"""Create a detailed {days}-day travel itinerary for {dest}.
Travel style: {preferences.get('travel_style', 'Balanced')}
Interests: {', '.join(preferences.get('interests', ['Culture', 'Food', 'Nature']))}
Travelers: {preferences.get('travelers', 2)}

{places_clause}

CRITICAL: Return exactly {days} days. Each day MUST have 3 to 4 activities.

Return JSON with this EXACT structure:
{{
  "itinerary_title": "{dest} Exploration",
  "days": [
    {{
      "day_number": 1,
      "date": "{start}",
      "title": "Day 1 Highlights",
      "theme": "City Discovery",
      "activities": [
        {{
          "place_id": "place_name_or_id",
          "place_name": "Specific real name of attraction, museum, or restaurant",
          "category": "Culture",
          "start_time": "09:00",
          "end_time": "11:00",
          "duration_minutes": 120,
          "meal_type": null,
          "estimated_cost_per_person_usd": 15,
          "notes": "Short practical tip"
        }}
      ]
    }}
  ]
}}"""

        from google.genai import types as genai_types
        for model_name in GEMINI_MODELS:
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=genai_types.GenerateContentConfig(
                        response_mime_type="application/json",
                        temperature=0.3,
                        max_output_tokens=4096,
                    ),
                )
                raw = response.text or ""
                # Safe JSON extraction — handle truncated responses
                try:
                    result = json.loads(raw)
                except json.JSONDecodeError:
                    # Try to extract the largest valid JSON object from the response
                    import re
                    match = re.search(r'\{.*"days"\s*:\s*\[', raw, re.DOTALL)
                    if match:
                        # Count braces to find the end of the valid JSON
                        start = match.start()
                        depth = 0
                        end = start
                        for i, ch in enumerate(raw[start:], start):
                            if ch == '{':
                                depth += 1
                            elif ch == '}':
                                depth -= 1
                                if depth == 0:
                                    end = i + 1
                                    break
                        try:
                            result = json.loads(raw[start:end])
                        except Exception:
                            logger.warning(f"Gemini {model_name}: could not recover truncated JSON, trying next model")
                            continue
                    else:
                        logger.warning(f"Gemini {model_name}: malformed JSON response, trying next model")
                        continue

                if result.get("days") and len(result["days"]) > 0:
                    logger.info(f"Gemini generated itinerary via {model_name}: {len(result['days'])} days")
                    return result
            except Exception as m_err:
                logger.warning(f"Gemini itinerary model {model_name} failed: {m_err}")
                continue

        return None
    except Exception as e:
        logger.error(f"Gemini itinerary fallback also failed: {e}")
        return None

# ── 4. Enrich Activity Descriptions ──────────────────────────────────────────

def enrich_activity_descriptions(merged_days: list, destination_name: str = "", travel_style: str = "Balanced") -> list:
    """
    Enrich activity descriptions with practical local insights and traveler advice.
    Gracefully falls back to curated tips if AI is unavailable.
    """
    if not merged_days or not isinstance(merged_days, list):
        return merged_days or []

    # Category-based authentic traveler insights
    category_tips = {
        "Food": "Sample local specialties and signature chef recommendations. Ask for seasonal pairings.",
        "Culture": "Immerse in the heritage, architecture, and cultural storytelling of this historic site.",
        "Nature": "Take in scenic viewpoints, panoramic photo spots, and peaceful natural surroundings.",
        "Adventure": "Wear comfortable footwear and prepare for exciting exploration and dynamic activities.",
        "History": "Discover fascinating historical backstories and landmark architecture with local context.",
        "Shopping": "Explore unique local artisan boutiques, curated souvenirs, and specialty markets.",
        "Nightlife": "Enjoy vibrant evening ambiance, signature beverages, and lively local entertainment.",
    }

    try:
        gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
        if gemini_key:
            client = _get_gemini()
            from google.genai import types as genai_types

            # Collect activity titles that need descriptions
            pending_activities = []
            for day in merged_days:
                for act in day.get("activities", []):
                    if not act.get("description") or len(act.get("description", "")) < 20:
                        pending_activities.append(act.get("title") or act.get("name") or "Activity")

            if pending_activities and len(pending_activities) <= 15:
                prompt = (
                    f"For a {travel_style.lower()} trip to {destination_name}, provide a 1-sentence engaging, "
                    f"practical traveler tip for each of these places:\n"
                    + "\n".join(f"- {name}" for name in pending_activities[:12])
                    + "\n\nReturn JSON: {\"tips\": {\"Place Name\": \"One sentence tip\"}}"
                )

                for model_name in GEMINI_MODELS:
                    try:
                        response = client.models.generate_content(
                            model=model_name,
                            contents=prompt,
                            config=genai_types.GenerateContentConfig(
                                response_mime_type="application/json",
                                temperature=0.4,
                                max_output_tokens=1000,
                            ),
                        )
                        if response and response.text:
                            data = json.loads(response.text)
                            tips = data.get("tips", {})
                            for day in merged_days:
                                for act in day.get("activities", []):
                                    title = act.get("title") or act.get("name")
                                    if title in tips:
                                        act["description"] = tips[title]
                                        act["notes"] = tips[title]
                            break
                    except Exception as m_err:
                        logger.debug(f"Gemini enrichment model {model_name} skipped: {m_err}")
                        continue
    except Exception as e:
        logger.debug(f"AI description enrichment fallback to rule-based tips: {e}")

    # Ensure all activities have a description
    for day in merged_days:
        for act in day.get("activities", []):
            if not act.get("description"):
                cat = act.get("category", "Culture")
                tip = category_tips.get(cat, f"Experience the best of {destination_name} at this stop.")
                act["description"] = act.get("notes") or tip
            if not act.get("notes"):
                act["notes"] = act.get("description")

    return merged_days


# ── Supported Languages ──────────────────────────────────────────────────────

SUPPORTED_LANGUAGES = [
    "English", "Urdu", "Arabic", "Spanish", "French", "German",
    "Chinese", "Japanese", "Korean", "Hindi", "Italian",
    "Portuguese", "Turkish", "Russian",
]


# ── 5. Language Translation ─────────────────────────────────────────────────

def translate_text(text, target_language):
    """Translate text using existing AI providers with fallback chain."""
    if not text or not text.strip():
        raise ValueError("No text provided for translation")
    if not target_language:
        raise ValueError("Target language is required")

    gemini_key = bool(os.getenv("GEMINI_API_KEY"))
    openai_key = bool(os.getenv("OPENAI_API_KEY"))

    prompt = (
        f"Translate the following text into {target_language}. "
        "Auto-detect the source language. Preserve all names, numbers, dates, "
        "prices, URLs, and proper nouns exactly as they appear. "
        "Preserve the original meaning and formatting. "
        "Return ONLY the translated text with no explanation or commentary.\n\n"
        f"Text: {text}"
    )
    system = "You are a professional translator. Return only the translated text, nothing else."

    if gemini_key:
        try:
            client = _get_gemini()
            from google.genai import types as genai_types
            for model_name in GEMINI_MODELS:
                try:
                    resp = client.models.generate_content(
                        model=model_name,
                        contents=prompt,
                        config=genai_types.GenerateContentConfig(
                            system_instruction=system,
                            temperature=0.3,
                            max_output_tokens=2048,
                        ),
                    )
                    if resp and resp.text:
                        return resp.text.strip()
                except Exception as err:
                    logger.warning(f"[TRANSLATE] Gemini {model_name} failed: {err}")
                    continue
        except Exception as e:
            logger.error(f"[TRANSLATE] Gemini error: {e}")

    if openai_key:
        try:
            client = _get_openai()
            for model in ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"]:
                try:
                    resp = client.chat.completions.create(
                        model=model,
                        messages=[
                            {"role": "system", "content": system},
                            {"role": "user", "content": prompt},
                        ],
                        temperature=0.3,
                        max_tokens=2048,
                        timeout=20,
                    )
                    result = resp.choices[0].message.content
                    if result:
                        return result.strip()
                except Exception as err:
                    logger.warning(f"[TRANSLATE] OpenAI {model} failed: {err}")
                    continue
        except Exception as e:
            logger.error(f"[TRANSLATE] OpenAI error: {e}")

    raise RuntimeError("Translation service is temporarily unavailable")


# ── 6. Text Optimization ────────────────────────────────────────────────────

OPTIMIZATION_STYLES = {
    "improve_writing": "Improve grammar, sentence structure, and readability while preserving the original meaning.",
    "make_concise": "Remove unnecessary words and make the text more concise while keeping all important information.",
    "professional": "Rewrite in a professional, formal tone with clear structure and appropriate business wording.",
    "friendly": "Make the text natural, warm, and approachable while preserving the original meaning.",
    "clear_simple": "Simplify the text using easy-to-understand wording. Avoid unnecessary complexity.",
    "persuasive": "Strengthen the wording to be more compelling and persuasive. Do not invent facts.",
    "fix_grammar": "Correct all grammar, spelling, and punctuation errors. Do not rewrite unnecessarily.",
}


def optimize_text(text, style):
    """Optimize text using existing AI providers with fallback chain."""
    if not text or not text.strip():
        raise ValueError("No text provided for optimization")

    style_instruction = OPTIMIZATION_STYLES.get(style)
    if not style_instruction:
        raise ValueError(f"Unknown optimization style: {style}")

    gemini_key = bool(os.getenv("GEMINI_API_KEY"))
    openai_key = bool(os.getenv("OPENAI_API_KEY"))

    prompt = (
        f"{style_instruction}\n\n"
        "CRITICAL: Do NOT change any names, numbers, dates, prices, URLs, or locations. "
        "Preserve the user's intended meaning exactly. "
        "Return ONLY the optimized text with no explanation.\n\n"
        f"Text: {text}"
    )
    system = "You are a professional text editor. Return only the optimized text, nothing else."

    if gemini_key:
        try:
            client = _get_gemini()
            from google.genai import types as genai_types
            for model_name in GEMINI_MODELS:
                try:
                    resp = client.models.generate_content(
                        model=model_name,
                        contents=prompt,
                        config=genai_types.GenerateContentConfig(
                            system_instruction=system,
                            temperature=0.4,
                            max_output_tokens=2048,
                        ),
                    )
                    if resp and resp.text:
                        return resp.text.strip()
                except Exception as err:
                    logger.warning(f"[OPTIMIZE] Gemini {model_name} failed: {err}")
                    continue
        except Exception as e:
            logger.error(f"[OPTIMIZE] Gemini error: {e}")

    if openai_key:
        try:
            client = _get_openai()
            for model in ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"]:
                try:
                    resp = client.chat.completions.create(
                        model=model,
                        messages=[
                            {"role": "system", "content": system},
                            {"role": "user", "content": prompt},
                        ],
                        temperature=0.4,
                        max_tokens=2048,
                        timeout=20,
                    )
                    result = resp.choices[0].message.content
                    if result:
                        return result.strip()
                except Exception as err:
                    logger.warning(f"[OPTIMIZE] OpenAI {model} failed: {err}")
                    continue
        except Exception as e:
            logger.error(f"[OPTIMIZE] OpenAI error: {e}")

    raise RuntimeError("Text optimization service is temporarily unavailable")


# ── 7. Gemini: Description Enrichment ─────────────────────────────────────────

def enrich_activity_descriptions(days: list, destination: str, travel_style: str) -> list:
    """
    Ask Gemini to add concise practical descriptions to activities.
    """
    try:
        client = _get_gemini()
        items = []
        for day in days:
            for act in day.get("activities", []):
                items.append({
                    "place_id": act.get("place_id", ""),
                    "name":     act.get("title", ""),
                    "category": act.get("category", ""),
                })

        if not items:
            return days

        prompt = f"""Write ONE brief practical tip (10-15 words) for each place in {destination}:
Places: {json.dumps(items[:10], indent=1)}

Return JSON: {{"descriptions": {{"<place_id>": "tip"}}}}"""

        from google.genai import types as genai_types
        for model_name in GEMINI_MODELS:
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=genai_types.GenerateContentConfig(
                        response_mime_type="application/json",
                        temperature=0.3,
                        max_output_tokens=1024,
                    ),
                )
                result = json.loads(response.text)
                descriptions = result.get("descriptions", {})
                for day in days:
                    for act in day.get("activities", []):
                        pid = act.get("place_id", "")
                        if pid in descriptions and descriptions[pid]:
                            act["description"] = descriptions[pid]
                return days
            except Exception:
                continue

        return days
    except Exception as e:
        logger.warning(f"Description enrichment failed (non-critical): {e}")
        return days
