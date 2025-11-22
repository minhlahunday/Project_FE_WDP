import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Pagination,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Snackbar,
  Alert,
  Avatar,
  Stack,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationOnIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Block as BlockIcon,
  LockOpen as LockOpenIcon,
  People as PeopleIcon,
  AccessTime as AccessTimeIcon,
  Settings as SettingsIcon,
  Shield as ShieldIcon,
  Info as InfoIcon,
  CameraAlt as CameraAltIcon,
  Business as BusinessIcon,
  CalendarToday as CalendarTodayIcon,
} from '@mui/icons-material';
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
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [pageSize] = useState(10);

  // Roles state
  const [availableRoles, setAvailableRoles] = useState<{ value: string; label: string }[]>([]);

  // Snackbar state
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Helper function to show snackbar (memoized to prevent infinite loops)
  const showSnackbarMessage = useCallback((message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const handleSnackbarClose = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

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
        const responseData = response.data as unknown as Record<string, unknown>;
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
          showSnackbarMessage('Dữ liệu users từ API không đúng định dạng', 'error');
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
        showSnackbarMessage(response.message || 'Không thể tải danh sách nhân viên', 'error');
      }
    } catch (err: unknown) {
      console.error('❌ Error loading users:', err);
      showSnackbarMessage((err as Error).message || 'Có lỗi xảy ra khi tải danh sách nhân viên', 'error');
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
      active: { label: 'Hoạt động', color: 'success' as const },
      inactive: { label: 'Bị khóa', color: 'error' as const },
      pending: { label: 'Chờ duyệt', color: 'warning' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, color: 'default' as const };
    return (
      <Chip 
        label={config.label} 
        color={config.color}
        size="small"
      />
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
        showSnackbarMessage(result.message || 'Không thể tải thông tin chi tiết', 'error');
      }
    } catch (error) {
      console.error('❌ Error loading staff detail:', error);
      showSnackbarMessage('Có lỗi xảy ra khi tải thông tin chi tiết', 'error');
    }
  };

  const handleSaveNewStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!newStaff.roleId) {
        showSnackbarMessage('Vui lòng chọn vai trò cho nhân viên', 'error');
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
        showSnackbarMessage('Tạo nhân viên thành công!', 'success');
        
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
        
        // Đóng modal
        setShowAddModal(false);
      } else {
        showSnackbarMessage(result.message || 'Không thể tạo nhân viên', 'error');
      }
    } catch (err: unknown) {
      console.error('❌ Error creating user:', err);
      showSnackbarMessage((err as Error).message || 'Có lỗi xảy ra khi tạo nhân viên', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEditStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    
    setLoading(true);

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
        showSnackbarMessage('Cập nhật nhân viên thành công!', 'success');
        
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
        
        // Đóng modal
        setShowEditModal(false);
        setEditingStaff(null);
      } else {
        showSnackbarMessage(result.message || 'Không thể cập nhật nhân viên', 'error');
      }
    } catch (err: unknown) {
      console.error('❌ Error updating user:', err);
      showSnackbarMessage((err as Error).message || 'Có lỗi xảy ra khi cập nhật nhân viên', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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

  const handleTextFieldChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewStaff(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleEditTextFieldChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editingStaff) {
      setEditingStaff(prev => ({
        ...prev!,
        [field]: e.target.value
      }));
    }
  };

  const handleSelectChange = (field: string) => (e: { target: { value: unknown } }) => {
    setNewStaff(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa nhân viên này?')) {
      setLoading(true);
      try {
        const result = await authService.deleteUser(staffId);
        
        if (result.success) {
          showSnackbarMessage('Xóa nhân viên thành công!', 'success');
          await loadUsers(); // Reload the list
        } else {
          showSnackbarMessage(result.message || 'Không thể xóa nhân viên', 'error');
        }
      } catch (err: unknown) {
        showSnackbarMessage((err as Error).message || 'Có lỗi xảy ra khi xóa nhân viên', 'error');
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

  const handleSearch = () => {
    setCurrentPage(1);
    loadUsers();
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Sidebar */}
      <Sidebar
        activeSection="staff-management"
        onSectionChange={handleSectionChange}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpen={() => setSidebarOpen(true)}
      />
      
      {/* Main Content */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          ml: { lg: sidebarOpen ? '220px' : '70px' },
          transition: 'margin-left 0.3s',
        }}
      >
        {/* Header */}
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        {/* Page Content */}
        <Box sx={{ flex: 1, overflowY: 'auto', pl: 3.75, pr: 2, py: 3, bgcolor: 'grey.50', minHeight: '100vh' }}>
          <Card>
            <CardContent>
              <Box sx={{ mb: 3 }}>
                {/* Page Header */}
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <PeopleIcon color="primary" sx={{ fontSize: 32 }} />
                    <Typography variant="h4" component="h1" fontWeight="bold">
                      Quản lý nhân viên
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddStaff}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                    }}
                  >
                    Thêm nhân viên
                  </Button>
                </Box>

                {/* Search Section */}
                <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={2} alignItems="flex-end" mb={3}>
                  <Box flex={1} minWidth={{ xs: 200, md: 300 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>
                      Tìm kiếm
                    </Typography>
                    <Box sx={{ position: 'relative' }}>
                      <TextField
                        fullWidth
                        placeholder="Tìm kiếm theo tên, email hoặc số điện thoại..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            pl: 4,
                            borderRadius: 2,
                            '&:hover': {
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'grey.300',
                              },
                            },
                          },
                        }}
                      />
                      <Box
                        sx={{
                          position: 'absolute',
                          left: 12,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          pointerEvents: 'none',
                          color: 'text.secondary',
                        }}
                      >
                        <SearchIcon />
                      </Box>
                    </Box>
                  </Box>
                  
                  <Box display="flex" gap={2}>
                    <Button
                      variant="contained"
                      startIcon={<SearchIcon />}
                      onClick={handleSearch}
                      disabled={loading}
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        px: 3,
                        py: 1.5,
                      }}
                    >
                      Tìm kiếm
                    </Button>
                  </Box>
                </Box>

                {/* Staff Table */}
                {loading ? (
                  <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                    <CircularProgress />
                  </Box>
                ) : (
                  <>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Tổng cộng {totalUsers} nhân viên
                      </Typography>
                    </Box>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ '& th': { fontWeight: 'bold', backgroundColor: 'grey.100' } }}>
                            <TableCell>Nhân viên</TableCell>
                            <TableCell>Trạng thái</TableCell>
                            <TableCell align="center">Thao tác</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredStaff.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={3} align="center">
                                <Typography color="text.secondary" py={2}>
                                  Không tìm thấy nhân viên nào
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredStaff.map((staff) => (
                              <TableRow key={staff.id} hover>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Avatar
                                      sx={{
                                        bgcolor: 'primary.main',
                                        width: 40,
                                        height: 40,
                                      }}
                                    >
                                      {staff.fullName?.charAt(0) || '?'}
                                    </Avatar>
                                    <Box>
                                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                        {staff.fullName}
                                      </Typography>
                                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                                        {staff.email}
                                      </Typography>
                                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                                        {staff.phone}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  {getStatusBadge(staff.status)}
                                </TableCell>
                                <TableCell align="center">
                                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                    <Tooltip title="Xem chi tiết">
                                      <IconButton
                                        size="small"
                                        onClick={() => handleViewStaffDetail(staff)}
                                        sx={{ color: 'primary.main' }}
                                      >
                                        <VisibilityIcon />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Chỉnh sửa">
                                      <IconButton
                                        size="small"
                                        onClick={() => handleEditStaff(staff)}
                                        sx={{ color: 'primary.main' }}
                                      >
                                        <EditIcon />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Xóa nhân viên">
                                      <IconButton
                                        size="small"
                                        onClick={() => handleDeleteStaff(staff.id)}
                                        sx={{ color: 'error.main' }}
                                      >
                                        <DeleteIcon />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Hiển thị {((currentPage - 1) * pageSize) + 1} đến {Math.min(currentPage * pageSize, totalUsers)} trong tổng số {totalUsers} nhân viên
                    </Typography>
                    <Pagination
                      count={totalPages}
                      page={currentPage}
                      onChange={handlePageChange}
                      color="primary"
                      showFirstButton
                      showLastButton
                    />
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Add Staff Modal */}
      <Dialog
        open={showAddModal}
        onClose={() => !loading && setShowAddModal(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { maxHeight: '90vh' }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Thêm nhân viên mới
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Tạo tài khoản cho nhân viên mới
              </Typography>
            </Box>
            <IconButton
              onClick={() => setShowAddModal(false)}
              disabled={loading}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Box 
            component="form" 
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveNewStaff(e);
            }} 
            sx={{ mt: 2 }}
          >
            <Stack spacing={3}>
              {/* Personal Information */}
              <Box>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Thông tin cá nhân
                </Typography>
                <Stack spacing={2}>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <TextField
                      fullWidth
                      label="Họ và tên"
                      required
                      name="fullName"
                      value={newStaff.fullName}
                      onChange={handleTextFieldChange('fullName')}
                      disabled={loading}
                      placeholder="Nhập họ và tên đầy đủ"
                    />
                    <TextField
                      fullWidth
                      label="Số điện thoại"
                      required
                      type="tel"
                      name="phone"
                      value={newStaff.phone}
                      onChange={handleTextFieldChange('phone')}
                      disabled={loading}
                      placeholder="0XXXXXXXXX"
                    />
                  </Stack>
                  <TextField
                    fullWidth
                    label="Địa chỉ"
                    name="address"
                    value={newStaff.address}
                    onChange={handleTextFieldChange('address')}
                    disabled={loading}
                    placeholder="Nhập địa chỉ liên hệ"
                  />
                </Stack>
              </Box>

              <Divider />

              {/* Account Information */}
              <Box>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Thông tin tài khoản
                </Typography>
                <Stack spacing={2}>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <TextField
                      fullWidth
                      label="Email"
                      required
                      type="email"
                      name="email"
                      value={newStaff.email}
                      onChange={handleTextFieldChange('email')}
                      disabled={loading}
                      placeholder="example@company.com"
                    />
                    <TextField
                      fullWidth
                      label="Mật khẩu"
                      required
                      type="password"
                      name="password"
                      value={newStaff.password}
                      onChange={handleTextFieldChange('password')}
                      disabled={loading}
                      placeholder="Tối thiểu 6 ký tự"
                      inputProps={{ minLength: 6 }}
                      helperText="Mật khẩu phải có ít nhất 6 ký tự"
                    />
                  </Stack>
                  <FormControl fullWidth required>
                    <InputLabel>Vai trò</InputLabel>
                    <Select
                      name="roleId"
                      value={newStaff.roleId}
                      onChange={(e) => setNewStaff({ ...newStaff, roleId: e.target.value as string })}
                      disabled={loading}
                      label="Vai trò"
                    >
                      <MenuItem value="">-- Chọn vai trò --</MenuItem>
                      {getAvailableRoles().map((role) => (
                        <MenuItem key={role.value} value={role.value}>
                          {role.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>
              </Box>

              <Divider />

              {/* Organization Info */}
              <Box>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Thông tin tổ chức
                </Typography>
                <TextField
                  fullWidth
                  label="Đại lý"
                  value="Tự động từ Manager hiện tại"
                  disabled
                  helperText="Hệ thống tự động lấy từ tài khoản Manager hiện tại"
                  InputProps={{
                    endAdornment: <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                  }}
                />
              </Box>
            </Stack>
            <DialogActions sx={{ p: 2, pt: 3, mt: 2 }}>
              <Button
                onClick={() => setShowAddModal(false)}
                disabled={loading}
                color="inherit"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={loading}
                variant="contained"
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
              >
                {loading ? 'Đang xử lý...' : 'Thêm nhân viên'}
              </Button>
            </DialogActions>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Edit Staff Modal */}
      <Dialog
        open={showEditModal && !!editingStaff}
        onClose={() => {
          if (!loading) {
            setShowEditModal(false);
            setEditingStaff(null);
          }
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { maxHeight: '90vh' }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Chỉnh sửa nhân viên
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Cập nhật thông tin nhân viên
              </Typography>
            </Box>
            <IconButton
              onClick={() => {
                setShowEditModal(false);
                setEditingStaff(null);
              }}
              disabled={loading}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Box 
            component="form" 
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveEditStaff(e);
            }} 
            sx={{ mt: 2 }}
          >
            <Stack spacing={3}>
              {/* Personal Information */}
              <Box>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Thông tin cá nhân
                </Typography>
                <Stack spacing={2}>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <TextField
                      fullWidth
                      label="Họ và tên"
                      required
                      name="fullName"
                      value={editingStaff?.fullName || ''}
                      onChange={handleEditTextFieldChange('fullName')}
                      disabled={loading}
                      placeholder="Nhập họ và tên đầy đủ"
                    />
                    <TextField
                      fullWidth
                      label="Số điện thoại"
                      required
                      type="tel"
                      name="phone"
                      value={editingStaff?.phone || ''}
                      onChange={handleEditTextFieldChange('phone')}
                      disabled={loading}
                      placeholder="0XXXXXXXXX"
                    />
                  </Stack>
                  <TextField
                    fullWidth
                    label="Địa chỉ"
                    name="address"
                    value={editingStaff?.address || ''}
                    onChange={handleEditTextFieldChange('address')}
                    disabled={loading}
                    placeholder="Nhập địa chỉ liên hệ"
                  />
                </Stack>
              </Box>

              <Divider />

              {/* Account Information */}
              <Box>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Thông tin tài khoản
                </Typography>
                <Stack spacing={2}>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <TextField
                      fullWidth
                      label="Email"
                      required
                      type="email"
                      name="email"
                      value={editingStaff?.email || ''}
                      onChange={handleEditTextFieldChange('email')}
                      disabled={loading}
                      placeholder="example@company.com"
                    />
                    <TextField
                      fullWidth
                      label="Mật khẩu mới"
                      type="password"
                      name="password"
                      value={editingStaff?.password || ''}
                      onChange={handleEditTextFieldChange('password')}
                      disabled={loading}
                      placeholder="Để trống nếu không muốn thay đổi"
                      inputProps={{ minLength: 6 }}
                      helperText="Để trống nếu không muốn thay đổi mật khẩu"
                    />
                  </Stack>
                </Stack>
              </Box>

              <Divider />

              {/* Organization Info */}
              <Box>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Thông tin tổ chức
                </Typography>
                <TextField
                  fullWidth
                  label="Đại lý"
                  value="Tự động từ Manager hiện tại"
                  disabled
                  helperText="Hệ thống tự động lấy từ tài khoản Manager hiện tại"
                  InputProps={{
                    endAdornment: <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                  }}
                />
              </Box>
            </Stack>
            <DialogActions sx={{ p: 2, pt: 3, mt: 2 }}>
              <Button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingStaff(null);
                }}
                disabled={loading}
                color="inherit"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={loading}
                variant="contained"
                color="success"
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <EditIcon />}
              >
                {loading ? 'Đang xử lý...' : 'Cập nhật nhân viên'}
              </Button>
            </DialogActions>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Staff Detail Modal */}
      <Dialog
        open={showDetailModal && !!detailStaff}
        onClose={() => {
          setShowDetailModal(false);
          setDetailStaff(null);
        }}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { maxHeight: '90vh' }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Thông tin chi tiết nhân viên
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Xem thông tin đầy đủ của nhân viên
              </Typography>
            </Box>
            <IconButton
              onClick={() => {
                setShowDetailModal(false);
                setDetailStaff(null);
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {detailStaff && (
            <Stack spacing={3} sx={{ mt: 2 }}>
              {/* Profile Section */}
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Avatar
                      src={detailStaff.avatar}
                      sx={{
                        width: 96,
                        height: 96,
                        bgcolor: 'primary.main',
                        fontSize: 40,
                      }}
                    >
                      {detailStaff.fullName?.charAt(0) || '?'}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {detailStaff.fullName || 'Đang tải...'}
                      </Typography>
                      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                        {detailStaff.position || 'Đang tải...'}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        {getStatusBadge(detailStaff.status || 'active')}
                        <Typography variant="body2" color="text.secondary">
                          Tham gia từ: {detailStaff.startDate || 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Thông tin liên hệ
                  </Typography>
                  <Stack spacing={3}>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} flexWrap="wrap">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: { xs: '1 1 100%', md: '1 1 calc(50% - 12px)' } }}>
                        <EmailIcon color="primary" />
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Email
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                            {detailStaff.email || 'Đang tải...'}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: { xs: '1 1 100%', md: '1 1 calc(50% - 12px)' } }}>
                        <PhoneIcon color="primary" />
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Số điện thoại
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                            {detailStaff.phone || 'Đang tải...'}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: { xs: '1 1 100%', md: '1 1 calc(50% - 12px)' } }}>
                        <LocationOnIcon color="primary" />
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Địa chỉ
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                            {detailStaff.address || 'Chưa cập nhật'}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: { xs: '1 1 100%', md: '1 1 calc(50% - 12px)' } }}>
                        <ShieldIcon color="primary" />
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Vai trò
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                            {detailStaff.roleName || detailStaff.position || 'N/A'}
                          </Typography>
                        </Box>
                      </Box>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>

              {/* Organization Information */}
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Thông tin tổ chức
                  </Typography>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} flexWrap="wrap">
                    <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(33.333% - 16px)' } }}>
                      <Typography variant="caption" color="text.secondary">
                        Đại lý
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'medium', mt: 0.5 }}>
                        {detailStaff.dealershipName || 'N/A'}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(33.333% - 16px)' } }}>
                      <Typography variant="caption" color="text.secondary">
                        Ngày tham gia
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'medium', mt: 0.5 }}>
                        {detailStaff.createdAt ? new Date(detailStaff.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(33.333% - 16px)' } }}>
                      <Typography variant="caption" color="text.secondary">
                        ID Nhân viên
                      </Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', p: 1, borderRadius: 1, mt: 0.5 }}>
                        {detailStaff.id || 'N/A'}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button
            onClick={() => {
              setShowDetailModal(false);
              setDetailStaff(null);
            }}
            color="inherit"
          >
            Đóng
          </Button>
          <Button
            onClick={() => {
              if (detailStaff) {
                setShowDetailModal(false);
                setDetailStaff(null);
                handleEditStaff(detailStaff);
              }
            }}
            variant="contained"
            startIcon={<EditIcon />}
          >
            Chỉnh sửa nhân viên
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};