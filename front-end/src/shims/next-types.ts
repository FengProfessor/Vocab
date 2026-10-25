/**
 * Client-side type shim for 'next' (Metadata, Viewport, MetadataRoute, etc.)
 * so all pages ported from /src compile without SSR dependencies.
 */
export interface Metadata {
  title?: string | { default?: string; template?: string; absolute?: string };
  description?: string;
  keywords?: string | string[];
  metadataBase?: URL | null;
  alternates?: Record<string, unknown>;
  openGraph?: Record<string, unknown>;
  twitter?: Record<string, unknown>;
  robots?: string | Record<string, unknown>;
  icons?: Record<string, unknown>;
  manifest?: string;
  appleWebApp?: Record<string, unknown>;
  other?: Record<string, string | number | Array<string | number>>;
  [key: string]: unknown;
}

export interface Viewport {
  themeColor?: string | Array<{ media?: string; color: string }>;
  width?: string | number;
  initialScale?: number;
  maximumScale?: number;
  userScalable?: boolean;
  viewportFit?: 'auto' | 'contain' | 'cover';
  [key: string]: unknown;
}

export namespace MetadataRoute {
  export type Robots = {
    rules:
      | {
          userAgent?: string | string[];
          allow?: string | string[];
          disallow?: string | string[];
          crawlDelay?: number;
        }
      | Array<{
          userAgent?: string | string[];
          allow?: string | string[];
          disallow?: string | string[];
          crawlDelay?: number;
        }>;
    sitemap?: string | string[];
    host?: string;
  };

  export type Sitemap = Array<{
    url: string;
    lastModified?: string | Date;
    changeFrequency?:
      | 'always'
      | 'hourly'
      | 'daily'
      | 'weekly'
      | 'monthly'
      | 'yearly'
      | 'never';
    priority?: number;
  }>;
}
