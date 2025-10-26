import { get } from './httpClient';

// Interface for Order Status History
export interface OrderStatusLog {
  _id: string;
  order_id: string;
  customer_id: string;
  dealership_id: string;
  old_status: string;
  new_status: string;
  old_delivery_status?: string;
  new_delivery_status?: string;
  changed_by: string;
  changed_by_name?: string;
  reason?: string;
  notes?: string;
  payment_info?: any;
  delivery_info?: any;
  created_at: string;
}

export interface OrderStatusHistoryResponse {
  success: boolean;
  message: string;
  data: {
    order_id: string;
    current_status: string;
    current_delivery_status?: string;
    timeline: Array<{
      id: string;
      timestamp: string;
      status_change?: {
        from: string;
        to: string;
      };
      delivery_status_change?: {
        from: string;
        to: string;
      };
      current_status?: string;
      current_delivery_status?: string;
      changed_by?: any;
      reason?: string;
      notes?: string;
      payment_info?: any;
      delivery_info?: any;
      is_current?: boolean;
    }>;
  };
}

export const orderHistoryService = {
  // Get order status history timeline
  async getOrderHistory(orderId: string): Promise<OrderStatusHistoryResponse> {
    return get<OrderStatusHistoryResponse>(`/api/order-status-logs/orders/${orderId}/history`);
  },

  // Get order status logs
  async getOrderStatusLogs(orderId: string, params?: { page?: number; limit?: number }): Promise<{
    success: boolean;
    message: string;
    data: {
      data: OrderStatusLog[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    };
  }> {
    return get(`/api/order-status-logs/orders/${orderId}`, { params });
  },
};

