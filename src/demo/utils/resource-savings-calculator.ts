/**
 * Resource Savings Calculator
 *
 * Calculates the resource savings achieved by virtualization by comparing
 * current metrics (from virtualized mode) against baseline metrics (from
 * non-virtualized mode).
 *
 * Requirements: 3.2, 3.3, 3.4, 3.5
 */

import type { PerformanceMetrics, ResourceSavings } from '../pages/unified-demo-types';

/**
 * Calculates resource savings by comparing current metrics against baseline metrics.
 *
 * All savings values are guaranteed to be non-negative using Math.max to handle
 * cases where virtualized mode might use more resources than non-virtualized mode
 * (which can happen with very small datasets or specific configurations).
 *
 * @param current - Current performance metrics (typically from virtualized mode)
 * @param baseline - Baseline performance metrics (typically from non-virtualized mode)
 * @returns Calculated resource savings with absolute and percentage values
 *
 * @example
 * ```typescript
 * const baseline = {
 *   fps: 30,
 *   memoryUsageMB: 100,
 *   domNodeCount: 10000,
 *   renderTimeMs: 50,
 *   timestamp: Date.now()
 * };
 *
 * const current = {
 *   fps: 60,
 *   memoryUsageMB: 20,
 *   domNodeCount: 100,
 *   renderTimeMs: 5,
 *   timestamp: Date.now()
 * };
 *
 * const savings = calculateResourceSavings(current, baseline);
 * // savings.memorySavedMB === 80
 * // savings.memorySavedPercent === 80
 * // savings.domNodesSaved === 9900
 * // savings.fpsImprovement === 30
 * ```
 */
export function calculateResourceSavings(
  current: PerformanceMetrics,
  baseline: PerformanceMetrics
): ResourceSavings {
  // Calculate memory savings
  const memorySavedMB = baseline.memoryUsageMB - current.memoryUsageMB;
  const memorySavedPercent = baseline.memoryUsageMB > 0
    ? (memorySavedMB / baseline.memoryUsageMB) * 100
    : 0;

  // Calculate DOM node savings
  const domNodesSaved = baseline.domNodeCount - current.domNodeCount;
  const domNodesSavedPercent = baseline.domNodeCount > 0
    ? (domNodesSaved / baseline.domNodeCount) * 100
    : 0;

  // Calculate FPS improvement
  const fpsImprovement = current.fps - baseline.fps;
  const fpsImprovementPercent = baseline.fps > 0
    ? (fpsImprovement / baseline.fps) * 100
    : 0;

  // Calculate render time savings
  const renderTimeSavedMs = baseline.renderTimeMs - current.renderTimeMs;
  const renderTimeSavedPercent = baseline.renderTimeMs > 0
    ? (renderTimeSavedMs / baseline.renderTimeMs) * 100
    : 0;

  return {
    // Ensure all savings are non-negative (Requirement 3.2, 3.3, 3.4, 3.5)
    memorySavedMB: Math.max(0, memorySavedMB),
    memorySavedPercent: Math.max(0, memorySavedPercent),
    domNodesSaved: Math.max(0, domNodesSaved),
    domNodesSavedPercent: Math.max(0, domNodesSavedPercent),
    fpsImprovement,
    fpsImprovementPercent,
    renderTimeSavedMs: Math.max(0, renderTimeSavedMs),
    renderTimeSavedPercent: Math.max(0, renderTimeSavedPercent)
  };
}
