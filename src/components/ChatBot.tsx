import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { generateContent } from '../services/gemini';

interface Message {
  id: string;
  type: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      text: 'Welcome to HomeBase! 👋 I\'m your personal assistant for discovering amazing home-based businesses in your area. I can help you find local artisans, services, food vendors, and more. What are you looking for today?',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Function to clean markdown formatting
  const cleanMarkdown = (text: string) => {
    return text
      .replace(/\*\*([^\*]+)\*\*/g, '$1') // Remove **bold** formatting
      .replace(/\*([^\*]+)\*/g, '$1') // Remove *italic* formatting
      .replace(/`([^`]+)`/g, '$1') // Remove `code` formatting
      .replace(/##+ /g, '') // Remove heading symbols
      .replace(/- /g, '• '); // Convert dashes to bullets
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || loading) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: inputText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      // Get response from Gemini - HomeBase business recommendation focused
      const context =
        'You are a helpful AI assistant for HomeBase, a platform connecting customers with local home-based businesses. Your role is to: 1) Recommend home-based businesses based on user needs (baking, crafts, photography, tutoring, pet care, etc.). 2) Suggest specific shops from our platform like "Alice\'s Home Pizza", "Carol\'s Premium Bakery", "David\'s Professional Photography", etc. 3) Help users discover local artisans, food vendors, and service providers. 4) Provide information about product categories, shop locations in Singapore, and business offerings. 5) Be enthusiastic about supporting local home entrepreneurs. 6) Keep responses concise and friendly. Do NOT use markdown formatting like **bold**, *italics*, or `code`. Just write plain text with emojis when appropriate.';
      const response = await generateContent(
        `${context}\n\nUser: ${inputText}`
      );

      // Clean markdown formatting from response
      const cleanedResponse = cleanMarkdown(response);

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        text: cleanedResponse,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        type: 'bot',
        text: "I apologize for the technical difficulty. Please try your question again or contact our support team directly.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '60px', right: '80px', zIndex: 50 }}>
      {/* Chat Window */}
      {isOpen && (
        <div
          style={{
            width: '400px',
            height: '600px',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 5px 40px rgba(0, 0, 0, 0.16)',
            display: 'flex',
            flexDirection: 'column',
            marginBottom: '10px',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
                HomeBase Assistant
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', opacity: 0.9 }}>
                Discover local businesses
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {messages.map((message) => (
              <div
                key={message.id}
                style={{
                  display: 'flex',
                  justifyContent:
                    message.type === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '80%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    wordWrap: 'break-word',
                    backgroundColor:
                      message.type === 'user' ? '#667eea' : '#e5e5ea',
                    color: message.type === 'user' ? 'white' : '#000',
                    fontSize: '14px',
                    lineHeight: '1.4',
                  }}
                >
                  {message.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '12px',
                    backgroundColor: '#e5e5ea',
                    color: '#000',
                  }}
                >
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#667eea',
                        animation: 'pulse 1.4s infinite',
                      }}
                    />
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#667eea',
                        animation: 'pulse 1.4s infinite 0.2s',
                      }}
                    />
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#667eea',
                        animation: 'pulse 1.4s infinite 0.4s',
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            style={{
              padding: '12px',
              borderTop: '1px solid #e5e5ea',
              display: 'flex',
              gap: '8px',
            }}
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !loading) {
                  handleSendMessage();
                }
              }}
              placeholder="Type a message..."
              disabled={loading}
              style={{
                flex: 1,
                padding: '10px 12px',
                border: '1px solid #e5e5ea',
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'inherit',
                outline: 'none',
                color: '#000',
                backgroundColor: '#fff',
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={loading || !inputText.trim()}
              style={{
                padding: '10px 12px',
                backgroundColor: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading || !inputText.trim() ? 'not-allowed' : 'pointer',
                opacity: loading || !inputText.trim() ? 0.6 : 1,
              }}
            >
              <Send size={18} />
            </button>
          </div>

          <style>{`
            @keyframes pulse {
              0%, 60%, 100% {
                opacity: 0.3;
              }
              30% {
                opacity: 1;
              }
            }
          `}</style>
        </div>
      )}

      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
        }}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </div>
  );
};

export default ChatBot;
