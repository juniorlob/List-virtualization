/**
 * ErrorBoundary Component
 *
 * React error boundary that catches JavaScript errors anywhere in the child
 * component tree, logs those errors, and displays a fallback UI instead of
 * crashing the entire component tree.
 *
 * Requirements: 10.1, 10.2
 */

import React, { Component, ReactNode } from 'react';
import styles from './error-boundary.module.css';

interface ErrorBoundaryProps {
  /** Child components to wrap with error boundary */
  children: ReactNode;
  /** Optional fallback UI to display when an error occurs */
  fallback?: ReactNode;
  /** Optional callback when an error is caught */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  /** Whether an error has been caught */
  hasError: boolean;
  /** The error that was caught */
  error: Error | null;
  /** Additional error information */
  errorInfo: React.ErrorInfo | null;
}

/**
 * ErrorBoundary component that catches and handles errors in child components
 *
 * @example
 * ```tsx
 * <ErrorBoundary
 *   fallback={<div>Something went wrong</div>}
 *   onError={(error) => console.error(error)}
 * >
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  /**
   * Update state when an error is caught
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Log error details and call optional error callback
   */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error to console for debugging (Requirement 10.5)
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Update state with error info
    this.setState({
      errorInfo,
    });

    // Call optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  /**
   * Reset error state to retry rendering
   */
  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className={styles.errorContainer}>
          <div className={styles.errorContent}>
            <h2 className={styles.errorTitle}>⚠️ Something went wrong</h2>
            <p className={styles.errorMessage}>
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              className={styles.retryButton}
              onClick={this.handleRetry}
              type="button"
            >
              Try Again
            </button>
            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className={styles.errorDetails}>
                <summary>Error Details (Development Only)</summary>
                <pre className={styles.errorStack}>
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
