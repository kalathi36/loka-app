import React, { createContext, useContext, useEffect, useState } from 'react';
import api, { setApiToken } from '../services/api';
import { clearSession, getSession, saveSession } from '../services/authStorage';
import { connectSocket, disconnectSocket } from '../services/socket';
import { ApiEnvelope, User } from '../types';

interface RegisterOrganizationPayload {
  organizationName: string;
  name: string;
  phone: string;
  password: string;
}

interface RegisterUserPayload {
  organizationCode: string;
  name: string;
  phone: string;
  password: string;
  role: 'worker' | 'customer';
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  initializing: boolean;
  loggingIn: boolean;
  signingUp: boolean;
  registeringOrganization: boolean;
  login: (phone: string, password: string) => Promise<void>;
  registerUser: (payload: RegisterUserPayload) => Promise<void>;
  registerOrganization: (payload: RegisterOrganizationPayload) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);
  const [signingUp, setSigningUp] = useState(false);
  const [registeringOrganization, setRegisteringOrganization] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const storedSession = await getSession();

        if (storedSession) {
          setUser(storedSession.user);
          setToken(storedSession.token);
          setApiToken(storedSession.token);
          connectSocket(storedSession.token);
        }
      } finally {
        setInitializing(false);
      }
    };

    bootstrap();
  }, []);

  const applySession = async (nextToken: string, nextUser: User) => {
    setUser(nextUser);
    setToken(nextToken);
    setApiToken(nextToken);
    await saveSession({
      token: nextToken,
      user: nextUser,
    });
    connectSocket(nextToken);
  };

  const login = async (phone: string, password: string) => {
    setLoggingIn(true);

    try {
      const response = await api.post<
        ApiEnvelope<{
          token: string;
          user: User;
        }>
      >('/auth/login', {
        phone,
        password,
      });

      await applySession(response.data.data.token, response.data.data.user);
    } finally {
      setLoggingIn(false);
    }
  };

  const registerUser = async (payload: RegisterUserPayload) => {
    setSigningUp(true);

    try {
      const response = await api.post<
        ApiEnvelope<{
          token: string;
          user: User;
        }>
      >('/auth/signup', payload);

      await applySession(response.data.data.token, response.data.data.user);
    } finally {
      setSigningUp(false);
    }
  };

  const registerOrganization = async (payload: RegisterOrganizationPayload) => {
    setRegisteringOrganization(true);

    try {
      const response = await api.post<
        ApiEnvelope<{
          token: string;
          user: User;
        }>
      >('/auth/register-organization', payload);

      await applySession(response.data.data.token, response.data.data.user);
    } finally {
      setRegisteringOrganization(false);
    }
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    setApiToken(null);
    disconnectSocket();
    await clearSession();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        initializing,
        loggingIn,
        signingUp,
        registeringOrganization,
        login,
        registerUser,
        registerOrganization,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
};
