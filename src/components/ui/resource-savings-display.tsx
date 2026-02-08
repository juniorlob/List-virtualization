/**
 * ResourceSavingsDisplay Component
 *
 * Visualizes the resource savings achieved by virtualization by comparing
 * current metrics (from virtualized mode) against baseline metrics (from
 * non-virtualized mode).
 *
 * Requirements: 4.2, 4.3, 4.4, 4.5, 4.6
 */

import { useMemo } from 'react';
import type { PerformanceMetrics, ResourceSavings } from '@/demo/pages/unified-demo-types';
import { calculateResourceSavings } from '@/demo/utils/resource-savings-calculator';

import styles from './resource-savings-display.module.css';

interface ResourceSavingsDisplayProps {
  /** Current performance metrics from virtualized mode */
  currentMetrics: PerformanceMetrics;
  /** Baseline performance metrics from non-virtualized mode */
  baselineMetrics: PerformanceMetrics;
}

interface SavingsMetricProps {
  /** Label for the metric */
  label: string;
  /** Primary value to display */
  value: string;
  /** Percentage value */
  percent: number;
  /** Icon identifier for visual representation */
  icon: 'memory' | 'nodes' | 'performance' | 'clock';
}

/**
 * Individual savings metric display component
 * Requirement 10.3: Display "N/A" for unavailable metrics
 */
const SavingsMetric: React.FC<SavingsMetricProps> = ({ label, value, percent, icon }) => {
  const iconSymbol = {
    memory: '💾',
    nodes: '🔢',
    performance: '⚡',
    clock: '⏱️'
  }[icon];

  // Check if value indicates unavailable metric (explicitly "N/A")
  const isUnavailable = value === 'N/A';

  return (
    <div className={styles.metric}>
      <div className={styles.metricIcon}>{iconSymbol}</div>
      <div className={styles.metricContent}>
        <div className={styles.metricLabel}>{label}</div>
        <div className={styles.metricValue}>
          {isUnavailable ? (
            <span className={styles.unavailable}>N/A</span>
          ) : (
            <>
              {value}
              <span className={styles.metricPercent}>({percent.toFixed(1)}%)</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * ResourceSavingsDisplay Component
 *
 * Displays a comprehensive view of resource savings achieved by virtualization.
 * Shows memory saved, DOM nodes saved, FPS improvement, and render time reduction
 * with both absolute and percentage values.
 *
 * Uses positive visual indicators (green colors, icons) to highlight the benefits.
 *
 * @example
 * ```tsx
 * <ResourceSavingsDisplay
 *   currentMetrics={virtualizedMetrics}
 *   baselineMetrics={nonVirtualizedMetrics}
 * />
 * ```
 */
export const ResourceSavingsDisplay: React.FC<ResourceSavingsDisplayProps> = ({
  currentMetrics,
  baselineMetrics
}) => {
  // Calculate savings using memoization to avoid recalculation on every render
  const savings: ResourceSavings = useMemo(
    () => calculateResourceSavings(currentMetrics, baselineMetrics),
    [currentMetrics, baselineMetrics]
  );

  // Check if memory metrics are available (Requirement 10.3)
  const memoryAvailable = baselineMetrics.memoryUsageMB > 0 && currentMetrics.memoryUsageMB > 0;
  const renderTimeAvailable = baselineMetrics.renderTimeMs > 0 && currentMetrics.renderTimeMs > 0;

  return (
    <div className={styles.savingsPanel}>
      <h3 className={styles.title}>
        <span className={styles.titleIcon}>✅</span>
        Resource Savings
      </h3>
      <div className={styles.metricsGrid}>
        {/* Memory Savings - Requirement 4.2, 10.3 */}
        <SavingsMetric
          label="Memory Saved"
          value={memoryAvailable ? `${savings.memorySavedMB.toFixed(2)} MB` : 'N/A'}
          percent={savings.memorySavedPercent}
          icon="memory"
        />

        {/* DOM Nodes Savings - Requirement 4.3 */}
        <SavingsMetric
          label="DOM Nodes Saved"
          value={savings.domNodesSaved.toLocaleString()}
          percent={savings.domNodesSavedPercent}
          icon="nodes"
        />

        {/* FPS Improvement - Requirement 4.4 */}
        <SavingsMetric
          label="FPS Improvement"
          value={`+${savings.fpsImprovement.toFixed(1)} FPS`}
          percent={savings.fpsImprovementPercent}
          icon="performance"
        />

        {/* Render Time Reduction - Requirement 4.5, 10.3 */}
        <SavingsMetric
          label="Render Time Saved"
          value={renderTimeAvailable ? `${savings.renderTimeSavedMs.toFixed(2)} ms` : 'N/A'}
          percent={savings.renderTimeSavedPercent}
          icon="clock"
        />
      </div>
    </div>
  );
};
