---
description: "Implementation tasks for Healthcare AI Clinical Data Analyzer"
---

# Tasks: Healthcare AI Clinical Data Analyzer

**Total Tasks**: 157 tasks across 10 phases
**Input**: Product Requirements Document from `.taskmaster/docs/prd.txt`
**Prerequisites**: PRD (complete), tasks.json (reference), architecture design

**Tests**: Tests are OPTIONAL - only included if explicitly requested in feature specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app structure**: `backend/src/`, `frontend/src/`
- **Database**: `database/migrations/`, `database/seeds/`
- **Documentation**: `docs/`
- Paths assume monorepo structure with separate backend/frontend

---

## 📋 Implementation Workflow (Follow for EVERY Task)

**Before starting ANY task, follow this workflow:**

### 1. Check Current Progress
- Check `/web/.specify/memory/tasks.md` file to find the last task implemented
- Identify which task you should work on next

### 2. Implementation
- Write the code for the implementation of the task
- Follow the file path specified in the task description
- **Use Tailwind CSS** for all CSS-related code (no custom CSS classes unless absolutely necessary)

### 3. Testing
- Write comprehensive test code for the implemented functionality
- Tests should cover:
  - Unit tests for individual functions/components
  - Integration tests where applicable
  - Edge cases and error handling

### 4. Test Execution
- Run the tests
- Analyze any errors that occur
- Fix all errors until tests pass

### 5. Documentation (REQUIRED - Create 3 Log Files)

All log files must be named with capital **T** + three-digit task number (e.g., **T001**, **T024**, **T156**)

**a) Implementation Task Log**
- **Location**: `/web/log_files/TXXX_TaskName_Log.md`
- **Example**: `/web/log_files/T024_PatientFHIRFetcher_Log.md`
- **Content**: Implementation details, decisions made, code structure

**b) Test Log**
- **Location**: `/web/log_tests/TXXX_TaskName_TestLog.md`
- **Example**: `/web/log_tests/T024_PatientFHIRFetcher_TestLog.md`
- **Content**: Test results, coverage, issues encountered and resolved

**c) Learn/Guide File (Didactic Log)**
- **Location**: `/web/log_learn/TXXX_TaskName_Guide.md`
- **Example**: `/web/log_learn/T024_PatientFHIRFetcher_Guide.md`
- **Content**: Explanation of what was developed, why this approach was taken, and how it works (educational format)

### 6. Important Reminders

⚠️ **Docker Environment**: This setup is containerized in Docker. There is NO need to install PostgreSQL or Redis locally - they run in containers via docker-compose.yml

⚠️ **Tailwind CSS**: Use Tailwind utility classes for all styling. Do not create custom CSS files unless absolutely necessary.

⚠️ **Update tasks.md**: After completing implementation, tests, and all log files:
- Update the `/web/.specify/memory/tasks.md` file with implementation details
- Cross off the completed task by changing `- [ ]` to `- [x]`

### 7. Task Completion Checklist

Before moving to the next task, verify:
- [x] Code implemented in correct file path
- [x] Tests written and passing
- [x] Implementation log created (TXXX_TaskName_Log.md)
- [x] Test log created (TXXX_TaskName_TestLog.md)
- [x] Learn/guide file created (TXXX_TaskName_Guide.md)
- [x] tasks.md updated and task marked as complete

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create monorepo project structure with backend/, frontend/, infrastructure/, docs/ directories
- [ ] T002 Initialize Node.js/TypeScript backend with Express.js in backend/package.json
- [ ] T003 [P] Initialize React/TypeScript frontend with Vite in frontend/package.json
- [ ] T004 [P] Configure ESLint and Prettier for both backend and frontend
- [ ] T005 Create Docker configuration in docker-compose.yml for local development
- [ ] T006 [P] Set up environment variable management with .env.example files
- [ ] T007 Initialize Git repository with .gitignore for Node.js and environment files
- [ ] T008 [P] Configure CI/CD pipeline in .github/workflows/ci.yml for automated testing

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T009 Set up PostgreSQL database with Docker in docker-compose.yml
- [ ] T010 [P] Create database schema for audit_logs table in database/migrations/001_audit_logs.sql
- [ ] T011 [P] Create database schema for risk_assessments table in database/migrations/002_risk_assessments.sql
- [ ] T012 [P] Implement database connection pool in backend/src/database/connection.ts
- [ ] T013 Install HAPI FHIR client library in backend/package.json
- [ ] T014 [P] Implement FHIR connection configuration in backend/src/config/fhir-config.ts
- [ ] T015 Implement pseudonymization service in backend/src/services/pseudonymization-service.ts
- [ ] T016 [P] Implement SHA-256 patient identifier hashing in backend/src/utils/crypto.ts
- [ ] T017 [P] Implement secret key management with AWS Secrets Manager or HashiCorp Vault in backend/src/config/secrets.ts
- [ ] T018 Implement audit logging service in backend/src/services/audit-service.ts
- [ ] T019 [P] Implement OAuth2 authentication middleware in backend/src/middleware/auth.ts
- [ ] T020 [P] Configure API Gateway with Kong or AWS API Gateway for rate limiting
- [ ] T021 Set up error handling middleware in backend/src/middleware/error-handler.ts
- [ ] T022 [P] Configure CORS and security headers in backend/src/middleware/security.ts
- [ ] T023 Implement environment configuration loader in backend/src/config/env.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - AI Risk Assessment During Patient Consultation (Priority: P1) 🎯 MVP

