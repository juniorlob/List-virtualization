/**
 * PerformanceMonitor - Adapter for Performance Web API
 *
 * This class provides real-time performance monitoring capabilities by integrating
 * with the browser's Performance API. It tracks FPS, memory usage, DOM node count,
 * and render time to help evaluate virtualization performance.
 */

import type { IPerformanceMonitor, PerformanceMetrics } from '../../core/virtualization/types';

/**
 * Default initial metrics with safe values
 */
const INITIAL_METRICS: PerformanceMetrics = {
  fps: 0,
  memoryUsage: 0,
  domNodes: 0,
  renderTime: 0,
};

/**
 * PerformanceMonitor implementation using browser Performance API
 */
export class PerformanceMonitor implements IPerformanceMonitor {
  private metrics: PerformanceMetrics = { ...INITIAL_METRICS };
  private callback: ((metrics: PerformanceMetrics) => void) | null = null;
  private rafId: number | null = null;
  private observer: PerformanceObserver | null = null;
  private frameTimestamps: number[] = [];
  private containerElement: HTMLElement | null = null;
  private isMonitoring: boolean = false;

  /**
   * Start monitoring performance metrics
   * @param callback - Function to call with updated metrics
   * @param containerElement - Optional container element for DOM node counting
   */
  startMonitoring(
    callback: (metrics: PerformanceMetrics) => void,
    containerElement?: HTMLElement
  ): void {
    if (this.isMonitoring) {
      console.warn('PerformanceMonitor: Already monitoring');
      return;
    }

    this.callback = callback;
    this.containerElement = containerElement || null;
    this.isMonitoring = true;
    this.frameTimestamps = [];

    // Initialize PerformanceObserver for render time measurements
    this.initializePerformanceObserver();

    // Start FPS tracking loop
    this.startFPSTracking();
  }

  /**
   * Stop monitoring and clean up resources
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;

    // Cancel animation frame
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    // Disconnect observer
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    // Clear references
    this.callback = null;
    this.containerElement = null;
    this.frameTimestamps = [];
  }

  /**
   * Get current performance metrics snapshot
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Initialize PerformanceObserver for tracking render measurements
   */
  private initializePerformanceObserver(): void {
    try {
      // Check if PerformanceObserver is available
      if (typeof PerformanceObserver === 'undefined') {
        console.warn('PerformanceObserver not available in this browser');
        return;
      }

      this.observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();

        for (const entry of entries) {
          // Track measure entries for render time
          if (entry.entryType === 'measure' && entry.name.includes('render')) {
            this.metrics.renderTime = entry.duration;
          }
        }
      });

      // Observe measure and paint entries
      this.observer.observe({
        entryTypes: ['measure', 'paint'],
        buffered: true
      });
    } catch (error) {
      console.warn('Failed to initialize PerformanceObserver:', error);
    }
  }

  /**
   * Start FPS tracking using requestAnimationFrame
   */
  private startFPSTracking(): void {
    const trackFrame = (timestamp: number) => {
      if (!this.isMonitoring) {
        return;
      }

      // Add current timestamp to the array
      this.frameTimestamps.push(timestamp);

      // Keep only timestamps from the last second
      const oneSecondAgo = timestamp - 1000;
      this.frameTimestamps = this.frameTimestamps.filter(t => t > oneSecondAgo);

      // Calculate FPS based on frames in the last second
      const fps = this.frameTimestamps.length;

      // Update metrics
      this.metrics.fps = fps;
      this.metrics.memoryUsage = this.getMemoryUsage();
      this.metrics.domNodes = this.getDOMNodeCount();

      // Invoke callback with updated metrics
      if (this.callback) {
        this.callback({ ...this.metrics });
      }

      // Schedule next frame
      this.rafId = requestAnimationFrame(trackFrame);
    };

    // Start the tracking loop
    this.rafId = requestAnimationFrame(trackFrame);
  }

  /**
   * Get current memory usage in megabytes
   * Falls back to 0 if performance.memory is not available
   */
  private getMemoryUsage(): number {
    try {
      // Check if performance.memory is available (Chrome only)
      const perfMemory = (performance as any).memory;

      if (perfMemory && typeof perfMemory.usedJSHeapSize === 'number') {
        // Convert bytes to megabytes
        const bytes = perfMemory.usedJSHeapSize;
        const megabytes = bytes / (1024 * 1024);
        return Math.round(megabytes * 100) / 100; // Round to 2 decimal places
      }
    } catch (error) {
      // Silently fail if memory API is not available
    }

    return 0;
  }

  /**
   * Count DOM nodes in the container element
   * Falls back to 0 if container is not set
   */
  private getDOMNodeCount(): number {
    if (!this.containerElement) {
      return 0;
    }

    try {
      // Count all descendant elements plus the container itself
      const descendants = this.containerElement.querySelectorAll('*');
      return descendants.length + 1; // +1 for the container itself
    } catch (error) {
      console.warn('Failed to count DOM nodes:', error);
      return 0;
    }
  }

  /**
   * Mark the start of a render measurement
   * @param label - Label for the measurement
   */
  markRenderStart(label: string = 'render'): void {
    try {
      performance.mark(`${label}-start`);
    } catch (error) {
      // Silently fail if Performance API is not available
    }
  }

  /**
   * Mark the end of a render measurement and calculate duration
   * @param label - Label for the measurement (must match start label)
   */
  markRenderEnd(label: string = 'render'): void {
    try {
      performance.mark(`${label}-end`);
      performance.measure(label, `${label}-start`, `${label}-end`);

      // Get the measurement
      const measures = performance.getEntriesByName(label, 'measure');
      if (measures.length > 0) {
        const lastMeasure = measures[measures.length - 1];
        this.metrics.renderTime = lastMeasure.duration;
      }

      // Clean up marks and measures
      performance.clearMarks(`${label}-start`);
      performance.clearMarks(`${label}-end`);
      performance.clearMeasures(label);
    } catch (error) {
      // Silently fail if Performance API is not available
    }
  }
}
