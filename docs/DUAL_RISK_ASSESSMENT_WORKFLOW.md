# Dual Risk Assessment Clinical Workflow: SCORED + Framingham

## Executive Summary

Non-CKD patients require **two complementary assessments** to provide complete clinical care:

1. **SCORED Model (Screening)**: Detects current hidden disease → "Does this patient ALREADY have undetected CKD?"
2. **Framingham Model (Prediction)**: Predicts future 10-year risk → "What is the risk of DEVELOPING CKD in the next 10 years?"

These are **not competing models** — they answer different clinical questions and inform different interventions. RenalGuard AI calculates and displays both simultaneously to enable comprehensive risk assessment.

---

## Table of Contents

- [Understanding the Two Models](#understanding-the-two-models)
- [Clinical Workflow](#clinical-workflow)
- [Risk Level Interpretation](#risk-level-interpretation)
- [Action Guidelines by Risk Combination](#action-guidelines-by-risk-combination)
- [Real-World Clinical Scenarios](#real-world-clinical-scenarios)
- [AI Integration](#ai-integration)
- [Frequently Asked Questions](#frequently-asked-questions)

---

## Understanding the Two Models

### SCORED (Screening for Occult REnal Disease)

**Purpose**: Screening tool to identify patients who likely ALREADY have undetected CKD

**Timeline**: Current/Present

**Question Answered**: "Should I order kidney function tests RIGHT NOW?"

**Method**: Point-based system using demographics and comorbidities

**Scoring**:
- Age 50-59: +2 points
- Age 60-69: +3 points
- Age ≥70: +4 points
- Female: +1 point
- Hypertension: +1 point
- Diabetes: +1 point
- Cardiovascular Disease (MI, stroke, heart failure): +1 point
- Peripheral Vascular Disease: +1 point
- Proteinuria (uACR ≥30 mg/g): +1 point

**Risk Thresholds**:
- **0-3 points (Low Risk)**: Low probability of hidden CKD (~5-10% chance)
- **≥4 points (High Risk)**: **~20% probability** patient ALREADY has undetected CKD

**Key Insight**: SCORED ≥4 means 1 in 5 patients have kidney disease they don't know about. This justifies immediate screening.

---

### Framingham Kidney Disease Risk Score

**Purpose**: Prognostic tool to predict future CKD development in patients with currently normal kidney function

**Timeline**: Next 10 years

**Question Answered**: "How aggressively do I need to PREVENT kidney disease?"

**Method**: Baseline age-based risk with multiplicative risk factors

**Risk Factors**:
- **Age** (exponential with age):
  - <40: 3% baseline
  - 40-49: 5% baseline
  - 50-59: 8% baseline
  - 60-69: 15% baseline
  - ≥70: 25% baseline
- **Diabetes**: ×1.8 (approximately doubles risk)
- **Hypertension**: ×1.6 (~60% increase)
- **Cardiovascular Disease**: ×2.8 (**strongest predictor** - ~180% increase)
- **Current Smoking**: ×1.4 (~40% increase)
- **Former Smoking**: ×1.15 (~15% increase)
- **BMI ≥35 (Class II/III Obesity)**: ×1.5 (~50% increase)
- **BMI ≥30 (Obesity)**: ×1.3 (~30% increase)
- **BMI ≥25 (Overweight)**: ×1.1 (~10% increase)
- **Microalbuminuria (uACR 30-300)**: ×2.2 (~120% increase)
- **Macroalbuminuria (uACR >300)**: ×3.5 (~250% increase)

**Risk Thresholds**:
- **<10% (Low Risk)**: Standard preventive care, routine annual screening
- **10-20% (Moderate Risk)**: Enhanced monitoring, stricter risk factor control
- **>20% (High Risk)**: Aggressive intervention required to "flatten the curve"

**Key Insight**: Framingham >20% means patient is highly likely to develop CKD without intervention. This justifies aggressive prevention NOW.

---

## Clinical Workflow

### Step 1: Initial Assessment (Both Models Calculated Automatically)

When you open a **non-CKD patient** in RenalGuard AI, the system automatically:
1. Calculates SCORED based on age, gender, comorbidities, and current uACR
2. Calculates Framingham based on age, gender, comorbidities, smoking, BMI, and current uACR
3. Displays both results side-by-side

### Step 2: Interpret SCORED (Left Panel - Blue)

**If SCORED ≥4 (HIGH RISK):**

✅ **Immediate Action Required**
- Order comprehensive kidney screening TODAY if not recently done
- Tests needed: Serum creatinine (eGFR), urine albumin-to-creatinine ratio (uACR)
- Rationale: 20% chance this patient ALREADY has undetected CKD

**If SCORED 0-3 (LOW RISK):**

✅ **Routine Screening**
- Annual screening appropriate
- Standard preventive care

---

### Step 3: Interpret Framingham (Right Panel - Purple)

**If Framingham >20% (HIGH RISK):**

✅ **Aggressive Prevention Required NOW**
- **Goal**: Flatten the curve of future kidney decline
- **Interventions**:
  - Consider SGLT2 inhibitors (empagliflozin, dapagliflozin) — kidney-protective even BEFORE CKD diagnosis
  - Consider GLP-1 agonists (semaglutide, dulaglutide) if diabetic or obese
  - Strict BP control: Target <130/80 mmHg (each 10 mmHg reduction = 15% lower CKD risk)
  - Intensive glucose management: HbA1c <7% if diabetic (40% reduction in kidney damage)
  - Smoking cessation if applicable: CRITICAL (current smoking doubles risk)
  - Weight loss if obese: Target BMI <30 (10% weight loss = 25% risk reduction)
- **Monitoring**: Increase frequency to every 3-6 months

**If Framingham 10-20% (MODERATE RISK):**

✅ **Enhanced Monitoring and Risk Factor Modification**
- Optimize BP and glucose control
- Address obesity if present
- Monitor every 6-12 months

**If Framingham <10% (LOW RISK):**

✅ **Standard Preventive Care**
- Routine annual screening
- General lifestyle counseling

---

### Step 4: Review AI Analysis

The AI-generated comment integrates both models and provides:
- **Dual Assessment Explanation**: Why both models were used
- **SCORED Section**: Current hidden disease probability and screening urgency
- **Framingham Section**: Future risk prediction with specific preventive targets
- **Modifiable Risk Factor Targets**: Quantified goals (e.g., "HbA1c <7% reduces future kidney damage by 40%")
- **Critical Thresholds**: Warning signs for transition from at-risk to disease (uACR ≥30, eGFR declining toward 60)

---

## Risk Level Interpretation

### Understanding Risk Combinations

| SCORED | Framingham | Clinical Meaning | Actions |
|--------|-----------|------------------|---------|
| **HIGH (≥4)** | **HIGH (>20%)** | **DOUBLE EMERGENCY**: Likely ALREADY has hidden CKD + high chance of progression | 1. Order screening TODAY<br>2. Start aggressive prevention NOW<br>3. Monitor every 3 months |
| **HIGH (≥4)** | **MODERATE (10-20%)** | Likely has hidden CKD but moderate future risk | 1. Order screening TODAY<br>2. Enhanced monitoring (every 6 months)<br>3. Optimize risk factors |
| **HIGH (≥4)** | **LOW (<10%)** | Likely has hidden CKD but low progression risk (unusual) | 1. Order screening TODAY<br>2. Standard monitoring if normal<br>3. Routine preventive care |
| **LOW (0-3)** | **HIGH (>20%)** | Currently no hidden CKD but high future risk | 1. Routine annual screening<br>2. **AGGRESSIVE PREVENTION** (SGLT2i, strict BP/glucose control)<br>3. Monitor every 3-6 months |
| **LOW (0-3)** | **MODERATE (10-20%)** | Low current risk, moderate future risk | 1. Annual screening<br>2. Strict risk factor modification<br>3. Monitor every 6-12 months |
| **LOW (0-3)** | **LOW (<10%)** | Low current and future risk | 1. Annual screening<br>2. Standard preventive care<br>3. Routine follow-up |

---

## Action Guidelines by Risk Combination

### Scenario A: SCORED HIGH (≥4) + Framingham HIGH (>20%)

**Clinical Situation**: Patient likely ALREADY has hidden CKD AND is at high risk of progression

**Immediate Actions**:
1. ✅ **Order labs TODAY** (eGFR + uACR) if not done in last 3 months
2. ✅ **If labs confirm CKD** (eGFR <60 or uACR ≥30):
   - Classify using KDIGO staging
   - Initiate CKD management per guidelines
   - Consider nephrology referral if Stage 3b or higher
3. ✅ **If labs are surprisingly normal**:
   - Aggressive prevention per Framingham HIGH guidelines
   - Repeat screening in 3-6 months (patient remains high risk)

**Prevention Strategies** (start NOW, don't wait for CKD diagnosis):
- SGLT2 inhibitor (empagliflozin 10mg daily or dapagliflozin 10mg daily)
- Strict BP control: Target <130/80 mmHg
- Intensive glucose control if diabetic: HbA1c <7%
- GLP-1 agonist if diabetic/obese (semaglutide 1mg weekly or dulaglutide 1.5mg weekly)
- Smoking cessation (CRITICAL priority)
- Weight loss if obese: Target 10% reduction
- Cardio-protective medications: ACE-I/ARB, statin

**Monitoring**:
- Every 3 months: eGFR, uACR, BP, HbA1c (if diabetic)

---

### Scenario B: SCORED LOW (0-3) + Framingham HIGH (>20%)

**Clinical Situation**: Patient likely does NOT have hidden CKD currently, but very high risk of developing it in next 10 years

**Immediate Actions**:
1. ✅ **Annual screening** (eGFR + uACR) appropriate for now
2. ✅ **Focus on PREVENTION** to flatten the future risk curve
3. ✅ **Patient education**: "Your kidneys are fine TODAY, but you have a >20% chance of developing kidney disease in the next 10 years unless we control your risk factors NOW"

**Prevention Strategies** (AGGRESSIVE):
- Consider SGLT2 inhibitor prophylactically (especially if diabetic or hypertensive)
- Strict BP control: <130/80 mmHg (each 10 mmHg reduction = 15% lower CKD risk)
- Intensive glucose control if diabetic: HbA1c <7% (40% reduction in future kidney damage)
- Weight loss if BMI ≥30: 10% weight loss = 25% risk reduction
- Smoking cessation if applicable: CRITICAL (smoking doubles kidney disease risk)
- Cardiovascular optimization: ACE-I/ARB, statin, antiplatelet if indicated

**Monitoring**:
- Every 3-6 months: eGFR, uACR, BP, HbA1c (if diabetic)
- Watch for critical thresholds:
  - uACR crossing 30 mg/g (microalbuminuria - first sign of damage)
  - eGFR declining trend (even if still >60)

---

### Scenario C: SCORED HIGH (≥4) + Framingham LOW (<10%)

**Clinical Situation**: Patient likely has hidden CKD NOW, but low risk of future progression (unusual combination)

**Immediate Actions**:
1. ✅ **Order labs TODAY** (eGFR + uACR)
2. ✅ **If labs confirm CKD**:
   - Classify using KDIGO staging
   - Standard CKD management
   - Low progression risk is reassuring
3. ✅ **If labs are normal**:
   - False positive SCORED (can happen)
   - Routine annual screening going forward

**Monitoring**:
- If CKD confirmed: Per KDIGO guidelines (typically every 6-12 months for low-risk CKD)
- If labs normal: Annual screening

---

## Real-World Clinical Scenarios

### Case 1: The "Double High" Emergency

**Patient**: Maria G., 65F
- **Comorbidities**: Type 2 diabetes (HbA1c 8.2%), hypertension (BP 152/88), history of MI 3 years ago
- **Labs**: eGFR 68, uACR 22 mg/g (both still "normal")
- **BMI**: 32 (obese)
- **Smoking**: Former smoker (quit 5 years ago)

**SCORED Calculation**:
- Age 60-69: +3
- Female: +1
- Hypertension: +1
- Diabetes: +1
- CVD (MI): +1
- **Total: 7 points → HIGH RISK**

**Framingham Calculation**:
- Baseline (age 60-69): 15%
- ×1.8 (diabetes) = 27%
- ×1.6 (hypertension) = 43.2%
- ×2.8 (CVD) = **121%** (capped at 80%)
- ×1.15 (former smoking) = 92%
- ×1.3 (obesity, BMI 32) = **80% (final, capped)**

**Clinical Interpretation**:
- **SCORED**: "20% chance Maria ALREADY has undetected CKD despite 'normal' labs"
- **Framingham**: "80% probability of developing CKD in next 10 years" (maximum risk)

**Actions Taken**:
1. ✅ **Immediate screening ordered**: Repeat eGFR + uACR (more comprehensive 24-hour collection)
2. ✅ **Started SGLT2 inhibitor**: Empagliflozin 10mg daily (dual benefit: glucose control + kidney protection)
3. ✅ **Intensified BP control**: Added ACE-I, target <130/80
4. ✅ **Diabetes optimization**: Started semaglutide 1mg weekly (GLP-1 agonist)
5. ✅ **Weight loss program**: Referral to dietitian, target 10% reduction
6. ✅ **Monitoring**: Every 3 months (eGFR, uACR, BP, HbA1c)

**3-Month Follow-Up**:
- Repeat labs showed eGFR 62, uACR 35 mg/g → **CKD Stage 3a-A2 confirmed** (SCORED was correct!)
- HbA1c improved to 7.1%
- BP now 128/78 (at target)
- Weight down 12 lbs
- Patient continues on SGLT2i + GLP-1 agonist with excellent tolerability

**Outcome**: Early detection and aggressive intervention likely prevented progression to advanced CKD. Patient now managed as CKD Stage 3a with close monitoring.

---

### Case 2: The "Low-High" Prevention Success

**Patient**: David L., 58M
- **Comorbidities**: Type 2 diabetes (HbA1c 7.8%), hypertension (BP 138/86)
- **Labs**: eGFR 88, uACR 18 mg/g (both normal)
- **BMI**: 29 (overweight)
- **Smoking**: Never

**SCORED Calculation**:
- Age 50-59: +2
- Hypertension: +1
- Diabetes: +1
- **Total: 4 points → HIGH RISK (borderline)**

**Framingham Calculation**:
- Baseline (age 50-59): 8%
- ×1.8 (diabetes) = 14.4%
- ×1.6 (hypertension) = **23%**
- ×1.1 (overweight, BMI 29) = **25.3% → HIGH RISK**

**Clinical Interpretation**:
- **SCORED**: "Borderline high risk for hidden CKD" (4 points = threshold)
- **Framingham**: "25% risk of developing CKD in next 10 years"

**Actions Taken**:
1. ✅ **Screening ordered**: Confirmed eGFR and uACR normal
2. ✅ **Aggressive prevention initiated**:
   - Started SGLT2 inhibitor (empagliflozin 10mg) — kidney-protective even before CKD
   - Intensified BP control: Target <130/80 mmHg
   - Diabetes optimization: HbA1c target <7%
   - Weight loss counseling: Target 10 lbs reduction
3. ✅ **Monitoring**: Every 6 months (eGFR, uACR, BP, HbA1c)

**12-Month Follow-Up**:
- eGFR stable at 86, uACR remains normal at 15 mg/g
- HbA1c improved to 6.8% (at target)
- BP now 126/78 (at target)
- Weight down 15 lbs (BMI now 26.5)
- **Recalculated Framingham**: Now 18% (moderate risk) due to improved BMI and glucose control

**Outcome**: Aggressive prevention successfully "flattened the curve" — Framingham risk reduced from HIGH to MODERATE. Patient did NOT develop CKD despite high initial risk.

---

### Case 3: The "Low-Low" Reassurance

**Patient**: Jennifer S., 42F
- **Comorbidities**: Mild hypertension (well-controlled on single agent, BP 124/76)
- **Labs**: eGFR 105, uACR 8 mg/g (excellent)
- **BMI**: 23 (normal)
- **Smoking**: Never
- **Other**: No diabetes, no CVD history

**SCORED Calculation**:
- Age <50: 0
- Female: +1
- Hypertension: +1
- **Total: 2 points → LOW RISK**

**Framingham Calculation**:
- Baseline (age <50): 5%
- ×1.6 (hypertension) = **8% → LOW RISK**

**Clinical Interpretation**:
- **SCORED**: "Low probability of hidden CKD"
- **Framingham**: "8% risk of developing CKD in next 10 years (low)"

**Actions Taken**:
1. ✅ **Routine annual screening**: Current labs reassuring
2. ✅ **Standard preventive care**:
   - Continue BP medication (well-controlled)
   - Maintain healthy lifestyle
   - Routine cardiovascular risk management
3. ✅ **Monitoring**: Annual eGFR + uACR

**Outcome**: Patient at low risk. Standard care appropriate. No aggressive intervention needed. Annual monitoring sufficient.

---

## AI Integration

### How the AI Uses Both Models

When you click "Update Records" for a non-CKD patient, the AI receives:

**SCORED Data**:
- Points (0-8+)
- Risk level (low/high)
- Components (which factors contributed)

**Framingham Data**:
- 10-year risk percentage (0-80%)
- Risk level (low/moderate/high)
- Components (which factors contributed with quantified impact)

**Demographics & Comorbidities**:
- Age, gender, BMI, smoking status
- Specific comorbidities (diabetes, hypertension, CVD, PVD)

### AI Analysis Structure

The AI generates a clinical comment that includes:

1. **Dual Assessment Explanation**:
   ```
   This patient requires DUAL assessment:
   1. SCORED (Current Hidden Disease): Answers "Do they ALREADY have undetected kidney damage?"
   2. Framingham (Future Risk Prediction): Answers "What is their risk of DEVELOPING CKD in the next 10 years?"
   ```

2. **SCORED Section** (if points ≥4):
   ```
   SCORED Points: 6 (high risk)
   Clinical Significance: Score ≥4 indicates approximately 20% chance this patient ALREADY has undetected CKD!
   Action Required: Immediate comprehensive kidney screening if not recently done
   ```

3. **Framingham Section**:
   ```
   10-Year Risk: 35.2% (HIGH risk)
   Clinical Interpretation: >20% 10-year risk = HIGH likelihood of developing CKD
   Action Required: Aggressive preventive intervention NOW to "flatten the curve" of future kidney decline

   Preventive Strategies:
   • Consider SGLT2 inhibitors (kidney-protective even before CKD diagnosis)
   • Strict BP control (<130/80 mmHg)
   • Intensive glucose management (HbA1c <7% if diabetic)
   ```

4. **Specific Risk Factor Targets**:
   ```
   • Diabetes control: HbA1c <7% (current control reduces future kidney damage by 40%)
   • BP control: <130/80 mmHg (each 10 mmHg reduction = 15% lower CKD risk)
   • Weight loss: Target BMI <30 (10% weight loss = 25% risk reduction)
   ```

5. **Critical Thresholds to Watch**:
   ```
   • uACR ≥30 mg/g (microalbuminuria): First sign of kidney damage - NOT routine!
   • eGFR declining toward 60: Even if >60, declining trend is concerning
   ```

### Example AI Comment (HIGH/HIGH Patient)

```
CLINICAL SUMMARY:
This 65-year-old female patient with diabetes, hypertension, and prior MI underwent cycle 5 lab update.
Dual risk assessment reveals BOTH high current screening urgency AND high future risk.

COMPREHENSIVE RISK ASSESSMENT:
This patient requires DUAL assessment:
1. SCORED (Current Hidden Disease): Answers "Do they ALREADY have undetected kidney damage?"
2. Framingham (Future Risk Prediction): Answers "What is their risk of DEVELOPING CKD in the next 10 years?"

SCORED Risk Assessment (For Non-CKD At-Risk Patients):
- SCORED Points: 7 (high risk)
- Risk Components: Age 60-69 (+3), Female (+1), Hypertension (+1), Diabetes (+1), Cardiovascular Disease (+1)
- Clinical Significance: Score ≥4 indicates approximately 20% chance this patient ALREADY has undetected CKD!
- Action Required: Immediate comprehensive kidney screening if not recently done

Framingham 10-Year CKD Risk Prediction (For Non-CKD Patients):
- 10-Year Risk: 72.5% (HIGH risk)
- Risk Components:
  • Age 60-69: High baseline risk
  • Diabetes: +80% risk (major factor)
  • Hypertension: +60% risk (major factor)
  • Cardiovascular Disease: +180% risk (strongest predictor)
  • BMI 32.1 (Obesity): +30% risk

- Clinical Interpretation: >20% 10-year risk = HIGH likelihood of developing CKD
- Action Required: Aggressive preventive intervention NOW to "flatten the curve" of future kidney decline
- Preventive Strategies:
  • Consider SGLT2 inhibitors (kidney-protective even before CKD diagnosis)
  • Consider GLP-1 agonists if diabetic/obese
  • Strict BP control (<130/80 mmHg)
  • Intensive glucose management (HbA1c <7% if diabetic)
  • Increase monitoring frequency (every 3-6 months)

Specific Preventive Targets:
  • Diabetes control: HbA1c <7% (current control reduces future kidney damage by 40%)
  • BP control: <130/80 mmHg (each 10 mmHg reduction = 15% lower CKD risk)
  • Weight loss: Target BMI <30 (10% weight loss = 25% risk reduction)
  • Cardio-protective therapy: ACE-I/ARB, statins (reduce cardiorenal syndrome risk)

KEY CHANGES:
• eGFR: 68 → 66 mL/min/1.73m² (declining trend - WATCH CLOSELY)
• uACR: 22 → 28 mg/g (approaching microalbuminuria threshold of 30)
• HbA1c: 8.2% → 8.0% (minimal improvement, needs further optimization)
• BP: 152/88 → 148/86 mmHg (still above target <130/80)

RECOMMENDED ACTIONS:
1. IMMEDIATE: Order comprehensive kidney screening (repeat eGFR + 24-hour urine collection for more accurate assessment)
2. START SGLT2 inhibitor (empagliflozin 10mg daily) - dual benefit for diabetes AND kidney protection
3. Intensify BP control: Add ACE-I, target <130/80 mmHg
4. Optimize diabetes: Consider GLP-1 agonist (semaglutide) to improve HbA1c to <7%
5. Weight loss counseling: Target 10% reduction (high impact on both diabetes and kidney risk)
6. Increase monitoring to every 3 months: Close surveillance given HIGH dual risk

CONCERN LEVEL: CRITICAL - This patient has BOTH high probability of hidden disease NOW and very high risk of future progression. Aggressive intervention is warranted.
```

---

## Frequently Asked Questions

### Q1: Why do we need BOTH models? Isn't one enough?

**A**: No, they answer fundamentally different questions:
- **SCORED** tells you: "Should I screen this patient RIGHT NOW?" (current status)
- **Framingham** tells you: "How hard should I work to PREVENT future disease?" (prevention intensity)

A patient could have:
- HIGH SCORED + LOW Framingham = Has hidden CKD now, but low progression risk
- LOW SCORED + HIGH Framingham = No CKD now, but will develop it without prevention

Both pieces of information are needed for complete care.

---

### Q2: What if SCORED says HIGH but labs are normal?

**A**: This happens in ~80% of SCORED HIGH patients (20% have CKD, 80% don't). This is expected and valuable:
1. You've ruled out hidden CKD (good news for patient)
2. The patient is still at high risk per Framingham, so focus on aggressive prevention
3. Repeat screening in 3-6 months (patient remains high-risk population)

**Remember**: SCORED is a screening tool, not a diagnostic tool. Its job is to identify who needs screening, not to diagnose CKD.

---

### Q3: Can I use just one model based on patient characteristics?

**A**: No, both should be calculated for all non-CKD patients:
- You can't predict which model will be "high" without calculating it
- Patients often have mixed results that inform different interventions
- The AI analysis integrates both models for comprehensive guidance

The system automatically calculates both — there's no extra effort required.

---

### Q4: What if a patient has HIGH risk on both models?

**A**: This is a **DOUBLE EMERGENCY** requiring immediate action:
1. **Immediate**: Order screening TODAY (20% chance of hidden CKD)
2. **Prevention**: Start SGLT2 inhibitor and aggressive risk factor control NOW (high future risk)
3. **Monitoring**: Every 3 months
4. **Expectation**: Many of these patients will have labs confirm CKD on screening

See [Scenario A](#scenario-a-scored-high-4--framingham-high-20) for detailed management.

---

### Q5: Should I still use KDIGO for these patients?

**A**: KDIGO is for patients who **ALREADY HAVE diagnosed CKD**. For non-CKD patients:
- Use SCORED + Framingham (what this system does)
- **IF screening confirms CKD** (eGFR <60 or uACR ≥30), THEN switch to KDIGO staging

The system handles this automatically — when a patient transitions from non-CKD to CKD, it switches from SCORED/Framingham to KDIGO classification.

---

### Q6: How often should I recalculate these scores?

**A**: The system recalculates automatically with each lab update. Key timing:
- **SCORED**: Changes when comorbidities change or uACR crosses 30 mg/g threshold
- **Framingham**: Changes when BMI, smoking status, or comorbidities change
- **Monitoring frequency**: Based on risk level (see table below)

| Risk Combination | Recalculation Frequency |
|------------------|------------------------|
| LOW/LOW | Annually |
| LOW/MODERATE or MODERATE/LOW | Every 6-12 months |
| HIGH/MODERATE or MODERATE/HIGH | Every 3-6 months |
| HIGH/HIGH | Every 3 months |

---

### Q7: Can these models predict who will need dialysis?

**A**: Not directly. These models predict:
- **SCORED**: Risk of having CKD now (any stage)
- **Framingham**: Risk of developing CKD (eGFR <60) in 10 years

For dialysis prediction, you need:
- Confirmed CKD diagnosis
- KDIGO staging (especially Stage 4-5)
- Nephrology evaluation

These models are for **early detection and prevention**, not dialysis prediction.

---

### Q8: What's the evidence base for these models?

**SCORED**:
- Validated in multiple cohorts
- Sensitivity: 72-85% for detecting CKD
- Specificity: 68-73%
- Designed for primary care screening (low-tech, no labs required)

**Framingham Kidney Risk Score**:
- Derived from Framingham Heart Study (8,000+ participants)
- Validated in external cohorts
- C-statistic: 0.78-0.82 (good discrimination)
- Well-established in nephrology guidelines

---

### Q9: How does the AI decide which interventions to recommend?

**A**: The AI uses a structured approach:

1. **SCORED ≥4**: Always recommends immediate screening
2. **Framingham >20%**: Recommends aggressive prevention (SGLT2i, GLP-1, strict BP/glucose targets)
3. **Framingham 10-20%**: Recommends enhanced monitoring and risk factor optimization
4. **Framingham <10%**: Recommends standard care

The AI also considers:
- Specific modifiable risk factors (which comorbidities are present)
- Lab trends (is eGFR declining, is uACR increasing)
- Current treatment status (what's already been tried)

---

### Q10: Can patients see these scores?

**A**: This is a clinical decision. Considerations:

**Pros of sharing**:
- Motivates behavior change ("You have a 35% chance of kidney disease in 10 years")
- Increases adherence to medications
- Empowers patient participation

**Cons of sharing**:
- May cause anxiety (especially HIGH scores)
- Requires explanation (scores can be confusing)
- May overestimate/underestimate individual risk

**Recommendation**: Share the INTERPRETATION, not just the raw scores. For example:
- ✅ "Your risk factors put you at high risk for developing kidney disease, which is why we're being aggressive with prevention"
- ❌ "Your SCORED is 6 and your Framingham is 35.2%"

---

## Summary: Quick Reference Card

### Non-CKD Patient Assessment

```
┌─────────────────────────────────────────────────────────┐
│  STEP 1: SCORED (Screening)                             │
│  • ≥4 points → Order screening NOW (20% hidden CKD)     │
│  • <4 points → Annual screening OK                      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  STEP 2: Framingham (Prevention)                        │
│  • >20% → AGGRESSIVE prevention (SGLT2i, strict control)│
│  • 10-20% → Enhanced monitoring, risk factor optimization│
│  • <10% → Standard preventive care                      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  STEP 3: AI Analysis                                     │
│  • Reviews both models                                   │
│  • Provides specific actionable recommendations         │
│  • Sets monitoring frequency                            │
└─────────────────────────────────────────────────────────┘
```

### Prevention Targets (HIGH Framingham)

- **Blood Pressure**: <130/80 mmHg (each 10 mmHg ↓ = 15% risk ↓)
- **HbA1c** (if diabetic): <7% (40% kidney damage reduction)
- **Weight** (if obese): 10% loss = 25% risk reduction
- **Smoking**: Cessation CRITICAL (current smoking doubles risk)
- **Medications**:
  - SGLT2 inhibitor (empagliflozin/dapagliflozin)
  - GLP-1 agonist (semaglutide/dulaglutide) if diabetic/obese
  - ACE-I/ARB if hypertensive
  - Statin for cardiovascular protection

### Critical Thresholds

- **uACR ≥30 mg/g**: Microalbuminuria - first sign of damage, escalate interventions
- **eGFR <60**: CKD diagnosis - switch to KDIGO staging
- **eGFR declining trend**: Concerning even if >60, increase monitoring

---

## Conclusion

The dual assessment approach using SCORED and Framingham provides clinicians with:
1. **Screening urgency** (do I need to test NOW?)
2. **Prevention intensity** (how aggressive should my interventions be?)
3. **Complete risk profile** (current AND future risk)

RenalGuard AI automatically calculates both models, displays them side-by-side with clear visual distinction, and integrates both into AI-generated clinical recommendations with specific, evidence-based action items.

This approach transforms non-CKD risk assessment from a single-point estimate into a comprehensive dual-timeline evaluation that enables both early detection and aggressive prevention.

---

**Document Version**: 1.0
**Last Updated**: 2025-11-19
**Author**: RenalGuard AI Clinical Team
**System Version**: Includes SCORED + Framingham dual assessment (implemented 2025-11-19)
