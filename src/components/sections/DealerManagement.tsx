import React, { useState } from 'react';
import { Plus, Search, MapPin, Phone, Mail, TrendingUp, AlertTriangle, Eye, Edit } from 'lucide-react';
import { mockDealers } from '../../data/mockData';
import { Dealer } from '../../types';

export const DealerManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDealer, setSelectedDealer] = useState<Dealer | null>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const filteredDealers = mockDealers.filter(dealer =>
    dealer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dealer.manager.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dealer.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPerformanceColor = (current: number, target: number) => {
    const percentage = (current / target) * 100;
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Quản lý đại lý</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Thêm đại lý</span>
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm đại lý..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Tổng đại lý</p>
              <p className="text-2xl font-bold text-gray-900">{mockDealers.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Đạt chỉ tiêu</p>
              <p className="text-2xl font-bold text-gray-900">
                {mockDealers.filter(d => d.currentSales >= d.target * 0.9).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Cần hỗ trợ</p>
              <p className="text-2xl font-bold text-gray-900">
                {mockDealers.filter(d => d.currentSales < d.target * 0.7).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Tổng công nợ</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPrice(mockDealers.reduce((sum, d) => sum + d.debt, 0))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Dealers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredDealers.map((dealer) => {
          const completionPercentage = (dealer.currentSales / dealer.target) * 100;
          
          return (
            <div key={dealer.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{dealer.name}</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span>{dealer.address}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4" />
                      <span>{dealer.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4" />
                      <span>{dealer.email}</span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setSelectedDealer(dealer)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button className="text-green-600 hover:text-green-800">
                    <Edit className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Tiến độ doanh số</span>
                  <span className={`text-sm font-medium ${getPerformanceColor(dealer.currentSales, dealer.target)}`}>
                    {completionPercentage.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className={`h-2 rounded-full ${
                      completionPercentage >= 90 ? 'bg-green-600' :
                      completionPercentage >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(completionPercentage, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{formatPrice(dealer.currentSales)}</span>
                  <span>{formatPrice(dealer.target)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Quản lý</p>
                  <p className="font-medium">{dealer.manager}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Công nợ</p>
                  <p className={`font-medium ${dealer.debt > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatPrice(dealer.debt)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Dealer Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Thêm đại lý mới</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tên đại lý *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                      placeholder="VD: Đại lý Đà Nẵng"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tên quản lý *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                      placeholder="Tên người quản lý"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Địa chỉ *
                  </label>
                  <textarea
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                    rows={3}
                    placeholder="Địa chỉ đầy đủ của đại lý"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số điện thoại *
                    </label>
                    <input
                      type="tel"
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                      placeholder="0241234567"
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
                      placeholder="dealer@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chỉ tiêu doanh số hàng tháng (VND) *
                  </label>
                  <input
                    type="number"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                    placeholder="1000000000"
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
                    Thêm đại lý
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Dealer Detail Modal */}
      {selectedDealer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Chi tiết đại lý: {selectedDealer.name}</h2>
                <button
                  onClick={() => setSelectedDealer(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Dealer Info */}
                <div className="lg:col-span-1">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Thông tin đại lý</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600">Tên đại lý</p>
                        <p className="font-medium">{selectedDealer.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Quản lý</p>
                        <p className="font-medium">{selectedDealer.manager}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Địa chỉ</p>
                        <p className="font-medium">{selectedDealer.address}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Điện thoại</p>
                        <p className="font-medium">{selectedDealer.phone}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium">{selectedDealer.email}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance & Stats */}
                <div className="lg:col-span-2">
                  <div className="space-y-6">
                    {/* Performance */}
                    <div className="bg-white border rounded-lg p-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Hiệu suất kinh doanh</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">{formatPrice(selectedDealer.currentSales)}</p>
                          <p className="text-sm text-gray-600">Doanh số hiện tại</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">{formatPrice(selectedDealer.target)}</p>
                          <p className="text-sm text-gray-600">Chỉ tiêu</p>
                        </div>
                        <div className="text-center">
                          <p className={`text-2xl font-bold ${selectedDealer.debt > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {formatPrice(selectedDealer.debt)}
                          </p>
                          <p className="text-sm text-gray-600">Công nợ</p>
                        </div>
                      </div>
                    </div>

                    {/* Recent Orders */}
                    <div className="bg-white border rounded-lg p-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Đơn hàng gần đây</h3>
                      <div className="text-center py-8 text-gray-500">
                        Chưa có dữ liệu đơn hàng
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-4">
                      <button className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium">
                        Cập nhật chỉ tiêu
                      </button>
                      <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium">
                        Xem báo cáo chi tiết
                      </button>
                      <button className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium">
                        Quản lý tài khoản
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
  );
};