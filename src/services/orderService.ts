import { get, post, put, del } from './httpClient';
import { Order as OrderType } from '../types/index';

// Interfaces for Order APIs
export interface Quote {
  _id: string;
  code: string;
  customer_id: string;
  items: OrderItem[];
  final_amount: number;
  notes?: string;
  valid_from: string;
  valid_to: string;
  status: 'active' | 'expired' | 'converted';
  createdAt: string;
  updatedAt: string;
  
  // Populated fields
  customer?: {
    _id: string;
    full_name: string;
    email: string;
    phone: string;
  };
}
export interface OrderItem {
  vehicle_id: string;
  vehicle_name?: string;
  vehicle_price?: number;
  color?: string;
  quantity: number;
  discount?: number;
  promotion_id?: string;
  options?: Array<{
    option_id: string;
    name: string;
    price: number;
  }>;
  accessories?: Array<{
    accessory_id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  final_amount: number;
}

// Use the Order type from types/index.ts
export type Order = OrderType;

export interface CreateOrderRequest {
  customer_id: string;
  payment_method?: 'cash' | 'installment';
  notes?: string;
  items: Array<{
    vehicle_id: string;
    quantity?: number;
    discount?: number;
    promotion_id?: string;
    color?: string;
    options?: string[];
    accessories?: Array<{
      accessory_id: string;
      quantity: number;
    }>;
  }>;
}

export interface OrderListResponse {
  success: boolean;
  message: string;
  data: {
    data: Order[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface OrderResponse {
  success: boolean;
  message: string;
  data: {
    order: Order;
  };
}

export interface OrderSearchParams {
  page?: number;
  limit?: number;
  q?: string; // search by order code, customer name, salesperson name
  status?: string;
  customer_id?: string;
  salesperson_id?: string;
  payment_method?: string;
  startDate?: string;
  endDate?: string;
  // Legacy support
  start_date?: string;
  end_date?: string;
}

// Order Service APIs
export const orderService = {
  // Get all orders with search and pagination
  async getOrders(params?: OrderSearchParams): Promise<OrderListResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.q) queryParams.append('q', params.q);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.customer_id) queryParams.append('customer_id', params.customer_id);
    if (params?.salesperson_id) queryParams.append('salesperson_id', params.salesperson_id);
    if (params?.payment_method) queryParams.append('payment_method', params.payment_method);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    // Legacy support
    if (params?.start_date) queryParams.append('startDate', params.start_date);
    if (params?.end_date) queryParams.append('endDate', params.end_date);

    const url = `/api/orders${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return get<OrderListResponse>(url);
  },

  // Get orders for current user (salesperson)
  async getMyOrders(params?: OrderSearchParams): Promise<OrderListResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.q) queryParams.append('q', params.q);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.customer_id) queryParams.append('customer_id', params.customer_id);
    if (params?.payment_method) queryParams.append('payment_method', params.payment_method);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    // Legacy support
    if (params?.start_date) queryParams.append('startDate', params.start_date);
    if (params?.end_date) queryParams.append('endDate', params.end_date);

    const url = `/api/orders/yourself${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return get<OrderListResponse>(url);
  },

  // Get order by ID
  async getOrderById(orderId: string): Promise<OrderResponse> {
    return get<OrderResponse>(`/api/orders/${orderId}`);
  },

  // Create new order
  async createOrder(orderData: CreateOrderRequest): Promise<OrderResponse> {
    return post<OrderResponse>('/api/orders', orderData);
  },

  // Update order status
  async updateOrderStatus(orderId: string, status: string, notes?: string): Promise<OrderResponse> {
    return put<OrderResponse>(`/api/orders/${orderId}/status`, { 
      status, 
      notes 
    });
  },

  // Update order
  async updateOrder(orderId: string, orderData: Partial<CreateOrderRequest>): Promise<OrderResponse> {
    return put<OrderResponse>(`/api/orders/${orderId}`, orderData);
  },

  // Delete order (if allowed)
  async deleteOrder(orderId: string): Promise<{ success: boolean; message: string }> {
    return del(`/api/orders/${orderId}`);
  },

  // Convert quote to order
  async convertQuoteToOrder(quoteId: string, additionalData?: Partial<CreateOrderRequest>): Promise<OrderResponse> {
    return post<OrderResponse>(`/api/quotes/${quoteId}/convert-to-order`, additionalData || {});
  },

  // Upload contract image (signed contract)
  async uploadContractImage(orderId: string, imageFile: File): Promise<OrderResponse> {
    const formData = new FormData();
    formData.append('contract_image', imageFile);
    
    return post<OrderResponse>(`/api/orders/${orderId}/upload-contract`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Mark contract as signed
  async markContractSigned(orderId: string): Promise<OrderResponse> {
    return put<OrderResponse>(`/api/orders/${orderId}/sign-contract`, {
      contract_signed: true
    });
  },

  // Get order statistics
  async getOrderStats(): Promise<{
    success: boolean;
    data: {
      total_orders: number;
      pending_orders: number;
      confirmed_orders: number;
      completed_orders: number;
      total_revenue: number;
      monthly_revenue: number;
    };
  }> {
    return get('/api/orders/stats');
  }
};

export default orderService;