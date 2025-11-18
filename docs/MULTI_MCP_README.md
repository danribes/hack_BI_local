# Multi-MCP Server Architecture for Agentic Healthcare Workflows

## 🎯 Vision: From Chatbot to Autonomous Agent

This architecture transforms Claude from a **passive chatbot** into an **autonomous agent** that can:
- Analyze patient data using validated clinical algorithms
- Write and commit code to your repository
- Create pull requests with comprehensive documentation
- Generate reports and update files
- Execute multi-step workflows without human intervention

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      Claude Desktop                             │
│                    (Orchestration Layer)                        │
│                                                                 │
│  Receives: "Run CKD analysis on patient X, generate report,    │
│             commit to Git, and create PR"                       │
│                                                                 │
│  Executes: 15 tool calls across 3 MCP servers autonomously     │
│  Returns: PR URL + clinical summary                            │
└──────────────┬──────────────┬──────────────┬───────────────────┘
               │              │              │
               ▼              ▼              ▼
    ┌──────────────┐  ┌──────────┐  ┌──────────────┐
    │ Healthcare   │  │ GitHub   │  │ Filesystem   │
    │ CKD MCP      │  │ MCP      │  │ MCP Server   │
    │ Server       │  │ Server   │  │              │
    └──────┬───────┘  └────┬─────┘  └──────┬───────┘
           │               │                │
           ▼               ▼                ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │PostgreSQL│    │GitHub API│    │Local Files│
    │ Database │    │(Repos,PRs)│    │ (.ts,.md) │
    └──────────┘    └──────────┘    └──────────┘
```

## 🔧 The Three MCP Servers

### 1️⃣ Healthcare CKD MCP Server (This Project)

**Purpose**: Clinical decision support with deterministic medical logic

**Location**: `/mcp-server/`

**Key Features**:
- **Orchestrator Pattern**: `comprehensive_ckd_analysis` - Single entry point for complete patient assessment
- **Clinical Calculations**: CKD-EPI 2021, KFRE, medication safety
- **Risk Stratification**: KDIGO heatmap (Green/Yellow/Orange/Red)
- **Protocol Adherence**: Monitors screening compliance and medication refills
- **Treatment Opportunities**: Identifies patients eligible for SGLT2i/RAS inhibitor therapy

**Tools** (14 total):
```
🎯 comprehensive_ckd_analysis      # Master orchestrator (USE THIS FIRST!)
   calculate_egfr                  # CKD-EPI 2021 formula
   predict_kidney_failure_risk     # KFRE model
   assess_medication_safety        # Drug dosing by eGFR
   analyze_adherence               # Refill gaps + screening overdue
   check_screening_protocol        # KDIGO 2024 compliance
   assess_pre_diagnosis_risk       # Pre-screening risk
   classify_kdigo                  # KDIGO staging
   assess_treatment_options        # Jardiance/RAS eligibility
   monitor_adherence               # MPR calculation
   get_patient_data                # Patient demographics
   query_lab_results               # Lab history
   get_population_stats            # Cohort analytics
   search_guidelines               # KDIGO lookup
```

### 2️⃣ GitHub MCP Server (Official)

**Purpose**: Version control and repository management

**Installation**: Automatic via `npx @modelcontextprotocol/server-github`

**Key Features**:
- Branch creation and management
- File commits and pushes
- Pull request creation/merging
- Issue creation and management
- Repository search

**Tools**:
```
   create_or_update_file           # Write/update files in repo
   push_files                      # Commit and push changes
   create_branch                   # Create feature branch
   create_pull_request             # Open PR with description
   merge_pull_request              # Merge approved PRs
   create_issue                    # File bugs/features
   search_repositories             # Find repos
   get_file_contents               # Read repo files
   list_commits                    # View commit history
```

### 3️⃣ Filesystem MCP Server (Official)

**Purpose**: Local file system operations

**Installation**: Automatic via `npx @modelcontextprotocol/server-filesystem`

**Key Features**:
- Read/write files locally
- Directory navigation
- File management
- Safe scoped access to allowed directories

**Tools**:
```
   read_file                       # Read file contents
   write_file                      # Create/overwrite file
   list_directory                  # Browse directory
   create_directory                # Make new directory
   move_file                       # Rename/move file
   search_files                    # Find files by pattern
```

## 🚀 Quick Start

### Installation (5 minutes)

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd hack_BI

# 2. Run the automated setup script
./scripts/setup-mcp-config.sh

# The script will:
#   - Detect your OS and Claude config location
#   - Build the CKD MCP server
#   - Prompt for GitHub token
#   - Prompt for database URL
#   - Generate claude_desktop_config.json
#   - Test connections
#   - Display next steps

# 3. Restart Claude Desktop

# 4. Verify setup
# In Claude Desktop, ask: "List all available MCP tools"
# You should see ~30 tools across 3 servers
```

