# Healthcare AI Clinical Data Analyzer

## Overview

This project is an AI-powered clinical decision support tool designed for primary care physicians in the European Union. The application analyzes patient clinical data from Electronic Health Records (EHR) and generates risk assessments and treatment recommendations while maintaining strict GDPR compliance.

## Project Status

**Current Phase:** Planning & Documentation Complete
**Implementation Roadmap:** 155 tasks across 10 phases
**Target MVP Completion:** 8-10 weeks (US1 + US2)
**Initial Pilot Country:** Sweden or Estonia

## Key Features

- **FHIR-Based Integration**: Connects to EHR systems via SMART on FHIR
- **AI Risk Analysis**: Powered by Claude 3.5 Sonnet, GPT-4 (fallback), or LLaMA 3.1 (air-gapped)
- **Individual Patient Analysis (US1)**: Doctor triggers AI risk assessment during consultation (<2s response)
- **Population Scanning (US2)**: "Scan All Patients" batch analysis with progress tracking
- **Automatic Risk Recalculation (US3)**: Event-driven system recalculates risk when new data enters EHR
- **Three-Phase CKD Protocol (US4)**: Comprehensive chronic kidney disease identification
  - Tier 1/2/3 risk stratification using ICD-10 codes and risk factors
  - Active monitoring with automated test ordering (eGFR, uACR)
  - 3-month diagnostic confirmation tracker and KDIGO staging
- **Urine Analysis Integration (US5)**: Smartphone-based uACR testing (Healthy.io Minuteful Kidney)
  - Real-time data ingestion (<60 second latency)
  - Apache Kafka stream processing for validation
  - FHIR R4 Observation resources with LOINC codes (9318-7, 14958-3, 2161-8)
- **Country-Specific Integrations (US6)**: Germany (gematik TI), France (DMP), Sweden (NPÖ), Estonia (X-Road)
- **Explainable AI (US7)**: SHAP values, clinical guideline citations, counterfactual analysis
- **GDPR Compliant**: Pseudonymization, data minimization, 72-hour retention policy, audit trails
- **Real-Time Alerts**: WebSocket notifications when patient risk levels change
- **Multi-Condition Support**: Diabetes complications, CKD progression, cardiovascular disease

## Project Structure

```
/home/user/hackathon_BI_CKD/
├── spec.md                          # Feature specification (7 user stories)
├── plan.md                          # Technical implementation plan
├── tasks.md                         # 155 implementation tasks across 10 phases
├── presentation.html                # Visual slide deck (reveal.js)
├── docs/
│   ├── technical-decision-record.md # Architecture rationale (React vs Next.js, Docker)
│   ├── smart-on-fhir-technical-deep-dive.md # OAuth2 flow, SSR incompatibility
│   └── README.md                    # This file
├── .taskmaster/
│   ├── docs/
│   │   └── prd.txt                  # Product Requirements Document
│   └── tasks/
│       └── tasks.json               # Detailed task breakdown (legacy format)
└── claude-task-master/              # Task management system (cloned repo)
```

## Task Breakdown

The project is organized into **155 tasks** across **10 phases**, grouped by **7 user stories**:

### Phase 1: Setup (8 tasks, ~1 week)
Project initialization: monorepo structure, TypeScript/React/Express setup, Docker, Git, CI/CD pipeline.

### Phase 2: Foundational (15 tasks, ~2-3 weeks) ⚠️ CRITICAL PATH
Core infrastructure that **blocks all user stories**:
- PostgreSQL database with audit_logs and risk_assessments schemas
- HAPI FHIR client for EHR integration
- Pseudonymization service (SHA-256 hashing for GDPR compliance)
- OAuth2 authentication middleware
- Audit logging service (10-year retention)
- Security headers, CORS, error handling

### Phase 3: User Story 1 - AI Risk Assessment (19 tasks, ~3-4 weeks) 🎯 MVP
**Goal**: Doctor clicks "AI Risk Analysis" button, receives risk assessment in <2 seconds

**Tasks**: FHIR resource fetchers (Patient, Observation, Condition, MedicationRequest), AI processing service (Claude/GPT-4), risk analysis API endpoints, React components (Risk Score, Recommendations, Trend Graphs), SMART on FHIR app launch

