// frontend/components/master/services/masterService.js
import axios from 'axios';
import { getSession } from 'next-auth/react';

// Buat instance axios
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor untuk menambahkan token
api.interceptors.request.use(
  async (config) => {
    try {
      const session = await getSession();
      
      if (session?.accessToken) {
        config.headers.Authorization = `Bearer ${session.accessToken}`;
        console.log('✅ Token added to request');
      } else {
        console.warn('⚠️ No access token found in session');
      }
      
      return config;
    } catch (error) {
      console.error('❌ Error adding token:', error);
      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor untuk handle 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const session = await getSession();
        if (session?.accessToken) {
          originalRequest.headers.Authorization = `Bearer ${session.accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
      }
      
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// ========== MASTER SERVICE ==========
export const masterService = {
  // ===== JABATAN =====
  getJabatan: async () => {
    try {
      const response = await api.get('/master/jabatan');
      return response.data;
    } catch (error) {
      console.error('Error getJabatan:', error);
      throw error;
    }
  },

  createJabatan: async (data) => {
    try {
      const response = await api.post('/master/jabatan', data);
      return response.data;
    } catch (error) {
      console.error('Error createJabatan:', error);
      throw error;
    }
  },

  updateJabatan: async (id, data) => {
    try {
      const response = await api.put(`/master/jabatan/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updateJabatan:', error);
      throw error;
    }
  },

  deleteJabatan: async (id) => {
    try {
      const response = await api.delete(`/master/jabatan/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleteJabatan:', error);
      throw error;
    }
  },

  // ===== JENJANG =====
  getJenjang: async () => {
    try {
      const response = await api.get('/master/jenjang');
      return response.data;
    } catch (error) {
      console.error('Error getJenjang:', error);
      throw error;
    }
  },

  createJenjang: async (data) => {
    try {
      const response = await api.post('/master/jenjang', data);
      return response.data;
    } catch (error) {
      console.error('Error createJenjang:', error);
      throw error;
    }
  },

  updateJenjang: async (id, data) => {
    try {
      const response = await api.put(`/master/jenjang/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updateJenjang:', error);
      throw error;
    }
  },

  deleteJenjang: async (id) => {
    try {
      const response = await api.delete(`/master/jenjang/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleteJenjang:', error);
      throw error;
    }
  },

  // ===== FUNGSI =====
  getFungsi: async () => {
    try {
      const response = await api.get('/master/fungsi');
      return response.data;
    } catch (error) {
      console.error('Error getFungsi:', error);
      throw error;
    }
  },

  createFungsi: async (data) => {
    try {
      const response = await api.post('/master/fungsi', data);
      return response.data;
    } catch (error) {
      console.error('Error createFungsi:', error);
      throw error;
    }
  },

  updateFungsi: async (id, data) => {
    try {
      const response = await api.put(`/master/fungsi/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updateFungsi:', error);
      throw error;
    }
  },

  deleteFungsi: async (id) => {
    try {
      const response = await api.delete(`/master/fungsi/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleteFungsi:', error);
      throw error;
    }
  },

  // ===== PERAN =====
  getPeran: async () => {
    try {
      const response = await api.get('/master/peran');
      return response.data;
    } catch (error) {
      console.error('Error getPeran:', error);
      throw error;
    }
  },

  createPeran: async (data) => {
    try {
      const response = await api.post('/master/peran', data);
      return response.data;
    } catch (error) {
      console.error('Error createPeran:', error);
      throw error;
    }
  },

  updatePeran: async (id, data) => {
    try {
      const response = await api.put(`/master/peran/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updatePeran:', error);
      throw error;
    }
  },

  deletePeran: async (id) => {
    try {
      const response = await api.delete(`/master/peran/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deletePeran:', error);
      throw error;
    }
  },

  // ===== KOMPETENSI =====
  getKompetensi: async () => {
    try {
      const response = await api.get('/master/kompetensi');
      return response.data;
    } catch (error) {
      console.error('Error getKompetensi:', error);
      throw error;
    }
  },

  createKompetensi: async (data) => {
    try {
      const response = await api.post('/master/kompetensi', data);
      return response.data;
    } catch (error) {
      console.error('Error createKompetensi:', error);
      throw error;
    }
  },

  updateKompetensi: async (id, data) => {
    try {
      const response = await api.put(`/master/kompetensi/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updateKompetensi:', error);
      throw error;
    }
  },

  deleteKompetensi: async (id) => {
    try {
      const response = await api.delete(`/master/kompetensi/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleteKompetensi:', error);
      throw error;
    }
  },

  // ===== MAPPING =====
  getMapping: async (kompetensiId) => {
    try {
      const response = await api.get(`/master/mapping/${kompetensiId}`);
      return response.data;
    } catch (error) {
      console.error('Error getMapping:', error);
      throw error;
    }
  },

  createMapping: async (data) => {
    try {
      const response = await api.post('/master/mapping', data);
      return response.data;
    } catch (error) {
      console.error('Error createMapping:', error);
      throw error;
    }
  },

  deleteMapping: async (id) => {
    try {
      const response = await api.delete(`/master/mapping/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleteMapping:', error);
      throw error;
    }
  }
};