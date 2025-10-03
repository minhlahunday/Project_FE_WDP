import React from "react";
import { UserCheck, UserX, Filter } from "lucide-react";

interface Staff {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  startDate: string;
  status: "active" | "inactive" | "pending";
  avatar?: string;
  salary: number;
  address: string;
}

interface StaffStatsProps {
  staffList: Staff[];
}

export const StaffStats: React.FC<StaffStatsProps> = ({ staffList }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Tổng nhân viên</p>
            <p className="text-2xl font-bold text-gray-900">
              {staffList.length}
            </p>
          </div>
          <div className="bg-blue-100 p-3 rounded-full">
            <UserCheck className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Không block</p>
            <p className="text-2xl font-bold text-green-600">
              {staffList.filter((s) => s.status === "active").length}
            </p>
          </div>
          <div className="bg-green-100 p-3 rounded-full">
            <UserCheck className="h-6 w-6 text-green-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Block</p>
            <p className="text-2xl font-bold text-red-600">
              {staffList.filter((s) => s.status === "inactive").length}
            </p>
          </div>
          <div className="bg-red-100 p-3 rounded-full">
            <UserX className="h-6 w-6 text-red-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Chờ duyệt</p>
            <p className="text-2xl font-bold text-yellow-600">
              {staffList.filter((s) => s.status === "pending").length}
            </p>
          </div>
          <div className="bg-yellow-100 p-3 rounded-full">
            <Filter className="h-6 w-6 text-yellow-600" />
          </div>
        </div>
      </div>
    </div>
  );
};
