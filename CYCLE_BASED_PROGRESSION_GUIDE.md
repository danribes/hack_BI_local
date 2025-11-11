# Cycle-Based Progression System - User Guide

## Overview

The Cycle-Based Progression System simulates realistic disease progression for the entire patient cohort over 24 months. This advanced simulation demonstrates AI-powered clinical decision support, treatment recommendations, and adherence monitoring.

## Key Features

### 1. **Realistic Disease Progression**
- All patients naturally worsen over time (CKD is a progressive disease)
- Four progression types:
  - **Rapid Progressors (5%)**: Decline 9.6-14.4 mL/min/year
  - **Progressive Decliners (30%)**: Decline 3.6-7.2 mL/min/year
  - **Moderate Decliners (15%)**: Decline 1.8-3.6 mL/min/year
  - **Slow Progressors (50%)**: Decline 0.6-1.8 mL/min/year

### 2. **Treatment Effects**
- **RAS Inhibitors** (ACE-I, ARBs):
  - eGFR benefit: 0.5-1.5 mL/min/month
  - uACR reduction: 20-40%
- **SGLT2 Inhibitors**:
  - eGFR benefit: 1.0-2.5 mL/min/month (strongest protection)
  - uACR reduction: 25-50%
- **GLP-1 Receptor Agonists**:
  - eGFR benefit: 0.3-1.0 mL/min/month
  - uACR reduction: 15-30%
- **Combination Therapy**: 20% additional benefit

### 3. **Adherence Modulation**
- Treatment effectiveness depends on patient adherence (0-100%)
- Adherence categories:
  - **Excellent** (90-100%): Full treatment benefit
  - **Good** (70-89%): Near-full benefit
  - **Fair** (50-69%): Partial benefit
  - **Poor** (30-49%): Minimal benefit
  - **Very Poor** (<30%): Disease progresses despite treatment
- Adherence calculated from eGFR/uACR trends vs expected outcomes
- Random adherence variation each cycle (simulates real-world behavior)

### 4. **Automated Alerts**
Triggers on:
- Health state transitions (e.g., G2-A1 → G3a-A2)
- Critical thresholds (eGFR <30, <15)
- Risk level increases
- Rapid progression detection

## How to Use

### Initial Setup

1. **Run Database Migration**
   ```bash
   # From the project root
   docker-compose exec backend sh -c "psql -h postgres -U postgres -d healthcare_ai < /app/infrastructure/postgres/migrations/007_add_treatment_adherence_tracking.sql"
   ```

2. **Initialize Baseline (Cycle 0)**
   - The first "Next Cycle" click will initialize all patients at cycle 0
   - Establishes baseline eGFR and uACR values

### Running the Simulation

#### Using the "Next Cycle" Button

1. Navigate to any view in the application
2. The **Cycle Management** panel shows:
   - Current cycle (0-24)
   - Progress percentage
   - Last cycle results
3. Click **"Next Cycle"** to advance the entire cohort by 1 month
4. Each advance generates:
   - New lab values for ALL patients
   - Health state classifications
   - Transition alerts
   - Treatment recommendations
   - Adherence updates

#### What Happens Each Cycle

For **each patient**:

1. **Retrieve progression state**: Baseline values and decline rates
2. **Check treatments**: Get active medications and adherence
3. **Calculate lab changes**:
   ```
   Natural Decline + Treatment Effect × Adherence + Random Variation
   ```
4. **Generate new values**:
   - eGFR: Based on natural decline counteracted by treatment
   - uACR: Based on natural increase reduced by treatment
5. **Classify health state**: KDIGO categories (G1-G5, A1-A3)
6. **Detect transitions**: Compare to previous cycle
7. **Generate alerts**: If clinically significant changes
8. **Update adherence**: Calculate from lab trends for treated patients
9. **Recommend treatments**: If criteria met (e.g., eGFR <60 + albuminuria)

### Viewing Patient Evolution

1. Select a patient from the **Patient List**
2. View their **Evolution Chart** showing:
   - eGFR and uACR trends over time
   - Health state progression
   - Treatment start dates
   - Adherence levels
3. Compare baseline vs current values
4. See treatment effectiveness

### Treatment Management

#### AI-Recommended Treatments

- Automatically generated when patients meet criteria:
  - **RAS Inhibitor**: Albuminuria (A2/A3) + Hypertension
  - **SGLT2i**: eGFR 20-60 + Albuminuria + Diabetes
  - **Combination**: High-risk patients

#### Manual Treatment Initiation

```bash
# Via API
curl -X POST http://localhost:3000/api/progression/patient/{patientId}/start-treatment \
  -H "Content-Type: application/json" \
  -d '{
    "medication_name": "Empagliflozin",
    "medication_class": "SGLT2I",
    "adherence": 0.85
  }'
```

### Monitoring and Alerts

#### Alert Dashboard

View **Notifications** tab for:
- Critical alerts (red): eGFR <30, <15, severe transitions
- Warning alerts (yellow): Health state changes, risk increases
- Info alerts (blue): Minor transitions

#### High-Risk Monitoring

**High-Risk Monitoring** tab shows:
- Patients with critical/warning alerts
- Recent transitions
- Pending treatment recommendations

## Algorithm Details

### Core Progression Formula

```typescript
// For UNTREATED patients
new_egfr = previous_egfr + natural_decline + random_noise
new_uacr = previous_uacr * (1 + natural_increase_rate + random_noise)

// For TREATED patients
treatment_benefit_egfr = base_benefit * adherence
treatment_benefit_uacr = base_reduction * adherence

new_egfr = previous_egfr + natural_decline + treatment_benefit_egfr + random_noise
new_uacr = previous_uacr * (1 + natural_increase_rate - treatment_benefit_uacr + random_noise)

// Poor adherence (<50%) reduces treatment benefit
if (adherence < 0.5) {
  effective_change = natural_decline * 0.7 + treatment_benefit * 0.3
}
```

