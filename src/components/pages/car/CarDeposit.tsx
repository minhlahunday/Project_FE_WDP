import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { mockVehicles } from '../../../data/mockData';
import { Header } from '../../common/Header';
import { Sidebar } from '../../common/Sidebar';

export const CarDeposit: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const vehicleId = searchParams.get('vehicleId');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('vehicles');
  
  const vehicle = mockVehicles.find(v => v.id === vehicleId) || mockVehicles[0];
  
  const [formData, setFormData] = useState({
    fullName: '',
    idCard: '',
    phone: '',
    email: '',
    address: '',
    paymentMethod: 'transfer',
    version: vehicle.version || 'Standard',
    color: 'Trắng Ngọc Trai'
  });

  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const depositAmount = 100000000; // 100 triệu VND đặt cọc cho xe hơi

  const carVersions = [
    { name: 'Eco', price: vehicle.price },
    { name: 'Plus', price: vehicle.price + 200000000 }
  ];

  const carColors = [
    'Trắng Ngọc Trai',
    'Đen Obsidian', 
    'Đỏ Cherry',
    'Xanh Dương Đại Dương',
    'Xám Titanium'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      alert('Vui lòng đồng ý với các điều kiện của VinFast');
      return;
    }
    
    // Process car deposit
    console.log('Car Deposit Data:', { ...formData, vehicle: vehicle.model, depositAmount });
    alert('Đặt cọc xe hơi thành công! Chúng tôi sẽ liên hệ với bạn sớm nhất.');
    navigate('/');
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

        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Đặt cọc xe ô tô điện</h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Vehicle Info */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Thông tin xe</h2>
              
              <img
                src={vehicle.images[0]}
                alt={vehicle.model}
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
              
              <h3 className="text-lg font-bold text-gray-900">{vehicle.model}</h3>
              <p className="text-gray-600 mb-4">{vehicle.description}</p>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tầm hoạt động:</span>
                  <span className="font-medium">{vehicle.range} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tốc độ tối đa:</span>
                  <span className="font-medium">{vehicle.maxSpeed} km/h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Thời gian sạc:</span>
                  <span className="font-medium">{vehicle.chargingTime}</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Số tiền đặt cọc:</span>
                  <span className="text-2xl font-bold text-green-600">{formatPrice(depositAmount)}</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Số tiền đặt cọc là 10% giá trị xe. Quý khách vui lòng thanh toán trong vòng 24h sau khi đặt cọc.
                </p>
              </div>
            </div>

            {/* Right: Deposit Form */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Thông tin đặt cọc</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Họ và tên *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Nhập họ và tên"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CMND/CCCD *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.idCard}
                    onChange={(e) => setFormData({...formData, idCard: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Nhập số CMND/CCCD"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số điện thoại *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Nhập số điện thoại"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Nhập email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Địa chỉ *
                  </label>
                  <textarea
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows={3}
                    placeholder="Nhập địa chỉ"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phiên bản xe
                  </label>
                  <select
                    value={formData.version}
                    onChange={(e) => setFormData({...formData, version: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {carVersions.map((version) => (
                      <option key={version.name} value={version.name}>
                        {version.name} - {formatPrice(version.price)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Màu sắc
                  </label>
                  <select
                    value={formData.color}
                    onChange={(e) => setFormData({...formData, color: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {carColors.map((color) => (
                      <option key={color} value={color}>{color}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phương thức thanh toán
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, paymentMethod: 'transfer'})}
                      className={`p-4 border rounded-lg text-center ${
                        formData.paymentMethod === 'transfer'
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="text-sm font-medium">Thẻ tín dụng</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, paymentMethod: 'installment'})}
                      className={`p-4 border rounded-lg text-center ${
                        formData.paymentMethod === 'installment'
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="text-sm font-medium">Chuyển khoản</div>
                    </button>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1 h-4 w-4 text-green-600 rounded border-gray-300"
                  />
                  <label htmlFor="terms" className="text-sm text-gray-600">
                    Tôi đồng ý với các điều kiện và điều khoản của VinFast *
                  </label>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={!agreedToTerms}
                    className="w-full bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                  >
                    Xác nhận đặt cọc {formatPrice(depositAmount)}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
