# Agentic Workflow Prompt Library

This library contains ready-to-use prompts for the multi-MCP server architecture. Copy and paste these prompts into Claude Desktop after setting up all three MCP servers.

---

## 🚀 Quick Start Prompts

### 1. Test Multi-Server Setup

```
Please verify that all MCP servers are connected:
1. List all available tools from the healthcare-ckd server
2. List all available tools from the github server
3. List all available tools from the filesystem server

Show me a summary of which servers are working.
```

**Expected Outcome**: Claude lists all tools from each server, confirming connectivity.

---

## 🏥 Clinical + Documentation Workflows

### 2. Patient Assessment with Auto-Documentation

```
I need a comprehensive clinical assessment for patient ID: 550e8400-e29b-41d4-a716-446655440000

Please:
1. Run comprehensive_ckd_analysis on this patient
2. Create a clinical summary report in docs/patient-summaries/patient_[ID]_[DATE].md
3. Include: risk stratification, critical alerts, action plan, medication safety
4. Commit the report to a new branch: reports/patient-assessment-[DATE]
5. Do NOT create a PR (HIPAA compliance - reports need manual review)
```

**Use Case**: Daily patient rounds documentation

---

### 3. Medication Safety Audit Across All Patients

```
Run a medication safety audit:

1. Query all patients currently taking Jardiance (SGLT2i)
2. For each patient, run assess_medication_safety
3. Identify any with eGFR < 20 (contraindicated) or Type 1 Diabetes
4. Generate a CSV report: medication_safety_audit_[DATE].csv
5. Create a branch and PR with the report
6. Title: "Medication Safety Audit - [DATE]"
```

**Use Case**: Monthly medication reconciliation

---

## 💻 Code Development Workflows

### 4. Feature Implementation: End-to-End Automation

```
Implement a new MCP tool: "predictHospitalizationRisk"

Requirements:
- Use eGFR, uACR, age, and comorbidities
- Return 30-day and 90-day hospitalization risk percentages
- Follow the same pattern as predictKidneyFailureRisk.ts

Plan:
1. Create feature branch: feature/hospitalization-risk
2. Write mcp-server/src/tools/predictHospitalizationRisk.ts
3. Register tool in mcp-server/src/index.ts
4. Add client method in backend/src/services/mcpClient.ts
5. Write unit tests in mcp-server/src/tools/__tests__/predictHospitalizationRisk.test.ts
6. Build and verify compilation
7. Commit with message: "Add hospitalization risk prediction tool"
8. Create PR with description including:
   - Clinical rationale
   - Algorithm explanation
   - Test coverage
   - Example usage

Execute this plan now.
```

**Use Case**: Adding new clinical features

---

### 5. Bug Fix with Automated PR

```
I found a bug in calculateEGFR.ts:
- The function doesn't handle edge case where creatinine = 0
- Should return error instead of NaN

Please:
1. Create branch: fix/egfr-zero-creatinine
2. Read mcp-server/src/tools/calculateEGFR.ts
3. Add input validation to check creatinine > 0
4. If invalid, throw error with message: "Invalid creatinine value: must be > 0"
5. Add test case for this scenario
6. Commit and create PR
7. Reference issue #123 in the PR description
```

**Use Case**: Quick bug fixes

---

## 📊 Reporting & Analytics Workflows

### 6. Generate Adherence Report for All High-Risk Patients

```
Create a comprehensive adherence report:

1. Use comprehensive_ckd_analysis to identify all patients with:
   - Risk category: Red (Very High Risk) or Orange (High Risk)
   - Any overdue screenings (eGFR, uACR, HbA1c)
   - Any medication refill gaps > 10 days

2. Generate two files:
   - reports/adherence_report_[DATE].csv (patient list with metrics)
   - reports/adherence_summary_[DATE].md (executive summary)

3. Create branch: reports/adherence-[MONTH]-[YEAR]
4. Commit both files
5. Create PR titled: "Monthly Adherence Report - [MONTH] [YEAR]"
```

**Use Case**: Monthly quality metrics reporting

---

### 7. Population Health Dashboard Data Export

