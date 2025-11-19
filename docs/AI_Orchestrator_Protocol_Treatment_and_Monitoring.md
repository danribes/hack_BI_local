# AI Orchestrator Protocol for Treatment and Monitoring Recommendations

## Purpose
This protocol ensures that the AI orchestrator systematically evaluates and recommends:
1. **Treatment initiation** for CKD patients not currently on therapy
2. **Home monitoring** (Minuteful Kidney - FDA-cleared smartphone uACR test) for appropriate patients
3. **Treatment optimization** for patients already on therapy

## Critical Issue Addressed
**Problem**: Patients transitioning to moderate or higher CKD stages (e.g., G3a) were receiving AI analyses that did not recommend treatment initiation or home monitoring, even when clinically indicated.

**Root Cause**: The AI analysis service was not calling the Phase 3 Treatment Decision tool, which contains sophisticated logic for treatment and monitoring recommendations.

## Enhanced Protocol

### Phase 1: Patient Classification and Context
**Tool**: `phase2KDIGOClassification` or KDIGO utility
**Output**:
- GFR Category (G1-G5)
- Albuminuria Category (A1-A3)
- Health State (e.g., G3a-A1)
- Risk Level (low, moderate, high, very_high)

### Phase 2: Treatment Decision Analysis
**Tool**: `phase3TreatmentDecision` (assessTreatmentOptions)
**MUST be called for**: All CKD patients (eGFR <60 OR uACR ≥30 OR has diabetes/hypertension)

**Output includes**:
1. **Jardiance (SGLT2i) Recommendation**:
   - Indication level: STRONG, MODERATE, CONTRAINDICATED, NOT_INDICATED
   - Evidence base (EMPA-KIDNEY trial, KDIGO grade)
   - Safety monitoring requirements
   - Specific reasoning

2. **RAS Inhibitor Recommendation**:
   - Indication level: STRONG, MODERATE, CONTRAINDICATED, NOT_INDICATED
   - Evidence base (KDIGO grade 1A for albuminuria)
   - Safety considerations (hyperkalemia, creatinine monitoring)
   - Specific reasoning

3. **Minuteful Kidney Home Monitoring** (FDA-cleared smartphone uACR test):
   - Recommended: yes/no
   - Frequency: Weekly, Bi-weekly, Monthly
   - Rationale (clinical justification)
   - **Adherence Benefits**:
     * **At-home convenience**: Removes logistical barriers (transportation, time off work, clinic visits)
     * **High usability**: 99% usability success rate across ages 18-80; computer vision eliminates dipstick reading errors
     * **Instant feedback**: Smartphone results with immediate EMR integration increase patient engagement
     * **Proven effectiveness**: ~50% completion rate in previously non-compliant populations; ~90% patient preference for home testing
     * **Clinical outcomes**: Early detection of kidney function changes; may prevent ER visits and hospitalizations

### Phase 3: AI Analysis with Enhanced Context
**Tool**: `aiUpdateAnalysisService.analyzePatientUpdate`

**Enhanced Requirements**:
1. **Input MUST include**:
   - Current treatment status (Active/Not Active)
   - Current monitoring status (Active/Not Active)
   - **Phase 3 treatment recommendations** (Jardiance, RAS inhibitor, Minuteful Kidney)
   - KDIGO risk level and health state
   - Lab value changes from previous cycle

2. **AI Prompt MUST contain**:
   ```
   - Phase 3 Treatment Recommendations:
     * Jardiance: [STRONG/MODERATE/NOT_INDICATED] - [rationale]
     * RAS Inhibitor: [STRONG/MODERATE/NOT_INDICATED] - [rationale]
     * Home Monitoring (Minuteful Kidney): [Recommended/Not Recommended] - [frequency] - [rationale]
   ```

3. **AI Analysis MUST check**:
   - If treatment status is "NOT ON TREATMENT" AND Phase 3 indicates STRONG/MODERATE → recommend initiation
   - If monitoring status is "NOT ON MONITORING" AND Minuteful Kidney is recommended → recommend initiation
   - If already on treatment but worsening → recommend optimization
   - If already being monitored → acknowledge and continue