### Phase 4: User Story 2 - Population Scanning (14 tasks, ~2-3 weeks) 🎯 MVP
**Goal**: Doctor clicks "Scan All My Patients" button, receives prioritized high-risk list

**Tasks**: Background job queue (Bull/BullMQ), batch scan service, scan job processor worker, scan status API, Population Health Dashboard, Progress Indicator component, sortable patient risk list

**✅ MVP Complete**: US1 + US2 functional, ready for pilot deployment

---

### Phase 5: User Story 3 - Automatic Recalculation (18 tasks, ~3-4 weeks)
**Goal**: New lab result triggers automatic risk recalculation and real-time alert (<60s)

**Tasks**: Redis job queue, FHIR webhook subscription, event processors (Observation/Condition/MedicationRequest), WebSocket server (Socket.io), notification service, Alerts Dashboard, Alert Badge component

### Phase 6: User Story 4 - CKD Protocol (19 tasks, ~4-5 weeks)
**Goal**: Three-phase CKD patient identification with tier stratification and 3-month confirmation

**Tasks**: CKD risk tiers database schema, three-tier risk stratification algorithm, Tier 2/3 detection (ICD-10 codes), active monitoring service, baseline test ordering (eGFR + uACR), abnormal result detection, 3-month confirmation tracker, KDIGO staging calculator, nephrology referral trigger

### Phase 7: User Story 5 - Urine Analysis (21 tasks, ~3-4 weeks)
**Goal**: Smartphone uACR test data ingested in <60 seconds, abnormal results trigger alerts

**Tasks**: Urine tests database schema, Healthy.io Minuteful Kidney API client, FHIR Observation parsers (LOINC 9318-7/14958-3/2161-8), real-time ingestion pipeline, batch NDJSON import, Apache Kafka topics setup, Kafka producer/consumer, uACR validation (0-5000 mg/g range), uACR trend analysis, offline sync mechanism

### Phase 8: User Story 6 - Country Integrations (14 tasks, ~6-8 weeks)
**Goal**: Deploy in Germany, France, Sweden, Estonia with country-specific compliance

**Tasks**:
- 🇩🇪 Germany: eHBA authentication, gematik TI connector
- 🇫🇷 France: DMP API client, ASIP Santé compliance
- 🇸🇪 Sweden: NPÖ/Inera API, BankID authentication
- 🇪🇪 Estonia: X-Road integration, eID authentication
- Country detection/routing service, country-specific config files

### Phase 9: User Story 7 - Explainable AI (12 tasks, ~4-5 weeks)
**Goal**: AI recommendations display step-by-step reasoning with clinical guideline references

**Tasks**: AI explanation generator, SHAP value calculator, medical guideline reference database, guideline citation service, local LLaMA 3.1 deployment, model comparison service, clinical validation study protocol, CE marking documentation

### Phase 10: Polish & Deployment (15 tasks, ~2-3 weeks)
**Goal**: Production-ready deployment with full compliance and monitoring

**Tasks**: API documentation (OpenAPI/Swagger), user manual, deployment guide, performance monitoring (New Relic/DataDog), error tracking (Sentry), security hardening (penetration testing), GDPR compliance audit, accessibility audit (WCAG 2.1 AA), data retention policy worker, rate limiting/DDoS protection, automated PostgreSQL backups, air-gapped deployment package, final integration testing, MVP pilot deployment

---

## Timeline Estimates

| Milestone | Tasks | Duration | Cumulative |
|-----------|-------|----------|------------|
| **MVP (US1 + US2)** | T001-T056 (56 tasks) | 8-10 weeks | Week 10 |
| **Enhanced (+ US3-US5)** | T057-T114 (58 tasks) | 12-16 weeks | Week 26 |
| **Enterprise (+ US6-US7)** | T115-T140 (26 tasks) | 10-13 weeks | Week 39 |
| **Production Ready** | T141-T157 (17 tasks) | 2-3 weeks | Week 42 |

**Total**: 36-42 weeks for full enterprise product
**MVP**: 8-10 weeks for pilot deployment

## Technical Architecture

### Frontend
- **Framework**: React 18 + TypeScript 5
- **Build Tool**: Vite 5
- **State Management**: TanStack Query (React Query v5)
- **UI**: Tailwind CSS 3, Recharts 2 (visualizations)
- **Real-Time**: Socket.io-client 4 (WebSocket)
- **EHR Integration**: SMART on FHIR client (fhirclient.js)

