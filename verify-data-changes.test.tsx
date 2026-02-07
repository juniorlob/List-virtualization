/**
 * Standalone test to verify data change handling
 * Run with: npx tsx verify-data-changes.test.tsx
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { VirtualizedList } from './src/components/virtualized-list';

describe('Data Change Verification', () => {
  it('should handle data length increase', () => {
    const initialData = [1, 2, 3];
    const { rerender, container } = render(
      <VirtualizedList
        data={initialData}
        renderItem={(item: number) => <div>{item}</div>}
        itemHeight={50}
      />
    );

    const contentSpacer = container.querySelector('div[style*="position: relative"]') as HTMLElement;
    expect(contentSpacer.style.height).toBe('150px');

    // Increase data
    const newData = [1, 2, 3, 4, 5];
    rerender(
      <VirtualizedList
        data={newData}
        renderItem={(item: number) => <div>{item}</div>}
        itemHeight={50}
      />
    );

    expect(contentSpacer.style.height).toBe('250px');
    console.log('✓ Data length increase handled correctly');
  });

  it('should handle data length decrease', () => {
    const initialData = [1, 2, 3, 4, 5];
    const { rerender, container } = render(
      <VirtualizedList
        data={initialData}
        renderItem={(item: number) => <div>{item}</div>}
        itemHeight={50}
      />
    );

    const contentSpacer = container.querySelector('div[style*="position: relative"]') as HTMLElement;
    expect(contentSpacer.style.height).toBe('250px');

    // Decrease data
    const newData = [1, 2];
    rerender(
      <VirtualizedList
        data={newData}
        renderItem={(item: number) => <div>{item}</div>}
        itemHeight={50}
      />
    );

    expect(contentSpacer.style.height).toBe('100px');
    console.log('✓ Data length decrease handled correctly');
  });

  it('should handle empty data', () => {
    const { container } = render(
      <VirtualizedList
        data={[]}
        renderItem={(item: number) => <div>{item}</div>}
        itemHeight={50}
      />
    );

    const contentSpacer = container.querySelector('div[style*="position: relative"]') as HTMLElement;
    expect(contentSpacer.style.height).toBe('0px');
    console.log('✓ Empty data handled correctly');
  });
});

console.log('\n=== Data Change Handling Verification ===\n');
