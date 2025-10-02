import React, { useState, useEffect } from "react";
import {
  organizationService,
  Manufacturer,
  Dealership,
} from "../../../../services/organizationService";
import { useStaffManagement } from "../../../../hooks/useStaffManagement";

interface OrganizationSectionProps {
  roleName: string;
  dealershipId: string;
  manufacturerId: string;
  onDealershipChange: (value: string) => void;
  onManufacturerChange: (value: string) => void;
  disabled?: boolean;
}

export const OrganizationSection: React.FC<OrganizationSectionProps> = ({
  roleName,
  dealershipId,
  manufacturerId,
  onDealershipChange,
  onManufacturerChange,
  disabled = false,
}) => {
  const { roles } = useStaffManagement();
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [dealerships, setDealerships] = useState<Dealership[]>([]);
  const [loadingManufacturers, setLoadingManufacturers] = useState(false);
  const [loadingDealerships, setLoadingDealerships] = useState(false);

  // Fetch manufacturers from API
  const fetchManufacturers = async () => {
    setLoadingManufacturers(true);
    try {
      const result = await organizationService.getManufacturers();
      if (result.success) {
        setManufacturers(result.data?.data?.data || []);
      } else {
        console.error("Error fetching manufacturers:", result.message);
      }
    } catch (error) {
      console.error("Error fetching manufacturers:", error);
    } finally {
      setLoadingManufacturers(false);
    }
  };

  // Fetch dealerships from API
  const fetchDealerships = async () => {
    setLoadingDealerships(true);
    try {
      const result = await organizationService.getDealerships();
      if (result.success) {
        setDealerships(result.data?.data?.data || []);
      } else {
        console.error("Error fetching dealerships:", result.message);
      }
    } catch (error) {
      console.error("Error fetching dealerships:", error);
    } finally {
      setLoadingDealerships(false);
    }
  };
  useEffect(() => {
    // Load data when component mounts
    fetchManufacturers();
    fetchDealerships();
  }, []);

  // Determine which fields should be visible based on role
  const shouldShowDealership = () => {
    const name = (roles || []).find((role) => role._id === roleName)?.name;
    return name === "Dealer Staff" || name === "Dealer Manager";
  };

  const shouldShowManufacturer = () => {
    return (
      (roles || []).find((role) => role._id === roleName)?.name === "EVM Staff"
    );
  };
  return (
    <div className="bg-gray-50 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <span className="bg-purple-100 text-purple-600 rounded-full p-2 mr-3">
          🏢
        </span>
        Phân quyền & Tổ chức
      </h3>

      <div className="space-y-6">
        {/* Role selection hint */}
        {!roleName && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              💡 Vui lòng chọn vai trò trước để hiển thị các trường tổ chức phù
              hợp
            </p>
          </div>
        )}

        {/* Dealership selection - for Dealer Staff and Dealer Manager */}
        {shouldShowDealership() && (
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Đại lý <span className="text-red-500">*</span>
            </label>
            <select
              value={dealershipId}
              onChange={(e) => onDealershipChange(e.target.value)}
              disabled={disabled || loadingDealerships}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-3 focus:ring-blue-100 focus:border-blue-500 disabled:bg-gray-100 transition-all duration-200"
              required
            >
              <option value="">
                {loadingDealerships ? "Đang tải..." : "-- Chọn đại lý --"}
              </option>
              {dealerships.map((dealership) => (
                <option key={dealership._id} value={dealership._id}>
                  {dealership.name}
                  {dealership.location && ` - ${dealership.location}`}
                </option>
              ))}
            </select>
            {loadingDealerships && (
              <p className="text-xs text-gray-500">
                Đang tải danh sách đại lý...
              </p>
            )}
          </div>
        )}

        {/* Manufacturer selection - for EVM Staff */}
        {shouldShowManufacturer() && (
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Nhà sản xuất <span className="text-red-500">*</span>
            </label>
            <select
              value={manufacturerId}
              onChange={(e) => onManufacturerChange(e.target.value)}
              disabled={disabled || loadingManufacturers}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-3 focus:ring-blue-100 focus:border-blue-500 disabled:bg-gray-100 transition-all duration-200"
              required
            >
              <option value="">
                {loadingManufacturers
                  ? "Đang tải..."
                  : "-- Chọn nhà sản xuất --"}
              </option>
              {manufacturers.map((manufacturer) => (
                <option key={manufacturer._id} value={manufacturer._id}>
                  {manufacturer.name}
                </option>
              ))}
            </select>
            {loadingManufacturers && (
              <p className="text-xs text-gray-500">
                Đang tải danh sách nhà sản xuất...
              </p>
            )}
          </div>
        )}

        {/* Show manual input as fallback or for other roles */}
        {roleName && !shouldShowDealership() && !shouldShowManufacturer() && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                ID Đại lý
                <span className="text-gray-400 text-xs ml-1">(Tùy chọn)</span>
              </label>
              <input
                type="text"
                value={dealershipId}
                onChange={(e) => onDealershipChange(e.target.value)}
                disabled={disabled}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-3 focus:ring-blue-100 focus:border-blue-500 disabled:bg-gray-100 transition-all duration-200"
                placeholder="VD: DEALER_001"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                ID Nhà sản xuất
                <span className="text-gray-400 text-xs ml-1">(Tùy chọn)</span>
              </label>
              <input
                type="text"
                value={manufacturerId}
                onChange={(e) => onManufacturerChange(e.target.value)}
                disabled={disabled}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-3 focus:ring-blue-100 focus:border-blue-500 disabled:bg-gray-100 transition-all duration-200"
                placeholder="VD: VINFAST"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
