export type AgentStepStatus = 'Running' | 'Completed' | 'Waiting' | 'Paused' | 'Failed' | 'Cancelled';

export interface AgentActivityStep {
  id: string;
  toolName: string;
  description: string;
  status: AgentStepStatus;
  startedAt: string;
  finishedAt?: string;
  result?: any;
  error?: string;
  requiresConfirmation?: boolean;
}

export interface AgentExecutionState {
  isAgentMode: boolean;
  isActive: boolean;
  isPaused: boolean;
  currentStep?: AgentActivityStep;
  activityLog: AgentActivityStep[];
  workspaceRoot: string;
  lastVerifiedProcess?: string;
  lastModifiedFiles: string[];
}