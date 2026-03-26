import * as Keychain from 'react-native-keychain';
import { User } from '../types';

const SERVICE = 'loka-auth';

export interface StoredSession {
  token: string;
  user: User;
}

export const saveSession = async (session: StoredSession) => {
  await Keychain.setGenericPassword('session', JSON.stringify(session), {
    service: SERVICE,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
};

export const getSession = async (): Promise<StoredSession | null> => {
  const credentials = await Keychain.getGenericPassword({ service: SERVICE });

  if (!credentials) {
    return null;
  }

  return JSON.parse(credentials.password);
};

export const clearSession = async () => {
  await Keychain.resetGenericPassword({ service: SERVICE });
};
