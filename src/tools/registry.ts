export interface ToolParamSchema {
  type: string;
  description: string;
  required?: boolean;
}

export interface ToolDefinition {
  name: string;
  description: string;
  category: 'system' | 'computer' | 'files' | 'terminal' | 'browser' | 'development' | 'applications';
  parameters: Record<string, ToolParamSchema>;
  isDestructive?: boolean;
  execute: (args: any, context?: any) => Promise<{ success: boolean; data?: any; error?: string }>;
}

export class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();

  public register(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  public get(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  public list(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  public getOpenAiToolDefinitions(): any[] {
    return this.list().map(t => ({
      type: 'function',
      function: {
        name: t.name,
        description: t.description,
        parameters: {
          type: 'object',
          properties: Object.fromEntries(
            Object.entries(t.parameters).map(([k, v]) => [
              k,
              { type: v.type, description: v.description }
            ])
          ),
          required: Object.entries(t.parameters)
            .filter(([_, v]) => v.required)
            .map(([k]) => k),
        },
      },
    }));
  }
}
