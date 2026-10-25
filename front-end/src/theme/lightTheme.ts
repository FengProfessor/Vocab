import { theme, type ThemeConfig } from '@/components/ui/Primitives';
import { baseComponentTokens, baseThemeTokens } from '@/theme/themeTokens';

/**
 * Light theme configuration for LingoPro with default Ant Design v5 algorithm.
 */
export const lightTheme: ThemeConfig = {
  algorithm: theme.defaultAlgorithm,
  token: {
    ...baseThemeTokens,
    colorBgBase: '#ffffff',
    colorTextBase: '#0f172a',
  },
  components: baseComponentTokens,
};
