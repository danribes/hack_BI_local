# Agentic Workflow Guide: Multi-MCP Server Architecture

## Overview

This guide demonstrates how to use **multiple MCP servers simultaneously** to create an "agentic workflow" where Claude acts as an autonomous orchestrator across clinical logic, code management, and version control.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Claude Desktop                          │
│                  (Orchestrator / Agent)                     │
└────────────┬────────────┬────────────┬─────────────────────┘
             │            │            │
             ▼            ▼            ▼
    ┌────────────┐  ┌──────────┐  ┌──────────────┐
    │ CKD MCP    │  │ GitHub   │  │ Filesystem   │
    │ Server     │  │ MCP      │  │ MCP Server   │
    └────────────┘  └──────────┘  └──────────────┘
         │               │              │
         ▼               ▼              ▼
    PostgreSQL      GitHub API     Local Files
    Database        (Repos, PRs)   (Code, Docs)
```

## The Three MCP Servers

### 1. Healthcare CKD MCP Server (Clinical Logic)

**Purpose**: Deterministic clinical decision support for CKD patients

**Capabilities**:
- `comprehensive_ckd_analysis` - Master orchestrator for patient assessment
- `calculate_egfr` - CKD-EPI 2021 formula
- `predict_kidney_failure_risk` - KFRE model
- `assess_medication_safety` - Drug dosing based on kidney function
- `analyze_adherence` - Medication and screening compliance
- Phase-based tools (pre-diagnosis, KDIGO classification, treatment, adherence)

**When to use**: Patient clinical assessments, medication safety checks, protocol adherence monitoring

### 2. GitHub MCP Server (Version Control)

**Purpose**: Automated Git operations and repository management

**Capabilities**:
- `create_branch` - Create feature branches
- `create_or_update_file` - Write/update files in repo
- `push_files` - Commit and push changes
- `create_pull_request` - Open PRs with descriptions
- `merge_pull_request` - Merge approved changes
- `search_repositories` - Find repos
- `list_commits` - View commit history

**When to use**: Code commits, PR creation, branch management, code reviews

### 3. Filesystem MCP Server (File Operations)

**Purpose**: Direct file system access for reading/writing local files

**Capabilities**:
- `read_file` - Read file contents
- `write_file` - Create or overwrite files
- `list_directory` - Browse directory structure
- `move_file` - Rename or move files
- `create_directory` - Create new directories

**When to use**: Local file manipulation, code generation, configuration updates

## Setup Instructions

### Step 1: Prerequisites

1. **Node.js** (v18+) - Required for GitHub and Filesystem MCP servers
2. **PostgreSQL** - For CKD patient database
3. **GitHub Personal Access Token** - For GitHub API access

### Step 2: Generate GitHub Token

1. Go to GitHub Settings → Developer Settings → Personal Access Tokens (Classic)
2. Click "Generate new token (classic)"
3. Select scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (Update GitHub Action workflows)
   - ✅ `user` (Read user profile data)
4. Copy token (format: `ghp_...`)

### Step 3: Configure Claude Desktop

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "healthcare-ckd": {
      "command": "node",
      "args": ["/absolute/path/to/hack_BI/mcp-server/dist/index.js"],
      "env": {
        "DATABASE_URL": "postgresql://user:password@localhost:5432/healthcare_db"
      }
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_YOUR_TOKEN_HERE"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/absolute/path/to/hack_BI/backend",
        "/absolute/path/to/hack_BI/frontend",
        "/absolute/path/to/hack_BI/mcp-server"
      ]
    }
  }
}
```

### Step 4: Build the CKD MCP Server

```bash
cd /path/to/hack_BI/mcp-server
npm install
npm run build
```

### Step 5: Restart Claude Desktop

Close and reopen Claude Desktop. You should see three MCP servers connected in the status bar.

## Agentic Workflow Examples

### Example 1: Automated Feature Implementation with PR

**Single Prompt**:
```
I need to add a new feature: Risk stratification alerts for patients overdue on labs.

Please execute this plan:
1. Create a feature branch: feature/risk-alerts
2. Add a new MCP tool: assessRiskAlerts.ts
3. Register it in mcp-server/src/index.ts
4. Add client method in backend/src/services/mcpClient.ts
5. Build and test
6. Commit with message: "Add risk stratification alerts for overdue labs"
7. Create PR with detailed description
```

**What Claude Does** (autonomous tool sequence):
1. `github.create_branch` → Creates `feature/risk-alerts`
2. `filesystem.write_file` → Creates `assessRiskAlerts.ts` with implementation
3. `filesystem.read_file` → Reads `index.ts` to understand structure
4. `filesystem.write_file` → Updates `index.ts` with new tool registration
5. `filesystem.write_file` → Updates `mcpClient.ts` with new method
6. `github.push_files` → Commits all changes
7. `github.create_pull_request` → Opens PR with:
   - Title: "Add risk stratification alerts for overdue labs"
   - Description: Detailed explanation of changes, testing notes, checklist
8. Returns PR URL for your review

### Example 2: Clinical Analysis + Automated Documentation

**Prompt**:
```
Run comprehensive CKD analysis for patient ID "550e8400-e29b-41d4-a716-446655440000"
Then create a clinical summary document and commit it to docs/patient-reports/
```

