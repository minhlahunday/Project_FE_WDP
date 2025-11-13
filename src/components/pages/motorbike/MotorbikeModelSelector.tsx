import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Check, Eye, ShoppingCart } from 'lucide-react';
import { Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
// import { mockMotorbikes } from '../../../data/mockData';
import { Vehicle } from '../../../types/index';
import { Header } from '../../common/Header';
import { Sidebar } from '../../common/Sidebar';
import { authService } from '../../../services/authService';

export const MotorbikeModelSelector: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedModels, setSelectedModels] = useState<Vehicle[]>([]);
  const [selectingIndex, setSelectingIndex] = useState<number>(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('motorbikes');
  const [motorbikes, setMotorbikes] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    
    if (location.state?.selectedModels) {
      setSelectedModels(location.state.selectedModels);
    }
    if (location.state?.selectingIndex !== undefined) {
      setSelectingIndex(location.state.selectingIndex);
    }
    
    loadMotorbikes();
  }, [location.state]);

  const loadMotorbikes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🚀 Loading motorbikes for model selector...');
      const response = await authService.getVehicles({ category: 'motorbike' });
      
      if (response.success && (response as Record<string, unknown>).data) {
        const responseData = (response as Record<string, unknown>).data as Record<string, unknown>;
        console.log('✅ Motorbikes loaded successfully for selector:', responseData.data);
        const motorbikesData = responseData.data as unknown[];
        setMotorbikes(motorbikesData);
      } else {
        console.error('❌ Failed to load motorbikes:', response.message);
        setError(response.message || 'Không thể tải danh sách xe máy');
      }
    } catch (err) {
      console.error('❌ Error loading motorbikes:', err);
      setError('Lỗi khi tải danh sách xe máy');
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

  const handleModelSelect = (vehicle: unknown) => {
    const v = vehicle as Record<string, unknown>;
    const newModels = [...selectedModels];
    newModels[selectingIndex] = v as unknown as Vehicle;
    
    navigate('/portal/compare-motorbikes', {
      state: { models: newModels }
    });
  };

  const isSelected = (vehicleId: string) => {
    return selectedModels.some(model => model?.id === vehicleId);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải danh sách xe máy...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && motorbikes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Không thể tải danh sách xe máy</h2>
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

      <div className={`pt-16 transition-all duration-300 ${isSidebarOpen ? 'lg:ml-[220px]' : 'ml-0'}`}>
        {/* Back Button */}
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Button 
            type="default"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/portal/compare-motorbikes')}
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
              Chọn xe máy điện
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Chọn mẫu xe máy điện VinFast để so sánh thông số kỹ thuật và tính năng
            </p>
          </div>

          {/* Model Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {motorbikes.map((vehicle) => {
              const v = vehicle as Record<string, unknown>;
              return (
                <div
                  key={v._id as string || v.id as string}
                  className={`group bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-105 ${
                    isSelected(v._id as string || v.id as string) ? 'ring-4 ring-green-500' : ''
                  }`}
                >
                  {/* Vehicle Image */}
                  <div className="relative overflow-hidden">
                    <img
                      src={((v.images as string[]) || [])[0] || '/placeholder-motorbike.jpg'}
                      alt={v.model as string}
                      className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    {isSelected(v._id as string || v.id as string) && (
                      <div className="absolute top-4 right-4 bg-green-500 text-white rounded-full p-2">
                        <Check className="h-5 w-5" />
                      </div>
                    )}
                  </div>

                  {/* Vehicle Info */}
                  <div className="p-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{v.name as string}</h3>
                    <p className="text-sm text-gray-600 mb-4">{(v.version as string) || '2025'} - {((v.color_options as string[]) || ['Black'])[0]}</p>
                    <p className="text-2xl font-bold text-green-600 mb-6">{formatPrice(v.price as number)}</p>

                    {/* Key Specs */}
                    <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                      <div>
                        <span className="text-gray-500">Tầm hoạt động</span>
                        <div className="font-semibold text-blue-600">{v.range_km as number} km</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Tốc độ tối đa</span>
                        <div className="font-semibold text-yellow-600">{v.top_speed as number} km/h</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Thời gian sạc</span>
                        <div className="font-semibold text-red-600">{v.charging_fast as number}h</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Tồn kho</span>
                        <div className="font-semibold text-gray-600">{v.stock as number || 0} xe</div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2 mb-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/portal/motorbike-detail/${v._id as string || v.id as string}`);
                        }}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium flex items-center justify-center space-x-2"
                      >
                        <Eye className="h-4 w-4" />
                        <span>Chi tiết</span>
                      </button>
                      {/* <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/portal/motorbike-deposit?vehicleId=${v._id as string || v.id as string}`);
                        }}
                        className="flex-1 bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center space-x-2"
                      >
                        <ShoppingCart className="h-4 w-4" />
                        <span>Đặt cọc</span>
                      </button> */}
                    </div>

                    {/* Select Button */}
                    <button
                      onClick={() => handleModelSelect(vehicle)}
                      disabled={isSelected(v._id as string || v.id as string)}
                      className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
                        isSelected(v._id as string || v.id as string)
                          ? 'bg-green-100 text-green-700 cursor-not-allowed'
                          : 'bg-black hover:bg-gray-800 text-white hover:shadow-lg'
                      }`}
                    >
                      {isSelected(v._id as string || v.id as string) ? 'Đã chọn' : 'Chọn xe máy này'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Info Section */}
          <div className="text-center mt-20">
            <div className="inline-flex items-center bg-white px-6 py-3 rounded-full shadow-md">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 animate-pulse"></div>
              <p className="text-sm text-gray-600 font-medium">
                Chọn xe máy điện VinFast để thêm vào so sánh
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Hiệu suất cao</h3>
              <p className="text-gray-600 text-sm">Tầm hoạt động lên đến 101km với một lần sạc</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Giá cả hợp lý</h3>
              <p className="text-gray-600 text-sm">Xe máy điện VinFast với mức giá cạnh tranh</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Bảo hành toàn diện</h3>
              <p className="text-gray-600 text-sm">Bảo hành chính hãng và hỗ trợ khách hàng 24/7</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};