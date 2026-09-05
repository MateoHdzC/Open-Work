import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

export interface MemoryEntry {
  id: string;
  category: 'preference' | 'instruction' | 'project' | 'working' | 'custom';
  topicKey: string;
  content: string;
  projectId?: string;
  createdAt: string;
  updatedAt: string;
}

export class MemoryStore {
  private db: DatabaseSync;
  private dbPath: string;

  constructor(customPath?: string) {
    if (customPath) {
      this.dbPath = customPath;
    } else {
      const dir = path.join(os.homedir(), '.openwork');
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      this.dbPath = path.join(dir, 'openwork.sqlite');
    }

    this.db = new DatabaseSync(this.dbPath);
    this.init();
  }

  private init(): void {
    this.db.exec(
      'CREATE TABLE IF NOT EXISTS memories (' +
      'id TEXT PRIMARY KEY, ' +
      'category TEXT NOT NULL, ' +
      'topic_key TEXT NOT NULL, ' +
      'content TEXT NOT NULL, ' +
      'project_id TEXT, ' +
      'created_at TEXT NOT NULL, ' +
      'updated_at TEXT NOT NULL' +
      '); ' +
      'CREATE INDEX IF NOT EXISTS idx_memories_cat ON memories(category); ' +
      'CREATE INDEX IF NOT EXISTS idx_memories_proj ON memories(project_id);'
    );
  }

  public saveMemory(entry: {
    category: MemoryEntry['category'];
    topicKey: string;
    content: string;
    projectId?: string;
  }): MemoryEntry {
    const id = 'mem_' + Math.random().toString(36).substring(2, 10);
    const now = new Date().toISOString();

    const existing = entry.projectId
      ? this.db.prepare('SELECT id FROM memories WHERE category = ? AND topic_key = ? AND project_id = ?').get(entry.category, entry.topicKey, entry.projectId) as { id: string } | undefined
      : this.db.prepare('SELECT id FROM memories WHERE category = ? AND topic_key = ? AND project_id IS NULL').get(entry.category, entry.topicKey) as { id: string } | undefined;

    if (existing) {
      this.db.prepare(
        'UPDATE memories SET content = ?, updated_at = ? WHERE id = ?'
      ).run(entry.content, now, existing.id);

      return {
        id: existing.id,
        category: entry.category,
        topicKey: entry.topicKey,
        content: entry.content,
        projectId: entry.projectId,
        createdAt: now,
        updatedAt: now,
      };
    }

    this.db.prepare(
      'INSERT INTO memories (id, category, topic_key, content, project_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(id, entry.category, entry.topicKey, entry.content, entry.projectId || null, now, now);

    return {
      id,
      category: entry.category,
      topicKey: entry.topicKey,
      content: entry.content,
      projectId: entry.projectId,
      createdAt: now,
      updatedAt: now,
    };
  }

  public listMemories(category?: string, projectId?: string): MemoryEntry[] {
    let sql = 'SELECT id, category, topic_key, content, project_id, created_at, updated_at FROM memories';
    const params: any[] = [];
    const clauses: string[] = [];

    if (category) {
      clauses.push('category = ?');
      params.push(category);
    }
    if (projectId) {
      clauses.push('(project_id = ? OR project_id IS NULL)');
      params.push(projectId);
    }

    if (clauses.length > 0) {
      sql += ' WHERE ' + clauses.join(' AND ');
    }
    sql += ' ORDER BY updated_at DESC';

    const rows = this.db.prepare(sql).all(...params) as Array<{
      id: string;
      category: MemoryEntry['category'];
      topic_key: string;
      content: string;
      project_id: string | null;
      created_at: string;
      updated_at: string;
    }>;

    return rows.map(r => ({
      id: r.id,
      category: r.category,
      topicKey: r.topic_key,
      content: r.content,
      projectId: r.project_id || undefined,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  public deleteMemory(id: string): boolean {
    const res = this.db.prepare('DELETE FROM memories WHERE id = ?').run(id);
    return Boolean(res);
  }

  public clearAll(): void {
    this.db.exec('DELETE FROM memories');
  }

  public getRelevantContext(query: string, projectId?: string): string[] {
    const all = this.listMemories(undefined, projectId);
    if (all.length === 0) return [];

    const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    if (terms.length === 0) {
      return all.slice(0, 5).map(m => '[' + m.category.toUpperCase() + ': ' + m.topicKey + '] ' + m.content);
    }

    const scored = all.map(m => {
      let score = 0;
      const text = (m.topicKey + ' ' + m.content).toLowerCase();
      for (const t of terms) {
        if (text.includes(t)) score += 1;
      }
      return { item: m, score };
    });

    return scored
      .filter(s => s.score > 0 || s.item.category === 'instruction' || s.item.category === 'preference')
      .slice(0, 8)
      .map(s => '[' + s.item.category.toUpperCase() + ': ' + s.item.topicKey + '] ' + s.item.content);
  }
}