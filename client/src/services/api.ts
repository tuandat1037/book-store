import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('kimdong_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Session ID for guest cart
  let sessionId = localStorage.getItem('kimdong_session_id');
  if (!sessionId) {
    sessionId = 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('kimdong_session_id', sessionId);
  }
  config.headers['x-session-id'] = sessionId;

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear expired token if necessary
    }
    return Promise.reject(error);
  }
);

export default api;
