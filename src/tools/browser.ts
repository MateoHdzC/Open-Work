import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { ToolDefinition } from './registry.js';

const execAsync = promisify(exec);

export const openBrowserTool: ToolDefinition = {
  name: 'open_browser',
  description: 'Open a URL in the default or specified Windows web browser.',
  category: 'browser',
  parameters: {
    url: { type: 'string', description: 'Target URL to open (e.g. https://gmail.com or https://github.com)', required: true },
    browser: { type: 'string', description: 'Optional specific browser executable (e.g. chrome, msedge, brave, firefox)', required: false },
  },
  execute: async ({ url, browser }) => {
    try {
      const cleanUrl = String(url).trim();
      if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
        return { success: false, error: 'Invalid URL scheme. Must start with http:// or https://' };
      }

      if (browser) {
        await execAsync('powershell -NoProfile -Command "Start-Process ' + String(browser) + ' \'' + cleanUrl + '\'"');
      } else {
        await execAsync('powershell -NoProfile -Command "Start-Process \'' + cleanUrl + '\'"');
      }

      return {
        success: true,
        data: {
          url: cleanUrl,
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

export const fetchPageContentTool: ToolDefinition = {
  name: 'fetch_page_content',
  description: 'Fetch and extract plain text or HTML content from a public web page.',
  category: 'browser',
  parameters: {
    url: { type: 'string', description: 'URL to retrieve text from', required: true },
  },
  execute: async ({ url }) => {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) OpenWork/1.0' },
      });
      if (!res.ok) {
        return { success: false, error: 'HTTP ' + res.status + ': ' + res.statusText };
      }
      const raw = await res.text();
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
          length: stripped.length,
          snippet: stripped.slice(0, 4000),
        },
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  },
};