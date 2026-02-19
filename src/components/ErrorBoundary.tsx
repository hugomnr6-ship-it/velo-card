'use client';
import { Component, type ReactNode } from 'react';
import * as Sentry from '@sentry/nextjs';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
}

function DefaultErrorFallback({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 p-8">
      <div className="text-4xl">⚠️</div>
      <h2 className="text-lg font-semibold text-[var(--text)]">Quelque chose s&apos;est mal passé</h2>
      <p className="text-sm text-[var(--text-muted)]">Une erreur inattendue est survenue.</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
      >
        Réessayer
      </button>
    </div>
  );
}

export class ErrorBoundary extends Component<Props, State> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    Sentry.captureException(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <DefaultErrorFallback
            onRetry={() => {
              this.setState({ hasError: false });
              this.props.onReset?.();
            }}
          />
        )
      );
    }
    return this.props.children;
  }
}
