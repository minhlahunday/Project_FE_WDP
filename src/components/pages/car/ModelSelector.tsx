import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Check, Battery, Zap, Clock, Car, Eye, ShoppingCart } from 'lucide-react';
import { mockVehicles } from '../../../data/mockData';
import { Vehicle } from '../../../types';
import { Header } from '../../common/Header';
import { Sidebar } from '../../common/Sidebar';

export const ModelSelector: React.FC = () => {
  const navigate = useNavigate();
  const [selectedModels, setSelectedModels] = useState<Vehicle[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('vehicles');
  const [selectedFilters, setSelectedFilters] = useState({
    all: true,
    vf7: false,
    vf8: false,
    vf9: false,
    vf6: false
  });
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>(mockVehicles);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const handleFilterChange = (filterType: string) => {
    if (filterType === 'all') {
      setSelectedFilters({
        all: true,
        vf7: false,
        vf8: false,
        vf9: false,
        vf6: false
      });
      setFilteredVehicles(mockVehicles);
    } else {
      const newFilters = {
        ...selectedFilters,
        all: false,
        [filterType]: !selectedFilters[filterType as keyof typeof selectedFilters]
      };
      setSelectedFilters(newFilters);

      let filtered = mockVehicles;
      const activeFilters = Object.entries(newFilters)
        .filter(([key, value]) => value && key !== 'all')
        .map(([key]) => key.toUpperCase());

      if (activeFilters.length > 0) {
        filtered = mockVehicles.filter(vehicle =>
          activeFilters.some(filter => vehicle.model.includes(filter.replace('VF', 'VF ')))
        );
      }
      setFilteredVehicles(filtered);
    }
  };

  const startComparison = () => {
    if (selectedModels.length === 2) {
      // Navigate back to comparison with selected models
      navigate('/portal/compare-models', { 
        state: { models: selectedModels }
      });
    }
  };

  const toggleSelection = (vehicle: Vehicle) => {
    if (selectedModels.find(v => v.id === vehicle.id)) {
      setSelectedModels(selectedModels.filter(v => v.id !== vehicle.id));
    } else if (selectedModels.length < 2) {
      setSelectedModels([...selectedModels, vehicle]);
    }
  };

  const resetFilters = () => {
    setSelectedFilters({
      all: true,
      vf7: false,
      vf8: false,
      vf9: false,
      vf6: false
    });
    setFilteredVehicles(mockVehicles);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
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

      <div className={`pt-[73px] pb-20 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
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

        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-8 sticky top-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Lọc mẫu xe</h3>
                <div className="space-y-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="model"
                      checked={selectedFilters.all}
                      onChange={() => handleFilterChange('all')}
                      className="mr-3"
                    />
                    <span className="text-gray-700">Tất cả</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedFilters.vf7}
                      onChange={() => handleFilterChange('vf7')}
                      className="mr-3"
                    />
                    <span className="text-gray-700">VF7 (1)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedFilters.vf8}
                      onChange={() => handleFilterChange('vf8')}
                      className="mr-3"
                    />
                    <span className="text-gray-700">VF8 (1)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedFilters.vf9}
                      onChange={() => handleFilterChange('vf9')}
                      className="mr-3"
                    />
                    <span className="text-gray-700">VF9 (1)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedFilters.vf6}
                      onChange={() => handleFilterChange('vf6')}
                      className="mr-3"
                    />
                    <span className="text-gray-700">VF6 (1)</span>
                  </label>
                </div>
                
                <button
                  onClick={resetFilters}
                  className="w-full mt-8 px-6 py-3 border-2 border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 hover:border-gray-300 font-medium transition-all duration-200"
                >
                  Đặt lại tất cả bộ lọc
                </button>
              </div>

              {/* Start Comparison Button */}
              {selectedModels.length === 2 && (
                <div className="mt-8 bg-gradient-to-r from-gray-800 to-black text-white p-6 rounded-2xl shadow-xl">
                  <h4 className="font-semibold mb-3">Sẵn sàng so sánh</h4>
                  <p className="text-gray-200 text-sm mb-4">Bạn đã chọn 2 mẫu xe để so sánh</p>
                  <button
                    onClick={startComparison}
                    className="w-full bg-white text-black px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-200 shadow-md"
                  >
                    Bắt đầu so sánh
                  </button>
                </div>
              )}
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="mb-10">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900">Mẫu xe VinFast</h2>
                  <div className="bg-gray-900 px-4 py-2 rounded-full">
                    <span className="text-white font-medium text-sm">
                      Đã chọn: {selectedModels.length}/2 mẫu xe
                    </span>
                  </div>
                </div>
              </div>

              {/* Vehicle Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {filteredVehicles.map((vehicle) => {
                  const isSelected = selectedModels.find(v => v.id === vehicle.id);
                  const canSelect = selectedModels.length < 2 || isSelected;

                  return (
                    <div 
                      key={vehicle.id} 
                      className={`bg-white rounded-lg shadow-md overflow-hidden relative transform transition-all duration-300 ${
                        canSelect ? 'cursor-pointer hover:shadow-xl hover:scale-105' : 'opacity-60 cursor-not-allowed'
                      } ${isSelected ? 'ring-4 ring-blue-500 ring-opacity-50 shadow-xl' : ''}`}
                      onClick={() => canSelect && toggleSelection(vehicle)}
                    >
                      {/* Selection Badge */}
                      <div className="absolute top-4 right-4 z-10">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? 'bg-black border-black' : 'bg-white border-gray-300'
                        }`}>
                          {isSelected && <Check className="w-4 h-4 text-white" />}
                        </div>
                      </div>

                      {/* Electric Badge */}
                      {/* <div className="absolute top-4 left-4 z-10">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Điện • 2024
                        </span>
                      </div> */}

                      {/* Vehicle Image */}
                      <div className="relative">
                        <img
                          src={vehicle.images[0]}
                          alt={vehicle.model}
                          className="w-full h-48 object-cover"
                        />
                      </div>

                      {/* Vehicle Information */}
                      <div className="p-4">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{vehicle.model}</h3>
                        <p className="text-sm text-gray-600 mb-2">{vehicle.version} - {vehicle.color}</p>
                        <p className="text-2xl font-bold text-green-600 mb-4">Từ {formatPrice(vehicle.price)}</p>

                        {/* Specifications Grid - Same as CarProduct */}
                        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
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
                            <Car className="h-4 w-4 text-gray-500" />
                            <span>{vehicle.stock} xe</span>
                          </div>
                        </div>

                        {/* Action Buttons - Same as CarProduct */}
                        <div className="flex space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/portal/car-detail/${vehicle.id}`);
                            }}
                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium flex items-center justify-center space-x-2"
                          >
                            <Eye className="h-4 w-4" />
                            <span>Chi tiết</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/portal/deposit?vehicleId=${vehicle.id}`);
                            }}
                            className="flex-1 bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center space-x-2"
                          >
                            <ShoppingCart className="h-4 w-4" />
                            <span>Đặt cọc</span>
                          </button>
                        </div>

                        {/* Add to Comparison Info */}
                        <div className="mt-3 text-center">
                          <span className="text-xs text-gray-500">
                            {isSelected ? 'Đã thêm vào so sánh' : 'Nhấp để thêm vào so sánh'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

