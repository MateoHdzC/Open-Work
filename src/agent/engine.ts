import { ToolRegistry } from '../tools/registry.js';
import { ModelGateway } from '../providers/gateway.js';
import { MemoryStore } from '../memory/store.js';
import { ChatMessage, ProviderConfig } from '../providers/types.js';
import { AgentActivityStep, AgentExecutionState } from './types.js';

export interface AgentEngineConfig {
  tools: ToolRegistry;
  gateway: ModelGateway;
  memory: MemoryStore;
  workspaceRoot: string;
  provider: ProviderConfig;
  modelId: string;
  apiKey?: string;
  onActivity?: (step: AgentActivityStep) => void;
  onStateChange?: (state: AgentExecutionState) => void;
  onToken?: (token: string) => void;
  onConfirmationRequired?: (step: AgentActivityStep, resolve: (confirmed: boolean) => void) => void;
}

export class AgentEngine {
  private config: AgentEngineConfig;
  private state: AgentExecutionState;
  private abortController: AbortController | null = null;
  private maxIterations = 12;

  constructor(config: AgentEngineConfig) {
    this.config = config;
    this.state = {
      isAgentMode: true,
      isActive: false,
      isPaused: false,
      activityLog: [],
      workspaceRoot: config.workspaceRoot,
      lastModifiedFiles: [],
    };
  }

  public setMode(isAgent: boolean): void {
    this.state.isAgentMode = isAgent;
    this.emitState();
  }

  public setWorkspace(dir: string): void {
    this.state.workspaceRoot = dir;
    this.config.workspaceRoot = dir;
    this.emitState();
  }

  public stop(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.state.isActive = false;
    this.state.isPaused = false;
    if (this.state.currentStep && this.state.currentStep.status === 'Running') {
      this.state.currentStep.status = 'Cancelled';
    }
    this.emitState();
  }

  public pause(): void {
    this.state.isPaused = true;
    if (this.state.currentStep && this.state.currentStep.status === 'Running') {
      this.state.currentStep.status = 'Paused';
    }
    this.emitState();
  }

  public resume(): void {
    this.state.isPaused = false;
    if (this.state.currentStep && this.state.currentStep.status === 'Paused') {
      this.state.currentStep.status = 'Running';
    }
    this.emitState();
  }

  private emitState(): void {
    if (this.config.onStateChange) {
      this.config.onStateChange({ ...this.state });
    }
  }

  private emitActivity(step: AgentActivityStep): void {
    this.state.currentStep = step;
    this.state.activityLog.push(step);
    if (this.config.onActivity) {
      this.config.onActivity(step);
    }
    this.emitState();
  }

  public async runConversation(prompt: string, history: ChatMessage[] = []): Promise<string> {
    this.state.isActive = true;
    this.abortController = new AbortController();
    this.emitState();

    const relevantMemories = this.config.memory.getRelevantContext(prompt, this.state.workspaceRoot);
    const memoryPrompt = relevantMemories.length > 0
      ? '\n[Persistent Memory Context]:\n' + relevantMemories.join('\n') + '\n'
      : '';

    const systemPrompt: ChatMessage = {
      role: 'system',
      content: 'You are OpenWork, an autonomous Windows AI desktop agent. ' +
        'You have full direct access to Windows applications, mouse/keyboard simulation, files, terminal, browser, and verification tools. ' +
        'When asked to perform tasks (e.g. open apps, run tests, edit files, check websites, inspect windows), call the appropriate tools. ' +
        'Always verify real outcomes. If an action fails, inspect the error and adapt. ' +
        'Active Workspace: ' + this.state.workspaceRoot + memoryPrompt,
    };

    const messages: ChatMessage[] = [
      systemPrompt,
      ...history,
      { role: 'user', content: prompt, timestamp: new Date().toISOString() },
    ];

    let currentIteration = 0;
    let finalAssistantResponse = '';

    while (currentIteration < this.maxIterations && this.state.isActive) {
      currentIteration++;

      while (this.state.isPaused) {
        await new Promise(r => setTimeout(r, 400));
        if (!this.state.isActive) return 'Execution stopped by user.';
      }

      const response = await this.config.gateway.callModel({
        provider: this.config.provider,
        modelId: this.config.modelId,
        messages,
        tools: this.state.isAgentMode ? this.config.tools : undefined,
        apiKey: this.config.apiKey,
        onToken: this.config.onToken,
      });

      if (!response.toolCalls || response.toolCalls.length === 0 || !this.state.isAgentMode) {
        finalAssistantResponse = response.content;
        break;
      }

      messages.push({
        role: 'assistant',
        content: response.content,
        toolCalls: response.toolCalls.map(tc => ({
          id: tc.id,
          name: tc.name,
          arguments: JSON.stringify(tc.arguments),
        })),
      });

      for (const tc of response.toolCalls) {
        if (!this.state.isActive) break;

        const toolDef = this.config.tools.get(tc.name);
        const stepId = 'step_' + Math.random().toString(36).substring(2, 9);
        const step: AgentActivityStep = {
          id: stepId,
          toolName: tc.name,
          description: 'Executing ' + tc.name + ' with args: ' + JSON.stringify(tc.arguments),
          status: 'Running',
          startedAt: new Date().toISOString(),
          requiresConfirmation: toolDef?.isDestructive,
        };

        this.emitActivity(step);

        if (toolDef?.isDestructive) {
          step.status = 'Waiting';
          this.emitState();
          const confirmed = await this.requestUserConfirmation(step);
          if (!confirmed) {
            step.status = 'Cancelled';
            step.error = 'Action denied by user';
            this.emitState();
            messages.push({
              role: 'tool',
              toolCallId: tc.id,
              content: JSON.stringify({ success: false, error: 'User denied confirmation for ' + tc.name }),
            });
            continue;
          }
          step.status = 'Running';
          this.emitState();
        }

        let result: any;
        if (!toolDef) {
          result = { success: false, error: 'Tool not found: ' + tc.name };
          step.status = 'Failed';
          step.error = result.error;
        } else {
          try {
            result = await toolDef.execute(tc.arguments, { workspaceRoot: this.state.workspaceRoot });
            step.status = result.success ? 'Completed' : 'Failed';
            step.result = result.data;
            step.error = result.error;

            if (tc.name === 'open_application' && result.data?.app) {
              this.state.lastVerifiedProcess = result.data.app;
            }
            if (tc.name === 'write_file' && tc.arguments?.path) {
              this.state.lastModifiedFiles.push(tc.arguments.path);
            }
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            result = { success: false, error: msg };
            step.status = 'Failed';
            step.error = msg;
          }
        }

        step.finishedAt = new Date().toISOString();
        this.emitState();

        messages.push({
          role: 'tool',
          toolCallId: tc.id,
          content: JSON.stringify(result),
        });
      }
    }

    this.state.isActive = false;
    this.emitState();
    return finalAssistantResponse;
  }

  private async requestUserConfirmation(step: AgentActivityStep): Promise<boolean> {
    if (this.config.onConfirmationRequired) {
      return new Promise((resolve) => {
        this.config.onConfirmationRequired!(step, resolve);
      });
    }
    return true;
  }
}