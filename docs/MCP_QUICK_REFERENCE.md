# MCP Quick Reference Card

## 🎯 The Three Servers

| Server | Purpose | Example Tool |
|--------|---------|--------------|
| **healthcare-ckd** | Clinical logic | `comprehensive_ckd_analysis` |
| **github** | Version control | `create_pull_request` |
| **filesystem** | File operations | `write_file` |

## ⚡ Most Used Tools

### Clinical Assessment
```
comprehensive_ckd_analysis(patient_id)
→ Complete patient assessment with alerts + action plan
```

### Code Management
```
create_branch(branch_name)
write_file(path, content)
push_files(files, message)
create_pull_request(title, body)
```

### File Operations
```
read_file(path)
write_file(path, content)
list_directory(path)
```

## 📋 Common Workflows

### 1. Clinical Report
```
Run comprehensive_ckd_analysis for patient [UUID]
Create report in docs/reports/
Commit to Git with message "Clinical assessment [DATE]"
```

### 2. Feature Development
```
Create branch: feature/[name]
Implement tool: [tool_name]
Add tests
Create PR with description
```

### 3. Monthly Report
```
Get all high-risk patients
Run analysis on each
Generate CSV + summary
Create PR: "Monthly Report - [MONTH]"
```

## 🔑 Setup Checklist

- [ ] Run `./scripts/setup-mcp-config.sh`
- [ ] Get GitHub token: https://github.com/settings/tokens/new
- [ ] Set DATABASE_URL
- [ ] Restart Claude Desktop
- [ ] Test: "List all MCP tools"

## 🚨 Safety Rules

✅ **DO**:
- Use patient UUIDs (never names)
- Review PRs before merging
- Rotate GitHub token quarterly
- Store reports in HIPAA-compliant locations

❌ **DON'T**:
- Commit PHI to Git
- Auto-merge critical changes
- Share GitHub token
- Use patient names in branches

## 📖 Full Documentation

- [Setup Guide](./AGENTIC_WORKFLOW_GUIDE.md)
- [Prompt Library](./AGENTIC_PROMPTS_LIBRARY.md)
- [Architecture](./MULTI_MCP_README.md)
- [Troubleshooting](./AGENTIC_WORKFLOW_GUIDE.md#troubleshooting)

## 🔧 Troubleshooting

**MCP server not connecting?**
```bash
# Check logs
tail -f ~/Library/Logs/Claude/mcp*.log

# Test manually
node /path/to/mcp-server/dist/index.js
```

**GitHub auth failed?**
```bash
# Test token
curl -H "Authorization: token ghp_XXX" \
  https://api.github.com/user
```

**Database error?**
```bash
# Test connection
psql "$DATABASE_URL" -c "SELECT 1"
```

## 💡 Pro Tips

1. **Use the orchestrator**: `comprehensive_ckd_analysis` does 6 checks in one call
2. **Parallel operations**: Claude can run multiple patients in parallel
3. **Conditional logic**: Use "If X then Y" in your prompts
4. **Validate first**: Add "verify success before proceeding" to prompts
5. **Be specific**: Use exact file paths and branch names

## 🎓 Example Prompts

**Quick Test**:
```
List all MCP tools and group by server
```

**Clinical Workflow**:
```
Run comprehensive CKD analysis for patient [UUID]
Show me critical alerts and action plan
```

**Development Workflow**:
```
Create a new branch feature/[name]
Add file mcp-server/src/tools/[name].ts with [functionality]
Register it in index.ts
Create PR
```

**Reporting Workflow**:
```
Get all patients with eGFR < 30
Generate CSV report
Commit to reports/critical-ckd-[DATE]
```

---

**Quick Links**:
- GitHub Token: https://github.com/settings/tokens
- Setup Script: `./scripts/setup-mcp-config.sh`
- Config File: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Version**: 1.0 | **Last Updated**: January 2025
