/**
 * Unit tests for NonVirtualizedList component
 *
 * Tests verify:
 * - Component renders all items without virtualization
 * - Metrics callback is called at regular intervals
 * - Cleanup occurs properly on unmount
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { NonVirtualizedList } from './non-virtualized-list';

import type { PerformanceMetrics } from '@/core/virtualization/types';

describe('NonVirtualizedList', () => {
  it('should render all items without virtualization', () => {
    const testData = Array.from({ length: 100 }, (_, i) => ({
      id: `item-${i}`,
      content: `Item ${i}`,
    }));

    const onMetricsUpdate = vi.fn();

    render(
      <NonVirtualizedList
        data={testData}
        itemHeight={50}
        onMetricsUpdate={onMetricsUpdate}
        renderItem={(item) => <span>{item.content}</span>}
      />
    );

    // Verify all items are rendered
    const items = screen.getAllByTestId('list-item');
    expect(items).toHaveLength(100);

    // Verify first and last items are present
    expect(screen.getByText('Item 0')).toBeInTheDocument();
    expect(screen.getByText('Item 99')).toBeInTheDocument();
  });

  it('should call onMetricsUpdate callback every second', async () => {
    const testData = Array.from({ length: 10 }, (_, i) => ({
      id: `item-${i}`,
      content: `Item ${i}`,
    }));

    const onMetricsUpdate = vi.fn();

    render(
      <NonVirtualizedList
        data={testData}
        itemHeight={50}
        onMetricsUpdate={onMetricsUpdate}
        renderItem={(item) => <span>{item.content}</span>}
      />
    );

    // Initially, callback should not have been called
    expect(onMetricsUpdate).not.toHaveBeenCalled();

    // Wait for at least one callback (using real timers)
    await waitFor(
      () => {
        expect(onMetricsUpdate).toHaveBeenCalled();
      },
      { timeout: 2000 }
    );

    // Verify the callback receives PerformanceMetrics
    const metricsArg = onMetricsUpdate.mock.calls[0][0] as PerformanceMetrics;
    expect(metricsArg).toHaveProperty('fps');
    expect(metricsArg).toHaveProperty('memoryUsage');
    expect(metricsArg).toHaveProperty('domNodes');
    expect(metricsArg).toHaveProperty('renderTime');
  });

  it('should apply correct item height to each item', () => {
    const testData = Array.from({ length: 5 }, (_, i) => ({
      id: `item-${i}`,
      content: `Item ${i}`,
    }));

    const onMetricsUpdate = vi.fn();

    render(
      <NonVirtualizedList
        data={testData}
        itemHeight={75}
        onMetricsUpdate={onMetricsUpdate}
        renderItem={(item) => <span>{item.content}</span>}
      />
    );

    const items = screen.getAllByTestId('list-item');

    // Verify each item has the correct height
    items.forEach((item) => {
      expect(item).toHaveStyle({ height: '75px' });
    });
  });

  it('should cleanup performance monitor on unmount', async () => {
    const testData = Array.from({ length: 10 }, (_, i) => ({
      id: `item-${i}`,
      content: `Item ${i}`,
    }));

    const onMetricsUpdate = vi.fn();

    const { unmount } = render(
      <NonVirtualizedList
        data={testData}
        itemHeight={50}
        onMetricsUpdate={onMetricsUpdate}
        renderItem={(item) => <span>{item.content}</span>}
      />
    );

    // Wait for at least one callback
    await waitFor(
      () => {
        expect(onMetricsUpdate).toHaveBeenCalled();
      },
      { timeout: 2000 }
    );

    const callCountBeforeUnmount = onMetricsUpdate.mock.calls.length;

    // Unmount the component
    unmount();

    // Wait a bit to ensure no more calls happen
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // Callback should not be called after unmount
    expect(onMetricsUpdate).toHaveBeenCalledTimes(callCountBeforeUnmount);
  }, 6000); // Increase timeout for this test

  it('should render custom content via renderItem prop', () => {
    const testData = [
      { id: '1', name: 'Alice', age: 30 },
      { id: '2', name: 'Bob', age: 25 },
    ];

    const onMetricsUpdate = vi.fn();

    render(
      <NonVirtualizedList
        data={testData}
        itemHeight={50}
        onMetricsUpdate={onMetricsUpdate}
        renderItem={(item) => (
          <div>
            <strong>{item.name}</strong> - {item.age} years old
          </div>
        )}
      />
    );

    // Verify custom content is rendered
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('- 30 years old')).toBeInTheDocument();
    expect(screen.getByText('- 25 years old')).toBeInTheDocument();
  });

  it('should handle empty data array', () => {
    const onMetricsUpdate = vi.fn();

    render(
      <NonVirtualizedList
        data={[]}
        itemHeight={50}
        onMetricsUpdate={onMetricsUpdate}
        renderItem={(item) => <span>{item}</span>}
      />
    );

    // Verify container is rendered but no items
    const container = screen.getByTestId('non-virtualized-list');
    expect(container).toBeInTheDocument();

    const items = screen.queryAllByTestId('list-item');
    expect(items).toHaveLength(0);
  });
});
