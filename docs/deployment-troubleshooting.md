# Deployment Troubleshooting Guide 🔧

> **Operational Diagnostics, Root Cause Analysis, and Solutions for KelanaAI**

This guide provides an exhaustive troubleshooting manual for production and staging environments of KelanaAI. Follow the diagnostic workflows and resolution procedures below to resolve deployment, networking, database, and cloud AI infrastructure issues.

---

## 📑 Table of Contents

1. [CORS Errors (Cross-Origin Resource Sharing)](#1-cors-errors-cross-origin-resource-sharing)
2. [Missing or Misconfigured Environment Variables](#2-missing-or-misconfigured-environment-variables)
3. [Incorrect API URLs (Frontend Failing to Reach Backend)](#3-incorrect-api-urls-frontend-failing-to-reach-backend)
4. [Database Connection Failures (Neon & Connection Pooling Limits)](#4-database-connection-failures-neon--connection-pooling-limits)
5. [AWS Credentials & IAM Permission Errors (Amazon Bedrock)](#5-aws-credentials--iam-permission-errors-amazon-bedrock)
6. [Quick Diagnostic Command Reference](#quick-diagnostic-command-reference)

---

## 1. CORS Errors (Cross-Origin Resource Sharing)

### Overview & Root Cause
Cross-Origin Resource Sharing (CORS) is a browser security mechanism that restricts cross-origin HTTP requests. Because KelanaAI separates the client interface (e.g., hosted on `https://kelana-ai.vercel.app`) from the API backend (e.g., hosted on `https://api.kelana-ai.com`), the backend must explicitly acknowledge and permit the frontend origin in response headers.

### Common Symptoms
- **Browser Console Error:**
  ```text
  Access to fetch at 'https://api.kelana-ai.com/api/v1/trips' from origin 'https://kelana-ai.vercel.app' 
  has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
  ```
- **Preflight `OPTIONS` Failure:**
  The browser sends an HTTP `OPTIONS` preflight request which returns `405 Method Not Allowed`, `403 Forbidden`, or `500 Internal Server Error`.
- **Fetch Failure:**
  Frontend network calls immediately throw `TypeError: Failed to fetch` without reaching component response handlers.

### Root Causes
1. `FRONTEND_URL` on the backend does not match the actual origin (e.g., trailing slash mismatch: `https://kelana-ai.vercel.app/` vs `https://kelana-ai.vercel.app`).
2. Preview branches on Vercel generate dynamic URLs (e.g., `https://kelana-ai-git-feature-*.vercel.app`) not included in allowed origins.
3. An unhandled backend exception occurs prior to CORS middleware execution, producing a raw 500 error that omits CORS headers.

### Step-by-Step Solutions

#### Solution 1.1: Standardize Backend CORS Configuration
Update `backend/main.py` to parse comma-separated origins, automatically strip trailing slashes, and support local development origins simultaneously:

```python
import os
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Collect allowed origins from environment variable or defaults
frontend_env = os.getenv("FRONTEND_URL", "http://localhost:3000")
allowed_origins = [origin.strip().rstrip("/") for origin in frontend_env.split(",") if origin.strip()]

# Ensure local dev origins are present for staging/local testing
default_dev_origins = ["http://localhost:3000", "http://127.0.0.1:3000"]
for origin in default_dev_origins:
    if origin not in allowed_origins:
        allowed_origins.append(origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)
```

#### Solution 1.2: Support Vercel Preview Deployments (Regex Origin Matching)
If preview branches are used, add `allow_origin_regex` to permit dynamic Vercel deployments:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https:\/\/kelana-ai(-[a-z0-9-]+)?\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### Solution 1.3: Verify via cURL
Simulate a browser preflight request from your terminal to verify headers:

```bash
curl -i -X OPTIONS https://api.kelana-ai.com/api/v1/trips \
  -H "Origin: https://kelana-ai.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Authorization, Content-Type"
```
*Expected Response:*
```http
HTTP/2 200 
access-control-allow-origin: https://kelana-ai.vercel.app
access-control-allow-credentials: true
access-control-allow-methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
access-control-allow-headers: Authorization, Content-Type
```

---

## 2. Missing or Misconfigured Environment Variables

### Overview & Root Cause
Both Next.js and FastAPI rely on runtime and build-time environment variables. Because Next.js bakes `NEXT_PUBLIC_*` variables into client JavaScript bundles **at build time**, and FastAPI reads backend secrets via `os.getenv()`, missing variables cause fatal startup crashes or silent client failures.

### Common Symptoms
- **Backend Startup Crash:**
  ```text
  ValueError: KNOWLEDGE_BASE_ID is not set. Check your .env file.
  ```
- **Silent Auth Insecurity:**
  Token verification falls back to `"your-secret-key"`, causing tokens issued across server restarts or different workers to become invalid.
- **Frontend Undefined URL:**
  Network calls target `http://undefined/trips` or default to `http://localhost:8000` on production domains.

### Master Environment Variable Matrix

#### Backend Variables (`backend/.env`)

| Variable Name | Required | Default / Fallback | Description |
| :--- | :---: | :--- | :--- |
| `DATABASE_URL` | **Yes** | *None* | PostgreSQL connection URI (Neon Pooled connection with `?sslmode=require`). |
| `FRONTEND_URL` | **Yes** | `http://localhost:3000` | Allowed frontend origin URL (no trailing slash). |
| `SECRET_KEY` | **Yes** | `your-secret-key` | 32+ byte cryptographic secret for JWT signing and decoding. |
| `AWS_REGION` | **Yes** | `ap-southeast-2` | AWS region where Bedrock and Knowledge Base are located. |
| `MODEL_ID` | **Yes** | `amazon.nova-lite-v1:0` | Amazon Bedrock model ID for Converse API. |
| `KNOWLEDGE_BASE_ID` | **Yes** | *None* | ID of the Amazon Bedrock Knowledge Base vector index. |
| `AWS_ACCESS_KEY_ID` | Conditional | *None* | AWS IAM Access Key (required if not using IAM instance roles). |
| `AWS_SECRET_ACCESS_KEY` | Conditional | *None* | AWS IAM Secret Key (required if not using IAM instance roles). |

#### Frontend Variables (`frontend/.env.local`)

| Variable Name | Required | Injected At | Description |
| :--- | :---: | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | **Yes** | **Build Time** | Public backend base URL ending in `/api/v1` (e.g., `https://api.kelana-ai.com/api/v1`). |

### Step-by-Step Solutions

#### Solution 2.1: Add Startup Environment Validation in FastAPI
Prevent silent degradation by adding an explicit startup validation check in `backend/main.py`:

```python
import sys
import logging

REQUIRED_ENV_VARS = [
    "DATABASE_URL",
    "SECRET_KEY",
    "AWS_REGION",
    "MODEL_ID",
    "KNOWLEDGE_BASE_ID"
]

@app.on_event("startup")
def validate_environment():
    missing = [var for var in REQUIRED_ENV_VARS if not os.getenv(var)]
    if missing:
        logging.critical(f"FATAL: Missing mandatory environment variables: {', '.join(missing)}")
        sys.exit(1)
        
    if os.getenv("SECRET_KEY") == "your-secret-key":
        logging.warning("SECURITY WARNING: Using default insecure SECRET_KEY in production!")
```

#### Solution 2.2: Fix Next.js Build-Time Baking on Vercel
1. Open the **Vercel Project Dashboard** > **Settings** > **Environment Variables**.
2. Set `NEXT_PUBLIC_API_URL` to `https://api.kelana-ai.com/api/v1`.
3. Check all environments: **Production**, **Preview**, and **Development**.
4. Navigate to **Deployments** and click **Redeploy** on the latest build. (*Changes to `NEXT_PUBLIC_*` variables do NOT take effect until a new build is generated!*)

---

## 3. Incorrect API URLs (Frontend Failing to Reach Backend)

### Overview & Root Cause
Frontend services in `frontend/services/` query the backend using `process.env.NEXT_PUBLIC_API_URL`. Misconfigured path prefixes, trailing slashes, or protocol mismatches result in network errors or 404 responses.

### Common Symptoms
- **Connection Refused in Production:**
  Browser network tab shows requests targeting `http://localhost:8000/api/v1/trips` while browsing the production domain.
- **Double-Slash URL Corruption:**
  Requests hit `https://api.kelana-ai.com//api/v1/trips` or `https://api.kelana-ai.com/api/v1//trips`, returning `404 Not Found`.
- **Missing `/api/v1` Prefix:**
  Requests query `https://api.kelana-ai.com/trips` instead of `https://api.kelana-ai.com/api/v1/trips`, triggering FastAPI's default 404 handler.
- **Mixed Content Blocker:**
  Browser blocks API calls with:
  ```text
  Mixed Content: The page at 'https://kelana-ai.vercel.app' was loaded over HTTPS, 
  but requested an insecure resource 'http://api.kelana-ai.com/api/v1/trips'. This request has been blocked.
  ```

### Step-by-Step Solutions

#### Solution 3.1: Enforce Safe Base URL Resolution in Frontend Services
Normalize the API base URL in `frontend/lib/apiClient.ts` or a shared config to prevent double slashes or missing slashes:

```typescript
// frontend/lib/config.ts
export const getApiBaseUrl = (): string => {
  const rawUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
  // Remove trailing slash if present
  return rawUrl.replace(/\/+$/, "");
};

// Usage in services:
import { getApiBaseUrl } from "@/lib/config";
const API_BASE = getApiBaseUrl();

export async function fetchTrips() {
  const res = await authenticatedFetch(`${API_BASE}/trips`);
  return res.json();
}
```

#### Solution 3.2: Verify Backend Route Structure
FastAPI routes are prefixed differently depending on where they are mounted. Ensure path alignment:

```python
# In backend/main.py:
# Trips and Recommendations:
@app.get("/api/v1/trips")          # Full path: /api/v1/trips
@app.post("/api/v1/ask")          # Full path: /api/v1/ask

# Auth Router (defined in routers/auth.py with prefix="/api/v1/auth"):
# Full path: /api/v1/auth/login, /api/v1/auth/register, /api/v1/auth/me

# Conversations Router (defined in routers/conversations.py):
# If mounted as app.include_router(conversations_router, prefix="/api/v1"):
# Full path: /api/v1/conversations
```

#### Solution 3.3: Health Check URL Verification
Verify both root and health endpoints using cURL:

```bash
# Verify base server reachability
curl -v https://api.kelana-ai.com/health
# Verify API v1 route reachability
curl -v https://api.kelana-ai.com/api/v1/trip-categories
```

---

## 4. Database Connection Failures (Neon & Connection Pooling Limits)

### Overview & Root Cause
Neon is a serverless PostgreSQL platform that scales compute endpoints to zero when idle and provisions transient micro-instances. Direct PostgreSQL connections have strict concurrency limits (typically 20-100 direct slots). When multiple FastAPI workers or serverless functions initiate unpooled connections, connection limits are rapidly exceeded.

### Common Symptoms
- **Connection Slot Exhaustion:**
  ```text
  psycopg2.OperationalError: FATAL: remaining connection slots are reserved 
  for non-replication superuser connections
  ```
- **QueuePool Overflow in SQLAlchemy:**
  ```text
  sqlalchemy.exc.TimeoutError: QueuePool limit of size 5 overflow 10 reached, connection timed out, timeout 30.00
  ```
- **Broken Pipe / Abrupt Closure (Cold Starts):**
  ```text
  psycopg2.OperationalError: server closed the connection unexpectedly
  This probably means the server terminated abnormally before or while processing the request.
  ```
- **SSL Handshake Failure:**
  ```text
  psycopg2.OperationalError: SSL connection has been closed unexpectedly
  ```

### Step-by-Step Solutions

#### Solution 4.1: Switch to Neon Pooled Connection String
Neon provides built-in PgBouncer pooling via a dedicated `-pooler` subdomain. 

1. Go to **Neon Console** > **Dashboard** > **Connection Details**.
2. Select **Pooled connection**.
3. Confirm the URL contains `-pooler`:
   ```text
   # CORRECT (Pooled):
   postgresql://user:password@ep-cool-mountain-123456-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require

   # INCORRECT (Direct, will exhaust slots):
   postgresql://user:password@ep-cool-mountain-123456.ap-southeast-2.aws.neon.tech/neondb
   ```

#### Solution 4.2: Optimize SQLAlchemy Engine Configuration for Serverless PostgreSQL
Update `backend/database.py` with connection recycling, health pings, and bounded pool parameters:

```python
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# Production-grade connection pool settings for Neon Serverless
engine = create_engine(
    DATABASE_URL,
    pool_size=5,             # Persistent connection count per worker
    max_overflow=10,         # Maximum temporary bursts under peak load
    pool_timeout=30,         # Seconds to wait for a free connection
    pool_recycle=1800,       # Recycle connections every 30 minutes to prevent stale timeouts
    pool_pre_ping=True,      # Test connections before checkout (eliminates 'server closed unexpectedly')
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def init_db() -> None:
    """Create all tables if they do not exist."""
    Base.metadata.create_all(bind=engine)
```

#### Solution 4.3: Ensure Sessions Are Deterministically Closed (FastAPI Dependency)
Prevent connection leaks by using FastAPI's dependency injection pattern with `yield` instead of manually instantiating `SessionLocal()`:

```python
# backend/services/dependencies.py
from database import SessionLocal
from typing import Generator
from sqlalchemy.orm import Session

def get_db() -> Generator[Session, None, None]:
    """Yield a database session and guarantee it closes when the request ends."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

---

## 5. AWS Credentials & IAM Permission Errors (Amazon Bedrock)

### Overview & Root Cause
KelanaAI relies on two Amazon Bedrock subsystems:
1. **Bedrock Runtime (`bedrock-runtime`):** Executes `client.converse()` against foundational models (e.g., `amazon.nova-lite-v1:0`) for itinerary generation and chat.
2. **Bedrock Agent Runtime (`bedrock-agent-runtime`):** Executes `client.retrieve()` against vector knowledge bases for grounded legal and customs Q&A.

Failure to grant exact IAM action permissions, incorrect region routing, or ungranted model entitlements in the AWS Console cause authorization rejections.

### Common Symptoms
- **Missing Credentials:**
  ```text
  botocore.exceptions.NoCredentialsError: Unable to locate credentials
  ```
- **Converse API Access Denied:**
  ```text
  botocore.errorfactory.AccessDeniedException: An error occurred (AccessDeniedException) 
  when calling the Converse operation: User: arn:aws:iam::123456789012:user/kelana-app 
  is not authorized to perform: bedrock:InvokeModel on resource: arn:aws:bedrock:ap-southeast-2::foundation-model/amazon.nova-lite-v1:0
  ```
- **Model Inactive / Not Enabled in Region:**
  ```text
  ValidationException: The provided model ID 'amazon.nova-lite-v1:0' is invalid or not available in region 'ap-southeast-2'
  ```
- **Knowledge Base Retrieval Access Denied:**
  ```text
  botocore.errorfactory.AccessDeniedException: An error occurred (AccessDeniedException) 
  when calling the Retrieve operation: User is not authorized to perform: bedrock:Retrieve 
  on resource: arn:aws:bedrock:ap-southeast-2:123456789012:knowledge-base/EW7EM5BPON
  ```

### Step-by-Step Solutions

#### Solution 5.1: Verify & Enable Model Access in AWS Console
Amazon Bedrock requires models to be explicitly enabled per region before programmatic access is allowed:
1. Log in to the [AWS Management Console](https://console.aws.amazon.com/bedrock).
2. Set your active region in the top navigation bar to match `AWS_REGION` (e.g., **Asia Pacific (Sydney) `ap-southeast-2`** or **US East (N. Virginia) `us-east-1`**).
3. In the left sidebar, scroll to the bottom and select **Model access**.
4. Click **Manage model access** (or **Modify model access**).
5. Locate **Amazon Nova Lite** (or Amazon Titan / Anthropic Claude if used) and check the checkbox.
6. Click **Save changes** and wait until the status changes to **Access granted**.

#### Solution 5.2: Create Dedicated IAM Policy with Least Privilege
Attach the following IAM Policy to your application's IAM user or EC2/ECS/AppRunner IAM role:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "BedrockConverseInvocation",
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": [
        "arn:aws:bedrock:*::foundation-model/amazon.nova-lite-v1:0",
        "arn:aws:bedrock:*::foundation-model/*"
      ]
    },
    {
      "Sid": "BedrockKnowledgeBaseRetrieval",
      "Effect": "Allow",
      "Action": [
        "bedrock:Retrieve"
      ],
      "Resource": [
        "arn:aws:bedrock:*:*:knowledge-base/*"
      ]
    }
  ]
}
```

#### Solution 5.3: Verify AWS Identity & Permissions via CLI
Run this diagnostic script from within your backend environment:

```bash
python3 -c "
import os, boto3
from dotenv import load_dotenv
load_dotenv()

region = os.getenv('AWS_REGION', 'ap-southeast-2')
model_id = os.getenv('MODEL_ID', 'amazon.nova-lite-v1:0')
kb_id = os.getenv('KNOWLEDGE_BASE_ID')

print(f'Checking AWS Identity in region [{region}]...')
sts = boto3.client('sts', region_name=region)
try:
    identity = sts.get_caller_identity()
    print(f'✓ Authenticated ARN: {identity[\"Arn\"]}')
except Exception as e:
    print(f'✗ Failed to get caller identity: {e}')
    exit(1)

print(f'\nTesting Bedrock Converse with model [{model_id}]...')
bedrock = boto3.client('bedrock-runtime', region_name=region)
try:
    res = bedrock.converse(
        modelId=model_id,
        messages=[{'role': 'user', 'content': [{'text': 'Test'}]}]
    )
    print('✓ Bedrock Converse API success!')
except Exception as e:
    print(f'✗ Bedrock Converse API failed: {e}')

if kb_id:
    print(f'\nTesting Bedrock Knowledge Base [{kb_id}]...')
    agent = boto3.client('bedrock-agent-runtime', region_name=region)
    try:
        kb_res = agent.retrieve(
            knowledgeBaseId=kb_id,
            retrievalQuery={'text': 'customs declaration'}
        )
        print(f'✓ Knowledge Base Retrieve success! Retrieved {len(kb_res.get(\"retrievalResults\", []))} chunks.')
    except Exception as e:
        print(f'✗ Knowledge Base Retrieve failed: {e}')
"
```

---

## ⚡ Quick Diagnostic Command Reference

Save this table for rapid operational triage during outages:

| Diagnostic Goal | Command / Action | Expected Result |
| :--- | :--- | :--- |
| **Backend Liveness** | `curl -sS https://api.kelana-ai.com/health` | `{"status":"OK"}` |
| **CORS Preflight Test** | `curl -i -X OPTIONS https://api.kelana-ai.com/api/v1/trips -H "Origin: https://kelana-ai.vercel.app" -H "Access-Control-Request-Method: GET"` | Status `200` with `access-control-allow-origin` |
| **Database Connectivity** | `psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM trips;"` | Returns integer count of trips without SSL errors |
| **Active Postgres Connections** | `psql "$DATABASE_URL" -c "SELECT count(*) FROM pg_stat_activity;"` | Value must be below instance connection limit |
| **Frontend Public Var Audit** | `grep -rn "NEXT_PUBLIC_API_URL" frontend/.next/` | Outputs compiled JS bundles containing production API URL |
| **AWS Caller Identity** | `aws sts get-caller-identity` | Valid Account ID and IAM User/Role ARN |
| **Test Model Access** | `aws bedrock list-foundation-models --region ap-southeast-2` | Returns list including `amazon.nova-lite-v1:0` |
| **Uvicorn Log Inspection** | `docker logs -f kelana_backend` or hosting console | Inspect error stack traces and active worker counts |
