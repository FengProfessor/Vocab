/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { Suspense, lazy } from 'react';

export interface DynamicOptions<P = Record<string, unknown>> {
  loading?: (loadingProps: {
    error?: Error | null;
    isLoading?: boolean;
    pastDelay?: boolean;
    retry?: () => void;
    timedOut?: boolean;
  }) => React.ReactNode;
  ssr?: boolean;
  loadableGenerated?: Record<string, unknown>;
  props?: P;
}

type LoaderComponent<P> = React.ComponentType<P> | { default: React.ComponentType<P> };

/**
 * Client-side React.lazy + Suspense wrapper for dynamic component loading.
 */
export function dynamic<P extends object = Record<string, any>>(
  loader: () => Promise<LoaderComponent<P>>,
  options?: DynamicOptions<P>,
): React.ComponentType<P> {
  const LazyComponent = lazy(async () => {
    const mod = await loader();
    if (typeof mod === 'function') {
      return { default: mod };
    }
    if (mod && typeof mod === 'object' && 'default' in mod && mod.default) {
      return { default: mod.default };
    }
    const firstExport = Object.values(mod as unknown as Record<string, unknown>).find(
      (v) => typeof v === 'function' || (typeof v === 'object' && v !== null),
    ) as React.ComponentType<P> | undefined;
    return { default: firstExport ?? ((() => null) as unknown as React.ComponentType<P>) };
  });

  const DynamicWrapper: React.FC<P> = (props) => {
    const fallback = options?.loading ? options.loading({ isLoading: true }) : null;
    return (
      <Suspense fallback={fallback}>
        <LazyComponent {...(props as any)} />
      </Suspense>
    );
  };

  return DynamicWrapper;
}

export default dynamic;
