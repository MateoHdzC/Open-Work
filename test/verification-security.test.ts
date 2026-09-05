import { describe, it, expect } from 'vitest';
import { SecurityFirewall } from '../src/security/firewall.js';
import { VerificationEngine } from '../src/verification/engine.js';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

describe('SecurityFirewall', () => {
  const firewall = new SecurityFirewall({ requireConfirmationForDestructive: true });

  it('should identify delete_file as destructive and require confirmation', () => {
    const risk = firewall.evaluateRisk('delete_file', { path: 'C:\\test\\file.txt' });
    expect(risk.riskLevel).toBe('destructive');
    expect(firewall.needsConfirmation('delete_file', { path: 'C:\\test\\file.txt' })).toBe(true);
  });

  it('should identify safe read tools without confirmation', () => {
    const risk = firewall.evaluateRisk('read_file', { path: 'C:\\test\\file.txt' });
    expect(risk.riskLevel).toBe('safe');
    expect(firewall.needsConfirmation('read_file', { path: 'C:\\test\\file.txt' })).toBe(false);
  });

  it('should manage pending confirmation resolutions', async () => {
    let resolvedValue: boolean | null = null;
    const pending = firewall.requestConfirmation('delete_file', { path: 'critical.dat' }, (conf) => {
      resolvedValue = conf;
    });

    expect(pending).toHaveProperty('id');
    expect(firewall.getPending().length).toBe(1);

    firewall.answerConfirmation(pending.id, true);
    expect(resolvedValue).toBe(true);
    expect(firewall.getPending().length).toBe(0);
  });
});

describe('VerificationEngine', () => {
  const verification = new VerificationEngine();

  it('should verify physical file existence and contents', () => {
    const tempFile = path.join(os.tmpdir(), 'verify_test_' + Date.now() + '.txt');
    fs.writeFileSync(tempFile, 'Verified Content 12345', 'utf-8');

    const checkExists = verification.verifyFileExists(tempFile);
    expect(checkExists.verified).toBe(true);
    expect(checkExists.reality).toContain('Verified');

    const checkContains = verification.verifyFileContains(tempFile, '12345');
    expect(checkContains.verified).toBe(true);

    const checkFalseContains = verification.verifyFileContains(tempFile, 'non_existent_snippet');
    expect(checkFalseContains.verified).toBe(false);

    try { fs.unlinkSync(tempFile); } catch {}
  });

  it('should verify non-existent file as false claim', () => {
    const nonExistent = path.join(os.tmpdir(), 'definitely_does_not_exist_' + Date.now() + '.tmp');
    const check = verification.verifyFileExists(nonExistent);
    expect(check.verified).toBe(false);
    expect(check.reality).toContain('False Claim');
  });
});
