import { useMemo } from 'react';
import {
  useLocation,
  useNavigate,
  useParams as useRouterParams,
} from 'react-router-dom';

export interface AppRouterInstance {
  push: (href: string, options?: { scroll?: boolean }) => void;
  replace: (href: string, options?: { scroll?: boolean }) => void;
  back: () => void;
  forward: () => void;
  refresh: () => void;
  prefetch: (href: string) => void;
}

/**
 * Client-side React Router shim for next/navigation useRouter().
 */
export function useRouter(): AppRouterInstance {
  const navigate = useNavigate();

  return useMemo<AppRouterInstance>(
    () => ({
      push: (href: string, options?: { scroll?: boolean }) => {
        navigate(href);
        if (options?.scroll !== false && typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      },
      replace: (href: string, options?: { scroll?: boolean }) => {
        navigate(href, { replace: true });
        if (options?.scroll !== false && typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      },
      back: () => navigate(-1),
      forward: () => navigate(1),
      refresh: () => {
        // Trigger soft re-render in client SPA
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('focus'));
        }
      },
      prefetch: () => undefined,
    }),
    [navigate],
  );
}

/**
 * Client-side React Router shim for next/navigation usePathname().
 */
export function usePathname(): string {
  const { pathname } = useLocation();
  return pathname;
}

/**
 * Client-side React Router shim for next/navigation useSearchParams().
 */
export function useSearchParams(): URLSearchParams {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

/**
 * Client-side React Router shim for next/navigation useParams().
 */
export function useParams<
  T extends Record<string, string | string[]> = Record<string, string | string[]>,
>(): T {
  const params = useRouterParams();
  return params as unknown as T;
}

/**
 * Client-side redirect helper replacing server-side redirect().
 */
export function redirect(url: string): never {
  if (typeof window !== 'undefined') {
    window.location.replace(url);
  }
  throw new Error(`REDIRECT:${url}`);
}

export function permanentRedirect(url: string): never {
  return redirect(url);
}

export function notFound(): never {
  if (typeof window !== 'undefined') {
    window.location.replace('/');
  }
  throw new Error('NOT_FOUND');
}
