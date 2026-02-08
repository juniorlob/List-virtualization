#!/usr/bin/env node

/**
 * Migration Script: Migrate Relative Imports to Path Aliases
 *
 * This script systematically migrates all relative imports in the codebase
 * to use configured path aliases (@/core/*, @/hooks/*, @/components/*, etc.)
 *
 * Usage:
 *   npm run migrate-imports              # Run migration
 *   npm run migrate-imports -- --dry-run # Preview changes without modifying files
 *   npm run migrate-imports -- --verbose # Show detailed progress
 *   npm run migrate-imports -- --no-validation # Skip compilation and test validation
 *
 * Features:
 *   - Converts relative imports to path aliases
 *   - Preserves same-directory and CSS module imports
 *   - Organizes imports by architectural layer
 *   - Validates compilation and tests after migration
 *   - Generates comprehensive migration report
 */

import { MigrationCoordinator } from './migration/coordinator.js';
import type { MigrationConfig } from './migration/types.js';

/**
 * Parse command-line arguments
 *
 * Supported flags:
 * - --dry-run: Preview changes without modifying files
 * - --verbose: Show detailed progress during migration
 * - --no-validation: Skip TypeScript compilation and test validation
 *
 * @returns Parsed command-line options
 */
function parseArgs(): {
  dryRun: boolean;
  verbose: boolean;
  noValidation: boolean;
} {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes('--dry-run'),
    verbose: args.includes('--verbose'),
    noValidation: args.includes('--no-validation'),
  };
}

/**
 * Main migration execution
 */
async function main() {
  const { dryRun, verbose, noValidation } = parseArgs();

  console.log('🚀 Starting import migration to path aliases...\n');

  if (dryRun) {
    console.log('📋 DRY RUN MODE: No files will be modified\n');
  }

  // Configure migration
  const config: MigrationConfig = {
    sourceDirs: ['src', 'tests'],
    extensions: ['.ts', '.tsx'],
    excludePatterns: ['*.config.ts', '*.d.ts', 'vite-env.d.ts'],
    aliasMap: {
      core: '@/core',
      hooks: '@/hooks',
      components: '@/components',
      adapters: '@/adapters',
      demo: '@/demo',
      utils: '@/utils',
    },
    organizeImports: true,
    runValidation: !noValidation,
  };

  // Execute migration
  const coordinator = new MigrationCoordinator(config, { dryRun, verbose });
  const report = await coordinator.executeMigration();

  // Display results
  console.log('\n' + '='.repeat(60));
  console.log('📊 MIGRATION REPORT');
  console.log('='.repeat(60) + '\n');

  console.log(`Total files discovered: ${report.totalFiles}`);
  console.log(`Files processed: ${report.processedFiles}`);
  console.log(`Files transformed: ${report.transformedFiles}`);
  console.log(`Total import changes: ${report.totalChanges}\n`);

  if (report.errors.length > 0) {
    console.log('❌ ERRORS:\n');
    report.errors.forEach((error: string) => console.log(`  - ${error}`));
    console.log();
  }

  if (!noValidation) {
    console.log('🔍 VALIDATION RESULTS:\n');

    if (report.validationResult.compilationSuccess) {
      console.log('✅ TypeScript compilation: PASSED');
    } else {
      console.log('❌ TypeScript compilation: FAILED');
      if (report.validationResult.compilationErrors.length > 0) {
        console.log('\nCompilation errors:');
        report.validationResult.compilationErrors.forEach((error: string) => {
          console.log(`  ${error}`);
        });
      }
    }

    if (report.validationResult.testSuccess) {
      console.log('✅ Test suite: PASSED');
    } else {
      console.log('❌ Test suite: FAILED');
      if (report.validationResult.testFailures.length > 0) {
        console.log('\nTest failures:');
        report.validationResult.testFailures.forEach((failure: string) => {
          console.log(`  ${failure}`);
        });
      }
    }
  }

  console.log('\n' + '='.repeat(60));

  if (dryRun) {
    console.log('\n💡 This was a dry run. Run without --dry-run to apply changes.');
  } else if (report.errors.length === 0 &&
    (noValidation || (report.validationResult.compilationSuccess && report.validationResult.testSuccess))) {
    console.log('\n✨ Migration completed successfully!');
  } else {
    console.log('\n⚠️  Migration completed with issues. Please review the errors above.');
    process.exit(1);
  }
}

// Execute main function
main().catch((error) => {
  console.error('\n❌ Fatal error during migration:');
  console.error(error);
  process.exit(1);
});
