# Healthcare AI MCP Server Protocol

## Overview

This document describes the Model Context Protocol (MCP) server designed for the CKD Risk Screening System. The MCP server provides structured access to patient data, clinical calculations, and medical guidelines for the AI Doctor Assistant.

## Architecture

```
┌─────────────────┐
│  Doctor Chat    │ (Frontend)
│   Component     │
└────────┬────────┘
         │
         │ HTTP/WebSocket
         │
┌────────▼────────┐
│  Backend API    │
│  (Express)      │
└────────┬────────┘
         │
         │ MCP Protocol
         │
┌────────▼────────┐
│   MCP Server    │
│                 │
│  ┌───────────┐  │
│  │  Tools    │  │ - get_patient_data
│  │  Layer    │  │ - query_labs
│  │           │  │ - calculate_risk
│  └─────┬─────┘  │ - get_population_stats
│        │        │ - search_guidelines
│  ┌─────▼─────┐  │
│  │  Data     │  │
│  │  Access   │  │
│  │  Layer    │  │
│  └─────┬─────┘  │
│        │        │
└────────┼────────┘
         │
         │ SQL
         │
┌────────▼────────┐
│   PostgreSQL    │
│    Database     │
└─────────────────┘
```

## MCP Server Capabilities

### 1. **Patient Data Retrieval**
- **Tool**: `get_patient_data`
- **Purpose**: Fetch comprehensive patient information
- **Input**: Patient ID
- **Output**: Demographics, medical history, current conditions, medications

### 2. **Lab Results Query**
- **Tool**: `query_lab_results`
- **Purpose**: Retrieve and interpret laboratory values
- **Input**: Patient ID, observation type (optional), date range (optional)
- **Output**: Lab results with interpretations and trends

### 3. **Risk Assessment**
- **Tool**: `calculate_ckd_risk`
- **Purpose**: Calculate KDIGO risk classification
- **Input**: Patient ID or lab values (eGFR, uACR)
- **Output**: Risk category, stage, recommendations

### 4. **Population Statistics**
- **Tool**: `get_population_stats`
- **Purpose**: Query patient population metrics
- **Input**: Filter criteria (conditions, age, risk level)
- **Output**: Aggregated statistics, counts, distributions

### 5. **Clinical Guidelines**
- **Tool**: `search_guidelines`
- **Purpose**: Retrieve relevant clinical practice guidelines
- **Input**: Condition, topic, keywords
- **Output**: KDIGO 2024 guidelines, recommendations

### 6. **Treatment Recommendations**
- **Tool**: `get_treatment_options`
- **Purpose**: Suggest evidence-based treatments
- **Input**: Patient ID, condition
- **Output**: Medication options, monitoring intervals, referral criteria

## Data Schema

### Patient Context
```typescript
interface PatientContext {
  id: string;
  demographics: {
    mrn: string;
    name: { first: string; last: string };
    age: number;
    gender: string;
  };
  vitals: {
    weight: number;
    height: number;
    bmi: number;
  };
  comorbidities: {
    diabetes: boolean;
    hypertension: boolean;
    heartFailure: boolean;
    cad: boolean;
  };
  medications: {
    rasInhibitor: boolean;
    sglt2i: boolean;
    nephrotoxicMeds: string[];
  };
  status: {
    smokingStatus: string;
    nephrologistReferral: boolean;
  };
}
```

### Lab Result
```typescript
interface LabResult {
  type: string;
  value: number;
  unit: string;
  date: string;
  status: 'normal' | 'abnormal' | 'critical';
  referenceRange: string;
  trend?: 'improving' | 'stable' | 'worsening';
}
```

### Risk Assessment
```typescript
interface RiskAssessment {
  kdigoCategory: string;
  ckdStage: string;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  riskScore: number;
  recommendations: string[];
  monitoring: {
    frequency: string;
    tests: string[];
  };
}
```

## Protocol Flow

### Scenario 1: Doctor Asks About a Patient

```
1. Doctor: "Tell me about patient John Doe"
   │
   ├─→ Frontend sends message to backend
   │
2. Backend calls MCP server: get_patient_data(patient_id)
   │
   ├─→ MCP server queries database
   │
3. MCP returns patient context
   │
4. Backend enhances AI prompt with patient data
   │
5. AI generates response using patient context
   │
6. Response sent to frontend
```

