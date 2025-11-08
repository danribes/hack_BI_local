# Implementation Plan: Healthcare AI Clinical Data Analyzer

**Branch**: `claude/download-taskmaster-repo-011CUu6maGwYy8jueRtK8LS6` | **Date**: 2025-11-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `spec.md` and product requirements from `.taskmaster/docs/prd.txt`

## Summary

The Healthcare AI Clinical Data Analyzer is a GDPR-compliant clinical decision support tool for EU primary care physicians. The system integrates with Electronic Health Records (EHR) via SMART on FHIR, analyzes patient clinical data using AI models (Claude/GPT-4/LLaMA), and provides actionable risk assessments for chronic diseases (diabetes complications, CKD progression, cardiovascular disease).

**Primary Requirement**: Enable doctors to trigger AI-powered risk analysis both manually (during patient consultation) and automatically (when new clinical data enters the EHR), while maintaining strict GDPR compliance through pseudonymization and audit trails.

**Technical Approach**: React SPA embedded in EHR via SMART on FHIR iframe, Express.js backend API for FHIR integration and AI orchestration, event-driven architecture with Redis Queue for automatic risk recalculation, PostgreSQL for audit logs and risk history, progressive containerization with Docker Compose for simple hospital IT deployment.

## Technical Context

**Language/Version**:
- **Frontend**: TypeScript 5.0+, React 18+
- **Backend**: TypeScript 5.0+, Node.js 20 LTS
- **Infrastructure**: Docker 24+, Docker Compose 2.20+

**Primary Dependencies**:
- **Frontend**: React 18, Vite 5, TanStack Query (React Query v5), Tailwind CSS 3, Recharts 2, Socket.io-client 4
- **Backend**: Express.js 4, HAPI FHIR Client (TypeScript), Bull/BullMQ (Redis Queue), Socket.io 4
- **AI/ML**: Anthropic SDK (Claude 3.5 Sonnet), Azure OpenAI SDK (GPT-4), LLaMA.cpp (local deployment)
- **Database**: PostgreSQL 14+, Redis 7
- **Streaming** (Phase 2+): Apache Kafka 3.5+ (Confluent Platform)
- **Security**: bcrypt, jsonwebtoken, helmet, cors
- **Testing**: Vitest (frontend), Jest + Supertest (backend), Playwright (E2E)

**Storage**:
- **PostgreSQL 14+**: Audit logs (10-year retention), risk assessments (2-year retention), urine test data (7-year retention), patient token mappings
- **Redis 7**: FHIR data caching (5-minute TTL), background job queue, WebSocket session management
- **Apache Kafka** (Phase 2+): Event streaming for urine analysis data, change data capture from EHR systems

**Testing**:
- **Unit Tests**: Vitest (frontend components, utility functions), Jest (backend services, FHIR parsers)
- **Integration Tests**: Supertest (API endpoints), FHIR server mocking
- **Contract Tests**: Pact.js for FHIR API contracts
- **E2E Tests**: Playwright (SMART on FHIR launch flow, OAuth2 authentication, risk analysis workflow)
- **Coverage Target**: >80% for critical paths (AI processing, pseudonymization, audit logging)

**Target Platform**:
- **Primary**: Linux server (Ubuntu 22.04 LTS, RHEL 8+) on-premise or EU cloud (AWS eu-central-1, Azure westeurope, GCP europe-west1)
- **Browser Support**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+ (modern browsers with ES2020 support)
- **EHR Integration**: Epic, Cerner/Oracle Health, CompuGroup Medical (Germany), national systems (Sweden NPÖ, Estonia eHealth, France DMP)
- **Deployment Models**: On-premise (70% of hospitals), EU cloud (30%), air-gapped (high-security hospitals)

**Project Type**: Web application (React SPA frontend + Express.js backend)

