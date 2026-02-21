/**
 * Input Component
 * 
 * Accessible text input component with validation and icons.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  Text as RNText,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';

/**
 * Input props
 */
export interface InputProps {
  /** Input value */
  value?: string;
  /** Default value */
  defaultValue?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Input label */
  label?: string;
  /** Error message */
  error?: string;
  /** Helper text */
  helperText?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Read-only state */
  readOnly?: boolean;
  /** Secure text entry (password) */
  secureTextEntry?: boolean;
  /** Multiline input */
  multiline?: boolean;
  /** Number of lines for multiline */
  numberOfLines?: number;
  /** Maximum length */
  maxLength?: number;
  /** Custom style */
  style?: ViewStyle;
  /** Custom input style */
  inputStyle?: TextStyle;
  /** Left icon */
  leftIcon?: React.ReactNode;
  /** Right icon */
  rightIcon?: React.ReactNode;
  /** On change text handler */
  onChangeText?: (text: string) => void;
  /** On focus handler */
  onFocus?: () => void;
  /** On blur handler */
  onBlur?: () => void;
  /** On submit handler */
  onSubmitEditing?: () => void;
  /** Test ID */
  testID?: string;
  /** Accessibility label */
  accessibilityLabel?: string;
  /** Auto-capitalize */
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  /** Auto-correct */
  autoCorrect?: boolean;
  /** Keyboard type */
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  /** Return key type */
  returnKeyType?: 'done' | 'go' | 'next' | 'search' | 'send';
}

/**
 * Input component
 */
export const Input: React.FC<InputProps> = ({
  value,
  defaultValue,
  placeholder,
  label,
  error,
  helperText,
  disabled = false,
  readOnly = false,
  secureTextEntry = false,
  multiline = false,
  numberOfLines = 1,
  maxLength,
  style,
  inputStyle,
  leftIcon,
  rightIcon,
  onChangeText,
  onFocus,
  onBlur,
  onSubmitEditing,
  testID,
  accessibilityLabel,
  autoCapitalize = 'sentences',
  autoCorrect = true,
  keyboardType = 'default',
  returnKeyType = 'done',
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isSecure, setIsSecure] = useState(secureTextEntry);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    onFocus?.();
  }, [onFocus]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    onBlur?.();
  }, [onBlur]);

  const toggleSecure = useCallback(() => {
    setIsSecure((prev) => !prev);
  }, []);

  const containerStyles = [
    styles.container,
    disabled && styles.disabledContainer,
    error && styles.errorContainer,
    isFocused && styles.focusedContainer,
    style,
  ];

  const inputContainerStyles = [
    styles.inputContainer,
    multiline && styles.multilineContainer,
  ];

  const inputStyles = [
    styles.input,
    multiline && styles.multilineInput,
    disabled && styles.disabledInput,
    inputStyle,
  ];

  return (
    <View style={containerStyles}>
      {label && <RNText style={styles.label}>{label}</RNText>}
      
      <View style={inputContainerStyles}>
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
        
        <TextInput
          style={inputStyles}
          value={value}
          defaultValue={defaultValue}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onSubmitEditing={onSubmitEditing}
          editable={!disabled && !readOnly}
          secureTextEntry={isSecure}
          multiline={multiline}
          numberOfLines={numberOfLines}
          maxLength={maxLength}
          testID={testID}
          accessibilityLabel={accessibilityLabel || label || placeholder}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          keyboardType={keyboardType}
          returnKeyType={returnKeyType}
        />
        
        {secureTextEntry && (
          <TouchableOpacity onPress={toggleSecure} style={styles.iconRight}>
            <RNText>{isSecure ? '👁' : '👁‍🗨'}</RNText>
          </TouchableOpacity>
        )}
        
        {rightIcon && !secureTextEntry && (
          <View style={styles.iconRight}>{rightIcon}</View>
        )}
      </View>
      
      {(error || helperText) && (
        <RNText style={[styles.helperText, error && styles.errorText]}>
          {error || helperText}
        </RNText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    minHeight: 44,
  },
  multilineContainer: {
    alignItems: 'flex-start',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  multilineInput: {
    textAlignVertical: 'top',
    minHeight: 100,
  },
  iconLeft: {
    paddingLeft: 12,
    paddingRight: 8,
  },
  iconRight: {
    paddingRight: 12,
    paddingLeft: 8,
  },
  disabledContainer: {
    opacity: 0.6,
  },
  errorContainer: {
    borderColor: '#FF3B30',
  },
  focusedContainer: {
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  disabledInput: {
    backgroundColor: '#F3F4F6',
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  errorText: {
    color: '#FF3B30',
  },
});
