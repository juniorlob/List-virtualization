/**
 * UnifiedDemoPage Component
 *
 * A unified demo page that combines virtualized and non-virtualized list rendering
 * modes with resource savings comparison. Users can switch between modes to see
 * the performance benefits of virtualization.
 *
 * Requirements: 1.2, 5.4, 8.3, 9.1, 9.2, 9.3, 9.4
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';

import { useBaselineAutoCapture } from '@/demo/hooks/use-baseline-auto-capture';
import { shouldInvalidateBaseline } from '@/demo/utils/baseline-validator';
import { generateData, type DemoItem } from '@/demo/utils/data-generator';

import { VirtualizedList } from '@/components/virtualized-list/virtualized-list';
import { NonVirtualizedList } from '@/components/non-virtualized-list/non-virtualized-list';
import { ModeToggle, type ListMode } from '@/components/ui/mode-toggle';
import { ControlPanel } from '@/components/ui/control-panel';
import { ResourceSavingsDisplay } from '@/components/ui/resource-savings-display';
import { BaselineInfoDisplay } from '@/components/ui/baseline-info-display';
import { ErrorBoundary } from '@/components/ui/error-boundary';

import type {
  PerformanceMetrics,
  DemoConfig,
  UnifiedDemoState,
} from './unified-demo-types';

import type { PerformanceMetrics as CorePerformanceMetrics } from '@/core/virtualization/types';

import styles from './unified-demo-page.module.css';

/**
 * Converts core PerformanceMetrics to unified demo PerformanceMetrics
 */
function convertCoreMetrics(coreMetrics: CorePerformanceMetrics): PerformanceMetrics {
  return {
    fps: coreMetrics.fps,
    memoryUsageMB: coreMetrics.memoryUsage,
    domNodeCount: coreMetrics.domNodes,
    renderTimeMs: coreMetrics.renderTime,
    timestamp: Date.now(),
  };
}

/**
 * Props for the UnifiedDemoPage component
 */
export interface UnifiedDemoPageProps {
  /** Initial rendering mode (default: 'non-virtualized') */
  initialMode?: ListMode;
  /** Initial dataset size (default: 10000) */
  initialDatasetSize?: number;
  /** Initial item height in pixels (default: 50) */
  initialItemHeight?: number;
  /** Initial overscan value (default: 3) */
  initialOverscan?: number;
}

/**
 * Default configuration values
 * Requirements: 9.2, 9.3, 9.4
 */
const DEFAULTS = {
  MODE: 'non-virtualized' as ListMode,
  DATASET_SIZE: 10000,
  ITEM_HEIGHT: 50,
  OVERSCAN: 3,
} as const;

/**
 * UnifiedDemoPage Component
 *
 * Main component that orchestrates the unified demo experience. Manages state
 * for mode selection, configuration, metrics tracking, and baseline capture.
 *
 * @example
 * ```tsx
 * <UnifiedDemoPage
 *   initialMode="non-virtualized"
 *   initialDatasetSize={10000}
 *   initialItemHeight={50}
 *   initialOverscan={3}
 * />
 * ```
 */
