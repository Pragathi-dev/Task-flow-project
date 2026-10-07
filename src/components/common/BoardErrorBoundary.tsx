import React from 'react';
import { Button } from './Button';

interface Props {
  children: React.ReactNode;
  /** Pass 'column' for column-level isolation, 'board' for full-board */
  level?: 'board' | 'column';
}

interface State {
  hasError: boolean;
}

/**
 * Board/column-scoped error boundary.
 * A broken column must never crash the whole board.
 * A broken board must never crash the app shell.
 */
export class BoardErrorBoundary extends React.Component<Props, State> {
  static defaultProps = { level: 'board' };
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[BoardErrorBoundary]', error, info.componentStack);
  }

  reset = () => this.setState({ hasError: false });

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.level === 'column') {
      return (
        <div className="flex flex-col items-center justify-center h-20 rounded-lg border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/10 p-3 text-center">
          <p className="text-xs text-red-500 dark:text-red-400 mb-1">Column error</p>
          <button
            onClick={this.reset}
            className="text-xs text-red-600 dark:text-red-400 underline"
          >
            Reload
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-full p-12 text-center">
        <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
          Board failed to render
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-5 max-w-sm">
          An unexpected error occurred. Your data is safe — nothing has been deleted.
        </p>
        <Button variant="primary" size="sm" onClick={this.reset}>
          Reload board
        </Button>
      </div>
    );
  }
}
