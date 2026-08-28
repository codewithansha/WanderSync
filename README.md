<p align="center">
  <img src="frontend/public/images/Github_logo.png" alt="WanderSync Logo" width="80" />
</p>

<h1 align="center">WanderSync</h1>

<p align="center">
  <strong>AI-Powered Travel Itinerary Planner & Smart Travel Assistant</strong><br />
  Plan personalized, budget-aware journeys with real-world places, intelligent scheduling, and an interactive AI concierge.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/Vite-6.1-646CFF?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Flask-2.3-000000?logo=flask&logoColor=white" alt="Flask" />
  <img src="https://img.shields.io/badge/MongoDB-4.0-47A248?logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/OpenAI-GPT--4o-412991?logo=openai&logoColor=white" alt="OpenAI" />
  <img src="https://img.shields.io/badge/Google-Gemini-4285F4?logo=google&logoColor=white" alt="Gemini" />
  <img src="https://img.shields.io/badge/Google-Places-34A853?logo=googlemaps&logoColor=white" alt="Google Places" />
</p>

---

## What is WanderSync?

WanderSync is a full-stack travel planning application that generates personalized, day-by-day itineraries using AI and real-world place data. Unlike basic travel apps or generic chatbots, WanderSync combines **structured AI itinerary generation** (OpenAI GPT-4o), **conversational AI assistance** (Google Gemini), **verified Google Places data**, and a **deterministic budget engine** to produce complete, actionable travel plans.

Users specify a destination, travel dates, budget, travel style, and interests. The system discovers real places via the Google Places API, generates a scheduled itinerary using AI, validates the result with rule-based confidence scoring, and presents everything in an interactive interface with map views, budget breakdowns, and an AI travel concierge.

---

## Features

### Authentication & Profiles

- User registration with email/password (Werkzeug password hashing)
- Login, logout, and server-side session persistence (Flask sessions)
- Session-aware protected routes with automatic auth modal prompts
- Profile management — name, bio, location, currency, travel style
- Profile avatar upload, replace, and removal (JPG/PNG/WEBP, 5 MB limit)
- Guest-first architecture — itinerary generation works without an account

### AI Trip Planning

- Natural-language destination input with **Google Places autocomplete**
- Configurable trip parameters: destination, dates, duration, budget, currency, travel style, interests, accommodation, transportation
- **Asynchronous journey generation** — progress polling with real-time status updates
- **Multi-provider AI itinerary generation:**
  - Primary: OpenAI GPT-4o (structured JSON output)
  - Fallback: Google Gemini (resilient model chain)
  - Final fallback: deterministic schedule builder using real Google Places data
- Travel style presets: Budget, Balanced, Premium, Luxury
- 9 interest categories: Food, Culture, Shopping, Adventure, Nature, History, Family, Photography, Nightlife

### Intelligent Itinerary

- Day-by-day itinerary with activity titles, timings, durations, and categories
- Real Google Places data — place IDs, addresses, coordinates, ratings, price levels
- Activity descriptions enriched via Gemini AI
- Per-day estimated cost and travel distance calculations
- **Itinerary Confidence Validation** — 8-category deterministic scoring system:
  - Place verification, coordinate validation, schedule conflict detection
  - Travel distance sanity checks, budget consistency, activity completeness
  - Daily balance analysis, duplicate detection
  - Weighted confidence score (0–100%) with Excellent/Good/Fair/Needs Review levels

### Budget Engine

- Deterministic Python budget calculation using `Decimal` arithmetic (never AI)
- 28+ supported currencies with exchange rates indexed to USD
- Destination-specific cost indices (accommodation, food, transport, activities)
- Travel style multipliers (Budget 0.55×, Balanced 1×, Premium 1.85×, Luxury 3.5×)
- Automatic budget assessment: within budget, slightly over, significantly over
- Iterative cost optimization when over budget (up to 3 reduction passes)

### AI Travel Assistant (Chatbot)

