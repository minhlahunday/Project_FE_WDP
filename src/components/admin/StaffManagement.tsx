import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Eye, UserCheck, UserX, Filter, X } from 'lucide-react';
import { Sidebar } from '../common/Sidebar';
import { Header } from '../common/Header';

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
  const [staffList, setStaffList] = useState<Staff[]>([
    {
      id: '1',
      fullName: 'Nguyễn Văn An',
      email: 'an.nguyen@vinfast.vn',
      phone: '0901234567',
      position: 'Nhân viên bán hàng',
      department: 'Bán hàng',
      startDate: '2023-01-15',
      status: 'active',
      salary: 15000000,
      address: 'Hà Nội'
    },
    {
      id: '2',
      fullName: 'Trần Thị Bình',
      email: 'binh.tran@vinfast.vn',
      phone: '0907654321',
      position: 'Chuyên viên tư vấn',
      department: 'Tư vấn',
      startDate: '2023-03-20',
      status: 'active',
      salary: 18000000,
      address: 'TP.HCM'
    },
    {
      id: '3',
      fullName: 'Lê Minh Cường',
      email: 'cuong.le@vinfast.vn',
      phone: '0912345678',
      position: 'Kỹ thuật viên',
      department: 'Kỹ thuật',
      startDate: '2022-11-10',
      status: 'inactive',
      salary: 20000000,
      address: 'Đà Nẵng'
    }
  ]);

  const [filteredStaff, setFilteredStaff] = useState<Staff[]>(staffList);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'pending'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [newStaff, setNewStaff] = useState({
    fullName: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    address: '',
    salary: 0
  });

  useEffect(() => {
    let filtered = staffList;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(staff =>
        staff.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.phone.includes(searchTerm)
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(staff => staff.status === statusFilter);
    }

    // Filter by department
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(staff => staff.department === departmentFilter);
    }

    setFilteredStaff(filtered);
  }, [staffList, searchTerm, statusFilter, departmentFilter]);

  const formatSalary = (salary: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(salary);
  };

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
      position: '',
      department: '',
      address: '',
      salary: 0
    });
    setShowAddModal(true);
  };

  const handleSaveNewStaff = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = (staffList.length + 1).toString();
    const staffToAdd: Staff = {
      id: newId,
      ...newStaff,
      startDate: new Date().toISOString().split('T')[0],
      status: 'active'
    };
    setStaffList([...staffList, staffToAdd]);
    setShowAddModal(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewStaff(prev => ({
      ...prev,
      [name]: name === 'salary' ? Number(value) : value
    }));
  };

  const handleEditStaff = (staff: Staff) => {
    setSelectedStaff(staff);
    setShowEditModal(true);
  };

  const handleDeleteStaff = (staffId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa nhân viên này?')) {
      setStaffList(staffList.filter(staff => staff.id !== staffId));
    }
  };

  const handleToggleStatus = (staffId: string) => {
    setStaffList(staffList.map(staff => 
      staff.id === staffId 
        ? { ...staff, status: staff.status === 'active' ? 'inactive' : 'active' }
        : staff
    ));
  };

  const departments = ['all', 'Bán hàng', 'Tư vấn', 'Kỹ thuật', 'Hành chính'];

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
                    <p className="text-2xl font-bold text-gray-900">{staffList.length}</p>
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
                              onClick={() => handleEditStaff(staff)}
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

              {filteredStaff.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">Không tìm thấy nhân viên nào.</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Thêm nhân viên mới</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nhập số điện thoại"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chức vụ *
                </label>
                <select
                  name="position"
                  required
                  value={newStaff.position}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Chọn chức vụ</option>
                  <option value="Nhân viên bán hàng">Nhân viên bán hàng</option>
                  <option value="Chuyên viên tư vấn">Chuyên viên tư vấn</option>
                  <option value="Kỹ thuật viên">Kỹ thuật viên</option>
                  <option value="Nhân viên hành chính">Nhân viên hành chính</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phòng ban *
                </label>
                <select
                  name="department"
                  required
                  value={newStaff.department}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Chọn phòng ban</option>
                  <option value="Bán hàng">Bán hàng</option>
                  <option value="Tư vấn">Tư vấn</option>
                  <option value="Kỹ thuật">Kỹ thuật</option>
                  <option value="Hành chính">Hành chính</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lương (VND) *
                </label>
                <input
                  type="number"
                  name="salary"
                  required
                  value={newStaff.salary}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nhập mức lương"
                  min="0"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nhập địa chỉ"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800"
                >
                  Thêm nhân viên
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


