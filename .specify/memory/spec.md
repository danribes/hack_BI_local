# Feature Specification: Healthcare AI Clinical Data Analyzer

**Feature Branch**: `main`
**Created**: 2025-11-07
**Status**: In Development
**Input**: AI-powered clinical decision support tool for EU primary care physicians with GDPR compliance

## User Scenarios & Testing *(mandatory)*

### User Story 1 - AI Risk Assessment During Patient Consultation (Priority: P1) 🎯 MVP

Doctor opens patient chart in EHR system, clicks "AI Risk Analysis" button embedded within the patient record, and receives immediate risk assessment (diabetes complications, CKD progression) with actionable recommendations in under 2 seconds, all without leaving the EHR interface.

**Why this priority**: Core value proposition. Enables doctors to make informed clinical decisions during active patient consultations. Must work perfectly as this is the primary use case.

**Independent Test**: Can be fully tested by launching SMART app from Epic patient chart, clicking "Analyze Patient" button, and receiving risk assessment with color-coded risk level (green/yellow/red), contributing factors list, and clinical recommendations. Delivers immediate value even without other features.

**Acceptance Scenarios**:

1. **Given** Doctor is viewing John Doe's patient chart in Epic EHR
   **When** Doctor clicks "AI Risk Analysis" button
   **Then** React SPA loads in iframe within 1 second, displays patient demographics, and shows "Analyze Patient" button

2. **Given** Doctor clicks "Analyze Patient" button
   **When** System fetches patient data via FHIR API (HbA1c, eGFR, blood pressure, medications, diagnoses)
   **Then** AI analysis completes within 2 seconds and displays:
   - Risk score (0.0-1.0) with color-coded risk level (Low/Moderate/High)
   - Top 3 contributing factors (e.g., "eGFR declining: 55 → 48 mL/min/1.73m² in 6 months")
   - Top 3 clinical recommendations (e.g., "Order urine albumin-to-creatinine ratio test")

3. **Given** AI analysis displays high risk for CKD progression (score 0.82)
   **When** Doctor reviews contributing factors
   **Then** System shows clear explanations (e.g., "eGFR < 60 AND diabetes diagnosis AND hypertension")

4. **Given** Doctor wants to see historical risk trends
   **When** Doctor clicks "View History" link
   **Then** System displays line graph showing risk score changes over past 12 months

5. **Given** AI analysis fails due to FHIR API timeout
   **When** Error occurs
   **Then** System displays user-friendly error message "Unable to fetch patient data. Please try again." with retry button

---

### User Story 2 - Manual Patient Population Scanning (Priority: P1) 🎯 MVP

Doctor navigates to Population Health Dashboard, clicks "Scan All My Patients" button, and receives a prioritized list of high-risk patients across their entire patient panel (250-500 patients), enabling proactive outreach to patients who need immediate attention.

**Why this priority**: Enables proactive population health management. Doctors can identify at-risk patients before complications occur. Critical for preventive care model.

**Independent Test**: Can be fully tested by logging into Population Health Dashboard, clicking "Scan All Patients" button, seeing real-time progress indicator (e.g., "Analyzing 150 of 500 patients..."), and receiving sortable/filterable list of high-risk patients with risk scores. Delivers value independently of US1.

**Acceptance Scenarios**:

1. **Given** Doctor is logged into Population Health Dashboard
   **When** Doctor clicks "Scan All My Patients" button
   **Then** System queues batch analysis job and displays progress indicator "Queued: 0 of 500 patients analyzed"

2. **Given** Batch scan is in progress
   **When** Background workers process patient records (50 patients per minute)
   **Then** Progress indicator updates every 5 seconds: "Analyzing 150 of 500 patients... (30%)"

3. **Given** Batch scan completes after 10 minutes (500 patients)
   **When** System finishes risk analysis for all patients
   **Then** Dashboard displays:
   - Total patients scanned: 500
   - High-risk patients: 45 (red)
   - Moderate-risk patients: 120 (yellow)
   - Low-risk patients: 335 (green)
   - Sortable table with columns: Patient Name, Risk Score, Risk Level, Condition, Last Visit Date

4. **Given** Doctor wants to prioritize by risk score
   **When** Doctor clicks "Risk Score" column header
   **Then** Table sorts descending (highest risk first)