**Goal**: Enable doctors to request AI-powered risk analysis for individual patients during consultations

**Independent Test**: Doctor clicks "AI Risk Analysis" button in EHR, receives risk assessment in <2 seconds with color-coded risk level, contributing factors, and recommendations

### Implementation for User Story 1

- [ ] T024 [P] [US1] Create Patient FHIR resource fetcher in backend/src/fhir/patient-fetcher.ts
- [ ] T025 [P] [US1] Create Observation FHIR resource fetcher for lab results in backend/src/fhir/observation-fetcher.ts
- [ ] T026 [P] [US1] Create Condition FHIR resource fetcher for diagnoses in backend/src/fhir/condition-fetcher.ts
- [ ] T027 [P] [US1] Create MedicationRequest FHIR resource fetcher in backend/src/fhir/medication-fetcher.ts
- [ ] T028 [US1] Implement FHIR data aggregator service in backend/src/services/fhir-aggregator.ts (depends on T024-T027)
- [ ] T029 [P] [US1] Implement AI prompt template for diabetes risk in backend/src/ai/prompts/diabetes-risk.ts (The prompt MUST be designed to gracefully handle null or undefined values for key inputs like HbA1c, eGFR, blood pressure. Instruct the AI to note missing critical data in its analysis and recommend ordering the missing tests)
- [ ] T030 [P] [US1] Implement Claude API client in backend/src/ai/claude-client.ts
- [ ] T031 [P] [US1] Implement OpenAI API client as fallback in backend/src/ai/openai-client.ts
- [ ] T032 [US1] Implement AI processing service in backend/src/services/ai-service.ts (depends on T029-T031). Implement primary/fallback logic: The service MUST try the primary model (Claude) first. On API failure (5xx error, timeout >10s), automatically retry with fallback model (GPT-4). If both models fail, return structured error to user with clear message
- [ ] T033 [US1] Implement risk analysis API endpoint POST /api/analyze in backend/src/routes/analysis.ts
- [ ] T034 [US1] Implement insights retrieval endpoint GET /api/insights/:patientToken in backend/src/routes/insights.ts
- [ ] T035 [P] [US1] Create React component for Risk Analysis Button in frontend/src/components/RiskAnalysisButton.tsx
- [ ] T036 [P] [US1] Create React component for Risk Assessment Display in frontend/src/components/RiskAssessment.tsx
- [ ] T037 [P] [US1] Create React component for Color-Coded Risk Indicator in frontend/src/components/RiskIndicator.tsx
- [ ] T038 [US1] Implement API client for risk analysis in frontend/src/api/analysis-client.ts
- [ ] T039 [US1] Integrate SMART on FHIR app launch in frontend/src/fhir/smart-launch.ts
- [ ] T040 [US1] Add validation for risk assessment results in backend/src/validators/risk-validator.ts. Check the inputs of the analysis. If critical data (e.g., eGFR, HbA1c) was missing, the validator MUST add warning flag ("⚠️ eGFR not available - limited analysis") and specific recommendation ("Order eGFR test to improve risk assessment accuracy") to the final API response
- [ ] T041 [US1] Add error handling for FHIR API failures in backend/src/middleware/fhir-error-handler.ts
- [ ] T042 [US1] Add audit logging for risk analysis requests in backend/src/routes/analysis.ts

