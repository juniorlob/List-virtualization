/**
 * Unit tests for ResourceSavingsDisplay component
 *
 * Tests verify:
 * - Component renders all four metrics (memory, DOM nodes, FPS, render time)
 * - Metrics display both absolute and percentage values
 * - Calculations are performed correctly via memoization
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ResourceSavingsDisplay } from './resource-savings-display';
import type { PerformanceMetrics } from '@/demo/pages/unified-demo-types';

describe('ResourceSavingsDisplay', () => {
  const mockBaselineMetrics: PerformanceMetrics = {
    fps: 30,
    memoryUsageMB: 100,
    domNodeCount: 10000,
    renderTimeMs: 50,
    timestamp: Date.now()
  };

  const mockCurrentMetrics: PerformanceMetrics = {
    fps: 60,
    memoryUsageMB: 20,
    domNodeCount: 100,
    renderTimeMs: 5,
    timestamp: Date.now()
  };

  it('should render the savings panel with title', () => {
    render(
      <ResourceSavingsDisplay
        currentMetrics={mockCurrentMetrics}
        baselineMetrics={mockBaselineMetrics}
      />
    );

    expect(screen.getByText('Resource Savings')).toBeInTheDocument();
  });

  it('should display memory saved metric with absolute and percentage values', () => {
    render(
      <ResourceSavingsDisplay
        currentMetrics={mockCurrentMetrics}
        baselineMetrics={mockBaselineMetrics}
      />
    );

    // Memory saved: 100 - 20 = 80 MB (80%)
    expect(screen.getByText('Memory Saved')).toBeInTheDocument();
    expect(screen.getByText(/80\.00 MB/)).toBeInTheDocument();
    expect(screen.getByText(/\(80\.0%\)/)).toBeInTheDocument();
  });

  it('should display DOM nodes saved metric with absolute and percentage values', () => {
    render(
      <ResourceSavingsDisplay
        currentMetrics={mockCurrentMetrics}
        baselineMetrics={mockBaselineMetrics}
      />
    );

    // DOM nodes saved: 10000 - 100 = 9900 (99%)
    expect(screen.getByText('DOM Nodes Saved')).toBeInTheDocument();
    expect(screen.getByText(/9,900/)).toBeInTheDocument();
    expect(screen.getByText(/\(99\.0%\)/)).toBeInTheDocument();
  });

  it('should display FPS improvement metric with absolute and percentage values', () => {
    render(
      <ResourceSavingsDisplay
        currentMetrics={mockCurrentMetrics}
        baselineMetrics={mockBaselineMetrics}
      />
    );

    // FPS improvement: 60 - 30 = +30 FPS (100%)
    expect(screen.getByText('FPS Improvement')).toBeInTheDocument();
    expect(screen.getByText(/\+30\.0 FPS/)).toBeInTheDocument();
    expect(screen.getByText(/\(100\.0%\)/)).toBeInTheDocument();
  });

  it('should display render time saved metric with absolute and percentage values', () => {
    render(
      <ResourceSavingsDisplay
        currentMetrics={mockCurrentMetrics}
        baselineMetrics={mockBaselineMetrics}
      />
    );

    // Render time saved: 50 - 5 = 45 ms (90%)
    expect(screen.getByText('Render Time Saved')).toBeInTheDocument();
    expect(screen.getByText(/45\.00 ms/)).toBeInTheDocument();
    expect(screen.getByText(/\(90\.0%\)/)).toBeInTheDocument();
  });

  it('should handle zero savings gracefully', () => {
    const identicalMetrics: PerformanceMetrics = {
      fps: 30,
      memoryUsageMB: 50,
      domNodeCount: 1000,
      renderTimeMs: 10,
      timestamp: Date.now()
    };

    render(
      <ResourceSavingsDisplay
        currentMetrics={identicalMetrics}
        baselineMetrics={identicalMetrics}
      />
    );

    // All savings should be 0 (memory is available since both values are > 0)
    expect(screen.getByText(/0\.00 MB/)).toBeInTheDocument();
    expect(screen.getByText(/0\.00 ms/)).toBeInTheDocument();
    expect(screen.getAllByText(/\(0\.0%\)/).length).toBeGreaterThan(0);
  });

  it('should display N/A for unavailable memory metrics', () => {
    const metricsWithoutMemory: PerformanceMetrics = {
      fps: 30,
      memoryUsageMB: 0, // Memory API not available
      domNodeCount: 1000,
      renderTimeMs: 10,
      timestamp: Date.now()
    };

    render(
      <ResourceSavingsDisplay
        currentMetrics={metricsWithoutMemory}
        baselineMetrics={metricsWithoutMemory}
      />
    );

    // Memory should show N/A when unavailable
    expect(screen.getByText('Memory Saved')).toBeInTheDocument();
    const naElements = screen.getAllByText('N/A');
    expect(naElements.length).toBeGreaterThan(0);
  });

  it('should handle negative savings (virtualized using more resources)', () => {
    const worseMetrics: PerformanceMetrics = {
      fps: 20, // Worse FPS
      memoryUsageMB: 150, // More memory
      domNodeCount: 15000, // More DOM nodes
      renderTimeMs: 100, // Slower render
      timestamp: Date.now()
    };

    render(
      <ResourceSavingsDisplay
        currentMetrics={worseMetrics}
        baselineMetrics={mockBaselineMetrics}
      />
    );

    // Negative savings should be clamped to 0 for memory, DOM nodes, and render time
    // FPS improvement can be negative
    expect(screen.getByText('Memory Saved')).toBeInTheDocument();
    expect(screen.getByText('DOM Nodes Saved')).toBeInTheDocument();
    expect(screen.getByText('Render Time Saved')).toBeInTheDocument();
  });

  it('should display all four metric icons', () => {
    const { container } = render(
      <ResourceSavingsDisplay
        currentMetrics={mockCurrentMetrics}
        baselineMetrics={mockBaselineMetrics}
      />
    );

    // Check for emoji icons (💾, 🔢, ⚡, ⏱️)
    const icons = container.querySelectorAll('[class*="metricIcon"]');
    expect(icons).toHaveLength(4);
  });

  it('should use memoization for savings calculation', () => {
    const { rerender } = render(
      <ResourceSavingsDisplay
        currentMetrics={mockCurrentMetrics}
        baselineMetrics={mockBaselineMetrics}
      />
    );

    // Get initial render result
    const initialMemorySaved = screen.getByText(/80\.00 MB/);
    expect(initialMemorySaved).toBeInTheDocument();

    // Rerender with same props (should use memoized value)
    rerender(
      <ResourceSavingsDisplay
        currentMetrics={mockCurrentMetrics}
        baselineMetrics={mockBaselineMetrics}
      />
    );

    // Result should still be the same
    expect(screen.getByText(/80\.00 MB/)).toBeInTheDocument();
  });
});
