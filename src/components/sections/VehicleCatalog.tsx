import React, { useState } from 'react';
import { Car, Battery, Zap, Clock, Eye, ShoppingCart } from 'lucide-react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { mockVehicles } from '../../data/mockData';
import { Vehicle } from '../../types';
import './VehicleCatalog.css';

export const VehicleCatalog: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path: string) => {
    if (navigate) {
      // Preserve sidebar state when navigating
      navigate(path, { replace: false });
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
    // Use handleNavigation instead of direct navigate
    handleNavigation(`/portal/test-drive?vehicleId=${vehicleId}`);
  };

  const handleDeposit = (vehicleId: string) => {
    // Use handleNavigation instead of direct navigate
    handleNavigation(`/portal/deposit?vehicleId=${vehicleId}`);
  };

  return (
    <div className="-mx-6 bg-gray-900">
      {/* Three Vehicle Cards Section */}
      <section className="bg-white py-20 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900">Những chiếc xe điện tốt nhất của chúng tôi</h2>
            <button
              onClick={() => navigate('/portal/car-product')}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Xem tất cả mẫu xe →
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* VF7 */}
            <div
              className="text-center group cursor-pointer"
              onClick={() => {
                const vf7 = mockVehicles.find(v => v.model.includes('VF 7'));
                if (vf7) navigate(`/portal/car-detail/${vf7.id}`);
              }}
            >
              <div className="relative overflow-hidden rounded-2xl mb-6">
                <img
                  src="https://media.vov.vn/sites/default/files/styles/large/public/2024-06/a1_8.jpg"
                  alt="VF7"
                  className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end">
                  <div className="text-white p-6 w-full">
                    <h3 className="text-2xl font-bold mb-2">VF7</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-sm opacity-90">SUV Nhỏ Gọn</span>
                      <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* VF8 */}
            <div
              className="text-center group cursor-pointer"
              onClick={() => {
                const vf8 = mockVehicles.find(v => v.model.includes('VF 8'));
                if (vf8) navigate(`/portal/car-detail/${vf8.id}`);
              }}
            >
              <div className="relative overflow-hidden rounded-2xl mb-6">
                <img
                  src="https://vinfastotominhdao.vn/wp-content/uploads/VinFast-VF8-1.jpg"
                  alt="VF8"
                  className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end">
                  <div className="text-white p-6 w-full">
                    <h3 className="text-2xl font-bold mb-2">VF8</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-sm opacity-90">SUV Cỡ Trung</span>
                      <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* VF9 */}
            <div
              className="text-center group cursor-pointer"
              onClick={() => {
                const vf9 = mockVehicles.find(v => v.model.includes('VF 9'));
                if (vf9) navigate(`/portal/car-detail/${vf9.id}`);
              }}
            >
              <div className="relative overflow-hidden rounded-2xl mb-6">
                <img
                  src="https://vinfastotominhdao.vn/wp-content/uploads/VinFast-VF9-9.jpg"
                  alt="VF9"
                  className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end">
                  <div className="text-white p-6 w-full">
                    <h3 className="text-2xl font-bold mb-2">VF9</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-sm opacity-90">SUV Đầy Đủ Kích Cỡ</span>
                      <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Your VinFast Journey Section */}
      <section className="bg-white py-20 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-900 mb-4">Hành trình VinFast của bạn bắt đầu ngay bây giờ.</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[60vh]">
            {/* Car Section */}
            <div
              className="group relative overflow-hidden rounded-lg cursor-pointer transition-all duration-500 hover:scale-105"
              onClick={() => navigate('/portal/car-product')}
            >
              <video
                className="w-full h-full object-cover"
                autoPlay
                loop
                muted
                playsInline
              >
                <source src="/videos/VF8.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              <div className="absolute inset-0 bg-black bg-opacity-30"></div>

              {/* Car Label */}
              <div className="absolute top-6 left-6">
                <span className="text-white text-3xl font-light tracking-wider">Ô tô</span>
              </div>

              {/* Car Info */}
              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex items-end justify-between">
                  <div className="text-white">
                    <p className="text-sm mb-1">SUV điện với tính năng cao cấp</p>
                    <p className="text-xs opacity-80">4 cửa, 5 chỗ ngồi</p>
                  </div>
                  <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center group-hover:bg-opacity-40 transition-all">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Motorcycle Section */}
            <div className="group relative overflow-hidden rounded-lg cursor-pointer transition-all duration-500 hover:scale-105">
              <video
                className="w-full h-full object-cover"
                autoPlay
                loop
                muted
                playsInline
              >
                <source src="/videos/Moto.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              <div className="absolute inset-0 bg-black bg-opacity-30"></div>

              {/* Motorcycle Label */}
              <div className="absolute top-6 left-6">
                <span className="text-white text-3xl font-light tracking-wider">Xe máy điện</span>
              </div>

              {/* Motorcycle Info */}
              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex items-end justify-between">
                  <div className="text-white">
                    <p className="text-sm mb-1">Xe tay ga điện cho di chuyển đô thị</p>
                    <p className="text-xs opacity-80">2 bánh, thân thiện môi trường</p>
                  </div>
                  <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center group-hover:bg-opacity-40 transition-all">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Content sections with updated background */}
      <div className="bg-white">

        {/* Full-width Features Section */}
        <div className="w-full">
          {/* Features Grid */}
          <div className="grid grid-cols-12 min-h-[85vh]">
            {/* Safety System Section - 70% */}
            <div className="col-span-12 lg:col-span-8 bg-white p-16 flex flex-col">
              <div className="max-w-lg mb-8">
                <h2 className="text-5xl font-medium text-black mb-4">Hệ thống An toàn</h2>
                <p className="text-xl text-black leading-relaxed">
                  Các tính năng hỗ trợ lái xe tiên tiến được thiết kế để mang đến tương lai của việc lái xe
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
                  <source src="/videos/VinFast.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>

            {/* Interior Section - 30% */}
            <div className="col-span-12 lg:col-span-4 bg-white p-16 flex flex-col">
              <div className="max-w-lg mb-8">
                <h2 className="text-5xl font-medium text-black mb-4">Nội thất Tương lai</h2>
                <p className="text-xl text-black leading-relaxed mb-8">
                  Màn hình cảm ứng 17" với hệ thống âm thanh sống động
                </p>
                <button className="bg-[#f5f5f5] text-black px-8 py-2 text-sm font-medium hover:bg-gray-200 transition-colors">
                  Tìm hiểu thêm
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