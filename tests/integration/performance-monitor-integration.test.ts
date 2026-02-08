/**
 * Integration tests for PerformanceMonitor
 *
 * Tests the PerformanceMonitor in realistic scenarios with actual DOM elements
 * and performance tracking over time.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { PerformanceMonitor } from '@/adapters/performance-api/performance-monitor';

import type { PerformanceMetrics } from '@/core/virtualization/types';

describe('PerformanceMonitor Integration', () => {
  let monitor: PerformanceMonitor;
  let container: HTMLDivElement;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
    container = document.createElement('div');
    container.style.height = '600px';
    container.style.overflow = 'auto';
    document.body.appendChild(container);
  });

  afterEach(() => {
    monitor.stopMonitoring();
    if (container.parentNode) {
      document.body.removeChild(container);
    }
  });

  it('should track performance metrics during simulated list rendering', async () => {
    const metricsHistory: PerformanceMetrics[] = [];

    // Start monitoring with the container
    monitor.startMonitoring((metrics) => {
      metricsHistory.push({ ...metrics });
    }, container);

    // Simulate rendering items
    monitor.markRenderStart('list-render');

    for (let i = 0; i < 100; i++) {
      const item = document.createElement('div');
      item.textContent = `Item ${i}`;
      item.style.height = '50px';
      container.appendChild(item);
    }

    monitor.markRenderEnd('list-render');

    // Wait for metrics to be collected
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify metrics were collected
    expect(metricsHistory.length).toBeGreaterThan(0);

    const latestMetrics = metricsHistory[metricsHistory.length - 1];

    // FPS should be tracked
    expect(latestMetrics.fps).toBeGreaterThanOrEqual(0);
    expect(latestMetrics.fps).toBeLessThanOrEqual(240);

    // DOM nodes should reflect the rendered items
    // Container (1) + 100 items = 101 nodes
    expect(latestMetrics.domNodes).toBe(101);

    // Memory usage should be non-negative
    expect(latestMetrics.memoryUsage).toBeGreaterThanOrEqual(0);

    // Render time should be measured
    expect(latestMetrics.renderTime).toBeGreaterThanOrEqual(0);
  });

  it('should track metrics during scroll simulation', async () => {
    // Add many items to enable scrolling
    for (let i = 0; i < 1000; i++) {
      const item = document.createElement('div');
      item.textContent = `Item ${i}`;
      item.style.height = '50px';
      container.appendChild(item);
    }

    const metricsHistory: PerformanceMetrics[] = [];

    monitor.startMonitoring((metrics) => {
      metricsHistory.push({ ...metrics });
    }, container);

    // Simulate scroll events
    for (let i = 0; i < 10; i++) {
      container.scrollTop = i * 100;
      await new Promise(resolve => setTimeout(resolve, 16)); // ~60fps
    }

    // Wait for final metrics
    await new Promise(resolve => setTimeout(resolve, 100));

    // Should have collected multiple metric snapshots
    expect(metricsHistory.length).toBeGreaterThan(5);

    // All metrics should be valid
    metricsHistory.forEach(metrics => {
      expect(metrics.fps).toBeGreaterThanOrEqual(0);
      expect(metrics.memoryUsage).toBeGreaterThanOrEqual(0);
      expect(metrics.domNodes).toBeGreaterThan(0);
      expect(metrics.renderTime).toBeGreaterThanOrEqual(0);

      expect(Number.isFinite(metrics.fps)).toBe(true);
      expect(Number.isFinite(metrics.memoryUsage)).toBe(true);
      expect(Number.isFinite(metrics.domNodes)).toBe(true);
      expect(Number.isFinite(metrics.renderTime)).toBe(true);
    });
  });

  it('should handle dynamic DOM changes', async () => {
    const metricsHistory: PerformanceMetrics[] = [];

    monitor.startMonitoring((metrics) => {
      metricsHistory.push({ ...metrics });
    }, container);

    // Start with few items
    for (let i = 0; i < 10; i++) {
      const item = document.createElement('div');
      item.textContent = `Item ${i}`;
      container.appendChild(item);
    }

    await new Promise(resolve => setTimeout(resolve, 50));

    const domNodesAfterFirstRender = metricsHistory[metricsHistory.length - 1]?.domNodes || 0;

    // Add more items
    for (let i = 10; i < 50; i++) {
      const item = document.createElement('div');
      item.textContent = `Item ${i}`;
      container.appendChild(item);
    }

    await new Promise(resolve => setTimeout(resolve, 50));

    const domNodesAfterSecondRender = metricsHistory[metricsHistory.length - 1]?.domNodes || 0;

    // DOM node count should increase
    expect(domNodesAfterSecondRender).toBeGreaterThan(domNodesAfterFirstRender);
  });

  it('should measure render time accurately', async () => {
    let capturedMetrics: PerformanceMetrics | null = null;

    monitor.startMonitoring((metrics) => {
      capturedMetrics = metrics;
    }, container);

    // Perform a measured render
    monitor.markRenderStart('test-render');

    // Simulate some rendering work
    for (let i = 0; i < 50; i++) {
      const item = document.createElement('div');
      item.textContent = `Item ${i}`;
      container.appendChild(item);
    }

    monitor.markRenderEnd('test-render');

    await new Promise(resolve => setTimeout(resolve, 50));

    // Render time should be captured
    expect(capturedMetrics).not.toBeNull();
    expect(capturedMetrics!.renderTime).toBeGreaterThanOrEqual(0);
    expect(capturedMetrics!.renderTime).toBeLessThan(1000); // Should be fast
  });

  it('should continue working after container is modified', async () => {
    const metricsHistory: PerformanceMetrics[] = [];

    monitor.startMonitoring((metrics) => {
      metricsHistory.push({ ...metrics });
    }, container);

    // Add items
    container.innerHTML = '<div>Item 1</div><div>Item 2</div>';

    await new Promise(resolve => setTimeout(resolve, 50));

    // Clear and add different items
    container.innerHTML = '<div>New 1</div><div>New 2</div><div>New 3</div>';

    await new Promise(resolve => setTimeout(resolve, 50));

    // Should still be collecting metrics
    expect(metricsHistory.length).toBeGreaterThan(0);

    const latestMetrics = metricsHistory[metricsHistory.length - 1];
    expect(latestMetrics.domNodes).toBe(4); // container + 3 items
  });

  it('should handle cleanup properly in realistic scenario', async () => {
    let callbackCount = 0;

    monitor.startMonitoring(() => {
      callbackCount++;
    }, container);

    // Add items and wait
    for (let i = 0; i < 20; i++) {
      const item = document.createElement('div');
      container.appendChild(item);
    }

    await new Promise(resolve => setTimeout(resolve, 100));

    const countBeforeStop = callbackCount;

    // Stop monitoring
    monitor.stopMonitoring();

    await new Promise(resolve => setTimeout(resolve, 100));

    // Callback should not be called after stopping
    expect(callbackCount).toBe(countBeforeStop);
  });
});