### Manual Installation

If you prefer manual setup, see [AGENTIC_WORKFLOW_GUIDE.md](./AGENTIC_WORKFLOW_GUIDE.md#setup-instructions)

## 💡 Usage Examples

### Example 1: Clinical Assessment → Report → Git Commit

**Single Prompt**:
```
Run comprehensive CKD analysis for patient 550e8400-e29b-41d4-a716-446655440000
Then create a clinical report in docs/patient-reports/ and commit it to Git.
```

**What Claude Does** (autonomous sequence):
1. `comprehensive_ckd_analysis` → Gets patient data, calculates eGFR, stratifies risk, checks adherence
2. `write_file` → Creates `docs/patient-reports/patient_550e8400_2025_01_15.md` with findings
3. `create_branch` → Creates `reports/patient-assessment-2025-01-15`
4. `push_files` → Commits with message: "Add clinical assessment for patient 550e8400"
5. Returns summary: eGFR, risk level, critical alerts, action plan, and Git commit SHA

**Time Saved**: ~15 minutes (vs manual assessment, documentation, Git operations)

---

### Example 2: Implement Feature → Test → PR

**Single Prompt**:
```
Implement a new MCP tool: "assessDiabeticRetinopathyRisk"

Requirements:
- Uses HbA1c, diabetes duration, hypertension status
- Returns Low/Moderate/High risk
- Recommends eye exam frequency

Create the tool, add tests, and open a PR.
```

**What Claude Does**:
1. `write_file` → Creates `mcp-server/src/tools/assessDiabeticRetinopathyRisk.ts`
2. `read_file` → Reads `index.ts` to understand registration pattern
3. `write_file` → Updates `index.ts` with new tool
4. `write_file` → Updates `mcpClient.ts` with client method
5. `write_file` → Creates `__tests__/assessDiabeticRetinopathyRisk.test.ts`
6. `create_branch` → Creates `feature/diabetic-retinopathy-risk`
7. `push_files` → Commits all changes
8. `create_pull_request` → Opens PR with:
   - Title: "Add diabetic retinopathy risk assessment tool"
   - Description: Clinical rationale, algorithm, test coverage, usage examples
9. Returns PR URL for review

**Time Saved**: ~45 minutes (vs manual coding, testing, Git operations, PR creation)

---

### Example 3: Medication Safety Audit → Issue Creation

**Single Prompt**:
```
Audit all patients taking Metformin.
If any have eGFR < 30, create a GitHub issue for each with CRITICAL priority.
```

**What Claude Does**:
1. `get_population_stats` → Finds all patients on Metformin
2. `comprehensive_ckd_analysis` (parallel) → Assesses each patient
3. Filters for eGFR < 30 (Metformin contraindication threshold)
4. For each contraindicated patient:
   - `create_issue` → Creates GitHub issue:
     - Title: "CRITICAL: Metformin contraindication for patient [UUID]"
     - Labels: `critical`, `medication-safety`, `nephrology`
     - Body: Patient summary, eGFR value, clinical recommendation
5. Returns list of created issues

**Time Saved**: ~2 hours (vs manual review of medication lists and EHR lookup)

---

## 📊 Real-World Workflow: Monthly Quality Report

This demonstrates the full power of the agentic architecture:

**Prompt**:
```
Generate the monthly CKD quality report for January 2025:

1. Identify all high-risk patients (KDIGO Red/Orange)
2. Check screening compliance (eGFR, uACR, HbA1c)
3. Check medication adherence (SGLT2i, RAS inhibitors)
4. Generate CSV report with patient list
5. Generate markdown executive summary
6. Create PR titled "Monthly Quality Report - January 2025"
```

**Claude's Execution** (30+ tool calls):

**Phase 1: Data Collection**
- `get_population_stats` → Get all CKD patients
- `comprehensive_ckd_analysis` (x50 in parallel) → Assess each patient
- Aggregates results in memory

**Phase 2: Analysis**
- Calculates metrics:
  - % patients with overdue labs
  - Medication adherence rates
  - eGFR decline rates (rapid progressors)
  - Treatment gap analysis (eligible but not on therapy)

**Phase 3: Report Generation**
- `write_file` → Creates `reports/quality_report_jan_2025.csv`
  - Columns: Patient ID, Risk Level, eGFR, Last Lab Date, Days Overdue, Medications, Alerts
- `write_file` → Creates `reports/quality_summary_jan_2025.md`
  - Executive summary with key metrics
  - Charts (markdown tables)
  - Action items by priority

**Phase 4: Git Operations**
- `create_branch` → `reports/quality-jan-2025`
- `push_files` → Commits both files
- `create_pull_request` → Opens PR with comprehensive description

**Result**: Complete quality report in ~3 minutes (vs ~4 hours of manual work)

---

## 🔐 Security & Compliance

### HIPAA Compliance

✅ **Safe Practices**:
- Use patient UUIDs (never names/SSNs) in Git commits
- Store reports in HIPAA-compliant locations (not public repos)
- Audit logs automatically tracked in Git history
- Database access controlled via environment variables

❌ **Prohibited**:
- Never commit PHI (Protected Health Information) to Git
- Never use patient names in branch names or commit messages
- Never use Claude for diagnosis or treatment decisions (clinical decision support only)

### GitHub Token Security

```bash
# Generate token with minimal required scopes
Scopes needed:
  ✓ repo          # Access private repositories
  ✓ workflow      # Update GitHub Actions
  ✓ user          # Read user profile

# Rotate token quarterly
# Store in environment variable (not in code)
# Never commit claude_desktop_config.json to Git
```

### Database Access

```bash
# Use read-only database user for reporting queries
# Use write-access user only for specific operations
# Enable SSL for database connections in production
# Audit all database queries via logging
```

---

## 🎓 Learning Path

### Beginner: Test the Setup
1. ✅ Run setup script
2. ✅ Verify all 3 servers connected
3. ✅ Try prompt: "List all MCP tools"
4. ✅ Run Example 1 (clinical assessment)

### Intermediate: Automation
1. ✅ Try 5 prompts from [AGENTIC_PROMPTS_LIBRARY.md](./AGENTIC_PROMPTS_LIBRARY.md)
2. ✅ Create your own custom workflow prompt
3. ✅ Review auto-generated PR, merge it
4. ✅ Set up scheduled reports (e.g., weekly adherence audit)

### Advanced: Multi-Step Orchestration
1. ✅ Implement new clinical tool end-to-end (code → test → PR)
2. ✅ Create conditional workflows (if X then Y else Z)
3. ✅ Set up CI/CD integration (auto-test on PR creation)
4. ✅ Build custom MCP server for your specific needs

---

## 📚 Documentation Index

| Document | Purpose |
|----------|---------|
| [AGENTIC_WORKFLOW_GUIDE.md](./AGENTIC_WORKFLOW_GUIDE.md) | Complete setup guide, architecture explanation, troubleshooting |
| [AGENTIC_PROMPTS_LIBRARY.md](./AGENTIC_PROMPTS_LIBRARY.md) | 15+ ready-to-use prompts for common workflows |
| [MULTI_MCP_README.md](./MULTI_MCP_README.md) | This file - overview and quick start |
| [../mcp-server/README.md](../mcp-server/README.md) | CKD MCP Server technical documentation |
| [CLINICAL_TOOLS.md](./CLINICAL_TOOLS.md) | Clinical algorithm details (CKD-EPI, KFRE, KDIGO) |

---

## 🐛 Troubleshooting

### "MCP server failed to start"

**Check**:
```bash
# Verify Node.js installed
node --version  # Should be v18+

# Test MCP server manually
node /path/to/mcp-server/dist/index.js

# Check Claude logs
# macOS: ~/Library/Logs/Claude/
# Windows: %APPDATA%/Claude/logs/
```

### "GitHub authentication failed"

**Check**:
```bash
# Test token
curl -H "Authorization: token ghp_YOUR_TOKEN" https://api.github.com/user

# Verify token scopes at:
# https://github.com/settings/tokens
```

### "Database connection refused"

**Check**:
```bash
# Test connection
psql "postgresql://user:pass@localhost:5432/db" -c "SELECT 1"

# Verify PostgreSQL running
pg_isready

# Check DATABASE_URL in config
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json | grep DATABASE_URL
```

---

## 🚀 Next Steps

1. **Run Setup**: `./scripts/setup-mcp-config.sh`
2. **Test Connection**: Open Claude Desktop, ask "List all MCP tools"
3. **Try Example**: Copy Example 1 prompt and run it
4. **Explore Library**: Browse [AGENTIC_PROMPTS_LIBRARY.md](./AGENTIC_PROMPTS_LIBRARY.md)
5. **Build Custom Workflow**: Create your own multi-step automation

---

## 🤝 Contributing

To add new clinical tools to the CKD MCP server:

```bash
# 1. Create new tool file
# mcp-server/src/tools/yourTool.ts

# 2. Register in index.ts
# Add to TOOLS array and switch statement

# 3. Add client method
# backend/src/services/mcpClient.ts

# 4. Test with Claude Desktop
# Prompt: "Call [your_tool_name] with ..."

# 5. Document in CLINICAL_TOOLS.md
```

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/hack_BI/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/hack_BI/discussions)
- **Documentation**: [docs/](../docs/)

---

**Last Updated**: January 2025
**Architecture Version**: 1.0
**Status**: Production-Ready ✅
