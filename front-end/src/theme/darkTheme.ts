import { theme, type ThemeConfig } from '@/components/ui/Primitives';
import { baseComponentTokens, baseThemeTokens } from '@/theme/themeTokens';

/**
 * Dark theme configuration for LingoPro with dark algorithm and dark-adapted container backgrounds.
 */
export const darkTheme: ThemeConfig = {
  algorithm: theme.darkAlgorithm,
  token: {
    ...baseThemeTokens,
    colorBgBase: '#0b0f19',
    colorBgContainer: '#131b2e',
    colorBgElevated: '#1a243b',
    colorBorder: '#23324d',
    colorBorderSecondary: '#1d2a42',
    colorTextBase: '#f1f5f9',
    colorTextSecondary: '#94a3b8',
  },
  components: {
    ...baseComponentTokens,
    Card: {
      borderRadiusLG: 16,
      colorBgContainer: '#131b2e',
    },
  },
};
