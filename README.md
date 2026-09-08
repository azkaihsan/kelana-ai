# KelanaAI 🌏✈️

> **Intelligent AI-Powered Travel Planning & Destination Assistant Platform**

KelanaAI is a full-stack, AI-native travel companion designed to revolutionize trip planning, itinerary management, and travel consultation. Powered by **Amazon Bedrock (Nova Lite)** for generative trip itineraries and conversational chat, combined with **Amazon Bedrock Knowledge Bases (RAG)** for verified, document-grounded regulatory and travel advisory intelligence, KelanaAI bridges the gap between static trip planning and dynamic, verified AI assistance.

---

## 🌐 Live Deployments

- **Live App :** https://kelana-ai-five.vercel.app/
- **Live API :** https://kelana-ai-cc9cb4d7.fastapicloud.dev/
- **Live API Docs :** https://kelana-ai-cc9cb4d7.fastapicloud.dev/docs
- **Live DB :** Neon Serverless PostgreSQL ([Neon Console](https://console.neon.tech/app/projects/little-glade-03919573))

---

## 📑 Table of Contents

- [Live Deployments](#-live-deployments)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Project Directory Structure](#project-directory-structure)
- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Primary Deployment Guide](#primary-deployment-guide)
  - [1. Database Deployment (Neon Serverless PostgreSQL)](#1-database-deployment-neon-serverless-postgresql)
  - [2. Backend Deployment (FastApiCloud / PaaS)](#2-backend-deployment-fastapicloud--paas)
  - [3. Frontend Deployment (Vercel)](#3-frontend-deployment-vercel)
- [Alternative Deployment (Docker & Self-Hosted)](#alternative-deployment-docker--self-hosted)
  - [Dockerized Stack Architecture](#dockerized-stack-architecture)
  - [Backend Dockerfile](#backend-dockerfile)
  - [Frontend Dockerfile](#frontend-dockerfile)
  - [Docker Compose Configuration](#docker-compose-configuration)
  - [Self-Hosting with Nginx & Let's Encrypt](#self-hosting-with-nginx--lets-encrypt)
- [Local Development Setup](#local-development-setup)
- [30-Day MVP: Travel Expense & Budget Tracking](#30-day-mvp-travel-expense--budget-tracking)
- [V2.0 90-Day Roadmap](#v20-90-day-roadmap)
- [Documentation Index](#documentation-index)

---

## 🏛️ System Architecture

KelanaAI is architected as a decoupled, multi-tier cloud-native system:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                   │
│  Next.js 16 (React 19, TypeScript, Tailwind CSS v4, Lucide Icons)           │
│  - Trip Planner & Budget Dashboard       - Multi-Session AI Chat Interface  │
│  - Verified Knowledge Base Assistant     - JWT Authenticated User Dashboard │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTPS / REST (JSON) + Bearer JWT
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             BACKEND API LAYER                               │
│  FastAPI (Python 3.12+, Uvicorn, Pydantic, SQLAlchemy ORM, python-jose)    │
│  - Auth Router (/api/v1/auth)            - Trips Router (/api/v1/trips)     │
│  - Conversations Router (/conversations) - RAG Assistant (/api/v1/ask)      │
│  - CORS Middleware & Validation          - Token Verification & Ownership   │
└───────────────────┬─────────────────────────────────────┬───────────────────┘
                    │                                     │
                    ▼ SQLAlchemy / Psycopg2               ▼ AWS Boto3 SDK
┌──────────────────────────────────────┐  ┌───────────────────────────────────┐
│           DATABASE LAYER             │  │            AI LAYER               │
│  PostgreSQL (Neon / Docker)          │  │  Amazon Bedrock                   │
│  - Users (Credentials & Relations)   │  │  - Converse API (Nova Lite Model) │
│  - Trips (Itineraries & Budgets)     │  │  - Knowledge Base (Vector RAG)    │
│  - Conversations & Messages          │  │    * Regulatory & Customs Rules   │
│  - Connection Pooling & SSL          │  │    * Strict Threshold Filtering   │
└──────────────────────────────────────┘  └───────────────────────────────────┘
```

### Core Capabilities
1. **Interactive Trip Planning & Budgeting:** Automatic calculation of daily budgets and tier categorization (Backpacker, Budget, Moderate, Luxury) with full CRUD operations and strict user-level data isolation.
2. **AI Itinerary Generation:** Generation of structured, multi-day itineraries complete with day themes, transit tips, curated local food suggestions, and cost breakdowns via Amazon Bedrock.
3. **Conversational AI Companion:** Multi-turn chat with conversation history compression (sliding window with smart summarization for threads exceeding 500 messages) to prevent context exhaustion.
4. **Grounded Regulatory RAG Assistant:** Bedrock Knowledge Base vector retrieval with strict similarity thresholding (`score > 0.85`) to deliver verified legal, visa, and customs advice with source document citations.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 16 (App Router)
- **UI & Runtime:** React 19, TypeScript 5
- **Styling:** Tailwind CSS v4, PostCSS
- **State & Client Utilities:** Native Fetch wrapper with auto-JWT attachment (`lib/apiClient.ts`), React Context (`AuthContext`), React Markdown

### Backend
- **Framework:** FastAPI (Python 3.12+)
- **ASGI Server:** Uvicorn
- **ORM & Database Client:** SQLAlchemy, Psycopg2-binary
- **Security & Authentication:** Passlib, Bcrypt, Python-Jose (JWT HS256)
- **Validation:** Pydantic v2

### Database & Cloud
- **Database:** PostgreSQL (Neon Serverless PostgreSQL or local PostgreSQL instance)
- **AI / LLM:** Amazon Bedrock Runtime (`amazon.nova-lite-v1:0`), Amazon Bedrock Agent Runtime (Knowledge Bases)
- **SDK:** AWS SDK for Python (`boto3`, `botocore`)

---

## 📁 Project Directory Structure

```
kelana-ai/
├── README.md                           # Master project documentation
├── docs/                               # Engineering and operational docs
│   ├── architecture.md                 # Master System Architecture Document
│   ├── user-journey.md                 # End-to-End User Journey & Persona Lifecycle
│   ├── future-improvements.md          # V2.0 Champion Feature & 30-Day MVP Plan
│   ├── v2-roadmap.md                   # 90-Day Version 2.0 Product & Engineering Roadmap
│   ├── e2e-testing.md                  # Comprehensive E2E testing procedures
│   ├── deployment-troubleshooting.md   # Deployment, CORS, DB, & AI troubleshooting
│   ├── questions.md                    # Knowledge base evaluation dataset
│   └── test_result.md                  # RAG vs. Base Model evaluation report
├── backend/                            # FastAPI Application
│   ├── main.py                         # Application entrypoint & route registration
│   ├── database.py                     # SQLAlchemy engine and session factory
│   ├── requirements.txt                # Python dependencies
│   ├── models/                         # SQLAlchemy database models
│   │   ├── user.py                     # User entity
│   │   ├── trip.py                     # Trip entity with AI itinerary column
│   │   └── conversation.py             # Conversation & Message entities
│   ├── routers/                        # Modular API route controllers
│   │   ├── auth.py                     # Register, login, profile (/auth)
│   │   └── conversations.py            # Threads and chat messages (/conversations)
│   └── services/                       # Business logic and external integrations
│       ├── auth_service.py             # Password hashing and JWT generation
│       ├── trip_service.py             # Budget calculations and categories
│       ├── bedrock_service.py          # Bedrock Converse API & history compaction
│       ├── kb_service.py               # Bedrock Knowledge Base vector retrieval
│       └── dependencies.py             # FastAPI dependency injection (get_current_user)
└── frontend/                           # Next.js Application
    ├── app/                            # Next.js App Router pages
    │   ├── page.tsx                    # Landing page
    │   ├── login/                      # Login interface
    │   ├── register/                   # Registration interface
    │   ├── profile/                    # User profile dashboard
    │   ├── trips/                      # Trip management & planner
    │   │   ├── page.tsx                # Trips list & creation modal
    │   │   └── [id]/edit/              # Trip editing interface
    │   ├── assistant/                  # RAG Knowledge Base Q&A interface
    │   └── chat/                       # Conversational AI interface
    ├── components/                     # Reusable UI components (Navbar, TripCard, etc.)
    ├── context/                        # Global state (AuthContext)
    ├── lib/                            # API client and utility helpers
    ├── services/                       # Frontend API abstraction services
    └── types/                          # TypeScript definitions
```

---

## ✅ Pre-Deployment Checklist

Before deploying KelanaAI to production, verify all items across each architectural tier:

### Backend
- [ ] Python 3.12+ runtime selected on the hosting environment.
- [ ] Dependencies declared in `backend/requirements.txt` install cleanly with pinned versions.
- [ ] Uvicorn configured as the production ASGI server with an appropriate worker count (`workers = 2 * CPU_CORES + 1`).
- [ ] Exception handlers registered (e.g., custom `RequestValidationError` handler).
- [ ] Table schema initialized via `init_db()` or database migrations.

### Frontend
- [ ] Node.js 20+ LTS runtime selected on the build server.
- [ ] Production build succeeds locally (`npm run build` inside `frontend/`).
- [ ] No hardcoded `localhost` URLs in frontend services or components.
- [ ] Client error boundary (`app/error.tsx`) and fallback states (`app/loading.tsx`, `app/not-found.tsx`) configured.

### Database
- [ ] Managed PostgreSQL instance provisioned (e.g., Neon).
- [ ] Connection pooling (PgBouncer) enabled to support serverless scale without hitting connection limits.
- [ ] SSL mode set to `require` on database connection strings.
- [ ] Database network security/firewall allows inbound traffic from Backend IPs.

### Auth & Security
- [ ] Production `SECRET_KEY` generated with high cryptographic entropy (`openssl rand -hex 32`).
- [ ] Password hashing enabled via `bcrypt`.
- [ ] Token expiration configured (`ACCESS_TOKEN_EXPIRE_MINUTES`).
- [ ] Resource-level authorization enforced on all mutative endpoints (verifying `trip.user_id == current_user.id`).

### AI & Cloud Services
- [ ] AWS Bedrock model access granted for `amazon.nova-lite-v1:0` in the target region (e.g., `ap-southeast-2` or `us-east-1`).
- [ ] Amazon Bedrock Knowledge Base deployed, indexed, and operational.
- [ ] IAM credentials or IAM role provisioned with `bedrock:InvokeModel` and `bedrock:Retrieve` permissions.

### Environment Variables
- [ ] All required backend variables populated in the production host environment.
- [ ] `NEXT_PUBLIC_API_URL` injected into the frontend build environment.
- [ ] No secrets or `.env` files committed to Git repositories.

### HTTPS & Networking
- [ ] HTTPS enforced across both Frontend and Backend custom domains.
- [ ] CORS allowed origins configured with exact production frontend URL (`FRONTEND_URL`), excluding trailing slashes.
- [ ] Valid SSL/TLS certificates issued (e.g., Let's Encrypt or Vercel managed certs).

---

## 🚀 Primary Deployment Guide

The recommended production deployment flow uses **Neon** for serverless PostgreSQL, **FastApiCloud** (or equivalent container PaaS) for the FastAPI backend, and **Vercel** for the Next.js frontend.

### 1. Database Deployment (Neon Serverless PostgreSQL)

1. **Create Neon Project:**
   - Log in to [Neon Console](https://console.neon.tech/).
   - Create a new project named `kelana-ai-prod`.
   - Select a cloud region close to your backend and users (e.g., `AWS ap-southeast-2` or `AWS us-east-1`).

2. **Retrieve Pooled Connection String:**
   - On the Neon Dashboard, navigate to **Connection Details**.
   - Check the **Pooled connection** checkbox (this activates PgBouncer on port `5432` or `6543`, which is essential for handling asynchronous FastAPI requests without exhausting Postgres connection limits).
   - Copy the connection URI:
     ```text
     postgresql://<user>:<password>@<project-id>-pooler.<region>.neon.tech/neondb?sslmode=require
     ```

3. **Verify Connection:**
   Test connectivity using `psql`:
   ```bash
   psql "postgresql://<user>:<password>@<project-id>-pooler.<region>.neon.tech/neondb?sslmode=require"
   ```

---

### 2. Backend Deployment (FastApiCloud / PaaS)

FastApiCloud / PaaS platforms provide containerized deployment for FastAPI applications with automatic SSL and environment variable injection.

1. **Configure Repository:**
   - Ensure the repository contains `backend/requirements.txt` and `backend/main.py`.

2. **Set Build & Start Commands:**
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4`

3. **Configure Environment Variables:**
   Inject the following environment variables in the platform dashboard:

   | Variable | Description | Example Production Value |
   | :--- | :--- | :--- |
   | `DATABASE_URL` | Neon pooled PostgreSQL connection URI | `postgresql://user:pass@ep-xyz-pooler.neon.tech/neondb?sslmode=require` |
   | `FRONTEND_URL` | Exact URL of deployed frontend (no trailing slash) | `https://kelana-ai.vercel.app` |
   | `SECRET_KEY` | High-entropy secret for JWT signature | `e4b3c9f28a1d7...` *(32+ hex chars)* |
   | `AWS_REGION` | AWS Region where Bedrock is active | `ap-southeast-2` |
   | `MODEL_ID` | Model identifier for Bedrock Converse API | `amazon.nova-lite-v1:0` |
   | `KNOWLEDGE_BASE_ID` | Amazon Bedrock Knowledge Base ID | `EW7EM5BPON` |
   | `AWS_ACCESS_KEY_ID` | AWS IAM Access Key *(if not using IAM role)* | `AKIAIOSFODNN7EXAMPLE` |
   | `AWS_SECRET_ACCESS_KEY` | AWS IAM Secret Key *(if not using IAM role)* | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
   | `AWS_BEARER_TOKEN_BEDROCK` | Optional Bedrock API token *(if using token auth)* | `<encoded-token>` |

4. **Trigger Deployment & Health Check:**
   - Deploy the service and verify logs to ensure `init_db()` successfully created tables (`users`, `trips`, `conversations`, `messages`).
   - Run a health check against the live endpoint:
     ```bash
     curl -I https://api.kelana-ai.yourdomain.com/health
     # Expected: HTTP/2 200 OK {"status":"OK"}
     ```

---

### 3. Frontend Deployment (Vercel)

1. **Import Project into Vercel:**
   - Log in to [Vercel](https://vercel.com/) and click **Add New Project**.
   - Connect your GitHub repository (`kelana-ai`).

2. **Configure Build Settings:**
   - **Framework Preset:** `Next.js`
   - **Root Directory:** Edit and set to `frontend`
   - **Build Command:** `next build` (default)
   - **Output Directory:** `.next` (default)
   - **Install Command:** `npm install` (default)

3. **Configure Environment Variables:**
   In the **Environment Variables** section, configure:

   | Variable | Target Environments | Value |
   | :--- | :--- | :--- |
   | `NEXT_PUBLIC_API_URL` | Production, Preview, Development | `https://api.kelana-ai.yourdomain.com/api/v1` |

   > **CRITICAL:** In Next.js, `NEXT_PUBLIC_*` variables are embedded into client-side JavaScript bundles **at build time**. If the backend URL changes, you must trigger a redeploy on Vercel.

4. **Deploy & Validate:**
   - Click **Deploy**. Vercel will build the Next.js application and assign a production URL (e.g., `https://kelana-ai.vercel.app`).
   - Copy this URL and update the `FRONTEND_URL` variable on your backend to prevent CORS rejections.

---

## 🐳 Alternative Deployment (Docker & Self-Hosted)

For teams requiring complete infrastructure control, on-premise execution, or cloud-agnostic deployment (e.g., AWS EC2, DigitalOcean, Hetzner, GCP Compute Engine), KelanaAI can be run as a containerized stack using Docker and Docker Compose.

### Dockerized Stack Architecture

```
                       ┌────────────────────────────┐
                       │   Client (Web Browser)     │
                       └─────────────┬──────────────┘
                                     │ :80 / :443
                                     ▼
                   ┌───────────────────────────────────┐
                   │  Nginx Reverse Proxy & SSL Term.  │
                   └───────┬───────────────────┬───────┘
            / (Frontend)   │                   │ /api/ (Backend)
                           ▼                   ▼
                ┌─────────────────────┐  ┌─────────────────────┐
                │ frontend container  │  │  backend container  │
                │ (Next.js Standalone)│  │ (FastAPI + Uvicorn) │
                └─────────────────────┘  └──────────┬──────────┘
                                                    │
                                                    ▼
                                         ┌─────────────────────┐
                                         │  db container       │
                                         │  (PostgreSQL 16)    │
                                         └─────────────────────┘
```

---

### Backend Dockerfile

Create `backend/Dockerfile`:

```dockerfile
# Multi-stage production Dockerfile for FastAPI
FROM python:3.12-slim AS builder

WORKDIR /app

# Install build dependencies for psycopg2 and cryptography
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Final runtime image
FROM python:3.12-slim

WORKDIR /app

# Install runtime PostgreSQL client library
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy installed python packages from builder stage
COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH

# Copy application code
COPY . .

# Run as non-root user for container security
RUN useradd -m appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

### Frontend Dockerfile

Create `frontend/Dockerfile`:

```dockerfile
# Multi-stage build for Next.js 16 with Standalone output
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Builder stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Runner stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy static assets and standalone build
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

> **Note:** To enable standalone output, ensure `next.config.ts` includes `output: "standalone"`.

---

### Docker Compose Configuration

Create `docker-compose.yml` in the root repository:

```yaml
version: '3.8'

services:
  # Database Service
  db:
    image: postgres:16-alpine
    container_name: kelana_postgres
    restart: always
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-kelana_admin}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-secure_dev_password}
      POSTGRES_DB: ${POSTGRES_DB:-kelana_ai}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-kelana_admin} -d ${POSTGRES_DB:-kelana_ai}"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Backend Service
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: kelana_backend
    restart: always
    depends_on:
      db:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER:-kelana_admin}:${POSTGRES_PASSWORD:-secure_dev_password}@db:5432/${POSTGRES_DB:-kelana_ai}
      FRONTEND_URL: ${FRONTEND_URL:-http://localhost:3000}
      SECRET_KEY: ${SECRET_KEY:-changethisinproduction_supersecretjwtkey}
      AWS_REGION: ${AWS_REGION:-ap-southeast-2}
      MODEL_ID: ${MODEL_ID:-amazon.nova-lite-v1:0}
      KNOWLEDGE_BASE_ID: ${KNOWLEDGE_BASE_ID}
      AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID}
      AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY}
    ports:
      - "8000:8000"

  # Frontend Service
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL:-http://localhost:8000/api/v1}
    container_name: kelana_frontend
    restart: always
    depends_on:
      - backend
    ports:
      - "3000:3000"

volumes:
  postgres_data:
    driver: local
```

---

### Self-Hosting with Nginx & Let's Encrypt

When hosting on an Ubuntu/Debian Linux VM, route incoming HTTP/HTTPS traffic through Nginx:

1. **Install Nginx & Certbot:**
   ```bash
   sudo apt update
   sudo apt install -y nginx certbot python3-certbot-nginx
   ```

2. **Configure Nginx Reverse Proxy (`/etc/nginx/sites-available/kelana-ai`):**
   ```nginx
   server {
       server_name kelana.yourdomain.com;

       # Frontend Application
       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }

       # Backend API Proxied
       location /api/ {
           proxy_pass http://127.0.0.1:8000/api/;
           proxy_http_version 1.1;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;

           # Timeout settings for long-running Bedrock AI generations
           proxy_read_timeout 120s;
           proxy_connect_timeout 120s;
           proxy_send_timeout 120s;
       }
   }
   ```

3. **Enable Site & Obtain SSL Certificate:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/kelana-ai /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   sudo certbot --nginx -d kelana.yourdomain.com
   ```

---

## 💻 Local Development Setup

### Prerequisites
- Python 3.12+
- Node.js 20+ & npm
- PostgreSQL running locally or via Docker

### 1. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create and activate Python virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env configuration
cp .env.example .env # or configure .env directly
# Ensure DATABASE_URL, AWS_REGION, MODEL_ID, and KNOWLEDGE_BASE_ID are set

# Run development server
uvicorn main:app --reload --port 8000
```

### 2. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Configure environment
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# Run Next.js development server
npm run dev
```

The application will be accessible at:
- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **Backend API Docs (Swagger):** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check:** [http://localhost:8000/health](http://localhost:8000/health)

---

## 💰 30-Day MVP: Travel Expense & Budget Tracking

To transform KelanaAI from a one-time pre-trip planning utility into an **active daily in-trip companion**, the core priority of our 30-day MVP release is **Real-Time Travel Expense & Budget Tracking**.

- **Core Value Proposition:** *"Close the loop between dream and reality: plan your budget with AI, track your actual spend on the go, and never run out of money mid-trip."*
- **Key MVP Deliverables:**
  - **Mobile Quick-Logging:** Log cash and card expenses (Amount, Category, Date, Note) in under 5 seconds on mobile web.
  - **Live Burn-Down Telemetry:** Dynamic budget progress bar comparing actual daily spend against the planned target ($/day).
  - **Category Spending Telemetry:** Instant breakdown across Accommodation, Food & Dining, Transit, Activities, and Miscellaneous costs.
  - **AI Budget Rebalance Advisor:** On-demand Amazon Bedrock recommendations providing practical trade-offs to recover from mid-trip overspending.
  - **Self-Contained Architecture:** Zero external GDS/OTA API blockers; builds directly upon our existing FastAPI, PostgreSQL, and Bedrock infrastructure.
- 📖 **Full 30-Day Specification:** Detailed sprint schedules, database schemas, and Pydantic contracts are documented in **[`docs/future-improvements.md`](./docs/future-improvements.md)**.

---

## 🗺️ V2.0 90-Day Roadmap

Building upon the initial 30-day MVP release (**Real-Time Travel Expense & Budget Tracking**), the **V2.0 90-Day Roadmap** scales KelanaAI into a collaborative, offline-resilient, enterprise-grade travel platform.

### Phased 90-Day Milestones
1. **Phase 1 (Days 1–30): Expense Tracking V2 & DevOps Foundations**
   - **Multimodal Receipt OCR:** Photograph foreign paper receipts; Amazon Bedrock extracts merchant, amounts, and categories in $<3\text{s}$.
   - **Multi-Currency Engine:** Live daily FX conversion across 32 currencies with CSV and PDF reconciliation export.
   - **CI/CD & Observability:** Automated GitHub Actions test/build pipelines and CloudWatch structured logging with anomaly alerts.
2. **Phase 2 (Days 31–60): Team Trip Planning & Shared Expense Splitting**
   - **Collaborative Trips:** Invite travel companions via secure cryptographic tokens (`trip_members`) with RBAC roles (`Owner`, `Editor`, `Viewer`).
   - **Splitwise-Style Settlement:** Group expense splitting with $O(N)$ debt minimization algorithm ("Who Owes Whom").
   - **Viral Organic Growth:** Group trip invitations creating a self-sustaining viral acquisition loop ($K \ge 1.25$).
3. **Phase 3 (Days 61–90): Mobile PWA Offline Mode, Multi-Model LLM & Public GA**
   - **Progressive Web App (PWA):** Home-screen installable on iOS/Android with Service Worker cache-first application shell.
   - **IndexedDB Offline Queue:** Log expenses and view itineraries with zero cellular connectivity; auto-syncs upon reconnection.
   - **Multi-Model Fallback:** Dynamic Bedrock routing (Nova Lite primary $\to$ Claude 3.5 Haiku fallback on 429/503 errors).
   - **General Availability (GA):** 1,000 virtual-user load testing, zero-trust security audit, and public launch.

📖 **Detailed Roadmap Documentation:**
- 🗺️ **[Comprehensive 90-Day V2.0 Roadmap (`docs/v2-roadmap.md`)](./docs/v2-roadmap.md)**: Feature selection matrix, database schemas, Pydantic contracts, Gantt charts, and risk mitigations.
- 🚀 **[Initial 30-Day MVP Plan (`docs/future-improvements.md`)](./docs/future-improvements.md)**: Core expense tracking MVP specifications and sprint schedule.

---

## 📚 Documentation Index

For in-depth operational procedures, testing specifications, and troubleshooting matrices, refer to:
- 🏛️ **[System Architecture Document (`docs/architecture.md`)](./docs/architecture.md)**: 8-tier system architecture, component breakdowns, defensibility trade-off matrix, sequence diagrams, and end-to-end data flows.
- 🗺️ **[End-to-End User Journey (`docs/user-journey.md`)](./docs/user-journey.md)**: Narrative walkthrough following a traveler through registration, itinerary generation, grounded RAG Q&A, multi-turn chat, and account management.
- 🗺️ **[90-Day V2.0 Roadmap (`docs/v2-roadmap.md`)](./docs/v2-roadmap.md)**: Product & engineering execution plan across Expense V2, Team Planning, Mobile PWA, and Multi-Model LLMs.
- 🚀 **[Future Improvements & 30-Day MVP (`docs/future-improvements.md`)](./docs/future-improvements.md)**: Initial feature justification matrix and 30-day MVP rollout plan for Travel Expense Tracking.
- 🧪 **[End-to-End Testing Documentation (`docs/e2e-testing.md`)](./docs/e2e-testing.md)**: User flows, testing frameworks (Playwright, Postman, pytest), assertions, and DB state verification.
- 🔧 **[Deployment Troubleshooting Guide (`docs/deployment-troubleshooting.md`)](./docs/deployment-troubleshooting.md)**: Resolution workflows for CORS issues, missing environment variables, API routing mismatches, Neon connection pool limits, and AWS Bedrock IAM permissions.
- 📊 **[RAG Response Evaluation Report (`docs/test_result.md`)](./docs/test_result.md)**: Quantitative and qualitative benchmarking of Amazon Bedrock Knowledge Base retrieval versus base LLM output.
- ❓ **[AI Evaluation Test Suite (`docs/questions.md`)](./docs/questions.md)**: Domain-specific regulatory and travel scenario test questions.
