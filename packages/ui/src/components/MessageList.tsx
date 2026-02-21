/**
 * MessageList and Conversation Components
 * 
 * Components for displaying chat messages and conversation lists.
 */

import React from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ViewStyle,
  ListRenderItemInfo,
} from 'react-native';
import { ChatBubble, type ChatBubbleProps } from './ChatBubble.js';
import { ConversationItem, type ConversationItemProps } from './ConversationItem.js';

/**
 * Message item for MessageList
 */
export interface MessageItem extends ChatBubbleProps {
  id: string;
}

/**
 * MessageList props
 */
export interface MessageListProps {
  /** Messages to display */
  messages: MessageItem[];
  /** Current user ID */
  currentUserId: string;
  /** Loading more messages */
  loadingMore?: boolean;
  /** On end reached (pagination) */
  onEndReached?: () => void;
  /** On message press */
  onMessagePress?: (message: MessageItem) => void;
  /** On message long press */
  onMessageLongPress?: (message: MessageItem) => void;
  /** Custom style */
  style?: ViewStyle;
  /** Inverted list (newest at bottom) */
  inverted?: boolean;
}

/**
 * MessageList component
 */
export const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUserId,
  loadingMore = false,
  onEndReached,
  onMessagePress,
  onMessageLongPress,
  style,
  inverted = true,
}) => {
  const renderItem = ({ item }: ListRenderItemInfo<MessageItem>) => (
    <ChatBubble
      message={item.message}
      senderName={item.senderName}
      senderAvatar={item.senderAvatar}
      timestamp={item.timestamp}
      alignment={item.senderName === currentUserId ? 'right' : 'left'}
      isOwn={item.senderName === currentUserId}
      isRead={item.isRead}
      isDelivered={item.isDelivered}
      showSender={item.showSender}
      showAvatar={item.showAvatar}
      onPress={() => onMessagePress?.(item)}
      onLongPress={() => onMessageLongPress?.(item)}
    />
  );

  return (
    <View style={[styles.container, style]}>
      <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        inverted={inverted}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
      {loadingMore && (
        <View style={styles.loadingMore}>
          <View style={styles.loadingDot} />
          <View style={styles.loadingDot} />
          <View style={styles.loadingDot} />
        </View>
      )}
    </View>
  );
};

/**
 * Conversation item for ConversationList
 */
export interface ConversationListItem extends ConversationItemProps {
  id: string;
}

/**
 * ConversationList props
 */
export interface ConversationListProps {
  /** Conversations to display */
  conversations: ConversationListItem[];
  /** On conversation press */
  onConversationPress?: (conversation: ConversationListItem) => void;
  /** On conversation long press */
  onConversationLongPress?: (conversation: ConversationListItem) => void;
  /** Custom style */
  style?: ViewStyle;
  /** Empty component */
  EmptyComponent?: React.ReactNode;
}

/**
 * ConversationList component
 */
export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  onConversationPress,
  onConversationLongPress,
  style,
  EmptyComponent,
}) => {
  const renderItem = ({ item }: ListRenderItemInfo<ConversationListItem>) => (
    <ConversationItem
      name={item.name}
      avatarUrl={item.avatarUrl}
      lastMessage={item.lastMessage}
      lastMessageTime={item.lastMessageTime}
      unreadCount={item.unreadCount}
      isOnline={item.isOnline}
      isMuted={item.isMuted}
      isPinned={item.isPinned}
      onPress={() => onConversationPress?.(item)}
      onLongPress={() => onConversationLongPress?.(item)}
    />
  );

  if (conversations.length === 0 && EmptyComponent) {
    return <>{EmptyComponent}</>;
  }

  return (
    <View style={[styles.container, style]}>
      <FlatList
        data={conversations}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 8,
  },
  loadingMore: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 4,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginLeft: 72,
  },
});
