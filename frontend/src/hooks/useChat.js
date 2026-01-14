import { useState, useEffect } from 'react';
import api from '../services/api';

const useChat = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [conversationId, setConversationId] = useState(null);

  // Muat riwayat percakapan jika ada conversationId
  useEffect(() => {
    const loadConversation = async () => {
      if (!conversationId) return;
      
      try {
        setLoading(true);
        const response = await api.getConversation(conversationId);
        setMessages(response.data);
      } catch (err) {
        console.error('Error loading conversation:', err);
        setError('Gagal memuat riwayat percakapan');
      } finally {
        setLoading(false);
      }
    };

    loadConversation();
  }, [conversationId]);

  const sendMessage = async (messageText) => {
    if (!messageText.trim()) return;

    // Tambahkan pesan pengguna ke UI
    const userMessage = {
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    setError(null);

    try {
      // Kirim pesan ke API
      const response = await api.sendMessage({
        message: messageText,
        conversation_id: conversationId,
      });

      // Update conversation ID jika ini percakapan baru
      if (!conversationId && response.data.conversation_id) {
        setConversationId(response.data.conversation_id);
      }

      // Tambahkan respons AI ke daftar pesan
      if (response.data.messages) {
        setMessages(response.data.messages);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: response.data.response,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
      
      return true;
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Gagal mengirim pesan');
      
      // Tambahkan pesan error
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Maaf, terjadi kesalahan saat memproses pesan Anda.',
          timestamp: new Date().toISOString(),
        },
      ]);
      
      return false;
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = () => {
    setMessages([]);
    setConversationId(null);
  };

  return {
    messages,
    loading,
    error,
    conversationId,
    sendMessage,
    clearMessages,
  };
};

export default useChat;