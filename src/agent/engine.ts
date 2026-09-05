import { ToolRegistry } from '../tools/registry.js';
import { ModelGateway } from '../providers/gateway.js';
import { MemoryStore } from '../memory/store.js';
import { SecurityFirewall } from '../security/firewall.js';
import { VerificationEngine } from '../verification/engine.js';
import { ChatMessage, ProviderConfig } from '../providers/types.js';
import { AgentActivityStep, AgentExecutionState, AgentState } from './types.js';

export interface AgentEngineConfig {
  tools: ToolRegistry;
  gateway: ModelGateway;
  memory: MemoryStore;
  security: SecurityFirewall;
  verification: VerificationEngine;
  workspaceRoot: string;
  provider: ProviderConfig;
  modelId: string;
  apiKey?: string;
  onActivity?: (step: AgentActivityStep) => void;
  onStateChange?: (state: AgentExecutionState) => void;
  onToken?: (token: string) => void;
  onConfirmationRequired?: (
    step: AgentActivityStep,
    confirm: (confirmed: boolean) => void
  ) => void;
}

export class AgentEngine {
  private config: AgentEngineConfig;
  private state: AgentExecutionState;
  private abortController: AbortController | null = null;
  private maxIterations = 15;
  private pausePromiseResolve: (() => void) | null = null;

