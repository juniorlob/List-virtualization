/**
 * Unit tests for control value persistence in UnifiedDemoPage
 *
 * Validates: Requirements 5.5
 * Tests that control values (dataset size, item height, overscan) persist
 * across mode switches.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { UnifiedDemoPage } from '../../../src/demo/pages/unified-demo-page';

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

describe('UnifiedDemoPage - Control Value Persistence', () => {
  it('should persist dataset size when switching from non-virtualized to virtualized mode', async () => {
    const { container } = render(<UnifiedDemoPage />);

    // Verify initial render in non-virtualized mode
    expect(screen.getByTestId('non-virtualized-list')).toBeInTheDocument();

    // Find and change dataset size control
    const datasetSizeInput = screen.getByTestId('dataset-size-control-input') as HTMLInputElement;
    expect(datasetSizeInput.value).toBe('10000'); // Default value

    // Change dataset size to 5000
    fireEvent.change(datasetSizeInput, { target: { value: '5000' } });
    expect(datasetSizeInput.value).toBe('5000');

    // Switch to virtualized mode
    const virtualizedButton = screen.getByTestId('mode-toggle-virtualized');
    await act(async () => {
      fireEvent.click(virtualizedButton);
      // Wait for requestAnimationFrame callbacks
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    // Verify virtualized list is now rendered
    expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
    expect(screen.queryByTestId('non-virtualized-list')).not.toBeInTheDocument();

    // Verify dataset size persisted
    const datasetSizeInputAfter = screen.getByTestId('dataset-size-control-input') as HTMLInputElement;
    expect(datasetSizeInputAfter.value).toBe('5000');
  });

  it('should persist item height when switching from virtualized to non-virtualized mode', async () => {
    render(<UnifiedDemoPage initialMode="virtualized" />);

    // Verify initial render in virtualized mode
    expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();

    // Find and change item height control
    const itemHeightInput = screen.getByTestId('item-height-control-input') as HTMLInputElement;
    expect(itemHeightInput.value).toBe('50'); // Default value

    // Change item height to 100
    fireEvent.change(itemHeightInput, { target: { value: '100' } });
    expect(itemHeightInput.value).toBe('100');

    // Switch to non-virtualized mode
    const nonVirtualizedButton = screen.getByTestId('mode-toggle-non-virtualized');
    await act(async () => {
      fireEvent.click(nonVirtualizedButton);
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    // Verify non-virtualized list is now rendered
    expect(screen.getByTestId('non-virtualized-list')).toBeInTheDocument();
    expect(screen.queryByTestId('virtualized-list')).not.toBeInTheDocument();

    // Verify item height persisted
    const itemHeightInputAfter = screen.getByTestId('item-height-control-input') as HTMLInputElement;
    expect(itemHeightInputAfter.value).toBe('100');
  });

  it('should persist overscan when switching modes multiple times', async () => {
    render(<UnifiedDemoPage initialMode="virtualized" />);

    // Verify initial render in virtualized mode
    expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();

    // Find and change overscan control (only visible in virtualized mode)
    const overscanInput = screen.getByTestId('overscan-control-input') as HTMLInputElement;
    expect(overscanInput.value).toBe('3'); // Default value

    // Change overscan to 7
    fireEvent.change(overscanInput, { target: { value: '7' } });
    expect(overscanInput.value).toBe('7');

    // Switch to non-virtualized mode
    const nonVirtualizedButton = screen.getByTestId('mode-toggle-non-virtualized');
    await act(async () => {
      fireEvent.click(nonVirtualizedButton);
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    // Verify non-virtualized list is rendered
    expect(screen.getByTestId('non-virtualized-list')).toBeInTheDocument();

    // Overscan control should not be visible in non-virtualized mode
    expect(screen.queryByTestId('overscan-control')).not.toBeInTheDocument();

    // Switch back to virtualized mode
    const virtualizedButton = screen.getByTestId('mode-toggle-virtualized');
    await act(async () => {
      fireEvent.click(virtualizedButton);
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    // Verify virtualized list is rendered again
    expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();

    // Verify overscan persisted
    const overscanInputAfter = screen.getByTestId('overscan-control-input') as HTMLInputElement;
    expect(overscanInputAfter.value).toBe('7');
  });

  it('should persist all control values when switching modes back and forth', async () => {
    render(<UnifiedDemoPage />);

    // Verify initial render (non-virtualized mode)
    expect(screen.getByTestId('non-virtualized-list')).toBeInTheDocument();

    // Change all control values
    const datasetSizeInput = screen.getByTestId('dataset-size-control-input') as HTMLInputElement;
    const itemHeightInput = screen.getByTestId('item-height-control-input') as HTMLInputElement;

    fireEvent.change(datasetSizeInput, { target: { value: '15000' } });
    fireEvent.change(itemHeightInput, { target: { value: '75' } });

    // Verify values changed
    expect(datasetSizeInput.value).toBe('15000');
    expect(itemHeightInput.value).toBe('75');

    // Switch to virtualized mode
    const virtualizedButton = screen.getByTestId('mode-toggle-virtualized');
    await act(async () => {
      fireEvent.click(virtualizedButton);
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();

    // Change overscan in virtualized mode
    const overscanInput = screen.getByTestId('overscan-control-input') as HTMLInputElement;
    fireEvent.change(overscanInput, { target: { value: '5' } });

    // Verify all values are correct
    expect((screen.getByTestId('dataset-size-control-input') as HTMLInputElement).value).toBe('15000');
    expect((screen.getByTestId('item-height-control-input') as HTMLInputElement).value).toBe('75');
    expect((screen.getByTestId('overscan-control-input') as HTMLInputElement).value).toBe('5');

    // Switch back to non-virtualized mode
    const nonVirtualizedButton = screen.getByTestId('mode-toggle-non-virtualized');
    await act(async () => {
      fireEvent.click(nonVirtualizedButton);
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    expect(screen.getByTestId('non-virtualized-list')).toBeInTheDocument();

    // Verify dataset size and item height persisted
    expect((screen.getByTestId('dataset-size-control-input') as HTMLInputElement).value).toBe('15000');
    expect((screen.getByTestId('item-height-control-input') as HTMLInputElement).value).toBe('75');

    // Switch back to virtualized mode again
    await act(async () => {
      fireEvent.click(virtualizedButton);
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();

    // Verify all values persisted through multiple switches
    expect((screen.getByTestId('dataset-size-control-input') as HTMLInputElement).value).toBe('15000');
    expect((screen.getByTestId('item-height-control-input') as HTMLInputElement).value).toBe('75');
    expect((screen.getByTestId('overscan-control-input') as HTMLInputElement).value).toBe('5');
  });

  it('should maintain control values independently of baseline state', async () => {
    render(<UnifiedDemoPage />);

    // Verify initial render
    expect(screen.getByTestId('non-virtualized-list')).toBeInTheDocument();

    // Set custom control values
    const datasetSizeInput = screen.getByTestId('dataset-size-control-input') as HTMLInputElement;
    const itemHeightInput = screen.getByTestId('item-height-control-input') as HTMLInputElement;

    fireEvent.change(datasetSizeInput, { target: { value: '20000' } });
    fireEvent.change(itemHeightInput, { target: { value: '60' } });

    // Verify control values are set
    expect(datasetSizeInput.value).toBe('20000');
    expect(itemHeightInput.value).toBe('60');

    // Change dataset size again (this would invalidate baseline if it existed)
    fireEvent.change(datasetSizeInput, { target: { value: '25000' } });

    // Verify control values are maintained
    expect((screen.getByTestId('dataset-size-control-input') as HTMLInputElement).value).toBe('25000');
    expect((screen.getByTestId('item-height-control-input') as HTMLInputElement).value).toBe('60');

    // Switch to virtualized mode
    const virtualizedButton = screen.getByTestId('mode-toggle-virtualized');
    await act(async () => {
      fireEvent.click(virtualizedButton);
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();

    // Verify control values persisted after mode switch
    expect((screen.getByTestId('dataset-size-control-input') as HTMLInputElement).value).toBe('25000');
    expect((screen.getByTestId('item-height-control-input') as HTMLInputElement).value).toBe('60');
  });
});
