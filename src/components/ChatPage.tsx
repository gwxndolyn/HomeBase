import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLocation } from 'react-router-dom';
import LiquidGlassNav from './LiquidGlassNav';
import Footer from './Footer';
import { Send, Search, Phone, Video, MoreVertical, Paperclip, Smile, Image, MessageCircle, ArrowLeft } from 'lucide-react';

export default function ChatPage() {
  const { currentUser } = useAuth();
  const { chats, loading, getMessages, sendMessage, markMessagesAsRead } = useChat();
  const { theme } = useTheme();
  const location = useLocation();
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showChatList, setShowChatList] = useState(true); // For mobile view toggle
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Handle query parameter for opening a specific chat
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const chatId = params.get('selected');
    console.log('[ChatPage] Query parameter chatId:', chatId);
    console.log('[ChatPage] Available chats:', chats.length);
    console.log('[ChatPage] Chat IDs:', chats.map(c => c.id));
    
    if (chatId) {
      const chatExists = chats.some(chat => chat.id === chatId);
      console.log('[ChatPage] Chat exists:', chatExists);
      
      if (chatExists) {
        console.log('[ChatPage] Setting selected chat to:', chatId);
        setSelectedChat(chatId);
      } else {
        console.warn('[ChatPage] Chat not found in list yet, waiting...');
        // Try again in a moment (chat might be loading)
        setTimeout(() => {
          const stillExists = chats.some(chat => chat.id === chatId);
          if (stillExists) {
            console.log('[ChatPage] Chat found after delay, selecting:', chatId);
            setSelectedChat(chatId);
          }
        }, 1000);
      }
    }
  }, [location.search, chats]);

  const filteredChats = chats.filter(chat => {
    if (!currentUser) return false;
    const otherUserId = chat.participants.find(id => id !== currentUser.uid);
    if (!otherUserId) return false;
    const otherUserName = chat.participantNames[otherUserId] || '';
    return otherUserName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Handle chat selection - hide chat list on mobile
  const handleChatSelect = (chatId: string) => {
    setSelectedChat(chatId);
    setShowChatList(false); // Hide chat list on mobile when chat is selected
  };

  // Handle back to chat list on mobile
  const handleBackToList = () => {
    setShowChatList(true);
    setSelectedChat(null);
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      // Scroll within the container only, not the entire page
      const container = messagesEndRef.current.parentElement;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  };

  // Track previous message count to detect new messages
  const prevMessageCountRef = useRef<number>(0);
  
  // Only scroll to bottom when new messages arrive (not when chat is initially selected)
  useEffect(() => {
    if (selectedChat) {
      const messages = getMessages(selectedChat);
      const currentCount = messages.length;
      
      // Only scroll if messages were added (not on initial load)
      if (prevMessageCountRef.current > 0 && currentCount > prevMessageCountRef.current) {
        setTimeout(() => scrollToBottom(), 100);
      }
      
      prevMessageCountRef.current = currentCount;
    }
  }, [selectedChat, getMessages]);

  // Mark messages as read when chat is selected
  useEffect(() => {
    if (selectedChat) {
      markMessagesAsRead(selectedChat);
    }
  }, [selectedChat]);

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedChat) return;

    try {
      await sendMessage(selectedChat, message.trim());
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const selectedChatData = chats.find(chat => chat.id === selectedChat);
  const chatMessages = selectedChat ? getMessages(selectedChat) : [];

  // Get other user info for selected chat
  const getOtherUserInfo = (chat: typeof selectedChatData) => {
    if (!chat || !currentUser) return null;
    const otherUserId = chat.participants.find(id => id !== currentUser.uid);
    if (!otherUserId) return null;
    return {
      id: otherUserId,
      name: chat.participantNames[otherUserId] || 'Unknown User',
      photo: chat.participantPhotos[otherUserId] || '',
      isOnline: false, // We can implement presence later
    };
  };

  const otherUserInfo = selectedChatData ? getOtherUserInfo(selectedChatData) : null;

  if (loading) {
    console.log('[ChatPage] Loading state - chats not loaded yet');
    return (
      <div className={`min-h-screen transition-colors duration-300 ${
        theme === 'dark'
          ? 'bg-gradient-to-br from-gray-950 via-black to-gray-900 text-white'
          : 'bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900'
      }`}>
        <LiquidGlassNav />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-900 mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading chats...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  console.log('[ChatPage] Render - chats loaded:', chats.length);
  console.log('[ChatPage] Selected chat:', selectedChat);
  console.log('[ChatPage] Current user:', currentUser?.uid);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark'
        ? 'bg-gradient-to-br from-gray-950 via-black to-gray-900 text-white'
        : 'bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900'
    }`}>
      <LiquidGlassNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-8">
        <div className="flex h-[calc(100vh-200px)]">
          {/* Chat List Sidebar - Hidden on mobile when chat is selected */}
          <div className={`${
            showChatList ? 'block' : 'hidden'
          } md:block w-full md:w-80 border-r ${
            theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
          }`}>
            {/* Header */}
            <div className="p-4 border-b border-gray-200/20">
              <h1 className="text-xl font-semibold mb-4">Messages</h1>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border-0 transition-all ${
                    theme === 'dark'
                      ? 'bg-gray-800/60 text-white placeholder-gray-400'
                      : 'bg-gray-100 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>
            </div>

            {/* Chat List */}
            <div className="overflow-y-auto flex-1">
              {filteredChats.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <MessageCircle className={`w-16 h-16 mb-4 ${
                    theme === 'dark' ? 'text-gray-700' : 'text-gray-300'
                  }`} />
                  <p className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {searchTerm ? 'No conversations found' : 'No conversations yet'}
                  </p>
                  <p className={`text-xs mt-2 ${
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                  }`}>
                    Start a conversation by visiting a user's profile
                  </p>
                </div>
              ) : (
                filteredChats.map((chat) => {
                  const otherUserId = currentUser ? chat.participants.find(id => id !== currentUser.uid) : null;
                  const otherUserName = otherUserId ? chat.participantNames[otherUserId] : 'Unknown User';
                  const otherUserPhoto = otherUserId ? chat.participantPhotos[otherUserId] : '';
                  const unreadCount = currentUser ? (chat.unreadCount[currentUser.uid] || 0) : 0;

                  return (
                    <button
                      key={chat.id}
                      onClick={() => handleChatSelect(chat.id)}
                      className={`w-full p-4 text-left transition-colors border-b border-gray-200/10 ${
                        selectedChat === chat.id
                          ? theme === 'dark'
                            ? 'bg-purple-900/20'
                            : 'bg-purple-900/10'
                          : theme === 'dark'
                          ? 'hover:bg-gray-800/60'
                          : 'hover:bg-gray-100/60'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          {otherUserPhoto ? (
                            <img 
                              src={otherUserPhoto} 
                              alt={otherUserName}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-900 to-purple-600 flex items-center justify-center text-white text-xl">
                              {otherUserName.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium truncate">{otherUserName}</p>
                            <span className="text-xs text-gray-500">
                              {formatTime(chat.lastMessageTime)}
                            </span>
                          </div>
                          <p className={`text-sm truncate ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {chat.lastMessage || 'No messages yet'}
                          </p>
                        </div>
                        {unreadCount > 0 && (
                          <div className="w-5 h-5 bg-purple-900 text-white text-xs rounded-full flex items-center justify-center">
                            {unreadCount}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Chat Area - Hidden on mobile when chat list is shown */}
          <div className={`${
            !showChatList ? 'block' : 'hidden'
          } md:block flex-1 flex flex-col w-full`}>
            {selectedChat && otherUserInfo ? (
              <>
                {/* Chat Header */}
                <div className={`p-4 border-b flex items-center justify-between ${
                  theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
                }`}>
                  <div className="flex items-center space-x-3">
                    {/* Back button for mobile */}
                    <button
                      onClick={handleBackToList}
                      className={`md:hidden p-2 rounded-lg transition-colors ${
                        theme === 'dark'
                          ? 'hover:bg-gray-800'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="relative">
                      {otherUserInfo.photo ? (
                        <img 
                          src={otherUserInfo.photo} 
                          alt={otherUserInfo.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-900 to-purple-600 flex items-center justify-center text-white">
                          {otherUserInfo.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {otherUserInfo.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div>
                      <h2 className="font-semibold">{otherUserInfo.name}</h2>
                      <p className={`text-xs ${
                        otherUserInfo.isOnline
                          ? 'text-green-500'
                          : theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {otherUserInfo.isOnline ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className={`p-2 rounded-lg transition-colors ${
                      theme === 'dark'
                        ? 'hover:bg-gray-800'
                        : 'hover:bg-gray-100'
                    }`}>
                      <Phone className="w-5 h-5" />
                    </button>
                    <button className={`p-2 rounded-lg transition-colors ${
                      theme === 'dark'
                        ? 'hover:bg-gray-800'
                        : 'hover:bg-gray-100'
                    }`}>
                      <Video className="w-5 h-5" />
                    </button>
                    <button className={`p-2 rounded-lg transition-colors ${
                      theme === 'dark'
                        ? 'hover:bg-gray-800'
                        : 'hover:bg-gray-100'
                    }`}>
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {chatMessages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <MessageCircle className={`w-16 h-16 mx-auto mb-4 ${
                          theme === 'dark' ? 'text-gray-700' : 'text-gray-300'
                        }`} />
                        <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          No messages yet. Start the conversation!
                        </p>
                      </div>
                    </div>
                  ) : (
                    chatMessages.map((msg) => {
                      const isCurrentUser = msg.senderId === currentUser?.uid;
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                              isCurrentUser
                                ? 'bg-purple-900 text-white'
                                : theme === 'dark'
                                ? 'bg-gray-800 text-white'
                                : 'bg-gray-200 text-gray-900'
                            }`}
                          >
                            {!isCurrentUser && (
                              <p className={`text-xs font-medium mb-1 ${
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                {msg.senderName}
                              </p>
                            )}
                            <p className="text-sm break-words">{msg.content}</p>
                            <p className={`text-xs mt-1 ${
                              isCurrentUser
                                ? 'text-purple-200'
                                : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className={`p-4 border-t ${
                  theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
                }`}>
                  <div className="flex items-center space-x-2">
                    <button className={`p-2 rounded-xl transition-colors ${
                      theme === 'dark'
                        ? 'hover:bg-gray-800'
                        : 'hover:bg-gray-100'
                    }`}>
                      <Paperclip className="w-5 h-5" />
                    </button>
                    <button className={`p-2 rounded-xl transition-colors ${
                      theme === 'dark'
                        ? 'hover:bg-gray-800'
                        : 'hover:bg-gray-100'
                    }`}>
                      <Image className="w-5 h-5" />
                    </button>
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        placeholder="Type a message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        className={`w-full px-4 py-3 pr-12 rounded-2xl border-0 transition-all ${
                          theme === 'dark'
                            ? 'bg-gray-800 text-white placeholder-gray-400'
                            : 'bg-gray-100 text-gray-900 placeholder-gray-500'
                        }`}
                      />
                      <button className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-xl transition-colors ${
                        theme === 'dark'
                          ? 'hover:bg-gray-700'
                          : 'hover:bg-gray-200'
                      }`}>
                        <Smile className="w-5 h-5" />
                      </button>
                    </div>
                    <button
                      onClick={handleSendMessage}
                      disabled={!message.trim()}
                      className="p-3 bg-purple-900 hover:bg-purple-950 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-2xl transition-colors"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* No Chat Selected */
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">💬</div>
                  <h2 className="text-xl font-semibold mb-2">Select a conversation</h2>
                  <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Choose a conversation from the sidebar to start chatting
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
