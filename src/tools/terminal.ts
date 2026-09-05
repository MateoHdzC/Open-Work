import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { ToolDefinition } from './registry.js';

const execAsync = promisify(exec);

export const executeCommandTool: ToolDefinition = {
  name: 'execute_command',
  description: 'Execute a shell command (PowerShell / CMD) within the active workspace.',
  category: 'terminal',
  parameters: {
    command: { type: 'string', description: 'Command string to execute', required: true },
    shell: { type: 'string', description: 'Shell to use: "powershell" or "cmd"', required: false },
  },
  execute: async ({ command, shell = 'powershell' }, context) => {
    try {
      const workspace = context?.workspaceRoot || process.cwd();
      const isWindows = process.platform === 'win32';
      const shellExecutable = isWindows ? (shell === 'cmd' ? 'cmd.exe' : 'powershell.exe') : '/bin/sh';

      const { stdout, stderr } = await execAsync(String(command), {
        cwd: workspace,
        shell: shellExecutable,
        timeout: 45000,
        maxBuffer: 10 * 1024 * 1024,
      });

      return {
        success: true,
        data: {
          command,
          exitCode: 0,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
        },
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message,
        data: {
          exitCode: err.code || 1,
          stdout: (err.stdout || '').trim(),
          stderr: (err.stderr || '').trim(),
        },
      };
    }
  },
};

export const executePowershellTool: ToolDefinition = {
  name: 'execute_powershell',
  description: 'Execute a PowerShell script or command directly within the workspace with full stdout/stderr capture.',
  category: 'terminal',
  parameters: {
    command: { type: 'string', description: 'PowerShell command or script block', required: true },
  },
  execute: async ({ command }, context) => {
    return executeCommandTool.execute({ command, shell: 'powershell' }, context);
  },
};

export const executeCmdTool: ToolDefinition = {
  name: 'execute_cmd',
  description: 'Execute a Windows Command Prompt (CMD.EXE) command with full stdout/stderr capture.',
  category: 'terminal',
  parameters: {
    command: { type: 'string', description: 'CMD command to execute', required: true },
  },
  execute: async ({ command }, context) => {
    return executeCommandTool.execute({ command, shell: 'cmd' }, context);
  },
};