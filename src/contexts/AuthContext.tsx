import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/index';
import { loginUser } from '../services/authService';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, handleRedirect: (user:User) => void) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  authError: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      try {
        const savedUser = localStorage.getItem('user');
        const accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');
        if (savedUser && accessToken && refreshToken) {
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string, handleRedirect: (user:User) => void): Promise<boolean> => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const response = await loginUser({ email, password });
      setUser(response.user);
      localStorage.setItem('user', JSON.stringify(response.user));
      if (response.accessToken) {
        localStorage.setItem('accessToken', response.accessToken);
      }
      if (response.refreshToken) {
        localStorage.setItem('refreshToken', response.refreshToken);
      }
      handleRedirect(response.user);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Đăng nhập thất bại';
      setAuthError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    // Nếu muốn xóa luôn email đã nhớ (tùy chọn)
    // localStorage.removeItem('rememberedEmail');
    setAuthError(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, authError }}>
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