/**
 * Tests for migration infrastructure setup
 */

import { describe, it, expect } from 'vitest';
import { MigrationCoordinator } from '../../../src/scripts/migration/coordinator.js';
import type { MigrationConfig, MigrationOptions } from '../../../src/scripts/migration/types.js';

describe('Migration Infrastructure', () => {
  describe('MigrationCoordinator', () => {
    it('should be instantiable with config and options', () => {
      const config: MigrationConfig = {
        sourceDirs: ['src', 'tests'],
        extensions: ['.ts', '.tsx'],
        excludePatterns: ['*.config.ts'],
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

      const options: MigrationOptions = {
        dryRun: true,
        verbose: false,
      };

      const coordinator = new MigrationCoordinator(config, options);
      expect(coordinator).toBeDefined();
      expect(coordinator).toBeInstanceOf(MigrationCoordinator);
    });

    it('should execute migration and return a report', async () => {
      const config: MigrationConfig = {
        sourceDirs: ['src'],
        extensions: ['.ts'],
        excludePatterns: [],
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

      const options: MigrationOptions = {
        dryRun: true,
        verbose: false,
      };

      const coordinator = new MigrationCoordinator(config, options);
      const report = await coordinator.executeMigration();

      expect(report).toBeDefined();
      expect(report).toHaveProperty('totalFiles');
      expect(report).toHaveProperty('processedFiles');
      expect(report).toHaveProperty('transformedFiles');
      expect(report).toHaveProperty('totalChanges');
      expect(report).toHaveProperty('errors');
      expect(report).toHaveProperty('validationResult');
      expect(Array.isArray(report.errors)).toBe(true);
    });

    it('should return validation result structure', async () => {
      const config: MigrationConfig = {
        sourceDirs: ['src'],
        extensions: ['.ts'],
        excludePatterns: [],
        aliasMap: {
          core: '@/core',
          hooks: '@/hooks',
          components: '@/components',
          adapters: '@/adapters',
          demo: '@/demo',
          utils: '@/utils',
        },
        organizeImports: true,
        runValidation: true,
      };

      const options: MigrationOptions = {
        dryRun: true,
        verbose: false,
      };

      const coordinator = new MigrationCoordinator(config, options);
      const report = await coordinator.executeMigration();

      expect(report.validationResult).toBeDefined();
      expect(report.validationResult).toHaveProperty('compilationSuccess');
      expect(report.validationResult).toHaveProperty('compilationErrors');
      expect(report.validationResult).toHaveProperty('testSuccess');
      expect(report.validationResult).toHaveProperty('testFailures');
      expect(typeof report.validationResult.compilationSuccess).toBe('boolean');
      expect(typeof report.validationResult.testSuccess).toBe('boolean');
      expect(Array.isArray(report.validationResult.compilationErrors)).toBe(true);
      expect(Array.isArray(report.validationResult.testFailures)).toBe(true);
    });
  });

  describe('Type Definitions', () => {
    it('should have correct Layer type values', () => {
      const layers: Array<'core' | 'hooks' | 'components' | 'adapters' | 'demo' | 'utils'> = [
        'core',
        'hooks',
        'components',
        'adapters',
        'demo',
        'utils',
      ];

      expect(layers).toHaveLength(6);
      expect(layers).toContain('core');
      expect(layers).toContain('hooks');
      expect(layers).toContain('components');
      expect(layers).toContain('adapters');
      expect(layers).toContain('demo');
      expect(layers).toContain('utils');
    });

    it('should have correct ImportGroup type values', () => {
      const groups: Array<'external' | 'core' | 'hooks' | 'components' | 'adapters' | 'utils' | 'types' | 'styles'> = [
        'external',
        'core',
        'hooks',
        'components',
        'adapters',
        'utils',
        'types',
        'styles',
      ];

      expect(groups).toHaveLength(8);
      expect(groups).toContain('external');
      expect(groups).toContain('core');
      expect(groups).toContain('hooks');
      expect(groups).toContain('components');
      expect(groups).toContain('adapters');
      expect(groups).toContain('utils');
      expect(groups).toContain('types');
      expect(groups).toContain('styles');
    });
  });
});