**Why React SPA (not Next.js)?** SMART on FHIR requires client-side OAuth2 redirect flow in iframe. SSR frameworks break due to: OAuth2 cookies inaccessible on server, CSP blocks dynamic chunks, CORS violations. See `docs/smart-on-fhir-technical-deep-dive.md` for details.

### Backend
- **Runtime**: Node.js 20 LTS + Express.js 4
- **Language**: TypeScript 5
- **FHIR Client**: HAPI FHIR Client (TypeScript)
- **Job Queue**: Bull/BullMQ (Redis-backed)
- **WebSocket**: Socket.io 4
- **Streaming**: Apache Kafka 3.5+ (Phase 7 - US5)

**Why Express.js (not FastAPI)?** TypeScript consistency across stack, mature FHIR ecosystem in Node.js, hospital IT familiarity. See `docs/technical-decision-record.md` for rationale.

### Database & Infrastructure
- **PostgreSQL 14+**: Audit logs (10-year retention), risk assessments (2-year retention), urine tests (7-year retention)
- **Redis 7**: FHIR data caching (5-min TTL), background job queue, WebSocket sessions
- **Apache Kafka**: Event streaming for urine test data (Phase 7+)
- **Deployment**: Docker + Docker Compose (simple hospital IT deployment)
- **Hosting**: EU cloud (AWS eu-central-1, Azure westeurope, GCP europe-west1) or on-premise

### AI Models
- **Primary**: Claude 3.5 Sonnet (Anthropic API)
- **Fallback**: GPT-4 (Azure OpenAI)
- **Air-Gapped**: LLaMA 3.1 70B (local inference)

## Compliance & Security

### GDPR Compliance
- **Legal Basis**: Article 9(2)(h) - Processing necessary for healthcare provision
- **Pseudonymization**: SHA-256 hashing of patient identifiers before AI processing
- **Data Minimization**: Only fetch necessary FHIR resources (Patient, Observation, Condition, MedicationRequest)
- **Retention Policy**: Patient data deleted within 72 hours post-analysis (configurable)
- **Audit Trails**: Immutable logs with 10-year retention (medical record requirement)
- **Right to Erasure**: Purge all data for a given patient token on request
- **DPIA**: Data Protection Impact Assessment documentation (T151)

### Security Measures
- **Encryption**: TLS 1.3 in transit, AES-256 at rest
- **Authentication**: OAuth2 via SMART on FHIR (leverages EHR authentication)
- **Secrets Management**: AWS Secrets Manager or HashiCorp Vault
- **Rate Limiting**: API Gateway (Kong or AWS API Gateway)
- **Penetration Testing**: Annual third-party security audits
- **ISO 27001**: Certified data center requirement

### Medical Device Compliance
- **Classification**: Class I medical device (decision support tool)
- **CE Marking**: Required for EU market (clinical validation study, technical documentation)
- **Clinical Validation**: Retrospective study with 1000+ patients (Phase 9 - US7)

## Country-Specific Integrations

| Country | Authentication | API | Compliance | Implementation |
|---------|---------------|-----|------------|----------------|
| 🇸🇪 Sweden | BankID | NPÖ/Inera API | Patient Data Act (2008:355) | T121-T122 (Phase 8) |
| 🇪🇪 Estonia | eID | X-Road | eHealth Record Act | T123-T125 (Phase 8) |
| 🇩🇪 Germany | eHBA | gematik TI | MDR, gematik certification | T115-T117 (Phase 8) |
| 🇫🇷 France | ASIP Santé | DMP API | SecNumCloud, HDS certification | T118-T120 (Phase 8) |

## Getting Started

### Prerequisites

- Node.js 20 LTS
- Docker 24+ & Docker Compose 2.20+
- Git
- API Keys: Anthropic (Claude) or Azure OpenAI (GPT-4)

### View Implementation Plan

**Slide Deck**: Open `presentation.html` in browser for visual overview of all 155 tasks

**Detailed Specification**: See `spec.md` for 7 user stories with acceptance criteria

**Technical Plan**: See `plan.md` for architecture, project structure, risk mitigation

**Task List**: See `tasks.md` for granular task breakdown with dependencies

### Development Workflow

