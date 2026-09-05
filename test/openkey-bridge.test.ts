import { describe, it, expect } from 'vitest';
import { OpenKeyVaultBridge } from '../src/openkey/integration.js';

describe('OpenKeyVaultBridge', () => {
  const bridge = new OpenKeyVaultBridge();

  it('should instantiate and check availability', () => {
    expect(typeof bridge.isAvailable()).toBe('boolean');
  });

  it('should read stored secrets without crashing', () => {
    const secrets = bridge.listStoredSecrets();
    expect(Array.isArray(secrets)).toBe(true);
    if (secrets.length > 0) {
      expect(secrets[0]).toHaveProperty('providerId');
      expect(secrets[0]).toHaveProperty('maskedKey');
    }
  });

  it('should retrieve active configuration', () => {
    const config = bridge.getActiveConfig();
    expect(config).toHaveProperty('activeProviderId');
    expect(config).toHaveProperty('activeModelId');
  });
});