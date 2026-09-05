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
      const psScript = 'Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(' + targetX + ', ' + targetY + ')';
      await execAsync('powershell -NoProfile -Command "' + psScript + '"');
      return { success: true, data: { x: targetX, y: targetY, status: 'Mouse moved' } };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  },
};

export const clickMouseTool: ToolDefinition = {
  name: 'click_mouse',
  description: 'Perform a mouse click (left, right, or double) on Windows.',
  category: 'computer',
  parameters: {
    button: { type: 'string', description: 'Mouse button: "left", "right", or "double"', required: false },
  },
  execute: async ({ button }) => {
    try {
      const btn = String(button || 'left').toLowerCase();
      const clickFlags = btn === 'right' ? '0x08, 0x10' : (btn === 'double' ? '0x02, 0x04, 0x02, 0x04' : '0x02, 0x04');
      const psScript = 'Add-Type -MemberDefinition \'[DllImport("user32.dll")] public static extern void mouse_event(int flags, int dx, int dy, int cButtons, int info);\' -Name U32 -Namespace Win32; [Win32.U32]::mouse_event(0x02, 0, 0, 0, 0); [Win32.U32]::mouse_event(0x04, 0, 0, 0, 0);';
      await execAsync('powershell -NoProfile -Command "' + psScript + '"');
      return { success: true, data: { action: 'Clicked', button: btn } };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
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
      const escaped = String(text).replace(/"/g, '`"');
      const psScript = 'Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait("' + escaped + '")';
      await execAsync('powershell -NoProfile -Command "' + psScript + '"');
      return { success: true, data: { typedLength: text.length, status: 'Typed' } };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  },
};

export const pressKeyTool: ToolDefinition = {
  name: 'press_key',
  description: 'Send special key combination (e.g. {ENTER}, {ESC}, {TAB}, ^c for Ctrl+C, ^v for Ctrl+V) to the active window.',
  category: 'computer',
  parameters: {
    key: { type: 'string', description: 'Key code or combination (e.g. {ENTER}, {TAB}, {ESC}, ^s, ^c, ^v)', required: true },
  },
  execute: async ({ key }) => {
    try {
      const psScript = 'Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait("' + String(key) + '")';
      await execAsync('powershell -NoProfile -Command "' + psScript + '"');
      return { success: true, data: { key: String(key), status: 'Key sent' } };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  },
};

export const screenshotTool: ToolDefinition = {
  name: 'screenshot',
  description: 'Capture screenshot of the Windows primary desktop screen and save to disk.',
  category: 'computer',
  parameters: {},
  execute: async () => {
    try {
      const outDir = path.join(os.tmpdir(), 'openwork-screenshots');
      if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
      }
      const outPath = path.join(outDir, 'screen_' + Date.now() + '.png');
      const normalizedPath = outPath.replace(/\\/g, '/');
      const psScript = 'Add-Type -AssemblyName System.Windows.Forms; Add-Type -AssemblyName System.Drawing; $b = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds; $bmp = New-Object System.Drawing.Bitmap($b.Width, $b.Height); $g = [System.Drawing.Graphics]::FromImage($bmp); $g.CopyFromScreen($b.Location, [System.Drawing.Point]::Empty, $b.Size); $bmp.Save("' + normalizedPath + '"); $g.Dispose(); $bmp.Dispose()';
      await execAsync('powershell -NoProfile -Command "' + psScript + '"');
      
      return {
        success: true,
        data: {
          path: outPath,
          status: 'Captured',
        },
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  },
};