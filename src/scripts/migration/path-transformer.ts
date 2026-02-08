/**
 * Path Transformer Module
 *
 * Provides functionality to:
 * - Convert relative imports to path alias imports
 * - Resolve relative paths to absolute paths using Node.js path module
 * - Detect layer directories in resolved paths
 * - Construct path aliases for each layer (@/core/*, @/hooks/*, etc.)
 * - Handle barrel exports (remove '/index' suffix)
 *
 * Requirements: 1.1, 2.1, 2.2, 3.1, 4.1, 5.1, 6.1
 */

import * as path from 'path';
import type { Layer } from './types.js';

/**
 * Mapping of layers to their path aliases
 */
const LAYER_ALIAS_MAP: Record<Layer, string> = {
  core: '@/core',
  hooks: '@/hooks',
  components: '@/components',
  adapters: '@/adapters',
  demo: '@/demo',
  utils: '@/utils',
};

/**
 * Mapping of layers to their source directory paths
 */
const LAYER_DIR_MAP: Record<Layer, string> = {
  core: '/src/core/',
  hooks: '/src/hooks/',
  components: '/src/components/',
  adapters: '/src/adapters/',
  demo: '/src/demo/',
  utils: '/src/utils/',
};

/**
 * Interface for path transformer functionality
 */
export interface PathTransformer {
  /**
   * Transform a relative import to a path alias import
   * @param importPath - The relative import path
   * @param currentFilePath - The path of the file containing the import
   * @returns The transformed path alias, or null if transformation is not applicable
   */
  transformToAlias(importPath: string, currentFilePath: string): string | null;

  /**
   * Extract the path segment after the layer directory
   * @param resolvedPath - The absolute resolved path
   * @param layer - The target layer
   * @returns The path segment after the layer directory
   */
  extractLayerPath(resolvedPath: string, layer: Layer): string;

  /**
   * Resolve a relative import path to an absolute path
   * @param importPath - The relative import path
   * @param currentFilePath - The path of the file containing the import
   * @returns The resolved absolute path
   */
  resolveImportPath(importPath: string, currentFilePath: string): string;

  /**
   * Detect the layer from a resolved absolute path
   * @param resolvedPath - The absolute resolved path
   * @returns The detected layer, or null if not a layer path
   */
  detectLayer(resolvedPath: string): Layer | null;

  /**
   * Remove '/index' suffix from a path if present
   * @param importPath - The import path
   * @returns The path without '/index' suffix
   */
  removeIndexSuffix(importPath: string): string;
}

/**
 * Default implementation of PathTransformer
 */
export class DefaultPathTransformer implements PathTransformer {
  /**
   * Transform a relative import to a path alias import
   */
  transformToAlias(importPath: string, currentFilePath: string): string | null {
    // Only transform relative imports
    if (!importPath.startsWith('./') && !importPath.startsWith('../')) {
      return null;
    }

    // Resolve the relative path to an absolute path
    const resolvedPath = this.resolveImportPath(importPath, currentFilePath);

    // Detect the target layer
    const layer = this.detectLayer(resolvedPath);
    if (!layer) {
      return null;
    }

    // Extract the path segment after the layer directory
    const layerPath = this.extractLayerPath(resolvedPath, layer);

    // Construct the path alias
    const alias = LAYER_ALIAS_MAP[layer];
    let transformedPath = layerPath ? `${alias}/${layerPath}` : alias;

    // Remove '/index' suffix for barrel exports
    transformedPath = this.removeIndexSuffix(transformedPath);

    return transformedPath;
  }

  /**
   * Extract the path segment after the layer directory
   */
  extractLayerPath(resolvedPath: string, layer: Layer): string {
    // Normalize path to use forward slashes
    const normalizedPath = resolvedPath.replace(/\\/g, '/');

    // Get the layer directory pattern
    const layerDir = LAYER_DIR_MAP[layer];

    // Find the index of the layer directory in the path
    const layerIndex = normalizedPath.indexOf(layerDir);
    if (layerIndex === -1) {
      return '';
    }

    // Extract everything after the layer directory
    const afterLayer = normalizedPath.substring(layerIndex + layerDir.length);

    // Remove file extension if present
    const withoutExtension = afterLayer.replace(/\.(ts|tsx|js|jsx)$/, '');

    return withoutExtension;
  }

  /**
   * Resolve a relative import path to an absolute path
   */
  resolveImportPath(importPath: string, currentFilePath: string): string {
    // Normalize the current file path to use forward slashes
    const normalizedCurrentFile = currentFilePath.replace(/\\/g, '/');

    // Get the directory of the current file
    const currentDir = path.dirname(normalizedCurrentFile);

    // Resolve the relative path to an absolute path
    const resolvedPath = path.resolve(currentDir, importPath);

    // Normalize the resolved path to use forward slashes
    return resolvedPath.replace(/\\/g, '/');
  }

  /**
   * Detect the layer from a resolved absolute path
   */
  detectLayer(resolvedPath: string): Layer | null {
    // Normalize path to use forward slashes
    const normalizedPath = resolvedPath.replace(/\\/g, '/');

    // Check which layer directory the path contains
    // Check in order of specificity (more specific first)
    if (normalizedPath.includes('/src/components/')) return 'components';
    if (normalizedPath.includes('/src/adapters/')) return 'adapters';
    if (normalizedPath.includes('/src/hooks/')) return 'hooks';
    if (normalizedPath.includes('/src/demo/')) return 'demo';
    if (normalizedPath.includes('/src/utils/')) return 'utils';
    if (normalizedPath.includes('/src/core/')) return 'core';

    return null;
  }

  /**
   * Remove '/index' suffix from a path if present
   */
  removeIndexSuffix(importPath: string): string {
    // Remove '/index' at the end of the path
    if (importPath.endsWith('/index')) {
      return importPath.substring(0, importPath.length - '/index'.length);
    }

    return importPath;
  }
}

/**
 * Create a new path transformer instance
 */
export function createPathTransformer(): PathTransformer {
  return new DefaultPathTransformer();
}

/**
 * Transform an import statement by replacing the import path
 * @param importStatement - The full import statement
 * @param oldPath - The old import path to replace
 * @param newPath - The new import path
 * @returns The transformed import statement
 */
export function replaceImportPath(
  importStatement: string,
  oldPath: string,
  newPath: string
): string {
  // Replace the old path with the new path, preserving quotes
  return importStatement.replace(
    new RegExp(`(['"])${escapeRegExp(oldPath)}\\1`),
    `$1${newPath}$1`
  );
}

/**
 * Escape special regex characters in a string
 * @param str - The string to escape
 * @returns The escaped string
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
