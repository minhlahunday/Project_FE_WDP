import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, MapPin, Phone, Mail, Plus, Edit, Trash2, Eye, Star, TrendingUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { AdminLayout } from './AdminLayout';

interface Dealer {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  manager: string;
  status: 'active' | 'inactive' | 'pending';
  sales: number;
  rating: number;
  vehicles: number;
}

const mockDealers: Dealer[] = [
  {
    id: '1',
    name: 'VinFast Hà Nội',
    code: 'VF-HN-001',
    address: '123 Đường Láng, Đống Đa',
    city: 'Hà Nội',
    phone: '024 3333 4444',
    email: 'hanoi@vinfast.vn',
    manager: 'Nguyễn Văn A',
    status: 'active',
    sales: 45,
    rating: 4.8,
    vehicles: 120
  },
  {
    id: '2',
    name: 'VinFast TP.HCM',
    code: 'VF-HCM-001',
    address: '456 Nguyễn Huệ, Quận 1',
    city: 'TP.HCM',
    phone: '028 3333 5555',
    email: 'hcm@vinfast.vn',
    manager: 'Trần Thị B',
    status: 'active',
    sales: 67,
    rating: 4.9,
    vehicles: 180
  },
  {
    id: '3',
    name: 'VinFast Đà Nẵng',
    code: 'VF-DN-001',
    address: '789 Trần Phú, Hải Châu',
    city: 'Đà Nẵng',
    phone: '0236 3333 6666',
    email: 'danang@vinfast.vn',
    manager: 'Lê Văn C',
    status: 'active',
    sales: 23,
    rating: 4.7,
    vehicles: 85
  },
  {
    id: '4',
    name: 'VinFast Cần Thơ',
    code: 'VF-CT-001',
    address: '321 Mậu Thân, Ninh Kiều',
    city: 'Cần Thơ',
    phone: '0292 3333 7777',
    email: 'cantho@vinfast.vn',
    manager: 'Phạm Thị D',
    status: 'pending',
    sales: 12,
    rating: 4.5,
    vehicles: 45
  }
];

export const AdminDealerManagement: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'pending'>('all');

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

  const filteredDealers = mockDealers.filter(dealer => {
    const matchesSearch = dealer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dealer.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dealer.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || dealer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Hoạt động';
      case 'inactive':
        return 'Ngừng hoạt động';
      case 'pending':
        return 'Chờ duyệt';
      default:
        return status;
    }
  };

  return (
    <AdminLayout activeSection="dealer-management">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Quản lý đại lý</h1>
              <p className="text-gray-600 mt-1">Quản lý hệ thống đại lý VinFast toàn quốc</p>
            </div>
            <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2 transition-colors">
              <Plus className="h-5 w-5" />
              <span>Thêm đại lý</span>
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-blue-50 p-6 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-blue-600">Tổng đại lý</h3>
                  <p className="text-2xl font-bold text-blue-900">{mockDealers.length}</p>
                </div>
                <Building2 className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-green-50 p-6 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-green-600">Đang hoạt động</h3>
                  <p className="text-2xl font-bold text-green-900">
                    {mockDealers.filter(d => d.status === 'active').length}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </div>
            <div className="bg-yellow-50 p-6 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-yellow-600">Chờ duyệt</h3>
                  <p className="text-2xl font-bold text-yellow-900">
                    {mockDealers.filter(d => d.status === 'pending').length}
                  </p>
                </div>
                <Users className="h-8 w-8 text-yellow-500" />
              </div>
            </div>
            <div className="bg-purple-50 p-6 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-purple-600">Tổng doanh số</h3>
                  <p className="text-2xl font-bold text-purple-900">
                    {mockDealers.reduce((sum, dealer) => sum + dealer.sales, 0)}
                  </p>
                </div>
                <Star className="h-8 w-8 text-purple-500" />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div className="flex flex-wrap gap-4">
              <input
                type="text"
                placeholder="Tìm kiếm đại lý..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Hoạt động</option>
                <option value="pending">Chờ duyệt</option>
                <option value="inactive">Ngừng hoạt động</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Dealers Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-6 font-semibold text-gray-900">Thông tin đại lý</th>
                  <th className="text-left p-6 font-semibold text-gray-900">Liên hệ</th>
                  <th className="text-left p-6 font-semibold text-gray-900">Quản lý</th>
                  <th className="text-left p-6 font-semibold text-gray-900">Doanh số</th>
                  <th className="text-left p-6 font-semibold text-gray-900">Đánh giá</th>
                  <th className="text-left p-6 font-semibold text-gray-900">Trạng thái</th>
                  <th className="text-left p-6 font-semibold text-gray-900">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredDealers.map((dealer) => (
                  <tr key={dealer.id} className="hover:bg-gray-50">
                    <td className="p-6">
                      <div>
                        <div className="font-medium text-gray-900">{dealer.name}</div>
                        <div className="text-sm text-gray-500">{dealer.code}</div>
                        <div className="text-sm text-gray-500 flex items-center space-x-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          <span>{dealer.address}, {dealer.city}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="space-y-1">
                        <div className="text-sm text-gray-900 flex items-center space-x-1">
                          <Phone className="h-3 w-3" />
                          <span>{dealer.phone}</span>
                        </div>
                        <div className="text-sm text-gray-500 flex items-center space-x-1">
                          <Mail className="h-3 w-3" />
                          <span>{dealer.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{dealer.manager}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <div>
                        <div className="font-medium text-gray-900">{dealer.sales} xe</div>
                        <div className="text-sm text-gray-500">{dealer.vehicles} xe trong kho</div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="font-medium text-gray-900">{dealer.rating}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(dealer.status)}`}>
                        {getStatusText(dealer.status)}
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

        {/* Empty State */}
        {filteredDealers.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy đại lý nào</h3>
            <p className="text-gray-600">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};