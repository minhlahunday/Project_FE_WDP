import { get, post } from './httpClient';

export interface ManufacturerDebt {
  _id: string;
  dealership_id: any;
  manufacturer_id: any;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  status: 'open' | 'partial' | 'settled';
  items?: Array<{
    request_id: string;
    vehicle_id: string;
    vehicle_name: string;
    color: string;
    unit_price: number;
    quantity: number;
    amount: number;
    delivered_at: string;
    notes: string;
  }>;
  payments?: Array<{
    amount: number;
    paid_at: string;
    method: string;
    order_id: string;
    note: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface ManufacturerDebtListResponse {
  success: boolean;
  message: string;
  data: {
    data: ManufacturerDebt[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
    totalAmount: number;
    remainingAmount: number;
  };
}

export interface PaymentRequest {
  amount: number;
  method: string;
  notes?: string;
}

export const manufacturerDebtService = {
  /**
   * Get all manufacturer debts
   */
  async getManufacturerDebts(): Promise<ManufacturerDebtListResponse> {
    return get<ManufacturerDebtListResponse>('/api/debts/manufacturers');
  },

  /**
   * Record a payment for a debt
   */
  async recordPayment(debtId: string, payment: PaymentRequest): Promise<{ success: boolean; message: string; data?: any }> {
    return post(`/api/debts/manufacturers/${debtId}/payment`, payment);
  },

  /**
   * Get payment history for a debt
   */
  async getPaymentHistory(debtId: string): Promise<{ success: boolean; message: string; data?: any }> {
    return get(`/api/debts/manufacturers/${debtId}/payments`);
  },
};

