import { app, BrowserWindow, ipcMain, dialog, shell, safeStorage } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import os from 'node:os';
import crypto from 'node:crypto';

import { createDefaultToolRegistry } from '../tools/index.js';
import { ModelGateway } from '../providers/gateway.js';
import { ModelDiscoveryEngine } from '../providers/discovery.js';
import { MemoryStore } from '../memory/store.js';
import { SecurityFirewall } from '../security/firewall.js';
import { VerificationEngine } from '../verification/engine.js';
import { AgentEngine } from '../agent/engine.js';
import { VoiceEngine } from '../voice/engine.js';
import { ChatManager } from '../chats/manager.js';
import { ProviderConfig } from '../providers/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

// Config and Key storage in ~/.openwork
const configDir = path.join(os.homedir(), '.openwork');
const configFile = path.join(configDir, 'settings.json');

if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
}

interface AppSettings {
  activeProviderId: string;
  activeModelId: string;
  workspaceRoot: string;
  theme: 'dark' | 'light' | 'system';
  accentColor: string;
  isAgentMode: boolean;
  requireConfirmationForDestructive: boolean;
  voice: {
    enabled: boolean;
    autoSpeak: boolean;
    voiceName?: string;
  };
  providers: Record<string, { apiKeyEncrypted?: string; baseUrl?: string; selectedModel?: string }>;
}

const defaultSettings: AppSettings = {
  activeProviderId: 'openai',
  activeModelId: 'gpt-4o',
  workspaceRoot: process.cwd(),
  theme: 'dark',
  accentColor: '#3b82f6',
  isAgentMode: true,
  requireConfirmationForDestructive: true,
  voice: {
    enabled: true,
    autoSpeak: false,
    voiceName: '',
  },
  providers: {
    openai: { baseUrl: 'https://api.openai.com/v1', selectedModel: 'gpt-4o' },
    anthropic: { baseUrl: 'https://api.anthropic.com/v1', selectedModel: 'claude-3-7-sonnet-20250219' },
    google: { baseUrl: 'https://generativelanguage.googleapis.com', selectedModel: 'gemini-2.0-flash' },
    openrouter: { baseUrl: 'https://openrouter.ai/api/v1', selectedModel: 'openai/gpt-4o' },
    ollama: { baseUrl: 'http://localhost:11434', selectedModel: 'llama3:latest' },
  },
};

function loadSettings(): AppSettings {
  try {
    if (fs.existsSync(configFile)) {
      const raw = fs.readFileSync(configFile, 'utf-8');
      return { ...defaultSettings, ...JSON.parse(raw) };
    }
  } catch {}
  return defaultSettings;
}

function saveSettings(settings: AppSettings): void {
  try {
    fs.writeFileSync(configFile, JSON.stringify(settings, null, 2), 'utf-8');
  } catch {}
}

function encryptSecret(secret: string): string {
  if (!secret) return '';
  try {
    if (safeStorage && safeStorage.isEncryptionAvailable()) {
      return safeStorage.encryptString(secret).toString('base64');
    }
  } catch {}
  // Fallback machine-scoped symmetric encryption
  const key = crypto.createHash('sha256').update(os.hostname() + os.userInfo().username).digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const enc = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  return `${iv.toString('hex')}:${enc.toString('hex')}`;
}

function decryptSecret(encrypted: string): string {
  if (!encrypted) return '';
  try {
    if (safeStorage && safeStorage.isEncryptionAvailable()) {
      return safeStorage.decryptString(Buffer.from(encrypted, 'base64'));
    }
  } catch {}
  try {
    const parts = encrypted.split(':');
    if (parts.length === 2) {
      const iv = Buffer.from(parts[0], 'hex');
      const data = Buffer.from(parts[1], 'hex');
      const key = crypto.createHash('sha256').update(os.hostname() + os.userInfo().username).digest();
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      const dec = Buffer.concat([decipher.update(data), decipher.final()]);
      return dec.toString('utf8');
    }
  } catch {}
  return '';
}

