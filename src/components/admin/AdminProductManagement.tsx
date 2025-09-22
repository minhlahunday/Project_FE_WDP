import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Bike, Package, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { mockVehicles, mockMotorbikes } from '../../data/mockData';
import { AdminLayout } from './AdminLayout';

export const AdminProductManagement: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'cars' | 'motorbikes'>('cars');

  if (!user || (user.role !== 'admin' && user.role !== 'evm_staff')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Không có quyền truy cập</h2>
          <p className="text-gray-600">Bạn cần quyền admin để truy cập trang này.</p>
        </div>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  return (
    <AdminLayout activeSection="product-management">
        {/* Content */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Quản lý sản phẩm</h1>
              <p className="text-gray-600 mt-1">Quản lý toàn bộ danh mục sản phẩm VinFast</p>
            </div>
            <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2 transition-colors">
              <Plus className="h-5 w-5" />
              <span>Thêm sản phẩm</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mt-6">
            <button
              onClick={() => setActiveTab('cars')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'cars'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Car className="h-4 w-4" />
              <span>Ô tô điện</span>
              <span className="bg-white/20 text-xs px-2 py-1 rounded-full">{mockVehicles.length}</span>
            </button>
            <button
              onClick={() => setActiveTab('motorbikes')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'motorbikes'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Bike className="h-4 w-4" />
              <span>Xe máy điện</span>
              <span className="bg-white/20 text-xs px-2 py-1 rounded-full">{mockMotorbikes.length}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Cars Tab */}
        {activeTab === 'cars' && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                <Car className="h-5 w-5 text-green-600" />
                <span>Danh sách ô tô điện</span>
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-6 font-semibold text-gray-900">Hình ảnh</th>
                    <th className="text-left p-6 font-semibold text-gray-900">Mẫu xe</th>
                    <th className="text-left p-6 font-semibold text-gray-900">Phiên bản</th>
                    <th className="text-left p-6 font-semibold text-gray-900">Giá bán</th>
                    <th className="text-left p-6 font-semibold text-gray-900">Tồn kho</th>
                    <th className="text-left p-6 font-semibold text-gray-900">Trạng thái</th>
                    <th className="text-left p-6 font-semibold text-gray-900">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {mockVehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="hover:bg-gray-50">
                      <td className="p-6">
                        <img
                          src={vehicle.images[0]}
                          alt={vehicle.model}
                          className="w-16 h-12 object-contain rounded-lg bg-gray-50"
                        />
                      </td>
                      <td className="p-6">
                        <div>
                          <div className="font-medium text-gray-900">{vehicle.model}</div>
                          <div className="text-sm text-gray-500">{vehicle.color}</div>
                        </div>
                      </td>
                      <td className="p-6 text-gray-700">{vehicle.version}</td>
                      <td className="p-6 font-medium text-green-600">{formatPrice(vehicle.price)}</td>
                      <td className="p-6 font-medium">{vehicle.stock} xe</td>
                      <td className="p-6">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          vehicle.stock > 20 ? 'bg-green-100 text-green-800' :
                          vehicle.stock > 5 ? 'bg-yellow-100 text-yellow-800' :
                          vehicle.stock > 0 ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {vehicle.stock > 20 ? 'Còn nhiều' :
                           vehicle.stock > 5 ? 'Còn ít' :
                           vehicle.stock > 0 ? 'Sắp hết' : 'Hết hàng'}
                        </span>
                      </td>
                      <td className="p-6">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-800 p-1">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="text-green-600 hover:text-green-800 p-1">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-800 p-1">
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

        {/* Motorbikes Tab */}
        {activeTab === 'motorbikes' && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                <Bike className="h-5 w-5 text-green-600" />
                <span>Danh sách xe máy điện</span>
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-6 font-semibold text-gray-900">Hình ảnh</th>
                    <th className="text-left p-6 font-semibold text-gray-900">Mẫu xe</th>
                    <th className="text-left p-6 font-semibold text-gray-900">Phiên bản</th>
                    <th className="text-left p-6 font-semibold text-gray-900">Giá bán</th>
                    <th className="text-left p-6 font-semibold text-gray-900">Tồn kho</th>
                    <th className="text-left p-6 font-semibold text-gray-900">Trạng thái</th>
                    <th className="text-left p-6 font-semibold text-gray-900">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {mockMotorbikes.map((motorbike) => (
                    <tr key={motorbike.id} className="hover:bg-gray-50">
                      <td className="p-6">
                        <img
                          src={motorbike.images[0]}
                          alt={motorbike.model}
                          className="w-16 h-12 object-contain rounded-lg bg-gray-50"
                        />
                      </td>
                      <td className="p-6">
                        <div>
                          <div className="font-medium text-gray-900">{motorbike.model}</div>
                          <div className="text-sm text-gray-500">{motorbike.color}</div>
                        </div>
                      </td>
                      <td className="p-6 text-gray-700">{motorbike.version}</td>
                      <td className="p-6 font-medium text-green-600">{formatPrice(motorbike.price)}</td>
                      <td className="p-6 font-medium">{motorbike.stock} xe</td>
                      <td className="p-6">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          motorbike.stock > 20 ? 'bg-green-100 text-green-800' :
                          motorbike.stock > 5 ? 'bg-yellow-100 text-yellow-800' :
                          motorbike.stock > 0 ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {motorbike.stock > 20 ? 'Còn nhiều' :
                           motorbike.stock > 5 ? 'Còn ít' :
                           motorbike.stock > 0 ? 'Sắp hết' : 'Hết hàng'}
                        </span>
                      </td>
                      <td className="p-6">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-800 p-1">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="text-green-600 hover:text-green-800 p-1">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-800 p-1">
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
      </div>
    </AdminLayout>
  );
};