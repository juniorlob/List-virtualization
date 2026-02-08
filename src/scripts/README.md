# Import Migration Scripts

This directory contains scripts for migrating relative imports to path aliases throughout the codebase.

## Overview

The migration utility systematically converts relative imports (e.g., `../../../core/calculator`) to path aliases (e.g., `@/core/calculator`) across all TypeScript and TSX files in the project.

## Usage

### Run Migration

```bash
# Execute migration (modifies files)
npm run migrate-imports

# Preview changes without modifying files
npm run migrate-imports:dry-run

# Show detailed progress
npm run migrate-imports:verbose

# Skip validation (faster, but less safe)
npm run migrate-imports -- --no-validation
```

### Command-Line Options

- `--dry-run`: Preview changes without modifying any files
- `--verbose`: Display detailed progress information
- `--no-validation`: Skip TypeScript compilation and test validation

## What Gets Migrated

The migration converts imports based on the target layer:

| Target Directory | Path Alias | Example |
|-----------------|------------|---------|
| `src/core/*` | `@/core/*` | `@/core/virtualization/calculator` |
| `src/hooks/*` | `@/hooks/*` | `@/hooks/use-virtualization` |
| `src/components/*` | `@/components/*` | `@/components/virtualized-list` |
| `src/adapters/*` | `@/adapters/*` | `@/adapters/performance-api/performance-monitor` |
| `src/demo/*` | `@/demo/*` | `@/demo/pages/unified-demo-page` |
| `src/utils/*` | `@/utils/*` | `@/utils/debounce` |

## What Gets Preserved

The migration preserves:

- **Same-directory imports**: Imports like `./types` or `./utils/helper` remain unchanged
- **CSS module imports**: Imports like `./component.module.css` remain unchanged
- **External dependencies**: Imports from `node_modules` remain unchanged

## Import Organization

After migration, imports are organized by layer with blank lines between groups:

1. External dependencies (React, third-party libraries)
2. Core layer (`@/core/*`)
3. Hooks layer (`@/hooks/*`)
4. Components layer (`@/components/*`)
5. Adapters layer (`@/adapters/*`)
6. Utils layer (`@/utils/*`)
7. Type-only imports
8. Style imports (CSS)

## Architecture

### Directory Structure

```
src/scripts/
├── migrate-imports.ts       # Main CLI script
├── migration/               # Migration modules
│   ├── coordinator.ts       # Orchestrates migration process
│   ├── types.ts            # Type definitions
│   └── index.ts            # Barrel exports
├── tsconfig.json           # TypeScript config for scripts
└── README.md               # This file
```

### Migration Pipeline

```
File Discovery → Import Analysis → Path Transformation → Import Organization → Validation
```

1. **File Discovery**: Find all `.ts` and `.tsx` files in `src/` and `tests/`
2. **Import Analysis**: Parse import statements and classify by target layer
3. **Path Transformation**: Replace relative paths with path aliases
4. **Import Organization**: Reorder imports by architectural layer
5. **Validation**: Verify TypeScript compilation and test execution

## Validation

After migration, the script automatically:

1. Runs TypeScript compilation (`tsc --noEmit`)
2. Runs the test suite (`npm test`)
3. Reports any errors or failures

This ensures the migration didn't introduce any breaking changes.

## Safety Features

- **Dry-run mode**: Preview all changes before applying them
- **Automatic validation**: Compilation and test checks after migration
- **Error reporting**: Detailed error messages for any issues
- **Idempotent**: Safe to run multiple times (won't double-convert)

## Implementation Status

This migration utility is being implemented in phases:

- [x] Task 1: Infrastructure setup (this directory and basic structure)
- [ ] Task 2: Import pattern matching
- [ ] Task 3: Path transformation logic
- [ ] Task 4: Import organization logic
- [ ] Task 5: File processing logic
- [ ] Task 6: File discovery logic
- [ ] Task 7: Migration coordinator
- [ ] Task 8: Validation logic
- [ ] Task 9: Full migration execution

## Development

### Running Tests

```bash
# Run all tests
npm test

# Run tests for migration modules
npm test -- src/scripts/migration
```

### Type Checking

```bash
# Check types for scripts
tsc -p src/scripts/tsconfig.json --noEmit
```

## Troubleshooting

### Migration Fails with Compilation Errors

If the migration completes but TypeScript compilation fails:

1. Review the compilation errors in the migration report
2. Check if any imports were incorrectly transformed
3. Manually fix the problematic imports
4. Run `npm run type-check` to verify

### Migration Fails with Test Failures

If tests fail after migration:

1. Review the test failures in the migration report
2. Check if any test imports were incorrectly transformed
3. Manually fix the problematic test imports
4. Run `npm test` to verify

### Need to Revert Changes

If you need to revert the migration:

1. Use git to restore the original files: `git checkout .`
2. Review what went wrong
3. Run migration again with `--dry-run` to preview changes
4. Report any issues or unexpected behavior

## Contributing

When adding new migration features:

1. Add types to `migration/types.ts`
2. Implement logic in appropriate module
3. Write unit tests for the new functionality
4. Write property-based tests for universal correctness
5. Update this README with new features