**Performance Goals**:
- **AI Risk Analysis Response Time**: <2 seconds per patient (individual analysis), <5 minutes for 500 patients (batch scan)
- **FHIR Data Fetch**: <500ms for typical patient query (10 Observations, 5 Conditions, 5 MedicationRequests)
- **Automatic Risk Recalculation Latency**: <60 seconds from new data entry to updated risk score
- **Real-Time Notification Delivery**: <1 second (WebSocket push to doctor's browser)
- **Background Job Processing**: 10-100 risk recalculations per minute (auto-scaling worker pool)
- **Urine Test Data Ingestion**: <60 seconds from Minuteful Kidney test capture to database storage

**Constraints**:
- **GDPR Compliance**: Pseudonymization required before AI processing (SHA-256 hashing), no storage of raw patient identifiers beyond 72 hours
- **SMART on FHIR Requirement**: Must launch as embedded iframe inside EHR patient chart (Epic, Cerner) - **this eliminates SSR frameworks (Next.js, Astro)**
- **OAuth2 Redirect Flow**: Client-side authentication only (cookies with HttpOnly, SameSite=Strict set by FHIR server)
- **Hospital IT Deployment**: Simple deployment (Docker Compose preferred over Kubernetes), small IT teams (2-5 staff), limited DevOps expertise
- **Network Constraints**: Some hospitals have slow WiFi (10-50 Mbps), high latency to cloud (100-300ms)
- **Security Requirements**: TLS 1.3 in transit, AES-256 at rest, ISO 27001 certification for data centers
- **CE Marking**: Class I medical device classification - requires clinical validation study, technical documentation, risk management
- **Audit Trail**: Immutable logs with 10-year retention (GDPR requirement for medical records)

**Scale/Scope**:
- **MVP (Phase 1)**: 5-10 pilot doctors, 1 country (Sweden/Estonia), 1 risk model (diabetes complications), 500-1000 patients
- **Phase 2**: 50+ doctors, 2 countries (add Germany), 3 risk models (diabetes, CKD, CVD), 5000+ patients
- **Phase 3**: 500+ doctors, 5 countries, 5+ risk models, 50,000+ patients
- **Code Complexity**: ~15,000 LOC (MVP), ~50,000 LOC (full product)
- **Database**: 1TB PostgreSQL (audit logs + risk assessments), 32GB Redis (cache + queue)

## Constitution Check

*No constitution file detected in repository. Proceeding with standard architectural review based on spec-kit best practices.*

**Architectural Complexity Assessment**:

| **Complexity Factor** | **Assessment** | **Justification** |
|----------------------|----------------|-------------------|
| **Number of Services** | Moderate (6 core services) | Frontend SPA, Backend API, PostgreSQL, Redis, Background Workers, WebSocket Server - appropriate for healthcare data integration |
| **External Dependencies** | High (EHR systems, AI APIs) | Required for core functionality - SMART on FHIR standard (Epic, Cerner), Anthropic/OpenAI APIs |
| **Data Flow Complexity** | Moderate-High | Event-driven architecture necessary for automatic risk recalculation on new clinical data |
| **Security Requirements** | High | GDPR compliance mandates pseudonymization, encryption, audit trails - non-negotiable for medical data |
| **Integration Complexity** | High | FHIR R4 API integration, country-specific health registries (gematik TI, DMP, NPÖ) - unavoidable for EU healthcare |

**Verdict**: Complexity is justified by healthcare domain requirements. No simpler alternatives available that meet GDPR, CE marking, and EHR integration constraints.

## Project Structure

### Documentation (this feature)

```text
/home/user/hackathon_BI_CKD/
├── spec.md                          # Feature specification with user stories
├── plan.md                          # This file (technical implementation plan)
├── tasks.md                         # Implementation tasks (155 tasks, 10 phases)
├── docs/
│   ├── technical-decision-record.md # Architecture rationale (React vs Next.js, Docker, etc.)
│   ├── smart-on-fhir-technical-deep-dive.md # OAuth2 flow, SSR incompatibility
│   └── README.md                    # Project overview
└── .taskmaster/
    ├── docs/
    │   └── prd.txt                  # Product Requirements Document
    └── tasks/
        └── tasks.json               # Detailed task breakdown (31 major tasks)
```

### Source Code (repository root)

**Structure Decision**: Monorepo with separate `backend/`, `frontend/`, and `infrastructure/` directories. This structure is chosen because:
1. **Small Team Optimization**: Single repository simplifies dependency management, shared TypeScript types between frontend/backend
2. **Atomic Commits**: Frontend + backend changes for a feature can be committed together (e.g., new FHIR endpoint + UI component)
3. **Hospital IT Deployment**: Simple `docker-compose.yml` at root builds entire stack with one command
4. **Code Reuse**: Shared TypeScript models (Patient, RiskAssessment, AuditLog) used in both frontend and backend

```text
/home/user/hackathon_BI_CKD/
├── backend/
│   ├── src/
│   │   ├── index.ts                 # Express app entry point, middleware setup
│   │   ├── config/
│   │   │   ├── database.ts          # PostgreSQL connection pool config
│   │   │   ├── redis.ts             # Redis client + Bull queue config
│   │   │   └── env.ts               # Environment variable validation (Zod)
│   │   ├── fhir/
│   │   │   ├── client.ts            # HAPI FHIR client wrapper with OAuth2
│   │   │   ├── patient-fetcher.ts   # Fetch Patient resource
│   │   │   ├── observation-fetcher.ts # Fetch Observations (labs)
│   │   │   ├── condition-fetcher.ts # Fetch Conditions (diagnoses)
│   │   │   ├── medication-fetcher.ts # Fetch MedicationRequests
│   │   │   └── parsers.ts           # LOINC code mapping, ICD-10 parsing
│   │   ├── ai/
│   │   │   ├── claude-client.ts     # Anthropic API client
│   │   │   ├── openai-client.ts     # Azure OpenAI client (fallback)
│   │   │   ├── llama-client.ts      # Local LLaMA 3.1 client (air-gapped)
│   │   │   ├── prompts/
│   │   │   │   ├── diabetes-complications.ts # Prompt template
│   │   │   │   ├── ckd-progression.ts
│   │   │   │   └── cvd-risk.ts
│   │   │   └── response-parser.ts   # Validate AI JSON output
│   │   ├── services/
│   │   │   ├── pseudonymization.ts  # SHA-256 hashing, patient token generation
│   │   │   ├── risk-analysis.ts     # Main AI risk analysis orchestrator
│   │   │   ├── risk-history.ts      # Query/store risk assessments in PostgreSQL
│   │   │   ├── change-detection.ts  # Detect new FHIR data (polling/webhooks)
│   │   │   ├── notification.ts      # WebSocket push, email alerts
│   │   │   └── urine-analysis.ts    # Minuteful Kidney API integration
│   │   ├── workers/
│   │   │   ├── risk-recalculation-worker.ts # Bull queue consumer
│   │   │   └── batch-scan-worker.ts # Population health batch jobs
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── analyze.ts       # POST /api/analyze (manual trigger)
│   │   │   │   ├── insights.ts      # GET /api/insights/:patientToken
│   │   │   │   ├── scan-all.ts      # POST /api/scan-all-patients
│   │   │   │   ├── alerts.ts        # GET /api/alerts, POST /api/alerts/:id/acknowledge
│   │   │   │   ├── risk-history.ts  # GET /api/risk-history/:patientToken
│   │   │   │   ├── audit-logs.ts    # GET /api/audit-logs (admin only)
│   │   │   │   └── webhooks.ts      # POST /api/webhook/fhir-changes
│   │   │   └── middleware/
│   │   │       ├── auth.ts          # OAuth2 token validation
│   │   │       ├── rate-limit.ts    # Express rate limiter
│   │   │       └── error-handler.ts # Centralized error handling
│   │   ├── models/
│   │   │   ├── patient.ts           # Patient token, demographics (shared type)
│   │   │   ├── risk-assessment.ts   # Risk score, level, AI response (shared type)
│   │   │   ├── audit-log.ts         # Audit trail entry (shared type)
│   │   │   └── urine-test.ts        # Urine analysis result (shared type)
│   │   └── database/
│   │       ├── migrations/          # SQL migration files (up/down)
│   │       │   ├── 001_create_audit_logs.sql
│   │       │   ├── 002_create_risk_assessments.sql
│   │       │   ├── 003_create_patients.sql
│   │       │   └── 004_create_urine_tests.sql
│   │       └── queries/             # Prepared SQL queries
│   │           ├── audit.ts
│   │           ├── risk.ts
│   │           └── urine.ts
│   ├── tests/
│   │   ├── unit/
│   │   │   ├── pseudonymization.test.ts
│   │   │   ├── fhir-parsers.test.ts
│   │   │   └── ai-response-parser.test.ts
│   │   ├── integration/
│   │   │   ├── fhir-api.test.ts     # Mock FHIR server responses
│   │   │   ├── risk-analysis.test.ts
│   │   │   └── database.test.ts     # PostgreSQL integration tests
│   │   └── contract/
│   │       └── fhir-contract.test.ts # Pact.js FHIR contract tests
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example                 # FHIR_SERVER_URL, ANTHROPIC_API_KEY, etc.
│
├── frontend/
│   ├── src/
│   │   ├── main.tsx                 # React app entry point, SMART on FHIR launch handler
│   │   ├── App.tsx                  # Root component, OAuth2 redirect handling
│   │   ├── config/
│   │   │   ├── smart-config.ts      # SMART on FHIR client config
│   │   │   └── api.ts               # Backend API base URL, axios config
│   │   ├── components/
│   │   │   ├── RiskScore.tsx        # Color-coded risk indicator (0.0-1.0 score)
│   │   │   ├── RecommendationsList.tsx # AI recommendations with priority badges
│   │   │   ├── ContributingFactors.tsx # Bar chart of risk factors (Recharts)
│   │   │   ├── TrendGraph.tsx       # eGFR/HbA1c trends over time (Recharts)
│   │   │   ├── AlertBadge.tsx       # Unread notification count
│   │   │   ├── PatientHeader.tsx    # Patient demographics display
│   │   │   ├── LoadingSpinner.tsx   # Loading states
│   │   │   └── ErrorBoundary.tsx    # Error handling component
│   │   ├── pages/
│   │   │   ├── PatientAnalysis.tsx  # Main analysis page (single patient)
│   │   │   ├── PopulationDashboard.tsx # Batch scan results, sortable table
│   │   │   ├── AlertsDashboard.tsx  # Real-time alerts, WebSocket connection
│   │   │   └── RiskHistory.tsx      # Historical risk scores, trend analysis
│   │   ├── hooks/
│   │   │   ├── useFHIRData.ts       # React Query hook for FHIR data fetching
│   │   │   ├── useRiskAnalysis.ts   # POST /api/analyze mutation
│   │   │   ├── useAlerts.ts         # WebSocket connection, unread alerts state
│   │   │   └── useScanAllPatients.ts # Batch scan job trigger + polling
│   │   ├── services/
│   │   │   ├── smart-client.ts      # SMART on FHIR client (fhirclient.js wrapper)
│   │   │   ├── api-client.ts        # Backend API calls (axios)
│   │   │   └── websocket.ts         # Socket.io client for real-time alerts
│   │   ├── types/
│   │   │   ├── fhir.ts              # FHIR R4 resource types
│   │   │   └── api.ts               # Backend API request/response types
│   │   └── utils/
│   │       ├── format-date.ts       # Date formatting utilities
│   │       ├── risk-level-color.ts  # Risk level → color mapping
│   │       └── loinc-labels.ts      # LOINC code → human-readable labels
│   ├── tests/
│   │   ├── unit/
│   │   │   ├── RiskScore.test.tsx
│   │   │   └── format-date.test.ts
│   │   └── e2e/
│   │       ├── smart-launch.spec.ts # Playwright E2E test for SMART launch flow
│   │       └── risk-analysis.spec.ts
│   ├── public/
│   │   ├── launch.html              # SMART on FHIR launch entry point
│   │   └── index.html               # Main app HTML (Vite entry)
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts               # Vite build config, proxy to backend in dev
│   └── tailwind.config.js
│
├── infrastructure/
│   ├── docker-compose.yml           # Full stack (PostgreSQL, Redis, backend, frontend)
│   ├── docker-compose.dev.yml       # Development overrides (hot reload)
│   ├── docker-compose.kafka.yml     # Kafka + Zookeeper (Phase 2+, optional)
│   ├── Dockerfile.backend           # Multi-stage build for backend
│   ├── Dockerfile.frontend          # Multi-stage build for frontend (NGINX serves static)
│   ├── nginx/
│   │   ├── nginx.conf               # Reverse proxy config, TLS termination
│   │   └── ssl/                     # SSL certificates directory
│   ├── postgres/
│   │   └── init.sql                 # Initial database schema (migrations run on first start)
│   └── scripts/
│       ├── backup-postgres.sh       # Daily backup script (cron job)
│       ├── rotate-logs.sh           # Log rotation
│       └── deploy-on-premise.sh     # On-premise deployment automation
│
├── docs/
│   ├── technical-decision-record.md # Already created (architecture rationale)
│   ├── smart-on-fhir-technical-deep-dive.md # Already created (OAuth2 flow details)
│   ├── deployment-guide.md          # To be created (hospital IT instructions)
│   ├── api-documentation.md         # To be created (backend API reference)
│   └── fhir-integration-guide.md    # To be created (FHIR resource mapping)
│
├── .github/
│   └── workflows/
│       ├── ci.yml                   # Run tests on PR, build Docker images
│       └── deploy.yml               # Deploy to staging/production (EU cloud)
│
├── package.json                     # Root package.json (workspace config for monorepo)
├── docker-compose.yml               # Symlink to infrastructure/docker-compose.yml
├── .env.example                     # Environment variables template
├── .gitignore
└── README.md
```

**Key Structure Decisions:**

1. **Shared TypeScript Types**: `backend/src/models/` contains shared types imported by frontend (via `@/types` alias). This ensures frontend and backend use identical data structures for Patient, RiskAssessment, AuditLog.

2. **FHIR Client Isolation**: All FHIR API logic in `backend/src/fhir/` directory. Makes it easy to swap FHIR client libraries or mock for testing.

3. **AI Model Abstraction**: Separate client files for Claude, OpenAI, LLaMA in `backend/src/ai/`. Strategy pattern allows runtime selection based on deployment (cloud vs on-premise).

4. **Progressive Containerization**:
   - `docker-compose.yml`: Core services (PostgreSQL, Redis, backend, frontend)
   - `docker-compose.kafka.yml`: Extend with Kafka when implementing Task 105 (US5 - Urine Analysis)
   - Allows hospitals to start simple (MVP) and add services incrementally

5. **Test Structure**: Unit tests colocated with code, integration tests in `tests/integration/`, E2E tests in `frontend/tests/e2e/`. Contract tests in `backend/tests/contract/` validate FHIR server assumptions.

6. **Infrastructure Separation**: All Docker, NGINX, deployment scripts in `infrastructure/` directory. Keeps root clean, makes it clear what's for deployment vs development.

## Complexity Tracking

> **No constitution violations detected.** This section documents inherent complexity required by healthcare domain.

| **Complexity Area** | **Why Needed** | **Simpler Alternative Rejected Because** |
|---------------------|----------------|------------------------------------------|
| **Event-Driven Architecture (Redis Queue, Background Workers)** | GDPR requires automatic risk recalculation when new clinical data enters EHR (Article 9(2)(h) - timely healthcare provision). Cannot block doctor's EHR workflow with synchronous AI calls. | **Synchronous processing**: Would cause 2-5 second delays in EHR when saving new lab results (unacceptable UX). **Polling only**: Would miss real-time alerts for critical values (patient safety issue). |
| **Pseudonymization Service (SHA-256 Hashing)** | GDPR Article 32 requires pseudonymization before processing health data with external AI APIs (Anthropic, OpenAI are third-party processors). | **No pseudonymization**: Violates GDPR, illegal to send identifiable patient data to US-based AI APIs. **Anonymization**: Cannot re-identify results for doctor's view. **Encryption only**: GDPR specifically requires pseudonymization for AI processing. |
| **Multi-Database Strategy (PostgreSQL + Redis + Kafka)** | **PostgreSQL**: ACID compliance required for audit logs (legal evidence). **Redis**: Sub-second cache for FHIR data (doctors won't wait 2s per page load). **Kafka**: Ordered event stream for urine test data (medical device requirement). | **PostgreSQL only**: Too slow for caching (50-100ms query latency vs 1-5ms Redis). **Redis only**: No ACID guarantees, audit logs could be lost on crash (GDPR violation). **Single database**: No technology meets all requirements (ACID + low-latency cache + event streaming). |
| **SMART on FHIR OAuth2 Flow (Client-Side Only, No SSR)** | Epic, Cerner, national EHR systems require SMART on FHIR standard for third-party app integration. OAuth2 redirect flow happens in iframe inside EHR patient chart. SSR frameworks (Next.js) break this flow due to server-side rendering incompatibility with iframe sandbox, OAuth2 cookies, CSP headers. | **Next.js SSR**: Documented in `docs/smart-on-fhir-technical-deep-dive.md` - breaks OAuth2 redirect flow, CORS violations, CSP blocks dynamic chunks, HttpOnly cookies inaccessible on server. **Custom SSR**: Would require maintaining parallel code paths for server/client, negates SSR benefits. **No EHR integration**: Entire product value proposition lost. |
| **Three Separate FHIR Fetchers (Patient, Observation, Condition)** | FHIR R4 specification requires separate API calls per resource type. Cannot fetch Patient + Observations in single request. EHR systems enforce this for performance (prevent overfetching). | **Single FHIR query**: Not supported by FHIR R4 standard. Epic, Cerner APIs would reject request. **GraphQL wrapper**: Would require custom middleware on hospital EHR (impossible to deploy at 500 hospitals). |
| **Audit Trail with 10-Year Retention** | EU medical record retention laws (varies by country: 10 years Germany, 20 years France for specific records). GDPR Article 30 requires processing logs for compliance audits. | **Shorter retention**: Illegal in EU. Would face fines, cannot operate. **No audit logs**: GDPR Article 30 violation, medical malpractice liability exposure. |
| **Country-Specific Integration Modules (gematik TI, DMP, NPÖ)** | Each EU country has national health IT infrastructure with mandatory authentication and data access patterns. Germany requires gematik TI connector for any clinical system accessing patient data. | **Generic FHIR only**: National systems (Sweden NPÖ, France DMP) have country-specific extensions beyond base FHIR R4. Authentication requirements (eHBA cards in Germany, BankID in Sweden) cannot be abstracted. **Single country only**: Limits addressable market to <20,000 doctors (business not viable). |

**Conclusion**: All architectural complexity is driven by external requirements (GDPR legal mandates, FHIR standard limitations, EHR vendor constraints, national healthcare regulations). No simpler alternatives exist that meet legal and integration requirements.

---

## Dependencies and Timeline

### Critical Path Dependencies (Based on tasks.md)

**Phase 1: Setup (Week 1) - Tasks T001-T008**
- No external dependencies, can start immediately
- Establishes foundational structure

**Phase 2: Foundational (Weeks 2-3) - Tasks T009-T023**
- Depends on: Phase 1 completion
- Blocking for: All user story phases (US1-US7)
- Critical: PostgreSQL setup (T009), SMART on FHIR client (T010-T011), pseudonymization (T012-T013)

**Phase 3: US1 - AI Risk Assessment (Weeks 4-6) - Tasks T024-T039**
- Depends on: Phase 2 completion
- First user-visible feature (MVP core)
- Blocking for: US2 (Population Scanning uses same AI engine)

**Phase 4: US2 - Population Scanning (Week 7) - Tasks T040-T047**
- Depends on: US1 (reuses risk analysis service)
- Independent from: US3-US7 (can be developed in parallel)

**Phase 5: US3 - Automatic Risk Recalculation (Weeks 8-10) - Tasks T048-T062**
- Depends on: US1 (requires risk analysis engine), Phase 2 (needs Redis for queue)
- Independent from: US4-US7
- Critical for: Production deployment (core value proposition)

**Phase 6: US4 - CKD Three-Phase Protocol (Weeks 11-13) - Tasks T063-T083**
- Depends on: US1 (risk analysis), US3 (automatic recalculation)
- Can overlap with: US5-US7 (different code modules)

**Phase 7: US5 - Urine Analysis Integration (Weeks 14-16) - Tasks T084-T109**
- Depends on: Phase 2 (PostgreSQL), US4 (CKD protocol for integration)
- New dependency: Apache Kafka setup (T105)
- Can overlap with: US6-US7

**Phase 8: US6 - Country-Specific Integrations (Weeks 17-19) - Tasks T110-T131**
- Depends on: US1 (core FHIR integration pattern established)
- Independent from: US5, US7 (different integration points)

**Phase 9: US7 - Explainable AI (Weeks 20-21) - Tasks T132-T143**
- Depends on: US1 (risk analysis engine)
- Independent from: US4-US6

**Phase 10: Polish & Deployment (Weeks 22-24) - Tasks T144-T155**
- Depends on: All user stories complete
- Final integration testing, production deployment

### MVP Scope (Recommended for First Release)

**MVP = Phase 1 + Phase 2 + Phase 3 (US1) + Phase 4 (US2)**
- **Timeline**: 8-10 weeks (56 tasks: T001-T056)
- **Features**:
  - SMART on FHIR integration
  - Single patient AI risk analysis (US1 - diabetes complications, <2s response time)
  - Batch population scanning (US2 - "Scan All Patients" button, progress tracking)
  - Basic audit logging (10-year retention)
  - Docker Compose deployment
- **Success Criteria**:
  - 5-10 pilot doctors can analyze individual patients (US1) with <2 second response time
  - Doctors can scan their entire patient panel (US2) and receive prioritized high-risk list
  - Zero GDPR violations
  - 70%+ positive feedback from pilot users

**Rationale**: Both US1 and US2 are marked Priority P1 in spec.md and labeled 🎯 MVP. US2 (Population Scanning) is essential for pilot doctors to identify high-risk patients across their entire panel, not just during individual consultations.

**Post-MVP Phases**:
- **Release 2** (Weeks 11-26): Add US3 (Automatic Recalculation) + US4 (CKD Protocol) + US5 (Urine Analysis)
- **Release 3** (Weeks 27-39): Add US6 (Country Integrations) + US7 (Explainable AI)
- **Release 4** (Weeks 40-42): Production hardening and deployment (Phase 10 - Polish)

---

## Risk Mitigation Strategies

### Technical Risks

**Risk 1: FHIR Server API Rate Limiting**
- **Impact**: Could slow down population scanning (US2), automatic recalculation (US3)
- **Mitigation**:
  - Implement exponential backoff in `backend/src/fhir/client.ts`
  - Cache FHIR responses in Redis (5-minute TTL) to reduce API calls
  - Batch FHIR requests where possible (fetch 10 patients in parallel, not sequentially)

**Risk 2: AI API Costs Exceed Budget**
- **Impact**: Anthropic/OpenAI API costs could be $0.01-0.05 per analysis → $500-2500/month for 50,000 analyses
- **Mitigation**:
  - Implement caching: If patient data unchanged in last 1 hour, return cached risk score (skip AI call)
  - Negotiate enterprise pricing with Anthropic/OpenAI
  - Develop local LLaMA 3.1 fallback for cost-sensitive deployments (T037-T039)

**Risk 3: WebSocket Connection Stability (US3)**
- **Impact**: Real-time alerts may fail to deliver if WebSocket drops
- **Mitigation**:
  - Implement automatic reconnection in `frontend/src/services/websocket.ts`
  - Fallback to polling if WebSocket unavailable (check `/api/alerts` every 30 seconds)
  - Store undelivered alerts in Redis, replay on reconnect

**Risk 4: PostgreSQL Performance Degradation (Audit Logs)**
- **Impact**: 10-year retention → billions of audit log rows → slow queries
- **Mitigation**:
  - Partition audit_logs table by month (PostgreSQL 14 native partitioning)
  - Archive logs older than 2 years to cold storage (AWS S3 Glacier)
  - Use TimescaleDB extension for time-series optimization

### Deployment Risks

**Risk 5: Hospital IT Environment Variability**
- **Impact**: Docker Compose may fail on RHEL vs Ubuntu, firewall blocks Redis ports
- **Mitigation**:
  - Test on 3 OS variants: Ubuntu 22.04, RHEL 8, Windows Server 2019 (Docker Desktop)
  - Provide `infrastructure/scripts/deploy-on-premise.sh` with environment checks
  - Document common firewall rules in `docs/deployment-guide.md`

**Risk 6: EHR Vendor Approval Delays**
- **Impact**: Epic/Cerner may take 3-6 months to approve SMART on FHIR app listing
- **Mitigation**:
  - Start approval process in parallel with development (Week 1)
  - Use Epic Sandbox environment for testing during approval
  - Focus MVP on national EHR systems (Sweden NPÖ, Estonia eHealth) - faster approval

---

## Success Metrics

### Technical Metrics

| **Metric** | **Target (MVP)** | **Target (Production)** | **How Measured** |
|------------|------------------|-------------------------|------------------|
| **AI Analysis Response Time** | <2 seconds (p95) | <1.5 seconds (p95) | Backend API `/api/analyze` endpoint latency |
| **FHIR Data Fetch Time** | <500ms (p95) | <300ms (p95) | `backend/src/fhir/client.ts` instrumentation |
| **Automatic Recalculation Latency** | <60 seconds | <30 seconds | Time from FHIR webhook received to risk score updated |
| **WebSocket Notification Delivery** | <2 seconds | <1 second | Socket.io client ack timestamp - server send timestamp |
| **Background Job Processing Rate** | 10 jobs/minute | 100 jobs/minute | Bull queue metrics (jobs processed per minute) |
| **Test Coverage** | >70% | >85% | Vitest + Jest coverage reports |
| **Uptime** | >95% | >99.5% | Health check endpoint monitoring |
| **GDPR Audit Pass Rate** | 100% | 100% | Third-party GDPR audit (annual) |

### User Metrics

| **Metric** | **Target (MVP)** | **Target (Production)** | **How Measured** |
|------------|------------------|-------------------------|------------------|
| **Pilot Doctor Adoption** | 5-10 doctors | 500+ doctors | Number of active OAuth2 sessions per month |
| **Patients Analyzed** | 500-1000 patients | 50,000+ patients | `risk_assessments` table row count |
| **Daily Active Analyses** | 10-20 analyses/day | 500+ analyses/day | Audit log entries with `action='AI_RISK_ANALYSIS'` |
| **Doctor Satisfaction** | >70% positive feedback | >85% positive feedback | Post-pilot survey (5-point Likert scale) |
| **Alert Acknowledgment Rate** | >60% | >80% | Alerts acknowledged / total alerts sent |

---

## Next Steps

1. **Review and approve this plan.md** with stakeholders (technical team, product owner, compliance officer)
2. **Begin Phase 1: Setup** (Tasks T001-T008 in tasks.md) - create monorepo structure, initialize Git, set up CI/CD
3. **Parallel workstream**: Start EHR vendor approval process (Epic Sandbox registration, Cerner app certification)
4. **Week 2-3**: Complete Phase 2 (Foundational tasks) - Docker setup, PostgreSQL, SMART on FHIR client, pseudonymization
5. **Week 4-7**: Implement US1 (AI Risk Assessment) - first user-visible feature
6. **Week 8-10**: Implement US2 (Population Scanning) - "Scan All Patients" functionality
7. **Week 10**: MVP demo with 5-10 pilot doctors, gather feedback, iterate

**Key Milestone**: End of Week 10 - **MVP (US1 + US2) deployed to pilot hospital, 5-10 doctors successfully analyzing individual patients AND scanning their entire patient panel**

---

*This plan aligns with the 157 tasks defined in `tasks.md` (including T156 for GDPR data retention and T157 for air-gapped deployment) and the 7 user stories in `spec.md`. For detailed task breakdown, see `tasks.md`. For architectural rationale, see `docs/technical-decision-record.md`.*
