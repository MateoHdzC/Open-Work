import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import { ToolDefinition } from './registry.js';
import { clickMouseTool, typeTextTool, scrollMouseTool, screenshotTool } from './computer.js';

const execAsync = promisify(exec);

export const openBrowserTool: ToolDefinition = {
  name: 'open_browser',
  description: 'Open a URL in the default or specified Windows web browser (Chrome, Edge, Firefox, etc.).',
  category: 'browser',
  parameters: {
    url: { type: 'string', description: 'Target URL to open (e.g. https://github.com)', required: true },
    browser: { type: 'string', description: 'Optional browser name: chrome, msedge, firefox, brave', required: false },
  },
  execute: async ({ url, browser }) => {
    try {
      const cleanUrl = String(url).trim();
      const targetUrl = cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://') ? cleanUrl : `https://${cleanUrl}`;

      if (browser) {
        await execAsync(`powershell -NoProfile -Command "Start-Process ${String(browser)} '${targetUrl}'"`);
      } else {
        await execAsync(`powershell -NoProfile -Command "Start-Process '${targetUrl}'"`);
      }

      return {
        success: true,
        data: {
          url: targetUrl,
          browser: browser || 'Default Windows Browser',
          status: 'Opened',
        },
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  },
};

export const navigateBrowserTool: ToolDefinition = {
  name: 'navigate_browser',
  description: 'Navigate the current or a new browser window to a specific URL.',
  category: 'browser',
  parameters: {
    url: { type: 'string', description: 'Target destination URL', required: true },
  },
  execute: async ({ url }) => {
    return openBrowserTool.execute({ url });
  },
};

export const readPageTool: ToolDefinition = {
  name: 'read_page',
  description: 'Fetch and extract readable plain text content and title from a web page URL.',
  category: 'browser',
  parameters: {
    url: { type: 'string', description: 'Web page URL to read', required: true },
  },
  execute: async ({ url }) => {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) OpenWork/1.0' },
      });
      if (!res.ok) {
        return { success: false, error: `HTTP ${res.status}: ${res.statusText}` };
      }
      const raw = await res.text();
      const titleMatch = raw.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : '';

      const stripped = raw
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      return {
        success: true,
        data: {
          url,
          title,
          contentLength: stripped.length,
          preview: stripped.slice(0, 3000),
        },
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  },
};

export const clickBrowserTool: ToolDefinition = {
  name: 'click_browser',
  description: 'Click at specific coordinates inside the active browser window.',
  category: 'browser',
  parameters: {
    x: { type: 'number', description: 'X coordinate', required: false },
    y: { type: 'number', description: 'Y coordinate', required: false },
  },
  execute: async (args) => {
    return clickMouseTool.execute(args);
  },
};

export const typeBrowserTool: ToolDefinition = {
  name: 'type_browser',
  description: 'Type text into the currently focused input element in the browser.',
  category: 'browser',
  parameters: {
    text: { type: 'string', description: 'Text to type into browser', required: true },
  },
  execute: async (args) => {
    return typeTextTool.execute(args);
  },
};

export const scrollBrowserTool: ToolDefinition = {
  name: 'scroll_browser',
  description: 'Scroll up or down within the active browser window.',
  category: 'browser',
  parameters: {
    amount: { type: 'number', description: 'Scroll delta: negative down, positive up', required: true },
  },
  execute: async (args) => {
    return scrollMouseTool.execute(args);
  },
};

export const browserScreenshotTool: ToolDefinition = {
  name: 'browser_screenshot',
  description: 'Take a screenshot of the visible desktop / browser view.',
  category: 'browser',
  parameters: {},
  execute: async () => {
    return screenshotTool.execute({});
  },
};