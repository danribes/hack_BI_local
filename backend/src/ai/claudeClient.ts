/**
 * Claude AI Client
 *
 * Client for interacting with Anthropic's Claude API.
 * Handles authentication, request formatting, and response parsing.
 */

import Anthropic from '@anthropic-ai/sdk';
import { ClaudeConfig } from '../types/ai';

/**
 * Initialize Claude client with configuration
 */
function createClaudeClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY environment variable is not set. ' +
      'Please add your API key to the .env file. ' +
      'Get your key from https://console.anthropic.com'
    );
  }

  return new Anthropic({
    apiKey: apiKey,
  });
}

/**
 * Get Claude configuration from environment variables
 */
export function getClaudeConfig(): ClaudeConfig {
  return {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
    maxTokens: parseInt(process.env.AI_MAX_TOKENS || '2048', 10),
    temperature: parseFloat(process.env.AI_TEMPERATURE || '0.3'),
  };
}

/**
 * Call Claude API with a prompt and return structured response
 *
 * @param systemPrompt - System instructions for Claude
 * @param userPrompt - User message/question
 * @param config - Optional Claude configuration overrides
 * @returns Claude's text response
 */
export async function callClaude(
  systemPrompt: string,
  userPrompt: string,
  config?: Partial<ClaudeConfig>
): Promise<string> {
  const client = createClaudeClient();
  const claudeConfig = getClaudeConfig();

  // Merge configs (override defaults with provided config)
  const finalConfig = {
    ...claudeConfig,
    ...config,
  };

  console.log(`[Claude AI] Calling ${finalConfig.model}...`);
  const startTime = Date.now();

  try {
    const message = await client.messages.create({
      model: finalConfig.model,
      max_tokens: finalConfig.maxTokens,
      temperature: finalConfig.temperature,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    const duration = Date.now() - startTime;
    console.log(`[Claude AI] Response received in ${duration}ms`);

    // Extract text content from response
    const textContent = message.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in Claude response');
    }

    return textContent.text;
  } catch (error) {
    console.error('[Claude AI] Error:', error);

    if (error instanceof Anthropic.APIError) {
      throw new Error(`Claude API Error: ${error.message} (Status: ${error.status})`);
    }

    throw error;
  }
}

/**
 * Call Claude API and parse JSON response
 *
 * Useful when Claude is instructed to return structured JSON data
 *
 * @param systemPrompt - System instructions for Claude
 * @param userPrompt - User message/question
 * @param config - Optional Claude configuration overrides
 * @returns Parsed JSON object
 */
export async function callClaudeJSON<T = any>(
  systemPrompt: string,
  userPrompt: string,
  config?: Partial<ClaudeConfig>
): Promise<T> {
  const response = await callClaude(systemPrompt, userPrompt, config);

  try {
    // Try to extract JSON from code blocks if present
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) ||
                     response.match(/```\s*([\s\S]*?)\s*```/);

    const jsonText = jsonMatch ? jsonMatch[1] : response;

    return JSON.parse(jsonText.trim()) as T;
  } catch (error) {
    console.error('[Claude AI] Failed to parse JSON response:', response);
    throw new Error(`Failed to parse Claude JSON response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Test Claude API connection
 * Useful for health checks and troubleshooting
 */
export async function testClaudeConnection(): Promise<boolean> {
  try {
    const response = await callClaude(
      'You are a helpful assistant.',
      'Please respond with "OK" if you can read this message.',
      { maxTokens: 10 }
    );

    return response.toLowerCase().includes('ok');
  } catch (error) {
    console.error('[Claude AI] Connection test failed:', error);
    return false;
  }
}

/**
 * Get Claude model version being used
 */
export function getModelVersion(): string {
  return getClaudeConfig().model;
}
