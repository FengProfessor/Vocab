import React from 'react';
import { App as AntdApp, ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { ThemeProvider, useAppTheme } from '@/theme/ThemeContext';
import { AppProvidersProps } from '@/app/types/AppProvidersProps';

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
 * Inner bridge component that subscribes to ThemeContext and applies dynamic theme tokens to Ant Design ConfigProvider.
 */
const AntdThemeBridge: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { themeConfig } = useAppTheme();

  return (
    <ConfigProvider locale={viVN} theme={themeConfig}>
      <AntdApp>{children}</AntdApp>
    </ConfigProvider>
  );
};

/**
 * Root provider composition wrapping React Query, ThemeProvider, Ant Design v5 ConfigProvider (Vietnamese locale),
 * AntdApp context, and the global ErrorBoundary.
 */
export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AntdThemeBridge>{children}</AntdThemeBridge>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};
