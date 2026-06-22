'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'cashier' | 'customer';
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

  // Check if user is already authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = apiClient.getToken();
      if (token) {
        try {
          const response = await apiClient.getMe();
          if (response.success && response.data) {
            setUser(response.data);
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
        return loggedUser;
      } else {
        throw new Error(response.error || 'Signin failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
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
