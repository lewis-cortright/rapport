import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { createThemeStyleSheet, type ThemeMode, type ThemeVariables } from '../tokens/theme';

export type ThemeProviderProps = PropsWithChildren<{
  initialMode?: ThemeMode;
  overrides?: Partial<ThemeVariables>;
}>;

type ThemeContextValue = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
const THEME_STORAGE_KEY = 'rapport.theme.mode';
const THEME_STYLE_ELEMENT_ID = 'rapport-theme-variables';

function isThemeMode(value: string | null): value is ThemeMode {
  return value === 'light' || value === 'dark';
}

function readStoredThemeMode() {
  if (typeof window === 'undefined') {
    return null;
  }

  const value = window.localStorage.getItem(THEME_STORAGE_KEY);
  return isThemeMode(value) ? value : null;
}

/**
 * Provides the shared theme mode and injects the generated design-token style
 * sheet at the document root.
 */
export function ThemeProvider({ children, initialMode = 'light', overrides }: ThemeProviderProps) {
  const [mode, setMode] = useState<ThemeMode>(() => readStoredThemeMode() ?? initialMode);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      setMode,
      toggleMode() {
        setMode((current) => (current === 'light' ? 'dark' : 'light'));
      }
    }),
    [mode]
  );

  const themeStyleSheet = useMemo(() => createThemeStyleSheet(overrides), [overrides]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const root = document.documentElement;
    const previousTheme = root.getAttribute('data-ui-theme');
    const previousMode = root.getAttribute('data-ui-mode');
    const head = document.head;
    let styleElement = document.getElementById(THEME_STYLE_ELEMENT_ID) as HTMLStyleElement | null;

    // Inject a single shared stylesheet so tokens appear as normal CSS rules on
    // the root element instead of as a large inline style attribute.
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = THEME_STYLE_ELEMENT_ID;
      head.appendChild(styleElement);
    }

    const previousStyleSheet = styleElement.textContent;
    styleElement.textContent = themeStyleSheet;

    root.setAttribute('data-ui-theme', 'rapport');
    root.setAttribute('data-ui-mode', mode);

    return () => {
      if (previousTheme === null) {
        root.removeAttribute('data-ui-theme');
      } else {
        root.setAttribute('data-ui-theme', previousTheme);
      }

      if (previousMode === null) {
        root.removeAttribute('data-ui-mode');
      } else {
        root.setAttribute('data-ui-mode', previousMode);
      }

      if (styleElement) {
        if (previousStyleSheet) {
          styleElement.textContent = previousStyleSheet;
        } else {
          styleElement.remove();
        }
      }
    };
  }, [mode, themeStyleSheet]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    // Persist the user's theme preference locally so reloads keep the same mode.
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  }, [mode]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Returns the current theme mode and the helpers used to change it.
 */
export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }

  return context;
}