**Checkpoint**: At this point, User Story 1 should be fully functional - doctors can request risk analysis and see results

---

## Phase 4: User Story 2 - Manual Patient Population Scanning (Priority: P1) 🎯 MVP

**Goal**: Enable doctors to trigger batch risk analysis across their entire patient panel with progress tracking

**Independent Test**: Doctor clicks "Scan All My Patients" button, sees real-time progress indicator, receives prioritized list of high-risk patients sorted by risk score

### Implementation for User Story 2

- [ ] T043 [P] [US2] Create database schema for scan_jobs table in database/migrations/003_scan_jobs.sql
- [ ] T044 [P] [US2] Implement background job queue with Bull or BullMQ in backend/src/queue/job-queue.ts
- [ ] T045 [US2] Implement batch scan service in backend/src/services/batch-scan-service.ts
- [ ] T046 [US2] Implement scan job processor in backend/src/workers/scan-worker.ts
- [ ] T047 [US2] Implement batch scan API endpoint POST /api/scan-all-patients in backend/src/routes/scan.ts
- [ ] T048 [US2] Implement scan status endpoint GET /api/scan-status/:jobId in backend/src/routes/scan.ts
- [ ] T049 [P] [US2] Create React component for Population Health Dashboard in frontend/src/pages/PopulationDashboard.tsx
- [ ] T050 [P] [US2] Create React component for Scan All Button in frontend/src/components/ScanAllButton.tsx
- [ ] T051 [P] [US2] Create React component for Progress Indicator in frontend/src/components/ScanProgress.tsx
- [ ] T052 [P] [US2] Create React component for High-Risk Patient List in frontend/src/components/HighRiskPatientList.tsx
- [ ] T053 [US2] Implement API client for batch scanning in frontend/src/api/scan-client.ts
- [ ] T054 [US2] Implement real-time progress updates with polling in frontend/src/hooks/useScanProgress.ts
- [ ] T055 [US2] Add sorting and filtering for patient risk list in frontend/src/components/HighRiskPatientList.tsx
- [ ] T056 [US2] Add audit logging for batch scan requests in backend/src/routes/scan.ts

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - MVP is complete

---

## Phase 5: User Story 3 - Automatic Risk Recalculation (Priority: P2)

**Goal**: Automatically recalculate patient risk scores when new clinical data enters the EHR database, with real-time notifications to doctors

**Independent Test**: When new lab result (e.g., eGFR < 45) enters EHR, system automatically recalculates risk, sends WebSocket notification to doctor within 60 seconds

### Implementation for User Story 3

- [ ] T057 [P] [US3] Set up Redis for job queue in docker-compose.yml
- [ ] T058 [P] [US3] Implement database change detection polling service in backend/src/services/change-detector.ts
- [ ] T059 [P] [US3] Implement FHIR webhook subscription in backend/src/fhir/webhook-subscriber.ts
- [ ] T060 [US3] Implement event processor for new Observations in backend/src/workers/observation-event-worker.ts
- [ ] T061 [P] [US3] Implement event processor for new Conditions in backend/src/workers/condition-event-worker.ts
- [ ] T062 [P] [US3] Implement event processor for new MedicationRequests in backend/src/workers/medication-event-worker.ts
- [ ] T063 [US3] Implement automatic risk recalculation service in backend/src/services/auto-recalc-service.ts (depends on T060-T062)
- [ ] T064 [US3] Implement webhook endpoint POST /api/webhook/fhir-changes in backend/src/routes/webhooks.ts
- [ ] T065 [P] [US3] Set up WebSocket server with Socket.io in backend/src/websocket/server.ts
- [ ] T066 [US3] Implement notification service in backend/src/services/notification-service.ts
- [ ] T067 [US3] Implement alerts API endpoint GET /api/alerts in backend/src/routes/alerts.ts
- [ ] T068 [US3] Implement alert acknowledgment endpoint POST /api/alerts/:alertId/acknowledge in backend/src/routes/alerts.ts
- [ ] T069 [P] [US3] Create React component for Smart Alerts Dashboard in frontend/src/components/AlertsDashboard.tsx
- [ ] T070 [P] [US3] Create React component for Alert Badge in frontend/src/components/AlertBadge.tsx
- [ ] T071 [P] [US3] Create React component for Risk Change Indicator in frontend/src/components/RiskChangeIndicator.tsx
- [ ] T072 [US3] Implement WebSocket client for real-time updates in frontend/src/websocket/client.ts
- [ ] T073 [US3] Implement API client for alerts in frontend/src/api/alerts-client.ts
- [ ] T074 [US3] Add audit logging for automatic recalculations in backend/src/workers/observation-event-worker.ts

