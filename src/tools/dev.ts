import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
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

export const gitDiffTool: ToolDefinition = {
  name: 'git_diff',
  description: 'Get git diff of unstaged or staged changes in the workspace.',
  category: 'development',
  parameters: {
    staged: { type: 'boolean', description: 'Whether to inspect staged changes (--staged)', required: false },
    file: { type: 'string', description: 'Optional specific file to diff', required: false },
  },
  execute: async ({ staged, file }, context) => {
    try {
      const workspace = context?.workspaceRoot || process.cwd();
      const stageFlag = staged ? '--staged' : '';
      const fileArg = file ? ` "${file}"` : '';
      const { stdout } = await execAsync(`git diff ${stageFlag}${fileArg}`, { cwd: workspace });
      return {
        success: true,
        data: { diff: stdout.trim() || 'No changes.' },
      };
    } catch (err: unknown) {
      return { success: false, error: String(err) };
    }
  },
};

export const gitLogTool: ToolDefinition = {
  name: 'git_log',
  description: 'Get recent git commits log.',
  category: 'development',
  parameters: {
    count: { type: 'number', description: 'Number of recent commits to show (default 5)', required: false },
  },
  execute: async ({ count = 5 }, context) => {
    try {
      const workspace = context?.workspaceRoot || process.cwd();
      const { stdout } = await execAsync(`git log -n ${parseInt(String(count), 10) || 5} --oneline`, { cwd: workspace });
      return {
        success: true,
        data: { log: stdout.trim() },
      };
    } catch (err: unknown) {
      return { success: false, error: String(err) };
    }
  },
};

export const gitBranchTool: ToolDefinition = {
  name: 'git_branch',
  description: 'List local and remote git branches.',
  category: 'development',
  parameters: {},
  execute: async (_, context) => {
    try {
      const workspace = context?.workspaceRoot || process.cwd();
      const { stdout } = await execAsync('git branch -a', { cwd: workspace });
      return {
        success: true,
        data: { branches: stdout.trim() },
      };
    } catch (err: unknown) {
      return { success: false, error: String(err) };
    }
  },
};

export const gitCommitTool: ToolDefinition = {
  name: 'git_commit',
  description: 'Stage specified files or all changes and create a git commit with a message.',
  category: 'development',
  isDestructive: true,
  parameters: {
    message: { type: 'string', description: 'Commit message', required: true },
    addAll: { type: 'boolean', description: 'Whether to stage all files (git add .)', required: false },
  },
  execute: async ({ message, addAll = true }, context) => {
    try {
      const workspace = context?.workspaceRoot || process.cwd();
      if (addAll) {
        await execAsync('git add .', { cwd: workspace });
      }
      const escapedMsg = String(message).replace(/"/g, '\\"');
      const { stdout } = await execAsync(`git commit -m "${escapedMsg}"`, { cwd: workspace });
      return {
        success: true,
        data: { output: stdout.trim() },
      };
    } catch (err: unknown) {
      return { success: false, error: String(err) };
    }
  },
};

export const detectProjectTool: ToolDefinition = {
  name: 'detect_project',
  description: 'Inspect workspace directory to automatically detect stack, build tools, package managers, and test runners.',
  category: 'development',
  parameters: {},
  execute: async (_, context) => {
    try {
      const root = context?.workspaceRoot || process.cwd();
      const detected: {
        types: string[];
        packageManagers: string[];
        frameworks: string[];
        hasGit: boolean;
        filesFound: string[];
      } = {
        types: [],
        packageManagers: [],
        frameworks: [],
        hasGit: fs.existsSync(path.join(root, '.git')),
        filesFound: [],
      };

      const checks: Record<string, { type: string; pm?: string; fw?: string }> = {
        'package.json': { type: 'Node.js / JavaScript / TypeScript', pm: 'npm' },
        'pnpm-lock.yaml': { type: 'Node.js', pm: 'pnpm' },
        'yarn.lock': { type: 'Node.js', pm: 'yarn' },
        'bun.lockb': { type: 'Node.js / Bun', pm: 'bun' },
        'requirements.txt': { type: 'Python', pm: 'pip' },
        'pyproject.toml': { type: 'Python', pm: 'poetry/flit/pip' },
        'Pipfile': { type: 'Python', pm: 'pipenv' },
        'pom.xml': { type: 'Java', pm: 'Maven' },
        'build.gradle': { type: 'Java / Kotlin / Android', pm: 'Gradle' },
        'build.gradle.kts': { type: 'Kotlin / Gradle', pm: 'Gradle' },
        'Cargo.toml': { type: 'Rust', pm: 'Cargo' },
        'go.mod': { type: 'Go' },
        'composer.json': { type: 'PHP', pm: 'Composer' },
        'CMakeLists.txt': { type: 'C / C++' },
        'Makefile': { type: 'Make / C / C++' },
      };

      for (const [filename, info] of Object.entries(checks)) {
        if (fs.existsSync(path.join(root, filename))) {
          detected.filesFound.push(filename);
          if (!detected.types.includes(info.type)) detected.types.push(info.type);
          if (info.pm && !detected.packageManagers.includes(info.pm)) detected.packageManagers.push(info.pm);
        }
      }

      // Check for .sln or .csproj
      try {
        const files = fs.readdirSync(root);
        for (const f of files) {
          if (f.endsWith('.sln') || f.endsWith('.csproj')) {
            detected.types.push('C# / .NET');
            detected.filesFound.push(f);
            break;
          }
        }
      } catch {}

      return {
        success: true,
        data: detected,
      };
    } catch (err: unknown) {
      return { success: false, error: String(err) };
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

export const runBuildTool: ToolDefinition = {
  name: 'run_build',
  description: 'Execute project build command (e.g. npm run build, cargo build, dotnet build, gradlew build) and verify result.',
  category: 'development',
  parameters: {
    command: { type: 'string', description: 'Build command to run (defaults to "npm run build")', required: false },
  },
  execute: async ({ command = 'npm run build' }, context) => {
    try {
      const workspace = context?.workspaceRoot || process.cwd();
      const { stdout, stderr } = await execAsync(command, { cwd: workspace, timeout: 120000 });
      return {
        success: true,
        data: {
          command,
          exitCode: 0,
          output: stdout.trim() + (stderr ? '\n' + stderr.trim() : ''),
          status: 'Build Succeeded',
        },
      };
    } catch (err: any) {
      return {
        success: false,
        error: 'Build failed: ' + err.message,
        data: {
          exitCode: err.code || 1,
          output: (err.stdout || '') + '\n' + (err.stderr || ''),
          status: 'Build Failed',
        },
      };
    }
  },
};