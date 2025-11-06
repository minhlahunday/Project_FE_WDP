import { get } from './httpClient';

export interface TopSellingProduct {
  vehicle_id: string;
  vehicle_name: string;
  total_sold: number;
  total_revenue: number;
  image?: string;
}

export interface DealerStock {
  dealership_id: string;
  dealership_name: string;
  total_stock: number;
  vehicles: Array<{
    vehicle_id: string;
    vehicle_name: string;
    quantity: number;
  }>;
}

export interface SalesByStaff {
  staff_id: string;
  staff_name: string;
  total_sales: number;
  total_revenue: number;
  order_count: number;
}

export interface TopSellingResponse {
  success?: boolean;
  message?: string;
  data?: TopSellingProduct[];
}

export interface DealerStockResponse {
  success?: boolean;
  message?: string;
  data?: DealerStock[];
}

export interface SalesByStaffResponse {
  success?: boolean;
  message?: string;
  data?: SalesByStaff[];
}

export const reportService = {
  /**
   * Get top selling products
   * @param startDate - Start date (YYYY-MM-DD)
   * @param endDate - End date (YYYY-MM-DD)
   * @param limit - Number of products to return (default: 5)
   */
  async getTopSelling(
    startDate: string,
    endDate: string,
    limit: number = 5
  ): Promise<TopSellingProduct[]> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('startDate', startDate);
      queryParams.append('endDate', endDate);
      queryParams.append('limit', limit.toString());

      console.log(`📡 Fetching top selling from /api/reports/top-selling?${queryParams.toString()}`);
      const response = await get<TopSellingResponse | TopSellingProduct[]>(
        `/api/reports/top-selling?${queryParams.toString()}`
      );

      // Handle different response structures
      if (Array.isArray(response)) {
        return response;
      }

      const responseObj = response as TopSellingResponse;
      if (responseObj.data && Array.isArray(responseObj.data)) {
        return responseObj.data;
      }

      console.warn('⚠️ Unexpected response structure for top-selling');
      return [];
    } catch (error) {
      console.error('❌ Error fetching top selling:', error);
      throw error;
    }
  },

  /**
   * Get dealer stock report
   */
  async getDealerStock(): Promise<DealerStock[]> {
    try {
      console.log('📡 Fetching dealer stock from /api/reports/dealer-stock');
      const response = await get<DealerStockResponse | DealerStock[]>(
        '/api/reports/dealer-stock'
      );

      // Handle different response structures
      if (Array.isArray(response)) {
        return response;
      }

      const responseObj = response as DealerStockResponse;
      if (responseObj.data && Array.isArray(responseObj.data)) {
        return responseObj.data;
      }

      console.warn('⚠️ Unexpected response structure for dealer-stock');
      return [];
    } catch (error) {
      console.error('❌ Error fetching dealer stock:', error);
      throw error;
    }
  },

  /**
   * Get sales by staff
   * @param startDate - Start date (YYYY-MM-DD)
   * @param endDate - End date (YYYY-MM-DD)
   */
  async getSalesByStaff(
    startDate: string,
    endDate: string
  ): Promise<SalesByStaff[]> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('startDate', startDate);
      queryParams.append('endDate', endDate);

      console.log(`📡 Fetching sales by staff from /api/reports/sales-by-staff?${queryParams.toString()}`);
      const response = await get<SalesByStaffResponse | SalesByStaff[]>(
        `/api/reports/sales-by-staff?${queryParams.toString()}`
      );

      // Handle different response structures
      if (Array.isArray(response)) {
        return response;
      }

      const responseObj = response as SalesByStaffResponse;
      if (responseObj.data && Array.isArray(responseObj.data)) {
        return responseObj.data;
      }

      console.warn('⚠️ Unexpected response structure for sales-by-staff');
      return [];
    } catch (error) {
      console.error('❌ Error fetching sales by staff:', error);
      throw error;
    }
  },
};

