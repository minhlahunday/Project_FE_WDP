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
import { Sidebar } from '../../common/Sidebar';
import { Header } from '../../common/Header';
import { authService } from '../../../services/authService';
import { useAuth } from '../../../contexts/AuthContext';

interface DealerInfo {
  _id: string;
  code: string;
  company_name: string;
  business_license: string;
  tax_code: string;
  legal_representative: string;
  manufacturer_id: {
    _id: string;
    name: string;
    code: string;
    country: string;
  };
  dealer_level: string;
  product_distribution: string;
  status: string;
  isActive: boolean;
  created_by: {
    _id: string;
    full_name: string;
    email: string;
  };
  notes: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
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
  capabilities: {
    services: {
      vehicle_sales: boolean;
      test_drive: boolean;
      spare_parts_sales: boolean;
    };
    showroom_area: number;
    display_capacity: number;
    total_staff: number;
    sales_staff: number;
    support_staff: number;
  };
}

export const DealerInfo: React.FC = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('dealer-info');
  const [dealerInfo, setDealerInfo] = useState<DealerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lấy dealership_id từ thông tin user sau khi login thành công
  const getDealerId = useCallback(() => {
    console.log('🔍 Getting dealer ID from user after successful login:', user);
    
    // Ưu tiên lấy dealership_id từ user object (đã có sau khi login thành công)
    if (user?.dealership_id) {
      console.log('✅ Found dealership_id in user object:', user.dealership_id);
      return user.dealership_id;
    }
    
    // Fallback: nếu không có dealership_id trong user object, thử lấy từ JWT token
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        console.log('🔍 Trying to get dealership_id from JWT token...');
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('🔍 JWT payload:', payload);
        
        if (payload.dealership_id) {
          console.log('✅ Found dealership_id in JWT:', payload.dealership_id);
          return payload.dealership_id;
        }
      }
    } catch (error) {
      console.error('❌ Error parsing JWT token:', error);
    }
    
    // Nếu không tìm thấy dealership_id
    if (user?.role === 'dealer_staff' || user?.role === 'dealer_manager') {
      console.warn('❌ Không tìm thấy dealership_id trong thông tin user sau khi login');
      return null;
    }
    
    return null;
  }, [user]);

  const loadDealerInfo = useCallback(async () => {
    console.log('🔍 Loading dealer info...');
    console.log('🔍 Current user:', user);
    
    const dealerId = getDealerId();
    console.log('🔍 Dealer ID from getDealerId():', dealerId);
    
    if (!dealerId) {
      console.log('❌ No dealer ID found');
      setError('Không tìm thấy thông tin đại lý');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🚀 Calling API getDealerById with ID:', dealerId);
      const response = await authService.getDealerById(dealerId);
      
      console.log('✅ API response:', response);
      
      if (response.success && response.data) {
        console.log('✅ Setting dealer info:', response.data);
        setDealerInfo(response.data);
      } else {
        console.log('❌ API response failed:', response.message);
        setError(response.message || 'Không thể tải thông tin đại lý');
      }
    } catch (err: unknown) {
      console.error('❌ Error loading dealer info:', err);
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải thông tin đại lý';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [getDealerId, user]);

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
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <Sidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onOpen={() => setSidebarOpen(true)}
        />
        
        {/* Main Content */}
        <div className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'
        }`}>
          {/* Header */}
          <div className="fixed top-0 right-0 left-0 z-30 lg:left-16">
            <div className={`transition-all duration-300 ${
              sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'
            }`}>
              <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
            </div>
          </div>
          
          {/* Page Content */}
          <main className="flex-1 overflow-y-auto mt-[73px]">
            <div className="p-6">
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600">Đang tải thông tin đại lý...</p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <Sidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onOpen={() => setSidebarOpen(true)}
        />
        
        {/* Main Content */}
        <div className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'
        }`}>
          {/* Header */}
          <div className="fixed top-0 right-0 left-0 z-30 lg:left-16">
            <div className={`transition-all duration-300 ${
              sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'
            }`}>
              <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
            </div>
          </div>
          
          {/* Page Content */}
          <main className="flex-1 overflow-y-auto mt-[73px]">
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
          </main>
        </div>
      </div>
    );
  }

  if (!dealerInfo) {
    return (
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <Sidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onOpen={() => setSidebarOpen(true)}
        />
        
        {/* Main Content */}
        <div className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'
        }`}>
          {/* Header */}
          <div className="fixed top-0 right-0 left-0 z-30 lg:left-16">
            <div className={`transition-all duration-300 ${
              sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'
            }`}>
              <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
            </div>
          </div>
          
          {/* Page Content */}
          <main className="flex-1 overflow-y-auto mt-[73px]">
            <div className="p-6">
              <div className="text-center py-12">
                <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">Không có thông tin đại lý</h3>
                <p className="text-gray-500">Vui lòng liên hệ quản trị viên để được hỗ trợ.</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpen={() => setSidebarOpen(true)}
      />
      
      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'
      }`}>
        {/* Header */}
        <div className="fixed top-0 right-0 left-0 z-30 lg:left-16">
          <div className={`transition-all duration-300 ${
            sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'
          }`}>
            <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          </div>
        </div>
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto mt-[73px]">
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

            {/* Company Status Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-6 w-6 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-blue-800">
                    {dealerInfo?.company_name || 'Đại lý đang hoạt động'}
                  </h3>
                  <p className="text-sm text-blue-600">
                    Mã đại lý: {dealerInfo?.code || 'N/A'} - Cấp độ: {dealerInfo?.dealer_level || 'N/A'} - Trạng thái: {dealerInfo?.status || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Building2 className="h-5 w-5 mr-2" />
              Thông tin công ty
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Tên công ty</label>
                <p className="text-gray-900 font-semibold">{dealerInfo?.company_name || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Mã đại lý</label>
                <p className="text-gray-900">{dealerInfo?.code || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Giấy phép kinh doanh</label>
                <p className="text-gray-900">{dealerInfo?.business_license || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Mã số thuế</label>
                <p className="text-gray-900">{dealerInfo?.tax_code || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Người đại diện pháp luật</label>
                <p className="text-gray-900">{dealerInfo?.legal_representative || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Cấp độ đại lý</label>
                <p className="text-gray-900">{dealerInfo?.dealer_level || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Phân phối sản phẩm</label>
                <p className="text-gray-900">{dealerInfo?.product_distribution || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Trạng thái</label>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  dealerInfo?.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {dealerInfo?.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                </span>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-600 mb-1">Ghi chú</label>
                <p className="text-gray-900">{dealerInfo?.notes || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Manufacturer Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Building2 className="h-5 w-5 mr-2" />
              Thông tin nhà sản xuất
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Tên nhà sản xuất</label>
                <p className="text-gray-900 font-semibold">{dealerInfo?.manufacturer_id?.name || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Mã nhà sản xuất</label>
                <p className="text-gray-900">{dealerInfo?.manufacturer_id?.code || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Quốc gia</label>
                <p className="text-gray-900">{dealerInfo?.manufacturer_id?.country || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">ID nhà sản xuất</label>
                <p className="text-gray-900 text-xs">{dealerInfo?.manufacturer_id?._id || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Contract Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Thông tin hợp đồng
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Số hợp đồng</label>
                <p className="text-gray-900 font-semibold">{dealerInfo?.contract?.contract_number || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Khu vực hoạt động</label>
                <p className="text-gray-900">{dealerInfo?.contract?.territory || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Ngày ký hợp đồng</label>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <p className="text-gray-900">{dealerInfo?.contract?.signed_date ? formatDate(dealerInfo.contract.signed_date) : 'N/A'}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Ngày hết hạn</label>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <p className="text-gray-900">{dealerInfo?.contract?.expiry_date ? formatDate(dealerInfo.contract.expiry_date) : 'N/A'}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Độc quyền khu vực</label>
                <p className="text-gray-900">{dealerInfo?.contract?.exclusive_territory !== undefined ? formatBoolean(dealerInfo.contract.exclusive_territory) : 'N/A'}</p>
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
                  <p className="text-gray-900">{dealerInfo?.address?.full_address || 'N/A'}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Đường</label>
                <p className="text-gray-900">{dealerInfo?.address?.street || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Quận/Huyện</label>
                <p className="text-gray-900">{dealerInfo?.address?.district || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Thành phố</label>
                <p className="text-gray-900">{dealerInfo?.address?.city || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Tỉnh/Thành phố</label>
                <p className="text-gray-900">{dealerInfo?.address?.province || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Số điện thoại</label>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <p className="text-gray-900">{dealerInfo?.contact?.phone || 'N/A'}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Hotline</label>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <p className="text-gray-900">{dealerInfo?.contact?.hotline || 'N/A'}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <p className="text-gray-900">{dealerInfo?.contact?.email || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Capabilities */}
          {dealerInfo?.capabilities && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Khả năng cung cấp</h2>
              
              {/* Services */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Dịch vụ</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className={`p-3 rounded-lg border ${dealerInfo.capabilities.services?.vehicle_sales ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className={`h-4 w-4 ${dealerInfo.capabilities.services?.vehicle_sales ? 'text-green-600' : 'text-gray-400'}`} />
                      <span className={`font-medium ${dealerInfo.capabilities.services?.vehicle_sales ? 'text-green-800' : 'text-gray-600'}`}>
                        Bán xe
                      </span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg border ${dealerInfo.capabilities.services?.test_drive ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className={`h-4 w-4 ${dealerInfo.capabilities.services?.test_drive ? 'text-green-600' : 'text-gray-400'}`} />
                      <span className={`font-medium ${dealerInfo.capabilities.services?.test_drive ? 'text-green-800' : 'text-gray-600'}`}>
                        Lái thử
                      </span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg border ${dealerInfo.capabilities.services?.spare_parts_sales ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className={`h-4 w-4 ${dealerInfo.capabilities.services?.spare_parts_sales ? 'text-green-600' : 'text-gray-400'}`} />
                      <span className={`font-medium ${dealerInfo.capabilities.services?.spare_parts_sales ? 'text-green-800' : 'text-gray-600'}`}>
                        Bán phụ tùng
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Facility Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-1">{dealerInfo.capabilities.showroom_area || 0}</div>
                  <p className="text-blue-800 text-sm">Diện tích showroom (m²)</p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-1">{dealerInfo.capabilities.display_capacity || 0}</div>
                  <p className="text-purple-800 text-sm">Sức chứa trưng bày</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600 mb-1">{dealerInfo.capabilities.total_staff || 0}</div>
                  <p className="text-green-800 text-sm">Tổng nhân viên</p>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600 mb-1">{dealerInfo.capabilities.sales_staff || 0}</div>
                  <p className="text-orange-800 text-sm">Nhân viên bán hàng</p>
                </div>
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-indigo-600 mb-1">{dealerInfo.capabilities.support_staff || 0}</div>
                  <p className="text-indigo-800 text-sm">Nhân viên hỗ trợ</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Statistics Sidebar */}
        <div className="space-y-6">
          {/* Company Overview */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <Building2 className="h-5 w-5 mr-2" />
              Tổng quan công ty
            </h3>
            <div className="space-y-3">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600 mb-1">{dealerInfo?.code || 'N/A'}</div>
                <p className="text-gray-600 text-sm">Mã đại lý</p>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600 mb-1">{dealerInfo?.dealer_level || 'N/A'}</div>
                <p className="text-gray-600 text-sm">Cấp độ đại lý</p>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600 mb-1">{dealerInfo?.product_distribution || 'N/A'}</div>
                <p className="text-gray-600 text-sm">Phân phối sản phẩm</p>
              </div>
              <div className="text-center">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  dealerInfo?.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {dealerInfo?.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                </span>
              </div>
            </div>
          </div>

          {/* Contract Status */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Trạng thái hợp đồng
            </h3>
            <div className="space-y-3">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600 mb-1">{dealerInfo?.contract?.contract_number || 'N/A'}</div>
                <p className="text-gray-600 text-sm">Số hợp đồng</p>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600 mb-1">{dealerInfo?.contract?.territory || 'N/A'}</div>
                <p className="text-gray-600 text-sm">Khu vực hoạt động</p>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600 mb-1">
                  {dealerInfo?.contract?.exclusive_territory !== undefined ? formatBoolean(dealerInfo.contract.exclusive_territory) : 'N/A'}
                </div>
                <p className="text-gray-600 text-sm">Độc quyền</p>
              </div>
            </div>
          </div>

          {/* System Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Thông tin hệ thống
            </h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-600">ID đại lý:</span>
                <p className="text-xs font-mono text-gray-800 break-all">{dealerInfo?._id || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Người tạo:</span>
                <p className="text-sm font-medium text-gray-800">{dealerInfo?.created_by?.full_name || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Email người tạo:</span>
                <p className="text-sm text-gray-800">{dealerInfo?.created_by?.email || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Ngày tạo:</span>
                <p className="text-sm text-gray-800">{dealerInfo?.createdAt ? new Date(dealerInfo.createdAt).toLocaleString('vi-VN') : 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Ngày cập nhật:</span>
                <p className="text-sm text-gray-800">{dealerInfo?.updatedAt ? new Date(dealerInfo.updatedAt).toLocaleString('vi-VN') : 'N/A'}</p>
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
    </main>
  </div>
</div>
  );
};
