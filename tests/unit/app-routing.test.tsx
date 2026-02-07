/**
 * Unit tests for App routing
 * Validates that the unified demo page route is properly integrated
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import App from '../../src/app';

describe('App Routing', () => {
  it('should render home page by default', () => {
    render(<App />);
    expect(screen.getByText('Welcome to List Virtualization Demo')).toBeInTheDocument();
  });

  it('should have unified demo navigation link', () => {
    render(<App />);
    // Find the nav element and look for the button within it
    const nav = screen.getByRole('navigation');
    const unifiedLink = within(nav).getByRole('button', { name: /unified demo/i });
    expect(unifiedLink).toBeInTheDocument();
  });

  it('should navigate to unified demo when nav link is clicked', () => {
    render(<App />);
    // Get the nav link specifically
    const nav = screen.getByRole('navigation');
    const unifiedLink = within(nav).getByRole('button', { name: /unified demo/i });
    fireEvent.click(unifiedLink);

    // The unified demo page should be rendered - check for unique element
    expect(screen.getByTestId('mode-toggle')).toBeInTheDocument();
  }, 10000); // Increase timeout for baseline auto-capture

  it('should show unified demo card on home page', () => {
    render(<App />);
    // Check for the card heading and description
    expect(screen.getByText(/switch between virtualized and non-virtualized modes/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try unified demo/i })).toBeInTheDocument();
  });

  it('should navigate to unified demo from home page card', () => {
    render(<App />);
    const tryButton = screen.getByRole('button', { name: /try unified demo/i });
    fireEvent.click(tryButton);

    // Should navigate to unified demo page
    expect(screen.getByTestId('mode-toggle')).toBeInTheDocument();
  }, 10000); // Increase timeout for baseline auto-capture

  it('should highlight active navigation link', () => {
    render(<App />);
    const nav = screen.getByRole('navigation');

    // Home should be active initially
    const homeLink = within(nav).getByRole('button', { name: /^home$/i });
    expect(homeLink).toHaveClass('active');

    // Click unified demo
    const unifiedLink = within(nav).getByRole('button', { name: /unified demo/i });
    fireEvent.click(unifiedLink);

    // Unified demo should now be active
    expect(unifiedLink).toHaveClass('active');
    expect(homeLink).not.toHaveClass('active');
  }, 10000); // Increase t..............imeout for baseline auto-capture

  it('should include all demo pages in navigation', () => {
    render(<App />);
    const nav = screen.getByRole('navigation');

    expect(within(nav).getByRole('button', { name: /^home$/i })).toBeInTheDocument();
    expect(within(nav).getByRole('button', { name: /unified demo/i })).toBeInTheDocument();
    expect(within(nav).getByRole('button', { name: /comparison demo/i })).toBeInTheDocument();
    expect(within(nav).getByRole('button', { name: /interactive demo/i })).toBeInTheDocument();
  });

  it('should maintain navigation order with unified demo second', () => {
    render(<App />);
    const nav = screen.getByRole('navigation');
    const navLinks = within(nav).getAllByRole('button');

    expect(navLinks[0]).toHaveTextContent('Home');
    expect(navLinks[1]).toHaveTextContent('Unified Demo');
    expect(navLinks[2]).toHaveTextContent('Comparison Demo');
    expect(navLinks[3]).toHaveTextContent('Interactive Demo');
  });

  it('should switch between different demo pages', () => {
    render(<App />);
    const nav = screen.getByRole('navigation');

    // Start at home
    expect(screen.getByText('Welcome to List Virtualization Demo')).toBeInTheDocument();

    // Navigate to unified demo
    fireEvent.click(within(nav).getByRole('button', { name: /unified demo/i }));
    expect(screen.getByTestId('mode-toggle')).toBeInTheDocument();

    // Navigate to comparison demo
    fireEvent.click(within(nav).getByRole('button', { name: /comparison demo/i }));
    expect(screen.getByText(/list virtualization comparison/i)).toBeInTheDocument();

    // Navigate back to unified demo
    fireEvent.click(within(nav).getByRole('button', { name: /unified demo/i }));
    expect(screen.getByTestId('mode-toggle')).toBeInTheDocument();
  }, 20000); // Increase timeout for multiple page loads with baseline auto-capture
});
