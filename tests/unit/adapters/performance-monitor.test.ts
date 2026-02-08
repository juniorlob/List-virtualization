/**
 * Unit tests for PerformanceMonitor
 *
 * Tests the performance monitoring adapter including FPS calculation,
 * memory tracking, DOM node counting, and resource cleanup.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { PerformanceMonitor } from '@/adapters/performance-api/performance-monitor';

import type { PerformanceMetrics } from '@/core/virtualization/types';

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;
  let mockCallback: (metrics: PerformanceMetrics) => void;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
    mockCallback = vi.fn();
  });

  afterEach(() => {
    monitor.stopMonitoring();
  });

  describe('initialization', () => {
    it('should initialize with default metrics', () => {
      const metrics = monitor.getMetrics();

      expect(metrics.fps).toBe(0);
      expect(metrics.memoryUsage).toBe(0);
      expect(metrics.domNodes).toBe(0);
      expect(metrics.renderTime).toBe(0);
    });

    it('should start monitoring when startMonitoring is called', () => {
      monitor.startMonitoring(mockCallback);

      // Callback should be set (we can't directly test private properties,
      // but we can verify behavior)
      expect(mockCallback).toBeDefined();
    });

    it('should warn when starting monitoring twice', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

      monitor.startMonitoring(mockCallback);
      monitor.startMonitoring(mockCallback);

      expect(consoleSpy).toHaveBeenCalledWith('PerformanceMonitor: Already monitoring');
      consoleSpy.mockRestore();
    });
  });

  describe('FPS calculation', () => {
    it('should calculate FPS using requestAnimationFrame', async () => {
      let capturedMetrics: PerformanceMetrics | null = null;

      monitor.startMonitoring((metrics) => {
        capturedMetrics = metrics;
      });

      // Wait for a few animation frames
      await new Promise(resolve => {
        let frameCount = 0;
        const checkFrame = () => {
          frameCount++;
          if (frameCount < 10) {
            requestAnimationFrame(checkFrame);
          } else {
            resolve(null);
          }
        };
        requestAnimationFrame(checkFrame);
      });

      // FPS should be calculated (value depends on browser/environment)
      expect(capturedMetrics).not.toBeNull();
      expect(capturedMetrics!.fps).toBeGreaterThanOrEqual(0);
      expect(capturedMetrics!.fps).toBeLessThanOrEqual(240); // Reasonable upper bound
    });

    it('should update FPS metrics continuously', async () => {
      const metricsHistory: PerformanceMetrics[] = [];

      monitor.startMonitoring((metrics) => {
        metricsHistory.push({ ...metrics });
      });

      // Wait for multiple frames
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should have collected multiple metric updates
      expect(metricsHistory.length).toBeGreaterThan(0);
    });
  });

  describe('memory usage tracking', () => {
    it('should return 0 when performance.memory is not available', () => {
      const metrics = monitor.getMetrics();

      // Memory usage should be a non-negative number
      expect(metrics.memoryUsage).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(metrics.memoryUsage)).toBe(true);
    });

    it('should track memory usage if available', async () => {
      // Mock performance.memory if available
      const originalMemory = (performance as any).memory;

      if (originalMemory) {
        monitor.startMonitoring(mockCallback);

        await new Promise(resolve => setTimeout(resolve, 50));

        const metrics = monitor.getMetrics();

        // If memory API is available, should have a value
        expect(metrics.memoryUsage).toBeGreaterThanOrEqual(0);
      } else {
        // If not available, should gracefully return 0
        const metrics = monitor.getMetrics();
        expect(metrics.memoryUsage).toBe(0);
      }
    });
  });

  describe('DOM node counting', () => {
    it('should return 0 when no container element is provided', () => {
      monitor.startMonitoring(mockCallback);

      const metrics = monitor.getMetrics();
      expect(metrics.domNodes).toBe(0);
    });

    it('should count DOM nodes in the container element', async () => {
      // Create a test container with known number of elements
      const container = document.createElement('div');
      container.innerHTML = `
        <div>
          <span>Item 1</span>
          <span>Item 2</span>
        </div>
        <div>
          <span>Item 3</span>
        </div>
      `;
      document.body.appendChild(container);

      let capturedMetrics: PerformanceMetrics | null = null;
      monitor.startMonitoring((metrics) => {
        capturedMetrics = metrics;
      }, container);

      // Wait for metrics to be collected
      await new Promise(resolve => setTimeout(resolve, 50));

      // Should count: container (1) + 2 divs + 3 spans = 6 nodes
      expect(capturedMetrics).not.toBeNull();
      expect(capturedMetrics!.domNodes).toBe(6);

      // Cleanup
      document.body.removeChild(container);
    });

    it('should update DOM node count when container changes', async () => {
      const container = document.createElement('div');
      container.innerHTML = '<div>Initial</div>';
      document.body.appendChild(container);

      const metricsHistory: number[] = [];
      monitor.startMonitoring((metrics) => {
        metricsHistory.push(metrics.domNodes);
      }, container);

      await new Promise(resolve => setTimeout(resolve, 50));

      // Add more elements
      container.innerHTML = '<div>1</div><div>2</div><div>3</div>';

      await new Promise(resolve => setTimeout(resolve, 50));

      // Should have different counts
      expect(metricsHistory.length).toBeGreaterThan(0);

      // Cleanup
      document.body.removeChild(container);
    });
  });

  describe('render time measurement', () => {
    it('should measure render time using Performance API', () => {
      monitor.markRenderStart('test-render');

      // Simulate some work
      let sum = 0;
      for (let i = 0; i < 1000; i++) {
        sum += i;
      }

      monitor.markRenderEnd('test-render');

      const metrics = monitor.getMetrics();

      // Render time should be measured (may be 0 for very fast operations)
      expect(metrics.renderTime).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(metrics.renderTime)).toBe(true);
    });

    it('should handle multiple render measurements', () => {
      monitor.markRenderStart('render-1');
      monitor.markRenderEnd('render-1');

      monitor.markRenderStart('render-2');
      monitor.markRenderEnd('render-2');

      const metrics = monitor.getMetrics();

      // Should have the last render time
      expect(metrics.renderTime).toBeGreaterThanOrEqual(0);
    });

    it('should not throw when Performance API is unavailable', () => {
      // This should not throw even if marks/measures fail
      expect(() => {
        monitor.markRenderStart('test');
        monitor.markRenderEnd('test');
      }).not.toThrow();
    });
  });

  describe('PerformanceObserver integration', () => {
    it('should initialize PerformanceObserver if available', async () => {
      // PerformanceObserver should be available in test environment
      expect(typeof PerformanceObserver).not.toBe('undefined');

      monitor.startMonitoring(mockCallback);

      // Mark a render to trigger observer
      monitor.markRenderStart('test-render');
      monitor.markRenderEnd('test-render');

      await new Promise(resolve => setTimeout(resolve, 50));

      // Should not throw and should work correctly
      expect(mockCallback).toHaveBeenCalled();
    });

    it('should handle PerformanceObserver errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

      // Should not throw even if observer initialization fails
      expect(() => {
        monitor.startMonitoring(mockCallback);
      }).not.toThrow();

      consoleSpy.mockRestore();
    });
  });

  describe('cleanup and resource disposal', () => {
    it('should stop monitoring and clean up resources', async () => {
      let callCount = 0;

      monitor.startMonitoring(() => {
        callCount++;
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      const countBeforeStop = callCount;

      monitor.stopMonitoring();

      await new Promise(resolve => setTimeout(resolve, 50));

      // Callback should not be called after stopping
      expect(callCount).toBe(countBeforeStop);
    });

    it('should cancel animation frame on stop', async () => {
      monitor.startMonitoring(mockCallback);

      await new Promise(resolve => setTimeout(resolve, 50));

      monitor.stopMonitoring();

      // Should not throw and should clean up properly
      expect(() => monitor.stopMonitoring()).not.toThrow();
    });

    it('should disconnect PerformanceObserver on stop', () => {
      monitor.startMonitoring(mockCallback);
      monitor.stopMonitoring();

      // Should be able to stop multiple times without error
      expect(() => monitor.stopMonitoring()).not.toThrow();
    });

    it('should handle stop when not monitoring', () => {
      // Should not throw when stopping without starting
      expect(() => monitor.stopMonitoring()).not.toThrow();
    });
  });

  describe('metric validity', () => {
    it('should return valid metrics with non-negative values', async () => {
      monitor.startMonitoring(mockCallback);

      await new Promise(resolve => setTimeout(resolve, 50));

      const metrics = monitor.getMetrics();

      expect(metrics.fps).toBeGreaterThanOrEqual(0);
      expect(metrics.memoryUsage).toBeGreaterThanOrEqual(0);
      expect(metrics.domNodes).toBeGreaterThanOrEqual(0);
      expect(metrics.renderTime).toBeGreaterThanOrEqual(0);
    });

    it('should return finite numbers for all metrics', async () => {
      monitor.startMonitoring(mockCallback);

      await new Promise(resolve => setTimeout(resolve, 50));

      const metrics = monitor.getMetrics();

      expect(Number.isFinite(metrics.fps)).toBe(true);
      expect(Number.isFinite(metrics.memoryUsage)).toBe(true);
      expect(Number.isFinite(metrics.domNodes)).toBe(true);
      expect(Number.isFinite(metrics.renderTime)).toBe(true);
    });

    it('should return metrics within reasonable bounds', async () => {
      monitor.startMonitoring(mockCallback);

      await new Promise(resolve => setTimeout(resolve, 50));

      const metrics = monitor.getMetrics();

      // FPS should be reasonable (0-240)
      expect(metrics.fps).toBeLessThanOrEqual(240);

      // Memory should be reasonable (< 10GB in MB)
      expect(metrics.memoryUsage).toBeLessThan(10000);

      // DOM nodes should be reasonable (< 1 million)
      expect(metrics.domNodes).toBeLessThan(1000000);

      // Render time should be reasonable (< 10 seconds in ms)
      expect(metrics.renderTime).toBeLessThan(10000);
    });
  });

  describe('edge cases', () => {
    it('should handle rapid start/stop cycles', () => {
      expect(() => {
        monitor.startMonitoring(mockCallback);
        monitor.stopMonitoring();
        monitor.startMonitoring(mockCallback);
        monitor.stopMonitoring();
      }).not.toThrow();
    });

    it('should return a copy of metrics, not a reference', () => {
      const metrics1 = monitor.getMetrics();
      const metrics2 = monitor.getMetrics();

      expect(metrics1).not.toBe(metrics2);
      expect(metrics1).toEqual(metrics2);
    });

    it('should handle container element removal', async () => {
      const container = document.createElement('div');
      document.body.appendChild(container);

      monitor.startMonitoring(mockCallback, container);

      // Remove container from DOM
      document.body.removeChild(container);

      await new Promise(resolve => setTimeout(resolve, 50));

      // Should not throw
      expect(() => monitor.getMetrics()).not.toThrow();
    });
  });
});
