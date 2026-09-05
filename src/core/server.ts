import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { getOpenWorkHtml } from '../ui/html.js';
import { createDefaultToolRegistry } from '../tools/index.js';
import { ModelGateway } from '../providers/gateway.js';
import { ModelDiscoveryEngine } from '../providers/discovery.js';
import { MemoryStore } from '../memory/store.js';
import { AgentEngine } from '../agent/engine.js';
import { OpenKeyVaultBridge } from '../openkey/integration.js';
import { ProviderConfig } from '../providers/types.js';

export function createOpenWorkServer(): Hono {
  const app = new Hono();
  const tools = createDefaultToolRegistry();
  const gateway = new ModelGateway();
  const discovery = new ModelDiscoveryEngine();
  const memory = new MemoryStore();
  const openkey = new OpenKeyVaultBridge();

  const activeConfig = openkey.getActiveConfig();
  const defaultProvider: ProviderConfig = {
    id: activeConfig.activeProviderId || 'openai',
    name: (activeConfig.activeProviderId || 'openai').toUpperCase(),
    baseUrl: 'https://api.openai.com/v1',
    apiKey: openkey.getSecretForProvider(activeConfig.activeProviderId) || undefined,
    defaultModels: ['gpt-4o', 'o3-mini', 'o1', 'gpt-4o-mini'],
  };

  const agent = new AgentEngine({
    tools,
    gateway,
    memory,
    workspaceRoot: process.cwd(),
    provider: defaultProvider,
    modelId: activeConfig.activeModelId || 'gpt-4o',
    apiKey: defaultProvider.apiKey,
  });

  app.get('/', (c) => c.html(getOpenWorkHtml()));

  app.get('/api/models', async (c) => {
    const providers: ProviderConfig[] = [
      {
        id: 'openai',
        name: 'OpenAI',
        baseUrl: 'https://api.openai.com/v1',
        apiKey: openkey.getSecretForProvider('openai') || undefined,
        defaultModels: ['gpt-4o', 'o3-mini', 'o1', 'chatgpt-4o-latest'],
      },
      {
        id: 'anthropic',
        name: 'Anthropic',
        baseUrl: 'https://api.anthropic.com/v1',
        apiKey: openkey.getSecretForProvider('anthropic') || undefined,
        defaultModels: ['claude-3-7-sonnet-20250219', 'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'],
      },
      {
        id: 'deepseek',
        name: 'DeepSeek',
        baseUrl: 'https://api.deepseek.com/v1',
        apiKey: openkey.getSecretForProvider('deepseek') || undefined,
        defaultModels: ['deepseek-chat', 'deepseek-reasoner'],
      },
      {
        id: 'ollama',
        name: 'Ollama',
        baseUrl: 'http://localhost:11434',
        defaultModels: ['llama3.2', 'deepseek-r1', 'mistral'],
      },
    ];

    const models = [];
    for (const p of providers) {
      try {
        const found = await discovery.discoverModels(p, p.apiKey);
        models.push(...found);
      } catch {
        models.push(...p.defaultModels.map(m => discovery.inferModelInfo(p.id, m)));
      }
    }

    return c.json({ models });
  });

  app.post('/api/agent/prompt', async (c) => {
    const body = await c.req.json<{ prompt: string; providerId?: string; modelId?: string }>();
    if (!body.prompt) {
      return c.json({ error: 'Prompt is required' }, 400);
    }

    try {
      const response = await agent.runConversation(body.prompt);
      return c.json({ response });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return c.json({ error: msg }, 500);
    }
  });

  app.get('/api/agent/activity', (c) => {
    return c.json({
      activityLog: (agent as any).state.activityLog || [],
      state: (agent as any).state,
    });
  });

  app.post('/api/agent/stop', (c) => {
    agent.stop();
    return c.json({ success: true, status: 'Stopped' });
  });

  app.post('/api/agent/pause', (c) => {
    agent.pause();
    return c.json({ success: true, status: 'Paused' });
  });

  app.post('/api/agent/resume', (c) => {
    agent.resume();
    return c.json({ success: true, status: 'Resumed' });
  });

  app.post('/api/agent/mode', async (c) => {
    const body = await c.req.json<{ isAgentMode: boolean }>();
    agent.setMode(Boolean(body.isAgentMode));
    return c.json({ success: true, isAgentMode: body.isAgentMode });
  });

  app.get('/api/memory', (c) => {
    const list = memory.listMemories();
    return c.json({ memories: list });
  });

  app.post('/api/memory', async (c) => {
    const body = await c.req.json<{ category: any; topicKey: string; content: string }>();
    const saved = memory.saveMemory(body);
    return c.json({ success: true, memory: saved });
  });

  app.delete('/api/memory/:id', (c) => {
    const id = c.req.param('id');
    const ok = memory.deleteMemory(id);
    return c.json({ success: ok });
  });

  app.get('/api/openkey/status', (c) => {
    const available = openkey.isAvailable();
    const secrets = openkey.listStoredSecrets();
    return c.json({
      available,
      secretsCount: secrets.length,
      connectedProviders: secrets.map(s => s.providerId),
    });
  });

  return app;
}

export function startOpenWork(port: number = 3100): Promise<{ port: number; host: string; close: () => void }> {
  return new Promise((resolve) => {
    const app = createOpenWorkServer();
    const host = '127.0.0.1';
    const server = serve(
      {
        fetch: app.fetch,
        port,
        hostname: host,
      },
      (info) => {
        console.log(`\n🤖 OpenWork Desktop Agent listening on http://${host}:${info.port}\n`);
        resolve({
          port: info.port,
          host,
          close: () => server.close(),
        });
      }
    );
  });
}