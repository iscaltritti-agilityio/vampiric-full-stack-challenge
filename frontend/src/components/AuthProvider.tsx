import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  login: (secretPhrase: string) => Promise<boolean>;
  logout: () => void;
  authError: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Load token from localStorage on mount
    const savedToken = localStorage.getItem('vampireToken');
    if (savedToken) {
      setToken(savedToken);
      // Set default auth header
      axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
    }
  }, []);

  const login = async (secretPhrase: string): Promise<boolean> => {
    setAuthError(null);
    try {
      const response = await axios.post('/api/vampire/authenticate', { secretPhrase });
      const { token: newToken } = response.data;
      
      setToken(newToken);
      localStorage.setItem('vampireToken', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      return true;
    } catch (err: any) {
      setAuthError(err.response?.data?.error || 'Authentication failed');
      return false;
    }
  };

  const logout = () => {
    setToken(null);
    setAuthError(null);
    localStorage.removeItem('vampireToken');
    delete axios.defaults.headers.common['Authorization'];
  };

  const value = {
    token,
    isAuthenticated: !!token,
    login,
    logout,
    authError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