**Checkpoint**: Automatic risk recalculation should work independently - new data triggers recalculation and notifications

---

## Phase 6: User Story 4 - CKD Three-Phase Protocol (Priority: P2)

**Goal**: Implement comprehensive chronic kidney disease patient identification system with 3-tier risk stratification, active monitoring, and diagnostic confirmation

**Independent Test**: System identifies Tier 3 patients (diabetes + hypertension), orders baseline eGFR/uACR tests, flags abnormal results (eGFR < 60) for 3-month confirmation, calculates CKD stage

### Implementation for User Story 4

- [ ] T075 [P] [US4] Create database schema for ckd_risk_tiers table in database/migrations/004_ckd_risk_tiers.sql
- [ ] T076 [P] [US4] Create database schema for ckd_monitoring table in database/migrations/005_ckd_monitoring.sql
- [ ] T077 [P] [US4] Create database schema for ckd_test_orders table in database/migrations/006_ckd_test_orders.sql
- [ ] T078 [US4] Implement three-tier risk stratification algorithm in backend/src/services/ckd-triage-service.ts
- [ ] T079 [US4] Implement Tier 3 detection using ICD-10 codes in backend/src/fhir/tier3-detector.ts
- [ ] T080 [US4] Implement Tier 2 detection using risk factors in backend/src/fhir/tier2-detector.ts
- [ ] T081 [US4] Implement active monitoring protocol service in backend/src/services/ckd-monitoring-service.ts
- [ ] T082 [US4] Implement baseline test ordering (eGFR + uACR) in backend/src/services/test-order-service.ts
- [ ] T083 [US4] Implement abnormal result detection (eGFR < 60, uACR > 30) in backend/src/services/abnormal-result-detector.ts
- [ ] T084 [US4] Implement 3-month confirmation tracker in backend/src/services/confirmation-tracker.ts
- [ ] T085 [US4] Implement CKD staging calculator (KDIGO) in backend/src/utils/ckd-staging.ts
- [ ] T086 [US4] Implement nephrology referral trigger in backend/src/services/referral-service.ts
- [ ] T087 [P] [US4] Create CKD triage API endpoint POST /api/ckd/triage in backend/src/routes/ckd.ts
- [ ] T088 [P] [US4] Create CKD monitoring status endpoint GET /api/ckd/monitoring/:patientToken in backend/src/routes/ckd.ts
- [ ] T089 [P] [US4] Create React component for CKD Risk Tier Display in frontend/src/components/CKDRiskTier.tsx
- [ ] T090 [P] [US4] Create React component for CKD Stage Calculator in frontend/src/components/CKDStageCalculator.tsx
- [ ] T091 [P] [US4] Create React component for Confirmation Tracker in frontend/src/components/ConfirmationTracker.tsx
- [ ] T092 [US4] Implement API client for CKD services in frontend/src/api/ckd-client.ts
- [ ] T093 [US4] Add audit logging for CKD diagnostic workflow in backend/src/routes/ckd.ts

**Checkpoint**: CKD three-phase protocol should work independently - patient triage, monitoring, and diagnostic confirmation

---

## Phase 7: User Story 5 - Urine Analysis Integration (Priority: P2)

**Goal**: Integrate with Healthy.io Minuteful Kidney smartphone-based uACR testing for real-time and batch urine test data ingestion

**Independent Test**: When patient submits uACR test via Minuteful Kidney app, data ingested within 60 seconds, stored in database, abnormal result (uACR > 30) triggers alert to doctor

### Implementation for User Story 5

