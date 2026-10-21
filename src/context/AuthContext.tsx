import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authFetch, setStoredToken, clearStoredToken, getStoredToken } from '../lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const res = await authFetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        // If 401 and had token, clear stale token
        if (res.status === 401) {
          clearStoredToken();
        }
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.token) {
          setStoredToken(data.token);
        }
        setUser(data.user);
        return { success: true, user: data.user };
      }
      return { success: false, error: data.error || 'Authentication failed' };
    } catch (err: any) {
      return { success: false, error: 'Network error during sign in' };
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.token) {
          setStoredToken(data.token);
        }
        setUser(data.user);
        return { success: true, user: data.user };
      }
      return { success: false, error: data.error || 'Registration failed' };
    } catch (err: any) {
      return { success: false, error: 'Network error during registration' };
    }
  };

  const logout = async () => {
    try {
      await authFetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      // ignore
    } finally {
      clearStoredToken();
      setUser(null);
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, checkAuth, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
