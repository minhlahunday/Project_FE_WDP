import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// Base API URL - change this to your actual API URL
const API_BASE_URL = 'http://localhost:5000';

const httpClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, 
});

// --- Token utils ---
function getAccessToken() {
  return localStorage.getItem('accessToken');
}
function getRefreshToken() {
  return localStorage.getItem('refreshToken');
}
function setAccessToken(token: string) {
  localStorage.setItem('accessToken', token);
}
function clearTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}

// --- JWT exp check ---
function isTokenExpired(token?: string) {
  if (!token) return true;
  try {
    const [, payload] = token.split('.');
    if (!payload) return true;
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64 + '='.repeat((4 - base64.length % 4) % 4))
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const { exp } = JSON.parse(jsonPayload);
    if (!exp) return true;
    // Consider expired if less than 1 minute left
    return Date.now() >= exp * 1000 - 60 * 1000;
  } catch {
    return true;
  }
}

// --- Refresh logic ---
let refreshingPromise: Promise<string | null> | null = null;
async function refreshAccessToken(): Promise<string | null> {
  if (refreshingPromise) return refreshingPromise;
  refreshingPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;
    try {
      const resp = await axios.post(`${API_BASE_URL}/api/auth/refreshToken`, { token: refreshToken });
      if (resp.data && resp.data.accessToken) {
        setAccessToken(resp.data.accessToken);
        return resp.data.accessToken;
      }
    } catch {
      clearTokens();
      window.location.href = '/login';
      return null;
    } finally {
      refreshingPromise = null;
    }
    return null;
  })();
  return refreshingPromise;
}

// --- Axios interceptor ---
httpClient.interceptors.request.use(
  async (config) => {
    let token = getAccessToken();
    if (!token || isTokenExpired(token)) {
      token = await refreshAccessToken();
    }
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      clearTokens();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const request = async<T = any>(
  config: AxiosRequestConfig
): Promise<T> => {
  try {
    const response: AxiosResponse<T> = await httpClient(config);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const serverError = error.response?.data;
      throw serverError || error;
    }
    throw error;
  }
};

// Helper methods for common HTTP methods
export const get = <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  return request<T>({ ...config, method: 'GET', url });
};

export const post = <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
  return request<T>({ ...config, method: 'POST', url, data });
};

export const put = <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
  return request<T>({ ...config, method: 'PUT', url, data });
};

export const patch = <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
  return request<T>({ ...config, method: 'PATCH', url, data });
};

export const del = <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  return request<T>({ ...config, method: 'DELETE', url });
};

export default httpClient;