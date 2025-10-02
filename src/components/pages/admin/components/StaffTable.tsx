import React from "react";
import { UserCheck, UserX, Trash2 } from "lucide-react";

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

interface StaffTableProps {
  filteredStaff: Staff[];
  onToggleStatus: (staffId: string) => void;
  onDeleteStaff: (staffId: string) => void;
}

export const StaffTable: React.FC<StaffTableProps> = ({
  filteredStaff,
  onToggleStatus,
  onDeleteStaff,
}) => {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: "Active", color: "bg-green-100 text-green-800" },
      inactive: { label: "Block", color: "bg-red-100 text-red-800" },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nhân viên
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trạng thái
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredStaff.map((staff) => (
              <tr key={staff.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700">
                        {staff.fullName.charAt(0)}
                      </span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {staff.fullName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {staff.email}
                      </div>
                      <div className="text-sm text-gray-500">
                        {staff.phone}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(staff.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onToggleStatus(staff.id)}
                      className={
                        staff.status === "active"
                          ? "text-red-600 hover:text-red-900"
                          : "text-green-600 hover:text-green-900"
                      }
                    >
                      {staff.status === "active" ? (
                        <UserX className="h-4 w-4" />
                      ) : (
                        <UserCheck className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => onDeleteStaff(staff.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredStaff.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Không tìm thấy nhân viên nào.</p>
        </div>
      )}
    </div>
  );
};
