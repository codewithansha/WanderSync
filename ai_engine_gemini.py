import os
import base64
import logging
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

GEMINI_MODELS = [
    os.getenv("GEMINI_MODEL", "gemini-3.5-flash"),
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-flash-lite-latest",
    "gemini-3.6-flash",
]

TRAVEL_SYSTEM_INSTRUCTION = """
You are WanderSync — the elite AI-Powered Itinerary Maestro & Travel Assistant.
Your core mission is to craft unforgettable, realistic, and highly optimized travel journeys.

Guidelines for your responses:
1. Provide structured, practical, and inspiring travel advice tailored to the traveler's pacing, budget, and cultural interests.
2. When answering itinerary questions, include realistic timings, approximate costs, and logical transit sequencing to avoid backtracking.
3. Be aware of weather conditions, opening hours, local cultural etiquette, and authentic dining recommendations.
4. If the user asks about an uploaded PDF (e.g. flight ticket, hotel confirmation, visa voucher), parse and summarize the key confirmation numbers, dates, times, and instructions accurately.
5. Format your answers beautifully using Markdown (bold headings, bullet points, clean tables when appropriate).
6. Maintain an encouraging, sophisticated, and helpful travel concierge persona.
"""

_client = None

def _get_client():
    global _client
    if _client is None:
        key = os.getenv("GEMINI_API_KEY", "").strip()
        if not key:
            raise ValueError("GEMINI_API_KEY is not configured in .env.")
        from google import genai
        _client = genai.Client(api_key=key)
    return _client


def get_travel_answer(query, context="", history=None):
    """
    Generate a real Gemini AI response with optional trip context and multi-turn chat history.
    """
    try:
        from services.ai_service import chat_gemini
        return chat_gemini(query=query, journey_context=context, history=history)
    except Exception as e:
        logger.error(f"Error in get_travel_answer: {e}")
        return f"WanderSync AI Assistant error: {str(e)}"


def get_travel_answer_with_image(query, image_file, context=""):
    """
    Analyze travel-related images using Gemini multimodal capabilities.
    """
    try:
        client = _get_client()
        from google.genai import types as genai_types

        if not image_file:
            return get_travel_answer(query, context), None

        if hasattr(image_file, 'read'):
            img_bytes = image_file.read()
        else:
            img_bytes = image_file

        prompt_text = query if query else "Identify this travel location/landmark, document, or item and provide practical traveler insights."
        if context:
            prompt_text = f"### CURRENT TRIP CONTEXT:\n{context}\n\n### QUESTION:\n{prompt_text}"

        encoded_image = base64.b64encode(img_bytes).decode("utf-8")

        for model_name in GEMINI_MODELS:
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=[
                        genai_types.Part.from_bytes(data=img_bytes, mime_type="image/jpeg"),
                        prompt_text
                    ],
                    config=genai_types.GenerateContentConfig(
                        system_instruction=TRAVEL_SYSTEM_INSTRUCTION,
                        temperature=0.4,
                        max_output_tokens=1500,
                    ),
                )
                if response and response.text:
                    return response.text, encoded_image
            except Exception as m_err:
                logger.warning(f"Model {model_name} failed for image: {m_err}")
                continue

        raise RuntimeError("All Gemini multimodal models failed")
    except Exception as e:
        logger.error(f"Gemini Image Processing Error: {e}")
        return f"Error analyzing image: {str(e)}", None
