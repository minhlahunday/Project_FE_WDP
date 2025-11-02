import { get } from './httpClient';

export interface Accessory {
  _id: string;
  name: string;
  description?: string;
  price?: number;
  is_active?: boolean;
  is_deleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface AccessoryListResponse {
  success?: boolean;
  message?: string;
  data?: unknown;
  items?: Accessory[];
  records?: Accessory[];
  results?: Accessory[];
}

const extractAccessories = (response: unknown): Accessory[] => {
  if (!response) return [];

  if (Array.isArray(response)) {
    return response as Accessory[];
  }

  if (typeof response === 'object') {
    const obj = response as Record<string, unknown>;

    const candidates: unknown[] = [obj.data, obj.items, obj.records, obj.results];

    for (const candidate of candidates) {
      if (!candidate) continue;

      if (Array.isArray(candidate)) {
        return candidate as Accessory[];
      }

      if (typeof candidate === 'object') {
        const nested = candidate as Record<string, unknown>;
        const deepCandidates = [nested.data, nested.items, nested.records, nested.results];
        for (const deepCandidate of deepCandidates) {
          if (!deepCandidate) continue;
          if (Array.isArray(deepCandidate)) {
            return deepCandidate as Accessory[];
          }
          if (typeof deepCandidate === 'object') {
            const deeper = deepCandidate as Record<string, unknown>;
            const deeperValues = [deeper.data, deeper.items, deeper.records, deeper.results];
            for (const value of deeperValues) {
              if (Array.isArray(value)) {
                return value as Accessory[];
              }
            }
          }
        }
      }
    }
  }

  return [];
};

export const accessoryService = {
  async getAccessories(active?: boolean): Promise<Accessory[]> {
    try {
      const params = active !== undefined ? `?active=${active}` : '';
      console.log(`📡 Fetching accessories from /api/accessories${params}`);
      const response = await get<AccessoryListResponse | Accessory[]>(`/api/accessories${params}`);
      console.log('📦 Accessories API raw response:', JSON.stringify(response, null, 2));
      const parsed = extractAccessories(response);
      console.log('📦 Parsed accessories:', parsed);
      console.log(`✅ Found ${parsed.length} accessories`);
      return parsed;
    } catch (error) {
      console.error('❌ Error fetching accessories:', error);
      // Return empty array instead of throwing to prevent blocking
      return [];
    }
  }
};

export default accessoryService;

