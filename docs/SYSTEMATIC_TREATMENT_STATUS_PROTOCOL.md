# Systematic Treatment and Monitoring Status Protocol

## Problem Statement

**Issue Identified**: Lisa Anderson (MRN000944, G3b-A2, Treatment Status: Active) received AI recommendations stating:
- "Patient not currently on CKD treatment - consider initiating therapy"
- "Consider initiating CKD treatment per clinical guidelines"

This is **INCORRECT** because the patient is **already on active CKD treatment**.

**Root Cause**: AI not properly checking or respecting the treatment status field before making recommendations, leading to contradictory and potentially confusing advice for clinicians.

---

## Critical Requirements

### 1. Treatment Status MUST Be Verified FIRST

Before ANY treatment recommendation, the AI MUST:

1. **Read** the `Treatment Status` field from Patient Context
2. **Determine** if patient is:
   - `Active (...)` → Patient IS currently on treatment
   - `NOT ON TREATMENT` → Patient is NOT currently on treatment
3. **Base ALL recommendations** on this status

### 2. Monitoring Status MUST Be Verified FIRST

Before ANY monitoring recommendation, the AI MUST:

1. **Read** the `Monitoring Status` field from Patient Context
2. **Determine** if patient is:
   - `Active (...)` → Patient IS currently being monitored at home
   - `NOT ON MONITORING` → Patient is NOT currently on home monitoring
3. **Base ALL recommendations** on this status

### 3. Recommendations MUST Match Current Status

**Golden Rule**: The AI's recommendations must be **logically consistent** with the current treatment/monitoring status.

| Current Status | ✅ CORRECT Recommendation | ❌ WRONG Recommendation |
|----------------|---------------------------|-------------------------|
| Treatment: Active | "Continue current CKD treatment", "Optimize therapy", "Adjust dosing" | "Initiate treatment", "Consider starting therapy" |
| Treatment: NOT ON TREATMENT | "Initiate RAS inhibitor", "Start SGLT2 inhibitor" | "Continue current treatment", "Maintain therapy" |
| Monitoring: Active | "Continue Minuteful Kidney monitoring", "Maintain home testing schedule" | "Initiate home monitoring", "Consider starting Minuteful Kidney" |
| Monitoring: NOT ON MONITORING | "Initiate Minuteful Kidney home monitoring (Monthly)" | "Continue home monitoring", "Maintain current testing" |

---

## Systematic Verification Checklist

Every AI analysis MUST follow this checklist:

### Step 1: Status Verification (MANDATORY FIRST STEP)

- [ ] Read `Treatment Status` field from Patient Context
- [ ] Read `Monitoring Status` field from Patient Context
- [ ] Determine current state:
  - Treatment: Active OR Not on Treatment
  - Monitoring: Active OR Not on Monitoring
- [ ] Log status to internal reasoning: "Patient treatment status: [Active/Not on Treatment]"

### Step 2: Biomarker Analysis

- [ ] Compare current vs previous eGFR (absolute change, percentage, trend)
- [ ] Compare current vs previous uACR (absolute change, percentage, trend)
- [ ] Assess health state change (e.g., G3a→G3b, A1→A2)
- [ ] Determine if patient is stable, improving, or worsening

### Step 3: Treatment Recommendation Logic

#### IF Treatment Status = Active:

- [ ] Check if patient is stable/improving:
  - ✅ "Continue current CKD treatment - appears effective"
  - ✅ "Maintain current regimen (RAS inhibitor + SGLT2i)"
  - ✅ "Current treatment shows benefit - kidney function stable"

- [ ] Check if patient is worsening:
  - ✅ "Optimize current CKD therapy - consider dose adjustment"
  - ✅ "Treatment optimization needed - eGFR declining despite therapy"
  - ✅ "Add additional disease-modifying agent (e.g., SGLT2i if not on one)"
  - ✅ "Nephrology referral for treatment intensification"

- [ ] **NEVER** say:
  - ❌ "Initiate CKD treatment" (already on treatment!)
  - ❌ "Consider starting therapy" (already started!)
  - ❌ "Patient not currently on treatment" (contradicts status!)

#### IF Treatment Status = NOT ON TREATMENT:

- [ ] Check Phase 3 Treatment Decision Analysis for recommendations
- [ ] If Phase 3 shows STRONG/MODERATE indication:
  - ✅ "Initiate RAS inhibitor therapy (STRONG indication - KDIGO Grade 1A)"
  - ✅ "Start SGLT2 inhibitor (Jardiance) - EMPA-KIDNEY trial showed 28% risk reduction"
  - ✅ Include specific evidence and reasoning from Phase 3

- [ ] If CKD Stage 3+ without Phase 3 analysis:
  - ✅ "Initiate disease-modifying CKD therapy per KDIGO guidelines"
  - ✅ "Start nephroprotective medications - RAS inhibitor and/or SGLT2i"