5. **Given** Doctor wants to filter only high-risk patients
   **When** Doctor selects "High Risk" filter checkbox
   **Then** Table shows only 45 high-risk patients

6. **Given** Doctor clicks on patient "Jane Smith" in high-risk list
   **When** Click event occurs
   **Then** System navigates to Jane Smith's detailed risk assessment (from US1)

---

### User Story 3 - Automatic Risk Recalculation (Priority: P2)

When new clinical data (lab result, diagnosis, medication change) enters the EHR database, the system automatically detects the change, recalculates the patient's risk score in the background, and sends a real-time WebSocket notification to the doctor if risk level changes significantly (e.g., moderate → high), enabling immediate intervention.

**Why this priority**: Transforms from reactive (doctor must click) to proactive (system alerts doctor). Catches deteriorating patients automatically. Enhances US1 and US2 with real-time monitoring.

**Independent Test**: Can be fully tested by simulating new lab result entry (eGFR = 42 mL/min for patient with diabetes), verifying background job queues risk recalculation within 60 seconds, and confirming doctor receives WebSocket alert "Patient John Doe: CKD risk increased to HIGH (new eGFR: 42)". Works independently as alerting system.

**Acceptance Scenarios**:

1. **Given** Patient John Doe (current risk: Moderate, score 0.55) receives new lab result: eGFR = 42 mL/min
   **When** Lab result is entered into Epic EHR system
   **Then** Epic FHIR server triggers webhook POST /api/webhook/fhir-changes with Observation resource

2. **Given** Backend receives FHIR change webhook
   **When** Event processor validates webhook signature and parses Observation resource
   **Then** System queues risk recalculation job for John Doe in Redis Queue (Bull/BullMQ)

3. **Given** Background worker picks up risk recalculation job
   **When** Worker fetches updated patient data via FHIR API and runs AI analysis
   **Then** New risk score calculated: 0.82 (High) - changed from 0.55 (Moderate)

4. **Given** Risk level changed from Moderate to High
   **When** Worker compares new score (0.82) to previous score (0.55)
   **Then** System detects significant change (delta > 0.15 OR level changed) and triggers alert

