# End-to-End (E2E) Testing Guide 🧪

> **Comprehensive Testing Procedures for KelanaAI Full-Stack Architecture**

This document establishes the official End-to-End (E2E) testing framework for KelanaAI. It details testing strategies, core user flows, required toolsets, automated test specifications, and procedures to verify that the **Frontend (Next.js)**, **Backend (FastAPI)**, and **Database (PostgreSQL / Neon)** communicate with total fidelity.

---

## 📑 Table of Contents

- [Testing Strategy & Scope](#testing-strategy--scope)
- [Recommended Tooling](#recommended-tooling)
- [Core User Flows Under Test](#core-user-flows-under-test)
  - [Flow 1: User Authentication & Profile Lifecycle](#flow-1-user-authentication--profile-lifecycle)
  - [Flow 2: Trip Planning & Resource-Level Authorization](#flow-2-trip-planning--resource-level-authorization)
  - [Flow 3: AI Itinerary Generation Flow](#flow-3-ai-itinerary-generation-flow)
  - [Flow 4: Multi-Turn Conversational Chat Flow](#flow-4-multi-turn-conversational-chat-flow)
  - [Flow 5: Knowledge Base RAG Assistant Flow](#flow-5-knowledge-base-rag-assistant-flow)
- [Automated E2E Test Suite (Playwright Implementation)](#automated-e2e-test-suite-playwright-implementation)
- [Backend & Database E2E Integration Suite (Pytest + HTTPX)](#backend--database-e2e-integration-suite-pytest--httpx)
- [Cross-Tier Communication Verification Matrix](#cross-tier-communication-verification-matrix)
  - [1. Frontend Network Verification](#1-frontend-network-verification)
  - [2. Direct Database State Inspection](#2-direct-database-state-inspection)
  - [3. Bedrock AI Integration Verification](#3-bedrock-ai-integration-verification)
- [Test Environment CI/CD Execution](#test-environment-cicd-execution)

---

## 🎯 Testing Strategy & Scope

End-to-End testing in KelanaAI validates complete transaction journeys spanning the browser interface, authenticated API requests, relational persistence in PostgreSQL, and external AI orchestrations through Amazon Bedrock.

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│                 │       │                 │       │                 │
│  User Browser   ├──────►│  FastAPI Server ├──────►│  PostgreSQL DB  │
│  (Next.js App)  │◄──────┤  (Uvicorn API)  │◄──────┤  (Neon / Local) │
│                 │       │                 │       │                 │
└─────────────────┘       └────────┬────────┘       └─────────────────┘
                                   │
                                   ▼
                          ┌─────────────────┐
                          │  Amazon Bedrock │
                          │  (Converse & KB)│
                          └─────────────────┘
```

### Objectives
1. **Functional Integrity:** Ensure all interactive UI components trigger correct HTTP transactions and mutate system state predictably.
2. **Security & Authorization:** Validate that private assets (trips, chat history, profile info) cannot be accessed or manipulated by unauthenticated users or unauthorized third parties (HTTP 401 & 403 enforcement).
3. **Data Consistency:** Verify that calculations (daily budgets, trip tiers) and structured outputs (JSON itineraries, message threads) match across UI renders and database records.
4. **Resilience & Graceful Degradation:** Verify that network latency, invalid tokens, or AI service errors display clear user feedback without crashing the application.

---

## 🧰 Recommended Tooling

| Tool | Purpose | Primary Application |
| :--- | :--- | :--- |
| **Playwright** | Browser automation & UI E2E testing | Headless browser execution across Chromium, Firefox, and WebKit testing user journeys. |
| **Pytest + HTTPX** | Backend API & DB integration testing | Asynchronous HTTP client for testing API contracts and database assertions. |
| **Postman / Newman** | Contract & smoke testing | Automated collection runs against staging or production endpoints. |
| **psql / SQLAlchemy** | Database state verification | Querying rows directly in PostgreSQL to verify transactional side effects. |

---

## 🚶 Core User Flows Under Test

### Flow 1: User Authentication & Profile Lifecycle

#### Description
Validates account creation, duplicate detection, credential validation, JWT token storage, authenticated profile retrieval, and session termination.

```
[Register Page] ──POST /auth/register──► [Create User in DB] ──► [Issue JWT]
                                                                     │
[Store in localStorage] ◄────────────────────────────────────────────┘
         │
         ▼
[Profile Page] ──GET /auth/me (Bearer Token)──► [Verify User & Trip Count]
         │
         ▼
[Logout Button] ──► [Purge localStorage] ──► [Redirect to /login]
```

#### Verification Steps
1. Navigate to `/register`.
2. Submit valid registration details (`name`, `email`, `password`).
3. Assert response is `200 OK` with JSON `{ "access_token": "...", "token_type": "bearer" }`.
4. Verify token is stored in browser `localStorage.getItem("access_token")`.
5. Attempt registering the exact same email again; verify server returns `409 Conflict` with `"detail": "Email already registered"`.
6. Navigate to `/login` and submit valid credentials; verify receipt and storage of a fresh JWT.
7. Navigate to `/profile`; verify `GET /api/v1/auth/me` is called with header `Authorization: Bearer <token>` and renders the correct user name, email, and trip count.
8. Click "Logout"; verify `access_token` is cleared from `localStorage` and user is redirected to `/login`.
9. Attempt visiting `/profile` without token; verify automatic client-side redirect to `/login`.

---

### Flow 2: Trip Planning & Resource-Level Authorization

#### Description
Validates trip creation, automatic server-side calculation of `daily_budget` and `category`, retrieval of user-owned trips, updating parameters, deletion, and cross-user data isolation.

#### Verification Steps
1. **Categories & Recommendations:**
   - Verify `GET /api/v1/trip-categories` returns `["Backpacker", "Budget", "Moderate", "Luxury"]`.
   - Verify `GET /api/v1/recommendations` returns destination presets.
2. **Trip Creation:**
   - Authenticated user submits a trip with `destination: "Bali"`, `days: 5`, `budget: 1500.00`.
   - Verify `POST /api/v1/trips` returns `200 OK` with calculated `daily_budget: 300.00` and `category: "Moderate"`.
   - Verify foreign key `user_id` matches the authenticated user ID.
3. **Trip Listing & Isolation:**
   - Fetch trips via `GET /api/v1/trips`.
   - Verify the newly created trip appears in the array.
   - Log in as a *different* user (User B); verify User B's `GET /api/v1/trips` returns an empty array or only User B's trips, never User A's trips.
4. **Trip Modification:**
   - User A updates the trip via `PUT /api/v1/trips/{id}` changing `budget` to `500.00`.
   - Verify server recalculates `category: "Backpacker"` and `daily_budget: 100.00`.
5. **Resource-Level Authorization Enforcement:**
   - User B attempts `PUT /api/v1/trips/{user_a_trip_id}` or `DELETE /api/v1/trips/{user_a_trip_id}`.
   - Verify backend immediately aborts and returns `403 Forbidden` with `"detail": "Access denied: You can only ... your own trips"`.
   - Verify frontend catches `ForbiddenError` and displays an alert without corrupting UI state.
6. **Trip Deletion:**
   - User A deletes their trip via `DELETE /api/v1/trips/{id}`.
   - Verify response is `200 OK` and subsequent `GET /api/v1/trips/{id}` returns `404 Not Found`.

---

### Flow 3: AI Itinerary Generation Flow

#### Description
Tests the end-to-end integration with Amazon Bedrock Converse API for generating structured multi-day travel plans.

#### Verification Steps
1. Navigate to `/trips` and select an existing trip (e.g., Kyoto, 3 days, $1,200 budget).
2. Trigger "Generate AI Itinerary" button on `/trips/[id]`.
3. Frontend shows loading indicator and sends `POST /api/v1/trips/{trip_id}/generate`.
4. Backend executes:
   - Ownership verification (`trip.user_id == current_user.id`).
   - Prompt compilation via `build_trip_prompt(trip)`.
   - Bedrock Converse API call using `MODEL_ID` (`amazon.nova-lite-v1:0`).
   - Stripping markdown fences and parsing JSON output.
   - Saving serialized JSON into PostgreSQL column `trips.ai_recommendation`.
5. Verify response status is `200 OK` and response body matches schema:
   ```json
   {
     "trip_id": 1,
     "destination": "Kyoto",
     "recommendation": [
       {
         "day": 1,
         "title": "Day 1: Historic Temples & Traditional Gion",
         "travel_tips": ["...", "..."],
         "local_food": ["...", "..."],
         "budget_breakdown": {
           "accommodation": "$150",
           "food": "$60",
           "transport": "$20",
           "activities": "$30",
           "total": "$260"
         }
       }
     ]
   }
   ```
6. Frontend updates dynamically, rendering day cards with tip badges, restaurant suggestions, and cost items.
7. Reload the page; verify the generated recommendation persists from the database.

---

### Flow 4: Multi-Turn Conversational Chat Flow

#### Description
Validates conversational AI sessions, thread creation, message persistence, message history compression, and Bedrock response rendering.

```
[User enters prompt] ──POST /conversations/{id}/messages──► [Save User Msg to DB]
                                                                     │
[Render AI Reply] ◄── [Save AI Msg to DB] ◄── [Bedrock Converse] ◄───┘
```

#### Verification Steps
1. Navigate to `/chat`.
2. Create a new conversation via `POST /api/v1/conversations` (optional `title: "Tokyo Autumn Trip"`).
3. Verify conversation row created in PostgreSQL `conversations` table.
4. Send message: *"What are the top 3 neighborhoods to stay in Tokyo for first-timers?"*.
5. Frontend renders user bubble immediately.
6. Verify request sent to `POST /api/v1/conversations/{id}/messages`.
7. Backend saves user message with `role: "user"`.
8. Backend gathers thread history, verifies role alternations, invokes Bedrock Converse API, and saves response with `role: "assistant"`.
9. Verify assistant reply displays in the UI with formatted markdown and timestamp.
10. Send a follow-up message: *"Which of those is closest to public transit?"*.
11. Verify context retention: the assistant correctly references the neighborhoods discussed in the first message.
12. **Compaction Test:** For long threads (> 500 messages), verify `compress_older_messages()` bundles older turns into a single summary without exceeding Bedrock token limits.
13. Update conversation title via `PATCH /api/v1/conversations/{id}`; verify sidebar list updates.

---

### Flow 5: Knowledge Base RAG Assistant Flow

#### Description
Validates the verified knowledge base retrieval flow against Amazon Bedrock Agent Runtime.

#### Verification Steps
1. Navigate to `/assistant`.
2. Input domain-specific regulatory inquiry (e.g., *"What is the maximum cash limit to bring into Indonesia without declaration?"*).
3. Submit question; verify request sent to `POST /api/v1/ask`.
4. Backend verifies `KNOWLEDGE_BASE_ID` is set and calls `boto3.client('bedrock-agent-runtime').retrieve()`.
5. Verify vector search returns document snippets filtered by score threshold (`score > 0.85`).
6. Verify backend returns response:
   ```json
   {
     "question": "What is the maximum cash limit...",
     "answer": {
       "answer": "Under Bank Indonesia Regulation...",
       "source": [
         {
           "document_id": "doc-12345",
           "location": { "s3Location": { "uri": "s3://kelana-kb-docs/customs_regulations.pdf" } },
           "score": 0.92
         }
       ]
     }
   }
   ```
7. Verify frontend displays:
   - The authoritative answer.
   - Clean citation badge extracting the file name (`customs_regulations.pdf`) via `cleanDocumentPath()`.
8. Test an out-of-scope question (e.g., *"Who won the 1982 World Cup?"*); verify system returns low confidence / no documents and handles gracefully.

---

## 🤖 Automated E2E Test Suite (Playwright Implementation)

Create `tests/e2e/user_flows.spec.ts` to execute automated cross-tier browser tests:

```typescript
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';
const UNIQUE_ID = Date.now();
const TEST_USER = {
  name: `Test Traveler ${UNIQUE_ID}`,
  email: `traveler_${UNIQUE_ID}@example.com`,
  password: 'SecurePassword123!',
};

test.describe('KelanaAI Full-Stack End-to-End Suite', () => {

  test('Flow 1: User Registration, Login, and Profile Verification', async ({ page }) => {
    // 1. Register
    await page.goto(`${BASE_URL}/register`);
    await page.fill('input[name="name"], input[placeholder*="name" i]', TEST_USER.name);
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');

    // 2. Expect redirection to trips or login
    await expect(page).toHaveURL(new RegExp(`${BASE_URL}/(trips|login|profile)`));

    // 3. Inspect localStorage for JWT
    const token = await page.evaluate(() => localStorage.getItem('access_token'));
    expect(token).toBeTruthy();

    // 4. Navigate to Profile
    await page.goto(`${BASE_URL}/profile`);
    await expect(page.locator('text=' + TEST_USER.email)).toBeVisible();
  });

  test('Flow 2: Trip Creation, Budgeting & Ownership Isolation', async ({ page, request }) => {
    // 1. Authenticate via UI
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/trips`);

    // 2. Open Create Trip Modal / Form
    await page.click('button:has-text("Create Trip"), button:has-text("Add Trip"), button:has-text("New Trip")');
    await page.fill('input[name="destination"], input[placeholder*="destination" i]', 'Lombok');
    await page.fill('input[name="days"], input[type="number"][placeholder*="days" i]', '4');
    await page.fill('input[name="budget"], input[placeholder*="budget" i]', '800');
    await page.click('button[type="submit"]:has-text("Save"), button[type="submit"]:has-text("Create")');

    // 3. Verify card exists on dashboard with calculated budget
    await expect(page.locator('text=Lombok')).toBeVisible();
    await expect(page.locator('text=$200')).toBeVisible(); // $800 / 4 days

    // 4. Verify Authorization Security via API
    const userToken = await page.evaluate(() => localStorage.getItem('access_token'));
    
    // Register unauthorized attacker
    const attackerRes = await request.post('http://localhost:8000/api/v1/auth/register', {
      data: { name: 'Attacker', email: `attacker_${UNIQUE_ID}@test.com`, password: 'AttackerPass123!' }
    });
    const { access_token: attackerToken } = await attackerRes.json();

    // Fetch user trip ID
    const tripsRes = await request.get('http://localhost:8000/api/v1/trips', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const userTrips = await tripsRes.json();
    const tripId = userTrips[0].id;

    // Attacker attempts to delete user's trip
    const unauthorizedDelete = await request.delete(`http://localhost:8000/api/v1/trips/${tripId}`, {
      headers: { Authorization: `Bearer ${attackerToken}` }
    });
    expect(unauthorizedDelete.status()).toBe(403);
  });

  test('Flow 3: AI Assistant Knowledge Base Query', async ({ page }) => {
    // Navigate to Assistant
    await page.goto(`${BASE_URL}/assistant`);

    // Submit question
    const queryInput = page.locator('textarea, input[placeholder*="Ask" i]');
    await queryInput.fill('What documents do I need to declare foreign currency in Indonesia?');
    await page.click('button:has-text("Ask"), button[type="submit"]');

    // Wait for response bubble
    const answerContainer = page.locator('.assistant-answer, [data-testid="answer-box"], div.prose');
    await expect(answerContainer).toBeVisible({ timeout: 15000 });
    await expect(answerContainer).not.toBeEmpty();
  });
});
```

---

## 🐍 Backend & Database E2E Integration Suite (Pytest + HTTPX)

Create `backend/tests/test_e2e_pipeline.py`:

```python
import pytest
from httpx import AsyncClient
from main import app
from database import SessionLocal
from models.user import User
from models.trip import Trip
from models.conversation import Conversation, Message

@pytest.mark.asyncio
async def test_full_user_trip_journey():
    async with AsyncClient(app=app, base_url="http://testserver") as client:
        # 1. Register User
        email = f"pytest_runner_{id(client)}@example.com"
        reg_resp = await client.post("/api/v1/auth/register", json={
            "name": "Pytest Traveler",
            "email": email,
            "password": "StrongPassword999!"
        })
        assert reg_resp.status_code == 200
        token = reg_resp.json()["access_token"]
        auth_headers = {"Authorization": f"Bearer {token}"}

        # 2. Verify Profile
        me_resp = await client.get("/api/v1/auth/me", headers=auth_headers)
        assert me_resp.status_code == 200
        user_id = me_resp.json()["id"]

        # 3. Create Trip
        trip_payload = {"destination": "Tokyo", "days": 6, "budget": 1800.0}
        trip_resp = await client.post("/api/v1/trips", json=trip_payload, headers=auth_headers)
        assert trip_resp.status_code == 200
        trip_data = trip_resp.json()
        assert trip_data["daily_budget"] == 300.0
        assert trip_data["category"] == "Moderate"
        trip_id = trip_data["id"]

        # 4. Direct DB Verification
        db = SessionLocal()
        db_trip = db.query(Trip).filter(Trip.id == trip_id).first()
        assert db_trip is not None
        assert db_trip.user_id == user_id
        assert db_trip.destination == "Tokyo"
        db.close()

        # 5. Conversation & Messaging Lifecycle
        conv_resp = await client.post("/conversations", json={"title": "Tokyo Planning"}, headers=auth_headers)
        assert conv_resp.status_code == 200
        conv_id = conv_resp.json()["id"]

        # Verify DB conversation persistence
        db = SessionLocal()
        db_conv = db.query(Conversation).filter(Conversation.id == conv_id).first()
        assert db_conv is not None
        assert db_conv.user_id == user_id
        db.close()

        # 6. Cleanup
        del_resp = await client.delete(f"/api/v1/trips/{trip_id}", headers=auth_headers)
        assert del_resp.status_code == 200
```

---

## 🔍 Cross-Tier Communication Verification Matrix

To definitively verify that Frontend, Backend, and Database are correctly communicating, execute checks across each tier:

### 1. Frontend Network Verification

In Google Chrome / Firefox Developer Tools (**Network Tab**):

| Endpoint | Method | Expected Status | Headers to Inspect | Common Failure Sign |
| :--- | :--- | :--- | :--- | :--- |
| `/api/v1/auth/login` | `POST` | `200 OK` | `Content-Type: application/json` | `401 Unauthorized` (wrong credentials) |
| `/api/v1/auth/me` | `GET` | `200 OK` | `Authorization: Bearer <token>` | `401` (missing token or invalid secret) |
| `/api/v1/trips` | `GET` | `200 OK` | `Authorization: Bearer <token>` | Empty array or `401` |
| `/api/v1/trips` | `POST` | `200 OK` | `Content-Type: application/json` | `400 Bad Request` (payload schema mismatch) |
| `/api/v1/trips/{id}/generate` | `POST` | `200 OK` | `Authorization: Bearer <token>` | `500 Internal Server Error` (Bedrock error) |
| `/api/v1/ask` | `POST` | `200 OK` | `Content-Type: application/json` | `500` (missing `KNOWLEDGE_BASE_ID`) |

#### Preflight Checks:
- Confirm that browser `OPTIONS` requests receive `200 OK` or `204 No Content` with:
  ```http
  Access-Control-Allow-Origin: <FRONTEND_URL>
  Access-Control-Allow-Credentials: true
  Access-Control-Allow-Methods: *
  Access-Control-Allow-Headers: *
  ```

---

### 2. Direct Database State Inspection

Run these diagnostic queries via `psql` or Neon Console SQL Editor to confirm transactions persist accurately:

```sql
-- 1. Verify User Creation and Password Hashing
SELECT id, name, email, SUBSTRING(password_hash, 1, 10) AS hash_prefix 
FROM users 
ORDER BY id DESC LIMIT 5;

-- 2. Verify Trip Association with Authenticated User
SELECT t.id, t.destination, t.days, t.budget, t.daily_budget, t.category, u.email 
FROM trips t
JOIN users u ON t.user_id = u.id
ORDER BY t.id DESC LIMIT 5;

-- 3. Verify AI Recommendation Storage (Structured JSON)
SELECT id, destination, SUBSTRING(ai_recommendation, 1, 60) AS json_sample
FROM trips
WHERE ai_recommendation IS NOT NULL;

-- 4. Verify Conversation Threads and Cascading Messages
SELECT c.id AS conv_id, c.title, m.role, m.content, m.created_at
FROM conversations c
LEFT JOIN messages m ON c.id = m.conversation_id
ORDER BY c.id DESC, m.created_at ASC LIMIT 10;
```

---

### 3. Bedrock AI Integration Verification

Run a direct verification script inside the backend environment to test AWS connectivity independently of the UI:

```bash
python3 -c "
import os, boto3
from dotenv import load_dotenv
load_dotenv()

client = boto3.client('bedrock-runtime', region_name=os.getenv('AWS_REGION', 'ap-southeast-2'))
resp = client.converse(
    modelId=os.getenv('MODEL_ID', 'amazon.nova-lite-v1:0'),
    messages=[{'role': 'user', 'content': [{'text': 'Ping test. Reply with PONG.'}]}]
)
print('AI Response:', resp['output']['message']['content'][0]['text'])
"
```
*Expected Output:* `AI Response: PONG`

---

## 🚀 Test Environment CI/CD Execution

Integrate E2E testing into your GitHub Actions CI pipeline (`.github/workflows/e2e.yml`):

```yaml
name: Full-Stack E2E Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  e2e:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: testuser
          POSTGRES_PASSWORD: testpassword
          POSTGRES_DB: kelana_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python 3.12
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'
          cache: 'pip'

      - name: Install Backend Dependencies
        run: |
          cd backend
          pip install -r requirements.txt
          pip install pytest pytest-asyncio httpx

      - name: Start FastAPI Backend
        env:
          DATABASE_URL: postgresql://testuser:testpassword@localhost:5432/kelana_test
          SECRET_KEY: ci_secret_key_testing_only_1234567890
          FRONTEND_URL: http://localhost:3000
          AWS_REGION: ap-southeast-2
          MODEL_ID: amazon.nova-lite-v1:0
          KNOWLEDGE_BASE_ID: MOCK_KB_ID
        run: |
          cd backend
          uvicorn main:app --port 8000 &
          sleep 5

      - name: Set up Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install Frontend Dependencies & Playwright
        run: |
          cd frontend
          npm ci
          npx playwright install --with-deps

      - name: Build & Run Next.js Frontend
        env:
          NEXT_PUBLIC_API_URL: http://localhost:8000/api/v1
        run: |
          cd frontend
          npm run build
          npm run start &
          sleep 5

      - name: Run Backend Integration Tests
        run: |
          cd backend
          pytest tests/

      - name: Run Playwright E2E Tests
        run: |
          cd frontend
          npx playwright test
```
