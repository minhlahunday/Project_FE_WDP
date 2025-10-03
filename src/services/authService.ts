import { post } from './httpClient';
import { User } from '../types/index';

interface LoginRequest {
  email: string;
  password: string;
}

interface AuthResponse {
  success: boolean;
  message?: string;
  data?: any;
}

// API response từ backend
interface ApiLoginResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
  };
}

export const loginUser = async (credentials: LoginRequest): Promise<{ accessToken: string; refreshToken: string; user: User }> => {
  try {
    const response = await post<ApiLoginResponse>('/api/auth/login', credentials);
    
    if (!response.data || !response.data.accessToken) {
      throw new Error('Invalid response structure from server');
    }
    
    const payload = parseJwt(response.data.accessToken);
    let userRole = mapRoleName(payload.role || payload.roleName);
    
    if (userRole === 'dealer_staff' && credentials.email) {
      if (credentials.email.includes('admin')) {
        userRole = 'admin';
      } else if (credentials.email.includes('evm')) {
        userRole = 'evm_staff';
      } else if (credentials.email.includes('manager')) {
        userRole = 'dealer_manager';
      }
    }
    
    const user: User = {
      id: payload.id || payload._id || '',
      email: payload.email || credentials.email,
      name: payload.full_name || payload.name || 'Người dùng', 
      role: userRole,
    };
    
    return {
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken || '',
      user: user
    };
  } catch (error) {
    try {
      return await mockLoginUser(credentials);
    } catch (mockError) {
      throw error;
    }
  }
};

function parseJwt(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return {};
    }
    
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    
    let finalBase64 = base64;
    const padding = base64.length % 4;
    if (padding) {
      finalBase64 = base64 + '='.repeat(4 - padding);
    }
    
    const jsonPayload = decodeURIComponent(
      atob(finalBase64)
        .split('')
        .map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
    
    const parsed = JSON.parse(jsonPayload);
    return parsed;
  } catch (error) {
    return {};
  }
}

function mapRoleName(roleName: string): 'dealer_staff' | 'dealer_manager' | 'evm_staff' | 'admin' {
  if (!roleName) {
    return 'dealer_staff';
  }
  
  const role = roleName.toLowerCase();
  
  if (role.includes('admin')) {
    return 'admin';
  } else if (role.includes('evm staff') || role.includes('evm_staff')) {
    return 'evm_staff';
  } else if (role.includes('dealer manager') || role.includes('dealer_manager')) {
    return 'dealer_manager';
  } else if (role.includes('dealer staff') || role.includes('dealer_staff')) {
    return 'dealer_staff';
  }
  
  switch (roleName) {
    case 'Admin':
      return 'admin';
    case 'EVM Staff':
      return 'evm_staff';
    case 'Dealer Manager':
      return 'dealer_manager';
    case 'Dealer Staff':
      return 'dealer_staff';
    default:
      return 'dealer_staff';
  }
};

export const logoutUser = async (): Promise<AuthResponse> => {
  return post<AuthResponse>('/api/auth/logout');
};

export const mockLoginUser = async (credentials: LoginRequest): Promise<{ accessToken: string; refreshToken: string; user: User }> => {
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
    },
    // Thêm tài khoản từ seed data
    {
      id: '5',
      email: 'staff@example.com',
      password: 'Staff123!',
      name: 'Dealer Staff User',
      role: 'dealer_staff'
    },
    {
      id: '6',
      email: 'manager@example.com',
      password: 'Manager123!',
      name: 'Dealer Manager User', 
      role: 'dealer_manager'
    },
    {
      id: '7',
      email: 'evm@example.com',
      password: 'Evm123!',
      name: 'EVM Staff User',
      role: 'evm_staff'
    },
    {
      id: '8',
      email: 'admin@example.com',
      password: 'Admin123!',
      name: 'Admin User',
      role: 'admin'
    }
  ];

  await new Promise(resolve => setTimeout(resolve, 800));

  const user = mockUsers.find(
    u => u.email === credentials.email && u.password === credentials.password
  );

  if (!user) {
    throw new Error('Invalid email or password');
  }

  const { password, ...userWithoutPassword } = user;
  
  const mockPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    roleName: user.role,
    full_name: user.name
  };
  
  const header = btoa(JSON.stringify({ typ: 'JWT', alg: 'HS256' }));
  const payload = btoa(JSON.stringify(mockPayload));
  const signature = btoa('mock-signature-' + Math.random().toString(36));
  const accessToken = `${header}.${payload}.${signature}`;
  const refreshToken = btoa('mock-refresh-' + Math.random().toString(36));
  
  return {
    accessToken,
    refreshToken,
    user: userWithoutPassword
  };
};

export interface RegisterRequest {
  full_name: string;
  email: string;
  phone: string;
  address?: string;
  password: string;
  role_id: string;
  dealership_id?: string;
  manufacturer_id?: string;
  avatar?: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data?: any;
  errors?: any;
}

// Validation helper functions
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[0-9]{10,11}$/;
  return phoneRegex.test(phone.replace(/[^0-9]/g, ''));
};

const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};

export const authService = {
  async registerStaff(data: RegisterRequest): Promise<RegisterResponse> {
    try {
      // Client-side validation
      const validationErrors: string[] = [];
      
      if (!data.full_name?.trim()) {
        validationErrors.push('Họ và tên không được để trống');
      }
      
      if (!validateEmail(data.email)) {
        validationErrors.push('Email không hợp lệ');
      }
      
      if (!validatePhone(data.phone)) {
        validationErrors.push('Số điện thoại không hợp lệ (10-11 số)');
      }
      
      if (!validatePassword(data.password)) {
        validationErrors.push('Mật khẩu phải có ít nhất 6 ký tự');
      }
      
      if (!data.role_id?.trim()) {
        validationErrors.push('Vui lòng chọn vai trò');
      }

      if (validationErrors.length > 0) {
        return {
          success: false,
          message: validationErrors[0],
          errors: validationErrors
        };
      }

      const response = await post<any>('/api/users', data);
      
      return {
        success: true,
        message: 'Đăng ký nhân viên thành công',
        data: response
      };
    } catch (error: any) {
      let errorMessage = 'Có lỗi xảy ra khi đăng ký nhân viên';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Handle specific error cases
      if (errorMessage.includes('email') && errorMessage.includes('exists')) {
        errorMessage = 'Email này đã được sử dụng';
      } else if (errorMessage.includes('phone') && errorMessage.includes('exists')) {
        errorMessage = 'Số điện thoại này đã được sử dụng';
      }
      
      return {
        success: false,
        message: errorMessage,
        errors: error.response?.data?.errors || []
      };
    }
  }
};