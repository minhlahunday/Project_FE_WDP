import { post, get, put, del } from './httpClient';
import { User } from '../types/index';

// interface LoginResponse {
//   token: string;
//   user: User;
// }

interface LoginRequest {
  email: string;
  password: string;
}

interface AuthResponse {
  success: boolean;
  message?: string;
  data?: unknown;
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
    console.log('=== ĐĂNG NHẬP BẮT ĐẦU ===');
    console.log('Credentials:', credentials);
    
    const response = await post<ApiLoginResponse>('/api/auth/login', credentials);
    
    console.log('=== RESPONSE TỪ BACKEND ===');
    console.log('Full response:', response);
    console.log('Response type:', typeof response);
    console.log('Response.success:', response.success);
    console.log('Response.data:', response.data);
    
    // Kiểm tra response structure
    if (!response.data || !response.data.accessToken) {
      console.error('❌ Invalid response structure:');
      console.error('- response.data exists:', !!response.data);
      console.error('- response.data.accessToken exists:', !!(response.data && response.data.accessToken));
      throw new Error('Invalid response structure from server');
    }
    
    console.log('✅ Response structure is valid');
    console.log('AccessToken received:', response.data.accessToken.substring(0, 50) + '...');
    
    // Giải nén JWT để lấy thông tin người dùng
    const payload = parseJwt(response.data.accessToken);
    
    console.log('JWT payload:', payload);
    console.log('Role from JWT:', payload.role);
    console.log('RoleName from JWT:', payload.roleName);
    console.log('Dealership ID from JWT:', payload.dealership_id);
    console.log('All JWT payload keys:', Object.keys(payload));
    
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
    
    // Tìm dealership_id với nhiều tên có thể có
    const dealershipId = payload.dealership_id || 
                        payload.dealershipId || 
                        payload.dealership || 
                        payload.dealer_id ||
                        payload.dealerId ||
                        undefined;
    
    console.log('Found dealership ID:', dealershipId);
    
    const user: User = {
      id: payload.id || payload._id || '',
      email: payload.email || credentials.email,
      name: payload.full_name || payload.name || 'Người dùng', 
      role: userRole,
      dealership_id: dealershipId,
    };
    
    console.log('Final user object:', user);
    console.log('Final mapped role:', user.role);
    
    return {
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken || '', // fallback nếu backend không trả về
      user: user
    };
  } catch (error) {
    console.error('=== LỖI ĐĂNG NHẬP ===');
    console.error('Error type:', typeof error);
    console.error('Error object:', error);
    
    if (error && typeof error === 'object') {
      console.error('Error.response:', (error as any).response);
      console.error('Error.message:', (error as any).message);
      console.error('Error.status:', (error as any).status);
    }
    
    // Nếu không kết nối được backend, thử dùng mock data
    console.log('🔄 Backend không khả dụng, thử sử dụng mock data...');
    try {
      return await mockLoginUser(credentials);
    } catch (mockError) {
      console.error('❌ Mock login cũng thất bại:', mockError);
      throw error; // Throw original error
    }
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

export const mockLoginUser = async (credentials: LoginRequest): Promise<{ accessToken: string; refreshToken: string; user: User }> => {
  console.log('🧪 Sử dụng mock login data');
  
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
      role: 'dealer_staff',
      dealerId: 'dealer1',
      dealerName: 'Đại lý VinFast Hà Nội'
    },
    {
      id: '6',
      email: 'manager@example.com',
      password: 'Manager123!',
      name: 'Dealer Manager User', 
      role: 'dealer_manager',
      dealerId: 'dealer1',
      dealerName: 'Đại lý VinFast Hà Nội'
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
    console.error('❌ Mock login: tài khoản không hợp lệ');
    console.log('📋 Available mock accounts:');
    mockUsers.forEach(u => console.log(`  - ${u.email} / ${u.password} (${u.role})`));
    throw new Error('Invalid email or password');
  }

  const { password, ...userWithoutPassword } = user;
  
  // Tạo JWT token giả có format tương tự real token
  const mockPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    roleName: user.role,
    full_name: user.name
  };
  
  // Tạo JWT giả đơn giản (header.payload.signature)
  const header = btoa(JSON.stringify({ typ: 'JWT', alg: 'HS256' }));
  const payload = btoa(JSON.stringify(mockPayload));
  const signature = btoa('mock-signature-' + Math.random().toString(36));
  const accessToken = `${header}.${payload}.${signature}`;
  const refreshToken = btoa('mock-refresh-' + Math.random().toString(36));
  
  console.log('✅ Mock login thành công cho:', user.email);
  console.log('🎭 Mock token tạo thành công');
  
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
  password: string;
  role_name: string;
  dealership_id?: string;
  manufacturer_id?: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data?: any;
}

