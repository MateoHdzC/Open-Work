import fs from 'node:fs';
import path from 'node:path';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

export interface VerificationResult {
  verified: boolean;
  reality: string;
  details?: Record<string, any>;
}

export class VerificationEngine {
  /**
   * Verify whether an application process is actually running in Windows.
   */
  public async verifyApplicationRunning(appName: string): Promise<VerificationResult> {
    try {
      const clean = appName.replace(/[^a-zA-Z0-9_-]/g, '');
      const { stdout } = await execAsync(
        `powershell -NoProfile -Command "Get-Process -Name *${clean}* -ErrorAction SilentlyContinue | Select-Object -ExpandProperty ProcessName"`
      );
      const runningProcs = stdout.trim().split(/\r?\n/).filter(Boolean);
      const isRunning = runningProcs.length > 0;

      return {
        verified: isRunning,
        reality: isRunning
          ? `Verified: Process '${clean}' is running (detected instances: ${runningProcs.join(', ')})`
          : `False Claim: Process '${clean}' is NOT running on Windows.`,
        details: { runningProcesses: runningProcs },
      };
    } catch (err: any) {
      return {
        verified: false,
        reality: `Verification check failed: ${err.message}`,
      };
    }
  }

  /**
   * Verify whether a file or directory actually exists on the filesystem.
   */
  public verifyFileExists(targetPath: string, workspaceRoot?: string): VerificationResult {
    const root = workspaceRoot || process.cwd();
    const resolved = path.isAbsolute(targetPath) ? targetPath : path.resolve(root, targetPath);
    const exists = fs.existsSync(resolved);
    let statInfo: any = null;

    if (exists) {
      const stat = fs.statSync(resolved);
      statInfo = {
        size: stat.size,
        isDirectory: stat.isDirectory(),
        modifiedTime: stat.mtime.toISOString(),
      };
    }

    return {
      verified: exists,
      reality: exists
        ? `Verified: File exists at '${resolved}' (${statInfo.size} bytes)`
        : `False Claim: File does NOT exist at '${resolved}'.`,
      details: statInfo,
    };
  }

  /**
   * Verify whether a file contains expected text content.
   */
  public verifyFileContains(targetPath: string, expectedSnippet: string, workspaceRoot?: string): VerificationResult {
    const existsCheck = this.verifyFileExists(targetPath, workspaceRoot);
    if (!existsCheck.verified) return existsCheck;

    const root = workspaceRoot || process.cwd();
    const resolved = path.isAbsolute(targetPath) ? targetPath : path.resolve(root, targetPath);
    const content = fs.readFileSync(resolved, 'utf-8');
    const hasSnippet = content.includes(expectedSnippet);

    return {
      verified: hasSnippet,
      reality: hasSnippet
        ? `Verified: File '${path.basename(resolved)}' contains the expected content snippet.`
        : `False Claim: File '${path.basename(resolved)}' does not contain the specified snippet.`,
    };
  }

  /**
   * Verify test execution reality.
   */
  public async verifyTests(command: string = 'npm test', workspaceRoot?: string): Promise<VerificationResult> {
    try {
      const cwd = workspaceRoot || process.cwd();
      const { stdout } = await execAsync(command, { cwd, timeout: 60000 });
      return {
        verified: true,
        reality: `Verified: Test command '${command}' exited with code 0 (Passed).`,
        details: { output: stdout.slice(-1000) },
      };
    } catch (err: any) {
      return {
        verified: false,
        reality: `Tests Failed: Command '${command}' exited with code ${err.code || 1}.`,
        details: { output: (err.stdout || err.stderr || err.message).slice(-1000) },
      };
    }
  }

  /**
   * Verify build execution reality.
   */
  public async verifyBuild(command: string = 'npm run build', workspaceRoot?: string): Promise<VerificationResult> {
    try {
      const cwd = workspaceRoot || process.cwd();
      const { stdout } = await execAsync(command, { cwd, timeout: 90000 });
      return {
        verified: true,
        reality: `Verified: Build command '${command}' completed successfully.`,
        details: { output: stdout.slice(-1000) },
      };
    } catch (err: any) {
      return {
        verified: false,
        reality: `Build Failed: Command '${command}' exited with code ${err.code || 1}.`,
        details: { output: (err.stdout || err.stderr || err.message).slice(-1000) },
      };
    }
  }
}
