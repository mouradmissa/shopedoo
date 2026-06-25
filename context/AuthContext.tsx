'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { restoreCartAfterLogin, snapshotCartBeforeLogout } from '@/lib/cartSync';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'cashier' | 'customer' | 'online_manager' | 'driver';
  storeId?: string;
  store?: {
    _id?: string;
    name: string;
    city: string;
    governorate: string;
    address?: string;
  };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signup: (email: string, password: string, name: string) => Promise<void>;
  signin: (email: string, password: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = apiClient.getToken();
      if (token) {
        try {
          const response = await apiClient.getMe();
          if (response.success && response.data) {
            const data = response.data as User & { _id?: string };
            setUser({
              id: String(data.id || data._id),
              email: data.email,
              name: data.name,
              role: data.role,
              storeId: data.storeId ? String(data.storeId) : undefined,
              store: data.store,
            });
            await restoreCartAfterLogin();
          } else {
            apiClient.clearToken();
          }
        } catch (error) {
          apiClient.clearToken();
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const signup = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      const response = await apiClient.signup(email, password, name);
      if (response.success && response.data) {
        apiClient.setToken(response.data.token);
        setUser(response.data.user);
        await restoreCartAfterLogin();
      } else {
        throw new Error(response.error || 'Signup failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signin = async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const response = await apiClient.signin(email, password);
      if (response.success && response.data) {
        apiClient.setToken(response.data.token);
        const loggedUser = response.data.user as User;
        setUser(loggedUser);
        await restoreCartAfterLogin();
        return loggedUser;
      } else {
        throw new Error(response.error || 'Signin failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    void snapshotCartBeforeLogout();
    setUser(null);
    apiClient.clearToken();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        signup,
        signin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