### Health State Classification

Based on **KDIGO 2012 Guidelines**:

| GFR Category | eGFR (mL/min/1.73m²) | CKD Stage |
|--------------|----------------------|-----------|
| G1 | ≥90 | 1 (if albuminuria present) |
| G2 | 60-89 | 2 (if albuminuria present) |
| G3a | 45-59 | 3a |
| G3b | 30-44 | 3b |
| G4 | 15-29 | 4 |
| G5 | <15 | 5 (kidney failure) |

| Albuminuria Category | uACR (mg/g) | Description |
|----------------------|-------------|-------------|
| A1 | <30 | Normal to mildly increased |
| A2 | 30-300 | Moderately increased |
| A3 | >300 | Severely increased |

**Health State** = GFR Category + Albuminuria Category (e.g., "G3a-A2")

### Risk Stratification

| Health State | Risk Level | Risk Color |
|--------------|-----------|------------|
| G1-A1, G2-A1 | Low | Green |
| G1-A2, G2-A2, G3a-A1 | Moderate | Yellow |
| G3a-A2, G3b-A1, G1-A3, G2-A3 | High | Orange |
| G3b-A2, G4-A1, G3a-A3, G4-A2, G5-A1, G3b-A3, G4-A3, G5-A2, G5-A3 | Very High | Red |

## API Endpoints

### Cycle Management

```bash
# Get current cycle
GET /api/progression/current-cycle

# Advance to next cycle
POST /api/progression/advance-cycle

# Reset simulation
POST /api/progression/reset-simulation
```

### Patient Data

```bash
# Get patient progression history
GET /api/progression/patient/{patientId}

# Get patient treatments
GET /api/progression/patient/{patientId}/treatments

# Start treatment
POST /api/progression/patient/{patientId}/start-treatment
```

### Monitoring

```bash
# Get all alerts
GET /api/progression/alerts?severity=critical&status=active

# Get system summary
GET /api/progression/summary

# Acknowledge alert
PATCH /api/progression/alerts/{alertId}
```

## Database Schema

### New Tables

1. **cycle_metadata**: System-wide cycle tracking
2. **patient_treatments**: Medication tracking
3. **adherence_history**: Adherence over time
4. **treatment_recommendations**: AI recommendations

### Enhanced Tables

- **health_state_history**: Added `is_treated`, `average_adherence`, `treatment_effect_egfr`, `treatment_effect_uacr`
- **patient_progression_state**: Added `natural_trajectory`, `base_decline_locked`

## Example Workflow

### Demonstrate AI Capabilities

1. **Reset simulation** to cycle 0
2. **Advance 3-4 cycles** to establish baseline trends
3. **Identify high-risk patients** via alerts
4. **Review AI recommendations** for treatment
5. **Start treatments** for selected patients
6. **Advance 5-10 cycles** to show treatment effect
7. **Compare treated vs untreated patients**:
   - Treated with good adherence: eGFR stabilizes or improves
   - Treated with poor adherence: Continued decline
   - Untreated: Progressive worsening
8. **Show adherence calculation** from lab trends
9. **Display evolution charts** showing treatment impact

### Showcase Features

- **Risk prediction**: AI identifies patients before severe decline
- **uACR monitoring**: Triggers albuminuria-specific alerts
- **CKD diagnosis**: Automated staging and recommendations
- **Treatment optimization**: Combination therapy for high-risk patients
- **Adherence surveillance**: Lab-based adherence estimation
- **Progression tracking**: Visual timelines of disease evolution

## Troubleshooting

### Common Issues

1. **"Maximum cycles reached"**
   - Reset simulation to start over
   - 24-month limit is intentional

2. **No alerts generated**
   - Check if enough cycles have passed
   - Some patients may be stable
   - Try advancing more cycles

3. **Treatment not showing effect**
   - Check adherence level
   - Treatment benefits accumulate over multiple cycles
   - Some patients are rapid progressors despite treatment

4. **Database errors**
   - Ensure migration 007 is applied
   - Check if cycle_metadata table exists
   - Verify PostgreSQL is running

### Performance

- Each cycle processes all patients (~200 in demo cohort)
- Typical processing time: 2-5 seconds
- Includes:
  - Lab value calculation
  - KDIGO classification
  - Transition detection
  - Alert generation
  - Adherence updates

## Technical Details

### Random Variation

- **eGFR**: ±0.15 mL/min per cycle (biological variation)
- **uACR**: ±5% per cycle (measurement variation)
- **Adherence drift**: ±15% per cycle (20% chance of change)

### Treatment Initiation (Automated)

- 10% chance per cycle for eligible patients
- Criteria:
  - RAS Inhibitor: A2/A3 albuminuria
  - SGLT2i: eGFR 20-60 + albuminuria + diabetes
  - Combination: High-risk state

### Adherence Calculation

```typescript
// Simplified formula
adherence_from_egfr = (actual_egfr_change / expected_egfr_change)
adherence_from_uacr = (actual_uacr_reduction / expected_uacr_reduction)
final_adherence = average(adherence_from_egfr, adherence_from_uacr)
```

Clamped to 0-100%.

## Future Enhancements

Potential additions:
- Manual adherence adjustment
- Treatment discontinuation simulation
- Adverse event modeling
- Cost-effectiveness analysis
- Hospitalization risk prediction
- Patient-specific intervention planning

---

**Built with**: React + TypeScript + PostgreSQL + Claude AI
**Version**: 1.0.0
**Last Updated**: 2025-11-11