  constructor(config: AgentEngineConfig) {
    this.config = config;
    this.state = {
      isAgentMode: true,
      status: 'Idle',
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

  public setConfig(update: Partial<AgentEngineConfig>): void {
    this.config = { ...this.config, ...update };
  }

  public stop(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    if (this.pausePromiseResolve) {
      this.pausePromiseResolve();
      this.pausePromiseResolve = null;
    }
    this.state.isPaused = false;
    this.state.status = 'Cancelled';
    if (this.state.currentStep && this.state.currentStep.status === 'Running') {
      this.state.currentStep.status = 'Cancelled';
      this.state.currentStep.finishedAt = new Date().toISOString();
    }
    this.emitState();
  }

  public pause(): void {
    this.state.isPaused = true;
    this.state.status = 'Paused';
    if (this.state.currentStep && this.state.currentStep.status === 'Running') {
      this.state.currentStep.status = 'Paused';
    }
    this.emitState();
  }

  public resume(): void {
    this.state.isPaused = false;
    this.state.status = 'Running';
    if (this.state.currentStep && this.state.currentStep.status === 'Paused') {
      this.state.currentStep.status = 'Running';
    }
    if (this.pausePromiseResolve) {
      this.pausePromiseResolve();
      this.pausePromiseResolve = null;
    }
    this.emitState();
  }

  public confirmAction(id: string, confirmed: boolean): boolean {
    return this.config.security.answerConfirmation(id, confirmed);
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

  private async waitIfPaused(): Promise<void> {
    if (this.state.isPaused) {
      await new Promise<void>(resolve => {
        this.pausePromiseResolve = resolve;
      });
    }
  }

  public async runConversation(prompt: string, history: ChatMessage[] = []): Promise<string> {
    // Check natural memory commands first
    const memoryAck = this.config.memory.handleNaturalMemoryCommand(prompt, this.state.workspaceRoot);
    if (memoryAck) {
      this.state.status = 'Completed';
      this.emitState();
      return memoryAck;
    }

    this.state.status = 'Thinking';
    this.abortController = new AbortController();
    this.emitState();

    // Check if resuming from previous working memory
    let resumedContext = '';
    if (prompt.toLowerCase().includes('continúa donde nos quedamos') || prompt.toLowerCase().includes('resume where we left')) {
      const lastWork = this.config.memory.getWorkingMemory(this.state.workspaceRoot);
      if (lastWork) {
        resumedContext = `\n[Resumed Task State]: Previous task was "${lastWork.task}". State: "${lastWork.state}". Continue from here.\n`;
      }
    }

    const relevantMemories = this.config.memory.getRelevantContext(prompt, this.state.workspaceRoot);
    const memoryPrompt = relevantMemories.length > 0
      ? '\n[Persistent Memory Context]:\n' + relevantMemories.join('\n') + '\n'
      : '';

    const systemPrompt: ChatMessage = {
      role: 'system',
      content:
        'You are OpenWork, an autonomous Windows desktop agent environment. ' +
        'IMPORTANT: You are NOT an AI model created by OpenWork. OpenWork provides you with real Windows execution tools, files, terminal, browser, and hardware controls. ' +
        'The reality of Windows is the source of truth. Always call tools to verify actions. ' +
        'Never pretend a file was created or an app was opened without executing and verifying it. ' +
        'Active Workspace: ' + this.state.workspaceRoot + memoryPrompt + resumedContext,
    };

    const messages: ChatMessage[] = [
      systemPrompt,
      ...history,
      { role: 'user', content: prompt, timestamp: new Date().toISOString() },
    ];

    let currentIteration = 0;
    let finalAssistantResponse = '';

    try {
      while (currentIteration < this.maxIterations) {
        await this.waitIfPaused();
        if (this.abortController.signal.aborted) {
          this.state.status = 'Cancelled';
          this.emitState();
          return 'Execution cancelled by user.';
        }

        currentIteration++;
        this.state.status = 'Thinking';
        this.emitState();

        const modelResponse = await this.config.gateway.callModel({
          provider: this.config.provider,
          modelId: this.config.modelId,
          apiKey: this.config.apiKey,
          messages,
          tools: this.state.isAgentMode ? this.config.tools : undefined,
          onToken: (token) => {
            if (this.config.onToken) this.config.onToken(token);
          },
        });

        if (modelResponse.content) {
          finalAssistantResponse = modelResponse.content;
        }

        // If no tool calls, or in CHAT mode, we are done
        if (!this.state.isAgentMode || !modelResponse.toolCalls || modelResponse.toolCalls.length === 0) {
          this.state.status = 'Completed';
          this.emitState();
          // Update working memory
          this.config.memory.setWorkingMemory(prompt, finalAssistantResponse.slice(0, 200), this.state.workspaceRoot);
          return finalAssistantResponse;
        }

        // Add assistant's tool call message
        messages.push({
          role: 'assistant',
          content: modelResponse.content || '',
          toolCalls: modelResponse.toolCalls,
        });

        // Execute tool calls
        for (const tc of modelResponse.toolCalls) {
          await this.waitIfPaused();
          if (this.abortController.signal.aborted) {
            this.state.status = 'Cancelled';
            this.emitState();
            return 'Execution cancelled by user.';
          }

          let parsedArgs: Record<string, any> = {};
          try {
            parsedArgs = typeof tc.arguments === 'string' ? JSON.parse(tc.arguments) : tc.arguments;
          } catch {
            parsedArgs = {};
          }

          const step: AgentActivityStep = {
            id: tc.id,
            toolName: tc.name,
            parameters: parsedArgs,
            description: `Calling ${tc.name}`,
            status: 'Running',
            startedAt: new Date().toISOString(),
          };

          // Check security firewall
          if (this.config.security.needsConfirmation(tc.name, parsedArgs)) {
            step.requiresConfirmation = true;
            step.status = 'Waiting';
            this.state.status = 'WaitingForConfirmation';
            this.emitActivity(step);

            const userApproved = await new Promise<boolean>((resolve) => {
              this.config.security.requestConfirmation(tc.name, parsedArgs, resolve);
              if (this.config.onConfirmationRequired) {
                this.config.onConfirmationRequired(step, resolve);
              }
            });

            if (!userApproved) {
              step.status = 'Cancelled';
              step.error = 'Action rejected by user confirmation policy.';
              step.finishedAt = new Date().toISOString();
              this.emitActivity(step);

              messages.push({
                role: 'tool',
                toolCallId: tc.id,
                content: JSON.stringify({
                  success: false,
                  error: 'Action cancelled: User denied permission.',
                }),
              });
              continue;
            }
          }

          this.state.status = 'Running';
          step.status = 'Running';
          this.emitActivity(step);

          const tool = this.config.tools.get(tc.name);
          let toolResult: any;

          if (!tool) {
            toolResult = { success: false, error: `Tool "${tc.name}" is not registered in OpenWork.` };
            step.status = 'Failed';
            step.error = toolResult.error;
          } else {
            try {
              toolResult = await tool.execute(parsedArgs, { workspaceRoot: this.state.workspaceRoot });
              step.status = toolResult.success ? 'Completed' : 'Failed';
              step.result = toolResult.data;
              step.error = toolResult.error;

              // Run empirical verification on Windows
              if (tc.name === 'open_application' && parsedArgs.appName) {
                const check = await this.config.verification.verifyApplicationRunning(parsedArgs.appName);
                step.verified = check.verified;
                step.verificationReality = check.reality;
              } else if (tc.name === 'write_file' && parsedArgs.path) {
                const check = this.config.verification.verifyFileExists(parsedArgs.path, this.state.workspaceRoot);
                step.verified = check.verified;
                step.verificationReality = check.reality;
                this.state.lastModifiedFiles.push(parsedArgs.path);
              } else if (tc.name === 'run_tests') {
                step.verified = toolResult.success;
                step.verificationReality = toolResult.success ? 'Verified: Tests passed.' : 'Verified: Tests failed.';
              }
            } catch (err: any) {
              toolResult = { success: false, error: err.message || String(err) };
              step.status = 'Failed';
              step.error = toolResult.error;
            }
          }

          step.finishedAt = new Date().toISOString();
          this.emitActivity(step);

          messages.push({
            role: 'tool',
            toolCallId: tc.id,
            content: JSON.stringify(toolResult),
          });
        }
      }

      this.state.status = 'Completed';
      this.emitState();
      return finalAssistantResponse;
    } catch (err: any) {
      this.state.status = 'Failed';
      this.emitState();
      throw err;
    }
  }
}