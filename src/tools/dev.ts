import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { ToolDefinition } from './registry.js';

const execAsync = promisify(exec);

export const gitStatusTool: ToolDefinition = {
  name: 'git_status',
  description: 'Get current Git branch, modified files, untracked files, and working tree status.',
  category: 'development',
  parameters: {},
  execute: async (_, context) => {
    try {
      const workspace = context?.workspaceRoot || process.cwd();
      const { stdout } = await execAsync('git status --short --branch', { cwd: workspace });
      return {
        success: true,
        data: { status: stdout.trim() },
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  },
};

export const runTestsTool: ToolDefinition = {
  name: 'run_tests',
  description: 'Execute project unit or integration test suite (e.g. npm test, pytest, cargo test, dotnet test) and verify outcome.',
  category: 'development',
  parameters: {
    command: { type: 'string', description: 'Test command to run (defaults to "npm test")', required: false },
  },
  execute: async ({ command = 'npm test' }, context) => {
    try {
      const workspace = context?.workspaceRoot || process.cwd();
      const { stdout, stderr } = await execAsync(command, { cwd: workspace, timeout: 60000 });
      return {
        success: true,
        data: {
          command,
          exitCode: 0,
          output: stdout.trim() + (stderr ? '\n' + stderr.trim() : ''),
          status: 'Passed',
        },
      };
    } catch (err: any) {
      return {
        success: false,
        error: 'Tests failed or timed out: ' + err.message,
        data: {
          exitCode: err.code || 1,
          output: (err.stdout || '') + '\n' + (err.stderr || ''),
          status: 'Failed',
        },
      };
    }
  },
};