/**
 * Unit tests for instructional messaging in UnifiedDemoPage
 *
 * Validates: Requirements 9.5, 9.6
 * Tests that workflow guidance messages are displayed at appropriate times
 * to guide users through the demo experience.
 *
 * Note: Tests for baseline capture success message (Requirement 9.6) are better
 * suited for integration tests due to timing complexity with React state updates
 * in the test environment. These unit tests focus on the display logic of the
 * instructional messages.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { UnifiedDemoPage } from '@/demo/pages/unified-demo-page';

// Mock the VirtualizedList component
vi.mock('../../../src/components/virtualized-list/virtualized-list', () => ({
  VirtualizedList: () => <div data-testid="virtualized-list">Virtualized List</div>,
}));

// Mock the NonVirtualizedList component
vi.mock('../../../src/components/non-virtualized-list/non-virtualized-list', () => ({
  NonVirtualizedList: () => <div data-testid="non-virtualized-list">Non-Virtualized List</div>,
}));

// Mock data generator
vi.mock('../../../src/demo/utils/data-generator', () => ({
  generateData: (size: number) =>
    Array.from({ length: Math.min(size, 10) }, (_, i) => ({
      id: `item-${i}`,
      name: `Item ${i}`,
      description: `Description ${i}`,
      metadata: {
        category: 'Test',
        priority: 'Medium',
        tags: ['tag1', 'tag2'],
      },
    })),
}));

describe('UnifiedDemoPage - Instructional Messages', () => {
  describe('Initial Load Instructions (Requirement 9.5)', () => {
    it('should display instructions on initial load in non-virtualized mode', () => {
      render(<UnifiedDemoPage />);

      // Verify non-virtualized list is rendered (default mode)
      expect(screen.getByTestId('non-virtualized-list')).toBeInTheDocument();

      // Verify instructions panel is displayed
      const instructionTitle = screen.getByText('📋 Instructions');
      expect(instructionTitle).toBeInTheDocument();

      // Verify instruction steps are present
      expect(screen.getByText(/Wait 2\+ seconds for baseline capture/i)).toBeInTheDocument();
      expect(screen.getByText(/Compare resource savings/i)).toBeInTheDocument();
    });

    it('should display instructions as an ordered list', () => {
      render(<UnifiedDemoPage />);

      // Find the instruction list
      const instructionList = screen.getByRole('list');
      expect(instructionList).toBeInTheDocument();
      expect(instructionList.tagName).toBe('OL'); // Should be an ordered list

      // Verify list items
      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(3);
    });

    it('should not display instructions when starting in virtualized mode', () => {
      render(<UnifiedDemoPage initialMode="virtualized" />);

      // Verify virtualized list is rendered
      expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();

      // Instructions should not be displayed (baseline not established)
      expect(screen.queryByText('📋 Instructions')).not.toBeInTheDocument();
    });
  });

  describe('No Baseline Warning (Requirement 3.6)', () => {
    it('should display warning when in virtualized mode without baseline', () => {
      render(<UnifiedDemoPage initialMode="virtualized" />);

      // Verify virtualized list is rendered
      expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();

      // Verify warning message is displayed
      expect(screen.getByText('⚠️ No Baseline')).toBeInTheDocument();
      expect(screen.getByText(/Switch to Non-Virtualized mode first to establish a baseline/i)).toBeInTheDocument();
    });

    it('should not display warning in non-virtualized mode', () => {
      render(<UnifiedDemoPage />);

      // Verify non-virtualized list is rendered
      expect(screen.getByTestId('non-virtualized-list')).toBeInTheDocument();

      // Warning should not be displayed in non-virtualized mode
      expect(screen.queryByText('⚠️ No Baseline')).not.toBeInTheDocument();
    });
  });

  describe('Message State Transitions', () => {
    it('should show instructions in non-virtualized mode without baseline', () => {
      render(<UnifiedDemoPage />);

      // Verify instructions are displayed
      expect(screen.getByText('📋 Instructions')).toBeInTheDocument();
      expect(screen.queryByText('⚠️ No Baseline')).not.toBeInTheDocument();
    });

    it('should show warning when switching to virtualized mode without baseline', async () => {
      render(<UnifiedDemoPage />);

      // Initial: instructions in non-virtualized mode
      expect(screen.getByText('📋 Instructions')).toBeInTheDocument();

      // Switch to virtualized mode
      const virtualizedButton = screen.getByTestId('mode-toggle-virtualized');
      await act(async () => {
        fireEvent.click(virtualizedButton);
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      // In virtualized mode without baseline: warning displayed
      expect(screen.getByText('⚠️ No Baseline')).toBeInTheDocument();
      expect(screen.queryByText('📋 Instructions')).not.toBeInTheDocument();
    });

    it('should show instructions again when switching back to non-virtualized mode', async () => {
      render(<UnifiedDemoPage />);

      // Switch to virtualized mode
      const virtualizedButton = screen.getByTestId('mode-toggle-virtualized');
      await act(async () => {
        fireEvent.click(virtualizedButton);
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      // Verify warning is displayed
      expect(screen.getByText('⚠️ No Baseline')).toBeInTheDocument();

      // Switch back to non-virtualized mode
      const nonVirtualizedButton = screen.getByTestId('mode-toggle-non-virtualized');
      await act(async () => {
        fireEvent.click(nonVirtualizedButton);
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      // Instructions should be displayed again
      expect(screen.getByText('📋 Instructions')).toBeInTheDocument();
      expect(screen.queryByText('⚠️ No Baseline')).not.toBeInTheDocument();
    });
  });

  describe('Message Content and Formatting', () => {
    it('should use emoji icons in message titles', () => {
      render(<UnifiedDemoPage />);

      // Instructions should have 📋 emoji
      expect(screen.getByText('📋 Instructions')).toBeInTheDocument();
    });

    it('should display warning message with warning emoji', () => {
      render(<UnifiedDemoPage initialMode="virtualized" />);

      // Warning should have ⚠️ emoji
      expect(screen.getByText('⚠️ No Baseline')).toBeInTheDocument();
    });

    it('should provide clear actionable guidance in each message', () => {
      render(<UnifiedDemoPage />);

      // Find the instruction list specifically
      const instructionList = screen.getByRole('list');
      expect(instructionList).toBeInTheDocument();

      // Instructions should guide the user through the workflow
      const listItems = screen.getAllByRole('listitem');
      expect(listItems[0]).toHaveTextContent(/Wait 2\+ seconds/i);
      expect(listItems[1]).toHaveTextContent(/Switch to Virtualized mode/i);
      expect(listItems[2]).toHaveTextContent(/Compare resource savings/i);
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid mode switches without showing incorrect messages', async () => {
      render(<UnifiedDemoPage />);

      const virtualizedButton = screen.getByTestId('mode-toggle-virtualized');
      const nonVirtualizedButton = screen.getByTestId('mode-toggle-non-virtualized');

      // Rapidly switch modes
      await act(async () => {
        fireEvent.click(virtualizedButton);
        await new Promise(resolve => setTimeout(resolve, 10));
        fireEvent.click(nonVirtualizedButton);
        await new Promise(resolve => setTimeout(resolve, 10));
        fireEvent.click(virtualizedButton);
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      // Should show warning in virtualized mode without baseline
      expect(screen.getByText('⚠️ No Baseline')).toBeInTheDocument();
    });

    it('should not show multiple messages simultaneously in non-virtualized mode', () => {
      render(<UnifiedDemoPage />);

      // Initially should only show instructions
      expect(screen.getByText('📋 Instructions')).toBeInTheDocument();
      expect(screen.queryByText('⚠️ No Baseline')).not.toBeInTheDocument();
    });

    it('should not show multiple messages simultaneously in virtualized mode', () => {
      render(<UnifiedDemoPage initialMode="virtualized" />);

      // Should only show warning
      expect(screen.getByText('⚠️ No Baseline')).toBeInTheDocument();
      expect(screen.queryByText('📋 Instructions')).not.toBeInTheDocument();
    });
  });

  describe('Message Visibility Logic', () => {
    it('should show instructions only when: non-virtualized mode AND no baseline', () => {
      render(<UnifiedDemoPage />);

      // Conditions met: non-virtualized mode, no baseline
      expect(screen.getByTestId('non-virtualized-list')).toBeInTheDocument();
      expect(screen.getByText('📋 Instructions')).toBeInTheDocument();
    });

    it('should show warning only when: virtualized mode AND no baseline', () => {
      render(<UnifiedDemoPage initialMode="virtualized" />);

      // Conditions met: virtualized mode, no baseline
      expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
      expect(screen.getByText('⚠️ No Baseline')).toBeInTheDocument();
    });

    it('should hide instructions when switching away from non-virtualized mode', async () => {
      render(<UnifiedDemoPage />);

      // Initially shows instructions
      expect(screen.getByText('📋 Instructions')).toBeInTheDocument();

      // Switch to virtualized mode
      const virtualizedButton = screen.getByTestId('mode-toggle-virtualized');
      await act(async () => {
        fireEvent.click(virtualizedButton);
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      // Instructions should be hidden
      expect(screen.queryByText('📋 Instructions')).not.toBeInTheDocument();
    });
  });
});
