import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Battery, Zap, Clock, ShoppingCart } from 'lucide-react';
import { mockMotorbikes } from '../../../data/mockData';
import { Vehicle } from '../../../types';
import { Header } from '../../common/Header';
import { Sidebar } from '../../common/Sidebar';

export const MotorbikeDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('motorbikes');

  useEffect(() => {
    window.scrollTo(0, 0);
    if (id) {
      const foundVehicle = mockMotorbikes.find(v => v.id === id);
      if (foundVehicle) {
        setVehicle(foundVehicle);
      }
    }
  }, [id]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const handleTestDrive = (vehicleId: string) => {
    navigate(`/portal/motorbike-schedule?vehicleId=${vehicleId}`);
  };

  const handleDeposit = (vehicleId: string) => {
    navigate(`/portal/motorbike-deposit?vehicleId=${vehicleId}`);
  };

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Không tìm thấy xe</h2>
          <button
            onClick={() => navigate('/portal/motorbike-product')}
            className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800"
          >
            Quay lại danh sách xe
          </button>
        </div>
      </div>
    );
  }

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
      />

      <div className={`pt-[73px] transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
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

        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-4xl font-light text-gray-900 mb-8">{vehicle?.model || 'Chi tiết xe máy điện'}</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Image Gallery */}
            <div>
              <div className="bg-white rounded-xl overflow-hidden shadow-lg mb-6">
                <img
                  src={vehicle.images[0]}
                  alt={vehicle.model}
                  className="w-full h-[400px] object-cover"
                />
              </div>
            </div>

            {/* Vehicle Info */}
            <div>
              <div className="bg-white rounded-xl p-8 shadow-lg">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{vehicle.model}</h2>
                <p className="text-lg text-gray-600 mb-4">{vehicle.version} - {vehicle.color}</p>
                <p className="text-3xl font-bold text-green-600 mb-8">{formatPrice(vehicle.price)}</p>

                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="flex items-center space-x-3">
                    <Battery className="h-6 w-6 text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-600">Tầm hoạt động</p>
                      <p className="font-semibold">{vehicle.range} km</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Zap className="h-6 w-6 text-yellow-500" />
                    <div>
                      <p className="text-sm text-gray-600">Tốc độ tối đa</p>
                      <p className="font-semibold">{vehicle.maxSpeed} km/h</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Clock className="h-6 w-6 text-red-500" />
                    <div>
                      <p className="text-sm text-gray-600">Thời gian sạc</p>
                      <p className="font-semibold">{vehicle.chargingTime}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 py-6 mb-8">
                  <h3 className="text-lg font-bold mb-4">Tính năng nổi bật</h3>
                  <ul className="grid grid-cols-2 gap-3">
                    {vehicle.features.map((feature, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={() => handleTestDrive(vehicle.id)}
                    className="flex-1 bg-gray-100 text-gray-800 px-6 py-3 rounded-lg font-medium hover:bg-gray-200"
                  >
                    Đặt lái thử
                  </button>
                  <button
                    onClick={() => handleDeposit(vehicle.id)}
                    className="flex-1 bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 flex items-center justify-center space-x-2"
                  >
                    <ShoppingCart className="h-5 w-5" />
                    <span>Đặt cọc ngay</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="mt-12">
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold mb-6">Thông tin chi tiết</h3>
              <p className="text-gray-700 leading-relaxed">{vehicle.description}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
