/**
 * InteractiveDemo component
 *
 * Displays a single virtualized list with interactive controls for
 * item count, overscan, and performance monitoring.
 *
 * Requirements: 5.3, 5.7
 */

import { useState, useCallback, useMemo } from 'react';
import { VirtualizedList } from '../../components/virtualized-list';
import { generateData } from '../utils/data-generator';
import type { DemoItem } from '../utils/data-generator';
import type { PerformanceMetrics } from '../../core/virtualization/types';
import styles from './interactive-demo.module.css';

/**
 * Default configuration for the interactive demo
 */
const DEFAULT_ITEM_COUNT = 5000;
const DEFAULT_ITEM_HEIGHT = 60;
const DEFAULT_CONTAINER_HEIGHT = 600;
const DEFAULT_OVERSCAN = 3;

/**
 * InteractiveDemo component props
 */
interface InteractiveDemoProps {
  /** Initial number of items to generate (default: 5000) */
  initialItemCount?: number;
  /** Height of each list item in pixels (default: 60) */
  itemHeight?: number;
  /** Height of the scroll container in pixels (default: 600) */
  containerHeight?: number;
  /** Initial overscan value (default: 3) */
  initialOverscan?: number;
}

/**
 * InteractiveDemo component
 *
 * Renders a single virtualized list with interactive controls:
 * - Item count slider (100 to 50,000)
 * - Overscan slider (0 to 10)
 * - Performance monitoring toggle
 * - Real-time metrics display
 */
export function InteractiveDemo({
  initialItemCount = DEFAULT_ITEM_COUNT,
  itemHeight = DEFAULT_ITEM_HEIGHT,
  containerHeight = DEFAULT_CONTAINER_HEIGHT,
  initialOverscan = DEFAULT_OVERSCAN,
}: InteractiveDemoProps = {}) {
  // Control states
  const [itemCount, setItemCount] = useState(initialItemCount);
  const [overscan, setOverscan] = useState(initialOverscan);
  const [performanceMonitoringEnabled, setPerformanceMonitoringEnabled] = useState(true);

  // Performance metrics
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    memoryUsage: 0,
    domNodes: 0,
    renderTime: 0,
  });

  // Generate data based on current item count
  // Memoize to avoid regenerating on every render
  const data = useMemo(() => generateData(itemCount), [itemCount]);

  // Handle metrics updates
  const handleMetricsChange = useCallback((newMetrics: PerformanceMetrics) => {
    if (performanceMonitoringEnabled) {
      setMetrics(newMetrics);
    }
  }, [performanceMonitoringEnabled]);

  // Handle item count change
  const handleItemCountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newCount = parseInt(event.target.value, 10);
    setItemCount(newCount);
  };

  // Handle overscan change
  const handleOverscanChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newOverscan = parseInt(event.target.value, 10);
    setOverscan(newOverscan);
  };

  // Handle performance monitoring toggle
  const handlePerformanceToggle = () => {
    setPerformanceMonitoringEnabled(!performanceMonitoringEnabled);
  };

  // Render function for list items
  const renderItem = useCallback((item: DemoItem, _index: number) => {
    return (
      <div className={styles.listItemContent}>
        <div className={styles.itemHeader}>
          <span className={styles.itemName}>{item.name}</span>
          <span className={styles.itemCategory}>{item.metadata?.category}</span>
        </div>
        <div className={styles.itemDescription}>{item.description}</div>
        <div className={styles.itemFooter}>
          <span className={styles.itemId}>ID: {item.id}</span>
          <span className={styles.itemPriority}>
            Priority: {item.metadata?.priority}
          </span>
        </div>
      </div>
    );
  }, []);

  return (
    <div className={styles.interactiveDemo}>
      <header className={styles.header}>
        <h1>Interactive Virtualization Demo</h1>
        <p className={styles.subtitle}>
          Experiment with different configurations and see real-time performance metrics
        </p>
      </header>

      {/* Controls Panel */}
      <div className={styles.controlsPanel}>
        <h2 className={styles.controlsTitle}>Configuration</h2>

        <div className={styles.controls}>
          {/* Item Count Control */}
          <div className={styles.control}>
            <label className={styles.controlLabel}>
              <span className={styles.labelText}>Item Count</span>
              <span className={styles.labelValue}>{itemCount.toLocaleString()}</span>
            </label>
            <input
              type="range"
              min="100"
              max="50000"
              step="100"
              value={itemCount}
              onChange={handleItemCountChange}
              className={styles.slider}
              aria-label="Item count"
            />
            <div className={styles.sliderLabels}>
              <span>100</span>
              <span>50,000</span>
            </div>
          </div>

          {/* Overscan Control */}
          <div className={styles.control}>
            <label className={styles.controlLabel}>
              <span className={styles.labelText}>Overscan</span>
              <span className={styles.labelValue}>{overscan}</span>
            </label>
            <input
              type="range"
              min="0"
              max="10"
              step="1"
              value={overscan}
              onChange={handleOverscanChange}
              className={styles.slider}
              aria-label="Overscan value"
            />
            <div className={styles.sliderLabels}>
              <span>0</span>
              <span>10</span>
            </div>
            <p className={styles.controlDescription}>
              Number of extra items rendered above and below the viewport
            </p>
          </div>

          {/* Performance Monitoring Toggle */}
          <div className={styles.control}>
            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={performanceMonitoringEnabled}
                onChange={handlePerformanceToggle}
                className={styles.checkbox}
                aria-label="Enable performance monitoring"
              />
              <span className={styles.toggleText}>Enable Performance Monitoring</span>
            </label>
            <p className={styles.controlDescription}>
              Track FPS, memory usage, DOM nodes, and render time
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Display */}
      {performanceMonitoringEnabled && (
        <div className={styles.metricsPanel}>
          <h2 className={styles.metricsTitle}>Performance Metrics</h2>
          <div className={styles.metricsGrid}>
            <MetricCard
              label="Frames Per Second"
              value={metrics.fps}
              unit="FPS"
              description="Higher is better (target: 60 FPS)"
              status={getMetricStatus(metrics.fps, 60, 30)}
            />
            <MetricCard
              label="Memory Usage"
              value={metrics.memoryUsage}
              unit="MB"
              description="JavaScript heap size"
              status={getMetricStatus(metrics.memoryUsage, 50, 100, true)}
            />
            <MetricCard
              label="DOM Nodes"
              value={metrics.domNodes}
              unit="nodes"
              description="Number of rendered elements"
              status={getMetricStatus(metrics.domNodes, 100, 500, true)}
            />
            <MetricCard
              label="Render Time"
              value={metrics.renderTime.toFixed(2)}
              unit="ms"
              description="Time to render visible items"
              status={getMetricStatus(metrics.renderTime, 16, 33, true)}
            />
          </div>
        </div>
      )}

      {/* Virtualized List */}
      <div className={styles.listContainer}>
        <div className={styles.listHeader}>
          <h2>Virtualized List</h2>
          <span className={styles.badge}>
            {itemCount.toLocaleString()} items
          </span>
        </div>

        <VirtualizedList
          data={data}
          renderItem={renderItem}
          itemHeight={itemHeight}
          containerHeight={containerHeight}
          overscan={overscan}
          onMetricsChange={handleMetricsChange}
          className={styles.virtualizedList}
        />
      </div>

      {/* Information Panel */}
      <div className={styles.infoPanel}>
        <h3>About Virtualization</h3>
        <div className={styles.infoContent}>
          <div className={styles.infoSection}>
            <h4>What is List Virtualization?</h4>
            <p>
              List virtualization is a technique that renders only the items visible in the
              viewport, plus a small buffer (overscan). This dramatically reduces the number
              of DOM nodes and improves performance for large datasets.
            </p>
          </div>

          <div className={styles.infoSection}>
            <h4>Key Benefits</h4>
            <ul>
              <li>
                <strong>Constant Performance:</strong> Rendering time stays consistent
                regardless of list size
              </li>
              <li>
                <strong>Low Memory Usage:</strong> Only visible items consume memory
              </li>
              <li>
                <strong>Smooth Scrolling:</strong> Maintains 60 FPS even with thousands of items
              </li>
              <li>
                <strong>Scalability:</strong> Can handle millions of items efficiently
              </li>
            </ul>
          </div>

          <div className={styles.infoSection}>
            <h4>Understanding Overscan</h4>
            <p>
              Overscan determines how many extra items are rendered above and below the
              visible viewport. A higher overscan value:
            </p>
            <ul>
              <li>Reduces blank spaces during fast scrolling</li>
              <li>Increases the number of rendered DOM nodes</li>
              <li>Uses slightly more memory</li>
            </ul>
            <p>
              The optimal overscan value depends on your use case. For most applications,
              a value between 3-5 provides a good balance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * MetricCard component for displaying individual metrics
 */
