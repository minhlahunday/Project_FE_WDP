import { get } from './httpClient';

// Interfaces for Debt APIs
export interface Debt {
  _id: string;
  dealership_id: string | {
    _id: string;
  };
  manufacturer_id?: {
    _id: string;
    name: string;
  };
  customer_id?: {
    id: string;
    full_name: string;
    email?: string;
    phone?: string;
  };
  debtor_id?: string;
  debtor_type?: 'customer' | 'manufacturer' | 'dealer';
  debtor_name?: string;
  debtor_email?: string;
  debtor_phone?: string;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  currency?: string;
  status: 'active' | 'paid' | 'overdue' | 'cancelled' | 'partial';
  due_date?: string;
  createdAt: string;
  updatedAt: string;
  description?: string;
  order_ids?: string[];
  
  // Items and payments from API response
  items?: Array<{
    _id: string;
    request_id?: string;
    vehicle_id: string;
    vehicle_name: string;
    color: string;
    unit_price: number;
    quantity: number;
    amount: number;
    delivered_at: string;
    notes?: string;
  }>;
  
  payments?: Array<{
    _id: string;
    amount: number;
    paid_at: string;
    method: string;
    order_id: string;
    note: string;
  }>;
  
  // Populated fields
  orders?: Array<{
    _id: string;
    code: string;
    final_amount: number;
    paid_amount: number;
    status: string;
    created_at: string;
  }>;
}

export interface DebtListResponse {
  success: boolean;
  message: string;
  data: {
    data: Debt[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface DebtResponse {
  success: boolean;
  message: string;
  data: {
    debt: Debt;
  };
}

// Some endpoints return the debt object at root of data without the "debt" key
export interface DebtResponseFlexible {
  success: boolean;
  message: string;
  data: Debt | { debt: Debt };
}

export interface DebtSearchParams {
  page?: number;
  limit?: number;
  q?: string; // search by debtor name, email, phone
  status?: string;
  debtor_type?: 'customer' | 'manufacturer' | 'dealer';
  start_date?: string;
  end_date?: string;
  min_amount?: number;
  max_amount?: number;
}

export interface DebtStats {
  total_debt: number;
  total_paid: number;
  total_remaining: number;
  overdue_count: number;
  active_count: number;
  paid_count: number;
  customer_debt: number;
  manufacturer_debt: number;
}

export interface DebtStatsResponse {
  success: boolean;
  message: string;
  data: {
    stats: DebtStats;
  };
}

// Debt Service APIs
export const debtService = {
  // Get all debts for logged-in dealer
  async getDebts(params?: DebtSearchParams): Promise<DebtListResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.q) queryParams.append('q', params.q);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.debtor_type) queryParams.append('debtor_type', params.debtor_type);
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    if (params?.min_amount) queryParams.append('min_amount', params.min_amount.toString());
    if (params?.max_amount) queryParams.append('max_amount', params.max_amount.toString());

    const url = `/api/debts${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return get<DebtListResponse>(url);
  },

  // Get customer debts
  async getCustomerDebts(params?: DebtSearchParams): Promise<DebtListResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.q) queryParams.append('q', params.q);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    if (params?.min_amount) queryParams.append('min_amount', params.min_amount.toString());
    if (params?.max_amount) queryParams.append('max_amount', params.max_amount.toString());

    const url = `/api/debts/customers${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return get<DebtListResponse>(url);
  },

  // Get manufacturer debts
  async getManufacturerDebts(params?: DebtSearchParams): Promise<DebtListResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.q) queryParams.append('q', params.q);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    if (params?.min_amount) queryParams.append('min_amount', params.min_amount.toString());
    if (params?.max_amount) queryParams.append('max_amount', params.max_amount.toString());

    const url = `/api/debts/manufacturers${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return get<DebtListResponse>(url);
  },

  // Get debt by ID
  async getDebtById(debtId: string): Promise<DebtResponse> {
    return get<DebtResponse>(`/api/debts/${debtId}`);
  },

  // ================= New endpoints aligned with backend swagger =================
  // Get dealer-manufacturer debts list (alias)
  async getDealerManufacturerDebts(params?: DebtSearchParams): Promise<DebtListResponse> {
    return this.getManufacturerDebts(params);
  },

  // Get dealer-manufacturer debt by id
  async getManufacturerDebtById(id: string): Promise<DebtResponseFlexible> {
    return get<DebtResponseFlexible>(`/api/debts/manufacturers/${id}`);
  },

  // Get dealer-manufacturer debt by RequestVehicle (batch)
  async getManufacturerDebtByRequest(requestId: string): Promise<DebtResponseFlexible> {
    return get<DebtResponseFlexible>(`/api/debts/manufacturers/request/${requestId}`);
  },

  // Get debts of customers belonging to the logged-in dealer (DEALER_MANAGER only)
  async getCustomerDebtsOfDealer(params?: DebtSearchParams): Promise<DebtListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.q) queryParams.append('q', params.q);
    if (params?.status) queryParams.append('status', params.status);
    const url = `/api/debts/customers-of-dealer${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return get<DebtListResponse>(url);
  },

  // Get customer debt by order id (DEALER_MANAGER only)
  async getCustomerDebtByOrder(orderId: string): Promise<DebtResponseFlexible> {
    return get<DebtResponseFlexible>(`/api/debts/customers/order/${orderId}`);
  },

  // Get debt statistics
  async getDebtStats(): Promise<DebtStatsResponse> {
    return get<DebtStatsResponse>('/api/debts/stats');
  },

  // Get debt by customer ID
  async getDebtByCustomerId(customerId: string): Promise<DebtResponse> {
    return get<DebtResponse>(`/api/debts/customers/${customerId}`);
  },
};

export default debtService;
