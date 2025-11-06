import React from "react";
import { X, Plus } from "lucide-react";
import { OrganizationSection } from "./OrganizationSection";

interface AddStaffModalProps {
  showModal: boolean;
  onClose: () => void;
  newStaff: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    roleName: string;
    dealershipId: string;
    manufacturerId: string;
    address: string;
  };
  loading: boolean;
  loadingRoles?: boolean;
  error: string | null;
  success: string | null;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  availableRoles: { value: string; label: string }[];
}

export const AddStaffModal: React.FC<AddStaffModalProps> = ({
  showModal,
  onClose,
  newStaff,
  loading,
  loadingRoles = false,
  error,
  success,
  onInputChange,
  onSubmit,
  availableRoles,
}) => {
  if (!showModal) return null;

  const handleDealershipChange = (value: string) => {
    const event = {
      target: { name: 'dealershipId', value }
    } as React.ChangeEvent<HTMLInputElement>;
    onInputChange(event);
  };

  const handleManufacturerChange = (value: string) => {
    const event = {
      target: { name: 'manufacturerId', value }
    } as React.ChangeEvent<HTMLInputElement>;
    onInputChange(event);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-auto max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6 text-white relative">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Thêm nhân viên mới</h2>
              <p className="text-blue-100 mt-1">Tạo tài khoản cho nhân viên mới</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
              disabled={loading}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-pink-400"></div>
        </div>

        {/* Content */}
        <div className="p-8 max-h-[calc(95vh-140px)] overflow-y-auto">
          {/* Notifications */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-5 h-5 text-red-500"></div>
                </div>
                <div className="ml-3">
                  <p className="text-red-800 font-medium">{error}</p>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-5 h-5 text-green-500"></div>
                </div>
                <div className="ml-3">
                  <p className="text-green-800 font-medium">{success}</p>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Personal Information Section */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="bg-blue-100 text-blue-600 rounded-full p-2 mr-3"></span>
                Thông tin cá nhân
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={newStaff.fullName}
                    onChange={onInputChange}
                    disabled={loading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-3 focus:ring-blue-100 focus:border-blue-500 disabled:bg-gray-100 transition-all duration-200"
                    placeholder="Nhập họ và tên đầy đủ"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={newStaff.phone}
                    onChange={onInputChange}
                    disabled={loading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-3 focus:ring-blue-100 focus:border-blue-500 disabled:bg-gray-100 transition-all duration-200"
                    placeholder="0xxxxxxxxx"
                  />
                </div>
              </div>
              
              <div className="space-y-2 mt-4">
                <label className="block text-sm font-semibold text-gray-700">
                  Địa chỉ
                  <span className="text-gray-400 text-xs ml-1">(Tùy chọn)</span>
                </label>
                <textarea
                  name="address"
                  value={newStaff.address}
                  onChange={onInputChange}
                  disabled={loading}
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-3 focus:ring-blue-100 focus:border-blue-500 disabled:bg-gray-100 transition-all duration-200 resize-none"
                  placeholder="Nhập địa chỉ liên hệ"
                />
              </div>
            </div>

            {/* Account Information Section */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="bg-green-100 text-green-600 rounded-full p-2 mr-3"></span>
                Thông tin tài khoản
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={newStaff.email}
                    onChange={onInputChange}
                    disabled={loading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-3 focus:ring-blue-100 focus:border-blue-500 disabled:bg-gray-100 transition-all duration-200"
                    placeholder="example@company.com"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Mật khẩu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="password"
                    required
                    value={newStaff.password}
                    onChange={onInputChange}
                    disabled={loading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-3 focus:ring-blue-100 focus:border-blue-500 disabled:bg-gray-100 transition-all duration-200"
                    placeholder="Tối thiểu 6 ký tự"
                    minLength={6}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Mật khẩu phải có ít nhất 6 ký tự
                  </p>
                </div>
              </div>

              {/* Role Selection */}
              <div className="space-y-2 mt-6">
                <label className="block text-sm font-semibold text-gray-700">
                  Vai trò <span className="text-red-500">*</span>
                </label>
                <select
                  name="roleName"
                  required
                  value={newStaff.roleName}
                  onChange={onInputChange}
                  disabled={loading || loadingRoles}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-3 focus:ring-blue-100 focus:border-blue-500 disabled:bg-gray-100 transition-all duration-200"
                >
                  <option value="">
                    {loadingRoles ? "Đang tải vai trò..." : "-- Chọn vai trò --"}
                  </option>
                  {availableRoles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
                {loadingRoles && (
                  <p className="text-xs text-gray-500 mt-1">
                    Đang tải danh sách vai trò từ server...
                  </p>
                )}
              </div>
            </div>

            {/* Organization Section */}
            <OrganizationSection
              roleName={newStaff.roleName}
              dealershipId={newStaff.dealershipId}
              manufacturerId={newStaff.manufacturerId}
              onDealershipChange={handleDealershipChange}
              onManufacturerChange={handleManufacturerChange}
              disabled={loading}
            />

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 transition-all duration-200"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center shadow-lg"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                    Đang tạo tài khoản...
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5 mr-2" />
                    Tạo nhân viên
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
