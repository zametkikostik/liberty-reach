/**
 * ChatBubble Component
 * 
 * Message bubble for chat conversations.
 */

import React from 'react';
import { View, Text as RNText, StyleSheet, ViewStyle } from 'react-native';
import { Avatar } from './Avatar.js';
import { Text } from './Text.js';

/**
 * Message alignment
 */
export type MessageAlignment = 'left' | 'right';

/**
 * Chat bubble props
 */
export interface ChatBubbleProps {
  /** Message content */
  message: string;
  /** Sender name (for group chats) */
  senderName?: string;
  /** Sender avatar URL */
  senderAvatar?: string;
  /** Message timestamp */
  timestamp: string;
  /** Message alignment */
  alignment?: MessageAlignment;
  /** Is this message from current user */
  isOwn?: boolean;
  /** Read status */
  isRead?: boolean;
  /** Delivered status */
  isDelivered?: boolean;
  /** Message is selected */
  isSelected?: boolean;
  /** Show sender info (for group chats) */
  showSender?: boolean;
  /** Show avatar (for group chats) */
  showAvatar?: boolean;
  /** Custom style */
  style?: ViewStyle;
  /** On long press handler */
  onLongPress?: () => void;
  /** On press handler */
  onPress?: () => void;
}

/**
 * Chat bubble component
 */
export const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  senderName,
  senderAvatar,
  timestamp,
  alignment = 'left',
  isOwn = false,
  isRead = false,
  isDelivered = false,
  isSelected = false,
  showSender = false,
  showAvatar = false,
  style,
  onLongPress,
  onPress,
}) => {
  const isLeft = alignment === 'left';

  const containerStyles = [
    styles.container,
    isLeft ? styles.containerLeft : styles.containerRight,
    style,
  ];

  const bubbleStyles = [
    styles.bubble,
    isLeft ? styles.bubbleLeft : styles.bubbleRight,
    isSelected && styles.bubbleSelected,
  ];

  const contentContainer = [
    styles.contentContainer,
    isLeft ? styles.contentLeft : styles.contentRight,
  ];

  return (
    <View style={containerStyles}>
      {showAvatar && isLeft && (
        <Avatar name={senderName} imageUrl={senderAvatar} size="sm" />
      )}
      
      <View
        style={contentContainer}
        onLongPress={onLongPress}
        onStartShouldSetResponder={onPress ? () => true : undefined}
        onResponderRelease={onPress}
      >
        {showSender && senderName && (
          <RNText style={styles.senderName}>{senderName}</RNText>
        )}
        
        <View style={bubbleStyles}>
          <RNText style={isOwn ? styles.messageOwn : styles.message}>{message}</RNText>
          
          <View style={styles.metadata}>
            <RNText style={isOwn ? styles.timestampOwn : styles.timestamp}>
              {timestamp}
            </RNText>
            
            {isOwn && (
              <RNText style={styles.readStatus}>
                {isRead ? '✓✓' : isDelivered ? '✓✓' : '✓'}
              </RNText>
            )}
          </View>
        </View>
      </View>
      
      {showAvatar && !isLeft && <View style={styles.avatarPlaceholder} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 8,
  },
  containerLeft: {
    justifyContent: 'flex-start',
  },
  containerRight: {
    justifyContent: 'flex-end',
  },
  contentContainer: {
    maxWidth: '75%',
  },
  contentLeft: {
    alignItems: 'flex-start',
  },
  contentRight: {
    alignItems: 'flex-end',
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '100%',
  },
  bubbleLeft: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  bubbleRight: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  bubbleSelected: {
    backgroundColor: '#E3F2FD',
  },
  message: {
    fontSize: 15,
    lineHeight: 20,
    color: '#111827',
  },
  messageOwn: {
    fontSize: 15,
    lineHeight: 20,
    color: '#FFFFFF',
  },
  senderName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
    marginLeft: 4,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 4,
  },
  timestamp: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  timestampOwn: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  readStatus: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  avatarPlaceholder: {
    width: 32,
  },
});
