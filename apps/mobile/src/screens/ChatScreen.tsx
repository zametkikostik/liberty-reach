import React, {useState, useRef} from 'react';
import {View, StyleSheet, TextInput, KeyboardAvoidingView, Platform} from 'react-native';
import {MessageList, StatusBar, IconButton, Button} from '@liberty-reach/ui';
import {useRoute, useNavigation} from '@react-navigation/native';
import {useChatStore} from '../store/chatStore';
import {useAuthStore} from '../store/authStore';

export default function ChatScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const {conversationId} = route.params;
  const {currentUserId} = useAuthStore();
  const {getMessages, sendMessage} = useChatStore();
  const [messageText, setMessageText] = useState('');

  const messages = getMessages(conversationId);

  const handleSend = () => {
    if (messageText.trim()) {
      sendMessage(conversationId, messageText.trim());
      setMessageText('');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        title="Chat"
        showBack
        onBackPress={() => navigation.goBack()}
      />
      
      <MessageList
        messages={messages}
        currentUserId={currentUserId}
        style={styles.messageList}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Message"
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={4000}
          />
          <Button
            title="Send"
            size="small"
            onPress={handleSend}
            disabled={!messageText.trim()}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  messageList: {
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  input: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
  },
});
