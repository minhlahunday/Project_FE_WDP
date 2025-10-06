import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Eye
} from 'lucide-react';
// import { mockVehicles } from '../../../data/mockData';
import { authService } from '../../../services/authService';

export const CarDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [vehicle, setVehicle] = useState<unknown | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    // Scroll to top when component mounts or ID changes
    window.scrollTo(0, 0);
    setImageLoaded(false);
    setShowContent(false);
    
    if (id) {
      loadVehicle(id);
    }
  }, [id]);

  const loadVehicle = async (vehicleId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🚀 Loading vehicle by ID:', vehicleId);
      const response = await authService.getVehicleById(vehicleId);
      
      if (response.success && response.data) {
        console.log('✅ Vehicle loaded successfully:', response.data);
        setVehicle(response.data);
      } else {
        console.error('❌ Failed to load vehicle:', response.message);
        setError(response.message || 'Không thể tải thông tin xe');
        // Không fallback về mock data để thấy lỗi thật
      }
    } catch (err) {
      console.error('❌ Error loading vehicle:', err);
      setError('Lỗi khi tải thông tin xe');
      // Không fallback về mock data để thấy lỗi thật
    } finally {
      setLoading(false);
    }
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    // Delay showing content for better visual effect
    setTimeout(() => {
      setShowContent(true);
    }, 500);
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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin xe...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !vehicle) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Không thể tải thông tin xe</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/portal/car-product')}
            className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800"
          >
            Quay lại danh sách xe
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Vehicle Name */}
      <div className="relative bg-gradient-to-r from-blue-900 via-purple-900 to-blue-900 h-[70vh] flex items-center justify-center overflow-hidden">
        {/* Back Button */}
        <div className="absolute top-6 left-6 z-20">
          <button 
            onClick={() => navigate(-1)}
            className="inline-flex items-center bg-black/20 backdrop-blur-sm hover:bg-black/30 text-white px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 group border border-white/20"
          >
            <svg className="w-4 h-4 mr-2 transition-transform duration-200 group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Trở lại
          </button>
        </div>

        {/* Background Car Image */}
        <div className="absolute inset-0 opacity-10">
          <img
            src={(getVehicleProperty('images', []) as string[])[0] || '/placeholder-car.jpg'}
            alt={getVehicleProperty('model', 'Car') as string}
            className="w-full h-full object-cover blur-lg"
          />
        </div>
        
        {/* Foreground Car Image with loading state */}
        <div className="relative z-10 w-full max-w-4xl">
          {!imageLoaded && (
            <div className="w-full h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
          )}
          <img
            src={(getVehicleProperty('images', []) as string[])[0] || '/placeholder-car.jpg'}
            alt={getVehicleProperty('model', 'Car') as string}
            className={`w-full h-auto object-contain max-h-[50vh] transition-opacity duration-1000 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={handleImageLoad}
          />
        </div>

        {/* Vehicle Name Overlay with fade-in effect */}
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-1000 ${showContent ? 'opacity-90' : 'opacity-0'}`}>
          <h1 className="text-6xl font-light text-white italic tracking-wider">
            {getVehicleProperty('model', 'Car') as string}
          </h1>
        </div>
      </div>

      {/* Vehicle Title Section with fade-in effect */}
      <div className={`bg-white py-16 transition-opacity duration-1000 delay-500 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-5xl font-light text-gray-900 mb-4">Vinfast {getVehicleProperty('model', 'Car') as string} Electric</h2>
          <p className="text-gray-600">{getVehicleProperty('category', 'Electro') as string}</p>
          
          {/* Thêm thông tin mới từ API */}
          <div className="mt-8 flex justify-center items-center space-x-8">
            <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm">
              <span className="text-xs text-gray-500 uppercase tracking-wide">SKU</span>
              <span className="text-sm font-medium text-gray-800">{getVehicleProperty('sku', 'N/A') as string}</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm">
              <span className="text-xs text-gray-500 uppercase tracking-wide">Version</span>
              <span className="text-sm font-medium text-gray-800">{getVehicleProperty('version', '2025') as string}</span>
            </div>
            <div className={`px-4 py-2 rounded-full shadow-sm ${
              getVehicleProperty('release_status') === 'available' 
                ? 'bg-green-100/90 text-green-800 border border-green-200' 
                : 'bg-orange-100/90 text-orange-800 border border-orange-200'
            }`}>
              <span className="text-xs font-medium uppercase tracking-wide">
                {getVehicleProperty('release_status', 'available') === 'available' ? 'Có sẵn' : 'Sắp ra mắt'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Vehicle Info - Stats Section with fade-in effect */}
      <div className={`bg-gray-50 py-16 transition-opacity duration-1000 delay-700 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">{String(getVehicleProperty('range_km', '300'))} km</div>
              <p className="text-gray-600">Phạm vi</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">{String(getVehicleProperty('top_speed', '180'))} km/h</div>
              <p className="text-gray-600">Tốc độ tối đa</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">{formatPrice(getVehicleProperty('price', 500000000) as number)}</div>
              <p className="text-gray-600">Giá bán</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">{String(getVehicleProperty('charging_fast', '1'))}h</div>
              <p className="text-gray-600">Thời gian sạc</p>
            </div>
          </div>
          
          {/* Thêm thông tin chi tiết từ API */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="text-2xl font-bold text-blue-600 mb-2">{String(getVehicleProperty('motor_power', '0'))} kW</div>
              <p className="text-gray-600 text-sm font-medium">Công suất động cơ</p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="text-2xl font-bold text-blue-600 mb-2">{String(getVehicleProperty('battery_capacity', '0'))} kWh</div>
              <p className="text-gray-600 text-sm font-medium">Dung lượng pin</p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="text-2xl font-bold text-blue-600 mb-2">{String(getVehicleProperty('weight', '0'))} kg</div>
              <p className="text-gray-600 text-sm font-medium">Trọng lượng</p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="text-2xl font-bold text-blue-600 mb-2">{String(getVehicleProperty('seating_capacity', '0'))}</div>
              <p className="text-gray-600 text-sm font-medium">Số chỗ ngồi</p>
            </div>
          </div>
          
          <div className="mt-12 text-center">
            <button
              onClick={() => navigate(`/car-deposit?vehicleId=${id}`)}
              className="bg-black hover:bg-gray-800 text-white px-12 py-3 rounded-lg font-medium mr-4"
            >
              Đặt cọc ngay
            </button>
            <button
              onClick={() => navigate(`/portal/test-drive?vehicleId=${id}`)}
              className="border border-gray-300 text-gray-700 px-12 py-3 rounded-lg font-medium hover:bg-gray-50"
            >
              Đặt lái thử
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - MOVED TO BOTTOM with fade-in effect */}
      <div className={`max-w-7xl mx-auto px-4 py-8 bg-white transition-opacity duration-1000 delay-1000 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Left Side - Specifications */}
          <div className="space-y-12">
            {/* Thông tin bổ sung */}
            <div className="space-y-2">
              <div className="text-6xl font-light text-gray-900">
                {getVehicleProperty('battery_type', 'NMC') as string}
              </div>
              <h3 className="text-lg font-medium text-gray-900">Loại pin</h3>
            </div>
            
            <div className="space-y-2">
              <div className="text-6xl font-light text-gray-900">
                {getVehicleProperty('charging_slow', '5')}h
              </div>
              <h3 className="text-lg font-medium text-gray-900">Sạc chậm</h3>
            </div>
            
            <div className="space-y-2">
              <div className="text-6xl font-light text-gray-900">
                {getVehicleProperty('stock', '0')} xe
              </div>
              <h3 className="text-lg font-medium text-gray-900">Tồn kho</h3>
            </div>
            
            {/* Tính năng an toàn */}
            {(getVehicleProperty('safety_features', []) as string[]).length > 0 && (
              <div className="space-y-2">
                <div className="text-6xl font-light text-gray-900">
                  ✓ {(getVehicleProperty('safety_features', []) as string[])[0] || 'aaaaaaaaaac'}
                </div>
                <h3 className="text-lg font-medium text-gray-900">Tính năng an toàn</h3>
                <div className="flex flex-wrap gap-2 mt-4">
                  {(getVehicleProperty('safety_features', []) as string[]).map((feature, index) => (
                    <span key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                      ✓ {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Màu sắc có sẵn */}
            {(getVehicleProperty('color_options', []) as string[]).length > 0 && (
              <div className="space-y-2">
                <div className="text-6xl font-light text-gray-900">
                  {(getVehicleProperty('color_options', ['red']) as string[])[0] || 'red'}
                </div>
                <h3 className="text-lg font-medium text-gray-900">Màu sắc có sẵn</h3>
                <div className="flex flex-wrap gap-2 mt-4">
                  {(getVehicleProperty('color_options', []) as string[]).map((color, index) => (
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
            )}
          </div>

          {/* Right Side - Vehicle Image */}
          <div className="relative">
            <img
              src={(getVehicleProperty('images', []) as string[])[selectedImage] || '/placeholder-car.jpg'}
              alt={getVehicleProperty('model', 'Car') as string}
              className="w-full h-auto object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
