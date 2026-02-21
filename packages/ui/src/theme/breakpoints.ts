/**
 * Responsive Breakpoints
 */

/**
 * Breakpoint names
 */
export type Breakpoint = 'small' | 'medium' | 'large' | 'xlarge';

/**
 * Breakpoint values in pixels
 */
export const BREAKPOINTS = {
  small: 0,
  medium: 600,
  large: 1024,
  xlarge: 1440,
};

/**
 * Get breakpoint from width
 */
export function getBreakpoint(width: number): Breakpoint {
  if (width >= BREAKPOINTS.xlarge) return 'xlarge';
  if (width >= BREAKPOINTS.large) return 'large';
  if (width >= BREAKPOINTS.medium) return 'medium';
  return 'small';
}