- [ ] T094 [P] [US5] Create database schema for urine_tests table in database/migrations/007_urine_tests.sql
- [ ] T095 [P] [US5] Implement Healthy.io Minuteful Kidney API client in backend/src/integrations/minuteful-client.ts
- [ ] T096 [US5] Implement FHIR Observation parser for uACR (LOINC 9318-7) in backend/src/fhir/uacr-parser.ts
- [ ] T097 [P] [US5] Implement FHIR Observation parser for urine albumin (LOINC 14958-3) in backend/src/fhir/albumin-parser.ts
- [ ] T098 [P] [US5] Implement FHIR Observation parser for urine creatinine (LOINC 2161-8) in backend/src/fhir/creatinine-parser.ts
- [ ] T099 [US5] Implement real-time urine test ingestion pipeline in backend/src/services/urine-ingestion-service.ts
- [ ] T100 [US5] Implement batch NDJSON urine test import in backend/src/services/urine-batch-import.ts
- [ ] T101 [US5] Implement uACR data validation (range 0-5000 mg/g) in backend/src/validators/uacr-validator.ts
- [ ] T102 [US5] Implement SMART on FHIR authorization for urine data in backend/src/middleware/smart-fhir-auth.ts
- [ ] T103 [US5] Implement urine test notification service in backend/src/services/urine-notification-service.ts
- [ ] T104 [US5] Implement uACR trend analysis in backend/src/services/uacr-trend-service.ts
- [ ] T105 [P] [US5] Set up Apache Kafka topics (urine-test-raw, urine-test-validated) in docker-compose.yml
- [ ] T106 [P] [US5] Implement Kafka producer for urine tests in backend/src/kafka/urine-producer.ts
- [ ] T107 [P] [US5] Implement Kafka consumer for validation in backend/src/kafka/urine-consumer.ts
- [ ] T108 [US5] Implement offline sync mechanism for mobile app in backend/src/services/offline-sync-service.ts
- [ ] T109 [US5] Implement webhook endpoint POST /api/webhook/minuteful in backend/src/routes/minuteful.ts
- [ ] T110 [P] [US5] Create urine test API endpoints in backend/src/routes/urine-tests.ts
- [ ] T111 [P] [US5] Create React component for uACR Trend Graph in frontend/src/components/UACRTrendGraph.tsx
- [ ] T112 [P] [US5] Create React component for Urine Test History in frontend/src/components/UrineTestHistory.tsx
- [ ] T113 [US5] Implement API client for urine tests in frontend/src/api/urine-client.ts
- [ ] T114 [US5] Add audit logging for urine test data access in backend/src/routes/urine-tests.ts

**Checkpoint**: Urine analysis integration should work independently - real-time and batch ingestion, validation, notifications

---

## Phase 8: User Story 6 - Country-Specific Integrations (Priority: P3)

**Goal**: Enable deployment in Germany, France, Sweden, and Estonia with country-specific compliance and authentication

**Independent Test**: System successfully authenticates with Germany's Telematikinfrastruktur using eHBA, fetches patient data, maintains gematik compliance

### Implementation for User Story 6

- [ ] T115 [P] [US6] Research Germany Telematikinfrastruktur (TI) requirements and gematik certification process
- [ ] T116 [P] [US6] Implement eHBA authentication for Germany in backend/src/integrations/germany/ehba-auth.ts
- [ ] T117 [P] [US6] Implement gematik connector integration in backend/src/integrations/germany/gematik-connector.ts
- [ ] T118 [P] [US6] Research France DMP API and SecNumCloud hosting requirements
- [ ] T119 [P] [US6] Implement France DMP API client in backend/src/integrations/france/dmp-client.ts
- [ ] T120 [P] [US6] Implement ASIP Santé compliance module in backend/src/integrations/france/asip-compliance.ts
- [ ] T121 [P] [US6] Research Sweden NPÖ/Inera API and Patient Data Act compliance
- [ ] T122 [P] [US6] Implement Sweden NPÖ API client in backend/src/integrations/sweden/npo-client.ts
- [ ] T123 [P] [US6] Research Estonia X-Road integration and eID authentication
- [ ] T124 [P] [US6] Implement Estonia X-Road client in backend/src/integrations/estonia/xroad-client.ts
- [ ] T125 [P] [US6] Implement Estonia eID authentication in backend/src/integrations/estonia/eid-auth.ts
- [ ] T126 [US6] Create country detection and routing service in backend/src/services/country-router.ts
- [ ] T127 [P] [US6] Create country-specific configuration files in backend/src/config/countries/
- [ ] T128 [US6] Add country selection in frontend settings in frontend/src/components/CountrySelector.tsx

**Checkpoint**: Country-specific integrations should work independently for each country

---

## Phase 9: User Story 7 - Explainable AI & Clinical Validation (Priority: P3)

**Goal**: Provide detailed explanations for AI recommendations and conduct clinical validation study for CE marking

**Independent Test**: AI recommendation displays step-by-step reasoning with references to clinical guidelines, generates SHAP values for model interpretability

### Implementation for User Story 7

