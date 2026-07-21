"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface User {
  id: string;
  _id?: string;
  email: string;
  full_name: string;
  role: 'patient' | 'doctor' | 'admin';
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (access: string, refresh: string, role: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function clearSessionCookies() {
  Cookies.remove('access_token');
  Cookies.remove('refresh_token');
  Cookies.remove('user_role');
}

function mapUser(payload: Partial<User>): User {
  return {
    id: payload._id || payload.id || '',
    _id: payload._id || payload.id || '',
    email: payload.email || '',
    full_name: payload.full_name || 'User',
    role: (payload.role || 'patient') as User['role'],
    created_at: payload.created_at || new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let active = true;

    const initializeAuth = async () => {
      const token = Cookies.get('access_token');
      const role = Cookies.get('user_role');

      if (!token || !role) {
        if (active) {
          setLoading(false);
        }
        return;
      }

      try {
        const res = await api.get('/auth/me');
        if (active) {
          setUser(mapUser({ ...res.data, role: res.data.role || role }));
        }
      } catch {
        clearSessionCookies();
        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void initializeAuth();

    return () => {
      active = false;
    };
  }, []);

  const login = async (access: string, refresh: string, role: string) => {
    Cookies.set('access_token', access);
    Cookies.set('refresh_token', refresh);
    Cookies.set('user_role', role);

    setLoading(true);
    try {
      const res = await api.get('/auth/me');
      setUser(mapUser({ ...res.data, role: res.data.role || role }));
    } catch (error) {
      clearSessionCookies();
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }

    router.push(`/${role}`);
  };

  const logout = async () => {
    try {
      const refresh = Cookies.get('refresh_token');
      if (refresh) {
        await api.post('/auth/logout', { refresh_token: refresh });
      }
    } catch (e) {
      console.error("Logout failed", e);
    } finally {
      clearSessionCookies();
      setUser(null);
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
