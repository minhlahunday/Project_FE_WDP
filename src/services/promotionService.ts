import { get } from "./httpClient";

export interface Promotion {
  _id: string;
  name: string;
  type?: string;
  value?: number;
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

const extractPromotions = (response: unknown): Promotion[] => {
  if (!response) return [];

  if (Array.isArray(response)) {
    return response as Promotion[];
  }

  if (typeof response === "object") {
    const obj = response as Record<string, unknown>;

    const candidates: unknown[] = [
      obj.data,
      obj.items,
      obj.records,
      obj.results,
    ];

    for (const candidate of candidates) {
      if (!candidate) continue;

      if (Array.isArray(candidate)) {
        return candidate as Promotion[];
      }

      if (typeof candidate === "object") {
        const nested = candidate as Record<string, unknown>;
        const deepCandidates = [
          nested.data,
          nested.items,
          nested.records,
          nested.results,
        ];

        for (const deepCandidate of deepCandidates) {
          if (!deepCandidate) continue;
          if (Array.isArray(deepCandidate)) {
            return deepCandidate as Promotion[];
          }
          if (typeof deepCandidate === "object") {
            const deeper = deepCandidate as Record<string, unknown>;
            const deeperValues = [
              deeper.data,
              deeper.items,
              deeper.records,
              deeper.results,
            ];

            for (const value of deeperValues) {
              if (Array.isArray(value)) {
                return value as Promotion[];
              }
            }
          }
        }
      }
    }
  }

  return [];
};

export const promotionService = {
  async getPromotions(active?: boolean): Promise<Promotion[]> {
    try {
      const params = active !== undefined ? `?active=${active}` : "";
      const response = await get<PromotionsApiResponse | Promotion[] | Record<string, unknown>>(
        `/api/promotions${params}`
      );
      const promotions = extractPromotions(response);
      console.log("📦 Promotions API raw response:", response);
      console.log("📦 Parsed promotions:", promotions);
      return promotions;
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
