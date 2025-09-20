import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bike, Battery, Zap, Clock, Eye, ShoppingCart, X } from 'lucide-react';
import { mockMotorbikes } from '../../../data/mockData';
import { Vehicle } from '../../../types';

export const Motorbike: React.FC = () => {
  const navigate = useNavigate();
  const compareTableRef = useRef<HTMLDivElement>(null);
  const [selectedFilters, setSelectedFilters] = useState({
    all: true,
    theon: false,
    klaraS: false,
    feliz: false,
    evo200: false
  });
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>(mockMotorbikes);
  const [compareMode, setCompareMode] = useState(false);
  const [compareList, setCompareList] = useState<Vehicle[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

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
    navigate(`/portal/motorbike-schedule?vehicleId=${vehicleId}`);
  };

  const handleDeposit = (vehicleId: string) => {
    navigate(`/portal/motorbike-deposit?vehicleId=${vehicleId}`);
  };

  const handleFilterChange = (filterType: string) => {
    if (filterType === 'all') {
      setSelectedFilters({
        all: true,
        theon: false,
        klaraS: false,
        feliz: false,
        evo200: false
      });
      setFilteredVehicles(mockMotorbikes);
    } else {
      const newFilters = {
        ...selectedFilters,
        all: false,
        [filterType]: !selectedFilters[filterType as keyof typeof selectedFilters]
      };
      setSelectedFilters(newFilters);

      // Filter vehicles based on selected filters
      let filtered = mockMotorbikes;
      const activeFilters = Object.entries(newFilters)
        .filter(([key, value]) => value && key !== 'all')
        .map(([key]) => {
          // Map filter keys to actual model names
          switch(key) {
            case 'theon': return 'Theon';
            case 'klaraS': return 'Klara S';
            case 'feliz': return 'Feliz';
            case 'evo200': return 'Evo200';
            default: return '';
          }
        });

      if (activeFilters.length > 0) {
        filtered = mockMotorbikes.filter(vehicle =>
          activeFilters.some(filter => 
            vehicle.model.toLowerCase().includes(filter.toLowerCase())
          )
        );
      }
      setFilteredVehicles(filtered);
    }
  };

  const resetFilters = () => {
    setSelectedFilters({
      all: true,
      theon: false,
      klaraS: false,
      feliz: false,
      evo200: false
    });
    setFilteredVehicles(mockMotorbikes);
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
          <h1 className="text-4xl font-light text-gray-900">Xe máy điện VinFast</h1>
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
                  <span className="text-gray-700">Tất cả ({mockMotorbikes.length})</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedFilters.theon}
                    onChange={() => handleFilterChange('theon')}
                    className="mr-3"
                  />
                  <span className="text-gray-700">Theon (1)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedFilters.klaraS}
                    onChange={() => handleFilterChange('klaraS')}
                    className="mr-3"
                  />
                  <span className="text-gray-700">Klara S (1)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedFilters.feliz}
                    onChange={() => handleFilterChange('feliz')}
                    className="mr-3"
                  />
                  <span className="text-gray-700">Feliz (1)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedFilters.evo200}
                    onChange={() => handleFilterChange('evo200')}
                    className="mr-3"
                  />
                  <span className="text-gray-700">Evo 200 (1)</span>
                </label>
              </div>
              
              <button
                onClick={resetFilters}
                className="w-full mt-6 px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              >
                Đặt lại bộ lọc
              </button>
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
                  onClick={() => navigate('/portal/compare-motorbikes')}
                  className="text-black hover:text-gray-700 text-sm font-medium"
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
                        <Bike className="h-4 w-4" />
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
                        <Bike className="h-4 w-4 text-gray-500" />
                        <span>{vehicle.stock} xe</span>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => navigate(`/portal/motorbike-detail/${vehicle.id}`)}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium flex items-center justify-center space-x-2"
                      >
                        <Eye className="h-4 w-4" />
                        <span>Chi tiết</span>
                      </button>
                      <button
                        onClick={() => handleDeposit(vehicle.id)}
                        className="flex-1 bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center space-x-2"
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

        {/* Professional Comparison Table - Modal */}
        {showCompareModal && compareList.length > 1 && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 sticky top-0">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">So sánh chi tiết</h2>
                  <button
                    onClick={() => setShowCompareModal(false)}
                    className="text-white hover:text-gray-200"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto p-6">
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
              
              <div className="bg-gray-50 p-6 sticky bottom-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {compareList.map(vehicle => (
                    <div key={vehicle.id} className="flex space-x-2">
                      <button
                        onClick={() => {
                          setShowCompareModal(false);
                          navigate(`/portal/motorbike-detail/${vehicle.id}`);
                        }}
                        className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded font-medium"
                      >
                        Xem {vehicle.model}
                      </button>
                      <button
                        onClick={() => {
                          setShowCompareModal(false);
                          handleDeposit(vehicle.id);
                        }}
                        className="flex-1 bg-black hover:bg-gray-800 text-white px-4 py-2 rounded font-medium"
                      >
                        Đặt cọc
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
