# SCORED Model Implementation for Non-CKD Risk Assessment

## Clinical Problem

**Previous Issue**: The system was incorrectly applying KDIGO staging to non-CKD patients.

- **KDIGO** is a staging/prognosis system for patients who **ALREADY have diagnosed CKD**
- It answers: "How bad is their kidney failure?" and "What's their risk of progression?"
- It is **NOT** for assessing risk of developing CKD in patients without kidney disease

**Example of the Problem**:
A 55-year-old with diabetes, hypertension, and obesity (eGFR 85, uACR 20) would be classified as:
- KDIGO: G2-A1 = "Low Risk" (Green)
- **But clinically**: This patient has HIGH risk of developing CKD!

The KDIGO matrix doesn't capture comorbidity burden, age, or cardiovascular history - all critical for predicting future kidney disease.

---

## Solution: SCORED Model

The **SCORED (Screening for Occult REnal Disease)** model is the validated clinical tool for finding hidden kidney disease in non-CKD individuals (Bang et al.).

### The SCORED Scoring System

Points are accumulated based on risk factors:

| Risk Factor | Points | Clinical Significance |
|------------|--------|----------------------|
| **Age 50-59** | +2 | Kidney function naturally declines with age |
| **Age 60-69** | +3 | Accelerated decline risk |
| **Age ≥70** | +4 | High risk of occult disease |
| **Female** | +1 | Slightly higher CKD prevalence |
| **Hypertension** | +1 | Damages kidney blood vessels |
| **Diabetes** | +1 | Leading cause of CKD |
| **CVD** (MI, stroke, heart failure) | +1 | Cardiorenal syndrome |
| **PVD** (Peripheral vascular disease) | +1 | Systemic vascular damage |
| **Proteinuria** (uACR ≥30) | +1 | Direct evidence of kidney damage |

### Risk Thresholds

- **Low Risk (0-3 points)**: Low probability of undetected CKD
  - **Action**: Routine annual screening
  - Probability of hidden CKD: <10%

- **High Risk (≥4 points)**: Border value - significant risk
  - **Action**: **Immediate screening required** (eGFR + uACR)
  - Probability of hidden CKD: **~20% (1 in 5 chance)**

### Example SCORED Calculations

**Case 1: Low Risk**
- 45-year-old male, no comorbidities, eGFR 95, uACR 15
- SCORED: 0 points → **Low Risk**
- Action: Annual screening

**Case 2: High Risk**
- 55-year-old female (+2 age, +1 gender), diabetes (+1), hypertension (+1)
- SCORED: 5 points → **High Risk**
- Action: Immediate comprehensive kidney screening
- This patient has 20% chance of already having undetected CKD

**Case 3: Very High Risk**
- 72-year-old male (+4 age), diabetes (+1), hypertension (+1), heart failure (+1), uACR 45 (+1)
- SCORED: 8 points → **High Risk with microalbuminuria**
- Action: Urgent nephrology evaluation, start kidney-protective medications

---

## Border Values for Non-CKD Patients

These are the clinical cut-offs that determine risk level:

### eGFR (Glomerular Filtration Rate)

| eGFR Range | Classification | Clinical Meaning |
|-----------|----------------|------------------|
| **>90** | Normal/Low Risk | Kidneys working at 100% |
| **60-89** | Borderline/Moderate Risk | Mild decline - "age-appropriate" but needs monitoring |
| **<60** | High Risk | **DIAGNOSIS**: This IS CKD (crosses into disease territory) |

### uACR (Urine Albumin-to-Creatinine Ratio)

| uACR Range | Classification | Clinical Meaning |
|-----------|----------------|------------------|
| **<30 mg/g** | Normal/Low Risk | No protein leakage |
| **30-300 mg/g** | Microalbuminuria/Moderate Risk | **Early kidney damage** - this is the first sign! |
| **>300 mg/g** | Macroalbuminuria/High Risk | Severe damage, very high CKD risk |

**Critical Note**: For diabetic or hypertensive patients, crossing the **uACR 30 mg/g threshold** is often the first detectable sign of kidney disease, even when eGFR is still normal (>90).

---

## Implementation in RenalGuard AI

### 1. `calculateSCORED()` Function

Calculates the SCORED points based on patient demographics and lab values.

**Input**:
```typescript
{
  age: 62,
  gender: 'female',
  has_hypertension: true,
  has_diabetes: true,
  has_cvd: false,
  has_pvd: false
}
uacr: 25
```

**Output**:
```typescript
{
  points: 6,  // Age 60-69 (+3) + Female (+1) + HTN (+1) + DM (+1)
  risk_level: 'high',  // ≥4 points
  components: [
    'Age 60-69 (+3)',
    'Female (+1)',
    'Hypertension (+1)',
    'Diabetes (+1)'
  ]
}
```

### 2. `getNonCKDRiskLevel()` Function

Combines SCORED score with lab value borders to determine final risk.

**Logic Flow**:
1. Start with SCORED base risk (low if 0-3, high if ≥4)
2. Adjust based on eGFR:
   - eGFR 60-89 → Elevate to moderate (if was low)
