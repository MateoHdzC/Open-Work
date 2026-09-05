export type RiskLevel = 'safe' | 'sensitive' | 'destructive';

export interface PendingConfirmation {
  id: string;
  toolName: string;
  parameters: Record<string, any>;
  riskLevel: RiskLevel;
  reason: string;
  createdAt: number;
  resolve: (confirmed: boolean) => void;
}

export class SecurityFirewall {
  private pendingConfirmations: Map<string, PendingConfirmation> = new Map();
  private requireConfirmationForDestructive: boolean = true;
  private alwaysAllowAll: boolean = false;

  constructor(options?: { requireConfirmationForDestructive?: boolean; alwaysAllowAll?: boolean }) {
    if (options?.requireConfirmationForDestructive !== undefined) {
      this.requireConfirmationForDestructive = options.requireConfirmationForDestructive;
    }
    if (options?.alwaysAllowAll !== undefined) {
      this.alwaysAllowAll = options.alwaysAllowAll;
    }
  }

  public setConfirmationPolicy(requireConfirmation: boolean): void {
    this.requireConfirmationForDestructive = requireConfirmation;
  }

  public setAutonomousMode(allowAll: boolean): void {
    this.alwaysAllowAll = allowAll;
  }

  public evaluateRisk(toolName: string, parameters: Record<string, any>): { riskLevel: RiskLevel; reason: string } {
    const destructiveTools = ['delete_file', 'delete_directory', 'close_application', 'git_commit'];
    if (destructiveTools.includes(toolName)) {
      let target = '';
      if (parameters.path) target = `target path: ${parameters.path}`;
      if (parameters.processName) target = `process: ${parameters.processName}`;
      return {
        riskLevel: 'destructive',
        reason: `Destructive action detected on ${toolName} (${target || 'system'}). This permanently alters system state.`,
      };
    }

    if (toolName === 'execute_command' || toolName === 'execute_powershell' || toolName === 'execute_cmd') {
      const cmd = String(parameters.command || '').toLowerCase();
      const dangerousPatterns = [
        'format',
        'rmdir /s',
        'del /f',
        'remove-item -recurse',
        'drop table',
        'shutdown',
        'restart-computer',
      ];
      for (const p of dangerousPatterns) {
        if (cmd.includes(p)) {
          return {
            riskLevel: 'destructive',
            reason: `Potentially critical/destructive command detected: "${cmd}".`,
          };
        }
      }
      return { riskLevel: 'sensitive', reason: `Terminal command execution: "${parameters.command}".` };
    }

    if (toolName === 'write_file') {
      return { riskLevel: 'sensitive', reason: `Writing/modifying file at ${parameters.path}.` };
    }

    return { riskLevel: 'safe', reason: 'Safe read-only or standard application interaction.' };
  }

  public needsConfirmation(toolName: string, parameters: Record<string, any>): boolean {
    if (this.alwaysAllowAll) return false;
    const { riskLevel } = this.evaluateRisk(toolName, parameters);
    if (riskLevel === 'destructive' && this.requireConfirmationForDestructive) {
      return true;
    }
    return false;
  }

  public requestConfirmation(
    toolName: string,
    parameters: Record<string, any>,
    resolve: (confirmed: boolean) => void
  ): PendingConfirmation {
    const { riskLevel, reason } = this.evaluateRisk(toolName, parameters);
    const id = `conf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const pending: PendingConfirmation = {
      id,
      toolName,
      parameters,
      riskLevel,
      reason,
      createdAt: Date.now(),
      resolve,
    };
    this.pendingConfirmations.set(id, pending);
    return pending;
  }

  public answerConfirmation(id: string, confirmed: boolean): boolean {
    const pending = this.pendingConfirmations.get(id);
    if (!pending) return false;

    this.pendingConfirmations.delete(id);
    pending.resolve(confirmed);
    return true;
  }

  public answerLatestConfirmation(confirmed: boolean): boolean {
    if (this.pendingConfirmations.size === 0) return false;
    // Get the most recent one
    let latest: PendingConfirmation | null = null;
    for (const item of this.pendingConfirmations.values()) {
      if (!latest || item.createdAt > latest.createdAt) {
        latest = item;
      }
    }
    if (latest) {
      return this.answerConfirmation(latest.id, confirmed);
    }
    return false;
  }

  public getPending(): PendingConfirmation[] {
    return Array.from(this.pendingConfirmations.values());
  }

  public cancelAll(): void {
    for (const pending of this.pendingConfirmations.values()) {
      pending.resolve(false);
    }
    this.pendingConfirmations.clear();
  }
}