export const UnifiedDemoPage: React.FC<UnifiedDemoPageProps> = ({
  initialMode = DEFAULTS.MODE,
  initialDatasetSize = DEFAULTS.DATASET_SIZE,
  initialItemHeight = DEFAULTS.ITEM_HEIGHT,
  initialOverscan = DEFAULTS.OVERSCAN,
}) => {
  // State management
  const [state, setState] = useState<UnifiedDemoState>({
    // Mode and configuration (Requirements 9.1, 9.2, 9.3, 9.4)
    mode: initialMode,
    datasetSize: initialDatasetSize,
    itemHeight: initialItemHeight,
    overscan: initialOverscan,

    // Metrics tracking
    currentMetrics: null,
    baselineMetrics: null,
    baselineTimestamp: null,
    baselineConfig: null,

    // UI state
    isTransitioning: false,
    baselineEstablished: false,
  });

  // Track slow transitions (> 500ms) for enhanced loading indicator
  const [showSlowTransitionWarning, setShowSlowTransitionWarning] = useState(false);
  const transitionTimerRef = useRef<number | null>(null);

  // Error state management (Requirement 10.1, 10.2)
  const [error, setError] = useState<{
    type: 'metrics-error' | 'mount-error' | 'general-error';
    message: string;
    recoverable: boolean;
    retryAction?: () => void;
  } | null>(null);

  // Generate data based on current dataset size
  const data = useMemo(() => generateData(state.datasetSize), [state.datasetSize]);

  // Current demo configuration
  const currentConfig: DemoConfig = useMemo(
    () => ({
      datasetSize: state.datasetSize,
      itemHeight: state.itemHeight,
      overscan: state.overscan,
    }),
    [state.datasetSize, state.itemHeight, state.overscan]
  );

  /**
   * Handler: Mode toggle
   * Requirement 1.2: Switch between virtualized and non-virtualized modes
   * Requirement 10.4: Display loading indicator if transition takes > 500ms
   */
  const handleModeToggle = useCallback((newMode: ListMode) => {
    // Clear any existing error
    setError(null);

    // Clear any existing transition timer
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }

    // Start transition
    setState((prev) => ({
      ...prev,
      mode: newMode,
      isTransitioning: true,
    }));
    setShowSlowTransitionWarning(false);

    // Set timer for slow transition warning (> 500ms)
    transitionTimerRef.current = window.setTimeout(() => {
      setShowSlowTransitionWarning(true);
    }, 500);

    // Use requestAnimationFrame to ensure unmount happens before mount
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Clear transition state after ensuring DOM updates
        setState((prev) => ({
          ...prev,
          isTransitioning: false,
        }));
        setShowSlowTransitionWarning(false);

        // Clear the timer
        if (transitionTimerRef.current) {
          clearTimeout(transitionTimerRef.current);
          transitionTimerRef.current = null;
        }
      });
    });
  }, []);

  /**
   * Handler: Metrics update from VirtualizedList
   * Called by the VirtualizedList component when metrics change
   */
  const handleVirtualizedMetricsUpdate = useCallback((coreMetrics: CorePerformanceMetrics) => {
    try {
      const metrics = convertCoreMetrics(coreMetrics);
      setState((prev) => ({
        ...prev,
        currentMetrics: metrics,
      }));
      // Clear any metrics-related errors on successful update
      setError((prev) => prev?.type === 'metrics-error' ? null : prev);
    } catch (err) {
      // Handle metrics conversion errors (Requirement 10.1)
      console.error('Failed to update virtualized metrics:', err);
      setError({
        type: 'metrics-error',
        message: 'Unable to collect performance metrics. Some features may be unavailable.',
        recoverable: true,
      });
    }
  }, []);

  /**
   * Handler: Metrics update from NonVirtualizedList
   * Called by the NonVirtualizedList component when metrics change
   */
  const handleNonVirtualizedMetricsUpdate = useCallback((coreMetrics: CorePerformanceMetrics) => {
    try {
      const metrics = convertCoreMetrics(coreMetrics);
      setState((prev) => ({
        ...prev,
        currentMetrics: metrics,
      }));
      // Clear any metrics-related errors on successful update
      setError((prev) => prev?.type === 'metrics-error' ? null : prev);
    } catch (err) {
      // Handle metrics conversion errors (Requirement 10.1)
      console.error('Failed to update non-virtualized metrics:', err);
      setError({
        type: 'metrics-error',
        message: 'Unable to collect performance metrics. Some features may be unavailable.',
        recoverable: true,
      });
    }
  }, []);

  /**
   * Handler: Configuration change
   * Requirement 5.4: Update configuration values
   */
  const handleConfigChange = useCallback(
    (config: Partial<DemoConfig>) => {
      setState((prev) => ({
        ...prev,
        ...config,
      }));
    },
    []
  );

  /**
   * Handler: Reset baseline
   * Requirement 8.5: Clear baseline metrics and allow recapture
   */
  const handleResetBaseline = useCallback(() => {
    setState((prev) => ({
      ...prev,
      baselineMetrics: null,
      baselineTimestamp: null,
      baselineConfig: null,
      baselineEstablished: false,
    }));
  }, []);

  /**
   * Handler: Baseline captured
   * Called by useBaselineAutoCapture hook when baseline is ready
   */
  const handleBaselineCaptured = useCallback(
    (metrics: PerformanceMetrics, config: DemoConfig) => {
      setState((prev) => ({
        ...prev,
        baselineMetrics: metrics,
        baselineTimestamp: new Date(),
        baselineConfig: {
          datasetSize: config.datasetSize,
          itemHeight: config.itemHeight,
        },
        baselineEstablished: true,
      }));
    },
    []
  );

  /**
   * Effect: Baseline invalidation
   * Requirement 8.3: Invalidate baseline when dataset size or item height changes
   */
  useEffect(() => {
    if (
      state.baselineConfig &&
      shouldInvalidateBaseline(currentConfig, state.baselineConfig)
    ) {
      setState((prev) => ({
        ...prev,
        baselineMetrics: null,
        baselineTimestamp: null,
        baselineConfig: null,
        baselineEstablished: false,
      }));
    }
  }, [currentConfig, state.baselineConfig]);

  /**
   * Hook: Baseline auto-capture
   * Requirements 3.1, 8.1: Automatically capture baseline after 2 seconds
   */
  useBaselineAutoCapture(
    state.mode,
    state.currentMetrics,
    handleBaselineCaptured,
    currentConfig
  );

  /**
   * Effect: Cleanup transition timer on unmount
   */
  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }
    };
  }, []);

  /**
   * Handler: Error caught by error boundary
   * Requirement 10.2: Handle component mount failures
   */
  const handleListError = useCallback((error: Error, errorInfo: React.ErrorInfo) => {
    console.error('List component error:', error, errorInfo);
    setError({
      type: 'mount-error',
      message: `Failed to load ${state.mode} list. Please try again.`,
      recoverable: true,
      retryAction: () => {
        setError(null);
        // Force re-render by toggling mode
        const currentMode = state.mode;
        setState((prev) => ({ ...prev, mode: currentMode === 'virtualized' ? 'non-virtualized' : 'virtualized' }));
        setTimeout(() => {
          setState((prev) => ({ ...prev, mode: currentMode }));
        }, 100);
      },
    });
  }, [state.mode]);

  /**
   * Render item function for both list types
   */
  const renderItem = useCallback((item: DemoItem) => {
    return (
      <div className={styles.itemContent}>
        <div className={styles.itemHeader}>
          <span className={styles.itemName}>{item.name}</span>
          <span className={styles.itemCategory}>{item.metadata?.category}</span>
        </div>
        <div className={styles.itemDescription}>{item.description}</div>
        <div className={styles.itemFooter}>
          <span className={styles.itemPriority}>
            Priority: {item.metadata?.priority}
          </span>
          <span className={styles.itemTags}>
            {item.metadata?.tags?.join(', ')}
          </span>
        </div>
      </div>
    );
  }, []);

  return (
    <div className={styles.unifiedDemoPage}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>List Virtualization Demo</h1>
        <p className={styles.subtitle}>
          Compare virtualized and non-virtualized rendering performance
        </p>
      </header>

      {/* Mode Toggle */}
      <div className={styles.modeToggleContainer}>
        <ModeToggle
          currentMode={state.mode}
          onModeChange={handleModeToggle}
          disabled={state.isTransitioning}
        />
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Left Panel: Controls */}
        <aside className={styles.leftPanel}>
          <ControlPanel
            datasetSize={state.datasetSize}
            itemHeight={state.itemHeight}
            overscan={state.overscan}
            showOverscan={state.mode === 'virtualized'}
            onDatasetSizeChange={(size) =>
              handleConfigChange({ datasetSize: size })
            }
            onItemHeightChange={(height) =>
              handleConfigChange({ itemHeight: height })
            }
            onOverscanChange={(overscan) =>
              handleConfigChange({ overscan })
            }
          />

          {/* Baseline Info */}
          <div className={styles.baselineSection}>
            <BaselineInfoDisplay
              baselineMetrics={state.baselineMetrics}
              baselineTimestamp={state.baselineTimestamp}
              baselineConfig={state.baselineConfig}
              onResetBaseline={handleResetBaseline}
            />
          </div>
        </aside>

        {/* Center Panel: List */}
        <main className={styles.centerPanel}>
          {/* Error Display */}
          {error && (
            <div className={styles.errorPanel}>
              <div className={styles.errorIcon}>⚠️</div>
              <div className={styles.errorContent}>
                <h4 className={styles.errorTitle}>Error</h4>
                <p className={styles.errorMessage}>{error.message}</p>
                {error.recoverable && error.retryAction && (
                  <button
                    className={styles.retryButton}
                    onClick={error.retryAction}
                    type="button"
                  >
                    Retry
                  </button>
                )}
              </div>
            </div>
          )}

          {state.isTransitioning && (
            <div className={styles.loadingOverlay}>
              <div className={styles.spinner} />
              <p>Switching modes...</p>
              {showSlowTransitionWarning && (
                <p className={styles.slowTransitionWarning}>
                  This is taking longer than expected...
                </p>
              )}
            </div>
          )}

          {!state.isTransitioning && !error && state.mode === 'virtualized' && (
            <ErrorBoundary
              onError={handleListError}
              fallback={
                <div className={styles.errorFallback}>
                  <p>Failed to load virtualized list</p>
                  <button onClick={() => handleModeToggle('non-virtualized')}>
                    Switch to Non-Virtualized Mode
                  </button>
                </div>
              }
            >
              <VirtualizedList
                data={data}
                renderItem={renderItem}
                itemHeight={state.itemHeight}
                containerHeight={600}
                overscan={state.overscan}
                onMetricsChange={handleVirtualizedMetricsUpdate}
              />
            </ErrorBoundary>
          )}

          {!state.isTransitioning && !error && state.mode === 'non-virtualized' && (
            <ErrorBoundary
              onError={handleListError}
              fallback={
                <div className={styles.errorFallback}>
                  <p>Failed to load non-virtualized list</p>
                  <button onClick={() => handleModeToggle('virtualized')}>
                    Switch to Virtualized Mode
                  </button>
                </div>
              }
            >
              <NonVirtualizedList
                data={data}
                renderItem={renderItem}
                itemHeight={state.itemHeight}
                onMetricsUpdate={handleNonVirtualizedMetricsUpdate}
              />
            </ErrorBoundary>
          )}
        </main>

        {/* Right Panel: Metrics */}
        <aside className={styles.rightPanel}>
          {/* Current Metrics */}
          {state.currentMetrics && (
            <div className={styles.metricsPanel}>
              <h3 className={styles.metricsTitle}>Current Metrics</h3>
              <div className={styles.metricsGrid}>
                <div className={styles.metricItem}>
                  <span className={styles.metricLabel}>FPS:</span>
                  <span className={styles.metricValue}>
                    {state.currentMetrics.fps.toFixed(1)}
                  </span>
                </div>
                <div className={styles.metricItem}>
                  <span className={styles.metricLabel}>Memory:</span>
                  <span className={styles.metricValue}>
                    {state.currentMetrics.memoryUsageMB > 0
                      ? `${state.currentMetrics.memoryUsageMB.toFixed(2)} MB`
                      : 'N/A'}
                  </span>
                </div>
                <div className={styles.metricItem}>
                  <span className={styles.metricLabel}>DOM Nodes:</span>
                  <span className={styles.metricValue}>
                    {state.currentMetrics.domNodeCount.toLocaleString()}
                  </span>
                </div>
                <div className={styles.metricItem}>
                  <span className={styles.metricLabel}>Render Time:</span>
                  <span className={styles.metricValue}>
                    {state.currentMetrics.renderTimeMs > 0
                      ? `${state.currentMetrics.renderTimeMs.toFixed(2)} ms`
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Resource Savings (only in virtualized mode with baseline) */}
          {state.mode === 'virtualized' &&
            state.baselineMetrics &&
            state.currentMetrics && (
              <ResourceSavingsDisplay
                currentMetrics={state.currentMetrics}
                baselineMetrics={state.baselineMetrics}
              />
            )}

          {/* Instructional Messages */}
          {!state.baselineEstablished && state.mode === 'non-virtualized' && (
            <div className={styles.instructionPanel}>
              <h4 className={styles.instructionTitle}>📋 Instructions</h4>
              <ol className={styles.instructionList}>
                <li>Wait 2+ seconds for baseline capture</li>
                <li>Switch to Virtualized mode</li>
                <li>Compare resource savings</li>
              </ol>
            </div>
          )}

          {state.baselineEstablished && state.mode === 'non-virtualized' && (
            <div className={styles.successPanel}>
              <h4 className={styles.successTitle}>✅ Baseline Captured!</h4>
              <p className={styles.successMessage}>
                Switch to Virtualized mode to see resource savings.
              </p>
            </div>
          )}

          {state.mode === 'virtualized' && !state.baselineMetrics && (
            <div className={styles.warningPanel}>
              <h4 className={styles.warningTitle}>⚠️ No Baseline</h4>
              <p className={styles.warningMessage}>
                Switch to Non-Virtualized mode first to establish a baseline.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};
