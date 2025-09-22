import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Check } from 'lucide-react';
import { mockMotorbikes } from '../../../data/mockData';
import { Vehicle } from '../../../types/index';
import { Header } from '../../common/Header';
import { Sidebar } from '../../common/Sidebar';

export const MotorbikeModelSelector: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedModels, setSelectedModels] = useState<Vehicle[]>([]);
  const [selectingIndex, setSelectingIndex] = useState<number>(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('motorbikes');

  useEffect(() => {
    window.scrollTo(0, 0);
    
    if (location.state?.selectedModels) {
      setSelectedModels(location.state.selectedModels);
    }
    if (location.state?.selectingIndex !== undefined) {
      setSelectingIndex(location.state.selectingIndex);
    }
  }, [location.state]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const handleModelSelect = (vehicle: Vehicle) => {
    const newModels = [...selectedModels];
    newModels[selectingIndex] = vehicle;
    
    navigate('/portal/compare-motorbikes', {
      state: { models: newModels }
    });
  };

  const isSelected = (vehicleId: string) => {
    return selectedModels.some(model => model?.id === vehicleId);
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
      />

      <div className={`pt-[73px] transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        {/* Back Button */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-6 py-3">
            <button 
              onClick={() => navigate('/portal/compare-motorbikes')}
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200 group"
            >
              <svg className="w-4 h-4 mr-1 transition-transform duration-200 group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Quay lại so sánh
            </button>
          </div>
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
            {mockMotorbikes.map((vehicle) => (
              <div
                key={vehicle.id}
                className={`group bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-105 ${
                  isSelected(vehicle.id) ? 'ring-4 ring-green-500' : ''
                }`}
              >
                {/* Vehicle Image */}
                <div className="relative overflow-hidden">
                  <img
                    src={vehicle.images[0]}
                    alt={vehicle.model}
                    className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  {isSelected(vehicle.id) && (
                    <div className="absolute top-4 right-4 bg-green-500 text-white rounded-full p-2">
                      <Check className="h-5 w-5" />
                    </div>
                  )}
                </div>

                {/* Vehicle Info */}
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{vehicle.model}</h3>
                  <p className="text-sm text-gray-600 mb-4">{vehicle.version} - {vehicle.color}</p>
                  <p className="text-2xl font-bold text-green-600 mb-6">{formatPrice(vehicle.price)}</p>

                  {/* Key Specs */}
                  <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                    <div>
                      <span className="text-gray-500">Tầm hoạt động</span>
                      <div className="font-semibold text-blue-600">{vehicle.range} km</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Tốc độ tối đa</span>
                      <div className="font-semibold text-yellow-600">{vehicle.maxSpeed} km/h</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Thời gian sạc</span>
                      <div className="font-semibold text-red-600">{vehicle.chargingTime}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Tồn kho</span>
                      <div className="font-semibold text-gray-600">{vehicle.stock} xe</div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => handleModelSelect(vehicle)}
                    disabled={isSelected(vehicle.id)}
                    className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
                      isSelected(vehicle.id)
                        ? 'bg-green-100 text-green-700 cursor-not-allowed'
                        : 'bg-black hover:bg-gray-800 text-white hover:shadow-lg'
                    }`}
                  >
                    {isSelected(vehicle.id) ? 'Đã chọn' : 'Chọn xe máy này'}
                  </button>
                </div>
              </div>
            ))}
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