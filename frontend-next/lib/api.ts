import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // If unauthorized and we haven't already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = Cookies.get('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        
        // Call refresh endpoint directly to avoid looping interceptors
        const { data } = await axios.post('http://localhost:8000/api/v1/auth/refresh', {
          refresh_token: refreshToken
        });
        
        Cookies.set('access_token', data.access_token);
        if (data.refresh_token) {
          Cookies.set('refresh_token', data.refresh_token);
        }
        
        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        return api(originalRequest);
      } catch (err) {
        // If refresh fails, clear tokens and let the UI handle the redirect
        Cookies.remove('access_token');
        Cookies.remove('refresh_token');
        Cookies.remove('user_role');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
