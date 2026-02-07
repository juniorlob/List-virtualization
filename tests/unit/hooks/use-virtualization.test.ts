/**
 * Unit tests for useVirtualization hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVirtualization } from '../../../src/hooks/use-virtualization';
import type { VirtualizationOptions } from '../../../src/core/virtualization/types';

describe('useVirtualization', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Hook initialization', () => {
    it('should initialize with default values', () => {
      const options: VirtualizationOptions = {
        containerHeight: 600,
      };

      const { result } = renderHook(() =>
        useVirtualization(1000, 50, options)
      );

      expect(result.current.visibleRange).toEqual({ start: 0, end: 15 });
      expect(result.current.totalHeight).toBe(50000);
      expect(result.current.metrics).toEqual({
        fps: 0,
        memoryUsage: 0,
        domNodes: 0,
        renderTime: 0,
      });
      expect(result.current.onScroll).toBeInstanceOf(Function);
      expect(result.current.containerRef).toBeDefined();
    });

    it('should accept custom overscan value', () => {
      const options: VirtualizationOptions = {
        containerHeight: 600,
        overscan: 5,
      };

      const { result } = renderHook(() =>
        useVirtualization(1000, 50, options)
      );

      // With overscan 5: visible items 0-11 (12 items) + 5 above + 5 below = 0-17
      expect(result.current.visibleRange.start).toBe(0);
      expect(result.current.visibleRange.end).toBe(17);
    });

    it('should accept custom calculator via dependency injection', () => {
      const mockCalculator = {
        calculateVisibleRange: vi.fn(() => ({ start: 10, end: 20 })),
        calculateItemPosition: vi.fn(() => ({ top: 0, height: 50 })),
        calculateTotalHeight: vi.fn(() => 10000),
      };

      const options: VirtualizationOptions = {
        containerHeight: 600,
        calculator: mockCalculator,
      };

      const { result } = renderHook(() =>
        useVirtualization(1000, 50, options)
      );

      expect(result.current.visibleRange).toEqual({ start: 10, end: 20 });
      expect(result.current.totalHeight).toBe(10000);
      expect(mockCalculator.calculateVisibleRange).toHaveBeenCalled();
      expect(mockCalculator.calculateTotalHeight).toHaveBeenCalled();
    });
  });

  describe('Scroll handling', () => {
    it('should update visible range on scroll', () => {
      const options: VirtualizationOptions = {
        containerHeight: 600,
      };

      const { result } = renderHook(() =>
        useVirtualization(1000, 50, options)
      );

      const initialRange = result.current.visibleRange;

      // Simulate scroll event
      const mockEvent = {
        currentTarget: {
          scrollTop: 500,
        },
      } as React.UIEvent<HTMLDivElement>;

      act(() => {
        result.current.onScroll(mockEvent);
        vi.runAllTimers(); // Run requestAnimationFrame
      });

      // Range should update after scroll
      expect(result.current.visibleRange).not.toEqual(initialRange);
      expect(result.current.visibleRange.start).toBeGreaterThan(0);
    });

    it('should batch scroll updates with requestAnimationFrame', () => {
      const options: VirtualizationOptions = {
        containerHeight: 600,
      };

      const { result } = renderHook(() =>
        useVirtualization(1000, 50, options)
      );

      const rafSpy = vi.spyOn(window, 'requestAnimationFrame');

      // Simulate multiple rapid scroll events
      const mockEvent1 = {
        currentTarget: { scrollTop: 100 },
      } as React.UIEvent<HTMLDivElement>;

      const mockEvent2 = {
        currentTarget: { scrollTop: 200 },
      } as React.UIEvent<HTMLDivElement>;

      act(() => {
        result.current.onScroll(mockEvent1);
        result.current.onScroll(mockEvent2);
      });

      // Should call requestAnimationFrame for batching
      expect(rafSpy).toHaveBeenCalled();
    });

    it('should cancel pending animation frame on unmount', () => {
      const options: VirtualizationOptions = {
        containerHeight: 600,
      };

      const { result, unmount } = renderHook(() =>
        useVirtualization(1000, 50, options)
      );

      const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');

      // Trigger scroll to create pending frame
      const mockEvent = {
        currentTarget: { scrollTop: 100 },
      } as React.UIEvent<HTMLDivElement>;

      act(() => {
        result.current.onScroll(mockEvent);
      });

      // Unmount should cancel pending frame
      unmount();

      expect(cancelSpy).toHaveBeenCalled();
    });
  });

  describe('Memoization', () => {
    it('should memoize visible range calculation', () => {
      const mockCalculator = {
        calculateVisibleRange: vi.fn(() => ({ start: 0, end: 10 })),
        calculateItemPosition: vi.fn(() => ({ top: 0, height: 50 })),
        calculateTotalHeight: vi.fn(() => 50000),
      };

      const options: VirtualizationOptions = {
        containerHeight: 600,
        calculator: mockCalculator,
      };

      const { rerender } = renderHook(() =>
        useVirtualization(1000, 50, options)
      );

      const initialCallCount = mockCalculator.calculateVisibleRange.mock.calls.length;

      // Rerender without changing dependencies
      rerender();

      // Should not recalculate
      expect(mockCalculator.calculateVisibleRange.mock.calls.length).toBe(
        initialCallCount
      );
    });

    it('should recalculate when dependencies change', () => {
      const mockCalculator = {
        calculateVisibleRange: vi.fn(() => ({ start: 0, end: 10 })),
        calculateItemPosition: vi.fn(() => ({ top: 0, height: 50 })),
        calculateTotalHeight: vi.fn(() => 50000),
      };

      let itemCount = 1000;
      const options: VirtualizationOptions = {
        containerHeight: 600,
        calculator: mockCalculator,
      };

      const { rerender } = renderHook(() =>
        useVirtualization(itemCount, 50, options)
      );

      const initialCallCount = mockCalculator.calculateVisibleRange.mock.calls.length;

      // Change dependency
      itemCount = 2000;
      rerender();

      // Should recalculate
      expect(mockCalculator.calculateVisibleRange.mock.calls.length).toBeGreaterThan(
        initialCallCount
      );
    });

    it('should memoize total height calculation', () => {
      const mockCalculator = {
        calculateVisibleRange: vi.fn(() => ({ start: 0, end: 10 })),
        calculateItemPosition: vi.fn(() => ({ top: 0, height: 50 })),
        calculateTotalHeight: vi.fn(() => 50000),
      };

      const options: VirtualizationOptions = {
        containerHeight: 600,
        calculator: mockCalculator,
      };

      const { rerender } = renderHook(() =>
        useVirtualization(1000, 50, options)
      );

      const initialCallCount = mockCalculator.calculateTotalHeight.mock.calls.length;

      // Rerender without changing dependencies
      rerender();

      // Should not recalculate
      expect(mockCalculator.calculateTotalHeight.mock.calls.length).toBe(
        initialCallCount
      );
    });
  });

  describe('Performance monitoring integration', () => {
    it('should not start monitoring when disabled', () => {
      const options: VirtualizationOptions = {
        containerHeight: 600,
        enablePerformanceMonitoring: false,
      };

      const { result } = renderHook(() =>
        useVirtualization(1000, 50, options)
      );

      // Metrics should remain at initial values
      expect(result.current.metrics).toEqual({
        fps: 0,
        memoryUsage: 0,
        domNodes: 0,
        renderTime: 0,
      });
    });

    it('should start monitoring when enabled', () => {
      const options: VirtualizationOptions = {
        containerHeight: 600,
        enablePerformanceMonitoring: true,
      };

      const { result } = renderHook(() =>
        useVirtualization(1000, 50, options)
      );

      // Hook should initialize with monitoring enabled
      expect(result.current.metrics).toBeDefined();
    });

    it('should clean up performance monitor on unmount', () => {
      const options: VirtualizationOptions = {
        containerHeight: 600,
        enablePerformanceMonitoring: true,
      };

      const { unmount } = renderHook(() =>
        useVirtualization(1000, 50, options)
      );

      // Should not throw on unmount
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty list', () => {
      const options: VirtualizationOptions = {
        containerHeight: 600,
      };

      const { result } = renderHook(() =>
        useVirtualization(0, 50, options)
      );

      expect(result.current.visibleRange).toEqual({ start: 0, end: -1 });
      expect(result.current.totalHeight).toBe(0);
    });

    it('should handle single item list', () => {
      const options: VirtualizationOptions = {
        containerHeight: 600,
      };

      const { result } = renderHook(() =>
        useVirtualization(1, 50, options)
      );

      expect(result.current.visibleRange).toEqual({ start: 0, end: 0 });
      expect(result.current.totalHeight).toBe(50);
    });

    it('should handle very large lists', () => {
      const options: VirtualizationOptions = {
        containerHeight: 600,
      };

      const { result } = renderHook(() =>
        useVirtualization(100000, 50, options)
      );

      expect(result.current.totalHeight).toBe(5000000);
      expect(result.current.visibleRange.end).toBeLessThan(100000);
    });
  });
});
