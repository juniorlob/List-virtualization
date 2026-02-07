/**
 * Unit tests for BaselineInfoDisplay component
 *
 * Tests verify:
 * - Component shows prompt message when no baseline is available
 * - Component shows baseline details when baseline exists
 * - Reset button calls the callback function
 * - Timestamp formatting works correctly
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BaselineInfoDisplay } from './baseline-info-display';
import type { PerformanceMetrics } from '../../demo/pages/unified-demo-types';

describe('BaselineInfoDisplay', () => {
  const mockBaselineMetrics: PerformanceMetrics = {
    fps: 30,
    memoryUsageMB: 100,
    domNodeCount: 10000,
    renderTimeMs: 50,
    timestamp: Date.now()
  };

  const mockBaselineConfig = {
    datasetSize: 10000,
    itemHeight: 50
  };

  describe('when no baseline is available', () => {
    it('should display prompt message', () => {
      const onResetBaseline = vi.fn();

      render(
        <BaselineInfoDisplay
          baselineMetrics={null}
          baselineTimestamp={null}
          baselineConfig={null}
          onResetBaseline={onResetBaseline}
        />
      );

      expect(screen.getByText('No Baseline Available')).toBeInTheDocument();
      expect(
        screen.getByText(/Run Non-Virtualized mode for 2\+ seconds/)
      ).toBeInTheDocument();
    });

    it('should display info icon', () => {
      const onResetBaseline = vi.fn();

      const { container } = render(
        <BaselineInfoDisplay
          baselineMetrics={null}
          baselineTimestamp={null}
          baselineConfig={null}
          onResetBaseline={onResetBaseline}
        />
      );

      // Check for info icon emoji
      expect(container.textContent).toContain('ℹ️');
    });

    it('should not display reset button when no baseline', () => {
      const onResetBaseline = vi.fn();

      render(
        <BaselineInfoDisplay
          baselineMetrics={null}
          baselineTimestamp={null}
          baselineConfig={null}
          onResetBaseline={onResetBaseline}
        />
      );

      expect(screen.queryByText(/Reset Baseline/)).not.toBeInTheDocument();
    });
  });

  describe('when baseline is available', () => {
    it('should display baseline established header', () => {
      const onResetBaseline = vi.fn();
      const timestamp = new Date();

      render(
        <BaselineInfoDisplay
          baselineMetrics={mockBaselineMetrics}
          baselineTimestamp={timestamp}
          baselineConfig={mockBaselineConfig}
          onResetBaseline={onResetBaseline}
        />
      );

      expect(screen.getByText('Baseline Established')).toBeInTheDocument();
    });

    it('should display baseline configuration details', () => {
      const onResetBaseline = vi.fn();
      const timestamp = new Date();

      render(
        <BaselineInfoDisplay
          baselineMetrics={mockBaselineMetrics}
          baselineTimestamp={timestamp}
          baselineConfig={mockBaselineConfig}
          onResetBaseline={onResetBaseline}
        />
      );

      expect(screen.getByText('Dataset Size:')).toBeInTheDocument();
      expect(screen.getByText('10,000 items')).toBeInTheDocument();
      expect(screen.getByText('Item Height:')).toBeInTheDocument();
      expect(screen.getByText('50px')).toBeInTheDocument();
    });

    it('should display baseline metrics summary', () => {
      const onResetBaseline = vi.fn();
      const timestamp = new Date();

      render(
        <BaselineInfoDisplay
          baselineMetrics={mockBaselineMetrics}
          baselineTimestamp={timestamp}
          baselineConfig={mockBaselineConfig}
          onResetBaseline={onResetBaseline}
        />
      );

      expect(screen.getByText('Memory Usage:')).toBeInTheDocument();
      expect(screen.getByText('100.00 MB')).toBeInTheDocument();
      expect(screen.getByText('DOM Nodes:')).toBeInTheDocument();
      expect(screen.getByText('10,000')).toBeInTheDocument();
      expect(screen.getByText('FPS:')).toBeInTheDocument();
      expect(screen.getByText('30.0')).toBeInTheDocument();
    });

    it('should display formatted timestamp', () => {
      const onResetBaseline = vi.fn();
      const timestamp = new Date(Date.now() - 5000); // 5 seconds ago

      render(
        <BaselineInfoDisplay
          baselineMetrics={mockBaselineMetrics}
          baselineTimestamp={timestamp}
          baselineConfig={mockBaselineConfig}
          onResetBaseline={onResetBaseline}
        />
      );

      expect(screen.getByText('Captured:')).toBeInTheDocument();
      expect(screen.getByText(/seconds? ago/)).toBeInTheDocument();
    });

    it('should display reset button', () => {
      const onResetBaseline = vi.fn();
      const timestamp = new Date();

      render(
        <BaselineInfoDisplay
          baselineMetrics={mockBaselineMetrics}
          baselineTimestamp={timestamp}
          baselineConfig={mockBaselineConfig}
          onResetBaseline={onResetBaseline}
        />
      );

      expect(screen.getByText(/Reset Baseline/)).toBeInTheDocument();
    });

    it('should call onResetBaseline when reset button is clicked', async () => {
      const user = userEvent.setup();
      const onResetBaseline = vi.fn();
      const timestamp = new Date();

      render(
        <BaselineInfoDisplay
          baselineMetrics={mockBaselineMetrics}
          baselineTimestamp={timestamp}
          baselineConfig={mockBaselineConfig}
          onResetBaseline={onResetBaseline}
        />
      );

      const resetButton = screen.getByText(/Reset Baseline/);
      await user.click(resetButton);

      expect(onResetBaseline).toHaveBeenCalledTimes(1);
    });

    it('should display success icon', () => {
      const onResetBaseline = vi.fn();
      const timestamp = new Date();

      const { container } = render(
        <BaselineInfoDisplay
          baselineMetrics={mockBaselineMetrics}
          baselineTimestamp={timestamp}
          baselineConfig={mockBaselineConfig}
          onResetBaseline={onResetBaseline}
        />
      );

      // Check for success checkmark
      expect(container.textContent).toContain('✓');
    });
  });

  describe('timestamp formatting', () => {
    it('should format recent timestamps as "X seconds ago"', () => {
      const onResetBaseline = vi.fn();
      const timestamp = new Date(Date.now() - 30000); // 30 seconds ago

      render(
        <BaselineInfoDisplay
          baselineMetrics={mockBaselineMetrics}
          baselineTimestamp={timestamp}
          baselineConfig={mockBaselineConfig}
          onResetBaseline={onResetBaseline}
        />
      );

      expect(screen.getByText(/30 seconds ago/)).toBeInTheDocument();
    });

    it('should format timestamps as "X minutes ago"', () => {
      const onResetBaseline = vi.fn();
      const timestamp = new Date(Date.now() - 120000); // 2 minutes ago

      render(
        <BaselineInfoDisplay
          baselineMetrics={mockBaselineMetrics}
          baselineTimestamp={timestamp}
          baselineConfig={mockBaselineConfig}
          onResetBaseline={onResetBaseline}
        />
      );

      expect(screen.getByText(/2 minutes ago/)).toBeInTheDocument();
    });

    it('should format timestamps as "X hours ago"', () => {
      const onResetBaseline = vi.fn();
      const timestamp = new Date(Date.now() - 7200000); // 2 hours ago

      render(
        <BaselineInfoDisplay
          baselineMetrics={mockBaselineMetrics}
          baselineTimestamp={timestamp}
          baselineConfig={mockBaselineConfig}
          onResetBaseline={onResetBaseline}
        />
      );

      expect(screen.getByText(/2 hours ago/)).toBeInTheDocument();
    });

    it('should use singular form for 1 second', () => {
      const onResetBaseline = vi.fn();
      const timestamp = new Date(Date.now() - 1000); // 1 second ago

      render(
        <BaselineInfoDisplay
          baselineMetrics={mockBaselineMetrics}
          baselineTimestamp={timestamp}
          baselineConfig={mockBaselineConfig}
          onResetBaseline={onResetBaseline}
        />
      );

      expect(screen.getByText(/1 second ago/)).toBeInTheDocument();
    });
  });
});
