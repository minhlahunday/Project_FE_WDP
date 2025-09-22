import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { mockVehicles, mockDealers } from '../../../data/mockData';
import { Vehicle } from '../../../types';
import { Calendar, Clock, MapPin, Phone, Mail, AlertCircle } from 'lucide-react';
import { Header } from '../../common/Header';
import { Sidebar } from '../../common/Sidebar';

export const TestDrive: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const vehicleId = searchParams.get('vehicleId');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedDealer, setSelectedDealer] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    preferredDate: '',
    preferredTime: '',
    message: '',
    dealerId: '',
    address: '',
    identityCard: '', // CMND/CCCD
    pickupLocation: 'dealer', // dealer hoặc home
    agreement: false
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('test-drives');

  useEffect(() => {
    window.scrollTo(0, 0);
    if (vehicleId) {
      const vehicle = mockVehicles.find(v => v.id === vehicleId);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Validate form
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.fullName.trim()) {
      errors.fullName = 'Vui lòng nhập họ tên';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!/^[0-9]{10}$/.test(formData.phone)) {
      errors.phone = 'Số điện thoại không hợp lệ';
    }

    if (!formData.email.trim()) {
      errors.email = 'Vui lòng nhập email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email không hợp lệ';
    }

    if (!formData.identityCard.trim()) {
      errors.identityCard = 'Vui lòng nhập CMND/CCCD';
    } else if (!/^[0-9]{9,12}$/.test(formData.identityCard)) {
      errors.identityCard = 'CMND/CCCD không hợp lệ';
    }

    if (!formData.preferredDate) {
      errors.preferredDate = 'Vui lòng chọn ngày';
    } else {
      const selectedDate = new Date(formData.preferredDate);
      const today = new Date();
      if (selectedDate < today) {
        errors.preferredDate = 'Ngày không hợp lệ';
      }
    }

    if (!formData.preferredTime) {
      errors.preferredTime = 'Vui lòng chọn giờ';
    }

    if (!formData.dealerId && formData.pickupLocation === 'dealer') {
      errors.dealerId = 'Vui lòng chọn đại lý';
    }

    if (!formData.address && formData.pickupLocation === 'home') {
      errors.address = 'Vui lòng nhập địa chỉ';
    }

    if (!formData.agreement) {
      errors.agreement = 'Vui lòng đồng ý với điều khoản';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Giả lập API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Lưu vào localStorage để demo
      const testDrives = JSON.parse(localStorage.getItem('testDrives') || '[]');
      const newTestDrive = {
        id: Date.now().toString(),
        ...formData,
        vehicleId: selectedVehicle?.id,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      testDrives.push(newTestDrive);
      localStorage.setItem('testDrives', JSON.stringify(testDrives));

      setShowSuccessModal(true);
    } catch (error) {
      alert('Có lỗi xảy ra. Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Hiển thị modal thành công
  const SuccessModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Đặt lịch thành công!</h3>
          <p className="mt-2 text-sm text-gray-500">
            Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất để xác nhận lịch lái thử.
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

  if (!selectedVehicle) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Không tìm thấy xe</h2>
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
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <button 
              onClick={() => navigate(-1)}
              className="text-gray-600 hover:text-gray-900 flex items-center space-x-2"
            >
              <span>← Quay lại</span>
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Đặt lịch lái thử</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Vehicle Info */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Thông tin xe</h2>
              
              <div className="mb-6">
                <img
                  src={selectedVehicle.images[0]}
                  alt={selectedVehicle.model}
                  className="w-full h-64 object-cover rounded-xl"
                />
              </div>

              <h3 className="text-3xl font-bold text-gray-900 mb-2">{selectedVehicle.model}</h3>
              <p className="text-lg text-gray-600 mb-2">{selectedVehicle.version} - {selectedVehicle.color}</p>
              <p className="text-3xl font-bold text-green-600 mb-6">{formatPrice(selectedVehicle.price)}</p>

              {/* Specifications */}
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-200">
                  <span className="font-medium text-gray-700">Tầm hoạt động</span>
                  <span className="text-gray-900">{selectedVehicle.range} km</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-200">
                  <span className="font-medium text-gray-700">Tốc độ tối đa</span>
                  <span className="text-gray-900">{selectedVehicle.maxSpeed} km/h</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-200">
                  <span className="font-medium text-gray-700">Thời gian sạc</span>
                  <span className="text-gray-900">{selectedVehicle.chargingTime}</span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="font-medium text-gray-700">Tồn kho</span>
                  <span className="text-gray-900">{selectedVehicle.stock} xe</span>
                </div>
              </div>
            </div>

            {/* Updated Booking Form */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Thông tin đặt lịch</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900">Thông tin cá nhân</h3>
                  
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                      Họ và tên *
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                        formErrors.fullName ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Nhập họ và tên"
                    />
                    {formErrors.fullName && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.fullName}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="identityCard" className="block text-sm font-medium text-gray-700 mb-2">
                      CMND/CCCD *
                    </label>
                    <input
                      type="text"
                      id="identityCard"
                      name="identityCard"
                      value={formData.identityCard}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                        formErrors.identityCard ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Nhập số CMND/CCCD"
                    />
                    {formErrors.identityCard && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.identityCard}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Số điện thoại *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Nhập số điện thoại"
                    />
                    {formErrors.phone && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.phone}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Nhập email"
                    />
                    {formErrors.email && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                    )}
                  </div>
                </div>

                {/* Date and Time Selection */}
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900">Thời gian lái thử</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="preferredDate" className="block text-sm font-medium text-gray-700 mb-2">
                        Ngày mong muốn *
                      </label>
                      <input
                        type="date"
                        id="preferredDate"
                        name="preferredDate"
                        value={formData.preferredDate}
                        onChange={handleInputChange}
                        min={new Date().toISOString().split('T')[0]}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                          formErrors.preferredDate ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {formErrors.preferredDate && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.preferredDate}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="preferredTime" className="block text-sm font-medium text-gray-700 mb-2">
                        Giờ mong muốn *
                      </label>
                      <select
                        id="preferredTime"
                        name="preferredTime"
                        value={formData.preferredTime}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                          formErrors.preferredTime ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Chọn giờ</option>
                        <option value="09:00">09:00</option>
                        <option value="10:00">10:00</option>
                        <option value="11:00">11:00</option>
                        <option value="14:00">14:00</option>
                        <option value="15:00">15:00</option>
                        <option value="16:00">16:00</option>
                      </select>
                      {formErrors.preferredTime && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.preferredTime}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Test Drive Location */}
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900">Địa điểm lái thử</h3>
                  
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="pickupLocation"
                        value="dealer"
                        checked={formData.pickupLocation === 'dealer'}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      <span>Tại đại lý</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="pickupLocation"
                        value="home"
                        checked={formData.pickupLocation === 'home'}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      <span>Tại nhà</span>
                    </label>
                  </div>

                  {formData.pickupLocation === 'dealer' ? (
                    <div>
                      <label htmlFor="dealerId" className="block text-sm font-medium text-gray-700 mb-2">
                        Chọn đại lý *
                      </label>
                      <select
                        id="dealerId"
                        name="dealerId"
                        value={formData.dealerId}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                          formErrors.dealerId ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Chọn đại lý</option>
                        {mockDealers.map(dealer => (
                          <option key={dealer.id} value={dealer.id}>
                            {dealer.name} - {dealer.address}
                          </option>
                        ))}
                      </select>
                      {formErrors.dealerId && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.dealerId}</p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                        Địa chỉ *
                      </label>
                      <input
                        type="text"
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                          formErrors.address ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Nhập địa chỉ của bạn"
                      />
                      {formErrors.address && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.address}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Message Field */}
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Ghi chú (tùy chọn)
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    value={formData.message}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Nhập ghi chú nếu có"
                  />
                </div>

                {/* Agreement Checkbox */}
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="agreement"
                    name="agreement"
                    checked={formData.agreement}
                    onChange={(e) => setFormData(prev => ({ ...prev, agreement: e.target.checked }))
                    }
                    className="mt-1"
                  />
                  <label htmlFor="agreement" className="ml-2 text-sm text-gray-600">
                    Tôi đồng ý với các điều khoản và điều kiện của VinFast *
                  </label>
                </div>
                {formErrors.agreement && (
                  <p className="text-sm text-red-600">{formErrors.agreement}</p>
                )}

                {/* Submit Buttons */}
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Đang xử lý...' : 'Đặt lịch lái thử'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {showSuccessModal && <SuccessModal />}
    </div>
  );
};