```
Export population health metrics:

1. Use get_population_stats with filters for:
   - All patients with CKD (eGFR < 60)
   - Group by KDIGO risk level
   - Include medication usage rates (SGLT2i, RAS inhibitor)

2. Create JSON file: frontend/src/data/population_metrics_[DATE].json

3. Update frontend dashboard to use new data

4. Commit changes to branch: data/population-update-[DATE]

5. Create PR with description: "Update population health metrics for dashboard"
```

**Use Case**: Dashboard data refresh

---

## 🔄 Continuous Integration Workflows

### 8. Automated Code Review

```
Review PR #47 for clinical accuracy:

1. Read all changed files in the PR
2. For any files containing eGFR calculations:
   - Verify they use CKD-EPI 2021 formula (not 2009)
   - Check for race coefficient (should NOT be present)
   - Confirm age and sex factors are correct

3. For medication safety changes:
   - Run test cases through the new logic
   - Verify contraindications match KDIGO 2024 guidelines

4. If all validations pass:
   - Leave an approving review comment
   - DO NOT auto-merge (require human approval)

5. If issues found:
   - Leave review comments on specific lines
   - Mark as "Request Changes"
```

**Use Case**: Automated code review assistance

---

### 9. Sync Database Schema to Documentation

```
The database schema has changed. Update documentation:

1. Read backend/prisma/schema.prisma
2. Generate markdown documentation: docs/DATABASE_SCHEMA.md
3. Include:
   - Table descriptions
   - Column types and constraints
   - Relationships between tables
   - Indexes
   - Example queries

4. Create branch: docs/schema-update-[DATE]
5. Commit and create PR
```

**Use Case**: Keep docs in sync with code

---

## 🧪 Testing & Validation Workflows

### 10. Generate Test Patients

```
Create diverse test patient dataset:

1. Generate 10 synthetic patients with varying CKD stages:
   - 2 patients: G1 (eGFR >90), no CKD
   - 2 patients: G3a (eGFR 45-59), moderate CKD
   - 2 patients: G3b (eGFR 30-44), moderate-severe CKD
   - 2 patients: G4 (eGFR 15-29), severe CKD
   - 2 patients: G5 (eGFR <15), kidney failure

2. Include realistic comorbidities (diabetes, hypertension, heart failure)

3. Add medication histories (Jardiance, Lisinopril)

4. Write SQL seed file: backend/prisma/seeds/test_patients.sql

5. Create branch: test/patient-dataset
6. Commit and create PR
```

**Use Case**: Test data generation for QA

---

### 11. Regression Test Suite Execution

```
Run full regression test suite:

1. For each test patient in test_patients.sql:
   - Run comprehensive_ckd_analysis
   - Verify expected risk category matches actual
   - Verify expected alerts are generated
   - Check medication safety recommendations

2. Generate test report: tests/regression_report_[DATE].md

3. If any tests fail:
   - Create GitHub issues for each failure
   - Label as "regression-bug"
   - Assign to @clinical-team

4. Commit test report to branch: tests/regression-[DATE]
```

**Use Case**: Pre-deployment validation

---

## 🔐 Security & Compliance Workflows

### 12. HIPAA Compliance Audit

```
Audit codebase for HIPAA compliance violations:

1. Search all files for:
   - Patient names (look for variables like "patientName", "fullName")
   - SSNs (regex: \d{3}-\d{2}-\d{4})
   - Email addresses containing patient info
   - Console.log statements with patient data

2. Check that all database queries use patient UUIDs (not names/SSNs)

3. Verify all API endpoints require authentication

4. Generate audit report: docs/security/hipaa_audit_[DATE].md

5. If violations found:
   - Create CRITICAL priority GitHub issues
   - Do NOT create PR (security issue should not be publicly visible)
```

**Use Case**: Quarterly compliance audits

---

## 🎯 Multi-Step Complex Workflows

### 13. Complete Feature Lifecycle

