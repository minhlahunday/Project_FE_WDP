import { useState, useEffect } from 'react';
import { authService, RegisterRequest } from '../services/authService';

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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Available roles for Admin
  const getAvailableRoles = () => {
    return [
      { value: "Dealer Staff", label: "Dealer Staff" },
      { value: "Dealer Manager", label: "Dealer Manager" },
      { value: "EVM Staff", label: "EVM Staff" },
    ];
  };

  // Helper function to get department from role
  const getDepartmentFromRole = (roleName: string): string => {
    const departmentMapping = {
      "Dealer Staff": "Đại lý",
      "Dealer Manager": "Quản lý đại lý",
      "EVM Staff": "EVM"
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

      console.log('📋 Sending register data:', {
        ...registerData,
        password: '***hidden***'
      });

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
    error,
    success,
    
    // Actions
    setSearchTerm,
    setShowAddModal,
    handleAddStaff,
    handleInputChange,
    handleSaveNewStaff,
    handleDeleteStaff,
    handleToggleStatus,
    getAvailableRoles,
  };
};
