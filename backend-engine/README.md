# Insurance Agent Search Engine

Agentic insurance search, scoring, and ranking engine. Receives a structured user profile, fetches real-time quotes, enriches with policy details, scores with Watsonx.ai, and returns a ranked report.

## Setup

```bash
npm install
cp .env.example .env
# Fill in your API keys in .env
npm run dev
```

**Dependencies:**
- PostgreSQL (policies DB)
- Redis (session state)
- IBM Watsonx.ai API key
- IBM Watson Document Understanding API key (optional — falls back to pdf-parse)
- EverQuote Pro or Bindable API key (optional — falls back to mock data)

---

## API Reference

### POST /api/search

Runs a full new search. Call this on first load and after NEW_CRITERIA feedback.

**Request:**
```json
{
  "session_id": "optional — omit for new session",
  "user_profile": {
    "business_type": "bar",
    "location": "Toronto, ON",
    "employees": 12,
    "annual_revenue": "$800,000",
    "alcohol_sales": true,
    "budget_max": 400,
    "coverage_needs": ["General Liability", "Liquor Liability", "Property Damage"],
    "priority_weights": {
      "coverage": 40,
      "price": 30,
      "rating": 20,
      "gap_penalty": 10
    }
  }
}
```

**Response:**
```json
{
  "session_id": "uuid",
  "iteration": 1,
  "mode": "new_search",
  "plan_count": 4,
  "plans": [
    {
      "rank": 1,
      "carrier_id": "intact_commercial",
      "carrier_name": "Intact Commercial",
      "monthly_price": 338,
      "final_score": 0.87,
      "score_breakdown": {
        "coverage_score": 0.92,
        "price_score": 0.61,
        "rating_score": 0.85,
        "gap_penalty": 0.10
      },
      "covered": ["General Liability", "Liquor Liability"],
      "excluded": ["Food Contamination"],
      "gap_flags": ["Food Contamination not covered"],
      "risk_warnings": ["Verify liquor liability limit for bar with primary alcohol sales"],
      "deductible": 2000,
      "rating": 4.7,
      "apply_url": "https://intact.ca/apply",
      "ai_explanation": "Strong match for a bar. Liquor liability at $1M appropriate for your revenue.",
      "has_policy_detail": true
    }
  ],
  "warning": null,
  "meta": {
    "duration_ms": 4200,
    "criteria_used": { "coverage_needs": [...], "priority_weights": {...} }
  }
}
```

---

### POST /api/feedback

Called after every user feedback message. Classifies intent and either re-ranks (instant) or triggers new search.

**Request:**
```json
{
  "session_id": "uuid-from-search-response",
  "feedback_text": "price matters more"
}
```

**Response (REWEIGHT — instant, ~100ms):**
```json
{
  "session_id": "uuid",
  "mode": "rerank",
  "new_weights": { "coverage": 20, "price": 60, "rating": 10 },
  "plans": [...],
  "duration_ms": 45
}
```

**Response (NEW_CRITERIA — full search, ~10-20s):**
```json
{
  "session_id": "uuid",
  "iteration": 2,
  "mode": "new_search",
  "new_criteria": ["Food Contamination"],
  "plans": [...],
  "duration_ms": 14200
}
```

**Response (AMBIGUOUS — asks user):**
```json
{
  "session_id": "uuid",
  "mode": "clarify",
  "clarifying_question": "Do you mean coverage should rank higher, or you need a specific new coverage type?",
  "plans": null
}
```

---

### POST /api/feedback/reject

User dismisses a plan. Removes it permanently from this session.

**Request:**
```json
{ "session_id": "uuid", "plan_id": "aviva-001" }
```

---

### POST /api/explain

Called when user selects a plan to see full policy detail.

**Request:**
```json
{ "session_id": "uuid", "plan_id": "intact-001" }
```

**Response:**
```json
{
  "carrier_name": "Intact Commercial",
  "coverage_explanation": [
    {
      "need": "Liquor Liability",
      "status": "covered",
      "explanation": "Your liquor liability is covered up to $1M per incident."
    },
    {
      "need": "Food Contamination",
      "status": "not_covered",
      "explanation": "Food contamination is NOT covered — excluded under section 4.3: 'contamination losses excluded unless caused by fire.'"
    }
  ],
  "apply_url": "https://intact.ca/apply"
}
```

---

### GET /api/health

Check all service connections.

```json
{
  "status": "healthy",
  "checks": {
    "database": "ok",
    "watsonx": "configured",
    "aggregator": "not configured (using mock data)",
    "wdu": "not configured (using pdf-parse fallback)"
  }
}
```