5. **Given** Alert triggered for John Doe
   **When** Notification service sends WebSocket event to all connected doctors
   **Then** Dr. Maria Svensson (John's primary care physician) sees real-time alert:
   - Alert badge shows "1" unread notification
   - Alert panel displays: "Patient John Doe: CKD risk increased to HIGH (new eGFR: 42)"
   - Patient card in dashboard shows "↑ UPDATED" badge

6. **Given** Doctor clicks on alert notification
   **When** Click event occurs
   **Then** System navigates to John Doe's updated risk assessment with highlighted changes

7. **Given** Doctor acknowledges alert by clicking "Mark as Read"
   **When** Click event occurs
   **Then** Alert badge count decreases to "0" and alert is archived

---

### User Story 4 - CKD Three-Phase Patient Identification Protocol (Priority: P2)

System automatically identifies patients with chronic kidney disease risk using three-tier stratification (Tier 1: low risk, Tier 2: moderate risk with risk factors, Tier 3: high risk with diabetes/hypertension), orders baseline kidney function tests (eGFR, uACR) for high-risk patients, flags abnormal results (eGFR < 60), tracks 3-month confirmation testing, and calculates CKD stage using KDIGO classification, enabling systematic early detection and management.

**Why this priority**: Addresses specific clinical workflow for CKD management. Comprehensive protocol that moves beyond generic risk scoring to actionable clinical pathway. High clinical value for nephrologists and primary care physicians managing CKD population.

**Independent Test**: Can be fully tested by running CKD triage algorithm on patient database (500 patients), verifying Tier 3 patients (diabetes + hypertension) are identified, confirming baseline test orders are generated, simulating abnormal eGFR result (eGFR = 55), and validating system flags for 3-month confirmation testing. Delivers complete CKD management workflow independently.

**Acceptance Scenarios**:

1. **Given** System analyzes patient Maria Garcia (age 62, diabetes, hypertension, no prior eGFR test)
   **When** CKD triage algorithm runs
   **Then** Maria classified as Tier 3 (high risk) based on ICD-10 codes: E11 (diabetes), I10 (hypertension)

2. **Given** Maria Garcia classified as Tier 3
   **When** Monitoring protocol activates
   **Then** System generates baseline test orders:
   - eGFR (estimated glomerular filtration rate)
   - uACR (urine albumin-to-creatinine ratio)
   - Priority: Routine
   - Frequency: Yearly (or every 6 months if uncontrolled diabetes/hypertension)

3. **Given** Maria Garcia receives baseline eGFR test result: 55 mL/min/1.73m² (abnormal, threshold: <60)
   **When** Result enters EHR system
   **Then** System flags abnormal result and activates 3-month confirmation tracker

4. **Given** 3-month confirmation tracker activated for Maria Garcia
   **When** 3 months pass (90 days ± 14 days window)
   **Then** System sends reminder to doctor: "Maria Garcia: Confirm CKD - eGFR retest due (initial: 55, 3 months ago)"

5. **Given** Maria Garcia receives confirmatory eGFR test result: 52 mL/min/1.73m² (still abnormal, persistent for 3 months)
   **When** Second abnormal result confirmed
   **Then** System calculates CKD stage using KDIGO classification:
   - eGFR = 52 → Stage 3a CKD (eGFR 45-59)
   - uACR = 45 mg/g (microalbuminuria, 30-300 mg/g)
   - Final diagnosis: CKD Stage 3a with albuminuria

6. **Given** Maria Garcia diagnosed with CKD Stage 3a
   **When** System evaluates nephrology referral criteria
   **Then** No automatic referral triggered (eGFR > 30, not Stage 4+)
   - However, flag for monitoring: "CKD Stage 3a - Monitor eGFR decline (>5 mL/min/year requires referral)"

7. **Given** Patient Robert Miller (age 58, CKD Stage 4, eGFR = 28 mL/min/1.73m²)
   **When** System evaluates nephrology referral criteria
   **Then** Automatic referral triggered:
   - Reason: eGFR < 30 (Stage 4 CKD)
   - Alert to doctor: "Robert Miller: Nephrology referral recommended (eGFR: 28, Stage 4 CKD)"
   - Suggested specialist: Nephrologist

---

### User Story 5 - Urine Analysis Integration (Minuteful Kidney Protocol) (Priority: P2)

Patients perform smartphone-based uACR testing at home using Healthy.io Minuteful Kidney app, test data is automatically ingested into clinical database in real-time (<60 seconds), abnormal results (uACR > 30 mg/g indicating microalbuminuria) trigger instant alerts to doctors, enabling remote monitoring and early detection of kidney disease without requiring in-clinic visits.

**Why this priority**: Enables remote patient monitoring and home-based testing. Reduces clinic visit burden. Integrates cutting-edge smartphone-based diagnostics (FDA-cleared Minuteful Kidney). High innovation value.

**Independent Test**: Can be fully tested by simulating patient completing uACR test via Minuteful Kidney mobile app, verifying JSON payload is received by webhook endpoint (/api/webhook/minuteful), confirming data is validated and stored in urine_tests database table within 60 seconds, and validating doctor receives WebSocket alert if uACR > 30 mg/g. Delivers complete remote monitoring capability independently.

**Acceptance Scenarios**:

1. **Given** Patient Sarah Johnson completes uACR test at home using Minuteful Kidney app
   **When** Test strip image is captured and analyzed by smartphone AI
   **Then** Minuteful Kidney app sends HTTPS POST to webhook endpoint /api/webhook/minuteful with encrypted JSON payload:
   ```json
   {
     "session_id": "550e8400-e29b-41d4-a716-446655440000",
     "patient_id": "encrypted_patient_identifier",
     "timestamp": "2025-11-07T10:23:45Z",
     "test_data": {
       "uacr_value": 85.5,
       "albumin_mg_l": 25.0,
       "creatinine_mg_dl": 0.29,
       "kit_batch_number": "KT240501-A"
     },
     "quality_score": {
       "lighting_score": 0.92,
       "positioning_score": 0.89,
       "ai_confidence_score": 0.94
     }
   }
   ```

2. **Given** Backend receives webhook payload
   **When** Validation service runs quality checks
   **Then** System validates:
   - uACR range: 0-5000 mg/g ✅ (85.5 valid)
   - Albumin range: 0-500 mg/L ✅ (25.0 valid)
   - Creatinine range: 0-500 mg/dL ✅ (0.29 valid)
   - AI confidence score: > 0.80 ✅ (0.94 valid)
   - Kit expiration: Not expired ✅

3. **Given** Validation passes
   **When** System publishes validated data to Kafka topic "urine-test-validated"
   **Then** Database ingestion service consumes Kafka message and inserts record into PostgreSQL urine_tests table within 5 seconds

4. **Given** uACR value = 85.5 mg/g (abnormal, threshold: >30 mg/g indicates microalbuminuria)
   **When** Alert service evaluates uACR threshold
   **Then** System triggers abnormal result alert:
   - Alert level: High
   - Message: "Sarah Johnson: Abnormal uACR result (85.5 mg/g) - Microalbuminuria detected"
   - Send WebSocket notification to doctor
   - Link to CKD diagnostic confirmation workflow (US4)

5. **Given** Doctor receives uACR abnormal result alert
   **When** Doctor clicks on alert to view details
   **Then** System displays:
   - Current uACR: 85.5 mg/g (Microalbuminuria)
   - Historical trend graph (if multiple tests available)
   - Clinical interpretation: "Persistent albuminuria indicates kidney damage"
   - Recommended action: "Order confirmatory test in 3 months (3-month rule for CKD diagnosis)"

6. **Given** Sarah Johnson has multiple uACR tests over 6 months
   **When** Doctor views trend analysis
   **Then** System displays:
   - Trend graph: uACR values over time (Jan: 25 mg/g → Mar: 45 mg/g → May: 65 mg/g → Nov: 85 mg/g)
   - Trend indicator: "↑ Worsening" (>20% increase in 3 months)
   - Recommendation: "Refer to nephrologist - Progressive albuminuria"

---

### User Story 6 - Country-Specific EHR Integration (Priority: P3)

Hospital IT teams in Germany, France, Sweden, and Estonia can deploy the AI application with country-specific authentication and FHIR server configurations (Germany: gematik TI connector with eHBA authentication, France: DMP API with ASIP Santé compliance, Sweden: NPÖ API with BankID, Estonia: X-Road integration with eID), enabling multi-country deployment while maintaining compliance with national health IT standards.

**Why this priority**: Enables EU-wide expansion. Critical for scaling beyond single-country pilot. High business value but not required for MVP.

**Independent Test**: Can be fully tested by configuring application for Germany deployment, connecting to gematik TI connector, authenticating with eHBA card, fetching patient data from German EHR system, and verifying FHIR data is correctly parsed. Each country integration can be tested independently.

**Acceptance Scenarios**:

1. **Given** Hospital IT team in Germany wants to deploy application
   **When** Team configures .env file with country=DE and TI connector URL
   **Then** System activates Germany integration module (backend/src/integrations/germany/)

2. **Given** Doctor in Germany launches app from CompuGroup Medical EHR
   **When** SMART on FHIR launch initiated
   **Then** System authenticates using eHBA card (electronic health professional card) via gematik TI connector

3. **Given** Authentication succeeds with eHBA
   **When** System fetches patient data from German FHIR server
   **Then** FHIR resources retrieved with gematik-compliant data structure (German-specific extensions)

4. **Given** Hospital IT team in Sweden wants to deploy application
   **When** Team configures .env file with country=SE and NPÖ API URL
   **Then** System activates Sweden integration module (backend/src/integrations/sweden/)

5. **Given** Doctor in Sweden launches app from NPÖ (National Patient Overview)
   **When** SMART on FHIR launch initiated
   **Then** System authenticates using BankID (Swedish national eID) via Inera API

---

### User Story 7 - Explainable AI with Clinical Validation (Priority: P3)

AI risk assessments display step-by-step reasoning with references to clinical guidelines (KDIGO, ADA, ESC), generate SHAP values showing feature importance (e.g., "eGFR decline contributes 35% to risk score"), and provide counterfactual analysis (e.g., "If HbA1c improved by 1%, risk would drop by 12%"), enabling doctors to understand and trust AI recommendations, with clinical validation study data demonstrating >85% sensitivity for high-risk patient identification.

**Why this priority**: Enhances AI transparency and trust. Required for CE marking (Class I medical device). Critical for clinical acceptance but not required for MVP functionality.

**Independent Test**: Can be fully tested by running AI analysis on test patient, verifying explanation displays clinical guideline references (e.g., "KDIGO 2024 CKD guidelines recommend nephrology referral for eGFR < 30"), validating SHAP values sum to 100%, and confirming counterfactual scenarios are medically accurate. Delivers transparency independently.

**Acceptance Scenarios**:

1. **Given** Doctor views AI risk assessment for patient with high CKD risk (score 0.82)
   **When** Doctor clicks "Why this recommendation?" button
   **Then** System displays step-by-step reasoning:
   - Step 1: eGFR = 42 mL/min/1.73m² (below threshold of 60) → +0.30 risk
   - Step 2: Diabetes diagnosis present (ICD-10: E11) → +0.25 risk
   - Step 3: Hypertension diagnosis present (ICD-10: I10) → +0.15 risk
   - Step 4: eGFR declining trend (55 → 48 → 42 over 12 months) → +0.12 risk
   - Total risk score: 0.82 (High)

2. **Given** Doctor wants to see clinical guideline references
   **When** Doctor hovers over "eGFR = 42" factor
   **Then** Tooltip displays: "KDIGO 2024 CKD Guidelines: eGFR < 60 mL/min/1.73m² for 3+ months indicates CKD. Recommend nephrology referral if eGFR < 30." [Link to guideline PDF]

3. **Given** Doctor wants to understand feature importance
   **When** Doctor clicks "Feature Importance" tab
   **Then** System displays SHAP values:
   - eGFR value: 35% contribution
   - Diabetes diagnosis: 28% contribution
   - eGFR decline trend: 22% contribution
   - Hypertension: 15% contribution
   - Total: 100%

4. **Given** Doctor wants to see counterfactual analysis
   **When** Doctor clicks "What-If Scenarios" tab
   **Then** System displays:
   - "If HbA1c improved from 8.5% to 7.5% (1% decrease), risk would drop to 0.70 (from 0.82) - 15% reduction"
   - "If blood pressure controlled to <130/80 mmHg, risk would drop to 0.75 - 9% reduction"
   - "If both interventions applied, risk would drop to 0.62 (Moderate) - 24% reduction"

---

### Edge Cases

- **What happens when FHIR server is temporarily unavailable?**
  - System displays user-friendly error message: "Unable to connect to EHR system. Please try again."
  - Implements retry logic with exponential backoff (2s, 4s, 8s, 16s)
  - Caches last successful FHIR data retrieval (15-minute TTL) for offline access

- **How does system handle patient with incomplete data (missing eGFR)?**
  - AI analysis proceeds with available data
  - Flags missing critical data: "⚠️ eGFR not available - risk assessment may be incomplete"
  - Recommendation: "Order eGFR test to improve risk assessment accuracy"

- **What happens when AI API (Claude/GPT-4) fails or times out?**
  - System automatically switches to fallback AI model (GPT-4 → Claude or vice versa)
  - If both fail, displays error: "AI analysis unavailable. Please try again later."
  - Logs error to monitoring system (Sentry) for investigation

- **How does system handle patient switching (doctor opens different patient chart)?**
  - React SPA detects patient context change via FHIR patient ID parameter
  - Clears previous patient's risk assessment from UI
  - Loads new patient's data and risk assessment
  - WebSocket subscribes to new patient's alert channel

- **What happens during batch scan if doctor logs out mid-scan?**
  - Background job continues processing (server-side, independent of frontend)
  - Results saved to database even if doctor is offline
  - Doctor can view results when they log back in
  - Progress persists across sessions

- **How does system handle duplicate urine test submissions (same session_id)?**
  - Database enforces unique constraint on session_id
  - Duplicate submissions are rejected with 409 Conflict error
  - Returns existing test result for that session_id

- **What happens when WebSocket connection drops (network interruption)?**
  - Client-side React app detects disconnection
  - Automatically attempts reconnection with exponential backoff
  - Displays connection status indicator: "Offline - Reconnecting..."
  - When reconnected, requests missed alerts from server

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST integrate with FHIR R4-compliant EHR systems via SMART on FHIR standard
- **FR-002**: System MUST launch as embedded iframe within EHR patient chart (Epic, Cerner, national systems)
- **FR-003**: System MUST authenticate users via OAuth2 using EHR's authorization server
- **FR-004**: System MUST pseudonymize patient identifiers using SHA-256 hashing before AI processing
- **FR-005**: System MUST log all data access events (who, what, when, which patient) in immutable audit trail
- **FR-006**: System MUST complete individual risk analysis within 2 seconds (95th percentile)
- **FR-007**: System MUST support batch analysis of 250-500 patients with real-time progress tracking
- **FR-008**: System MUST automatically recalculate risk scores when new FHIR Observation resources are created
- **FR-009**: System MUST send real-time WebSocket notifications when patient risk levels change significantly
- **FR-010**: System MUST implement three-tier CKD risk stratification (Tier 1: low, Tier 2: moderate, Tier 3: high)
- **FR-011**: System MUST track 3-month CKD confirmation testing for patients with abnormal eGFR (<60 mL/min/1.73m²)
- **FR-012**: System MUST calculate CKD stage using KDIGO classification based on eGFR and uACR values
- **FR-013**: System MUST ingest urine test data from Minuteful Kidney API within 60 seconds of test completion
- **FR-014**: System MUST validate uACR data quality (AI confidence score > 0.80, valid ranges)
- **FR-015**: System MUST trigger alerts for abnormal uACR results (>30 mg/g microalbuminuria threshold)
- **FR-016**: System MUST support country-specific authentication (Germany: eHBA, Sweden: BankID, Estonia: eID)
- **FR-017**: System MUST provide AI explanation with clinical guideline references (KDIGO, ADA, ESC)
- **FR-018**: System MUST generate SHAP values showing feature importance for risk score components
- **FR-019**: System MUST delete patient data within 72 hours post-analysis (configurable retention period)
- **FR-020**: System MUST encrypt data at rest (AES-256) and in transit (TLS 1.3)
- **FR-021**: System MUST support deployment in air-gapped hospital environments (no internet access)
- **FR-022**: System MUST run entirely in Docker containers (PostgreSQL, Redis, Kafka, backend, frontend via NGINX)
- **FR-023**: System MUST provide DPIA (Data Protection Impact Assessment) documentation for GDPR compliance
- **FR-024**: System MUST maintain audit logs for 10 years (HIPAA requirement)
- **FR-025**: System MUST support multiple AI models (Claude 3.5 Sonnet, GPT-4, LLaMA 3.1 for air-gapped)

### Key Entities

- **Patient**: Pseudonymized patient identifier (SHA-256 hash), demographics (age, gender), clinical data (FHIR resources)
- **Risk Assessment**: Patient token, risk model type (diabetes, CKD, CVD), risk score (0.0-1.0), risk level (low/moderate/high), contributing factors, recommendations, calculated timestamp
- **Audit Log**: Log ID, user ID, patient token, action type (VIEW, ANALYZE, EXPORT), resource accessed, timestamp, IP address
- **Scan Job**: Job ID, user ID, status (queued/processing/completed/failed), total patients, processed count, started timestamp, completed timestamp
- **CKD Risk Tier**: Patient token, tier level (1/2/3), classification date, risk factors (diabetes, hypertension, age, BMI)
- **CKD Monitoring**: Patient token, monitoring status (active/inactive), baseline tests ordered, abnormal results flagged, confirmation test due date
- **Urine Test**: Test ID, patient token, session ID, test datetime, uACR value, albumin (mg/L), creatinine (mg/dL), kit batch number, AI confidence score, quality scores (lighting, positioning)
- **Alert Notification**: Alert ID, patient token, alert type (risk change, abnormal result), severity (low/medium/high), message, created timestamp, acknowledged timestamp

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Doctors complete individual risk analysis in under 2 seconds (measured: median response time < 1.5 seconds, 95th percentile < 2 seconds)
- **SC-002**: Batch population scan processes 500 patients in under 15 minutes (measured: 50 patients per minute throughput)
- **SC-003**: Automatic risk recalculation completes within 60 seconds of new FHIR data entry (measured: median latency < 30 seconds)
- **SC-004**: Real-time WebSocket alerts delivered within 5 seconds of risk change detection (measured: P95 < 3 seconds)
- **SC-005**: Urine test data ingestion completes within 60 seconds of Minuteful Kidney app submission (measured: median < 30 seconds)
- **SC-006**: System achieves >85% sensitivity for identifying high-risk patients (validated via clinical study with 1000+ patients)
- **SC-007**: System achieves >90% specificity to minimize false positives (validated via clinical study)
- **SC-008**: 90% of doctors successfully complete SMART on FHIR launch on first attempt (measured in pilot study)
- **SC-009**: Hospital IT deploys application in under 4 hours using provided Docker Compose file (measured in pilot hospitals)
- **SC-010**: System handles 50+ concurrent doctors without performance degradation (measured: response time stable at 50 users)
- **SC-011**: Zero security incidents or GDPR violations during 6-month pilot period (measured: audit log review, security scan results)
- **SC-012**: Application bundle size < 350 KB to ensure fast loading on slow hospital WiFi (measured: Vite build output < 300 KB gzipped)
- **SC-013**: 100% audit trail coverage - every data access logged with no gaps (measured: audit log completeness check)
- **SC-014**: Data retention policy enforced - patient data deleted after 72 hours (measured: automated cleanup job verification)
- **SC-015**: CE marking submission prepared with clinical validation study results published in peer-reviewed journal

## Out of Scope

- **Patient-facing interface**: Version 1 is doctor-only. No patient portal or patient-facing mobile app.
- **Medication ordering**: System recommends tests/referrals but does not directly order medications.
- **Billing integration**: No integration with hospital billing or insurance systems.
- **Electronic prescribing**: No e-prescription functionality.
- **Telemedicine**: No video consultation or remote appointment scheduling.
- **Patient messaging**: No secure messaging between doctor and patient.
- **Non-EU countries**: Only EU deployment in Phase 1-3 (US expansion is Phase 4+).
- **Multiple languages**: English-only interface (multi-language support is Phase 4+).
- **Mobile app (native)**: Web-based only (React SPA). No iOS/Android native apps.
- **Offline analysis**: Requires internet connection for AI API calls (exception: air-gapped with local LLaMA model).

## Dependencies

- **Epic/Cerner FHIR Server**: Must support FHIR R4 standard and SMART on FHIR app launch
- **Anthropic Claude API** or **OpenAI GPT-4 API**: For AI-powered risk analysis (fallback: local LLaMA 3.1 70B)
- **Healthy.io Minuteful Kidney API**: For smartphone-based uACR testing integration
- **Hospital IT**: Must provide Linux server with Docker support, SSL certificates, OAuth2 client credentials
- **National Health Registries**: Country-specific APIs (Germany: gematik TI, Sweden: NPÖ, France: DMP, Estonia: X-Road)

## Assumptions

- Hospitals have FHIR R4-compliant EHR systems (or can upgrade)
- Doctors have basic familiarity with EHR embedded apps (SMART on FHIR)
- Hospital networks allow HTTPS API calls to external AI services (or support air-gapped local model deployment)
- Patients in pilot study consent to AI-powered clinical decision support
- Hospital IT teams have Docker and Linux server administration experience
- FHIR servers support webhooks or polling for change detection
- Clinical validation study can be conducted with >1000 patients for CE marking

## Risks

- **GDPR Compliance Violation**: Mitigate with pseudonymization, audit logging, DPIA documentation, legal review
- **AI Hallucination/Errors**: Mitigate with structured prompts, output validation, clinical guideline checks, doctor review required
- **FHIR Server Downtime**: Mitigate with retry logic, error handling, cached data (15-minute TTL), offline mode (air-gapped)
- **Hospital IT Resistance**: Mitigate with simple Docker deployment, comprehensive documentation, pilot hospital partnership
- **Performance Degradation**: Mitigate with load testing (50+ concurrent users), auto-scaling workers, Redis caching
- **Security Breach**: Mitigate with penetration testing, security audits, TLS 1.3, AES-256 encryption, access controls

## Acceptance Criteria Summary

✅ **User Story 1 (P1)**: Doctor can launch app from Epic, analyze patient, receive risk assessment in <2 seconds
✅ **User Story 2 (P1)**: Doctor can scan 500 patients, see progress, receive prioritized high-risk list
✅ **User Story 3 (P2)**: New lab result triggers automatic risk recalculation + WebSocket alert within 60 seconds
✅ **User Story 4 (P2)**: CKD triage classifies Tier 3 patients, orders tests, tracks 3-month confirmation, calculates stage
✅ **User Story 5 (P2)**: Minuteful Kidney uACR test ingested within 60 seconds, abnormal result triggers alert
✅ **User Story 6 (P3)**: Germany deployment with eHBA authentication works, Sweden deployment with BankID works
✅ **User Story 7 (P3)**: AI explanation shows guideline references, SHAP values, counterfactual scenarios

All user stories must be independently testable and deliver value even if other stories are not implemented.
