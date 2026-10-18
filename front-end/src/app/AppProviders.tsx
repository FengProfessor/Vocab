import React from 'react';
import { App as AntdApp, ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { lingoProTheme } from '@/theme/lingoProTheme';

/**
 * Singleton React Query client with generous stale windows for snappy offline-first transitions.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Props for the AppProviders wrapper component.
 */
interface AppProvidersProps {
  /** Application child tree. */
  children: React.ReactNode;
}

/**
 * Root provider composition wrapping React Query, Ant Design v5 ConfigProvider (Vietnamese locale),
 * AntdApp context, and the global ErrorBoundary.
 */
export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider locale={viVN} theme={lingoProTheme}>
          <AntdApp>{children}</AntdApp>
        </ConfigProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};
