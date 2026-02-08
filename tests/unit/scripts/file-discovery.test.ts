/**
 * Unit tests for file discovery module
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { FileDiscovery, discoverFiles } from '../../../src/scripts/migration/file-discovery';

describe('FileDiscovery', () => {
  let tempDir: string;

  beforeEach(() => {
    // Create a temporary directory for testing
    tempDir = path.join(process.cwd(), 'temp-test-discovery');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('basic file discovery', () => {
    it('should discover .ts files in a single directory', () => {
      // Create test files
      const srcDir = path.join(tempDir, 'src');
      fs.mkdirSync(srcDir, { recursive: true });
      fs.writeFileSync(path.join(srcDir, 'file1.ts'), '');
      fs.writeFileSync(path.join(srcDir, 'file2.ts'), '');

      const discovery = new FileDiscovery({
        sourceDirs: ['src'],
        extensions: ['.ts'],
        excludePatterns: [],
        baseDir: tempDir,
      });

      const files = discovery.discoverFiles();

      expect(files).toHaveLength(2);
      expect(files.some(f => f.endsWith('file1.ts'))).toBe(true);
      expect(files.some(f => f.endsWith('file2.ts'))).toBe(true);
    });

    it('should discover .tsx files in a single directory', () => {
      // Create test files
      const srcDir = path.join(tempDir, 'src');
      fs.mkdirSync(srcDir, { recursive: true });
      fs.writeFileSync(path.join(srcDir, 'component1.tsx'), '');
      fs.writeFileSync(path.join(srcDir, 'component2.tsx'), '');

      const discovery = new FileDiscovery({
        sourceDirs: ['src'],
        extensions: ['.tsx'],
        excludePatterns: [],
        baseDir: tempDir,
      });

      const files = discovery.discoverFiles();

      expect(files).toHaveLength(2);
      expect(files.some(f => f.endsWith('component1.tsx'))).toBe(true);
      expect(files.some(f => f.endsWith('component2.tsx'))).toBe(true);
    });

    it('should discover both .ts and .tsx files', () => {
      // Create test files
      const srcDir = path.join(tempDir, 'src');
      fs.mkdirSync(srcDir, { recursive: true });
      fs.writeFileSync(path.join(srcDir, 'file.ts'), '');
      fs.writeFileSync(path.join(srcDir, 'component.tsx'), '');

      const discovery = new FileDiscovery({
        sourceDirs: ['src'],
        extensions: ['.ts', '.tsx'],
        excludePatterns: [],
        baseDir: tempDir,
      });

      const files = discovery.discoverFiles();

      expect(files).toHaveLength(2);
      expect(files.some(f => f.endsWith('file.ts'))).toBe(true);
      expect(files.some(f => f.endsWith('component.tsx'))).toBe(true);
    });
  });

  describe('recursive directory traversal', () => {
    it('should discover files in nested subdirectories', () => {
      // Create nested directory structure
      const srcDir = path.join(tempDir, 'src');
      const coreDir = path.join(srcDir, 'core');
      const virtualizationDir = path.join(coreDir, 'virtualization');

      fs.mkdirSync(virtualizationDir, { recursive: true });

      fs.writeFileSync(path.join(srcDir, 'app.ts'), '');
      fs.writeFileSync(path.join(coreDir, 'index.ts'), '');
      fs.writeFileSync(path.join(virtualizationDir, 'calculator.ts'), '');

      const discovery = new FileDiscovery({
        sourceDirs: ['src'],
        extensions: ['.ts'],
        excludePatterns: [],
        baseDir: tempDir,
      });

      const files = discovery.discoverFiles();

      expect(files).toHaveLength(3);
      expect(files.some(f => f.endsWith('app.ts'))).toBe(true);
      expect(files.some(f => f.endsWith('index.ts'))).toBe(true);
      expect(files.some(f => f.endsWith('calculator.ts'))).toBe(true);
    });

    it('should discover files in multiple source directories', () => {
      // Create src and tests directories
      const srcDir = path.join(tempDir, 'src');
      const testsDir = path.join(tempDir, 'tests');

      fs.mkdirSync(srcDir, { recursive: true });
      fs.mkdirSync(testsDir, { recursive: true });

      fs.writeFileSync(path.join(srcDir, 'app.ts'), '');
      fs.writeFileSync(path.join(testsDir, 'app.test.ts'), '');

      const discovery = new FileDiscovery({
        sourceDirs: ['src', 'tests'],
        extensions: ['.ts'],
        excludePatterns: [],
        baseDir: tempDir,
      });

      const files = discovery.discoverFiles();

      expect(files).toHaveLength(2);
      expect(files.some(f => f.endsWith('app.ts'))).toBe(true);
      expect(files.some(f => f.endsWith('app.test.ts'))).toBe(true);
    });
  });

  describe('file extension filtering', () => {
    it('should only include files with specified extensions', () => {
      // Create files with various extensions
      const srcDir = path.join(tempDir, 'src');
      fs.mkdirSync(srcDir, { recursive: true });

      fs.writeFileSync(path.join(srcDir, 'file.ts'), '');
      fs.writeFileSync(path.join(srcDir, 'component.tsx'), '');
      fs.writeFileSync(path.join(srcDir, 'styles.css'), '');
      fs.writeFileSync(path.join(srcDir, 'readme.md'), '');
      fs.writeFileSync(path.join(srcDir, 'data.json'), '');

      const discovery = new FileDiscovery({
        sourceDirs: ['src'],
        extensions: ['.ts', '.tsx'],
        excludePatterns: [],
        baseDir: tempDir,
      });

      const files = discovery.discoverFiles();

      expect(files).toHaveLength(2);
      expect(files.some(f => f.endsWith('file.ts'))).toBe(true);
      expect(files.some(f => f.endsWith('component.tsx'))).toBe(true);
      expect(files.some(f => f.endsWith('styles.css'))).toBe(false);
      expect(files.some(f => f.endsWith('readme.md'))).toBe(false);
      expect(files.some(f => f.endsWith('data.json'))).toBe(false);
    });
  });

  describe('exclusion pattern matching', () => {
    it('should exclude files matching *.config.ts pattern', () => {
      // Create test files
      const srcDir = path.join(tempDir, 'src');
      fs.mkdirSync(srcDir, { recursive: true });

      fs.writeFileSync(path.join(srcDir, 'app.ts'), '');
      fs.writeFileSync(path.join(srcDir, 'vite.config.ts'), '');
      fs.writeFileSync(path.join(srcDir, 'vitest.config.ts'), '');

      const discovery = new FileDiscovery({
        sourceDirs: ['src'],
        extensions: ['.ts'],
        excludePatterns: ['*.config.ts'],
        baseDir: tempDir,
      });

      const files = discovery.discoverFiles();

      expect(files).toHaveLength(1);
      expect(files.some(f => f.endsWith('app.ts'))).toBe(true);
      expect(files.some(f => f.endsWith('vite.config.ts'))).toBe(false);
      expect(files.some(f => f.endsWith('vitest.config.ts'))).toBe(false);
    });

    it('should exclude files matching *.d.ts pattern', () => {
      // Create test files
      const srcDir = path.join(tempDir, 'src');
      fs.mkdirSync(srcDir, { recursive: true });

      fs.writeFileSync(path.join(srcDir, 'app.ts'), '');
      fs.writeFileSync(path.join(srcDir, 'types.d.ts'), '');
      fs.writeFileSync(path.join(srcDir, 'global.d.ts'), '');

      const discovery = new FileDiscovery({
        sourceDirs: ['src'],
        extensions: ['.ts'],
        excludePatterns: ['*.d.ts'],
        baseDir: tempDir,
      });

      const files = discovery.discoverFiles();

      expect(files).toHaveLength(1);
      expect(files.some(f => f.endsWith('app.ts'))).toBe(true);
      expect(files.some(f => f.endsWith('types.d.ts'))).toBe(false);
      expect(files.some(f => f.endsWith('global.d.ts'))).toBe(false);
    });

    it('should exclude files matching multiple patterns', () => {
      // Create test files
      const srcDir = path.join(tempDir, 'src');
      fs.mkdirSync(srcDir, { recursive: true });

      fs.writeFileSync(path.join(srcDir, 'app.ts'), '');
      fs.writeFileSync(path.join(srcDir, 'vite.config.ts'), '');
      fs.writeFileSync(path.join(srcDir, 'types.d.ts'), '');

      const discovery = new FileDiscovery({
        sourceDirs: ['src'],
        extensions: ['.ts'],
        excludePatterns: ['*.config.ts', '*.d.ts'],
        baseDir: tempDir,
      });

      const files = discovery.discoverFiles();

      expect(files).toHaveLength(1);
      expect(files.some(f => f.endsWith('app.ts'))).toBe(true);
      expect(files.some(f => f.endsWith('vite.config.ts'))).toBe(false);
      expect(files.some(f => f.endsWith('types.d.ts'))).toBe(false);
    });

    it('should handle wildcard patterns correctly', () => {
      // Create test files
      const srcDir = path.join(tempDir, 'src');
      fs.mkdirSync(srcDir, { recursive: true });

      fs.writeFileSync(path.join(srcDir, 'app.ts'), '');
      fs.writeFileSync(path.join(srcDir, 'test.spec.ts'), '');
      fs.writeFileSync(path.join(srcDir, 'test.test.ts'), '');

      const discovery = new FileDiscovery({
        sourceDirs: ['src'],
        extensions: ['.ts'],
        excludePatterns: ['*.spec.ts', '*.test.ts'],
        baseDir: tempDir,
      });

      const files = discovery.discoverFiles();

      expect(files).toHaveLength(1);
      expect(files.some(f => f.endsWith('app.ts'))).toBe(true);
      expect(files.some(f => f.endsWith('test.spec.ts'))).toBe(false);
      expect(files.some(f => f.endsWith('test.test.ts'))).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should return empty array for non-existent directory', () => {
      const discovery = new FileDiscovery({
        sourceDirs: ['non-existent'],
        extensions: ['.ts'],
        excludePatterns: [],
        baseDir: tempDir,
      });

      const files = discovery.discoverFiles();

      expect(files).toHaveLength(0);
    });

    it('should return empty array for empty directory', () => {
      const srcDir = path.join(tempDir, 'src');
      fs.mkdirSync(srcDir, { recursive: true });

      const discovery = new FileDiscovery({
        sourceDirs: ['src'],
        extensions: ['.ts'],
        excludePatterns: [],
        baseDir: tempDir,
      });

      const files = discovery.discoverFiles();

      expect(files).toHaveLength(0);
    });

    it('should handle directory with only excluded files', () => {
      const srcDir = path.join(tempDir, 'src');
      fs.mkdirSync(srcDir, { recursive: true });

      fs.writeFileSync(path.join(srcDir, 'vite.config.ts'), '');
      fs.writeFileSync(path.join(srcDir, 'types.d.ts'), '');

      const discovery = new FileDiscovery({
        sourceDirs: ['src'],
        extensions: ['.ts'],
        excludePatterns: ['*.config.ts', '*.d.ts'],
        baseDir: tempDir,
      });

      const files = discovery.discoverFiles();

      expect(files).toHaveLength(0);
    });

    it('should return absolute paths', () => {
      const srcDir = path.join(tempDir, 'src');
      fs.mkdirSync(srcDir, { recursive: true });
      fs.writeFileSync(path.join(srcDir, 'app.ts'), '');

      const discovery = new FileDiscovery({
        sourceDirs: ['src'],
        extensions: ['.ts'],
        excludePatterns: [],
        baseDir: tempDir,
      });

      const files = discovery.discoverFiles();

      expect(files).toHaveLength(1);
      expect(path.isAbsolute(files[0])).toBe(true);
    });
  });

  describe('convenience function', () => {
    it('should work with default parameters', () => {
      const srcDir = path.join(tempDir, 'src');
      fs.mkdirSync(srcDir, { recursive: true });

      fs.writeFileSync(path.join(srcDir, 'app.ts'), '');
      fs.writeFileSync(path.join(srcDir, 'component.tsx'), '');
      fs.writeFileSync(path.join(srcDir, 'vite.config.ts'), '');
      fs.writeFileSync(path.join(srcDir, 'types.d.ts'), '');

      // Change to temp directory to test default baseDir
      const originalCwd = process.cwd();
      process.chdir(tempDir);

      try {
        const files = discoverFiles(['src']);

        expect(files).toHaveLength(2);
        expect(files.some(f => f.endsWith('app.ts'))).toBe(true);
        expect(files.some(f => f.endsWith('component.tsx'))).toBe(true);
        expect(files.some(f => f.endsWith('vite.config.ts'))).toBe(false);
        expect(files.some(f => f.endsWith('types.d.ts'))).toBe(false);
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should work with custom parameters', () => {
      const srcDir = path.join(tempDir, 'src');
      fs.mkdirSync(srcDir, { recursive: true });

      fs.writeFileSync(path.join(srcDir, 'app.ts'), '');
      fs.writeFileSync(path.join(srcDir, 'test.spec.ts'), '');

      // Change to temp directory
      const originalCwd = process.cwd();
      process.chdir(tempDir);

      try {
        const files = discoverFiles(['src'], ['.ts'], ['*.spec.ts']);

        expect(files).toHaveLength(1);
        expect(files.some(f => f.endsWith('app.ts'))).toBe(true);
        expect(files.some(f => f.endsWith('test.spec.ts'))).toBe(false);
      } finally {
        process.chdir(originalCwd);
      }
    });
  });

  describe('real-world scenarios', () => {
    it('should handle typical project structure', () => {
      // Create a realistic project structure
      const srcDir = path.join(tempDir, 'src');
      const coreDir = path.join(srcDir, 'core');
      const hooksDir = path.join(srcDir, 'hooks');
      const componentsDir = path.join(srcDir, 'components');
      const testsDir = path.join(tempDir, 'tests');
      const unitDir = path.join(testsDir, 'unit');

      fs.mkdirSync(coreDir, { recursive: true });
      fs.mkdirSync(hooksDir, { recursive: true });
      fs.mkdirSync(componentsDir, { recursive: true });
      fs.mkdirSync(unitDir, { recursive: true });

      // Create source files
      fs.writeFileSync(path.join(srcDir, 'app.tsx'), '');
      fs.writeFileSync(path.join(srcDir, 'vite.config.ts'), '');
      fs.writeFileSync(path.join(coreDir, 'calculator.ts'), '');
      fs.writeFileSync(path.join(coreDir, 'types.d.ts'), '');
      fs.writeFileSync(path.join(hooksDir, 'use-virtualization.ts'), '');
      fs.writeFileSync(path.join(componentsDir, 'list.tsx'), '');

      // Create test files
      fs.writeFileSync(path.join(unitDir, 'calculator.test.ts'), '');

      const discovery = new FileDiscovery({
        sourceDirs: ['src', 'tests'],
        extensions: ['.ts', '.tsx'],
        excludePatterns: ['*.config.ts', '*.d.ts'],
        baseDir: tempDir,
      });

      const files = discovery.discoverFiles();

      // Should find: app.tsx, calculator.ts, use-virtualization.ts, list.tsx, calculator.test.ts
      // Should exclude: vite.config.ts, types.d.ts
      expect(files).toHaveLength(5);
      expect(files.some(f => f.endsWith('app.tsx'))).toBe(true);
      expect(files.some(f => f.endsWith('calculator.ts'))).toBe(true);
      expect(files.some(f => f.endsWith('use-virtualization.ts'))).toBe(true);
      expect(files.some(f => f.endsWith('list.tsx'))).toBe(true);
      expect(files.some(f => f.endsWith('calculator.test.ts'))).toBe(true);
      expect(files.some(f => f.endsWith('vite.config.ts'))).toBe(false);
      expect(files.some(f => f.endsWith('types.d.ts'))).toBe(false);
    });
  });
});
