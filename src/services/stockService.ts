import { get } from './httpClient';

export interface VehicleStock {
  vehicle: {
    id: string;
    name: string;
    model: string;
    category: string;
    sku: string;
    manufacturer: {
      _id: string;
      name: string;
    };
    price: number;
  };
  summary: {
    total_quantity: number;
    total_sold: number;
    total_remaining: number;
    batches_count: number;
  };
  stocks_by_color: Array<{
    color: string;
    total_quantity: number;
    total_sold: number;
    total_remaining: number;
  }>;
}

export interface VehicleStockResponse {
  success: boolean;
  message: string;
  data: {
    data: VehicleStock[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    dealership_id: string;
  };
}

export interface VehicleStockParams {
  vehicle_id?: string;
  category?: 'car' | 'motorbike';
  color?: string;
  status?: 'active' | 'depleted' | 'reserved';
  manufacturer_id?: string;
  page?: number;
  limit?: number;
}

export const stockService = {
  /**
   * Get vehicle stock by dealership (for dealer users)
   */
  async getMyStock(params?: VehicleStockParams): Promise<VehicleStockResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.vehicle_id) queryParams.append('vehicle_id', params.vehicle_id);
      if (params?.category) queryParams.append('category', params.category);
      if (params?.color) queryParams.append('color', params.color);
      if (params?.status) queryParams.append('status', params.status);
      if (params?.manufacturer_id) queryParams.append('manufacturer_id', params.manufacturer_id);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const url = `/api/vehicles/stock/my-stock${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      console.log('🚀 Fetching dealer stock from:', url);
      
      const response = await get<VehicleStockResponse>(url);
      console.log('✅ Dealer stock fetched successfully:', response);
      
      return response;
    } catch (error) {
      console.error('❌ Error fetching dealer stock:', error);
      throw error;
    }
  },
};

