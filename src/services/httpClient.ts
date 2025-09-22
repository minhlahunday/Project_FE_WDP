import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// Base API URL - change this to your actual API URL
const API_BASE_URL = 'https://api.vinfast-dealer.example.com/v1';

// Create axios instance with default config
const httpClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
});

// Request interceptor for adding auth token
httpClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
httpClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle specific error cases
    if (error.response?.status === 401) {
      // Unauthorized - clear local storage and redirect to login
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Generic request method with type parameters
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