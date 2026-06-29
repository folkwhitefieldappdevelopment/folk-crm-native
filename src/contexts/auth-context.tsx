import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  getApiClient,
  setTokens,
  clearTokens,
  getToken,
  cacheUser,
  getCachedUser,
} from '../services/api-client';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string[];
  photoUrl?: string;
  fgCode?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  isAuthenticated: false,
  signIn: async () => {},
  signOut: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initAuth();
  }, []);

  async function initAuth() {
    try {
      const stored = await getCachedUser<User>();
      const tok = await getToken();

      if (stored && tok) {
        setUser(stored);
        setToken(tok);

        const api = getApiClient();
        try {
          const response = await api.get('/auth/me');
          const freshUser: User = response.data;
          setUser(freshUser);
          await cacheUser(freshUser);
        } catch {
          // Token expired or invalid — try refresh handled by interceptor
          // If interceptor also fails, we stay with cached user
        }
      }
    } catch {
      // No stored auth
    } finally {
      setLoading(false);
    }
  }

  const signIn = useCallback(async (email: string, password: string) => {
    const api = getApiClient();
    const response = await api.post('/auth/login', { email, password });
    const { token: newToken, user: newUser } = response.data;

    await setTokens(newToken);
    await cacheUser(newUser);
    setToken(newToken);
    setUser(newUser);
  }, []);

  const signOut = useCallback(async () => {
    try {
      const api = getApiClient();
      await api.post('/auth/logout');
    } catch {
      // Ignore errors
    }
    await clearTokens();
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const api = getApiClient();
      const response = await api.get('/auth/me');
      const freshUser: User = response.data;
      setUser(freshUser);
      await cacheUser(freshUser);
    } catch {
      // Ignore
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user && !!token,
        signIn,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export type { User };
