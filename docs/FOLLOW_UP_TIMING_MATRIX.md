# Follow-Up Timing Matrix for CKD and Non-CKD Patients

## Purpose
This matrix defines specific follow-up intervals based on risk/severity to eliminate vague "follow up as scheduled" recommendations.

---

## CKD Patients - Follow-Up Timing by KDIGO Risk Level

| KDIGO Risk Level | GFR/Albuminuria Categories | Clinical Lab Follow-Up | What to Test |
|------------------|----------------------------|------------------------|--------------|
| **RED (Very High)** | G4, G5, A3 (any G), G3b-A2 | **Every 1-3 months** | Comprehensive metabolic panel, eGFR, serum creatinine, uACR, CBC, electrolytes, BP |
| **ORANGE (High)** | G3a-A2, G3b-A1 | **Every 3-6 months** | eGFR, serum creatinine, uACR, electrolytes, BP check |
| **YELLOW (Moderate)** | G1/G2-A2, G3a-A1 | **Every 6-12 months** | eGFR, uACR, routine monitoring, BP check |
| **GREEN (Low)** | G1/G2-A1 | **Annually (12 months)** | eGFR, uACR screening |

### Home Monitoring (Minuteful Kidney) - Additional to Clinical Labs

| Severity | Frequency | When Recommended |
|----------|-----------|------------------|
| **Advanced CKD** | Weekly | eGFR <30 OR uACR ≥300 AND on SGLT2i |
| **Moderate CKD** | Bi-weekly | eGFR <45 OR uACR ≥100 AND on SGLT2i |
| **Mild-Moderate CKD** | Monthly | eGFR <60 OR uACR ≥30 (with or without treatment) |

---

## Non-CKD Patients - Follow-Up Timing by Risk Factors

| Risk Category | Risk Factors Present | Follow-Up Interval | What to Test |
|---------------|---------------------|-------------------|--------------|
| **High Risk** | Diabetes + Hypertension<br>OR Multiple risk factors | **Every 6-12 months** | eGFR, uACR, comprehensive metabolic panel, HbA1c (if diabetic), BP |
| **Moderate Risk** | Single risk factor:<br>- Diabetes OR<br>- Hypertension OR<br>- Age >60 OR<br>- Family history of CKD | **Annually (12 months)** | eGFR, uACR, basic metabolic panel, BP |
| **Low Risk** | G1/G2-A1<br>No significant risk factors<br>Age <60 | **Every 1-2 years**<br>Or as needed | eGFR, uACR screening,<br>routine health maintenance |

---

## Timing Modifiers - When to Shorten Follow-Up Intervals

### Clinical Situation → Adjustment

| Situation | Normal Interval | Adjusted Interval | Reason |
|-----------|----------------|-------------------|---------|
| **Rapid eGFR decline** (>5 mL/min/year) | Any interval | **Shorten by 50%** | Monitor progression closely |
| **Significant uACR increase** (>50%) | Any interval | **Shorten by 3-6 months** | Early albuminuria detection |
| **New treatment initiated** (RAS inhibitor, SGLT2i) | Any interval | **1-2 weeks** for safety labs,<br>then resume normal schedule | Check potassium, creatinine |
| **Stable on treatment** | Any interval | **Use standard interval** for risk level | Treatment effective |
| **Health state progression** (A1→A2, G3a→G3b) | Any interval | **Shorten by one tier** | Increased risk requires closer monitoring |

---

## Example Recommendations

### Example 1: Helen Campbell (G2-A1, Low Risk, Non-CKD, Age 84)
**Current Problem**: "Follow up as scheduled" ❌

**Correct Recommendation**:
```
"Schedule annual follow-up in 12 months for routine kidney screening (low risk per KDIGO).

Next labs (in 12 months):
- eGFR and serum creatinine
- Urine albumin-to-creatinine ratio (uACR)
- Basic metabolic panel
- Blood pressure check

Rationale: G2-A1 with normal kidney function and no significant risk factors. Annual screening adequate per KDIGO guidelines."
```

### Example 2: Shirley Anderson (G2-A2, Moderate Risk, Mild CKD with Albuminuria)
**Current Problem**: "Continue monitoring and follow up as scheduled" ❌

