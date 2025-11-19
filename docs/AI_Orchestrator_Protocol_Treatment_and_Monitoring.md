# AI Orchestrator Protocol for Treatment and Monitoring Recommendations

## Purpose
This protocol ensures that the AI orchestrator systematically evaluates and recommends:
1. **Treatment initiation** for CKD patients not currently on therapy
2. **Home monitoring** (Minuteful Kidney/RenalGuard) for appropriate patients
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

3. **RenalGuard/Minuteful Kidney Monitoring**:
   - Recommended: yes/no
   - Frequency: Weekly, Bi-weekly, Monthly
   - Rationale (clinical justification)
   - Cost-effectiveness assessment

### Phase 3: AI Analysis with Enhanced Context
**Tool**: `aiUpdateAnalysisService.analyzePatientUpdate`

**Enhanced Requirements**:
1. **Input MUST include**:
   - Current treatment status (Active/Not Active)
   - Current monitoring status (Active/Not Active)
   - **Phase 3 treatment recommendations** (Jardiance, RAS inhibitor, RenalGuard)
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
   - If monitoring status is "NOT ON MONITORING" AND RenalGuard is recommended → recommend initiation
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
- [ ] Include RenalGuard/Minuteful monitoring recommendations
- [ ] Add explicit instructions to check treatment/monitoring gaps

### For Recommended Actions Output
- [ ] Specific medication recommendations (not generic "consider treatment")
- [ ] Specific monitoring device and frequency
- [ ] Reference to evidence base (EMPA-KIDNEY, KDIGO guidelines)
- [ ] Safety monitoring requirements

## Validation Criteria

### For a patient like Betty Anderson (G3a-A1, Moderate CKD, Not on Treatment/Monitoring):

**Expected AI Recommendations MUST include**:
1. ✅ **Monitoring**: "Recommend initiating Minuteful Kidney home monitoring (Monthly frequency) for CKD Stage 3a"
2. ✅ **Treatment Evaluation**: If diabetes present → "Consider SGLT2 inhibitor (Moderate indication)"
3. ✅ **Treatment Evaluation**: If eGFR declining → "Consider RAS inhibitor (Moderate indication for CKD without significant albuminuria)"
4. ✅ **Follow-up**: "Monitor eGFR and uACR every 6-12 months per moderate risk guidelines"
5. ❌ **Should NOT say**: "Continue monitoring" without specific recommendations (this is inadequate for new CKD diagnosis)

### Success Metrics:
- 100% of patients transitioning to CKD Stage 3+ receive treatment initiation evaluation
- 100% of patients with eGFR <60 receive home monitoring recommendation
- 100% of patients with diabetes + CKD receive SGLT2i evaluation
- 100% of patients with uACR ≥30 receive RAS inhibitor evaluation

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

## Audit Trail

Each AI analysis should log:
- Whether Phase 3 was called
- Treatment recommendations from Phase 3 (Jardiance, RAS inhibitor, RenalGuard)
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
