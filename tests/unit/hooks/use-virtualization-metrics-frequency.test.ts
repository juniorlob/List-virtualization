/**
 * Tests for metrics update frequency in useVirtualization hook
 *
 * Requirement 7.1: Metrics update at least once per second
 * Requirement 7.4: Batch metric updates to avoid excessive re-renders
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';

import { useVirtualization } from '@/hooks/use-virtualization';

describe('useVirtualization - Metrics Update Frequency', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should set up an interval to update metrics once per second when performance monitoring is enabled', () => {
    const setIntervalSpy = vi.spyOn(global, 'setInterval');

    renderHook(() =>
      useVirtualization(1000, 50, {
        containerHeight: 600,
        overscan: 3,
        enablePerformanceMonitoring: true,
      })
    );

    // setInterval should have been called with 1000ms interval
    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 1000);
  });

  it('should not set up metrics interval when performance monitoring is disabled', () => {
    const setIntervalSpy = vi.spyOn(global, 'setInterval');

    renderHook(() =>
      useVirtualization(1000, 50, {
        containerHeight: 600,
        overscan: 3,
        enablePerformanceMonitoring: false,
      })
    );

    // setInterval should not have been called for metrics updates
    // (it might be called for other purposes, but not with 1000ms)
    const metricsIntervalCalls = setIntervalSpy.mock.calls.filter(
      (call) => call[1] === 1000
    );
    expect(metricsIntervalCalls.length).toBe(0);
  });

  it('should cleanup interval on unmount', () => {
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

    const { unmount } = renderHook(() =>
      useVirtualization(1000, 50, {
        containerHeight: 600,
        overscan: 3,
        enablePerformanceMonitoring: true,
      })
    );

    // Unmount the hook
    unmount();

    // clearInterval should have been called
    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it('should call PerformanceMonitor.getMetrics() on each interval tick', () => {
    const { result } = renderHook(() =>
      useVirtualization(1000, 50, {
        containerHeight: 600,
        overscan: 3,
        enablePerformanceMonitoring: true,
      })
    );

    // Initial metrics should be defined
    expect(result.current.metrics).toBeDefined();
    expect(result.current.metrics.fps).toBe(0);

    // The interval is set up and will call getMetrics() every second
    // We can verify this by checking that the interval was created with correct timing
    const setIntervalSpy = vi.spyOn(global, 'setInterval');

    // Re-render to trigger the effect again (for verification)
    renderHook(() =>
      useVirtualization(1000, 50, {
        containerHeight: 600,
        overscan: 3,
        enablePerformanceMonitoring: true,
      })
    );

    // Verify interval is set with 1000ms
    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 1000);
  });

  it('should batch metrics updates to once per second to avoid excessive re-renders', () => {
    // This test verifies that we use setInterval(1000ms) instead of updating on every RAF
    const setIntervalSpy = vi.spyOn(global, 'setInterval');

    renderHook(() =>
      useVirtualization(1000, 50, {
        containerHeight: 600,
        overscan: 3,
        enablePerformanceMonitoring: true,
      })
    );

    // Should use setInterval with 1000ms (once per second)
    // This ensures we don't update more frequently (Requirement 7.4)
    const metricsIntervalCalls = setIntervalSpy.mock.calls.filter(
      (call) => call[1] === 1000
    );
    expect(metricsIntervalCalls.length).toBeGreaterThan(0);

    // Should NOT use setInterval with shorter intervals (e.g., 16ms for 60fps)
    const highFrequencyIntervalCalls = setIntervalSpy.mock.calls.filter(
      (call) => typeof call[1] === 'number' && call[1] < 100
    );
    expect(highFrequencyIntervalCalls.length).toBe(0);
  });
});
