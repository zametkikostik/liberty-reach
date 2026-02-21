/**
 * useColorScheme Hook
 * 
 * Hook for detecting system color scheme.
 */

import { useState, useEffect } from 'react';
import { Appearance } from 'react-native';

/**
 * Color scheme type
 */
export type ColorScheme = 'light' | 'dark' | null;

/**
 * Use color scheme hook
 * 
 * @returns Current system color scheme
 */
export function useColorScheme(): ColorScheme {
  const [colorScheme, setColorScheme] = useState<ColorScheme>(
    Appearance.getColorScheme()
  );

  useEffect(() => {
    const subscription = Appearance.addColorSchemeChangeListener((newScheme) => {
      setColorScheme(newScheme);
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  return colorScheme;
}
