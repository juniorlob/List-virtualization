/**
 * ComparisonDemo component
 *
 * Displays side-by-side comparison of virtualized and non-virtualized lists
 * with real-time performance metrics to demonstrate the benefits of virtualization.
 *
 * Requirements: 5.1, 5.2, 5.3, 5.6
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { VirtualizedList } from '../../components/virtualized-list';
import { generateData } from '../utils/data-generator';
import type { DemoItem } from '../utils/data-generator';
import type { PerformanceMetrics } from '../../core/virtualization/types';
import styles from './comparison-demo.module.css';

/**
 * Default configuration for the comparison demo
 */
const DEFAULT_ITEM_COUNT = 10000;
const DEFAULT_ITEM_HEIGHT = 60;
const DEFAULT_CONTAINER_HEIGHT = 600;

/**
 * ComparisonDemo component props
 */
interface ComparisonDemoProps {
  /** Initial number of items to generate (default: 10000) */
  initialItemCount?: number;
  /** Height of each list item in pixels (default: 60) */
  itemHeight?: number;
  /** Height of the scroll container in pixels (default: 600) */
  containerHeight?: number;
}

/**
 * ComparisonDemo component
 *
 * Renders two lists side-by-side:
 * - Left: Virtualized list (efficient rendering)
 * - Right: Non-virtualized list (standard rendering)
 *
 * Displays real-time performance metrics for both lists to demonstrate
 * the performance benefits of virtualization.
 */
