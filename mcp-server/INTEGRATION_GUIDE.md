# MCP Server Integration Guide

This guide explains how to integrate the Healthcare MCP Server with the Doctor Chat component.

## Integration Architecture

```
Frontend (React)
    ↓
Backend Express API
    ↓
Doctor Agent Service ←→ MCP Server ←→ PostgreSQL
    ↓
Anthropic Claude API (with MCP tools)
```

## Step 1: Install MCP SDK in Backend

Add the MCP client SDK to your backend:

```bash
cd backend
npm install @modelcontextprotocol/sdk
```

## Step 2: Create MCP Client Service

Create `backend/src/services/mcpClient.ts`:

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import path from 'path';

export class MCPClient {
  private client: Client | null = null;
  private isConnected = false;

  async connect() {
    if (this.isConnected) return;

    const transport = new StdioClientTransport({
      command: 'node',
      args: [path.join(__dirname, '../../mcp-server/dist/index.js')],
      env: {
        DATABASE_URL: process.env.DATABASE_URL!,
      },
    });

    this.client = new Client(
      {
        name: 'doctor-chat-client',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );

    await this.client.connect(transport);
    this.isConnected = true;
    console.log('✓ MCP Server connected');
  }

  async listTools() {
    if (!this.client) throw new Error('MCP client not connected');
    return await this.client.listTools();
  }

  async callTool(name: string, args: any) {
    if (!this.client) throw new Error('MCP client not connected');

    const result = await this.client.callTool({
      name,
      arguments: args,
    });

    // Extract text content from result
    if (result.content && result.content[0]?.type === 'text') {
      return JSON.parse(result.content[0].text);
    }

    throw new Error('Invalid tool response');
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      this.isConnected = false;
    }
  }
}

// Singleton instance
export const mcpClient = new MCPClient();
```

## Step 3: Update Doctor Agent Service

Modify `backend/src/services/doctorAgent.ts` to use MCP tools:

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { Pool } from 'pg';
import { mcpClient } from './mcpClient';

export class DoctorAgentService {
  private anthropic: Anthropic;
  private db: Pool;
  private mcpTools: any[] = [];

  constructor(db: Pool) {
    this.db = db;
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }

    this.anthropic = new Anthropic({ apiKey });
  }

  async initialize() {
    // Connect to MCP server and get tools
    await mcpClient.connect();
    const toolsList = await mcpClient.listTools();

    // Convert MCP tools to Anthropic tool format
    this.mcpTools = toolsList.tools.map((tool: any) => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.inputSchema,
    }));

    console.log(`✓ Loaded ${this.mcpTools.length} MCP tools`);
  }

  async chat(messages: ChatMessage[], context?: PatientContext): Promise<string> {
    try {
      // Build enhanced system prompt
      const systemPrompt = await this.buildSystemPrompt(context);

      // Convert messages to Anthropic format
      const anthropicMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      // Call Claude with MCP tools
      let response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4096,
        system: systemPrompt,
        messages: anthropicMessages,
        tools: this.mcpTools, // Provide MCP tools to Claude
      });

      // Handle tool use (if Claude wants to call a tool)
      while (response.stop_reason === 'tool_use') {
        const toolUseBlocks = response.content.filter(
          (block: any) => block.type === 'tool_use'
        );

        // Execute tool calls via MCP
        const toolResults = await Promise.all(
          toolUseBlocks.map(async (toolUse: any) => {
            try {
              const result = await mcpClient.callTool(
                toolUse.name,
                toolUse.input
              );

              return {
                type: 'tool_result',
                tool_use_id: toolUse.id,
                content: JSON.stringify(result),
              };
            } catch (error) {
              return {
                type: 'tool_result',
                tool_use_id: toolUse.id,
                content: JSON.stringify({
                  error: error instanceof Error ? error.message : 'Tool execution failed',
                }),
                is_error: true,
              };
            }
          })
        );

        // Continue conversation with tool results
        anthropicMessages.push({
          role: 'assistant',
          content: response.content,
        });

        anthropicMessages.push({
          role: 'user',
          content: toolResults,
        });

        // Get next response from Claude
        response = await this.anthropic.messages.create({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 4096,
          system: systemPrompt,
          messages: anthropicMessages,
          tools: this.mcpTools,
        });
      }

      // Extract final text response
      const textContent = response.content.find((block: any) => block.type === 'text');
      return textContent ? (textContent as any).text : 'No response generated';
    } catch (error) {
      console.error('Error in doctor agent chat:', error);
      throw new Error(`Failed to process chat request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async buildSystemPrompt(context?: PatientContext): Promise<string> {
    return `You are an AI medical assistant helping doctors manage primary care patients, with a focus on chronic kidney disease (CKD) and related conditions.

You have access to the following tools to retrieve patient data and clinical information:
- get_patient_data: Retrieve comprehensive patient information
- query_lab_results: Query laboratory results with filtering
- calculate_ckd_risk: Calculate KDIGO CKD risk classification
- get_population_stats: Get population-level statistics
- search_guidelines: Search KDIGO 2024 clinical guidelines

IMPORTANT: Use these tools proactively when you need information to answer questions. For example:
- If asked about a specific patient, use get_patient_data
- If asked "how many patients...", use get_population_stats
- If asked about treatment guidelines, use search_guidelines

Always prioritize patient safety, cite clinical guidelines, and provide evidence-based recommendations.`;
  }
}
```

## Step 4: Initialize MCP in Server Startup

Update `backend/src/index.ts`:

```typescript
import { DoctorAgentService } from './services/doctorAgent';
import { PatientMonitorService } from './services/patientMonitor';

