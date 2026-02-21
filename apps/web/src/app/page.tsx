'use client';

import React, {useState} from 'react';
import {Button, Input, Text, Avatar, ConversationList, MessageList} from '@liberty-reach/ui';
import './page.css';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');

  if (!isAuthenticated) {
    return (
      <main className="landing-page">
        <div className="hero">
          <Avatar name="LR" size="xl" />
          <h1>Liberty Reach</h1>
          <p className="tagline">Post-Quantum Secure Messenger</p>
          
          <div className="login-form">
            <Input
              label="Phone Number"
              placeholder="+1 (555) 000-0000"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />
            <Button
              title="Get Started"
              onPress={() => setIsAuthenticated(true)}
              fullWidth
            />
          </div>
          
          <div className="features">
            <div className="feature">
              <span className="feature-icon">🔐</span>
              <h3>End-to-End Encrypted</h3>
              <p>CRYSTALS-Kyber-1024 post-quantum encryption</p>
            </div>
            <div className="feature">
              <span className="feature-icon">🌐</span>
              <h3>P2P Messaging</h3>
              <p>Direct connections, no middleman</p>
            </div>
            <div className="feature">
              <span className="feature-icon">📱</span>
              <h3>Cross-Platform</h3>
              <p>Works on all your devices</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="app-page">
      <aside className="sidebar">
        <div className="sidebar-header">
          <Avatar name="LR" size="sm" />
          <Text variant="title2">Liberty Reach</Text>
        </div>
        <div className="conversation-list">
          <ConversationList
            conversations={[
              {
                id: '1',
                name: 'Alice',
                lastMessage: 'Hello!',
                lastMessageTime: '10:30 AM',
                unreadCount: 2,
                isOnline: true,
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
              },
            ]}
            currentUserId="current-user"
          />
        </div>
        <div className="message-input">
          <Input placeholder="Type a message..." />
          <Button title="Send" size="small" />
        </div>
      </main>
    </main>
  );
}
