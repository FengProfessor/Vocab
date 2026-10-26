import React, { useMemo } from 'react';
import {
  Link as RouterLink,
  useLocation,
  useNavigate,
  useParams as useRouterParams,
} from 'react-router-dom';

export interface Metadata {
  title?: string | { default: string; template?: string };
  description?: string;
  keywords?: string[];
  openGraph?: Record<string, unknown>;
  twitter?: Record<string, unknown>;
  alternates?: Record<string, unknown>;
  robots?: Record<string, unknown> | string;
  icons?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface NextLinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href: string | { pathname?: string; query?: Record<string, string> };
  replace?: boolean;
  scroll?: boolean;
  prefetch?: boolean;
  shallow?: boolean;
  passHref?: boolean;
  legacyBehavior?: boolean;
}

function resolveHref(href: NextLinkProps['href']): string {
  if (typeof href === 'string') return href;
  const pathname = href.pathname || '/';
  if (!href.query || Object.keys(href.query).length === 0) return pathname;
  const qs = new URLSearchParams(href.query).toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

/**
 * Client-Side React Router Link component supporting `href` prop semantics.
 */
export const Link = React.forwardRef<HTMLAnchorElement, NextLinkProps>(
  (
    {
      href,
      replace,
      scroll: _scroll,
      prefetch: _prefetch,
      shallow: _shallow,
      passHref: _passHref,
      legacyBehavior: _legacyBehavior,
      children,
      ...rest
    },
    ref,
  ) => {
    const resolved = resolveHref(href);

    if (
      resolved.startsWith('http://') ||
      resolved.startsWith('https://') ||
      resolved.startsWith('mailto:') ||
      resolved.startsWith('tel:') ||
      resolved.startsWith('#')
    ) {
      return (
        <a ref={ref} href={resolved} {...rest}>
          {children}
        </a>
      );
    }

    return (
      <RouterLink ref={ref} to={resolved} replace={replace} {...rest}>
        {children}
      </RouterLink>
    );
  },
);

Link.displayName = 'AppLink';

export default Link;

export interface AppRouterInstance {
  push: (href: string, options?: { scroll?: boolean }) => void;
  replace: (href: string, options?: { scroll?: boolean }) => void;
  back: () => void;
  forward: () => void;
  refresh: () => void;
  prefetch: (href: string) => void;
}

/**
 * Client-side React Router navigation hook.
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
 * Client-side React Router hook returning the current pathname.
 */
export function usePathname(): string {
  const { pathname } = useLocation();
  return pathname;
}

/**
 * Client-side React Router hook returning current URLSearchParams.
 */
export function useSearchParams(): URLSearchParams {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

/**
 * Client-side React Router hook returning current route params.
 */
export function useParams<
  T extends Record<string, string | string[]> = Record<string, string | string[]>,
>(): T {
  const params = useRouterParams();
  return params as unknown as T;
}

/**
 * Client-side redirect helper.
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
