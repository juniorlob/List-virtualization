/**
 * Unit tests for VirtualizedList component
 *
 * Tests component structure, props interface, and TypeScript generics.
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';

import { VirtualizedList } from '@/components/virtualized-list';

describe('VirtualizedList Component', () => {
  describe('Component Structure (Task 6.1)', () => {
    it('should accept generic type parameter for data items', () => {
      interface TestItem {
        id: string;
        name: string;
      }

      const data: TestItem[] = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
      ];

      const { container } = render(
        <VirtualizedList
          data={data}
          renderItem={(item: TestItem) => <div>{item.name}</div>}
          itemHeight={50}
        />
      );

      expect(container).toBeTruthy();
    });

    it('should accept required props: data, renderItem, itemHeight', () => {
      const data = [1, 2, 3, 4, 5];

      const { container } = render(
        <VirtualizedList
          data={data}
          renderItem={(item: number) => <div>{item}</div>}
          itemHeight={50}
        />
      );

      expect(container).toBeTruthy();
    });

    it('should accept optional props: containerHeight, overscan, className', () => {
      const data = ['a', 'b', 'c'];

      const { container } = render(
        <VirtualizedList
          data={data}
          renderItem={(item: string) => <div>{item}</div>}
          itemHeight={50}
          containerHeight={800}
          overscan={5}
          className="custom-class"
        />
      );

      expect(container).toBeTruthy();
    });

    it('should accept optional onMetricsChange callback', () => {
      const data = [1, 2, 3];
      const onMetricsChange = () => {};

      const { container } = render(
        <VirtualizedList
          data={data}
          renderItem={(item: number) => <div>{item}</div>}
          itemHeight={50}
          onMetricsChange={onMetricsChange}
        />
      );

      expect(container).toBeTruthy();
    });

    it('should accept optional calculator instance', () => {
      const data = [1, 2, 3];
      const mockCalculator = {
        calculateVisibleRange: () => ({ start: 0, end: 2 }),
        calculateItemPosition: (index: number) => ({ top: index * 50, height: 50 }),
        calculateTotalHeight: (count: number, height: number) => count * height,
      };

      const { container } = render(
        <VirtualizedList
          data={data}
          renderItem={(item: number) => <div>{item}</div>}
          itemHeight={50}
          calculator={mockCalculator}
        />
      );

      expect(container).toBeTruthy();
    });

    it('should render scroll container with correct structure', () => {
      const data = [1, 2, 3];

      const { container } = render(
        <VirtualizedList
          data={data}
          renderItem={(item: number) => <div>{item}</div>}
          itemHeight={50}
          containerHeight={600}
        />
      );

      // Should have a scroll container
      const scrollContainer = container.querySelector('div[style*="overflow"]');
      expect(scrollContainer).toBeTruthy();

      // Should have a content spacer inside
      const contentSpacer = container.querySelector('div[style*="position: relative"]');
      expect(contentSpacer).toBeTruthy();
    });

    it('should apply custom className to scroll container', () => {
      const data = [1, 2, 3];

      const { container } = render(
        <VirtualizedList
          data={data}
          renderItem={(item: number) => <div>{item}</div>}
          itemHeight={50}
          className="my-custom-class"
        />
      );

      const scrollContainer = container.firstChild as HTMLElement;
      expect(scrollContainer.className).toContain('my-custom-class');
    });

    it('should use default containerHeight when not provided', () => {
      const data = [1, 2, 3];

      const { container } = render(
        <VirtualizedList
          data={data}
          renderItem={(item: number) => <div>{item}</div>}
          itemHeight={50}
        />
      );

      const scrollContainer = container.firstChild as HTMLElement;
      expect(scrollContainer.style.height).toBe('600px'); // Default is 600
    });

    it('should use custom containerHeight when provided', () => {
      const data = [1, 2, 3];

      const { container } = render(
        <VirtualizedList
          data={data}
          renderItem={(item: number) => <div>{item}</div>}
          itemHeight={50}
          containerHeight={800}
        />
      );

      const scrollContainer = container.firstChild as HTMLElement;
      expect(scrollContainer.style.height).toBe('800px');
    });

    it('should work with complex data types', () => {
      interface ComplexItem {
        id: string;
        name: string;
        metadata: {
          timestamp: number;
          tags: string[];
        };
      }

      const data: ComplexItem[] = [
        {
          id: '1',
          name: 'Complex Item',
          metadata: {
            timestamp: Date.now(),
            tags: ['tag1', 'tag2'],
          },
        },
      ];

      const { container } = render(
        <VirtualizedList
          data={data}
          renderItem={(item: ComplexItem) => (
            <div>
              {item.name} - {item.metadata.tags.join(', ')}
            </div>
          )}
          itemHeight={50}
        />
      );

      expect(container).toBeTruthy();
    });
  });

  describe('Data Change Handling (Task 6.4)', () => {
    it('should handle data length increase without errors', () => {
      const initialData = [1, 2, 3];

      const { rerender, container } = render(
        <VirtualizedList
          data={initialData}
          renderItem={(item: number) => <div data-testid="item">{item}</div>}
          itemHeight={50}
          containerHeight={200}
        />
      );

      // Verify initial render
      expect(container).toBeTruthy();

      // Increase data length
      const newData = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      rerender(
        <VirtualizedList
          data={newData}
          renderItem={(item: number) => <div data-testid="item">{item}</div>}
          itemHeight={50}
          containerHeight={200}
        />
      );

      // Should not throw errors and should update
      expect(container).toBeTruthy();
    });

    it('should handle data length decrease without errors', () => {
      const initialData = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

      const { rerender, container } = render(
        <VirtualizedList
          data={initialData}
          renderItem={(item: number) => <div data-testid="item">{item}</div>}
          itemHeight={50}
          containerHeight={200}
        />
      );

      // Verify initial render
      expect(container).toBeTruthy();

      // Decrease data length
      const newData = [1, 2, 3];
      rerender(
        <VirtualizedList
          data={newData}
          renderItem={(item: number) => <div data-testid="item">{item}</div>}
          itemHeight={50}
          containerHeight={200}
        />
      );

      // Should not throw errors and should update
      expect(container).toBeTruthy();
    });

    it('should recalculate total height when data length changes', () => {
      const initialData = [1, 2, 3];

      const { rerender, container } = render(
        <VirtualizedList
          data={initialData}
          renderItem={(item: number) => <div>{item}</div>}
          itemHeight={50}
        />
      );

      // Get content spacer (inner div with total height)
      const contentSpacer = container.querySelector('div[style*="position: relative"]') as HTMLElement;
      expect(contentSpacer.style.height).toBe('150px'); // 3 items * 50px

      // Increase data length
      const newData = [1, 2, 3, 4, 5];
      rerender(
        <VirtualizedList
          data={newData}
          renderItem={(item: number) => <div>{item}</div>}
          itemHeight={50}
        />
      );

      // Total height should update
      expect(contentSpacer.style.height).toBe('250px'); // 5 items * 50px
    });

    it('should handle empty data array', () => {
      const { container } = render(
        <VirtualizedList
          data={[]}
          renderItem={(item: number) => <div>{item}</div>}
          itemHeight={50}
        />
      );

      // Should render without errors
      expect(container).toBeTruthy();

      // Content spacer should have zero height
      const contentSpacer = container.querySelector('div[style*="position: relative"]') as HTMLElement;
      expect(contentSpacer.style.height).toBe('0px');
    });

    it('should handle transition from empty to populated data', () => {
      const { rerender, container } = render(
        <VirtualizedList
          data={[]}
          renderItem={(item: number) => <div data-testid="item">{item}</div>}
          itemHeight={50}
          containerHeight={200}
        />
      );

      // Verify empty state
      const contentSpacer = container.querySelector('div[style*="position: relative"]') as HTMLElement;
      expect(contentSpacer.style.height).toBe('0px');

      // Add data
      const newData = [1, 2, 3, 4, 5];
      rerender(
        <VirtualizedList
          data={newData}
          renderItem={(item: number) => <div data-testid="item">{item}</div>}
          itemHeight={50}
          containerHeight={200}
        />
      );

      // Should update height
      expect(contentSpacer.style.height).toBe('250px'); // 5 items * 50px
    });

    it('should handle transition from populated to empty data', () => {
      const initialData = [1, 2, 3, 4, 5];

      const { rerender, container } = render(
        <VirtualizedList
          data={initialData}
          renderItem={(item: number) => <div data-testid="item">{item}</div>}
          itemHeight={50}
          containerHeight={200}
        />
      );

      // Verify initial state
      const contentSpacer = container.querySelector('div[style*="position: relative"]') as HTMLElement;
      expect(contentSpacer.style.height).toBe('250px');

      // Clear data
      rerender(
        <VirtualizedList
          data={[]}
          renderItem={(item: number) => <div data-testid="item">{item}</div>}
          itemHeight={50}
          containerHeight={200}
        />
      );

      // Should update to zero height
      expect(contentSpacer.style.height).toBe('0px');
    });

    it('should maintain scroll position when data changes', () => {
      const initialData = Array.from({ length: 100 }, (_, i) => i);

      const { rerender, container } = render(
        <VirtualizedList
          data={initialData}
          renderItem={(item: number) => <div>{item}</div>}
          itemHeight={50}
          containerHeight={200}
        />
      );

      const scrollContainer = container.firstChild as HTMLElement;

      // Simulate scroll
      scrollContainer.scrollTop = 500;

      // Change data (add more items)
      const newData = Array.from({ length: 150 }, (_, i) => i);
      rerender(
        <VirtualizedList
          data={newData}
          renderItem={(item: number) => <div>{item}</div>}
          itemHeight={50}
          containerHeight={200}
        />
      );

      // Scroll position should be maintained
      expect(scrollContainer.scrollTop).toBe(500);
    });

    it('should render only visible items after data change', () => {
      const initialData = Array.from({ length: 10 }, (_, i) => i);

      const { rerender, container } = render(
        <VirtualizedList
          data={initialData}
          renderItem={(item: number) => <div>{item}</div>}
          itemHeight={50}
          containerHeight={200}
          overscan={1}
        />
      );

      // Initial render should have limited items (visible + overscan)
      // Query for list items specifically (the wrapper divs with data-index)
      const initialItems = container.querySelectorAll('.listItem, [data-index]');
      expect(initialItems.length).toBeLessThan(10);

      // Increase data significantly
      const newData = Array.from({ length: 1000 }, (_, i) => i);
      rerender(
        <VirtualizedList
          data={newData}
          renderItem={(item: number) => <div>{item}</div>}
          itemHeight={50}
          containerHeight={200}
          overscan={1}
        />
      );

      // Should still render only visible items, not all 1000
      const newItems = container.querySelectorAll('.listItem, [data-index]');
      expect(newItems.length).toBeLessThan(20); // Should be around visible + overscan
      expect(newItems.length).toBeGreaterThan(0);
    });

    it('should handle data content changes (not just length)', () => {
      const initialData = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
        { id: '3', name: 'Item 3' },
      ];

      const { rerender, container } = render(
        <VirtualizedList
          data={initialData}
          renderItem={(item) => <div data-testid="item-name">{item.name}</div>}
          itemHeight={50}
        />
      );

      // Update data content (same length, different values)
      const newData = [
        { id: '1', name: 'Updated 1' },
        { id: '2', name: 'Updated 2' },
        { id: '3', name: 'Updated 3' },
      ];

      rerender(
        <VirtualizedList
          data={newData}
          renderItem={(item) => <div data-testid="item-name">{item.name}</div>}
          itemHeight={50}
        />
      );

      // Should render without errors
      expect(container).toBeTruthy();
    });
  });
});
