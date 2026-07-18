import axios from 'axios';

/**
 * Shared Axios instance for the NestJS API.
 * All services in lib/api/services use this client.
 */
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Attach the access token to every request.
apiClient.interceptors.request.use((config) => {
  // TODO: read token from the auth store / cookie
  // const token = useAuthStore.getState().accessToken;
  // if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Central place for 401 handling / token refresh.
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // TODO: on 401, attempt refresh; on failure, clear auth store + redirect to /login
    return Promise.reject(error);
  },
);
