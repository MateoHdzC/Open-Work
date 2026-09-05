import { ToolRegistry } from './registry.js';
import { openApplicationTool, listWindowsTool, closeApplicationTool } from './windows.js';
import { moveMouseTool, clickMouseTool, typeTextTool, pressKeyTool, screenshotTool } from './computer.js';
import { readFileTool, writeFileTool, listDirectoryTool, deleteFileTool } from './filesystem.js';
import { executeCommandTool } from './terminal.js';
import { openBrowserTool, fetchPageContentTool } from './browser.js';
import { gitStatusTool, runTestsTool } from './dev.js';

export function createDefaultToolRegistry(): ToolRegistry {
  const registry = new ToolRegistry();

  registry.register(openApplicationTool);
  registry.register(listWindowsTool);
  registry.register(closeApplicationTool);

  registry.register(moveMouseTool);
  registry.register(clickMouseTool);
  registry.register(typeTextTool);
  registry.register(pressKeyTool);
  registry.register(screenshotTool);

  registry.register(readFileTool);
  registry.register(writeFileTool);
  registry.register(listDirectoryTool);
  registry.register(deleteFileTool);

  registry.register(executeCommandTool);

  registry.register(openBrowserTool);
  registry.register(fetchPageContentTool);

  registry.register(gitStatusTool);
  registry.register(runTestsTool);

  return registry;
}

export * from './registry.js';
export * from './windows.js';
export * from './computer.js';
export * from './filesystem.js';
export * from './terminal.js';
export * from './browser.js';
export * from './dev.js';