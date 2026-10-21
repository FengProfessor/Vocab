import React from 'react';
import { Button, Result } from 'antd';
import { ErrorBoundaryProps } from '@/components/types/ErrorBoundaryProps';
import { ErrorBoundaryState } from '@/components/types/ErrorBoundaryState';

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
