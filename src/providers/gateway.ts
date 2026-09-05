import { ChatMessage, ModelInfo, ProviderConfig } from './types.js';
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
  public async callModel(payload: ModelCallPayload): Promise<ModelCallResponse> {
    const { provider, modelId, messages, tools, apiKey, onToken } = payload;
    const key = apiKey || provider.apiKey;

    const formattedMessages = messages.map(m => {
      if (m.role === 'tool') {
        return {
          role: 'tool',
          tool_call_id: m.toolCallId || 'call_0',
          content: m.content,
        };
      }
      if (m.role === 'assistant' && m.toolCalls) {
        return {
          role: 'assistant',
          content: m.content || null,
          tool_calls: m.toolCalls.map(tc => ({
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

    const endpoint = (provider.baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '') + '/chat/completions';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (key) {
      headers['Authorization'] = 'Bearer ' + key;
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(bodyObj),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error('Provider ' + provider.name + ' returned ' + res.status + ': ' + errText);
    }

    let fullContent = '';
    const collectedToolCalls: Map<number, { id: string; name: string; args: string }> = new Map();

    const reader = res.body?.getReader();
    if (!reader) {
      throw new Error('Failed to open response stream');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const jsonStr = trimmed.slice(5).trim();
        if (jsonStr === '[DONE]') continue;

        try {
          const parsed = JSON.parse(jsonStr);
          const delta = parsed.choices?.[0]?.delta;
          if (!delta) continue;

          if (delta.content) {
            fullContent += delta.content;
            if (onToken) onToken(delta.content);
          }

          if (delta.tool_calls) {
            for (const tc of delta.tool_calls) {
              const index = tc.index ?? 0;
              if (!collectedToolCalls.has(index)) {
                collectedToolCalls.set(index, {
                  id: tc.id || 'call_' + index,
                  name: tc.function?.name || '',
                  args: '',
                });
              }
              const entry = collectedToolCalls.get(index)!;
              if (tc.id) entry.id = tc.id;
              if (tc.function?.name) entry.name += tc.function.name;
              if (tc.function?.arguments) entry.args += tc.function.arguments;
            }
          }
        } catch {}
      }
    }

    const finalToolCalls = Array.from(collectedToolCalls.values()).map(tc => {
      let parsedArgs = {};
      try {
        parsedArgs = JSON.parse(tc.args || '{}');
      } catch {
        parsedArgs = { raw: tc.args };
      }
      return {
        id: tc.id,
        name: tc.name,
        arguments: parsedArgs,
      };
    });

    return {
      content: fullContent,
      toolCalls: finalToolCalls.length > 0 ? finalToolCalls : undefined,
    };
  }
}