- [ ] T129 [P] [US7] Implement AI explanation generator in backend/src/ai/explainer.ts
- [ ] T130 [P] [US7] Implement SHAP value calculator for model interpretability in backend/src/ai/shap-calculator.ts
- [ ] T131 [P] [US7] Create medical guideline reference database in database/migrations/008_clinical_guidelines.sql
- [ ] T132 [US7] Implement guideline citation service in backend/src/services/guideline-service.ts
- [ ] T133 [P] [US7] Create React component for AI Explanation Display in frontend/src/components/AIExplanation.tsx
- [ ] T134 [P] [US7] Create React component for Clinical Guideline References in frontend/src/components/GuidelineReferences.tsx
- [ ] T135 [P] [US7] Design clinical validation study protocol in docs/clinical-validation-protocol.md
- [ ] T136 [P] [US7] Create data collection forms for validation study in docs/validation-data-forms.md
- [ ] T137 [P] [US7] Implement local LLaMA 3.1 model deployment in backend/src/ai/llama-client.ts
- [ ] T138 [US7] Create model comparison service in backend/src/services/model-comparison-service.ts
- [ ] T139 [P] [US7] Document CE marking requirements in docs/ce-marking-requirements.md
- [ ] T140 [US7] Generate technical documentation for Class I medical device in docs/medical-device-documentation.md

**Checkpoint**: Explainable AI and clinical validation features complete

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T141 [P] Add comprehensive API documentation with OpenAPI/Swagger in docs/api-documentation.yml
- [ ] T142 [P] Create user manual for primary care physicians in docs/user-manual.md
- [ ] T143 [P] Create deployment guide for hospital IT teams in docs/deployment-guide.md
- [ ] T144 [P] Implement performance monitoring with New Relic or DataDog in backend/src/monitoring/performance.ts
- [ ] T145 [P] Implement error tracking with Sentry in backend/src/monitoring/error-tracking.ts
- [ ] T146 Code cleanup and refactoring across all services
- [ ] T147 [P] Security hardening: penetration testing and vulnerability scanning
- [ ] T148 [P] GDPR compliance audit: verify data minimization, retention policies, right to erasure
- [ ] T149 [P] Accessibility audit: ensure WCAG 2.1 AA compliance for frontend
- [ ] T150 [P] Performance optimization: API response times <2 seconds for individual queries
- [ ] T151 Create DPIA (Data Protection Impact Assessment) documentation in docs/dpia.md
- [ ] T152 [P] Add rate limiting and DDoS protection configuration
- [ ] T153 [P] Set up automated backups for PostgreSQL database
- [ ] T154 Final integration testing across all user stories
- [ ] T155 Prepare MVP deployment to pilot hospital in Sweden
- [ ] T156 [P] [FR-019] Implement data retention policy worker in backend/src/workers/retention-policy-worker.ts. Create scheduled background job (BullMQ repeatable job or cron) that queries risk_assessments and patients tables for records older than 72-hour (configurable) retention period. Implement soft delete or hard delete logic. Ensure job logs actions to audit trail (e.g., "Deleted data for patient token XXXXX"). GDPR Article 32 compliance requirement
- [ ] T157 [P] [FR-021] Create and test air-gapped deployment package. Create docker-compose.airgapped.yml bundling NGINX-served frontend, backend, database, and local LLaMA model. Write test plan in docs/airgapped-test-plan.md. Execute test: Deploy stack on machine with network interface disabled and confirm all functionality (US1, US2) works correctly without internet access

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-9)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 10)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Integrates with US1 for automatic recalculation
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - Integrates with US5 for urine tests
- **User Story 5 (P2)**: Can start after Foundational (Phase 2) - Provides data to US4 for CKD protocol
- **User Story 6 (P3)**: Can start after Foundational (Phase 2) - Extends authentication and FHIR integration
- **User Story 7 (P3)**: Can start after US1 completion - Adds explanations to existing AI analysis

### Within Each User Story

- FHIR resource fetchers before data aggregator
- Services before API endpoints
- Backend API before frontend components
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks can run in parallel (different configuration files)
- Foundational tasks marked [P] can run in parallel (database schemas, authentication, FHIR setup)
- Once Foundational phase completes:
  - US1 and US2 can run in parallel (MVP features)
  - US3, US4, US5 can run in parallel (Enhanced features)
  - US6 and US7 can run in parallel (Enterprise features)
