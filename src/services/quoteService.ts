import { get, post, put, del } from './httpClient';

// Interfaces for Quote APIs
export interface QuoteItem {
  vehicle_id: string;
  vehicle_name?: string;
  vehicle_price?: number;
  color?: string;
  quantity: number;
  discount?: number;
  promotion_id?: string;
  accessories?: Array<{
    accessory_id: string;
    name?: string;
    price?: number;
    quantity: number;
  }>;
  options?: Array<{
    option_id: string;
    name?: string;
    price?: number;
  }>;
  final_amount?: number;
}

export interface Quote {
  _id: string;
  code: string;
  customer_id: string;
  items: QuoteItem[];
  final_amount: number;
  status: 'valid' | 'expired' | 'canceled' | 'converted';
  startDate: string;
  endDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  customer?: {
    _id: string;
    full_name: string;
    email: string;
    phone: string;
    address?: string;
  };
}

export interface QuoteSearchParams {
  q?: string; // keyword search
  customer_id?: string; // Filter quotes by specific customer
  page?: number;
  limit?: number;
  status?: string;
}

export interface QuoteResponse {
  success?: boolean;
  message?: string;
  data?: Quote | Quote[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  // Direct paginated response fields
  page?: number;
  limit?: number;
  totalPages?: number;
  totalRecords?: number;
  total?: number;
  sort?: any;
}

export interface CreateQuoteRequest {
  customer_id: string;
  items: Array<{
    vehicle_id: string;
    quantity?: number;
    discount?: number;
    promotion_id?: string;
    options?: Array<{ option_id: string }>;
    accessories?: Array<{ accessory_id: string; quantity: number }>;
    color?: string;
  }>;
  notes?: string;
}

export interface UpdateQuoteRequest {
  items?: Array<{
    vehicle_id: string;
    quantity?: number;
    discount?: number;
    promotion_id?: string;
    options?: Array<{ option_id: string }>;
    accessories?: Array<{ accessory_id: string; quantity: number }>;
    color?: string;
  }>;
  notes?: string;
  status?: 'valid' | 'expired' | 'canceled' | 'converted';
}

// Quote service functions
export const quoteService = {
  // Get all quotes with pagination and search
  async getQuotes(params?: QuoteSearchParams): Promise<QuoteResponse> {
    const queryParams = new URLSearchParams();
    if (params?.q) queryParams.append('q', params.q);
    if (params?.customer_id) queryParams.append('customer_id', params.customer_id);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);

    const response = await get(`/api/quotes?${queryParams.toString()}`);
    return response.data;
  },

  // Get quote by ID
  async getQuoteById(id: string): Promise<QuoteResponse> {
    const response = await get(`/api/quotes/${id}`);
    return response.data;
  },

  // Create new quote
  async createQuote(quoteData: CreateQuoteRequest): Promise<QuoteResponse> {
    const response = await post('/api/quotes', quoteData);
    return response.data;
  },

  // Update quote
  async updateQuote(id: string, updateData: UpdateQuoteRequest): Promise<QuoteResponse> {
    const response = await put(`/api/quotes/${id}`, updateData);
    return response.data;
  },

  // Delete quote (soft delete)
  async deleteQuote(id: string): Promise<QuoteResponse> {
    const response = await del(`/api/quotes/${id}`);
    return response.data;
  },

  // Export quote as PDF
  async exportQuotePDF(id: string): Promise<Blob> {
    const response = await get(`/api/quotes/${id}/export`, {
      responseType: 'blob'
    });
    return response.data;
  }
};

export default quoteService;
