import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Space,
  Typography,
  Tag,
  Modal,
  Form,
  InputNumber,
  Switch,
  Row,
  Col,
  Statistic,
  Transfer
} from 'antd';
import { AdminLayout } from '../admin/AdminLayout';
import Swal from 'sweetalert2';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  GiftOutlined,
  PercentageOutlined,
  DollarOutlined,
  CalendarOutlined,
  UserOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ShareAltOutlined
} from '@ant-design/icons';
import { get, post, put, del } from '../../../services/httpClient';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';

const { Title, Text } = Typography;

interface Promotion {
  _id: string;
  name: string;
  type: 'service' | 'gift'; // Backend chỉ hỗ trợ 2 loại này
  value: number;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  is_deleted: boolean;
  dealerships: string[]; // Array of dealership IDs
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

interface Dealer {
  _id: string;
  company_name: string;
  name?: string; // Fallback compatibility
  email?: string;
  phone?: string;
  address?: string | {
    street?: string;
    district?: string;
    city?: string;
    province?: string;
    full_address?: string;
  };
  code?: string;
  isActive?: boolean;
}

const PromotionManagement: React.FC = () => {
  // Add CSS to ensure dropdowns work
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .ant-select-dropdown {
        z-index: 9999 !important;
      }
      .ant-picker-dropdown {
        z-index: 9999 !important;
      }
      .ant-popover {
        z-index: 9999 !important;
        opacity: 1 !important;
      }
      .ant-popconfirm {
        z-index: 9999 !important;
      }
      .ant-popover-inner {
        border-radius: 8px !important;
        box-shadow: 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05) !important;
      }
      .ant-table-tbody > tr > td {
        position: relative;
        overflow: visible !important;
      }
      .ant-table-tbody > tr {
        position: relative;
        overflow: visible !important;
      }
      .ant-table {
        overflow: visible !important;
      }
      .ant-popover-placement-top,
      .ant-popover-placement-topLeft,
      .ant-popover-placement-topRight {
        transform-origin: 50% 100% !important;
      }
      .ant-popover-arrow {
        display: block !important;
      }
      /* Disable animation để tránh "chạy lung tung" */
      .ant-popover {
        transition: none !important;
        animation: none !important;
      }
      .ant-popover-inner {
        transition: none !important;
        animation: none !important;
      }
      
      /* SweetAlert2 Custom Styling */
      .swal-popup {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
      }
      .swal-title {
        color: #262626 !important;
        font-size: 18px !important;
        font-weight: 600 !important;
      }
      .swal-content {
        color: #595959 !important;
        font-size: 14px !important;
      }
      .swal-confirm-btn {
        background-color: #ff4d4f !important;
        border: none !important;
        border-radius: 6px !important;
        font-weight: 500 !important;
        padding: 8px 15px !important;
      }
      .swal-cancel-btn {
        background-color: #f5f5f5 !important;
        color: #595959 !important;
        border: 1px solid #d9d9d9 !important;
        border-radius: 6px !important;
        font-weight: 500 !important;
        padding: 8px 15px !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  // States
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

  // Modal states
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [isDistributeModalVisible, setIsDistributeModalVisible] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);

  // Form instances
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  // Distribution states
  const [targetKeys, setTargetKeys] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [dealerLoading, setDealerLoading] = useState(false);