- [ ] If worsening kidney function:
  - ✅ "URGENT: Initiate CKD treatment immediately - progressive decline detected"
  - ✅ "Recommend immediate nephrology referral and treatment initiation"

- [ ] **NEVER** say:
  - ❌ "Continue current treatment" (no treatment to continue!)
  - ❌ "Optimize therapy" (no therapy to optimize!)
  - ❌ "Maintain current regimen" (no regimen exists!)

### Step 4: Monitoring Recommendation Logic

#### IF Monitoring Status = Active:

- [ ] Acknowledge home monitoring is active:
  - ✅ "Continue Minuteful Kidney home monitoring - provides valuable trend data"
  - ✅ "Maintain current home testing schedule (Monthly/Bi-weekly/Weekly)"
  - ✅ "Home monitoring active - review recent uACR trends from device"

- [ ] If monitoring frequency needs adjustment:
  - ✅ "Increase Minuteful Kidney frequency to Weekly (worsening kidney function)"
  - ✅ "Consider more frequent home testing given recent eGFR decline"

- [ ] **NEVER** say:
  - ❌ "Initiate home monitoring" (already initiated!)
  - ❌ "Consider starting Minuteful Kidney" (already active!)

#### IF Monitoring Status = NOT ON MONITORING:

- [ ] Check Phase 3 recommendations for Minuteful Kidney
- [ ] If Phase 3 shows "Recommended: YES":
  - ✅ "Initiate Minuteful Kidney home monitoring (Monthly frequency)"
  - ✅ Include rationale and adherence benefits from Phase 3
  - ✅ "Start at-home uACR testing between clinic visits"

- [ ] If CKD patient without Phase 3 recommendation:
  - ✅ "Evaluate patient for Minuteful Kidney home monitoring"
  - ✅ "Consider at-home uACR monitoring for trend data"

- [ ] **NEVER** say:
  - ❌ "Continue home monitoring" (not started yet!)
  - ❌ "Maintain Minuteful Kidney testing" (not active!)

### Step 5: Follow-Up Timing

- [ ] Specify exact timeframe based on KDIGO risk level (see `/docs/FOLLOW_UP_TIMING_MATRIX.md`)
- [ ] Include risk justification (RED/ORANGE/YELLOW/GREEN or High/Moderate/Low)
- [ ] List specific tests to order
- [ ] **NEVER** use vague phrases like "follow up as scheduled"

### Step 6: Final Validation

Before generating final output:

- [ ] Re-read treatment status - does my recommendation match?
- [ ] Re-read monitoring status - does my recommendation match?
- [ ] Check for contradictions: Am I saying "initiate" for someone already treated?
- [ ] Check for vague timing: Did I specify exact follow-up interval?
- [ ] Check for specificity: Did I name specific medications/frequencies?

---

## Implementation in AI Prompt

### Current Prompt Structure

The AI prompt already includes treatment/monitoring status at line 396-397:

```
- Treatment Status: ${context.treatmentActive ? `Active (${context.treatmentType || 'Unknown'})` : 'NOT ON TREATMENT'}
- Monitoring Status: ${context.monitoringActive ? `Active${context.monitoringDevice ? ` (${context.monitoringDevice})` : ''}` : 'NOT ON MONITORING'}
```

And instructions at lines 426-453 about checking status first.

### Enhancement Needed

The AI instructions need to be **MORE PROMINENT** and **IMPOSSIBLE TO MISS**. Proposed enhancement:

```markdown
**🚨 CRITICAL: STATUS VERIFICATION REQUIRED BEFORE ALL RECOMMENDATIONS 🚨**

STEP 1: LOOK AT THESE TWO FIELDS IN THE "PATIENT CONTEXT" SECTION ABOVE:
========================================================================
- Treatment Status: [Will show "Active (...)" OR "NOT ON TREATMENT"]
- Monitoring Status: [Will show "Active (...)" OR "NOT ON MONITORING"]

STEP 2: INTERNAL REASONING (Required):
========================================================================
Before making ANY recommendation, you MUST state internally:
- "Patient treatment status: [Active/Not on Treatment]"
- "Patient monitoring status: [Active/Not on Monitoring]"

STEP 3: APPLY RECOMMENDATION LOGIC:
========================================================================
IF Treatment Status = "Active (...)":
  → Patient IS on treatment
  → Use: "Continue current treatment", "Optimize therapy", "Adjust regimen"
  → NEVER use: "Initiate treatment", "Start therapy", "Consider starting"

IF Treatment Status = "NOT ON TREATMENT":
  → Patient is NOT on treatment
  → Use: "Initiate RAS inhibitor", "Start SGLT2 inhibitor"
  → NEVER use: "Continue treatment", "Maintain therapy", "Optimize current regimen"

IF Monitoring Status = "Active (...)":
  → Patient IS being monitored at home
  → Use: "Continue home monitoring", "Maintain Minuteful Kidney testing"
  → NEVER use: "Initiate home monitoring", "Start Minuteful Kidney"

IF Monitoring Status = "NOT ON MONITORING":
  → Patient is NOT being monitored at home
  → Use: "Initiate Minuteful Kidney monitoring", "Start at-home testing"
  → NEVER use: "Continue home monitoring", "Maintain testing schedule"

**VALIDATION**: Before submitting your response, ask yourself:
- "Does my treatment recommendation match the treatment status?" (YES/NO)
- "Does my monitoring recommendation match the monitoring status?" (YES/NO)
- If either is NO, REVISE your recommendations!
```

