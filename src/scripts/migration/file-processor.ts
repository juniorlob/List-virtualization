/**
 * File Processor Module
 *
 * Provides functionality to:
 * - Read file content from disk
 * - Extract import statements from content
 * - Apply import transformations (relative to path alias)
 * - Apply import organization (group by layer)
 * - Reconstruct file content with transformed imports
 * - Track transformation statistics (changes count)
 *
 * Requirements: 1.3, 1.4
 */

import * as fs from 'fs';
import * as path from 'path';
import type { ProcessResult } from './types.js';
import { createImportMatcher, extractImportPath } from './import-matcher.js';
import { createPathTransformer, replaceImportPath } from './path-transformer.js';
import { organizeFileImports } from './import-organizer.js';

/**
 * Interface for file processor functionality
 */
export interface FileProcessor {
  /**
   * Process a single file, applying all transformations
   * @param filePath - Path to the file to process
   * @returns Result of processing including transformed content and statistics
   */
  processFile(filePath: string): ProcessResult;

  /**
   * Transform the content of a file by converting relative imports to path aliases
   * @param content - The file content to transform
   * @param filePath - The path of the file (needed for resolving relative imports)
   * @returns The transformed content
   */
  transformContent(content: string, filePath: string): string;

  /**
   * Read file content from disk
   * @param filePath - Path to the file to read
   * @returns The file content as a string
   */
  readFile(filePath: string): string;

  /**
   * Extract import statements from file content
   * @param content - The file content
   * @returns Array of import statement strings
   */
  extractImports(content: string): string[];

  /**
   * Apply import transformations to a list of import statements
   * @param imports - Array of import statements
   * @param filePath - The path of the file containing the imports
   * @returns Object with transformed imports and count of changes
   */
  applyTransformations(
    imports: string[],
    filePath: string
  ): { transformedImports: string[]; changesCount: number };

  /**
   * Reconstruct file content with new import statements
   * @param originalContent - The original file content
   * @param organizedImports - The organized import statements
   * @returns The reconstructed file content
   */
  reconstructContent(originalContent: string, organizedImports: string): string;
}

/**
 * Default implementation of FileProcessor
 */
export class DefaultFileProcessor implements FileProcessor {
  private readonly importMatcher = createImportMatcher();
  private readonly pathTransformer = createPathTransformer();

  /**
   * Process a single file, applying all transformations
   */
  processFile(filePath: string): ProcessResult {
    try {
      // Read file content
      const content = this.readFile(filePath);

      // Transform the content
      const transformedContent = this.transformContent(content, filePath);

      // Count the number of changes by comparing original and transformed
      const changesCount = this.countChanges(content, transformedContent);

      return {
        filePath,
        success: true,
        transformedContent,
        error: null,
        changesCount,
      };
    } catch (error) {
      return {
        filePath,
        success: false,
        transformedContent: null,
        error: error instanceof Error ? error.message : String(error),
        changesCount: 0,
      };
    }
  }

  /**
   * Transform the content of a file by converting relative imports to path aliases
   */
  transformContent(content: string, filePath: string): string {
    // Extract all import statements
    const imports = this.extractImports(content);

    // If no imports, return original content
    if (imports.length === 0) {
      return content;
    }

    // Apply transformations to imports
    const { transformedImports, changesCount } = this.applyTransformations(imports, filePath);

    // If no changes were made, return original content
    if (changesCount === 0) {
      return content;
    }

    // Replace original imports with transformed imports in the content
    let transformedContent = content;
    for (let i = 0; i < imports.length; i++) {
      const originalImport = imports[i];
      const transformedImport = transformedImports[i];

      // Only replace if the import actually changed
      if (originalImport !== transformedImport) {
        transformedContent = transformedContent.replace(originalImport, transformedImport);
      }
    }

    // Organize imports by layer
    const { organizedImports, restOfFile } = organizeFileImports(transformedContent);

    // Reconstruct the file with organized imports
    return this.reconstructContent(transformedContent, organizedImports);
  }

