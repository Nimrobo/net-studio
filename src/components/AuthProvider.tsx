'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setToken: (token: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // First check localStorage for any manually set token
    const storedToken = localStorage.getItem('nimrobo_token');
    if (storedToken) {
      setTokenState(storedToken);
      setIsLoading(false);
      return;
    }

    // Then try to load from server (reads ~/.nimrobo/config.json)
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.apiKey) {
          setTokenState(data.apiKey);
          localStorage.setItem('nimrobo_token', data.apiKey);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const setToken = (newToken: string | null) => {
    setTokenState(newToken);
    if (newToken) {
      localStorage.setItem('nimrobo_token', newToken);
    } else {
      localStorage.removeItem('nimrobo_token');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        isAuthenticated: !!token,
        isLoading,
        setToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
