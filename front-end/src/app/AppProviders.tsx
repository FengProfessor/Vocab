import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { PostHogProvider } from '@/components/PostHogProvider';
import { ClientBoot } from '@/components/ClientBoot';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { StudentProvider } from '@/components/student/StudentProvider';
import { Toaster } from '@/components/ui/sonner';
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
 * Root provider composition replicating /src/app/layout.tsx (BrowserRouter, ErrorBoundary,
 * PostHogProvider, NextThemesProvider, ClientBoot, StudentProvider, Sonner Toaster).
 * BrowserRouter wraps the entire tree so any provider or boot component calling
 * usePathname() / useRouter() / useSearchParams() has valid Router context.
 */
export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <PostHogProvider>
          <QueryClientProvider client={queryClient}>
            <NextThemesProvider attribute="class" defaultTheme="light" enableSystem>
              <ClientBoot />
              <StudentProvider>{children}</StudentProvider>
              <Toaster position="bottom-right" richColors />
            </NextThemesProvider>
          </QueryClientProvider>
        </PostHogProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
};
