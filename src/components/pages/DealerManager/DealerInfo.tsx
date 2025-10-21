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
      <div className="flex h-screen bg-gray-50 overflow-hidden">
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
          <main className="flex-1 overflow-y-auto pt-16">
            <div className="p-6 pt-4">
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
      <div className="flex h-screen bg-gray-50 overflow-hidden">
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
          <main className="flex-1 overflow-y-auto pt-16">
            <div className="p-6 pt-4">
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
      <div className="flex h-screen bg-gray-50 overflow-hidden">
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
          <main className="flex-1 overflow-y-auto pt-16">
            <div className="p-6 pt-4">
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
    <div className="flex h-screen bg-gray-50 overflow-hidden">
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
        <main className="flex-1 overflow-y-auto pt-16">
          <div className="p-6 pt-0">
            {/* Header */}
            <div className="mb-6">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-xl p-8 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-4xl font-bold mb-2">Thông tin đại lý</h1>
                    <p className="text-blue-100 text-lg">Quản lý và theo dõi thông tin đại lý của bạn</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={loadDealerInfo}
                      className="bg-white text-blue-600 hover:bg-blue-50 px-5 py-3 rounded-xl font-semibold flex items-center space-x-2 shadow-lg transition-all duration-200 hover:scale-105"
                    >
                      <RefreshCw className="h-5 w-5" />
                      <span>Làm mới</span>
                    </button>
                   
                  </div>
                </div>
              </div>
            </div>

            {/* Company Status Banner */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 mb-8 shadow-md">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-green-800 mb-1">
                    {dealerInfo?.company_name || 'Đại lý đang hoạt động'}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                      Mã: {dealerInfo?.code || 'N/A'}
                    </span>
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                      Cấp độ: {dealerInfo?.dealer_level || 'N/A'}
                    </span>
                    <span className={`px-3 py-1 rounded-full font-medium ${
                      dealerInfo?.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {dealerInfo?.status === 'active' ? '🟢 Đang hoạt động' : '🔴 Không hoạt động'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company Information */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center pb-4 border-b-2 border-blue-100">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mr-3">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              Thông tin công ty
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-white p-4 rounded-xl border border-blue-100">
                <label className="block text-sm font-semibold text-blue-600 mb-2">Tên công ty</label>
                <p className="text-gray-900 font-bold text-lg">{dealerInfo?.company_name || 'N/A'}</p>
              </div>
              <div className="bg-gradient-to-br from-indigo-50 to-white p-4 rounded-xl border border-indigo-100">
                <label className="block text-sm font-semibold text-indigo-600 mb-2">Mã đại lý</label>
                <p className="text-gray-900 font-bold text-lg">{dealerInfo?.code || 'N/A'}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-white p-4 rounded-xl border border-purple-100">
                <label className="block text-sm font-semibold text-purple-600 mb-2">Giấy phép kinh doanh</label>
                <p className="text-gray-900 font-medium">{dealerInfo?.business_license || 'N/A'}</p>
              </div>
              <div className="bg-gradient-to-br from-pink-50 to-white p-4 rounded-xl border border-pink-100">
                <label className="block text-sm font-semibold text-pink-600 mb-2">Mã số thuế</label>
                <p className="text-gray-900 font-medium">{dealerInfo?.tax_code || 'N/A'}</p>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-white p-4 rounded-xl border border-orange-100">
                <label className="block text-sm font-semibold text-orange-600 mb-2">Người đại diện pháp luật</label>
                <p className="text-gray-900 font-medium">{dealerInfo?.legal_representative || 'N/A'}</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-white p-4 rounded-xl border border-green-100">
                <label className="block text-sm font-semibold text-green-600 mb-2">Cấp độ đại lý</label>
                <p className="text-gray-900 font-medium">{dealerInfo?.dealer_level || 'N/A'}</p>
              </div>
              <div className="bg-gradient-to-br from-teal-50 to-white p-4 rounded-xl border border-teal-100">
                <label className="block text-sm font-semibold text-teal-600 mb-2">Phân phối sản phẩm</label>
                <p className="text-gray-900 font-medium">{dealerInfo?.product_distribution || 'N/A'}</p>
              </div>
              <div className="bg-gradient-to-br from-cyan-50 to-white p-4 rounded-xl border border-cyan-100">
                <label className="block text-sm font-semibold text-cyan-600 mb-2">Trạng thái</label>
                <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold shadow-sm ${
                  dealerInfo?.status === 'active' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                }`}>
                  {dealerInfo?.status === 'active' ? '✓ Hoạt động' : '✗ Không hoạt động'}
                </span>
              </div>
              <div className="md:col-span-2 bg-gradient-to-br from-gray-50 to-white p-4 rounded-xl border border-gray-200">
                <label className="block text-sm font-semibold text-gray-600 mb-2">Ghi chú</label>
                <p className="text-gray-900 font-medium leading-relaxed">{dealerInfo?.notes || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Manufacturer Information */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center pb-4 border-b-2 border-purple-100">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mr-3">
                <Building2 className="h-6 w-6 text-purple-600" />
              </div>
              Thông tin nhà sản xuất
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-purple-50 to-white p-5 rounded-xl border border-purple-100">
                <label className="block text-sm font-semibold text-purple-600 mb-2">Tên nhà sản xuất</label>
                <p className="text-gray-900 font-bold text-lg">{dealerInfo?.manufacturer_id?.name || 'N/A'}</p>
              </div>
              <div className="bg-gradient-to-br from-indigo-50 to-white p-5 rounded-xl border border-indigo-100">
                <label className="block text-sm font-semibold text-indigo-600 mb-2">Mã nhà sản xuất</label>
                <p className="text-gray-900 font-medium">{dealerInfo?.manufacturer_id?.code || 'N/A'}</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-white p-5 rounded-xl border border-blue-100">
                <label className="block text-sm font-semibold text-blue-600 mb-2">Quốc gia</label>
                <p className="text-gray-900 font-medium">{dealerInfo?.manufacturer_id?.country || 'N/A'}</p>
              </div>
              <div className="bg-gradient-to-br from-cyan-50 to-white p-5 rounded-xl border border-cyan-100">
                <label className="block text-sm font-semibold text-cyan-600 mb-2">ID nhà sản xuất</label>
                <p className="text-gray-900 text-xs font-mono break-all">{dealerInfo?.manufacturer_id?._id || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Contract Information */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center pb-4 border-b-2 border-amber-100">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center mr-3">
                <FileText className="h-6 w-6 text-amber-600" />
              </div>
              Thông tin hợp đồng
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-amber-50 to-white p-5 rounded-xl border border-amber-100">
                <label className="block text-sm font-semibold text-amber-600 mb-2">Số hợp đồng</label>
                <p className="text-gray-900 font-bold text-lg">{dealerInfo?.contract?.contract_number || 'N/A'}</p>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-white p-5 rounded-xl border border-orange-100">
                <label className="block text-sm font-semibold text-orange-600 mb-2">Khu vực hoạt động</label>
                <p className="text-gray-900 font-medium">{dealerInfo?.contract?.territory || 'N/A'}</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-white p-5 rounded-xl border border-green-100">
                <label className="block text-sm font-semibold text-green-600 mb-2">Ngày ký hợp đồng</label>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-green-500" />
                  <p className="text-gray-900 font-medium">{dealerInfo?.contract?.signed_date ? formatDate(dealerInfo.contract.signed_date) : 'N/A'}</p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-white p-5 rounded-xl border border-red-100">
                <label className="block text-sm font-semibold text-red-600 mb-2">Ngày hết hạn</label>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-red-500" />
                  <p className="text-gray-900 font-medium">{dealerInfo?.contract?.expiry_date ? formatDate(dealerInfo.contract.expiry_date) : 'N/A'}</p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-white p-5 rounded-xl border border-blue-100">
                <label className="block text-sm font-semibold text-blue-600 mb-2">Độc quyền khu vực</label>
                <p className="text-gray-900 font-bold text-lg">{dealerInfo?.contract?.exclusive_territory !== undefined ? formatBoolean(dealerInfo.contract.exclusive_territory) : 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center pb-4 border-b-2 border-green-100">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mr-3">
                <Phone className="h-6 w-6 text-green-600" />
              </div>
              Thông tin liên hệ
            </h2>
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-xl border border-indigo-100">
                <label className="block text-sm font-semibold text-indigo-600 mb-3">📍 Địa chỉ đầy đủ</label>
                <div className="flex items-start space-x-3">
                  <MapPin className="h-6 w-6 text-indigo-500 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-900 font-medium text-lg leading-relaxed">{dealerInfo?.address?.full_address || 'N/A'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-gradient-to-br from-blue-50 to-white p-4 rounded-xl border border-blue-100">
                  <label className="block text-sm font-semibold text-blue-600 mb-2">Đường</label>
                  <p className="text-gray-900 font-medium">{dealerInfo?.address?.street || 'N/A'}</p>
                </div>
                <div className="bg-gradient-to-br from-cyan-50 to-white p-4 rounded-xl border border-cyan-100">
                  <label className="block text-sm font-semibold text-cyan-600 mb-2">Quận/Huyện</label>
                  <p className="text-gray-900 font-medium">{dealerInfo?.address?.district || 'N/A'}</p>
                </div>
                <div className="bg-gradient-to-br from-teal-50 to-white p-4 rounded-xl border border-teal-100">
                  <label className="block text-sm font-semibold text-teal-600 mb-2">Thành phố</label>
                  <p className="text-gray-900 font-medium">{dealerInfo?.address?.city || 'N/A'}</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-white p-4 rounded-xl border border-green-100">
                  <label className="block text-sm font-semibold text-green-600 mb-2">Tỉnh/Thành phố</label>
                  <p className="text-gray-900 font-medium">{dealerInfo?.address?.province || 'N/A'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-gradient-to-br from-purple-50 to-white p-5 rounded-xl border border-purple-100">
                  <label className="block text-sm font-semibold text-purple-600 mb-3">Số điện thoại</label>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Phone className="h-5 w-5 text-purple-600" />
                    </div>
                    <p className="text-gray-900 font-bold text-lg">{dealerInfo?.contact?.phone || 'N/A'}</p>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-pink-50 to-white p-5 rounded-xl border border-pink-100">
                  <label className="block text-sm font-semibold text-pink-600 mb-3">Hotline</label>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                      <Phone className="h-5 w-5 text-pink-600" />
                    </div>
                    <p className="text-gray-900 font-bold text-lg">{dealerInfo?.contact?.hotline || 'N/A'}</p>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-white p-5 rounded-xl border border-orange-100">
                  <label className="block text-sm font-semibold text-orange-600 mb-3">Email</label>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <Mail className="h-5 w-5 text-orange-600" />
                    </div>
                    <p className="text-gray-900 font-medium break-all">{dealerInfo?.contact?.email || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Capabilities */}
          {dealerInfo?.capabilities && (
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center pb-4 border-b-2 border-indigo-100">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center mr-3">
                  <CheckCircle className="h-6 w-6 text-indigo-600" />
                </div>
                Khả năng cung cấp
              </h2>
              
              {/* Services */}
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-800 mb-5 flex items-center">
                  <span className="w-2 h-8 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full mr-3"></span>
                  Dịch vụ cung cấp
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={`p-5 rounded-xl border-2 transition-all duration-300 ${dealerInfo.capabilities.services?.vehicle_sales ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 shadow-md' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${dealerInfo.capabilities.services?.vehicle_sales ? 'bg-green-500' : 'bg-gray-300'}`}>
                        <CheckCircle className="h-6 w-6 text-white" />
                      </div>
                      <span className={`font-bold text-lg ${dealerInfo.capabilities.services?.vehicle_sales ? 'text-green-800' : 'text-gray-500'}`}>
                        Bán xe
                      </span>
                    </div>
                  </div>
                  <div className={`p-5 rounded-xl border-2 transition-all duration-300 ${dealerInfo.capabilities.services?.test_drive ? 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-300 shadow-md' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${dealerInfo.capabilities.services?.test_drive ? 'bg-blue-500' : 'bg-gray-300'}`}>
                        <CheckCircle className="h-6 w-6 text-white" />
                      </div>
                      <span className={`font-bold text-lg ${dealerInfo.capabilities.services?.test_drive ? 'text-blue-800' : 'text-gray-500'}`}>
                        Lái thử
                      </span>
                    </div>
                  </div>
                  <div className={`p-5 rounded-xl border-2 transition-all duration-300 ${dealerInfo.capabilities.services?.spare_parts_sales ? 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-300 shadow-md' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${dealerInfo.capabilities.services?.spare_parts_sales ? 'bg-purple-500' : 'bg-gray-300'}`}>
                        <CheckCircle className="h-6 w-6 text-white" />
                      </div>
                      <span className={`font-bold text-lg ${dealerInfo.capabilities.services?.spare_parts_sales ? 'text-purple-800' : 'text-gray-500'}`}>
                        Bán phụ tùng
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Facility Information */}
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-5 flex items-center">
                  <span className="w-2 h-8 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full mr-3"></span>
                  Cơ sở vật chất & Nhân sự
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-center shadow-xl hover:scale-105 transition-transform duration-300">
                    <div className="text-4xl font-bold text-white mb-2">{dealerInfo.capabilities.showroom_area || 0}</div>
                    <p className="text-blue-100 text-sm font-semibold">Diện tích showroom (m²)</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-center shadow-xl hover:scale-105 transition-transform duration-300">
                    <div className="text-4xl font-bold text-white mb-2">{dealerInfo.capabilities.display_capacity || 0}</div>
                    <p className="text-purple-100 text-sm font-semibold">Sức chứa trưng bày</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-center shadow-xl hover:scale-105 transition-transform duration-300">
                    <div className="text-4xl font-bold text-white mb-2">{dealerInfo.capabilities.total_staff || 0}</div>
                    <p className="text-green-100 text-sm font-semibold">Tổng nhân viên</p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-center shadow-xl hover:scale-105 transition-transform duration-300">
                    <div className="text-4xl font-bold text-white mb-2">{dealerInfo.capabilities.sales_staff || 0}</div>
                    <p className="text-orange-100 text-sm font-semibold">Nhân viên bán hàng</p>
                  </div>
                  <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 text-center shadow-xl hover:scale-105 transition-transform duration-300">
                    <div className="text-4xl font-bold text-white mb-2">{dealerInfo.capabilities.support_staff || 0}</div>
                    <p className="text-indigo-100 text-sm font-semibold">Nhân viên hỗ trợ</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Statistics Sidebar */}
        <div className="space-y-6">
          {/* Company Overview */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-xl p-6 text-white">
            <h3 className="text-xl font-bold mb-6 flex items-center pb-3 border-b border-blue-400">
              <Building2 className="h-6 w-6 mr-2" />
              Tổng quan công ty
            </h3>
            <div className="space-y-5">
              <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4 text-center hover:bg-opacity-30 transition-all duration-300">
                <div className="text-2xl font-bold mb-1">{dealerInfo?.code || 'N/A'}</div>
                <p className="text-blue-100 text-sm font-medium">Mã đại lý</p>
              </div>
              <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4 text-center hover:bg-opacity-30 transition-all duration-300">
                <div className="text-2xl font-bold mb-1">{dealerInfo?.dealer_level || 'N/A'}</div>
                <p className="text-blue-100 text-sm font-medium">Cấp độ đại lý</p>
              </div>
              <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4 text-center hover:bg-opacity-30 transition-all duration-300">
                <div className="text-2xl font-bold mb-1">{dealerInfo?.product_distribution || 'N/A'}</div>
                <p className="text-blue-100 text-sm font-medium">Phân phối sản phẩm</p>
              </div>
              <div className="text-center">
                <span className={`inline-block px-5 py-2 rounded-full text-sm font-bold shadow-lg ${
                  dealerInfo?.status === 'active' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                }`}>
                  {dealerInfo?.status === 'active' ? '✓ Hoạt động' : '✗ Không hoạt động'}
                </span>
              </div>
            </div>
          </div>

          {/* Contract Status */}
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-xl p-6 text-white">
            <h3 className="text-xl font-bold mb-6 flex items-center pb-3 border-b border-amber-400">
              <FileText className="h-6 w-6 mr-2" />
              Trạng thái hợp đồng
            </h3>
            <div className="space-y-5">
              <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4 text-center hover:bg-opacity-30 transition-all duration-300">
                <div className="text-xl font-bold mb-1 break-all">{dealerInfo?.contract?.contract_number || 'N/A'}</div>
                <p className="text-amber-100 text-sm font-medium">Số hợp đồng</p>
              </div>
              <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4 text-center hover:bg-opacity-30 transition-all duration-300">
                <div className="text-xl font-bold mb-1">{dealerInfo?.contract?.territory || 'N/A'}</div>
                <p className="text-amber-100 text-sm font-medium">Khu vực hoạt động</p>
              </div>
              <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4 text-center hover:bg-opacity-30 transition-all duration-300">
                <div className="text-2xl font-bold mb-1">
                  {dealerInfo?.contract?.exclusive_territory !== undefined ? formatBoolean(dealerInfo.contract.exclusive_territory) : 'N/A'}
                </div>
                <p className="text-amber-100 text-sm font-medium">Độc quyền</p>
              </div>
            </div>
          </div>

          {/* System Information */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center pb-3 border-b-2 border-gray-200">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mr-3">
                <FileText className="h-6 w-6 text-gray-600" />
              </div>
              Thông tin hệ thống
            </h3>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-xl">
                <span className="text-sm font-semibold text-gray-600 block mb-2">ID đại lý:</span>
                <p className="text-xs font-mono text-gray-900 break-all bg-white p-2 rounded border">{dealerInfo?._id || 'N/A'}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-xl">
                <span className="text-sm font-semibold text-blue-600 block mb-2">Người tạo:</span>
                <p className="text-sm font-bold text-gray-900">{dealerInfo?.created_by?.full_name || 'N/A'}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-xl">
                <span className="text-sm font-semibold text-purple-600 block mb-2">Email người tạo:</span>
                <p className="text-sm text-gray-900 break-all">{dealerInfo?.created_by?.email || 'N/A'}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-xl">
                <span className="text-sm font-semibold text-green-600 block mb-2">Ngày tạo:</span>
                <p className="text-sm font-medium text-gray-900">{dealerInfo?.createdAt ? new Date(dealerInfo.createdAt).toLocaleString('vi-VN') : 'N/A'}</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-xl">
                <span className="text-sm font-semibold text-orange-600 block mb-2">Ngày cập nhật:</span>
                <p className="text-sm font-medium text-gray-900">{dealerInfo?.updatedAt ? new Date(dealerInfo.updatedAt).toLocaleString('vi-VN') : 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl shadow-xl p-6 text-white">
            <h3 className="text-xl font-bold mb-6 flex items-center pb-3 border-b border-purple-400">
              ⚡ Thao tác nhanh
            </h3>
            <div className="space-y-3">
              <button className="w-full bg-white text-blue-600 hover:bg-blue-50 px-5 py-3 rounded-xl font-bold shadow-lg transition-all duration-200 hover:scale-105 flex items-center justify-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Xem báo cáo chi tiết</span>
              </button>
              <button className="w-full bg-white text-green-600 hover:bg-green-50 px-5 py-3 rounded-xl font-bold shadow-lg transition-all duration-200 hover:scale-105 flex items-center justify-center space-x-2">
                <Building2 className="h-5 w-5" />
                <span>Quản lý nhân viên</span>
              </button>
              <button className="w-full bg-white text-purple-600 hover:bg-purple-50 px-5 py-3 rounded-xl font-bold shadow-lg transition-all duration-200 hover:scale-105 flex items-center justify-center space-x-2">
                <Edit className="h-5 w-5" />
                <span>Cập nhật thông tin</span>
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