import { get, post, put, del } from './httpClient';

// Interfaces for Payment APIs
export interface Payment {
  _id: string;
  order_id: string;
  customer_id: string;
  amount: number;
  method: 'cash' | 'bank' | 'qr' | 'card';
  reference: string;
  paid_at: string;
  notes?: string;
  is_deleted: boolean;
  deleted_at?: string;
  deleted_by?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentRequest {
  order_id: string;
  amount: number;
  method: 'cash' | 'bank' | 'qr' | 'card';
  notes?: string;
}

export interface UpdatePaymentRequest {
  notes?: string;
}

export interface PaymentResponse {
  success: boolean;
  message: string;
  data: {
    payment: Payment;
    order: {
      _id: string;
      code: string;
      status: string;
      final_amount: number;
      paid_amount: number;
    };
    debt?: {
      _id: string;
      status: string;
      remaining_amount: number;
    };
  };
}

export interface PaymentListResponse {
  success: boolean;
  message: string;
  data: {
    data: Payment[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

// Bank Profile for Installment
export interface BankProfile {
  _id: string;
  customer_id: string;
  order_id: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
  branch: string;
  documents: Array<{
    name: string;
    type: string;
    file_url: string;
    uploaded_at: string;
  }>;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateBankProfileRequest {
  customer_id: string;
  order_id: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
  branch: string;
  documents: Array<{
    name: string;
    type: string;
    file_url: string;
  }>;
  notes?: string;
}

// Debt tracking
export interface Debt {
  _id: string;
  customer_id: string;
  order_id: string;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  status: 'open' | 'partial' | 'settled';
  due_date?: string;
  created_at: string;
  updated_at: string;
}

// Payment Service APIs
export const paymentService = {
  // Create new payment
  async createPayment(paymentData: CreatePaymentRequest): Promise<PaymentResponse> {
    return post<PaymentResponse>('/api/payments', paymentData);
  },

  // Get payment by ID
  async getPaymentById(paymentId: string): Promise<PaymentResponse> {
    return get<PaymentResponse>(`/api/payments/${paymentId}`);
  },

  // Get payments by order ID
  async getPaymentsByOrder(orderId: string): Promise<PaymentListResponse> {
    return get<PaymentListResponse>(`/api/payments/order/${orderId}`);
  },

  // Update payment (only notes)
  async updatePayment(paymentId: string, updateData: UpdatePaymentRequest): Promise<PaymentResponse> {
    return put<PaymentResponse>(`/api/payments/${paymentId}`, updateData);
  },

  // Delete payment (soft delete)
  async deletePayment(paymentId: string): Promise<{ success: boolean; message: string }> {
    return del(`/api/payments/${paymentId}`);
  },

  // Bank Profile APIs for Installment
  async createBankProfile(bankData: CreateBankProfileRequest): Promise<{
    success: boolean;
    message: string;
    data: BankProfile;
  }> {
    return post('/api/bank-profiles', bankData);
  },

  async getBankProfileByOrder(orderId: string): Promise<{
    success: boolean;
    message: string;
    data: BankProfile;
  }> {
    return get(`/api/bank-profiles/order/${orderId}`);
  },

  async updateBankProfileStatus(profileId: string, status: 'approved' | 'rejected', notes?: string): Promise<{
    success: boolean;
    message: string;
    data: BankProfile;
  }> {
    return put(`/api/bank-profiles/${profileId}/status`, { status, notes });
  },

  // Debt tracking APIs
  async getDebtByOrder(orderId: string): Promise<{
    success: boolean;
    message: string;
    data: Debt;
  }> {
    return get(`/api/debts/order/${orderId}`);
  },

  async getCustomerDebts(customerId: string): Promise<{
    success: boolean;
    message: string;
    data: {
      data: Debt[];
      pagination: any;
    };
  }> {
    return get(`/api/debts/customer/${customerId}`);
  },

  // Invoice generation
  async generateInvoice(orderId: string): Promise<{
    success: boolean;
    message: string;
    data: {
      invoice_url: string;
      invoice_number: string;
    };
  }> {
    return post(`/api/orders/${orderId}/generate-invoice`);
  },

  // Download invoice
  async downloadInvoice(orderId: string): Promise<Blob> {
    const response = await fetch(`/api/orders/${orderId}/download-invoice`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to download invoice');
    }
    
    return response.blob();
  },

  // Payment statistics
  async getPaymentStats(): Promise<{
    success: boolean;
    data: {
      total_payments: number;
      total_amount: number;
      monthly_amount: number;
      pending_payments: number;
      completed_payments: number;
    };
  }> {
    return get('/api/payments/stats');
  }
};

export default paymentService;
