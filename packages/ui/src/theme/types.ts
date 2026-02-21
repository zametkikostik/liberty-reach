/**
 * Theme Types
 */

/**
 * Theme color palette
 */
export interface ThemeColors {
  // Primary
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primaryContrast: string;
  
  // Secondary
  secondary: string;
  secondaryLight: string;
  secondaryDark: string;
  secondaryContrast: string;
  
  // Background
  background: string;
  backgroundSecondary: string;
  backgroundElevated: string;
  
  // Surface
  surface: string;
  surfaceVariant: string;
  
  // Text
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  
  // Border
  border: string;
  borderStrong: string;
  
  // Status
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // Special
  overlay: string;
  shadow: string;
}

/**
 * Theme spacing scale
 */
export interface ThemeSpacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

/**
 * Theme typography
 */
export interface ThemeTypography {
  fontFamily: string;
  fontFamilyMedium: string;
  fontFamilySemibold: string;
  fontFamilyBold: string;
  
  fontSize: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  
  lineHeight: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  
  fontWeight: {
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
}

/**
 * Theme interface
 */
export interface Theme {
  id: string;
  name: string;
  colors: ThemeColors;
  spacing: ThemeSpacing;
  typography: ThemeTypography;
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    full: number;
  };
  shadow: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}