- Context-aware conversational AI with full itinerary context injection
- **Primary:** Google Gemini (resilient 5-model chain)
- **Fallback:** OpenAI GPT-4o → GPT-4o-mini → GPT-3.5-turbo
- Multi-turn conversation history support
- Quick-action prompts for common travel questions
- **Image analysis** — Gemini multimodal vision for landmark identification, travel document reading
- **PDF document extraction** — PyMuPDF text extraction for flight confirmations, hotel vouchers, travel guides
- PDF context injected into chat for document-aware answers
- **🌐 Language Translation** — translate text into 14 languages (English, Urdu, Arabic, Spanish, French, German, Chinese, Japanese, Korean, Hindi, Italian, Portuguese, Turkish, Russian) with auto source-language detection, preserving names, numbers, dates, and prices
- **✨ Text Optimization** — 7 styles (Improve Writing, Make Concise, Professional, Friendly, Clear & Simple, Persuasive, Fix Grammar) with factual-value preservation
- Per-message action buttons — copy, translate, or optimize any AI response directly from the chat
- "Use in Chat" action to paste optimized text into the message input
- Toolbar buttons and inline tools panel integrated into the chat interface
- Uses the same Gemini → OpenAI fallback chain as the chatbot

### Journey Modification

- Natural-language modification commands via chat or dedicated panel
- AI intent parsing (Gemini → OpenAI → rule-based fallback)
- 12 modification actions:
  - Replace activity, remove activity, add activity
  - Insert rest/free time blocks
  - Time shift, move activity between days
  - Relax day (reduce pace), optimize route (nearest-neighbor geographic ordering)
  - Budget optimization, weather-aware indoor replacement
  - Lock/unlock activities, undo changes
- **Revision history** — in-memory undo stack (up to 20 snapshots per trip)
- Locked activity protection — prevent specific stops from being modified

### Exploration & Discovery

- **30 curated world destinations** across 5 categories: Popular, Culture, Nature, Adventure, Food
- Google Places search and discovery with real ratings and photos
- Interactive map view with activity pins, coordinate visualization, and day filtering
- Weather & climate expectations page (seasonal information)
- Google Maps navigation links for each activity

### Voice Input

- Browser-native voice input via Web Speech API
- Available on the trip planner destination field and AI chatbot
- Graceful fallback for unsupported browsers
- Visual listening indicator with pulse animation

### Saved Journeys

- Save generated itineraries to authenticated user accounts (MongoDB)
- Journey history with trip details, dates, costs, and day counts
- Delete saved journeys
- Auto-save pending journeys after login/registration

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18.3, React Router 6.29, Vite 6.1 |
| **UI / Icons** | Custom CSS, lucide-react |
| **State** | React Context API, useState/useEffect hooks |
| **Backend** | Python, Flask 2.3, Flask-CORS |
| **AI — Itinerary** | OpenAI GPT-4o (primary), Google Gemini (fallback) |
| **AI — Chat** | Google Gemini (primary, 5-model chain), OpenAI (fallback) |
| **AI — Image** | Google Gemini multimodal |
| **AI — Embeddings** | OpenAI text-embedding-3-small |
| **Places** | Google Places API (New) — text search, autocomplete, place details |
| **Database** | MongoDB (pymongo) |
| **Budget** | Python Decimal arithmetic engine |
| **PDF** | PyMuPDF (fitz) |
| **Voice** | Web Speech API (browser-native) |
| **Auth** | Server-side Flask sessions, Werkzeug password hashing |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   React Frontend                     │
│  (Vite dev server on port 3000 / production build)  │
└──────────────────────┬──────────────────────────────┘
                       │  REST API (JSON)
                       ▼
┌─────────────────────────────────────────────────────┐
│                  Flask Backend API                   │
│                   (port 5000)                        │
│                                                      │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐ │
│  │ Journey  │ │   Auth   │ │   Chat   │ │ Places  │ │
│  │ Routes   │ │  Routes  │ │  Routes  │ │ Routes  │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬────┘ │
│       │            │            │            │       │
│  ┌────▼────────────▼────────────▼────────────▼────┐ │
│  │               Service Layer                     │ │
│  │  AI Service · Budget · Itinerary · Places       │ │
│  │  Modification Engine · Validation · Personalize │ │
│  └────┬────────────┬────────────┬────────────┬────┘ │
└───────┼────────────┼────────────┼────────────┼──────┘
        ▼            ▼            ▼            ▼
   ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐
   │ OpenAI  │ │ Google   │ │ Google   │ │ MongoDB │
   │ GPT-4o  │ │ Gemini   │ │ Places   │ │         │
   └─────────┘ └──────────┘ └──────────┘ └─────────┘
```

### AI Pipeline (Itinerary Generation)

```
User submits planner form
        ↓
Flask starts async thread
        ↓
1. Validate input (Python)
2. Resolve destination → Google Places API
3. Discover real places by interest → Google Places API
4. Generate structured itinerary → OpenAI GPT-4o
        ↓ (if fails)
   Gemini fallback → (if fails) Deterministic schedule builder
        ↓
