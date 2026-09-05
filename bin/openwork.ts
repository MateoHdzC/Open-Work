#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { startOpenWork } from '../src/core/server.js';
import { OpenKeyVaultBridge } from '../src/openkey/integration.js';
import { MemoryStore } from '../src/memory/store.js';

const program = new Command();

program
  .name('openwork')
  .description('Autonomous Windows AI Desktop Agent & Computer Workspace Environment')
  .version('1.0.0');

program
  .action(async () => {
    console.log(chalk.cyan.bold('\n🤖 Launching OpenWork Windows Agent Studio...\n'));
    await startOpenWork(3100);
  });

program
  .command('status')
  .description('Display OpenWork agent status, OpenKey bridge connection, and memory telemetry')
  .action(() => {
    console.log(chalk.cyan.bold('\n🔍 OpenWork System Status\n'));
    const bridge = new OpenKeyVaultBridge();
    const memory = new MemoryStore();
    
    console.log('OpenKey Vault Bridge: ' + (bridge.isAvailable() ? chalk.green('● Connected (~/.openkey/openkey.sqlite)') : chalk.gray('○ Not found')));
    const secrets = bridge.listStoredSecrets();
    console.log('Available API Keys:   ' + chalk.bold(secrets.length + ' key(s)'));
    for (const s of secrets) {
      console.log('  • ' + s.providerId.toUpperCase().padEnd(12) + ' ' + chalk.gray(s.maskedKey));
    }

    const memories = memory.listMemories();
    console.log('\nPersistent Memories:  ' + chalk.bold(memories.length + ' item(s)'));
    for (const m of memories.slice(0, 5)) {
      console.log('  • [' + m.category.toUpperCase() + '] ' + m.topicKey + ': ' + chalk.gray(m.content));
    }
    console.log('');
  });

program.parse(process.argv);