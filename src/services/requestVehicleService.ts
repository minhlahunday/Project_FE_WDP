import {get, patch, post, del, request} from "./httpClient";

// Interface for Vehicle Request
export interface VehicleRequest {
  _id: string;
  vehicle_id: any;
  dealership_id: any;
  manufacturer_id: string;
  quantity: number;
  color: string;
  status: "pending" | "approved" | "in_progress" | "delivered" | "rejected";
  notes?: string;
  requested_at: string;
  approved_at?: string;
  rejected_at?: string;
  delivered_at?: string;
  approved_by?: any;
  rejected_by?: any;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleRequestResponse {
  success: boolean;
  message: string;
  data: VehicleRequest;
}

export interface VehicleRequestListResponse {
  success: boolean;
  message: string;
  data: {
    data: VehicleRequest[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export const requestVehicleService = {
  // Get all vehicle requests
  async getVehicleRequests(params?: {
    page?: number;
    limit?: number;
    status?: string;
    dealership_id?: string;
    vehicle_id?: string;
  }): Promise<VehicleRequestListResponse> {
    return get<VehicleRequestListResponse>(
      "/api/request-vehicles",
      params ? ({params} as any) : undefined
    );
  },
  async getVehicleRequestsByOrderRequest(
    orderRequestId: string
  ): Promise<VehicleRequestResponse> {
    return get<VehicleRequestResponse>(
      `/api/request-vehicles/by-order-request/${orderRequestId}`
    );
  },
  // Approve vehicle request (EVM Staff)
  async approveRequest(requestId: string): Promise<VehicleRequestResponse> {
    return patch<VehicleRequestResponse>(
      `/api/request-vehicles/${requestId}/approve`
    );
  },

  // In-progress vehicle request (EVM Staff)
  async inProgressRequest(requestId: string): Promise<VehicleRequestResponse> {
    return patch<VehicleRequestResponse>(
      `/api/request-vehicles/${requestId}/in-progress`
    );
  },

  // Reject vehicle request (EVM Staff)
  async rejectRequest(
    requestId: string,
    notes?: string
  ): Promise<VehicleRequestResponse> {
    return patch<VehicleRequestResponse>(
      `/api/request-vehicles/${requestId}/reject`,
      {notes}
    );
  },

  // Update delivery status (EVM Staff)
  async deliveredRequest(
    requestId: string,
    notes?: string
  ): Promise<VehicleRequestResponse> {
    return patch<VehicleRequestResponse>(
      `/api/request-vehicles/${requestId}/delivered`,
      {notes}
    );
  },

  // Delete request (Manager only)
  async deleteRequest(
    requestId: string
  ): Promise<{success: boolean; message: string}> {
    return del(`/api/request-vehicles/${requestId}`);
  },
};
