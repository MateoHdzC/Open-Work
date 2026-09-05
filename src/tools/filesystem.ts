import fs from 'node:fs';
import path from 'node:path';
import { ToolDefinition } from './registry.js';

export const readFileTool: ToolDefinition = {
  name: 'read_file',
  description: 'Read complete text content of a file within the workspace or local path.',
  category: 'files',
  parameters: {
    path: { type: 'string', description: 'Relative or absolute file path to read', required: true },
  },
  execute: async ({ path: targetPath }, context) => {
    try {
      const workspace = context?.workspaceRoot || process.cwd();
      const resolved = path.isAbsolute(targetPath) ? targetPath : path.resolve(workspace, targetPath);
      if (!fs.existsSync(resolved)) {
        return { success: false, error: 'File not found: ' + targetPath };
      }
      const content = fs.readFileSync(resolved, 'utf8');
      return {
        success: true,
        data: { path: targetPath, size: content.length, content },
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  },
};

export const writeFileTool: ToolDefinition = {
  name: 'write_file',
  description: 'Write, create, or overwrite a file with specific text contents.',
  category: 'files',
  parameters: {
    path: { type: 'string', description: 'Relative or absolute file path to write', required: true },
    content: { type: 'string', description: 'Complete file text content to write', required: true },
  },
  execute: async ({ path: targetPath, content }, context) => {
    try {
      const workspace = context?.workspaceRoot || process.cwd();
      const resolved = path.isAbsolute(targetPath) ? targetPath : path.resolve(workspace, targetPath);
      const parentDir = path.dirname(resolved);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }
      fs.writeFileSync(resolved, String(content), 'utf8');
      return {
        success: true,
        data: { path: targetPath, writtenBytes: Buffer.byteLength(content, 'utf8'), status: 'Saved' },
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  },
};

export const listDirectoryTool: ToolDefinition = {
  name: 'list_directory',
  description: 'List contents of a directory (files and folders) with sizes and statuses.',
  category: 'files',
  parameters: {
    path: { type: 'string', description: 'Directory path to list (defaults to workspace root)', required: false },
  },
  execute: async ({ path: targetPath }, context) => {
    try {
      const workspace = context?.workspaceRoot || process.cwd();
      const resolved = targetPath ? (path.isAbsolute(targetPath) ? targetPath : path.resolve(workspace, targetPath)) : workspace;
      if (!fs.existsSync(resolved)) {
        return { success: false, error: 'Directory not found: ' + resolved };
      }
      const entries = fs.readdirSync(resolved, { withFileTypes: true });
      const items = entries.map(e => {
        let size = 0;
        try {
          if (!e.isDirectory()) {
            size = fs.statSync(path.join(resolved, e.name)).size;
          }
        } catch {}
        return {
          name: e.name,
          isDirectory: e.isDirectory(),
          size,
        };
      });
      return {
        success: true,
        data: { path: resolved, itemsCount: items.length, items },
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  },
};

export const deleteFileTool: ToolDefinition = {
  name: 'delete_file',
  description: 'Permanently delete a file or directory from the workspace.',
  category: 'files',
  isDestructive: true,
  parameters: {
    path: { type: 'string', description: 'Path to file or folder to delete', required: true },
  },
  execute: async ({ path: targetPath }, context) => {
    try {
      const workspace = context?.workspaceRoot || process.cwd();
      const resolved = path.isAbsolute(targetPath) ? targetPath : path.resolve(workspace, targetPath);
      if (!fs.existsSync(resolved)) {
        return { success: false, error: 'Target not found: ' + targetPath };
      }
      const stat = fs.statSync(resolved);
      if (stat.isDirectory()) {
        fs.rmSync(resolved, { recursive: true, force: true });
      } else {
        fs.unlinkSync(resolved);
      }
      return { success: true, data: { deleted: targetPath, status: 'Removed' } };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  },
};