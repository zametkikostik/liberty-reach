import {create} from 'zustand';

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  timestamp: number;
  isRead: boolean;
  isDelivered: boolean;
}

interface Conversation {
  id: string;
  name: string;
  avatarUrl?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  isOnline?: boolean;
  isMuted?: boolean;
  isPinned?: boolean;
}

interface ChatState {
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  getMessages: (conversationId: string) => Message[];
  sendMessage: (conversationId: string, content: string) => void;
  markAsRead: (conversationId: string) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  messages: {},

  getMessages: (conversationId) => {
    return get().messages[conversationId] || [];
  },

  sendMessage: (conversationId, content) => {
    const message: Message = {
      id: Date.now().toString(),
      conversationId,
      senderId: 'current-user',
      content,
      timestamp: Date.now(),
      isRead: false,
      isDelivered: false,
    };

    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: [...(state.messages[conversationId] || []), message],
      },
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId
          ? {
              ...conv,
              lastMessage: content,
              lastMessageTime: new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              }),
            }
          : conv
      ),
    }));
  },

  markAsRead: (conversationId) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: state.messages[conversationId]?.map((msg) => ({
          ...msg,
          isRead: true,
        })),
      },
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId ? {...conv, unreadCount: 0} : conv
      ),
    }));
  },

  addConversation: (conversation) => {
    set((state) => ({
      conversations: [...state.conversations, conversation],
    }));
  },

  updateConversation: (id, updates) => {
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === id ? {...conv, ...updates} : conv
      ),
    }));
  },
}));
