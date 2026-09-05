import { describe, it, expect } from 'vitest';
import { AgentEngine } from '../src/agent/engine.js';
import { createDefaultToolRegistry } from '../src/tools/index.js';
import { ModelGateway } from '../src/providers/gateway.js';
import { MemoryStore } from '../src/memory/store.js';
import path from 'node:path';
import os from 'node:os';

describe('AgentEngine State and Controls', () => {
  const tools = createDefaultToolRegistry();
  const gateway = new ModelGateway();
  const memory = new MemoryStore(path.join(os.tmpdir(), 'agent_test_' + Date.now() + '.sqlite'));

  const engine = new AgentEngine({
    tools,
    gateway,
    memory,
    workspaceRoot: process.cwd(),
    provider: {
      id: 'openai',
      name: 'OpenAI',
      baseUrl: 'https://api.openai.com/v1',
      defaultModels: ['gpt-4o'],
    },
    modelId: 'gpt-4o',
  });

  it('should toggle between agent mode and chat mode', () => {
    engine.setMode(false);
    expect((engine as any).state.isAgentMode).toBe(false);
    engine.setMode(true);
    expect((engine as any).state.isAgentMode).toBe(true);
  });

  it('should pause and resume execution', () => {
    engine.pause();
    expect((engine as any).state.isPaused).toBe(true);
    engine.resume();
    expect((engine as any).state.isPaused).toBe(false);
  });

  it('should update workspace directory', () => {
    engine.setWorkspace('C:\\Projects\\Test');
    expect((engine as any).state.workspaceRoot).toBe('C:\\Projects\\Test');
  });
});