import { get } from './httpClient';

// User interface based on actual API response
export interface User {
  _id: string;
  full_name: string;
  avatar?: string;
  email: string;
  phone?: string;
  password: string;
  role_id: {
    _id: string;
    name: string;
  };
  dealership_id?: {
    _id: string;
    name: string;
  } | null;
  manufacturer_id?: {
    _id: string;
    name: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

// API Response structure
export interface UsersApiResponse {
  success: boolean;
  message: string;
  data: {
    page: number;
    limit: number;
    totalPages: number;
    totalRecords: number;
    sort: {
      createdAt: number;
    };
    data: User[];
  };
}

// Parameters for getting users
export interface GetUsersParams {
  dealership_id?: string;
  manufacturer_id?: string;
  role?: string;
  page?: number;
  limit?: number;
}

class UserService {
  // Get all users with optional filters
  async getUsers(params?: GetUsersParams): Promise<UsersApiResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.dealership_id) {
        queryParams.append('dealership_id', params.dealership_id);
      }
      if (params?.manufacturer_id) {
        queryParams.append('manufacturer_id', params.manufacturer_id);
      }
      if (params?.role) {
        queryParams.append('role', params.role);
      }
      if (params?.page) {
        queryParams.append('page', params.page.toString());
      }
      if (params?.limit) {
        queryParams.append('limit', params.limit.toString());
      }

      const url = `/api/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await get<UsersApiResponse>(url);
      
      return {
        success: true,
        message: 'Users fetched successfully',
        data: response.data || {
          page: 1,
          limit: 10,
          totalPages: 0,
          totalRecords: 0,
          sort: { createdAt: -1 },
          data: []
        }
      };
    } catch (error: any) {
      console.error('Error fetching users:', error);
      return {
        success: false,
        message: error?.message || 'Failed to fetch users',
        data: {
          page: 1,
          limit: 10,
          totalPages: 0,
          totalRecords: 0,
          sort: { createdAt: -1 },
          data: []
        }
      };
    }
  }
}

export const userService = new UserService();
