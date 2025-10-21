import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
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
  TextField,
  Alert,
  CircularProgress,
  Stack,
  Divider,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import {
  ShoppingCart as ShoppingCartIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import dayjs from 'dayjs';

import { orderService } from '../../services/orderService';
import { quoteService, Quote } from '../../services/quoteService';

interface QuoteToOrderConverterProps {
  visible: boolean;
  quote: Quote | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const QuoteToOrderConverterMUI: React.FC<QuoteToOrderConverterProps> = ({
  visible,
  quote,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [skipStockCheck, setSkipStockCheck] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (visible && quote) {
      setPaymentMethod('cash');
      setNotes(`Chuyển từ báo giá ${quote.code}`);
      generatePreview();
    } else {
      setPreviewData(null);
    }
  }, [visible, quote]);

  // Generate preview data
  const generatePreview = () => {
    if (!quote) return;

    const preview = {
      code: `ORD${dayjs().format('YYMMDDHHmmss')}`,
      customer: quote.customer,
      items: quote.items.map(item => ({
        vehicle_id: item.vehicle_id,
        vehicle_name: item.vehicle_name,
        vehicle_price: item.vehicle_price,
        color: item.color,
        quantity: item.quantity,
        discount: item.discount || 0,
        accessories: item.accessories || [],
        options: item.options || [],
        final_amount: item.final_amount
      })),
      final_amount: quote.final_amount,
      payment_method: paymentMethod,
      notes: notes,
      status: 'pending'
    };

    setPreviewData(preview);
  };

  // Handle form values change
  const handlePaymentMethodChange = (event: any) => {
    setPaymentMethod(event.target.value);
  };

  const handleNotesChange = (event: any) => {
    setNotes(event.target.value);
  };

  // Update preview when form values change
  useEffect(() => {
    if (quote) {
      generatePreview();
    }
  }, [paymentMethod, notes, quote]);

  // Convert quote to order
  const handleConvert = async () => {
    if (!quote || !previewData) return;

    setLoading(true);
    try {
      // Backend already stores colors in Vietnamese, no mapping needed
      const mappedItems = previewData.items.map((item: any) => ({
        ...item,
        // Keep original color as backend already has Vietnamese colors
        color: item.color
      }));

      const orderData = {
        customer_id: quote.customer_id,
        payment_method: previewData.payment_method,
        notes: skipStockCheck ? 
          `${previewData.notes}\n\n[LƯU Ý: Bỏ qua kiểm tra tồn kho đại lý - Chuyển đổi thủ công]` : 
          previewData.notes,
        items: mappedItems,
        skip_stock_check: skipStockCheck
      };

      console.log('🔍 Converting quote to order:', {
        quoteId: quote._id,
        customerId: quote.customer_id,
        itemsCount: mappedItems.length,
        totalAmount: quote.final_amount
      });
      
      // Debug: Log detailed item data being sent to backend
      console.log('📦 Items being sent to backend:', mappedItems);
      console.log('🎨 Colors (no mapping needed):', mappedItems.map((item: any) => item.color));
      console.log('📊 Stock check bypass:', skipStockCheck);

      const response = await orderService.createOrder(orderData);
      
      if (response && response.success) {
        // Update quote status to 'converted' after successful order creation
        try {
          console.log('🔄 Updating quote status...', { quoteId: quote._id, status: 'converted' });
          const updateResponse = await quoteService.updateQuote(quote._id, { status: 'converted' });
          console.log('✅ Quote status updated successfully:', updateResponse);
        } catch (updateError: any) {
          console.error('❌ Failed to update quote status:', updateError);
          console.error('❌ Error details:', {
            message: updateError?.message,
            response: updateError?.response?.data,
            status: updateError?.response?.status
          });
        }
        
        onSuccess();
        onClose();
      } else {
        throw new Error('Failed to create order');
      }
    } catch (error: any) {
      console.error('Error converting quote to order:', error);
      
      // Handle specific error messages from backend
      let errorMessage = 'Lỗi khi chuyển báo giá thành đơn hàng';
      let errorDetails = '';
      
      if (error?.response?.data?.message) {
        const backendMessage = error.response.data.message;
        
        // Handle stock insufficient error
        if (backendMessage.includes('Insufficient stock')) {
          errorMessage = 'Đại lý không đủ hàng trong kho';
          // Extract vehicle name and stock info from error message
          const stockMatch = backendMessage.match(/vehicle (.+?)\. Available: (\d+), Requested: (\d+)/);
          if (stockMatch) {
            const [, vehicleName, available, requested] = stockMatch;
            errorDetails = `Xe ${vehicleName}: Đại lý có ${available} chiếc trong kho, yêu cầu ${requested} chiếc.\n\nGiải pháp:\n- Liên hệ quản lý kho để nhập hàng\n- Kiểm tra dữ liệu tồn kho\n- Hoặc bỏ qua kiểm tra nếu chắc chắn có hàng`;
          } else {
            errorDetails = 'Vui lòng kiểm tra lại số lượng tồn kho của đại lý.';
          }
        } else if (backendMessage.includes('Vehicle not found')) {
          errorMessage = 'Không tìm thấy thông tin xe';
          errorDetails = 'Vui lòng thử lại sau.';
        } else if (backendMessage.includes('Customer not found')) {
          errorMessage = 'Không tìm thấy thông tin khách hàng';
          errorDetails = 'Vui lòng thử lại sau.';
        } else {
          errorMessage = backendMessage;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      // Show error to user with detailed message
      alert(`${errorMessage}\n\n${errorDetails || 'Vui lòng thử lại sau.'}`);
      console.error('Conversion error:', errorMessage, errorDetails);
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  if (!quote) return null;

  return (
    <Dialog
      open={visible}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '80vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <ShoppingCartIcon color="primary" />
          <Typography variant="h6">
            Chuyển báo giá thành đơn hàng
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3}>
          {/* Quote Information */}
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Thông tin báo giá gốc
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Mã báo giá
                  </Typography>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace', color: 'primary.main' }}>
                    {quote.code}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Ngày tạo
                  </Typography>
                  <Typography variant="body1">
                    {dayjs(quote.createdAt).format('DD/MM/YYYY HH:mm')}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Khách hàng
                  </Typography>
                  <Typography variant="body1">
                    {quote.customer?.full_name || 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Tổng tiền
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                    {formatCurrency(quote.final_amount)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Stock Warning */}
          <Alert
            severity="warning"
            icon={<WarningIcon />}
          >
            <Typography variant="body2">
              <strong>Lưu ý về tình trạng tồn kho đại lý:</strong> Hệ thống sẽ kiểm tra tình trạng tồn kho của đại lý khi tạo đơn hàng. 
              Nếu không đủ hàng trong kho đại lý, quá trình chuyển đổi sẽ thất bại.
            </Typography>
          </Alert>

          {/* Order Configuration */}
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Cấu hình đơn hàng
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phương thức thanh toán
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={handlePaymentMethodChange}
                    className="w-full px-4 py-3 pr-10 border-2 border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium transition-all duration-200 hover:border-gray-300 appearance-none cursor-pointer"
                  >
                    <option value="cash">Tiền mặt</option>
                    <option value="installment">Trả góp</option>
                  </select>
                </div>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Ghi chú"
                  value={notes}
                  onChange={handleNotesChange}
                  placeholder="Nhập ghi chú cho đơn hàng..."
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={skipStockCheck}
                      onChange={(e) => setSkipStockCheck(e.target.checked)}
                      color="warning"
                    />
                  }
                  label="Bỏ qua kiểm tra tồn kho đại lý (Chỉ dùng khi chắc chắn đại lý có hàng)"
                />
              </Box>
            </CardContent>
          </Card>

          {/* Preview */}
          {previewData && (
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Xem trước đơn hàng
                </Typography>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Đơn hàng sẽ được tạo với trạng thái 'Chờ xác nhận'
                </Alert>
                
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 2 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Mã đơn hàng
                    </Typography>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace', color: 'success.main' }}>
                      {previewData.code}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Trạng thái
                    </Typography>
                    <Chip label="Chờ xác nhận" color="warning" size="small" />
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Phương thức thanh toán
                    </Typography>
                    <Chip 
                      label={previewData.payment_method === 'cash' ? 'Tiền mặt' : 'Trả góp'} 
                      color={previewData.payment_method === 'cash' ? 'warning' : 'info'}
                      size="small"
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Tổng tiền
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                      {formatCurrency(previewData.final_amount)}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="h6" gutterBottom>
                  Sản phẩm trong đơn hàng
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
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
                      {previewData.items.map((item: any, index: number) => (
                        <TableRow key={`${item?.vehicle_id || 'unknown'}-${item?.color || 'default'}-${index}`}>
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
                            <Typography variant="body2">
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
                            {formatCurrency(previewData.items.reduce((sum: number, item: any) => sum + (item?.final_amount || 0), 0))}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Hủy
        </Button>
        {/* <Button 
          variant="outlined"
          color="info"
          onClick={async () => {
            try {
              // Try to get actual stock data from backend
              const stockCheck = quote.items.map((item: any) => {
                return `Xe ${item.vehicle_name} (${item.color}): Yêu cầu ${item.quantity} chiếc`;
              }).join('\n');
              
              // Show current quote items
              
              // Log detailed data for debugging
              console.log('🔍 Debug stock check:', {
                originalItems: quote.items,
                itemsToCheck: quote.items.map(item => ({
                  vehicle_name: item.vehicle_name,
                  color: item.color, // Already in Vietnamese
                  quantity: item.quantity,
                  vehicle_id: item.vehicle_id
                }))
              });
            } catch (error) {
              console.error('Error checking stock:', error);
            }
          }}
          disabled={loading}
        >
          Kiểm tra tồn kho
        </Button> */}
        <Button 
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
          onClick={handleConvert}
          disabled={loading}
        >
          {loading ? 'Đang xử lý...' : 'Chuyển thành đơn hàng'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuoteToOrderConverterMUI;