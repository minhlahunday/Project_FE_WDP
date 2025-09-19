import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Battery, Zap, Clock, Eye, ShoppingCart, X } from 'lucide-react';
import { mockVehicles } from '../../data/mockData';
import { Vehicle } from '../../types';

export const CarProduct: React.FC = () => {
  const navigate = useNavigate();
  const compareTableRef = useRef<HTMLDivElement>(null);
  const [selectedFilters, setSelectedFilters] = useState({
    all: true,
    vf7: false,
    vf8: false,
    vf9: false,
    vf6: false
  });
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>(mockVehicles);
  const [compareMode, setCompareMode] = useState(false);
  const [compareList, setCompareList] = useState<Vehicle[]>([]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    // Auto scroll to comparison table when there are 2+ vehicles to compare
    if (compareList.length >= 2 && compareTableRef.current) {
      setTimeout(() => {
        compareTableRef.current?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }, 300);
    }
  }, [compareList.length]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const toggleCompare = (vehicle: Vehicle) => {
    if (compareList.find(v => v.id === vehicle.id)) {
      setCompareList(compareList.filter(v => v.id !== vehicle.id));
    } else if (compareList.length < 3) {
      setCompareList([...compareList, vehicle]);
    }
  };

  const clearCompare = () => {
    setCompareList([]);
    setCompareMode(false);
  };

  const handleTestDrive = (vehicleId: string) => {
    navigate(`/portal/test-drive?vehicleId=${vehicleId}`);
  };

  const handleDeposit = (vehicleId: string) => {
    navigate(`/portal/deposit?vehicleId=${vehicleId}`);
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

      // Filter vehicles based on selected filters
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button 
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-gray-900 mb-4"
          >
            ← Trở lại
          </button>
          <h1 className="text-4xl font-light text-gray-900">Tổng quan mẫu xe</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Mẫu xe</h3>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="model"
                    checked={selectedFilters.all}
                    onChange={() => handleFilterChange('all')}
                    className="mr-3"
                  />
                  <span className="text-gray-700">Tất cả ({mockVehicles.length})</span>
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
                className="w-full mt-6 px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              >
                Đặt lại bộ lọc
              </button>

              {/* Compare Section */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">So sánh</h3>
                  <button
                    onClick={() => setCompareMode(!compareMode)}
                    className={`px-3 py-1 rounded text-sm font-medium ${compareMode ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                  >
                    {compareMode ? 'Thoát' : 'Kích hoạt'}
                  </button>
                </div>
                {compareMode && (
                  <p className="text-sm text-gray-600 mb-4">
                    Chọn tối đa 3 xe để so sánh. Nhấn vào biểu tượng xe để thêm vào danh sách so sánh.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Header with Compare button */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-medium text-gray-900">Mẫu xe VinFast</h2>
              <div className="flex items-center space-x-4">
                {compareMode && (
                  <span className="text-sm text-blue-600">
                    Chọn tối đa 3 xe để so sánh ({compareList.length}/3)
                  </span>
                )}
                <button 
                  onClick={() => navigate('/portal/compare-models')}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  ↔ So sánh mẫu xe
                </button>
              </div>
            </div>

            {/* Vehicle Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredVehicles.map((vehicle) => (
                <div key={vehicle.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow relative">
                  {compareMode && (
                    <div className="absolute top-2 right-2 z-10">
                      <button
                        onClick={() => toggleCompare(vehicle)}
                        disabled={!compareList.find(v => v.id === vehicle.id) && compareList.length >= 3}
                        className={`p-2 rounded-full ${
                          compareList.find(v => v.id === vehicle.id)
                            ? 'bg-blue-600 text-white'
                            : compareList.length >= 3
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-white text-gray-600 hover:bg-blue-50'
                        } shadow-md`}
                      >
                        <Car className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  
                  <div className="relative">
                    <img
                      src={vehicle.images[0]}
                      alt={vehicle.model}
                      className="w-full h-48 object-cover"
                    />
                  </div>

                  <div className="p-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{vehicle.model}</h3>
                    <p className="text-sm text-gray-600 mb-2">{vehicle.version} - {vehicle.color}</p>
                    <p className="text-2xl font-bold text-green-600 mb-4">{formatPrice(vehicle.price)}</p>

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

                    <div className="flex space-x-2">
                      <button
                        onClick={() => navigate(`/portal/car-detail/${vehicle.id}`)}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium flex items-center justify-center space-x-2"
                      >
                        <Eye className="h-4 w-4" />
                        <span>Chi tiết</span>
                      </button>
                      <button
                        onClick={() => handleDeposit(vehicle.id)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center space-x-2"
                      >
                        <ShoppingCart className="h-4 w-4" />
                        <span>Đặt cọc</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Professional Comparison Table */}
        {!compareMode && compareList.length > 1 && (
          <div ref={compareTableRef} className="mt-12 bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">So sánh chi tiết</h2>
                <button
                  onClick={clearCompare}
                  className="text-white hover:text-gray-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-6 font-semibold text-gray-900 border-b">Thông số</th>
                    {compareList.map(vehicle => (
                      <th key={vehicle.id} className="text-center p-6 font-semibold text-gray-900 border-b min-w-[200px]">
                        {vehicle.model}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr className="hover:bg-gray-50">
                    <td className="p-6 font-medium text-gray-900">Hình ảnh</td>
                    {compareList.map(vehicle => (
                      <td key={vehicle.id} className="p-6 text-center">
                        <img src={vehicle.images[0]} alt={vehicle.model} className="w-24 h-18 object-cover mx-auto rounded-lg shadow-sm" />
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="p-6 font-medium text-gray-900">Giá bán</td>
                    {compareList.map(vehicle => (
                      <td key={vehicle.id} className="p-6 text-center font-bold text-green-600 text-lg">
                        {formatPrice(vehicle.price)}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="p-6 font-medium text-gray-900">Phiên bản</td>
                    {compareList.map(vehicle => (
                      <td key={vehicle.id} className="p-6 text-center text-gray-700">{vehicle.version}</td>
                    ))}
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="p-6 font-medium text-gray-900">Màu sắc</td>
                    {compareList.map(vehicle => (
                      <td key={vehicle.id} className="p-6 text-center text-gray-700">{vehicle.color}</td>
                    ))}
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="p-6 font-medium text-gray-900">Tầm hoạt động</td>
                    {compareList.map(vehicle => (
                      <td key={vehicle.id} className="p-6 text-center text-blue-600 font-semibold">{vehicle.range} km</td>
                    ))}
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="p-6 font-medium text-gray-900">Tốc độ tối đa</td>
                    {compareList.map(vehicle => (
                      <td key={vehicle.id} className="p-6 text-center text-yellow-600 font-semibold">{vehicle.maxSpeed} km/h</td>
                    ))}
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="p-6 font-medium text-gray-900">Thời gian sạc</td>
                    {compareList.map(vehicle => (
                      <td key={vehicle.id} className="p-6 text-center text-red-600 font-semibold">{vehicle.chargingTime}</td>
                    ))}
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="p-6 font-medium text-gray-900">Tồn kho</td>
                    {compareList.map(vehicle => (
                      <td key={vehicle.id} className="p-6 text-center text-gray-600">{vehicle.stock} xe</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="bg-gray-50 p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {compareList.map(vehicle => (
                  <div key={vehicle.id} className="flex space-x-2">
                    <button
                      onClick={() => navigate(`/portal/car-detail/${vehicle.id}`)}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded font-medium"
                    >
                      Xem {vehicle.model}
                    </button>
                    <button
                      onClick={() => handleDeposit(vehicle.id)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium"
                    >
                      Đặt cọc
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
