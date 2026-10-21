import { ThemeConfig } from 'antd';
import { ThemeMode } from '@/theme/ThemeMode';

/**
 * Contract for the application theme context.
 */
export interface IThemeContextState {
  /** Current configured theme mode (Light, Dark, or System). */
  mode: ThemeMode;
  /** Active Ant Design ThemeConfig. */
  themeConfig: ThemeConfig;
  /** Whether the effective active theme is Dark mode. */
  isDark: boolean;
  /** Toggle between Light and Dark themes. */
  toggleTheme: () => void;
  /** Explicitly set a theme mode. */
  setThemeMode: (mode: ThemeMode) => void;
}
