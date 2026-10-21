import { DesktopOutlined, MoonOutlined, SunOutlined } from '@ant-design/icons';
import { ThemeMode } from '@/theme/ThemeMode';
import { ThemeModeOption } from '@/config/types/ThemeModeOption';

/**
 * Appearance choices offered to the learner: light, dark, or follow the operating system.
 */
export const THEME_MODE_OPTIONS: readonly ThemeModeOption[] = [
  { mode: ThemeMode.Light, label: 'Giao diện Sáng', icon: <SunOutlined /> },
  { mode: ThemeMode.Dark, label: 'Giao diện Tối', icon: <MoonOutlined /> },
  { mode: ThemeMode.System, label: 'Theo hệ thống', icon: <DesktopOutlined /> },
];