### Phase 4: Specific Checks for Treatment/Monitoring Gaps

#### Treatment Initiation Check
**Triggers**:
- Patient transitions to CKD stage ≥3 (eGFR <60) AND not on treatment
- Patient develops significant albuminuria (uACR ≥30) AND not on RAS inhibitor
- Patient has diabetes + CKD AND not on SGLT2i

**AI Response Template**:
```
"Patient has progressed to [health state] with [risk level] risk.

Treatment Recommendations:
- [Jardiance/RAS inhibitor]: Phase 3 analysis indicates [STRONG/MODERATE] indication based on [evidence]
- Consider initiating [medication] therapy
- Safety monitoring: [specific labs to monitor]

Rationale: [clinical justification from Phase 3]"
```

#### Home Monitoring Initiation Check
**Triggers**:
- CKD with eGFR <60 OR uACR ≥30
- Diabetes with CKD risk factors
- Patient on SGLT2i therapy (higher priority)

**AI Response Template**:
```
"Home Monitoring Recommendation:
- Minuteful Kidney Kit: Recommended
- Frequency: [Weekly/Bi-weekly/Monthly based on severity]
- Rationale: [clinical justification from Phase 3]
- Benefits: Early detection of changes, improved patient engagement, potential prevention of complications"
```

## Implementation Checklist

### For AI Analysis Service (aiUpdateAnalysisService.ts)
- [ ] Import and call `assessTreatmentOptions` from Phase 3
- [ ] Include Phase 3 recommendations in patient context
- [ ] Add Phase 3 recommendations to AI prompt
- [ ] Ensure treatment/monitoring status is clearly indicated
- [ ] Validate that AI checks status before making recommendations

### For AI Prompt (buildAnalysisPrompt method)
- [ ] Add section for Phase 3 Treatment Recommendations
- [ ] Include detailed treatment indication levels
- [ ] Include Minuteful Kidney/Minuteful monitoring recommendations
- [ ] Add explicit instructions to check treatment/monitoring gaps

### For Recommended Actions Output
- [ ] Specific medication recommendations (not generic "consider treatment")
- [ ] Specific monitoring device and frequency
- [ ] Reference to evidence base (EMPA-KIDNEY, KDIGO guidelines)
- [ ] Safety monitoring requirements

## Critical Distinctions

### Two Types of Monitoring - MUST Be Distinguished

**Problem**: AI was saying "continue monitoring" without specifying which type, leading to confusion.

**Solution**: ALWAYS distinguish between:

1. **Clinical/Lab Monitoring**
   - Scheduled clinic visits and laboratory blood/urine tests
   - ALWAYS ongoing for CKD patients
   - Frequency based on KDIGO risk level:
     * RED (Very High): Every 1-3 months
     * ORANGE (High): Every 3-6 months
     * YELLOW (Moderate): Every 6-12 months
     * GREEN (Low): Annually
   - Example: "Continue scheduled lab monitoring every 6-12 months per moderate risk guidelines"

2. **Home Monitoring (Minuteful Kidney)**
   - FDA-cleared smartphone uACR device for at-home testing BETWEEN clinic visits
   - Only initiated when Phase 3 recommends it
   - Frequency: Weekly, Bi-weekly, or Monthly
   - Example: "Initiate Minuteful Kidney home monitoring (Monthly frequency) for at-home uACR tracking between clinic visits"

**Required Format**: Both types must be specified
- ✅ CORRECT: "Continue scheduled lab monitoring every 6-12 months. Initiate Minuteful Kidney home monitoring (Monthly) for at-home uACR tracking."
- ❌ WRONG: "Continue monitoring and follow up as scheduled" (too vague)

## Enhanced Analysis Requirements

### Biomarker Evolution (Section 8 of AI Prompt)

AI MUST comment on trends for:

**A. eGFR Trends**
- Compare current to previous value
- Quantify change: "eGFR declined from 58 to 54 mL/min/1.73m² (7% decrease)"
- Contextualize: "This represents gradual progression / concerning decline / stable function"
- Integration with treatment:
  * Untreated + declining → "Progressive decline without treatment - URGENT need for therapy"
  * Treated + stable → "Current treatment effective in stabilizing kidney function"
  * Treated + declining → "Despite treatment, declining - consider optimization"

**B. uACR Trends**
- Compare current to previous value
- Quantify change: "Albuminuria increased from 45 to 68 mg/g (51% increase)"
- Note category changes: "Progressed from A1 (normal) to A2 (moderate albuminuria)"
- Integration with treatment:
  * On RAS inhibitor → "Expect 30-40% proteinuria reduction with therapy"

**C. Clinical Significance Thresholds**
- eGFR decline >5 mL/min/year = rapid progression
- eGFR decline 2-5 mL/min/year = moderate progression
- uACR doubling = significant worsening

### Comorbidity Assessment (Section 9 of AI Prompt)

AI MUST address impact of comorbidities on CKD:

**A. Diabetes Impact**
- Comment on HbA1c control and kidney disease impact
- HbA1c >8%: "Poor glycemic control accelerates kidney damage - intensify diabetes management"
- Diabetic CKD without SGLT2i: "SGLT2 inhibitor provides dual benefit for diabetes AND kidney protection"

**B. Hypertension Impact**
- Comment on BP control
- BP ≥140/90: "Uncontrolled hypertension accelerates CKD progression"
- Target <130/80 for CKD patients
- Hypertensive CKD with albuminuria: "RAS inhibitor provides BP control AND kidney protection"

**C. Heart Failure Impact**
- If present: "SGLT2 inhibitors provide cardiovascular AND kidney protection"

**D. Integrated Recommendations**
- Diabetes + CKD → "SGLT2 inhibitor for dual benefit"
- Hypertension + Albuminuria → "RAS inhibitor for BP control and proteinuria reduction"
- Diabetes + Hypertension + CKD → "Both RAS inhibitor AND SGLT2 inhibitor for comprehensive disease modification"

### Follow-Up Timing Requirements (Section 10 of AI Prompt)

**CRITICAL**: AI MUST provide specific follow-up timeframes - NEVER use vague "follow up as scheduled"

**A. CKD Patients - Based on KDIGO Risk Level**

Follow-up intervals from `/docs/FOLLOW_UP_TIMING_MATRIX.md`:

- **RED (Very High Risk)** - G4, G5, A3 (any G), G3b-A2:
  * Clinical labs: Every 1-3 months
  * Required phrase: "Schedule follow-up in 1-3 months (very high risk per KDIGO)"
  * Tests: Comprehensive metabolic panel, eGFR, creatinine, uACR, CBC, electrolytes, BP

- **ORANGE (High Risk)** - G3a-A2, G3b-A1:
  * Clinical labs: Every 3-6 months
  * Required phrase: "Schedule follow-up in 3-6 months (high risk per KDIGO)"
  * Tests: eGFR, creatinine, uACR, electrolytes, BP check

- **YELLOW (Moderate Risk)** - G1/G2-A2, G3a-A1:
  * Clinical labs: Every 6-12 months
  * Required phrase: "Schedule follow-up in 6-12 months (moderate risk per KDIGO)"
  * Tests: eGFR, uACR, routine monitoring, BP check

- **GREEN (Low Risk)** - G1/G2-A1:
  * Clinical labs: Annually
  * Required phrase: "Schedule annual follow-up in 12 months (low risk per KDIGO)"
  * Tests: eGFR, uACR screening

**B. Non-CKD Patients - Based on Risk Factors**

- **High Risk** (Diabetes + Hypertension OR multiple risk factors):
  * Follow-up: Every 6-12 months
  * Required phrase: "Schedule follow-up in 6-12 months (high risk - multiple CKD risk factors present)"
  * Tests: eGFR, uACR, comprehensive metabolic panel, HbA1c, BP

