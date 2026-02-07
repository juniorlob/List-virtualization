/**
 * Data generation utilities for demo purposes
 */

/**
 * Demo item structure with all required properties
 */
export interface DemoItem {
  id: string;
  name: string;
  description: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * Generates mock data for demonstration purposes
 *
 * @param itemCount - Number of items to generate (100 to 100,000)
 * @returns Array of DemoItem objects with unique IDs
 *
 * @example
 * ```typescript
 * const data = generateData(1000);
 * console.log(data.length); // 1000
 * console.log(data[0].id); // "item-0"
 * ```
 */
export function generateData(itemCount: number): DemoItem[] {
  // Validate input and clamp to supported range
  const count = Math.max(100, Math.min(100000, Math.floor(itemCount)));

  const items: DemoItem[] = [];
  const baseTimestamp = Date.now();

  for (let i = 0; i < count; i++) {
    items.push({
      id: `item-${i}`,
      name: `Item ${i + 1}`,
      description: `This is the description for item number ${i + 1}. It contains some sample text to demonstrate how the virtualized list handles varying content lengths.`,
      timestamp: baseTimestamp + i * 1000, // Increment by 1 second for each item
      metadata: {
        index: i,
        category: getCategoryForIndex(i),
        priority: getPriorityForIndex(i),
        tags: getTagsForIndex(i),
      },
    });
  }

  return items;
}

/**
 * Helper function to assign a category based on index
 */
function getCategoryForIndex(index: number): string {
  const categories = ['Work', 'Personal', 'Shopping', 'Health', 'Education'];
  return categories[index % categories.length];
}

/**
 * Helper function to assign a priority based on index
 */
function getPriorityForIndex(index: number): 'low' | 'medium' | 'high' {
  const priorities: Array<'low' | 'medium' | 'high'> = ['low', 'medium', 'high'];
  return priorities[index % priorities.length];
}

/**
 * Helper function to generate tags based on index
 */
function getTagsForIndex(index: number): string[] {
  const allTags = ['important', 'urgent', 'review', 'archived', 'draft', 'published'];
  const tagCount = (index % 3) + 1; // 1 to 3 tags per item
  return allTags.slice(0, tagCount);
}
