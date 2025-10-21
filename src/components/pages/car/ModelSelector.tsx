import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Battery, Zap, Clock, Car, Eye, ShoppingCart, Search, SlidersHorizontal } from 'lucide-react';
// import { mockVehicles } from '../../../data/mockData';
// import { Vehicle } from '../../../types';
import { Header } from '../../common/Header';
import { Sidebar } from '../../common/Sidebar';
import { authService } from '../../../services/authService';

export const ModelSelector: React.FC = () => {
  const navigate = useNavigate();
  const [selectedModels, setSelectedModels] = useState<unknown[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('vehicles');
  
  // Professional filter states based on API
  const [filters, setFilters] = useState({
    search: '',
    priceRange: [0, 3000000000],
    batteryType: '',
    rangeKm: [0, 2000],
    motorPower: [0, 500],
    topSpeed: [0, 300],
    acceleration: [0, 20],
    seatingCapacity: '',
    drivetrain: '',
    releaseStatus: '',
    colorOptions: [] as string[],
    safetyFeatures: [] as string[],
    sortBy: 'name',
    sortOrder: 'asc'
  });
  
  const [showFilters, setShowFilters] = useState(false);
  const [filteredVehicles, setFilteredVehicles] = useState<unknown[]>([]);
  const [allVehicles, setAllVehicles] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    loadVehicles();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, allVehicles]);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🚀 Loading cars for model selector...');
      const response = await authService.getVehicles({ category: 'car' });
      
      if (response.success && (response as Record<string, unknown>).data) {
        const responseData = (response as Record<string, unknown>).data as Record<string, unknown>;
        console.log('✅ Cars loaded successfully for selector:', responseData.data);
        const carsData = responseData.data as unknown[];
        setAllVehicles(carsData);
        setFilteredVehicles(carsData);
      } else {
        console.error('❌ Failed to load cars:', response.message);
        setError(response.message || 'Không thể tải danh sách xe');
      }
    } catch (err) {
      console.error('❌ Error loading cars:', err);
      setError('Lỗi khi tải danh sách xe');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = useCallback(() => {
    let filtered = [...allVehicles];
    console.log('🔍 Starting filter with', allVehicles.length, 'vehicles');

    // Search filter
    if (filters.search) {
      filtered = filtered.filter((vehicle: unknown) => {
        const v = vehicle as Record<string, unknown>;
        return v.name?.toString().toLowerCase().includes(filters.search.toLowerCase()) ||
               v.model?.toString().toLowerCase().includes(filters.search.toLowerCase());
      });
      console.log('🔍 After search filter:', filtered.length, 'vehicles');
    }

    // Price range filter
    filtered = filtered.filter((vehicle: unknown) => {
      const v = vehicle as Record<string, unknown>;
      const price = v.price as number;
      // Nếu price là undefined hoặc null, bỏ qua filter này
      if (price === undefined || price === null) {
        return true;
      }
      const inRange = price >= filters.priceRange[0] && price <= filters.priceRange[1];
      if (!inRange) {
        console.log('🚫 Vehicle filtered out by price:', v.name, 'price:', price, 'range:', filters.priceRange);
      }
      return inRange;
    });
    console.log('🔍 After price filter:', filtered.length, 'vehicles');

    // Battery type filter
    if (filters.batteryType) {
      filtered = filtered.filter((vehicle: unknown) => {
        const v = vehicle as Record<string, unknown>;
        return v.battery_type === filters.batteryType;
      });
      console.log('🔍 After battery type filter:', filtered.length, 'vehicles');
    }

    // Range filter
    filtered = filtered.filter((vehicle: unknown) => {
      const v = vehicle as Record<string, unknown>;
      const range = v.range_km as number;
      // Nếu range_km là undefined hoặc null, bỏ qua filter này
      if (range === undefined || range === null) {
        return true;
      }
      const inRange = range >= filters.rangeKm[0] && range <= filters.rangeKm[1];
      if (!inRange) {
        console.log('🚫 Vehicle filtered out by range:', v.name, 'range:', range, 'range filter:', filters.rangeKm);
      }
      return inRange;
    });
    console.log('🔍 After range filter:', filtered.length, 'vehicles');

    // Motor power filter
    filtered = filtered.filter((vehicle: unknown) => {
      const v = vehicle as Record<string, unknown>;
      const motorPower = v.motor_power as number;
      // Nếu motor_power là undefined hoặc null, bỏ qua filter này
      if (motorPower === undefined || motorPower === null) {
        return true;
      }
      const inRange = motorPower >= filters.motorPower[0] && motorPower <= filters.motorPower[1];
      if (!inRange) {
        console.log('🚫 Vehicle filtered out by motor power:', v.name, 'motor power:', motorPower, 'motor power filter:', filters.motorPower);
      }
      return inRange;
    });
    console.log('🔍 After motor power filter:', filtered.length, 'vehicles');

    // Top speed filter
    filtered = filtered.filter((vehicle: unknown) => {
      const v = vehicle as Record<string, unknown>;
      const topSpeed = v.top_speed as number;
      // Nếu top_speed là undefined hoặc null, bỏ qua filter này
      if (topSpeed === undefined || topSpeed === null) {
        return true;
      }
      const inRange = topSpeed >= filters.topSpeed[0] && topSpeed <= filters.topSpeed[1];
      if (!inRange) {
        console.log('🚫 Vehicle filtered out by top speed:', v.name, 'top speed:', topSpeed, 'top speed filter:', filters.topSpeed);
      }
      return inRange;
    });
    console.log('🔍 After top speed filter:', filtered.length, 'vehicles');

    // Acceleration filter
    filtered = filtered.filter((vehicle: unknown) => {
      const v = vehicle as Record<string, unknown>;
      const acceleration = v.acceleration as number;
      // Nếu acceleration là undefined hoặc null, bỏ qua filter này
      if (acceleration === undefined || acceleration === null) {
        return true;
      }
      const inRange = acceleration >= filters.acceleration[0] && acceleration <= filters.acceleration[1];
      if (!inRange) {
        console.log('🚫 Vehicle filtered out by acceleration:', v.name, 'acceleration:', acceleration, 'acceleration filter:', filters.acceleration);
      }
      return inRange;
    });
    console.log('🔍 After acceleration filter:', filtered.length, 'vehicles');

    // Release status filter
    if (filters.releaseStatus) {
      filtered = filtered.filter((vehicle: unknown) => {
        const v = vehicle as Record<string, unknown>;
        return v.release_status === filters.releaseStatus;
      });
      console.log('🔍 After release status filter:', filtered.length, 'vehicles');
    }

    // Color options filter
    if (filters.colorOptions.length > 0) {
      filtered = filtered.filter((vehicle: unknown) => {
        const v = vehicle as Record<string, unknown>;
        const vehicleColors = v.color_options as string[] || [];
        return filters.colorOptions.some(color => vehicleColors.includes(color));
      });
      console.log('🔍 After color options filter:', filtered.length, 'vehicles');
    }

    // Safety features filter
    if (filters.safetyFeatures.length > 0) {
      filtered = filtered.filter((vehicle: unknown) => {
        const v = vehicle as Record<string, unknown>;
        const vehicleSafetyFeatures = v.safety_features as string[] || [];
        return filters.safetyFeatures.some(feature => vehicleSafetyFeatures.includes(feature));
      });
      console.log('🔍 After safety features filter:', filtered.length, 'vehicles');
    }

    // Sorting
    filtered.sort((a: unknown, b: unknown) => {
      const aV = a as Record<string, unknown>;
      const bV = b as Record<string, unknown>;
      const aValue = aV[filters.sortBy] as string | number;
      const bValue = bV[filters.sortBy] as string | number;
      
      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    console.log('🔍 Final filtered result:', filtered.length, 'vehicles');
    setFilteredVehicles(filtered);
  }, [filters, allVehicles]);

  // Helper functions to get unique values for filter options
  const getUniqueValues = (key: string) => {
    const values = allVehicles.map((vehicle: unknown) => {
      const v = vehicle as Record<string, unknown>;
      return v[key] as string;
    }).filter(Boolean);
    return [...new Set(values)];
  };

  const getUniqueArrayValues = (key: string) => {
    const allValues: string[] = [];
    allVehicles.forEach((vehicle: unknown) => {
      const v = vehicle as Record<string, unknown>;
      const values = v[key] as string[] || [];
      allValues.push(...values);
    });
    return [...new Set(allValues)];
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      priceRange: [0, 3000000000],
      batteryType: '',
      rangeKm: [0, 2000],
      motorPower: [0, 500],
      topSpeed: [0, 300],
      acceleration: [0, 20],
      seatingCapacity: '',
      drivetrain: '',
      releaseStatus: '',
      colorOptions: [],
      safetyFeatures: [],
      sortBy: 'name',
      sortOrder: 'asc'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const toggleSelection = (vehicle: unknown) => {
    const v = vehicle as Record<string, unknown>;
    const vehicleId = v._id as string || v.id as string;
    
    if (selectedModels.find(model => {
      const m = model as Record<string, unknown>;
      return (m._id as string || m.id as string) === vehicleId;
    })) {
      setSelectedModels(selectedModels.filter(model => {
        const m = model as Record<string, unknown>;
        return (m._id as string || m.id as string) !== vehicleId;
      }));
    } else if (selectedModels.length < 2) {
      setSelectedModels([...selectedModels, vehicle]);
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


  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải danh sách xe...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && allVehicles.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Không thể tải danh sách xe</h2>
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
        onOpen={() => setIsSidebarOpen(true)}
      />

      <div className={`pt-16 pb-20 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
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
          {/* Professional Search and Filter Header */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              {/* Search Bar */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm xe..."
                    value={filters.search}
                    onChange={(e) => setFilters({...filters, search: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Sort Options */}
              <div className="flex items-center gap-4">
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="name">Tên xe</option>
                  <option value="price">Giá</option>
                  <option value="range_km">Tầm hoạt động</option>
                  <option value="top_speed">Tốc độ tối đa</option>
                </select>
                <select
                  value={filters.sortOrder}
                  onChange={(e) => setFilters({...filters, sortOrder: e.target.value})}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="asc">Tăng dần</option>
                  <option value="desc">Giảm dần</option>
                </select>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Bộ lọc nâng cao
                </button>
              </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Price Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Khoảng giá: {filters.priceRange[0].toLocaleString()} - {filters.priceRange[1].toLocaleString()} ₫
                    </label>
                    <div className="space-y-2">
                      <input
                        type="range"
                        min="0"
                        max="3000000000"
                        step="100000000"
                        value={filters.priceRange[0]}
                        onChange={(e) => setFilters({...filters, priceRange: [parseInt(e.target.value), filters.priceRange[1]]})}
                        className="w-full"
                      />
                      <input
                        type="range"
                        min="0"
                        max="3000000000"
                        step="100000000"
                        value={filters.priceRange[1]}
                        onChange={(e) => setFilters({...filters, priceRange: [filters.priceRange[0], parseInt(e.target.value)]})}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Battery Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Loại pin</label>
                    <select
                      value={filters.batteryType}
                      onChange={(e) => setFilters({...filters, batteryType: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Tất cả</option>
                      {getUniqueValues('battery_type').map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  {/* Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tầm hoạt động: {filters.rangeKm[0]} - {filters.rangeKm[1]} km
                    </label>
                    <div className="space-y-2">
                      <input
                        type="range"
                        min="0"
                        max="2000"
                        step="50"
                        value={filters.rangeKm[0]}
                        onChange={(e) => setFilters({...filters, rangeKm: [parseInt(e.target.value), filters.rangeKm[1]]})}
                        className="w-full"
                      />
                      <input
                        type="range"
                        min="0"
                        max="2000"
                        step="50"
                        value={filters.rangeKm[1]}
                        onChange={(e) => setFilters({...filters, rangeKm: [filters.rangeKm[0], parseInt(e.target.value)]})}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Release Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
                    <select
                      value={filters.releaseStatus}
                      onChange={(e) => setFilters({...filters, releaseStatus: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Tất cả</option>
                      {getUniqueValues('release_status').map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>

                  {/* Color Options */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Màu sắc</label>
                    <div className="flex flex-wrap gap-2">
                      {getUniqueArrayValues('color_options').map((color) => (
                        <label key={color} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={filters.colorOptions.includes(color)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFilters({...filters, colorOptions: [...filters.colorOptions, color]});
                              } else {
                                setFilters({...filters, colorOptions: filters.colorOptions.filter(c => c !== color)});
                              }
                            }}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">{color}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={resetFilters}
                    className="px-6 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Đặt lại bộ lọc
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* Start Comparison Button */}
              {selectedModels.length === 2 && (
                <div className="bg-gradient-to-r from-gray-800 to-black text-white p-6 rounded-2xl shadow-xl sticky top-6">
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
                  <div className="flex items-center gap-4">
                    <div className="bg-gray-900 px-4 py-2 rounded-full">
                      <span className="text-white font-medium text-sm">
                        Hiển thị: {filteredVehicles.length} xe
                      </span>
                    </div>
                    <div className="bg-blue-600 px-4 py-2 rounded-full">
                      <span className="text-white font-medium text-sm">
                        Đã chọn: {selectedModels.length}/2 mẫu xe
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vehicle Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {filteredVehicles.map((vehicle) => {
                  const v = vehicle as Record<string, unknown>;
                  const vehicleId = v._id as string || v.id as string;
                  const isSelected = selectedModels.find(model => {
                    const m = model as Record<string, unknown>;
                    return (m._id as string || m.id as string) === vehicleId;
                  });
                  const canSelect = selectedModels.length < 2 || isSelected;

                  return (
                    <div 
                      key={vehicleId} 
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
                          {!!isSelected && <Check className="w-4 h-4 text-white" />}
                        </div>
                      </div>

                      {/* Vehicle Image */}
                      <div className="relative">
                        <img
                          src={((v.images as string[]) || [])[0] || '/placeholder-car.jpg'}
                          alt={v.model as string}
                          className="w-full h-48 object-cover"
                        />
                      </div>

                      {/* Vehicle Information */}
                      <div className="p-4">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{v.name as string}</h3>
                        <p className="text-sm text-gray-600 mb-2">{(v.version as string) || '2025'} - {((v.color_options as string[]) || ['Black'])[0]}</p>
                        <p className="text-2xl font-bold text-green-600 mb-4">Từ {formatPrice(v.price as number)}</p>

                        {/* Specifications Grid */}
                        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <Battery className="h-4 w-4 text-blue-500" />
                            <span>{v.range_km as number}km</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Zap className="h-4 w-4 text-yellow-500" />
                            <span>{v.top_speed as number}km/h</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-red-500" />
                            <span>{v.charging_fast as number}h</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Car className="h-4 w-4 text-gray-500" />
                            <span>{String(v.stock as number || 0)} xe</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/portal/car-detail/${vehicleId}`);
                            }}
                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium flex items-center justify-center space-x-2"
                          >
                            <Eye className="h-4 w-4" />
                            <span>Chi tiết</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/portal/car-deposit?vehicleId=${vehicleId}`);
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

