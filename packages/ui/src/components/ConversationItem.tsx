/**
 * ConversationItem Component
 * 
 * Single conversation item for conversation list.
 */

import React from 'react';
import { View, Text as RNText, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Avatar } from './Avatar.js';
import { Text } from './Text.js';

/**
 * Conversation item props
 */
export interface ConversationItemProps {
  /** Conversation name */
  name: string;
  /** Avatar URL */
  avatarUrl?: string;
  /** Last message preview */
  lastMessage?: string;
  /** Last message timestamp */
  lastMessageTime?: string;
  /** Unread message count */
  unreadCount?: number;
  /** Is user online */
  isOnline?: boolean;
  /** Is conversation muted */
  isMuted?: boolean;
  /** Is conversation pinned */
  isPinned?: boolean;
  /** Custom style */
  style?: ViewStyle;
  /** On press handler */
  onPress?: () => void;
  /** On long press handler */
  onLongPress?: () => void;
}

/**
 * Conversation item component
 */
export const ConversationItem: React.FC<ConversationItemProps> = ({
  name,
  avatarUrl,
  lastMessage,
  lastMessageTime,
  unreadCount = 0,
  isOnline = false,
  isMuted = false,
  isPinned = false,
  style,
  onPress,
  onLongPress,
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        <Avatar name={name} imageUrl={avatarUrl} size="md" isOnline={isOnline} />
        {isPinned && <View style={styles.pinIndicator} />}
      </View>
      
      <View style={styles.content}>
        <View style={styles.header}>
          <RNText style={styles.name} numberOfLines={1}>
            {name}
          </RNText>
          
          {lastMessageTime && (
            <RNText style={styles.timestamp} numberOfLines={1}>
              {lastMessageTime}
            </RNText>
          )}
        </View>
        
        <View style={styles.footer}>
          <RNText
            style={[styles.lastMessage, isMuted && styles.mutedMessage]}
            numberOfLines={1}
          >
            {isMuted && '🔇 '}
            {lastMessage || 'No messages yet'}
          </RNText>
          
          <View style={styles.badgeContainer}>
            {unreadCount > 0 && (
              <View style={[styles.badge, unreadCount > 99 && styles.badgeLarge]}>
                <RNText style={styles.badgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </RNText>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  avatarContainer: {
    position: 'relative',
  },
  pinIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
  },
  mutedMessage: {
    color: '#9CA3AF',
  },
  badgeContainer: {
    marginLeft: 8,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeLarge: {
    minWidth: 36,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
