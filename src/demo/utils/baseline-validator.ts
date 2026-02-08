/**
 * Baseline Validation and Invalidation Logic
 *
 * Provides utilities for managing baseline metrics, including validation
 * of when baselines should be invalidated and averaging metrics for
 * baseline capture.
 *
 * Requirements: 8.3
 */

import type { PerformanceMetrics, DemoConfig } from '@/demo/pages/unified-demo-types';

/**
 * Determines whether the baseline metrics should be invalidated based on
 * configuration changes.
 *
 * The baseline is invalidated when dataset size or item height changes,
 * as these parameters significantly affect performance characteristics.
 * Overscan changes do NOT invalidate the baseline since they only affect
 * virtualized mode, not the non-virtualized baseline.
 *
 * @param currentConfig - The current demo configuration
 * @param baselineConfig - The configuration used when baseline was captured
 * @returns true if baseline should be invalidated, false otherwise
 *
 * @example
 * ```typescript
 * const baseline = { datasetSize: 10000, itemHeight: 50 };
 * const current = { datasetSize: 20000, itemHeight: 50, overscan: 3 };
 *
 * shouldInvalidateBaseline(current, baseline); // true (dataset size changed)
 * ```
 *
 * Requirement 8.3: WHEN dataset size or item height changes, THE System SHALL
 * invalidate Baseline_Metrics and prompt for a new baseline
 */
export function shouldInvalidateBaseline(
  currentConfig: DemoConfig,
  baselineConfig: { datasetSize: number; itemHeight: number } | null
): boolean {
  // If no baseline exists, nothing to invalidate
  if (!baselineConfig) {
    return false;
  }

  // Invalidate if dataset size changed
  if (currentConfig.datasetSize !== baselineConfig.datasetSize) {
    return true;
  }

  // Invalidate if item height changed
  if (currentConfig.itemHeight !== baselineConfig.itemHeight) {
    return true;
  }

  // Overscan changes do NOT invalidate baseline (only affects virtualized mode)
  return false;
}

/**
 * Calculates the average of multiple performance metrics samples.
 *
 * This function is used to create a stable baseline by averaging metrics
 * collected over a period of time (typically 2 seconds). Averaging reduces
 * the impact of temporary performance spikes or dips.
 *
 * @param metrics - Array of performance metrics to average
 * @returns Averaged performance metrics with the most recent timestamp
 *
 * @example
 * ```typescript
 * const samples = [
 *   { fps: 58, memoryUsageMB: 100, domNodeCount: 10000, renderTimeMs: 50, timestamp: 1000 },
 *   { fps: 60, memoryUsageMB: 102, domNodeCount: 10000, renderTimeMs: 48, timestamp: 2000 }
 * ];
 *
 * const avg = averageMetrics(samples);
 * // avg.fps === 59
 * // avg.memoryUsageMB === 101
 * // avg.timestamp === 2000 (most recent)
 * ```
 *
 * Requirement 8.1: WHEN Non-Virtualized mode runs for at least 2 seconds,
 * THE System SHALL capture stable Baseline_Metrics
 */
export function averageMetrics(metrics: PerformanceMetrics[]): PerformanceMetrics {
  // Handle edge case of empty array
  if (metrics.length === 0) {
    return {
      fps: 0,
      memoryUsageMB: 0,
      domNodeCount: 0,
      renderTimeMs: 0,
      timestamp: Date.now()
    };
  }

  // Handle single metric (no averaging needed)
  if (metrics.length === 1) {
    return { ...metrics[0] };
  }

  // Calculate sum of all metrics
  const sum = metrics.reduce(
    (acc, m) => ({
      fps: acc.fps + m.fps,
      memoryUsageMB: acc.memoryUsageMB + m.memoryUsageMB,
      domNodeCount: acc.domNodeCount + m.domNodeCount,
      renderTimeMs: acc.renderTimeMs + m.renderTimeMs,
      timestamp: m.timestamp // Keep updating to most recent
    }),
    { fps: 0, memoryUsageMB: 0, domNodeCount: 0, renderTimeMs: 0, timestamp: 0 }
  );

  const count = metrics.length;

  return {
    fps: sum.fps / count,
    memoryUsageMB: sum.memoryUsageMB / count,
    domNodeCount: Math.round(sum.domNodeCount / count), // Round to nearest integer
    renderTimeMs: sum.renderTimeMs / count,
    timestamp: sum.timestamp // Use the most recent timestamp
  };
}
