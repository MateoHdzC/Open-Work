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
  workspace: {
    selectDialog: () => Promise<string | null>;
    getInfo: () => Promise<{ workspaceRoot: string; stack: any }>;
  };
  providers: {
    list: () => Promise<{ activeProviderId: string; activeModelId: string; providers: any[] }>;
    save: (providerId: string, config: { apiKey?: string; baseUrl?: string; selectedModel?: string }) => Promise<{ success: boolean }>;
    setActive: (providerId: string, modelId?: string) => Promise<{ success: boolean; activeProviderId: string; activeModelId: string }>;
    discoverModels: (providerId: string) => Promise<any[]>;
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
  workspace: {
    selectDialog: () => ipcRenderer.invoke('workspace:select-dialog'),
    getInfo: () => ipcRenderer.invoke('workspace:get-info'),
  },
  providers: {
    list: () => ipcRenderer.invoke('providers:list'),
    save: (id, cfg) => ipcRenderer.invoke('providers:save', id, cfg),
    setActive: (id, modelId) => ipcRenderer.invoke('providers:set-active', id, modelId),
    discoverModels: (id) => ipcRenderer.invoke('providers:discover-models', id),
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
