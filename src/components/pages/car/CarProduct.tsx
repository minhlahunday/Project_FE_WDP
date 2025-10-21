import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Battery, Zap, Clock, Eye, ShoppingCart, X, Search, SlidersHorizontal } from 'lucide-react';
import { Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { mockVehicles } from '../../../data/mockData';
// import { Vehicle } from '../../../types';
import { Header } from '../../common/Header';
import { Sidebar } from '../../common/Sidebar';
import { authService } from '../../../services/authService';

export const CarProduct: React.FC = () => {
  const navigate = useNavigate();
  const compareTableRef = useRef<HTMLDivElement>(null);
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
  const [compareMode, setCompareMode] = useState(false);
  const [compareList, setCompareList] = useState<unknown[]>([]);

  useEffect(() => {
    window.scrollTo(0, 0);
    loadVehicles();
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

  const loadVehicles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🚀 Loading cars from API...');
      const response = await authService.getVehicles({ category: 'car' });
      
      if (response.success && (response as Record<string, unknown>).data) {
        const responseData = (response as Record<string, unknown>).data as Record<string, unknown>;
        console.log('✅ Cars loaded successfully:', responseData.data);
        const cars = responseData.data as unknown[];
        console.log('📊 Total cars from API:', cars.length);
        console.log('📋 Cars data:', cars);
        setAllVehicles(cars);
        setFilteredVehicles(cars);
      } else {
        console.error('❌ Failed to load cars:', response.message);
        setError(response.message || 'Không thể tải danh sách xe');
        // Fallback to mock data
        setAllVehicles(mockVehicles);
        setFilteredVehicles(mockVehicles);
      }
    } catch (err) {
      console.error('❌ Error loading cars:', err);
      setError('Lỗi khi tải danh sách xe');
      // Fallback to mock data
      setAllVehicles(mockVehicles);
      setFilteredVehicles(mockVehicles);
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
               v.model?.toString().toLowerCase().includes(filters.search.toLowerCase()) ||
               v.sku?.toString().toLowerCase().includes(filters.search.toLowerCase());
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
    }

    // Range filter
    filtered = filtered.filter((vehicle: unknown) => {
      const v = vehicle as Record<string, unknown>;
      const range = v.range_km as number;
      // Nếu range là undefined hoặc null, bỏ qua filter này
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
      const power = v.motor_power as number;
      // Nếu power là undefined hoặc null, bỏ qua filter này
      if (power === undefined || power === null) {
        return true;
      }
      const inRange = power >= filters.motorPower[0] && power <= filters.motorPower[1];
      if (!inRange) {
        console.log('🚫 Vehicle filtered out by motor power:', v.name, 'power:', power, 'power filter:', filters.motorPower);
      }
      return inRange;
    });
    console.log('🔍 After motor power filter:', filtered.length, 'vehicles');

    // Top speed filter
    filtered = filtered.filter((vehicle: unknown) => {
      const v = vehicle as Record<string, unknown>;
      const speed = v.top_speed as number;
      // Nếu speed là undefined hoặc null, bỏ qua filter này
      if (speed === undefined || speed === null) {
        return true;
      }
      const inRange = speed >= filters.topSpeed[0] && speed <= filters.topSpeed[1];
      if (!inRange) {
        console.log('🚫 Vehicle filtered out by top speed:', v.name, 'speed:', speed, 'speed filter:', filters.topSpeed);
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

    // Seating capacity filter
    if (filters.seatingCapacity) {
      filtered = filtered.filter((vehicle: unknown) => {
        const v = vehicle as Record<string, unknown>;
        return v.seating_capacity === parseInt(filters.seatingCapacity);
      });
    }

    // Drivetrain filter
    if (filters.drivetrain) {
      filtered = filtered.filter((vehicle: unknown) => {
        const v = vehicle as Record<string, unknown>;
        return v.drivetrain === filters.drivetrain;
      });
    }

    // Release status filter
    if (filters.releaseStatus) {
      filtered = filtered.filter((vehicle: unknown) => {
        const v = vehicle as Record<string, unknown>;
        return v.release_status === filters.releaseStatus;
      });
    }

    // Color options filter
    if (filters.colorOptions.length > 0) {
      filtered = filtered.filter((vehicle: unknown) => {
        const v = vehicle as Record<string, unknown>;
        return filters.colorOptions.some(color => (v.color_options as string[])?.includes(color));
      });
    }

    // Safety features filter
    if (filters.safetyFeatures.length > 0) {
      filtered = filtered.filter((vehicle: unknown) => {
        const v = vehicle as Record<string, unknown>;
        return filters.safetyFeatures.some(feature => (v.safety_features as string[])?.includes(feature));
      });
    }

    // Sort
    filtered.sort((a: unknown, b: unknown) => {
      const aObj = a as Record<string, unknown>;
      const bObj = b as Record<string, unknown>;
      let aValue: unknown = aObj[filters.sortBy];
      let bValue: unknown = bObj[filters.sortBy];
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = (bValue as string).toLowerCase();
      }
      
      if (filters.sortOrder === 'asc') {
        return (aValue as number) > (bValue as number) ? 1 : -1;
      } else {
        return (aValue as number) < (bValue as number) ? 1 : -1;
      }
    });

    console.log('🔍 Final filtered result:', filtered.length, 'vehicles');
    setFilteredVehicles(filtered);
  }, [filters, allVehicles]);

  // Apply filters when filters or allVehicles change
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Helper function to get unique values for filter options
  const getUniqueValues = (key: string) => {
    const values = allVehicles.map((vehicle: unknown) => {
      const v = vehicle as Record<string, unknown>;
      return v[key];
    }).filter(Boolean);
    return [...new Set(values)];
  };

  const getUniqueArrayValues = (key: string) => {
    const allValues: string[] = [];
    allVehicles.forEach((vehicle: unknown) => {
      const v = vehicle as Record<string, unknown>;
      if (v[key] && Array.isArray(v[key])) {
        allValues.push(...(v[key] as string[]));
      }
    });
    return [...new Set(allValues)];
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      priceRange: [0, 1000000000],
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

  const toggleCompare = (vehicle: unknown) => {
    const vehicleObj = vehicle as { _id: string };
    if (compareList.find(v => (v as { _id: string })._id === vehicleObj._id)) {
      setCompareList(compareList.filter(v => (v as { _id: string })._id !== vehicleObj._id));
    } else if (compareList.length < 3) {
      setCompareList([...compareList, vehicle]);
    }
  };

  const clearCompare = () => {
    setCompareList([]);
    setCompareMode(false);
  };

  // const handleTestDrive = (vehicleId: string) => {
  //   navigate(`/portal/test-drive?vehicleId=${vehicleId}`);
  // };

  const handleDeposit = (vehicleId: string) => {
    navigate(`/portal/car-deposit?vehicleId=${vehicleId}`);
  };

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
        

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Filters */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Tìm kiếm & Lọc</h3>
                
                {/* Search Bar */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 transform -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm xe..."
                      value={filters.search}
                      onChange={(e) => setFilters({...filters, search: e.target.value})}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Filter Toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`w-full px-4 py-2 rounded-lg border transition-colors mb-4 ${
                    showFilters 
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <SlidersHorizontal className="w-4 h-4 mr-2 inline" />
                  Bộ lọc nâng cao
                </button>

                {/* Advanced Filters */}
                {showFilters && (
                  <div className="space-y-4">
                    {/* Price Range */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Khoảng giá</label>
                      <div className="space-y-2">
                        <input
                          type="range"
                          min="0"
                          max="1000000000"
                          step="10000000"
                          value={filters.priceRange[1]}
                          onChange={(e) => setFilters({...filters, priceRange: [filters.priceRange[0], parseInt(e.target.value)]})}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{formatPrice(filters.priceRange[0])}</span>
                          <span>{formatPrice(filters.priceRange[1])}</span>
                        </div>
                      </div>
                    </div>

                    {/* Battery Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Loại pin</label>
                      <select
                        value={filters.batteryType}
                        onChange={(e) => setFilters({...filters, batteryType: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="">Tất cả</option>
                        {getUniqueValues('battery_type').map((type: unknown) => (
                          <option key={type as string} value={type as string}>{type as string}</option>
                        ))}
                      </select>
                    </div>

                    {/* Range */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tầm hoạt động (km)</label>
                      <div className="space-y-2">
                        <input
                          type="range"
                          min="0"
                          max="2000"
                          step="50"
                          value={filters.rangeKm[1]}
                          onChange={(e) => setFilters({...filters, rangeKm: [filters.rangeKm[0], parseInt(e.target.value)]})}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{filters.rangeKm[0]} km</span>
                          <span>{filters.rangeKm[1]} km</span>
                        </div>
                      </div>
                    </div>

                    {/* Release Status */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
                      <select
                        value={filters.releaseStatus}
                        onChange={(e) => setFilters({...filters, releaseStatus: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="">Tất cả</option>
                        {getUniqueValues('release_status').map((status: unknown) => (
                          <option key={status as string} value={status as string}>
                            {status === 'available' ? 'Có sẵn' : 
                             status === 'coming_soon' ? 'Sắp ra mắt' : 
                             status === 'pre_order' ? 'Đặt trước' : status as string}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Color Options */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Màu sắc</label>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {getUniqueArrayValues('color_options').map((color: string) => (
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
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-4 h-4 rounded-full border border-gray-300"
                                style={{ backgroundColor: color.toLowerCase() }}
                              ></div>
                              <span className="text-sm text-gray-700">{color}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Reset Button */}
                <button
                  onClick={resetFilters}
                  className="w-full mt-4 px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                >
                  Đặt lại bộ lọc
                </button>

                {/* Compare Section */}
                {compareList.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-md font-medium text-gray-900 mb-3">So sánh xe ({compareList.length}/3)</h4>
                    <div className="space-y-2">
                      {compareList.map((vehicle) => {
                        const v = vehicle as Record<string, unknown>;
                        return (
                          <div key={v._id as string} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                            <span className="text-sm text-gray-700">{v.name as string}</span>
                            <button
                              onClick={() => toggleCompare(vehicle)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    <button
                      onClick={clearCompare}
                      className="w-full mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      So sánh ngay
                    </button>
                  </div>
                )}
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
                    className="text-black hover:text-gray-700 text-sm font-medium"
                  >
                    ↔ So sánh mẫu xe
                  </button>
                </div>
              </div>

              {/* Loading State */}
              {loading && (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Đang tải danh sách xe...</span>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              {/* Vehicle Grid */}
              {!loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {(() => {
                    console.log('🎯 Rendering vehicles:', filteredVehicles.length, 'vehicles');
                    return null;
                  })()}
                  {filteredVehicles.map((vehicle) => {
                    const v = vehicle as Record<string, unknown>;
                    return (
                      <div key={v._id as string || v.id as string} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow relative">
                      {compareMode && (
                        <div className="absolute top-2 right-2 z-10">
                          <button
                            onClick={() => toggleCompare(vehicle)}
                            disabled={!compareList.find(compV => (compV as Record<string, unknown>)._id === v._id || (compV as Record<string, unknown>).id === v.id) && compareList.length >= 3}
                            className={`p-2 rounded-full ${
                              compareList.find(compV => (compV as Record<string, unknown>)._id === v._id || (compV as Record<string, unknown>).id === v.id)
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
                          src={((v.images as string[]) || [])[0] || '/placeholder-car.jpg'}
                          alt={v.model as string}
                          className="w-full h-48 object-cover"
                        />
                        {v.release_status === 'coming_soon' && (
                          <div className="absolute top-2 left-2 bg-orange-500 text-white px-2 py-1 rounded text-xs font-medium">
                            Sắp ra mắt
                          </div>
                        )}
                      </div>

                      <div className="p-4">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{v.name as string}</h3>
                        <p className="text-sm text-gray-600 mb-2">{v.model as string} - {(v.version as string) || '2025'}</p>
                        <p className="text-2xl font-bold text-green-600 mb-4">{formatPrice(v.price as number)}</p>

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
                            <span>{v.stock as number || 0} xe</span>
                          </div>

                        </div>

                        <div className="flex space-x-2">
                          <button
                            onClick={() => navigate(`/portal/car-detail/${v._id as string || v.id as string}`)}
                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium flex items-center justify-center space-x-2"
                          >
                            <Eye className="h-4 w-4" />
                            <span>Chi tiết</span>
                          </button>
                          <button
                            onClick={() => handleDeposit(v._id as string || v.id as string)}
                            className="flex-1 bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center space-x-2"
                          >
                            <ShoppingCart className="h-4 w-4" />
                            <span>Đặt cọc</span>
                          </button>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}

              {/* No vehicles found */}
              {!loading && !error && filteredVehicles.length === 0 && (
                <div className="text-center py-12">
                  <Car className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy xe nào</h3>
                  <p className="text-gray-600">Hãy thử thay đổi bộ lọc để tìm kiếm xe phù hợp.</p>
                </div>
              )}
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
                      {compareList.map((vehicle) => {
                        const v = vehicle as Record<string, unknown>;
                        return (
                          <th key={v._id as string || v.id as string} className="text-center p-6 font-semibold text-gray-900 border-b min-w-[200px]">
                            {v.name as string}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr className="hover:bg-gray-50">
                      <td className="p-6 font-medium text-gray-900">Hình ảnh</td>
                      {compareList.map((vehicle) => {
                        const v = vehicle as Record<string, unknown>;
                        return (
                          <td key={v._id as string || v.id as string} className="p-6 text-center">
                            <img src={((v.images as string[]) || [])[0] || '/placeholder-car.jpg'} alt={v.name as string} className="w-24 h-18 object-cover mx-auto rounded-lg shadow-sm" />
                          </td>
                        );
                      })}
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-6 font-medium text-gray-900">Giá bán</td>
                      {compareList.map((vehicle) => {
                        const v = vehicle as Record<string, unknown>;
                        return (
                          <td key={v._id as string || v.id as string} className="p-6 text-center font-bold text-green-600 text-lg">
                            {formatPrice(v.price as number)}
                          </td>
                        );
                      })}
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-6 font-medium text-gray-900">Phiên bản</td>
                      {compareList.map((vehicle) => {
                        const v = vehicle as Record<string, unknown>;
                        return (
                          <td key={v._id as string || v.id as string} className="p-6 text-center text-gray-700">{(v.version as string) || '2025'}</td>
                        );
                      })}
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-6 font-medium text-gray-900">Màu sắc</td>
                      {compareList.map((vehicle) => {
                        const v = vehicle as Record<string, unknown>;
                        return (
                          <td key={v._id as string || v.id as string} className="p-6 text-center text-gray-700">{(v.color_options as string[])?.join(', ') || 'N/A'}</td>
                        );
                      })}
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-6 font-medium text-gray-900">Tầm hoạt động</td>
                      {compareList.map((vehicle) => {
                        const v = vehicle as Record<string, unknown>;
                        return (
                          <td key={v._id as string || v.id as string} className="p-6 text-center text-blue-600 font-semibold">{v.range_km as number} km</td>
                        );
                      })}
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-6 font-medium text-gray-900">Tốc độ tối đa</td>
                      {compareList.map((vehicle) => {
                        const v = vehicle as Record<string, unknown>;
                        return (
                          <td key={v._id as string || v.id as string} className="p-6 text-center text-yellow-600 font-semibold">{v.top_speed as number} km/h</td>
                        );
                      })}
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-6 font-medium text-gray-900">Thời gian sạc</td>
                      {compareList.map((vehicle) => {
                        const v = vehicle as Record<string, unknown>;
                        return (
                          <td key={v._id as string || v.id as string} className="p-6 text-center text-red-600 font-semibold">{v.charging_fast as number}h</td>
                        );
                      })}
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-6 font-medium text-gray-900">Tồn kho</td>
                      {compareList.map((vehicle) => {
                        const v = vehicle as Record<string, unknown>;
                        return (
                          <td key={v._id as string || v.id as string} className="p-6 text-center text-gray-600">{v.stock as number || 0} xe</td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="bg-gray-50 p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {compareList.map((vehicle) => {
                      const v = vehicle as Record<string, unknown>;
                      return (
                        <div key={v._id as string || v.id as string} className="flex space-x-2">
                          <button
                            onClick={() => navigate(`/portal/car-detail/${v._id as string || v.id as string}`)}
                            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded font-medium"
                          >
                            Xem {v.name as string}
                          </button>
                          <button
                            onClick={() => handleDeposit(v._id as string || v.id as string)}
                            className="flex-1 bg-black hover:bg-gray-800 text-white px-4 py-2 rounded font-medium"
                          >
                            Đặt cọc
                          </button>
                        </div>
                      );
                    })}
                  </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
