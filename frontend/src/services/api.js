import axios from 'axios';

// Konfigurasi axios
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor untuk menambahkan token auth jika ada
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Layanan API
const api = {
  // Mengirim pesan ke chatbot
  sendMessage: (data) => {
    return apiClient.post('/chat', data);
  },

  // Mendapatkan riwayat percakapan
  getConversation: (conversationId) => {
    return apiClient.get(`/conversations/${conversationId}`);
  },

  // PDF: Unggah PDF
  uploadPdf: (formData) => {
    return axios.post(`${apiClient.defaults.baseURL}/pdf/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // PDF: Mendapatkan daftar PDF
  listPdfs: () => {
    return apiClient.get('/pdf/list');
  },

  // PDF: Menghapus PDF
  deletePdf: (filename) => {
    return apiClient.delete(`/pdf/${filename}`);
  },
};

export default api;