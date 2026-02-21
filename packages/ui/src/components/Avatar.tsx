/**
 * Avatar Component
 * 
 * User avatar with image, initials, or placeholder.
 */

import React, { useMemo } from 'react';
import { View, Image, Text as RNText, StyleSheet, ViewStyle } from 'react-native';

/**
 * Avatar sizes
 */
export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

/**
 * Avatar props
 */
export interface AvatarProps {
  /** User display name (for initials) */
  name?: string;
  /** Avatar image URL */
  imageUrl?: string;
  /** Avatar size */
  size?: AvatarSize;
  /** Online status indicator */
  isOnline?: boolean;
  /** Custom style */
  style?: ViewStyle;
  /** Test ID */
  testID?: string;
  /** Accessibility label */
  accessibilityLabel?: string;
}

const SIZE_MAP: Record<AvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
  xxl: 96,
};

const FONT_SIZE_MAP: Record<AvatarSize, number> = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 28,
};

const STATUS_SIZE_MAP: Record<AvatarSize, number> = {
  xs: 6,
  sm: 8,
  md: 10,
  lg: 12,
  xl: 14,
  xxl: 18,
};

/**
 * Avatar component
 */
export const Avatar: React.FC<AvatarProps> = ({
  name,
  imageUrl,
  size = 'md',
  isOnline = false,
  style,
  testID,
  accessibilityLabel,
}) => {
  const containerSize = SIZE_MAP[size];
  const fontSize = FONT_SIZE_MAP[size];
  const statusSize = STATUS_SIZE_MAP[size];

  const initials = useMemo(() => {
    if (!name) return '';
    const parts = name.split(' ').filter(Boolean);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0]!.substring(0, 2).toUpperCase();
    return (parts[0]![0] + parts[parts.length - 1]![0]).toUpperCase();
  }, [name]);

  const backgroundColor = useMemo(() => {
    if (!name) return '#E5E5EA';
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 80%)`;
  }, [name]);

  const containerStyles = [
    styles.container,
    { width: containerSize, height: containerSize, backgroundColor },
    style,
  ];

  return (
    <View
      style={containerStyles}
      testID={testID}
      accessibilityLabel={accessibilityLabel || name || 'Avatar'}
      accessibilityRole="image"
    >
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <RNText style={[styles.initials, { fontSize }]}>{initials}</RNText>
      )}
      
      {isOnline && (
        <View
          style={[
            styles.statusIndicator,
            { width: statusSize, height: statusSize },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 9999,
  },
  initials: {
    fontWeight: '600',
    color: '#374151',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderRadius: 9999,
    backgroundColor: '#34C759',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
