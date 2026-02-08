/**
 * Unit tests for useBaselineAutoCapture hook
 *
 * Tests baseline auto-capture functionality including:
 * - Baseline capture after 2 seconds in non-virtualized mode
 * - No capture in virtualized mode
 * - Metrics history clearing on mode change
 * - Config change resets capture flag
 *
 * Requirements: 3.1, 8.1
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBaselineAutoCapture } from '@/demo/hooks/use-baseline-auto-capture';
import type { PerformanceMetrics, DemoConfig } from '@/demo/pages/unified-demo-types';

describe('useBaselineAutoCapture', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  const createMockMetrics = (overrides?: Partial<PerformanceMetrics>): PerformanceMetrics => ({
    fps: 60,
    memoryUsageMB: 100,
    domNodeCount: 10000,
    renderTimeMs: 50,
    timestamp: Date.now(),
    ...overrides,
  });

  const createMockConfig = (overrides?: Partial<DemoConfig>): DemoConfig => ({
    datasetSize: 10000,
    itemHeight: 50,
    overscan: 3,
    ...overrides,
  });

  describe('Baseline capture in non-virtualized mode', () => {
    it('should capture baseline after 2 seconds of metrics in non-virtualized mode', () => {
      const onBaselineCaptured = vi.fn();
      const config = createMockConfig();
      const metrics1 = createMockMetrics({ fps: 58, memoryUsageMB: 100 });
      const metrics2 = createMockMetrics({ fps: 60, memoryUsageMB: 102 });

      const { rerender } = renderHook(
        ({ mode, currentMetrics }) =>
          useBaselineAutoCapture(mode, currentMetrics, onBaselineCaptured, config),
        {
          initialProps: {
            mode: 'non-virtualized' as const,
            currentMetrics: null,
          },
        }
      );

      // First metrics update
      rerender({
        mode: 'non-virtualized' as const,
        currentMetrics: metrics1,
      });

      // Should not capture yet (only 1 second)
      expect(onBaselineCaptured).not.toHaveBeenCalled();

      // Second metrics update (2 seconds total)
      rerender({
        mode: 'non-virtualized' as const,
        currentMetrics: metrics2,
      });

      // Fast-forward timer to trigger capture
      act(() => {
        vi.advanceTimersByTime(100);
      });

      // Should capture baseline with averaged metrics
      expect(onBaselineCaptured).toHaveBeenCalledTimes(1);
      expect(onBaselineCaptured).toHaveBeenCalledWith(
        expect.objectContaining({
          fps: 59, // Average of 58 and 60
          memoryUsageMB: 101, // Average of 100 and 102
        }),
        config
      );
    });

    it('should not capture baseline before 2 seconds of metrics', () => {
      const onBaselineCaptured = vi.fn();
      const config = createMockConfig();
      const metrics = createMockMetrics();

      renderHook(() =>
        useBaselineAutoCapture('non-virtualized', metrics, onBaselineCaptured, config)
      );

      // Fast-forward timer
      act(() => {
        vi.advanceTimersByTime(100);
      });

      // Should not capture with only 1 metric sample
      expect(onBaselineCaptured).not.toHaveBeenCalled();
    });

    it('should not capture baseline when metrics are null', () => {
      const onBaselineCaptured = vi.fn();
      const config = createMockConfig();

      renderHook(() =>
        useBaselineAutoCapture('non-virtualized', null, onBaselineCaptured, config)
      );

      // Fast-forward timer
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // Should not capture without metrics
      expect(onBaselineCaptured).not.toHaveBeenCalled();
    });

    it('should only capture baseline once per session', () => {
      const onBaselineCaptured = vi.fn();
      const config = createMockConfig();
      const metrics1 = createMockMetrics({ fps: 58 });
      const metrics2 = createMockMetrics({ fps: 60 });
      const metrics3 = createMockMetrics({ fps: 62 });

      const { rerender } = renderHook(
        ({ currentMetrics }) =>
          useBaselineAutoCapture('non-virtualized', currentMetrics, onBaselineCaptured, config),
        {
          initialProps: { currentMetrics: null },
        }
      );

      // First two metrics
      rerender({ currentMetrics: metrics1 });
      rerender({ currentMetrics: metrics2 });

      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(onBaselineCaptured).toHaveBeenCalledTimes(1);

      // Third metric
      rerender({ currentMetrics: metrics3 });

      act(() => {
        vi.advanceTimersByTime(100);
      });

      // Should not capture again
      expect(onBaselineCaptured).toHaveBeenCalledTimes(1);
    });
  });

  describe('No capture in virtualized mode', () => {
    it('should not capture baseline in virtualized mode', () => {
      const onBaselineCaptured = vi.fn();
      const config = createMockConfig();
      const metrics1 = createMockMetrics();
      const metrics2 = createMockMetrics();

      const { rerender } = renderHook(
        ({ currentMetrics }) =>
          useBaselineAutoCapture('virtualized', currentMetrics, onBaselineCaptured, config),
        {
          initialProps: { currentMetrics: null },
        }
      );

      // Add metrics
      rerender({ currentMetrics: metrics1 });
      rerender({ currentMetrics: metrics2 });

      // Fast-forward timer
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // Should not capture in virtualized mode
      expect(onBaselineCaptured).not.toHaveBeenCalled();
    });
  });

  describe('Metrics history clearing on mode change', () => {
    it('should clear metrics history when switching from non-virtualized to virtualized', () => {
      const onBaselineCaptured = vi.fn();
      const config = createMockConfig();
      const metrics = createMockMetrics();

      const { rerender } = renderHook(
        ({ mode, currentMetrics }) =>
          useBaselineAutoCapture(mode, currentMetrics, onBaselineCaptured, config),
        {
          initialProps: {
            mode: 'non-virtualized' as const,
            currentMetrics: metrics,
          },
        }
      );

      // Switch to virtualized mode
      rerender({
        mode: 'virtualized' as const,
        currentMetrics: metrics,
      });

      // Switch back to non-virtualized
      rerender({
        mode: 'non-virtualized' as const,
        currentMetrics: metrics,
      });

      // Should need 2 new metrics to capture (history was cleared)
      expect(onBaselineCaptured).not.toHaveBeenCalled();
    });

    it('should clear pending timer when switching modes', () => {
      const onBaselineCaptured = vi.fn();
      const config = createMockConfig();
      const metrics1 = createMockMetrics();
      const metrics2 = createMockMetrics();

      const { rerender } = renderHook(
        ({ mode, currentMetrics }) =>
          useBaselineAutoCapture(mode, currentMetrics, onBaselineCaptured, config),
        {
          initialProps: {
            mode: 'non-virtualized' as const,
            currentMetrics: null,
          },
        }
      );

      // Add 2 metrics to trigger timer
      rerender({
        mode: 'non-virtualized' as const,
        currentMetrics: metrics1,
      });
      rerender({
        mode: 'non-virtualized' as const,
        currentMetrics: metrics2,
      });

      // Switch mode before timer fires
      rerender({
        mode: 'virtualized' as const,
        currentMetrics: metrics2,
      });

      // Fast-forward timer
      act(() => {
        vi.advanceTimersByTime(100);
      });

      // Should not capture (timer was cleared)
      expect(onBaselineCaptured).not.toHaveBeenCalled();
    });
  });

  describe('Config change resets capture flag', () => {
    it('should allow recapture when dataset size changes', () => {
      const onBaselineCaptured = vi.fn();
      const config1 = createMockConfig({ datasetSize: 10000 });
      const config2 = createMockConfig({ datasetSize: 20000 });
      const metrics1 = createMockMetrics();
      const metrics2 = createMockMetrics();
      const metrics3 = createMockMetrics({ fps: 55 });
      const metrics4 = createMockMetrics({ fps: 58 });

      const { rerender } = renderHook(
        ({ config, currentMetrics }) =>
          useBaselineAutoCapture('non-virtualized', currentMetrics, onBaselineCaptured, config),
        {
          initialProps: {
            config: config1,
            currentMetrics: null,
          },
        }
      );

      // Capture first baseline
      rerender({ config: config1, currentMetrics: metrics1 });
      rerender({ config: config1, currentMetrics: metrics2 });

      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(onBaselineCaptured).toHaveBeenCalledTimes(1);

      // Change dataset size - this resets the capture flag
      rerender({ config: config2, currentMetrics: null });

      // Now add new metrics with the new config
      rerender({ config: config2, currentMetrics: metrics3 });
      rerender({ config: config2, currentMetrics: metrics4 });

      act(() => {
        vi.advanceTimersByTime(100);
      });

      // Should capture again with new config
      expect(onBaselineCaptured).toHaveBeenCalledTimes(2);
      expect(onBaselineCaptured).toHaveBeenLastCalledWith(
        expect.any(Object),
        config2
      );
    });

    it('should allow recapture when item height changes', () => {
      const onBaselineCaptured = vi.fn();
      const config1 = createMockConfig({ itemHeight: 50 });
      const config2 = createMockConfig({ itemHeight: 100 });
      const metrics1 = createMockMetrics();
      const metrics2 = createMockMetrics();
      const metrics3 = createMockMetrics({ fps: 55 });
      const metrics4 = createMockMetrics({ fps: 58 });

      const { rerender } = renderHook(
        ({ config, currentMetrics }) =>
          useBaselineAutoCapture('non-virtualized', currentMetrics, onBaselineCaptured, config),
        {
          initialProps: {
            config: config1,
            currentMetrics: null,
          },
        }
      );

      // Capture first baseline
      rerender({ config: config1, currentMetrics: metrics1 });
      rerender({ config: config1, currentMetrics: metrics2 });

      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(onBaselineCaptured).toHaveBeenCalledTimes(1);

      // Change item height - this resets the capture flag
      rerender({ config: config2, currentMetrics: null });

      // Now add new metrics with the new config
      rerender({ config: config2, currentMetrics: metrics3 });
      rerender({ config: config2, currentMetrics: metrics4 });

      act(() => {
        vi.advanceTimersByTime(100);
      });

      // Should capture again with new config
      expect(onBaselineCaptured).toHaveBeenCalledTimes(2);
      expect(onBaselineCaptured).toHaveBeenLastCalledWith(
        expect.any(Object),
        config2
      );
    });

    it('should not recapture when only overscan changes', () => {
      const onBaselineCaptured = vi.fn();
      const config1 = createMockConfig({ overscan: 3 });
      const config2 = createMockConfig({ overscan: 5 });
      const metrics1 = createMockMetrics();
      const metrics2 = createMockMetrics();

      const { rerender } = renderHook(
        ({ config, currentMetrics }) =>
          useBaselineAutoCapture('non-virtualized', currentMetrics, onBaselineCaptured, config),
        {
          initialProps: {
            config: config1,
            currentMetrics: null,
          },
        }
      );

      // Capture first baseline
      rerender({ config: config1, currentMetrics: metrics1 });
      rerender({ config: config1, currentMetrics: metrics2 });

      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(onBaselineCaptured).toHaveBeenCalledTimes(1);

      // Change only overscan (should not trigger recapture)
      rerender({ config: config2, currentMetrics: metrics1 });
      rerender({ config: config2, currentMetrics: metrics2 });

      act(() => {
        vi.advanceTimersByTime(100);
      });

      // Should not capture again (overscan doesn't affect baseline)
      expect(onBaselineCaptured).toHaveBeenCalledTimes(1);
    });
  });

  describe('Cleanup', () => {
    it('should clear timer on unmount', () => {
      const onBaselineCaptured = vi.fn();
      const config = createMockConfig();
      const metrics1 = createMockMetrics();
      const metrics2 = createMockMetrics();

      const { rerender, unmount } = renderHook(
        ({ currentMetrics }) =>
          useBaselineAutoCapture('non-virtualized', currentMetrics, onBaselineCaptured, config),
        {
          initialProps: { currentMetrics: null },
        }
      );

      // Add 2 metrics to trigger timer
      rerender({ currentMetrics: metrics1 });
      rerender({ currentMetrics: metrics2 });

      // Unmount before timer fires
      unmount();

      // Fast-forward timer
      act(() => {
        vi.advanceTimersByTime(100);
      });

      // Should not capture after unmount
      expect(onBaselineCaptured).not.toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('should handle rapid metrics updates', () => {
      const onBaselineCaptured = vi.fn();
      const config = createMockConfig();

      const { rerender } = renderHook(
        ({ currentMetrics }) =>
          useBaselineAutoCapture('non-virtualized', currentMetrics, onBaselineCaptured, config),
        {
          initialProps: { currentMetrics: null },
        }
      );

      // Add many metrics rapidly (each rerender simulates a new metric update)
      for (let i = 0; i < 10; i++) {
        rerender({ currentMetrics: createMockMetrics({ fps: 50 + i }) });
      }

      act(() => {
        vi.advanceTimersByTime(100);
      });

      // Should capture only once with last 2 metrics
      expect(onBaselineCaptured).toHaveBeenCalledTimes(1);

      // Should have averaged the last 2 metrics (fps 58 and 59)
      expect(onBaselineCaptured).toHaveBeenCalledWith(
        expect.objectContaining({
          fps: 58.5, // Average of 58 and 59
        }),
        config
      );
    });

    it('should keep only last 2 metrics in history', () => {
      const onBaselineCaptured = vi.fn();
      const config = createMockConfig();
      const metrics1 = createMockMetrics({ fps: 50 });
      const metrics2 = createMockMetrics({ fps: 55 });
      const metrics3 = createMockMetrics({ fps: 60 });

      const { rerender } = renderHook(
        ({ currentMetrics }) =>
          useBaselineAutoCapture('non-virtualized', currentMetrics, onBaselineCaptured, config),
        {
          initialProps: { currentMetrics: null },
        }
      );

      // Add 3 metrics
      rerender({ currentMetrics: metrics1 });
      rerender({ currentMetrics: metrics2 });
      rerender({ currentMetrics: metrics3 });

      act(() => {
        vi.advanceTimersByTime(100);
      });

      // Should average only last 2 metrics (55 and 60)
      expect(onBaselineCaptured).toHaveBeenCalledWith(
        expect.objectContaining({
          fps: 57.5, // Average of 55 and 60 (not including 50)
        }),
        config
      );
    });
  });
});
