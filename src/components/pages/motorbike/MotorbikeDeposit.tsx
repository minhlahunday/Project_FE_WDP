import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { mockMotorbikes } from '../../../data/mockData';
import { Vehicle } from '../../../types';
import { Clock, Wallet, CreditCard, AlertCircle } from 'lucide-react';
import { Header } from '../../common/Header';
import { Sidebar } from '../../common/Sidebar';

export const MotorbikeDeposit: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const vehicleId = searchParams.get('vehicleId');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('motorbikes');
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    identityCard: '',
    address: '',
    paymentMethod: 'card',
    agreement: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    if (vehicleId) {
      const vehicle = mockMotorbikes.find(v => v.id === vehicleId);
      if (vehicle) {
        setSelectedVehicle(vehicle);
      }
    }
  }, [vehicleId]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setShowSuccessModal(true);
    } catch (error) {
      alert('Có lỗi xảy ra. Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const SuccessModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Đặt cọc thành công!</h3>
          <p className="mt-2 text-sm text-gray-500">
            Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất để hoàn tất thủ tục.
          </p>
          <div className="mt-4">
            <button
              onClick={() => navigate('/portal/dashboard')}
              className="w-full bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
            >
              Về trang chủ
            </button>
          </div>
        </div>
      </div>
    </div>
  );

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
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Đặt cọc xe máy điện</h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Vehicle Info */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Thông tin xe</h2>
              {selectedVehicle && (
                <>
                  <img
                    src={selectedVehicle.images[0]}
                    alt={selectedVehicle.model}
                    className="w-full h-64 object-cover rounded-xl mb-6"
                  />
                  <h3 className="text-3xl font-bold text-gray-900 mb-2">
                    {selectedVehicle.model}
                  </h3>
                  <p className="text-lg text-gray-600 mb-2">
                    {selectedVehicle.version} - {selectedVehicle.color}
                  </p>
                  <p className="text-3xl font-bold text-green-600 mb-6">
                    {formatPrice(selectedVehicle.price)}
                  </p>
                  <div className="space-y-4">
                    <div className="flex justify-between py-3 border-b border-gray-200">
                      <span className="font-medium text-gray-700">Số tiền đặt cọc</span>
                      <span className="text-gray-900 font-bold">
                        {formatPrice(selectedVehicle.price * 0.1)}
                      </span>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-medium text-yellow-800">
                            Lưu ý về đặt cọc
                          </h4>
                          <p className="mt-1 text-sm text-yellow-700">
                            Số tiền đặt cọc là 10% giá trị xe. Quý khách vui lòng thanh toán trong vòng 24h sau khi đặt cọc.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Deposit Form */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Thông tin đặt cọc</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Form fields */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Họ và tên *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                      value={formData.identityCard}
                      onChange={(e) => setFormData({...formData, identityCard: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Nhập địa chỉ"
                    />
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Phương thức thanh toán</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <label className={`
                      flex items-center justify-center p-4 rounded-lg border-2 cursor-pointer
                      ${formData.paymentMethod === 'card' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-300 hover:border-blue-500'}
                    `}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="card"
                        checked={formData.paymentMethod === 'card'}
                        onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                        className="sr-only"
                      />
                      <div className="text-center">
                        <CreditCard className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                        <span className="text-sm font-medium">Thẻ tín dụng</span>
                      </div>
                    </label>

                    <label className={`
                      flex items-center justify-center p-4 rounded-lg border-2 cursor-pointer
                      ${formData.paymentMethod === 'transfer' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-300 hover:border-blue-500'}
                    `}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="transfer"
                        checked={formData.paymentMethod === 'transfer'}
                        onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                        className="sr-only"
                      />
                      <div className="text-center">
                        <Wallet className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                        <span className="text-sm font-medium">Chuyển khoản</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Agreement */}
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="agreement"
                    checked={formData.agreement}
                    onChange={(e) => setFormData({...formData, agreement: e.target.checked})}
                    className="mt-1"
                  />
                  <label htmlFor="agreement" className="ml-2 text-sm text-gray-600">
                    Tôi đồng ý với các điều khoản và điều kiện đặt cọc của VinFast *
                  </label>
                </div>

                {/* Submit Button */}
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-300"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !formData.agreement}
                    className="flex-1 bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Đang xử lý...' : 'Xác nhận đặt cọc'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {showSuccessModal && <SuccessModal />}
      </div>
    </div>
  );
};
