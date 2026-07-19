import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

const BASE_URL =
  Constants.expoConfig?.extra?.apiUrl ??
  process.env.EXPO_PUBLIC_API_URL ??
  'http://10.0.2.2:8000/api';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

const TOKEN_KEY = 'nexus_access_token';
const REFRESH_KEY = 'nexus_refresh_token';

export async function getStoredToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function getStoredRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_KEY);
}

export async function storeTokens(access: string, refresh: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, access);
  await SecureStore.setItemAsync(REFRESH_KEY, refresh);
}

export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}

// Request interceptor: attach Bearer token
apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: refresh on 401 + friendly errors
let _isRefreshing = false;
let _refreshQueue: Array<() => void> = [];

apiClient.interceptors.response.use(
  (res) => res.data,
  async (err: AxiosError) => {
    const originalRequest = err.config as InternalAxiosRequestConfig & { _retry?: boolean };

    const isAuthEndpoint =
      originalRequest?.url?.includes('/auth/refresh') ||
      originalRequest?.url?.includes('/auth/login');

    if (err.response?.status === 401 && !originalRequest?._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      if (_isRefreshing) {
        return new Promise((resolve) => {
          _refreshQueue.push(() => resolve(apiClient(originalRequest)));
        });
      }

      _isRefreshing = true;
      try {
        const refreshToken = await getStoredRefreshToken();
        if (!refreshToken) throw new Error('No refresh token');

        const res = await axios.post(`${BASE_URL}/auth/refresh`, null, {
          headers: { Authorization: `Bearer ${refreshToken}` },
        });

        await storeTokens(res.data.access_token, res.data.refresh_token);
        _refreshQueue.forEach((cb) => cb());
        _refreshQueue = [];
        return apiClient(originalRequest);
      } catch {
        _refreshQueue = [];
        await clearTokens();
        return Promise.reject(err);
      } finally {
        _isRefreshing = false;
      }
    }

    let friendlyMessage =
      'Ocurrió un problema temporal. Por favor, intentá de nuevo en unos instantes.';
    if (err.message === 'Network Error' || err.code === 'ECONNABORTED') {
      friendlyMessage =
        'No pudimos conectar con el servidor. Verificá tu conexión a internet o reintentá más tarde.';
    } else if (err.response) {
      if (err.response.status === 404)
        friendlyMessage = 'No encontramos el juego o la lista que buscabas.';
      if (err.response.status === 500)
        friendlyMessage = 'Tenemos un problema técnico en nuestro sistema. Ya lo estamos revisando.';
    }

    return Promise.reject({
      message: friendlyMessage,
      status: err.response?.status,
      detail: (err.response?.data as any)?.detail,
    });
  },
);

export default apiClient;
