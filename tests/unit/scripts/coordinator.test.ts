/**
 * Unit tests for Migration Coordinator
 *
 * Tests the orchestration of the complete migration process including:
 * - File discovery integration
 * - File processing orchestration
 * - Progress tracking
 * - Error collection
 * - Statistics reporting
 * - Validation integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MigrationCoordinator, createCoordinator } from '../../../src/scripts/migration/coordinator.js';
import type { MigrationConfig, MigrationOptions } from '../../../src/scripts/migration/types.js';

// Mock the file system
vi.mock('fs', () => ({
  default: {
    writeFileSync: vi.fn(),
  },
  writeFileSync: vi.fn(),
}));

// Mock the file discovery module
vi.mock('../../../src/scripts/migration/file-discovery.js', () => ({
  FileDiscovery: class MockFileDiscovery {
    discoverFiles() {
      return [
        'src/test1.ts',
        'src/test2.ts',
        'src/test3.ts',
      ];
    }
  },
}));

// Mock the file processor module
vi.mock('../../../src/scripts/migration/file-processor.js', () => ({
  createFileProcessor: () => ({
    processFile: (filePath: string) => {
      if (filePath === 'src/test1.ts') {
        return {
          filePath,
          success: true,
          transformedContent: 'import { foo } from "@/core/foo";\n',
          error: null,
          changesCount: 1,
        };
      } else if (filePath === 'src/test2.ts') {
        return {
          filePath,
          success: true,
          transformedContent: 'import { bar } from "@/hooks/bar";\n',
          error: null,
          changesCount: 1,
        };
      } else if (filePath === 'src/test3.ts') {
        return {
          filePath,
          success: false,
          transformedContent: null,
          error: 'Parse error',
          changesCount: 0,
        };
      }
      return {
        filePath,
        success: true,
        transformedContent: null,
        error: null,
        changesCount: 0,
      };
    },
  }),
}));

// Mock the validator module
vi.mock('../../../src/scripts/migration/validator.js', () => ({
  createValidator: () => ({
    validate: vi.fn().mockResolvedValue({
      compilationSuccess: true,
      compilationErrors: [],
      testSuccess: true,
      testFailures: [],
    }),
  }),
}));

describe('MigrationCoordinator', () => {
  let config: MigrationConfig;
  let options: MigrationOptions;

  beforeEach(() => {
    config = {
      sourceDirs: ['src', 'tests'],
      extensions: ['.ts', '.tsx'],
      excludePatterns: ['*.config.ts', '*.d.ts'],
      aliasMap: {
        core: '@/core',
        hooks: '@/hooks',
        components: '@/components',
        adapters: '@/adapters',
        demo: '@/demo',
        utils: '@/utils',
      },
      organizeImports: true,
      runValidation: false,
    };

    options = {
      dryRun: true,
      verbose: false,
    };

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('executeMigration', () => {
    it('should discover files and generate report', async () => {
      const coordinator = new MigrationCoordinator(config, options);
      const report = await coordinator.executeMigration();

      expect(report.totalFiles).toBe(3);
      expect(report.processedFiles).toBe(2); // test1 and test2 succeeded
      expect(report.transformedFiles).toBe(2); // test1 and test2 had changes
      expect(report.totalChanges).toBe(2); // 1 change each
      expect(report.errors).toHaveLength(1); // test3 failed
      expect(report.errors[0]).toContain('src/test3.ts');
      expect(report.errors[0]).toContain('Parse error');
    });

    it('should not write files in dry-run mode', async () => {
      const fs = await import('fs');
      const writeFileSyncMock = vi.mocked(fs.writeFileSync);

      const coordinator = new MigrationCoordinator(config, options);
      await coordinator.executeMigration();

      expect(writeFileSyncMock).not.toHaveBeenCalled();
    });

    it('should write files when not in dry-run mode', async () => {
      const fs = await import('fs');
      const writeFileSyncMock = vi.mocked(fs.writeFileSync);

      const coordinator = new MigrationCoordinator(config, { ...options, dryRun: false });
      await coordinator.executeMigration();

      // Should write test1 and test2 (both had changes)
      expect(writeFileSyncMock).toHaveBeenCalledTimes(2);
      expect(writeFileSyncMock).toHaveBeenCalledWith(
        'src/test1.ts',
        'import { foo } from "@/core/foo";\n',
        'utf-8'
      );
      expect(writeFileSyncMock).toHaveBeenCalledWith(
        'src/test2.ts',
        'import { bar } from "@/hooks/bar";\n',
        'utf-8'
      );
    });

    it('should not run validation when runValidation is false', async () => {
      const coordinator = new MigrationCoordinator(config, options);
      const report = await coordinator.executeMigration();

      // Validation should not run, so results should be default (all success)
      expect(report.validationResult.compilationSuccess).toBe(true);
      expect(report.validationResult.testSuccess).toBe(true);
    });

    it('should run validation when runValidation is true and not dry-run', async () => {
      const coordinator = new MigrationCoordinator(
        { ...config, runValidation: true },
        { ...options, dryRun: false }
      );
      const report = await coordinator.executeMigration();

      expect(report.validationResult.compilationSuccess).toBe(true);
      expect(report.validationResult.testSuccess).toBe(true);
    });

    it('should not run validation in dry-run mode even if runValidation is true', async () => {
      const coordinator = new MigrationCoordinator(
        { ...config, runValidation: true },
        { ...options, dryRun: true }
      );
      const report = await coordinator.executeMigration();

      // Validation should not run in dry-run mode
      expect(report.validationResult.compilationSuccess).toBe(true);
      expect(report.validationResult.testSuccess).toBe(true);
    });

    it('should handle file write errors', async () => {
      const fs = await import('fs');
      const writeFileSyncMock = vi.mocked(fs.writeFileSync);
      writeFileSyncMock.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const coordinator = new MigrationCoordinator(config, { ...options, dryRun: false });
      const report = await coordinator.executeMigration();

      expect(report.errors).toHaveLength(2); // 1 from test3 processing + 1 from write error
      expect(report.errors.some(e => e.includes('Permission denied'))).toBe(true);
    });

    it('should collect statistics correctly', async () => {
      const coordinator = new MigrationCoordinator(config, options);
      const report = await coordinator.executeMigration();

      expect(report.totalFiles).toBe(3);
      expect(report.processedFiles).toBe(2); // test1 and test2 succeeded
      expect(report.transformedFiles).toBe(2); // test1 and test2 had changes
      expect(report.totalChanges).toBe(2); // 1 + 1
    });
  });

  describe('createCoordinator', () => {
    it('should create a coordinator instance', () => {
      const coordinator = createCoordinator(config, options);
      expect(coordinator).toBeInstanceOf(MigrationCoordinator);
    });
  });

  describe('verbose mode', () => {
    it('should log progress in verbose mode', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });

      const coordinator = new MigrationCoordinator(config, { ...options, verbose: true });
      await coordinator.executeMigration();

      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleSpy.mock.calls.some(call => call[0]?.includes('Discovering files'))).toBe(true);

      consoleSpy.mockRestore();
    });

    it('should not log in non-verbose mode', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });

      const coordinator = new MigrationCoordinator(config, { ...options, verbose: false });
      await coordinator.executeMigration();

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});
