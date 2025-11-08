import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Tooltip,
  IconButton,
  Alert,
  Snackbar,
  CircularProgress,
  TablePagination,
  Stack,
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as EyeIcon,
  Description as FileTextIcon,
  Refresh as ReloadIcon,
  Add as AddIcon,
  AttachMoney as DollarIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  LocalShipping as LocalShippingIcon,
} from '@mui/icons-material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateRangePicker, DateRange } from '@mui/x-date-pickers-pro';
import { orderService, Order, OrderSearchParams } from '../../services/orderService'; 
import { useAuth } from '../../contexts/AuthContext';
import Swal from 'sweetalert2'; 
import OrderDetailModalMUI from './OrderDetailModalMUI'; 
import { DepositPayment } from './DepositPayment';
import EditOrderModal from './EditOrderModal';
import dayjs, { Dayjs } from 'dayjs';

export const OrderManagement: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'info' | 'warning' | 'error'>('info');

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const [searchText, setSearchText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRange<Dayjs>>([null, null]);


  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Deposit Payment Modal
  const [depositModalVisible, setDepositModalVisible] = useState(false);
  const [selectedOrderForDeposit, setSelectedOrderForDeposit] = useState<Order | null>(null);

  // Edit Order Modal
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedOrderForEdit, setSelectedOrderForEdit] = useState<Order | null>(null);

  const statusOptions = [
    { value: 'pending', label: 'Chờ xác nhận', color: 'warning' },
    { value: 'confirmed', label: 'Đã xác nhận', color: 'info' },
    { value: 'halfPayment', label: 'Đã đặt cọc', color: 'primary' },
    { value: 'deposit_paid', label: 'Đã đặt cọc', color: 'warning' },
    { value: 'fullyPayment', label: 'Đã thanh toán', color: 'success' },
    { value: 'fully_paid', label: 'Đã thanh toán đủ', color: 'success' },
    { value: 'waiting_vehicle_request', label: 'Chờ yêu cầu xe', color: 'warning' },
    { value: 'vehicle_ready', label: 'Xe sẵn sàng', color: 'info' },
    { value: 'delivered', label: 'Đã giao', color: 'success' },
    { value: 'completed', label: 'Hoàn thành', color: 'success' },
    { value: 'closed', label: 'Đã đóng', color: 'secondary' },
    { value: 'cancelled', label: 'Đã hủy', color: 'error' },
  ];

  const paymentMethodOptions = [
    { value: 'cash', label: 'Tiền mặt', color: 'primary' },
    { value: 'installment', label: 'Trả góp', color: 'secondary' },
  ];

  const getStatusChip = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status);
    if (option) {
      return (
        <Chip 
          label={option.label} 
          color={option.color as any} 
          size="small" 
          sx={{ minWidth: 90, fontWeight: 500 }} 
        />
      );
    }
    // Fallback: hiển thị status gốc với màu mặc định
    return (
      <Chip 
        label={status} 
        color="default" 
        size="small" 
        sx={{ minWidth: 90, fontWeight: 500 }} 
      />
    );
  };
  
  const getPaymentChip = (method: string) => {
    const option = paymentMethodOptions.find(opt => opt.value === method);
    return (
        <Chip 
            label={option?.label || method} 
            color={method === 'cash' ? 'warning' : 'info'} 
            size="small" 
            sx={{ minWidth: 90 }} 
        />
    );
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const loadOrders = useCallback(
    async (params?: OrderSearchParams) => {
      console.log('🔍 Loading orders with params:', params);
      setLoading(true);
      setError(null);

      const searchParams: OrderSearchParams = {
        page: params?.page || pagination.current,
        limit: params?.limit || pagination.pageSize,
        q: params?.q,
        status: params?.status,
        payment_method: params?.payment_method,
        startDate: params?.startDate,
        endDate: params?.endDate,
      };

      console.log('📋 API params being sent:', searchParams);
      console.log('👤 User role:', user?.role);

      try {
        const apiEndpoint = user?.role === 'dealer_staff' ? '/api/orders/yourself' : '/api/orders';
        console.log('🔗 Using API endpoint:', apiEndpoint);
        
        const response =
          user?.role === 'dealer_staff'
            ? await orderService.getMyOrders(searchParams)
            : await orderService.getOrders(searchParams);

        console.log('📋 API response received:', response);

        let ordersData: Order[] = [];
        let paginationData: any = {};

        if (response && response.success) {
            // Logic xử lý response tương tự như AntD component
            if (response.data) {
                if (response.data.data && Array.isArray(response.data.data)) {
                  ordersData = response.data.data;
                  paginationData = response.data.pagination || {};
                } else if (Array.isArray(response.data)) {
                  ordersData = response.data;
                  paginationData = { total: response.data.length, page: 1 };
                } else if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
                    const dataObj = response.data as any;
                    if (dataObj._id && dataObj.code) {
                        ordersData = [dataObj as Order];
                        paginationData = { total: 1, page: 1 };
                    }
                }
            }
          
          const processedOrders = ordersData.map((order: any) => ({
            ...order,
            customer: order.customer_id && typeof order.customer_id === 'object' ? order.customer_id : order.customer,
            salesperson: order.salesperson_id && typeof order.salesperson_id === 'object' ? order.salesperson_id : order.salesperson,
          }));

          console.log('✅ Processed orders:', processedOrders);
          console.log('📊 Setting orders state with:', processedOrders.length, 'orders');
          
          // Debug: Check for confirmed orders
          const confirmedOrders = processedOrders.filter(order => order.status === 'confirmed');
          console.log('🔍 Confirmed orders found:', confirmedOrders.length, confirmedOrders.map(o => ({ id: o._id, code: o.code, status: o.status })));
          
          // Debug: Check all order statuses
          const statusCounts = processedOrders.reduce((acc, order) => {
            acc[order.status] = (acc[order.status] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          console.log('📊 Order status distribution:', statusCounts);
          
          // Debug: Check for deleted orders
          const deletedOrders = processedOrders.filter(order => (order as any).is_deleted);
          console.log('🗑️ Deleted orders found:', deletedOrders.length, deletedOrders.map(o => ({ id: o._id, code: o.code, is_deleted: (o as any).is_deleted })));

          // Map is_deleted: true thành status "cancelled" để hiển thị
          const ordersWithCancelledStatus = processedOrders.map(order => {
            if ((order as any).is_deleted) {
              return {
                ...order,
                status: 'cancelled' as any
              };
            }
            return order;
          });

          // Filter orders based on user role
          let filteredOrders = ordersWithCancelledStatus;
          if (user?.role === 'dealer_manager') {
            // Manager: filter by dealership
            const userDealershipId = user?.dealership_id || user?.dealerId;
            filteredOrders = ordersWithCancelledStatus.filter(order => {
              const belongsToUserDealership = order.dealership_id === userDealershipId;
              if (!belongsToUserDealership) {
                console.log('🚫 Manager filtering out order from different dealership:', {
                  order_code: order.code,
                  order_dealership_id: order.dealership_id,
                  user_dealership_id: userDealershipId
                });
              }
              return belongsToUserDealership;
            });
            console.log(`🔍 Manager filtering: ${ordersWithCancelledStatus.length} → ${filteredOrders.length} orders`);
          } else if (user?.role === 'dealer_staff') {
            // Staff: validate that orders belong to them (extra safety check)
            const userId = user?.id;
            filteredOrders = ordersWithCancelledStatus.filter(order => {
              const belongsToUser = order.salesperson_id === userId;
              if (!belongsToUser) {
                console.log('🚫 Staff filtering out order not assigned to them:', {
                  order_code: order.code,
                  order_salesperson_id: order.salesperson_id,
                  user_id: userId
                });
              }
              return belongsToUser;
            });
            console.log(`🔍 Staff validation: ${ordersWithCancelledStatus.length} → ${filteredOrders.length} orders`);
          }

          setOrders(filteredOrders);
          setPagination(prev => ({
            ...prev,
            total: paginationData.total || filteredOrders.length,
            current: paginationData.page || 1,
          }));

          const filterMessage = filteredOrders.length !== ordersData.length 
            ? ` (lọc từ ${ordersData.length} đơn hàng)` 
            : '';
          const roleMessage = user?.role === 'dealer_manager' 
            ? 'Manager' 
            : user?.role === 'dealer_staff' 
            ? 'Staff' 
            : 'User';
          setSnackbarMessage(`${roleMessage}: Đã tải ${filteredOrders.length} đơn hàng${filterMessage}`);
          setSnackbarSeverity('success');
          setSnackbarOpen(true);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err: any) {
        console.error('❌ Error loading orders:', err);
        const errorMessage = err?.response?.data?.message || err?.message || 'Lỗi kết nối API';
        setError(errorMessage);
        
        // Show empty state when API fails
        setOrders([]);
        setPagination(prev => ({ ...prev, total: 0 }));

      } finally {
        setLoading(false);
      }
    },
    [pagination.current, pagination.pageSize, user?.role],
  );

  useEffect(() => {
    loadOrders({});
  }, [loadOrders]); 


  const handleSearch = () => {
    const searchParams: OrderSearchParams = {
      page: 1,
      limit: pagination.pageSize,
    };

    if (searchText.trim()) {
      searchParams.q = searchText.trim();
    }
    if (selectedStatus) {
      searchParams.status = selectedStatus;
    }
    if (selectedPaymentMethod) {
      searchParams.payment_method = selectedPaymentMethod;
    }
    if (dateRange[0] && dateRange[1]) {
      searchParams.startDate = dateRange[0].format('YYYY-MM-DD');
      searchParams.endDate = dateRange[1].format('YYYY-MM-DD');
    }

    setPagination(prev => ({ ...prev, current: 1 }));
    loadOrders(searchParams);
  };

  const handleReset = () => {
    setSearchText('');
    setSelectedStatus('');
    setSelectedPaymentMethod('');
    setDateRange([null, null]);
    setPagination(prev => ({ ...prev, current: 1 }));
    loadOrders({ page: 1, limit: pagination.pageSize });
  };

  const handlePageChange = (_event: unknown, newPage: number) => {
    const newCurrent = newPage + 1;
    setPagination(prev => ({ ...prev, current: newCurrent }));
    loadOrders({
      page: newCurrent,
      limit: pagination.pageSize,
      q: searchText || undefined,
      status: selectedStatus || undefined,
      payment_method: selectedPaymentMethod || undefined,
      startDate: dateRange[0]?.format('YYYY-MM-DD'),
      endDate: dateRange[1]?.format('YYYY-MM-DD'),
    });
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newPageSize = parseInt(event.target.value, 10);
    setPagination(prev => ({ ...prev, pageSize: newPageSize, current: 1 }));
    loadOrders({
      page: 1,
      limit: newPageSize,
      q: searchText || undefined,
      status: selectedStatus || undefined,
      payment_method: selectedPaymentMethod || undefined,
      startDate: dateRange[0]?.format('YYYY-MM-DD'),
      endDate: dateRange[1]?.format('YYYY-MM-DD'),
    });
  };
  
  const handleViewOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedOrderId(null);
  };

  // Deposit Payment Handlers
  const handleDepositPayment = (order: Order) => {
    console.log('💰 Deposit payment clicked for order:', { id: order._id, code: order.code, status: order.status });
    setSelectedOrderForDeposit(order);
    setDepositModalVisible(true);
  };

  const handleCloseDepositModal = () => {
    setDepositModalVisible(false);
    setSelectedOrderForDeposit(null);
  };

  const handleDepositSuccess = () => {
    setDepositModalVisible(false);
    setSelectedOrderForDeposit(null);
    // Reload orders to show updated status
    loadOrders({});
  };

  const handleEditOrder = (order: Order) => {
    setSelectedOrderForEdit(order);
    setEditModalVisible(true);
  };

  const handleUpdateOrder = async (orderId: string, updateData: any) => {
    await orderService.updateOrder(orderId, updateData);
    
    // Reload orders
    loadOrders({
      page: pagination.current,
      limit: pagination.pageSize,
      q: searchText || undefined,
      status: selectedStatus || undefined,
      payment_method: selectedPaymentMethod || undefined,
      startDate: dateRange[0]?.format('YYYY-MM-DD'),
      endDate: dateRange[1]?.format('YYYY-MM-DD'),
    });
  };

  const handleCloseEditModal = () => {
    setEditModalVisible(false);
    setSelectedOrderForEdit(null);
  };

  const handleDeleteOrder = async (order: Order) => {
    if (!user || user.role !== 'dealer_manager') {
      setSnackbarMessage('Chỉ dealer manager mới có quyền xóa đơn hàng');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    // Kiểm tra nếu đã bị hủy → không cho phép hủy lại
    if (order.status === 'cancelled' || (order as any).is_deleted) {
      await Swal.fire({
        title: 'Đơn hàng đã bị hủy',
        text: `Đơn hàng ${order.code} đã bị hủy trước đó.`,
        icon: 'info',
        confirmButtonText: 'Đã hiểu',
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    // Kiểm tra nếu đã thanh toán hết → không cho phép cancel
    const isFullyPaid = order.status === 'fully_paid' || order.paid_amount >= (order.final_amount || 0);
    if (isFullyPaid) {
      await Swal.fire({
        title: 'Không thể hủy đơn hàng',
        html: `
          <p>Đơn hàng <strong>${order.code}</strong> đã được thanh toán đủ.</p>
          <p style="margin-top: 10px; color: #ef4444;">
            <strong>Không thể hủy đơn hàng đã thanh toán hết.</strong>
          </p>
          <p style="margin-top: 10px;">
            Nếu cần hủy, vui lòng liên hệ quản lý cấp cao.
          </p>
        `,
        icon: 'error',
        confirmButtonText: 'Đã hiểu',
        confirmButtonColor: '#ef4444'
      });
      return;
    }

    // Kiểm tra nếu đã cọc → hiển thị thông báo về hoàn tiền
    const hasDeposit = (order.paid_amount || 0) > 0;
    
    // Xác nhận hủy đơn hàng
    const confirmMessage = hasDeposit
      ? `Đơn hàng <strong>${order.code}</strong> đã có tiền cọc.<br/><br/><strong>Số tiền sẽ được hoàn lại:</strong> ${formatCurrency(order.paid_amount || 0)}<br/><br/>Bạn có chắc chắn muốn hủy đơn hàng này? Hệ thống sẽ tự động hoàn tiền và khôi phục stock.`
      : `Bạn có chắc chắn muốn hủy đơn hàng <strong>${order.code}</strong>? Hành động này không thể hoàn tác.`;

    const result = await Swal.fire({
      title: hasDeposit ? 'Hủy đơn hàng và hoàn tiền' : 'Xác nhận hủy đơn hàng',
      html: confirmMessage,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Xác nhận hủy',
      cancelButtonText: 'Hủy',
      reverseButtons: true
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      setLoading(true);
      await orderService.deleteOrder(order._id);
      
      // Show success message
      await Swal.fire({
        title: 'Hủy đơn thành công!',
        html: hasDeposit
          ? `
            <p>Đơn hàng <strong>${order.code}</strong> đã được hủy.</p>
            <p style="margin-top: 10px;">
              <strong>Số tiền đã hoàn lại:</strong> ${formatCurrency(order.paid_amount || 0)}
            </p>
            <p style="margin-top: 10px; color: #6b7280; font-size: 0.9em;">
              Đơn hàng sẽ hiển thị với trạng thái "Đã hủy" trong danh sách.
            </p>
          `
          : `<p>Đơn hàng <strong>${order.code}</strong> đã được hủy thành công.</p><p style="margin-top: 10px; color: #6b7280; font-size: 0.9em;">Đơn hàng sẽ hiển thị với trạng thái "Đã hủy" trong danh sách.</p>`,
        icon: 'success',
        confirmButtonText: 'OK',
        confirmButtonColor: '#10b981'
      });
      
      // Reload orders (sẽ tự động filter ra đơn hàng đã bị hủy)
      loadOrders({
        page: pagination.current,
        limit: pagination.pageSize,
        q: searchText || undefined,
        status: selectedStatus || undefined,
        payment_method: selectedPaymentMethod || undefined,
        startDate: dateRange[0]?.format('YYYY-MM-DD'),
        endDate: dateRange[1]?.format('YYYY-MM-DD'),
      });
    } catch (error: any) {
      console.error('Error deleting order:', error);
      
      await Swal.fire({
        title: 'Lỗi!',
        text: error.response?.data?.message || 'Có lỗi xảy ra khi hủy đơn hàng',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkReady = async (order: Order) => {
    // Confirm action with SweetAlert2
    const result = await Swal.fire({
      title: 'Xác nhận xe sẵn sàng',
      text: `Bạn có chắc chắn đánh dấu xe sẵn sàng cho đơn hàng ${order.code}? Khách hàng sẽ có thể thanh toán tiếp.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Xác nhận',
      cancelButtonText: 'Hủy',
      reverseButtons: true
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      setLoading(true);
      
      // Call API to mark vehicle ready
      await orderService.markVehicleReady(order._id);
      
      // Show success message
      await Swal.fire({
        title: 'Thành công!',
        text: 'Đã đánh dấu xe sẵn sàng. Khách hàng có thể thanh toán tiếp.',
        icon: 'success',
        confirmButtonText: 'OK',
        confirmButtonColor: '#10b981'
      });
      
      // Reload orders to show updated status
      loadOrders({
        page: pagination.current,
        limit: pagination.pageSize,
        q: searchText || undefined,
        status: selectedStatus || undefined,
        payment_method: selectedPaymentMethod || undefined,
        startDate: dateRange[0]?.format('YYYY-MM-DD'),
        endDate: dateRange[1]?.format('YYYY-MM-DD'),
      });
    } catch (error: any) {
      console.error('Error marking order as ready:', error);
      
      // Show error message
      await Swal.fire({
        title: 'Lỗi!',
        text: error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái đơn hàng',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeliverOrder = async (order: Order) => {
    // Get customer info for default values
    const defaultRecipientName = order.customer?.full_name || '';
    const defaultRecipientPhone = order.customer?.phone || '';
    
    // Create HTML form for delivery info
    const { value: formValues } = await Swal.fire({
      title: 'Giao xe cho khách hàng',
      html: `
        <div style="text-align: left;">
          <p style="font-weight: bold; margin-bottom: 10px;">Thông tin người giao xe </p>
          <input id="delivery_person_name" class="swal2-input" placeholder="Họ tên người giao">
          <input id="delivery_person_phone" class="swal2-input" placeholder="Số điện thoại người giao">
          <input id="delivery_person_id_card" class="swal2-input" placeholder="CMND/CCCD người giao">
          
          <p style="font-weight: bold; margin-top: 20px; margin-bottom: 10px;">Thông tin người nhận xe </p>
          <input id="recipient_name" class="swal2-input" placeholder="Họ tên người nhận *" value="${defaultRecipientName}" required>
          <input id="recipient_phone" class="swal2-input" placeholder="Số điện thoại người nhận *" value="${defaultRecipientPhone}" required>
          <input id="recipient_relationship" class="swal2-input" placeholder="Mối quan hệ (VD: Chính chủ)" value="Chính chủ">
          
          <p style="font-weight: bold; margin-top: 20px; margin-bottom: 10px;">Ghi chú</p>
          <input id="actual_delivery_date" class="swal2-input" type="datetime-local" placeholder="Ngày giờ giao xe">
          <textarea id="delivery_notes" class="swal2-textarea" placeholder="Ghi chú giao xe (tùy chọn)" style="height: 80px;"></textarea>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Xác nhận giao xe',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#6b7280',
      reverseButtons: true,
      preConfirm: () => {
        const recipientName = (document.getElementById('recipient_name') as HTMLInputElement)?.value;
        const recipientPhone = (document.getElementById('recipient_phone') as HTMLInputElement)?.value;
        
        if (!recipientName || !recipientPhone) {
          Swal.showValidationMessage('Vui lòng nhập đầy đủ thông tin người nhận (Họ tên và Số điện thoại)');
          return false;
        }
        
        return {
          delivery_person_name: (document.getElementById('delivery_person_name') as HTMLInputElement)?.value || undefined,
          delivery_person_phone: (document.getElementById('delivery_person_phone') as HTMLInputElement)?.value || undefined,
          delivery_person_id_card: (document.getElementById('delivery_person_id_card') as HTMLInputElement)?.value || undefined,
          recipient_name: recipientName,
          recipient_phone: recipientPhone,
          recipient_relationship: (document.getElementById('recipient_relationship') as HTMLInputElement)?.value || 'Chính chủ',
          actual_delivery_date: (document.getElementById('actual_delivery_date') as HTMLInputElement)?.value || undefined,
          delivery_notes: (document.getElementById('delivery_notes') as HTMLTextAreaElement)?.value || undefined,
        };
      },
      allowOutsideClick: () => !Swal.isLoading()
    });

    if (!formValues) {
      return;
    }

    try {
      setLoading(true);
      
      const deliveryData = {
        recipient_info: {
          name: formValues.recipient_name,
          phone: formValues.recipient_phone,
          relationship: formValues.recipient_relationship
        },
        delivery_person: formValues.delivery_person_name ? {
          name: formValues.delivery_person_name,
          phone: formValues.delivery_person_phone || undefined,
          id_card: formValues.delivery_person_id_card || undefined
        } : undefined,
        delivery_notes: formValues.delivery_notes || undefined,
        actual_delivery_date: formValues.actual_delivery_date || undefined
      };

      const response = await orderService.deliverOrder(order._id, deliveryData);
      
      if (response.success) {
        await Swal.fire({
          title: 'Thành công!',
          text: 'Đã giao xe cho khách hàng thành công.',
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#10b981'
        });
        
        // Reload orders
        loadOrders({
          page: pagination.current,
          limit: pagination.pageSize,
          q: searchText || undefined,
          status: selectedStatus || undefined,
          payment_method: selectedPaymentMethod || undefined,
          startDate: dateRange[0]?.format('YYYY-MM-DD'),
          endDate: dateRange[1]?.format('YYYY-MM-DD'),
        });
      } else {
        throw new Error(response.message || 'Có lỗi xảy ra khi giao xe');
      }
    } catch (error: any) {
      console.error('Error delivering order:', error);
      await Swal.fire({
        title: 'Lỗi!',
        text: error.response?.data?.message || error.message || 'Có lỗi xảy ra khi giao xe',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteOrder = async (order: Order) => {
    // Kiểm tra điều kiện: phải giao xe ít nhất 1 ngày trước
    const deliveryDate = order.delivery?.actual_date || order.delivery?.signed_at;
    if (deliveryDate) {
      const deliveryDateTime = dayjs(deliveryDate);
      const now = dayjs();
      const daysSinceDelivery = now.diff(deliveryDateTime, 'day');
      
      if (daysSinceDelivery < 1) {
        const hoursSinceDelivery = now.diff(deliveryDateTime, 'hour');
        const remainingHours = 24 - hoursSinceDelivery;
        
        await Swal.fire({
          title: 'Chưa thể hoàn tất',
          html: `
            <p>Đơn hàng chỉ có thể hoàn tất sau ít nhất <strong>1 ngày</strong> kể từ khi giao xe.</p>
            <p style="margin-top: 10px;">
              <strong>Ngày giao xe:</strong> ${deliveryDateTime.format('DD/MM/YYYY HH:mm')}<br/>
              <strong>Thời gian đã trôi qua:</strong> ${hoursSinceDelivery} giờ<br/>
              <strong>Còn lại:</strong> ${remainingHours} giờ
            </p>
          `,
          icon: 'warning',
          confirmButtonText: 'Đã hiểu',
          confirmButtonColor: '#3b82f6'
        });
        return;
      }
    }

    // Confirm action with SweetAlert2
    const result = await Swal.fire({
      title: 'Hoàn tất đơn hàng',
      text: `Bạn có chắc chắn muốn hoàn tất đơn hàng ${order.code}? Hành động này sẽ đóng hoàn toàn hồ sơ đơn hàng.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Xác nhận',
      cancelButtonText: 'Hủy',
      reverseButtons: true,
      input: 'textarea',
      inputLabel: 'Ghi chú hoàn tất (tùy chọn)',
      inputPlaceholder: 'Nhập ghi chú về việc hoàn tất đơn hàng...',
      inputAttributes: {
        'aria-label': 'Ghi chú hoàn tất'
      },
      showLoaderOnConfirm: true,
      preConfirm: async (notes) => {
        try {
          const response = await orderService.completeOrder(order._id, {
            completion_notes: notes || undefined
          });
          return response;
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi hoàn tất đơn hàng';
          Swal.showValidationMessage(errorMessage);
          return false;
        }
      },
      allowOutsideClick: () => !Swal.isLoading()
    });

    if (result.isConfirmed && result.value) {
      await Swal.fire({
        title: 'Thành công!',
        text: 'Đã hoàn tất đơn hàng thành công.',
        icon: 'success',
        confirmButtonText: 'OK',
        confirmButtonColor: '#10b981'
      });
      
      // Reload orders
      loadOrders({
        page: pagination.current,
        limit: pagination.pageSize,
        q: searchText || undefined,
        status: selectedStatus || undefined,
        payment_method: selectedPaymentMethod || undefined,
        startDate: dateRange[0]?.format('YYYY-MM-DD'),
        endDate: dateRange[1]?.format('YYYY-MM-DD'),
      });
    }
  };

  const handleSnackbarClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };


  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 3, m: 0 }}>
        {/* Error Display */}
        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
            <Typography variant="h6">Lỗi hệ thống</Typography>
            {error}
          </Alert>
        )}

        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 4,
          }}
        >
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold">
              Quản lý đơn hàng
            </Typography>
            <Typography variant="subtitle1" color="textSecondary" sx={{ mt: 0.5 }}>
              Tổng cộng {pagination.total} đơn hàng
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5}>
            
           
          </Stack>
        </Box>

        {/* Search and Filters */}
        <Card sx={{ p: 3, mb: 4, boxShadow: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
              
              {/* Search Box */}
              <Box flex={1} minWidth={{ xs: 200, md: 300 }}>
                <div className="relative">
                  <label htmlFor="search-input" className="block text-sm font-semibold text-gray-700 mb-2">
                    Tìm kiếm
                  </label>
                  <div className="relative">
                    <input
                      id="search-input"
                      type="text"
                placeholder="Mã đơn, tên KH, SĐT..."
                value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium transition-all duration-200 hover:border-gray-300"
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <SearchIcon className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </div>
              </Box>

            {/* Status Filter */}
              <Box minWidth={200}>
                <div className="relative">
                  <label htmlFor="status-filter" className="block text-sm font-semibold text-gray-700 mb-2">
                    Trạng thái
                  </label>
                  <div className="relative">
                    <select
                      id="status-filter"
                  value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full px-4 py-3 pr-10 border-2 border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium transition-all duration-200 hover:border-gray-300 appearance-none cursor-pointer"
                >
                      <option value="">Tất cả</option>
                  {statusOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>
                      {opt.label}
                        </option>
                      ))}
                    </select>
                    {/* Custom dropdown arrow */}
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Box>

            {/* Payment Method Filter */}
              <Box minWidth={200}>
                <div className="relative">
                  <label htmlFor="payment-filter" className="block text-sm font-semibold text-gray-700 mb-2">
                    Phương thức TT
                  </label>
                  <div className="relative">
                    <select
                      id="payment-filter"
                  value={selectedPaymentMethod}
                      onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                      className="w-full px-4 py-3 pr-10 border-2 border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium transition-all duration-200 hover:border-gray-300 appearance-none cursor-pointer"
                >
                      <option value="">Tất cả</option>
                  {paymentMethodOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>
                      {opt.label}
                        </option>
                      ))}
                    </select>
                    {/* Custom dropdown arrow */}
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
              {/* Date Range Filter */}
              <Box sx={{ flex: '1 1 400px', minWidth: '300px' }}>
              <DateRangePicker
                localeText={{ start: 'Từ ngày', end: 'Đến ngày' }}
                value={dateRange}
                onChange={newValue => setDateRange(newValue)}
                  enableAccessibleFieldDOMStructure={false}
                  slots={{
                    textField: TextField
                  }}
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true
                    }
                  }}
                />
              </Box>

            {/* Action Buttons */}
              <Box sx={{ flex: '0 0 auto' }}>
                <Box display="flex" gap={2} className="mt-6">
                  <button
                    onClick={handleSearch}
                    disabled={loading}
                    className="mb-6 flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <SearchIcon className="w-5 h-5" />
                    Tìm kiếm
                  </button>
                  {/* <button
                    onClick={handleReset}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ReloadIcon className="w-5 h-5" />
                    Reset
                  </button> */}
                </Box>
              </Box>
            </Box>
          </Box>
        </Card>

        {/* Orders Table */}
        <Paper elevation={3} sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer sx={{ maxHeight: 'calc(100vh - 350px)' }}>
            <Table stickyHeader aria-label="Bảng đơn hàng" size="small">
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 'bold', backgroundColor: '#f4f6f8' } }}>
                  <TableCell sx={{ minWidth: 100 }}>Mã đơn hàng</TableCell>
                  <TableCell sx={{ minWidth: 150 }}>Khách hàng</TableCell>
                  <TableCell sx={{ minWidth: 150 }}>Nhân viên</TableCell>
                  <TableCell align="center" sx={{ minWidth: 90 }}>
                    SL SP
                  </TableCell>
                  <TableCell align="right" sx={{ minWidth: 120 }}>
                    Tổng tiền
                  </TableCell>
                  <TableCell align="right" sx={{ minWidth: 120 }}>
                    Đã thanh toán
                  </TableCell>
                  <TableCell align="center" sx={{ minWidth: 120 }}>
                    Phương thức TT
                  </TableCell>
                  <TableCell align="center" sx={{ minWidth: 120 }}>
                    Trạng thái
                  </TableCell>
                  <TableCell sx={{ minWidth: 100 }}>Ngày tạo</TableCell>
                  <TableCell align="center" sx={{ minWidth: 100, position: 'sticky', right: 0, zIndex: 1, backgroundColor: '#f4f6f8' }}>
                    Hành động
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                    <TableRow>
                        <TableCell colSpan={10} align="center" sx={{ py: 3 }}>
                            <CircularProgress size={30} />
                            <Typography sx={{ mt: 1 }}>Đang tải...</Typography>
                        </TableCell>
                    </TableRow>
                ) : orders.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={10} align="center" sx={{ py: 3 }}>
                            <Typography color="textSecondary">Không tìm thấy đơn hàng nào</Typography>
                        </TableCell>
                    </TableRow>
                ) : (
                    orders.map(order => (
                    <TableRow hover key={order._id}>
                        <TableCell>
                        <Typography variant="body2" fontWeight="medium" color="primary">
                            {order.code}
                        </Typography>
                        </TableCell>
                        <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                            {order.customer?.full_name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                            {order.customer?.phone}
                        </Typography>
                        </TableCell>
                        <TableCell>
                        <Typography variant="body2">
                            {order.salesperson?.full_name || 'Chưa phân công'}
                        </Typography>
                        </TableCell>
                        <TableCell align="center">
                        <Typography variant="body2">{order.items?.length || 0}</Typography>
                        </TableCell>
                        <TableCell align="right">
                        <Typography variant="body2" fontWeight="bold" color="success.main">
                            {formatCurrency(order.final_amount)}
                        </Typography>
                        </TableCell>
                        <TableCell align="right">
                        <Typography variant="body2">
                            {formatCurrency(order.paid_amount)}
                        </Typography>
                        </TableCell>
                        <TableCell align="center">{getPaymentChip(order.payment_method)}</TableCell>
                        <TableCell align="center">{getStatusChip(order.status)}</TableCell>
                        <TableCell>
                        <Typography variant="body2">
                            {dayjs(order.createdAt).format('DD/MM/YYYY')}
                        </Typography>
                        </TableCell>
                        <TableCell
                            align="center"
                            sx={{ position: 'sticky', right: 0, backgroundColor: 'background.paper' }}
                        >
                        <Stack direction="row" spacing={0} justifyContent="flex-start" alignItems="center">
                            {/* 1. Xem chi tiết - Luôn hiển thị, cố định vị trí */}
                            <Box sx={{ width: 40, display: 'flex', justifyContent: 'center' }}>
                                <Tooltip title="Xem chi tiết">
                                    <IconButton 
                                        onClick={() => handleViewOrder(order._id)} 
                                        size="small"
                                        sx={{ width: 32, height: 32 }}
                                    >
                                        <EyeIcon fontSize="small" color="primary" />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                            
                            {/* 2. Xem hợp đồng - Nếu có hợp đồng */}
                            {order.contract_signed && (
                            <Tooltip title="Xem hợp đồng">
                                <IconButton
                                onClick={() => {
                                    setSnackbarMessage('Tính năng xem hợp đồng đang được phát triển');
                                    setSnackbarSeverity('info');
                                    setSnackbarOpen(true);
                                }}
                                size="small"
                                >
                                <FileTextIcon fontSize="inherit" color="action" />
                                </IconButton>
                            </Tooltip>
                            )}
                            
                            {/* 3. Chỉnh sửa đơn hàng - Disabled nếu cancelled */}
                            {(() => {
                              const isCancelled = order.status === 'cancelled' || (order as any).is_deleted;
                              return (
                                <Tooltip title={isCancelled ? 'Không thể chỉnh sửa đơn hàng đã bị hủy' : 'Chỉnh sửa đơn hàng'}>
                                  <IconButton
                                    onClick={() => handleEditOrder(order)}
                                    size="small"
                                    color="primary"
                                    disabled={isCancelled}
                                  >
                                    <EditIcon fontSize="inherit" />
                                  </IconButton>
                                </Tooltip>
                              );
                            })()}
                            
                            {/* 4. Đặt cọc - Chỉ hiển thị cho confirmed orders */}
                            {order.status === 'confirmed' && (
                            <Tooltip title="Đặt cọc">
                                <IconButton
                                onClick={() => {
                                  console.log('💰 Deposit button clicked for:', { code: order.code, status: order.status });
                                  handleDepositPayment(order);
                                }}
                                size="small"
                                color="warning"
                                >
                                <DollarIcon fontSize="inherit" />
                                </IconButton>
                            </Tooltip>
                            )}
                            
                            {/* 5. Đánh dấu xe sẵn sàng - Chỉ hiển thị cho waiting_vehicle_request */}
                            {order.status === 'waiting_vehicle_request' && (
                            <Tooltip title="Đánh dấu xe sẵn sàng">
                                <IconButton
                                onClick={() => handleMarkReady(order)}
                                size="small"
                                color="success"
                                >
                                <CheckCircleIcon fontSize="inherit" />
                                </IconButton>
                            </Tooltip>
                            )}
                            
                            {/* 6. Giao xe - Chỉ hiển thị cho fully_paid */}
                            {(order.status === 'fully_paid' || order.status === 'fullyPayment') && (
                            <Tooltip title="Giao xe cho khách hàng">
                                <IconButton
                                onClick={() => handleDeliverOrder(order)}
                                size="small"
                                color="primary"
                                >
                                <LocalShippingIcon fontSize="inherit" />
                                </IconButton>
                            </Tooltip>
                            )}
                            
                            {/* 7. Hoàn tất đơn hàng - Chỉ hiển thị cho delivered orders, có thể disabled */}
                            {(() => {
                              const canComplete = order.status === 'delivered';
                              if (!canComplete) return null;
                              
                              // Kiểm tra điều kiện 1 ngày
                              const deliveryDate = order.delivery?.actual_date || order.delivery?.signed_at;
                              let tooltipText = 'Hoàn tất đơn hàng';
                              let disabled = false;
                              
                              if (deliveryDate) {
                                const deliveryDateTime = dayjs(deliveryDate);
                                const now = dayjs();
                                const daysSinceDelivery = now.diff(deliveryDateTime, 'day');
                                const hoursSinceDelivery = now.diff(deliveryDateTime, 'hour');
                                
                                if (daysSinceDelivery < 1) {
                                  const remainingHours = 24 - hoursSinceDelivery;
                                  tooltipText = `Chưa thể hoàn tất. Còn ${remainingHours} giờ (cần ít nhất 1 ngày sau khi giao xe)`;
                                  disabled = true;
                                }
                              }
                              
                              return (
                                <Tooltip title={tooltipText}>
                                  <span>
                                    <IconButton
                                      onClick={() => handleCompleteOrder(order)}
                                      size="small"
                                      color="success"
                                      disabled={disabled}
                                    >
                                      <CheckCircleIcon fontSize="inherit" />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              );
                            })()}
                            
                            {/* 8. Xóa đơn hàng - Chỉ cho managers, không cancelled */}
                            {user?.role === 'dealer_manager' && order.status !== 'cancelled' && !(order as any).is_deleted && (
                            <Tooltip title="Xóa đơn hàng">
                                <IconButton
                                onClick={() => handleDeleteOrder(order)}
                                size="small"
                                color="error"
                                >
                                <DeleteIcon fontSize="inherit" />
                                </IconButton>
                            </Tooltip>
                            )}
                        </Stack>
                        </TableCell>
                    </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Table Pagination */}
          <TablePagination
            component="div"
            count={pagination.total}
            page={(pagination?.current || 1) - 1} // MUI uses 0-indexed page
            onPageChange={handlePageChange}
            rowsPerPage={pagination.pageSize}
            onRowsPerPageChange={handleRowsPerPageChange}
            rowsPerPageOptions={[10, 20, 50, 100]}
            labelRowsPerPage="Số đơn hàng/trang:"
            labelDisplayedRows={({ from, to, count }) =>
              `Hiển thị ${from}–${to} của ${count} đơn hàng`
            }
          />
        </Paper>

        {/* Order Detail Modal (MUI) */}
        <OrderDetailModalMUI
          visible={modalVisible}
          orderId={selectedOrderId}
          onClose={handleCloseModal}
          onEdit={handleEditOrder}
          onRefresh={loadOrders}
        />

        {/* Deposit Payment Modal */}
        <DepositPayment
          visible={depositModalVisible}
          order={selectedOrderForDeposit}
          onClose={handleCloseDepositModal}
          onSuccess={handleDepositSuccess}
        />

        {/* Edit Order Modal */}
        <EditOrderModal
          open={editModalVisible}
          onClose={handleCloseEditModal}
          order={selectedOrderForEdit}
          onUpdate={handleUpdateOrder}
        />

        {/* Global Snackbar (Thay thế AntD message) */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={4000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={handleSnackbarClose}
            severity={snackbarSeverity}
            sx={{ width: '100%' }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default OrderManagement;