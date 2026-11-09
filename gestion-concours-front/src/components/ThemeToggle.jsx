import React from 'react';
import { useTheme } from '../theme';
import './ThemeToggle.css';

export default function ThemeToggle({ className = '', style = {} }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      className={`theme-toggle ${isDark ? 'is-dark' : 'is-light'} ${className}`.trim()}
      type="button"
      style={style}
      aria-label={isDark ? 'Passer au mode clair' : 'Passer au mode sombre'}
      aria-pressed={isDark}
      title={isDark ? 'Passer au mode clair' : 'Passer au mode sombre'}
      onClick={toggleTheme}
    >
      {isDark ? (
        /* Soleil (Sun) icon when in dark mode */
        <svg
          className="theme-toggle-icon theme-toggle-sun"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4" fill="currentColor" fillOpacity="0.2" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </svg>
      ) : (
        /* Lune (Moon) icon when in light mode */
        <svg
          className="theme-toggle-icon theme-toggle-moon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" fill="currentColor" fillOpacity="0.15" />
        </svg>
      )}
    </button>
  );
}
