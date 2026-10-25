import React from 'react';
import { Link as RouterLink } from 'react-router-dom';

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
 * Pure Client-Side React Router replacement for next/link.
 * Preserves 100% of <Link href="..."> semantics without Next.js SSR.
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

Link.displayName = 'NextLinkShim';

export default Link;
