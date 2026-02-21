/**
 * Text Component
 * 
 * Typography component with variants and theming support.
 */

import React from 'react';
import { Text as RNText, StyleSheet, TextStyle } from 'react-native';

/**
 * Text variants
 */
export type TextVariant =
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'heading4'
  | 'title1'
  | 'title2'
  | 'title3'
  | 'body'
  | 'bodySmall'
  | 'caption'
  | 'label'
  | 'button'
  | 'code';

/**
 * Text props
 */
export interface TextProps {
  /** Text content */
  children: React.ReactNode;
  /** Text variant */
  variant?: TextVariant;
  /** Text color */
  color?: string;
  /** Font weight */
  fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold';
  /** Text alignment */
  textAlign?: 'auto' | 'left' | 'center' | 'right' | 'justify';
  /** Number of lines (truncation) */
  numberOfLines?: number;
  /** Custom style */
  style?: TextStyle;
  /** Test ID */
  testID?: string;
  /** Accessibility label */
  accessibilityLabel?: string;
}

/**
 * Text component
 */
export const Text: React.FC<TextProps> = ({
  children,
  variant = 'body',
  color,
  fontWeight,
  textAlign,
  numberOfLines,
  style,
  testID,
  accessibilityLabel,
}) => {
  const textStyles = [
    styles.base,
    styles[variant],
    fontWeight && styles[fontWeight],
    textAlign && { textAlign },
    color && { color },
    style,
  ];

  return (
    <RNText
      style={textStyles}
      numberOfLines={numberOfLines}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </RNText>
  );
};

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
  },
  // Variants
  heading1: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700',
    color: '#111827',
  },
  heading2: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
    color: '#111827',
  },
  heading3: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600',
    color: '#111827',
  },
  heading4: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
    color: '#111827',
  },
  title1: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    color: '#111827',
  },
  title2: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    color: '#111827',
  },
  title3: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: '#111827',
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
  },
  bodySmall: {
    fontSize: 14,
    lineHeight: 20,
    color: '#374151',
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    color: '#6B7280',
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  button: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600',
    color: '#007AFF',
  },
  code: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'monospace',
    color: '#374151',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  // Font weights
  normal: {
    fontWeight: '400',
  },
  medium: {
    fontWeight: '500',
  },
  semibold: {
    fontWeight: '600',
  },
  bold: {
    fontWeight: '700',
  },
});
