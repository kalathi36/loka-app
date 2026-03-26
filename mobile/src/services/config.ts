import { Platform } from 'react-native';

export const LOCALHOST_API_BASE_URL = 'http://localhost:5050/api';
export const ANDROID_EMULATOR_API_BASE_URL = 'http://10.0.2.2:5050/api';
export const DEFAULT_API_BASE_URL =
  Platform.OS === 'android' ? ANDROID_EMULATOR_API_BASE_URL : LOCALHOST_API_BASE_URL;

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
