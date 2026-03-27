import { NativeModules, Platform } from 'react-native';

const resolveDevApiHost = () => {
  const sourceScriptUrl = NativeModules.SourceCode?.scriptURL as string | undefined;
  const sourceHostMatch = sourceScriptUrl?.match(/https?:\/\/([^/:]+)/i);
  const sourceHost = sourceHostMatch?.[1];

  if (sourceHost && !['localhost', '127.0.0.1'].includes(sourceHost)) {
    return sourceHost;
  }

  const androidServerHost =
    (Platform as typeof Platform & { constants?: { ServerHost?: string } }).constants?.ServerHost ||
    (NativeModules.PlatformConstants?.ServerHost as string | undefined);

  if (androidServerHost) {
    const nextHost = androidServerHost.split(':')[0];

    if (nextHost && !['localhost', '127.0.0.1'].includes(nextHost)) {
      return nextHost;
    }
  }

  return Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
};

export const DEFAULT_API_BASE_URL = __DEV__
  ? `http://${resolveDevApiHost()}:5050/api`
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
