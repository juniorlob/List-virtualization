/**
 * Unit tests for baseline validation and invalidation logic
 *
 * Tests the shouldInvalidateBaseline and averageMetrics functions
 * to ensure correct behavior for baseline management.
 *
 * Requirements: 8.1, 8.3
 */

import { describe, it, expect } from 'vitest';
import { shouldInvalidateBaseline, averageMetrics } from './baseline-validator';
import type { PerformanceMetrics, DemoConfig } from '@/demo/pages/unified-demo-types';

describe('shouldInvalidateBaseline', () => {
  describe('baseline invalidation conditions', () => {
    it('should return false when baselineConfig is null', () => {
      const currentConfig: DemoConfig = {
        datasetSize: 10000,
        itemHeight: 50,
        overscan: 3
      };

      const result = shouldInvalidateBaseline(currentConfig, null);

      expect(result).toBe(false);
    });

    it('should return true when dataset size changes', () => {
      const currentConfig: DemoConfig = {
        datasetSize: 20000,
        itemHeight: 50,
        overscan: 3
      };

      const baselineConfig = {
        datasetSize: 10000,
        itemHeight: 50
      };

      const result = shouldInvalidateBaseline(currentConfig, baselineConfig);

      expect(result).toBe(true);
    });

    it('should return true when item height changes', () => {
      const currentConfig: DemoConfig = {
        datasetSize: 10000,
        itemHeight: 100,
        overscan: 3
      };

      const baselineConfig = {
        datasetSize: 10000,
        itemHeight: 50
      };

      const result = shouldInvalidateBaseline(currentConfig, baselineConfig);

      expect(result).toBe(true);
    });

    it('should return true when both dataset size and item height change', () => {
      const currentConfig: DemoConfig = {
        datasetSize: 20000,
        itemHeight: 100,
        overscan: 3
      };

      const baselineConfig = {
        datasetSize: 10000,
        itemHeight: 50
      };

      const result = shouldInvalidateBaseline(currentConfig, baselineConfig);

      expect(result).toBe(true);
    });

    it('should return false when only overscan changes', () => {
      const currentConfig: DemoConfig = {
        datasetSize: 10000,
        itemHeight: 50,
        overscan: 5
      };

      const baselineConfig = {
        datasetSize: 10000,
        itemHeight: 50
      };

      const result = shouldInvalidateBaseline(currentConfig, baselineConfig);

      expect(result).toBe(false);
    });

    it('should return false when configuration is identical', () => {
      const currentConfig: DemoConfig = {
        datasetSize: 10000,
        itemHeight: 50,
        overscan: 3
      };

      const baselineConfig = {
        datasetSize: 10000,
        itemHeight: 50
      };

      const result = shouldInvalidateBaseline(currentConfig, baselineConfig);

      expect(result).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle zero values correctly', () => {
      const currentConfig: DemoConfig = {
        datasetSize: 0,
        itemHeight: 0,
        overscan: 0
      };

      const baselineConfig = {
        datasetSize: 0,
        itemHeight: 0
      };

      const result = shouldInvalidateBaseline(currentConfig, baselineConfig);

      expect(result).toBe(false);
    });

    it('should handle very large values correctly', () => {
      const currentConfig: DemoConfig = {
        datasetSize: 100000,
        itemHeight: 200,
        overscan: 10
      };

      const baselineConfig = {
        datasetSize: 100000,
        itemHeight: 200
      };

      const result = shouldInvalidateBaseline(currentConfig, baselineConfig);

      expect(result).toBe(false);
    });

    it('should detect small changes in dataset size', () => {
      const currentConfig: DemoConfig = {
        datasetSize: 10001,
        itemHeight: 50,
        overscan: 3
      };

      const baselineConfig = {
        datasetSize: 10000,
        itemHeight: 50
      };

      const result = shouldInvalidateBaseline(currentConfig, baselineConfig);

      expect(result).toBe(true);
    });

    it('should detect small changes in item height', () => {
      const currentConfig: DemoConfig = {
        datasetSize: 10000,
        itemHeight: 51,
        overscan: 3
      };

      const baselineConfig = {
        datasetSize: 10000,
        itemHeight: 50
      };

      const result = shouldInvalidateBaseline(currentConfig, baselineConfig);

      expect(result).toBe(true);
    });
  });
});

