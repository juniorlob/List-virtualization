/**
 * VirtualizationCalculator - Pure calculation engine for list virtualization.
 *
 * This class implements the core virtualization logic using pure functions
 * with no side effects. All calculations are deterministic and easily testable.
 *
 * @module core/virtualization/calculator
 */

import type {
  IVirtualizationCalculator,
  VisibleRange,
  ItemPosition,
} from './types';

/**
 * Default values for input validation and edge case handling.
 */
const DEFAULTS = {
  MIN_ITEM_HEIGHT: 1,
  DEFAULT_ITEM_HEIGHT: 50,
  DEFAULT_OVERSCAN: 3,
  MAX_REASONABLE_VALUE: 1_000_000,
} as const;

/**
 * Implementation of the virtualization calculator.
 *
 * Provides pure calculation functions for determining visible items,
 * item positions, and total content height. Handles edge cases and
 * invalid inputs gracefully.
 */
export class VirtualizationCalculator implements IVirtualizationCalculator {
  /**
   * Calculate which items are visible in the viewport.
   *
   * This method determines the range of items that should be rendered based on
   * the current scroll position, container dimensions, and overscan buffer.
   *
   * Edge cases handled:
   * - Empty lists (itemCount = 0): Returns {start: 0, end: -1}
   * - Invalid numeric inputs: Sanitized to safe defaults
   * - Out of bounds scroll: Clamped to valid range
   * - Overscan larger than list: Clamped to item count
   *
   * @param scrollTop - Current vertical scroll position in pixels
   * @param containerHeight - Height of the scrollable container in pixels
   * @param itemCount - Total number of items in the list
   * @param itemHeight - Height of each item in pixels (fixed height)
   * @param overscan - Number of items to render above and below viewport
   * @returns The range of visible items including overscan
   *
   * @example
   * ```typescript
   * const calculator = new VirtualizationCalculator();
   * const range = calculator.calculateVisibleRange(500, 600, 1000, 50, 3);
   * // Returns: { start: 7, end: 24 }
   * // Calculation: visible items from index 10-21, plus 3 overscan on each side
   * ```
   */
  calculateVisibleRange(
    scrollTop: number,
    containerHeight: number,
    itemCount: number,
    itemHeight: number,
    overscan: number
  ): VisibleRange {
    // Sanitize inputs to handle invalid values
    const safeScrollTop = this.sanitizeNumeric(scrollTop, 0);
    const safeContainerHeight = this.sanitizeNumeric(
      containerHeight,
      0,
      DEFAULTS.MAX_REASONABLE_VALUE
    );
    const safeItemCount = this.sanitizeNumeric(
      itemCount,
      0,
      DEFAULTS.MAX_REASONABLE_VALUE
    );
    const safeItemHeight = this.sanitizeNumeric(
      itemHeight,
      DEFAULTS.DEFAULT_ITEM_HEIGHT,
      DEFAULTS.MAX_REASONABLE_VALUE
    );
    const safeOverscan = this.sanitizeNumeric(
      overscan,
      DEFAULTS.DEFAULT_OVERSCAN,
      DEFAULTS.MAX_REASONABLE_VALUE
    );

    // Handle empty list edge case
    if (safeItemCount === 0) {
      return { start: 0, end: -1 };
    }

    // Handle zero or negative item height
    const effectiveItemHeight = Math.max(
      safeItemHeight,
      DEFAULTS.MIN_ITEM_HEIGHT
    );

    // Calculate the first visible item index (without overscan)
    const firstVisibleIndex = Math.floor(safeScrollTop / effectiveItemHeight);

    // Calculate the last visible item index (without overscan)
    // We subtract 1 from the sum to exclude items that start exactly at the bottom edge
    // For example, with containerHeight=200 and itemHeight=50:
    // - Items 0-3 are visible (pixels 0-199)
    // - Item 4 starts at pixel 200, which is outside the visible area
    const lastVisibleIndex = Math.floor(
      (safeScrollTop + safeContainerHeight - 1) / effectiveItemHeight
    );

    // Apply overscan buffer above and below
    const startWithOverscan = firstVisibleIndex - safeOverscan;
    const endWithOverscan = lastVisibleIndex + safeOverscan;

    // Clamp to valid bounds [0, itemCount - 1]
    const start = Math.max(0, startWithOverscan);
    const end = Math.min(safeItemCount - 1, endWithOverscan);

    return { start, end };
  }

