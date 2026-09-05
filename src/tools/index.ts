import { ToolRegistry } from './registry.js';
import {
  openApplicationTool,
  listWindowsTool,
  closeApplicationTool,
  getActiveWindowTool,
  focusWindowTool,
  minimizeWindowTool,
  maximizeWindowTool,
} from './windows.js';
import {
  moveMouseTool,
  clickMouseTool,
  doubleClickTool,
  rightClickTool,
  dragMouseTool,
  scrollMouseTool,
  typeTextTool,
  pressKeyTool,
  keyCombinationTool,
  screenshotTool,
  screenStateTool,
} from './computer.js';
import {
  readFileTool,
  writeFileTool,
  createFileTool,
  deleteFileTool,
  renameFileTool,
  moveFileTool,
  copyFileTool,
  createDirectoryTool,
  deleteDirectoryTool,
  listDirectoryTool,
} from './filesystem.js';
import {
  executeCommandTool,
  executePowershellTool,
  executeCmdTool,
} from './terminal.js';
import {
  openBrowserTool,
  navigateBrowserTool,
  readPageTool,
  clickBrowserTool,
  typeBrowserTool,
  scrollBrowserTool,
  browserScreenshotTool,
} from './browser.js';
import {
  gitStatusTool,
  gitDiffTool,
  gitLogTool,
  gitBranchTool,
  gitCommitTool,
  detectProjectTool,
  runTestsTool,
  runBuildTool,
} from './dev.js';
import { blenderExecutePythonTool } from './blender.js';

export function createDefaultToolRegistry(): ToolRegistry {
  const registry = new ToolRegistry();

  // Applications & Windows
  registry.register(openApplicationTool);
  registry.register(listWindowsTool);
  registry.register(closeApplicationTool);
  registry.register(getActiveWindowTool);
  registry.register(focusWindowTool);
  registry.register(minimizeWindowTool);
  registry.register(maximizeWindowTool);

  // Computer & Input Control
  registry.register(moveMouseTool);
  registry.register(clickMouseTool);
  registry.register(doubleClickTool);
  registry.register(rightClickTool);
  registry.register(dragMouseTool);
  registry.register(scrollMouseTool);
  registry.register(typeTextTool);
  registry.register(pressKeyTool);
  registry.register(keyCombinationTool);
  registry.register(screenshotTool);
  registry.register(screenStateTool);

  // Filesystem
  registry.register(readFileTool);
  registry.register(writeFileTool);
  registry.register(createFileTool);
  registry.register(deleteFileTool);
  registry.register(renameFileTool);
  registry.register(moveFileTool);
  registry.register(copyFileTool);
  registry.register(createDirectoryTool);
  registry.register(deleteDirectoryTool);
  registry.register(listDirectoryTool);

  // Terminal
  registry.register(executeCommandTool);
  registry.register(executePowershellTool);
  registry.register(executeCmdTool);

  // Browser
  registry.register(openBrowserTool);
  registry.register(navigateBrowserTool);
  registry.register(readPageTool);
  registry.register(clickBrowserTool);
  registry.register(typeBrowserTool);
  registry.register(scrollBrowserTool);
  registry.register(browserScreenshotTool);

  // Development & Git
  registry.register(gitStatusTool);
  registry.register(gitDiffTool);
  registry.register(gitLogTool);
  registry.register(gitBranchTool);
  registry.register(gitCommitTool);
  registry.register(detectProjectTool);
  registry.register(runTestsTool);
  registry.register(runBuildTool);

  // Specialized Applications
  registry.register(blenderExecutePythonTool);

  return registry;
}

export * from './registry.js';
export * from './windows.js';
export * from './computer.js';
export * from './filesystem.js';
export * from './terminal.js';
export * from './browser.js';
export * from './dev.js';
export * from './blender.js';