5. Merge AI schedule with real place data
6. Calculate budget → Python Decimal engine
7. Assess & optimize budget if over limit
8. Enrich descriptions → Gemini AI
9. Record personalization preferences
10. Run validation → 8-category confidence scoring
        ↓
Journey stored in memory + returned to frontend
```

### AI Chatbot Fallback Chain

```
User message + journey context
        ↓
Gemini model chain:
  gemini-3.5-flash → gemini-3.5-flash-lite → gemini-3.1-flash-lite
  → gemini-flash-lite-latest → gemini-3.6-flash
        ↓ (all fail)
OpenAI fallback chain:
  gpt-4o → gpt-4o-mini → gpt-3.5-turbo
        ↓ (all fail)
Graceful error response
```

---

## Project Structure

```
Project/
├── app.py                          # Flask entry point, blueprint registration, SPA serving
├── ai_engine_gemini.py             # Gemini multimodal image analysis
├── pdf_processing.py               # PyMuPDF text extraction
├── requirements.txt                # Python dependencies
├── .env                            # Environment variables (API keys, MongoDB URI)
│
├── routes/
│   ├── auth.py                     # Registration, login, profile, saved trips
│   ├── journey.py                  # Journey generation, status polling, validation
│   ├── journey_modification.py     # Modification engine, undo, revisions
│   ├── chat.py                     # AI chatbot, image analysis, PDF upload, translate/optimize tools
│   └── places.py                   # Autocomplete, place search, destination catalog
│
├── services/
│   ├── ai_service.py               # Multi-provider AI (OpenAI + Gemini)
│   ├── budget_service.py           # Decimal budget engine
│   ├── itinerary_service.py        # AI + Places merge, fallback schedule
│   ├── itinerary_validation_service.py  # 8-category confidence validation
│   ├── journey_modification_service.py  # AI modification engine (12 actions)
│   ├── google_places_service.py    # Google Places API integration
│   └── personalization_service.py  # Preference tracking + embeddings
│
├── utils/
│   ├── date_utils.py               # Date arithmetic (Python, not AI)
│   ├── money_utils.py              # Currency symbols, formatting
│   ├── journey_revision.py         # Undo/revision stack
│   └── validation.py               # Input validation
│
├── database/
│   └── mongodb.py                  # MongoDB connection, indexes, health check
│
└── frontend/
    ├── package.json
    ├── vite.config.js              # Dev server proxy to Flask backend
    └── src/
        ├── App.jsx                 # Router, auth provider, layout
        ├── index.css               # Global styles, animations
        ├── context/AuthContext.jsx  # Authentication state management
        ├── hooks/useSpeechRecognition.js  # Voice input hook
        ├── services/
        │   ├── api.js              # All backend API communication
        │   └── modificationApi.js  # Modification engine API
        ├── pages/                  # 16 page components
        │   ├── Home.jsx            # Landing page
        │   ├── Planner.jsx         # Trip planner form
        │   ├── Generating.jsx      # Async generation progress
        │   ├── ItineraryOverview.jsx  # Full itinerary display
        │   ├── DayDetails.jsx      # Single day detail view
        │   ├── TripMap.jsx         # Interactive map view
        │   ├── TripAssistant.jsx   # AI chatbot interface
        │   ├── TripBudget.jsx      # Budget breakdown
        │   ├── TripWeather.jsx     # Weather information
        │   ├── Explore.jsx         # Destination catalog
        │   ├── SavedTrips.jsx      # Journey history
        │   ├── Profile.jsx         # User profile & settings
        │   ├── Dashboard.jsx       # User dashboard
        │   ├── Login.jsx / Register.jsx
        │   └── Onboarding.jsx      # Travel preferences
        └── components/             # 16 reusable components
            ├── Navbar.jsx, Footer.jsx
            ├── Hero.jsx, CTASection.jsx
            ├── ItineraryConfidence.jsx  # Validation confidence card
            ├── JourneyModificationPanel.jsx
            ├── AuthModal.jsx
            ├── ProtectedRoute.jsx
            └── ...
