/**
 * Integration Tests for UnifiedDemoPage
 *
 * Tests complete user workflows for the unified demo page:
 * - Baseline establishment flow (Task 16.1)
 * - Savings comparison flow (Task 16.2)
 * - Configuration change flow (Task 16.3)
 * - Mode switching flow (Task 16.4)
 *
 * Requirements: 2.1, 3.1, 3.2, 4.2, 4.3, 4.4, 4.5, 5.5, 8.1, 8.2, 8.3, 9.1, 9.6
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { UnifiedDemoPage } from '../../src/demo/pages/unified-demo-page';
import type { PerformanceMetrics as CorePerformanceMetrics } from '../../src/core/virtualization/types';

// Mock the VirtualizedList component
vi.mock('../../src/components/virtualized-list/virtualized-list', () => ({
  VirtualizedList: ({
    onMetricsChange,
  }: {
    onMetricsChange: (metrics: CorePerformanceMetrics) => void;
  }) => {
    // Simulate metrics updates for virtualized list using useEffect
    React.useEffect(() => {
      // Send multiple metrics updates to simulate real behavior
      const timer1 = setTimeout(() => {
        onMetricsChange({
          fps: 58,
          memoryUsage: 25,
          domNodes: 50,
          renderTime: 5,
        });
      }, 100);

      const timer2 = setTimeout(() => {
        onMetricsChange({
          fps: 58,
          memoryUsage: 25,
          domNodes: 50,
          renderTime: 5,
        });
      }, 1100);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }, [onMetricsChange]);

    return <div data-testid="virtualized-list">Virtualized List</div>;
  },
}));

// Mock the NonVirtualizedList component
vi.mock('../../src/components/non-virtualized-list/non-virtualized-list', () => ({
  NonVirtualizedList: ({
    onMetricsUpdate,
  }: {
    onMetricsUpdate: (metrics: CorePerformanceMetrics) => void;
  }) => {
    // Simulate metrics updates for non-virtualized list using useEffect
    React.useEffect(() => {
      // Send multiple metrics updates to simulate real behavior (every second)
      const timer1 = setTimeout(() => {
        onMetricsUpdate({
          fps: 30,
          memoryUsage: 100,
          domNodes: 10000,
          renderTime: 50,
        });
      }, 100);

      const timer2 = setTimeout(() => {
        onMetricsUpdate({
          fps: 30,
          memoryUsage: 100,
          domNodes: 10000,
          renderTime: 50,
        });
      }, 1100);

      const timer3 = setTimeout(() => {
        onMetricsUpdate({
          fps: 30,
          memoryUsage: 100,
          domNodes: 10000,
          renderTime: 50,
        });
      }, 2100);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }, [onMetricsUpdate]);

    return <div data-testid="non-virtualized-list">Non-Virtualized List</div>;
  },
}));

describe('UnifiedDemoPage Integration Tests', () => {
  beforeEach(() => {
    // Use real timers for these integration tests
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Task 16.1: Test complete baseline establishment flow
   * Requirements: 3.1, 8.1, 9.1, 9.6
   */
  describe('Baseline Establishment Flow', () => {
    it(
      'should establish baseline after 2+ seconds in non-virtualized mode',
      async () => {
        render(<UnifiedDemoPage />);

        // Step 1: Verify non-virtualized mode is active
        await waitFor(
          () => {
            expect(screen.getByTestId('non-virtualized-list')).toBeInTheDocument();
          },
          { timeout: 1000 }
        );

        // Step 2: Verify instructions are displayed
        expect(screen.getByText(/Wait 2\+ seconds for baseline capture/i)).toBeInTheDocument();

        // Step 3: Wait for metrics to be collected
        await waitFor(
          () => {
            expect(screen.getByText(/FPS:/i)).toBeInTheDocument();
          },
          { timeout: 1000 }
        );

        // Step 4: Wait for baseline capture (2+ seconds)
        await waitFor(
          () => {
            expect(screen.getByText(/Baseline Captured!/i)).toBeInTheDocument();
          },
          { timeout: 3000 }
        );

        // Step 5: Verify success message
        expect(
          screen.getByText(/Switch to Virtualized mode to see resource savings/i)
        ).toBeInTheDocument();

        // Step 6: Verify baseline info is displayed
        expect(screen.getByText(/Baseline Established/i)).toBeInTheDocument();
        expect(screen.getByText(/10,000 items/i)).toBeInTheDocument();
      },
      10000
    );

    it('should display instructions on initial load', () => {
      render(<UnifiedDemoPage />);

      // Verify instructions panel exists
      expect(screen.getByText(/Instructions/i)).toBeInTheDocument();
      expect(screen.getByText(/Wait 2\+ seconds for baseline capture/i)).toBeInTheDocument();
      expect(screen.getByText(/Compare resource savings/i)).toBeInTheDocument();
    });
  });

  /**
   * Task 16.2: Test complete savings comparison flow
   * Requirements: 3.2, 4.2, 4.3, 4.4, 4.5
   */
  describe('Savings Comparison Flow', () => {
    it(
      'should display resource savings when switching to virtualized mode with baseline',
      async () => {
        const user = userEvent.setup();

        render(<UnifiedDemoPage />);

        // Step 1: Wait for baseline to be established
        await waitFor(
          () => {
            expect(screen.getByText(/Baseline Captured!/i)).toBeInTheDocument();
          },
          { timeout: 3000 }
        );

        // Step 2: Switch to virtualized mode using test ID
        const virtualizedButton = screen.getByTestId('mode-toggle-virtualized');
        await user.click(virtualizedButton);

        await waitFor(
          () => {
            expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
          },
          { timeout: 1000 }
        );

        // Step 3: Verify savings panel is displayed
        await waitFor(
          () => {
            expect(screen.getByText(/Resource Savings/i)).toBeInTheDocument();
          },
          { timeout: 1000 }
        );

        // Step 4: Verify all four metrics are displayed
        const savingsPanel = screen.getByText(/Resource Savings/i).closest('div');
        expect(savingsPanel).toBeInTheDocument();

        // Memory saved
        expect(within(savingsPanel!).getByText(/Memory Saved/i)).toBeInTheDocument();

        // DOM nodes saved
        expect(within(savingsPanel!).getByText(/DOM Nodes Saved/i)).toBeInTheDocument();

        // FPS improvement
        expect(within(savingsPanel!).getByText(/FPS Improvement/i)).toBeInTheDocument();

        // Render time saved
        expect(within(savingsPanel!).getByText(/Render Time Saved/i)).toBeInTheDocument();
      },
      10000
    );

    it(
      'should display warning when switching to virtualized mode without baseline',
      async () => {
        render(<UnifiedDemoPage initialMode="virtualized" />);

        await waitFor(
          () => {
            expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
          },
          { timeout: 1000 }
        );

        // Verify warning is displayed
        const noBaselineTexts = screen.getAllByText(/No Baseline/i);
        expect(noBaselineTexts.length).toBeGreaterThan(0);
        expect(
          screen.getByText(/Switch to Non-Virtualized mode first to establish a baseline/i)
        ).toBeInTheDocument();

        // Verify savings panel is NOT displayed (check for the savings panel heading specifically)
        const savingsPanelHeading = screen.queryByRole('heading', { name: /Resource Savings/i });
        expect(savingsPanelHeading).not.toBeInTheDocument();
      },
      10000
    );
  });

  /**
   * Task 16.3: Test configuration change flow
   * Requirements: 8.3
   */
  describe('Configuration Change Flow', () => {
    it(
      'should allow baseline reset',
      async () => {
        const user = userEvent.setup();

        render(<UnifiedDemoPage />);

        // Step 1: Establish baseline
        await waitFor(
          () => {
            expect(screen.getByText(/Baseline Captured!/i)).toBeInTheDocument();
          },
          { timeout: 3000 }
        );

        // Verify baseline info is displayed
        expect(screen.getByText(/Baseline Established/i)).toBeInTheDocument();

        // Step 2: Click reset baseline button
        const resetButton = screen.getByText(/Reset Baseline/i);
        await user.click(resetButton);

        // Step 3: Verify baseline is cleared (instructions reappear)
        await waitFor(
          () => {
            expect(screen.getByText(/No Baseline Available/i)).toBeInTheDocument();
          },
          { timeout: 1000 }
        );

        // Verify instructions are displayed again
        expect(screen.getByText(/Wait 2\+ seconds for baseline capture/i)).toBeInTheDocument();
      },
      10000
    );
  });

  /**
   * Task 16.4: Test mode switching flow
   * Requirements: 2.1, 5.5, 8.2
   */
  describe('Mode Switching Flow', () => {
    it(
      'should ensure only one list is mounted at a time',
      async () => {
        const user = userEvent.setup();

        render(<UnifiedDemoPage />);

        // Initial: non-virtualized list should be mounted
        await waitFor(
          () => {
            expect(screen.getByTestId('non-virtualized-list')).toBeInTheDocument();
          },
          { timeout: 1000 }
        );
        expect(screen.queryByTestId('virtualized-list')).not.toBeInTheDocument();

        // Switch to virtualized mode
        const virtualizedButton = screen.getByTestId('mode-toggle-virtualized');
        await user.click(virtualizedButton);

        await waitFor(
          () => {
            expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
          },
          { timeout: 1000 }
        );

        // Verify only virtualized list is mounted
        expect(screen.queryByTestId('non-virtualized-list')).not.toBeInTheDocument();

        // Switch back to non-virtualized mode
        const nonVirtualizedButton = screen.getByTestId('mode-toggle-non-virtualized');
        await user.click(nonVirtualizedButton);

        await waitFor(
          () => {
            expect(screen.getByTestId('non-virtualized-list')).toBeInTheDocument();
          },
          { timeout: 1000 }
        );

        // Verify only non-virtualized list is mounted
        expect(screen.queryByTestId('virtualized-list')).not.toBeInTheDocument();
      },
      10000
    );

    it(
      'should update metrics for the active list',
      async () => {
        const user = userEvent.setup();

        render(<UnifiedDemoPage />);

        // Wait for non-virtualized metrics
        await waitFor(
          () => {
            expect(screen.getByText(/30\.0/)).toBeInTheDocument(); // Non-virtualized FPS
          },
          { timeout: 1000 }
        );

        // Switch to virtualized mode
        const virtualizedButton = screen.getByTestId('mode-toggle-virtualized');
        await user.click(virtualizedButton);

        // Wait for virtualized metrics
        await waitFor(
          () => {
            expect(screen.getByText(/58\.0/)).toBeInTheDocument(); // Virtualized FPS
          },
          { timeout: 1000 }
        );

        // Verify non-virtualized FPS is no longer displayed
        expect(screen.queryByText(/30\.0/)).not.toBeInTheDocument();
      },
      10000
    );

    it(
      'should preserve baseline across mode switches',
      async () => {
        const user = userEvent.setup();

        render(<UnifiedDemoPage />);

        // Establish baseline in non-virtualized mode
        await waitFor(
          () => {
            expect(screen.getByText(/Baseline Captured!/i)).toBeInTheDocument();
          },
          { timeout: 3000 }
        );

        // Verify baseline info
        expect(screen.getByText(/Baseline Established/i)).toBeInTheDocument();
        expect(screen.getByText(/10,000 items/i)).toBeInTheDocument();

        // Switch to virtualized mode
        const virtualizedButton = screen.getByTestId('mode-toggle-virtualized');
        await user.click(virtualizedButton);

        await waitFor(
          () => {
            expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
          },
          { timeout: 1000 }
        );

        // Verify baseline is still available (savings displayed)
        await waitFor(
          () => {
            expect(screen.getByText(/Resource Savings/i)).toBeInTheDocument();
          },
          { timeout: 1000 }
        );
        expect(screen.getByText(/Baseline Established/i)).toBeInTheDocument();

        // Switch back to non-virtualized mode
        const nonVirtualizedButton = screen.getByTestId('mode-toggle-non-virtualized');
        await user.click(nonVirtualizedButton);

        await waitFor(
          () => {
            expect(screen.getByTestId('non-virtualized-list')).toBeInTheDocument();
          },
          { timeout: 1000 }
        );

        // Verify baseline is still preserved
        expect(screen.getByText(/Baseline Established/i)).toBeInTheDocument();
        expect(screen.getByText(/10,000 items/i)).toBeInTheDocument();

        // Should show success message (baseline already established)
        expect(screen.getByText(/Baseline Captured!/i)).toBeInTheDocument();
      },
      10000
    );
  });

  /**
   * Complete End-to-End Workflow
   */
  describe('Complete End-to-End Workflow', () => {
    it(
      'should complete full workflow from baseline to comparison',
      async () => {
        const user = userEvent.setup();

        render(<UnifiedDemoPage />);

        // 1. Initial load - non-virtualized mode
        await waitFor(
          () => {
            expect(screen.getByTestId('non-virtualized-list')).toBeInTheDocument();
          },
          { timeout: 1000 }
        );

        // 2. Wait for baseline capture
        await waitFor(
          () => {
            expect(screen.getByText(/Baseline Captured!/i)).toBeInTheDocument();
          },
          { timeout: 3000 }
        );

        // 3. Switch to virtualized mode
        const virtualizedButton = screen.getByTestId('mode-toggle-virtualized');
        await user.click(virtualizedButton);

        await waitFor(
          () => {
            expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
          },
          { timeout: 1000 }
        );

        // 4. Verify savings are displayed
        await waitFor(
          () => {
            expect(screen.getByText(/Resource Savings/i)).toBeInTheDocument();
          },
          { timeout: 1000 }
        );

        // 5. Verify all metrics are present
        expect(screen.getByText(/Memory Saved/i)).toBeInTheDocument();
        expect(screen.getByText(/DOM Nodes Saved/i)).toBeInTheDocument();
        expect(screen.getByText(/FPS Improvement/i)).toBeInTheDocument();
        expect(screen.getByText(/Render Time Saved/i)).toBeInTheDocument();
      },
      15000
    );
  });
});
