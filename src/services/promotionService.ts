import { get } from "./httpClient";

export interface Promotion {
  _id: string;
  name: string;
  type: "gift" | "service" | "discount";
  value: number;
  description?: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  is_deleted: boolean;
  dealerships: string[];
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

export interface PromotionsApiResponse {
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
    data: Promotion[];
  };
}

export interface PromotionApiResponse {
  success: boolean;
  message: string;
  data: Promotion;
}

export const promotionService = {
  async getPromotions(active?: boolean): Promise<Promotion[]> {
    try {
      const params = active !== undefined ? `?active=${active}` : "";
      const response = await get<PromotionsApiResponse>(
        `/api/promotions${params}`
      );
      return response.data?.data || [];
    } catch (error) {
      console.error("Error fetching promotions:", error);
      throw error;
    }
  },

  async getPromotionById(id: string): Promise<Promotion> {
    try {
      const response = await get<PromotionApiResponse>(`/api/promotions/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching promotion:", error);
      throw error;
    }
  },
};
