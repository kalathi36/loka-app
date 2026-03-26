import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { DEFAULT_API_BASE_URL, normalizeApiBaseUrl } from './config';

let authToken: string | null = null;
let apiBaseUrl = DEFAULT_API_BASE_URL;

const getRequestUrl = (config: Pick<InternalAxiosRequestConfig, 'baseURL' | 'url'>) =>
  `${config.baseURL || ''}${config.url || ''}`;

const normalizePayload = (payload: unknown) => {
  if (payload === undefined || payload === null) {
    return payload;
  }

  if (typeof FormData !== 'undefined' && payload instanceof FormData) {
    return '[FormData]';
  }

  return payload;
};

const logApi = (label: string, payload: Record<string, unknown>) => {
  if (!__DEV__) {
    return;
  }

  console.log(`[API] ${label}`, payload);
};

export const setApiToken = (token?: string | null) => {
  authToken = token || null;
};

export const setApiBaseUrl = (baseUrl?: string | null) => {
  apiBaseUrl = normalizeApiBaseUrl(baseUrl);
  api.defaults.baseURL = apiBaseUrl;

  if (__DEV__) {
    logApi('Base URL', {
      baseURL: apiBaseUrl,
    });
  }
};

export const getApiBaseUrl = () => apiBaseUrl;
export const getSocketBaseUrl = () => apiBaseUrl.replace(/\/api$/i, '');

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 20000,
});

if (__DEV__) {
  logApi('Base URL', {
    baseURL: apiBaseUrl,
  });
}

api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }

  logApi('Request', {
    method: (config.method || 'GET').toUpperCase(),
    url: getRequestUrl(config),
    params: config.params,
    data: normalizePayload(config.data),
    hasAuthToken: Boolean(authToken),
  });

  return config;
});

api.interceptors.response.use(
  (response: AxiosResponse) => {
    logApi('Response', {
      method: (response.config.method || 'GET').toUpperCase(),
      url: getRequestUrl(response.config),
      status: response.status,
      data: response.data,
    });

    return response;
  },
  (error: AxiosError<{ message?: string }>) => {
    logApi('Error', {
      method: (error.config?.method || 'GET').toUpperCase(),
      url: error.config ? getRequestUrl(error.config) : 'unknown',
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });

    const message =
      error?.response?.data?.message || error?.message || 'Unexpected API error.';

    return Promise.reject(
      Object.assign(new Error(message), {
        status: error.response?.status,
        details: error.response?.data,
      }),
    );
  },
);

export default api;
