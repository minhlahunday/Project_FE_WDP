import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit2, Trash2, UserCheck, UserX, Filter, X, Eye, Users as UsersIcon, TrendingUp, Clock } from 'lucide-react';
import { Sidebar } from '../../common/Sidebar';
import { Header } from '../../common/Header';
import { authService, CreateUserRequest, UpdateUserRequest, UserFilters } from '../../../services/authService';

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
  // Thêm các field mới từ API
  roleId?: string;
  roleName?: string;
  dealershipId?: string;
  dealershipName?: string;
  manufacturerId?: string;
  createdAt?: string;
  updatedAt?: string;
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [detailStaff, setDetailStaff] = useState<Staff | null>(null);
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

  // Roles state
  const [availableRoles, setAvailableRoles] = useState<{ value: string; label: string }[]>([]);

  // Load roles from API
  const loadRoles = useCallback(async () => {
    try {
      console.log('🚀 Loading roles from API...');
      const response = await authService.getRoles();
      
      if (response.success && response.data) {
        console.log('✅ Roles loaded successfully:', response.data);
        console.log('🔍 Roles response structure:', {
          hasData: !!response.data,
          dataType: typeof response.data,
          dataKeys: response.data ? Object.keys(response.data) : [],
          isArray: Array.isArray(response.data),
          dataProperty: (response.data as unknown as Record<string, unknown>).data,
          dataPropertyType: typeof (response.data as unknown as Record<string, unknown>).data,
          dataPropertyIsArray: Array.isArray((response.data as unknown as Record<string, unknown>).data)
        });
        
        // Check if response.data is an array or object
        let rolesArray: Record<string, unknown>[];
        if (Array.isArray(response.data)) {
          rolesArray = response.data as Record<string, unknown>[];
        } else {
          // If it's an object, try to get the data property
          const responseData = response.data as Record<string, unknown>;
          if (responseData.data && Array.isArray(responseData.data)) {
            rolesArray = responseData.data as Record<string, unknown>[];
          } else {
            console.log('❌ Roles data is not an array:', response.data);
            console.log('🔍 Trying to handle as single role object...');
            
            // Maybe it's a single role object, try to convert to array
            if (responseData._id && responseData.name) {
              rolesArray = [responseData];
            } else {
              throw new Error('Roles data format is not supported');
            }
          }
        }
        
        // Transform roles data
        const roles = rolesArray.map((role: Record<string, unknown>) => ({
          value: role._id as string,
          label: role.name as string
        }));
        
        console.log('📋 Transformed roles:', roles);
        setAvailableRoles(roles);
      } else {
        console.log('❌ Failed to load roles:', response.message);
        // Fallback to hardcoded role if API fails
        setAvailableRoles([
          { value: '68d0e8a499679399fff98688', label: 'Dealer Staff' }
        ]);
      }
    } catch (err: unknown) {
      console.error('❌ Error loading roles:', err);
      // Fallback to hardcoded role if API fails
      setAvailableRoles([
        { value: '68d0e8a499679399fff98688', label: 'Dealer Staff' }
      ]);
    }
  }, []);

  // Hàm trả về các vai trò có thể tạo dựa trên quyền user hiện tại
  const getAvailableRoles = () => {
    return availableRoles;
  };

  // Load users from API
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      console.log('🔍 Loading users - Backend sẽ tự động filter theo dealership của Manager hiện tại');

      const filters: UserFilters = {
        page: currentPage,
        limit: pageSize,
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        role: departmentFilter !== 'all' ? departmentFilter : undefined
        // Không cần truyền dealership_id vì backend tự động filter theo Manager hiện tại
      };

      console.log('🔍 Loading users with filters:', filters);
      const response = await authService.getAllUsers(filters);
      
      if (response.success && response.data) {
        console.log('✅ Users loaded successfully:', response.data);
        console.log('📊 Response structure:', {
          hasData: !!response.data,
          dataType: typeof response.data,
          dataKeys: response.data ? Object.keys(response.data) : [],
          hasDataArray: !!(response.data as Record<string, unknown>).data,
          dataArrayLength: (response.data as Record<string, unknown>).data ? ((response.data as Record<string, unknown>).data as unknown[]).length : 0,
          dataArrayType: (response.data as Record<string, unknown>).data ? typeof (response.data as Record<string, unknown>).data : 'undefined'
        });
        
        // Transform API data to match our Staff interface
        const responseData = response.data as Record<string, unknown>;
        const paginationData = responseData.data as Record<string, unknown>;
        const usersArray = paginationData.data as unknown[];
        
        console.log('🔍 Pagination data:', paginationData);
        console.log('🔍 Users array:', usersArray);
        console.log('🔍 Users array type:', typeof usersArray);
        console.log('🔍 Is users array:', Array.isArray(usersArray));
        
        if (!Array.isArray(usersArray)) {
          console.error('❌ Users data is not an array:', usersArray);
          setError('Dữ liệu users từ API không đúng định dạng');
          return;
        }
        
        const staffData = usersArray.map((user: unknown) => {
          const userData = user as Record<string, unknown>;
          return {
            id: userData._id as string,
            fullName: userData.full_name as string,
            email: userData.email as string,
            phone: (userData.phone as string) || '',
            position: (userData.role_id as Record<string, unknown>)?.name as string || '',
            department: 'Dealer Staff', // Tất cả đều là Dealer Staff
            startDate: userData.createdAt ? new Date(userData.createdAt as string).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            status: 'active' as 'active' | 'inactive' | 'pending', // Mặc định là active
            avatar: userData.avatar as string,
            salary: 0, // Không có thông tin salary từ API
            address: (userData.address as string) || ''
          };
        });
        
        console.log('📋 Transformed staff data:', staffData);
        setStaffList(staffData);
        setTotalPages(paginationData.totalPages as number || 1);
        setTotalUsers(paginationData.totalRecords as number || 0);
      } else {
        console.log('❌ API response failed:', response);
        setError(response.message || 'Không thể tải danh sách nhân viên');
      }
    } catch (err: unknown) {
      console.error('❌ Error loading users:', err);
      setError((err as Error).message || 'Có lỗi xảy ra khi tải danh sách nhân viên');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, statusFilter, departmentFilter]);

  // Load users on component mount and when filters change
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Load roles on component mount
  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

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

  const handleEditStaff = (staff: Staff) => {
    setEditingStaff(staff);
    setNewStaff({
      fullName: staff.fullName,
      email: staff.email,
      phone: staff.phone,
      address: staff.address,
      password: '', // Không hiển thị password cũ
      roleId: '', // Dealer Manager không thể thay đổi role
      dealershipId: '', // Dealer Manager không thể thay đổi dealership
      manufacturerId: '', // Dealer Manager không thể thay đổi manufacturer
      avatar: null
    });
    setError(null);
    setSuccess(null);
    setShowEditModal(true);
  };

  const handleViewStaffDetail = async (staff: Staff) => {
    try {
      console.log('🔍 Loading staff detail for ID:', staff.id);
      setDetailStaff(staff);
      setShowDetailModal(true);
      
      // Gọi API để lấy thông tin chi tiết từ backend
      const result = await authService.getUserById(staff.id);
      
      if (result.success && result.data) {
        console.log('✅ Staff detail loaded:', result.data);
        console.log('🔍 API response structure:', {
          hasData: !!result.data,
          dataType: typeof result.data,
          dataKeys: result.data ? Object.keys(result.data) : [],
          hasNestedData: !!(result.data as unknown as Record<string, unknown>).data,
          nestedDataKeys: (result.data as unknown as Record<string, unknown>).data ? Object.keys((result.data as unknown as Record<string, unknown>).data as Record<string, unknown>) : []
        });
        
        // API response có cấu trúc: { success: true, message: "...", data: { _id, full_name, ... } }
        // Cần truy cập result.data thay vì result.data.data
        const apiStaff = result.data as unknown as Record<string, unknown>;
        
        console.log('🔍 API staff data:', apiStaff);
        console.log('🔍 API staff keys:', apiStaff ? Object.keys(apiStaff) : []);
        const roleData = apiStaff.role_id as Record<string, unknown>;
        const dealershipData = apiStaff.dealership_id as Record<string, unknown>;
        
        const updatedStaff = {
          id: apiStaff._id as string,
          fullName: apiStaff.full_name as string,
          email: apiStaff.email as string,
          phone: (apiStaff.phone as string) || '',
          position: roleData?.name as string || '',
          department: 'Dealer Staff',
          startDate: apiStaff.createdAt ? new Date(apiStaff.createdAt as string).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          status: 'active' as 'active' | 'inactive' | 'pending',
          avatar: apiStaff.avatar as string,
          salary: 0,
          address: (apiStaff.address as string) || '',
          // Thêm thông tin mới từ API
          roleId: roleData?._id as string || '',
          roleName: roleData?.name as string || '',
          dealershipId: dealershipData?._id as string || '',
          dealershipName: dealershipData?.company_name as string || '',
          manufacturerId: apiStaff.manufacturer_id as string || '',
          createdAt: apiStaff.createdAt as string || '',
          updatedAt: apiStaff.updatedAt as string || ''
        };
        
        console.log('📋 Updated staff data:', updatedStaff);
        setDetailStaff(updatedStaff);
      } else {
        console.log('❌ Failed to load staff detail:', result.message);
        setError(result.message || 'Không thể tải thông tin chi tiết');
      }
    } catch (error) {
      console.error('❌ Error loading staff detail:', error);
      setError('Có lỗi xảy ra khi tải thông tin chi tiết');
    }
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
        // Không cần truyền dealership_id vì backend sẽ tự động set theo Manager hiện tại
        manufacturer_id: newStaff.manufacturerId || undefined,
        avatar: newStaff.avatar || undefined
      };

      console.log('🔍 Creating user with data:', createData);
      console.log('📋 Note: dealership_id không được truyền - Backend sẽ tự động set theo Manager hiện tại');
      console.log('🔍 Role ID being sent:', createData.role_id);
      console.log('🔍 Available roles:', getAvailableRoles());
      
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
    } catch (err: unknown) {
      console.error('❌ Error creating user:', err);
      setError((err as Error).message || 'Có lỗi xảy ra khi tạo nhân viên');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEditStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Chuẩn bị dữ liệu cho API update
      const updateData: UpdateUserRequest = {
        full_name: newStaff.fullName,
        email: newStaff.email,
        phone: newStaff.phone,
        address: newStaff.address || undefined,
        password: newStaff.password || undefined, // Chỉ update nếu có password mới
        // Không truyền role_id, dealership_id, manufacturer_id vì Dealer Manager không có quyền
      };

      console.log('🔍 Updating user with data:', updateData);
      console.log('📋 Note: role_id, dealership_id, manufacturer_id không được truyền - Dealer Manager không có quyền');
      
      // Gọi API update user
      const result = await authService.updateUser(editingStaff.id, updateData);

      if (result.success) {
        setSuccess('Cập nhật nhân viên thành công!');
        
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
          setShowEditModal(false);
          setEditingStaff(null);
          setSuccess(null);
        }, 2000);
      } else {
        setError(result.message);
      }
    } catch (err: unknown) {
      console.error('❌ Error updating user:', err);
      setError((err as Error).message || 'Có lỗi xảy ra khi cập nhật nhân viên');
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
      } catch (err: unknown) {
        setError((err as Error).message || 'Có lỗi xảy ra khi xóa nhân viên');
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
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
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
          <div className="p-6 space-y-6">
            {/* Enhanced Header */}
            <div className="bg-white rounded-xl shadow-sm p-8 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">Quản lý nhân viên</h1>
                  <p className="text-gray-600 text-lg">
                    Quản lý thông tin nhân viên trong đại lý hiện tại
                  </p>
                </div>
                <div className="hidden md:flex items-center space-x-4">
                  <div className="bg-blue-50 p-4 rounded-full">
                    <UsersIcon className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Search and Filters */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tìm kiếm & Bộ lọc</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Enhanced Search */}
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm nhân viên..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                  />
                </div>

                <div></div>
                <div></div>

                {/* Enhanced Add Staff Button */}
                <button
                  onClick={handleAddStaff}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl font-medium flex items-center space-x-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <Plus className="h-5 w-5" />
                  <span>Thêm nhân viên</span>
                </button>
              </div>
            </div>

            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500 hover:shadow-lg transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Tổng nhân viên</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{totalUsers}</p>
                    
                  </div>
                  <div className="bg-blue-100 p-4 rounded-full">
                    <UserCheck className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500 hover:shadow-lg transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Hoạt động</p>
                    <p className="text-3xl font-bold text-green-600 mt-1">
                      {staffList.filter(s => s.status === 'active').length}
                    </p>
                    
                  </div>
                  <div className="bg-green-100 p-4 rounded-full">
                    <UserCheck className="h-8 w-8 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-red-500 hover:shadow-lg transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Bị khóa</p>
                    <p className="text-3xl font-bold text-red-600 mt-1">
                      {staffList.filter(s => s.status === 'inactive').length}
                    </p>
                   
                  </div>
                  <div className="bg-red-100 p-4 rounded-full">
                    <UserX className="h-8 w-8 text-red-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-yellow-500 hover:shadow-lg transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Chờ duyệt</p>
                    <p className="text-3xl font-bold text-yellow-600 mt-1">
                      {staffList.filter(s => s.status === 'pending').length}
                    </p>
                    
                  </div>
                  <div className="bg-yellow-100 p-4 rounded-full">
                    <Filter className="h-8 w-8 text-yellow-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Staff Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900">Danh sách nhân viên</h3>
                <p className="text-sm text-gray-600">Quản lý và theo dõi thông tin nhân viên</p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Nhân viên
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredStaff.map((staff) => (
                      <tr key={staff.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg">
                              <span className="text-sm font-semibold text-white">
                                {staff.fullName?.charAt(0) || '?'}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-semibold text-gray-900">{staff.fullName}</div>
                              <div className="text-sm text-gray-500">{staff.email}</div>
                              <div className="text-sm text-gray-400">{staff.phone}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(staff.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => handleViewStaffDetail(staff)}
                              className="text-green-600 hover:text-green-900 hover:bg-green-50 p-2 rounded-lg transition-all duration-150"
                              title="Xem chi tiết"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleEditStaff(staff)}
                              className="text-blue-600 hover:text-blue-900 hover:bg-blue-50 p-2 rounded-lg transition-all duration-150"
                              title="Chỉnh sửa"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(staff.id)}
                              className={`${staff.status === 'active' ? 'text-red-600 hover:text-red-900 hover:bg-red-50' : 'text-green-600 hover:text-green-900 hover:bg-green-50'} p-2 rounded-lg transition-all duration-150`}
                              title={staff.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                            >
                              {staff.status === 'active' ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                            </button>
                            <button
                              onClick={() => handleDeleteStaff(staff.id)}
                              className="text-red-600 hover:text-red-900 hover:bg-red-50 p-2 rounded-lg transition-all duration-150"
                              title="Xóa nhân viên"
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
                <div className="text-center py-16">
                  <UsersIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">Không tìm thấy nhân viên nào.</p>
                  <p className="text-gray-400 text-sm">Hãy thử thay đổi bộ lọc hoặc thêm nhân viên mới.</p>
                </div>
              )}
              
              {loading && (
                <div className="text-center py-16">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                  <p className="text-gray-500 text-lg">Đang tải...</p>
                </div>
              )}
            </div>

            {/* Enhanced Pagination */}
            {totalPages > 1 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    <span className="font-medium">Hiển thị</span> {((currentPage - 1) * pageSize) + 1} đến {Math.min(currentPage * pageSize, totalUsers)} <span className="font-medium">trong tổng số</span> {totalUsers} <span className="font-medium">nhân viên</span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-150 font-medium"
                    >
                      Trước
                    </button>
                    
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-4 py-2 border rounded-lg text-sm font-medium transition-all duration-150 ${
                            currentPage === page
                              ? 'bg-blue-600 text-white border-blue-600 shadow-lg'
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
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-150 font-medium"
                    >
                      Sau
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Enhanced Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Thêm nhân viên mới</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-all duration-150"
                disabled={loading}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Hiển thị thông báo lỗi */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
                {error}
              </div>
            )}

            {/* Hiển thị thông báo thành công */}
            {success && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl">
                {success}
              </div>
            )}

            <form onSubmit={handleSaveNewStaff} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Họ và tên *
                </label>
                <input
                  type="text"
                  name="fullName"
                  required
                  value={newStaff.fullName}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 transition-all duration-200"
                  placeholder="Nhập họ và tên"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={newStaff.email}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 transition-all duration-200"
                  placeholder="Nhập email"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Số điện thoại *
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={newStaff.phone}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 transition-all duration-200"
                  placeholder="Nhập số điện thoại"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Địa chỉ
                </label>
                <input
                  type="text"
                  name="address"
                  value={newStaff.address}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 transition-all duration-200"
                  placeholder="Nhập địa chỉ (tùy chọn)"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mật khẩu *
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  value={newStaff.password}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 transition-all duration-200"
                  placeholder="Nhập mật khẩu"
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Vai trò *
                </label>
                <select
                  name="roleId"
                  required
                  value={newStaff.roleId}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 transition-all duration-200"
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ID Đại lý
                </label>
                <input
                  type="text"
                  name="dealershipId"
                  value="Tự động từ Manager hiện tại"
                  disabled
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-100 text-gray-500"
                  placeholder="Backend tự động set"
                />
                <p className="text-xs text-gray-500 mt-1">Backend tự động lấy từ Manager hiện tại</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ID Nhà sản xuất
                </label>
                <input
                  type="text"
                  name="manufacturerId"
                  value={newStaff.manufacturerId}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 transition-all duration-200"
                  placeholder="Nhập ID nhà sản xuất (tùy chọn)"
                />
                <p className="text-xs text-gray-500 mt-1">Chỉ Admin mới có thể sử dụng trường này</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Avatar
                </label>
                <input
                  type="file"
                  name="avatar"
                  accept="image/*"
                  onChange={handleInputChange}
                  disabled={loading}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 transition-all duration-200"
                />
                <p className="text-xs text-gray-500 mt-1">Chọn ảnh đại diện (tùy chọn)</p>
              </div>

              <div className="flex space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={loading}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-50 transition-all duration-200"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 flex items-center justify-center transition-all duration-200 shadow-lg"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
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

      {/* Edit Staff Modal */}
      {showEditModal && editingStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Chỉnh sửa nhân viên</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingStaff(null);
                }}
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

            <form onSubmit={handleSaveEditStaff} className="space-y-4">
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
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 transition-all duration-200"
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
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 transition-all duration-200"
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
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 transition-all duration-200"
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
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 transition-all duration-200"
                  placeholder="Nhập địa chỉ (tùy chọn)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  name="password"
                  value={newStaff.password}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 transition-all duration-200"
                  placeholder="Nhập mật khẩu mới (để trống nếu không muốn đổi)"
                  minLength={6}
                />
                <p className="text-xs text-gray-500 mt-1">Để trống nếu không muốn thay đổi mật khẩu</p>
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
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 transition-all duration-200"
                />
                <p className="text-xs text-gray-500 mt-1">Chọn ảnh đại diện mới (tùy chọn)</p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingStaff(null);
                  }}
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-50 transition-all duration-200"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 flex items-center justify-center transition-all duration-200 shadow-lg"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Đang xử lý...
                    </>
                  ) : (
                    'Cập nhật nhân viên'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff Detail Modal */}
      {showDetailModal && detailStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Thông tin chi tiết nhân viên</h2>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setDetailStaff(null);
                }}
                className="text-gray-400 hover:text-gray-600"
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

            <div className="space-y-6">
              {/* Debug info */}
              {(() => { console.log('🔍 Detail staff in modal:', detailStaff); return null; })()}
              
              {/* Avatar và thông tin cơ bản */}
              <div className="flex items-center space-x-4">
                <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center">
                  {detailStaff.avatar ? (
                    <img 
                      src={detailStaff.avatar} 
                      alt={detailStaff.fullName}
                      className="h-20 w-20 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-medium text-gray-700">
                      {detailStaff.fullName?.charAt(0) || '?'}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{detailStaff?.fullName || 'Đang tải...'}</h3>
                  <p className="text-gray-600">{detailStaff?.position || 'Đang tải...'}</p>
                  <div className="mt-1">
                    {getStatusBadge(detailStaff?.status || 'active')}
                  </div>
                </div>
              </div>

              {/* Thông tin chi tiết */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Thông tin liên hệ</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-600">Email:</span>
                      <p className="font-medium">{detailStaff?.email || 'Đang tải...'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Số điện thoại:</span>
                      <p className="font-medium">{detailStaff?.phone || 'Đang tải...'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Địa chỉ:</span>
                      <p className="font-medium">{detailStaff?.address || 'Chưa cập nhật'}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Thông tin công việc</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-600">Phòng ban:</span>
                      <p className="font-medium">{detailStaff?.department || 'Đang tải...'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Vị trí:</span>
                      <p className="font-medium">{detailStaff?.position || 'Đang tải...'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Ngày bắt đầu:</span>
                      <p className="font-medium">{detailStaff?.startDate || 'Đang tải...'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Trạng thái:</span>
                      <div className="mt-1">
                        {getStatusBadge(detailStaff?.status || 'active')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Thông tin bổ sung từ API */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Thông tin hệ thống</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-600">ID Vai trò:</span>
                      <p className="font-medium text-xs">{detailStaff?.roleId || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Tên vai trò:</span>
                      <p className="font-medium">{detailStaff?.roleName || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">ID Đại lý:</span>
                      <p className="font-medium text-xs">{detailStaff?.dealershipId || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Tên đại lý:</span>
                      <p className="font-medium">{detailStaff?.dealershipName || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-600">ID Nhà sản xuất:</span>
                      <p className="font-medium text-xs">{detailStaff?.manufacturerId || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Ngày tạo:</span>
                      <p className="font-medium">{detailStaff?.createdAt ? new Date(detailStaff.createdAt).toLocaleString('vi-VN') : 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Ngày cập nhật:</span>
                      <p className="font-medium">{detailStaff?.updatedAt ? new Date(detailStaff.updatedAt).toLocaleString('vi-VN') : 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex space-x-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setDetailStaff(null);
                    handleEditStaff(detailStaff);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center"
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Chỉnh sửa
                </button>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setDetailStaff(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

