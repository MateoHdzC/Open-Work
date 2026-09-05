export interface ModelCapability {
  tools: boolean;
  vision: boolean;
  reasoning: boolean;
  streaming: boolean;
  computerUse: boolean;
}

export interface ModelInfo {
  id: string;
  name: string;
  providerId: string;
  capabilities: ModelCapability;
  recommended?: boolean;
}

export interface ProviderConfig {
  id: string;
  name: string;
  baseUrl: string;
  apiKey?: string;
  authHeaderName?: string;
  defaultModels: string[];
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCallId?: string;
  toolCalls?: Array<{
    id: string;
    name: string;
    arguments: string;
  }>;
  timestamp?: string;
}