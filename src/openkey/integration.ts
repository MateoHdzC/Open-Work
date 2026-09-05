import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

export interface OpenKeySecret {
  id: string;
  providerId: string;
  name: string;
  apiKey: string;
  maskedKey: string;
  createdAt: string;
}

export class OpenKeyVaultBridge {
  private openkeyDir: string;
  private dbPath: string;
  private configPath: string;

  constructor() {
    const home = os.homedir();
    this.openkeyDir = path.join(home, '.openkey');
    this.dbPath = path.join(this.openkeyDir, 'openkey.sqlite');
    this.configPath = path.join(this.openkeyDir, 'config.json');
  }

  public isAvailable(): boolean {
    return fs.existsSync(this.dbPath);
  }

  private deriveMasterKey(): Buffer {
    const username = os.userInfo().username;
    const hostname = os.hostname();
    const homedir = os.homedir();
    const salt = 'openkey-vault-seed:' + username + '@' + hostname + ':' + homedir;
    return crypto.pbkdf2Sync('openkey-local-machine-master-secret', salt, 100000, 32, 'sha512');
  }

  private decryptSecret(encryptedHex: string, ivHex: string, tagHex: string): string {
    const key = this.deriveMasterKey();
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  public listStoredSecrets(): OpenKeySecret[] {
    if (!this.isAvailable()) return [];

    try {
      const db = new DatabaseSync(this.dbPath, { readOnly: true });
      const stmt = db.prepare('SELECT id, provider_id, name, encrypted_key, iv, tag, masked_key, created_at FROM secrets');
      const rows = stmt.all() as Array<{
        id: string;
        provider_id: string;
        name: string;
        encrypted_key: string;
        iv: string;
        tag: string;
        masked_key: string;
        created_at: string;
      }>;

      return rows.map((row) => {
        let apiKey = '';
        try {
          apiKey = this.decryptSecret(row.encrypted_key, row.iv, row.tag);
        } catch {}
        return {
          id: row.id,
          providerId: row.provider_id,
          name: row.name,
          apiKey,
          maskedKey: row.masked_key,
          createdAt: row.created_at,
        };
      });
    } catch {
      return [];
    }
  }

  public getSecretForProvider(providerId: string): string | null {
    const secrets = this.listStoredSecrets();
    const match = secrets.find((s) => s.providerId.toLowerCase() === providerId.toLowerCase() && s.apiKey);
    return match ? match.apiKey : null;
  }

  public getActiveConfig(): { activeProviderId: string; activeModelId: string } {
    if (fs.existsSync(this.configPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
        return {
          activeProviderId: data.activeProviderId || 'openai',
          activeModelId: data.activeModelId || 'gpt-4o',
        };
      } catch {
        return { activeProviderId: 'openai', activeModelId: 'gpt-4o' };
      }
    }
    return { activeProviderId: 'openai', activeModelId: 'gpt-4o' };
  }
}