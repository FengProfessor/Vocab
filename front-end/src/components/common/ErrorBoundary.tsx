import React from 'react';
import { Button, Result } from 'antd';

/**
 * Props for the ErrorBoundary component.
 */
interface ErrorBoundaryProps {
  /** Child React element tree protected by the boundary. */
  children: React.ReactNode;
}

/**
 * Internal state of the ErrorBoundary component.
 */
interface ErrorBoundaryState {
  /** Whether an unhandled rendering error was caught. */
  hasError: boolean;

  /** Error message string for diagnostic display. */
  errorMessage: string;
}

/**
 * Global React ErrorBoundary that prevents unexpected component exceptions from crashing the SPA.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: '',
    };
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'Unknown rendering error',
    };
  }

  public override render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <Result
          status="error"
          title="Đã xảy ra sự cố hiển thị giao diện"
          subTitle={this.state.errorMessage}
          extra={
            <Button type="primary" onClick={() => window.location.reload()}>
              Tải lại trang
            </Button>
          }
        />
      );
    }

    return this.props.children;
  }
}
