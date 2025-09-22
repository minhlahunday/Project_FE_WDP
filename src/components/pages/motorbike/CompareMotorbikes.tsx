import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, X, Battery, Zap, Clock, Bike } from 'lucide-react';
import { Vehicle } from '../../../types/index';
import { Header } from '../../common/Header';
import { Sidebar } from '../../common/Sidebar';

export const CompareMotorbikes: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedModels, setSelectedModels] = useState<Vehicle[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('motorbikes');

  useEffect(() => {
    window.scrollTo(0, 0);
    if (location.state?.models) {
      setSelectedModels(location.state.models);
    }
  }, [location.state]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const openModelSelector = (index: number) => {
    navigate('/portal/motorbike-model-selector', { 
      state: { selectedModels, selectingIndex: index }
    });
  };

  const removeModel = (index: number) => {
    const newModels = [...selectedModels];
    newModels[index] = null as any;
    setSelectedModels(newModels.filter(m => m !== null));
  };

  const ModelCard = ({ vehicle, index }: { vehicle?: Vehicle; index: number }) => {
    if (!vehicle) {
      return (
        <div className="group">
          <div className="bg-white rounded-2xl shadow-lg border-2 border-dashed border-gray-200 p-12 text-center min-h-[500px] flex flex-col justify-center items-center hover:border-gray-400 hover:shadow-xl transition-all duration-300 group-hover:scale-105">
            <button
              onClick={() => openModelSelector(index)}
              className="w-full h-full flex flex-col justify-center items-center"
            >
              <div className={`w-20 h-20 ${index === 0 ? 'bg-black hover:bg-gray-800' : 'bg-gray-300 hover:bg-gray-400'} rounded-full flex items-center justify-center mb-6 transition-colors duration-300 shadow-lg`}>
                <Plus className="h-10 w-10 text-white" />
              </div>
              <span className="text-2xl font-light text-gray-900 group-hover:text-gray-700 transition-colors duration-300">
                Chọn xe máy điện
              </span>
              <span className="text-sm text-gray-500 mt-2">Chọn mẫu xe máy điện VinFast đầu tiên của bạn</span>
            </button>
          </div>
        </div>
      );
    }

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
            src={vehicle.images[0]}
            alt={vehicle.model}
            className="w-full h-48 object-contain rounded-xl bg-gray-50"
          />
        </div>

        {/* Vehicle Info */}
        <div className="p-6 pt-0">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{vehicle.model}</h3>
          <p className="text-sm text-gray-600 mb-2">{vehicle.version} - {vehicle.color}</p>
          <p className="text-2xl font-bold text-green-600 mb-6">{formatPrice(vehicle.price)}</p>

          {/* Specifications Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div className="flex items-center space-x-2">
              <Battery className="h-4 w-4 text-blue-500" />
              <span>{vehicle.range}km</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span>{vehicle.maxSpeed}km/h</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-red-500" />
              <span>{vehicle.chargingTime}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Bike className="h-4 w-4 text-gray-500" />
              <span>{vehicle.stock} xe</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={() => navigate(`/portal/motorbike-detail/${vehicle.id}`)}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Chi tiết
            </button>
            <button
              onClick={() => navigate(`/portal/deposit?vehicleId=${vehicle.id}&type=motorbike`)}
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
      />

      <div className={`pt-[73px] transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        {/* Back Button */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-6 py-3">
            <button 
              onClick={() => navigate('/portal/motorbike-product')}
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200 group"
            >
              <svg className="w-4 h-4 mr-1 transition-transform duration-200 group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Quay lại
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-20">
          {/* Title Section */}
          <div className="text-center mb-20">
            <h1 className="text-6xl font-light text-gray-900 mb-6 tracking-tight">
              So sánh xe máy điện
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Bạn cần hỗ trợ quyết định? Bây giờ bạn có thể so sánh những mẫu xe máy điện yêu thích với nhau.
            </p>
          </div>

          {/* Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            <ModelCard vehicle={selectedModels[0]} index={0} />
            <ModelCard vehicle={selectedModels[1]} index={1} />
          </div>

          {/* Detailed Comparison Table */}
          {selectedModels.length === 2 && (
            <div className="mt-20 bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-black p-8">
                <h2 className="text-3xl font-bold text-white text-center">So sánh chi tiết</h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-6 font-semibold text-gray-900 border-b">Thông số kỹ thuật</th>
                      {selectedModels.map(vehicle => (
                        <th key={vehicle.id} className="text-center p-6 font-semibold text-gray-900 border-b min-w-[300px]">
                          {vehicle.model}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr className="hover:bg-gray-50">
                      <td className="p-6 font-medium text-gray-900">Hình ảnh</td>
                      {selectedModels.map(vehicle => (
                        <td key={vehicle.id} className="p-6 text-center">
                          <img src={vehicle.images[0]} alt={vehicle.model} className="w-32 h-24 object-contain mx-auto rounded-lg shadow-sm bg-gray-50" />
                        </td>
                      ))}
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-6 font-medium text-gray-900">Giá bán</td>
                      {selectedModels.map(vehicle => (
                        <td key={vehicle.id} className="p-6 text-center font-bold text-green-600 text-xl">
                          {formatPrice(vehicle.price)}
                        </td>
                      ))}
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-6 font-medium text-gray-900">Phiên bản</td>
                      {selectedModels.map(vehicle => (
                        <td key={vehicle.id} className="p-6 text-center text-gray-700">{vehicle.version}</td>
                      ))}
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-6 font-medium text-gray-900">Màu sắc</td>
                      {selectedModels.map(vehicle => (
                        <td key={vehicle.id} className="p-6 text-center text-gray-700">{vehicle.color}</td>
                      ))}
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-6 font-medium text-gray-900">Tầm hoạt động</td>
                      {selectedModels.map(vehicle => (
                        <td key={vehicle.id} className="p-6 text-center text-blue-600 font-semibold text-lg">{vehicle.range} km</td>
                      ))}
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-6 font-medium text-gray-900">Tốc độ tối đa</td>
                      {selectedModels.map(vehicle => (
                        <td key={vehicle.id} className="p-6 text-center text-yellow-600 font-semibold text-lg">{vehicle.maxSpeed} km/h</td>
                      ))}
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-6 font-medium text-gray-900">Thời gian sạc</td>
                      {selectedModels.map(vehicle => (
                        <td key={vehicle.id} className="p-6 text-center text-red-600 font-semibold text-lg">{vehicle.chargingTime}</td>
                      ))}
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-6 font-medium text-gray-900">Tồn kho</td>
                      {selectedModels.map(vehicle => (
                        <td key={vehicle.id} className="p-6 text-center text-gray-600">{vehicle.stock} xe</td>
                      ))}
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-6 font-medium text-gray-900">Tính năng nổi bật</td>
                      {selectedModels.map(vehicle => (
                        <td key={vehicle.id} className="p-6 text-center">
                          <div className="space-y-1">
                            {vehicle.features.slice(0, 3).map((feature, index) => (
                              <div key={index} className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                {feature}
                              </div>
                            ))}
                          </div>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="bg-gray-50 p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {selectedModels.map(vehicle => (
                    <div key={vehicle.id} className="flex space-x-4">
                      <button
                        onClick={() => navigate(`/portal/motorbike-detail/${vehicle.id}`)}
                        className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
                      >
                        Xem {vehicle.model}
                      </button>
                      <button
                        onClick={() => navigate(`/portal/deposit?vehicleId=${vehicle.id}&type=motorbike`)}
                        className="flex-1 bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
                      >
                        Đặt {vehicle.model}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Info Text */}
          <div className="text-center mt-16">
            <div className="inline-flex items-center bg-white px-6 py-3 rounded-full shadow-md">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 animate-pulse"></div>
              <p className="text-sm text-gray-600 font-medium">
                Chọn hai mẫu xe máy điện VinFast để so sánh thông số kỹ thuật và tính năng cạnh nhau
              </p>
            </div>
          </div>

          {/* Features Preview */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { 
                icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
                color: "blue",
                title: "Thông số chi tiết",
                desc: "So sánh thông số kỹ thuật chi tiết cạnh nhau"
              },
              {
                icon: "M13 10V3L4 14h7v7l9-11h-7z",
                color: "green", 
                title: "Hiệu suất",
                desc: "Tầm hoạt động, tốc độ và khả năng sạc"
              },
              {
                icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1",
                color: "purple",
                title: "Giá cả", 
                desc: "So sánh giá cả và đề xuất giá trị"
              }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className={`w-16 h-16 bg-${item.color}-100 rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                  <svg className={`w-8 h-8 text-${item.color}-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
