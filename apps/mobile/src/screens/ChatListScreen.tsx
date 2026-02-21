import React from 'react';
import {View, StyleSheet, FlatList} from 'react-native';
import {ConversationList, StatusBar, IconButton, Text} from '@liberty-reach/ui';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useChatStore} from '../store/chatStore';

type RootStackParamList = {
  Main: undefined;
  Chat: {conversationId: string};
  Settings: undefined;
  ContactSearch: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;

export default function ChatListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const {conversations} = useChatStore();

  const handleConversationPress = (conversation: any) => {
    navigation.navigate('Chat', {conversationId: conversation.id});
  };

  const handleSearch = () => {
    navigation.navigate('ContactSearch');
  };

  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  return (
    <View style={styles.container}>
      <StatusBar
        title="Liberty Reach"
        rightAction={
          <View style={styles.headerActions}>
            <IconButton icon="🔍" onPress={handleSearch} size="small" />
            <IconButton icon="⚙️" onPress={handleSettings} size="small" />
          </View>
        }
      />
      
      {conversations.length === 0 ? (
        <View style={styles.emptyState}>
          <Text variant="body">No conversations yet</Text>
          <Text variant="caption">Start a new chat to begin</Text>
        </View>
      ) : (
        <ConversationList
          conversations={conversations}
          onConversationPress={handleConversationPress}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
