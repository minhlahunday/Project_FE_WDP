import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user data
const mockUsers: (User & { password: string })[] = [
  {
    id: '1',
    email: 'dealer.staff@example.com',
    password: 'password',
    name: 'Nguyễn Văn A',
    role: 'dealer_staff',
    dealerId: 'dealer1',
    dealerName: 'Đại lý Hà Nội'
  },
  {
    id: '2',
    email: 'dealer.manager@example.com',
    password: 'password',
    name: 'Trần Thị B',
    role: 'dealer_manager',
    dealerId: 'dealer1',
    dealerName: 'Đại lý Hà Nội'
  },
  {
    id: '3',
    email: 'evm.staff@example.com',
    password: 'password',
    name: 'Lê Văn C',
    role: 'evm_staff'
  },
  {
    id: '4',
    email: 'admin@example.com',
    password: 'password',
    name: 'Admin',
    role: 'admin'
  }
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const foundUser = mockUsers.find(u => u.email === email && u.password === password);
    
    if (foundUser) {
      const { password: _, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      localStorage.setItem('user', JSON.stringify(userWithoutPassword));
      setIsLoading(false);
      return true;
    }
    
    setIsLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
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