/**
 * Unit tests for Unified Demo Page type definitions
 *
 * These tests verify that the TypeScript interfaces are correctly structured
 * and can be instantiated with valid data.
 */

import { describe, it, expect } from 'vitest';
import type {
  PerformanceMetrics,
  DemoConfig,
  ResourceSavings,
  UnifiedDemoState,
  ListItem,
} from './unified-demo-types';

describe('Unified Demo Types', () => {
  describe('PerformanceMetrics', () => {
    it('should accept valid performance metrics', () => {
      const metrics: PerformanceMetrics = {
        fps: 60,
        memoryUsageMB: 45.5,
        domNodeCount: 150,
        renderTimeMs: 12.5,
        timestamp: Date.now(),
      };

      expect(metrics.fps).toBe(60);
      expect(metrics.memoryUsageMB).toBe(45.5);
      expect(metrics.domNodeCount).toBe(150);
      expect(metrics.renderTimeMs).toBe(12.5);
      expect(metrics.timestamp).toBeGreaterThan(0);
    });

    it('should allow zero values for metrics', () => {
      const metrics: PerformanceMetrics = {
        fps: 0,
        memoryUsageMB: 0,
        domNodeCount: 0,
        renderTimeMs: 0,
        timestamp: 0,
      };

      expect(metrics.fps).toBe(0);
      expect(metrics.memoryUsageMB).toBe(0);
      expect(metrics.domNodeCount).toBe(0);
      expect(metrics.renderTimeMs).toBe(0);
      expect(metrics.timestamp).toBe(0);
    });
  });

  describe('DemoConfig', () => {
    it('should accept valid configuration', () => {
      const config: DemoConfig = {
        datasetSize: 10000,
        itemHeight: 50,
        overscan: 3,
      };

      expect(config.datasetSize).toBe(10000);
      expect(config.itemHeight).toBe(50);
      expect(config.overscan).toBe(3);
    });

    it('should accept minimum valid values', () => {
      const config: DemoConfig = {
        datasetSize: 100,
        itemHeight: 20,
        overscan: 0,
      };

      expect(config.datasetSize).toBe(100);
      expect(config.itemHeight).toBe(20);
      expect(config.overscan).toBe(0);
    });

    it('should accept maximum valid values', () => {
      const config: DemoConfig = {
        datasetSize: 100000,
        itemHeight: 200,
        overscan: 10,
      };

      expect(config.datasetSize).toBe(100000);
      expect(config.itemHeight).toBe(200);
      expect(config.overscan).toBe(10);
    });
  });

  describe('ResourceSavings', () => {
    it('should accept valid resource savings', () => {
      const savings: ResourceSavings = {
        memorySavedMB: 25.5,
        memorySavedPercent: 50.0,
        domNodesSaved: 9850,
        domNodesSavedPercent: 98.5,
        fpsImprovement: 30,
        fpsImprovementPercent: 100.0,
        renderTimeSavedMs: 45.2,
        renderTimeSavedPercent: 78.5,
      };

      expect(savings.memorySavedMB).toBe(25.5);
      expect(savings.memorySavedPercent).toBe(50.0);
      expect(savings.domNodesSaved).toBe(9850);
      expect(savings.domNodesSavedPercent).toBe(98.5);
      expect(savings.fpsImprovement).toBe(30);
      expect(savings.fpsImprovementPercent).toBe(100.0);
      expect(savings.renderTimeSavedMs).toBe(45.2);
      expect(savings.renderTimeSavedPercent).toBe(78.5);
    });

    it('should accept zero savings (no improvement)', () => {
      const savings: ResourceSavings = {
        memorySavedMB: 0,
        memorySavedPercent: 0,
        domNodesSaved: 0,
        domNodesSavedPercent: 0,
        fpsImprovement: 0,
        fpsImprovementPercent: 0,
        renderTimeSavedMs: 0,
        renderTimeSavedPercent: 0,
      };

      expect(savings.memorySavedMB).toBe(0);
      expect(savings.domNodesSaved).toBe(0);
      expect(savings.fpsImprovement).toBe(0);
      expect(savings.renderTimeSavedMs).toBe(0);
    });

    it('should accept negative FPS improvement (performance degradation)', () => {
      const savings: ResourceSavings = {
        memorySavedMB: 10,
        memorySavedPercent: 20,
        domNodesSaved: 100,
        domNodesSavedPercent: 10,
        fpsImprovement: -5,
        fpsImprovementPercent: -10,
        renderTimeSavedMs: 0,
        renderTimeSavedPercent: 0,
      };

      expect(savings.fpsImprovement).toBe(-5);
      expect(savings.fpsImprovementPercent).toBe(-10);
    });
  });

  describe('UnifiedDemoState', () => {
    it('should accept initial state with no metrics', () => {
      const state: UnifiedDemoState = {
        mode: 'non-virtualized',
        datasetSize: 10000,
        itemHeight: 50,
        overscan: 3,
        currentMetrics: null,
        baselineMetrics: null,
        baselineTimestamp: null,
        baselineConfig: null,
        isTransitioning: false,
        baselineEstablished: false,
      };

      expect(state.mode).toBe('non-virtualized');
      expect(state.datasetSize).toBe(10000);
      expect(state.itemHeight).toBe(50);
      expect(state.overscan).toBe(3);
      expect(state.currentMetrics).toBeNull();
      expect(state.baselineMetrics).toBeNull();
      expect(state.baselineTimestamp).toBeNull();
      expect(state.baselineConfig).toBeNull();
      expect(state.isTransitioning).toBe(false);
      expect(state.baselineEstablished).toBe(false);
    });

    it('should accept state with established baseline', () => {
      const now = new Date();
      const metrics: PerformanceMetrics = {
        fps: 30,
        memoryUsageMB: 50,
        domNodeCount: 10000,
        renderTimeMs: 100,
        timestamp: now.getTime(),
      };

      const state: UnifiedDemoState = {
        mode: 'virtualized',
        datasetSize: 10000,
        itemHeight: 50,
        overscan: 3,
        currentMetrics: {
          fps: 60,
          memoryUsageMB: 25,
          domNodeCount: 150,
          renderTimeMs: 15,
          timestamp: Date.now(),
        },
        baselineMetrics: metrics,
        baselineTimestamp: now,
        baselineConfig: {
          datasetSize: 10000,
          itemHeight: 50,
        },
        isTransitioning: false,
        baselineEstablished: true,
      };

      expect(state.mode).toBe('virtualized');
      expect(state.currentMetrics).not.toBeNull();
      expect(state.baselineMetrics).toEqual(metrics);
      expect(state.baselineTimestamp).toEqual(now);
      expect(state.baselineConfig).toEqual({
        datasetSize: 10000,
        itemHeight: 50,
      });
      expect(state.baselineEstablished).toBe(true);
    });

    it('should accept transitioning state', () => {
      const state: UnifiedDemoState = {
        mode: 'virtualized',
        datasetSize: 10000,
        itemHeight: 50,
        overscan: 3,
        currentMetrics: null,
        baselineMetrics: null,
        baselineTimestamp: null,
        baselineConfig: null,
        isTransitioning: true,
        baselineEstablished: false,
      };

      expect(state.isTransitioning).toBe(true);
    });
  });

  describe('ListItem', () => {
    it('should accept valid list item', () => {
      const item: ListItem = {
        id: 'item-123',
        content: 'Sample content',
        index: 123,
      };

      expect(item.id).toBe('item-123');
      expect(item.content).toBe('Sample content');
      expect(item.index).toBe(123);
    });

    it('should accept item with empty content', () => {
      const item: ListItem = {
        id: 'item-0',
        content: '',
        index: 0,
      };

      expect(item.id).toBe('item-0');
      expect(item.content).toBe('');
      expect(item.index).toBe(0);
    });

    it('should accept item with large index', () => {
      const item: ListItem = {
        id: 'item-99999',
        content: 'Last item',
        index: 99999,
      };

      expect(item.id).toBe('item-99999');
      expect(item.content).toBe('Last item');
      expect(item.index).toBe(99999);
    });
  });

  describe('Type compatibility', () => {
    it('should allow PerformanceMetrics to be used in UnifiedDemoState', () => {
      const metrics: PerformanceMetrics = {
        fps: 60,
        memoryUsageMB: 30,
        domNodeCount: 200,
        renderTimeMs: 10,
        timestamp: Date.now(),
      };

      const state: UnifiedDemoState = {
        mode: 'virtualized',
        datasetSize: 10000,
        itemHeight: 50,
        overscan: 3,
        currentMetrics: metrics,
        baselineMetrics: metrics,
        baselineTimestamp: new Date(),
        baselineConfig: {
          datasetSize: 10000,
          itemHeight: 50,
        },
        isTransitioning: false,
        baselineEstablished: true,
      };

      expect(state.currentMetrics).toEqual(metrics);
      expect(state.baselineMetrics).toEqual(metrics);
    });

    it('should allow DemoConfig values to be used in UnifiedDemoState', () => {
      const config: DemoConfig = {
        datasetSize: 5000,
        itemHeight: 75,
        overscan: 5,
      };

      const state: UnifiedDemoState = {
        mode: 'non-virtualized',
        datasetSize: config.datasetSize,
        itemHeight: config.itemHeight,
        overscan: config.overscan,
        currentMetrics: null,
        baselineMetrics: null,
        baselineTimestamp: null,
        baselineConfig: null,
        isTransitioning: false,
        baselineEstablished: false,
      };

      expect(state.datasetSize).toBe(config.datasetSize);
      expect(state.itemHeight).toBe(config.itemHeight);
      expect(state.overscan).toBe(config.overscan);
    });
  });
});
