import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Eye, Trash2, Package, DollarSign, Palette, Settings, Bike } from 'lucide-react';
import { mockVehicles, mockPromotions, mockMotorbikes } from '../../data/mockData';
import { AdminLayout } from './AdminLayout';

export const ProductManagement: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('vehicles');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const tabs = [
    { id: 'vehicles', label: 'Ô tô điện', icon: Package },
    { id: 'motorbikes', label: 'Xe máy điện', icon: Bike },
    { id: 'pricing', label: 'Giá & Khuyến mãi', icon: DollarSign },
    { id: 'variants', label: 'Phiên bản & Màu sắc', icon: Palette },
    { id: 'features', label: 'Tính năng', icon: Settings },
  ];

  return (
    <AdminLayout activeSection="pricing">
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

      {/* Motorbikes Tab */}
      {activeTab === 'motorbikes' && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-4 font-medium text-gray-700">Hình ảnh</th>
                  <th className="text-left p-4 font-medium text-gray-700">Mẫu xe máy</th>
                  <th className="text-left p-4 font-medium text-gray-700">Phiên bản</th>
                  <th className="text-left p-4 font-medium text-gray-700">Giá bán lẻ</th>
                  <th className="text-left p-4 font-medium text-gray-700">Giá sỉ</th>
                  <th className="text-left p-4 font-medium text-gray-700">Tầm hoạt động</th>
                  <th className="text-left p-4 font-medium text-gray-700">Tồn kho</th>
                  <th className="text-left p-4 font-medium text-gray-700">Trạng thái</th>
                  <th className="text-left p-4 font-medium text-gray-700">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {mockMotorbikes.map((motorbike) => (
                  <tr key={motorbike.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <img
                        src={motorbike.images[0]}
                        alt={motorbike.model}
                        className="w-16 h-12 object-cover rounded"
                      />
                    </td>
                    <td className="p-4 font-medium">{motorbike.model}</td>
                    <td className="p-4">{motorbike.version}</td>
                    <td className="p-4 text-green-600 font-medium">{formatPrice(motorbike.price)}</td>
                    <td className="p-4 text-blue-600 font-medium">{formatPrice(motorbike.wholesalePrice || 0)}</td>
                    <td className="p-4">{motorbike.range} km</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        motorbike.stock > 50 ? 'bg-green-100 text-green-800' :
                        motorbike.stock > 20 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {motorbike.stock} xe
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
                  {/* Ô tô điện */}
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
                  {/* Xe máy điện */}
                  {mockMotorbikes.map((motorbike) => {
                    const profit = motorbike.price - (motorbike.wholesalePrice || 0);
                    const margin = (profit / motorbike.price * 100).toFixed(1);
                    
                    return (
                      <tr key={motorbike.id} className="border-b hover:bg-gray-50">
                        <td className="p-4 font-medium">{motorbike.model}</td>
                        <td className="p-4 text-green-600 font-medium">{formatPrice(motorbike.price)}</td>
                        <td className="p-4 text-blue-600 font-medium">{formatPrice(motorbike.wholesalePrice || 0)}</td>
                        <td className="p-4">
                          <span className="text-purple-600 font-medium">
                            {formatPrice(profit)} ({margin}%)
                          </span>
                        </td>
                        <td className="p-4">3%</td>
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

      {/* Variants & Colors Tab */}
      {activeTab === 'variants' && (
        <div className="space-y-6">
          {/* Color Management */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Quản lý màu sắc</h3>
              <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm">
                Thêm màu mới
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* VinFast Car Colors */}
              {[
                { name: 'Trắng Ngọc Trai', code: '#F8F8FF', available: true },
                { name: 'Đen Obsidian', code: '#0B1426', available: true },
                { name: 'Đỏ Cherry', code: '#8B0000', available: true },
                { name: 'Xanh Dương Đại Dương', code: '#1E3A8A', available: true },
                { name: 'Xám Titanium', code: '#6B7280', available: true },
                { name: 'Bạc Metallic', code: '#C0C0C0', available: false },
              ].map((color, index) => (
                <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3 mb-3">
                    <div 
                      className="w-8 h-8 rounded-full border-2 border-gray-300"
                      style={{ backgroundColor: color.code }}
                    ></div>
                    <div>
                      <h4 className="font-medium text-gray-900">{color.name}</h4>
                      <p className="text-sm text-gray-500">{color.code}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      color.available 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {color.available ? 'Có sẵn' : 'Hết hàng'}
                    </span>
                    <div className="flex space-x-1">
                      <button className="text-blue-600 hover:text-blue-800 text-sm">
                        Sửa
                      </button>
                      <button className="text-red-600 hover:text-red-800 text-sm">
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Version Management */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Quản lý phiên bản</h3>
              <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm">
                Thêm phiên bản
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-4 font-medium text-gray-700">Mẫu xe</th>
                    <th className="text-left p-4 font-medium text-gray-700">Phiên bản</th>
                    <th className="text-left p-4 font-medium text-gray-700">Giá cơ bản</th>
                    <th className="text-left p-4 font-medium text-gray-700">Màu có sẵn</th>
                    <th className="text-left p-4 font-medium text-gray-700">Trạng thái</th>
                    <th className="text-left p-4 font-medium text-gray-700">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {/* VF 8 Variants */}
                  <tr className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium">VinFast VF 8</td>
                    <td className="p-4">Eco</td>
                    <td className="p-4 text-green-600 font-medium">{formatPrice(1200000000)}</td>
                    <td className="p-4">
                      <div className="flex space-x-1">
                        {['#F8F8FF', '#0B1426', '#8B0000'].map((color, i) => (
                          <div key={i} className="w-4 h-4 rounded-full border" style={{backgroundColor: color}}></div>
                        ))}
                        <span className="text-sm text-gray-500">+2</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Có sẵn</span>
                    </td>
                    <td className="p-4">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-800"><Edit className="h-4 w-4" /></button>
                        <button className="text-red-600 hover:text-red-800"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium">VinFast VF 8</td>
                    <td className="p-4">Plus</td>
                    <td className="p-4 text-green-600 font-medium">{formatPrice(1400000000)}</td>
                    <td className="p-4">
                      <div className="flex space-x-1">
                        {['#F8F8FF', '#0B1426', '#8B0000', '#1E3A8A'].map((color, i) => (
                          <div key={i} className="w-4 h-4 rounded-full border" style={{backgroundColor: color}}></div>
                        ))}
                        <span className="text-sm text-gray-500">+1</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Có sẵn</span>
                    </td>
                    <td className="p-4">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-800"><Edit className="h-4 w-4" /></button>
                        <button className="text-red-600 hover:text-red-800"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                  {/* VF 9 Variants */}
                  <tr className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium">VinFast VF 9</td>
                    <td className="p-4">Eco</td>
                    <td className="p-4 text-green-600 font-medium">{formatPrice(1500000000)}</td>
                    <td className="p-4">
                      <div className="flex space-x-1">
                        {['#F8F8FF', '#0B1426', '#6B7280'].map((color, i) => (
                          <div key={i} className="w-4 h-4 rounded-full border" style={{backgroundColor: color}}></div>
                        ))}
                        <span className="text-sm text-gray-500">+2</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Có sẵn</span>
                    </td>
                    <td className="p-4">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-800"><Edit className="h-4 w-4" /></button>
                        <button className="text-red-600 hover:text-red-800"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium">VinFast VF 9</td>
                    <td className="p-4">Plus</td>
                    <td className="p-4 text-green-600 font-medium">{formatPrice(1800000000)}</td>
                    <td className="p-4">
                      <div className="flex space-x-1">
                        {['#F8F8FF', '#0B1426', '#8B0000', '#1E3A8A', '#6B7280'].map((color, i) => (
                          <div key={i} className="w-4 h-4 rounded-full border" style={{backgroundColor: color}}></div>
                        ))}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Có sẵn</span>
                    </td>
                    <td className="p-4">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-800"><Edit className="h-4 w-4" /></button>
                        <button className="text-red-600 hover:text-red-800"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                  {/* Motorbike Variants */}
                  <tr className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium">VinFast Theon</td>
                    <td className="p-4">Tiêu chuẩn</td>
                    <td className="p-4 text-green-600 font-medium">{formatPrice(63000000)}</td>
                    <td className="p-4">
                      <div className="flex space-x-1">
                        {['#0B1426', '#8B0000', '#1E3A8A'].map((color, i) => (
                          <div key={i} className="w-4 h-4 rounded-full border" style={{backgroundColor: color}}></div>
                        ))}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Có sẵn</span>
                    </td>
                    <td className="p-4">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-800"><Edit className="h-4 w-4" /></button>
                        <button className="text-red-600 hover:text-red-800"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium">VinFast Klara S</td>
                    <td className="p-4">Premium</td>
                    <td className="p-4 text-green-600 font-medium">{formatPrice(41000000)}</td>
                    <td className="p-4">
                      <div className="flex space-x-1">
                        {['#F8F8FF', '#0B1426', '#8B0000'].map((color, i) => (
                          <div key={i} className="w-4 h-4 rounded-full border" style={{backgroundColor: color}}></div>
                        ))}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Có sẵn</span>
                    </td>
                    <td className="p-4">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-800"><Edit className="h-4 w-4" /></button>
                        <button className="text-red-600 hover:text-red-800"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Features Tab */}
      {activeTab === 'features' && (
        <div className="space-y-6">
          {/* Standard Features */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Tính năng tiêu chuẩn</h3>
              <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm">
                Thêm tính năng
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { category: 'An toàn', features: ['Hệ thống phanh ABS', 'Túi khí đa điểm', 'Hỗ trợ lực phanh khẩn cấp', 'Cảnh báo va chạm phía trước', 'Camera lùi'] },
                { category: 'Tiện nghi', features: ['Điều hòa tự động', 'Màn hình cảm ứng 12 inch', 'Sạc không dây', 'Ghế da cao cấp', 'Hệ thống âm thanh premium'] },
                { category: 'Công nghệ', features: ['VinFast Connect', 'Cập nhật OTA', 'Hỗ trợ giọng nói AI', 'Ứng dụng di động', 'GPS tích hợp'] },
                { category: 'Động cơ & Pin', features: ['Động cơ điện hiệu suất cao', 'Pin LFP bền bỉ', 'Sạc nhanh DC', 'Quản lý nhiệt thông minh', 'Tái tạo năng lượng khi phanh'] },
              ].map((group, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <h4 className="font-bold text-lg text-gray-900 mb-3 flex items-center">
                    <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
                    {group.category}
                  </h4>
                  <ul className="space-y-2">
                    {group.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex justify-between items-center">
                        <span className="text-gray-700 text-sm">{feature}</span>
                        <div className="flex space-x-1">
                          <button className="text-blue-600 hover:text-blue-800 text-xs">
                            Sửa
                          </button>
                          <button className="text-red-600 hover:text-red-800 text-xs">
                            Xóa
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Optional Features */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Tùy chọn nâng cấp</h3>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">
                Thêm tùy chọn
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-4 font-medium text-gray-700">Tên tùy chọn</th>
                    <th className="text-left p-4 font-medium text-gray-700">Mô tả</th>
                    <th className="text-left p-4 font-medium text-gray-700">Giá nâng cấp</th>
                    <th className="text-left p-4 font-medium text-gray-700">Áp dụng cho</th>
                    <th className="text-left p-4 font-medium text-gray-700">Trạng thái</th>
                    <th className="text-left p-4 font-medium text-gray-700">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium">Autopilot Level 2</td>
                    <td className="p-4 text-gray-600">Hỗ trợ lái xe tự động trên cao tốc</td>
                    <td className="p-4 text-green-600 font-medium">{formatPrice(100000000)}</td>
                    <td className="p-4">VF 8, VF 9</td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Có sẵn</span>
                    </td>
                    <td className="p-4">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-800"><Edit className="h-4 w-4" /></button>
                        <button className="text-red-600 hover:text-red-800"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium">Màn hình HUD</td>
                    <td className="p-4 text-gray-600">Hiển thị thông tin trên kính lái</td>
                    <td className="p-4 text-green-600 font-medium">{formatPrice(25000000)}</td>
                    <td className="p-4">VF 8 Plus, VF 9 Plus</td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Có sẵn</span>
                    </td>
                    <td className="p-4">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-800"><Edit className="h-4 w-4" /></button>
                        <button className="text-red-600 hover:text-red-800"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium">Hệ thống âm thanh Harman Kardon</td>
                    <td className="p-4 text-gray-600">14 loa cao cấp với âm thanh vòm</td>
                    <td className="p-4 text-green-600 font-medium">{formatPrice(35000000)}</td>
                    <td className="p-4">Tất cả các mẫu</td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Có sẵn</span>
                    </td>
                    <td className="p-4">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-800"><Edit className="h-4 w-4" /></button>
                        <button className="text-red-600 hover:text-red-800"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium">Cửa sổ trời Panorama</td>
                    <td className="p-4 text-gray-600">Cửa sổ trời toàn cảnh có thể mở</td>
                    <td className="p-4 text-green-600 font-medium">{formatPrice(40000000)}</td>
                    <td className="p-4">VF 8, VF 9</td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Sắp có</span>
                    </td>
                    <td className="p-4">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-800"><Edit className="h-4 w-4" /></button>
                        <button className="text-red-600 hover:text-red-800"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium">Pin dự phòng Theon</td>
                    <td className="p-4 text-gray-600">Pin phụ tăng tầm hoạt động 50%</td>
                    <td className="p-4 text-green-600 font-medium">{formatPrice(15000000)}</td>
                    <td className="p-4">Theon, Klara S</td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Có sẵn</span>
                    </td>
                    <td className="p-4">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-800"><Edit className="h-4 w-4" /></button>
                        <button className="text-red-600 hover:text-red-800"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Feature Comparison */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">So sánh tính năng theo phiên bản</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-4 font-medium text-gray-700">Tính năng</th>
                    <th className="text-center p-4 font-medium text-gray-700">VF 8 Eco</th>
                    <th className="text-center p-4 font-medium text-gray-700">VF 8 Plus</th>
                    <th className="text-center p-4 font-medium text-gray-700">VF 9 Eco</th>
                    <th className="text-center p-4 font-medium text-gray-700">VF 9 Plus</th>
                    <th className="text-center p-4 font-medium text-gray-700">Theon</th>
                    <th className="text-center p-4 font-medium text-gray-700">Klara S</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: 'Màn hình cảm ứng', vf8eco: '10 inch', vf8plus: '12 inch', vf9eco: '12 inch', vf9plus: '15 inch', theon: '7 inch', klaras: '5 inch' },
                    { feature: 'Hệ thống âm thanh', vf8eco: '6 loa', vf8plus: '8 loa', vf9eco: '8 loa', vf9plus: '14 loa HK', theon: '2 loa', klaras: '2 loa' },
                    { feature: 'Sạc không dây', vf8eco: '✓', vf8plus: '✓', vf9eco: '✓', vf9plus: '✓', theon: '✗', klaras: '✗' },
                    { feature: 'Autopilot', vf8eco: 'Tùy chọn', vf8plus: 'Có sẵn', vf9eco: 'Tùy chọn', vf9plus: 'Có sẵn', theon: '✗', klaras: '✗' },
                    { feature: 'Camera 360°', vf8eco: '✗', vf8plus: '✓', vf9eco: '✗', vf9plus: '✓', theon: '✗', klaras: '✗' },
                    { feature: 'Ghế massage', vf8eco: '✗', vf8plus: '✗', vf9eco: 'Tùy chọn', vf9plus: '✓', theon: '✗', klaras: '✗' },
                  ].map((row, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-4 font-medium">{row.feature}</td>
                      <td className="p-4 text-center">{row.vf8eco}</td>
                      <td className="p-4 text-center">{row.vf8plus}</td>
                      <td className="p-4 text-center">{row.vf9eco}</td>
                      <td className="p-4 text-center">{row.vf9plus}</td>
                      <td className="p-4 text-center">{row.theon}</td>
                      <td className="p-4 text-center">{row.klaras}</td>
                    </tr>
                  ))}
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
                  {activeTab === 'motorbikes' && 'Thêm xe máy điện mới'}
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
                        placeholder="VD: Vinfast VF 8"
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
                        placeholder="1200000000"
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
                        placeholder="450"
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

              {activeTab === 'motorbikes' && (
                <form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tên mẫu xe máy *
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                        placeholder="VD: Vinfast Theon"
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
                        placeholder="VD: Cao cấp, Tiêu chuẩn"
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
                        placeholder="69900000"
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
                        placeholder="50000000"
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
                        placeholder="101"
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
                        placeholder="99"
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
                        placeholder="6 giờ"
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
                      placeholder="Động cơ 4200W&#10;Pin LFP 3.5 kWh&#10;Phanh ABS&#10;Khóa thông minh"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mô tả
                    </label>
                    <textarea
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                      rows={3}
                      placeholder="Mô tả chi tiết về mẫu xe máy..."
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
                      Thêm xe máy điện
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
    </AdminLayout>
  );
};