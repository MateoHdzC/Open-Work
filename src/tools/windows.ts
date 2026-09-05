import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { ToolDefinition } from './registry.js';

const execAsync = promisify(exec);

export const openApplicationTool: ToolDefinition = {
  name: 'open_application',
  description: 'Launch a Windows desktop application (e.g., Blender, RobloxStudio, Code, Chrome, Notepad, Unity) and verify its execution.',
  category: 'system',
  parameters: {
    appName: {
      type: 'string',
      description: 'The name or executable of the application to open (e.g. blender, code, chrome, notepad, roblox)',
      required: true,
    },
    args: {
      type: 'string',
      description: 'Optional arguments or file/project path to open with the application',
      required: false,
    },
  },
  execute: async ({ appName, args }) => {
    try {
      const cleanApp = String(appName).trim();
      const targetArgs = args ? ' "' + String(args) + '"' : '';
      const command = 'Start-Process -FilePath "' + cleanApp + '"' + targetArgs + ' -ErrorAction SilentlyContinue';
      
      await execAsync('powershell -NoProfile -Command "' + command + '"');
      await new Promise(r => setTimeout(r, 1200));
      
      const { stdout } = await execAsync('powershell -NoProfile -Command "Get-Process -Name *' + cleanApp + '* -ErrorAction SilentlyContinue | Select-Object -ExpandProperty ProcessName"');
      const running = stdout.trim();
      
      return {
        success: true,
        data: {
          app: cleanApp,
          verified: Boolean(running),
          status: running ? 'Running' : 'Launched',
          processes: running ? running.split(/\r?\n/) : [],
        },
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  },
};

export const listWindowsTool: ToolDefinition = {
  name: 'list_windows',
  description: 'List active visible top-level windows and processes running on the Windows desktop.',
  category: 'system',
  parameters: {},
  execute: async () => {
    try {
      const psCommand = 'Get-Process | Where-Object { $_.MainWindowTitle -ne "" } | Select-Object Id, ProcessName, MainWindowTitle | ConvertTo-Json -Compress';
      const { stdout } = await execAsync('powershell -NoProfile -Command "' + psCommand + '"');
      
      let parsed: any[] = [];
      try {
        const res = JSON.parse(stdout || '[]');
        parsed = Array.isArray(res) ? res : [res];
      } catch {
        parsed = [];
      }

      return {
        success: true,
        data: {
          windows: parsed.map((p: any) => ({
            id: p.Id,
            process: p.ProcessName,
            title: p.MainWindowTitle,
          })),
        },
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  },
};

export const closeApplicationTool: ToolDefinition = {
  name: 'close_application',
  description: 'Close or terminate a running application on Windows by process name.',
  category: 'system',
  isDestructive: true,
  parameters: {
    processName: {
      type: 'string',
      description: 'Process name to close (e.g. notepad, blender)',
      required: true,
    },
  },
  execute: async ({ processName }) => {
    try {
      const clean = String(processName).replace(/[^a-zA-Z0-9_-]/g, '');
      await execAsync('powershell -NoProfile -Command "Stop-Process -Name ' + clean + ' -Force -ErrorAction Stop"');
      return {
        success: true,
        data: { closed: clean, status: 'Terminated' },
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  },
};