import {get, post, put, patch, del} from "./httpClient";

export interface TestDrive {
  _id: string;
  customer_id: string;
  vehicle_id: string;
  schedule_at: string;
  notes?: string;
  assigned_staff_id?: string;
  status: "pending" | "confirmed" | "completed" | "canceled";
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export const testDriveService = {
  async createTestDrive(data: {
    customer_id: string;
    vehicle_id: string;
    schedule_at: string;
    notes?: string;
  }) {
    return post("/api/testdrives", data);
  },
  async getTestDrives() {
    return get("/api/testdrives");
  },
  async getMyTestDrives() {
    return get("/api/testdrives/my");
  },
  async getCustomerTestDrives(customerId: string) {
    return get(`/api/testdrives/customer/${customerId}`);
  },
  async getTestDriveById(id: string) {
    return get(`/api/testdrives/${id}`);
  },
  async updateTestDrive(id: string, data: any) {
    return put(`/api/testdrives/${id}`, data);
  },
  async deleteTestDrive(id: string) {
    return del(`/api/testdrives/${id}`);
  },
  async assignStaff(id: string, assignedStaffId: string) {
    return patch(`/api/testdrives/${id}/assign`, {
      assigned_staff_id: assignedStaffId,
    });
  },
  async updateStatus(
    id: string,
    status: "pending" | "confirmed" | "completed" | "canceled"
  ) {
    return patch(`/api/testdrives/${id}/status`, {status});
  },
};