```

---

## Database

WanderSync uses **MongoDB** with the following collections:

| Collection | Purpose | Key Fields |
|-----------|---------|-----------|
| `users` | User accounts | email (unique index), name, password_hash, profile_image, preferred_currency, travel_style, bio, location |
| `saved_trips` | Saved journeys | user_id (indexed), trip_id, destination, title, dates, trip_data, saved_at |
| `sessions` | Server sessions | created_at (TTL index, 30-day expiry) |

Journey data during generation is stored in an **in-memory dictionary** (`JOURNEY_STORE`) for fast async access. MongoDB is used for persistent user accounts and saved journeys only.

---

## API Endpoints

### Journey

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/journey/generate` | Start async journey generation |
| GET | `/api/journey/<id>/status` | Poll generation progress |
| GET | `/api/journey/<id>` | Fetch completed journey |
| POST | `/api/journey/<id>/validate` | Run itinerary validation |
| POST | `/api/journey/<id>/modify` | Chatbot-driven modification |
| POST | `/api/journey/<id>/modify_engine` | Structured modification engine |
| POST | `/api/journey/<id>/undo` | Revert to previous revision |
| GET | `/api/journey/<id>/revisions` | Get available undo count |

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register (JSON or multipart with avatar) |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Session check |
| PUT | `/api/auth/profile` | Update profile |
| POST | `/api/auth/profile/photo` | Upload avatar |
| DELETE | `/api/auth/profile/photo` | Remove avatar |

### Chat & Documents

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | Context-aware AI chat + translate/optimize tools |
| GET | `/api/chat/tools` | Available languages & optimization styles |
| POST | `/api/chat_with_image` | Gemini image analysis |
| POST | `/api/upload_pdf` | PDF text extraction |

### Places

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/places/autocomplete` | Destination autocomplete |
| GET | `/api/places/search` | Google Places search |
| GET | `/api/places/destinations` | Curated destination catalog |

### User Data

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user/saved-trips` | Fetch saved journeys |
| POST | `/api/user/saved-trips` | Save a journey |
| DELETE | `/api/user/saved-trips/<id>` | Delete saved journey |

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- MongoDB (local or Atlas)
- Google Places API key
- OpenAI API key
- Google Gemini API key

### Backend Setup

```bash
# Install Python dependencies
pip install -r requirements.txt

# Configure environment variables
# Create a .env file with:
#   GOOGLE_PLACES_API_KEY=your_key
#   GEMINI_API_KEY=your_key
#   OPENAI_API_KEY=your_key
#   MONGODB_URI=mongodb://localhost:27017/wandersync
#   MONGODB_DATABASE=wandersync
#   SESSION_SECRET=your_secret

# Start the Flask backend
python app.py
# Backend runs on http://127.0.0.1:5000
```

### Frontend Setup

```bash
cd frontend

# Install Node dependencies
npm install

# Start the Vite dev server
npm run dev
# Frontend runs on http://localhost:3000
```

The Vite dev server proxies `/api` and `/uploads` requests to the Flask backend on port 5000.

### Production Build

```bash
cd frontend
npm run build
# Built files are served by Flask from frontend/dist/
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GOOGLE_PLACES_API_KEY` | Google Places API key for place search, autocomplete, and details |
| `GEMINI_API_KEY` | Google Gemini API key for chatbot, modifications, and enrichment |
| `OPENAI_API_KEY` | OpenAI API key for itinerary generation and fallback chat |
| `MONGODB_URI` | MongoDB connection string |
| `MONGODB_DATABASE` | MongoDB database name |
| `SESSION_SECRET` | Flask session signing secret |
| `GEMINI_MODEL` | Primary Gemini model (default: `gemini-3.5-flash`) |

---

## Key Design Decisions

- **AI never invents places.** Itinerary activities are selected from real Google Places data. The AI only chooses from verified place IDs.
- **Budget math is deterministic.** All monetary calculations use Python `Decimal` — never delegated to AI.
- **Multi-provider resilience.** Both itinerary generation and chat use a fallback chain across multiple AI models.
- **Guest-first architecture.** Users can plan and generate trips without creating an account. Authentication is only required for saving journeys and profile features.
- **In-memory journey store.** Active journeys use an in-memory dictionary for fast async access. MongoDB handles persistent user data only.
- **Non-destructive modifications.** All journey changes push a snapshot to the revision stack before applying, enabling multi-step undo.

---

## Limitations

- **Weather data** is presented as seasonal climate expectations only. No real-time weather API is integrated.
- **Maps** use a custom CSS-based coordinate visualization, not an embedded Google Maps or Leaflet SDK.
- **Personalization embeddings** are stored in-memory (not persisted). The embedding module is functional but designed for future vector DB integration.
- **Journey storage** is in-memory during the server session. Only explicitly saved journeys persist to MongoDB.

---

## License

This project is developed for educational and demonstration purposes.
