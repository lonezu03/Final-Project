// src/services/api.js
import axios from 'axios';
import { rooturl } from '../redux/element'; // Import đường dẫn gốc từ file element
const apiClient = axios.create({
  baseURL: rooturl, // URL gốc của API
});

// Interceptor để tự động thêm token vào header cho mỗi request của apiClient
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken'); 
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`; // Sử dụng token từ localStorage
    }
    console.log('🔑 [apiClient] Request config:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      data: config.data
    });
    return config;
  },
  (error) => {
    console.error('❌ [apiClient] Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor để debug và xử lý lỗi
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ [apiClient] Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('❌ [apiClient] Response error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    return Promise.reject(error);
  }
);

export default apiClient;