interface MetricCardProps {
  label: string;
  value: number | string;
  unit: string;
  description: string;
  status: 'good' | 'warning' | 'poor';
}

function MetricCard({ label, value, unit, description, status }: MetricCardProps) {
  return (
    <div className={`${styles.metricCard} ${styles[`metricCard--${status}`]}`}>
      <div className={styles.metricHeader}>
        <span className={styles.metricLabel}>{label}</span>
        <span className={`${styles.statusIndicator} ${styles[`statusIndicator--${status}`]}`} />
      </div>
      <div className={styles.metricValue}>
        {value}
        <span className={styles.metricUnit}>{unit}</span>
      </div>
      <p className={styles.metricDescription}>{description}</p>
    </div>
  );
}

/**
 * Helper function to determine metric status
 * @param value - Current metric value
 * @param goodThreshold - Threshold for good performance
 * @param poorThreshold - Threshold for poor performance
 * @param inverse - If true, lower values are better
 */
function getMetricStatus(
  value: number,
  goodThreshold: number,
  poorThreshold: number,
  inverse: boolean = false
): 'good' | 'warning' | 'poor' {
  if (value === 0) return 'poor'; // No data yet

  if (inverse) {
    // Lower is better (e.g., memory, DOM nodes, render time)
    if (value <= goodThreshold) return 'good';
    if (value <= poorThreshold) return 'warning';
    return 'poor';
  } else {
    // Higher is better (e.g., FPS)
    if (value >= goodThreshold) return 'good';
    if (value >= poorThreshold) return 'warning';
    return 'poor';
  }
}
