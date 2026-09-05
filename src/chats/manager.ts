import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';

export interface ChatMessageRecord {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: string;
  toolCalls?: Array<{
    id: string;
    name: string;
    parameters: any;
    status: 'Running' | 'Completed' | 'Failed' | 'Waiting' | 'Cancelled';
    result?: any;
    error?: string;
    verified?: boolean;
    verificationReality?: string;
  }>;
}

export interface ChatSession {
  id: string;
  title: string;
  providerId: string;
  modelId: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessageRecord[];
}

export class ChatManager {
  private filePath: string;
  private sessions: ChatSession[] = [];

  constructor(customPath?: string) {
    if (customPath) {
      this.filePath = customPath;
    } else {
      const dir = path.join(os.homedir(), '.openwork');
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      this.filePath = path.join(dir, 'chats.json');
    }
    this.load();
  }

  private load(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        this.sessions = JSON.parse(raw);
      } else {
        this.sessions = [];
        this.saveToFile();
      }
    } catch {
      this.sessions = [];
    }
  }

  private saveToFile(): void {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(this.sessions, null, 2), 'utf-8');
    } catch {}
  }

  public listSessions(): Array<Omit<ChatSession, 'messages'>> {
    return this.sessions
      .map(({ id, title, providerId, modelId, createdAt, updatedAt }) => ({
        id,
        title,
        providerId,
        modelId,
        createdAt,
        updatedAt,
      }))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  public createSession(title: string = 'New Session', providerId: string = 'openai', modelId: string = 'gpt-4o'): ChatSession {
    const id = 'chat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const now = new Date().toISOString();
    const newSession: ChatSession = {
      id,
      title,
      providerId,
      modelId,
      createdAt: now,
      updatedAt: now,
      messages: [],
    };
    this.sessions.unshift(newSession);
    this.saveToFile();
    return newSession;
  }

  public getSession(id: string): ChatSession | null {
    const session = this.sessions.find((s) => s.id === id);
    return session || null;
  }

  public saveMessages(id: string, messages: ChatMessageRecord[]): boolean {
    const session = this.sessions.find((s) => s.id === id);
    if (!session) return false;

    session.messages = messages;
    session.updatedAt = new Date().toISOString();

    // Auto-generate title from first user message if still default
    if (session.title === 'New Session' && messages.length > 0) {
      const firstUserMsg = messages.find((m) => m.role === 'user');
      if (firstUserMsg && firstUserMsg.content) {
        const clean = firstUserMsg.content.trim().replace(/\r?\n/g, ' ');
        session.title = clean.length > 35 ? clean.slice(0, 32) + '...' : clean;
      }
    }

    this.saveToFile();
    return true;
  }

  public renameSession(id: string, newTitle: string): boolean {
    const session = this.sessions.find((s) => s.id === id);
    if (!session) return false;
    session.title = newTitle.trim() || 'Untitled Session';
    session.updatedAt = new Date().toISOString();
    this.saveToFile();
    return true;
  }

  public deleteSession(id: string): boolean {
    const initialLen = this.sessions.length;
    this.sessions = this.sessions.filter((s) => s.id !== id);
    if (this.sessions.length !== initialLen) {
      this.saveToFile();
      return true;
    }
    return false;
  }
}
