import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import path from 'path';

/**
 * MCP Client wrapper for Healthcare MCP Server
 * Provides typed access to phase-based CKD clinical decision tools
 */
export class MCPClient {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;
  private isConnected: boolean = false;

  constructor() {}

  /**
   * Initialize connection to MCP server
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      // Determine MCP server path
      // In production (Render), MCP server will be in ../mcp-server/dist/index.js
      // In development, same structure
      const mcpServerPath = path.resolve(__dirname, '../../mcp-server/dist/index.js');

      console.log(`[MCP Client] Connecting to MCP server at: ${mcpServerPath}`);

      // Create stdio transport to spawn MCP server as child process
      this.transport = new StdioClientTransport({
        command: 'node',
        args: [mcpServerPath],
        env: {
          ...process.env,
          // Ensure NODE_ENV is set
          NODE_ENV: process.env.NODE_ENV || 'development',
        } as Record<string, string>,
      });

      // Create MCP client
      this.client = new Client(
        {
          name: 'healthcare-backend-client',
          version: '1.0.0',
        },
        {
          capabilities: {},
        }
      );

      // Connect client to transport
      await this.client.connect(this.transport);

      this.isConnected = true;
      console.log('[MCP Client] Successfully connected to MCP server');

      // List available tools for debugging
      const tools = await this.listTools();
      console.log(`[MCP Client] Available tools: ${tools.map(t => t.name).join(', ')}`);
    } catch (error) {
      console.error('[MCP Client] Failed to connect to MCP server:', error);
      throw new Error(`MCP connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Disconnect from MCP server
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
    }
    this.isConnected = false;
    console.log('[MCP Client] Disconnected from MCP server');
  }

  /**
   * List all available tools
   */
  async listTools(): Promise<Array<{ name: string; description?: string }>> {
    if (!this.client || !this.isConnected) {
      throw new Error('MCP client not connected');
    }

    const result = await this.client.listTools();
    return result.tools;
  }

  /**
   * PHASE 1: Assess pre-diagnosis CKD risk
   * Use when patient lacks recent eGFR/uACR labs
   */
  async assessPreDiagnosisRisk(patientId: string): Promise<any> {
    if (!this.client || !this.isConnected) {
      throw new Error('MCP client not connected');
    }

    const result = await this.client.callTool({
      name: 'assess_pre_diagnosis_risk',
      arguments: { patient_id: patientId },
    });

    return this.parseToolResult(result);
  }

  /**
   * PHASE 2: Perform KDIGO classification
   * Use when patient has eGFR and uACR results
   */
  async classifyKDIGO(patientId: string): Promise<any> {
    if (!this.client || !this.isConnected) {
      throw new Error('MCP client not connected');
    }

    const result = await this.client.callTool({
      name: 'classify_kdigo',
      arguments: { patient_id: patientId },
    });

    return this.parseToolResult(result);
  }

  /**
   * PHASE 3: Assess treatment options
   * Evaluate eligibility for Jardiance, RAS inhibitors, RenalGuard
   */
  async assessTreatmentOptions(patientId: string): Promise<any> {
    if (!this.client || !this.isConnected) {
      throw new Error('MCP client not connected');
    }

    const result = await this.client.callTool({
      name: 'assess_treatment_options',
      arguments: { patient_id: patientId },
    });

    return this.parseToolResult(result);
  }

  /**
   * PHASE 4: Monitor medication adherence
   * Calculate MPR and detect adherence barriers
   */
  async monitorAdherence(
    patientId: string,
    medicationType: 'SGLT2i' | 'RAS_inhibitor' | 'ALL' = 'ALL',
    measurementPeriodDays: number = 90
  ): Promise<any> {
    if (!this.client || !this.isConnected) {
      throw new Error('MCP client not connected');
    }

    const result = await this.client.callTool({
      name: 'monitor_adherence',
      arguments: {
        patient_id: patientId,
        medication_type: medicationType,
        measurement_period_days: measurementPeriodDays,
      },
    });

    return this.parseToolResult(result);
  }

  /**
   * Legacy: Get comprehensive patient data
   */
  async getPatientData(
    patientId: string,
    includeLabs: boolean = true,
    includeRisk: boolean = true
  ): Promise<any> {
    if (!this.client || !this.isConnected) {
      throw new Error('MCP client not connected');
    }

    const result = await this.client.callTool({
      name: 'get_patient_data',
      arguments: {
        patient_id: patientId,
        include_labs: includeLabs,
        include_risk: includeRisk,
      },
    });

    return this.parseToolResult(result);
  }

  /**
   * Legacy: Query lab results
   */
  async queryLabResults(
    patientId: string,
    observationType?: string,
    dateRange?: { start: string; end: string },
    limit: number = 20
  ): Promise<any> {
    if (!this.client || !this.isConnected) {
      throw new Error('MCP client not connected');
    }

    const result = await this.client.callTool({
      name: 'query_lab_results',
      arguments: {
        patient_id: patientId,
        observation_type: observationType,
        date_range: dateRange,
        limit,
      },
    });

    return this.parseToolResult(result);
  }

  /**
   * Legacy: Get population statistics
   */
  async getPopulationStats(filters?: any, groupBy?: string): Promise<any> {
    if (!this.client || !this.isConnected) {
      throw new Error('MCP client not connected');
    }

    const result = await this.client.callTool({
      name: 'get_population_stats',
      arguments: {
        filters: filters || {},
        group_by: groupBy,
      },
    });

    return this.parseToolResult(result);
  }

  /**
   * Legacy: Search clinical guidelines
   */
  async searchGuidelines(topic: string, ckdStage?: string): Promise<any> {
    if (!this.client || !this.isConnected) {
      throw new Error('MCP client not connected');
    }

    const result = await this.client.callTool({
      name: 'search_guidelines',
      arguments: {
        topic,
        ckd_stage: ckdStage,
      },
    });

    return this.parseToolResult(result);
  }

  /**
   * Parse tool result from MCP response
   */
  private parseToolResult(result: any): any {
    if (!result || !result.content || result.content.length === 0) {
      throw new Error('Empty response from MCP server');
    }

    // MCP returns content as array of content blocks
    const textContent = result.content.find((block: any) => block.type === 'text');
    if (!textContent) {
      throw new Error('No text content in MCP response');
    }

    try {
      // Parse JSON response
      return JSON.parse(textContent.text);
    } catch (error) {
      // If not JSON, return raw text
      return textContent.text;
    }
  }
}

// Singleton instance
let mcpClientInstance: MCPClient | null = null;

/**
 * Get or create MCP client singleton
 */
export async function getMCPClient(): Promise<MCPClient> {
  if (!mcpClientInstance) {
    mcpClientInstance = new MCPClient();
    await mcpClientInstance.connect();
  }
  return mcpClientInstance;
}

/**
 * Close MCP client connection (for graceful shutdown)
 */
export async function closeMCPClient(): Promise<void> {
  if (mcpClientInstance) {
    await mcpClientInstance.disconnect();
    mcpClientInstance = null;
  }
}
