import { ThemeMode } from '@/theme/ThemeMode';

/**
 * Presentation metadata of one appearance option in the profile menu.
 */
export interface ThemeModeOption {
  /** Theme mode applied when chosen. */
  mode: ThemeMode;
  /** Vietnamese label. */
  label: string;
  /** Icon displayed before the label. */
  icon: React.ReactNode;
}