---

## Architecture

```
POST /api/search
  │
  ├── Aggregator API (EverQuote / Bindable) — real-time quotes
  ├── WDU Policy DB — join on carrier_id for policy details
  ├── Watsonx.ai — parallel scoring per plan
  └── Scorer — apply weights, rank, filter

POST /api/feedback
  │
  ├── Watsonx.ai intent classifier
  ├── REWEIGHT → re-sort cached_results (instant, no API)
  └── NEW_CRITERIA → full pipeline above

Nightly cron (2am)
  │
  ├── Download carrier PDFs
  ├── Hash check — skip unchanged
  ├── WDU extraction → structured fields
  └── Upsert policies table
```

## Fallback Behaviour

| Service | Fallback |
|---|---|
| Watsonx unreachable | Default scores (0.5), no AI explanation |
| Aggregator unreachable | Mock quotes (5 carriers) |
| WDU not configured | pdf-parse rule-based extraction |
| Plan missing from policy DB | Returns aggregator data only, flags `has_policy_detail: false` |

---

## 🔌 Frontend-to-AI Engine Integration Guide

### 1. Initial Search (The Chatbot Intake)
**Endpoint:** `POST /api/search`
**When to use:** When the user finishes their initial chatbot questionnaire and you want to generate the first list of recommended insurance policies.

**What you send (Request Body):**
*Note: We built an adapter system. You MUST include `"insurance_category"` so the backend knows how to translate your specific fields into our universal AI schema.*
```json
{
  "user_profile": {
    "insurance_category": "commercial", // "commercial", "auto", or "home"
    "business_type": "restaurant",
    "location": "Chicago, IL",
    "coverage_needs": ["General Liability", "Liquor Liability"]
  }
}
```

**What you receive (Response):**
The backend translates the AI's complex math to perfectly match your **`MockPolicy` TypeScript interface**. You can map this array directly into your UI components!
```json
{
  "session_id": "c1a2b3c4-d5e6-7f8g",
  "plan_count": 5,
  "ranked": [
    {
      "id": "coterie-sample-01",
      "insurerName": "Coterie Insurance",
      "planName": "Commercial BOP",
      "monthlyPremium": 375,
      "baseMatchScore": 85,
      "ratingScore": 80,
      "overallRating": 4.6,
      "highlights": ["General Liability Included"],
      "warnings": ["Liability limit may be insufficient for a restaurant in Chicago"],
      "coverageMap": {
        "General Liability": { "status": "covered", "details": "Included in standard BOP" },
        "Liquor Liability": { "status": "covered", "details": "Included via endorsement" }
      }
    }
  ]
}
```
*(Store the `session_id` in your React state—you will need it for the next two endpoints!)*

---

### 2. Chatbot Conversational Feedback Loop
**Endpoint:** `POST /api/feedback`
**When to use:** When the user is looking at the UI list of plans and types something into the chatbot like *"I actually care a lot more about price"*.

**What you send (Request Body):**
Just send the raw English text and the `session_id`.
```json
{
  "session_id": "c1a2b3c4-d5e6-7f8g",
  "feedback_text": "I actually care way more about the price than the coverage."
}
```

**What you receive (Response):**
The backend uses an IBM Intent Classifier to read their sentence, rewrite the Math Weights internally, and instantly resort the array. It returns the exact same `ranked` array format as above, just perfectly re-ordered to match their new conversational request.

---

### 3. Deep Dive / Policy Explanation Modal
**Endpoint:** `POST /api/explain`
**When to use:** When the user clicks a specific policy card on your UI to see the deep-dive details of *exactly* what is covered vs. excluded.

**What you send (Request Body):**
```json
{
  "session_id": "c1a2b3c4-d5e6-7f8g",
  "plan_id": "coterie-sample-01"
}
```

**What you receive (Response):**
The engine pulls the 50-page PDF exclusions from the database and uses IBM Watsonx to generate a plain-English explanation for the user. Display `coverage_explanation` in your modal!
```json
{
  "plan_id": "coterie-sample-01",
  "carrier_name": "Coterie Insurance",
  "monthly_price": 375,
  "apply_url": "https://coterieinsurance.com/apply",
  "coverage_explanation": [
     {
       "need": "General Liability",
       "status": "covered",
       "explanation": "Fully covered up to $1,000,000. This handles third-party bodily injury if a customer slips in your restaurant."
     },
     {
       "need": "Liquor Liability",
       "status": "partial",
       "explanation": "Covered, but limited to $500,000. Because your alcohol sales are 'High', this limit might expose you to risk."
     }
  ]
}
```
