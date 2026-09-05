import { describe, it, expect } from 'vitest';
import { createDefaultToolRegistry } from '../src/tools/index.js';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';

describe('ToolRegistry and Core Tools', () => {
  const tools = createDefaultToolRegistry();

  it('should register all core tools', () => {
    const list = tools.list();
    expect(list.length).toBeGreaterThanOrEqual(10);
    expect(tools.get('open_application')).toBeDefined();
    expect(tools.get('read_file')).toBeDefined();
    expect(tools.get('write_file')).toBeDefined();
    expect(tools.get('execute_command')).toBeDefined();
  });

  it('should format OpenAI tool definitions correctly', () => {
    const definitions = tools.getOpenAiToolDefinitions();
    expect(Array.isArray(definitions)).toBe(true);
    expect(definitions[0]).toHaveProperty('type', 'function');
    expect(definitions[0].function).toHaveProperty('name');
  });

  it('should execute write_file and read_file tools', async () => {
    const tempFile = path.join(os.tmpdir(), 'openwork_test_' + Date.now() + '.txt');
    const writeTool = tools.get('write_file')!;
    const readTool = tools.get('read_file')!;

    const writeRes = await writeTool.execute({ path: tempFile, content: 'OpenWork test content' });
    expect(writeRes.success).toBe(true);

    const readRes = await readTool.execute({ path: tempFile });
    expect(readRes.success).toBe(true);
    expect(readRes.data.content).toBe('OpenWork test content');

    try { fs.unlinkSync(tempFile); } catch {}
  });

  it('should execute command tool in workspace', async () => {
    const cmdTool = tools.get('execute_command')!;
    const res = await cmdTool.execute({ command: 'echo "OpenWork Agent"' });
    expect(res.success).toBe(true);
    expect(res.data.stdout).toContain('OpenWork Agent');
  });
});