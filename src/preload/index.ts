import { contextBridge, ipcRenderer } from 'electron';

export interface OpenWorkAPI {
  agent: {
    run: (prompt: string, history: any[]) => Promise<string>;
    stop: () => Promise<{ success: boolean }>;
    pause: () => Promise<{ success: boolean }>;
    resume: () => Promise<{ success: boolean }>;
    setMode: (isAgent: boolean) => Promise<{ success: boolean; isAgentMode: boolean }>;
    confirm: (confirmationId: string, confirmed: boolean) => Promise<{ success: boolean }>;
    onActivity: (callback: (step: any) => void) => () => void;
    onStateChanged: (callback: (state: any) => void) => () => void;
    onToken: (callback: (token: string) => void) => () => void;
    onConfirmationRequired: (callback: (step: any) => void) => () => void;
  };
  chats: {
    list: () => Promise<Array<{ id: string; title: string; providerId: string; modelId: string; createdAt: string; updatedAt: string }>>;
    create: (title?: string) => Promise<any>;
    get: (id: string) => Promise<any>;
    saveMessages: (id: string, messages: any[]) => Promise<boolean>;
    rename: (id: string, newTitle: string) => Promise<boolean>;
    delete: (id: string) => Promise<boolean>;
  };
  workspace: {
    selectDialog: () => Promise<string | null>;
    getInfo: () => Promise<{ workspaceRoot: string; stack: any }>;
    listFiles: (subPath?: string) => Promise<Array<{ name: string; path: string; isDirectory: boolean; size: number; modified: string }>>;
    openFile: (filename: string) => Promise<{ success: boolean; error?: string }>;
  };
  providers: {
    list: () => Promise<{ activeProviderId: string; activeModelId: string; providers: any[] }>;
    save: (providerId: string, config: { apiKey?: string; baseUrl?: string; selectedModel?: string }) => Promise<{ success: boolean }>;
    setActive: (providerId: string, modelId?: string) => Promise<{ success: boolean; activeProviderId: string; activeModelId: string }>;
    discoverModels: (providerId: string) => Promise<any[]>;
    testConnection: (providerId: string, customKey?: string) => Promise<{ connected: boolean; status: string; message: string; modelCount?: number }>;
    revealKey: (providerId: string) => Promise<string>;
    deleteKey: (providerId: string) => Promise<{ success: boolean }>;
  };
  memory: {
    list: (category?: string) => Promise<any[]>;
    save: (entry: { category: string; topicKey: string; content: string }) => Promise<any>;
    delete: (id: string) => Promise<boolean>;
    clear: (category?: string) => Promise<{ success: boolean }>;
  };
  settings: {
    get: () => Promise<any>;
    save: (update: any) => Promise<any>;
  };
  voice: {
    getConfig: () => Promise<any>;
    updateConfig: (update: any) => Promise<any>;
  };
}

const api: OpenWorkAPI = {
  agent: {
    run: (prompt, history) => ipcRenderer.invoke('agent:run', prompt, history),
    stop: () => ipcRenderer.invoke('agent:stop'),
    pause: () => ipcRenderer.invoke('agent:pause'),
    resume: () => ipcRenderer.invoke('agent:resume'),
    setMode: (isAgent) => ipcRenderer.invoke('agent:set-mode', isAgent),
    confirm: (confirmationId, confirmed) => ipcRenderer.invoke('agent:confirm', confirmationId, confirmed),
    onActivity: (callback) => {
      const listener = (_: any, data: any) => callback(data);
      ipcRenderer.on('agent:activity', listener);
      return () => ipcRenderer.removeListener('agent:activity', listener);
    },
    onStateChanged: (callback) => {
      const listener = (_: any, data: any) => callback(data);
      ipcRenderer.on('agent:state-changed', listener);
      return () => ipcRenderer.removeListener('agent:state-changed', listener);
    },
    onToken: (callback) => {
      const listener = (_: any, token: string) => callback(token);
      ipcRenderer.on('agent:token', listener);
      return () => ipcRenderer.removeListener('agent:token', listener);
    },
    onConfirmationRequired: (callback) => {
      const listener = (_: any, step: any) => callback(step);
      ipcRenderer.on('agent:confirmation-required', listener);
      return () => ipcRenderer.removeListener('agent:confirmation-required', listener);
    },
  },
  chats: {
    list: () => ipcRenderer.invoke('chats:list'),
    create: (title) => ipcRenderer.invoke('chats:create', title),
    get: (id) => ipcRenderer.invoke('chats:get', id),
    saveMessages: (id, messages) => ipcRenderer.invoke('chats:save-messages', id, messages),
    rename: (id, newTitle) => ipcRenderer.invoke('chats:rename', id, newTitle),
    delete: (id) => ipcRenderer.invoke('chats:delete', id),
  },
  workspace: {
    selectDialog: () => ipcRenderer.invoke('workspace:select-dialog'),
    getInfo: () => ipcRenderer.invoke('workspace:get-info'),
    listFiles: (subPath?: string) => ipcRenderer.invoke('workspace:list-files', subPath),
    openFile: (filename) => ipcRenderer.invoke('workspace:open-file', filename),
  },
  providers: {
    list: () => ipcRenderer.invoke('providers:list'),
    save: (id, cfg) => ipcRenderer.invoke('providers:save', id, cfg),
    setActive: (id, modelId) => ipcRenderer.invoke('providers:set-active', id, modelId),
    discoverModels: (id) => ipcRenderer.invoke('providers:discover-models', id),
    testConnection: (id, key) => ipcRenderer.invoke('providers:test-connection', id, key),
    revealKey: (id) => ipcRenderer.invoke('providers:reveal-key', id),
    deleteKey: (id) => ipcRenderer.invoke('providers:delete-key', id),
  },
  memory: {
    list: (cat) => ipcRenderer.invoke('memory:list', cat),
    save: (entry) => ipcRenderer.invoke('memory:save', entry),
    delete: (id) => ipcRenderer.invoke('memory:delete', id),
    clear: (cat) => ipcRenderer.invoke('memory:clear', cat),
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    save: (update) => ipcRenderer.invoke('settings:save', update),
  },
  voice: {
    getConfig: () => ipcRenderer.invoke('voice:get-config'),
    updateConfig: (cfg) => ipcRenderer.invoke('voice:update-config', cfg),
  },
};

contextBridge.exposeInMainWorld('openwork', api);
