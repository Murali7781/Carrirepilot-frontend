import api from './api';

export async function registerUser(payload) {
  const response = await api.post('/auth/register', payload);
  return response.data;
}

export async function loginUser(payload) {
  const response = await api.post('/auth/login', payload);
  return response.data;
}

export async function getProfile() {
  const response = await api.get('/users/profile', { timeout: 15000 });
  return response.data.data.user;
}

export async function updateProfile(payload) {
  const response = await api.put('/users/profile', payload);
  return response.data.data.user;
}

export async function logoutUser() {
  const response = await api.post('/auth/logout');
  return response.data;
}
