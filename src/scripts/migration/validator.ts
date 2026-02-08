/**
 * Validation module for migration results
 *
 * This module provides functionality to validate the migration by:
 * - Running TypeScript compilation checks
 * - Running the test suite
 * - Collecting and reporting errors
 */

import { execSync } from 'child_process';
import type { ValidationResult } from './types.js';

/**
 * Validates the migration results by running TypeScript compilation and tests
 */
export class MigrationValidator {
  /**
   * Runs full validation including compilation and tests
   */
  async validate(): Promise<ValidationResult> {
    const compilationResult = await this.validateCompilation();
    const testResult = await this.validateTests();

    return {
      compilationSuccess: compilationResult.success,
      compilationErrors: compilationResult.errors,
      testSuccess: testResult.success,
      testFailures: testResult.failures,
    };
  }

  /**
   * Validates TypeScript compilation using tsc --noEmit
   */
  async validateCompilation(): Promise<{ success: boolean; errors: string[] }> {
    try {
      // Run TypeScript compiler in check mode (no emit)
      execSync('npx tsc --noEmit', {
        encoding: 'utf-8',
        stdio: 'pipe',
      });

      return {
        success: true,
        errors: [],
      };
    } catch (error: any) {
      // TypeScript compilation failed - parse errors
      // When execSync throws, the error object has stdout/stderr as strings (when encoding is set)
      // or as Buffers (when encoding is not set)
      const output = error.stdout || error.stderr || error.message || '';
      const outputStr = typeof output === 'string' ? output : output.toString();
      const errors = this.parseCompilationErrors(outputStr);

      return {
        success: false,
        errors,
      };
    }
  }

  /**
   * Validates tests by running npm test
   */
  async validateTests(): Promise<{ success: boolean; failures: string[] }> {
    try {
      // Run test suite
      execSync('npm test', {
        encoding: 'utf-8',
        stdio: 'pipe',
      });

      return {
        success: true,
        failures: [],
      };
    } catch (error: any) {
      // Tests failed - parse failures
      const output = error.stdout || error.stderr || error.message || '';
      const outputStr = typeof output === 'string' ? output : output.toString();
      const failures = this.parseTestFailures(outputStr);

      return {
        success: false,
        failures,
      };
    }
  }

  /**
   * Parses TypeScript compilation errors from tsc output
   *
   * Expected format:
   * src/file.ts(10,5): error TS2304: Cannot find name 'foo'.
   */
  private parseCompilationErrors(output: string): string[] {
    const errors: string[] = [];
    const lines = output.split('\n');

    for (const line of lines) {
      // Match TypeScript error format: file(line,col): error TSxxxx: message
      const errorMatch = line.match(/^(.+?)\((\d+),(\d+)\): error (TS\d+): (.+)$/);

      if (errorMatch) {
        const [, filePath, lineNum, colNum, errorCode, message] = errorMatch;
        errors.push(`${filePath}:${lineNum}:${colNum} - ${errorCode}: ${message}`);
      } else if (line.trim() && line.includes('error')) {
        // Catch any other error lines that don't match the standard format
        errors.push(line.trim());
      }
    }

    return errors;
  }

  /**
   * Parses test failures from test runner output
   *
   * Handles various test runner formats (Vitest, Jest, etc.)
   */
  private parseTestFailures(output: string): string[] {
    const failures: string[] = [];
    const lines = output.split('\n');

    let currentTest: string | null = null;
    let inFailureBlock = false;

    for (const line of lines) {
      // Detect test failure headers
      // Vitest format: ❌ test name
      // Jest format: ● test name
      if (line.match(/^[\s]*[❌●✕✖]\s+(.+)$/)) {
        const match = line.match(/^[\s]*[❌●✕✖]\s+(.+)$/);
        if (match) {
          currentTest = match[1].trim();
          inFailureBlock = true;
        }
      }
      // Detect FAIL markers
      else if (line.match(/^\s*FAIL\s+(.+)$/)) {
        const match = line.match(/^\s*FAIL\s+(.+)$/);
        if (match) {
          failures.push(`FAIL: ${match[1].trim()}`);
        }
      }
      // Collect error messages in failure blocks
      else if (inFailureBlock && line.trim()) {
        if (currentTest && line.match(/^\s*(Error|Expected|Received|AssertionError)/)) {
          failures.push(`${currentTest}: ${line.trim()}`);
          inFailureBlock = false;
          currentTest = null;
        }
      }
      // Detect summary lines with failure counts
      else if (line.match(/(\d+)\s+(failed|failing)/i)) {
        failures.push(line.trim());
      }
    }

    // If no specific failures were parsed but there was output, include a summary
    if (failures.length === 0 && output.trim()) {
      failures.push('Test suite failed - see full output for details');
    }

    return failures;
  }

  /**
   * Validates only TypeScript compilation (useful for quick checks)
   */
  async validateCompilationOnly(): Promise<ValidationResult> {
    const compilationResult = await this.validateCompilation();

    return {
      compilationSuccess: compilationResult.success,
      compilationErrors: compilationResult.errors,
      testSuccess: true, // Not tested
      testFailures: [],
    };
  }

  /**
   * Validates only tests (useful when compilation is known to be good)
   */
  async validateTestsOnly(): Promise<ValidationResult> {
    const testResult = await this.validateTests();

    return {
      compilationSuccess: true, // Not tested
      compilationErrors: [],
      testSuccess: testResult.success,
      testFailures: testResult.failures,
    };
  }
}

/**
 * Creates a new migration validator instance
 */
export function createValidator(): MigrationValidator {
  return new MigrationValidator();
}
