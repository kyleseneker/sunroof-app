'use client';

import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="fixed inset-0 bg-[var(--bg-base)] flex flex-col items-center justify-center p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-[var(--color-error-subtle)] flex items-center justify-center mb-6">
            <AlertTriangle className="w-10 h-10 text-[var(--color-error)]" />
          </div>
          <h1 className="text-2xl font-light mb-3 text-[var(--fg-base)]">Something went wrong</h1>
          <p className="text-[var(--fg-muted)] max-w-xs mb-8">
            We hit an unexpected error. Please try again.
          </p>
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-2 px-6 py-3 bg-[var(--fg-base)] text-[var(--fg-inverse)] rounded-full font-medium hover:opacity-90 active:scale-[0.98] transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <pre className="mt-8 p-4 bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-lg text-left text-xs text-[var(--color-error)] max-w-md overflow-auto">
              {this.state.error.message}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