  /**
   * Calculate the absolute position of an item.
   *
   * This method computes where an item should be positioned in the scrollable
   * container based on its index and height.
   *
   * Edge cases handled:
   * - Negative index: Treated as 0
   * - Invalid item height: Uses default safe value
   * - NaN or Infinity: Sanitized to safe defaults
   *
   * @param index - Index of the item in the list
   * @param itemHeight - Height of the item in pixels
   * @returns The position information for the item
   *
   * @example
   * ```typescript
   * const calculator = new VirtualizationCalculator();
   * const position = calculator.calculateItemPosition(10, 50);
   * // Returns: { top: 500, height: 50 }
   * ```
   */
  calculateItemPosition(index: number, itemHeight: number): ItemPosition {
    // Sanitize inputs
    const safeIndex = Math.max(0, this.sanitizeNumeric(index, 0));
    const safeItemHeight = this.sanitizeNumeric(
      itemHeight,
      DEFAULTS.DEFAULT_ITEM_HEIGHT,
      DEFAULTS.MAX_REASONABLE_VALUE
    );

    // Handle zero or negative item height
    const effectiveItemHeight = Math.max(
      safeItemHeight,
      DEFAULTS.MIN_ITEM_HEIGHT
    );

    // Calculate absolute position
    const top = safeIndex * effectiveItemHeight;

    return {
      top,
      height: effectiveItemHeight,
    };
  }

  /**
   * Calculate the total height of all items.
   *
   * This method computes the total scrollable height needed to contain
   * all items in the list.
   *
   * Edge cases handled:
   * - Empty list (itemCount = 0): Returns 0
   * - Invalid inputs: Sanitized to safe defaults
   * - Very large values: Clamped to reasonable maximum
   *
   * @param itemCount - Total number of items in the list
   * @param itemHeight - Height of each item in pixels
   * @returns Total height in pixels
   *
   * @example
   * ```typescript
   * const calculator = new VirtualizationCalculator();
   * const totalHeight = calculator.calculateTotalHeight(1000, 50);
   * // Returns: 50000 (1000 items × 50px each)
   * ```
   */
  calculateTotalHeight(itemCount: number, itemHeight: number): number {
    // Sanitize inputs
    const safeItemCount = this.sanitizeNumeric(
      itemCount,
      0,
      DEFAULTS.MAX_REASONABLE_VALUE
    );
    const safeItemHeight = this.sanitizeNumeric(
      itemHeight,
      DEFAULTS.DEFAULT_ITEM_HEIGHT,
      DEFAULTS.MAX_REASONABLE_VALUE
    );

    // Handle zero or negative item height
    const effectiveItemHeight = Math.max(
      safeItemHeight,
      DEFAULTS.MIN_ITEM_HEIGHT
    );

    // Calculate total height
    return safeItemCount * effectiveItemHeight;
  }

  /**
   * Sanitize numeric input to handle invalid values.
   *
   * This private helper method ensures all numeric inputs are valid,
   * finite numbers. It handles NaN, Infinity, and out-of-range values.
   *
   * @param value - The value to sanitize
   * @param defaultValue - Default value to use if input is invalid
   * @param max - Optional maximum value to clamp to
   * @returns Sanitized numeric value
   * @private
   */
  private sanitizeNumeric(
    value: number,
    defaultValue: number,
    max?: number
  ): number {
    // Handle NaN, Infinity, -Infinity
    if (!Number.isFinite(value)) {
      return defaultValue;
    }

    // Handle negative values where positive is required
    if (value < 0 && defaultValue >= 0) {
      return defaultValue;
    }

    // Clamp to maximum if provided
    if (max !== undefined && value > max) {
      return max;
    }

    return value;
  }
}