```
Implement, test, and deploy "KFRE Risk Stratification Alerts" feature:

PHASE 1: Implementation
1. Create branch: feature/kfre-alerts
2. Add new tool: assessKFREAlerts.ts
   - If 5-year KFRE risk > 40%, generate CRITICAL alert
   - If 5-year KFRE risk 20-40%, generate HIGH alert
   - If 5-year KFRE risk < 20%, no alert
3. Register in MCP server
4. Add backend integration
5. Commit: "Implement KFRE risk stratification alerts"

PHASE 2: Testing
6. Generate 5 test cases (various KFRE risk levels)
7. Run each through assessKFREAlerts
8. Verify correct alert levels
9. Commit: "Add test cases for KFRE alerts"

PHASE 3: Documentation
10. Update docs/CLINICAL_TOOLS.md with new tool
11. Add usage examples
12. Commit: "Document KFRE alert tool"

PHASE 4: PR Creation
13. Create PR with comprehensive description:
    - Clinical rationale (cite KFRE research)
    - Implementation details
    - Test results
    - Screenshots of alerts

Execute all phases now.
```

**Use Case**: End-to-end feature development

---

### 14. Orchestrator Pattern Migration

```
I want to create a second orchestrator tool for diabetes management.

Based on the comprehensive_ckd_analysis pattern:

1. Create comprehensiveDiabetesAnalysis.ts
2. Pipeline should include:
   - HbA1c analysis (target < 7%)
   - Hypoglycemia risk assessment
   - Medication adherence (insulin, metformin)
   - Screening compliance (annual eye exam, foot exam)
   - Cardiovascular risk (ASCVD score)

3. Output format:
   {
     patient_summary: {...},
     critical_alerts: [...],
     action_plan: [...],
     diabetes_details: {...}
   }

4. Register as new tool: comprehensive_diabetes_analysis

5. Create feature branch, commit, and PR

Please implement this following the exact same patterns as the CKD orchestrator.
```

**Use Case**: Extending the orchestrator pattern

---

## 🔧 Maintenance Workflows

### 15. Dependency Update with Testing

```
Update dependencies to latest versions:

1. Read backend/package.json and mcp-server/package.json
2. Update all dependencies to latest stable versions
3. Run npm install in both directories
4. Run build in both directories
5. If build succeeds:
   - Commit with message: "Update dependencies to latest stable versions"
   - Create PR titled: "Dependency Updates - [DATE]"
6. If build fails:
   - Document errors in GitHub issue
   - Do NOT create PR
```

**Use Case**: Monthly dependency maintenance

---

## 💡 Tips for Writing Effective Agentic Prompts

### Structure

```
[GOAL STATEMENT]

[NUMBERED STEP-BY-STEP PLAN]
1. ...
2. ...
3. ...

[VALIDATION CRITERIA]
- Verify X
- Check Y
- Ensure Z

[FINAL ACTION]
Execute this plan now.
```

### Best Practices

1. **Be Specific**: Use exact file paths, branch names, commit messages
2. **Include Validation**: Tell Claude what to check before proceeding
3. **Set Boundaries**: Specify what NOT to do (e.g., "Do NOT auto-merge")
4. **Use UUIDs**: Reference patients by UUID, never by name
5. **Request Summaries**: Ask for summary of actions taken
6. **Error Handling**: Include "If X fails, then Y" instructions

### Common Patterns

```
# Pattern 1: Conditional Logic
If [condition]:
  - Do A
  - Do B
Otherwise:
  - Do C

# Pattern 2: Parallel Operations
For each [item] in [list]:
  - Run [operation]
  - Collect results
Then aggregate and report

# Pattern 3: Validation Chain
1. Execute action
2. Verify success
3. If verified, proceed to next action
4. If failed, rollback and report
```

---

## 📚 Additional Resources

- [Agentic Workflow Guide](./AGENTIC_WORKFLOW_GUIDE.md)
- [MCP Server Documentation](../mcp-server/README.md)
- [Clinical Tools Reference](./CLINICAL_TOOLS.md)
- [Database Schema](./DATABASE_SCHEMA.md)

---

**Last Updated**: January 2025
**Prompt Library Version**: 1.0
**Compatible with**: Claude Desktop + Multi-MCP Setup
