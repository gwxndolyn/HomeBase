import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  getDoc,
  getDocs,
  setDoc,
  Timestamp,
  writeBatch,
  limit
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderPhotoURL?: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'image' | 'system';
  read: boolean;
}

export interface Chat {
  id: string;
  participants: string[]; // User IDs
  participantNames: Record<string, string>; // userId -> displayName
  participantPhotos: Record<string, string>; // userId -> photoURL
  lastMessage: string;
  lastMessageTime: Date;
  lastMessageSenderId: string;
  unreadCount: Record<string, number>; // userId -> unread count
  createdAt: Date;
  updatedAt: Date;
}

interface ChatContextType {
  chats: Chat[];
  loading: boolean;
  getMessages: (chatId: string) => Message[];
  sendMessage: (chatId: string, content: string, type?: 'text' | 'image') => Promise<void>;
  markMessagesAsRead: (chatId: string) => Promise<void>;
  createOrGetChat: (otherUserId: string, otherUserName: string, otherUserPhoto?: string) => Promise<string>;
  getChatWithUser: (otherUserId: string) => Chat | undefined;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}

interface ChatProviderProps {
  children: ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  const { currentUser } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [loading, setLoading] = useState(true);

  // Subscribe to user's chats
  useEffect(() => {
    if (!currentUser) {
      console.log('[ChatContext] No current user, clearing chats');
      setChats([]);
      setMessages({});
      setLoading(false);
      return;
    }

    console.log('[ChatContext] Setting up chat listener for user:', currentUser.uid);
    setLoading(true);

    const chatsRef = collection(db, 'chats');
    // Note: Removed orderBy to avoid needing a Firestore index
    // We'll sort in memory instead
    const q = query(
      chatsRef,
      where('participants', 'array-contains', currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log('[ChatContext] Received chat snapshot, count:', snapshot.size);
        const chatsList: Chat[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          console.log('[ChatContext] Chat doc:', doc.id, 'participants:', data.participants);
          chatsList.push({
            id: doc.id,
            participants: data.participants || [],
            participantNames: data.participantNames || {},
            participantPhotos: data.participantPhotos || {},
            lastMessage: data.lastMessage || '',
            lastMessageTime: data.lastMessageTime?.toDate() || new Date(),
            lastMessageSenderId: data.lastMessageSenderId || '',
            unreadCount: data.unreadCount || {},
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          });
        });
        
        // Sort by updatedAt in memory (most recent first)
        chatsList.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
        
        console.log('[ChatContext] Total chats loaded:', chatsList.length);
        setChats(chatsList);
        setLoading(false);
      },
      (error) => {
        console.error('[ChatContext] Error fetching chats:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Subscribe to messages for each chat
  useEffect(() => {
    if (!currentUser || chats.length === 0) return;

    const unsubscribes: (() => void)[] = [];

    chats.forEach((chat) => {
      const messagesRef = collection(db, 'chats', chat.id, 'messages');
      const q = query(messagesRef, orderBy('timestamp', 'asc'));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const messagesList: Message[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            messagesList.push({
              id: doc.id,
              chatId: chat.id,
              senderId: data.senderId || '',
              senderName: data.senderName || '',
              senderPhotoURL: data.senderPhotoURL,
              content: data.content || '',
              timestamp: data.timestamp?.toDate() || new Date(),
              type: data.type || 'text',
              read: data.read || false,
            });
          });
          setMessages((prev) => ({
            ...prev,
            [chat.id]: messagesList,
          }));
        },
        (error) => {
          console.error(`Error fetching messages for chat ${chat.id}:`, error);
        }
      );

      unsubscribes.push(unsubscribe);
    });

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [chats, currentUser]);

  // Get messages for a specific chat
  const getMessages = (chatId: string): Message[] => {
    return messages[chatId] || [];
  };

  // Send a message
  const sendMessage = async (
    chatId: string,
    content: string,
    type: 'text' | 'image' = 'text'
  ): Promise<void> => {
    if (!currentUser || !content.trim()) return;

    try {
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      
      // Add the message
      await addDoc(messagesRef, {
        senderId: currentUser.uid,
        senderName: currentUser.displayName || 'Anonymous',
        senderPhotoURL: currentUser.photoURL || null,
        content: content.trim(),
        timestamp: serverTimestamp(),
        type,
        read: false,
      });

      // Update chat with last message info
      const chatRef = doc(db, 'chats', chatId);
      const chatSnap = await getDoc(chatRef);
      
      if (chatSnap.exists()) {
        const chatData = chatSnap.data();
        const unreadCount = chatData.unreadCount || {};
        
        // Increment unread count for other participants
        chatData.participants.forEach((participantId: string) => {
          if (participantId !== currentUser.uid) {
            unreadCount[participantId] = (unreadCount[participantId] || 0) + 1;
          }
        });

        await updateDoc(chatRef, {
          lastMessage: content.trim(),
          lastMessageTime: serverTimestamp(),
          lastMessageSenderId: currentUser.uid,
          updatedAt: serverTimestamp(),
          unreadCount,
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  // Mark messages as read
  const markMessagesAsRead = async (chatId: string): Promise<void> => {
    if (!currentUser) return;

    try {
      const chatRef = doc(db, 'chats', chatId);
      const chatSnap = await getDoc(chatRef);
      
      if (chatSnap.exists()) {
        const chatData = chatSnap.data();
        const unreadCount = chatData.unreadCount || {};
        
        // Reset unread count for current user
        unreadCount[currentUser.uid] = 0;

        await updateDoc(chatRef, {
          unreadCount,
        });

        // Mark all unread messages as read
        // Simplified query to avoid index requirement - get all messages and filter in memory
        const messagesRef = collection(db, 'chats', chatId, 'messages');
        const q = query(messagesRef);
        
        const snapshot = await getDocs(q);
        const batch = writeBatch(db);
        
        // Filter in memory to avoid needing composite index
        snapshot.forEach((docSnap) => {
          const msgData = docSnap.data();
          // Only mark as read if: not sent by current user AND not already read
          if (msgData.senderId !== currentUser.uid && !msgData.read) {
            batch.update(docSnap.ref, { read: true });
          }
        });
        
        await batch.commit();
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // Create a new chat or get existing one
  const createOrGetChat = async (
    otherUserId: string,
    otherUserName: string,
    otherUserPhoto?: string
  ): Promise<string> => {
    if (!currentUser) throw new Error('User not authenticated');

    console.log('[ChatContext] createOrGetChat called:', {
      currentUser: currentUser.uid,
      otherUserId,
      otherUserName
    });

    try {
      // Check if chat already exists
      const chatsRef = collection(db, 'chats');
      const q = query(
        chatsRef,
        where('participants', 'array-contains', currentUser.uid)
      );
      
      console.log('[ChatContext] Checking for existing chat...');
      const snapshot = await getDocs(q);
      let existingChatId: string | null = null;

      snapshot.forEach((doc) => {
        const data = doc.data();
        if (
          data.participants.includes(otherUserId) &&
          data.participants.length === 2
        ) {
          existingChatId = doc.id;
          console.log('[ChatContext] Found existing chat:', existingChatId);
        }
      });

      if (existingChatId) {
        console.log('[ChatContext] Returning existing chat ID:', existingChatId);
        return existingChatId;
      }

      // Create new chat
      console.log('[ChatContext] Creating new chat...');
      const newChatRef = doc(collection(db, 'chats'));
      const chatData = {
        participants: [currentUser.uid, otherUserId],
        participantNames: {
          [currentUser.uid]: currentUser.displayName || 'Anonymous',
          [otherUserId]: otherUserName,
        },
        participantPhotos: {
          [currentUser.uid]: currentUser.photoURL || '',
          [otherUserId]: otherUserPhoto || '',
        },
        lastMessage: '',
        lastMessageTime: serverTimestamp(),
        lastMessageSenderId: '',
        unreadCount: {
          [currentUser.uid]: 0,
          [otherUserId]: 0,
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      console.log('[ChatContext] New chat data:', chatData);
      await setDoc(newChatRef, chatData);
      console.log('[ChatContext] Chat created with ID:', newChatRef.id);

      return newChatRef.id;
    } catch (error) {
      console.error('[ChatContext] Error creating/getting chat:', error);
      throw error;
    }
  };

  // Get chat with a specific user
  const getChatWithUser = (otherUserId: string): Chat | undefined => {
    if (!currentUser) return undefined;
    
    return chats.find((chat) => 
      chat.participants.includes(otherUserId) &&
      chat.participants.includes(currentUser.uid) &&
      chat.participants.length === 2
    );
  };

  const value: ChatContextType = {
    chats,
    loading,
    getMessages,
    sendMessage,
    markMessagesAsRead,
    createOrGetChat,
    getChatWithUser,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

