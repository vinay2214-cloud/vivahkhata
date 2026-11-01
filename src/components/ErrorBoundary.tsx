import React from 'react';
import { logger } from '../lib/logger';

interface State {
  failed: boolean;
}

/**
 * Last line of defence: if a screen throws while rendering, show a calm
 * recovery message instead of a blank page. The ledger itself is safe in
 * Firestore, so reloading is always an option.
 */
export class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error): void {
    logger.error('Unhandled render error', error);
  }

  render(): React.ReactNode {
    if (!this.state.failed) return this.props.children;
    return (
      <div
        role="alert"
        className="min-h-screen flex items-center justify-center p-6 text-center bg-[var(--color-bg)]"
      >
        <div className="max-w-sm">
          <h1 className="text-xl font-bold mb-2">Something went wrong</h1>
          <p className="text-sm text-[var(--color-text-muted)] mb-4">
            Your wedding data is safe. Please reload the page to continue.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-5 py-3 rounded-xl font-semibold bg-[var(--color-primary)] text-white cursor-pointer"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
