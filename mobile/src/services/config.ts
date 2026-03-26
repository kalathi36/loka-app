export const DEFAULT_API_BASE_URL = __DEV__
  ? 'http://localhost:5050/api'
  : 'https://loka-app.onrender.com/api';

export const normalizeApiBaseUrl = (value?: string | null) => {
  if (!value?.trim()) {
    return DEFAULT_API_BASE_URL;
  }

  let nextValue = value.trim().replace(/\/+$/, '');

  if (!/^https?:\/\//i.test(nextValue)) {
    nextValue = `https://${nextValue}`;
  }

  if (!/\/api$/i.test(nextValue)) {
    nextValue = `${nextValue}/api`;
  }

  return nextValue;
};