### Scenario 2: Population Query

```
1. Doctor: "How many patients are on SGLT2 inhibitors?"
   │
   ├─→ Frontend sends message to backend
   │
2. Backend detects population query
   │
3. Backend calls MCP: get_population_stats({ medication: 'sglt2i' })
   │
   ├─→ MCP server executes aggregation query
   │
4. MCP returns statistics
   │
5. Backend formats data for AI
   │
6. AI generates natural language response
```

### Scenario 3: Risk Calculation

```
1. Doctor: "What's the CKD risk for patient ID 123?"
   │
2. Backend calls MCP: calculate_ckd_risk(patient_id: '123')
   │
   ├─→ MCP retrieves latest eGFR and uACR
   ├─→ MCP applies KDIGO classification logic
   ├─→ MCP generates recommendations
   │
3. MCP returns risk assessment
   │
4. AI formats as clinical summary
```

## Implementation Requirements

### Technology Stack
- **Runtime**: Node.js 20+
- **Language**: TypeScript
- **MCP SDK**: `@modelcontextprotocol/sdk`
- **Database**: PostgreSQL client (`pg`)
- **Protocol**: Stdio (for local) or HTTP/SSE (for remote)

### Environment Variables
```bash
DATABASE_URL=postgresql://...
MCP_SERVER_PORT=3001
MCP_LOG_LEVEL=info
NODE_ENV=production
```

### Security Considerations

1. **Authentication**: MCP server should verify requests from authorized backend
2. **Data Sanitization**: Validate all inputs to prevent SQL injection
3. **Rate Limiting**: Prevent abuse of expensive queries
4. **HIPAA Compliance**: Log access to patient data for audit trails
5. **Error Handling**: Never expose database errors to clients

## Integration with Doctor Chat

### Current Flow (Without MCP)
```typescript
// backend/src/services/doctorAgent.ts
async chat(messages, context) {
  // Manually fetch patient data
  const patientData = await this.getPatientContext(patientId);

  // Manually fetch population stats
  const popData = await this.checkForPopulationQuery(question);

  // Build prompt with data
  const prompt = buildSystemPrompt(patientData, popData);

  // Call Claude API
  return await anthropic.messages.create({ ... });
}
```

### Enhanced Flow (With MCP)
```typescript
// backend/src/services/doctorAgent.ts
async chat(messages, context) {
  // Claude automatically calls MCP tools as needed
  return await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    tools: mcpServerTools, // Exposed by MCP server
    messages: messages
  });
}
```

## MCP Server Tools Specification

### Tool 1: get_patient_data
```json
{
  "name": "get_patient_data",
  "description": "Retrieve comprehensive patient information including demographics, medical history, and current status",
  "inputSchema": {
    "type": "object",
    "properties": {
      "patient_id": {
        "type": "string",
        "description": "Unique patient identifier (UUID)"
      },
      "include_labs": {
        "type": "boolean",
        "description": "Include recent lab results (default: true)"
      },
      "include_risk": {
        "type": "boolean",
        "description": "Include risk assessment (default: true)"
      }
    },
    "required": ["patient_id"]
  }
}
```

### Tool 2: query_lab_results
```json
{
  "name": "query_lab_results",
  "description": "Query laboratory results for a patient with optional filtering",
  "inputSchema": {
    "type": "object",
    "properties": {
      "patient_id": {
        "type": "string",
        "description": "Patient identifier"
      },
      "observation_type": {
        "type": "string",
        "description": "Type of lab (eGFR, uACR, HbA1c, etc.)",
        "enum": ["eGFR", "uACR", "Creatinine", "HbA1c", "Albumin", "All"]
      },
      "date_range": {
        "type": "object",
        "properties": {
          "start": { "type": "string", "format": "date" },
          "end": { "type": "string", "format": "date" }
        }
      },
      "limit": {
        "type": "number",
        "description": "Maximum results to return (default: 20)"
      }
    },
    "required": ["patient_id"]
  }
}
```

