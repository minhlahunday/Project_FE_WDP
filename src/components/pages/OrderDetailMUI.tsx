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
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Description as DescriptionIcon,
  Print as PrintIcon,
  LocalShipping as LocalShippingIcon,
  CheckCircle as CheckCircleIcon
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
  
  // Delivery modal states
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [deliveryFormData, setDeliveryFormData] = useState({
    delivery_person_name: '',
    delivery_person_phone: '',
    delivery_person_id_card: '',
    recipient_name: '',
    recipient_phone: '',
    recipient_relationship: 'Chính chủ',
    delivery_notes: '',
    actual_delivery_date: dayjs().format('YYYY-MM-DDTHH:mm')
  });

  // Complete order modal states
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [completeLoading, setCompleteLoading] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');

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
          // Debug: Log order status để kiểm tra
          console.log('Order loaded:', {
            id: orderData._id,
            code: orderData.code,
            status: orderData.status,
            canDeliver: orderData.status === 'fully_paid' || orderData.status === 'fullyPayment',
            canComplete: orderData.status === 'delivered'
          });
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
      'deposit_paid': 'info',
      'waiting_vehicle_request': 'warning',
      'waiting_bank_approval': 'info',
      'vehicle_ready': 'info',
      'fully_paid': 'success',
      'delivered': 'success',
      'completed': 'success',
      'canceled': 'error',
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
      'deposit_paid': 'Đã đặt cọc',
      'waiting_vehicle_request': 'Chờ xe từ hãng',
      'waiting_bank_approval': 'Chờ duyệt ngân hàng',
      'vehicle_ready': 'Xe sẵn sàng',
      'fully_paid': 'Đã thanh toán đủ',
      'delivered': 'Đã giao xe',
      'completed': 'Hoàn tất',
      'canceled': 'Đã hủy',
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

  // Handle delivery
  const handleOpenDeliveryModal = () => {
    if (order?.customer) {
      setDeliveryFormData({
        ...deliveryFormData,
        recipient_name: order.customer.full_name || '',
        recipient_phone: order.customer.phone || '',
        recipient_relationship: 'Chính chủ'
      });
    }
    setDeliveryModalOpen(true);
  };

  const handleCloseDeliveryModal = () => {
    setDeliveryModalOpen(false);
    setDeliveryFormData({
      delivery_person_name: '',
      delivery_person_phone: '',
      delivery_person_id_card: '',
      recipient_name: '',
      recipient_phone: '',
      recipient_relationship: 'Chính chủ',
      delivery_notes: '',
      actual_delivery_date: dayjs().format('YYYY-MM-DDTHH:mm')
    });
  };

  const handleSubmitDelivery = async () => {
    if (!order || !id) return;

    // Validate required fields
    if (!deliveryFormData.recipient_name || !deliveryFormData.recipient_phone) {
      alert('Vui lòng nhập đầy đủ thông tin người nhận');
      return;
    }

    setDeliveryLoading(true);
    try {
      const deliveryData = {
        recipient_info: {
          name: deliveryFormData.recipient_name,
          phone: deliveryFormData.recipient_phone,
          relationship: deliveryFormData.recipient_relationship
        },
        delivery_person: deliveryFormData.delivery_person_name ? {
          name: deliveryFormData.delivery_person_name,
          phone: deliveryFormData.delivery_person_phone || undefined,
          id_card: deliveryFormData.delivery_person_id_card || undefined
        } : undefined,
        delivery_notes: deliveryFormData.delivery_notes || undefined,
        actual_delivery_date: deliveryFormData.actual_delivery_date || undefined
      };

      const response = await orderService.deliverOrder(id, deliveryData);
      
      if (response.success) {
        alert('Giao xe thành công!');
        handleCloseDeliveryModal();
        loadOrderDetail(); // Reload order to get updated status
      } else {
        alert(response.message || 'Có lỗi xảy ra khi giao xe');
      }
    } catch (err: any) {
      console.error('Error delivering order:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Lỗi kết nối API';
      alert(errorMessage);
    } finally {
      setDeliveryLoading(false);
    }
  };

  // Handle complete order
  const handleOpenCompleteModal = () => {
    setCompleteModalOpen(true);
  };

  const handleCloseCompleteModal = () => {
    setCompleteModalOpen(false);
    setCompletionNotes('');
  };

  const handleSubmitComplete = async () => {
    if (!order || !id) return;

    // Kiểm tra điều kiện: phải giao xe ít nhất 1 ngày trước
    const deliveryDate = order.delivery?.actual_date || order.delivery?.signed_at;
    if (deliveryDate) {
      const deliveryDateTime = dayjs(deliveryDate);
      const now = dayjs();
      const daysSinceDelivery = now.diff(deliveryDateTime, 'day');
      
      if (daysSinceDelivery < 1) {
        const hoursSinceDelivery = now.diff(deliveryDateTime, 'hour');
        const remainingHours = 24 - hoursSinceDelivery;
        
        alert(`Chưa thể hoàn tất đơn hàng. Đơn hàng chỉ có thể hoàn tất sau ít nhất 1 ngày kể từ khi giao xe.\n\nNgày giao xe: ${deliveryDateTime.format('DD/MM/YYYY HH:mm')}\nThời gian đã trôi qua: ${hoursSinceDelivery} giờ\nCòn lại: ${remainingHours} giờ`);
        return;
      }
    }

    setCompleteLoading(true);
    try {
      const response = await orderService.completeOrder(id, {
        completion_notes: completionNotes || undefined
      });
      
      if (response.success) {
        alert('Hoàn tất đơn hàng thành công!');
        handleCloseCompleteModal();
        loadOrderDetail(); // Reload order to get updated status
      } else {
        alert(response.message || 'Có lỗi xảy ra khi hoàn tất đơn hàng');
      }
    } catch (err: any) {
      console.error('Error completing order:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Lỗi kết nối API';
      alert(errorMessage);
    } finally {
      setCompleteLoading(false);
    }
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
          {/* Giao xe button - chỉ hiển thị khi order đã thanh toán đủ */}
          {(() => {
            const canDeliver = order.status === 'fully_paid' || order.status === 'fullyPayment';
            const canComplete = order.status === 'delivered';
            console.log('🔍 Button visibility check:', {
              status: order.status,
              canDeliver,
              canComplete
            });
            return null;
          })()}
          {(order.status === 'fully_paid' || order.status === 'fullyPayment') && (
            <Button 
              variant="contained" 
              color="primary"
              startIcon={<LocalShippingIcon />}
              onClick={handleOpenDeliveryModal}
            >
              Giao xe
            </Button>
          )}
          {/* Hoàn tất đơn hàng button - chỉ hiển thị khi đã giao xe */}
          {order.status === 'delivered' && (
            <Button 
              variant="contained" 
              color="success"
              startIcon={<CheckCircleIcon />}
              onClick={handleOpenCompleteModal}
            >
              Hoàn tất đơn hàng
            </Button>
          )}
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
                      <TableCell align="center" sx={{ width: '5%' }}>STT</TableCell>
                      <TableCell sx={{ width: '40%' }}>Tên hàng hóa, dịch vụ</TableCell>
                      <TableCell align="center" sx={{ width: '10%' }}>Đơn vị tính</TableCell>
                      <TableCell align="center" sx={{ width: '10%' }}>Số lượng</TableCell>
                      <TableCell align="right" sx={{ width: '15%' }}>Đơn giá</TableCell>
                      <TableCell align="right" sx={{ width: '20%' }}>Thành tiền</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={6} align="right" sx={{ fontSize: '0.75rem', fontStyle: 'italic' }}>
                        (Thành tiền = Số lượng × Đơn giá)
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(() => {
                      let rowIndex = 1;
                      const rows: JSX.Element[] = [];
                      
                      order.items.forEach((item: any, itemIndex: number) => {
                        const vehiclePrice = item.vehicle_price || 0;
                        const vehicleQuantity = item.quantity || 1;
                        const vehicleAmount = vehiclePrice * vehicleQuantity;
                        
                        // Vehicle row
                        rows.push(
                          <TableRow key={`vehicle-${itemIndex}`}>
                            <TableCell align="center">{rowIndex++}</TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {item.vehicle_name || 'N/A'}
                                {item.color && ` (Màu ${item.color})`}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">Chiếc</TableCell>
                            <TableCell align="center">{vehicleQuantity}</TableCell>
                            <TableCell align="right">{formatCurrency(vehiclePrice)}</TableCell>
                            <TableCell align="right">{formatCurrency(vehicleAmount)}</TableCell>
                          </TableRow>
                        );

                        // Options rows
                        if (item.options && item.options.length > 0) {
                          item.options.forEach((opt: any, optIndex: number) => {
                            const optPrice = opt.price || 0;
                            const optQuantity = opt.quantity || 1;
                            const optAmount = optPrice * optQuantity;
                            rows.push(
                              <TableRow key={`option-${itemIndex}-${optIndex}`}>
                                <TableCell align="center">{rowIndex++}</TableCell>
                                <TableCell>
                                  <Typography variant="body2">{opt.name || 'N/A'}</Typography>
                                </TableCell>
                                <TableCell align="center">Bộ</TableCell>
                                <TableCell align="center">{optQuantity}</TableCell>
                                <TableCell align="right">{formatCurrency(optPrice)}</TableCell>
                                <TableCell align="right">{formatCurrency(optAmount)}</TableCell>
                              </TableRow>
                            );
                          });
                        }

                        // Accessories rows
                        if (item.accessories && item.accessories.length > 0) {
                          item.accessories.forEach((acc: any, accIndex: number) => {
                            const accPrice = acc.price || 0;
                            const accQuantity = acc.quantity || 1;
                            const accAmount = accPrice * accQuantity;
                            rows.push(
                              <TableRow key={`accessory-${itemIndex}-${accIndex}`}>
                                <TableCell align="center">{rowIndex++}</TableCell>
                                <TableCell>
                                  <Typography variant="body2">{acc.name || 'N/A'}</Typography>
                                </TableCell>
                                <TableCell align="center">Chiếc</TableCell>
                                <TableCell align="center">{accQuantity}</TableCell>
                                <TableCell align="right">{formatCurrency(accPrice)}</TableCell>
                                <TableCell align="right">{formatCurrency(accAmount)}</TableCell>
                              </TableRow>
                            );
                          });
                        }
                      });
                      
                      return rows;
                    })()}
                    <TableRow>
                      <TableCell colSpan={5} sx={{ borderTop: '2px solid #333', fontWeight: 'bold', textAlign: 'right', paddingRight: '16px' }}>
                        <Typography variant="body1" fontWeight="bold">
                          Tổng cộng tiền thanh toán:
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ borderTop: '2px solid #333' }}>
                        <Typography
                          variant="body1"
                          fontWeight="bold"
                          color="error.main"
                          sx={{ fontSize: '1rem' }}
                        >
                          {formatCurrency(order.items.reduce((sum, item) => sum + (item.final_amount || 0), 0))}
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

      {/* Delivery Modal */}
      <Dialog 
        open={deliveryModalOpen} 
        onClose={handleCloseDeliveryModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Giao xe cho khách hàng</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                Thông tin người giao xe
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  sx={{ flex: 1, minWidth: '200px' }}
                  label="Họ tên người giao"
                  value={deliveryFormData.delivery_person_name}
                  onChange={(e) => setDeliveryFormData({ ...deliveryFormData, delivery_person_name: e.target.value })}
                  size="small"
                />
                <TextField
                  sx={{ flex: 1, minWidth: '200px' }}
                  label="Số điện thoại"
                  value={deliveryFormData.delivery_person_phone}
                  onChange={(e) => setDeliveryFormData({ ...deliveryFormData, delivery_person_phone: e.target.value })}
                  size="small"
                />
                <TextField
                  sx={{ flex: 1, minWidth: '200px' }}
                  label="CMND/CCCD"
                  value={deliveryFormData.delivery_person_id_card}
                  onChange={(e) => setDeliveryFormData({ ...deliveryFormData, delivery_person_id_card: e.target.value })}
                  size="small"
                />
              </Box>
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                Thông tin người nhận xe (Bắt buộc)
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  sx={{ flex: 1, minWidth: '200px' }}
                  required
                  label="Họ tên người nhận"
                  value={deliveryFormData.recipient_name}
                  onChange={(e) => setDeliveryFormData({ ...deliveryFormData, recipient_name: e.target.value })}
                  size="small"
                />
                <TextField
                  sx={{ flex: 1, minWidth: '200px' }}
                  required
                  label="Số điện thoại"
                  value={deliveryFormData.recipient_phone}
                  onChange={(e) => setDeliveryFormData({ ...deliveryFormData, recipient_phone: e.target.value })}
                  size="small"
                />
                <TextField
                  sx={{ flex: 1, minWidth: '200px' }}
                  label="Mối quan hệ"
                  value={deliveryFormData.recipient_relationship}
                  onChange={(e) => setDeliveryFormData({ ...deliveryFormData, recipient_relationship: e.target.value })}
                  size="small"
                  placeholder="VD: Chính chủ, Người thân..."
                />
              </Box>
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                label="Ngày giờ giao xe"
                type="datetime-local"
                value={deliveryFormData.actual_delivery_date}
                onChange={(e) => setDeliveryFormData({ ...deliveryFormData, actual_delivery_date: e.target.value })}
                size="small"
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Box>
            
            <Box>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Ghi chú giao xe"
                value={deliveryFormData.delivery_notes}
                onChange={(e) => setDeliveryFormData({ ...deliveryFormData, delivery_notes: e.target.value })}
                size="small"
                placeholder="Ghi chú về quá trình giao xe, tình trạng xe..."
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeliveryModal} disabled={deliveryLoading}>
            Hủy
          </Button>
          <Button 
            onClick={handleSubmitDelivery} 
            variant="contained" 
            color="primary"
            disabled={deliveryLoading}
          >
            {deliveryLoading ? <CircularProgress size={20} /> : 'Xác nhận giao xe'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Complete Order Modal */}
      <Dialog 
        open={completeModalOpen} 
        onClose={handleCloseCompleteModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Hoàn tất đơn hàng</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Đơn hàng đã được giao xe thành công. Bạn có muốn hoàn tất đơn hàng không?
            </Alert>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Ghi chú hoàn tất"
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              size="small"
              placeholder="Ghi chú về việc hoàn tất đơn hàng (tùy chọn)..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCompleteModal} disabled={completeLoading}>
            Hủy
          </Button>
          <Button 
            onClick={handleSubmitComplete} 
            variant="contained" 
            color="success"
            disabled={completeLoading}
          >
            {completeLoading ? <CircularProgress size={20} /> : 'Hoàn tất đơn hàng'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrderDetailMUI;