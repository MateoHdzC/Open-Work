export type NavigationTab = 'chat' | 'workspace' | 'activity' | 'memory' | 'settings';

export interface ChatSessionSummary {
  id: string;
  title: string;
  providerId: string;
  modelId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessageUI {
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

export interface ActivityStepUI {
  id: string;
  toolName: string;
  parameters?: Record<string, any>;
  description: string;
  status: 'Running' | 'Completed' | 'Failed' | 'Waiting' | 'Paused' | 'Cancelled';
  startedAt: string;
  finishedAt?: string;
  result?: any;
  error?: string;
  requiresConfirmation?: boolean;
  verified?: boolean;
  verificationReality?: string;
}

export interface ProviderUI {
  id: string;
  name: string;
  baseUrl: string;
  hasKey: boolean;
  maskedKey?: string;
  selectedModel: string;
  defaultModels: string[];
}

export interface MemoryItemUI {
  id: string;
  category: 'permanent' | 'project' | 'conversation' | 'working';
  topicKey: string;
  content: string;
  projectId?: string;
  createdAt: string;
  updatedAt: string;
}
