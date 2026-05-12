import api from './api.js';

const AUTH_ENDPOINTS = {
  login: '/users/login',
  register: '/users/register',
  me: '/users/me',
};

const normalizeLoginPayload = (credentialsOrUsername, password) => {
  if (typeof credentialsOrUsername === 'string') {
    return {
      username: credentialsOrUsername,
      password,
    };
  }

  const credentials = credentialsOrUsername ?? {};
  return {
    username: credentials.username ?? credentials.identifier ?? '',
    password: credentials.password ?? '',
  };
};

const assertAuthResponse = (data) => {
  if (!data?.token || !data?.user) {
    throw new Error('Invalid authentication response from server.');
  }

  return data;
};

export const authService = {
  async login(credentialsOrUsername, password) {
    const payload = normalizeLoginPayload(credentialsOrUsername, password);
    const response = await api.post(AUTH_ENDPOINTS.login, payload);
    return assertAuthResponse(response.data);
  },

  async register(userData) {
    const response = await api.post(AUTH_ENDPOINTS.register, userData);
    return assertAuthResponse(response.data);
  },

  async logout() {
    // JWT logout is client-side only unless the server adds token revocation.
  },

  async getMe() {
    const response = await api.get(AUTH_ENDPOINTS.me);
    return response.data;
  },
};
