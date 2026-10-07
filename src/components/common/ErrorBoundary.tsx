import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Generic error boundary. Wraps lazy-loaded pages, TaskModal, and any
 * isolated UI region that should degrade gracefully instead of crashing the app.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center min-h-[120px]">
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">
            Something went wrong.
          </p>
          <button
            onClick={this.reset}
            className="text-sm text-blue-600 dark:text-blue-400 underline underline-offset-2 hover:opacity-80"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
