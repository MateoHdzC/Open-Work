import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import { ToolDefinition } from './registry.js';

const execAsync = promisify(exec);

export const moveMouseTool: ToolDefinition = {
  name: 'move_mouse',
  description: 'Move mouse cursor to specific X, Y desktop pixel coordinates on Windows.',
  category: 'computer',
  parameters: {
    x: { type: 'number', description: 'Target X coordinate in screen pixels', required: true },
    y: { type: 'number', description: 'Target Y coordinate in screen pixels', required: true },
  },
  execute: async ({ x, y }) => {
    try {
      const targetX = parseInt(String(x), 10) || 0;
      const targetY = parseInt(String(y), 10) || 0;
      const psScript = `Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(${targetX}, ${targetY})`;
      await execAsync(`powershell -NoProfile -Command "${psScript}"`);
      return { success: true, data: { x: targetX, y: targetY, status: 'Mouse moved' } };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  },
};

export const clickMouseTool: ToolDefinition = {
  name: 'click',
  description: 'Perform a left mouse click at current or specified cursor coordinates on Windows.',
  category: 'computer',
  parameters: {
    x: { type: 'number', description: 'Optional X coordinate to click', required: false },
    y: { type: 'number', description: 'Optional Y coordinate to click', required: false },
  },
  execute: async ({ x, y }) => {
    try {
      let movePrefix = '';
      if (x !== undefined && y !== undefined) {
        movePrefix = `[System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(${parseInt(String(x), 10)}, ${parseInt(String(y), 10)}); `;
      }
      const psScript = `
        Add-Type -AssemblyName System.Windows.Forms
        ${movePrefix}
        Add-Type -MemberDefinition '[DllImport("user32.dll")] public static extern void mouse_event(int flags, int dx, int dy, int cButtons, int info);' -Name U32Click -Namespace Win32Click
        [Win32Click.U32Click]::mouse_event(0x02, 0, 0, 0, 0) # LEFTDOWN
        [Win32Click.U32Click]::mouse_event(0x04, 0, 0, 0, 0) # LEFTUP
      `;
      await execAsync(`powershell -NoProfile -Command "${psScript.replace(/"/g, '`"')}"`);
      return { success: true, data: { action: 'Clicked left button', x, y } };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  },
};

export const doubleClickTool: ToolDefinition = {
  name: 'double_click',
  description: 'Perform a double click on Windows desktop.',
  category: 'computer',
  parameters: {
    x: { type: 'number', description: 'Optional X coordinate', required: false },
    y: { type: 'number', description: 'Optional Y coordinate', required: false },
  },
  execute: async ({ x, y }) => {
    try {
      let movePrefix = '';
      if (x !== undefined && y !== undefined) {
        movePrefix = `[System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(${parseInt(String(x), 10)}, ${parseInt(String(y), 10)}); `;
      }
      const psScript = `
        Add-Type -AssemblyName System.Windows.Forms
        ${movePrefix}
        Add-Type -MemberDefinition '[DllImport("user32.dll")] public static extern void mouse_event(int flags, int dx, int dy, int cButtons, int info);' -Name U32DClick -Namespace Win32DClick
        [Win32DClick.U32DClick]::mouse_event(0x02, 0, 0, 0, 0)
        [Win32DClick.U32DClick]::mouse_event(0x04, 0, 0, 0, 0)
        Start-Sleep -Milliseconds 60
        [Win32DClick.U32DClick]::mouse_event(0x02, 0, 0, 0, 0)
        [Win32DClick.U32DClick]::mouse_event(0x04, 0, 0, 0, 0)
      `;
      await execAsync(`powershell -NoProfile -Command "${psScript.replace(/"/g, '`"')}"`);
      return { success: true, data: { action: 'Double clicked', x, y } };
    } catch (err: unknown) {
      return { success: false, error: String(err) };
    }
  },
};

export const rightClickTool: ToolDefinition = {
  name: 'right_click',
  description: 'Perform a right click to open context menus on Windows.',
  category: 'computer',
  parameters: {
    x: { type: 'number', description: 'Optional X coordinate', required: false },
    y: { type: 'number', description: 'Optional Y coordinate', required: false },
  },
  execute: async ({ x, y }) => {
    try {
      let movePrefix = '';
      if (x !== undefined && y !== undefined) {
        movePrefix = `[System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(${parseInt(String(x), 10)}, ${parseInt(String(y), 10)}); `;
      }
      const psScript = `
        Add-Type -AssemblyName System.Windows.Forms
        ${movePrefix}
        Add-Type -MemberDefinition '[DllImport("user32.dll")] public static extern void mouse_event(int flags, int dx, int dy, int cButtons, int info);' -Name U32RClick -Namespace Win32RClick
        [Win32RClick.U32RClick]::mouse_event(0x08, 0, 0, 0, 0) # RIGHTDOWN
        [Win32RClick.U32RClick]::mouse_event(0x10, 0, 0, 0, 0) # RIGHTUP
      `;
      await execAsync(`powershell -NoProfile -Command "${psScript.replace(/"/g, '`"')}"`);
      return { success: true, data: { action: 'Right clicked', x, y } };
    } catch (err: unknown) {
      return { success: false, error: String(err) };
    }
  },
};

export const dragMouseTool: ToolDefinition = {
  name: 'drag',
  description: 'Click and drag mouse from start coordinates to end coordinates.',
  category: 'computer',
  parameters: {
    startX: { type: 'number', description: 'Starting X', required: true },
    startY: { type: 'number', description: 'Starting Y', required: true },
    endX: { type: 'number', description: 'Ending X', required: true },
    endY: { type: 'number', description: 'Ending Y', required: true },
  },
  execute: async ({ startX, startY, endX, endY }) => {
    try {
      const psScript = `
        Add-Type -AssemblyName System.Windows.Forms
        Add-Type -MemberDefinition '[DllImport("user32.dll")] public static extern void mouse_event(int flags, int dx, int dy, int cButtons, int info);' -Name U32Drag -Namespace Win32Drag
        [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(${startX}, ${startY})
        Start-Sleep -Milliseconds 50
        [Win32Drag.U32Drag]::mouse_event(0x02, 0, 0, 0, 0) # DOWN
        Start-Sleep -Milliseconds 100
        [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(${endX}, ${endY})
        Start-Sleep -Milliseconds 100
        [Win32Drag.U32Drag]::mouse_event(0x04, 0, 0, 0, 0) # UP
      `;
      await execAsync(`powershell -NoProfile -Command "${psScript.replace(/"/g, '`"')}"`);
      return { success: true, data: { action: 'Dragged', from: { startX, startY }, to: { endX, endY } } };
    } catch (err: unknown) {
      return { success: false, error: String(err) };
    }
  },
};

export const scrollMouseTool: ToolDefinition = {
  name: 'scroll',
  description: 'Scroll mouse wheel up (positive) or down (negative).',
  category: 'computer',
  parameters: {
    amount: { type: 'number', description: 'Scroll delta ticks (e.g. 120 for up, -120 for down)', required: true },
  },
  execute: async ({ amount }) => {
    try {
      const delta = parseInt(String(amount), 10) || -120;
      const psScript = `
        Add-Type -MemberDefinition '[DllImport("user32.dll")] public static extern void mouse_event(int flags, int dx, int dy, int cButtons, int info);' -Name U32Scroll -Namespace Win32Scroll
        [Win32Scroll.U32Scroll]::mouse_event(0x0800, 0, 0, ${delta}, 0) # MOUSEEVENTF_WHEEL = 0x0800
      `;
      await execAsync(`powershell -NoProfile -Command "${psScript.replace(/"/g, '`"')}"`);
      return { success: true, data: { scrolled: delta } };
    } catch (err: unknown) {
      return { success: false, error: String(err) };
    }
  },
};

export const typeTextTool: ToolDefinition = {
  name: 'type_text',
  description: 'Type text using keyboard simulation into the currently focused Windows window.',
  category: 'computer',
  parameters: {
    text: { type: 'string', description: 'Text string to type', required: true },
  },
  execute: async ({ text }) => {
    try {
      const escaped = String(text).replace(/[{}+^%~()\[\]]/g, '{$&}').replace(/"/g, '`"');
      const psScript = `Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait("${escaped}")`;
      await execAsync(`powershell -NoProfile -Command "${psScript}"`);
      return { success: true, data: { typedLength: text.length, status: 'Typed' } };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  },
};

export const pressKeyTool: ToolDefinition = {
  name: 'press_key',
  description: 'Send special key (e.g. {ENTER}, {ESC}, {TAB}, {BACKSPACE}, {UP}, {DOWN}) to the active window.',
  category: 'computer',
  parameters: {
    key: { type: 'string', description: 'Key name (e.g. {ENTER}, {TAB}, {ESC}, {BACKSPACE})', required: true },
  },
  execute: async ({ key }) => {
    try {
      const psScript = `Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait("${String(key)}")`;
      await execAsync(`powershell -NoProfile -Command "${psScript}"`);
      return { success: true, data: { key: String(key), status: 'Key sent' } };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  },
};

export const keyCombinationTool: ToolDefinition = {
  name: 'key_combination',
  description: 'Send key shortcuts such as Ctrl+S, Ctrl+C, Ctrl+V, Alt+Tab, etc.',
  category: 'computer',
  parameters: {
    combination: { type: 'string', description: 'Shortcut combination e.g. "^s" (Ctrl+S), "^c" (Ctrl+C), "%{F4}" (Alt+F4)', required: true },
  },
  execute: async ({ combination }) => {
    try {
      const psScript = `Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait("${String(combination)}")`;
      await execAsync(`powershell -NoProfile -Command "${psScript}"`);
      return { success: true, data: { combination: String(combination), status: 'Combination executed' } };
    } catch (err: unknown) {
      return { success: false, error: String(err) };
    }
  },
};

export const screenshotTool: ToolDefinition = {
  name: 'screenshot',
  description: 'Capture a screenshot of the Windows primary desktop screen and save to disk.',
  category: 'computer',
  parameters: {},
  execute: async () => {
    try {
      const outDir = path.join(os.tmpdir(), 'openwork-screenshots');
      if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
      }
      const filename = `screen_${Date.now()}.png`;
      const filePath = path.join(outDir, filename);

      const psScript = `
        Add-Type -AssemblyName System.Windows.Forms
        Add-Type -AssemblyName System.Drawing
        $bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
        $bmp = New-Object System.Drawing.Bitmap $bounds.Width, $bounds.Height
        $gfx = [System.Drawing.Graphics]::FromImage($bmp)
        $gfx.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size)
        $bmp.Save("${filePath.replace(/\\/g, '\\\\')}", [System.Drawing.Imaging.ImageFormat]::Png)
        $gfx.Dispose()
        $bmp.Dispose()
      `;

      await execAsync(`powershell -NoProfile -Command "${psScript.replace(/"/g, '`"')}"`);

      let base64Preview = '';
      if (fs.existsSync(filePath)) {
        const buf = fs.readFileSync(filePath);
        base64Preview = `data:image/png;base64,${buf.toString('base64').slice(0, 128)}...`;
      }

      return {
        success: true,
        data: {
          path: filePath,
          sizeBytes: fs.existsSync(filePath) ? fs.statSync(filePath).size : 0,
          previewUrl: base64Preview,
          status: 'Captured',
        },
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  },
};

export const screenStateTool: ToolDefinition = {
  name: 'screen_state',
  description: 'Get current display geometry, primary screen dimensions, and mouse cursor position.',
  category: 'computer',
  parameters: {},
  execute: async () => {
    try {
      const psScript = `
        Add-Type -AssemblyName System.Windows.Forms
        $screen = [System.Windows.Forms.Screen]::PrimaryScreen
        $cursor = [System.Windows.Forms.Cursor]::Position
        @{
          width = $screen.Bounds.Width
          height = $screen.Bounds.Height
          bitsPerPixel = $screen.BitsPerPixel
          cursorX = $cursor.X
          cursorY = $cursor.Y
        } | ConvertTo-Json -Compress
      `;
      const { stdout } = await execAsync(`powershell -NoProfile -Command "${psScript.replace(/"/g, '`"')}"`);
      return { success: true, data: JSON.parse(stdout || '{}') };
    } catch (err: unknown) {
      return { success: false, error: String(err) };
    }
  },
};