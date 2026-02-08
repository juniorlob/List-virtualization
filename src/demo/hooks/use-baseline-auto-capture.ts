/**
 * useBaselineAutoCapture - React hook for automatic baseline metrics capture
 *
 * This hook automatically captures baseline performance metrics after the non-virtualized
 * list has been running for at least 2 seconds with stable metrics. The baseline is used
 * to calculate resource savings when switching to virtualized mode.
 *
 * Requirements: 3.1, 8.1
 *
 * @module demo/hooks/use-baseline-auto-capture
 */

import { useEffect, useRef } from 'react';
import { averageMetrics } from '@/demo/utils/baseline-validator';
import type { PerformanceMetrics, DemoConfig } from '@/demo/pages/unified-demo-types';

/**
 * Callback function type for baseline capture
 */
type BaselineCapturedCallback = (
  metrics: PerformanceMetrics,
  config: DemoConfig
) => void;

/**
 * Custom React hook for automatic baseline capture
 *
 * Monitors performance metrics in non-virtualized mode and automatically captures
 * a baseline after 2 seconds of stable metrics. The baseline is calculated by
 * averaging metrics collected over the 2-second period to reduce the impact of
 * temporary performance fluctuations.
 *
 * The hook:
 * - Only operates in non-virtualized mode
 * - Collects metrics for 2 seconds before capturing baseline
 * - Averages collected metrics for stability
 * - Clears history when mode changes
 * - Calls the callback with averaged metrics and current config
 *
 * @param mode - Current rendering mode ('virtualized' or 'non-virtualized')
 * @param currentMetrics - Current performance metrics from the active list
 * @param onBaselineCaptured - Callback invoked when baseline is captured
 * @param config - Current demo configuration (dataset size, item height, overscan)
 *
 * @example
 * ```typescript
 * const [baselineMetrics, setBaselineMetrics] = useState<PerformanceMetrics | null>(null);
 * const [mode, setMode] = useState<'virtualized' | 'non-virtualized'>('non-virtualized');
 * const [currentMetrics, setCurrentMetrics] = useState<PerformanceMetrics | null>(null);
 *
 * useBaselineAutoCapture(
 *   mode,
 *   currentMetrics,
 *   (metrics, config) => {
 *     setBaselineMetrics(metrics);
 *     setBaselineConfig(config);
 *     console.log('Baseline captured:', metrics);
 *   },
 *   { datasetSize: 10000, itemHeight: 50, overscan: 3 }
 * );
 * ```
 *
 * Requirement 3.1: WHEN the Non-Virtualized mode is active, THE System SHALL
 * capture its metrics as Baseline_Metrics for comparison
 *
 * Requirement 8.1: WHEN Non-Virtualized mode runs for at least 2 seconds,
 * THE System SHALL capture stable Baseline_Metrics
 */
export function useBaselineAutoCapture(
  mode: 'virtualized' | 'non-virtualized',
  currentMetrics: PerformanceMetrics | null,
  onBaselineCaptured: BaselineCapturedCallback,
  config: DemoConfig
): void {
  // Ref: History of metrics collected over time
  const metricsHistoryRef = useRef<PerformanceMetrics[]>([]);

  // Ref: Timer for delayed baseline capture
  const captureTimerRef = useRef<number | null>(null);

  // Ref: Flag to track if baseline has been captured for current mode session
  const hasBeenCapturedRef = useRef<boolean>(false);

  // Ref: Store the config to avoid effect re-runs on config object changes
  const configRef = useRef<DemoConfig>(config);
  configRef.current = config;

  // Ref: Store the callback to avoid effect re-runs on callback changes
  const callbackRef = useRef<BaselineCapturedCallback>(onBaselineCaptured);
  callbackRef.current = onBaselineCaptured;

  /**
   * Effect: Monitor metrics and auto-capture baseline
   *
   * This effect:
   * 1. Only operates in non-virtualized mode
   * 2. Collects metrics into history array
   * 3. After 2 seconds of metrics (2 samples at 1 sample/second), captures baseline
   * 4. Averages the collected metrics for stability
   * 5. Clears history and timers when mode changes
   */
  useEffect(() => {
    // Only auto-capture in non-virtualized mode
    if (mode !== 'non-virtualized') {
      // Clear history when switching away from non-virtualized mode
      metricsHistoryRef.current = [];
      hasBeenCapturedRef.current = false;

      // Clear any pending capture timer
      if (captureTimerRef.current) {
        clearTimeout(captureTimerRef.current);
        captureTimerRef.current = null;
      }

      return;
    }

    // If no metrics available yet, wait
    if (!currentMetrics) {
      return;
    }

    // If baseline already captured for this session, don't capture again
    if (hasBeenCapturedRef.current) {
      return;
    }

    // Add current metrics to history
    metricsHistoryRef.current.push(currentMetrics);

    // Keep only last 2 seconds of metrics (assuming 1 update per second)
    // This ensures we're always working with recent data
    if (metricsHistoryRef.current.length > 2) {
      metricsHistoryRef.current.shift();
    }

    // After collecting 2 seconds of metrics, schedule baseline capture
    if (metricsHistoryRef.current.length >= 2 && !captureTimerRef.current) {
      captureTimerRef.current = window.setTimeout(() => {
        // Average the collected metrics for stability
        const avgMetrics = averageMetrics(metricsHistoryRef.current);

        // Invoke callback with averaged metrics and current config
        callbackRef.current(avgMetrics, configRef.current);

        // Mark as captured to prevent re-capturing
        hasBeenCapturedRef.current = true;

        // Clear timer reference
        captureTimerRef.current = null;
      }, 100); // Small delay to ensure metrics are stable
    }

    // Cleanup function
    return () => {
      if (captureTimerRef.current) {
        clearTimeout(captureTimerRef.current);
        captureTimerRef.current = null;
      }
    };
  }, [mode, currentMetrics]); // Only depend on mode and currentMetrics

  /**
   * Effect: Reset capture flag when config changes
   *
   * When dataset size or item height changes, we need to allow recapture
   * of the baseline since the performance characteristics have changed.
   */
  useEffect(() => {
    // Reset the capture flag when config changes
    hasBeenCapturedRef.current = false;
    metricsHistoryRef.current = [];

    // Clear any pending capture timer
    if (captureTimerRef.current) {
      clearTimeout(captureTimerRef.current);
      captureTimerRef.current = null;
    }
  }, [config.datasetSize, config.itemHeight]);
}