**Correct Recommendation**:
```
"Schedule follow-up in 6-12 months per moderate risk (YELLOW) guidelines.

Clinical Lab Monitoring (every 6-12 months):
- Comprehensive metabolic panel
- eGFR and serum creatinine
- Urine albumin-to-creatinine ratio (uACR)
- HbA1c (if diabetic)
- Blood pressure check

Home Monitoring (Minuteful Kidney):
- Initiate Monthly at-home uACR testing between clinic visits

Treatment Initiation:
- Schedule appointment in 1-2 weeks to initiate RAS inhibitor therapy (STRONG indication for albuminuria)
- Safety labs (potassium, creatinine) 1-2 weeks after starting RAS inhibitor
- Then resume 6-12 month monitoring schedule

Rationale: G2-A2 indicates moderate albuminuria requiring treatment and closer monitoring."
```

### Example 3: Betty Anderson (G3a-A1, Moderate Risk, Moderate CKD)
**Current Problem**: "Continue monitoring" ❌

**Correct Recommendation**:
```
"Schedule follow-up in 6-12 months per moderate risk (YELLOW) guidelines.

Clinical Lab Monitoring (every 6-12 months):
- eGFR, serum creatinine, uACR
- Comprehensive metabolic panel
- Blood pressure check

Home Monitoring (Minuteful Kidney):
- Initiate Monthly at-home uACR testing

Rationale: G3a-A1 (Moderate CKD, Stage 3a). Monthly home monitoring provides trend data between 6-12 month clinic visits. Moderate risk per KDIGO classification."
```

### Example 4: Advanced CKD (G4-A3, Very High Risk)
**Current Problem**: "Continue monitoring" ❌

**Correct Recommendation**:
```
"URGENT: Schedule follow-up in 1-3 months due to very high risk (RED per KDIGO).

Clinical Lab Monitoring (every 1-3 months):
- Comprehensive metabolic panel with electrolytes
- eGFR, serum creatinine, BUN
- Urine albumin-to-creatinine ratio (uACR)
- CBC (check for anemia)
- Calcium, phosphorus, PTH (CKD-MBD screening)
- Blood pressure check

Home Monitoring (Minuteful Kidney):
- Weekly at-home uACR testing (if on SGLT2i)
- Provides early warning of worsening kidney function

Consider nephrology referral if not already established.

Rationale: G4-A3 represents advanced CKD with severe proteinuria. Very high risk requires frequent monitoring to detect rapid progression and prepare for potential renal replacement therapy."
```

---

## AI Prompt Requirements Summary

### ✅ ALWAYS Include:
1. **Specific timeframe**: "in 6 months", "in 12 months", "in 1-2 weeks"
2. **Risk level justification**: "(moderate risk per KDIGO)", "(low risk, annual screening)"
3. **What to test**: List specific labs (eGFR, uACR, etc.)
4. **Why this timing**: Brief rationale based on health state

### ❌ NEVER Say:
1. "Follow up as scheduled" without timeframe
2. "Continue monitoring" without specifying when or what
3. Generic "follow up" without specific interval

---

## Integration with Treatment Recommendations

When treatment is initiated, follow-up timing changes:

1. **Immediate (1-2 weeks after starting treatment)**:
   - RAS inhibitor: Check potassium and creatinine
   - SGLT2 inhibitor: Check eGFR and assess tolerability
   - Purpose: Safety monitoring for adverse effects

2. **Then resume normal schedule** based on risk level:
   - Example: "Follow up in 1-2 weeks for safety labs after starting lisinopril. Then resume 6-month monitoring schedule per moderate risk guidelines."

---

## Quality Checks

Every AI recommendation should pass these checks:

- [ ] Includes specific timeframe (not "as scheduled")
- [ ] References risk level (RED/ORANGE/YELLOW/GREEN or High/Moderate/Low)
- [ ] Lists what tests to perform
- [ ] Provides brief rationale for timing
- [ ] Distinguishes clinical labs from home monitoring (if applicable)
- [ ] Adjusts timing if treatment initiated or clinical worsening

---

This timing matrix ensures every patient receives clear, specific follow-up guidance tailored to their risk level and clinical situation.
