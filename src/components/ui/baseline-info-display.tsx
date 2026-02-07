/**
 * BaselineInfoDisplay Component
 *
 * Shows information about the current baseline metrics and provides functionality
 * to reset the baseline. Displays a prompt message when no baseline is available,
 * or shows baseline details when it has been captured.
 *
 * Requirements: 3.6, 8.4, 8.5
 */

import type { PerformanceMetrics } from '../../demo/pages/unified-demo-types';
import styles from './baseline-info-display.module.css';

interface BaselineInfoDisplayProps {
  /** Baseline performance metrics (null if not yet captured) */
  baselineMetrics: PerformanceMetrics | null;
  /** Timestamp when baseline was captured (null if not yet captured) */
  baselineTimestamp: Date | null;
  /** Configuration used when baseline was captured (null if not yet captured) */
  baselineConfig: { datasetSize: number; itemHeight: number } | null;
  /** Callback to reset the baseline */
  onResetBaseline: () => void;
}

/**
 * Formats a timestamp into a human-readable string
 */
function formatTimestamp(timestamp: Date | null): string {
  if (!timestamp) return 'N/A';

  const now = new Date();
  const diff = now.getTime() - timestamp.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
  } else if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  } else if (hours < 24) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else {
    return timestamp.toLocaleString();
  }
}

/**
 * BaselineInfoDisplay Component
 *
 * Displays information about the baseline metrics used for resource savings comparison.
 * When no baseline is available, shows a prompt message instructing the user to run
 * non-virtualized mode. When baseline is available, shows capture timestamp,
 * configuration details, and a reset button.
 *
 * @example
 * ```tsx
 * // No baseline available
 * <BaselineInfoDisplay
 *   baselineMetrics={null}
 *   baselineTimestamp={null}
 *   baselineConfig={null}
 *   onResetBaseline={() => {}}
 * />
 *
 * // Baseline available
 * <BaselineInfoDisplay
 *   baselineMetrics={metrics}
 *   baselineTimestamp={new Date()}
 *   baselineConfig={{ datasetSize: 10000, itemHeight: 50 }}
 *   onResetBaseline={handleReset}
 * />
 * ```
 */
export const BaselineInfoDisplay: React.FC<BaselineInfoDisplayProps> = ({
  baselineMetrics,
  baselineTimestamp,
  baselineConfig,
  onResetBaseline
}) => {
  // Show prompt message when no baseline is available (Requirement 3.6)
  if (!baselineMetrics) {
    return (
      <div className={styles.baselineInfo}>
        <div className={styles.promptMessage}>
          <div className={styles.infoIcon}>ℹ️</div>
          <div className={styles.promptContent}>
            <h4 className={styles.promptTitle}>No Baseline Available</h4>
            <p className={styles.promptText}>
              Run Non-Virtualized mode for 2+ seconds to establish a baseline for comparison.
              The baseline will be automatically captured and used to calculate resource savings
              when you switch to Virtualized mode.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show baseline details when available (Requirements 8.4, 8.5)
  return (
    <div className={styles.baselineInfo}>
      <div className={styles.baselineDetails}>
        <div className={styles.detailsHeader}>
          <div className={styles.successIcon}>✓</div>
          <h4 className={styles.detailsTitle}>Baseline Established</h4>
        </div>

        <div className={styles.detailsGrid}>
          {/* Timestamp - Requirement 8.4 */}
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Captured:</span>
            <span className={styles.detailValue}>{formatTimestamp(baselineTimestamp)}</span>
          </div>

          {/* Configuration - Requirement 8.4 */}
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Dataset Size:</span>
            <span className={styles.detailValue}>
              {baselineConfig?.datasetSize.toLocaleString()} items
            </span>
          </div>

          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Item Height:</span>
            <span className={styles.detailValue}>{baselineConfig?.itemHeight}px</span>
          </div>

          {/* Baseline metrics summary */}
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Memory Usage:</span>
            <span className={styles.detailValue}>
              {baselineMetrics.memoryUsageMB.toFixed(2)} MB
            </span>
          </div>

          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>DOM Nodes:</span>
            <span className={styles.detailValue}>
              {baselineMetrics.domNodeCount.toLocaleString()}
            </span>
          </div>

          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>FPS:</span>
            <span className={styles.detailValue}>{baselineMetrics.fps.toFixed(1)}</span>
          </div>
        </div>

        {/* Reset button - Requirement 8.5 */}
        <button onClick={onResetBaseline} className={styles.resetButton}>
          🔄 Reset Baseline
        </button>
      </div>
    </div>
  );
};
