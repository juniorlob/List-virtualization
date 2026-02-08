/**
 * Unit tests for the migration validator
 *
 * Note: These tests focus on the parsing logic rather than mocking execSync,
 * as the actual validation will be tested during integration testing.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MigrationValidator, createValidator } from '../../../src/scripts/migration/validator';

describe('MigrationValidator', () => {
  let validator: MigrationValidator;

  beforeEach(() => {
    validator = new MigrationValidator();
  });

  describe('parseCompilationErrors', () => {
    it('should parse TypeScript compilation errors in standard format', () => {
      const output = `
src/components/test.tsx(10,5): error TS2304: Cannot find name 'foo'.
src/hooks/use-test.ts(25,12): error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'.
      `.trim();

      // Access private method via any cast for testing
      const errors = (validator as any).parseCompilationErrors(output);

      expect(errors).toHaveLength(2);
      expect(errors[0]).toContain('src/components/test.tsx:10:5');
      expect(errors[0]).toContain('TS2304');
      expect(errors[0]).toContain('Cannot find name');
      expect(errors[1]).toContain('src/hooks/use-test.ts:25:12');
      expect(errors[1]).toContain('TS2345');
    });

    it('should handle empty output', () => {
      const errors = (validator as any).parseCompilationErrors('');
      expect(errors).toEqual([]);
    });

    it('should capture non-standard error lines containing "error" keyword', () => {
      const output = `
Some other error message that contains error keyword
Another error line
      `.trim();

      const errors = (validator as any).parseCompilationErrors(output);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('parseTestFailures', () => {
    it('should parse test failures in Vitest format', () => {
      const output = `
❌ should calculate visible range correctly
  Expected: 10
  Received: 5

❌ should handle edge cases
  AssertionError: Expected values to be equal
      `.trim();

      const failures = (validator as any).parseTestFailures(output);
      expect(failures.length).toBeGreaterThan(0);
    });

    it('should parse test failures in Jest format', () => {
      const output = `
● should transform imports correctly
  Error: Expected transformation to match
      `.trim();

      const failures = (validator as any).parseTestFailures(output);
      expect(failures.length).toBeGreaterThan(0);
    });

    it('should parse FAIL markers', () => {
      const output = `
FAIL tests/unit/calculator.test.ts
FAIL tests/integration/migration.test.ts
      `.trim();

      const failures = (validator as any).parseTestFailures(output);
      expect(failures.length).toBeGreaterThan(0);
      expect(failures.some((f: string) => f.includes('calculator.test.ts'))).toBe(true);
    });

    it('should include summary when no specific failures are parsed', () => {
      const output = 'Some test output without specific failure format';

      const failures = (validator as any).parseTestFailures(output);
      expect(failures).toContain('Test suite failed - see full output for details');
    });

    it('should handle empty output', () => {
      const failures = (validator as any).parseTestFailures('');
      expect(failures).toEqual([]);
    });
  });

  describe('createValidator', () => {
    it('should create a new validator instance', () => {
      const validator = createValidator();
      expect(validator).toBeInstanceOf(MigrationValidator);
    });
  });
});
