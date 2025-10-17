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
} from '@mui/icons-material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateRangePicker, DateRange } from '@mui/x-date-pickers-pro';
import { orderService, Order, OrderSearchParams } from '../../services/orderService'; 
import { useAuth } from '../../contexts/AuthContext'; 
import OrderDetailModalMUI from './OrderDetailModalMUI'; 
import { DepositPayment } from './DepositPayment';
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

  const statusOptions = [
    { value: 'pending', label: 'Chờ xác nhận', color: 'warning' },
    { value: 'confirmed', label: 'Đã xác nhận', color: 'info' },
    { value: 'halfPayment', label: 'Đã đặt cọc', color: 'primary' },
    { value: 'fullyPayment', label: 'Đã thanh toán', color: 'success' },
    { value: 'closed', label: 'Đã đóng', color: 'secondary' },
    { value: 'cancelled', label: 'Đã hủy', color: 'error' },
  ];

  const paymentMethodOptions = [
    { value: 'cash', label: 'Tiền mặt', color: 'primary' },
    { value: 'installment', label: 'Trả góp', color: 'secondary' },
  ];

  const getStatusChip = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status);
    return (
      <Chip 
        label={option?.label || status} 
        color={option?.color as any} 
        size="small" 
        sx={{ minWidth: 90 }} 
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

          // Filter orders based on user role
          let filteredOrders = processedOrders;
          if (user?.role === 'dealer_manager') {
            // Manager: filter by dealership
            const userDealershipId = user?.dealership_id || user?.dealerId;
            filteredOrders = processedOrders.filter(order => {
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
            console.log(`🔍 Manager filtering: ${processedOrders.length} → ${filteredOrders.length} orders`);
          } else if (user?.role === 'dealer_staff') {
            // Staff: validate that orders belong to them (extra safety check)
            const userId = user?.id;
            filteredOrders = processedOrders.filter(order => {
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
            console.log(`🔍 Staff validation: ${processedOrders.length} → ${filteredOrders.length} orders`);
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

  const handleEditOrder = (_order: Order) => {
    setSnackbarMessage('Tính năng chỉnh sửa đơn hàng đang được phát triển');
    setSnackbarSeverity('info');
    setSnackbarOpen(true);
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
            <Button
              variant="outlined"
              startIcon={<ReloadIcon />}
              onClick={() => loadOrders({})}
              disabled={loading}
            >
              Làm mới
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => {
                setSnackbarMessage('Tính năng tạo đơn hàng mới đang được phát triển');
                setSnackbarSeverity('info');
                setSnackbarOpen(true);
              }}
            >
              Tạo đơn hàng mới
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<AddIcon />}
              onClick={() => {
                // Test: Create a confirmed order for testing deposit functionality
                const testOrder = {
                  _id: 'test-confirmed-order',
                  code: 'TEST-CONFIRMED-001',
                  customer: { full_name: 'Test Customer', phone: '0900000000' },
                  salesperson: { full_name: 'Test Salesperson' },
                  items: [{ vehicle_id: 'test-vehicle', quantity: 1 }],
                  final_amount: 100000000,
                  paid_amount: 0,
                  payment_method: 'cash',
                  status: 'confirmed',
                  createdAt: new Date().toISOString(),
                  contract_signed: false
                };
                setSelectedOrderForDeposit(testOrder as any);
                setDepositModalVisible(true);
                setSnackbarMessage('Test: Mở modal đặt cọc cho đơn hàng test');
                setSnackbarSeverity('info');
                setSnackbarOpen(true);
              }}
            >
              Test Đặt Cọc
            </Button>
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
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <SearchIcon className="w-5 h-5" />
                    Tìm kiếm
                  </button>
                  <button
                    onClick={handleReset}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ReloadIcon className="w-5 h-5" />
                    Reset
                  </button>
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
                        <Stack direction="row" spacing={0} justifyContent="center">
                            <Tooltip title="Xem chi tiết">
                            <IconButton onClick={() => handleViewOrder(order._id)} size="small">
                                <EyeIcon fontSize="inherit" color="primary" />
                            </IconButton>
                            </Tooltip>
                            
                            {/* Deposit Payment Button - Only show for confirmed orders */}
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