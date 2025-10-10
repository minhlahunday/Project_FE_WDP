import { get, post, put } from "./httpClient";
import { Customer } from "../types";

export interface CreateCustomerRequest {
  full_name: string;
  phone: string;
  email: string;
  address: string;
}

export interface UpdateCustomerRequest {
  full_name: string;
  phone: string;
  email: string;
  address: string;
}

export interface CustomerResponse {
  _id: string;
  full_name: string;
  phone: string;
  email: string;
  address: string;
  dealership_id: string;
  createdAt: string;
  __v: number;
}

export interface CustomersApiResponse {
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
    data: CustomerResponse[];
  };
}

// Transform API response to internal Customer type
const transformCustomerResponse = (
  apiCustomer: CustomerResponse
): Customer => ({
  id: apiCustomer._id,
  name: apiCustomer.full_name,
  email: apiCustomer.email,
  phone: apiCustomer.phone,
  address: apiCustomer.address,
  testDrives: [],
  orders: [],
});

// Transform internal Customer type to API request
const transformToApiRequest = (
  customer: Partial<Customer>
): CreateCustomerRequest | UpdateCustomerRequest => ({
  full_name: customer.name || "",
  phone: customer.phone || "",
  email: customer.email || "",
  address: customer.address || "",
});

export const customerService = {
  // Lấy danh sách khách hàng thuộc đại lý (dealership)
  async getAllCustomers(q?: string): Promise<Customer[]> {
    try {
      const params = q ? `?q=${encodeURIComponent(q)}` : "";
      const response = await get<CustomersApiResponse>(
        `/api/customers${params}`
      );
      return response.data.data.map(transformCustomerResponse);
    } catch (error) {
      console.error("Error fetching customers:", error);
      throw error;
    }
  },

  // Lấy danh sách khách hàng đã sale bởi người dùng hiện tại
  async getYourCustomers(q?: string): Promise<Customer[]> {
    try {
      const params = q ? `?q=${encodeURIComponent(q)}` : "";
      const response = await get<CustomersApiResponse>(
        `/api/customers/yourself${params}`
      );
      return response.data.data.map(transformCustomerResponse);
    } catch (error) {
      console.error("Error fetching your customers:", error);
      throw error;
    }
  },

  // Lấy thông tin chi tiết khách hàng
  async getCustomerById(customerId: string): Promise<Customer> {
    try {
      const response = await get<{
        success: boolean;
        message: string;
        data: CustomerResponse;
      }>(`/api/customers/${customerId}`);
      return transformCustomerResponse(response.data);
    } catch (error) {
      console.error("Error fetching customer:", error);
      throw error;
    }
  },

  // Lấy tất cả thanh toán của khách hàng
  async getCustomerPayments(customerId: string): Promise<any[]> {
    try {
      const response = await get<{
        success: boolean;
        message: string;
        data: any[];
      }>(`/api/customers/${customerId}/payments`);
      return response.data;
    } catch (error) {
      console.error("Error fetching customer payments:", error);
      throw error;
    }
  },

  // Create a new customer
  async createCustomer(customerData: Partial<Customer>): Promise<Customer> {
    try {
      const apiRequest = transformToApiRequest(customerData);
      const response = await post<CustomerResponse>(
        "/api/customers",
        apiRequest
      );
      return transformCustomerResponse(response);
    } catch (error) {
      console.error("Error creating customer:", error);
      throw error;
    }
  },

  // Update an existing customer
  async updateCustomer(
    id: string,
    customerData: Partial<Customer>
  ): Promise<Customer> {
    try {
      const apiRequest = transformToApiRequest(customerData);
      const response = await put<CustomerResponse>(
        `/api/customers/${id}`,
        apiRequest
      );
      return transformCustomerResponse(response);
    } catch (error) {
      console.error("Error updating customer:", error);
      throw error;
    }
  },
};
