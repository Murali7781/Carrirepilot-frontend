import axios from 'axios';

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const baseURL = (configuredApiUrl || (import.meta.env.DEV ? 'http://localhost:5000' : ''))
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
  if (!configuredApiUrl && !import.meta.env.DEV) {
    return Promise.reject(new Error('VITE_API_URL is not configured for this deployment.'));
  }

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

export function getApiErrorMessage(error, fallback) {
  const status = error?.response?.status;
  const serverMessage = error?.response?.data?.message;
  if (serverMessage) return serverMessage;

  if (status === 401) return 'Your session has expired. Please sign in again.';
  if (status === 403) return 'The API rejected this request. Check your access and CORS configuration.';
  if (status === 404) return 'The requested API endpoint was not found.';
  if (status >= 500) return 'CareerPilot is having a server problem. Please try again later.';
  if (error?.message === 'VITE_API_URL is not configured for this deployment.') {
    return 'CareerPilot is not connected to its API. Set VITE_API_URL in the Vercel project settings and redeploy.';
  }
  if (error?.request || error?.code === 'ERR_NETWORK') {
    return 'Could not reach the CareerPilot API. Check that the Render backend is running and allows this Vercel origin in CLIENT_ORIGINS; browsers can report CORS blocks as network errors.';
  }

  return fallback;
}

export default api;