- **Moderate Risk** (Single risk factor: diabetes OR hypertension OR age >60 OR family history):
  * Follow-up: Annually
  * Required phrase: "Schedule annual follow-up in 12 months (moderate risk - single CKD risk factor present)"
  * Tests: eGFR, uACR, basic metabolic panel, BP

- **Low Risk** (G1/G2-A1, no significant risk factors, age <60):
  * Follow-up: Every 1-2 years
  * Required phrase: "Schedule follow-up in 1-2 years for routine health maintenance"
  * Tests: eGFR, uACR screening

**C. Timing Modifiers**

When to shorten intervals:
- Rapid eGFR decline (>5 mL/min/year) → Shorten by 50%
- Significant uACR increase (>50%) → Shorten by 3-6 months
- New treatment initiated → 1-2 weeks for safety labs, then resume normal schedule
- Health state progression (A1→A2, G3a→G3b) → Shorten by one tier

**D. Required Format**

✅ CORRECT Examples:
- "Schedule follow-up in 6 months (moderate risk per KDIGO). Next labs: eGFR, uACR, electrolytes."
- "URGENT: Schedule follow-up in 1-3 months (very high risk - RED). Tests: comprehensive metabolic panel, eGFR, uACR, CBC."

❌ WRONG Examples:
- "Follow up as scheduled" (no timeframe)
- "Continue monitoring" (no specific interval)
- "Monitor kidney function" (vague)

## Validation Criteria

### For a patient like Betty Anderson (G3a-A1, Moderate CKD, Not on Treatment/Monitoring):

**Expected AI Recommendations MUST include**:
1. ✅ **Biomarker Evolution**: "eGFR declined from [X] to [Y] mL/min/1.73m² - represents [gradual progression/concerning decline]"
2. ✅ **Clinical Lab Monitoring**: "Continue scheduled lab monitoring every 6-12 months per moderate risk guidelines"
3. ✅ **Home Monitoring**: "Initiate Minuteful Kidney home monitoring (Monthly frequency) for at-home uACR tracking between clinic visits"
4. ✅ **Treatment Evaluation**: If diabetes present → "Consider SGLT2 inhibitor (Moderate indication for dual glycemic and kidney benefit)"
5. ✅ **Treatment Evaluation**: If eGFR declining → "Consider RAS inhibitor (Moderate indication for CKD without significant albuminuria)"
6. ✅ **Comorbidity Integration**: If diabetes + hypertension → "Address diabetes control (HbA1c [X]%) and BP management (BP [X]/[Y])"
7. ❌ **Should NOT say**: "Continue monitoring" without specifying clinical vs. home monitoring

### For a patient like Shirley Anderson (G2-A2, Mild CKD with moderate albuminuria, Not on Treatment/Monitoring):

**Expected AI Recommendations MUST include**:
1. ✅ **Biomarker Evolution**: "uACR increased from [X] to [Y] mg/g - progressed to A2 category (moderate albuminuria)"
2. ✅ **Clinical Lab Monitoring**: "Continue scheduled lab monitoring every 6-12 months per moderate risk guidelines (YELLOW/KDIGO)"
3. ✅ **Home Monitoring**: "Initiate Minuteful Kidney home monitoring (Monthly frequency) for at-home uACR tracking between clinic visits"
4. ✅ **Treatment - RAS Inhibitor**: "Initiate RAS inhibitor therapy (STRONG indication - KDIGO Grade 1A for albuminuria, proven 30-40% proteinuria reduction)"
5. ✅ **Treatment - SGLT2i**: If diabetes present → "Consider SGLT2 inhibitor for dual glycemic and kidney benefit"
6. ✅ **Comorbidity Integration**: Address hypertension (if present) → "RAS inhibitor provides BP control AND kidney protection"
7. ❌ **Should NOT say**: "Continue monitoring and follow up as scheduled" without distinguishing clinical vs. home monitoring
8. ❌ **Should NOT say**: "Consider initiating therapy" without being specific about which medication

