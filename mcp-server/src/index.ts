#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { testConnection } from './database.js';
import { getPatientData } from './tools/patientData.js';
import { queryLabResults } from './tools/labResults.js';
import { calculateCKDRisk } from './tools/riskAssessment.js';
import { getPopulationStats } from './tools/populationStats.js';
import { searchGuidelines } from './tools/guidelines.js';

// Define available tools
const TOOLS: Tool[] = [
  {
    name: 'get_patient_data',
    description: 'Retrieve comprehensive patient information including demographics, medical history, medications, and current status. Optionally include recent lab results and risk assessment.',
    inputSchema: {
      type: 'object',
      properties: {
        patient_id: {
          type: 'string',
          description: 'Unique patient identifier (UUID)',
        },
        include_labs: {
          type: 'boolean',
          description: 'Include recent lab results (default: true)',
        },
        include_risk: {
          type: 'boolean',
          description: 'Include risk assessment (default: true)',
        },
      },
      required: ['patient_id'],
    },
  },
  {
    name: 'query_lab_results',
    description: 'Query laboratory results for a patient with optional filtering by observation type and date range. Returns interpreted lab values with clinical context.',
    inputSchema: {
      type: 'object',
      properties: {
        patient_id: {
          type: 'string',
          description: 'Patient identifier',
        },
        observation_type: {
          type: 'string',
          description: 'Type of lab test',
          enum: ['eGFR', 'uACR', 'Creatinine', 'HbA1c', 'Albumin', 'All'],
        },
        date_range: {
          type: 'object',
          properties: {
            start: { type: 'string', format: 'date' },
            end: { type: 'string', format: 'date' },
          },
        },
        limit: {
          type: 'number',
          description: 'Maximum results to return (default: 20)',
        },
      },
      required: ['patient_id'],
    },
  },
  {
    name: 'calculate_ckd_risk',
    description: 'Calculate KDIGO CKD risk classification for a patient based on latest eGFR and uACR values. Includes risk level, recommendations, and monitoring plan.',
    inputSchema: {
      type: 'object',
      properties: {
        patient_id: {
          type: 'string',
          description: 'Patient identifier',
        },
      },
      required: ['patient_id'],
    },
  },
  {
    name: 'get_population_stats',
    description: 'Get aggregated statistics across the patient population with optional filtering and grouping. Useful for population-level queries like "How many patients have diabetes?"',
    inputSchema: {
      type: 'object',
      properties: {
        filters: {
          type: 'object',
          properties: {
            has_diabetes: { type: 'boolean' },
            has_hypertension: { type: 'boolean' },
            on_sglt2i: { type: 'boolean' },
            on_ras_inhibitor: { type: 'boolean' },
            risk_level: {
              type: 'string',
              enum: ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'],
            },
            age_min: { type: 'number' },
            age_max: { type: 'number' },
          },
        },
        group_by: {
          type: 'string',
          enum: ['risk_level', 'ckd_stage', 'medication', 'comorbidity'],
        },
      },
    },
  },
  {
    name: 'search_guidelines',
    description: 'Search KDIGO 2024 clinical practice guidelines for specific topics like blood pressure, diabetes, referral criteria, etc.',
    inputSchema: {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          description: 'Topic to search (e.g., "blood pressure", "diabetes", "referral", "sglt2", "monitoring")',
        },
        ckd_stage: {
          type: 'string',
          description: 'CKD stage for stage-specific recommendations (e.g., "G3a", "G4")',
        },
      },
      required: ['topic'],
    },
  },
];

// Create MCP server
const server = new Server(
  {
    name: 'healthcare-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handler for listing available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

// Handler for tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_patient_data': {
        const result = await getPatientData(args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'query_lab_results': {
        const result = await queryLabResults(args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'calculate_ckd_risk': {
        const result = await calculateCKDRisk(args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'get_population_stats': {
        const result = await getPopulationStats(args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'search_guidelines': {
        const result = await searchGuidelines(args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: errorMessage }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  console.error('Healthcare MCP Server starting...');

  // Test database connection
  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.error('✗ Failed to connect to database');
    process.exit(1);
  }

  // Create stdio transport
  const transport = new StdioServerTransport();

  // Connect server to transport
  await server.connect(transport);

  console.error('✓ Healthcare MCP Server running');
  console.error('Available tools:', TOOLS.map(t => t.name).join(', '));
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
