import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, X, Battery, Zap, Clock, Car } from 'lucide-react';
import { Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
// import { Vehicle } from '../../../types';
import { Header } from '../../common/Header';
import { Sidebar } from '../../common/Sidebar';
import { authService } from '../../../services/authService';

export const CompareModels: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedModels, setSelectedModels] = useState<unknown[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('vehicles');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string>('');

  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Check if models were passed from ModelSelector
    if (location.state?.models) {
      setSelectedModels(location.state.models);
      
      // Nếu đã có đủ 2 xe, gọi API so sánh để lấy dữ liệu đầy đủ
      if (location.state.models.length === 2) {
        const models = location.state.models;
        const id1 = (models[0] as Record<string, unknown>)._id as string || (models[0] as Record<string, unknown>).id as string;
        const id2 = (models[1] as Record<string, unknown>)._id as string || (models[1] as Record<string, unknown>).id as string;
        
        if (id1 && id2) {
          loadComparisonData(id1, id2);
        }
      }
    }
  }, [location.state]);

  const loadComparisonData = async (id1: string, id2: string) => {
    try {
      setLoading(true);
      console.log('🚀 Loading comparison data for vehicles:', id1, id2);
      
      const result = await authService.compareVehicles(id1, id2);
      
      if (result.success && result.vehicle1 && result.vehicle2) {
        console.log('✅ Comparison data loaded successfully (object format)');
        setSelectedModels([result.vehicle1, result.vehicle2]);
        if (result.analysis) {
          setAnalysis(result.analysis);
        }
      } else {
        console.log('ℹ️ API response:', result.message);
        // Nếu API trả về text format hoặc không có dữ liệu đầy đủ
        // Giữ nguyên dữ liệu từ ModelSelector
        if (result.analysis) {
          console.log('📝 Received analysis from API');
          setAnalysis(result.analysis);
        }
      }
    } catch (error) {
      console.error('❌ Error loading comparison data:', error);
      // Giữ nguyên dữ liệu từ ModelSelector nếu có lỗi
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    if (!price) return 'Liên hệ';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const openModelSelector = (index: number) => {
    navigate('/portal/model-selector', { 
      state: { 
        selectedModels,
        selectingIndex: index 
      }
    });
  };

  const removeModel = (index: number) => {
    const newModels = [...selectedModels];
    newModels[index] = null as unknown;
    setSelectedModels(newModels.filter(m => m !== null));
  };

  const ModelCard = ({ vehicle, index }: { vehicle?: unknown; index: number }) => {
    if (!vehicle) {
      return (
        <div className="group">
          <div className="bg-white rounded-2xl shadow-lg border-2 border-dashed border-gray-200 p-12 text-center min-h-[500px] flex flex-col justify-center items-center hover:border-gray-400 hover:shadow-xl transition-all duration-150 group-hover:scale-105">
            <button
              onClick={() => openModelSelector(index)}
              className="w-full h-full flex flex-col justify-center items-center"
            >
              <div className={`w-20 h-20 ${index === 0 ? 'bg-black' : 'bg-gray-300'} rounded-full flex items-center justify-center mb-6 group-hover:${index === 0 ? 'bg-gray-800' : 'bg-gray-400'} transition-colors duration-150 shadow-lg`}>
                <Plus className="h-10 w-10 text-white" />
              </div>
              <span className="text-2xl font-light text-gray-900 group-hover:text-gray-700 transition-colors duration-150">
                Chọn mẫu xe
              </span>
              <span className="text-sm text-gray-500 mt-2">Chọn mẫu xe để so sánh</span>
            </button>
          </div>
        </div>
      );
    }

    const v = vehicle as Record<string, unknown>;

    return (
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Remove Button */}
        <div className="flex justify-end p-4">
          <button
            onClick={() => removeModel(index)}
            className="text-gray-400 hover:text-red-500 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Vehicle Image */}
        <div className="px-6 pb-4">
          <img
            src={(v.images as string[])?.[0] || '/placeholder-car.jpg'}
            alt={v.model as string}
            className="w-full h-48 object-cover rounded-xl"
          />
        </div>

        {/* Vehicle Info */}
        <div className="p-6 pt-0">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{v.name as string}</h3>
          <p className="text-sm text-gray-600 mb-2">
            {v.version as string || 'Phiên bản chuẩn'} - {(v.color_options as string[])?.[0] || 'Màu chuẩn'}
          </p>
          <p className="text-2xl font-bold text-green-600 mb-6">{formatPrice(v.price as number)}</p>

          {/* Specifications Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div className="flex items-center space-x-2">
              <Battery className="h-4 w-4 text-blue-500" />
              <span>{v.range_km as number || 0}km</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span>{v.top_speed as number || 0}km/h</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-red-500" />
              <span>{v.charging_fast as number || 0}h</span>
            </div>
            <div className="flex items-center space-x-2">
              <Car className="h-4 w-4 text-gray-500" />
              <span>{v.stock as number || 0} xe</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={() => navigate(`/portal/car-detail/${v._id as string || v.id as string}`)}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Chi tiết
            </button>
            <button
              onClick={() => navigate(`/portal/car-deposit?vehicleId=${v._id as string || v.id as string}`)}
              className="flex-1 bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Đặt cọc
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
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

      <div className={`pt-16 transition-all duration-150 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        {/* Back Button */}
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Button 
            type="default"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
            size="large"
            style={{
              borderRadius: '8px',
              minWidth: '120px',
              fontWeight: 500,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
            className="hover:border-blue-500 hover:text-blue-500 transition-all duration-200"
          >
            Quay lại
          </Button>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-20">
          {/* Title Section */}
          <div className="text-center mb-20">
            <h1 className="text-6xl font-light text-gray-900 mb-6 tracking-tight">
              So sánh mẫu xe
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Bạn cần hỗ trợ quyết định? Bây giờ bạn có thể so sánh những mẫu xe yêu thích với nhau.
            </p>
          </div>

          {/* Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            <ModelCard vehicle={selectedModels[0]} index={0} />
            <ModelCard vehicle={selectedModels[1]} index={1} />
          </div>

          {/* Loading Indicator */}
          {loading && (
            <div className="mt-20 text-center">
              <div className="inline-flex items-center bg-white px-6 py-4 rounded-full shadow-lg">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                <p className="text-gray-700 font-medium">Đang tải dữ liệu so sánh...</p>
              </div>
            </div>
          )}

          {/* Detailed Comparison Table */}
          {selectedModels.length === 2 && !loading && (
            <div className="mt-20 bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-black p-8">
                <h2 className="text-3xl font-bold text-white text-center">So sánh chi tiết</h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-6 font-semibold text-gray-900 border-b">Thông số kỹ thuật</th>
                      {selectedModels.map((vehicle, index) => {
                        const v = vehicle as Record<string, unknown>;
                        return (
                          <th key={v._id as string || v.id as string || index} className="text-center p-6 font-semibold text-gray-900 border-b min-w-[300px]">
                            {v.name as string}
                        </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {/* Basic Information */}
                    <tr className="hover:bg-gray-50">
                      <td className="p-6 font-medium text-gray-900">Hình ảnh</td>
                      {selectedModels.map((vehicle, index) => {
                        const v = vehicle as Record<string, unknown>;
                        return (
                          <td key={v._id as string || v.id as string || index} className="p-6 text-center">
                            <img src={((v.images as string[]) || [])[0] || '/placeholder-car.jpg'} alt={v.name as string} className="w-32 h-24 object-cover mx-auto rounded-lg shadow-sm" />
                        </td>
                        );
                      })}
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-6 font-medium text-gray-900">Tên xe</td>
                      {selectedModels.map((vehicle, index) => {
                        const v = vehicle as Record<string, unknown>;
                        return (
                          <td key={v._id as string || v.id as string || index} className="p-6 text-center font-bold text-gray-900">{v.name as string}</td>
                        );
                      })}
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-6 font-medium text-gray-900">Model</td>
                      {selectedModels.map((vehicle, index) => {
                        const v = vehicle as Record<string, unknown>;
                        return (
                          <td key={v._id as string || v.id as string || index} className="p-6 text-center text-gray-700">{v.model as string}</td>
                        );
                      })}
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-6 font-medium text-gray-900">Phiên bản</td>
                      {selectedModels.map((vehicle, index) => {
                        const v = vehicle as Record<string, unknown>;
                        return (
                          <td key={v._id as string || v.id as string || index} className="p-6 text-center text-gray-700">{v.version as string || '2025'}</td>
                        );
                      })}
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-6 font-medium text-gray-900">Trạng thái</td>
                      {selectedModels.map((vehicle, index) => {
                        const v = vehicle as Record<string, unknown>;
                        return (
                          <td key={v._id as string || v.id as string || index} className="p-6 text-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              v.release_status === 'available' ? 'bg-green-100 text-green-800' :
                              v.release_status === 'coming_soon' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {v.release_status as string || 'Không xác định'}
                            </span>
                          </td>
                        );
                      })}
                    </tr>

                    {/* Pricing */}
                    <tr className="hover:bg-gray-50 bg-blue-50">
                      <td className="p-6 font-bold text-blue-900">💰 GIÁ BÁN</td>
                      {selectedModels.map((vehicle, index) => {
                        const v = vehicle as Record<string, unknown>;
                        return (
                          <td key={v._id as string || v.id as string || index} className="p-6 text-center font-bold text-green-600 text-xl">
                            {formatPrice(v.price as number)}
                          </td>
                        );
                      })}
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-6 font-medium text-gray-900">Giá trên đường</td>
                      {selectedModels.map((vehicle, index) => {
                        const v = vehicle as Record<string, unknown>;
                        return (
                          <td key={v._id as string || v.id as string || index} className="p-6 text-center text-gray-700">
                            {(v.on_road_price as number) > 0 ? formatPrice(v.on_road_price as number) : 'Chưa có'}
                          </td>
                        );
                      })}
                    </tr>

                    {/* Battery & Charging */}
                    <tr className="hover:bg-gray-50 bg-green-50">
                      <td className="p-6 font-bold text-green-900">🔋 PIN & SẠC</td>
                      <td></td>
                      <td></td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-6 font-medium text-gray-900">Loại pin</td>
                      {selectedModels.map((vehicle, index) => {
                        const v = vehicle as Record<string, unknown>;
                        return (
                          <td key={v._id as string || v.id as string || index} className="p-6 text-center text-gray-700">{v.battery_type as string}</td>
                        );
                      })}
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-6 font-medium text-gray-900">Dung lượng pin</td>
                      {selectedModels.map((vehicle, index) => {
                        const v = vehicle as Record<string, unknown>;
                        return (
                          <td key={v._id as string || v.id as string || index} className="p-6 text-center text-blue-600 font-semibold">{v.battery_capacity as number || 0} kWh</td>
                        );
                      })}
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-6 font-medium text-gray-900">Tầm hoạt động</td>
                      {selectedModels.map((vehicle, index) => {
                        const v = vehicle as Record<string, unknown>;
                        return (
                          <td key={v._id as string || v.id as string || index} className="p-6 text-center text-blue-600 font-semibold text-lg">{v.range_km as number || 0} km</td>
                        );
                      })}
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-6 font-medium text-gray-900">Tầm hoạt động WLTP</td>
                      {selectedModels.map((vehicle, index) => {
                        const v = vehicle as Record<string, unknown>;
                        return (
                          <td key={v._id as string || v.id as string || index} className="p-6 text-center text-blue-600 font-semibold">{v.wltp_range_km as number || 0} km</td>
                        );
                      })}
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-6 font-medium text-gray-900">Sạc nhanh</td>
                      {selectedModels.map((vehicle, index) => {
                        const v = vehicle as Record<string, unknown>;
                        return (
                          <td key={v._id as string || v.id as string || index} className="p-6 text-center text-red-600 font-semibold">{v.charging_fast as number || 0}h</td>
                        );
                      })}
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-6 font-medium text-gray-900">Sạc chậm</td>
                      {selectedModels.map((vehicle, index) => {
                        const v = vehicle as Record<string, unknown>;
                        return (
                          <td key={v._id as string || v.id as string || index} className="p-6 text-center text-orange-600 font-semibold">{v.charging_slow as number || 0}h</td>
                        );
                      })}
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-6 font-medium text-gray-900">Loại cổng sạc</td>
                      {selectedModels.map((vehicle, index) => {
                        const v = vehicle as Record<string, unknown>;
                        return (
                          <td key={v._id as string || v.id as string || index} className="p-6 text-center text-gray-700">{v.charging_port_type as string}</td>
                        );
                      })}
                    </tr>

                    {/* Performance */}
                    <tr className="hover:bg-gray-50 bg-yellow-50">
                      <td className="p-6 font-bold text-yellow-900">⚡ HIỆU SUẤT</td>
                      <td></td>
                      <td></td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-6 font-medium text-gray-900">Công suất động cơ</td>
                      {selectedModels.map((vehicle, index) => {
                        const v = vehicle as Record<string, unknown>;
                        return (
                          <td key={v._id as string || v.id as string || index} className="p-6 text-center text-yellow-600 font-semibold">{v.motor_power as number || 0} kW</td>
                        );
                      })}
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-6 font-medium text-gray-900">Tốc độ tối đa</td>
                      {selectedModels.map((vehicle, index) => {
                        const v = vehicle as Record<string, unknown>;
                        return (
                          <td key={v._id as string || v.id as string || index} className="p-6 text-center text-yellow-600 font-semibold text-lg">{v.top_speed as number || 0} km/h</td>
                        );
                      })}
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-6 font-medium text-gray-900">Gia tốc 0-100km/h</td>
                      {selectedModels.map((vehicle, index) => {
                        const v = vehicle as Record<string, unknown>;
                        return (
                          <td key={v._id as string || v.id as string || index} className="p-6 text-center text-red-600 font-semibold">{v.acceleration as number}s</td>
                        );
                      })}
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-6 font-medium text-gray-900">Hệ dẫn động</td>
                      {selectedModels.map((vehicle, index) => {
                        const v = vehicle as Record<string, unknown>;
                        return (
                          <td key={v._id as string || v.id as string || index} className="p-6 text-center text-gray-700">{v.drivetrain as string}</td>
                        );
                      })}
                    </tr>

                    {/* Dimensions & Weight */}
                    <tr className="hover:bg-gray-50 bg-purple-50">
                      <td className="p-6 font-bold text-purple-900">📏 KÍCH THƯỚC & TRỌNG LƯỢNG</td>
                      <td></td>
                      <td></td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-6 font-medium text-gray-900">Chiều dài</td>
                      {selectedModels.map((vehicle, index) => {
                        const v = vehicle as Record<string, unknown>;
                        const dimensions = v.dimensions as Record<string, unknown>;
                        return (
                          <td key={v._id as string || v.id as string || index} className="p-6 text-center text-gray-700">{dimensions?.length as number || 0} mm</td>
                        );
                      })}
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-6 font-medium text-gray-900">Chiều rộng</td>
                      {selectedModels.map((vehicle, index) => {
                        const v = vehicle as Record<string, unknown>;
                        const dimensions = v.dimensions as Record<string, unknown>;
                        return (
                          <td key={v._id as string || v.id as string || index} className="p-6 text-center text-gray-700">{dimensions?.width as number || 0} mm</td>
                        );
                      })}
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-6 font-medium text-gray-900">Chiều cao</td>
                      {selectedModels.map((vehicle, index) => {
                        const v = vehicle as Record<string, unknown>;
                        const dimensions = v.dimensions as Record<string, unknown>;
                        return (
                          <td key={v._id as string || v.id as string || index} className="p-6 text-center text-gray-700">{dimensions?.height as number || 0} mm</td>
                        );
                      })}
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-6 font-medium text-gray-900">Chiều dài cơ sở</td>
                      {selectedModels.map((vehicle, index) => {
                        const v = vehicle as Record<string, unknown>;
                        const dimensions = v.dimensions as Record<string, unknown>;
                        return (
                          <td key={v._id as string || v.id as string || index} className="p-6 text-center text-gray-700">{dimensions?.wheelbase as number || 0} mm</td>
                        );
                      })}
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-6 font-medium text-gray-900">Khoảng sáng gầm</td>
                      {selectedModels.map((vehicle, index) => {
                        const v = vehicle as Record<string, unknown>;
                        const dimensions = v.dimensions as Record<string, unknown>;
                        return (
                          <td key={v._id as string || v.id as string || index} className="p-6 text-center text-gray-700">{dimensions?.ground_clearance as number || 0} mm</td>
                        );
                      })}
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-6 font-medium text-gray-900">Trọng lượng</td>
                      {selectedModels.map((vehicle, index) => {
                        const v = vehicle as Record<string, unknown>;
                        return (
                          <td key={v._id as string || v.id as string || index} className="p-6 text-center text-gray-700">{v.weight as number || 0} kg</td>
                        );
                      })}
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-6 font-medium text-gray-900">Tải trọng</td>
                      {selectedModels.map((vehicle, index) => {
                        const v = vehicle as Record<string, unknown>;
                        return (
                          <td key={v._id as string || v.id as string || index} className="p-6 text-center text-gray-700">{v.payload as number || 0} kg</td>
                        );
                      })}
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-6 font-medium text-gray-900">Số chỗ ngồi</td>
                      {selectedModels.map((vehicle, index) => {
                        const v = vehicle as Record<string, unknown>;
                        return (
                          <td key={v._id as string || v.id as string || index} className="p-6 text-center text-gray-700">{v.seating_capacity as number || 0} chỗ</td>
                        );
                      })}
                    </tr>

                    {/* Features */}
                    <tr className="hover:bg-gray-50 bg-indigo-50">
                      <td className="p-6 font-bold text-indigo-900">🎯 TÍNH NĂNG</td>
                      <td></td>
                      <td></td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-6 font-medium text-gray-900">Kích thước lốp</td>
                      {selectedModels.map((vehicle, index) => {
                        const v = vehicle as Record<string, unknown>;
                        return (
                          <td key={v._id as string || v.id as string || index} className="p-6 text-center text-gray-700">{v.tire_size as string}</td>
                        );
                      })}
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-6 font-medium text-gray-900">Loại cốp</td>
                      {selectedModels.map((vehicle, index) => {
                        const v = vehicle as Record<string, unknown>;
                        return (
                          <td key={v._id as string || v.id as string || index} className="p-6 text-center text-gray-700">{v.trunk_type as string}</td>
                        );
                      })}
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-6 font-medium text-gray-900">Chế độ lái</td>
                      {selectedModels.map((vehicle, index) => {
                        const v = vehicle as Record<string, unknown>;
                        const drivingModes = v.driving_modes as string[] || [];
                        return (
                          <td key={v._id as string || v.id as string || index} className="p-6 text-center text-gray-700">
                            {drivingModes.length > 0 ? drivingModes.join(', ') : 'Chưa có'}
                          </td>
                        );
                      })}
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-6 font-medium text-gray-900">Phiên bản phần mềm</td>
                      {selectedModels.map((vehicle, index) => {
                        const v = vehicle as Record<string, unknown>;
                        return (
                          <td key={v._id as string || v.id as string || index} className="p-6 text-center text-gray-700">{v.software_version as string || 'Chưa có'}</td>
                        );
                      })}
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-6 font-medium text-gray-900">Cập nhật OTA</td>
                      {selectedModels.map((vehicle, index) => {
                        const v = vehicle as Record<string, unknown>;
                        return (
                          <td key={v._id as string || v.id as string || index} className="p-6 text-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              v.ota_update ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {v.ota_update ? 'Có' : 'Không'}
                            </span>
                          </td>
                        );
                      })}
                    </tr>

                    {/* Safety & Warranty */}
                    <tr className="hover:bg-gray-50 bg-red-50">
                      <td className="p-6 font-bold text-red-900">🛡️ AN TOÀN & BẢO HÀNH</td>
                      <td></td>
                      <td></td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-6 font-medium text-gray-900">Tính năng an toàn</td>
                      {selectedModels.map((vehicle, index) => {
                        const v = vehicle as Record<string, unknown>;
                        const safetyFeatures = v.safety_features as string[] || [];
                        return (
                          <td key={v._id as string || v.id as string || index} className="p-6 text-center">
                            <div className="space-y-1">
                              {safetyFeatures.slice(0, 3).map((feature, featureIndex) => (
                                <div key={featureIndex} className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                  {feature}
                                </div>
                              ))}
                              {safetyFeatures.length > 3 && (
                                <div className="text-xs text-gray-500">+{safetyFeatures.length - 3} tính năng khác</div>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-6 font-medium text-gray-900">Bảo hành xe</td>
                      {selectedModels.map((vehicle, index) => {
                        const v = vehicle as Record<string, unknown>;
                        return (
                          <td key={v._id as string || v.id as string || index} className="p-6 text-center text-gray-700">{v.warranty_years as number || 0} năm</td>
                        );
                      })}
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-6 font-medium text-gray-900">Bảo hành pin</td>
                      {selectedModels.map((vehicle, index) => {
                        const v = vehicle as Record<string, unknown>;
                        return (
                          <td key={v._id as string || v.id as string || index} className="p-6 text-center text-gray-700">{v.battery_warranty_years as number || 0} năm</td>
                        );
                      })}
                    </tr>

                    {/* Availability */}
                    <tr className="hover:bg-gray-50 bg-gray-50">
                      <td className="p-6 font-bold text-gray-900">📦 TÌNH TRẠNG</td>
                      <td></td>
                      <td></td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-6 font-medium text-gray-900">Tồn kho</td>
                      {selectedModels.map((vehicle, index) => {
                        const v = vehicle as Record<string, unknown>;
                        return (
                          <td key={v._id as string || v.id as string || index} className="p-6 text-center text-gray-600">{v.stock as number || 0} xe</td>
                        );
                      })}
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-6 font-medium text-gray-900">Màu sắc có sẵn</td>
                      {selectedModels.map((vehicle, index) => {
                        const v = vehicle as Record<string, unknown>;
                        const colorOptions = v.color_options as string[] || [];
                        return (
                          <td key={v._id as string || v.id as string || index} className="p-6 text-center text-gray-700">
                            <div className="space-y-1">
                              {colorOptions.slice(0, 3).map((color, colorIndex) => (
                                <div key={colorIndex} className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                  {color}
                                </div>
                              ))}
                              {colorOptions.length > 3 && (
                                <div className="text-xs text-gray-500">+{colorOptions.length - 3} màu khác</div>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="bg-gray-50 p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {selectedModels.map((vehicle, index) => {
                    const v = vehicle as Record<string, unknown>;
                    return (
                      <div key={v._id as string || v.id as string || index} className="flex space-x-4">
                      <button
                          onClick={() => navigate(`/portal/car-detail/${v._id as string || v.id as string}`)}
                        className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
                      >
                          Xem {v.name as string}
                      </button>
                      <button
                          onClick={() => navigate(`/portal/car-deposit?vehicleId=${v._id as string || v.id as string}`)}
                        className="flex-1 bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
                      >
                          Đặt {v.name as string}
                      </button>
                    </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* AI Analysis */}
          {analysis && selectedModels.length === 2 && (
            <div className="mt-20 bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-black p-8">
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h2 className="text-3xl font-bold text-white text-center">Phân tích chi tiết từ AI</h2>
                </div>
              </div>

              <div className="p-8">
                {/* Phân tích cho từng xe */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {selectedModels.map((vehicle, index) => {
                    const v = vehicle as Record<string, unknown>;
                    return (
                      <div key={v._id as string || v.id as string || index} 
                        className={`p-6 rounded-xl ${index === 0 ? 'bg-blue-50 border border-blue-100' : 'bg-green-50 border border-green-100'}`}
                      >
                        <h3 className={`text-xl font-bold mb-4 ${index === 0 ? 'text-blue-800' : 'text-green-800'}`}>
                          {v.name as string}
                        </h3>
                        <div className="space-y-3">
                          <h4 className={`font-semibold ${index === 0 ? 'text-blue-700' : 'text-green-700'}`}>Ưu điểm:</h4>
                          <ul className="list-disc list-inside space-y-2 text-gray-700">
                            <li>Giá: {formatPrice(v.price as number)}</li>
                            <li>Tầm hoạt động: {v.range_km as number} km</li>
                            <li>Thời gian sạc nhanh: {v.charging_fast as number}h</li>
                            <li>Công suất: {v.motor_power as number} kW</li>
                          </ul>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Phân tích tổng quan */}
                <div className="mt-8 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                  <h3 className="text-xl font-bold text-indigo-800 mb-4">Phân tích tổng quan</h3>
                  <div className="prose prose-indigo max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{analysis}</p>
                  </div>
                </div>

                {/* Gợi ý lựa chọn */}
                <div className="mt-8 p-6 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-100">
                  <h3 className="text-xl font-bold text-amber-800 mb-4">Gợi ý lựa chọn</h3>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center mt-1">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-700">Nếu bạn cần một chiếc xe đô thị với giá cả phải chăng, {(selectedModels[0] as Record<string, unknown>).name as string} là lựa chọn tốt.</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center mt-1">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-700">Nếu bạn cần một chiếc xe mạnh mẽ hơn với tầm hoạt động xa, {(selectedModels[1] as Record<string, unknown>).name as string} sẽ phù hợp hơn.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Info Text */}
          <div className="text-center mt-16">
            <div className="inline-flex items-center bg-white px-6 py-3 rounded-full shadow-md">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 animate-pulse"></div>
              <p className="text-sm text-gray-600 font-medium">
                Chọn hai mẫu xe để so sánh thông số kỹ thuật và tính năng
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

