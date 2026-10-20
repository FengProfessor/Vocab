import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import type { ThemeConfig } from 'antd';
import { darkTheme } from '@/theme/darkTheme';
import { lightTheme } from '@/theme/lightTheme';
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

const STORAGE_KEY = 'lingopro_theme_mode';

const ThemeContext = createContext<IThemeContextState | undefined>(undefined);

/**
 * Props for ThemeProvider.
 */
interface ThemeProviderProps {
  children: React.ReactNode;
}

/**
 * Provider wrapping the application to manage and persist theme state across sessions.
 * Fully supports Light, Dark, and OS-matched System modes with live system listeners.
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === ThemeMode.Dark || saved === ThemeMode.Light || saved === ThemeMode.System) {
      return saved as ThemeMode;
    }
    return ThemeMode.System;
  });

  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    return window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)').matches : false;
  });

  useEffect(() => {
    if (!window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent): void => {
      setSystemIsDark(e.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const isDark = useMemo(() => {
    if (mode === ThemeMode.Dark) return true;
    if (mode === ThemeMode.Light) return false;
    return systemIsDark;
  }, [mode, systemIsDark]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch {
      // Ignore storage errors in restricted iframe/incognito environments
    }
  }, [mode, isDark]);

  const toggleTheme = (): void => {
    setMode((prev) => (prev === ThemeMode.Dark ? ThemeMode.Light : ThemeMode.Dark));
  };

  const setThemeMode = (newMode: ThemeMode): void => {
    setMode(newMode);
  };

  const themeConfig = useMemo(() => {
    return isDark ? darkTheme : lightTheme;
  }, [isDark]);

  const contextValue = useMemo<IThemeContextState>(() => {
    return {
      mode,
      themeConfig,
      isDark,
      toggleTheme,
      setThemeMode,
    };
  }, [mode, themeConfig, isDark]);

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
};

/**
 * Hook to access and mutate the application theme state.
 */
export const useAppTheme = (): IThemeContextState => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return context;
};
