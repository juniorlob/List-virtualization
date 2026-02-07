/**
 * NonVirtualizedList Component
 *
 * Renders all list items without virtualization for baseline performance comparison.
 * This component integrates with PerformanceMonitor to collect real-time metrics
 * including FPS, memory usage, DOM node count, and render time.
 *
 * Used as a baseline to demonstrate the performance benefits of virtualization.
 */

import { useEffect, useRef } from 'react';
import { PerformanceMonitor } from '../../adapters/performance-api/performance-monitor';
import type { PerformanceMetrics } from '../../core/virtualization/types';
import styles from './non-virtualized-list.module.css';

/**
 * Props for the NonVirtualizedList component
 */
export interface NonVirtualizedListProps<T = any> {
  /** Array of data items to render */
  data: T[];
  /** Height of each item in pixels */
  itemHeight: number;
  /** Callback function called with updated metrics every second */
  onMetricsUpdate: (metrics: PerformanceMetrics) => void;
  /** Function to render each item */
  renderItem: (item: T, index: number) => React.ReactNode;
}

/**
 * NonVirtualizedList component that renders all items without virtualization
 */
export const NonVirtualizedList = <T,>({
  data,
  itemHeight,
  onMetricsUpdate,
  renderItem,
}: NonVirtualizedListProps<T>) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const performanceMonitorRef = useRef<PerformanceMonitor | null>(null);
  const metricsIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    // Initialize performance monitor
    const monitor = new PerformanceMonitor();
    performanceMonitorRef.current = monitor;

    // Start monitoring with the container element
    if (containerRef.current) {
      monitor.startMonitoring(
        () => {
          // Metrics are updated continuously via requestAnimationFrame
          // We'll call onMetricsUpdate on an interval below
        },
        containerRef.current
      );
    }

    // Mark render start for initial render
    monitor.markRenderStart('non-virtualized-render');

    // Set up interval to call onMetricsUpdate every second
    metricsIntervalRef.current = setInterval(() => {
      const currentMetrics = monitor.getMetrics();
      onMetricsUpdate(currentMetrics);
    }, 1000);

    // Cleanup function
    return () => {
      // Clear the metrics update interval
      if (metricsIntervalRef.current) {
        clearInterval(metricsIntervalRef.current);
        metricsIntervalRef.current = null;
      }

      // Stop monitoring and cleanup
      if (performanceMonitorRef.current) {
        performanceMonitorRef.current.stopMonitoring();
        performanceMonitorRef.current = null;
      }
    };
  }, [onMetricsUpdate]);

  // Mark render end after items are rendered
  useEffect(() => {
    if (performanceMonitorRef.current) {
      performanceMonitorRef.current.markRenderEnd('non-virtualized-render');
    }
  });

  return (
    <div
      ref={containerRef}
      className={styles.listContainer}
      data-testid="non-virtualized-list"
    >
      {data.map((item, index) => (
        <div
          key={index}
          className={styles.listItem}
          style={{ height: itemHeight }}
          data-testid="list-item"
        >
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
};
