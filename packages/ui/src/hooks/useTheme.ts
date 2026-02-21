/**
 * useTheme Hook
 * 
 * Hook for accessing theme context.
 */

import { useContext } from 'react';
import { ThemeContext, type Theme } from '../theme/ThemeProvider.js';

/**
 * Use theme hook
 * 
 * @returns Current theme
 */
export function useTheme(): Theme {
  const context = useContext(ThemeContext);
  
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context.theme;
}
