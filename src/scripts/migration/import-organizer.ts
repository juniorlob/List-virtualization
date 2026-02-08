/**
 * Import Organizer Module
 *
 * Provides functionality to:
 * - Classify imports into groups (external, core, hooks, components, adapters, utils, types, styles)
 * - Order import groups according to architectural layers
 * - Insert blank lines between import groups
 * - Preserve original import statement formatting
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9
 */

import type { ImportGroup, ImportStatement } from './types.js';

/**
 * Interface for import organizer functionality
 */
export interface ImportOrganizer {
  /**
   * Organize imports into groups with blank lines between them
   * @param imports - Array of import statement strings
   * @returns Organized import statements as a single string with blank lines
   */
  organizeImports(imports: string[]): string;

  /**
   * Classify an import statement into its group
   * @param importStatement - The import statement string
   * @returns The import group classification
   */
  classifyImport(importStatement: string): ImportGroup;

  /**
   * Extract the import source path from an import statement
   * @param importStatement - The import statement string
   * @returns The import source path, or null if not found
   */
  extractImportSource(importStatement: string): string | null;

  /**
   * Check if an import statement is a type-only import
   * @param importStatement - The import statement string
   * @returns true if it's a type-only import
   */
  isTypeOnlyImport(importStatement: string): boolean;
}

/**
 * Default implementation of ImportOrganizer
 */
export class DefaultImportOrganizer implements ImportOrganizer {
  /**
   * Order of import groups (defines the organization structure)
   */
  private readonly groupOrder: ImportGroup[] = [
    'external',
    'core',
    'hooks',
    'components',
    'adapters',
    'utils',
    'types',
    'styles',
  ];

  /**
   * Organize imports into groups with blank lines between them
   */
  organizeImports(imports: string[]): string {
    // Group imports by their classification
    const groups = new Map<ImportGroup, string[]>();

    // Initialize all groups as empty arrays
    for (const group of this.groupOrder) {
      groups.set(group, []);
    }

    // Classify and group each import
    for (const importStatement of imports) {
      const group = this.classifyImport(importStatement);
      groups.get(group)?.push(importStatement);
    }

    // Build the organized output with blank lines between non-empty groups
    const organizedSections: string[] = [];

    for (const group of this.groupOrder) {
      const groupImports = groups.get(group) || [];
      if (groupImports.length > 0) {
        // Join imports in this group (each on its own line)
        organizedSections.push(groupImports.join('\n'));
      }
    }

    // Join sections with blank lines between them
    return organizedSections.join('\n\n');
  }

  /**
   * Classify an import statement into its group
   */
  classifyImport(importStatement: string): ImportGroup {
    const source = this.extractImportSource(importStatement);

    if (!source) {
      // If we can't extract the source, treat it as external
      return 'external';
    }

    // Check for CSS/style imports
    if (source.endsWith('.css') || source.endsWith('.module.css')) {
      return 'styles';
    }

    // Check for type-only imports (but not if they're also path aliases)
    // Type-only imports that use path aliases should be grouped with their layer
    const isTypeOnly = this.isTypeOnlyImport(importStatement);

    // Check for path alias imports (layer imports)
    if (source.startsWith('@/core')) {
      return isTypeOnly ? 'types' : 'core';
    }
    if (source.startsWith('@/hooks')) {
      return isTypeOnly ? 'types' : 'hooks';
    }
    if (source.startsWith('@/components')) {
      return isTypeOnly ? 'types' : 'components';
    }
    if (source.startsWith('@/adapters')) {
      return isTypeOnly ? 'types' : 'adapters';
    }
    if (source.startsWith('@/utils')) {
      return isTypeOnly ? 'types' : 'utils';
    }
    if (source.startsWith('@/demo')) {
      // Demo imports are treated as external since they're not part of the library
      return 'external';
    }

    // Check for relative imports
    if (source.startsWith('./') || source.startsWith('../')) {
      // Relative imports could be same-directory or CSS modules
      // CSS modules are already handled above
      // Same-directory imports are treated as external (they stay with the file)
      return 'external';
    }

    // Check for type-only imports from external packages
    if (isTypeOnly) {
      return 'types';
    }

    // Everything else is external (npm packages, node modules, etc.)
    return 'external';
  }

  /**
   * Extract the import source path from an import statement
   */
  extractImportSource(importStatement: string): string | null {
    // Match the source path in single or double quotes (with "from" clause)
    const match = importStatement.match(/from\s+['"]([^'"]+)['"]/);
    if (match) {
      return match[1];
    }

    // Try to match import('...') dynamic imports
    const dynamicMatch = importStatement.match(/import\s*\(\s*['"]([^'"]+)['"]\s*\)/);
    if (dynamicMatch) {
      return dynamicMatch[1];
    }

    // Try to match side-effect imports (e.g., import './styles.css')
    const sideEffectMatch = importStatement.match(/^import\s+['"]([^'"]+)['"]/);
    if (sideEffectMatch) {
      return sideEffectMatch[1];
    }

    return null;
  }

  /**
   * Check if an import statement is a type-only import
   */
  isTypeOnlyImport(importStatement: string): boolean {
    // Match "import type" at the start of the statement
    return /^import\s+type\s+/.test(importStatement.trim());
  }
}

/**
 * Create a new import organizer instance
 */
export function createImportOrganizer(): ImportOrganizer {
  return new DefaultImportOrganizer();
}

/**
 * Helper function to organize imports in a file content
 * Extracts imports, organizes them, and returns the organized import section
 * @param fileContent - The complete file content
 * @returns Object with organized imports and the rest of the file content
 */
export function organizeFileImports(fileContent: string): {
  organizedImports: string;
  restOfFile: string;
} {
  const lines = fileContent.split('\n');
  const imports: string[] = [];
  let firstNonImportLine = 0;

  // Extract all import statements from the beginning of the file
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines and comments at the start
    if (line === '' || line.startsWith('//') || line.startsWith('/*') || line.startsWith('*')) {
      continue;
    }

    // Check if this line is an import statement
    if (line.startsWith('import ')) {
      imports.push(line);
    } else if (imports.length > 0) {
      // We've found the first non-import line after imports
      firstNonImportLine = i;
      break;
    }
  }

  // If no imports were found, return the original content
  if (imports.length === 0) {
    return {
      organizedImports: '',
      restOfFile: fileContent,
    };
  }

  // Organize the imports
  const organizer = createImportOrganizer();
  const organizedImports = organizer.organizeImports(imports);

  // Get the rest of the file (everything after imports)
  const restOfFile = lines.slice(firstNonImportLine).join('\n');

  return {
    organizedImports,
    restOfFile,
  };
}
