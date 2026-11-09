import { createContext, useCallback, useContext, useEffect, useMemo, useState, createElement } from 'react';

const ThemeContext = createContext(null);
export const THEME_STORAGE_KEY = 'econcours-theme';

function getInitialTheme() {
  if (typeof document !== 'undefined') {
    const appliedTheme = document.documentElement.dataset.theme;
    if (appliedTheme === 'dark' || appliedTheme === 'light') return appliedTheme;
  }

  if (typeof window !== 'undefined') {
    try {
      const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme;
    } catch {
      // localStorage can be unavailable in restricted contexts
    }

    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  return 'light';
}

function applyTheme(theme, persist = false) {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = theme;
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  if (persist && typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Storage unavailable
    }
  }
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getInitialTheme);

  const setTheme = useCallback((nextTheme) => {
    setThemeState(nextTheme);
    applyTheme(nextTheme, true);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      applyTheme(next, true);
      return next;
    });
  }, []);

  useEffect(() => {
    applyTheme(theme);

    // Multi-tab synchronization
    const syncThemeAcrossTabs = (event) => {
      if (event.key !== THEME_STORAGE_KEY) return;
      const nextTheme = event.newValue === 'dark' ? 'dark' : 'light';
      setThemeState(nextTheme);
      applyTheme(nextTheme);
    };

    // System preference change listener (when user has not manually overridden)
    const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)');
    const handleSystemChange = (e) => {
      try {
        const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
        if (!saved) {
          const sysTheme = e.matches ? 'dark' : 'light';
          setThemeState(sysTheme);
          applyTheme(sysTheme);
        }
      } catch {}
    };

    window.addEventListener('storage', syncThemeAcrossTabs);
    mediaQuery?.addEventListener?.('change', handleSystemChange);

    return () => {
      window.removeEventListener('storage', syncThemeAcrossTabs);
      mediaQuery?.removeEventListener?.('change', handleSystemChange);
    };
  }, [theme]);

  const value = useMemo(() => ({ theme, setTheme, toggleTheme, isDark: theme === 'dark' }), [theme, setTheme, toggleTheme]);

  return createElement(ThemeContext.Provider, { value }, children);
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme doit être utilisé à l\'intérieur de ThemeProvider.');
  }
  return context;
}
