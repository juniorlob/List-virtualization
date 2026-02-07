/**
 * Unit tests for data generator utility
 */

import { describe, it, expect } from 'vitest';
import { generateData, type DemoItem } from '../../../src/demo/utils/data-generator';

describe('generateData', () => {
  describe('basic functionality', () => {
    it('should generate the exact number of items requested', () => {
      const count = 500;
      const data = generateData(count);

      expect(data).toHaveLength(count);
    });

    it('should generate items with all required properties', () => {
      const data = generateData(100);

      data.forEach((item) => {
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('name');
        expect(item).toHaveProperty('description');
        expect(item).toHaveProperty('timestamp');
        expect(typeof item.id).toBe('string');
        expect(typeof item.name).toBe('string');
        expect(typeof item.description).toBe('string');
        expect(typeof item.timestamp).toBe('number');
      });
    });

    it('should include optional metadata property', () => {
      const data = generateData(100);

      data.forEach((item) => {
        expect(item).toHaveProperty('metadata');
        expect(item.metadata).toBeDefined();
        expect(typeof item.metadata).toBe('object');
      });
    });
  });

  describe('unique identifiers', () => {
    it('should generate unique IDs for all items', () => {
      const data = generateData(1000);
      const ids = data.map((item) => item.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(data.length);
    });

    it('should generate unique IDs even for large datasets', () => {
      const data = generateData(10000);
      const ids = data.map((item) => item.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(data.length);
    });
  });

  describe('scale support', () => {
    it('should support minimum count of 100 items', () => {
      const data = generateData(100);
      expect(data).toHaveLength(100);
    });

    it('should support count of 1,000 items', () => {
      const data = generateData(1000);
      expect(data).toHaveLength(1000);
    });

    it('should support count of 10,000 items', () => {
      const data = generateData(10000);
      expect(data).toHaveLength(10000);
    });

    it('should support maximum count of 100,000 items', () => {
      const data = generateData(100000);
      expect(data).toHaveLength(100000);
    });

    it('should clamp values below 100 to 100', () => {
      const data = generateData(50);
      expect(data).toHaveLength(100);
    });

    it('should clamp values above 100,000 to 100,000', () => {
      const data = generateData(150000);
      expect(data).toHaveLength(100000);
    });
  });

  describe('data quality', () => {
    it('should generate sequential IDs', () => {
      const data = generateData(100);

      data.forEach((item, index) => {
        expect(item.id).toBe(`item-${index}`);
      });
    });

    it('should generate sequential names', () => {
      const data = generateData(100);

      data.forEach((item, index) => {
        expect(item.name).toBe(`Item ${index + 1}`);
      });
    });

    it('should generate non-empty descriptions', () => {
      const data = generateData(100);

      data.forEach((item) => {
        expect(item.description.length).toBeGreaterThan(0);
      });
    });

    it('should generate valid timestamps', () => {
      const data = generateData(100);
      const now = Date.now();

      data.forEach((item) => {
        expect(item.timestamp).toBeGreaterThan(0);
        expect(item.timestamp).toBeLessThanOrEqual(now + 100000); // Allow some buffer
      });
    });

    it('should generate increasing timestamps', () => {
      const data = generateData(100);

      for (let i = 1; i < data.length; i++) {
        expect(data[i].timestamp).toBeGreaterThan(data[i - 1].timestamp);
      }
    });
  });

  describe('metadata structure', () => {
    it('should include index in metadata', () => {
      const data = generateData(100);

      data.forEach((item, index) => {
        expect(item.metadata?.index).toBe(index);
      });
    });

    it('should include category in metadata', () => {
      const data = generateData(100);

      data.forEach((item) => {
        expect(item.metadata?.category).toBeDefined();
        expect(typeof item.metadata?.category).toBe('string');
      });
    });

    it('should include priority in metadata', () => {
      const data = generateData(100);

      data.forEach((item) => {
        expect(item.metadata?.priority).toBeDefined();
        expect(['low', 'medium', 'high']).toContain(item.metadata?.priority);
      });
    });

    it('should include tags array in metadata', () => {
      const data = generateData(100);

      data.forEach((item) => {
        expect(item.metadata?.tags).toBeDefined();
        expect(Array.isArray(item.metadata?.tags)).toBe(true);
        expect(item.metadata?.tags.length).toBeGreaterThan(0);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle decimal input by flooring to integer', () => {
      const data = generateData(150.7);
      expect(data).toHaveLength(150);
    });

    it('should handle negative input by clamping to minimum', () => {
      const data = generateData(-100);
      expect(data).toHaveLength(100);
    });

    it('should handle zero input by clamping to minimum', () => {
      const data = generateData(0);
      expect(data).toHaveLength(100);
    });
  });
});
