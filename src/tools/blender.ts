import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import { ToolDefinition } from './registry.js';

const execAsync = promisify(exec);

export const blenderExecutePythonTool: ToolDefinition = {
  name: 'blender_execute_python',
  description: 'Execute a Python script inside Blender (in background or running instance) to create/modify 3D objects, materials, and scenes.',
  category: 'applications',
  parameters: {
    script: {
      type: 'string',
      description: 'Python code targeting the `bpy` module (e.g. bpy.ops.mesh.primitive_cube_add(), material creation, etc.)',
      required: true,
    },
    blendFile: {
      type: 'string',
      description: 'Optional path to .blend file to open and operate on',
      required: false,
    },
    saveAs: {
      type: 'string',
      description: 'Optional output path to save the modified .blend file',
      required: false,
    },
  },
  execute: async ({ script, blendFile, saveAs }) => {
    try {
      const tempPy = path.join(os.tmpdir(), `blender_script_${Date.now()}.py`);
      let pyContent = String(script);
      if (saveAs) {
        pyContent += `\nimport bpy\nbpy.ops.wm.save_as_mainfile(filepath=r"${String(saveAs)}")\n`;
      }
      fs.writeFileSync(tempPy, pyContent, 'utf-8');

      // Check if blender command is in PATH or typical Windows installation directories
      let blenderPath = 'blender';
      const defaultPaths = [
        'C:\\Program Files\\Blender Foundation\\Blender 4.3\\blender.exe',
        'C:\\Program Files\\Blender Foundation\\Blender 4.2\\blender.exe',
        'C:\\Program Files\\Blender Foundation\\Blender 4.1\\blender.exe',
        'C:\\Program Files\\Blender Foundation\\Blender 4.0\\blender.exe',
      ];
      for (const p of defaultPaths) {
        if (fs.existsSync(p)) {
          blenderPath = `"${p}"`;
          break;
        }
      }

      const fileArg = blendFile ? `"${blendFile}" ` : '';
      const cmd = `${blenderPath} --background ${fileArg}--python "${tempPy}"`;
      const { stdout, stderr } = await execAsync(cmd, { timeout: 30000 });

      return {
        success: true,
        data: {
          output: stdout.slice(-1500),
          scriptUsed: tempPy,
          saveAs: saveAs || null,
        },
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  },
};
