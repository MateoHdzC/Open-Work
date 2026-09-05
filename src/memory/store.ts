import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';

export type MemoryCategory = 'permanent' | 'project' | 'conversation' | 'working';

export interface MemoryEntry {
  id: string;
  category: MemoryCategory;
  topicKey: string;
  content: string;
  projectId?: string;
  createdAt: string;
  updatedAt: string;
}

export class MemoryStore {
  private filePath: string;
  private isEnabled: boolean = true;
  private cache: MemoryEntry[] = [];

  constructor(customPath?: string) {
    if (customPath) {
      this.filePath = customPath.endsWith('.json') ? customPath : customPath + '.json';
    } else {
      const dir = path.join(os.homedir(), '.openwork');
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      this.filePath = path.join(dir, 'memories.json');
    }

    this.load();
  }

  private load(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        this.cache = JSON.parse(raw);
      } else {
        this.cache = [];
        this.saveToFile();
      }
    } catch {
      this.cache = [];
    }
  }

  private saveToFile(): void {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(this.cache, null, 2), 'utf-8');
    } catch {}
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  public getEnabled(): boolean {
    return this.isEnabled;
  }

  public saveMemory(entry: {
    category: MemoryCategory;
    topicKey: string;
    content: string;
    projectId?: string;
  }): MemoryEntry {
    const now = new Date().toISOString();

    const existingIndex = this.cache.findIndex(
      (m) =>
        m.category === entry.category &&
        m.topicKey === entry.topicKey &&
        (entry.projectId ? m.projectId === entry.projectId : !m.projectId)
    );

    if (existingIndex >= 0) {
      const updated: MemoryEntry = {
        ...this.cache[existingIndex],
        content: entry.content,
        updatedAt: now,
      };
      this.cache[existingIndex] = updated;
      this.saveToFile();
      return updated;
    }

    const id = 'mem_' + Math.random().toString(36).substring(2, 10);
    const newEntry: MemoryEntry = {
      id,
      category: entry.category,
      topicKey: entry.topicKey,
      content: entry.content,
      projectId: entry.projectId,
      createdAt: now,
      updatedAt: now,
    };

    this.cache.unshift(newEntry);
    this.saveToFile();
    return newEntry;
  }

  public listMemories(category?: MemoryCategory, projectId?: string): MemoryEntry[] {
    let result = [...this.cache];

    if (category) {
      result = result.filter((m) => m.category === category);
    }
    if (projectId) {
      result = result.filter((m) => !m.projectId || m.projectId === projectId);
    }

    return result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  public deleteMemory(id: string): boolean {
    const before = this.cache.length;
    this.cache = this.cache.filter((m) => m.id !== id);
    if (this.cache.length !== before) {
      this.saveToFile();
      return true;
    }
    return false;
  }

  public clearAll(category?: MemoryCategory): void {
    if (category) {
      this.cache = this.cache.filter((m) => m.category !== category);
    } else {
      this.cache = [];
    }
    this.saveToFile();
  }

  public setWorkingMemory(taskDescription: string, stateSummary: string, projectId?: string): void {
    this.saveMemory({
      category: 'working',
      topicKey: 'current_task',
      content: JSON.stringify({
        task: taskDescription,
        state: stateSummary,
        timestamp: new Date().toISOString(),
      }),
      projectId,
    });
  }

  public getWorkingMemory(projectId?: string): any | null {
    const memories = this.listMemories('working', projectId);
    const item = memories.find((m) => m.topicKey === 'current_task');
    if (!item) return null;
    try {
      return JSON.parse(item.content);
    } catch {
      return item.content;
    }
  }

  public handleNaturalMemoryCommand(message: string, projectId?: string): string | null {
    const msg = message.trim();
    const rememberMatch = msg.match(/^(?:recuerda\s+que|remember\s+that)\s+(.+)$/i);
    if (rememberMatch) {
      const fact = rememberMatch[1].trim();
      const topic = fact.slice(0, 30).toLowerCase().replace(/[^a-z0-9]/g, '_');
      this.saveMemory({
        category: 'permanent',
        topicKey: topic,
        content: fact,
        projectId,
      });
      return `Memoria guardada: "${fact}"`;
    }

    const forgetMatch = msg.match(/^(?:olvida\s+que|olvida\s+eso|forget\s+that)\s*(.*)$/i);
    if (forgetMatch) {
      const target = forgetMatch[1]?.trim();
      if (!target) {
        const latest = this.listMemories(undefined, projectId)[0];
        if (latest) {
          this.deleteMemory(latest.id);
          return `Memoria olvidada: "${latest.content}"`;
        }
      } else {
        const found = this.listMemories(undefined, projectId).find(
          (m) => m.content.toLowerCase().includes(target.toLowerCase()) || m.topicKey.includes(target.toLowerCase())
        );
        if (found) {
          this.deleteMemory(found.id);
          return `Memoria eliminada: "${found.content}"`;
        }
      }
    }
    return null;
  }

  public getRelevantContext(query: string, projectId?: string): string[] {
    if (!this.isEnabled) return [];

    const all = this.listMemories(undefined, projectId);
    if (all.length === 0) return [];

    const terms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
    if (terms.length === 0) {
      return all.slice(0, 6).map((m) => `[${m.category.toUpperCase()}: ${m.topicKey}] ${m.content}`);
    }

    const scored = all.map((m) => {
      let score = 0;
      const text = (m.topicKey + ' ' + m.content).toLowerCase();
      for (const t of terms) {
        if (text.includes(t)) score += 1;
      }
      return { item: m, score };
    });

    return scored
      .filter((s) => s.score > 0 || s.item.category === 'permanent')
      .slice(0, 8)
      .map((s) => `[${s.item.category.toUpperCase()}: ${s.item.topicKey}] ${s.item.content}`);
  }
}