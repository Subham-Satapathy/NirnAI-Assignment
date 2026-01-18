import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export const authService = {
  login: async (username: string, password: string) => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  },
  
  validateToken: async (token: string) => {
    const response = await api.post('/auth/validate', { token });
    return response.data;
  },
};

export const transactionService = {
  uploadPdf: async (file: File, filters?: any) => {
    const formData = new FormData();
    formData.append('pdf', file);
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          formData.append(key, filters[key]);
        }
      });
    }
    
    const response = await api.post('/transactions/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  getTransactions: async (filters?: any) => {
    const response = await api.get('/transactions', { params: filters });
    return response.data;
  },
  
  searchTransactions: async (query: string) => {
    const response = await api.get('/transactions/search', { params: { q: query } });
    return response.data;
  },
};

export default api;
