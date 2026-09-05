import { ModelInfo, ProviderConfig } from './types.js';

export class ModelDiscoveryEngine {
  public async discoverModels(provider: ProviderConfig, apiKey?: string): Promise<ModelInfo[]> {
    const key = apiKey || provider.apiKey;

    if (!key && provider.id !== 'ollama') {
      return provider.defaultModels.map(m => this.inferModelInfo(provider.id, m));
    }

    try {
      if (provider.id === 'openai') {
        const res = await fetch('https://api.openai.com/v1/models', {
          headers: { Authorization: 'Bearer ' + key },
        });
        if (res.ok) {
          const data = await res.json() as { data: Array<{ id: string }> };
          const relevant = (data.data || [])
            .map(d => d.id)
            .filter(id => id.startsWith('gpt-') || id.startsWith('o1') || id.startsWith('o3') || id.startsWith('chatgpt-') || id.includes('astra'))
            .sort();
          if (relevant.length > 0) {
            return relevant.map(m => this.inferModelInfo(provider.id, m));
          }
        }
      } else if (provider.id === 'anthropic') {
        const res = await fetch('https://api.anthropic.com/v1/models', {
          headers: {
            'x-api-key': key || '',
            'anthropic-version': '2023-06-01',
          },
        });
        if (res.ok) {
          const data = await res.json() as { data: Array<{ id: string; display_name?: string }> };
          if (data.data && data.data.length > 0) {
            return data.data.map(d => this.inferModelInfo(provider.id, d.id, d.display_name));
          }
        }
      } else if (provider.id === 'ollama') {
        const res = await fetch((provider.baseUrl || 'http://localhost:11434') + '/api/tags');
        if (res.ok) {
          const data = await res.json() as { models: Array<{ name: string }> };
          if (data.models && data.models.length > 0) {
            return data.models.map(m => this.inferModelInfo('ollama', m.name));
          }
        }
      }
    } catch {}

    return provider.defaultModels.map(m => this.inferModelInfo(provider.id, m));
  }

  public inferModelInfo(providerId: string, modelId: string, displayName?: string): ModelInfo {
    const clean = modelId.toLowerCase();
    const isReasoning = clean.includes('o1') || clean.includes('o3') || clean.includes('reasoner') || clean.includes('r1') || clean.includes('thinking');
    const isVision = clean.includes('4o') || clean.includes('sonnet') || clean.includes('vision') || clean.includes('gemini') || clean.includes('flash');
    const isComputer = clean.includes('astra') || clean.includes('computer') || clean.includes('sonnet') || clean.includes('gpt-4o');
    const isRecommended = clean.includes('gpt-4o') || clean.includes('claude-3-7') || clean.includes('deepseek-chat') || clean.includes('astra');

    return {
      id: modelId,
      name: displayName || modelId,
      providerId,
      recommended: isRecommended,
      capabilities: {
        tools: true,
        vision: isVision,
        reasoning: isReasoning,
        streaming: true,
        computerUse: isComputer,
      },
    };
  }
}