import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { localStorageService } from '../services/localStorageService';
import { useAuth } from './AuthContext';

export interface ChatMessage {
  id?: string;
  senderId: string;
  text: string;
  createdAt: Date;
  read?: boolean;
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage?: string;
  lastMessageTime?: Date;
  createdAt: Date;
  updatedAt: Date;
  messages?: ChatMessage[];
}

interface ChatContextType {
  chats: Chat[];
  loading: boolean;
  getChat: (chatId: string) => Chat | undefined;
  getOrCreateChat: (otherUserId: string, otherUserEmail: string) => Promise<Chat>;
  sendMessage: (chatId: string, message: string) => Promise<void>;
  markAsRead: (chatId: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}

interface ChatProviderProps {
  children: ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  // Load chats from localStorage
  useEffect(() => {
    localStorageService.initialize();
    if (!currentUser) {
      setChats([]);
      setLoading(false);
      return;
    }

    try {
      const userChats = localStorageService.getChatsByParticipant(currentUser.id);
      setChats(userChats);
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const getChat = (chatId: string): Chat | undefined => {
    return chats.find(c => c.id === chatId);
  };

  const getOrCreateChat = async (otherUserId: string, otherUserEmail: string): Promise<Chat> => {
    if (!currentUser) {
      throw new Error('User must be authenticated');
    }

    try {
      // Find existing chat
      let chat = chats.find(c =>
        c.participants.includes(currentUser.id) &&
        c.participants.includes(otherUserId)
      );

      // Create new chat if doesn't exist
      if (!chat) {
        chat = {
          id: localStorageService.generateId(),
          participants: [currentUser.id, otherUserId],
          createdAt: new Date(),
          updatedAt: new Date(),
          messages: [],
        };

        localStorageService.saveChat(chat);
        setChats([chat, ...chats]);
      }

      return chat;
    } catch (error) {
      console.error('Error getting or creating chat:', error);
      throw error;
    }
  };

  const sendMessage = async (chatId: string, messageText: string) => {
    if (!currentUser) {
      throw new Error('User must be authenticated');
    }

    try {
      const chat = getChat(chatId);
      if (!chat) {
        throw new Error('Chat not found');
      }

      const message: ChatMessage = {
        id: localStorageService.generateId(),
        senderId: currentUser.id,
        text: messageText,
        createdAt: new Date(),
        read: false,
      };

      localStorageService.addChatMessage(chatId, message);

      // Update state
      const updatedChat = {
        ...chat,
        lastMessage: messageText,
        lastMessageTime: new Date(),
        updatedAt: new Date(),
      };

      setChats(chats.map(c => c.id === chatId ? updatedChat : c));
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  const markAsRead = async (chatId: string) => {
    try {
      const chat = getChat(chatId);
      if (!chat || !chat.messages) return;

      if (!chat.messages) chat.messages = [];
      const updatedMessages = chat.messages.map(m =>
        m.senderId !== currentUser?.id ? { ...m, read: true } : m
      );

      const updatedChat = {
        ...chat,
        messages: updatedMessages,
        updatedAt: new Date(),
      };

      localStorageService.saveChat(updatedChat);
      setChats(chats.map(c => c.id === chatId ? updatedChat : c));
    } catch (error) {
      console.error('Error marking as read:', error);
      throw error;
    }
  };

  return (
    <ChatContext.Provider
      value={{
        chats,
        loading,
        getChat,
        getOrCreateChat,
        sendMessage,
        markAsRead,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}
