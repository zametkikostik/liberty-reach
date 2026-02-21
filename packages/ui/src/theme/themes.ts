/**
 * Predefined Themes
 */

import type { Theme } from './types.js';

/**
 * Light theme
 */
export const lightTheme: Theme = {
  id: 'light',
  name: 'Light',
  colors: {
    // Primary - Liberty Blue
    primary: '#007AFF',
    primaryLight: '#5AC8FA',
    primaryDark: '#0056B3',
    primaryContrast: '#FFFFFF',
    
    // Secondary
    secondary: '#5856D6',
    secondaryLight: '#948FE8',
    secondaryDark: '#3C3A9B',
    secondaryContrast: '#FFFFFF',
    
    // Background
    background: '#FFFFFF',
    backgroundSecondary: '#F2F2F7',
    backgroundElevated: '#FFFFFF',
    
    // Surface
    surface: '#FFFFFF',
    surfaceVariant: '#F2F2F7',
    
    // Text
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    textInverse: '#FFFFFF',
    
    // Border
    border: '#E5E5EA',
    borderStrong: '#D1D5DB',
    
    // Status
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    info: '#007AFF',
    
    // Special
    overlay: 'rgba(0, 0, 0, 0.5)',
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  typography: {
    fontFamily: 'System',
    fontFamilyMedium: 'System',
    fontFamilySemibold: 'System',
    fontFamilyBold: 'System',
    fontSize: {
      xs: 11,
      sm: 13,
      md: 15,
      lg: 17,
      xl: 20,
      xxl: 28,
    },
    lineHeight: {
      xs: 16,
      sm: 18,
      md: 20,
      lg: 22,
      xl: 25,
      xxl: 34,
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  shadow: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.15)',
  },
};

/**
 * Dark theme
 */
export const darkTheme: Theme = {
  id: 'dark',
  name: 'Dark',
  colors: {
    // Primary
    primary: '#0A84FF',
    primaryLight: '#5AC8FA',
    primaryDark: '#0056B3',
    primaryContrast: '#FFFFFF',
    
    // Secondary
    secondary: '#5E5CE6',
    secondaryLight: '#948FE8',
    secondaryDark: '#3C3A9B',
    secondaryContrast: '#FFFFFF',
    
    // Background
    background: '#000000',
    backgroundSecondary: '#1C1C1E',
    backgroundElevated: '#2C2C2E',
    
    // Surface
    surface: '#1C1C1E',
    surfaceVariant: '#2C2C2E',
    
    // Text
    textPrimary: '#FFFFFF',
    textSecondary: '#98989D',
    textTertiary: '#636366',
    textInverse: '#111827',
    
    // Border
    border: '#38383A',
    borderStrong: '#48484A',
    
    // Status
    success: '#30D158',
    warning: '#FF9F0A',
    error: '#FF453A',
    info: '#0A84FF',
    
    // Special
    overlay: 'rgba(0, 0, 0, 0.7)',
    shadow: 'rgba(0, 0, 0, 0.3)',
  },
  spacing: lightTheme.spacing,
  typography: lightTheme.typography,
  borderRadius: lightTheme.borderRadius,
  shadow: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.2)',
    md: '0 4px 6px rgba(0, 0, 0, 0.3)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.3)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.4)',
  },
};

/**
 * Dim theme (AMOLED dark)
 */
export const dimTheme: Theme = {
  id: 'dim',
  name: 'Dim',
  colors: {
    // Primary - Dimmed
    primary: '#0A84FF',
    primaryLight: '#4080C0',
    primaryDark: '#004080',
    primaryContrast: '#FFFFFF',
    
    // Secondary
    secondary: '#4040A0',
    secondaryLight: '#6060C0',
    secondaryDark: '#202060',
    secondaryContrast: '#FFFFFF',
    
    // Background - Pure black for AMOLED
    background: '#000000',
    backgroundSecondary: '#0A0A0A',
    backgroundElevated: '#141414',
    
    // Surface
    surface: '#0A0A0A',
    surfaceVariant: '#141414',
    
    // Text - Dimmed
    textPrimary: '#E0E0E0',
    textSecondary: '#808080',
    textTertiary: '#505050',
    textInverse: '#FFFFFF',
    
    // Border
    border: '#202020',
    borderStrong: '#303030',
    
    // Status - Dimmed
    success: '#20A040',
    warning: '#C07000',
    error: '#C03020',
    info: '#0A84FF',
    
    // Special
    overlay: 'rgba(0, 0, 0, 0.8)',
    shadow: 'rgba(0, 0, 0, 0.5)',
  },
  spacing: lightTheme.spacing,
  typography: lightTheme.typography,
  borderRadius: lightTheme.borderRadius,
  shadow: darkTheme.shadow,
};
