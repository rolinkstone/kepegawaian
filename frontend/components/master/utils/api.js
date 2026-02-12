// frontend/components/master/utils/api.js
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - PASTIKAN TOKEN DIKIRIM
api.interceptors.request.use(
  (config) => {
    // Cek token dari berbagai kemungkinan storage
    let token = '';
    
    // Coba ambil dari localStorage
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('token') || '';
      
      // Log untuk debugging (hapus di production)
      console.log('🔑 Token from localStorage:', token ? 'Token exists' : 'No token');
    }
    
    // Jika ada token, tambahkan ke header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn('⚠️ No token found in localStorage');
    }
    
    console.log(`📡 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle error 401
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      console.error('❌ Unauthorized! Token invalid or expired');
      
      // Redirect ke login jika perlu
      if (typeof window !== 'undefined') {
        // Hapus token yang tidak valid
        localStorage.removeItem('token');
        
        // Redirect ke halaman login (sesuaikan dengan routing Anda)
        // window.location.href = '/login';
        
        // Tampilkan alert
        alert('Sesi Anda telah berakhir. Silakan login kembali.');
      }
    }
    
    console.error('❌ API Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
      data: error.response?.data
    });
    
    return Promise.reject(error);
  }
);

export default api;