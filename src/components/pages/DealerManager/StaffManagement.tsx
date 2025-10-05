import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit2, Trash2, UserCheck, UserX, Filter, X } from 'lucide-react';
import { Sidebar } from '../../common/Sidebar';
import { Header } from '../../common/Header';
import { authService, CreateUserRequest, UserFilters } from '../../../services/authService';

interface Staff {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  startDate: string;
  status: 'active' | 'inactive' | 'pending';
  avatar?: string;
  salary: number;
  address: string;
}

export const StaffManagement: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('staff-management');
  const [staffList, setStaffList] = useState<Staff[]>([]);

  const [filteredStaff, setFilteredStaff] = useState<Staff[]>(staffList);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter] = useState<'all' | 'active' | 'inactive' | 'pending'>('all');
  const [departmentFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStaff, setNewStaff] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    roleId: '',
    dealershipId: '',
    manufacturerId: '',
    avatar: null as File | null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [pageSize] = useState(10);

  // Hàm trả về các vai trò có thể tạo dựa trên quyền user hiện tại
  const getAvailableRoles = () => {
    // Tất cả role chỉ có thể tạo Dealer Staff
    // Sử dụng ObjectId thực tế cho Dealer Staff role
    return [
      { value: '68d0cd25c26ebc625acf7a48', label: 'Dealer Staff' } // ObjectId cho Dealer Staff role
    ];
  };

  // Load users from API
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const filters: UserFilters = {
        page: currentPage,
        limit: pageSize,
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        role: departmentFilter !== 'all' ? departmentFilter : undefined
      };

      const response = await authService.getAllUsers(filters);
      
      if (response.success && response.data) {
        // Transform API data to match our Staff interface
        const transformedStaff = response.data.users.map((user: any) => ({
          id: user.id || user._id,
          fullName: user.full_name || user.fullName || user.name,
          email: user.email,
          phone: user.phone || '',
          position: user.role_name || user.role || '',
          department: user.department || '',
          startDate: user.created_at ? new Date(user.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          status: user.status || 'active',
          avatar: user.avatar,
          salary: user.salary || 0,
          address: user.address || ''
        }));
        
        setStaffList(transformedStaff);
        setTotalPages(response.data.totalPages || 1);
        setTotalUsers(response.data.total || 0);
      } else {
        setError(response.message || 'Không thể tải danh sách nhân viên');
      }
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi tải danh sách nhân viên');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, statusFilter, departmentFilter]);

  // Load users on component mount and when filters change
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Update filtered staff when staffList changes
  useEffect(() => {
    setFilteredStaff(staffList);
  }, [staffList]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Active', color: 'bg-green-100 text-green-800' },
      inactive: { label: 'Block', color: 'bg-red-100 text-red-800' },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const handleAddStaff = () => {
    setNewStaff({
      fullName: '',
      email: '',
      phone: '',
      address: '',
      password: '',
      roleId: '',
      dealershipId: '',
      manufacturerId: '',
      avatar: null
    });
    setError(null);
    setSuccess(null);
    setShowAddModal(true);
  };

  const handleSaveNewStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Chuẩn bị dữ liệu cho API
      const createData: CreateUserRequest = {
        full_name: newStaff.fullName,
        email: newStaff.email,
        phone: newStaff.phone,
        address: newStaff.address || undefined,
        password: newStaff.password,
        role_id: newStaff.roleId,
        dealership_id: newStaff.dealershipId || undefined,
        manufacturer_id: newStaff.manufacturerId || undefined,
        avatar: newStaff.avatar || undefined
      };

      // Gọi API tạo user
      const result = await authService.createUser(createData);

      if (result.success) {
        setSuccess('Tạo nhân viên thành công!');
        
        // Reload users list
        await loadUsers();
        
        // Reset form
        setNewStaff({
          fullName: '',
          email: '',
          phone: '',
          address: '',
          password: '',
          roleId: '',
          dealershipId: '',
          manufacturerId: '',
          avatar: null
        });
        
        // Đóng modal sau 2 giây
        setTimeout(() => {
          setShowAddModal(false);
          setSuccess(null);
        }, 2000);
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi tạo nhân viên');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'file') {
      const file = (e.target as HTMLInputElement).files?.[0] || null;
      setNewStaff(prev => ({
        ...prev,
        [name]: file
      }));
    } else {
      setNewStaff(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa nhân viên này?')) {
      setLoading(true);
      try {
        const result = await authService.deleteUser(staffId);
        
        if (result.success) {
          setSuccess('Xóa nhân viên thành công!');
          await loadUsers(); // Reload the list
        } else {
          setError(result.message);
        }
      } catch (err: any) {
        setError(err.message || 'Có lỗi xảy ra khi xóa nhân viên');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleToggleStatus = (staffId: string) => {
    setStaffList(staffList.map(staff => 
      staff.id === staffId 
        ? { ...staff, status: staff.status === 'active' ? 'inactive' : 'active' }
        : staff
    ));
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpen={() => setSidebarOpen(true)}
      />
      
      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'
      }`}>
        {/* Header */}
        <div className="fixed top-0 right-0 left-0 z-30 lg:left-16">
          <div className={`transition-all duration-300 ${
            sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'
          }`}>
            <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          </div>
        </div>
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto mt-[73px]">
          <div className="p-6">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Quản lý nhân viên</h1>
              <p className="text-gray-600">Quản lý thông tin nhân viên trong đại lý</p>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm nhân viên..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>


                {/* Add Staff Button */}
                <button
                  onClick={handleAddStaff}
                  className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
                >
                  <Plus className="h-5 w-5" />
                  <span>Thêm nhân viên</span>
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Tổng nhân viên</p>
                    <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <UserCheck className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Không block</p>
                    <p className="text-2xl font-bold text-green-600">
                      {staffList.filter(s => s.status === 'active').length}
                    </p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <UserCheck className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Block</p>
                    <p className="text-2xl font-bold text-red-600">
                      {staffList.filter(s => s.status === 'inactive').length}
                    </p>
                  </div>
                  <div className="bg-red-100 p-3 rounded-full">
                    <UserX className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Chờ duyệt</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {staffList.filter(s => s.status === 'pending').length}
                    </p>
                  </div>
                  <div className="bg-yellow-100 p-3 rounded-full">
                    <Filter className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Staff Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nhân viên
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredStaff.map((staff) => (
                      <tr key={staff.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {staff.fullName.charAt(0)}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{staff.fullName}</div>
                              <div className="text-sm text-gray-500">{staff.email}</div>
                              <div className="text-sm text-gray-500">{staff.phone}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(staff.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {/* TODO: Implement edit functionality */}}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(staff.id)}
                              className={staff.status === 'active' ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}
                            >
                              {staff.status === 'active' ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                            </button>
                            <button
                              onClick={() => handleDeleteStaff(staff.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredStaff.length === 0 && !loading && (
                <div className="text-center py-12">
                  <p className="text-gray-500">Không tìm thấy nhân viên nào.</p>
                </div>
              )}
              
              {loading && (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Đang tải...</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-700">
                  Hiển thị {((currentPage - 1) * pageSize) + 1} đến {Math.min(currentPage * pageSize, totalUsers)} trong tổng số {totalUsers} nhân viên
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Trước
                  </button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 border rounded text-sm ${
                          currentPage === page
                            ? 'bg-gray-900 text-white border-gray-900'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Thêm nhân viên mới</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
                disabled={loading}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Hiển thị thông báo lỗi */}
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            {/* Hiển thị thông báo thành công */}
            {success && (
              <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                {success}
              </div>
            )}

            <form onSubmit={handleSaveNewStaff} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Họ và tên *
                </label>
                <input
                  type="text"
                  name="fullName"
                  required
                  value={newStaff.fullName}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  placeholder="Nhập họ và tên"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={newStaff.email}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  placeholder="Nhập email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số điện thoại *
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={newStaff.phone}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  placeholder="Nhập số điện thoại"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Địa chỉ
                </label>
                <input
                  type="text"
                  name="address"
                  value={newStaff.address}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  placeholder="Nhập địa chỉ (tùy chọn)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mật khẩu *
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  value={newStaff.password}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  placeholder="Nhập mật khẩu"
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vai trò *
                </label>
                <select
                  name="roleId"
                  required
                  value={newStaff.roleId}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                >
                  <option value="">Chọn vai trò</option>
                  {getAvailableRoles().map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID Đại lý
                </label>
                <input
                  type="text"
                  name="dealershipId"
                  value={newStaff.dealershipId}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  placeholder="Nhập ID đại lý (tùy chọn)"
                />
                <p className="text-xs text-gray-500 mt-1">Chỉ Admin mới có thể sử dụng trường này</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID Nhà sản xuất
                </label>
                <input
                  type="text"
                  name="manufacturerId"
                  value={newStaff.manufacturerId}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  placeholder="Nhập ID nhà sản xuất (tùy chọn)"
                />
                <p className="text-xs text-gray-500 mt-1">Chỉ Admin mới có thể sử dụng trường này</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Avatar
                </label>
                <input
                  type="file"
                  name="avatar"
                  accept="image/*"
                  onChange={handleInputChange}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                />
                <p className="text-xs text-gray-500 mt-1">Chọn ảnh đại diện (tùy chọn)</p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Đang xử lý...
                    </>
                  ) : (
                    'Thêm nhân viên'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

