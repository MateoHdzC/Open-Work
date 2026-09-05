export type AgentState =
  | 'Idle'
  | 'Thinking'
  | 'Running'
  | 'WaitingForConfirmation'
  | 'Paused'
  | 'Completed'
  | 'Failed'
  | 'Cancelled';

export type AgentStepStatus =
  | 'Running'
  | 'Completed'
  | 'Waiting'
  | 'Paused'
  | 'Failed'
  | 'Cancelled';

export interface AgentActivityStep {
  id: string;
  toolName: string;
  parameters?: Record<string, any>;
  description: string;
  status: AgentStepStatus;
  startedAt: string;
  finishedAt?: string;
  result?: any;
  error?: string;
  requiresConfirmation?: boolean;
  verified?: boolean;
  verificationReality?: string;
}

export interface AgentExecutionState {
  isAgentMode: boolean;
  status: AgentState;
  isPaused: boolean;
  currentStep?: AgentActivityStep;
  activityLog: AgentActivityStep[];
  workspaceRoot: string;
  lastVerifiedProcess?: string;
  lastModifiedFiles: string[];
}