  /**
   * Read file content from disk
   */
  readFile(filePath: string): string {
    return fs.readFileSync(filePath, 'utf-8');
  }

  /**
   * Extract import statements from file content
   */
  extractImports(content: string): string[] {
    return this.importMatcher.extractImports(content);
  }

  /**
   * Apply import transformations to a list of import statements
   */
  applyTransformations(
    imports: string[],
    filePath: string
  ): { transformedImports: string[]; changesCount: number } {
    const transformedImports: string[] = [];
    let changesCount = 0;

    for (const importStatement of imports) {
      // Extract the import path from the statement
      const importPath = extractImportPath(importStatement);

      if (!importPath) {
        // If we can't extract the path, keep the original
        transformedImports.push(importStatement);
        continue;
      }

      // Check if this import should be preserved as relative
      if (this.importMatcher.shouldPreserveRelative(importPath, filePath)) {
        transformedImports.push(importStatement);
        continue;
      }

      // Try to transform the import path to a path alias
      const transformedPath = this.pathTransformer.transformToAlias(importPath, filePath);

      if (transformedPath && transformedPath !== importPath) {
        // Replace the import path in the statement
        const transformedStatement = replaceImportPath(
          importStatement,
          importPath,
          transformedPath
        );
        transformedImports.push(transformedStatement);
        changesCount++;
      } else {
        // No transformation needed, keep original
        transformedImports.push(importStatement);
      }
    }

    return { transformedImports, changesCount };
  }

  /**
   * Reconstruct file content with new import statements
   */
  reconstructContent(originalContent: string, organizedImports: string): string {
    const lines = originalContent.split('\n');
    const nonImportLines: string[] = [];
    let foundFirstImport = false;
    let foundLastImport = false;

    // Find where imports end and the rest of the code begins
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Check if this is an import line
      if (line.startsWith('import ')) {
        foundFirstImport = true;
        continue; // Skip import lines, we'll replace them with organized imports
      }

      // If we've found imports and this is not an import, we're past the import section
      if (foundFirstImport && !line.startsWith('import ')) {
        foundLastImport = true;
      }

      // Collect non-import lines
      if (foundLastImport) {
        nonImportLines.push(lines[i]);
      } else if (!foundFirstImport) {
        // Lines before any imports (comments, blank lines, etc.)
        nonImportLines.push(lines[i]);
      }
    }

    // If no imports were found, return original content
    if (!foundFirstImport) {
      return originalContent;
    }

    // Reconstruct the file
    const beforeImports: string[] = [];
    const afterImports: string[] = [];
    let inImportSection = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.startsWith('import ')) {
        inImportSection = true;
        continue;
      }

      if (!inImportSection) {
        beforeImports.push(lines[i]);
      } else {
        afterImports.push(lines[i]);
      }
    }

    // Build the final content
    const parts: string[] = [];

    // Add content before imports (if any)
    if (beforeImports.length > 0) {
      const beforeContent = beforeImports.join('\n').trim();
      if (beforeContent) {
        parts.push(beforeContent);
      }
    }

    // Add organized imports
    if (organizedImports) {
      parts.push(organizedImports);
    }

    // Add content after imports
    if (afterImports.length > 0) {
      const afterContent = afterImports.join('\n').trimStart();
      if (afterContent) {
        parts.push(afterContent);
      }
    }

    return parts.join('\n\n');
  }

  /**
   * Count the number of changes between original and transformed content
   */
  private countChanges(original: string, transformed: string): number {
    const originalImports = this.extractImports(original);
    const transformedImports = this.extractImports(transformed);

    let changes = 0;
    for (let i = 0; i < originalImports.length; i++) {
      if (originalImports[i] !== transformedImports[i]) {
        changes++;
      }
    }

    return changes;
  }
}

/**
 * Create a new file processor instance
 */
export function createFileProcessor(): FileProcessor {
  return new DefaultFileProcessor();
}
