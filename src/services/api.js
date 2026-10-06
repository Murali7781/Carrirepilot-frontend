import axios from 'axios';

const baseURL = (import.meta.env.VITE_API_URL || 'http://localhost:5000')
  .replace(/\/+$/, '')
  .replace(/\/api$/i, '');

const api = axios.create({
  baseURL: `${baseURL}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  // Axios must set the multipart boundary itself. A default JSON content type
  // prevents Multer from seeing FormData uploads, leaving req.file undefined.
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    if (typeof config.headers?.delete === 'function') config.headers.delete('Content-Type');
    else if (config.headers) {
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      if (!url.endsWith('/auth/login') && !url.endsWith('/auth/register') && !url.endsWith('/auth/logout')) {
        window.dispatchEvent(new Event('careerpilot:unauthorized'));
      }
    }

    return Promise.reject(error);
  },
);

export default api;
