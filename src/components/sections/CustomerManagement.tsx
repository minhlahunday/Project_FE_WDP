import React, { useState } from 'react';
import { Plus, Search, Phone, Mail, MapPin, Calendar, MessageSquare, Edit, Eye } from 'lucide-react';
import { mockCustomers, mockVehicles } from '../../data/mockData';
import { Customer } from '../../types';

export const CustomerManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const filteredCustomers = mockCustomers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Quản lý khách hàng</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Thêm khách hàng</span>
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm khách hàng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>
      </div>

      {/* Customer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((customer) => (
          <div key={customer.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-1">{customer.name}</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4" />
                    <span>{customer.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4" />
                    <span>{customer.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span>{customer.address}</span>
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={() => setSelectedCustomer(customer)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button className="text-green-600 hover:text-green-800">
                  <Edit className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xl font-bold text-gray-900">{customer.orders?.length || 0}</p>
                  <p className="text-xs text-gray-600">Đơn hàng</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">{customer.testDrives?.length || 0}</p>
                  <p className="text-xs text-gray-600">Lái thử</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-green-600">VIP</p>
                  <p className="text-xs text-gray-600">Hạng</p>
                </div>
              </div>
            </div>

            <div className="flex space-x-2 mt-4">
              <button className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm font-medium flex items-center justify-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>Đặt lịch</span>
              </button>
              <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded text-sm font-medium flex items-center justify-center space-x-1">
                <MessageSquare className="h-3 w-3" />
                <span>Nhắn tin</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Customer Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Thêm khách hàng mới</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Họ và tên *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                    placeholder="Nhập họ và tên"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                    placeholder="Nhập email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số điện thoại *
                  </label>
                  <input
                    type="tel"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                    placeholder="Nhập số điện thoại"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Địa chỉ
                  </label>
                  <textarea
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                    rows={3}
                    placeholder="Nhập địa chỉ"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ghi chú
                  </label>
                  <textarea
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                    rows={2}
                    placeholder="Ghi chú về khách hàng"
                  />
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Thêm khách hàng
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Thông tin chi tiết khách hàng</h2>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Customer Info */}
                <div className="lg:col-span-1">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Thông tin cá nhân</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600">Họ và tên</p>
                        <p className="font-medium">{selectedCustomer.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium">{selectedCustomer.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Số điện thoại</p>
                        <p className="font-medium">{selectedCustomer.phone}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Địa chỉ</p>
                        <p className="font-medium">{selectedCustomer.address}</p>
                      </div>
                    </div>

                    <button className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium">
                      Chỉnh sửa thông tin
                    </button>
                  </div>
                </div>

                {/* Activity History */}
                <div className="lg:col-span-2">
                  <div className="space-y-6">
                    {/* Test Drives */}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Lịch sử lái thử</h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-600 text-center py-8">Chưa có lịch lái thử nào</p>
                        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium">
                          Đặt lịch lái thử mới
                        </button>
                      </div>
                    </div>

                    {/* Orders */}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Lịch sử đơn hàng</h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-600 text-center py-8">Chưa có đơn hàng nào</p>
                        <button className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium">
                          Tạo đơn hàng mới
                        </button>
                      </div>
                    </div>

                    {/* Feedback */}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Phản hồi & Khiếu nại</h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-600 text-center py-8">Chưa có phản hồi nào</p>
                        <button className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium">
                          Ghi nhận phản hồi
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};