---

## Example Cases

### Case 1: Lisa Anderson (G3b-A2, Treatment Status: Active)

**Patient Context**:
- Treatment Status: Active (RAS Inhibitor + SGLT2i)
- Monitoring Status: Active (Minuteful Kidney Kit)
- Current: eGFR 38 mL/min/1.73m², uACR 95 mg/g
- Previous: eGFR 40 mL/min/1.73m², uACR 90 mg/g
- Change: eGFR declined 2 units, uACR increased 5.6%

**✅ CORRECT AI Response**:
```json
{
  "commentText": "Lab update shows mild kidney function decline despite active treatment.",
  "clinicalSummary": "Patient on active CKD treatment (RAS inhibitor + SGLT2i). eGFR declined from 40 to 38 mL/min/1.73m² (-5%). uACR increased from 90 to 95 mg/g (+5.6%). G3b-A2 classification maintained (very high risk per KDIGO). Current treatment shows partial benefit (uACR relatively stable), but declining eGFR suggests need for treatment optimization.",
  "keyChanges": [
    "eGFR declined from 40 to 38 mL/min/1.73m² (-5% decline)",
    "uACR increased from 90 to 95 mg/g (+5.6% increase)",
    "Health state remains G3b-A2 (very high risk)"
  ],
  "recommendedActions": [
    "Continue current CKD treatment (RAS inhibitor + SGLT2i) - shows partial benefit with stable albuminuria",
    "Optimize therapy - consider dose adjustment of current medications given declining eGFR",
    "Continue Minuteful Kidney home monitoring (Active) - review recent uACR trends from device",
    "Schedule follow-up in 1-3 months (very high risk - RED per KDIGO). Next labs: comprehensive metabolic panel, eGFR, creatinine, uACR, electrolytes, CBC",
    "Nephrology referral for treatment optimization if eGFR continues to decline"
  ],
  "severity": "warning",
  "concernLevel": "moderate"
}
```

**❌ WRONG AI Response** (What happened):
```json
{
  "commentText": "Routine lab update completed.",
  "clinicalSummary": "Routine lab update completed. Patient not currently on CKD treatment - consider initiating therapy.",
  "keyChanges": ["Lab values updated"],
  "recommendedActions": [
    "Consider initiating CKD treatment per clinical guidelines",
    "Follow up as scheduled"
  ],
  "severity": "info",
  "concernLevel": "none"
}
```

**Problems with WRONG response**:
1. ❌ Says "not currently on CKD treatment" when Treatment Status = Active
2. ❌ Recommends "initiating" treatment when already active
3. ❌ Vague "follow up as scheduled" without specific timeframe
4. ❌ No acknowledgment of declining eGFR
5. ❌ No acknowledgment of active home monitoring
6. ❌ Severity downgraded to "info" when should be "warning" for declining kidney function

---

### Case 2: Patient NOT on Treatment (Correct Initiation)

**Patient Context**:
- Treatment Status: NOT ON TREATMENT
- Monitoring Status: NOT ON MONITORING
- Health State: G3a-A2 (Moderate CKD, moderate albuminuria)
- Phase 3: RAS Inhibitor STRONG indication, Minuteful Kidney recommended Monthly

**✅ CORRECT AI Response**:
```json
{
  "commentText": "New CKD diagnosis - treatment initiation recommended.",
  "clinicalSummary": "Patient has Moderate CKD (G3a-A2) and is NOT currently on treatment. Phase 3 analysis shows STRONG indication for RAS inhibitor therapy (KDIGO Grade 1A - proven 30-40% proteinuria reduction). Minuteful Kidney home monitoring recommended for monthly at-home uACR tracking.",
  "keyChanges": [
    "Transitioned to Moderate CKD (G3a-A2)",
    "uACR 85 mg/g - moderate albuminuria (A2 category)",
    "Treatment not yet initiated"
  ],
  "recommendedActions": [
    "Initiate RAS inhibitor therapy (lisinopril or losartan) - STRONG indication (KDIGO Grade 1A) for albuminuria reduction",
    "Safety labs in 1-2 weeks after starting RAS inhibitor: check potassium and creatinine",
    "Initiate Minuteful Kidney home monitoring (Monthly frequency) for at-home uACR tracking between clinic visits",
    "Schedule follow-up in 6-12 months after treatment initiation (moderate risk - YELLOW per KDIGO)",
    "Monitor blood pressure - target <130/80 mmHg for kidney protection"
  ],
  "severity": "warning",
  "concernLevel": "moderate"
}
```

