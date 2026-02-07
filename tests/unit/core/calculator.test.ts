/**
 * Unit tests for VirtualizationCalculator.
 *
 * These tests verify the core calculation logic with specific examples
 * and edge cases. Property-based tests are in separate files.
 */

import { describe, it, expect } from 'vitest';
import { VirtualizationCalculator } from '../../../src/core/virtualization/calculator';

describe('VirtualizationCalculator', () => {
  let calculator: VirtualizationCalculator;

  beforeEach(() => {
    calculator = new VirtualizationCalculator();
  });

  describe('calculateVisibleRange', () => {
    it('calculates visible range correctly for typical scroll position', () => {
      // Scroll position: 500px
      // Container height: 600px
      // Item height: 50px
      // Overscan: 3
      //
      // First visible item: floor(500 / 50) = 10
      // Last visible item: floor((500 + 600 - 1) / 50) = floor(1099 / 50) = 21
      // With overscan: start = 10 - 3 = 7, end = 21 + 3 = 24
      const range = calculator.calculateVisibleRange(500, 600, 1000, 50, 3);

      expect(range.start).toBe(7);
      expect(range.end).toBe(24);
    });

    it('clamps start to 0 when overscan would go negative', () => {
      // At top of list, overscan shouldn't go below 0
      const range = calculator.calculateVisibleRange(0, 600, 1000, 50, 3);

      expect(range.start).toBe(0);
      expect(range.start).toBeGreaterThanOrEqual(0);
    });

    it('clamps end to itemCount - 1 when overscan exceeds list', () => {
      // Near bottom of list, overscan shouldn't exceed item count
      // Scroll to very bottom: scrollTop = (1000 - 12) * 50 = 49400
      // This ensures we're at the bottom where overscan would exceed
      const range = calculator.calculateVisibleRange(49400, 600, 1000, 50, 3);

      expect(range.end).toBe(999); // itemCount - 1
      expect(range.end).toBeLessThan(1000);
    });

    it('handles empty list (itemCount = 0)', () => {
      const range = calculator.calculateVisibleRange(0, 600, 0, 50, 3);

      expect(range.start).toBe(0);
      expect(range.end).toBe(-1);
    });

    it('handles single item list', () => {
      const range = calculator.calculateVisibleRange(0, 600, 1, 50, 3);

      expect(range.start).toBe(0);
      expect(range.end).toBe(0);
    });

    it('handles very small list with large overscan', () => {
      // List of 5 items with overscan of 10
      const range = calculator.calculateVisibleRange(0, 600, 5, 50, 10);

      expect(range.start).toBe(0);
      expect(range.end).toBe(4); // Clamped to itemCount - 1
    });

    it('handles negative scroll position (treats as 0)', () => {
      const range = calculator.calculateVisibleRange(-100, 600, 1000, 50, 3);

      expect(range.start).toBe(0);
      expect(range.end).toBeGreaterThanOrEqual(0);
    });

    it('handles NaN scroll position (uses default)', () => {
      const range = calculator.calculateVisibleRange(NaN, 600, 1000, 50, 3);

      expect(range.start).toBeGreaterThanOrEqual(0);
      expect(range.end).toBeGreaterThanOrEqual(range.start - 1);
    });

    it('handles Infinity scroll position (uses default)', () => {
      const range = calculator.calculateVisibleRange(Infinity, 600, 1000, 50, 3);

      expect(range.start).toBeGreaterThanOrEqual(0);
      expect(range.end).toBeLessThan(1000);
    });

    it('handles zero item height (uses default)', () => {
      const range = calculator.calculateVisibleRange(500, 600, 1000, 0, 3);

      // Should use default item height and calculate valid range
      expect(range.start).toBeGreaterThanOrEqual(0);
      expect(range.end).toBeLessThan(1000);
      expect(range.start).toBeLessThanOrEqual(range.end);
    });

    it('handles negative item height (uses default)', () => {
      const range = calculator.calculateVisibleRange(500, 600, 1000, -50, 3);

      // Should use default item height and calculate valid range
      expect(range.start).toBeGreaterThanOrEqual(0);
      expect(range.end).toBeLessThan(1000);
    });

    it('includes overscan items above viewport', () => {
      const rangeWithOverscan = calculator.calculateVisibleRange(500, 600, 1000, 50, 3);
      const rangeWithoutOverscan = calculator.calculateVisibleRange(500, 600, 1000, 50, 0);

      // With overscan should start earlier
      expect(rangeWithOverscan.start).toBeLessThan(rangeWithoutOverscan.start);
    });

    it('includes overscan items below viewport', () => {
      const rangeWithOverscan = calculator.calculateVisibleRange(500, 600, 1000, 50, 3);
      const rangeWithoutOverscan = calculator.calculateVisibleRange(500, 600, 1000, 50, 0);

      // With overscan should end later
      expect(rangeWithOverscan.end).toBeGreaterThan(rangeWithoutOverscan.end);
    });

    it('ensures start <= end + 1 (accounting for empty case)', () => {
      const range = calculator.calculateVisibleRange(500, 600, 1000, 50, 3);

      // For non-empty lists, start should be <= end
      // For empty lists, start = 0, end = -1 (so start = end + 1)
      expect(range.start).toBeLessThanOrEqual(range.end + 1);
    });
  });

  describe('calculateItemPosition', () => {
    it('calculates position correctly for first item', () => {
      const position = calculator.calculateItemPosition(0, 50);

      expect(position.top).toBe(0);
      expect(position.height).toBe(50);
    });

    it('calculates position correctly for middle item', () => {
      const position = calculator.calculateItemPosition(10, 50);

      expect(position.top).toBe(500); // 10 * 50
      expect(position.height).toBe(50);
    });

    it('calculates position correctly for large index', () => {
      const position = calculator.calculateItemPosition(999, 50);

      expect(position.top).toBe(49950); // 999 * 50
      expect(position.height).toBe(50);
    });

    it('handles negative index (treats as 0)', () => {
      const position = calculator.calculateItemPosition(-5, 50);

      expect(position.top).toBe(0);
      expect(position.height).toBe(50);
    });

    it('handles NaN index (uses default)', () => {
      const position = calculator.calculateItemPosition(NaN, 50);

      expect(position.top).toBeGreaterThanOrEqual(0);
      expect(position.height).toBe(50);
    });

    it('handles zero item height (uses default)', () => {
      const position = calculator.calculateItemPosition(10, 0);

      expect(position.top).toBeGreaterThanOrEqual(0);
      expect(position.height).toBeGreaterThan(0);
    });

    it('handles negative item height (uses default)', () => {
      const position = calculator.calculateItemPosition(10, -50);

      expect(position.top).toBeGreaterThanOrEqual(0);
      expect(position.height).toBeGreaterThan(0);
    });

    it('maintains consistent spacing between consecutive items', () => {
      const pos1 = calculator.calculateItemPosition(5, 50);
      const pos2 = calculator.calculateItemPosition(6, 50);

      expect(pos2.top - pos1.top).toBe(50);
    });

    it('handles different item heights', () => {
      const pos1 = calculator.calculateItemPosition(10, 30);
      const pos2 = calculator.calculateItemPosition(10, 100);

      expect(pos1.top).toBe(300); // 10 * 30
      expect(pos1.height).toBe(30);
      expect(pos2.top).toBe(1000); // 10 * 100
      expect(pos2.height).toBe(100);
    });
  });

  describe('calculateTotalHeight', () => {
    it('calculates total height correctly for typical list', () => {
      const totalHeight = calculator.calculateTotalHeight(1000, 50);

      expect(totalHeight).toBe(50000); // 1000 * 50
    });

    it('returns 0 for empty list', () => {
      const totalHeight = calculator.calculateTotalHeight(0, 50);

      expect(totalHeight).toBe(0);
    });

    it('handles single item', () => {
      const totalHeight = calculator.calculateTotalHeight(1, 50);

      expect(totalHeight).toBe(50);
    });

    it('handles large item count', () => {
      const totalHeight = calculator.calculateTotalHeight(100000, 50);

      expect(totalHeight).toBe(5000000); // 100000 * 50
    });

    it('handles zero item height (uses default)', () => {
      const totalHeight = calculator.calculateTotalHeight(1000, 0);

      expect(totalHeight).toBeGreaterThan(0);
    });

    it('handles negative item height (uses default)', () => {
      const totalHeight = calculator.calculateTotalHeight(1000, -50);

      expect(totalHeight).toBeGreaterThan(0);
    });

    it('handles NaN item count (uses default)', () => {
      const totalHeight = calculator.calculateTotalHeight(NaN, 50);

      expect(totalHeight).toBeGreaterThanOrEqual(0);
    });

    it('handles Infinity item count (clamps to max)', () => {
      const totalHeight = calculator.calculateTotalHeight(Infinity, 50);

      expect(totalHeight).toBeGreaterThanOrEqual(0);
      expect(totalHeight).toBeLessThan(Infinity);
    });

    it('handles different item heights', () => {
      const height1 = calculator.calculateTotalHeight(1000, 30);
      const height2 = calculator.calculateTotalHeight(1000, 100);

      expect(height1).toBe(30000); // 1000 * 30
      expect(height2).toBe(100000); // 1000 * 100
    });
  });

  describe('edge cases and error handling', () => {
    it('handles all invalid inputs without throwing', () => {
      expect(() => {
        calculator.calculateVisibleRange(NaN, NaN, NaN, NaN, NaN);
      }).not.toThrow();

      expect(() => {
        calculator.calculateItemPosition(NaN, NaN);
      }).not.toThrow();

      expect(() => {
        calculator.calculateTotalHeight(NaN, NaN);
      }).not.toThrow();
    });

    it('handles all Infinity inputs without throwing', () => {
      expect(() => {
        calculator.calculateVisibleRange(Infinity, Infinity, Infinity, Infinity, Infinity);
      }).not.toThrow();

      expect(() => {
        calculator.calculateItemPosition(Infinity, Infinity);
      }).not.toThrow();

      expect(() => {
        calculator.calculateTotalHeight(Infinity, Infinity);
      }).not.toThrow();
    });

    it('handles all negative inputs without throwing', () => {
      expect(() => {
        calculator.calculateVisibleRange(-100, -100, -100, -100, -100);
      }).not.toThrow();

      expect(() => {
        calculator.calculateItemPosition(-100, -100);
      }).not.toThrow();

      expect(() => {
        calculator.calculateTotalHeight(-100, -100);
      }).not.toThrow();
    });

    it('always returns valid VisibleRange structure', () => {
      const range = calculator.calculateVisibleRange(500, 600, 1000, 50, 3);

      expect(range).toHaveProperty('start');
      expect(range).toHaveProperty('end');
      expect(typeof range.start).toBe('number');
      expect(typeof range.end).toBe('number');
    });

    it('always returns valid ItemPosition structure', () => {
      const position = calculator.calculateItemPosition(10, 50);

      expect(position).toHaveProperty('top');
      expect(position).toHaveProperty('height');
      expect(typeof position.top).toBe('number');
      expect(typeof position.height).toBe('number');
    });

    it('always returns valid number for total height', () => {
      const totalHeight = calculator.calculateTotalHeight(1000, 50);

      expect(typeof totalHeight).toBe('number');
      expect(Number.isFinite(totalHeight)).toBe(true);
    });
  });
});
