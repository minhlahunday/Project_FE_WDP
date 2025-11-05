import { get, post, put, patch, del } from "./httpClient";
import { Order as OrderType } from "../types/index";

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
  status: "active" | "expired" | "converted";
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

// Status History interfaces
export interface StatusHistoryEvent {
  timestamp: string;
  old_status: string;
  new_status: string;
  status_label: string;
  changed_by: {
    _id?: string;
    full_name?: string;
    role?: string;
  };
  notes: string;
  elapsed_time: string;
}

export interface OrderStatusHistory {
  order_code: string;
  current_status: string;
  total_events: number;
  timeline: StatusHistoryEvent[];
}

export interface CreateOrderRequest {
  customer_id: string;
  payment_method?: "cash" | "installment";
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

// Order Request Interfaces
export interface OrderRequestItem {
  vehicle_id: string;
  vehicle_name?: string;
  manufacturer_id?: string;
  color?: string;
  quantity: number;
  notes?: string;
  _id?: string;
}

export interface CreateOrderRequestData {
  items: OrderRequestItem[];
  notes?: string;
}

export interface OrderRequest {
  _id: string;
  code: string;
  dealer_staff_id: string;
  requested_by?: {
    _id: string;
    full_name: string;
    email: string;
  };
  items: OrderRequestItem[];
  notes?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  updatedAt: string;
  // Additional fields from API
  approved_by?: string;
  rejected_by?: string;
  approved_at?: string;
  dealership_id?: any;
  is_deleted?: boolean;
  order_id?: any; // Order ID when request is converted to order
  __v?: number;
  // Populated fields
  dealer_staff?: {
    _id: string;
    full_name: string;
    email: string;
  };
}

export interface OrderRequestListResponse {
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
    data: any[]; // Use any[] for raw API response, will be mapped in component
  };
}

export interface OrderRequestResponse {
  success: boolean;
  message: string;
  data: OrderRequest;
}

export interface OrderRequestSearchParams {
  page?: number;
  limit?: number;
  q?: string;
  status?: "pending" | "approved" | "rejected";
  startDate?: string;
  endDate?: string;
}

// Order Request History Interfaces
export interface OrderRequestHistoryEvent {
  _id: string;
  timestamp: string;
  status_change?: {
    from: string;
    to: string;
  };
  changed_by?: {
    _id: string;
    full_name: string;
    role: string;
  };
  reason?: string;
  notes?: string;
  is_current?: boolean;
}

export interface OrderRequestHistoryResponse {
  success: boolean;
  message: string;
  data: {
    order_code?: string;
    request_id?: string;
    current_status: string;
    total_events?: number;
    timeline: Array<{
      _id: string;
      timestamp: string;
      old_status?: string;
      new_status: string;
      status_label?: string;
      old_delivery_status?: string | null;
      new_delivery_status?: string | null;
      changed_by?: {
        _id: string;
        email?: string;
        full_name?: string;
        role?: string;
      };
      reason?: string;
      notes?: string;
      elapsed_time?: string;
    }>;
  };
}

