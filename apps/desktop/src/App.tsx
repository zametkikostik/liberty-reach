import React from 'react';
import {ConversationList, MessageList, Button, Avatar, Text, Input} from '@liberty-reach/ui';
import './App.css';

function App() {
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-header">
          <Avatar name="LR" size="sm" />
          <Text variant="title2">Liberty Reach</Text>
        </div>
        <div className="search-container">
          <Input placeholder="Search chats..." />
        </div>
        <div className="conversation-list">
          <ConversationList
            conversations={[
              {
                id: '1',
                name: 'Alice',
                avatarUrl: undefined,
                lastMessage: 'Hello!',
                lastMessageTime: '10:30 AM',
                unreadCount: 2,
                isOnline: true,
              },
              {
                id: '2',
                name: 'Bob',
                avatarUrl: undefined,
                lastMessage: 'See you tomorrow',
                lastMessageTime: 'Yesterday',
                unreadCount: 0,
              },
            ]}
            onConversationPress={() => {}}
          />
        </div>
      </aside>
      <main className="chat-area">
        <div className="chat-header">
          <Avatar name="Alice" size="sm" />
          <div className="chat-info">
            <Text variant="title3">Alice</Text>
            <Text variant="caption">Online</Text>
          </div>
        </div>
        <div className="messages">
          <MessageList
            messages={[
              {
                id: '1',
                message: 'Hello! How are you?',
                senderName: 'Alice',
                timestamp: '10:30 AM',
                isRead: true,
                isDelivered: true,
              },
              {
                id: '2',
                message: "I'm doing great, thanks!",
                senderName: 'You',
                timestamp: '10:31 AM',
                isRead: true,
                isDelivered: true,
              },
            ]}
            currentUserId="current-user"
          />
        </div>
        <div className="message-input">
          <Input placeholder="Type a message..." />
          <Button title="Send" />
        </div>
      </main>
    </div>
  );
}

export default App;
