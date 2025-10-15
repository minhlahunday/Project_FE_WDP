import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  UserCheck, 
  UserX, 
  Filter, 
  X, 
  Eye, 
  Users as UsersIcon, 
  TrendingUp, 
  Clock,
  AlertCircle,
  CheckCircle,
  Settings,
  Shield,
  Info,
  Camera,
  Users
} from 'lucide-react';
import { Header } from '../../common/Header';
import { Sidebar } from '../../common/Sidebar';
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
        
        // Check if response.data has nested data property
        const responseData = response.data as Record<string, unknown>;
        let rolesArray: Record<string, unknown>[];
        
        if (responseData.data && Array.isArray(responseData.data)) {
          // Case: response.data.data is an array
          rolesArray = responseData.data as Record<string, unknown>[];
        } else if (Array.isArray(response.data)) {
          // Case: response.data is directly an array
          rolesArray = response.data as Record<string, unknown>[];
        } else if (responseData._id && responseData.name) {
          // Case: response.data is a single role object
          rolesArray = [responseData];
        } else {
          console.log('❌ Roles data format is not supported:', response.data);
          // Fallback to hardcoded role if API fails
          setAvailableRoles([
            { value: '68d0e8a499679399fff98688', label: 'Dealer Staff' }
          ]);
          return;
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
      // Validate required fields
      if (!newStaff.roleId) {
        setError('Vui lòng chọn vai trò cho nhân viên');
        setLoading(false);
        return;
      }

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

  // Handle section change for sidebar
  const handleSectionChange = (section: string) => {
    console.log('Section changed to:', section);
    // Có thể implement navigation logic ở đây nếu cần
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header có sẵn của dự án */}
      <Header />
      
      <div className="flex">
        {/* Sidebar có sẵn của dự án với prop cần thiết */}
        <Sidebar onSectionChange={handleSectionChange} />
      
      {/* Main Content */}
        <main className="flex-1 ml-64 pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="space-y-6">
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
          </div>
        </main>
      </div>

      {/* Enhanced Add Staff Modal - Redesigned to match Admin style */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-filter backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Thêm nhân viên mới</h2>
                  <p className="text-blue-100 mt-1">Tạo tài khoản cho nhân viên mới</p>
                </div>
              <button
                onClick={() => setShowAddModal(false)}
                  className="text-white hover:text-gray-200 hover:bg-white/20 p-2 rounded-full transition-all duration-150 focus:outline-none"
                disabled={loading}
              >
                <X className="h-6 w-6" />
              </button>
              </div>
            </div>

            {/* Form Content */}
            <div className="p-8">
              {/* Alert Messages */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium">{error}</p>
                    </div>
                  </div>
              </div>
            )}

            {success && (
                <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-r-lg">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium">{success}</p>
                    </div>
                  </div>
              </div>
            )}

              <form onSubmit={handleSaveNewStaff} className="space-y-8">
                {/* Personal Information Section */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-center mb-6">
                    <div className="bg-blue-100 p-2 rounded-lg mr-3">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Thông tin cá nhân</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Họ và tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  required
                  value={newStaff.fullName}
                  onChange={handleInputChange}
                  disabled={loading}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 transition-all duration-200 shadow-sm"
                        placeholder="Nhập họ và tên đầy đủ"
                />
              </div>

              <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Số điện thoại <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        required
                        value={newStaff.phone}
                        onChange={handleInputChange}
                        disabled={loading}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 transition-all duration-200 shadow-sm"
                        placeholder="0XXXXXXXXX"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Địa chỉ (Tùy chọn)
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={newStaff.address}
                        onChange={handleInputChange}
                        disabled={loading}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 transition-all duration-200 shadow-sm"
                        placeholder="Nhập địa chỉ liên hệ"
                      />
                    </div>
                  </div>
                </div>

                {/* Account Information Section */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-center mb-6">
                    <div className="bg-green-100 p-2 rounded-lg mr-3">
                      <Settings className="h-5 w-5 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Thông tin tài khoản</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={newStaff.email}
                  onChange={handleInputChange}
                  disabled={loading}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 transition-all duration-200 shadow-sm"
                        placeholder="example@company.com"
                />
              </div>

              <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mật khẩu <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        name="password"
                        required
                        value={newStaff.password}
                        onChange={handleInputChange}
                        disabled={loading}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 transition-all duration-200 shadow-sm"
                        placeholder="Tối thiểu 6 ký tự"
                        minLength={6}
                      />
                      <p className="mt-1 text-xs text-gray-500">Mật khẩu phải có ít nhất 6 ký tự</p>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Vai trò <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="roleId"
                        required
                        value={newStaff.roleId}
                        onChange={handleInputChange}
                        disabled={loading}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 transition-all duration-200 shadow-sm"
                      >
                        <option value="">-- Chọn vai trò --</option>
                        {getAvailableRoles().map((role) => (
                          <option key={role.value} value={role.value}>
                            {role.label}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-xs text-gray-500">Chọn vai trò cho nhân viên mới</p>
                    </div>
                  </div>
                </div>

                {/* Permissions & Organization Section */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-center mb-6">
                    <div className="bg-purple-100 p-2 rounded-lg mr-3">
                      <Shield className="h-5 w-5 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Phân quyền & Tổ chức</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Trạng thái vai trò
                      </label>
                      <div className={`border rounded-lg p-4 ${newStaff.roleId ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
                        <div className="flex items-center">
                          {newStaff.roleId ? (
                            <>
                              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                              <span className="text-sm text-green-700">
                                Đã chọn: {getAvailableRoles().find(role => role.value === newStaff.roleId)?.label || 'Không xác định'}
                              </span>
                            </>
                          ) : (
                            <>
                              <Info className="h-5 w-5 text-blue-500 mr-2" />
                              <span className="text-sm text-blue-700">
                                Vui lòng chọn vai trò cho nhân viên
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Đại lý
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value="Tự động từ Manager hiện tại"
                          disabled
                          className="block w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 shadow-sm"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        ⚡ Hệ thống tự động lấy từ tài khoản Manager hiện tại
                      </p>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-center mb-6">
                    <div className="bg-orange-100 p-2 rounded-lg mr-3">
                      <Camera className="h-5 w-5 text-orange-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Thông tin bổ sung</h3>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Avatar
                    </label>
                    <div className="flex items-center space-x-4">
                      <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-300">
                        <svg className="h-full w-full text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <input
                          type="file"
                          name="avatar"
                          accept="image/*"
                          onChange={handleInputChange}
                          disabled={loading}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all duration-200"
                        />
                        <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    disabled={loading}
                    className="w-full sm:w-auto px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 font-medium disabled:opacity-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-700 text-white rounded-lg hover:from-blue-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-r-transparent mr-2"></div>
                        Đang xử lý...
                      </div>
                    ) : (
                      'Thêm nhân viên'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Edit Staff Modal - Redesigned to match Admin style */}
      {showEditModal && editingStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-filter backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Chỉnh sửa nhân viên</h2>
                  <p className="text-green-100 mt-1">Cập nhật thông tin nhân viên</p>
                </div>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingStaff(null);
                  }}
                  className="text-white hover:text-gray-200 hover:bg-white/20 p-2 rounded-full transition-all duration-150 focus:outline-none"
                  disabled={loading}
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Form Content */}
            <div className="p-8">
              {/* Alert Messages */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {success && (
                <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-r-lg">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium">{success}</p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSaveEditStaff} className="space-y-8">
                {/* Personal Information Section */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-center mb-6">
                    <div className="bg-blue-100 p-2 rounded-lg mr-3">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Thông tin cá nhân</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Họ và tên <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        required
                        value={newStaff.fullName}
                        onChange={handleInputChange}
                        disabled={loading}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 transition-all duration-200 shadow-sm"
                        placeholder="Nhập họ và tên đầy đủ"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Số điện thoại <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={newStaff.phone}
                  onChange={handleInputChange}
                  disabled={loading}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 transition-all duration-200 shadow-sm"
                        placeholder="0XXXXXXXXX"
                />
              </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Địa chỉ (Tùy chọn)
                </label>
                <input
                  type="text"
                  name="address"
                  value={newStaff.address}
                  onChange={handleInputChange}
                  disabled={loading}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 transition-all duration-200 shadow-sm"
                        placeholder="Nhập địa chỉ liên hệ"
                />
                    </div>
                  </div>
              </div>

                {/* Account Information Section */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-center mb-6">
                    <div className="bg-green-100 p-2 rounded-lg mr-3">
                      <Settings className="h-5 w-5 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Thông tin tài khoản</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={newStaff.email}
                        onChange={handleInputChange}
                        disabled={loading}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 transition-all duration-200 shadow-sm"
                        placeholder="example@company.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mật khẩu <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  value={newStaff.password}
                  onChange={handleInputChange}
                  disabled={loading}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 transition-all duration-200 shadow-sm"
                        placeholder="Tối thiểu 6 ký tự"
                  minLength={6}
                />
                      <p className="mt-1 text-xs text-gray-500">Mật khẩu phải có ít nhất 6 ký tự</p>
              </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Vai trò <span className="text-red-500">*</span>
                </label>
                <select
                  name="roleId"
                  required
                  value={newStaff.roleId}
                  onChange={handleInputChange}
                  disabled={loading}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 transition-all duration-200 shadow-sm"
                >
                        <option value="">-- Chọn vai trò --</option>
                  {getAvailableRoles().map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
                      <p className="mt-1 text-xs text-gray-500">Chọn vai trò cho nhân viên mới</p>
                    </div>
                  </div>
              </div>

                {/* Permissions & Organization Section */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-center mb-6">
                    <div className="bg-purple-100 p-2 rounded-lg mr-3">
                      <Shield className="h-5 w-5 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Phân quyền & Tổ chức</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Trạng thái vai trò
                </label>
                      <div className={`border rounded-lg p-4 ${newStaff.roleId ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
                        <div className="flex items-center">
                          {newStaff.roleId ? (
                            <>
                              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                              <span className="text-sm text-green-700">
                                Đã chọn: {getAvailableRoles().find(role => role.value === newStaff.roleId)?.label || 'Không xác định'}
                              </span>
                            </>
                          ) : (
                            <>
                              <Info className="h-5 w-5 text-blue-500 mr-2" />
                              <span className="text-sm text-blue-700">
                                Vui lòng chọn vai trò cho nhân viên
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Đại lý
                      </label>
                      <div className="relative">
                <input
                  type="text"
                          value="Tự động từ Manager hiện tại"
                          disabled
                          className="block w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 shadow-sm"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        ⚡ Hệ thống tự động lấy từ tài khoản Manager hiện tại
                      </p>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-center mb-6">
                    <div className="bg-orange-100 p-2 rounded-lg mr-3">
                      <Camera className="h-5 w-5 text-orange-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Thông tin bổ sung</h3>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Avatar
                    </label>
                    <div className="flex items-center space-x-4">
                      <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-300">
                        <svg className="h-full w-full text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <input
                          type="file"
                          name="avatar"
                          accept="image/*"
                  onChange={handleInputChange}
                  disabled={loading}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all duration-200"
                />
                        <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                      </div>
                    </div>
                  </div>
              </div>

                {/* Form Actions */}
                <div className="flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    disabled={loading}
                    className="w-full sm:w-auto px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 font-medium disabled:opacity-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-700 text-white rounded-lg hover:from-blue-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-r-transparent mr-2"></div>
                        Đang xử lý...
                      </div>
                    ) : (
                      'Thêm nhân viên'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Edit Staff Modal - Redesigned to match Admin style */}
      {showEditModal && editingStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-filter backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
              <div>
                  <h2 className="text-2xl font-bold">Chỉnh sửa nhân viên</h2>
                  <p className="text-green-100 mt-1">Cập nhật thông tin nhân viên</p>
                </div>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingStaff(null);
                  }}
                  className="text-white hover:text-gray-200 hover:bg-white/20 p-2 rounded-full transition-all duration-150 focus:outline-none"
                  disabled={loading}
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Form Content */}
            <div className="p-8">
              {/* Alert Messages */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {success && (
                <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-r-lg">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium">{success}</p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSaveEditStaff} className="space-y-8">
                {/* Personal Information Section */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-center mb-6">
                    <div className="bg-blue-100 p-2 rounded-lg mr-3">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Thông tin cá nhân</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Họ và tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                        name="fullName"
                        required
                        value={newStaff.fullName}
                  onChange={handleInputChange}
                  disabled={loading}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 transition-all duration-200 shadow-sm"
                        placeholder="Nhập họ và tên đầy đủ"
                />
              </div>

              <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Số điện thoại <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        required
                        value={newStaff.phone}
                        onChange={handleInputChange}
                        disabled={loading}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 transition-all duration-200 shadow-sm"
                        placeholder="0XXXXXXXXX"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Địa chỉ (Tùy chọn)
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={newStaff.address}
                        onChange={handleInputChange}
                        disabled={loading}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 transition-all duration-200 shadow-sm"
                        placeholder="Nhập địa chỉ liên hệ"
                      />
                    </div>
                  </div>
                </div>

                {/* Account Information Section */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-center mb-6">
                    <div className="bg-green-100 p-2 rounded-lg mr-3">
                      <Settings className="h-5 w-5 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Thông tin tài khoản</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={newStaff.email}
                        onChange={handleInputChange}
                        disabled={loading}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 transition-all duration-200 shadow-sm"
                        placeholder="example@company.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mật khẩu mới
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={newStaff.password}
                        onChange={handleInputChange}
                        disabled={loading}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 transition-all duration-200 shadow-sm"
                        placeholder="Để trống nếu không muốn thay đổi"
                        minLength={6}
                      />
                      <p className="mt-1 text-xs text-gray-500">Để trống nếu không muốn thay đổi mật khẩu</p>
                    </div>
                  </div>
                </div>

                {/* Permissions & Organization Section */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-center mb-6">
                    <div className="bg-purple-100 p-2 rounded-lg mr-3">
                      <Shield className="h-5 w-5 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Phân quyền & Tổ chức</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Trạng thái vai trò
                      </label>
                      <div className={`border rounded-lg p-4 ${newStaff.roleId ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
                        <div className="flex items-center">
                          {newStaff.roleId ? (
                            <>
                              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                              <span className="text-sm text-green-700">
                                Đã chọn: {getAvailableRoles().find(role => role.value === newStaff.roleId)?.label || 'Không xác định'}
                              </span>
                            </>
                          ) : (
                            <>
                              <Info className="h-5 w-5 text-blue-500 mr-2" />
                              <span className="text-sm text-blue-700">
                                Vui lòng chọn vai trò cho nhân viên
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Đại lý
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value="Tự động từ Manager hiện tại"
                          disabled
                          className="block w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 shadow-sm"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        ⚡ Hệ thống tự động lấy từ tài khoản Manager hiện tại
                      </p>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-center mb-6">
                    <div className="bg-orange-100 p-2 rounded-lg mr-3">
                      <Camera className="h-5 w-5 text-orange-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Thông tin bổ sung</h3>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                  Avatar
                </label>
                    <div className="flex items-center space-x-4">
                      <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-300">
                        {editingStaff.avatar ? (
                          <img 
                            src={editingStaff.avatar} 
                            alt={editingStaff.fullName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center">
                            <span className="text-3xl font-bold text-white">
                              {editingStaff.fullName?.charAt(0) || '?'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                <input
                  type="file"
                  name="avatar"
                  accept="image/*"
                  onChange={handleInputChange}
                  disabled={loading}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100 transition-all duration-200"
                />
                        <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                      </div>
                    </div>
                  </div>
              </div>

                {/* Form Actions */}
                <div className="flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingStaff(null);
                    }}
                  disabled={loading}
                    className="w-full sm:w-auto px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 font-medium disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                    className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-lg hover:from-green-700 hover:to-emerald-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
                >
                  {loading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-r-transparent mr-2"></div>
                      Đang xử lý...
                      </div>
                  ) : (
                      'Cập nhật nhân viên'
                  )}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Staff Detail Modal - Redesigned to match modern style */}
      {showDetailModal && detailStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-filter backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Thông tin chi tiết nhân viên</h2>
                  <p className="text-indigo-100 mt-1">Xem thông tin đầy đủ của nhân viên</p>
    </div>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setDetailStaff(null);
                  }}
                  className="text-white hover:text-gray-200 hover:bg-white/20 p-2 rounded-full transition-all duration-150 focus:outline-none"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-8">
              {error && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-8">
                {/* Profile Section */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6">
                  <div className="flex items-center mb-6">
                    <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                      <Users className="h-5 w-5 text-indigo-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Hồ sơ nhân viên</h3>
                  </div>
                  
                  <div className="flex items-start space-x-6">
                    <div className="h-24 w-24 rounded-full bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center shadow-lg overflow-hidden flex-shrink-0">
                      {detailStaff.avatar ? (
                        <img 
                          src={detailStaff.avatar} 
                          alt={detailStaff.fullName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-3xl font-bold text-white">
                          {detailStaff.fullName?.charAt(0) || '?'}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-2xl font-bold text-gray-900 mb-2">{detailStaff?.fullName || 'Đang tải...'}</h4>
                      <p className="text-lg text-gray-600 mb-3">{detailStaff?.position || 'Đang tải...'}</p>
                      <div className="flex items-center space-x-4">
                        {getStatusBadge(detailStaff?.status || 'active')}
                        <span className="text-sm text-gray-500">
                          Tham gia từ: {detailStaff?.startDate || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-center mb-6">
                    <div className="bg-blue-100 p-2 rounded-lg mr-3">
                      <Info className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Thông tin liên hệ</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <svg className="h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-medium text-gray-900">{detailStaff?.email || 'Đang tải...'}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                          <svg className="h-5 w-5 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Số điện thoại</p>
                          <p className="font-medium text-gray-900">{detailStaff?.phone || 'Đang tải...'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                          <svg className="h-5 w-5 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Địa chỉ</p>
                          <p className="font-medium text-gray-900">{detailStaff?.address || 'Chưa cập nhật'}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <Shield className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Vai trò</p>
                          <p className="font-medium text-gray-900">{detailStaff?.roleName || detailStaff?.position || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Organization Information */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-center mb-6">
                    <div className="bg-green-100 p-2 rounded-lg mr-3">
                      <Settings className="h-5 w-5 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Thông tin tổ chức</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <svg className="h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Đại lý</p>
                          <p className="font-medium text-gray-900">{detailStaff?.dealershipName || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center">
                          <svg className="h-5 w-5 text-pink-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Ngày tham gia</p>
                          <p className="font-medium text-gray-900">{detailStaff?.createdAt ? new Date(detailStaff.createdAt).toLocaleDateString('vi-VN') : 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <svg className="h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">ID Nhân viên</p>
                          <p className="font-medium text-gray-900 text-xs font-mono bg-gray-100 px-2 py-1 rounded">{detailStaff?.id || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setDetailStaff(null);
                    }}
                    className="w-full sm:w-auto px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 font-medium"
                  >
                    Đóng
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setDetailStaff(null);
                      handleEditStaff(detailStaff);
                    }}
                    className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-lg hover:from-indigo-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <Edit2 className="h-5 w-5 mr-2 inline" />
                    Chỉnh sửa nhân viên
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};