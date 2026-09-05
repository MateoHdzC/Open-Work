import fs from 'node:fs';
import path from 'node:path';
import { ToolDefinition } from './registry.js';

function resolvePath(targetPath: string, workspaceRoot?: string): string {
  const root = workspaceRoot || process.cwd();
  return path.isAbsolute(targetPath) ? targetPath : path.resolve(root, targetPath);
}

export const readFileTool: ToolDefinition = {
  name: 'read_file',
  description: 'Read complete text content of a file within the workspace or local path.',
  category: 'files',
  parameters: {
    path: { type: 'string', description: 'Relative or absolute file path to read', required: true },
  },
  execute: async ({ path: targetPath }, context) => {
    try {
      const resolved = resolvePath(targetPath, context?.workspaceRoot);
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
      const resolved = resolvePath(targetPath, context?.workspaceRoot);
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

export const createFileTool: ToolDefinition = {
  name: 'create_file',
  description: 'Create a new empty or initial file if it does not already exist.',
  category: 'files',
  parameters: {
    path: { type: 'string', description: 'File path to create', required: true },
    initialContent: { type: 'string', description: 'Initial file content', required: false },
  },
  execute: async ({ path: targetPath, initialContent = '' }, context) => {
    try {
      const resolved = resolvePath(targetPath, context?.workspaceRoot);
      if (fs.existsSync(resolved)) {
        return { success: false, error: `File already exists: ${targetPath}` };
      }
      const parentDir = path.dirname(resolved);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }
      fs.writeFileSync(resolved, String(initialContent), 'utf8');
      return { success: true, data: { path: targetPath, status: 'Created' } };
    } catch (err: unknown) {
      return { success: false, error: String(err) };
    }
  },
};

export const deleteFileTool: ToolDefinition = {
  name: 'delete_file',
  description: 'Permanently delete a file from the workspace.',
  category: 'files',
  isDestructive: true,
  parameters: {
    path: { type: 'string', description: 'Relative or absolute path of the file to delete', required: true },
  },
  execute: async ({ path: targetPath }, context) => {
    try {
      const resolved = resolvePath(targetPath, context?.workspaceRoot);
      if (!fs.existsSync(resolved)) {
        return { success: false, error: 'File does not exist: ' + targetPath };
      }
      const stat = fs.statSync(resolved);
      if (stat.isDirectory()) {
        return { success: false, error: `${targetPath} is a directory. Use delete_directory.` };
      }
      fs.unlinkSync(resolved);
      return {
        success: true,
        data: { path: targetPath, deleted: true, status: 'File deleted' },
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  },
};

export const renameFileTool: ToolDefinition = {
  name: 'rename_file',
  description: 'Rename or move a file or folder.',
  category: 'files',
  parameters: {
    oldPath: { type: 'string', description: 'Source path', required: true },
    newPath: { type: 'string', description: 'Target destination path', required: true },
  },
  execute: async ({ oldPath, newPath }, context) => {
    try {
      const src = resolvePath(oldPath, context?.workspaceRoot);
      const dest = resolvePath(newPath, context?.workspaceRoot);
      if (!fs.existsSync(src)) {
        return { success: false, error: `Source not found: ${oldPath}` };
      }
      const destDir = path.dirname(dest);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      fs.renameSync(src, dest);
      return { success: true, data: { oldPath, newPath, status: 'Renamed/Moved' } };
    } catch (err: unknown) {
      return { success: false, error: String(err) };
    }
  },
};

export const moveFileTool: ToolDefinition = {
  name: 'move_file',
  description: 'Move a file to a different directory location.',
  category: 'files',
  parameters: {
    source: { type: 'string', description: 'Source file path', required: true },
    destination: { type: 'string', description: 'Destination directory or file path', required: true },
  },
  execute: async ({ source, destination }, context) => {
    return renameFileTool.execute({ oldPath: source, newPath: destination }, context);
  },
};

export const copyFileTool: ToolDefinition = {
  name: 'copy_file',
  description: 'Copy a file to another location.',
  category: 'files',
  parameters: {
    source: { type: 'string', description: 'Source file path', required: true },
    destination: { type: 'string', description: 'Destination file path', required: true },
  },
  execute: async ({ source, destination }, context) => {
    try {
      const src = resolvePath(source, context?.workspaceRoot);
      const dest = resolvePath(destination, context?.workspaceRoot);
      if (!fs.existsSync(src)) {
        return { success: false, error: `Source file not found: ${source}` };
      }
      const destDir = path.dirname(dest);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      fs.copyFileSync(src, dest);
      return { success: true, data: { source, destination, status: 'Copied' } };
    } catch (err: unknown) {
      return { success: false, error: String(err) };
    }
  },
};

export const createDirectoryTool: ToolDefinition = {
  name: 'create_directory',
  description: 'Create a new directory or folder recursively.',
  category: 'files',
  parameters: {
    path: { type: 'string', description: 'Directory path to create', required: true },
  },
  execute: async ({ path: targetPath }, context) => {
    try {
      const resolved = resolvePath(targetPath, context?.workspaceRoot);
      fs.mkdirSync(resolved, { recursive: true });
      return { success: true, data: { path: targetPath, status: 'Directory created' } };
    } catch (err: unknown) {
      return { success: false, error: String(err) };
    }
  },
};

export const deleteDirectoryTool: ToolDefinition = {
  name: 'delete_directory',
  description: 'Permanently delete an entire folder/directory.',
  category: 'files',
  isDestructive: true,
  parameters: {
    path: { type: 'string', description: 'Directory path to delete', required: true },
  },
  execute: async ({ path: targetPath }, context) => {
    try {
      const resolved = resolvePath(targetPath, context?.workspaceRoot);
      if (!fs.existsSync(resolved)) {
        return { success: false, error: 'Directory does not exist: ' + targetPath };
      }
      fs.rmSync(resolved, { recursive: true, force: true });
      return { success: true, data: { path: targetPath, status: 'Directory deleted' } };
    } catch (err: unknown) {
      return { success: false, error: String(err) };
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
      const resolved = targetPath ? resolvePath(targetPath, context?.workspaceRoot) : (context?.workspaceRoot || process.cwd());
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