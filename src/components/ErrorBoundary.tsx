'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
          <div className="bg-background border rounded-2xl shadow-lg p-8 max-w-md w-full text-center space-y-4">
            <div className="flex justify-center">
              <div className="bg-destructive/10 p-4 rounded-full">
                <AlertTriangle className="h-10 w-10 text-destructive" />
              </div>
            </div>
            <h2 className="text-xl font-black text-foreground">Đã xảy ra lỗi</h2>
            {this.state.error?.message && (
              <p className="text-sm text-muted-foreground font-mono bg-muted/60 rounded-xl px-4 py-2 break-all">
                {this.state.error.message}
              </p>
            )}
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors"
            >
              Tải lại trang
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
