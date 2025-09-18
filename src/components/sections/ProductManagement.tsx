import React, { useState } from 'react';
import { Plus, Edit, Eye, Trash2, Package, DollarSign, Palette, Settings } from 'lucide-react';
import { mockVehicles, mockPromotions } from '../../data/mockData';
import { Vehicle, Promotion } from '../../types';

export const ProductManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('vehicles');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const tabs = [
    { id: 'vehicles', label: 'Danh mục xe', icon: Package },
    { id: 'pricing', label: 'Giá & Khuyến mãi', icon: DollarSign },
    { id: 'variants', label: 'Phiên bản & Màu sắc', icon: Palette },
    { id: 'features', label: 'Tính năng', icon: Settings },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Quản lý sản phẩm</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Thêm mới</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-green-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Vehicles Tab */}
      {activeTab === 'vehicles' && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-4 font-medium text-gray-700">Hình ảnh</th>
                  <th className="text-left p-4 font-medium text-gray-700">Mẫu xe</th>
                  <th className="text-left p-4 font-medium text-gray-700">Phiên bản</th>
                  <th className="text-left p-4 font-medium text-gray-700">Giá bán lẻ</th>
                  <th className="text-left p-4 font-medium text-gray-700">Giá sỉ</th>
                  <th className="text-left p-4 font-medium text-gray-700">Tồn kho</th>
                  <th className="text-left p-4 font-medium text-gray-700">Trạng thái</th>
                  <th className="text-left p-4 font-medium text-gray-700">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {mockVehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <img
                        src={vehicle.images[0]}
                        alt={vehicle.model}
                        className="w-16 h-12 object-cover rounded"
                      />
                    </td>
                    <td className="p-4 font-medium">{vehicle.model}</td>
                    <td className="p-4">{vehicle.version}</td>
                    <td className="p-4 text-green-600 font-medium">{formatPrice(vehicle.price)}</td>
                    <td className="p-4 text-blue-600 font-medium">{formatPrice(vehicle.wholesalePrice || 0)}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        vehicle.stock > 10 ? 'bg-green-100 text-green-800' :
                        vehicle.stock > 5 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {vehicle.stock} xe
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        Đang bán
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-800">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="text-green-600 hover:text-green-800">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-800">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pricing Tab */}
      {activeTab === 'pricing' && (
        <div className="space-y-6">
          {/* Promotions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Khuyến mãi hiện tại</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockPromotions.map((promotion) => (
                <div key={promotion.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h4 className="font-bold text-lg text-gray-900 mb-2">{promotion.title}</h4>
                  <p className="text-gray-600 mb-3">{promotion.description}</p>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-2xl font-bold text-red-600">-{formatPrice(promotion.discount)}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    <p>Từ: {new Date(promotion.validFrom).toLocaleDateString('vi-VN')}</p>
                    <p>Đến: {new Date(promotion.validTo).toLocaleDateString('vi-VN')}</p>
                  </div>
                  <div className="flex space-x-2 mt-4">
                    <button className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm">
                      Chỉnh sửa
                    </button>
                    <button className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm">
                      Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Price Management */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Quản lý giá</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-4 font-medium text-gray-700">Mẫu xe</th>
                    <th className="text-left p-4 font-medium text-gray-700">Giá niêm yết</th>
                    <th className="text-left p-4 font-medium text-gray-700">Giá sỉ</th>
                    <th className="text-left p-4 font-medium text-gray-700">Lợi nhuận</th>
                    <th className="text-left p-4 font-medium text-gray-700">Chiết khấu tối đa</th>
                    <th className="text-left p-4 font-medium text-gray-700">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {mockVehicles.map((vehicle) => {
                    const profit = vehicle.price - (vehicle.wholesalePrice || 0);
                    const margin = (profit / vehicle.price * 100).toFixed(1);
                    
                    return (
                      <tr key={vehicle.id} className="border-b hover:bg-gray-50">
                        <td className="p-4 font-medium">{vehicle.model}</td>
                        <td className="p-4 text-green-600 font-medium">{formatPrice(vehicle.price)}</td>
                        <td className="p-4 text-blue-600 font-medium">{formatPrice(vehicle.wholesalePrice || 0)}</td>
                        <td className="p-4">
                          <span className="text-purple-600 font-medium">
                            {formatPrice(profit)} ({margin}%)
                          </span>
                        </td>
                        <td className="p-4">5%</td>
                        <td className="p-4">
                          <button className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm">
                            Cập nhật giá
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  {activeTab === 'vehicles' && 'Thêm mẫu xe mới'}
                  {activeTab === 'pricing' && 'Tạo khuyến mãi mới'}
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              {activeTab === 'vehicles' && (
                <form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tên mẫu xe *
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                        placeholder="VD: ElectricVM Model Y"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phiên bản *
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                        placeholder="VD: Premium, Standard"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Giá bán lẻ (VND) *
                      </label>
                      <input
                        type="number"
                        required
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                        placeholder="850000000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Giá sỉ (VND) *
                      </label>
                      <input
                        type="number"
                        required
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                        placeholder="750000000"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tầm hoạt động (km) *
                      </label>
                      <input
                        type="number"
                        required
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                        placeholder="500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tốc độ tối đa (km/h) *
                      </label>
                      <input
                        type="number"
                        required
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                        placeholder="200"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Thời gian sạc *
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                        placeholder="8 giờ"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tính năng (mỗi dòng một tính năng)
                    </label>
                    <textarea
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                      rows={4}
                      placeholder="Autopilot&#10;Màn hình cảm ứng 17&quot;&#10;Sạc nhanh&#10;Camera 360"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mô tả
                    </label>
                    <textarea
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                      rows={3}
                      placeholder="Mô tả chi tiết về mẫu xe..."
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
                      Thêm mẫu xe
                    </button>
                  </div>
                </form>
              )}

              {activeTab === 'pricing' && (
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tên khuyến mãi *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                      placeholder="VD: Khuyến mãi cuối năm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mô tả
                    </label>
                    <textarea
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                      rows={3}
                      placeholder="Mô tả chi tiết về chương trình khuyến mãi..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Số tiền giảm (VND) *
                      </label>
                      <input
                        type="number"
                        required
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                        placeholder="50000000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Loại khuyến mãi
                      </label>
                      <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500">
                        <option value="amount">Giảm số tiền</option>
                        <option value="percent">Giảm phần trăm</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ngày bắt đầu *
                      </label>
                      <input
                        type="date"
                        required
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ngày kết thúc *
                      </label>
                      <input
                        type="date"
                        required
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                      />
                    </div>
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
                      Tạo khuyến mãi
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};