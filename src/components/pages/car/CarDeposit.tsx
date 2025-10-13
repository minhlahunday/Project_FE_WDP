import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '../../common/Header';
import { Sidebar } from '../../common/Sidebar';
import { authService } from '../../../services/authService';

export const CarDeposit: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const vehicleId = searchParams.get('vehicleId');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('vehicles');
  const [vehicle, setVehicle] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    fullName: '',
    idCard: '',
    phone: '',
    email: '',
    address: '',
    paymentMethod: 'transfer',
    version: '',
    color: ''
  });

  const [agreedToTerms, setAgreedToTerms] = useState(false);

  useEffect(() => {
    if (vehicleId) {
      loadVehicle(vehicleId);
    }
  }, [vehicleId]);

  const loadVehicle = async (id: string) => {
    try {
      setLoading(true);
      const response = await authService.getVehicleById(id);
      if (response.success && response.data) {
        const vehicleData = response.data as Record<string, unknown>;
        setVehicle(vehicleData);
        setFormData(prev => ({
          ...prev,
          version: vehicleData.version as string || 'Phiên bản chuẩn',
          color: (vehicleData.color_options as string[])?.[0] || 'Màu chuẩn'
        }));
      }
    } catch (error) {
      console.error('Error loading vehicle:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    if (!price) return 'Liên hệ';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const calculateDepositAmount = (price: number) => {
    return Math.round(price * 0.1); // 10% of vehicle price
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      alert('Vui lòng đồng ý với các điều kiện');
      return;
    }
    
    console.log('Car Deposit Data:', { 
      ...formData, 
      vehicle: vehicle?.name, 
      vehicleId,
      depositAmount: calculateDepositAmount(vehicle?.price as number || 0)
    });
    alert('Đặt cọc xe thành công! Chúng tôi sẽ liên hệ với bạn sớm nhất.');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Đang tải thông tin xe...</p>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Không tìm thấy xe</h2>
          <button 
            onClick={() => navigate('/portal/car-product')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg"
          >
            Quay lại danh sách xe
          </button>
        </div>
      </div>
    );
  }

  const depositAmount = calculateDepositAmount(vehicle.price as number || 0);
  const colorOptions = vehicle.color_options as string[] || ['Màu chuẩn'];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />
      
      <Sidebar
        activeSection={activeSection}
        onSectionChange={(section) => setActiveSection(section)}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className={`pt-[73px] transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Đặt cọc xe điện</h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Thông tin xe</h2>
              
              <img
                src={(vehicle.images as string[])?.[0] || '/placeholder-car.jpg'}
                alt={vehicle.name as string}
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
              
              <h3 className="text-lg font-bold text-gray-900">{vehicle.name as string}</h3>
              <p className="text-gray-600 mb-4">{vehicle.description as string || 'Xe điện hiện đại'}</p>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tầm hoạt động:</span>
                  <span className="font-medium">{vehicle.range_km as number || 0} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tốc độ tối đa:</span>
                  <span className="font-medium">{vehicle.top_speed as number || 0} km/h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Thời gian sạc nhanh:</span>
                  <span className="font-medium">{vehicle.charging_fast as number || 0}h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Dung lượng pin:</span>
                  <span className="font-medium">{vehicle.battery_capacity as number || 0} kWh</span>
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
                    <option value="">{vehicle.version}</option>
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
                    {colorOptions.map((color) => (
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
