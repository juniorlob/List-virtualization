/**
 * useVirtualization - React hook for list virtualization
 *
 * This hook manages virtualization state and integrates with performance monitoring.
 * It bridges the gap between pure core logic and React UI components.
 *
 * @module hooks/use-virtualization
 */

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { VirtualizationCalculator } from '../core/virtualization/calculator';
import { PerformanceMonitor } from '../adapters/performance-api/PerformanceMonitor';
import type {
  VirtualizationOptions,
  VirtualizationResult,
  PerformanceMetrics,
} from '../core/virtualization/types';

/**
 * Default values for virtualization options
 */
const DEFAULTS = {
  OVERSCAN: 3,
  ENABLE_PERFORMANCE_MONITORING: false,
} as const;

/**
 * Initial performance metrics
 */
const INITIAL_METRICS: PerformanceMetrics = {
  fps: 0,
  memoryUsage: 0,
  domNodes: 0,
  renderTime: 0,
};

/**
 * Custom React hook for list virtualization
 *
 * Manages scroll state, calculates visible ranges, and integrates performance monitoring.
 * Uses dependency injection for calculator and performance monitor.
 *
 * @param itemCount - Total number of items in the list
 * @param itemHeight - Height of each item in pixels (fixed height)
 * @param options - Configuration options for virtualization
 * @returns Virtualization result with visible range, handlers, and metrics
 *
 * @example
 * ```typescript
 * const { visibleRange, totalHeight, onScroll, containerRef, metrics } = useVirtualization(
 *   1000,
 *   50,
 *   {
 *     containerHeight: 600,
 *     overscan: 3,
 *     enablePerformanceMonitoring: true
 *   }
 * );
 * ```
 */
export function useVirtualization(
  itemCount: number,
  itemHeight: number,
  options: VirtualizationOptions
): VirtualizationResult {
  // Extract options with defaults
  const {
    containerHeight,
    overscan = DEFAULTS.OVERSCAN,
    calculator = new VirtualizationCalculator(),
    enablePerformanceMonitoring = DEFAULTS.ENABLE_PERFORMANCE_MONITORING,
  } = options;

  // State: Current scroll position
  const [scrollTop, setScrollTop] = useState<number>(0);

  // State: Performance metrics
  const [metrics, setMetrics] = useState<PerformanceMetrics>(INITIAL_METRICS);

  // Ref: Container element reference
  const containerRef = useRef<HTMLDivElement>(null!);

  // Ref: Performance monitor instance
  const performanceMonitorRef = useRef<PerformanceMonitor | null>(null);

  // Ref: Pending animation frame ID for scroll batching
  const rafIdRef = useRef<number | null>(null);

  /**
   * Scroll event handler with requestAnimationFrame batching
   *
   * Batches scroll updates to prevent excessive re-renders and ensure smooth scrolling.
   * Cancels pending frames before scheduling new ones to avoid stale updates.
   */
  const onScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    // Cancel any pending animation frame
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
    }

    // Schedule update for next animation frame
    rafIdRef.current = requestAnimationFrame(() => {
      const newScrollTop = event.currentTarget.scrollTop;
      setScrollTop(newScrollTop);
      rafIdRef.current = null;
    });
  }, []);

  /**
   * Cleanup effect: Cancel pending animation frames on unmount
   */
  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, []);

  /**
   * Memoized visible range calculation
   *
   * Recalculates only when dependencies change to prevent unnecessary re-renders.
   * Dependencies: scrollTop, containerHeight, itemCount, itemHeight, overscan
   *
   * When itemCount changes (data length changes), this automatically recalculates
   * the visible range to ensure correct rendering (Requirement 3.8).
   */
  const visibleRange = useMemo(() => {
    return calculator.calculateVisibleRange(
      scrollTop,
      containerHeight,
      itemCount,
      itemHeight,
      overscan
    );
  }, [scrollTop, containerHeight, itemCount, itemHeight, overscan, calculator]);

  /**
   * Memoized total height calculation
   *
   * Recalculates only when item count or height changes.
   */
  const totalHeight = useMemo(() => {
    return calculator.calculateTotalHeight(itemCount, itemHeight);
  }, [itemCount, itemHeight, calculator]);

  /**
   * Performance monitoring effect
   *
   * Initializes PerformanceMonitor when enabled and cleans up on unmount.
   * Updates metrics state periodically with collected performance data.
   */
  useEffect(() => {
    if (!enablePerformanceMonitoring) {
      return;
    }

    // Initialize performance monitor
    const monitor = new PerformanceMonitor();
    performanceMonitorRef.current = monitor;

    // Start monitoring with callback to update metrics state
    monitor.startMonitoring(
      (newMetrics) => {
        setMetrics(newMetrics);
      },
      containerRef.current || undefined
    );

    // Cleanup on unmount
    return () => {
      monitor.stopMonitoring();
      performanceMonitorRef.current = null;
    };
  }, [enablePerformanceMonitoring]);

  /**
   * Update container reference for DOM node counting
   *
   * When container ref changes, update the performance monitor's container reference.
   */
  useEffect(() => {
    if (enablePerformanceMonitoring && performanceMonitorRef.current && containerRef.current) {
      // Restart monitoring with new container element
      const monitor = performanceMonitorRef.current;
      monitor.stopMonitoring();
      monitor.startMonitoring(
        (newMetrics) => {
          setMetrics(newMetrics);
        },
        containerRef.current
      );
    }
  }, [enablePerformanceMonitoring, containerRef.current]);

  // Return virtualization result
  return {
    visibleRange,
    totalHeight,
    metrics,
    onScroll,
    containerRef,
  };
}
