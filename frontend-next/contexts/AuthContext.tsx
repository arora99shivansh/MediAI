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
  login: (access: string, refresh: string, role: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = Cookies.get('access_token');
    const role = Cookies.get('user_role');
    
    if (token && role) {
      // Try to fetch real user data
      api.get('/auth/me')
        .then(res => {
          setUser({
            id: res.data._id || res.data.id || 'temp-id',
            _id: res.data._id || res.data.id || 'temp-id',
            email: res.data.email,
            full_name: res.data.full_name || 'User',
            role: role as 'patient' | 'doctor' | 'admin',
            created_at: res.data.created_at || new Date().toISOString()
          });
        })
        .catch(() => {
          // If /me fails, use basic info from cookies
          setUser({
            id: 'temp-id',
            _id: 'temp-id',
            email: 'user@example.com',
            full_name: 'Authenticated User',
            role: role as 'patient' | 'doctor',
            created_at: new Date().toISOString()
          });
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (access: string, refresh: string, role: string) => {
    Cookies.set('access_token', access);
    Cookies.set('refresh_token', refresh);
    Cookies.set('user_role', role);
    setUser({
      id: 'temp-id',
      _id: 'temp-id',
      email: 'user@example.com',
      full_name: 'Authenticated User',
      role: role as 'patient' | 'doctor',
      created_at: new Date().toISOString()
    });
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
      Cookies.remove('access_token');
      Cookies.remove('refresh_token');
      Cookies.remove('user_role');
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
