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

  // Generate contract PDF (using existing API)
  async generateContractPDF(orderId: string): Promise<Blob> {
    const token = localStorage.getItem('accessToken');
    console.log('Token exists:', !!token);
    console.log('Token preview:', token ? token.substring(0, 20) + '...' : 'No token');
    
    if (!token) {
      throw new Error('No authentication token found. Please login again.');
    }
    
    const response = await fetch(`http://localhost:5000/api/contracts/orders/${orderId}/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        template_name: 'default',
        template_data: {
          location: 'Thành phố Hồ Chí Minh',
          dealership: {
            name: 'VinFast Dealership',
            address: '123 Đường ABC, Quận 1, TP.HCM',
            phone: '1900 1234',
            tax_code: '0123456789'
          },
          downPayment: 0
        }
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', response.status, errorText);
      
        if (response.status === 401) {
          // Token invalid, clear it and redirect to login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
          throw new Error('Authentication token expired. Please login again.');
        }
      
      throw new Error(`Failed to generate contract PDF: ${response.status} ${errorText}`);
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
