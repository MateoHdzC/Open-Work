import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryStore } from '../src/memory/store.js';
import path from 'node:path';
import os from 'node:os';

describe('MemoryStore', () => {
  let memory: MemoryStore;

  beforeEach(() => {
    const tempDb = path.join(os.tmpdir(), 'test_openwork_' + Math.random().toString(36).substring(2) + '.sqlite');
    memory = new MemoryStore(tempDb);
  });

  it('should save and list memories', () => {
    const saved = memory.saveMemory({
      category: 'permanent',
      topicKey: 'language',
      content: 'User prefers TypeScript over JavaScript',
    });

    expect(saved).toHaveProperty('id');
    expect(saved.content).toBe('User prefers TypeScript over JavaScript');

    const list = memory.listMemories('permanent');
    expect(list.length).toBe(1);
    expect(list[0].topicKey).toBe('language');
  });

  it('should update existing memory with same topic key', () => {
    memory.saveMemory({
      category: 'permanent',
      topicKey: 'accentColor',
      content: 'Blue',
    });

    const updated = memory.saveMemory({
      category: 'permanent',
      topicKey: 'accentColor',
      content: 'Cyan',
    });

    const list = memory.listMemories('permanent');
    expect(list.length).toBe(1);
    expect(list[0].content).toBe('Cyan');
  });

  it('should retrieve relevant context based on query terms', () => {
    memory.saveMemory({
      category: 'project',
      topicKey: 'blender-setup',
      content: 'Using Blender 4.2 with custom Python scripts',
    });

    const context = memory.getRelevantContext('Can you open my blender project?');
    expect(context.length).toBeGreaterThan(0);
    expect(context[0]).toContain('Blender');
  });

  it('should delete memory by id', () => {
    const saved = memory.saveMemory({
      category: 'permanent',
      topicKey: 'temp',
      content: 'Temporary instruction',
    });

    const deleted = memory.deleteMemory(saved.id);
    expect(deleted).toBe(true);
    expect(memory.listMemories().length).toBe(0);
  });

  it('should handle natural memory commands', () => {
    const ack = memory.handleNaturalMemoryCommand('Recuerda que uso TypeScript');
    expect(ack).toContain('Memoria guardada');

    const list = memory.listMemories('permanent');
    expect(list.length).toBe(1);
    expect(list[0].content).toBe('uso TypeScript');
  });
});