- FHIR resource fetchers within each user story marked [P] can run in parallel
- Frontend components marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all FHIR fetchers together:
Task: "Create Patient FHIR resource fetcher in backend/src/fhir/patient-fetcher.ts"
Task: "Create Observation FHIR resource fetcher in backend/src/fhir/observation-fetcher.ts"
Task: "Create Condition FHIR resource fetcher in backend/src/fhir/condition-fetcher.ts"
Task: "Create MedicationRequest FHIR resource fetcher in backend/src/fhir/medication-fetcher.ts"

# Then complete data aggregator (depends on fetchers):
Task: "Implement FHIR data aggregator service in backend/src/services/fhir-aggregator.ts"

# Launch AI clients in parallel:
Task: "Implement Claude API client in backend/src/ai/claude-client.ts"
Task: "Implement OpenAI API client in backend/src/ai/openai-client.ts"

# Launch all frontend components in parallel:
Task: "Create React component for Risk Analysis Button in frontend/src/components/RiskAnalysisButton.tsx"
Task: "Create React component for Risk Assessment Display in frontend/src/components/RiskAssessment.tsx"
Task: "Create React component for Color-Coded Risk Indicator in frontend/src/components/RiskIndicator.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1 and 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Individual Risk Assessment)
4. Complete Phase 4: User Story 2 (Population Scanning)
5. **STOP and VALIDATE**: Test both user stories independently
6. Deploy to pilot hospital in Sweden
7. Gather feedback before proceeding to enhanced features

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (Core MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo (Complete MVP!)
4. Add User Story 3 → Test independently → Deploy/Demo (Automatic Recalculation)
5. Add User Story 4 → Test independently → Deploy/Demo (CKD Protocol)
6. Add User Story 5 → Test independently → Deploy/Demo (Urine Analysis)
7. Add User Story 6 → Test independently → Deploy/Demo (Multi-Country)
8. Add User Story 7 → Test independently → Deploy/Demo (Explainable AI)
9. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (2-3 weeks)
2. Once Foundational is done, split team:
   - **Team A (2 devs)**: User Story 1 (Individual Risk Assessment)
   - **Team B (2 devs)**: User Story 2 (Population Scanning)
   - Both teams work in parallel (2-3 weeks)
3. Integrate and test MVP (1 week)
4. Once MVP validated, continue in parallel:
   - **Team A**: User Story 3 (Automatic Recalculation) + US4 (CKD Protocol)
   - **Team B**: User Story 5 (Urine Analysis) + US6 (Country Integrations)
   - **Team C**: User Story 7 (Explainable AI)
5. Stories complete and integrate independently

---

## Timeline Estimates

- **Phase 1 (Setup)**: 1 week (8 tasks)
- **Phase 2 (Foundational)**: 2-3 weeks (15 tasks) ⚠️ CRITICAL PATH
- **Phase 3 (US1 - Individual Risk Assessment)**: 3-4 weeks (19 tasks)
- **Phase 4 (US2 - Population Scanning)**: 2-3 weeks (14 tasks)
- **Phase 5 (US3 - Automatic Recalculation)**: 3-4 weeks (18 tasks)
- **Phase 6 (US4 - CKD Protocol)**: 4-5 weeks (19 tasks)
- **Phase 7 (US5 - Urine Analysis)**: 3-4 weeks (21 tasks)
- **Phase 8 (US6 - Country Integrations)**: 6-8 weeks (14 tasks, per country)
- **Phase 9 (US7 - Explainable AI)**: 4-5 weeks (12 tasks)
- **Phase 10 (Polish)**: 2-3 weeks (17 tasks)

**Total MVP (US1 + US2)**: 8-10 weeks (56 tasks: T001-T056)
**Total Enhanced (US1-US5)**: 20-26 weeks (132 tasks: T001-T114 + T156)
**Total Enterprise (US1-US7)**: 36-42 weeks (157 tasks: All tasks)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- FHIR R4 compliance required for all EHR integrations
- GDPR Article 9(2)(h) legal basis for all patient data processing
- PostgreSQL for relational data, Redis for job queues, Apache Kafka for event streaming
- Claude 3.5 Sonnet primary AI model, OpenAI GPT-4 fallback, LLaMA 3.1 for air-gapped deployments
- Target deployment: EU-based cloud (AWS eu-central-1, Azure westeurope, Google Cloud europe-west1)
- CE marking required for medical device classification (Class I decision support)
