typescript
import { useState, useLayoutEffect, useCallback } from 'react';

type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'theme';
const VALID_THEMES: Theme[] = ['light', 'dark'];

function isValidTheme(value: unknown): value is Theme {
  return typeof value === 'string' && VALID_THEMES.includes(value as Theme);
}

function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

function getStoredTheme(): Theme | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isValidTheme(stored) ? stored : null;
  } catch {
    return null;
  }
}

function setDocumentTheme(theme: Theme): void {
  if (typeof document === 'undefined') return;
  
  const { classList } = document.documentElement;
  VALID_THEMES.forEach(t => classList.remove(t));
  classList.add(theme);
}

function storeTheme(theme: Theme): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    console.error('Failed to store theme preference:', error);
  }
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = getStoredTheme();
    return stored ?? getSystemTheme();
  });

  useLayoutEffect(() => {
    setDocumentTheme(theme);
    storeTheme(theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  const setThemeSafely = useCallback((newTheme: Theme) => {
    if (isValidTheme(newTheme)) {
      setTheme(newTheme);
    } else {
      console.warn(`Invalid theme value: ${newTheme}. Must be one of: ${VALID_THEMES.join(', ')}`);
    }
  }, []);

  const resetToSystem = useCallback(() => {
    setTheme(getSystemTheme());
  }, []);

  return {
    theme,
    toggleTheme,
    setTheme: setThemeSafely,
    resetToSystem,
    isDark: theme === 'dark',
    isLight: theme === 'light'
  };
}