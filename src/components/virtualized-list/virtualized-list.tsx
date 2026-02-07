/**
 * VirtualizedList - Production-ready virtualized list component
 *
 * This component efficiently renders large datasets by only creating DOM nodes
 * for items visible in the viewport plus a small overscan buffer.
 *
 * @module components/virtualized-list
 */

import React from 'react';
import { useVirtualization } from '../../hooks/use-virtualization';
import { VirtualizationCalculator } from '../../core/virtualization/calculator';
import type {
  IVirtualizationCalculator,
  PerformanceMetrics,
} from '../../core/virtualization/types';
import styles from './virtualized-list.module.css';

/**
 * Props for the VirtualizedList component
 *
 * @template T - The type of data items in the list
 */
export interface VirtualizedListProps<T> {
  /**
   * Array of data items to render
   * @required
   */
  data: T[];

  /**
   * Function to render each item
   * @param item - The data item to render
   * @param index - The index of the item in the data array
   * @returns React node to render for this item
   * @required
   */
  renderItem: (item: T, index: number) => React.ReactNode;

  /**
   * Height of each item in pixels (fixed height)
   * @required
   */
  itemHeight: number;

  /**
   * Height of the scrollable container in pixels
   * @default 600
   * @optional
   */
  containerHeight?: number;

  /**
   * Number of items to render above and below the visible viewport
   * Helps prevent blank spaces during fast scrolling
   * @default 3
   * @optional
   */
  overscan?: number;

  /**
   * Additional CSS class name for the container
   * @optional
   */
  className?: string;

  /**
   * Callback invoked when performance metrics change
   * @param metrics - Current performance metrics
   * @optional
   */
  onMetricsChange?: (metrics: PerformanceMetrics) => void;

  /**
   * Custom calculator instance for dependency injection
   * Useful for testing or custom virtualization logic
   * @optional
   */
  calculator?: IVirtualizationCalculator;
}

/**
 * Default values for optional props
 */
const DEFAULTS = {
  CONTAINER_HEIGHT: 600,
  OVERSCAN: 3,
} as const;

/**
 * VirtualizedList Component
 *
 * A production-ready virtualized list component that efficiently renders large datasets.
 * Only creates DOM nodes for items visible in the viewport plus overscan buffer.
 *
 * @template T - The type of data items in the list
 *
 * @example
 * ```typescript
 * interface User {
 *   id: string;
 *   name: string;
 *   email: string;
 * }
 *
 * const users: User[] = [...]; // Large array of users
 *
 * <VirtualizedList
 *   data={users}
 *   renderItem={(user, index) => (
 *     <div>
 *       <h3>{user.name}</h3>
 *       <p>{user.email}</p>
 *     </div>
 *   )}
 *   itemHeight={80}
 *   containerHeight={600}
 *   overscan={5}
 *   onMetricsChange={(metrics) => console.log('FPS:', metrics.fps)}
 * />
 * ```
 */
export function VirtualizedList<T>({
  data,
  renderItem,
  itemHeight,
  containerHeight = DEFAULTS.CONTAINER_HEIGHT,
  overscan = DEFAULTS.OVERSCAN,
  className = '',
  onMetricsChange,
  calculator = new VirtualizationCalculator(),
}: VirtualizedListProps<T>): React.ReactElement {
  // Use virtualization hook to manage state and calculations
  // When data.length changes, the hook automatically recalculates the visible range
  // and total height, ensuring correct rendering (Requirement 3.8)
  const { visibleRange, totalHeight, metrics, onScroll, containerRef } =
    useVirtualization(data.length, itemHeight, {
      containerHeight,
      overscan,
      calculator,
      enablePerformanceMonitoring: !!onMetricsChange,
    });

  // Invoke metrics callback when metrics change (Requirement 3.7)
  React.useEffect(() => {
    if (onMetricsChange) {
      onMetricsChange(metrics);
    }
  }, [metrics, onMetricsChange]);

  // Calculate the number of visible items to render
  // Ensure we don't try to render more items than exist in the data array
  // This handles the case where data length decreases while scrolled down (Requirement 3.8, 12.6)
  const visibleItemCount = Math.max(0, Math.min(
    visibleRange.end - visibleRange.start + 1,
    data.length - visibleRange.start
  ));

  return (
    <div
      ref={containerRef}
      className={`${styles.scrollContainer} ${className}`.trim()}
      onScroll={onScroll}
      style={{ height: containerHeight, overflow: 'auto' }}
    >
      <div
        className={styles.contentSpacer}
        style={{ height: totalHeight, position: 'relative' }}
      >
        {/* Render only items in the visible range with absolute positioning */}
        {Array.from({ length: visibleItemCount }).map((_, i) => {
          const index = visibleRange.start + i;
          const position = calculator.calculateItemPosition(index, itemHeight);

          // Get the data item - handle case where data might be shorter than expected
          const item = data[index];
          if (!item) {
            return null;
          }

          // Generate a stable key for React reconciliation
          // Prefer item.id if available, otherwise use index
          const key = (item as any).id ?? index;

          return (
            <div
              key={key}
              className={styles.listItem}
              style={{
                position: 'absolute',
                top: position.top,
                height: position.height,
                width: '100%',
              }}
              data-index={index}
            >
              {renderItem(item, index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