  // Statistics
  const [statistics, setStatistics] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    expired: 0
  });

  // Fetch data on mount
  useEffect(() => {
    fetchPromotions();
    fetchDealers();
  }, []);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const response = await get('/api/promotions');
      
      if (response && response.success) {
        // Backend trả về data theo cấu trúc pagination
        let promotions = [];
        
        if (response.data && response.data.data && Array.isArray(response.data.data)) {
          promotions = response.data.data;
        } else if (response.data && Array.isArray(response.data)) {
          promotions = response.data;
        } else if (Array.isArray(response)) {
          promotions = response;
        }
        
        // Lọc bỏ các promotion đã bị xóa
        const activePromotions = promotions.filter((promo: Promotion) => !promo.is_deleted);
        
        setPromotions(activePromotions);
        calculateStatistics(activePromotions);
      } else {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: 'Lỗi',
          text: response?.message || 'Không thể tải danh sách khuyến mãi',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true
        });
        setPromotions([]);
        calculateStatistics([]);
      }
    } catch (error: any) {
      console.error('Error fetching promotions:', error);
      
      if (error.response?.status === 401) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: 'Lỗi',
          text: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true
        });
      } else if (error.response?.status === 403) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: 'Lỗi',
          text: 'Bạn không có quyền truy cập chức năng này.',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true
        });
      } else {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: 'Lỗi',
          text: error.response?.data?.message || 'Có lỗi xảy ra khi tải danh sách khuyến mãi',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true
        });
      }
      
      setPromotions([]);
      calculateStatistics([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDealers = async () => {
    try {
      setDealerLoading(true);
      console.log('Fetching dealers from API...');
      
      // Using same API call structure as DealerManagement.tsx
      const res = await get<{ success: boolean; data: { data: Dealer[] } }>('/api/dealerships');
      console.log('API Response:', res);
      
      if (res.success && Array.isArray(res.data.data)) {
        const dealerData = res.data.data;
        console.log(`Fetched ${dealerData.length} dealers from API`);
        
        // Map the dealer data to match our interface
        const mappedDealers = dealerData.map((dealer: any) => ({
          _id: dealer._id,
          company_name: dealer.company_name || dealer.name || 'Tên không xác định',
          name: dealer.name, // Keep for fallback compatibility
          code: dealer.code,
          email: dealer.email,
          phone: dealer.phone,
          address: dealer.address,
          isActive: dealer.isActive
        }));
        
        setDealers(mappedDealers);
        console.log('Mapped dealers:', mappedDealers);
      } else {
        // If API returned no data, show message but don't use fallback
        console.log('API returned no dealers');
        setDealers([]);
        toast.info('Hệ thống chưa có đại lý nào. Vui lòng thêm đại lý mới.');
      }
    } catch (error: any) {
      console.error('Error fetching dealers:', error);
      setDealers([]);
      
      if (error.response?.status === 401) {
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      } else if (error.response?.status === 403) {
        toast.error('Bạn không có quyền truy cập danh sách đại lý.');
      } else {
        toast.error('Không thể tải danh sách đại lý. Vui lòng thử lại.');
      }
    } finally {
      setDealerLoading(false);
    }
  };

  const calculateStatistics = (data: Promotion[]) => {
    const now = new Date();
    const stats = {
      total: data.length,
      active: data.filter(p => p.is_active).length,
      inactive: data.filter(p => !p.is_active).length,
      expired: data.filter(p => p.end_date && new Date(p.end_date) < now).length
    };
    setStatistics(stats);
  };

  // CRUD Operations
  const handleCreatePromotion = async (values: any) => {
    try {
      setLoading(true);
      const promotionData = {
        name: values.name,
        type: values.type,
        value: values.value,
        is_active: values.is_active ?? true,
        ...(values.startDate && { start_date: dayjs(values.startDate).toISOString() }),
        ...(values.endDate && { end_date: dayjs(values.endDate).toISOString() }),
      };

      const response = await post('/api/promotions', promotionData);
      
      if (response.success) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Thành công',
          text: 'Tạo khuyến mãi thành công!',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true
        });
        setIsCreateModalVisible(false);
        createForm.resetFields();
        fetchPromotions();
      } else {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: 'Lỗi',
          text: response.message || 'Có lỗi xảy ra khi tạo khuyến mãi',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true
        });
      }
    } catch (error: any) {
      console.error('Error creating promotion:', error);
      if (error.response?.status === 403) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: 'Lỗi',
          text: 'Bạn không có quyền tạo khuyến mãi',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true
        });
      } else {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: 'Lỗi',
          text: error.response?.data?.message || error.message || 'Có lỗi xảy ra khi tạo khuyến mãi',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditPromotion = async (values: any) => {
    if (!selectedPromotion) return;

    try {
      setLoading(true);
      const promotionData = {
        name: values.name,
        type: values.type,
        value: values.value,
        is_active: values.is_active,
        ...(values.startDate && { start_date: dayjs(values.startDate).toISOString() }),
        ...(values.endDate && { end_date: dayjs(values.endDate).toISOString() }),
      };

      const response = await put(`/api/promotions/${selectedPromotion._id}`, promotionData);
      
      if (response.success) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Thành công',
          text: 'Cập nhật khuyến mãi thành công!',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true
        });
        setIsEditModalVisible(false);
        editForm.resetFields();
        setSelectedPromotion(null);
        fetchPromotions();
      } else {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: 'Lỗi',
          text: response.message || 'Có lỗi xảy ra khi cập nhật khuyến mãi',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true
        });
      }
    } catch (error: any) {
      console.error('Error updating promotion:', error);
      if (error.response?.status === 403) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: 'Lỗi',
          text: 'Bạn không có quyền cập nhật khuyến mãi',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true
        });
      } else if (error.response?.status === 404) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: 'Lỗi',
          text: 'Không tìm thấy khuyến mãi',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true
        });
      } else {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: 'Lỗi',
          text: error.response?.data?.message || error.message || 'Có lỗi xảy ra khi cập nhật khuyến mãi',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePromotion = async (id: string) => {
    try {
      setDeletingIds(prev => new Set(prev).add(id));
      const response = await del(`/api/promotions/${id}`);
      
      if (response.success) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Thành công',
          text: 'Xóa khuyến mãi thành công!',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true
        });
        fetchPromotions();
      } else {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: 'Lỗi',
          text: response.message || 'Có lỗi xảy ra khi xóa khuyến mãi',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true
        });
      }
    } catch (error: any) {
      console.error('Error deleting promotion:', error);
      if (error.response?.status === 403) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: 'Lỗi',
          text: 'Bạn không có quyền xóa khuyến mãi',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true
        });
      } else if (error.response?.status === 404) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: 'Lỗi',
          text: 'Không tìm thấy khuyến mãi',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true
        });
      } else {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: 'Lỗi',
          text: error.response?.data?.message || error.message || 'Có lỗi xảy ra khi xóa khuyến mãi',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true
        });
      }
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const confirmDeletePromotion = async (id: string, name: string) => {
    const result = await Swal.fire({
      title: 'Xác nhận xóa khuyến mãi?',
      text: `Bạn có chắc chắn muốn xóa khuyến mãi "${name}"? Hành động này không thể hoàn tác!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ff4d4f',
      cancelButtonColor: '#d9d9d9',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy',
      reverseButtons: true,
      customClass: {
        popup: 'swal-popup',
        title: 'swal-title',
        htmlContainer: 'swal-content',
        confirmButton: 'swal-confirm-btn',
        cancelButton: 'swal-cancel-btn'
      }
    });

    if (result.isConfirmed) {
      await handleDeletePromotion(id);
    }
  };

  const handleToggleStatus = async (promotion: Promotion) => {
    try {
      setLoading(true);
      const newStatus = !promotion.is_active;
      
      const response = await put(`/api/promotions/${promotion._id}`, {
        name: promotion.name,
        type: promotion.type,
        value: promotion.value,
        is_active: newStatus,
        ...(promotion.start_date && { start_date: promotion.start_date }),
        ...(promotion.end_date && { end_date: promotion.end_date }),
      });
      
      if (response.success) {
        toast.success(`${newStatus ? 'Kích hoạt' : 'Tạm dừng'} khuyến mãi thành công!`);
        fetchPromotions();
      } else {
        toast.error(response.message || 'Có lỗi xảy ra khi cập nhật trạng thái');
      }
    } catch (error: any) {
      console.error('Error toggling promotion status:', error);
      toast.error(error.response?.data?.message || error.message || 'Có lỗi xảy ra khi cập nhật trạng thái');
    } finally {
      setLoading(false);
    }
  };

  // Modal handlers
  const showCreateModal = () => {
    setIsCreateModalVisible(true);
  };

  const showEditModal = (promotion: Promotion) => {
    setSelectedPromotion(promotion);
    editForm.setFieldsValue({
      name: promotion.name,
      type: promotion.type,
      value: promotion.value,
      is_active: promotion.is_active,
      startDate: promotion.start_date ? dayjs(promotion.start_date).format('YYYY-MM-DDTHH:mm') : '',
      endDate: promotion.end_date ? dayjs(promotion.end_date).format('YYYY-MM-DDTHH:mm') : ''
    });
    setIsEditModalVisible(true);
  };

  const showViewModal = (promotion: Promotion) => {
    setSelectedPromotion(promotion);
    setIsViewModalVisible(true);
  };

  const showDistributeModal = (promotion: Promotion) => {
    setSelectedPromotion(promotion);
    
    // Load đại lý đã được phân bổ trước đó vào targetKeys
    const currentlyAssignedDealers = promotion.dealerships || [];
    console.log('Currently assigned dealers:', currentlyAssignedDealers);
    
    // Convert dealer IDs to Transfer component format
    const targetKeysFormatted = currentlyAssignedDealers.map((dealerId, index) => 
      `dealer-${dealerId}-${index}`
    );
    console.log('Formatted target keys:', targetKeysFormatted);
    
    setTargetKeys(targetKeysFormatted);
    setSelectedKeys([]);
    setIsDistributeModalVisible(true);
    
    // Refresh dealers when opening the modal to ensure we have latest data
    if (dealers.length === 0) {
      fetchDealers();
    }
  };

  const refreshDealers = () => {
    console.log('Refreshing dealers...');
    fetchDealers();
  };

  // Distribution handler - sử dụng API assign đúng theo backend
  const handleDistributePromotion = async () => {
    if (!selectedPromotion || targetKeys.length === 0) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'warning',
        title: 'Cảnh báo',
        text: 'Vui lòng chọn ít nhất một đại lý',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      });
      return;
    }

    try {
      setLoading(true);
      
      // Extract dealer IDs from targetKeys (format: dealer-${dealer._id}-${index})
      const dealerIds = targetKeys.map(key => {
        // Extract dealer ID from key format: dealer-${dealer._id}-${index}
        const match = key.match(/^dealer-(.+)-(\d+)$/);
        return match ? match[1] : key; // Fallback to original key if format doesn't match
      });
      
      console.log('Sending dealer IDs to API:', dealerIds);
      
      // Sử dụng API assign theo backend
      const response = await post(`/api/promotions/${selectedPromotion._id}/assign`, {
        dealerships: dealerIds
      });
      
      if (response.success) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Thành công',
          text: `Đã phân bổ khuyến mãi "${selectedPromotion.name}" cho ${targetKeys.length} đại lý thành công!`,
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true
        });
        setIsDistributeModalVisible(false);
        setTargetKeys([]);
        setSelectedKeys([]);
        // Refresh danh sách promotion để hiển thị thông tin mới
        fetchPromotions();
      } else {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: 'Lỗi',
          text: response.message || 'Có lỗi xảy ra khi phân bổ khuyến mãi',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true
        });
      }
    } catch (error: any) {
      console.error('Error distributing promotion:', error);
      
      if (error.response?.status === 400) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: 'Lỗi',
          text: 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true
        });
      } else if (error.response?.status === 403) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: 'Lỗi',
          text: 'Bạn không có quyền phân bổ khuyến mãi.',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true
        });
      } else if (error.response?.status === 404) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: 'Lỗi',
          text: 'Không tìm thấy khuyến mãi.',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true
        });
      } else {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: 'Lỗi',
          text: error.response?.data?.message || 'Có lỗi xảy ra khi phân bổ khuyến mãi',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const getFilteredPromotions = () => {
    let filtered = promotions;

    // Search filter
    if (searchText) {
      filtered = filtered.filter(promotion =>
        promotion.name.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(promotion => {
        if (statusFilter === 'active') return promotion.is_active;
        if (statusFilter === 'inactive') return !promotion.is_active;
        if (statusFilter === 'expired') {
          return promotion.end_date && new Date(promotion.end_date) < new Date();
        }
        return true;
      });
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(promotion => promotion.type === typeFilter);
    }

    // Date range filter
    if (dateRange && dateRange[0] && dateRange[1]) {
      filtered = filtered.filter(promotion => {
        if (!promotion.start_date) return false;
        const startDate = new Date(promotion.start_date);
        return startDate >= dateRange[0]!.toDate() && startDate <= dateRange[1]!.toDate();
      });
    }

    return filtered;
  };

  // Utility functions
  const getPromotionTypeIcon = (type: string) => {
    switch (type) {
      case 'percent': return <PercentageOutlined />;
      case 'amount': return <DollarOutlined />;
      case 'service': return <UserOutlined />;
      case 'gift': return <GiftOutlined />;
      default: return <GiftOutlined />;
    }
  };

  const getPromotionTypeText = (type: string) => {
    switch (type) {
      case 'service': return 'Dịch vụ';
      case 'gift': return 'Quà tặng';
      default: return type;
    }
  };

  const getPromotionValue = (promotion: Promotion) => {
    // Backend chỉ hỗ trợ service và gift, không có percent/amount
    return promotion.value.toString();
  };

  const getPromotionStatus = (promotion: Promotion) => {
    const now = new Date();
    const endDate = promotion.end_date ? new Date(promotion.end_date) : null;
    
    if (!promotion.is_active) {
      return <Tag color="red">Tạm dừng</Tag>;
    }
    
    if (endDate && endDate < now) {
      return <Tag color="orange">Hết hạn</Tag>;
    }
    
    return <Tag color="green">Đang hoạt động</Tag>;
  };

  // Table columns
  const columns = [
    {
      title: 'Tên khuyến mãi',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Promotion) => (
        <div>
          <Text strong>{text}</Text>
          <br />
          <Text type="secondary" className="text-xs">
            ID: {record._id.slice(-8)}
          </Text>
        </div>
      ),
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag icon={getPromotionTypeIcon(type)} color="blue">
          {getPromotionTypeText(type)}
        </Tag>
      ),
    },
    {
      title: 'Giá trị',
      dataIndex: 'value',
      key: 'value',
      render: (_: number, record: Promotion) => (
        <Text strong className="text-blue-600">
          {getPromotionValue(record)}
        </Text>
      ),
    },
    {
      title: 'Thời gian',
      key: 'duration',
      render: (record: Promotion) => (
        <div>
          {record.start_date && (
            <div>
              <CalendarOutlined /> {dayjs(record.start_date).format('DD/MM/YYYY')}
            </div>
          )}
          {record.end_date && (
            <div>
              <CalendarOutlined /> {dayjs(record.end_date).format('DD/MM/YYYY')}
            </div>
          )}
          {!record.start_date && !record.end_date && (
            <Text type="secondary">Không giới hạn</Text>
          )}
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (record: Promotion) => getPromotionStatus(record),
    },
    {
      title: 'Đại lý',
      key: 'dealers',
      render: (record: Promotion) => {
        const dealerCount = record.dealerships?.length || 0;
        return (
          <div>
            {dealerCount > 0 ? (
              <Tag color="blue" icon={<UserOutlined />}>
                {dealerCount} đại lý
              </Tag>
            ) : (
              <Tag color="default">Chưa phân bổ</Tag>
            )}
          </div>
        );
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (record: Promotion) => (
        <Space>
          <div className="relative group">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => showViewModal(record)}
            />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
              Xem chi tiết
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
            </div>
          </div>
          <div className="relative group">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => showEditModal(record)}
            />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
              Chỉnh sửa
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
            </div>
          </div>
          <div className="relative group">
            <Button
              type="text"
              icon={record.is_active ? <CloseCircleOutlined /> : <CheckCircleOutlined />}
              onClick={() => handleToggleStatus(record)}
              className={record.is_active ? 'text-red-500' : 'text-green-500'}
            />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
              {record.is_active ? 'Tạm dừng' : 'Kích hoạt'}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
            </div>
          </div>
          <div className="relative group">
            <Button
              type="text"
              icon={<ShareAltOutlined />}
              onClick={() => showDistributeModal(record)}
              disabled={!record.is_active}
            />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
              Phân bổ cho đại lý
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
            </div>
          </div>
          <div className="relative group">
            <Button
              type="text"
              icon={<DeleteOutlined />}
              danger
              loading={deletingIds.has(record._id)}
              onClick={() => confirmDeletePromotion(record._id, record.name)}
            />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
              Xóa khuyến mãi
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
            </div>
          </div>
        </Space>
      ),
    },
  ];

  return (
    <AdminLayout activeSection="promotion-management">
      <div className="bg-gray-50">
        {/* Header */}
        <div className="mb-6">
          <Title level={2}>
            <GiftOutlined className="mr-2 text-blue-600" />
            Quản lý khuyến mãi
          </Title>
          <Text type="secondary">Tạo, cập nhật và phân bổ khuyến mãi cho hệ thống</Text>
        </div>

      {/* Statistics */}
      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card>
            <Statistic
              title="Tổng khuyến mãi"
              value={statistics.total}
              prefix={<GiftOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Đang hoạt động"
              value={statistics.active}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tạm dừng"
              value={statistics.inactive}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Hết hạn"
              value={statistics.expired}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="mb-6">
        <Row gutter={16} align="middle">
          <Col span={6}>
            <Input
              placeholder="Tìm kiếm khuyến mãi..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col span={4}>
            <select
              className="w-full h-8 rounded border border-gray-300 px-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tất cả</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Tạm dừng</option>
              <option value="expired">Hết hạn</option>
            </select>
          </Col>
          <Col span={4}>
            <select
              className="w-full h-8 rounded border border-gray-300 px-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">Tất cả loại</option>
              <option value="service">Dịch vụ</option>
              <option value="gift">Quà tặng</option>
            </select>
          </Col>
          <Col span={6}>
            <div className="flex gap-1 items-center">
              <input
                type="date"
                className="flex-1 h-8 rounded border border-gray-300 px-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Từ ngày"
                value={dateRange && dateRange[0] ? dateRange[0].format('YYYY-MM-DD') : ''}
                onChange={(e) => {
                  const newStartDate = e.target.value ? dayjs(e.target.value) : null;
                  setDateRange([newStartDate, dateRange && dateRange[1] ? dateRange[1] : null]);
                }}
              />
              <span className="text-gray-500 text-xs">đến</span>
              <input
                type="date"
                className="flex-1 h-8 rounded border border-gray-300 px-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Đến ngày"
                value={dateRange && dateRange[1] ? dateRange[1].format('YYYY-MM-DD') : ''}
                onChange={(e) => {
                  const newEndDate = e.target.value ? dayjs(e.target.value) : null;
                  setDateRange([dateRange && dateRange[0] ? dateRange[0] : null, newEndDate]);
                }}
              />
            </div>
          </Col>
          <Col span={4}>
            <Space>
              <Button
                icon={<PlusOutlined />}
                type="primary"
                onClick={showCreateModal}
              >
                Tạo khuyến mãi
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchPromotions}
                loading={loading}
              >
                Làm mới
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={getFilteredPromotions()}
          rowKey="_id"
          loading={loading}
          scroll={{ x: 'max-content' }}
          className="overflow-visible"
          pagination={{
            total: getFilteredPromotions().length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} khuyến mãi`,
          }}
        />
      </Card>

      {/* Create Modal */}
      <Modal
        title="Tạo khuyến mãi mới"
        open={isCreateModalVisible}
        onCancel={() => {
          setIsCreateModalVisible(false);
          createForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreatePromotion}
        >
          <Form.Item
            name="name"
            label="Tên khuyến mãi"
            rules={[{ required: true, message: 'Vui lòng nhập tên khuyến mãi' }]}
          >
            <Input placeholder="Nhập tên khuyến mãi" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="type"
                label="Loại khuyến mãi"
                rules={[{ required: true, message: 'Vui lòng chọn loại khuyến mãi' }]}
              >
                <select
                  className="w-full h-8 rounded border border-gray-300 px-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onChange={(e) => createForm.setFieldsValue({ type: e.target.value })}
                >
                  <option value="">Chọn loại khuyến mãi</option>
                  <option value="service">Dịch vụ</option>
                  <option value="gift">Quà tặng</option>
                </select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="value"
                label="Giá trị"
                rules={[{ required: true, message: 'Vui lòng nhập giá trị' }]}
              >
                <InputNumber
                  placeholder="Nhập giá trị"
                  className="w-full"
                  min={0}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="startDate"
                label="Ngày bắt đầu"
              >
                <input
                  type="datetime-local"
                  className="w-full h-8 rounded border border-gray-300 px-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onChange={(e) => {
                    createForm.setFieldsValue({ startDate: e.target.value });
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="endDate"
                label="Ngày kết thúc"
              >
                <input
                  type="datetime-local"
                  className="w-full h-8 rounded border border-gray-300 px-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onChange={(e) => {
                    createForm.setFieldsValue({ endDate: e.target.value });
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="is_active"
            label="Trạng thái"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch checkedChildren="Hoạt động" unCheckedChildren="Tạm dừng" />
          </Form.Item>

          <Form.Item className="mb-0 text-right">
            <Space>
              <Button onClick={() => {
                setIsCreateModalVisible(false);
                createForm.resetFields();
              }}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Tạo khuyến mãi
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        title="Chỉnh sửa khuyến mãi"
        open={isEditModalVisible}
        onCancel={() => {
          setIsEditModalVisible(false);
          editForm.resetFields();
          setSelectedPromotion(null);
        }}
        footer={null}
        width={600}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEditPromotion}
        >
          <Form.Item
            name="name"
            label="Tên khuyến mãi"
            rules={[{ required: true, message: 'Vui lòng nhập tên khuyến mãi' }]}
          >
            <Input placeholder="Nhập tên khuyến mãi" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="type"
                label="Loại khuyến mãi"
                rules={[{ required: true, message: 'Vui lòng chọn loại khuyến mãi' }]}
              >
                <select
                  className="w-full h-8 rounded border border-gray-300 px-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  defaultValue={selectedPromotion?.type || ''}
                  onChange={(e) => editForm.setFieldsValue({ type: e.target.value })}
                >
                  <option value="">Chọn loại khuyến mãi</option>
                  <option value="service">Dịch vụ</option>
                  <option value="gift">Quà tặng</option>
                </select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="value"
                label="Giá trị"
                rules={[{ required: true, message: 'Vui lòng nhập giá trị' }]}
              >
                <InputNumber
                  placeholder="Nhập giá trị"
                  className="w-full"
                  min={0}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="startDate"
                label="Ngày bắt đầu"
              >
                <input
                  type="datetime-local"
                  className="w-full h-8 rounded border border-gray-300 px-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  defaultValue={selectedPromotion?.start_date ? dayjs(selectedPromotion.start_date).format('YYYY-MM-DDTHH:mm') : ''}
                  onChange={(e) => {
                    editForm.setFieldsValue({ startDate: e.target.value });
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="endDate"
                label="Ngày kết thúc"
              >
                <input
                  type="datetime-local"
                  className="w-full h-8 rounded border border-gray-300 px-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  defaultValue={selectedPromotion?.end_date ? dayjs(selectedPromotion.end_date).format('YYYY-MM-DDTHH:mm') : ''}
                  onChange={(e) => {
                    editForm.setFieldsValue({ endDate: e.target.value });
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="is_active"
            label="Trạng thái"
            valuePropName="checked"
          >
            <Switch checkedChildren="Hoạt động" unCheckedChildren="Tạm dừng" />
          </Form.Item>

          <Form.Item className="mb-0 text-right">
            <Space>
              <Button onClick={() => {
                setIsEditModalVisible(false);
                editForm.resetFields();
                setSelectedPromotion(null);
              }}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Cập nhật
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* View Modal */}
      <Modal
        title="Chi tiết khuyến mãi"
        open={isViewModalVisible}
        onCancel={() => {
          setIsViewModalVisible(false);
          setSelectedPromotion(null);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setIsViewModalVisible(false);
            setSelectedPromotion(null);
          }}>
            Đóng
          </Button>
        ]}
        width={600}
      >
        {selectedPromotion && (
          <div>
            <Row gutter={16}>
              <Col span={12}>
                <Card size="small" title="Thông tin cơ bản">
                  <p><strong>Tên:</strong> {selectedPromotion.name}</p>
                  <p><strong>Loại:</strong> {getPromotionTypeText(selectedPromotion.type)}</p>
                  <p><strong>Giá trị:</strong> {getPromotionValue(selectedPromotion)}</p>
                  <p><strong>Trạng thái:</strong> {getPromotionStatus(selectedPromotion)}</p>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="Thời gian">
                  <p><strong>Bắt đầu:</strong> {selectedPromotion.start_date ? dayjs(selectedPromotion.start_date).format('DD/MM/YYYY HH:mm') : 'Không giới hạn'}</p>
                  <p><strong>Kết thúc:</strong> {selectedPromotion.end_date ? dayjs(selectedPromotion.end_date).format('DD/MM/YYYY HH:mm') : 'Không giới hạn'}</p>
                  <p><strong>Tạo lúc:</strong> {selectedPromotion.createdAt ? dayjs(selectedPromotion.createdAt).format('DD/MM/YYYY HH:mm') : 'N/A'}</p>
                  <p><strong>Cập nhật:</strong> {selectedPromotion.updatedAt ? dayjs(selectedPromotion.updatedAt).format('DD/MM/YYYY HH:mm') : 'N/A'}</p>
                </Card>
              </Col>
            </Row>

            {/* Thông tin đại lý được phân bổ */}
            {selectedPromotion.dealerships && selectedPromotion.dealerships.length > 0 && (
              <Card size="small" title={`Đại lý được phân bổ (${selectedPromotion.dealerships.length})`} className="mt-4">
                <div className="max-h-48 overflow-y-auto">
                  {selectedPromotion.dealerships.map((dealerId) => {
                    const dealer = dealers.find(d => d._id === dealerId);
                    return (
                      <div key={dealerId} className="p-3 mb-3 bg-gray-50 rounded border border-gray-200">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="mb-2">
                              <Text strong className="text-base">
                                {dealer?.company_name || dealer?.name || 'Tên không xác định'}
                              </Text>
                              <Text type="secondary" className="ml-2">
                                ({dealer?.code || 'N/A'})
                              </Text>
                            </div>
                            <div className="space-y-1">
                              {dealer?.email && (
                                <div className="text-sm text-gray-600">
                                  <Text type="secondary">Email: </Text>
                                  <Text>{dealer.email}</Text>
                                </div>
                              )}
                              {dealer?.phone && (
                                <div className="text-sm text-gray-600">
                                  <Text type="secondary">Điện thoại: </Text>
                                  <Text>{dealer.phone}</Text>
                                </div>
                              )}
                              {dealer?.address && (
                                <div className="text-sm text-gray-600">
                                  <Text type="secondary">Địa chỉ: </Text>
                                  <Text>
                                    {typeof dealer.address === 'string' 
                                      ? dealer.address 
                                      : dealer.address?.full_address || 
                                        `${dealer.address?.street || ''}, ${dealer.address?.district || ''}, ${dealer.address?.city || ''}, ${dealer.address?.province || ''}`.replace(/^,\s*|,\s*$/g, '').replace(/,\s*,/g, ',')
                                    }
                                  </Text>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <Tag color={dealer?.isActive ? 'green' : 'red'}>
                              {dealer?.isActive ? 'Hoạt động' : 'Tạm dừng'}
                            </Tag>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {(!selectedPromotion.dealerships || selectedPromotion.dealerships.length === 0) && (
              <Card size="small" title="Đại lý được phân bổ" className="mt-4">
                <div className="text-center p-5 text-gray-500">
                  <UserOutlined className="text-2xl mb-2" />
                  <div>Chưa có đại lý nào được phân bổ khuyến mãi này</div>
                </div>
              </Card>
            )}
          </div>
        )}
      </Modal>

      {/* Distribute Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <ShareAltOutlined className="text-blue-600" />
            Phân bổ khuyến mãi cho đại lý
          </div>
        }
        open={isDistributeModalVisible}
        onCancel={() => {
          setIsDistributeModalVisible(false);
          setSelectedPromotion(null);
          setTargetKeys([]);
          setSelectedKeys([]);
        }}
        onOk={handleDistributePromotion}
        width={900}
        okText={`Phân bổ cho ${targetKeys.length} đại lý`}
        cancelText="Hủy"
        confirmLoading={loading}
        okButtonProps={{
          disabled: targetKeys.length === 0
        }}
      >
        {selectedPromotion && (
          <div>
            {/* Promotion Info */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <Row gutter={16}>
                <Col span={12}>
                  <div>
                    <Text strong className="text-gray-700">Tên khuyến mãi:</Text>
                    <br />
                    <Text className="text-base font-medium text-blue-600">
                      {selectedPromotion.name}
                    </Text>
                  </div>
                </Col>
                <Col span={12}>
                  <div>
                    <Text strong className="text-gray-700">Giá trị:</Text>
                    <br />
                    <Text className="text-base font-medium text-green-600">
                      {getPromotionValue(selectedPromotion)}
                    </Text>
                  </div>
                </Col>
              </Row>
              <div className="mt-3">
                <Text strong className="text-gray-700">Loại:</Text>
                <Tag 
                  icon={getPromotionTypeIcon(selectedPromotion.type)} 
                  color="blue" 
                  className="ml-2"
                >
                  {getPromotionTypeText(selectedPromotion.type)}
                </Tag>
              </div>
            </div>
            
            {/* Transfer Component */}
            {dealerLoading ? (
              <div className="text-center p-10">
                <Text>Đang tải danh sách đại lý...</Text>
              </div>
            ) : dealers.length === 0 ? (
              <div className="text-center p-10">
                <div className="text-5xl text-gray-300 mb-4">
                  🏢
                </div>
                <Text type="secondary" className="text-base block mb-2">
                  Chưa có đại lý nào trong hệ thống
                </Text>
                <Text type="secondary" className="text-sm block mb-6">
                  Vui lòng thêm đại lý mới để có thể phân bổ khuyến mãi
                </Text>
                <Space>
                  <Button 
                    type="primary" 
                    onClick={refreshDealers}
                    icon={<ReloadOutlined />}
                    loading={dealerLoading}
                  >
                    Tải lại danh sách
                  </Button>
                  <Button 
                    onClick={() => {
                      window.open('/admin/dealer-management', '_blank');
                    }}
                    icon={<ShareAltOutlined />}
                  >
                    Quản lý đại lý
                  </Button>
                </Space>
              </div>
            ) : (
              <Transfer
                dataSource={dealers.map((dealer, index) => ({
                  key: `dealer-${dealer._id}-${index}`,
                  title: dealer.company_name || dealer.name || 'Tên không xác định',
                  description: `${dealer.code || 'N/A'} - ${dealer.email || 'N/A'} - ${dealer.phone || 'N/A'}`,
                  disabled: !dealer.isActive,
                  dealerId: dealer._id // Thêm dealerId để tracking
                }))}
                titles={[
                  `Danh sách đại lý (${dealers.length})`, 
                  `Đại lý được chọn (${targetKeys.length})`
                ]}
                targetKeys={targetKeys}
                selectedKeys={selectedKeys}
                onChange={(keys) => setTargetKeys(keys as string[])}
                onSelectChange={(sourceSelectedKeys, targetSelectedKeys) => {
                  setSelectedKeys([...sourceSelectedKeys, ...targetSelectedKeys] as string[]);
                }}
                render={item => (
                  <div style={{ padding: '4px 0' }}>
                    <div style={{ fontWeight: 500, color: item.disabled ? '#bfbfbf' : '#262626' }}>
                      {item.title}
                      {item.disabled && <Text type="secondary"> (Không hoạt động)</Text>}
                    </div>
                    <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                      {item.description}
                    </div>
                  </div>
                )}
                listStyle={{
                  width: 350,
                  height: 350,
                }}
                showSearch
                filterOption={(inputValue, option) =>
                  (option.title || '').toLowerCase().includes(inputValue.toLowerCase()) ||
                  (option.description || '').toLowerCase().includes(inputValue.toLowerCase())
                }
                locale={{
                  itemUnit: 'đại lý',
                  itemsUnit: 'đại lý'
                }}
                oneWay={false}
                showSelectAll={false}
              />
            )}
            
            {targetKeys.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                <Text className="text-blue-700">
                  ✓ Đã chọn {targetKeys.length} đại lý để phân bổ khuyến mãi
                </Text>
              </div>
            )}
          </div>
        )}
      </Modal>
      
      </div>
    </AdminLayout>
  );
};

export default PromotionManagement;
