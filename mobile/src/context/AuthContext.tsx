import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import apiClient, { storeTokens, clearTokens, getStoredToken } from '../api/client';

interface User {
  id: number;
  email: string;
  available_hours_per_week?: number;
  stress_level_tolerance?: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refetchUser = useCallback(async () => {
    try {
      const data = await apiClient.get('/auth/me');
      setUser(data as any);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const token = await getStoredToken();
      if (token) {
        await refetchUser();
      } else {
        setIsLoading(false);
      }
    })();
  }, [refetchUser]);

  const login = useCallback(async (email: string, password: string, rememberMe = true) => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    if (rememberMe) {
      formData.append('scope', 'remember_me');
    }

    const data: any = await apiClient.post('/auth/login', formData.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Client': 'mobile',
      },
    });

    await storeTokens(data.access_token, data.refresh_token);
    const me: any = await apiClient.get('/auth/me');
    setUser(me);
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    const data: any = await apiClient.post('/auth/register', { email, password }, {
      headers: { 'X-Client': 'mobile' },
    });

    await storeTokens(data.access_token, data.refresh_token);
    const me: any = await apiClient.get('/auth/me');
    setUser(me);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {}
    await clearTokens();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