function maskApiKey(key: string): string {
  if (!key) return '';
  if (key.length <= 8) return '••••••••';
  const prefix = key.slice(0, 3);
  const suffix = key.slice(-4);
  return `${prefix}••••••••••••••••${suffix}`;
}

// System Singletons
const settings = loadSettings();
const tools = createDefaultToolRegistry();
const gateway = new ModelGateway();
const discovery = new ModelDiscoveryEngine();
const memory = new MemoryStore();
const chats = new ChatManager();
const security = new SecurityFirewall({
  requireConfirmationForDestructive: settings.requireConfirmationForDestructive,
});
const verification = new VerificationEngine();
const voice = new VoiceEngine(settings.voice);

const providerCatalog: Record<string, ProviderConfig> = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    defaultModels: ['gpt-4o', 'gpt-4o-mini', 'o1', 'o3-mini', 'chatgpt-4o-latest'],
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    defaultModels: ['claude-3-7-sonnet-20250219', 'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'],
  },
  google: {
    id: 'google',
    name: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com',
    defaultModels: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModels: ['openai/gpt-4o', 'anthropic/claude-3.5-sonnet', 'deepseek/deepseek-r1'],
  },
  ollama: {
    id: 'ollama',
    name: 'Ollama (Local)',
    baseUrl: 'http://localhost:11434',
    defaultModels: ['llama3:latest', 'mistral:latest', 'qwen2.5-coder:latest'],
  },
};

function getActiveProviderConfig(): { provider: ProviderConfig; apiKey: string; modelId: string } {
  const pId = settings.activeProviderId || 'openai';
  const baseCfg = providerCatalog[pId] || {
    id: pId,
    name: pId,
    baseUrl: settings.providers[pId]?.baseUrl || 'https://api.openai.com/v1',
    defaultModels: ['gpt-4o'],
  };

  const stored = settings.providers[pId];
  const apiKey = stored?.apiKeyEncrypted ? decryptSecret(stored.apiKeyEncrypted) : '';
  const modelId = stored?.selectedModel || settings.activeModelId || baseCfg.defaultModels[0];

  return {
    provider: { ...baseCfg, baseUrl: stored?.baseUrl || baseCfg.baseUrl },
    apiKey,
    modelId,
  };
}

const activeInfo = getActiveProviderConfig();

const agent = new AgentEngine({
  tools,
  gateway,
  memory,
  security,
  verification,
  workspaceRoot: settings.workspaceRoot,
  provider: activeInfo.provider,
  modelId: activeInfo.modelId,
  apiKey: activeInfo.apiKey,
  onActivity: (step) => {
    mainWindow?.webContents.send('agent:activity', step);
  },
  onStateChange: (state) => {
    mainWindow?.webContents.send('agent:state-changed', state);
  },
  onToken: (token) => {
    mainWindow?.webContents.send('agent:token', token);
  },
  onConfirmationRequired: (step) => {
    mainWindow?.webContents.send('agent:confirmation-required', step);
  },
});
agent.setMode(settings.isAgentMode);

