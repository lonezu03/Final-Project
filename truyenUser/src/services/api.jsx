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
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;