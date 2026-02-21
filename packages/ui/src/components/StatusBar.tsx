/**
 * StatusBar and Additional UI Components
 * 
 * Common UI components for Liberty Reach applications.
 */

import React from 'react';
import {
  View,
  Text as RNText,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal as RNModal,
  ViewStyle,
} from 'react-native';

// ============================================================================
// StatusBar Component
// ============================================================================

/**
 * StatusBar props
 */
export interface StatusBarProps {
  /** Status bar title */
  title?: string;
  /** Show back button */
  showBack?: boolean;
  /** On back press handler */
  onBackPress?: () => void;
  /** Right action button */
  rightAction?: React.ReactNode;
  /** Custom style */
  style?: ViewStyle;
  /** Transparent background */
  transparent?: boolean;
}

/**
 * StatusBar component
 */
export const StatusBar: React.FC<StatusBarProps> = ({
  title,
  showBack = false,
  onBackPress,
  rightAction,
  style,
  transparent = false,
}) => {
  return (
    <View style={[styles.statusBar, transparent && styles.statusBarTransparent, style]}>
      <View style={styles.statusBarLeft}>
        {showBack && (
          <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
            <RNText style={styles.backButtonText}>←</RNText>
          </TouchableOpacity>
        )}
      </View>
      
      {title && <RNText style={styles.statusBarTitle}>{title}</RNText>}
      
      <View style={styles.statusBarRight}>{rightAction}</View>
    </View>
  );
};

// ============================================================================
// IconButton Component
// ============================================================================

/**
 * IconButton props
 */
export interface IconButtonProps {
  /** Icon (emoji or component) */
  icon: string | React.ReactNode;
  /** On press handler */
  onPress?: () => void;
  /** Disabled state */
  disabled?: boolean;
  /** Custom style */
  style?: ViewStyle;
  /** Size */
  size?: 'small' | 'medium' | 'large';
  /** Variant */
  variant?: 'default' | 'filled' | 'danger';
  /** Accessibility label */
  accessibilityLabel?: string;
}

/**
 * IconButton component
 */
export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onPress,
  disabled = false,
  style,
  size = 'medium',
  variant = 'default',
  accessibilityLabel,
}) => {
  const sizeMap = { small: 32, medium: 40, large: 48 };
  const iconSizeMap = { small: 16, medium: 20, large: 24 };
  
  const buttonSize = sizeMap[size];
  const iconSize = iconSizeMap[size];

  return (
    <TouchableOpacity
      style={[
        styles.iconButton,
        { width: buttonSize, height: buttonSize },
        variant === 'filled' && styles.iconButtonFilled,
        variant === 'danger' && styles.iconButtonDanger,
        disabled && styles.iconButtonDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
    >
      {typeof icon === 'string' ? (
        <RNText style={{ fontSize: iconSize }}>{icon}</RNText>
      ) : (
        icon
      )}
    </TouchableOpacity>
  );
};

// ============================================================================
// Modal Component
// ============================================================================

/**
 * Modal props
 */
export interface ModalProps {
  /** Modal visibility */
  visible: boolean;
  /** Modal title */
  title?: string;
  /** On dismiss handler */
  onDismiss?: () => void;
  /** Children */
  children: React.ReactNode;
  /** Show close button */
  showClose?: boolean;
  /** Custom style */
  style?: ViewStyle;
}

/**
 * Modal component
 */
export const Modal: React.FC<ModalProps> = ({
  visible,
  title,
  onDismiss,
  children,
  showClose = true,
  style,
}) => {
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, style]}>
          <View style={styles.modalHeader}>
            {title && <RNText style={styles.modalTitle}>{title}</RNText>}
            {showClose && (
              <TouchableOpacity onPress={onDismiss} style={styles.modalClose}>
                <RNText style={styles.modalCloseText}>✕</RNText>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.modalBody}>{children}</View>
        </View>
      </View>
    </RNModal>
  );
};

// ============================================================================
// LoadingSpinner Component
// ============================================================================

/**
 * LoadingSpinner props
 */
export interface LoadingSpinnerProps {
  /** Size */
  size?: 'small' | 'medium' | 'large';
  /** Color */
  color?: string;
  /** Custom style */
  style?: ViewStyle;
  /** Loading text */
  text?: string;
}

/**
 * LoadingSpinner component
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color = '#007AFF',
  style,
  text,
}) => {
  const sizeMap = { small: 24, medium: 36, large: 48 };

  return (
    <View style={[styles.loadingContainer, style]}>
      <ActivityIndicator size={sizeMap[size]} color={color} />
      {text && <RNText style={styles.loadingText}>{text}</RNText>}
    </View>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  // StatusBar
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  statusBarTransparent: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
  },
  statusBarLeft: {
    width: 40,
  },
  statusBarRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 24,
    color: '#007AFF',
  },
  statusBarTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
  },
  // IconButton
  iconButton: {
    borderRadius: 20,
    backgroundColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonFilled: {
    backgroundColor: '#007AFF',
  },
  iconButtonDanger: {
    backgroundColor: '#FF3B30',
  },
  iconButtonDisabled: {
    opacity: 0.5,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    width: '85%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalClose: {
    padding: 4,
  },
  modalCloseText: {
    fontSize: 20,
    color: '#6B7280',
  },
  modalBody: {
    padding: 16,
  },
  // LoadingSpinner
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
});