function createWindow() {
  const iconPath = path.resolve(__dirname, '../../assets/icon.png');

  mainWindow = new BrowserWindow({
    title: 'OpenWork — Desktop Agent',
    width: 1280,
    height: 840,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#0c0d12',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    autoHideMenuBar: true,
  });

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  const devUrl = 'http://localhost:5173';

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    const prodHtml = path.join(__dirname, '../renderer/index.html');
    if (fs.existsSync(prodHtml)) {
      mainWindow.loadFile(prodHtml);
    } else {
      mainWindow.loadURL(devUrl);
    }
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App Lifecycle
app.whenReady().then(() => {
  setupIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Setup
function setupIpcHandlers() {
  // Agent Execution
  ipcMain.handle('agent:run', async (_, prompt: string, history: any[]) => {
    const current = getActiveProviderConfig();
    agent.setConfig({
      provider: current.provider,
      apiKey: current.apiKey,
      modelId: current.modelId,
      workspaceRoot: settings.workspaceRoot,
    });
    return agent.runConversation(prompt, history);
  });

  ipcMain.handle('agent:stop', () => {
    agent.stop();
    return { success: true };
  });

  ipcMain.handle('agent:pause', () => {
    agent.pause();
    return { success: true };
  });

  ipcMain.handle('agent:resume', () => {
    agent.resume();
    return { success: true };
  });

  ipcMain.handle('agent:set-mode', (_, isAgent: boolean) => {
    settings.isAgentMode = isAgent;
    saveSettings(settings);
    agent.setMode(isAgent);
    return { success: true, isAgentMode: isAgent };
  });

  ipcMain.handle('agent:confirm', (_, confirmationId: string, confirmed: boolean) => {
    const res = agent.confirmAction(confirmationId, confirmed);
    return { success: res };
  });

  // Chat Sessions
  ipcMain.handle('chats:list', () => {
    return chats.listSessions();
  });

  ipcMain.handle('chats:create', (_, title?: string) => {
    return chats.createSession(title, settings.activeProviderId, settings.activeModelId);
  });

  ipcMain.handle('chats:get', (_, id: string) => {
    return chats.getSession(id);
  });

  ipcMain.handle('chats:save-messages', (_, id: string, messages: any[]) => {
    return chats.saveMessages(id, messages);
  });

  ipcMain.handle('chats:rename', (_, id: string, newTitle: string) => {
    return chats.renameSession(id, newTitle);
  });

  ipcMain.handle('chats:delete', (_, id: string) => {
    return chats.deleteSession(id);
  });

  // Workspace
  ipcMain.handle('workspace:select-dialog', async () => {
    if (!mainWindow) return null;
    const res = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: 'Select OpenWork Workspace',
      defaultPath: settings.workspaceRoot,
    });
    if (!res.canceled && res.filePaths[0]) {
      const selected = res.filePaths[0];
      settings.workspaceRoot = selected;
      saveSettings(settings);
      agent.setWorkspace(selected);
      return selected;
    }
    return null;
  });

  ipcMain.handle('workspace:get-info', async () => {
    const devTool = tools.get('detect_project');
    let stack: any = null;
    if (devTool) {
      const result = await devTool.execute({}, { workspaceRoot: settings.workspaceRoot });
      stack = result.data;
    }
    return {
      workspaceRoot: settings.workspaceRoot,
      stack,
    };
  });

  ipcMain.handle('workspace:list-files', async (_, subPath?: string) => {
    try {
      const root = subPath
        ? (path.isAbsolute(subPath) ? subPath : path.join(settings.workspaceRoot, subPath))
        : settings.workspaceRoot;
      if (!fs.existsSync(root)) return [];
      const entries = fs.readdirSync(root, { withFileTypes: true });
      return entries.map((e) => {
        const full = path.join(root, e.name);
        let size = 0;
        let modified = '';
        try {
          const st = fs.statSync(full);
          size = st.size;
          modified = st.mtime.toISOString();
        } catch {}
        return {
          name: e.name,
          path: full,
          isDirectory: e.isDirectory(),
          size,
          modified,
        };
      });
    } catch {
      return [];
    }
  });

  ipcMain.handle('workspace:open-file', async (_, filename: string) => {
    const target = path.isAbsolute(filename) ? filename : path.join(settings.workspaceRoot, filename);
    if (fs.existsSync(target)) {
      await shell.openPath(target);
      return { success: true };
    }
    return { success: false, error: 'File not found' };
  });

  // Providers & API Keys
  ipcMain.handle('providers:list', () => {
    const list = Object.values(providerCatalog).map((p) => {
      const userP = settings.providers[p.id];
      const hasKey = Boolean(userP?.apiKeyEncrypted);
      const rawKey = userP?.apiKeyEncrypted ? decryptSecret(userP.apiKeyEncrypted) : '';
      return {
        ...p,
        baseUrl: userP?.baseUrl || p.baseUrl,
        hasKey,
        maskedKey: maskApiKey(rawKey),
        selectedModel: userP?.selectedModel || p.defaultModels[0],
      };
    });
    return {
      activeProviderId: settings.activeProviderId,
      activeModelId: settings.activeModelId,
      providers: list,
    };
  });

  ipcMain.handle('providers:reveal-key', (_, pId: string) => {
    const stored = settings.providers[pId];
    return stored?.apiKeyEncrypted ? decryptSecret(stored.apiKeyEncrypted) : '';
  });

  ipcMain.handle('providers:delete-key', (_, pId: string) => {
    if (settings.providers[pId]) {
      settings.providers[pId].apiKeyEncrypted = '';
      saveSettings(settings);
    }
    return { success: true };
  });

  ipcMain.handle('providers:save', async (_, pId: string, config: { apiKey?: string; baseUrl?: string; selectedModel?: string }) => {
    if (!settings.providers[pId]) {
      settings.providers[pId] = {};
    }
    if (config.apiKey !== undefined) {
      settings.providers[pId].apiKeyEncrypted = config.apiKey ? encryptSecret(config.apiKey) : '';
    }
    if (config.baseUrl !== undefined) {
      settings.providers[pId].baseUrl = config.baseUrl;
    }
    if (config.selectedModel !== undefined) {
      settings.providers[pId].selectedModel = config.selectedModel;
      if (settings.activeProviderId === pId) {
        settings.activeModelId = config.selectedModel;
      }
    }
    saveSettings(settings);
    return { success: true };
  });

  ipcMain.handle('providers:set-active', (_, pId: string, modelId?: string) => {
    settings.activeProviderId = pId;
    if (modelId) {
      settings.activeModelId = modelId;
    } else {
      const selected = settings.providers[pId]?.selectedModel;
      settings.activeModelId = selected || providerCatalog[pId]?.defaultModels[0] || 'gpt-4o';
    }
    saveSettings(settings);
    return { success: true, activeProviderId: settings.activeProviderId, activeModelId: settings.activeModelId };
  });

  ipcMain.handle('providers:discover-models', async (_, pId: string) => {
    const base = providerCatalog[pId] || { id: pId, name: pId, baseUrl: '', defaultModels: [] };
    const stored = settings.providers[pId];
    const key = stored?.apiKeyEncrypted ? decryptSecret(stored.apiKeyEncrypted) : '';
    const merged: ProviderConfig = {
      ...base,
      baseUrl: stored?.baseUrl || base.baseUrl,
    };
    return discovery.discoverModels(merged, key);
  });

  ipcMain.handle('providers:test-connection', async (_, pId: string, customKey?: string) => {
    const base = providerCatalog[pId] || { id: pId, name: pId, baseUrl: '', defaultModels: [] };
    const stored = settings.providers[pId];
    const key = customKey !== undefined ? customKey : (stored?.apiKeyEncrypted ? decryptSecret(stored.apiKeyEncrypted) : '');
    const merged: ProviderConfig = {
      ...base,
      baseUrl: stored?.baseUrl || base.baseUrl,
    };
    return gateway.testConnection(merged, key);
  });

  // Memory
  ipcMain.handle('memory:list', (_, category?: any) => {
    return memory.listMemories(category, settings.workspaceRoot);
  });

  ipcMain.handle('memory:save', (_, entry: any) => {
    return memory.saveMemory({
      ...entry,
      projectId: settings.workspaceRoot,
    });
  });

  ipcMain.handle('memory:delete', (_, id: string) => {
    return memory.deleteMemory(id);
  });

  ipcMain.handle('memory:clear', (_, category?: any) => {
    memory.clearAll(category);
    return { success: true };
  });

  // Settings
  ipcMain.handle('settings:get', () => {
    return settings;
  });

  ipcMain.handle('settings:save', (_, update: Partial<AppSettings>) => {
    Object.assign(settings, update);
    if (update.requireConfirmationForDestructive !== undefined) {
      security.setConfirmationPolicy(update.requireConfirmationForDestructive);
    }
    saveSettings(settings);
    return settings;
  });

  // Voice
  ipcMain.handle('voice:get-config', () => {
    return voice.getConfig();
  });

  ipcMain.handle('voice:update-config', (_, cfg: any) => {
    voice.updateConfig(cfg);
    settings.voice = voice.getConfig();
    saveSettings(settings);
    return voice.getConfig();
  });
}
