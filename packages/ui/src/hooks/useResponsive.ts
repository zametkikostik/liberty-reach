/**
 * useResponsive Hook
 * 
 * Hook for responsive design based on screen size.
 */

import { useState, useEffect } from 'react';
import { Dimensions, ScaledSize } from 'react-native';
import { BREAKPOINTS, type Breakpoint } from '../theme/breakpoints.js';

/**
 * Responsive state
 */
interface ResponsiveState {
  width: number;
  height: number;
  breakpoint: Breakpoint;
  isSmall: boolean;
  isMedium: boolean;
  isLarge: boolean;
  isXLarge: boolean;
}

/**
 * Use responsive hook
 * 
 * @returns Responsive state
 */
export function useResponsive(): ResponsiveState {
  const [dimensions, setDimensions] = useState<ScaledSize>(Dimensions.get('window'));
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('small');

  useEffect(() => {
    const onChange = ({ window }: { window: ScaledSize }) => {
      setDimensions(window);
      
      // Determine breakpoint
      if (window.width >= BREAKPOINTS.xlarge) {
        setBreakpoint('xlarge');
      } else if (window.width >= BREAKPOINTS.large) {
        setBreakpoint('large');
      } else if (window.width >= BREAKPOINTS.medium) {
        setBreakpoint('medium');
      } else {
        setBreakpoint('small');
      }
    };

    const subscription = Dimensions.addEventListener('change', onChange);
    
    // Initial calculation
    onChange({ window: dimensions });

    return () => {
      subscription?.remove();
    };
  }, []);

  return {
    width: dimensions.width,
    height: dimensions.height,
    breakpoint,
    isSmall: breakpoint === 'small',
    isMedium: breakpoint === 'medium',
    isLarge: breakpoint === 'large',
    isXLarge: breakpoint === 'xlarge',
  };
}
