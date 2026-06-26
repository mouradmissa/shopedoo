import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient, setUnauthorizedHandler } from '../api/client';
import { AppRole } from '../lib/roles';
import { restoreCartAfterLogin, snapshotCartBeforeLogout } from '../lib/cartSync';
import { resetToShop } from '../navigation/navigationRef';

export interface User {
  id: string;
  email: string;
  name: string;
  role: AppRole;
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

function normalizeUser(data: User & { _id?: string }): User {
  return {
    id: String(data.id || data._id),
    email: data.email,
    name: data.name,
    role: data.role,
    storeId: data.storeId ? String(data.storeId) : undefined,
    store: data.store,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      await apiClient.initialize();
      const token = apiClient.getToken();

      if (token) {
        try {
          const response = await apiClient.getMe();
          if (response.success && response.data) {
            setUser(normalizeUser(response.data as User & { _id?: string }));
            await restoreCartAfterLogin();
          } else {
            await apiClient.clearToken();
          }
        } catch {
          await apiClient.clearToken();
        }
      }

      setIsLoading(false);
    };

    void checkAuth();
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      resetToShop();
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  const signup = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      const response = await apiClient.signup(email, password, name);
      if (response.success && response.data) {
        await apiClient.setToken(response.data.token);
        setUser(normalizeUser(response.data.user as User));
        await restoreCartAfterLogin();
      } else {
        throw new Error(response.error || 'Inscription échouée');
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
        await apiClient.setToken(response.data.token);
        const loggedUser = normalizeUser(response.data.user as User);
        setUser(loggedUser);
        await restoreCartAfterLogin();
        return loggedUser;
      }
      throw new Error(response.error || 'Connexion échouée');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    void snapshotCartBeforeLogout();
    setUser(null);
    void apiClient.clearToken();
    resetToShop();
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
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
