import { get } from './httpClient';

export interface VehicleOption {
  _id: string;
  name: string;
  description?: string;
  price?: number;
  is_active?: boolean;
  is_deleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface OptionListResponse {
  success?: boolean;
  message?: string;
  data?: unknown;
  items?: VehicleOption[];
  records?: VehicleOption[];
  results?: VehicleOption[];
}

const extractOptions = (response: unknown): VehicleOption[] => {
  if (!response) return [];

  if (Array.isArray(response)) {
    return response as VehicleOption[];
  }

  if (typeof response === 'object') {
    const obj = response as Record<string, unknown>;

    const candidates: unknown[] = [obj.data, obj.items, obj.records, obj.results];

    for (const candidate of candidates) {
      if (!candidate) continue;

      if (Array.isArray(candidate)) {
        return candidate as VehicleOption[];
      }

      if (typeof candidate === 'object') {
        const nested = candidate as Record<string, unknown>;
        const deepCandidates = [nested.data, nested.items, nested.records, nested.results];
        for (const deepCandidate of deepCandidates) {
          if (!deepCandidate) continue;
          if (Array.isArray(deepCandidate)) {
            return deepCandidate as VehicleOption[];
          }
          if (typeof deepCandidate === 'object') {
            const deeper = deepCandidate as Record<string, unknown>;
            const deeperValues = [deeper.data, deeper.items, deeper.records, deeper.results];
            for (const value of deeperValues) {
              if (Array.isArray(value)) {
                return value as VehicleOption[];
              }
            }
          }
        }
      }
    }
  }

  return [];
};

export const optionService = {
  async getOptions(active?: boolean): Promise<VehicleOption[]> {
    try {
      const params = active !== undefined ? `?active=${active}` : '';
      console.log(`📡 Fetching options from /api/options${params}`);
      const response = await get<OptionListResponse | VehicleOption[]>(`/api/options${params}`);
      console.log('📦 Options API raw response:', JSON.stringify(response, null, 2));
      const parsed = extractOptions(response);
      console.log('📦 Parsed options:', parsed);
      console.log(`✅ Found ${parsed.length} options`);
      return parsed;
    } catch (error) {
      console.error('❌ Error fetching options:', error);
      // Return empty array instead of throwing to prevent blocking
      return [];
    }
  }
};

export default optionService;