**Tool Sequence**:
1. `comprehensive_ckd_analysis` → Gets patient assessment with alerts/action plan
2. `filesystem.write_file` → Creates markdown report in docs/patient-reports/
3. `github.push_files` → Commits report with HIPAA-compliant message
4. Returns summary of clinical findings

### Example 3: Multi-Patient Audit with PR

**Prompt**:
```
I need an adherence audit report for all high-risk patients.

1. Query the database for patients with KDIGO Red/Orange risk
2. Run comprehensive_ckd_analysis for each
3. Generate an audit report CSV
4. Create a PR with the audit results and recommendations
```

**Tool Sequence**:
1. Multiple `comprehensive_ckd_analysis` calls (parallel)
2. `filesystem.write_file` → Creates `audit_report_2025_01_15.csv`
3. `filesystem.write_file` → Creates `audit_recommendations.md`
4. `github.create_branch` → `reports/adherence-audit-jan-2025`
5. `github.push_files` → Commits both files
6. `github.create_pull_request` → Opens PR with findings summary

### Example 4: Code Review + Auto-Merge

**Prompt**:
```
Review the code changes in PR #47 for medication safety logic.
If it passes validation (proper error handling, follows CKD-EPI 2021 formula, includes tests),
approve and merge it. Otherwise, leave review comments.
```

**Tool Sequence**:
1. `github.get_file_contents` → Reads changed files from PR
2. `comprehensive_ckd_analysis` → Validates clinical logic against known test cases
3. `filesystem.read_file` → Checks if tests exist
4. **If valid**: `github.merge_pull_request` + `github.delete_branch`
5. **If invalid**: `github.create_review` with specific issues found

## Security Best Practices

### 1. Token Scoping
- Use **fine-grained tokens** (not classic) when possible
- Limit token to specific repositories
- Set token expiration (90 days recommended)

### 2. Environment Variables
- **Never** commit tokens to Git
- Store in environment variables or secrets manager
- Rotate tokens quarterly

### 3. PR Review Requirements
- Always review auto-generated PRs before merging
- Enable branch protection rules on `main`
- Require at least 1 human approval for merges

### 4. Clinical Data Protection
- Patient data should never be committed to Git
- Use patient IDs (UUIDs) instead of PHI in commit messages
- Store reports in HIPAA-compliant locations only

## Troubleshooting

### MCP Server Not Connecting

**Symptom**: Claude Desktop shows "MCP server failed to start"

**Solutions**:
1. Check that Node.js is installed: `node --version`
2. Verify absolute paths in config (no `~` or relative paths)
3. Test server manually:
   ```bash
   node /path/to/mcp-server/dist/index.js
   ```
4. Check logs in Claude Desktop: Help → View Logs

### GitHub Token Issues

**Symptom**: "Authentication failed" or "403 Forbidden"

**Solutions**:
1. Verify token has correct scopes (repo, workflow, user)
2. Check token hasn't expired
3. Test token with curl:
   ```bash
   curl -H "Authorization: token ghp_YOUR_TOKEN" https://api.github.com/user
   ```

### Database Connection Errors

**Symptom**: CKD MCP tools fail with "database connection refused"

**Solutions**:
1. Verify PostgreSQL is running: `pg_isready`
2. Check DATABASE_URL format:
   ```
   postgresql://username:password@localhost:5432/database_name
   ```
3. Ensure database exists and migrations ran:
   ```bash
   cd backend
   npm run migrate
   ```

## Advanced Patterns

### Pattern 1: Conditional Automation

**Prompt**:
```
If any patient in the database has an eGFR < 20 and is still on metformin:
1. Generate a critical safety alert document
2. Create a JIRA ticket (via API)
3. Send email notification (via SendGrid MCP)
4. Create PR with code to prevent future metformin prescriptions at eGFR < 30
```

### Pattern 2: Continuous Integration

**Prompt**:
```
Every time a new medication is added to the patient_medications table:
1. Run assess_medication_safety
2. If contraindications found, create GitHub issue
3. Tag on-call nephrologist
```

### Pattern 3: Documentation Generation

**Prompt**:
```
Generate API documentation for all MCP tools:
1. Read each tool file in mcp-server/src/tools/
2. Extract JSDoc comments and type signatures
3. Generate OpenAPI spec
4. Create PR with updated docs/
```

## Next Steps

1. **Set up the configuration** following Step 3 above
2. **Test with simple prompt**: "List all MCP tools available"
3. **Try Example 1**: Create a small feature with automated PR
4. **Review security checklist** and implement branch protection
5. **Train your team** on using multi-prompt workflows

## Resources

- [MCP Specification](https://modelcontextprotocol.io)
- [GitHub MCP Server Docs](https://github.com/modelcontextprotocol/servers/tree/main/src/github)
- [Filesystem MCP Server Docs](https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem)
- [Our CKD MCP Server Code](../mcp-server/src/index.ts)
- [KDIGO 2024 Guidelines](https://kdigo.org/guidelines/ckd-evaluation-and-management/)

---

**Last Updated**: January 2025
**Author**: Healthcare AI Team
**Status**: Production-Ready