### Tool 3: calculate_ckd_risk
```json
{
  "name": "calculate_ckd_risk",
  "description": "Calculate KDIGO CKD risk classification for a patient",
  "inputSchema": {
    "type": "object",
    "properties": {
      "patient_id": {
        "type": "string",
        "description": "Patient identifier"
      }
    },
    "required": ["patient_id"]
  }
}
```

### Tool 4: get_population_stats
```json
{
  "name": "get_population_stats",
  "description": "Get aggregated statistics across patient population",
  "inputSchema": {
    "type": "object",
    "properties": {
      "filters": {
        "type": "object",
        "properties": {
          "has_diabetes": { "type": "boolean" },
          "has_hypertension": { "type": "boolean" },
          "on_sglt2i": { "type": "boolean" },
          "on_ras_inhibitor": { "type": "boolean" },
          "risk_level": {
            "type": "string",
            "enum": ["LOW", "MODERATE", "HIGH", "CRITICAL"]
          },
          "age_min": { "type": "number" },
          "age_max": { "type": "number" }
        }
      },
      "group_by": {
        "type": "string",
        "enum": ["risk_level", "ckd_stage", "medication", "comorbidity"]
      }
    }
  }
}
```

### Tool 5: search_guidelines
```json
{
  "name": "search_guidelines",
  "description": "Search KDIGO 2024 clinical practice guidelines",
  "inputSchema": {
    "type": "object",
    "properties": {
      "topic": {
        "type": "string",
        "description": "Topic to search (e.g., 'diabetes', 'blood pressure', 'referral')"
      },
      "ckd_stage": {
        "type": "string",
        "description": "CKD stage for stage-specific recommendations"
      }
    },
    "required": ["topic"]
  }
}
```

## Deployment Strategy

### Phase 1: Local Development
1. Run MCP server locally via stdio
2. Test tools individually with CLI
3. Integrate with backend in development mode

### Phase 2: Staging
1. Deploy MCP server as separate service
2. Use HTTP/SSE transport for communication
3. Test with frontend in staging environment

### Phase 3: Production
1. Deploy alongside backend on Render
2. Implement authentication and rate limiting
3. Enable comprehensive logging and monitoring

## Performance Considerations

### Caching
- Cache frequently accessed patient data (5-minute TTL)
- Cache population statistics (15-minute TTL)
- Cache guidelines (24-hour TTL)

### Query Optimization
- Use database indexes on patient_id, observation_type, date
- Limit result sets with pagination
- Use connection pooling (max 10 connections)

### Error Handling
- Retry failed database connections (3 attempts, exponential backoff)
- Return partial results if some tools fail
- Log all errors for debugging

## Testing Strategy

### Unit Tests
- Test each tool independently
- Mock database responses
- Validate input schemas

### Integration Tests
- Test MCP server with real database
- Verify Claude can call tools correctly
- Test error scenarios

### E2E Tests
- Test complete flow: Frontend → Backend → MCP → Database
- Verify responses match expectations
- Test with realistic clinical scenarios

## Monitoring and Observability

### Metrics to Track
- Tool invocation counts by type
- Response times per tool
- Error rates
- Cache hit/miss ratios
- Database query performance

### Logging
```typescript
{
  timestamp: '2025-11-14T12:00:00Z',
  level: 'info',
  tool: 'get_patient_data',
  patient_id: 'xxx-xxx-xxx', // Hashed for privacy
  duration_ms: 45,
  success: true
}
```

## Future Enhancements

1. **Real-time Notifications**: Stream patient alerts via MCP
2. **Predictive Analytics**: Add ML-based risk prediction tools
3. **Multi-language Support**: Guidelines in multiple languages
4. **Image Analysis**: Integrate medical imaging interpretation
5. **EHR Integration**: Connect to external EHR systems via FHIR

## Appendix: MCP Resources

- **MCP Specification**: https://spec.modelcontextprotocol.io/
- **MCP SDK Documentation**: https://github.com/modelcontextprotocol/sdk
- **Example Servers**: https://github.com/modelcontextprotocol/servers
- **Claude MCP Guide**: https://docs.anthropic.com/en/docs/build-with-claude/mcp
