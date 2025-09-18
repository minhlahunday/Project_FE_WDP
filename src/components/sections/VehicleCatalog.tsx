import React, { useState } from 'react';
import { Car, Battery, Zap, Clock, Eye, ShoppingCart } from 'lucide-react';
import { Carousel } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { mockVehicles } from '../../data/mockData';
import { Vehicle } from '../../types';
import './VehicleCatalog.css';

export const VehicleCatalog: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path: string) => {
    if (navigate) {
      navigate(path);
    }
  };

  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareList, setCompareList] = useState<Vehicle[]>([]);

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

  const carSlides = mockVehicles.map(v => ({
    ...v,
    name: v.model,
    img: v.images[0]
  }));

  const handleTestDrive = (vehicleId: string) => {
    navigate(`/portal/test-drive?vehicleId=${vehicleId}`);
  };

  const handleDeposit = (vehicleId: string) => {
    navigate(`/portal/deposit?vehicleId=${vehicleId}`);
  };

  return (
    <div className="-mx-6 bg-gray-900">
      {/* Carousel Section */}
      <section className="h-[66.666vh] relative w-screen"> {/* Changed from h-screen */}
        <div className="absolute inset-0 mx-auto w-[99%]">
          <Carousel
            autoplay
            className="h-full w-full"
            arrows
            prevArrow={
              <div className="carousel-arrow carousel-arrow-prev">
                <LeftOutlined style={{ fontSize: '24px', fontWeight: 'bold' }} />
              </div>
            }
            nextArrow={
              <div className="carousel-arrow carousel-arrow-next">
                <RightOutlined style={{ fontSize: '24px', fontWeight: 'bold' }} />
              </div>
            }
          >
            {carSlides.map(s => (
              <div className="h-[66.666vh] relative" key={s.name}> {/* Changed from h-screen */}
                <img src={s.img} alt={s.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex flex-col justify-between pb-10"> {/* Changed pb-20 to pb-10 */}
                  <div className="pt-16 text-center"> {/* Changed from pt-32 */}
                    <h3 className="text-6xl font-medium text-white mb-2">{s.name}</h3>
                    <p className="text-xl text-white/90">STARTING AT {formatPrice(s.price)}</p>
                  </div>

                  <div className="flex justify-center gap-4 px-4">
                    <button
                      onClick={() => handleDeposit(s.id)}
                      className="bg-white/80 backdrop-blur-sm hover:bg-white text-gray-900 px-12 py-2 rounded text-sm font-medium min-w-[264px]"
                    >
                      Đặt cọc ngay
                    </button>
                    <button
                      onClick={() => setSelectedVehicle(mockVehicles.find(v => v.id === s.id) || null)}
                      className="bg-gray-900/80 backdrop-blur-sm hover:bg-gray-900 text-white px-12 py-2 rounded text-sm font-medium min-w-[264px]"
                    >
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </Carousel>
        </div>
      </section>

      {/* Content sections with updated background */}
      <div className="bg-white">
        {/* Title Section */}
        <div className="p-6 max-w-7xl mx-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Danh mục xe điện</h1>
              <div className="flex space-x-4">
                <button
                  onClick={() => setCompareMode(!compareMode)}
                  className={`px-4 py-2 rounded-lg font-medium ${compareMode ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                >
                  So sánh xe ({compareList.length})
                </button>
              </div>
            </div>
            {/* Vehicle Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {mockVehicles.map((vehicle) => (
                <div key={vehicle.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative">
                    <img
                      src={vehicle.images[0]}
                      alt={vehicle.model}
                      className="w-full h-48 object-cover"
                    />
                    {compareMode && (
                      <button
                        onClick={() => toggleCompare(vehicle)}
                        className={`absolute top-2 right-2 p-2 rounded-full ${compareList.find(v => v.id === vehicle.id)
                            ? 'bg-green-600 text-white'
                            : 'bg-white text-gray-600'
                          }`}
                      >
                        <Car className="h-4 w-4" />
                      </button>
                    )}
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
                        onClick={() => setSelectedVehicle(vehicle)}
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

        {/* Full-width Features Section */}
        <div className="w-full">
          {/* Features Grid */}
          <div className="grid grid-cols-12 min-h-[85vh]">
            {/* Safety System Section - 70% */}
            <div className="col-span-12 lg:col-span-8 bg-white p-16 flex flex-col">
              <div className="max-w-lg mb-8">
                <h2 className="text-5xl font-medium text-black mb-4">Safety System</h2>
                <p className="text-xl text-black leading-relaxed">
                  Advanced driver assistance features designed to deliver the future of driving
                </p>
              </div>
              <div className="flex-1 w-full flex items-center justify-center bg-black rounded-lg overflow-hidden" style={{ height: '66.666vh' }}>
                <video 
                  className="w-full h-full object-contain"
                  controls
                  autoPlay
                  loop
                  muted
                  playsInline
                >
                  <source src="/videos/VF9.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>

            {/* Interior Section - 30% */}
            <div className="col-span-12 lg:col-span-4 bg-white p-16 flex flex-col">
              <div className="max-w-lg mb-8">
                <h2 className="text-5xl font-medium text-black mb-4">Interior of the Future</h2>
                <p className="text-xl text-black leading-relaxed mb-8">
                  17" Touchscreen Display with immersive sound system
                </p>
                <button className="bg-[#f5f5f5] text-black px-8 py-2 text-sm font-medium hover:bg-gray-200 transition-colors">
                  Learn More
                </button>
              </div>
              <div className="flex-1 w-full rounded-lg overflow-hidden">
                <img
                  src="https://vinfast-chevrolet.net/upload/sanpham/z4877208876342_5947d53dceb47e39e8b03c816063ac1b-8837.jpg"
                  alt="VinFast Interior"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>


        {/* Comparison Table */}
        {compareMode && compareList.length > 0 && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 bg-green-600 text-white">
              <h2 className="text-xl font-bold">So sánh xe điện</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium text-gray-700">Thông số</th>
                    {compareList.map(vehicle => (
                      <th key={vehicle.id} className="text-center p-4 font-medium text-gray-700">
                        {vehicle.model}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-4 font-medium">Hình ảnh</td>
                    {compareList.map(vehicle => (
                      <td key={vehicle.id} className="p-4 text-center">
                        <img src={vehicle.images[0]} alt={vehicle.model} className="w-20 h-16 object-cover mx-auto rounded" />
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="p-4 font-medium">Giá bán</td>
                    {compareList.map(vehicle => (
                      <td key={vehicle.id} className="p-4 text-center font-bold text-green-600">
                        {formatPrice(vehicle.price)}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="p-4 font-medium">Tầm hoạt động</td>
                    {compareList.map(vehicle => (
                      <td key={vehicle.id} className="p-4 text-center">{vehicle.range} km</td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="p-4 font-medium">Tốc độ tối đa</td>
                    {compareList.map(vehicle => (
                      <td key={vehicle.id} className="p-4 text-center">{vehicle.maxSpeed} km/h</td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="p-4 font-medium">Thời gian sạc</td>
                    {compareList.map(vehicle => (
                      <td key={vehicle.id} className="p-4 text-center">{vehicle.chargingTime}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Vehicle Detail Modal */}
        {selectedVehicle && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">{selectedVehicle.model}</h2>
                  <button
                    onClick={() => setSelectedVehicle(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <img
                      src={selectedVehicle.images[0]}
                      alt={selectedVehicle.model}
                      className="w-full h-64 object-cover rounded-lg mb-4"
                    />
                    <p className="text-gray-600 mb-4">{selectedVehicle.description}</p>
                  </div>

                  <div>
                    <div className="mb-6">
                      <h3 className="text-lg font-bold mb-2">Thông số kỹ thuật</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Phiên bản:</span>
                          <span className="font-medium">{selectedVehicle.version}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Màu sắc:</span>
                          <span className="font-medium">{selectedVehicle.color}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tầm hoạt động:</span>
                          <span className="font-medium">{selectedVehicle.range} km</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tốc độ tối đa:</span>
                          <span className="font-medium">{selectedVehicle.maxSpeed} km/h</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Thời gian sạc:</span>
                          <span className="font-medium">{selectedVehicle.chargingTime}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mb-6">
                      <h3 className="text-lg font-bold mb-2">Tính năng</h3>
                      <ul className="space-y-1">
                        {selectedVehicle.features.map((feature, index) => (
                          <li key={index} className="flex items-center space-x-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mb-6">
                      <div className="text-3xl font-bold text-green-600 mb-4">
                        {formatPrice(selectedVehicle.price)}
                      </div>
                      <div className="flex space-x-4">
                        <button
                          onClick={() => handleDeposit(selectedVehicle.id)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium"
                        >
                          Đặt cọc ngay
                        </button>
                        <button
                          onClick={() => handleTestDrive(selectedVehicle.id)}
                          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium"
                        >
                          Đặt lái thử
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};