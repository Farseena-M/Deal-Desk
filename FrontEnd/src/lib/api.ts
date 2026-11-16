import axios, { AxiosError } from 'axios';

const baseURL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

// Axios instance
export const api = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dealdesk_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => {
    const body = response.data;

    if (body?.status === 'Error') {
      return Promise.reject(
        new Error(body.message || 'Request failed')
      );
    }

    return response;
  },
  (error: AxiosError<{ message?: string | string[] }>) => {
    // Handle unauthorized requests
    if (error.response?.status === 401) {
      localStorage.removeItem('dealdesk_token');
      localStorage.removeItem('dealdesk_user');

      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }

    const message = error.response?.data?.message;

    return Promise.reject(
      new Error(
        Array.isArray(message)
          ? message.join(', ')
          : message || error.message || 'Something went wrong'
      )
    );
  }
);

// Extract API response data
export function unwrap<T>(
  response: { data: { data?: unknown } }
): T {
  const result = response.data.data;

  if (
    result !== null &&
    typeof result === 'object' &&
    'data' in result &&
    Array.isArray(result.data)
  ) {
    return result.data as T;
  }

  return result as T;
}

// Get error message
export function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'Something went wrong';
}