export function ComparisonDemo({
  initialItemCount = DEFAULT_ITEM_COUNT,
  itemHeight = DEFAULT_ITEM_HEIGHT,
  containerHeight = DEFAULT_CONTAINER_HEIGHT,
}: ComparisonDemoProps = {}) {
  // Generate test data
  const [data] = useState(() => generateData(initialItemCount));
  const [itemCount, setItemCount] = useState(initialItemCount);

  // Performance metrics for both lists
  const [virtualizedMetrics, setVirtualizedMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    memoryUsage: 0,
    domNodes: 0,
    renderTime: 0,
  });

  const [nonVirtualizedMetrics, setNonVirtualizedMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    memoryUsage: 0,
    domNodes: 0,
    renderTime: 0,
  });

  // Refs for non-virtualized list container
  const nonVirtualizedRef = useRef<HTMLDivElement>(null);

  // Handle metrics updates for virtualized list
  const handleVirtualizedMetrics = useCallback((metrics: PerformanceMetrics) => {
    setVirtualizedMetrics(metrics);
  }, []);

  // Measure performance for non-virtualized list
  useEffect(() => {
    if (!nonVirtualizedRef.current) return;

    let frameCount = 0;
    let lastTime = performance.now();
    let animationFrameId: number;

    const measurePerformance = () => {
      frameCount++;
      const currentTime = performance.now();
      const elapsed = currentTime - lastTime;

      // Update FPS every second
      if (elapsed >= 1000) {
        const fps = Math.round((frameCount * 1000) / elapsed);
        const domNodes = nonVirtualizedRef.current?.querySelectorAll('*').length || 0;
        const memoryUsage = (performance as any).memory
          ? Math.round((performance as any).memory.usedJSHeapSize / (1024 * 1024))
          : 0;

        setNonVirtualizedMetrics({
          fps,
          memoryUsage,
          domNodes,
          renderTime: 0, // Not measured for non-virtualized
        });

        frameCount = 0;
        lastTime = currentTime;
      }

      animationFrameId = requestAnimationFrame(measurePerformance);
    };

    animationFrameId = requestAnimationFrame(measurePerformance);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [data.length]);

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

  // Handle item count change
  const handleItemCountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newCount = parseInt(event.target.value, 10);
    setItemCount(newCount);
  };

  return (
    <div className={styles.comparisonDemo}>
      <header className={styles.header}>
        <h1>List Virtualization Comparison</h1>
        <p className={styles.subtitle}>
          Compare the performance of virtualized vs non-virtualized rendering
        </p>
      </header>

      <div className={styles.controls}>
        <label className={styles.controlLabel}>
          Item Count: {itemCount.toLocaleString()}
          <input
            type="range"
            min="100"
            max="50000"
            step="100"
            value={itemCount}
            onChange={handleItemCountChange}
            className={styles.slider}
          />
        </label>
      </div>

      <div className={styles.metricsOverview}>
        <div className={styles.metricsSummary}>
          <h3>Performance Comparison</h3>
          <div className={styles.comparisonStats}>
            <div className={styles.stat}>
              <span className={styles.statLabel}>DOM Nodes Difference:</span>
              <span className={styles.statValue}>
                {(nonVirtualizedMetrics.domNodes - virtualizedMetrics.domNodes).toLocaleString()}
              </span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Memory Savings:</span>
              <span className={styles.statValue}>
                {Math.max(0, nonVirtualizedMetrics.memoryUsage - virtualizedMetrics.memoryUsage)} MB
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.listsContainer}>
        {/* Virtualized List */}
        <div className={styles.listColumn}>
          <div className={styles.listHeader}>
            <h2>Virtualized List</h2>
            <span className={styles.badge}>Optimized</span>
          </div>

          <div className={styles.metricsPanel}>
            <MetricDisplay label="FPS" value={virtualizedMetrics.fps} unit="" />
            <MetricDisplay
              label="Memory"
              value={virtualizedMetrics.memoryUsage}
              unit="MB"
            />
            <MetricDisplay
              label="DOM Nodes"
              value={virtualizedMetrics.domNodes}
              unit=""
            />
            <MetricDisplay
              label="Render Time"
              value={virtualizedMetrics.renderTime.toFixed(2)}
              unit="ms"
            />
          </div>

          <VirtualizedList
            data={data.slice(0, itemCount)}
            renderItem={renderItem}
            itemHeight={itemHeight}
            containerHeight={containerHeight}
            overscan={3}
            onMetricsChange={handleVirtualizedMetrics}
            className={styles.virtualizedList}
          />
        </div>

        {/* Non-Virtualized List */}
        <div className={styles.listColumn}>
          <div className={styles.listHeader}>
            <h2>Non-Virtualized List</h2>
            <span className={styles.badge}>Standard</span>
          </div>

          <div className={styles.metricsPanel}>
            <MetricDisplay label="FPS" value={nonVirtualizedMetrics.fps} unit="" />
            <MetricDisplay
              label="Memory"
              value={nonVirtualizedMetrics.memoryUsage}
              unit="MB"
            />
            <MetricDisplay
              label="DOM Nodes"
              value={nonVirtualizedMetrics.domNodes}
              unit=""
            />
            <MetricDisplay label="Render Time" value="N/A" unit="" />
          </div>

          <div
            ref={nonVirtualizedRef}
            className={styles.nonVirtualizedList}
            style={{ height: containerHeight, overflow: 'auto' }}
          >
            {data.slice(0, itemCount).map((item, index) => (
              <div
                key={item.id}
                className={styles.listItem}
                style={{ height: itemHeight }}
              >
                {renderItem(item, index)}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.explanation}>
        <h3>What's the difference?</h3>
        <div className={styles.explanationContent}>
          <div className={styles.explanationColumn}>
            <h4>✅ Virtualized List</h4>
            <ul>
              <li>Only renders visible items</li>
              <li>Constant DOM node count</li>
              <li>Smooth scrolling at 60 FPS</li>
              <li>Low memory usage</li>
              <li>Scales to millions of items</li>
            </ul>
          </div>
          <div className={styles.explanationColumn}>
            <h4>⚠️ Non-Virtualized List</h4>
            <ul>
              <li>Renders all items at once</li>
              <li>DOM nodes = item count</li>
              <li>Laggy scrolling with large lists</li>
              <li>High memory usage</li>
              <li>Performance degrades with size</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * MetricDisplay component for showing individual metrics
 */
interface MetricDisplayProps {
  label: string;
  value: number | string;
  unit: string;
}

function MetricDisplay({ label, value, unit }: MetricDisplayProps) {
  return (
    <div className={styles.metric}>
      <span className={styles.metricLabel}>{label}</span>
      <span className={styles.metricValue}>
        {value}
        {unit && <span className={styles.metricUnit}>{unit}</span>}
      </span>
    </div>
  );
}
