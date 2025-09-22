import { post } from './httpClient';
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

// API response từ backend
interface ApiLoginResponse {
  success: boolean;
  message: string;
  accessToken: string;
  refreshToken: string;
}

export const loginUser = async (credentials: LoginRequest): Promise<LoginResponse> => {
  try {
    const response = await post<ApiLoginResponse>('/api/auth/login', credentials);
    
    console.log('Login response:', response);
    
    // Giải nén JWT để lấy thông tin người dùng
    const payload = parseJwt(response.accessToken);
    
    console.log('JWT payload:', payload);
    console.log('Role from JWT:', payload.role);
    console.log('RoleName from JWT:', payload.roleName);
    
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
    
    console.log('Final determined role:', userRole);
    
    const user: User = {
      id: payload.id || payload._id || '',
      email: payload.email || credentials.email,
      name: payload.full_name || payload.name || 'Người dùng', 
      role: userRole,
    };
    
    console.log('Final user object:', user);
    console.log('Final mapped role:', user.role);
    
    return {
      token: response.accessToken,
      user: user
    };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

function parseJwt(token: string) {
  try {
    console.log('Parsing JWT token:', token.substring(0, 50) + '...');
    
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Invalid JWT format - should have 3 parts, got:', parts.length);
      return {};
    }
    
    const base64Url = parts[1];
    console.log('Base64Url payload:', base64Url.substring(0, 50) + '...');
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    
    let finalBase64 = base64;
    const padding = base64.length % 4;
    if (padding) {
      finalBase64 = base64 + '='.repeat(4 - padding);
      console.log('Added padding to base64');
    }
    
    const jsonPayload = decodeURIComponent(
      atob(finalBase64)
        .split('')
        .map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
    
    console.log('Decoded JSON string:', jsonPayload);
    
    const parsed = JSON.parse(jsonPayload);
    console.log('Parsed JWT payload:', parsed);
    
    return parsed;
  } catch (error) {
    console.error('Error parsing JWT:', error);
    console.error('Token:', token);
    return {};
  }
}

function mapRoleName(roleName: string): 'dealer_staff' | 'dealer_manager' | 'evm_staff' | 'admin' {
  console.log('=== MAPPING ROLE ===');
  console.log('Input roleName:', roleName);
  console.log('Type of roleName:', typeof roleName);
  
  if (!roleName) {
    console.warn('Không tìm thấy vai trò trong JWT payload');
    return 'dealer_staff';
  }
  
  const role = roleName.toLowerCase();
  console.log('Lowercase role:', role);
  
  if (role.includes('admin')) {
    console.log('✅ Mapped to: admin');
    return 'admin';
  } else if (role.includes('evm staff') || role.includes('evm_staff')) {
    console.log('✅ Mapped to: evm_staff');
    return 'evm_staff';
  } else if (role.includes('dealer manager') || role.includes('dealer_manager')) {
    console.log('✅ Mapped to: dealer_manager');
    return 'dealer_manager';
  } else if (role.includes('dealer staff') || role.includes('dealer_staff')) {
    console.log('✅ Mapped to: dealer_staff');
    return 'dealer_staff';
  }
  
  switch (roleName) {
    case 'Admin':
      console.log('✅ Switch case - Mapped to: admin');
      return 'admin';
    case 'EVM Staff':
      console.log('✅ Switch case - Mapped to: evm_staff');
      return 'evm_staff';
    case 'Dealer Manager':
      console.log('✅ Switch case - Mapped to: dealer_manager');
      return 'dealer_manager';
    case 'Dealer Staff':
      console.log('✅ Switch case - Mapped to: dealer_staff');
      return 'dealer_staff';
    default:
      console.warn(`⚠️ Vai trò không xác định: ${roleName}, sử dụng vai trò mặc định`);
      return 'dealer_staff';
  }
};

export const logoutUser = async (): Promise<AuthResponse> => {
  return post<AuthResponse>('/api/auth/logout');
};

export const mockLoginUser = async (credentials: LoginRequest): Promise<LoginResponse> => {
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

  await new Promise(resolve => setTimeout(resolve, 800));

  const user = mockUsers.find(
    u => u.email === credentials.email && u.password === credentials.password
  );

  if (!user) {
    throw new Error('Invalid email or password');
  }

  const { password, ...userWithoutPassword } = user;
  
  const token = `mock-jwt-token-${Math.random().toString(36).substring(2, 15)}`;
  
  return {
    token,
    user: userWithoutPassword
  };
};