describe('averageMetrics', () => {
  describe('averaging calculations', () => {
    it('should return zero metrics for empty array', () => {
      const result = averageMetrics([]);

      expect(result.fps).toBe(0);
      expect(result.memoryUsageMB).toBe(0);
      expect(result.domNodeCount).toBe(0);
      expect(result.renderTimeMs).toBe(0);
      expect(result.timestamp).toBeGreaterThan(0);
    });

    it('should return the same metrics for single element array', () => {
      const metrics: PerformanceMetrics = {
        fps: 60,
        memoryUsageMB: 100,
        domNodeCount: 10000,
        renderTimeMs: 50,
        timestamp: 1000
      };

      const result = averageMetrics([metrics]);

      expect(result).toEqual(metrics);
    });

    it('should calculate correct average for two metrics', () => {
      const metrics: PerformanceMetrics[] = [
        {
          fps: 58,
          memoryUsageMB: 100,
          domNodeCount: 10000,
          renderTimeMs: 50,
          timestamp: 1000
        },
        {
          fps: 60,
          memoryUsageMB: 102,
          domNodeCount: 10000,
          renderTimeMs: 48,
          timestamp: 2000
        }
      ];

      const result = averageMetrics(metrics);

      expect(result.fps).toBe(59);
      expect(result.memoryUsageMB).toBe(101);
      expect(result.domNodeCount).toBe(10000);
      expect(result.renderTimeMs).toBe(49);
      expect(result.timestamp).toBe(2000); // Most recent timestamp
    });

    it('should calculate correct average for multiple metrics', () => {
      const metrics: PerformanceMetrics[] = [
        {
          fps: 60,
          memoryUsageMB: 100,
          domNodeCount: 10000,
          renderTimeMs: 50,
          timestamp: 1000
        },
        {
          fps: 58,
          memoryUsageMB: 102,
          domNodeCount: 10100,
          renderTimeMs: 52,
          timestamp: 2000
        },
        {
          fps: 59,
          memoryUsageMB: 101,
          domNodeCount: 10050,
          renderTimeMs: 51,
          timestamp: 3000
        }
      ];

      const result = averageMetrics(metrics);

      expect(result.fps).toBeCloseTo(59, 2);
      expect(result.memoryUsageMB).toBeCloseTo(101, 2);
      expect(result.domNodeCount).toBe(10050); // Rounded average
      expect(result.renderTimeMs).toBeCloseTo(51, 2);
      expect(result.timestamp).toBe(3000); // Most recent timestamp
    });

    it('should round DOM node count to nearest integer', () => {
      const metrics: PerformanceMetrics[] = [
        {
          fps: 60,
          memoryUsageMB: 100,
          domNodeCount: 10000,
          renderTimeMs: 50,
          timestamp: 1000
        },
        {
          fps: 60,
          memoryUsageMB: 100,
          domNodeCount: 10001,
          renderTimeMs: 50,
          timestamp: 2000
        }
      ];

      const result = averageMetrics(metrics);

      // Average is 10000.5, should round to 10001
      expect(result.domNodeCount).toBe(10001);
      expect(Number.isInteger(result.domNodeCount)).toBe(true);
    });

    it('should use the most recent timestamp', () => {
      const metrics: PerformanceMetrics[] = [
        {
          fps: 60,
          memoryUsageMB: 100,
          domNodeCount: 10000,
          renderTimeMs: 50,
          timestamp: 1000
        },
        {
          fps: 60,
          memoryUsageMB: 100,
          domNodeCount: 10000,
          renderTimeMs: 50,
          timestamp: 5000
        },
        {
          fps: 60,
          memoryUsageMB: 100,
          domNodeCount: 10000,
          renderTimeMs: 50,
          timestamp: 3000
        }
      ];

      const result = averageMetrics(metrics);

      // Should use the last timestamp in the array
      expect(result.timestamp).toBe(3000);
    });
  });

  describe('edge cases', () => {
    it('should handle metrics with zero values', () => {
      const metrics: PerformanceMetrics[] = [
        {
          fps: 0,
          memoryUsageMB: 0,
          domNodeCount: 0,
          renderTimeMs: 0,
          timestamp: 1000
        },
        {
          fps: 0,
          memoryUsageMB: 0,
          domNodeCount: 0,
          renderTimeMs: 0,
          timestamp: 2000
        }
      ];

      const result = averageMetrics(metrics);

      expect(result.fps).toBe(0);
      expect(result.memoryUsageMB).toBe(0);
      expect(result.domNodeCount).toBe(0);
      expect(result.renderTimeMs).toBe(0);
    });

    it('should handle metrics with very large values', () => {
      const metrics: PerformanceMetrics[] = [
        {
          fps: 60,
          memoryUsageMB: 1000,
          domNodeCount: 100000,
          renderTimeMs: 1000,
          timestamp: 1000
        },
        {
          fps: 60,
          memoryUsageMB: 1000,
          domNodeCount: 100000,
          renderTimeMs: 1000,
          timestamp: 2000
        }
      ];

      const result = averageMetrics(metrics);

      expect(result.fps).toBe(60);
      expect(result.memoryUsageMB).toBe(1000);
      expect(result.domNodeCount).toBe(100000);
      expect(result.renderTimeMs).toBe(1000);
    });

    it('should handle metrics with decimal values', () => {
      const metrics: PerformanceMetrics[] = [
        {
          fps: 59.5,
          memoryUsageMB: 100.25,
          domNodeCount: 10000,
          renderTimeMs: 50.75,
          timestamp: 1000
        },
        {
          fps: 60.5,
          memoryUsageMB: 101.75,
          domNodeCount: 10000,
          renderTimeMs: 49.25,
          timestamp: 2000
        }
      ];

      const result = averageMetrics(metrics);

      expect(result.fps).toBe(60);
      expect(result.memoryUsageMB).toBe(101);
      expect(result.domNodeCount).toBe(10000);
      expect(result.renderTimeMs).toBe(50);
    });

    it('should handle varying metrics values', () => {
      const metrics: PerformanceMetrics[] = [
        {
          fps: 30,
          memoryUsageMB: 50,
          domNodeCount: 5000,
          renderTimeMs: 100,
          timestamp: 1000
        },
        {
          fps: 60,
          memoryUsageMB: 150,
          domNodeCount: 15000,
          renderTimeMs: 10,
          timestamp: 2000
        }
      ];

      const result = averageMetrics(metrics);

      expect(result.fps).toBe(45);
      expect(result.memoryUsageMB).toBe(100);
      expect(result.domNodeCount).toBe(10000);
      expect(result.renderTimeMs).toBe(55);
    });
  });

  describe('realistic baseline capture scenarios', () => {
    it('should average 2 seconds of metrics (2 samples at 1 sample/second)', () => {
      const metrics: PerformanceMetrics[] = [
        {
          fps: 59,
          memoryUsageMB: 98,
          domNodeCount: 10000,
          renderTimeMs: 51,
          timestamp: Date.now()
        },
        {
          fps: 61,
          memoryUsageMB: 102,
          domNodeCount: 10000,
          renderTimeMs: 49,
          timestamp: Date.now() + 1000
        }
      ];

      const result = averageMetrics(metrics);

      expect(result.fps).toBe(60);
      expect(result.memoryUsageMB).toBe(100);
      expect(result.domNodeCount).toBe(10000);
      expect(result.renderTimeMs).toBe(50);
    });

    it('should handle metrics with slight variations (stable performance)', () => {
      const metrics: PerformanceMetrics[] = [
        {
          fps: 59.8,
          memoryUsageMB: 99.5,
          domNodeCount: 10000,
          renderTimeMs: 50.2,
          timestamp: 1000
        },
        {
          fps: 60.1,
          memoryUsageMB: 100.3,
          domNodeCount: 10000,
          renderTimeMs: 49.9,
          timestamp: 2000
        }
      ];

      const result = averageMetrics(metrics);

      expect(result.fps).toBeCloseTo(59.95, 2);
      expect(result.memoryUsageMB).toBeCloseTo(99.9, 2);
      expect(result.domNodeCount).toBe(10000);
      expect(result.renderTimeMs).toBeCloseTo(50.05, 2);
    });

    it('should handle metrics with performance spikes', () => {
      const metrics: PerformanceMetrics[] = [
        {
          fps: 60,
          memoryUsageMB: 100,
          domNodeCount: 10000,
          renderTimeMs: 50,
          timestamp: 1000
        },
        {
          fps: 30, // Temporary spike
          memoryUsageMB: 120,
          domNodeCount: 10000,
          renderTimeMs: 80,
          timestamp: 2000
        }
      ];

      const result = averageMetrics(metrics);

      // Averaging smooths out the spike
      expect(result.fps).toBe(45);
      expect(result.memoryUsageMB).toBe(110);
      expect(result.renderTimeMs).toBe(65);
    });
  });
});