3. Adjust based on uACR (critical factor):
   - uACR 30-300 → Elevate by one level (microalbuminuria = early damage)
   - uACR >300 → Set to high (macroalbuminuria = severe damage)
4. Special rule: SCORED ≥4 + uACR ≥30 → **Always high risk**

**Example Output**:
```typescript
{
  risk_level: 'high',
  risk_color: 'orange',
  reasoning: [
    'SCORED score 6 indicates ≥20% chance of undetected CKD',
    'eGFR >90: Normal kidney filtration',
    'uACR <30: No proteinuria'
  ]
}
```

### 3. `classifyKDIGOWithSCORED()` Function

Main classification function that chooses the right assessment method:

- **For CKD patients** (eGFR <60 or uACR ≥30 with reduced eGFR): Uses KDIGO staging
- **For non-CKD patients** (eGFR ≥60 and uACR <30): Uses SCORED + lab borders

**Logging Example**:
```
[SCORED Assessment] Patient (Age 62, female)
  SCORED Points: 6 (high risk)
  Components: Age 60-69 (+3), Female (+1), Hypertension (+1), Diabetes (+1)
  Final Risk: high (orange)
  Reasoning: SCORED score 6 indicates ≥20% chance of undetected CKD; eGFR >90: Normal kidney filtration; uACR <30: No proteinuria
```

---

## Clinical Workflow

### For a Non-CKD Patient Visit

1. **Calculate SCORED score** from demographics + comorbidities
2. **Check lab values** (eGFR, uACR)
3. **Determine risk level**:
   - Low Risk (0-3 points, normal labs): Annual screening
   - Moderate Risk (borderline labs or low SCORED + mild abnormality): Every 6-12 months
   - High Risk (≥4 points or microalbuminuria): Every 3-6 months + kidney-protective interventions

### Intervention Triggers

**SCORED ≥4 points**:
- Immediate comprehensive screening (serum creatinine, uACR)
- Strict BP control (<130/80)
- Consider SGLT2 inhibitors (kidney-protective even before CKD diagnosis)
- Patient education about kidney disease risk

**uACR crosses 30 mg/g** (microalbuminuria):
- **This is the critical border value** - patient has crossed from "at risk" to "early disease"
- Initiate ACE inhibitor or ARB
- Increase monitoring frequency
- Address modifiable risk factors aggressively

**eGFR falls below 60**:
- **Official CKD diagnosis** - patient now enters KDIGO staging system
- Switch from "risk assessment" to "disease management"
- Consider nephrology referral if stage 3b or worse

---

## Key Differences: KDIGO vs SCORED

| Aspect | KDIGO | SCORED |
|--------|-------|--------|
| **Population** | Diagnosed CKD patients | Non-CKD individuals at risk |
| **Question** | "How bad is the failure?" | "What's the risk of hidden/future disease?" |
| **Primary Factors** | eGFR + uACR categories | Age, gender, comorbidities, labs |
| **Risk Categories** | Low/Moderate/High/Very High based on prognosis | Low/High based on probability of occult disease |
| **Action** | Disease management, progression monitoring | Screening urgency, prevention |
| **Example** | G3a-A2 = High risk of progression | Age 65 + DM + HTN = 20% chance already has hidden CKD |

---

## Clinical Validation

The SCORED model has been validated in multiple large population studies:

- **Bang et al. (original validation)**: SCORED ≥4 identified patients with 20% prevalence of undetected CKD
- **Sensitivity**: ~90% for detecting eGFR <60 in screening populations
- **Specificity**: ~65% (appropriate for screening - prioritizes not missing cases)
- **Clinical adoption**: Recommended by National Kidney Foundation for community screening programs

---

## Impact on RenalGuard AI

### Before (Incorrect)

**Patient**: 62F, DM, HTN, eGFR 85, uACR 20
- **System**: "G2-A1 = Low Risk (Green)"
- **Doctor sees**: "Low priority, routine annual follow-up"
- **Clinical reality**: This patient has HIGH risk (SCORED = 6 points)

### After (Correct with SCORED)

**Same Patient**:
- **SCORED**: 6 points (Age 60-69 +3, Female +1, HTN +1, DM +1)
- **System**: "Non-CKD High Risk (Orange)"
- **Doctor sees**: "20% chance of already having hidden CKD, needs immediate comprehensive screening"
- **Action**: Order eGFR + uACR, strict BP control, consider SGLT2i, follow-up in 3-6 months

---

## Summary

The SCORED model implementation ensures RenalGuard AI provides **clinically appropriate risk assessment** for non-CKD patients by:

1. ✅ Using validated screening criteria (SCORED) instead of staging system (KDIGO)
2. ✅ Incorporating age, gender, and comorbidity burden
3. ✅ Identifying patients with 20% chance of hidden CKD (SCORED ≥4)
4. ✅ Applying correct border values (eGFR 60, uACR 30, uACR 300)
5. ✅ Triggering appropriate screening and prevention interventions

**Result**: Doctors can now confidently identify high-risk non-CKD patients who need aggressive screening and preventive care, rather than falsely reassuring them with "low risk" based on inappropriate KDIGO staging.