**Why Both Monitoring Types Are Needed**:
- **Clinical Lab Monitoring**: Standard follow-up every 6-12 months for comprehensive metabolic panel, eGFR, uACR, BP check
- **Home Monitoring (Minuteful Kidney)**: Monthly at-home uACR testing BETWEEN clinic visits to detect early changes in albuminuria
- **Rationale**: Albuminuria can fluctuate; monthly home testing provides trend data that 6-month clinic visits would miss

### For a patient like Helen Campbell (G2-A1, Non-CKD, Low Risk, Age 84, No significant risk factors):

**Expected AI Recommendations MUST include**:
1. ✅ **Follow-Up Timing**: "Schedule annual follow-up in 12 months for routine kidney screening (low risk per KDIGO)"
2. ✅ **Specific Labs**: "Next labs (in 12 months): eGFR, serum creatinine, uACR, basic metabolic panel, blood pressure check"
3. ✅ **Rationale**: "G2-A1 with normal kidney function and no significant risk factors. Annual screening adequate per KDIGO guidelines."
4. ❌ **Should NOT say**: "Follow up as scheduled" without specifying timeframe
5. ❌ **Should NOT say**: "Continue monitoring" without stating when (12 months)

**Why Specific Timing Matters**:
- **Prevents ambiguity**: Patient and clinic staff know exactly when next appointment should be
- **Risk-appropriate**: Annual screening matches low-risk profile per KDIGO guidelines
- **Actionable**: Clear timeframe enables scheduling and patient compliance

### Success Metrics:
- 100% of patients transitioning to CKD Stage 3+ receive treatment initiation evaluation
- 100% of patients with eGFR <60 receive home monitoring recommendation
- 100% of patients with diabetes + CKD receive SGLT2i evaluation
- 100% of patients with uACR ≥30 receive RAS inhibitor evaluation
- 100% of AI analyses distinguish between clinical monitoring and home monitoring
- 100% of AI analyses comment on biomarker trends (eGFR, uACR)
- 100% of AI analyses address comorbidity impact when relevant (diabetes, hypertension, heart failure)
- 100% of AI analyses include specific follow-up timeframes (never "as scheduled")

## Error Prevention

### Common Mistakes to Avoid:
1. ❌ **Generic recommendations**: "Continue monitoring and follow up"
   - ✅ **Specific**: "Initiate Minuteful Kidney monitoring (Monthly), consider RAS inhibitor for albuminuria"

2. ❌ **Ignoring treatment status**: Recommending "continue treatment" when patient is NOT on treatment
   - ✅ **Status-aware**: Check treatment status field first, then recommend initiation vs. continuation

3. ❌ **Missing Phase 3 call**: Using only KDIGO classification without detailed treatment analysis
   - ✅ **Complete analysis**: Always call Phase 3 for CKD patients

4. ❌ **Vague monitoring advice**: "Monitor kidney function"
   - ✅ **Specific**: "Minuteful Kidney Kit, Monthly frequency, monitors uACR for early detection"

5. ❌ **Vague follow-up timing**: "Follow up as scheduled" or "Continue monitoring"
   - ✅ **Specific**: "Schedule follow-up in 6 months (moderate risk per KDIGO). Next labs: eGFR, uACR, electrolytes."

6. ❌ **Missing timeframe justification**: "Follow up in 6 months" without explaining why
   - ✅ **Justified**: "Schedule follow-up in 6 months (moderate risk - YELLOW per KDIGO). G3a-A1 requires regular monitoring."

## Audit Trail

Each AI analysis should log:
- Whether Phase 3 was called
- Treatment recommendations from Phase 3 (Jardiance, RAS inhibitor, Minuteful Kidney)
- Patient treatment/monitoring status
- Final AI recommendations
- Whether recommendations match Phase 3 guidance

## Escalation Protocol

If AI analysis does NOT recommend treatment/monitoring when Phase 3 indicates STRONG or MODERATE indication:
1. Log warning to console
2. Create alert for manual review
3. Flag in audit trail for quality improvement

## Review and Updates

This protocol should be reviewed:
- After every CKD patient cycle analysis
- Monthly for quality metrics
- When new clinical guidelines are published (KDIGO updates, new trial data)
