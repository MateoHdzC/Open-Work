import { ChatMessage, ConnectionTestResult, ProviderConfig } from './types.js';
import { ToolRegistry } from '../tools/registry.js';

export interface ModelCallPayload {
  provider: ProviderConfig;
  modelId: string;
  messages: ChatMessage[];
  tools?: ToolRegistry;
  apiKey?: string;
  onToken?: (token: string) => void;
  onReasoning?: (reasoning: string) => void;
}

export interface ModelCallResponse {
  content: string;
  toolCalls?: Array<{
    id: string;
    name: string;
    arguments: any;
  }>;
}

export class ModelGateway {
  /**
   * Empirically test connection and authentication against the provider API.
   */
  public async testConnection(provider: ProviderConfig, apiKey?: string): Promise<ConnectionTestResult> {
    const key = apiKey || provider.apiKey;

    if (provider.id !== 'ollama' && (!key || key.trim() === '')) {
      return {
        connected: false,
        status: 'Not Connected',
        message: 'No API key provided.',
      };
    }

    try {
      if (provider.id === 'openai') {
        const res = await fetch('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${key}` },
        });
        if (res.ok) {
          const data = (await res.json()) as { data?: any[] };
          const count = data.data?.length || 0;
          return {
            connected: true,
            status: 'Connected',
            message: `Successfully connected to OpenAI (${count} models available).`,
            modelCount: count,
          };
        }
        if (res.status === 401) {
          return { connected: false, status: 'Invalid Key', message: 'Invalid OpenAI API key.' };
        }
        return { connected: false, status: 'Error', message: `OpenAI returned HTTP ${res.status}: ${res.statusText}` };
      }

      if (provider.id === 'anthropic') {
        const res = await fetch('https://api.anthropic.com/v1/models', {
          headers: {
            'x-api-key': key || '',
            'anthropic-version': '2023-06-01',
          },
        });
        if (res.ok) {
          const data = (await res.json()) as { data?: any[] };
          const count = data.data?.length || 0;
          return {
            connected: true,
            status: 'Connected',
            message: `Successfully connected to Anthropic (${count} models available).`,
            modelCount: count,
          };
        }
        if (res.status === 401 || res.status === 403) {
          return { connected: false, status: 'Invalid Key', message: 'Invalid Anthropic API key.' };
        }
        return { connected: false, status: 'Error', message: `Anthropic returned HTTP ${res.status}: ${res.statusText}` };
      }

      if (provider.id === 'google') {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        if (res.ok) {
          const data = (await res.json()) as { models?: any[] };
          const count = data.models?.length || 0;
          return {
            connected: true,
            status: 'Connected',
            message: `Successfully connected to Google Gemini (${count} models available).`,
            modelCount: count,
          };
        }
        if (res.status === 400 || res.status === 403) {
          return { connected: false, status: 'Invalid Key', message: 'Invalid Google Gemini API key.' };
        }
        return { connected: false, status: 'Error', message: `Gemini returned HTTP ${res.status}: ${res.statusText}` };
      }

      if (provider.id === 'openrouter') {
        const res = await fetch('https://openrouter.ai/api/v1/models', {
          headers: { Authorization: `Bearer ${key}` },
        });
        if (res.ok) {
          const data = (await res.json()) as { data?: any[] };
          const count = data.data?.length || 0;
          return {
            connected: true,
            status: 'Connected',
            message: `Successfully connected to OpenRouter (${count} models available).`,
            modelCount: count,
          };
        }
        if (res.status === 401) {
          return { connected: false, status: 'Invalid Key', message: 'Invalid OpenRouter API key.' };
        }
        return { connected: false, status: 'Error', message: `OpenRouter returned HTTP ${res.status}` };
      }

      if (provider.id === 'ollama') {
        const base = (provider.baseUrl || 'http://localhost:11434').replace(/\/+$/, '');
        const res = await fetch(`${base}/api/tags`);
        if (res.ok) {
          const data = (await res.json()) as { models?: any[] };
          const count = data.models?.length || 0;
          return {
            connected: true,
            status: 'Connected',
            message: `Ollama local instance connected (${count} models installed).`,
            modelCount: count,
          };
        }
        return { connected: false, status: 'Error', message: `Ollama error: HTTP ${res.status}` };
      }

      // Custom OpenAI-compatible endpoint
      const targetUrl = provider.baseUrl.endsWith('/v1')
        ? `${provider.baseUrl}/models`
        : `${provider.baseUrl}/v1/models`;
      const res = await fetch(targetUrl, {
        headers: key ? { Authorization: `Bearer ${key}` } : {},
      });
      if (res.ok) {
        return { connected: true, status: 'Connected', message: 'Custom API endpoint verified.' };
      }
      return { connected: false, status: 'Error', message: `Custom endpoint returned HTTP ${res.status}` };
    } catch (err: any) {
      return {
        connected: false,
        status: 'Error',
        message: err.message || 'Connection failed: Unable to reach provider host.',
      };
    }
  }

  /**
   * Main unified execution entry for sending messages and receiving streaming tokens & tool calls.
   */
  public async callModel(payload: ModelCallPayload): Promise<ModelCallResponse> {
    const { provider, modelId, messages, tools, apiKey, onToken } = payload;
    const key = apiKey || provider.apiKey;

    if (provider.id !== 'ollama' && (!key || key.trim() === '')) {
      throw new Error(`No API key configured for provider "${provider.name}". Please open Settings & Keys to connect your API key.`);
    }
    if (!modelId || modelId.trim() === '') {
      throw new Error(`No model selected for provider "${provider.name}". Please select a model in Settings & Keys.`);
    }

    if (provider.id === 'anthropic') {
      return this.callAnthropic(payload);
    }

    // OpenAI, Google Gemini (via OpenAI compatibility endpoint), OpenRouter, Ollama, Custom
    return this.callOpenAiCompatible(payload);
  }

  private async callOpenAiCompatible(payload: ModelCallPayload): Promise<ModelCallResponse> {
    const { provider, modelId, messages, tools, apiKey, onToken } = payload;
    const key = apiKey || provider.apiKey;

    let endpoint = (provider.baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '') + '/chat/completions';
    if (provider.id === 'google') {
      endpoint = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
    } else if (provider.id === 'ollama') {
      endpoint = (provider.baseUrl || 'http://localhost:11434').replace(/\/+$/, '') + '/v1/chat/completions';
    }

    const formattedMessages = messages.map((m) => {
      if (m.role === 'tool') {
        return {
          role: 'tool',
          tool_call_id: m.toolCallId || 'call_0',
          content: m.content,
        };
      }
      if (m.role === 'assistant' && m.toolCalls && m.toolCalls.length > 0) {
        return {
          role: 'assistant',
          content: m.content || null,
          tool_calls: m.toolCalls.map((tc) => ({
            id: tc.id,
            type: 'function',
            function: {
              name: tc.name,
              arguments: typeof tc.arguments === 'string' ? tc.arguments : JSON.stringify(tc.arguments),
            },
          })),
        };
      }
      return {
        role: m.role,
        content: m.content,
      };
    });

    const bodyObj: any = {
      model: modelId,
      messages: formattedMessages,
      stream: true,
    };

    if (tools && tools.list().length > 0) {
      bodyObj.tools = tools.getOpenAiToolDefinitions();
      bodyObj.tool_choice = 'auto';
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (key) {
      headers['Authorization'] = `Bearer ${key}`;
    }
    if (provider.id === 'openrouter') {
      headers['HTTP-Referer'] = 'https://github.com/MateoHdzC/Open-work';
      headers['X-Title'] = 'OpenWork Windows Agent';
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(bodyObj),
    });

    if (!res.ok) {
      const errBody = await res.text();
      let errorMsg = `Provider error (HTTP ${res.status}): ${res.statusText}`;
      try {
        const parsed = JSON.parse(errBody);
        if (parsed.error?.message) errorMsg = parsed.error.message;
      } catch {}
      if (res.status === 401) errorMsg = 'Invalid API key. Please check your credentials in Settings & Keys.';
      if (res.status === 429) errorMsg = 'Rate limit or quota exceeded with your provider.';
      throw new Error(errorMsg);
    }

    let fullContent = '';
    const toolCallsMap = new Map<number, { id: string; name: string; arguments: string }>();

    if (!res.body) {
      return { content: fullContent };
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':')) continue;
        if (trimmed === 'data: [DONE]') continue;

        if (trimmed.startsWith('data: ')) {
          try {
            const parsed = JSON.parse(trimmed.slice(6));
            const choice = parsed.choices?.[0];
            const delta = choice?.delta;

            if (delta?.content) {
              fullContent += delta.content;
              if (onToken) onToken(delta.content);
            }

            if (delta?.tool_calls) {
              for (const tc of delta.tool_calls) {
                const index = tc.index ?? 0;
                if (!toolCallsMap.has(index)) {
                  toolCallsMap.set(index, {
                    id: tc.id || `call_${index}`,
                    name: tc.function?.name || '',
                    arguments: tc.function?.arguments || '',
                  });
                } else {
                  const existing = toolCallsMap.get(index)!;
                  if (tc.function?.name) existing.name += tc.function.name;
                  if (tc.function?.arguments) existing.arguments += tc.function.arguments;
                }
              }
            }
          } catch {}
        }
      }
    }

    const toolCalls = Array.from(toolCallsMap.values()).map((tc) => ({
      id: tc.id,
      name: tc.name,
      arguments: tc.arguments,
    }));

    return {
      content: fullContent,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    };
  }

  private async callAnthropic(payload: ModelCallPayload): Promise<ModelCallResponse> {
    const { provider, modelId, messages, tools, apiKey, onToken } = payload;
    const key = apiKey || provider.apiKey;

    const endpoint = 'https://api.anthropic.com/v1/messages';
    let systemPrompt = '';
    const anthropicMessages: any[] = [];

    for (const m of messages) {
      if (m.role === 'system') {
        systemPrompt += (systemPrompt ? '\n' : '') + m.content;
      } else if (m.role === 'tool') {
        anthropicMessages.push({
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: m.toolCallId,
              content: m.content,
            },
          ],
        });
      } else if (m.role === 'assistant' && m.toolCalls && m.toolCalls.length > 0) {
        anthropicMessages.push({
          role: 'assistant',
          content: [
            ...(m.content ? [{ type: 'text', text: m.content }] : []),
            ...m.toolCalls.map((tc) => ({
              type: 'tool_use',
              id: tc.id,
              name: tc.name,
              input: typeof tc.arguments === 'string' ? JSON.parse(tc.arguments || '{}') : tc.arguments,
            })),
          ],
        });
      } else {
        anthropicMessages.push({
          role: m.role,
          content: m.content,
        });
      }
    }

    const bodyObj: any = {
      model: modelId,
      max_tokens: 4096,
      messages: anthropicMessages,
      stream: true,
    };

    if (systemPrompt) {
      bodyObj.system = systemPrompt;
    }

    if (tools && tools.list().length > 0) {
      bodyObj.tools = tools.list().map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: {
          type: 'object',
          properties: Object.fromEntries(
            Object.entries(t.parameters).map(([k, v]) => [k, { type: v.type, description: v.description }])
          ),
          required: Object.entries(t.parameters)
            .filter(([_, v]) => v.required)
            .map(([k]) => k),
        },
      }));
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(bodyObj),
    });

    if (!res.ok) {
      const errText = await res.text();
      let msg = `Anthropic error (HTTP ${res.status}): ${res.statusText}`;
      try {
        const parsed = JSON.parse(errText);
        if (parsed.error?.message) msg = parsed.error.message;
      } catch {}
      throw new Error(msg);
    }

    let fullContent = '';
    const toolCalls: any[] = [];
    let currentToolCall: any = null;

    if (!res.body) return { content: fullContent };

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;
        const dataStr = trimmed.slice(6);
        if (dataStr === '[DONE]') continue;

        try {
          const event = JSON.parse(dataStr);
          if (event.type === 'content_block_start' && event.content_block?.type === 'tool_use') {
            currentToolCall = {
              id: event.content_block.id,
              name: event.content_block.name,
              arguments: '',
            };
          } else if (event.type === 'content_block_delta') {
            if (event.delta?.type === 'text_delta') {
              fullContent += event.delta.text;
              if (onToken) onToken(event.delta.text);
            } else if (event.delta?.type === 'input_json_delta' && currentToolCall) {
              currentToolCall.arguments += event.delta.partial_json;
            }
          } else if (event.type === 'content_block_stop' && currentToolCall) {
            toolCalls.push(currentToolCall);
            currentToolCall = null;
          }
        } catch {}
      }
    }

    return {
      content: fullContent,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    };
  }
}