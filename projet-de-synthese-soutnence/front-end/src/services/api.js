import axios from 'axios';

// 1. Create the Axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // If you need to send cookies for Laravel Sanctum authentication:
  // withCredentials: true,
});

// 2. Request Interceptor (e.g., attach auth tokens)
api.interceptors.request.use(
  (config) => {
    // Example: If you use JWT tokens stored in localStorage
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 3. Response Interceptor (e.g., handle global errors like 401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // e.g., redirect to login or clear token
      console.warn('Unauthorized access - maybe redirect to login');
    }
    return Promise.reject(error);
  }
);

export default api;
