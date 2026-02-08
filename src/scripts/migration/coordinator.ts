/**
 * Migration Coordinator
 *
 * Orchestrates the complete migration process:
 * - File discovery
 * - File processing
 * - Progress tracking
 * - Error collection
 * - Validation
 */

import * as fs from 'fs';
import { FileDiscovery } from './file-discovery.js';
import { createFileProcessor } from './file-processor.js';
import { createValidator } from './validator.js';
import type {
  MigrationConfig,
  MigrationOptions,
  MigrationReport,
  ValidationResult,
  ProcessResult,
} from './types.js';

/**
 * Coordinates the entire migration process
 */
export class MigrationCoordinator {
  private readonly config: MigrationConfig;
  private readonly options: MigrationOptions;

  constructor(config: MigrationConfig, options: MigrationOptions) {
    this.config = config;
    this.options = options;
  }

  /**
   * Execute the complete migration pipeline
   */
  async executeMigration(): Promise<MigrationReport> {
    // Initialize report
    const report: MigrationReport = {
      totalFiles: 0,
      processedFiles: 0,
      transformedFiles: 0,
      totalChanges: 0,
      errors: [],
      validationResult: {
        compilationSuccess: true,
        compilationErrors: [],
        testSuccess: true,
        testFailures: [],
      },
    };

    try {
      // Step 1: Discover files
      if (this.options.verbose) {
        console.log('🔍 Discovering files...');
      }

      const files = this.discoverFiles();
      report.totalFiles = files.length;

      if (this.options.verbose) {
        console.log(`✅ Discovered ${files.length} files`);
      }

      if (files.length === 0) {
        if (this.options.verbose) {
          console.log('⚠️  No files to process');
        }
        return report;
      }

      // Step 2: Process files
      if (this.options.verbose) {
        console.log('🔄 Processing files...');
      }

      const processResults = this.processFiles(files);

      // Step 3: Collect statistics and errors
      this.collectStatistics(processResults, report);

      if (this.options.verbose) {
        console.log(`✅ Processed ${report.processedFiles}/${report.totalFiles} files`);
        console.log(`📝 Transformed ${report.transformedFiles} files with ${report.totalChanges} changes`);

        if (report.errors.length > 0) {
          console.log(`⚠️  Encountered ${report.errors.length} errors`);
        }
      }

      // Step 4: Write transformed files (if not dry-run)
      if (!this.options.dryRun) {
        if (this.options.verbose) {
          console.log('💾 Writing transformed files...');
        }

        this.writeTransformedFiles(processResults);

        if (this.options.verbose) {
          console.log('✅ Files written successfully');
        }
      } else {
        if (this.options.verbose) {
          console.log('🔍 Dry-run mode: No files were modified');
        }
      }

      // Step 5: Validate migration (if enabled and not dry-run)
      if (this.config.runValidation && !this.options.dryRun) {
        if (this.options.verbose) {
          console.log('🧪 Validating migration...');
        }

        report.validationResult = await this.validateMigration();

        if (this.options.verbose) {
          if (report.validationResult.compilationSuccess) {
            console.log('✅ TypeScript compilation passed');
          } else {
            console.log(`❌ TypeScript compilation failed with ${report.validationResult.compilationErrors.length} errors`);
          }

          if (report.validationResult.testSuccess) {
            console.log('✅ Test suite passed');
          } else {
            console.log(`❌ Test suite failed with ${report.validationResult.testFailures.length} failures`);
          }
        }
      }

      // Step 6: Generate summary
      if (this.options.verbose) {
        this.printSummary(report);
      }

      return report;
    } catch (error) {
      // Handle unexpected errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      report.errors.push(`Fatal error: ${errorMessage}`);

      if (this.options.verbose) {
        console.error('❌ Migration failed:', errorMessage);
      }

      return report;
    }
  }

  /**
   * Discover all files to process
   */
  private discoverFiles(): string[] {
    const discovery = new FileDiscovery({
      sourceDirs: this.config.sourceDirs,
      extensions: this.config.extensions,
      excludePatterns: this.config.excludePatterns,
    });

    return discovery.discoverFiles();
  }

  /**
   * Process all discovered files
   */
  private processFiles(files: string[]): ProcessResult[] {
    const processor = createFileProcessor();
    const results: ProcessResult[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (this.options.verbose) {
        // Show progress every 10 files or for the last file
        if ((i + 1) % 10 === 0 || i === files.length - 1) {
          console.log(`  Processing ${i + 1}/${files.length} files...`);
        }
      }

      try {
        const result = processor.processFile(file);
        results.push(result);
      } catch (error) {
        // Handle processing errors
        const errorMessage = error instanceof Error ? error.message : String(error);
        results.push({
          filePath: file,
          success: false,
          transformedContent: null,
          error: errorMessage,
          changesCount: 0,
        });
      }
    }

    return results;
  }

  /**
   * Collect statistics and errors from process results
   */
  private collectStatistics(results: ProcessResult[], report: MigrationReport): void {
    for (const result of results) {
      if (result.success) {
        report.processedFiles++;

        if (result.changesCount > 0) {
          report.transformedFiles++;
          report.totalChanges += result.changesCount;
        }
      } else {
        report.errors.push(`${result.filePath}: ${result.error}`);
      }
    }
  }

  /**
   * Write transformed files to disk
   */
  private writeTransformedFiles(results: ProcessResult[]): void {
    for (const result of results) {
      if (result.success && result.transformedContent !== null && result.changesCount > 0) {
        try {
          fs.writeFileSync(result.filePath, result.transformedContent, 'utf-8');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          throw new Error(`Failed to write file ${result.filePath}: ${errorMessage}`);
        }
      }
    }
  }

  /**
   * Validate migration results
   */
  private async validateMigration(): Promise<ValidationResult> {
    const validator = createValidator();
    return await validator.validate();
  }

  /**
   * Print migration summary
   */
  private printSummary(report: MigrationReport): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary');
    console.log('='.repeat(60));
    console.log(`Total files discovered:    ${report.totalFiles}`);
    console.log(`Files processed:           ${report.processedFiles}`);
    console.log(`Files transformed:         ${report.transformedFiles}`);
    console.log(`Total import changes:      ${report.totalChanges}`);
    console.log(`Errors encountered:        ${report.errors.length}`);

    if (report.errors.length > 0) {
      console.log('\n❌ Errors:');
      report.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    if (this.config.runValidation && !this.options.dryRun) {
      console.log('\n🧪 Validation Results:');
      console.log(`  TypeScript compilation: ${report.validationResult.compilationSuccess ? '✅ PASSED' : '❌ FAILED'}`);
      console.log(`  Test suite:             ${report.validationResult.testSuccess ? '✅ PASSED' : '❌ FAILED'}`);

      if (!report.validationResult.compilationSuccess) {
        console.log('\n  Compilation errors:');
        report.validationResult.compilationErrors.forEach((error, index) => {
          console.log(`    ${index + 1}. ${error}`);
        });
      }

      if (!report.validationResult.testSuccess) {
        console.log('\n  Test failures:');
        report.validationResult.testFailures.forEach((failure, index) => {
          console.log(`    ${index + 1}. ${failure}`);
        });
      }
    }

    console.log('='.repeat(60) + '\n');
  }
}

/**
 * Create a new migration coordinator instance
 */
export function createCoordinator(
  config: MigrationConfig,
  options: MigrationOptions
): MigrationCoordinator {
  return new MigrationCoordinator(config, options);
}