// User Management Interfaces
export interface UserFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: 'active' | 'inactive' | 'pending';
  dealership_id?: string;
}

export interface UserResponse {
  success: boolean;
  message: string;
  data?: {
    users: User[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface SingleUserResponse {
  success: boolean;
  message: string;
  data?: User;
}

export interface CreateUserRequest {
  full_name: string;
  email: string;
  phone: string;
  address?: string;
  password: string;
  role_id: string; // ObjectId của role
  dealership_id?: string; // Admin only
  manufacturer_id?: string; // Admin only
  avatar?: File;
}

export interface UpdateUserRequest {
  full_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  password?: string;
  role_id?: string;
  dealership_id?: string;
  manufacturer_id?: string;
  avatar?: File;
}

export const authService = {
  async registerStaff(data: RegisterRequest): Promise<RegisterResponse> {
    try {
      const response = await post<any>('/api/auth/register', data);
      
      return {
        success: true,
        message: 'Đăng ký nhân viên thành công',
        data: response
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Có lỗi xảy ra khi đăng ký nhân viên'
      };
    }
  },

  // User Management API Methods
  async getRoles(): Promise<{ success: boolean; data?: unknown[]; message?: string }> {
    try {
      console.log('🚀 Getting roles from API...');
      const response = await get<unknown>('/api/roles');
      console.log('✅ Roles response:', response);
      
      return {
        success: true,
        data: response as unknown[],
        message: 'Lấy danh sách roles thành công'
      };
    } catch (error: unknown) {
      console.error('❌ Error getting roles:', error);
      return {
        success: false,
        message: (error as Error).message || 'Có lỗi xảy ra khi lấy danh sách roles'
      };
    }
  },

  async getAllUsers(filters: UserFilters = {}): Promise<UserResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.page) queryParams.append('page', filters.page.toString());
      if (filters.limit) queryParams.append('limit', filters.limit.toString());
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.role) queryParams.append('role', filters.role);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.dealership_id) queryParams.append('dealership_id', filters.dealership_id);

