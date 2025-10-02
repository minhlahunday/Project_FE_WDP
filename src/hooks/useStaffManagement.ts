import { useState, useEffect } from 'react';
import { authService, RegisterRequest } from '../services/authService';
import { organizationService, Role } from '../services/organizationService';
import { userService, User as ApiUser } from '../services/userService';

interface Staff {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  startDate: string;
  status: "active" | "inactive" | "pending";
  avatar?: string;
  salary: number;
  address: string;
}

interface NewStaffForm {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  roleName: string;
  dealershipId: string;
  manufacturerId: string;
  address: string;
}

export const useStaffManagement = () => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<Staff[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStaff, setNewStaff] = useState<NewStaffForm>({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    roleName: "",
    dealershipId: "",
    manufacturerId: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);

  // Fetch roles from API
  const fetchRoles = async () => {
    setLoadingRoles(true);
    try {
      const result = await organizationService.getRoles();
      if (result.success) {
        setRoles(result.data?.data?.data || []);
      }
    } catch (error) {
      // Handle error silently
    } finally {
      setLoadingRoles(false);
    }
  };

  // Helper function to convert API user to Staff format
  const convertApiUserToStaff = (apiUser: ApiUser): Staff => ({
    id: apiUser._id,
    fullName: apiUser.full_name,
    email: apiUser.email,
    phone: apiUser.phone || '',
    position: apiUser.role_id?.name || 'Unknown',
    department: getDepartmentFromRole(apiUser.role_id?.name || ''),
    startDate: new Date(apiUser.createdAt).toISOString().split('T')[0],
    status: 'active', // Default to active since API doesn't specify status
    avatar: apiUser.avatar,
    salary: 0, // API doesn't provide salary info
    address: '', // API doesn't provide address in this response
  });

  // Fetch staff from API
  const fetchStaff = async () => {
    setLoadingStaff(true);
    try {
      const result = await userService.getUsers();
      if (result.success && result.data.data) {
        // Convert API users to Staff format
        const staffData: Staff[] = result.data.data.map(convertApiUserToStaff);
        setStaffList(staffData);
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
      setError('Không thể tải danh sách nhân viên');
    } finally {
      setLoadingStaff(false);
    }
  };

  // Load roles and staff when component mounts
  useEffect(() => {
    fetchRoles();
    fetchStaff();
  }, []);

  // Available roles for Admin
  const getAvailableRoles = () => {
    if (roles.length > 0) {
      return roles.map(role => ({
        value: role._id,
        label: role.name
      }));
    }
    // Fallback roles if API fails
    return [
      { value: "Dealer Staff", label: "Dealer Staff" },
      { value: "Dealer Manager", label: "Dealer Manager" },
      { value: "EVM Staff", label: "EVM Staff" },
    ];
  };

  // Helper function to get department from role
  const getDepartmentFromRole = (roleName: string): string => {
    if (!roleName) return "Khác";
    
    const normalizedRole = roleName.toLowerCase();
    
    // Map common role patterns to departments
    if (normalizedRole.includes('dealer') && normalizedRole.includes('staff')) {
      return "Đại lý";
    }
    if (normalizedRole.includes('dealer') && normalizedRole.includes('manager')) {
      return "Quản lý đại lý";
    }
    if (normalizedRole.includes('evm') || normalizedRole.includes('manufacturer')) {
      return "EVM";
    }
    if (normalizedRole.includes('admin')) {
      return "Quản trị";
    }
    
    // Fallback for exact matches
    const departmentMapping = {
      "Dealer Staff": "Đại lý",
      "Dealer Manager": "Quản lý đại lý",
      "EVM Staff": "EVM",
      "Admin": "Quản trị"
    };
    
    return departmentMapping[roleName as keyof typeof departmentMapping] || "Khác";
  };

  // Helper function to map role name to role_id
  const getRoleId = (roleName: string): string => {
    const roleMapping = {
      "Dealer Staff": "dealer_staff",
      "Dealer Manager": "dealer_manager", 
      "EVM Staff": "evm_staff"
    };
    return roleMapping[roleName as keyof typeof roleMapping] || roleName.toLowerCase().replace(/\s+/g, '_');
  };

  // Filter staff based on search term
  useEffect(() => {
    let filtered = staffList;

    if (searchTerm) {
      filtered = filtered.filter(
        (staff) =>
          staff.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          staff.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          staff.phone.includes(searchTerm)
      );
    }

    setFilteredStaff(filtered);
  }, [staffList, searchTerm]);

  // Handle opening add modal
  const handleAddStaff = () => {
    setNewStaff({
      fullName: "",
      email: "",
      phone: "",
      password: "",
      roleName: "",
      dealershipId: "",
      manufacturerId: "",
      address: "",
    });
    setError(null);
    setSuccess(null);
    setShowAddModal(true);
  };

  // Handle input changes in form
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setNewStaff((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle saving new staff
  const handleSaveNewStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const registerData: RegisterRequest = {
        full_name: newStaff.fullName,
        email: newStaff.email,
        phone: newStaff.phone,
        address: newStaff.address,
        password: newStaff.password,
        role_id: getRoleId(newStaff.roleName),
        dealership_id: newStaff.dealershipId || undefined,
        manufacturer_id: newStaff.manufacturerId || undefined,
      };

      const result = await authService.registerStaff(registerData);

      if (result.success) {
        const newId = (staffList.length + 1).toString();
        const staffToAdd: Staff = {
          id: newId,
          fullName: newStaff.fullName,
          email: newStaff.email,
          phone: newStaff.phone,
          position: newStaff.roleName,
          department: getDepartmentFromRole(newStaff.roleName),
          address: newStaff.address,
          salary: 0,
          startDate: new Date().toISOString().split("T")[0],
          status: "active",
        };

        setStaffList([...staffList, staffToAdd]);
        setSuccess("Đăng ký nhân viên thành công! Tài khoản đã được tạo.");
        
        setTimeout(() => {
          setShowAddModal(false);
          setSuccess(null);
        }, 2000);
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      console.error('❌ Error registering staff:', err);
      setError(err.message || "Có lỗi xảy ra khi đăng ký nhân viên");
    } finally {
      setLoading(false);
    }
  };

  // Handle deleting staff
  const handleDeleteStaff = (staffId: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa nhân viên này?")) {
      setStaffList(staffList.filter((staff) => staff.id !== staffId));
    }
  };

  // Handle toggling staff status
  const handleToggleStatus = (staffId: string) => {
    setStaffList(
      staffList.map((staff) =>
        staff.id === staffId
          ? {
              ...staff,
              status: staff.status === "active" ? "inactive" : "active",
            }
          : staff
      )
    );
  };

  return {
    // State
    staffList,
    filteredStaff,
    searchTerm,
    showAddModal,
    newStaff,
    loading,
    loadingStaff,
    error,
    success,
    roles,
    loadingRoles,
    
    // Actions
    setSearchTerm,
    setShowAddModal,
    handleAddStaff,
    handleInputChange,
    handleSaveNewStaff,
    handleDeleteStaff,
    handleToggleStatus,
    getAvailableRoles,
    fetchStaff,
  };
};