---

## Quality Assurance Checks

### Automated Validation (Recommended Enhancement)

Add server-side validation logic to catch contradictions:

```typescript
function validateAIRecommendations(
  treatmentActive: boolean,
  monitoringActive: boolean,
  recommendations: string[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check for treatment contradictions
  if (treatmentActive) {
    const hasInitiatePhrase = recommendations.some(r =>
      /initiat(e|ing) (ckd )?treatment/i.test(r) ||
      /start(ing)? therapy/i.test(r) ||
      /consider starting/i.test(r)
    );
    if (hasInitiatePhrase) {
      errors.push('AI recommended initiating treatment for patient already on active treatment');
    }
  } else {
    const hasContinuePhrase = recommendations.some(r =>
      /continue (current )?treatment/i.test(r) ||
      /maintain (current )?therapy/i.test(r) ||
      /optimize (current )?therapy/i.test(r)
    );
    if (hasContinuePhrase) {
      errors.push('AI recommended continuing treatment for patient not on treatment');
    }
  }

  // Check for monitoring contradictions
  if (monitoringActive) {
    const hasInitiateMonitoring = recommendations.some(r =>
      /initiat(e|ing) (home )?monitoring/i.test(r) ||
      /start(ing)? minuteful kidney/i.test(r)
    );
    if (hasInitiateMonitoring) {
      errors.push('AI recommended initiating monitoring for patient already on active monitoring');
    }
  } else {
    const hasContinueMonitoring = recommendations.some(r =>
      /continue (home )?monitoring/i.test(r) ||
      /maintain minuteful kidney/i.test(r)
    );
    if (hasContinueMonitoring) {
      errors.push('AI recommended continuing monitoring for patient not on monitoring');
    }
  }

  // Check for vague follow-up timing
  const hasVagueTiming = recommendations.some(r =>
    /follow up as scheduled/i.test(r) && !/\d+\s+(month|week|year)/i.test(r)
  );
  if (hasVagueTiming) {
    errors.push('AI used vague follow-up timing without specific interval');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
```

### Manual Review Checklist

For each AI analysis, reviewers should check:

- [ ] Treatment recommendation matches treatment status (Active vs Not on Treatment)
- [ ] Monitoring recommendation matches monitoring status (Active vs Not on Monitoring)
- [ ] Specific medications named (not "consider therapy" - which drugs?)
- [ ] Specific follow-up timing (not "as scheduled" - when exactly?)
- [ ] Biomarker trends quantified (not "stable" - by how much?)
- [ ] Severity appropriate for clinical situation
- [ ] No contradictory statements in summary vs recommendations

---

## Training and Documentation

### For AI Prompt Engineers

- Always include treatment/monitoring status in patient context
- Make status verification instructions PROMINENT (use emojis, caps, separators)
- Provide explicit if-then logic for each status combination
- Include validation step at end of prompt
- Test with both active and not-on-treatment scenarios

### For Clinical Reviewers

- Check AI recommendations against patient status in UI
- Flag any contradictions immediately
- Review Phase 3 analysis to ensure AI incorporated evidence
- Verify specific timing/medications are provided

### For Developers

- Ensure `treatmentActive` and `monitoringActive` fields are correctly populated from database
- Implement automated validation checks (see above)
- Log AI analysis with status snapshot for audit trail
- Add UI warning if status changes after AI analysis generated

---

## Success Metrics

- **100% of AI analyses** match treatment status (no "initiate" for active, no "continue" for not-on-treatment)
- **100% of AI analyses** match monitoring status (no "initiate" for active, no "continue" for not-on-monitoring)
- **100% of AI analyses** include specific follow-up timing (no "as scheduled")
- **0 contradictory recommendations** flagged in quality review
- **<1% false positive rate** on automated validation checks

---

## Escalation Protocol

If contradiction is detected:

1. **Automated Detection**: Server validation catches contradiction before saving to database
2. **Flag for Review**: Mark analysis as "Needs Review" with specific error message
3. **Retry AI Analysis**: Regenerate with enhanced prompt if validation fails
4. **Manual Override**: Allow clinician to manually edit if AI repeatedly fails
5. **Log for Improvement**: Track all validation failures for prompt engineering refinement

---

This protocol ensures every AI recommendation is **logically consistent, clinically appropriate, and actionable** based on the patient's current treatment and monitoring status.