// Order Service APIs
export const orderService = {
  // Get all orders with search and pagination
  async getOrders(params?: OrderSearchParams): Promise<OrderListResponse> {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.q) queryParams.append("q", params.q);
    if (params?.status) queryParams.append("status", params.status);
    if (params?.customer_id)
      queryParams.append("customer_id", params.customer_id);
    if (params?.salesperson_id)
      queryParams.append("salesperson_id", params.salesperson_id);
    if (params?.payment_method)
      queryParams.append("payment_method", params.payment_method);
    if (params?.startDate) queryParams.append("startDate", params.startDate);
    if (params?.endDate) queryParams.append("endDate", params.endDate);
    // Legacy support
    if (params?.start_date) queryParams.append("startDate", params.start_date);
    if (params?.end_date) queryParams.append("endDate", params.end_date);

    const url = `/api/orders${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;
    return get<OrderListResponse>(url);
  },

  // Get orders for current user (salesperson)
  async getMyOrders(params?: OrderSearchParams): Promise<OrderListResponse> {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.q) queryParams.append("q", params.q);
    if (params?.status) queryParams.append("status", params.status);
    if (params?.customer_id)
      queryParams.append("customer_id", params.customer_id);
    if (params?.payment_method)
      queryParams.append("payment_method", params.payment_method);
    if (params?.startDate) queryParams.append("startDate", params.startDate);
    if (params?.endDate) queryParams.append("endDate", params.endDate);
    // Legacy support
    if (params?.start_date) queryParams.append("startDate", params.start_date);
    if (params?.end_date) queryParams.append("endDate", params.end_date);

    const url = `/api/orders/yourself${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;
    return get<OrderListResponse>(url);
  },

  // Get order by ID
  async getOrderById(orderId: string): Promise<OrderResponse> {
    return get<OrderResponse>(`/api/orders/${orderId}`);
  },

  // Create new order
  async createOrder(orderData: CreateOrderRequest): Promise<OrderResponse> {
    return post<OrderResponse>("/api/orders", orderData);
  },

  // Update order status
  async updateOrderStatus(
    orderId: string,
    status: string,
    notes?: string
  ): Promise<OrderResponse> {
    return put<OrderResponse>(`/api/orders/${orderId}/status`, {
      status,
      notes,
    });
  },

  // Update order
  async updateOrder(
    orderId: string,
    orderData: Partial<CreateOrderRequest>
  ): Promise<OrderResponse> {
    return put<OrderResponse>(`/api/orders/${orderId}`, orderData);
  },

  // Delete order (if allowed)
  async deleteOrder(
    orderId: string
  ): Promise<{ success: boolean; message: string }> {
    return del(`/api/orders/${orderId}`);
  },

  // Convert quote to order
  async convertQuoteToOrder(
    quoteId: string,
    additionalData?: Partial<CreateOrderRequest>
  ): Promise<OrderResponse> {
    return post<OrderResponse>(
      `/api/quotes/${quoteId}/convert-to-order`,
      additionalData || {}
    );
  },

  // Upload contract image (signed contract)
  async uploadContractImage(
    orderId: string,
    imageFile: File
  ): Promise<OrderResponse> {
    const formData = new FormData();
    formData.append("contract_image", imageFile);

    return post<OrderResponse>(
      `/api/orders/${orderId}/upload-contract`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
  },

  // Mark contract as signed
  async markContractSigned(orderId: string): Promise<OrderResponse> {
    return put<OrderResponse>(`/api/orders/${orderId}/sign-contract`, {
      contract_signed: true,
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
    return get("/api/orders/stats");
  },

  // Order Request APIs

  // Get all order requests (for manager to view all requests)
  async getOrderRequests(
    params?: OrderRequestSearchParams
  ): Promise<OrderRequestListResponse> {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.q) queryParams.append("q", params.q);
    if (params?.status) queryParams.append("status", params.status);
    if (params?.startDate) queryParams.append("startDate", params.startDate);
    if (params?.endDate) queryParams.append("endDate", params.endDate);

    const url = `/api/order-request${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;
    return get<OrderRequestListResponse>(url);
  },

  // Create new order request (for dealer staff)
  async createOrderRequest(
    requestData: CreateOrderRequestData
  ): Promise<OrderRequestResponse> {
    return post<OrderRequestResponse>("/api/order-request", requestData);
  },

  // Get order request by ID
  async getOrderRequestById(requestId: string): Promise<OrderRequestResponse> {
    return get<OrderRequestResponse>(`/api/order-request/${requestId}`);
  },

  // Approve order request (for manager)
  async approveOrderRequest(requestId: string): Promise<OrderRequestResponse> {
    return patch<OrderRequestResponse>(
      `/api/order-request/${requestId}/approve`
    );
  },

  // Reject order request (for manager)
  async rejectOrderRequest(
    requestId: string,
    reason: string
  ): Promise<OrderRequestResponse> {
    return patch<OrderRequestResponse>(
      `/api/order-request/${requestId}/reject`,
      {
        reason,
      }
    );
  },

  // Update order request (for staff to edit their request)
  async updateOrderRequest(
    requestId: string,
    requestData: Partial<CreateOrderRequestData>
  ): Promise<OrderRequestResponse> {
    return put<OrderRequestResponse>(
      `/api/order-request/${requestId}`,
      requestData
    );
  },

  // Delete order request (for staff to delete their pending request)
  async deleteOrderRequest(
    requestId: string
  ): Promise<{ success: boolean; message: string }> {
    return del(`/api/order-request/${requestId}`);
  },

  // Get order request history/timeline
  async getOrderRequestHistory(
    requestId: string
  ): Promise<OrderRequestHistoryResponse> {
    return get<OrderRequestHistoryResponse>(
      `/api/orders/${requestId}/status-history`
    );
  },
};

export default orderService;