      const url = `/api/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await get<any>(url);
      
      return {
        success: true,
        message: 'Lấy danh sách người dùng thành công',
        data: response
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Có lỗi xảy ra khi lấy danh sách người dùng'
      };
    }
  },

  async createUser(data: CreateUserRequest): Promise<SingleUserResponse> {
    try {
      console.log('🚀 Creating user with data:', data);
      
      const formData = new FormData();
      formData.append('full_name', data.full_name);
      formData.append('email', data.email);
      formData.append('phone', data.phone);
      formData.append('password', data.password);
      formData.append('role_id', data.role_id);
      
      if (data.address) formData.append('address', data.address);
      if (data.dealership_id) formData.append('dealership_id', data.dealership_id);
      if (data.manufacturer_id) formData.append('manufacturer_id', data.manufacturer_id);
      if (data.avatar) formData.append('avatar', data.avatar);

      console.log('📋 FormData contents:');
      for (const [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value);
      }

      const response = await post<unknown>('/api/users', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('✅ Create user response:', response);
      
      return {
        success: true,
        message: 'Tạo người dùng thành công',
        data: response as User
      };
    } catch (error: unknown) {
      console.error('❌ Error creating user:', error);
      
      // Log chi tiết lỗi từ backend
      if (error && typeof error === 'object') {
        const errorObj = error as Record<string, unknown>;
        console.error('❌ Error details:', {
          message: errorObj.message,
          status: errorObj.status,
          statusText: errorObj.statusText,
          data: errorObj.data,
          response: errorObj.response
        });
        
        // Nếu có response từ backend, log chi tiết
        if (errorObj.response) {
          console.error('❌ Backend response:', errorObj.response);
        }
      }
      
      return {
        success: false,
        message: (error as Error).message || 'Có lỗi xảy ra khi tạo người dùng'
      };
    }
  },

  async getUserById(id: string): Promise<SingleUserResponse> {
    try {
      console.log('🚀 Getting user by ID:', id);
      const response = await get<unknown>(`/api/users/${id}?t=${Date.now()}`);
      
      console.log('✅ Get user by ID response:', response);
      console.log('🔍 Response structure:', {
        hasSuccess: !!(response as Record<string, unknown>).success,
        hasMessage: !!(response as Record<string, unknown>).message,
        hasData: !!(response as Record<string, unknown>).data,
        responseKeys: Object.keys(response as Record<string, unknown>)
      });
      
      const responseData = response as Record<string, unknown>;
      
      return {
        success: true,
        message: 'Lấy thông tin người dùng thành công',
        data: responseData.data as User
      };
    } catch (error: unknown) {
      console.error('❌ Error getting user by ID:', error);
      
      // Log chi tiết lỗi từ backend
      if (error && typeof error === 'object') {
        const errorObj = error as Record<string, unknown>;
        console.error('❌ Error details:', {
          message: errorObj.message,
          status: errorObj.status,
          statusText: errorObj.statusText,
          data: errorObj.data,
          response: errorObj.response
        });
        
        // Nếu có response từ backend, log chi tiết
        if (errorObj.response) {
          console.error('❌ Backend response:', errorObj.response);
        }
      }
      
      return {
        success: false,
        message: (error as Error).message || 'Có lỗi xảy ra khi lấy thông tin người dùng'
      };
    }
  },

  async updateUser(id: string, data: UpdateUserRequest): Promise<SingleUserResponse> {
    try {
      console.log('🚀 Updating user with ID:', id);
      console.log('🚀 Update data:', data);
      
      const formData = new FormData();
      
      if (data.full_name) formData.append('full_name', data.full_name);
      if (data.email) formData.append('email', data.email);
      if (data.phone) formData.append('phone', data.phone);
      if (data.address) formData.append('address', data.address);
      if (data.password) formData.append('password', data.password);
      if (data.role_id) formData.append('role_id', data.role_id);
      if (data.dealership_id) formData.append('dealership_id', data.dealership_id);
      if (data.manufacturer_id) formData.append('manufacturer_id', data.manufacturer_id);
      if (data.avatar) formData.append('avatar', data.avatar);

      console.log('📋 FormData contents:');
      for (const [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value);
      }

      const response = await put<unknown>(`/api/users/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('✅ Update user response:', response);
      
