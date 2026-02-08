/**
 * Import Matcher Module
 *
 * Provides functionality to:
 * - Extract import statements from source code using regex
 * - Detect relative imports (starting with './' or '../')
 * - Identify target architectural layer from resolved paths
 * - Detect same-directory imports that should be preserved
 * - Detect CSS module imports that should be preserved
 *
 * Requirements: 1.2, 3.2, 11.1, 11.2, 12.1, 12.2
 */

import * as path from 'path';
import type { Layer } from './types.js';

/**
 * Regular expression to match import statements
 * Matches:
 * - import ... from '...'
 * - import ... from "..."
 * - import type ... from '...'
 * - import('...') dynamic imports
 */
const IMPORT_STATEMENT_REGEX = /import\s+(?:type\s+)?(?:[\w*{}\s,]+\s+from\s+)?['"]([^'"]+)['"]/g;

/**
 * Regular expression to match a single import statement (non-global)
 */
const SINGLE_IMPORT_REGEX = /import\s+(?:type\s+)?(?:[\w*{}\s,]+\s+from\s+)?['"]([^'"]+)['"]/;

/**
 * Interface for import matcher functionality
 */
export interface ImportMatcher {
  /**
   * Extract all import statements from source code
   * @param content - Source code content
   * @returns Array of import statement strings
   */
  extractImports(content: string): string[];

  /**
   * Check if an import path is a relative import
   * @param importPath - The import path to check
   * @returns true if the import starts with './' or '../'
   */
  isRelativeImport(importPath: string): boolean;

  /**
   * Identify the target architectural layer from an import path
   * @param importPath - The import path (can be relative or absolute)
   * @param currentFilePath - The path of the file containing the import
   * @returns The target layer, or null if not a layer import
   */
  identifyTargetLayer(importPath: string, currentFilePath: string): Layer | null;

  /**
   * Check if a relative import should be preserved (same-directory import)
   * @param importPath - The import path
   * @param currentFilePath - The path of the file containing the import
   * @returns true if the import should remain relative
   */
  isSameDirectoryImport(importPath: string, currentFilePath: string): boolean;

  /**
   * Check if an import is a CSS module that should be preserved
   * @param importPath - The import path
   * @returns true if the import is a CSS or CSS module file
   */
  isCSSModuleImport(importPath: string): boolean;

  /**
   * Check if an import should be preserved as relative
   * Combines same-directory and CSS module checks
   * @param importPath - The import path
   * @param currentFilePath - The path of the file containing the import
   * @returns true if the import should remain relative
   */
  shouldPreserveRelative(importPath: string, currentFilePath: string): boolean;
}

/**
 * Default implementation of ImportMatcher
 */
export class DefaultImportMatcher implements ImportMatcher {
  /**
   * Extract all import statements from source code
   */
  extractImports(content: string): string[] {
    const imports: string[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
      const match = line.match(SINGLE_IMPORT_REGEX);
      if (match) {
        imports.push(line.trim());
      }
    }

    return imports;
  }

  /**
   * Check if an import path is a relative import
   */
  isRelativeImport(importPath: string): boolean {
    return importPath.startsWith('./') || importPath.startsWith('../');
  }

  /**
   * Identify the target architectural layer from an import path
   */
  identifyTargetLayer(importPath: string, currentFilePath: string): Layer | null {
    // If it's not a relative import, check if it's already using a path alias
    if (!this.isRelativeImport(importPath)) {
      // Check for existing path aliases
      if (importPath.startsWith('@/core')) return 'core';
      if (importPath.startsWith('@/hooks')) return 'hooks';
      if (importPath.startsWith('@/components')) return 'components';
      if (importPath.startsWith('@/adapters')) return 'adapters';
      if (importPath.startsWith('@/demo')) return 'demo';
      if (importPath.startsWith('@/utils')) return 'utils';
      return null;
    }

    // Normalize the current file path to use forward slashes
    const normalizedCurrentFile = currentFilePath.replace(/\\/g, '/');

    // Resolve the relative path to an absolute path
    const currentDir = path.dirname(normalizedCurrentFile);
    const resolvedPath = path.resolve(currentDir, importPath);

    // Normalize the resolved path to use forward slashes
    const normalizedPath = resolvedPath.replace(/\\/g, '/');

    // Check which layer directory the resolved path contains
    if (normalizedPath.includes('/src/core/')) return 'core';
    if (normalizedPath.includes('/src/hooks/')) return 'hooks';
    if (normalizedPath.includes('/src/components/')) return 'components';
    if (normalizedPath.includes('/src/adapters/')) return 'adapters';
    if (normalizedPath.includes('/src/demo/')) return 'demo';
    if (normalizedPath.includes('/src/utils/')) return 'utils';

    return null;
  }

  /**
   * Check if a relative import should be preserved (same-directory import)
   */
  isSameDirectoryImport(importPath: string, currentFilePath: string): boolean {
    // Only check relative imports
    if (!this.isRelativeImport(importPath)) {
      return false;
    }

    // Normalize the current file path to use forward slashes
    const normalizedCurrentFile = currentFilePath.replace(/\\/g, '/');

    // Resolve both paths
    const currentDir = path.dirname(normalizedCurrentFile);
    const resolvedImportPath = path.resolve(currentDir, importPath);
    const importDir = path.dirname(resolvedImportPath);

    // Normalize paths to use forward slashes for consistent comparison
    const normalizedCurrentDir = currentDir.replace(/\\/g, '/');
    const normalizedImportDir = importDir.replace(/\\/g, '/');

    // Check if they're in the same directory
    return normalizedCurrentDir === normalizedImportDir;
  }

  /**
   * Check if an import is a CSS module that should be preserved
   */
  isCSSModuleImport(importPath: string): boolean {
    return importPath.endsWith('.css') || importPath.endsWith('.module.css');
  }

  /**
   * Check if an import should be preserved as relative
   */
  shouldPreserveRelative(importPath: string, currentFilePath: string): boolean {
    // Preserve CSS module imports
    if (this.isCSSModuleImport(importPath)) {
      return true;
    }

    // Preserve same-directory imports
    if (this.isSameDirectoryImport(importPath, currentFilePath)) {
      return true;
    }

    return false;
  }
}

/**
 * Extract the import path from an import statement
 * @param importStatement - The full import statement
 * @returns The import path, or null if not found
 */
export function extractImportPath(importStatement: string): string | null {
  const match = importStatement.match(SINGLE_IMPORT_REGEX);
  return match ? match[1] : null;
}

/**
 * Create a new import matcher instance
 */
export function createImportMatcher(): ImportMatcher {
  return new DefaultImportMatcher();
}
