/**
 * Type definitions for the Unified Demo Page
 *
 * This module contains all TypeScript interfaces and types used by the unified demo page,
 * which combines virtualized and non-virtualized list rendering modes with resource
 * savings comparison.
 *
 * Requirements: 3.1, 3.2, 8.1
 */

/**
 * Performance metrics collected during list rendering.
 * Used for both virtualized and non-virtualized modes.
 */
export interface PerformanceMetrics {
  /** Frames per second during rendering */
  fps: number;
  /** Memory usage in megabytes */
  memoryUsageMB: number;
  /** Total DOM nodes in the rendered list */
  domNodeCount: number;
  /** Time to render in milliseconds */
  renderTimeMs: number;
  /** Timestamp when metrics were captured */
  timestamp: number;
}

/**
 * Configuration options for the demo.
 * Controls the behavior and appearance of both list modes.
 */
export interface DemoConfig {
  /** Number of items in the list (100 to 100,000) */
  datasetSize: number;
  /** Height of each item in pixels (20 to 200) */
  itemHeight: number;
  /** Number of items to render outside viewport (0 to 10, virtualized only) */
  overscan: number;
}

/**
 * Calculated resource savings achieved by virtualization.
 * Compares virtualized mode metrics against non-virtualized baseline.
 */
export interface ResourceSavings {
  /** Absolute memory saved in megabytes */
  memorySavedMB: number;
  /** Percentage of memory saved */
  memorySavedPercent: number;
  /** Absolute number of DOM nodes saved */
  domNodesSaved: number;
  /** Percentage of DOM nodes saved */
  domNodesSavedPercent: number;
  /** Absolute FPS improvement */
  fpsImprovement: number;
  /** Percentage FPS improvement */
  fpsImprovementPercent: number;
  /** Absolute render time saved in milliseconds */
  renderTimeSavedMs: number;
  /** Percentage render time saved */
  renderTimeSavedPercent: number;
}

/**
 * Complete state for the Unified Demo Page component.
 * Manages mode selection, configuration, metrics, and baseline tracking.
 */
export interface UnifiedDemoState {
  // Mode and configuration
  /** Current rendering mode */
  mode: 'virtualized' | 'non-virtualized';
  /** Current dataset size */
  datasetSize: number;
  /** Current item height in pixels */
  itemHeight: number;
  /** Current overscan value (virtualized mode only) */
  overscan: number;

  // Metrics tracking
  /** Current performance metrics from the active list */
  currentMetrics: PerformanceMetrics | null;
  /** Baseline metrics captured from non-virtualized mode */
  baselineMetrics: PerformanceMetrics | null;
  /** Timestamp when baseline was captured */
  baselineTimestamp: Date | null;
  /** Configuration used when baseline was captured */
  baselineConfig: { datasetSize: number; itemHeight: number } | null;

  // UI state
  /** Whether a mode transition is in progress */
  isTransitioning: boolean;
  /** Whether baseline has been successfully established */
  baselineEstablished: boolean;
}

/**
 * List item structure for data generation.
 * Represents a single item in the demo list.
 */
export interface ListItem {
  /** Unique identifier for the item */
  id: string;
  /** Display content for the item */
  content: string;
  /** Position in the list (0-indexed) */
  index: number;
}
