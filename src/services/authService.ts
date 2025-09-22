import { post, get } from './httpClient';
import { User } from '../types/index';

interface LoginResponse {
  token: string;
  user: User;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface AuthResponse {
  success: boolean;
  message?: string;
  data?: any;
}

// Function to login user
export const loginUser = async (credentials: LoginRequest): Promise<LoginResponse> => {
  // For production, replace with actual API endpoint
  return post<LoginResponse>('/auth/login', credentials);
};

// Function to get current user
export const getCurrentUser = async (): Promise<User> => {
  return get<User>('/auth/me');
};

// Function to log out user
export const logoutUser = async (): Promise<AuthResponse> => {
  return post<AuthResponse>('/auth/logout');
};

// Mock implementation for development (to be removed in production)
export const mockLoginUser = async (credentials: LoginRequest): Promise<LoginResponse> => {
  // Mock users for development
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

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));

  // Find user
  const user = mockUsers.find(
    u => u.email === credentials.email && u.password === credentials.password
  );

  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Remove password from returned user object
  const { password, ...userWithoutPassword } = user;
  
  // Generate a mock token
  const token = `mock-jwt-token-${Math.random().toString(36).substring(2, 15)}`;
  
  return {
    token,
    user: userWithoutPassword
  };
};