      return {
        success: true,
        message: 'Cập nhật người dùng thành công',
        data: response as User
      };
    } catch (error: unknown) {
      console.error('❌ Error updating user:', error);
      
      // Log chi tiết lỗi từ backend
      if (error && typeof error === 'object') {
        const errorObj = error as Record<string, unknown>;
        console.error('❌ Error details:', {
          message: errorObj.message,
          status: errorObj.status,
          statusText: errorObj.statusText,
          data: errorObj.data,
          response: errorObj.response
        });
        
        // Nếu có response từ backend, log chi tiết
        if (errorObj.response) {
          console.error('❌ Backend response:', errorObj.response);
        }
      }
      
      return {
        success: false,
        message: (error as Error).message || 'Có lỗi xảy ra khi cập nhật người dùng'
      };
    }
  },

  async deleteUser(id: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🚀 Deleting user with ID:', id);
      const response = await del(`/api/users/${id}`);
      
      console.log('✅ Delete user response:', response);
      
      return {
        success: true,
        message: 'Xóa người dùng thành công'
      };
    } catch (error: unknown) {
      console.error('❌ Error deleting user:', error);
      
      // Log chi tiết lỗi từ backend
      if (error && typeof error === 'object') {
        const errorObj = error as Record<string, unknown>;
        console.error('❌ Error details:', {
          message: errorObj.message,
          status: errorObj.status,
          data: errorObj.data
        });
      }
      
      return {
        success: false,
        message: (error as Error).message || 'Có lỗi xảy ra khi xóa người dùng'
      };
    }
  },

  // Dealer Information API Methods
  async getDealerById(dealerId: string): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      console.log('🚀 Calling API dealerships with ID:', dealerId);
      const response = await get<any>(`/api/dealerships/${dealerId}`);
      
      console.log('✅ API dealerships response:', response);
      return {
        success: true,
        message: 'Lấy thông tin đại lý thành công',
        data: response
      };
    } catch (error: any) {
      console.error('❌ Lỗi khi gọi API dealerships:', error);
      console.error('❌ Error details:', error.response?.data || error.message);
      return {
        success: false,
        message: error.message || 'Không thể tải thông tin đại lý'
      };
    }
  },

  // Lấy thông tin user hiện tại để có dealership_id
  async getCurrentUser(): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      // Sử dụng endpoint khác để lấy thông tin user hiện tại
      const response = await get<any>('/api/users/profile');
      
      return {
        success: true,
        message: 'Lấy thông tin user thành công',
        data: response
      };
    } catch (error: any) {
      console.error('❌ Lỗi khi gọi API users/profile:', error);
      return {
        success: false,
        message: error.message || 'Không thể tải thông tin user'
      };
    }
  },

  // Vehicle Management API Methods
  async getVehicles(filters: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    sort?: string;
  } = {}): Promise<{ success: boolean; message: string; data?: unknown }> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.page) queryParams.append('page', filters.page.toString());
      if (filters.limit) queryParams.append('limit', filters.limit.toString());
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.sort) queryParams.append('sort', filters.sort);

      const url = `/api/vehicles${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      console.log('🚀 Calling API vehicles:', url);
      
      const response = await get<unknown>(url);
      
      console.log('✅ API vehicles response:', response);
      return {
        success: true,
        message: 'Lấy danh sách xe thành công',
        data: response
      };
    } catch (error: any) {
      console.error('❌ Lỗi khi gọi API vehicles:', error);
      return {
        success: false,
        message: error.message || 'Không thể tải danh sách xe'
      };
    }
  },

  async getVehicleById(vehicleId: string): Promise<{ success: boolean; message: string; data?: unknown }> {
    try {
      const url = `/api/vehicles/${vehicleId}`;
      console.log('🚀 Calling API vehicle by ID:', url);
      
      const response = await get<unknown>(url);
      
      console.log('✅ API vehicle by ID response:', response);
      
      // Kiểm tra cấu trúc response
      if (response && typeof response === 'object') {
        const responseObj = response as Record<string, unknown>;
        
        // Nếu response có data field
        if (responseObj.data) {
          return {
            success: true,
            message: 'Lấy thông tin xe thành công',
            data: responseObj.data
          };
        }
        
        // Nếu response trực tiếp là data
        return {
          success: true,
          message: 'Lấy thông tin xe thành công',
          data: response
        };
      }
      
      return {
        success: false,
        message: 'Dữ liệu không hợp lệ'
      };
    } catch (error: any) {
      console.error('❌ Lỗi khi gọi API vehicle by ID:', error);
      return {
        success: false,
        message: error.message || 'Không thể tải thông tin xe'
      };
    }
  }
};