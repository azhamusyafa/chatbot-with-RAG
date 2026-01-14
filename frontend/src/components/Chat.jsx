import React, { useState, useEffect, useRef, useCallback } from 'react';
import Message from './Message';
import api from '../services/api';
import TypingEffect from './TypingEffect';
import SettingsPanel from './SettingsPanel';
import useKeyboardNavigation from '../hooks/useKeyboardNavigation';
import EmojiPicker from 'emoji-picker-react';

const Chat = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    animationSpeed: 15,
    typingAnimations: true,
    emojiReplacements: true,
    keyboardShortcuts: true,
    messageSounds: false
  });
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  
  const clearConversation = useCallback(() => {
    setMessages([{
      role: 'assistant',
      content: 'Percakapan baru dimulai. Bagaimana saya dapat membantu Anda?',
      timestamp: new Date().toISOString(),
      isLatest: true
    }]);
    setConversationId(null);
    
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);
  
  const sendMessage = useCallback((e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userInputMessage = input;
    
    setMessages((prev) => [
      ...prev.map(msg => ({ ...msg, isLatest: false })),
      {
        role: 'user',
        content: userInputMessage,
        timestamp: new Date().toISOString(),
        isLatest: true
      }
    ]);
    
    setInput('');
    setLoading(true);

    const sendToApi = async () => {
      try {
        const response = await api.sendMessage({
          message: userInputMessage,
          conversation_id: conversationId,
        });

        if (!conversationId) {
          setConversationId(response.data.conversation_id);
        }

        setMessages((prev) => [
          ...prev.map(msg => ({ ...msg, isLatest: false })),
          {
            role: 'assistant',
            content: response.data.response,
            timestamp: new Date().toISOString(),
            isLatest: true
          }
        ]);
      } catch (error) {
        console.error('Error sending message:', error);
        // Add error message
        setMessages((prev) => [
          ...prev.map(msg => ({ ...msg, isLatest: false })),
          {
            role: 'assistant',
            content: 'Maaf, terjadi kesalahan saat memproses pesan Anda. Silakan coba lagi.',
            timestamp: new Date().toISOString(),
            isLatest: true,
            isError: true
          },
        ]);
      } finally {
        setLoading(false);
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      }
    };

    sendToApi();
  }, [input, conversationId]);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: 'Halo! Saya Kaz asisten AI yang dapat membantu menjawab pertanyaan Anda. Bagaimana saya bisa membantu Anda hari ini?',
        timestamp: new Date().toISOString(),
        isLatest: true
      }]);
    }
  }, []);

  // Auto-focus on input when component loads
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('chatSettings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Failed to parse settings:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (settings.messageSounds && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant' && lastMessage.isLatest) {
        const audio = new Audio('/message-received.mp3');
        audio.play().catch(e => console.log('Failed to play sound:', e));
      }
    }
  }, [messages, settings.messageSounds]);

  useKeyboardNavigation({
    onSend: sendMessage,
    onClear: clearConversation,
    inputRef,
    isDisabled: !settings.keyboardShortcuts || showEmojiPicker || showSettings
  });

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };

  const onEmojiClick = (emojiObject) => {
    setInput(prev => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  const saveSettings = (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem('chatSettings', JSON.stringify(newSettings));
  };

  return (
    <>
      <div className="flex flex-col h-[calc(100vh-180px)] bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-700 relative glow-effect">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white px-6 py-4 flex justify-between items-center border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <div className="ml-2 font-medium text-blue-200">Chat dengan AI</div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSettings(true)}
              className="text-gray-300 hover:text-white p-1 rounded-full hover:bg-gray-700 transition-colors"
              title="Pengaturan"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
            </button>
            
            <button
              onClick={clearConversation}
              className="text-xs bg-gray-800 hover:bg-gray-700 text-blue-300 py-1 px-3 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-700 shadow-inner"
              title="Mulai percakapan baru (Alt+N)"
            >
              Percakapan Baru
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-6 bg-gray-900"
        >
          <div className="space-y-6">
            {messages.map((message, index) => (
              <Message 
                key={index} 
                message={message} 
                animateTyping={message.role === 'assistant' && message.isLatest && settings.typingAnimations} 
                emojiReplacements={settings.emojiReplacements}
                animationSpeed={settings.animationSpeed}
              />
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-700 rounded-bl-none max-w-[80%]">
                  <div className="typing-animation">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} className="h-4" />
        </div>

        {/* Keyboard shortcuts help (hidden by default) */}
        {settings.keyboardShortcuts && (
          <div className="hidden absolute right-6 bottom-20 bg-gray-900/90 border border-gray-700 p-2 rounded-lg text-xs text-gray-400">
            <div className="mb-1">Press <kbd className="bg-gray-800 px-2 py-0.5 rounded">Enter</kbd> to send</div>
            <div className="mb-1">Press <kbd className="bg-gray-800 px-2 py-0.5 rounded">Shift+Enter</kbd> for new line</div>
            <div className="mb-1">Press <kbd className="bg-gray-800 px-2 py-0.5 rounded">Alt+N</kbd> for new chat</div>
            <div>Press <kbd className="bg-gray-800 px-2 py-0.5 rounded">/</kbd> to focus input</div>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-gray-700 bg-gray-800 p-4">
          <form onSubmit={sendMessage} className="flex space-x-2">
            <div className="relative flex-1">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ketik pesan Anda di sini... (Enter untuk kirim, Shift+Enter untuk baris baru)"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none max-h-32 min-h-[48px] text-gray-100"
                rows={1}
                disabled={loading}
              />
            
              <div className="absolute right-3 bottom-3 flex">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="text-gray-400 hover:text-gray-200 mr-2"
                >
                  <span className="emoji text-xl"></span>
                </button>
                <span className="text-xs text-gray-400">
                  Enter ↵
                </span>
              </div>
              
              {showEmojiPicker && (
                <div className="absolute bottom-12 right-0 z-10">
                  <EmojiPicker onEmojiClick={onEmojiClick} theme="dark" />
                </div>
              )}
            </div>
            <button
              type="submit"
              className="bg-blue-700 hover:bg-blue-600 text-white rounded-lg px-5 flex items-center justify-center flex-shrink-0 h-12 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transform hover:-translate-y-1 active:translate-y-0 shadow-lg shadow-blue-700/30"
              disabled={loading || !input.trim()}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>
          <p className="text-xs text-gray-500 mt-1 text-center">
            Shift + Enter untuk baris baru {settings.keyboardShortcuts && '• Alt + N untuk chat baru • / untuk fokus input'}
          </p>
        </div>
      </div>
      
      {/* Settings Panel */}
      <SettingsPanel 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSave={saveSettings}
      />
    </>
  );
};

export default Chat;