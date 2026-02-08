/**
 * File Discovery Module
 *
 * Discovers all TypeScript/TSX files to process during migration.
 * Implements recursive directory traversal with filtering and exclusion patterns.
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Options for file discovery
 */
export interface FileDiscoveryOptions {
  /** Directories to search (e.g., ['src', 'tests']) */
  sourceDirs: string[];

  /** File extensions to include (e.g., ['.ts', '.tsx']) */
  extensions: string[];

  /** Patterns for files to exclude (e.g., ['*.config.ts', '*.d.ts']) */
  excludePatterns: string[];

  /** Base directory for resolving relative paths (defaults to process.cwd()) */
  baseDir?: string;
}

/**
 * File discovery service
 */
export class FileDiscovery {
  private readonly options: FileDiscoveryOptions;
  private readonly baseDir: string;

  constructor(options: FileDiscoveryOptions) {
    this.options = options;
    this.baseDir = options.baseDir || process.cwd();
  }

  /**
   * Discover all files matching the criteria
   * @returns Array of absolute file paths
   */
  discoverFiles(): string[] {
    const files: string[] = [];

    for (const sourceDir of this.options.sourceDirs) {
      const absoluteDir = path.resolve(this.baseDir, sourceDir);

      if (!fs.existsSync(absoluteDir)) {
        continue;
      }

      const dirFiles = this.traverseDirectory(absoluteDir);
      files.push(...dirFiles);
    }

    return files;
  }

  /**
   * Recursively traverse a directory and collect matching files
   * @param dirPath Absolute path to directory
   * @returns Array of absolute file paths
   */
  private traverseDirectory(dirPath: string): string[] {
    const files: string[] = [];

    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          // Recursively traverse subdirectories
          const subFiles = this.traverseDirectory(fullPath);
          files.push(...subFiles);
        } else if (entry.isFile()) {
          // Check if file matches criteria
          if (this.shouldIncludeFile(fullPath)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      // Silently skip directories that can't be read
      // This handles permission errors and other file system issues
    }

    return files;
  }

  /**
   * Check if a file should be included based on extension and exclusion patterns
   * @param filePath Absolute path to file
   * @returns True if file should be included
   */
  private shouldIncludeFile(filePath: string): boolean {
    // Check extension
    const ext = path.extname(filePath);
    if (!this.options.extensions.includes(ext)) {
      return false;
    }

    // Check exclusion patterns
    const fileName = path.basename(filePath);
    for (const pattern of this.options.excludePatterns) {
      if (this.matchesPattern(fileName, pattern)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if a filename matches a glob-style pattern
   * @param fileName File name to check
   * @param pattern Glob pattern (supports * wildcard)
   * @returns True if filename matches pattern
   */
  private matchesPattern(fileName: string, pattern: string): boolean {
    // Convert glob pattern to regex
    // * matches any characters except /
    const regexPattern = pattern
      .replace(/\./g, '\\.')  // Escape dots
      .replace(/\*/g, '.*');  // Convert * to .*

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(fileName);
  }
}

/**
 * Convenience function to discover files with default options
 * @param sourceDirs Directories to search
 * @param extensions File extensions to include
 * @param excludePatterns Patterns for files to exclude
 * @returns Array of absolute file paths
 */
export function discoverFiles(
  sourceDirs: string[],
  extensions: string[] = ['.ts', '.tsx'],
  excludePatterns: string[] = ['*.config.ts', '*.d.ts']
): string[] {
  const discovery = new FileDiscovery({
    sourceDirs,
    extensions,
    excludePatterns,
  });

  return discovery.discoverFiles();
}
