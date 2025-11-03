import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Stack,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Description as DescriptionIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

import { orderService } from '../../services/orderService';
import { Order } from '../../types/index';

export const OrderDetailMUI: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load order details
  const loadOrderDetail = async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await orderService.getOrderById(id);
      
      if (response && response.success) {
        console.log('Order detail response:', response);
        
        // Backend response structure: { success: true, message: "...", data: { order: {...} } }
        // or: { success: true, message: "...", data: {...} }
        let orderData: Order | null = null;
        
        if (response.data) {
          const dataObj = response.data as any;
          if (dataObj.order) {
            orderData = dataObj.order as Order;
          } else if (dataObj._id && dataObj.code) {
            orderData = dataObj as Order;
          }
        }
        
        if (orderData) {
          setOrder(orderData);
        } else {
          throw new Error('No order data found in response');
        }
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err: any) {
      console.error('Error loading order detail:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Lỗi kết nối API';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrderDetail();
  }, [id]);

  // Status color mapping
  const getStatusColor = (status: string) => {
    const statusColors = {
      'pending': 'warning',
      'confirmed': 'info',
      'halfPayment': 'secondary',
      'fullyPayment': 'success',
      'closed': 'default',
      'cancelled': 'error'
    };
    return statusColors[status as keyof typeof statusColors] || 'default';
  };

  // Status text mapping  
  const getStatusText = (status: string) => {
    const statusTexts = {
      'pending': 'Chờ xác nhận',
      'confirmed': 'Đã xác nhận',
      'halfPayment': 'Đã đặt cọc',
      'fullyPayment': 'Đã thanh toán',
      'closed': 'Đã đóng',
      'cancelled': 'Đã hủy'
    };
    return statusTexts[status as keyof typeof statusTexts] || status;
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert 
          severity="error" 
          action={
            <Button size="small" onClick={loadOrderDetail}>
              Thử lại
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  if (!order) {
    return (
      <Box p={3}>
        <Alert severity="warning">
          Không tìm thấy đơn hàng hoặc đơn hàng đã bị xóa
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link 
          component="button" 
          variant="body1" 
          onClick={() => navigate('/portal/orders')}
          sx={{ textDecoration: 'none' }}
        >
          Danh sách đơn hàng
        </Link>
        <Typography color="text.primary">Chi tiết đơn hàng</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Button 
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/portal/orders')}
          >
            Quay lại
          </Button>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Chi tiết đơn hàng {order.code}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tạo lúc: {dayjs(order.createdAt).format('DD/MM/YYYY HH:mm')}
            </Typography>
          </Box>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<EditIcon />}>
            Chỉnh sửa
          </Button>
          {order.contract_signed && (
            <Button variant="outlined" startIcon={<DescriptionIcon />}>
              Xem hợp đồng
            </Button>
          )}
          <Button variant="outlined" startIcon={<PrintIcon />}>
            In đơn hàng
          </Button>
        </Stack>
      </Box>

      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
        {/* Order Information */}
        <Box sx={{ flex: 2 }}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Thông tin đơn hàng
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Mã đơn hàng
                  </Typography>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace', color: 'primary.main' }}>
                    {order.code}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Trạng thái
                  </Typography>
                  <Chip 
                    label={getStatusText(order.status)} 
                    color={getStatusColor(order.status) as any}
                    size="small"
                  />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Phương thức thanh toán
                  </Typography>
                  <Chip 
                    label={order.payment_method === 'cash' ? 'Tiền mặt' : 'Trả góp'} 
                    color={order.payment_method === 'cash' ? 'warning' : 'info'}
                    size="small"
                  />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Tổng tiền
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                    {formatCurrency(order.final_amount)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Đã thanh toán
                  </Typography>
                  <Typography variant="body1">
                    {formatCurrency(order.paid_amount)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Còn lại
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'warning.main', fontWeight: 'bold' }}>
                    {formatCurrency(order.final_amount - order.paid_amount)}
                  </Typography>
                </Box>
                <Box sx={{ gridColumn: '1 / -1' }}>
                  <Typography variant="body2" color="text.secondary">
                    Ngày tạo
                  </Typography>
                  <Typography variant="body1">
                    {dayjs(order.createdAt).format('DD/MM/YYYY HH:mm:ss')}
                  </Typography>
                </Box>
                {order.notes && (
                  <Box sx={{ gridColumn: '1 / -1' }}>
                    <Typography variant="body2" color="text.secondary">
                      Ghi chú
                    </Typography>
                    <Typography variant="body1">
                      {order.notes}
                    </Typography>
                  </Box>
                )}
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Hợp đồng đã ký
                  </Typography>
                  <Chip 
                    label={order.contract_signed ? 'Đã ký' : 'Chưa ký'} 
                    color={order.contract_signed ? 'success' : 'error'}
                    size="small"
                  />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Cập nhật lần cuối
                  </Typography>
                  <Typography variant="body1">
                    {dayjs(order.updatedAt).format('DD/MM/YYYY HH:mm:ss')}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Sản phẩm trong đơn hàng
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Sản phẩm</TableCell>
                      <TableCell align="center">Số lượng</TableCell>
                      <TableCell align="right">Giá gốc</TableCell>
                      <TableCell align="right">Giảm giá</TableCell>
                      <TableCell align="right">Thành tiền</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {order.items.map((item: any, index: number) => (
                      <TableRow key={`${item?.vehicle_id || 'unknown'}-${index}`}>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {item.vehicle_name}
                            </Typography>
                            {item.color && (
                              <Typography variant="caption" color="text.secondary">
                                Màu: {item.color}
                              </Typography>
                            )}
                            {item.options && item.options.length > 0 && (
                              <Typography variant="caption" color="primary" display="block">
                                Tùy chọn: {item.options.map((opt: any) => opt.name).join(', ')}
                              </Typography>
                            )}
                            {item.accessories && item.accessories.length > 0 && (
                              <Typography variant="caption" color="secondary" display="block">
                                Phụ kiện: {item.accessories.map((acc: any) => `${acc.name} (x${acc.quantity})`).join(', ')}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" fontWeight="medium">
                            {item.quantity}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            {formatCurrency(item.vehicle_price)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" color="error">
                            {item.discount > 0 ? `-${formatCurrency(item.discount)}` : '-'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="medium" color="success.main">
                            {formatCurrency(item.final_amount)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={4}>
                        <Typography variant="body1" fontWeight="bold">
                          Tổng cộng:
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body1" fontWeight="bold" color="success.main">
                          {formatCurrency(order.items.reduce((sum, item) => sum + item.final_amount, 0))}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>

        {/* Customer Information */}
        <Box sx={{ flex: 1 }}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Thông tin khách hàng
              </Typography>
              {order.customer ? (
                <Stack spacing={1}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Họ tên
                    </Typography>
                    <Typography variant="body1">
                      {order.customer.full_name}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Email
                    </Typography>
                    <Typography variant="body1">
                      {order.customer.email}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Số điện thoại
                    </Typography>
                    <Typography variant="body1">
                      {order.customer.phone}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Địa chỉ
                    </Typography>
                    <Typography variant="body1">
                      {order.customer.address}
                    </Typography>
                  </Box>
                </Stack>
              ) : (
                <Typography color="text.secondary">
                  Không có thông tin khách hàng
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Salesperson Information */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              {/* <Typography variant="h6" gutterBottom>
                Nhân viên phụ trách
              </Typography> */}
              {order.salesperson ? (
                <Stack spacing={1}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Họ tên
                    </Typography>
                    <Typography variant="body1">
                      {order.salesperson.full_name}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Email
                    </Typography>
                    <Typography variant="body1">
                      {order.salesperson.email}
                    </Typography>
                  </Box>
                </Stack>
              ) : (
                <Typography color="text.secondary">
                  Chưa phân công nhân viên
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Delivery Information */}
          {order.delivery && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Thông tin giao hàng
                </Typography>
                <Stack spacing={1}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Trạng thái giao hàng
                    </Typography>
                    <Chip 
                      label={
                        order.delivery.status === 'delivered' ? 'Đã giao' :
                        order.delivery.status === 'in_transit' ? 'Đang giao' :
                        order.delivery.status === 'scheduled' ? 'Đã lên lịch' : 
                        order.delivery.status
                      }
                      color={
                        order.delivery.status === 'delivered' ? 'success' :
                        order.delivery.status === 'in_transit' ? 'info' :
                        order.delivery.status === 'scheduled' ? 'warning' : 'default'
                      }
                      size="small"
                    />
                  </Box>
                  {order.delivery.scheduled_date && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Ngày dự kiến giao
                      </Typography>
                      <Typography variant="body1">
                        {dayjs(order.delivery.scheduled_date).format('DD/MM/YYYY HH:mm')}
                      </Typography>
                    </Box>
                  )}
                  {order.delivery.actual_date && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Ngày thực tế giao
                      </Typography>
                      <Typography variant="body1">
                        {dayjs(order.delivery.actual_date).format('DD/MM/YYYY HH:mm')}
                      </Typography>
                    </Box>
                  )}
                  {order.delivery.delivery_address && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Địa chỉ giao hàng
                      </Typography>
                      <Typography variant="body1">
                        {order.delivery.delivery_address.full_address || 
                         `${order.delivery.delivery_address.street}, ${order.delivery.delivery_address.ward}, ${order.delivery.delivery_address.district}, ${order.delivery.delivery_address.city}`}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default OrderDetailMUI;