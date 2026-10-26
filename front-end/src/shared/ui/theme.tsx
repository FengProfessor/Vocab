import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type ThemeValue = 'light' | 'dark' | 'system';

export interface ThemeProviderProps {
  children: React.ReactNode;
  attribute?: string;
  defaultTheme?: ThemeValue;
  enableSystem?: boolean;
  storageKey?: string;
}

export interface UseThemeResult {
  theme: ThemeValue;
  setTheme: (theme: ThemeValue) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<UseThemeResult>({
  theme: 'system',
  setTheme: () => undefined,
  resolvedTheme: 'light',
});

function getSystemPreference(): 'light' | 'dark' {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Pure React SPA ThemeProvider managing light/dark/system class on document.documentElement.
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'system',
  storageKey = 'lingopro-theme',
}) => {
  const [theme, setThemeState] = useState<ThemeValue>(() => {
    if (typeof window === 'undefined') return defaultTheme;
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        return saved;
      }
    } catch {
      // ignore storage errors
    }
    return defaultTheme;
  });

  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() => getSystemPreference());

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? 'dark' : 'light');
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const resolvedTheme: 'light' | 'dark' = theme === 'system' ? systemTheme : theme;

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolvedTheme);
    root.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  const setTheme = useCallback(
    (next: ThemeValue) => {
      setThemeState(next);
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(storageKey, next);
        } catch {
          // ignore storage errors
        }
      }
    },
    [storageKey],
  );

  const value = useMemo<UseThemeResult>(
    () => ({
      theme,
      setTheme,
      resolvedTheme,
    }),
    [theme, setTheme, resolvedTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useTheme(): UseThemeResult {
  return useContext(ThemeContext);
}
