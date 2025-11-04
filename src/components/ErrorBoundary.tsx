"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { colors, spacing, typography, borderRadius, shadows } from '@/lib/design-system';
import { Button } from './ui/Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to external service (e.g., Sentry)
    // Sentry.captureException(error, { extra: errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <ErrorFallback error={this.state.error} onRetry={this.handleRetry} onReload={this.handleReload} />;
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error?: Error;
  onRetry: () => void;
  onReload: () => void;
}

function ErrorFallback({ error, onRetry, onReload }: ErrorFallbackProps) {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    padding: spacing[8],
    textAlign: 'center',
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.lg,
    boxShadow: shadows.lg,
    padding: spacing[8],
    maxWidth: '500px',
    width: '100%',
    border: `1px solid ${colors.border.light}`,
  };

  const iconStyle: React.CSSProperties = {
    fontSize: '4rem',
    marginBottom: spacing[4],
  };

  const titleStyle: React.CSSProperties = {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    margin: 0,
    marginBottom: spacing[2],
  };

  const messageStyle: React.CSSProperties = {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    margin: 0,
    marginBottom: spacing[6],
    lineHeight: typography.lineHeight.relaxed,
  };

  const errorDetailsStyle: React.CSSProperties = {
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.md,
    padding: spacing[4],
    marginBottom: spacing[6],
    textAlign: 'left',
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.mono.join(', '),
    color: colors.text.secondary,
    border: `1px solid ${colors.gray[200]}`,
    maxHeight: '200px',
    overflow: 'auto',
  };

  const actionsStyle: React.CSSProperties = {
    display: 'flex',
    gap: spacing[3],
    justifyContent: 'center',
    flexWrap: 'wrap',
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={iconStyle}>⚠️</div>
        <h1 style={titleStyle}>Něco se pokazilo</h1>
        <p style={messageStyle}>
          Omlouváme se, ale došlo k neočekávané chybě. Zkuste stránku obnovit nebo kontaktujte podporu.
        </p>
        
        {error && process.env.NODE_ENV === 'development' && (
          <details style={errorDetailsStyle}>
            <summary style={{ cursor: 'pointer', marginBottom: spacing[2], fontWeight: typography.fontWeight.medium }}>
              Technické detaily (pouze pro vývojáře)
            </summary>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
              {error.toString()}
              {error.stack && `\n\nStack trace:\n${error.stack}`}
            </pre>
          </details>
        )}

        <div style={actionsStyle}>
          <Button variant="primary" onClick={onRetry}>
            Zkusit znovu
          </Button>
          <Button variant="outline" onClick={onReload}>
            Obnovit stránku
          </Button>
        </div>
      </div>
    </div>
  );
}

// Hook pro error handling v funkcionálních komponentách
export function useErrorHandler() {
  const handleError = (error: Error, context?: string) => {
    console.error(`Error in ${context || 'component'}:`, error);
    
    // Log to external service
    // Sentry.captureException(error, { tags: { context } });
    
    // Show user-friendly notification
    // toast.error('Došlo k chybě', error.message);
  };

  const handleAsyncError = (error: unknown, context?: string) => {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    handleError(errorObj, context);
  };

  return { handleError, handleAsyncError };
}
