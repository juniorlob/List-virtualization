/**
 * Integration tests for InteractiveDemo component
 * Task 11.3: Write integration tests for interactive demo
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InteractiveDemo } from '../../src/demo/pages/interactive-demo';

describe('InteractiveDemo Integration Tests', () => {
  describe('Component Rendering', () => {
    it('should render the interactive demo with all controls', () => {
      render(<InteractiveDemo />);

      // Check header
      expect(screen.getByText('Interactive Virtualization Demo')).toBeInTheDocument();
      expect(
        screen.getByText('Experiment with different configurations and see real-time performance metrics')
      ).toBeInTheDocument();

      // Check controls
      expect(screen.getByText('Item Count')).toBeInTheDocument();
      expect(screen.getByText('Overscan')).toBeInTheDocument();
      expect(screen.getByText('Enable Performance Monitoring')).toBeInTheDocument();

      // Check list header
      expect(screen.getByText('Virtualized List')).toBeInTheDocument();
    });

    it('should render with default configuration values', () => {
      render(<InteractiveDemo />);

      // Check default item count (5000)
      expect(screen.getByText('5,000')).toBeInTheDocument();

      // Check default overscan (3)
      const overscanValue = screen.getByText((content, element) => {
        return element?.className.includes('labelValue') && content === '3';
      });
      expect(overscanValue).toBeInTheDocument();

      // Check performance monitoring is enabled by default
      const checkbox = screen.getByLabelText('Enable performance monitoring') as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
    });

    it('should render performance metrics when monitoring is enabled', () => {
      render(<InteractiveDemo />);

      // Check metrics panel is visible
      expect(screen.getByText('Performance Metrics')).toBeInTheDocument();

      // Check all metric labels
      expect(screen.getByText('Frames Per Second')).toBeInTheDocument();
      expect(screen.getByText('Memory Usage')).toBeInTheDocument();
      expect(screen.getByText('DOM Nodes')).toBeInTheDocument();
      expect(screen.getByText('Render Time')).toBeInTheDocument();
    });

    it('should render information panel', () => {
      render(<InteractiveDemo />);

      expect(screen.getByText('About Virtualization')).toBeInTheDocument();
      expect(screen.getByText('What is List Virtualization?')).toBeInTheDocument();
      expect(screen.getByText('Key Benefits')).toBeInTheDocument();
      expect(screen.getByText('Understanding Overscan')).toBeInTheDocument();
    });
  });

  describe('Control Interactions', () => {
    it('should update item count when slider changes', async () => {
      render(<InteractiveDemo />);

      const slider = screen.getByLabelText('Item count') as HTMLInputElement;

      // Change item count to 10000
      fireEvent.change(slider, { target: { value: '10000' } });

      await waitFor(() => {
        expect(screen.getByText('10,000')).toBeInTheDocument();
      });
    });

    it('should update overscan when slider changes', async () => {
      render(<InteractiveDemo />);

      const slider = screen.getByLabelText('Overscan value') as HTMLInputElement;

      // Change overscan to 5
      fireEvent.change(slider, { target: { value: '5' } });

      await waitFor(() => {
        const overscanValue = screen.getByText((content, element) => {
          return element?.className.includes('labelValue') && content === '5';
        });
        expect(overscanValue).toBeInTheDocument();
      });
    });

    it('should toggle performance monitoring', async () => {
      render(<InteractiveDemo />);

      const checkbox = screen.getByLabelText('Enable performance monitoring') as HTMLInputElement;

      // Initially enabled
      expect(checkbox.checked).toBe(true);
      expect(screen.getByText('Performance Metrics')).toBeInTheDocument();

      // Disable performance monitoring
      fireEvent.click(checkbox);

      await waitFor(() => {
        expect(checkbox.checked).toBe(false);
        expect(screen.queryByText('Performance Metrics')).not.toBeInTheDocument();
      });

      // Re-enable performance monitoring
      fireEvent.click(checkbox);

      await waitFor(() => {
        expect(checkbox.checked).toBe(true);
        expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
      });
    });
  });

  describe('List Rendering', () => {
    it('should render virtualized list with items', () => {
      render(<InteractiveDemo initialItemCount={100} />);

      // Check that some items are rendered (not all 100)
      const items = screen.getAllByText(/Item \d+/);
      expect(items.length).toBeGreaterThan(0);
      expect(items.length).toBeLessThan(100); // Should be virtualized
    });

    it('should update list when item count changes', async () => {
      render(<InteractiveDemo initialItemCount={100} />);

      const slider = screen.getByLabelText('Item count') as HTMLInputElement;

      // Change item count to 200
      fireEvent.change(slider, { target: { value: '200' } });

      await waitFor(() => {
        expect(screen.getByText('200')).toBeInTheDocument();
      });

      // List should still be virtualized
      const items = screen.getAllByText(/Item \d+/);
      expect(items.length).toBeLessThan(200);
    });
  });

  describe('Custom Props', () => {
    it('should accept custom initial item count', () => {
      render(<InteractiveDemo initialItemCount={1000} />);

      expect(screen.getByText('1,000')).toBeInTheDocument();
    });

    it('should accept custom initial overscan', () => {
      render(<InteractiveDemo initialOverscan={5} />);

      const overscanValue = screen.getByText((content, element) => {
        return element?.className.includes('labelValue') && content === '5';
      });
      expect(overscanValue).toBeInTheDocument();
    });

    it('should accept custom item height and container height', () => {
      // Should render without errors
      const { container } = render(
        <InteractiveDemo itemHeight={80} containerHeight={800} />
      );

      expect(container).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for controls', () => {
      render(<InteractiveDemo />);

      expect(screen.getByLabelText('Item count')).toBeInTheDocument();
      expect(screen.getByLabelText('Overscan value')).toBeInTheDocument();
      expect(screen.getByLabelText('Enable performance monitoring')).toBeInTheDocument();
    });

    it('should have descriptive text for controls', () => {
      render(<InteractiveDemo />);

      expect(
        screen.getByText('Number of extra items rendered above and below the viewport')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Track FPS, memory usage, DOM nodes, and render time')
      ).toBeInTheDocument();
    });
  });
});
