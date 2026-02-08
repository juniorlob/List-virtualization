/**
 * Unit tests for resource savings calculator
 *
 * Tests the calculateResourceSavings function to ensure correct calculation
 * of resource savings with proper null handling and non-negative values.
 *
 * Requirements: 3.2, 3.3, 3.4, 3.5
 */

import { describe, it, expect } from 'vitest';
import { calculateResourceSavings } from './resource-savings-calculator';
import type { PerformanceMetrics } from '@/demo/pages/unified-demo-types';

describe('calculateResourceSavings', () => {
  describe('basic calculations', () => {
    it('should calculate correct savings when virtualized uses fewer resources', () => {
      const baseline: PerformanceMetrics = {
        fps: 30,
        memoryUsageMB: 100,
        domNodeCount: 10000,
        renderTimeMs: 50,
        timestamp: Date.now()
      };

      const current: PerformanceMetrics = {
        fps: 60,
        memoryUsageMB: 20,
        domNodeCount: 100,
        renderTimeMs: 5,
        timestamp: Date.now()
      };

      const savings = calculateResourceSavings(current, baseline);

      // Memory savings
      expect(savings.memorySavedMB).toBe(80);
      expect(savings.memorySavedPercent).toBe(80);

      // DOM node savings
      expect(savings.domNodesSaved).toBe(9900);
      expect(savings.domNodesSavedPercent).toBe(99);

      // FPS improvement
      expect(savings.fpsImprovement).toBe(30);
      expect(savings.fpsImprovementPercent).toBe(100);

      // Render time savings
      expect(savings.renderTimeSavedMs).toBe(45);
      expect(savings.renderTimeSavedPercent).toBe(90);
    });

    it('should calculate correct percentages with decimal precision', () => {
      const baseline: PerformanceMetrics = {
        fps: 45,
        memoryUsageMB: 75.5,
        domNodeCount: 7500,
        renderTimeMs: 33.3,
        timestamp: Date.now()
      };

      const current: PerformanceMetrics = {
        fps: 60,
        memoryUsageMB: 25.5,
        domNodeCount: 150,
        renderTimeMs: 8.3,
        timestamp: Date.now()
      };

      const savings = calculateResourceSavings(current, baseline);

      // Memory savings
      expect(savings.memorySavedMB).toBeCloseTo(50, 1);
      expect(savings.memorySavedPercent).toBeCloseTo(66.23, 1);

      // DOM node savings
      expect(savings.domNodesSaved).toBe(7350);
      expect(savings.domNodesSavedPercent).toBe(98);

      // FPS improvement
      expect(savings.fpsImprovement).toBe(15);
      expect(savings.fpsImprovementPercent).toBeCloseTo(33.33, 1);

      // Render time savings
      expect(savings.renderTimeSavedMs).toBeCloseTo(25, 1);
      expect(savings.renderTimeSavedPercent).toBeCloseTo(75.08, 1);
    });
  });

  describe('non-negative value enforcement', () => {
    it('should return 0 for memory savings when virtualized uses more memory', () => {
      const baseline: PerformanceMetrics = {
        fps: 30,
        memoryUsageMB: 20,
        domNodeCount: 100,
        renderTimeMs: 5,
        timestamp: Date.now()
      };

      const current: PerformanceMetrics = {
        fps: 60,
        memoryUsageMB: 100,
        domNodeCount: 50,
        renderTimeMs: 3,
        timestamp: Date.now()
      };

      const savings = calculateResourceSavings(current, baseline);

      // Memory should be 0 (not negative)
      expect(savings.memorySavedMB).toBe(0);
      expect(savings.memorySavedPercent).toBe(0);

      // Other savings should still be positive
      expect(savings.domNodesSaved).toBe(50);
      expect(savings.renderTimeSavedMs).toBe(2);
    });

    it('should return 0 for DOM node savings when virtualized uses more nodes', () => {
      const baseline: PerformanceMetrics = {
        fps: 30,
        memoryUsageMB: 100,
        domNodeCount: 50,
        renderTimeMs: 5,
        timestamp: Date.now()
      };

      const current: PerformanceMetrics = {
        fps: 60,
        memoryUsageMB: 20,
        domNodeCount: 100,
        renderTimeMs: 3,
        timestamp: Date.now()
      };

      const savings = calculateResourceSavings(current, baseline);

      // DOM nodes should be 0 (not negative)
      expect(savings.domNodesSaved).toBe(0);
      expect(savings.domNodesSavedPercent).toBe(0);

      // Other savings should still be positive
      expect(savings.memorySavedMB).toBe(80);
      expect(savings.renderTimeSavedMs).toBe(2);
    });

    it('should return 0 for render time savings when virtualized is slower', () => {
      const baseline: PerformanceMetrics = {
        fps: 30,
        memoryUsageMB: 100,
        domNodeCount: 100,
        renderTimeMs: 3,
        timestamp: Date.now()
      };

      const current: PerformanceMetrics = {
        fps: 60,
        memoryUsageMB: 20,
        domNodeCount: 50,
        renderTimeMs: 10,
        timestamp: Date.now()
      };

      const savings = calculateResourceSavings(current, baseline);

      // Render time should be 0 (not negative)
      expect(savings.renderTimeSavedMs).toBe(0);
      expect(savings.renderTimeSavedPercent).toBe(0);

      // Other savings should still be positive
      expect(savings.memorySavedMB).toBe(80);
      expect(savings.domNodesSaved).toBe(50);
    });

    it('should allow negative FPS improvement (FPS can decrease)', () => {
      const baseline: PerformanceMetrics = {
        fps: 60,
        memoryUsageMB: 100,
        domNodeCount: 100,
        renderTimeMs: 10,
        timestamp: Date.now()
      };

      const current: PerformanceMetrics = {
        fps: 30,
        memoryUsageMB: 20,
        domNodeCount: 50,
        renderTimeMs: 5,
        timestamp: Date.now()
      };

      const savings = calculateResourceSavings(current, baseline);

      // FPS improvement can be negative (it's a decrease)
      expect(savings.fpsImprovement).toBe(-30);
      expect(savings.fpsImprovementPercent).toBe(-50);

      // Other savings should still be positive
      expect(savings.memorySavedMB).toBe(80);
      expect(savings.domNodesSaved).toBe(50);
      expect(savings.renderTimeSavedMs).toBe(5);
    });
  });

  describe('edge cases', () => {
    it('should handle zero baseline values without division by zero', () => {
      const baseline: PerformanceMetrics = {
        fps: 0,
        memoryUsageMB: 0,
        domNodeCount: 0,
        renderTimeMs: 0,
        timestamp: Date.now()
      };

      const current: PerformanceMetrics = {
        fps: 60,
        memoryUsageMB: 20,
        domNodeCount: 100,
        renderTimeMs: 5,
        timestamp: Date.now()
      };

      const savings = calculateResourceSavings(current, baseline);

      // All percentages should be 0 when baseline is 0
      expect(savings.memorySavedPercent).toBe(0);
      expect(savings.domNodesSavedPercent).toBe(0);
      expect(savings.fpsImprovementPercent).toBe(0);
      expect(savings.renderTimeSavedPercent).toBe(0);

      // Absolute values should still be calculated (but clamped to 0 for savings)
      expect(savings.memorySavedMB).toBe(0);
      expect(savings.domNodesSaved).toBe(0);
      expect(savings.fpsImprovement).toBe(60);
      expect(savings.renderTimeSavedMs).toBe(0);
    });

    it('should handle identical metrics (no savings)', () => {
      const metrics: PerformanceMetrics = {
        fps: 60,
        memoryUsageMB: 50,
        domNodeCount: 1000,
        renderTimeMs: 10,
        timestamp: Date.now()
      };

      const savings = calculateResourceSavings(metrics, metrics);

      // All savings should be 0
      expect(savings.memorySavedMB).toBe(0);
      expect(savings.memorySavedPercent).toBe(0);
      expect(savings.domNodesSaved).toBe(0);
      expect(savings.domNodesSavedPercent).toBe(0);
      expect(savings.fpsImprovement).toBe(0);
      expect(savings.fpsImprovementPercent).toBe(0);
      expect(savings.renderTimeSavedMs).toBe(0);
      expect(savings.renderTimeSavedPercent).toBe(0);
    });

    it('should handle very small differences', () => {
      const baseline: PerformanceMetrics = {
        fps: 60.1,
        memoryUsageMB: 50.01,
        domNodeCount: 1000,
        renderTimeMs: 10.001,
        timestamp: Date.now()
      };

      const current: PerformanceMetrics = {
        fps: 60.0,
        memoryUsageMB: 50.00,
        domNodeCount: 999,
        renderTimeMs: 10.000,
        timestamp: Date.now()
      };

      const savings = calculateResourceSavings(current, baseline);

      // Should handle small differences without errors
      expect(savings.memorySavedMB).toBeCloseTo(0.01, 2);
      expect(savings.domNodesSaved).toBe(1);
      expect(savings.renderTimeSavedMs).toBeCloseTo(0.001, 3);
    });

    it('should handle very large values', () => {
      const baseline: PerformanceMetrics = {
        fps: 60,
        memoryUsageMB: 10000,
        domNodeCount: 1000000,
        renderTimeMs: 5000,
        timestamp: Date.now()
      };

      const current: PerformanceMetrics = {
        fps: 60,
        memoryUsageMB: 100,
        domNodeCount: 100,
        renderTimeMs: 5,
        timestamp: Date.now()
      };

      const savings = calculateResourceSavings(current, baseline);

      // Should handle large values correctly
      expect(savings.memorySavedMB).toBe(9900);
      expect(savings.memorySavedPercent).toBe(99);
      expect(savings.domNodesSaved).toBe(999900);
      expect(savings.domNodesSavedPercent).toBeCloseTo(99.99, 2);
      expect(savings.renderTimeSavedMs).toBe(4995);
      expect(savings.renderTimeSavedPercent).toBe(99.9);
    });
  });

  describe('realistic scenarios', () => {
    it('should calculate savings for typical virtualization scenario', () => {
      // Non-virtualized: rendering 10,000 items
      const baseline: PerformanceMetrics = {
        fps: 25,
        memoryUsageMB: 150,
        domNodeCount: 10000,
        renderTimeMs: 80,
        timestamp: Date.now()
      };

      // Virtualized: rendering ~20 visible items
      const current: PerformanceMetrics = {
        fps: 60,
        memoryUsageMB: 30,
        domNodeCount: 20,
        renderTimeMs: 5,
        timestamp: Date.now()
      };

      const savings = calculateResourceSavings(current, baseline);

      // Expect significant savings
      expect(savings.memorySavedMB).toBe(120);
      expect(savings.memorySavedPercent).toBe(80);
      expect(savings.domNodesSaved).toBe(9980);
      expect(savings.domNodesSavedPercent).toBeCloseTo(99.8, 1);
      expect(savings.fpsImprovement).toBe(35);
      expect(savings.fpsImprovementPercent).toBe(140);
      expect(savings.renderTimeSavedMs).toBe(75);
      expect(savings.renderTimeSavedPercent).toBeCloseTo(93.75, 2);
    });

    it('should calculate savings for small dataset (minimal benefit)', () => {
      // Non-virtualized: rendering 100 items
      const baseline: PerformanceMetrics = {
        fps: 58,
        memoryUsageMB: 25,
        domNodeCount: 100,
        renderTimeMs: 8,
        timestamp: Date.now()
      };

      // Virtualized: rendering ~20 visible items (overhead might reduce benefit)
      const current: PerformanceMetrics = {
        fps: 60,
        memoryUsageMB: 22,
        domNodeCount: 20,
        renderTimeMs: 7,
        timestamp: Date.now()
      };

      const savings = calculateResourceSavings(current, baseline);

      // Expect minimal savings
      expect(savings.memorySavedMB).toBe(3);
      expect(savings.memorySavedPercent).toBe(12);
      expect(savings.domNodesSaved).toBe(80);
      expect(savings.domNodesSavedPercent).toBe(80);
      expect(savings.fpsImprovement).toBe(2);
      expect(savings.renderTimeSavedMs).toBe(1);
    });
  });
});
