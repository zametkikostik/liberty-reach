/**
 * Theme Provider
 * 
 * React context provider for theme management.
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { Theme } from './types.js';
import { lightTheme, darkTheme, dimTheme } from './themes.js';

/**
 * Theme context type
 */
interface ThemeContextType {
  theme: Theme;
  themeId: string;
  setTheme: (themeId: string) => void;
  isDark: boolean;
}

/**
 * Theme context
 */
export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Available themes
 */
const THEMES: Record<string, Theme> = {
  light: lightTheme,
  dark: darkTheme,
  dim: dimTheme,
};

/**
 * Theme provider props
 */
interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: string;
  onThemeChange?: (themeId: string) => void;
}

/**
 * Theme provider component
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'light',
  onThemeChange,
}) => {
  const [themeId, setThemeId] = useState<string>(defaultTheme);
  
  const theme = THEMES[themeId] || lightTheme;
  const isDark = themeId === 'dark' || themeId === 'dim';

  const setTheme = useCallback(
    (newThemeId: string) => {
      if (THEMES[newThemeId]) {
        setThemeId(newThemeId);
        onThemeChange?.(newThemeId);
      }
    },
    [onThemeChange]
  );

  const value: ThemeContextType = {
    theme,
    themeId,
    setTheme,
    isDark,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

/**
 * Use theme context
 */
export function useThemeContext(): ThemeContextType {
  const context = useContext(ThemeContext);
  
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  
  return context;
}
