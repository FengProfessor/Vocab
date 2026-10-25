import type { ThemeConfig } from '@/components/ui/Primitives';

/**
 * Shared foundational brand design tokens for LingoPro.
 * Adheres to Ant Design v5 token taxonomy with indigo primary and emerald success accents.
 */
export const baseThemeTokens: NonNullable<ThemeConfig['token']> = {
  colorPrimary: '#4f46e5',
  colorSuccess: '#10b981',
  colorWarning: '#f59e0b',
  colorError: '#ef4444',
  colorInfo: '#0284c7',
  borderRadius: 12,
  fontFamily:
    "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

/**
 * Shared component style overrides for consistent button heights and rounded cards.
 */
export const baseComponentTokens: ThemeConfig['components'] = {
  Button: {
    controlHeight: 40,
    fontWeight: 600,
  },
  Card: {
    borderRadiusLG: 16,
  },
  Menu: {
    itemBorderRadius: 10,
  },
};
