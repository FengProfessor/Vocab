import type { ThemeConfig } from 'antd';

/**
 * Ant Design v5 Design Token configuration for LingoPro.
 * Uses Plus Jakarta Sans typography, indigo brand primary (#4f46e5), and emerald success tokens (#10b981).
 */
export const lingoProTheme: ThemeConfig = {
  token: {
    colorPrimary: '#4f46e5',
    colorSuccess: '#10b981',
    colorWarning: '#f59e0b',
    colorError: '#ef4444',
    colorInfo: '#0284c7',
    borderRadius: 12,
    fontFamily:
      "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  components: {
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
  },
};
