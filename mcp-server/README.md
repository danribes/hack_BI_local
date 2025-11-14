# Healthcare MCP Server

Model Context Protocol (MCP) server for the CKD Risk Screening System. Provides structured access to patient data, clinical calculations, and medical guidelines for AI-powered clinical decision support.

## Features

- **Patient Data Retrieval**: Comprehensive patient information including demographics, medical history, and current status
- **Lab Results Query**: Retrieve and interpret laboratory values with clinical context
- **Risk Assessment**: Calculate KDIGO CKD risk classification with recommendations
- **Population Statistics**: Aggregate data across patient populations
- **Clinical Guidelines**: Search KDIGO 2024 practice guidelines

## Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your database credentials
nano .env

# Build TypeScript
npm run build
```

## Development

```bash
# Run in development mode with auto-reload
npm run dev

# Inspect tools
npm run inspect
```

## Available Tools

### 1. get_patient_data
Retrieve comprehensive patient information.

**Input:**
```json
{
  "patient_id": "uuid-string",
  "include_labs": true,
  "include_risk": true
}
```

**Output:**
- Patient demographics
- Vitals (weight, height, BMI)
- Comorbidities
- Medications
- Recent lab results (if requested)
- Risk assessment (if requested)

### 2. query_lab_results
Query laboratory results with filtering.

**Input:**
```json
{
  "patient_id": "uuid-string",
  "observation_type": "eGFR",
  "date_range": {
    "start": "2024-01-01",
    "end": "2024-12-31"
  },
  "limit": 20
}
```

**Output:**
- Lab results with interpretations
- Trend analysis
- Clinical significance

### 3. calculate_ckd_risk
Calculate KDIGO risk classification.

**Input:**
```json
{
  "patient_id": "uuid-string"
}
```

**Output:**
- KDIGO category
- CKD stage
- Risk level (LOW/MODERATE/HIGH/CRITICAL)
- Recommendations
- Monitoring plan

### 4. get_population_stats
Get population-level statistics.

**Input:**
```json
{
  "filters": {
    "has_diabetes": true,
    "on_sglt2i": false
  },
  "group_by": "risk_level"
}
```

**Output:**
- Total and filtered patient counts
- Demographics
- Comorbidity statistics
- Treatment statistics
- Risk distribution

### 5. search_guidelines
Search KDIGO 2024 guidelines.

**Input:**
```json
{
  "topic": "blood pressure",
  "ckd_stage": "G3a"
}
```

**Output:**
- Relevant guidelines
- Recommendations with evidence levels
- Stage-specific notes

## Integration with Claude

### Option 1: Direct MCP Integration (Recommended)

Use the MCP SDK to connect Claude directly to the server:

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const transport = new StdioClientTransport({
  command: 'node',
  args: ['dist/index.js'],
  env: { DATABASE_URL: process.env.DATABASE_URL }
});

const client = new Client({
  name: 'doctor-chat-client',
  version: '1.0.0'
}, {
  capabilities: {}
});

await client.connect(transport);

// List available tools
const tools = await client.listTools();

// Call a tool
const result = await client.callTool({
  name: 'get_patient_data',
  arguments: { patient_id: 'some-uuid' }
});
```

### Option 2: HTTP Wrapper (For Remote Access)

Create an Express wrapper around the MCP server for HTTP/REST access.

## Testing

Test individual tools using the MCP Inspector:

```bash
# Start the inspector
npm run inspect

# In another terminal, use the MCP CLI
npx @modelcontextprotocol/inspector
```

Or test manually:

```bash
# Test patient data retrieval
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_patient_data","arguments":{"patient_id":"test-id"}}}' | node dist/index.js
```

## Architecture

```
┌─────────────────┐
│  Doctor Chat    │
└────────┬────────┘
         │
         │ MCP Protocol
         │
┌────────▼────────┐
│   MCP Server    │
│                 │
│  ┌───────────┐  │
│  │  Tools    │  │
│  └─────┬─────┘  │
│        │        │
│  ┌─────▼─────┐  │
│  │  Database │  │
│  │  Layer    │  │
│  └───────────┘  │
└─────────────────┘
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `NODE_ENV` | Environment mode | `development` |
| `LOG_LEVEL` | Logging level | `info` |

## Error Handling

The server includes comprehensive error handling:

- Database connection errors
- Invalid patient IDs
- Missing lab data
- Query timeouts

All errors return structured JSON with descriptive messages.

## Security Considerations

- **Input Validation**: All inputs are validated using Zod schemas
- **SQL Injection Prevention**: All queries use parameterized statements
- **Data Privacy**: Patient IDs are UUIDs; sensitive data is never logged
- **Rate Limiting**: Consider adding rate limiting for production use
- **Authentication**: Add authentication layer for production deployment

## Performance

- **Connection Pooling**: Max 10 database connections
- **Query Optimization**: Indexed queries on patient_id, observation_type
- **Caching**: Consider implementing Redis for frequently accessed data

## Monitoring

Log all tool invocations for audit and debugging:

```typescript
{
  timestamp: '2025-11-14T12:00:00Z',
  tool: 'get_patient_data',
  patient_id: 'hashed-id',
  duration_ms: 45,
  success: true
}
```

## Deployment

### Local Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

### Docker
```bash
docker build -t healthcare-mcp-server .
docker run -e DATABASE_URL=... healthcare-mcp-server
```

## Contributing

1. Add new tools in `src/tools/`
2. Register tools in `src/index.ts`
3. Update this README with tool documentation
4. Add tests for new functionality

## License

MIT

## Resources

- [MCP Specification](https://spec.modelcontextprotocol.io/)
- [MCP SDK Documentation](https://github.com/modelcontextprotocol/sdk)
- [KDIGO 2024 Guidelines](https://kdigo.org/guidelines/)
