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
  Tooltip,
  Transfer
} from 'antd';
import { AdminLayout } from '../admin/AdminLayout';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
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

const { Title, Text } = Typography;

interface Promotion {
  _id: string;
  name: string;
  type: 'percent' | 'amount' | 'service' | 'gift';
  value: number;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  createdAt?: string;
  updatedAt?: string;
  description?: string;
  __v?: number;
  assigned_dealers?: Array<{
    dealer_id: string;
    dealer_name: string;
    dealer_code: string;
    assigned_date: string;
    is_active: boolean;
  }>;
}

interface Dealer {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
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
        let promotions = [];
        
        if (response.data && response.data.data && Array.isArray(response.data.data)) {
          promotions = response.data.data;
        } else if (response.data && response.data.items && Array.isArray(response.data.items)) {
          promotions = response.data.items;
        } else if (response.data && Array.isArray(response.data)) {
          promotions = response.data;
        } else if (Array.isArray(response.items)) {
          promotions = response.items;
        } else if (Array.isArray(response)) {
          promotions = response;
        }
        
        setPromotions(promotions);
        calculateStatistics(promotions);
      } else {
        toast.error(response?.message || 'Không thể tải danh sách khuyến mãi');
        setPromotions([]);
        calculateStatistics([]);
      }
    } catch (error: any) {
      console.error('Error fetching promotions:', error);
      
      if (error.response?.status === 401) {
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      } else if (error.response?.status === 403) {
        toast.error('Bạn không có quyền truy cập chức năng này.');
      } else {
        toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi tải danh sách khuyến mãi');
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
          name: dealer.name,
          code: dealer.code,
          email: dealer.email,
          phone: dealer.phone,
          address: dealer.address,
          isActive: dealer.isActive
        }));
        
        setDealers(mappedDealers);
        toast.success(`Đã tải ${mappedDealers.length} đại lý từ hệ thống!`);
      } else {
        // If API returns no data, show message but don't use fallback
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
        toast.success('Tạo khuyến mãi thành công!');
        setIsCreateModalVisible(false);
        createForm.resetFields();
        fetchPromotions();
      } else {
        toast.error(response.message || 'Có lỗi xảy ra khi tạo khuyến mãi');
      }
    } catch (error: any) {
      console.error('Error creating promotion:', error);
      if (error.response?.status === 403) {
        toast.error('Bạn không có quyền tạo khuyến mãi');
      } else {
        toast.error(error.response?.data?.message || error.message || 'Có lỗi xảy ra khi tạo khuyến mãi');
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
        toast.success('Cập nhật khuyến mãi thành công!');
        setIsEditModalVisible(false);
        editForm.resetFields();
        setSelectedPromotion(null);
        fetchPromotions();
      } else {
        toast.error(response.message || 'Có lỗi xảy ra khi cập nhật khuyến mãi');
      }
    } catch (error: any) {
      console.error('Error updating promotion:', error);
      if (error.response?.status === 403) {
        toast.error('Bạn không có quyền cập nhật khuyến mãi');
      } else if (error.response?.status === 404) {
        toast.error('Không tìm thấy khuyến mãi');
      } else {
        toast.error(error.response?.data?.message || error.message || 'Có lỗi xảy ra khi cập nhật khuyến mãi');
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
        toast.success('Xóa khuyến mãi thành công!');
        fetchPromotions();
      } else {
        toast.error(response.message || 'Có lỗi xảy ra khi xóa khuyến mãi');
      }
    } catch (error: any) {
      console.error('Error deleting promotion:', error);
      if (error.response?.status === 403) {
        toast.error('Bạn không có quyền xóa khuyến mãi');
      } else if (error.response?.status === 404) {
        toast.error('Không tìm thấy khuyến mãi');
      } else {
        toast.error(error.response?.data?.message || error.message || 'Có lỗi xảy ra khi xóa khuyến mãi');
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
    const currentlyAssignedDealers = promotion.assigned_dealers?.map(d => d.dealer_id) || [];
    setTargetKeys(currentlyAssignedDealers);
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

  // Distribution handler
  const handleDistributePromotion = async () => {
    if (!selectedPromotion || targetKeys.length === 0) {
      toast.warning('Vui lòng chọn ít nhất một đại lý');
      return;
    }

    try {
      setLoading(true);
      
      // Tạo danh sách đại lý được phân bổ với metadata
      const assignedDealers = targetKeys.map(dealerId => {
        const dealer = dealers.find(d => d._id === dealerId);
        return {
          dealer_id: dealerId,
          dealer_name: dealer?.name || 'Unknown',
          dealer_code: dealer?.code || 'N/A',
          assigned_date: new Date().toISOString(),
          is_active: true
        };
      });

      // Cập nhật promotion với danh sách đại lý được phân bổ
      const updateData = {
        name: selectedPromotion.name,
        type: selectedPromotion.type,
        value: selectedPromotion.value,
        is_active: selectedPromotion.is_active,
        assigned_dealers: assignedDealers,
        ...(selectedPromotion.start_date && { start_date: selectedPromotion.start_date }),
        ...(selectedPromotion.end_date && { end_date: selectedPromotion.end_date })
      };

      console.log('Updating promotion with assigned dealers:', updateData);
      
      // Gọi API cập nhật promotion
      const response = await put(`/api/promotions/${selectedPromotion._id}`, updateData);
      
      if (response.success) {
        toast.success(`Đã phân bổ khuyến mãi "${selectedPromotion.name}" cho ${targetKeys.length} đại lý thành công!`);
        setIsDistributeModalVisible(false);
        setTargetKeys([]);
        setSelectedKeys([]);
        // Refresh danh sách promotion để hiển thị thông tin mới
        fetchPromotions();
      } else {
        toast.error(response.message || 'Có lỗi xảy ra khi phân bổ khuyến mãi');
      }
    } catch (error: any) {
      console.error('Error distributing promotion:', error);
      
      if (error.response?.status === 400) {
        toast.error('Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.');
      } else if (error.response?.status === 403) {
        toast.error('Bạn không có quyền phân bổ khuyến mãi.');
      } else if (error.response?.status === 404) {
        toast.error('Không tìm thấy khuyến mãi.');
      } else {
        toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi phân bổ khuyến mãi');
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
      case 'percent': return 'Giảm theo %';
      case 'amount': return 'Giảm tiền mặt';
      case 'service': return 'Dịch vụ';
      case 'gift': return 'Quà tặng';
      default: return type;
    }
  };

  const getPromotionValue = (promotion: Promotion) => {
    if (promotion.type === 'percent') {
      return `${promotion.value}%`;
    } else if (promotion.type === 'amount') {
      return `${promotion.value.toLocaleString('vi-VN')} VNĐ`;
    }
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
          <Text type="secondary" style={{ fontSize: '12px' }}>
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
        <Text strong style={{ color: '#1890ff' }}>
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
        const dealerCount = record.assigned_dealers?.length || 0;
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
          <Tooltip title="Xem chi tiết">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => showViewModal(record)}
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => showEditModal(record)}
            />
          </Tooltip>
          <Tooltip title={record.is_active ? 'Tạm dừng' : 'Kích hoạt'}>
            <Button
              type="text"
              icon={record.is_active ? <CloseCircleOutlined /> : <CheckCircleOutlined />}
              onClick={() => handleToggleStatus(record)}
              style={{ color: record.is_active ? '#ff4d4f' : '#52c41a' }}
            />
          </Tooltip>
          <Tooltip title="Phân bổ cho đại lý">
            <Button
              type="text"
              icon={<ShareAltOutlined />}
              onClick={() => showDistributeModal(record)}
              disabled={!record.is_active}
            />
          </Tooltip>
          <Tooltip title="Xóa khuyến mãi">
            <Button
              type="text"
              icon={<DeleteOutlined />}
              danger
              loading={deletingIds.has(record._id)}
              onClick={() => confirmDeletePromotion(record._id, record.name)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <AdminLayout activeSection="promotion-management">
      <div style={{ padding: '24px', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <Title level={2}>
            <GiftOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
            Quản lý khuyến mãi
          </Title>
          <Text type="secondary">Tạo, cập nhật và phân bổ khuyến mãi cho hệ thống</Text>
        </div>

      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
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
      <Card style={{ marginBottom: '24px' }}>
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
              style={{
                width: '100%',
                height: '32px',
                borderRadius: '4px',
                border: '1px solid #d9d9d9',
                padding: '0 8px',
                fontSize: '14px',
                backgroundColor: '#fff'
              }}
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
              style={{
                width: '100%',
                height: '32px',
                borderRadius: '4px',
                border: '1px solid #d9d9d9',
                padding: '0 8px',
                fontSize: '14px',
                backgroundColor: '#fff'
              }}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">Tất cả loại</option>
              <option value="percent">Giảm theo %</option>
              <option value="amount">Giảm tiền mặt</option>
              <option value="service">Dịch vụ</option>
              <option value="gift">Quà tặng</option>
            </select>
          </Col>
          <Col span={6}>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <input
                type="date"
                style={{
                  flex: 1,
                  height: '32px',
                  borderRadius: '4px',
                  border: '1px solid #d9d9d9',
                  padding: '0 8px',
                  fontSize: '14px',
                  backgroundColor: '#fff'
                }}
                placeholder="Từ ngày"
                value={dateRange && dateRange[0] ? dateRange[0].format('YYYY-MM-DD') : ''}
                onChange={(e) => {
                  const newStartDate = e.target.value ? dayjs(e.target.value) : null;
                  setDateRange([newStartDate, dateRange && dateRange[1] ? dateRange[1] : null]);
                }}
              />
              <span style={{ color: '#999', fontSize: '12px' }}>đến</span>
              <input
                type="date"
                style={{
                  flex: 1,
                  height: '32px',
                  borderRadius: '4px',
                  border: '1px solid #d9d9d9',
                  padding: '0 8px',
                  fontSize: '14px',
                  backgroundColor: '#fff'
                }}
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
          style={{ overflow: 'visible' }}
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
                  style={{
                    width: '100%',
                    height: '32px',
                    borderRadius: '4px',
                    border: '1px solid #d9d9d9',
                    padding: '0 8px',
                    fontSize: '14px',
                    backgroundColor: '#fff'
                  }}
                  onChange={(e) => createForm.setFieldsValue({ type: e.target.value })}
                >
                  <option value="">Chọn loại khuyến mãi</option>
                  <option value="percent">Giảm theo phần trăm (%)</option>
                  <option value="amount">Giảm tiền mặt (VNĐ)</option>
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
                  style={{ width: '100%' }}
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
                  style={{
                    width: '100%',
                    height: '32px',
                    borderRadius: '4px',
                    border: '1px solid #d9d9d9',
                    padding: '0 8px',
                    fontSize: '14px',
                    backgroundColor: '#fff'
                  }}
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
                  style={{
                    width: '100%',
                    height: '32px',
                    borderRadius: '4px',
                    border: '1px solid #d9d9d9',
                    padding: '0 8px',
                    fontSize: '14px',
                    backgroundColor: '#fff'
                  }}
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

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
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
                  style={{
                    width: '100%',
                    height: '32px',
                    borderRadius: '4px',
                    border: '1px solid #d9d9d9',
                    padding: '0 8px',
                    fontSize: '14px',
                    backgroundColor: '#fff'
                  }}
                  defaultValue={selectedPromotion?.type || ''}
                  onChange={(e) => editForm.setFieldsValue({ type: e.target.value })}
                >
                  <option value="">Chọn loại khuyến mãi</option>
                  <option value="percent">Giảm theo phần trăm (%)</option>
                  <option value="amount">Giảm tiền mặt (VNĐ)</option>
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
                  style={{ width: '100%' }}
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
                  style={{
                    width: '100%',
                    height: '32px',
                    borderRadius: '4px',
                    border: '1px solid #d9d9d9',
                    padding: '0 8px',
                    fontSize: '14px',
                    backgroundColor: '#fff'
                  }}
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
                  style={{
                    width: '100%',
                    height: '32px',
                    borderRadius: '4px',
                    border: '1px solid #d9d9d9',
                    padding: '0 8px',
                    fontSize: '14px',
                    backgroundColor: '#fff'
                  }}
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

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
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
            {selectedPromotion.assigned_dealers && selectedPromotion.assigned_dealers.length > 0 && (
              <Card size="small" title={`Đại lý được phân bổ (${selectedPromotion.assigned_dealers.length})`} style={{ marginTop: '16px' }}>
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {selectedPromotion.assigned_dealers.map((dealer) => (
                    <div key={dealer.dealer_id} style={{ 
                      padding: '8px 12px', 
                      marginBottom: '8px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '4px',
                      border: '1px solid #e9ecef'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <Text strong>{dealer.dealer_name}</Text>
                          <Text type="secondary" style={{ marginLeft: '8px' }}>({dealer.dealer_code})</Text>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div>
                            <Tag color={dealer.is_active ? 'green' : 'red'}>
                              {dealer.is_active ? 'Hoạt động' : 'Tạm dừng'}
                            </Tag>
                          </div>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {dayjs(dealer.assigned_date).format('DD/MM/YYYY HH:mm')}
                          </Text>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {selectedPromotion.assigned_dealers?.length === 0 && (
              <Card size="small" title="Đại lý được phân bổ" style={{ marginTop: '16px' }}>
                <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                  <UserOutlined style={{ fontSize: '24px', marginBottom: '8px' }} />
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShareAltOutlined style={{ color: '#1890ff' }} />
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
            <div style={{ 
              marginBottom: '24px', 
              padding: '16px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '8px',
              border: '1px solid #e9ecef'
            }}>
              <Row gutter={16}>
                <Col span={12}>
                  <div>
                    <Text strong style={{ color: '#495057' }}>Tên khuyến mãi:</Text>
                    <br />
                    <Text style={{ fontSize: '16px', fontWeight: 500, color: '#1890ff' }}>
                      {selectedPromotion.name}
                    </Text>
                  </div>
                </Col>
                <Col span={12}>
                  <div>
                    <Text strong style={{ color: '#495057' }}>Giá trị:</Text>
                    <br />
                    <Text style={{ fontSize: '16px', fontWeight: 500, color: '#52c41a' }}>
                      {getPromotionValue(selectedPromotion)}
                    </Text>
                  </div>
                </Col>
              </Row>
              <div style={{ marginTop: '12px' }}>
                <Text strong style={{ color: '#495057' }}>Loại:</Text>
                <Tag 
                  icon={getPromotionTypeIcon(selectedPromotion.type)} 
                  color="blue" 
                  style={{ marginLeft: '8px' }}
                >
                  {getPromotionTypeText(selectedPromotion.type)}
                </Tag>
              </div>
            </div>
            
            {/* Transfer Component */}
            {dealerLoading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Text>Đang tải danh sách đại lý...</Text>
              </div>
            ) : dealers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{ 
                  fontSize: '48px', 
                  color: '#d9d9d9', 
                  marginBottom: '16px'
                }}>
                  🏢
                </div>
                <Text type="secondary" style={{ fontSize: '16px', display: 'block', marginBottom: '8px' }}>
                  Chưa có đại lý nào trong hệ thống
                </Text>
                <Text type="secondary" style={{ fontSize: '14px', display: 'block', marginBottom: '24px' }}>
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
                      // Navigate to dealer management page
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
                dataSource={dealers.map(dealer => ({
                  key: dealer._id,
                  title: dealer.name,
                  description: `${dealer.code || 'N/A'} - ${dealer.email || 'N/A'} - ${dealer.phone || 'N/A'}`,
                  disabled: !dealer.isActive
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
                  option.title.toLowerCase().includes(inputValue.toLowerCase()) ||
                  option.description.toLowerCase().includes(inputValue.toLowerCase())
                }
                locale={{
                  itemUnit: 'đại lý',
                  itemsUnit: 'đại lý'
                }}
              />
            )}
            
            {targetKeys.length > 0 && (
              <div style={{ 
                marginTop: '16px', 
                padding: '12px', 
                backgroundColor: '#e6f4ff', 
                borderRadius: '6px',
                border: '1px solid #91caff'
              }}>
                <Text style={{ color: '#0958d9' }}>
                  ✓ Đã chọn {targetKeys.length} đại lý để phân bổ khuyến mãi
                </Text>
              </div>
            )}
          </div>
        )}
      </Modal>
      
      {/* Toast Container */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        style={{ zIndex: 99999 }}
      />
      </div>
    </AdminLayout>
  );
};

export default PromotionManagement;