const startServer = async () => {
  try {
    console.log('🚀 Starting Healthcare AI Backend...');

    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ Database connection failed. Exiting...');
      process.exit(1);
    }

    // Initialize Doctor Agent with MCP
    console.log('Initializing AI services with MCP...');
    const agentService = new DoctorAgentService(pool);
    await agentService.initialize(); // Initialize MCP connection

    // ... rest of startup code
  }
}
```

## Step 5: Build MCP Server

Before starting the backend, build the MCP server:

```bash
cd mcp-server
npm install
npm run build
cd ..
```

## Step 6: Update Environment Variables

Ensure both backend and MCP server have access to the database:

```bash
# backend/.env
DATABASE_URL=postgresql://...
ANTHROPIC_API_KEY=sk-ant-...

# mcp-server/.env
DATABASE_URL=postgresql://...
```

## Step 7: Test the Integration

Start the backend with MCP integration:

```bash
cd backend
npm run dev
```

You should see:
```
✓ Database connection established
Initializing AI services with MCP...
✓ MCP Server connected
✓ Loaded 5 MCP tools
✓ Server running on port 3000
```

## Example Usage

Now when a doctor asks a question, Claude will automatically use MCP tools:

### Example 1: Patient Query
**Doctor**: "Tell me about patient John Doe"

**Behind the scenes**:
1. Claude receives the question
2. Claude calls `get_patient_data` tool via MCP
3. MCP server queries database
4. Claude receives patient data
5. Claude formats a clinical summary

### Example 2: Population Query
**Doctor**: "How many patients are on SGLT2 inhibitors?"

**Behind the scenes**:
1. Claude receives the question
2. Claude calls `get_population_stats` with filter `{ on_sglt2i: true }`
3. MCP server aggregates data
4. Claude receives statistics
5. Claude presents the numbers in natural language

### Example 3: Guideline Search
**Doctor**: "What are the blood pressure targets for CKD patients?"

**Behind the scenes**:
1. Claude receives the question
2. Claude calls `search_guidelines` with topic "blood pressure"
3. MCP server returns KDIGO recommendations
4. Claude explains the guidelines with clinical context

## Benefits of MCP Integration

1. **Separation of Concerns**: Database logic in MCP server, AI logic in Doctor Agent
2. **Reusability**: MCP tools can be used by multiple AI agents
3. **Type Safety**: Structured tool inputs/outputs
4. **Observability**: Tool calls are logged and traceable
5. **Scalability**: MCP server can run independently, even on different machines
6. **Testability**: Each tool can be tested independently

## Troubleshooting

### MCP Server Not Connecting
```
Error: Failed to connect to MCP server
```

**Solution**: Ensure MCP server is built:
```bash
cd mcp-server
npm run build
```

### Database Connection Errors
```
Error: Connection refused
```

**Solution**: Verify DATABASE_URL in both `.env` files

### Tool Call Failures
```
Error: Tool execution failed
```

**Solution**: Check MCP server logs:
```bash
cd mcp-server
npm run dev
```

## Advanced: Remote MCP Server

For production, run MCP server as a separate service:

1. Deploy MCP server with HTTP transport
2. Update backend to use HTTP client transport
3. Add authentication between backend and MCP server

See `MCP_PROTOCOL.md` for deployment strategies.

## Next Steps

1. Add more specialized tools (e.g., prescription generation, imaging interpretation)
2. Implement caching for frequently accessed data
3. Add comprehensive logging and monitoring
4. Create unit tests for each MCP tool
5. Set up CI/CD for MCP server deployment
