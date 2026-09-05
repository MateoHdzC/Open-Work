import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { ToolDefinition } from './registry.js';

const execAsync = promisify(exec);

export const openApplicationTool: ToolDefinition = {
  name: 'open_application',
  description: 'Launch a Windows desktop application (e.g. Blender, VS Code, Roblox Studio, Chrome, Notepad, Unity) and verify its execution.',
  category: 'system',
  parameters: {
    appName: {
      type: 'string',
      description: 'The executable or application name (e.g. blender, code, chrome, notepad, roblox)',
      required: true,
    },
    args: {
      type: 'string',
      description: 'Optional arguments or file path to open with the application',
      required: false,
    },
  },
  execute: async ({ appName, args }) => {
    try {
      const cleanApp = String(appName).trim();
      const targetArgs = args ? ' "' + String(args).replace(/"/g, '`"') + '"' : '';
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
          processes: running ? running.split(/\r?\n/).filter(Boolean) : [],
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

export const getActiveWindowTool: ToolDefinition = {
  name: 'get_active_window',
  description: 'Get details about the currently active foreground window on Windows.',
  category: 'system',
  parameters: {},
  execute: async () => {
    try {
      const ps = `
        Add-Type @"
          using System;
          using System.Runtime.InteropServices;
          using System.Text;
          public class WinFinder {
            [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
            [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);
            [DllImport("user32.dll", SetLastError=true)] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
          }
"@
        $hwnd = [WinFinder]::GetForegroundWindow()
        $sb = New-Object System.Text.StringBuilder 256
        [void][WinFinder]::GetWindowText($hwnd, $sb, 256)
        $pidOut = 0
        [void][WinFinder]::GetWindowThreadProcessId($hwnd, [ref]$pidOut)
        $proc = Get-Process -Id $pidOut -ErrorAction SilentlyContinue
        @{
          title = $sb.ToString()
          process = if ($proc) { $proc.ProcessName } else { "" }
          pid = $pidOut
        } | ConvertTo-Json -Compress
      `;
      const { stdout } = await execAsync(`powershell -NoProfile -Command "${ps.replace(/"/g, '`"')}"`);
      const parsed = JSON.parse(stdout || '{}');
      return { success: true, data: parsed };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  },
};

export const focusWindowTool: ToolDefinition = {
  name: 'focus_window',
  description: 'Bring a specific window to the foreground and focus it by process name or window title keyword.',
  category: 'system',
  parameters: {
    target: {
      type: 'string',
      description: 'Window title substring or process name to bring to foreground',
      required: true,
    },
  },
  execute: async ({ target }) => {
    try {
      const clean = String(target).trim();
      const ps = `
        Add-Type @"
          using System;
          using System.Runtime.InteropServices;
          public class WinFocus {
            [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
            [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
          }
"@
        $p = Get-Process | Where-Object { ($_.MainWindowTitle -like "*${clean}*" -or $_.ProcessName -like "*${clean}*") -and $_.MainWindowHandle -ne 0 } | Select-Object -First 1
        if ($p) {
          [WinFocus]::ShowWindow($p.MainWindowHandle, 9)
          [WinFocus]::SetForegroundWindow($p.MainWindowHandle)
          @{ success = $true; process = $p.ProcessName; title = $p.MainWindowTitle } | ConvertTo-Json -Compress
        } else {
          @{ success = $false; error = "Window not found matching: ${clean}" } | ConvertTo-Json -Compress
        }
      `;
      const { stdout } = await execAsync(`powershell -NoProfile -Command "${ps.replace(/"/g, '`"')}"`);
      const parsed = JSON.parse(stdout || '{}');
      return { success: parsed.success, data: parsed };
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
      const command = `Stop-Process -Name "${clean}" -Force -ErrorAction SilentlyContinue`;
      await execAsync(`powershell -NoProfile -Command "${command}"`);
      await new Promise(r => setTimeout(r, 600));

      const { stdout } = await execAsync(`powershell -NoProfile -Command "Get-Process -Name ${clean} -ErrorAction SilentlyContinue"`);
      const terminated = !stdout.trim();

      return {
        success: terminated,
        data: {
          process: clean,
          terminated,
          status: terminated ? 'Closed' : 'Still Active',
        },
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  },
};

export const minimizeWindowTool: ToolDefinition = {
  name: 'minimize_window',
  description: 'Minimize a window by title or process name.',
  category: 'system',
  parameters: {
    target: { type: 'string', description: 'Window title substring or process name', required: true },
  },
  execute: async ({ target }) => {
    try {
      const clean = String(target).trim();
      const ps = `
        Add-Type @"
          using System;
          using System.Runtime.InteropServices;
          public class WinMin {
            [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
          }
"@
        $p = Get-Process | Where-Object { ($_.MainWindowTitle -like "*${clean}*" -or $_.ProcessName -like "*${clean}*") -and $_.MainWindowHandle -ne 0 } | Select-Object -First 1
        if ($p) {
          [WinMin]::ShowWindow($p.MainWindowHandle, 6) # SW_MINIMIZE = 6
          @{ success = $true } | ConvertTo-Json -Compress
        } else {
          @{ success = $false; error = "Window not found" } | ConvertTo-Json -Compress
        }
      `;
      const { stdout } = await execAsync(`powershell -NoProfile -Command "${ps.replace(/"/g, '`"')}"`);
      return { success: true, data: JSON.parse(stdout || '{}') };
    } catch (err: unknown) {
      return { success: false, error: String(err) };
    }
  },
};

export const maximizeWindowTool: ToolDefinition = {
  name: 'maximize_window',
  description: 'Maximize a window by title or process name.',
  category: 'system',
  parameters: {
    target: { type: 'string', description: 'Window title substring or process name', required: true },
  },
  execute: async ({ target }) => {
    try {
      const clean = String(target).trim();
      const ps = `
        Add-Type @"
          using System;
          using System.Runtime.InteropServices;
          public class WinMax {
            [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
          }
"@
        $p = Get-Process | Where-Object { ($_.MainWindowTitle -like "*${clean}*" -or $_.ProcessName -like "*${clean}*") -and $_.MainWindowHandle -ne 0 } | Select-Object -First 1
        if ($p) {
          [WinMax]::ShowWindow($p.MainWindowHandle, 3) # SW_MAXIMIZE = 3
          @{ success = $true } | ConvertTo-Json -Compress
        } else {
          @{ success = $false; error = "Window not found" } | ConvertTo-Json -Compress
        }
      `;
      const { stdout } = await execAsync(`powershell -NoProfile -Command "${ps.replace(/"/g, '`"')}"`);
      return { success: true, data: JSON.parse(stdout || '{}') };
    } catch (err: unknown) {
      return { success: false, error: String(err) };
    }
  },
};