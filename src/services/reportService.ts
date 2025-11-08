import { get } from './httpClient';

export interface TopSellingProduct {
  vehicle_id: string;
  vehicle_name: string;
  total_sold: number;
  total_revenue: number;
  image?: string;
}

export interface DealerStock {
  _id: string;
  dealership_name: string;
  total_stock?: number;
  totalVehicles?: number;
  details?: Array<{
    vehicle_name: string;
    color: string;
    quantity: number;
    remaining_quantity: number;
  }>;
  vehicles?: Array<{
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

export interface SalesByDealership {
  dealership_id: string;
  dealership_name: string;
  total_revenue: number;
  total_orders: number;
  total_vehicles_sold: number;
}

export interface SalesByDealershipResponse {
  success?: boolean;
  message?: string;
  data?: SalesByDealership[];
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
      const response = await get<any>(
        '/api/reports/dealer-stock'
      );

      console.log('📦 Dealer stock response:', JSON.stringify(response, null, 2));

      // Handle different response structures
      // Case 1: Direct array
      if (Array.isArray(response)) {
        console.log('✅ Response is array, returning directly');
        return response;
      }

      // Case 2: { status, success, message, data: [...] }
      if (response?.data && Array.isArray(response.data)) {
        console.log('✅ Response has data array, returning response.data');
        return response.data;
      }

      // Case 3: { success, data: { data: [...] } } - nested structure
      if (response?.data?.data && Array.isArray(response.data.data)) {
        console.log('✅ Response has nested data.data array, returning response.data.data');
        return response.data.data;
      }

      // Case 4: Response wrapper with success/message
      if (response && typeof response === 'object') {
        // Try to find any array in the response
        for (const key in response) {
          if (Array.isArray(response[key])) {
            console.log(`✅ Found array in response.${key}, returning it`);
            return response[key];
          }
        }
      }

      console.warn('⚠️ Unexpected response structure for dealer-stock:', response);
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

  /**
   * Get sales by dealership
   * @param startDate - Start date (YYYY-MM-DD)
   * @param endDate - End date (YYYY-MM-DD)
   * @param dealership_id - Optional dealership ID to filter
   */
  async getSalesByDealership(
    startDate: string,
    endDate: string,
    dealership_id?: string
  ): Promise<SalesByDealership[]> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('startDate', startDate);
      queryParams.append('endDate', endDate);
      if (dealership_id) {
        queryParams.append('dealership_id', dealership_id);
      }

      console.log(`📡 Fetching sales by dealership from /api/reports/sales?${queryParams.toString()}`);
      const response = await get<any>(
        `/api/reports/sales?${queryParams.toString()}`
      );

      console.log('📦 Sales response:', response);

      // Handle different response structures
      if (Array.isArray(response)) {
        // If response is array, need to group by dealership
        const groupedByDealership: { [key: string]: SalesByDealership } = {};
        
        response.forEach((item: any) => {
          const dealershipId = item.dealership_id || item._id?.dealership || 'unknown';
          const dealershipName = item.dealership_name || item.dealership?.company_name || 'Unknown';
          
          if (!groupedByDealership[dealershipId]) {
            groupedByDealership[dealershipId] = {
              dealership_id: dealershipId,
              dealership_name: dealershipName,
              total_revenue: 0,
              total_orders: 0,
              total_vehicles_sold: 0
            };
          }
          
          groupedByDealership[dealershipId].total_revenue += item.totalRevenue || item.total_revenue || 0;
          groupedByDealership[dealershipId].total_vehicles_sold += item.totalQuantity || item.total_quantity || 0;
          groupedByDealership[dealershipId].total_orders += 1;
        });
        
        return Object.values(groupedByDealership);
      }

      // Handle { status, success, message, data: [...] }
      if (response?.data && Array.isArray(response.data)) {
        // Group by dealership if needed
        const groupedByDealership: { [key: string]: SalesByDealership } = {};
        
        response.data.forEach((item: any) => {
          const dealershipId = item.dealership_id || item._id?.dealership || 'unknown';
          const dealershipName = item.dealership_name || item.dealership?.company_name || 'Unknown';
          
          if (!groupedByDealership[dealershipId]) {
            groupedByDealership[dealershipId] = {
              dealership_id: dealershipId,
              dealership_name: dealershipName,
              total_revenue: 0,
              total_orders: 0,
              total_vehicles_sold: 0
            };
          }
          
          groupedByDealership[dealershipId].total_revenue += item.totalRevenue || item.total_revenue || 0;
          groupedByDealership[dealershipId].total_vehicles_sold += item.totalQuantity || item.total_quantity || 0;
          groupedByDealership[dealershipId].total_orders += 1;
        });
        
        return Object.values(groupedByDealership);
      }

      // Handle { success, data: { data: [...] } }
      if (response?.data?.data && Array.isArray(response.data.data)) {
        const groupedByDealership: { [key: string]: SalesByDealership } = {};
        
        response.data.data.forEach((item: any) => {
          const dealershipId = item.dealership_id || item._id?.dealership || 'unknown';
          const dealershipName = item.dealership_name || item.dealership?.company_name || 'Unknown';
          
          if (!groupedByDealership[dealershipId]) {
            groupedByDealership[dealershipId] = {
              dealership_id: dealershipId,
              dealership_name: dealershipName,
              total_revenue: 0,
              total_orders: 0,
              total_vehicles_sold: 0
            };
          }
          
          groupedByDealership[dealershipId].total_revenue += item.totalRevenue || item.total_revenue || 0;
          groupedByDealership[dealershipId].total_vehicles_sold += item.totalQuantity || item.total_quantity || 0;
          groupedByDealership[dealershipId].total_orders += 1;
        });
        
        return Object.values(groupedByDealership);
      }

      // Handle SalesByDealershipResponse structure
      const responseObj = response as SalesByDealershipResponse;
      if (responseObj.data && Array.isArray(responseObj.data)) {
        return responseObj.data;
      }

      console.warn('⚠️ Unexpected response structure for sales:', response);
      return [];
    } catch (error) {
      console.error('❌ Error fetching sales by dealership:', error);
      throw error;
    }
  },
};