1. **Start with MVP**: Complete Phase 1 (Setup) → Phase 2 (Foundation) → Phase 3 (US1) → Phase 4 (US2)
2. **Validate independently**: Test each user story independently before proceeding
3. **Follow dependencies**: Phase 2 blocks all user stories. US1 must complete before US7.
4. **Parallel opportunities**: Tasks marked `[P]` in `tasks.md` can run in parallel
5. **Security-first**: Implement pseudonymization (T015-T016) and audit logging (T018) before any AI processing

## Documentation

| File | Purpose |
|------|---------|
| `spec.md` | Feature specification with 7 user stories (US1-US7) |
| `plan.md` | Technical implementation plan, architecture, risk mitigation |
| `tasks.md` | 155 implementation tasks across 10 phases |
| `presentation.html` | Visual slide deck (reveal.js) for stakeholder presentations |
| `docs/technical-decision-record.md` | Rationale for React, Docker, Express.js, monorepo |
| `docs/smart-on-fhir-technical-deep-dive.md` | Why SSR (Next.js) is incompatible with SMART on FHIR |
| `.taskmaster/docs/prd.txt` | Original Product Requirements Document |

## Roadmap

| Phase | Timeline | User Stories | Key Deliverables |
|-------|----------|--------------|------------------|
| **MVP** | Weeks 1-10 | US1 + US2 | Individual risk analysis, population scanning, 5-10 pilot doctors in Sweden |
| **Enhanced** | Weeks 11-26 | + US3 + US4 + US5 | Automatic recalculation, CKD protocol, urine analysis, 50+ doctors |
| **Enterprise** | Weeks 27-39 | + US6 + US7 | Multi-country (Germany, France, Sweden, Estonia), explainable AI, 500+ doctors |
| **Production** | Weeks 40-42 | Polish | GDPR audit, CE marking, production deployment |

## Success Criteria

### MVP (US1 + US2)
- ✅ 5-10 pilot doctors successfully using the app
- ✅ <2 second response time for individual risk analysis (US1)
- ✅ <5 minutes for 500-patient batch scan (US2)
- ✅ Zero GDPR violations or data breaches
- ✅ 70%+ positive feedback from pilot users
- ✅ SMART on FHIR app launches from Epic/Cerner EHR

### Enhanced Product (US1-US5)
- ✅ 50+ doctors across 2 countries
- ✅ <60 seconds automatic risk recalculation latency (US3)
- ✅ CKD protocol identifies Tier 3 patients (US4)
- ✅ Urine test data ingestion <60 seconds (US5)
- ✅ 3 distinct clinical risk models operational (diabetes, CKD, CVD)

### Full Product (US1-US7)
- ✅ 500+ doctors across 5 EU countries
- ✅ Published clinical validation study (US7)
- ✅ CE marking obtained
- ✅ 99.5% uptime
- ✅ Air-gapped deployment validated (T157)

## Critical Requirements

The review identified these **critical gaps** now addressed:

1. **✅ T156**: Data retention policy worker - Implements 72-hour GDPR deletion (FR-019)
2. **✅ T032 (expanded)**: AI processing service with explicit primary/fallback logic (Claude → GPT-4)
3. **✅ T029 & T040 (expanded)**: Incomplete patient data handling with ⚠️ flags and recommendations
4. **✅ T157**: Air-gapped deployment package testing and validation (FR-021)
5. **✅ MVP scope corrected**: US1 + US2 (both P1), not US1 only

## Contributing

This project follows the implementation plan in `tasks.md`. Tasks are grouped by user story for independent development:

- **Team A**: Can work on US1 (Individual Risk Assessment)
- **Team B**: Can work on US2 (Population Scanning) in parallel
- **After MVP**: Teams can tackle US3-US5 independently

Each user story has clear acceptance criteria in `spec.md` for independent testing.

## License

This project contains proprietary code for healthcare AI clinical data analysis. All rights reserved.

## Contributors

- **Development Team**: [Your Team]
- **Medical Advisors**: [TBD - Nephrologist, Endocrinologist, Cardiologist]
- **Compliance Consultants**: [TBD - GDPR Expert, Medical Device Regulatory Expert]

## Contact

For questions or collaboration inquiries, please contact: [Your Contact Info]

---

**⚠️ Important**: This is a healthcare AI project dealing with sensitive medical data. All development must follow strict security, privacy, and compliance guidelines outlined in the PRD and technical documentation.
