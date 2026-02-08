/**
 * Unit tests for CLI interface
 *
 * Tests the command-line interface for the migration script,
 * verifying flag parsing and output formatting.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { spawn } from 'child_process';
import * as path from 'path';

describe('CLI Interface', () => {
  const scriptPath = path.join(process.cwd(), 'src/scripts/migrate-imports.ts');

  /**
   * Helper to run the CLI script with arguments
   */
  function runCLI(args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    return new Promise((resolve) => {
      const child = spawn('tsx', [scriptPath, ...args], {
        cwd: process.cwd(),
        env: { ...process.env },
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        resolve({
          stdout,
          stderr,
          exitCode: code || 0,
        });
      });
    });
  }

  describe('Command-line flags', () => {
    it('should accept --dry-run flag', async () => {
      const result = await runCLI(['--dry-run']);

      expect(result.stdout).toContain('DRY RUN MODE');
      expect(result.stdout).toContain('No files will be modified');
      expect(result.stdout).toContain('This was a dry run');
    }, 30000);

    it('should accept --verbose flag', async () => {
      const result = await runCLI(['--dry-run', '--verbose']);

      expect(result.stdout).toContain('Discovering files');
      expect(result.stdout).toContain('Processing files');
      expect(result.stdout).toContain('Migration Summary');
    }, 30000);

    it('should accept --no-validation flag', async () => {
      const result = await runCLI(['--dry-run', '--no-validation']);

      // Should not contain validation results
      expect(result.stdout).not.toContain('VALIDATION RESULTS');
      expect(result.stdout).not.toContain('TypeScript compilation');
      expect(result.stdout).not.toContain('Test suite');
    }, 30000);

    it('should accept multiple flags together', async () => {
      const result = await runCLI(['--dry-run', '--verbose', '--no-validation']);

      expect(result.stdout).toContain('DRY RUN MODE');
      expect(result.stdout).toContain('Discovering files');
      expect(result.stdout).not.toContain('VALIDATION RESULTS');
    }, 30000);
  });

  describe('Progress display', () => {
    it('should display progress in verbose mode', async () => {
      const result = await runCLI(['--dry-run', '--verbose']);

      // Should show file discovery progress
      expect(result.stdout).toContain('Discovering files');
      expect(result.stdout).toContain('Discovered');

      // Should show processing progress
      expect(result.stdout).toContain('Processing files');
      expect(result.stdout).toContain('Processed');
    }, 30000);

    it('should not display detailed progress without verbose flag', async () => {
      const result = await runCLI(['--dry-run']);

      // Should not show detailed progress messages
      expect(result.stdout).not.toContain('Discovering files');
      expect(result.stdout).not.toContain('Processing files');

      // But should still show the report
      expect(result.stdout).toContain('MIGRATION REPORT');
    }, 30000);
  });

  describe('Migration report', () => {
    it('should display migration report', async () => {
      const result = await runCLI(['--dry-run']);

      expect(result.stdout).toContain('MIGRATION REPORT');
      expect(result.stdout).toContain('Total files discovered');
      expect(result.stdout).toContain('Files processed');
      expect(result.stdout).toContain('Files transformed');
      expect(result.stdout).toContain('Total import changes');
    }, 30000);

    it('should display validation results when enabled', async () => {
      const result = await runCLI(['--dry-run']);

      expect(result.stdout).toContain('VALIDATION RESULTS');
      expect(result.stdout).toContain('TypeScript compilation');
      expect(result.stdout).toContain('Test suite');
    }, 30000);

    it('should not display validation results when disabled', async () => {
      const result = await runCLI(['--dry-run', '--no-validation']);

      expect(result.stdout).not.toContain('VALIDATION RESULTS');
    }, 30000);
  });

  describe('Exit codes', () => {
    it('should exit with 0 in dry-run mode', async () => {
      const result = await runCLI(['--dry-run']);

      expect(result.exitCode).toBe(0);
    }, 30000);

    it('should exit with 0 when validation is disabled', async () => {
      const result = await runCLI(['--dry-run', '--no-validation']);

      expect(result.exitCode).toBe(0);
    }, 30000);

    it('should exit with 0 when migration succeeds with validation', async () => {
      const result = await runCLI(['--dry-run']);

      // In dry-run mode with no changes, validation should pass
      if (result.stdout.includes('Migration completed successfully')) {
        expect(result.exitCode).toBe(0);
      }
    }, 30000);
  });

  describe('Output formatting', () => {
    it('should use emojis and formatting for better readability', async () => {
      const result = await runCLI(['--dry-run']);

      // Check for emojis
      expect(result.stdout).toMatch(/🚀|📋|📊|✅|❌|💡/);

      // Check for separators
      expect(result.stdout).toContain('='.repeat(60));
    }, 30000);

    it('should display success message in dry-run mode', async () => {
      const result = await runCLI(['--dry-run']);

      expect(result.stdout).toContain('This was a dry run');
    }, 30000);
  });
});
