import httpClient from "./httpClient";

export interface Manufacturer {
  _id: string;
  name: string;
  code?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Dealership {
  _id: string;
  name: string;
  location?: string;
  address?: string;
  phone?: string;
  email?: string;
  manufacturer_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Role {
  _id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: {
    data: {
      data: T;
    };
  };
  message?: string;
}

class OrganizationService {
  // Get all manufacturers
  async getManufacturers(): Promise<ApiResponse<Manufacturer[]>> {
    try {
      const response = await httpClient.get("/api/manufacturers");
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        data: { data: { data: [] } },
        message: error.message || "Lỗi khi tải danh sách nhà sản xuất",
      };
    }
  }

  // Get all dealerships
  async getDealerships(): Promise<ApiResponse<Dealership[]>> {
    try {
      const response = await httpClient.get("/api/dealerships");
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        data: { data: { data: [] } },
        message: error.message || "Lỗi khi tải danh sách đại lý",
      };
    }
  }

  // Get all roles
  async getRoles(): Promise<ApiResponse<Role[]>> {
    try {
      const response = await httpClient.get("/api/roles");
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        data: { data: { data: [] } },
        message: error.message || "Lỗi khi tải danh sách vai trò",
      };
    }
  }
}

export const organizationService = new OrganizationService();
