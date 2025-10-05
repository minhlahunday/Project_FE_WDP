import React, { useState, useEffect, useCallback } from 'react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  CheckCircle,
  AlertCircle,
  Edit,
  RefreshCw,
  FileText
} from 'lucide-react';
import { authService } from '../../../services/authService';
import { useAuth } from '../../../contexts/AuthContext';

interface DealerInfo {
  contract: {
    contract_number: string;
    signed_date: string;
    expiry_date: string;
    territory: string;
    exclusive_territory: boolean;
  };
  address: {
    street: string;
    district: string;
    city: string;
    province: string;
    full_address: string;
  };
  contact: {
    phone: string;
    email: string;
    hotline: string;
  };
  capabilities: Record<string, unknown>;
}

export const DealerInfo: React.FC = () => {
  const { user } = useAuth();
  const [dealerInfo, setDealerInfo] = useState<DealerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lấy dealership_id từ thông tin user
  const getDealerId = () => {
    // Lấy dealership_id từ thông tin user (từ JWT token hoặc user object)
    if (user?.dealership_id) {
      return user.dealership_id;
    }
    
    // Fallback: nếu không có dealership_id
    if (user?.role === 'dealer_staff' || user?.role === 'dealer_manager') {
      console.warn('Không tìm thấy dealership_id trong thông tin user');
      return null;
    }
    
    return null;
  };

  const loadDealerInfo = useCallback(async () => {
    const dealerId = getDealerId();
    
    if (!dealerId) {
      setError('Không tìm thấy thông tin đại lý');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await authService.getDealerById(dealerId);
      
      if (response.success && response.data) {
        setDealerInfo(response.data);
      } else {
        setError(response.message || 'Không thể tải thông tin đại lý');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải thông tin đại lý';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadDealerInfo();
  }, [loadDealerInfo]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatBoolean = (value: boolean) => {
    return value ? 'Có' : 'Không';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Đang tải thông tin đại lý...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Lỗi tải thông tin</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadDealerInfo}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (!dealerInfo) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Không có thông tin đại lý</h3>
          <p className="text-gray-500">Vui lòng liên hệ quản trị viên để được hỗ trợ.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Thông tin đại lý</h1>
            <p className="text-gray-600 mt-1">Chi tiết về đại lý hiện tại</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={loadDealerInfo}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Làm mới</span>
            </button>
            <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2">
              <Edit className="h-4 w-4" />
              <span>Chỉnh sửa</span>
            </button>
          </div>
        </div>
      </div>

      {/* Contract Status Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-3">
          <CheckCircle className="h-6 w-6 text-blue-600" />
          <div>
            <h3 className="font-semibold text-blue-800">
              Hợp đồng đại lý đang hoạt động
            </h3>
            <p className="text-sm text-blue-600">
              Hợp đồng số: {dealerInfo.contract.contract_number} - Khu vực: {dealerInfo.contract.territory}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contract Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Thông tin hợp đồng
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Số hợp đồng</label>
                <p className="text-gray-900 font-semibold">{dealerInfo.contract.contract_number}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Khu vực hoạt động</label>
                <p className="text-gray-900">{dealerInfo.contract.territory}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Ngày ký hợp đồng</label>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <p className="text-gray-900">{formatDate(dealerInfo.contract.signed_date)}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Ngày hết hạn</label>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <p className="text-gray-900">{formatDate(dealerInfo.contract.expiry_date)}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Độc quyền khu vực</label>
                <p className="text-gray-900">{formatBoolean(dealerInfo.contract.exclusive_territory)}</p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Building2 className="h-5 w-5 mr-2" />
              Thông tin liên hệ
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-600 mb-1">Địa chỉ đầy đủ</label>
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                  <p className="text-gray-900">{dealerInfo.address.full_address}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Đường</label>
                <p className="text-gray-900">{dealerInfo.address.street}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Quận/Huyện</label>
                <p className="text-gray-900">{dealerInfo.address.district}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Thành phố</label>
                <p className="text-gray-900">{dealerInfo.address.city}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Tỉnh/Thành phố</label>
                <p className="text-gray-900">{dealerInfo.address.province}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Số điện thoại</label>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <p className="text-gray-900">{dealerInfo.contact.phone}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Hotline</label>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <p className="text-gray-900">{dealerInfo.contact.hotline}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <p className="text-gray-900">{dealerInfo.contact.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Capabilities */}
          {Object.keys(dealerInfo.capabilities).length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Khả năng cung cấp</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(dealerInfo.capabilities).map(([key, value]) => (
                  <div key={key} className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                    <span className="text-blue-800 font-medium">{key}: {String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Statistics Sidebar */}
        <div className="space-y-6">
          {/* Contract Status */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Trạng thái hợp đồng
            </h3>
            <div className="space-y-3">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600 mb-1">{dealerInfo.contract.contract_number}</div>
                <p className="text-gray-600 text-sm">Số hợp đồng</p>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600 mb-1">{dealerInfo.contract.territory}</div>
                <p className="text-gray-600 text-sm">Khu vực hoạt động</p>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600 mb-1">
                  {formatBoolean(dealerInfo.contract.exclusive_territory)}
                </div>
                <p className="text-gray-600 text-sm">Độc quyền</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Thao tác nhanh</h3>
            <div className="space-y-3">
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium">
                Xem báo cáo chi tiết
              </button>
              <button className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium">
                Quản lý nhân viên
              </button>
              <button className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium">
                Cập nhật thông tin
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
