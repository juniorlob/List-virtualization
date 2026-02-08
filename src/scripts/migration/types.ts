/**
 * Type definitions for the import migration system
 */

/**
 * Architectural layers in the codebase
 */
export type Layer = 'core' | 'hooks' | 'components' | 'adapters' | 'demo' | 'utils';

/**
 * Import statement groups for organization
 */
export type ImportGroup =
  | 'external'      // External dependencies (react, third-party)
  | 'core'          // @/core/* imports
  | 'hooks'         // @/hooks/* imports
  | 'components'    // @/components/* imports
  | 'adapters'      // @/adapters/* imports
  | 'utils'         // @/utils/* imports
  | 'types'         // Type-only imports
  | 'styles';       // CSS imports

/**
 * Parsed import statement
 */
export interface ImportStatement {
  /** The complete import statement as it appears in source */
  raw: string;

  /** The import source path (what comes after 'from') */
  source: string;

  /** Whether this is a type-only import */
  isTypeImport: boolean;

  /** The line number in the source file */
  lineNumber: number;

  /** Named imports (e.g., { foo, bar }) */
  namedImports: string[];

  /** Default import (e.g., React in "import React from 'react'") */
  defaultImport: string | null;

  /** Namespace import (e.g., * as foo) */
  namespaceImport: string | null;
}

/**
 * Result of processing a single file
 */
export interface ProcessResult {
  /** Path to the file that was processed */
  filePath: string;

  /** Whether processing was successful */
  success: boolean;

  /** Transformed file content (null if processing failed) */
  transformedContent: string | null;

  /** Error message if processing failed */
  error: string | null;

  /** Number of imports that were transformed */
  changesCount: number;
}

/**
 * Individual import transformation record
 */
export interface ImportTransformation {
  /** Original import statement */
  original: string;

  /** Transformed import statement */
  transformed: string;

  /** The layer this import targets */
  targetLayer: Layer;

  /** Line number where transformation occurred */
  lineNumber: number;
}

/**
 * Complete file transformation record
 */
export interface FileTransformation {
  /** Original file path */
  filePath: string;

  /** Original file content */
  originalContent: string;

  /** Transformed file content */
  transformedContent: string;

  /** List of transformations applied */
  transformations: ImportTransformation[];

  /** Whether the file was modified */
  wasModified: boolean;
}

/**
 * Validation results after migration
 */
export interface ValidationResult {
  /** Whether TypeScript compilation succeeded */
  compilationSuccess: boolean;

  /** Compilation error messages */
  compilationErrors: string[];

  /** Whether test suite passed */
  testSuccess: boolean;

  /** Test failure messages */
  testFailures: string[];
}

/**
 * Complete migration report
 */
export interface MigrationReport {
  /** Total number of files discovered */
  totalFiles: number;

  /** Number of files successfully processed */
  processedFiles: number;

  /** Number of files that were modified */
  transformedFiles: number;

  /** Total number of import changes made */
  totalChanges: number;

  /** List of errors encountered */
  errors: string[];

  /** Validation results */
  validationResult: ValidationResult;
}

/**
 * Migration configuration
 */
export interface MigrationConfig {
  /** Directories to process (e.g., ['src', 'tests']) */
  sourceDirs: string[];

  /** File extensions to process (e.g., ['.ts', '.tsx']) */
  extensions: string[];

  /** Glob patterns for files to exclude */
  excludePatterns: string[];

  /** Mapping of layers to path aliases */
  aliasMap: Record<Layer, string>;

  /** Whether to organize imports by layer */
  organizeImports: boolean;

  /** Whether to run validation after migration */
  runValidation: boolean;
}

/**
 * Migration execution options
 */
export interface MigrationOptions {
  /** Dry run mode - don't modify files */
  dryRun: boolean;

  /** Verbose output */
  verbose: boolean;
}
