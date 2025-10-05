import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Battery, 
  Zap, 
  Clock, 
  ShoppingCart, 
  Heart, 
  Share2, 
  Star,
  MapPin,
  Calendar,
  Shield,
  Settings,
  Car,
  Users,
  Weight,
  Ruler,
  Gauge,
  Wrench,
  Palette,
  Camera,
  CheckCircle,
  AlertCircle,
  Info,
  Eye,
  Bike
} from 'lucide-react';
// import { mockMotorbikes } from '../../../data/mockData';
// import { Vehicle } from '../../../types';
import { Header } from '../../common/Header';
import { Sidebar } from '../../common/Sidebar';
import { authService } from '../../../services/authService';

export const MotorbikeDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [vehicle, setVehicle] = useState<unknown | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('motorbikes');
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (id) {
      loadVehicle(id);
    }
  }, [id]);

  const loadVehicle = async (vehicleId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🚀 Loading motorbike by ID:', vehicleId);
      const response = await authService.getVehicleById(vehicleId);
      
      if (response.success && response.data) {
        console.log('✅ Motorbike loaded successfully:', response.data);
        setVehicle(response.data);
      } else {
        console.error('❌ Failed to load motorbike:', response.message);
        setError(response.message || 'Không thể tải thông tin xe máy');
        // Không fallback về mock data để thấy lỗi thật
      }
    } catch (err) {
      console.error('❌ Error loading motorbike:', err);
      setError('Lỗi khi tải thông tin xe máy');
      // Không fallback về mock data để thấy lỗi thật
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      'available': { color: 'bg-green-100 text-green-800', text: 'Có sẵn' },
      'coming_soon': { color: 'bg-orange-100 text-orange-800', text: 'Sắp ra mắt' },
      'out_of_stock': { color: 'bg-red-100 text-red-800', text: 'Hết hàng' },
      'discontinued': { color: 'bg-gray-100 text-gray-800', text: 'Ngừng sản xuất' }
    };
    return statusMap[status] || { color: 'bg-gray-100 text-gray-800', text: status };
  };

  const getReleaseStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      'available': { color: 'bg-green-100 text-green-800', text: 'Đã có hàng' },
      'coming_soon': { color: 'bg-blue-100 text-blue-800', text: 'Sắp ra mắt' },
      'pre_order': { color: 'bg-purple-100 text-purple-800', text: 'Đặt trước' }
    };
    return statusMap[status] || { color: 'bg-gray-100 text-gray-800', text: status };
  };

  // Helper function to get vehicle property safely
  const getVehicleProperty = (property: string, defaultValue: unknown = '') => {
    if (!vehicle) return defaultValue;
    const vehicleObj = vehicle as Record<string, unknown>;
    return vehicleObj[property] || defaultValue;
  };

  const handleTestDrive = (vehicleId: string) => {
    navigate(`/portal/motorbike-schedule?vehicleId=${vehicleId}`);
  };

  const handleDeposit = (vehicleId: string) => {
    navigate(`/portal/motorbike-deposit?vehicleId=${vehicleId}`);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin xe máy...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !vehicle) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Không thể tải thông tin xe máy</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/portal/motorbike-product')}
            className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800"
          >
            Quay lại danh sách xe máy
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header 
        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />
      
      {/* Sidebar */}
      <Sidebar
        activeSection={activeSection}
        onSectionChange={(section) => setActiveSection(section)}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpen={() => setIsSidebarOpen(true)}
      />

      <div className={`pt-[73px] transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        {/* Back Button */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-6 py-3">
            <button 
              onClick={() => navigate(-1)}
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200 group"
            >
              <svg className="w-4 h-4 mr-1 transition-transform duration-200 group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Quay lại
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-4xl font-light text-gray-900 mb-8">{getVehicleProperty('model', 'Chi tiết xe máy điện') as string}</h1>
          
          {/* Thêm thông tin mới từ API */}
          <div className="mb-8 flex items-center space-x-6">
            <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
              <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">SKU</span>
              <span className="text-sm font-semibold text-gray-800">{getVehicleProperty('sku', 'N/A') as string}</span>
            </div>
            <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
              <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">Version</span>
              <span className="text-sm font-semibold text-gray-800">{getVehicleProperty('version', '2025') as string}</span>
            </div>
            <div className={`px-4 py-2 rounded-full shadow-sm border ${
              getVehicleProperty('release_status') === 'available' 
                ? 'bg-green-100 text-green-800 border-green-200' 
                : 'bg-orange-100 text-orange-800 border-orange-200'
            }`}>
              <span className="text-xs font-semibold uppercase tracking-wide">
                {getVehicleProperty('release_status', 'available') === 'available' ? 'Có sẵn' : 'Sắp ra mắt'}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Image Gallery */}
            <div>
              <div className="bg-white rounded-xl overflow-hidden shadow-lg mb-6">
                <img
                  src={(getVehicleProperty('images', []) as string[])[0] || '/placeholder-motorbike.jpg'}
                  alt={getVehicleProperty('model', 'Motorbike') as string}
                  className="w-full h-[400px] object-cover"
                />
              </div>
            </div>

            {/* Vehicle Info */}
            <div>
              <div className="bg-white rounded-xl p-8 shadow-lg">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{getVehicleProperty('name', getVehicleProperty('model', 'Motorbike')) as string}</h2>
                <p className="text-lg text-gray-600 mb-4">{getVehicleProperty('version', '2025') as string} - {(getVehicleProperty('color_options', ['Black']) as string[]).join(', ')}</p>
                <p className="text-3xl font-bold text-green-600 mb-8">{formatPrice(getVehicleProperty('price', 25000000) as number)}</p>

                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="flex items-center space-x-3">
                    <Battery className="h-6 w-6 text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-600">Tầm hoạt động</p>
                      <p className="font-semibold">{getVehicleProperty('range_km', '120')} km</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Zap className="h-6 w-6 text-yellow-500" />
                    <div>
                      <p className="text-sm text-gray-600">Tốc độ tối đa</p>
                      <p className="font-semibold">{getVehicleProperty('top_speed', '80')} km/h</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Clock className="h-6 w-6 text-red-500" />
                    <div>
                      <p className="text-sm text-gray-600">Thời gian sạc</p>
                      <p className="font-semibold">{getVehicleProperty('charging_fast', '1')}h</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Users className="h-6 w-6 text-green-500" />
                    <div>
                      <p className="text-sm text-gray-600">Số chỗ ngồi</p>
                      <p className="font-semibold">{getVehicleProperty('seating_capacity', '2')}</p>
                    </div>
                  </div>
                </div>

                {/* Thêm thông tin chi tiết từ API */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="flex items-center space-x-3 bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-xl">
                    <Settings className="h-6 w-6 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Công suất động cơ</p>
                      <p className="font-bold text-gray-900">{getVehicleProperty('motor_power', '0')} kW</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-xl">
                    <Battery className="h-6 w-6 text-orange-600" />
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Dung lượng pin</p>
                      <p className="font-bold text-gray-900">{getVehicleProperty('battery_capacity', '0')} kWh</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl">
                    <Weight className="h-6 w-6 text-gray-600" />
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Trọng lượng</p>
                      <p className="font-bold text-gray-900">{getVehicleProperty('weight', '0')} kg</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl">
                    <AlertCircle className="h-6 w-6 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Tồn kho</p>
                      <p className="font-bold text-gray-900">{getVehicleProperty('stock', '0')} xe</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 py-6 mb-8">
                  <h3 className="text-lg font-bold mb-4">Tính năng nổi bật</h3>
                  <div className="space-y-4">
                    {/* Loại pin */}
                    <div className="flex items-center justify-between py-2">
                      <span className="text-gray-600 font-medium">Loại pin</span>
                      <span className="font-semibold text-gray-900">{getVehicleProperty('battery_type', 'NMC') as string}</span>
                    </div>
                    
                    {/* Sạc chậm */}
                    <div className="flex items-center justify-between py-2">
                      <span className="text-gray-600 font-medium">Sạc chậm</span>
                      <span className="font-semibold text-gray-900">{getVehicleProperty('charging_slow', '5')}h</span>
                    </div>
                    
                    {/* Gia tốc */}
                    <div className="flex items-center justify-between py-2">
                      <span className="text-gray-600 font-medium">Gia tốc</span>
                      <span className="font-semibold text-gray-900">{getVehicleProperty('acceleration', '4')}s</span>
                    </div>
                    
                    {/* Tồn kho */}
                    <div className="flex items-center justify-between py-2">
                      <span className="text-gray-600 font-medium">Tồn kho</span>
                      <span className="font-semibold text-gray-900">{getVehicleProperty('stock', '0')} xe</span>
                    </div>
                    
                    {/* Tính năng an toàn */}
                    <div className="pt-4">
                      <h4 className="text-md font-semibold text-gray-900 mb-3">Tính năng an toàn</h4>
                      <div className="flex flex-wrap gap-2">
                        {(getVehicleProperty('safety_features', ['aaaaaaaaaac']) as string[]).map((feature, index) => (
                          <span key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                            ✓ {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    {/* Màu sắc có sẵn */}
                    <div className="pt-4">
                      <h4 className="text-md font-semibold text-gray-900 mb-3">Màu sắc có sẵn</h4>
                      <div className="flex flex-wrap gap-2">
                        {(getVehicleProperty('color_options', ['red']) as string[]).map((color, index) => (
                          <div key={index} className="flex items-center space-x-2 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-200">
                            <div 
                              className="w-4 h-4 rounded-full border border-gray-300"
                              style={{ backgroundColor: color.toLowerCase() }}
                            ></div>
                            <span className="text-gray-700 font-medium text-sm">{color}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>


                <div className="flex space-x-4">
                  <button
                    onClick={() => handleTestDrive(id || '')}
                    className="flex-1 bg-gray-100 text-gray-800 px-6 py-3 rounded-lg font-medium hover:bg-gray-200"
                  >
                    Đặt lái thử
                  </button>
                  <button
                    onClick={() => handleDeposit(id || '')}
                    className="flex-1 bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 flex items-center justify-center space-x-2"
                  >
                    <ShoppingCart className="h-5 w-5" />
                    <span>Đặt cọc ngay</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="mt-12">
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold mb-6">Thông tin chi tiết</h3>
              <p className="text-gray-700 leading-relaxed">{getVehicleProperty('description', 'Xe máy điện VinFast với công nghệ tiên tiến và thiết kế hiện đại.') as string}</p>
              
              {/* Thêm thông tin bổ sung từ API */}
              <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 text-center">
                  <div className="text-lg font-bold text-gray-800 mb-1">{getVehicleProperty('battery_type', 'N/A') as string}</div>
                  <p className="text-gray-600 text-sm font-medium">Loại pin</p>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 text-center">
                  <div className="text-lg font-bold text-blue-600 mb-1">{getVehicleProperty('charging_slow', '0')}h</div>
                  <p className="text-gray-600 text-sm font-medium">Sạc chậm</p>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 text-center">
                  <div className="text-lg font-bold text-green-600 mb-1">{getVehicleProperty('acceleration', '0')}s</div>
                  <p className="text-gray-600 text-sm font-medium">Gia tốc</p>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4 text-center">
                  <div className="text-lg font-bold text-purple-600 mb-1">{getVehicleProperty('warranty_years', '3')} năm</div>
                  <p className="text-gray-600 text-sm font-medium">Bảo hành</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
