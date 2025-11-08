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
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import dayjs from 'dayjs';

import { orderService } from '../../services/orderService';
import { quoteService, Quote } from '../../services/quoteService';
import { customerService } from '../../services/customerService';

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
  const [customer, setCustomer] = useState<any>(null);

  // Helper function to get customer from quote
  const getCustomerFromQuote = (q: Quote | null) => {
    if (!q) return null;
    const quoteAny = q as any;
    // Check if customer_id is populated as object
    if (quoteAny.customer_id && typeof quoteAny.customer_id === 'object') {
      return quoteAny.customer_id;
    }
    // Check if customer exists
    if (q.customer) {
      return q.customer;
    }
    return null;
  };

  // Fetch customer if needed
  useEffect(() => {
    const fetchCustomer = async () => {
      if (!quote) {
        setCustomer(null);
        return;
      }

      const quoteAny = quote as any;
      const customerFromQuote = getCustomerFromQuote(quote);
      
      // If customer is already an object, use it
      if (customerFromQuote) {
        setCustomer(customerFromQuote);
        return;
      }

      // If customer_id is a string, fetch customer from API
      if (quoteAny.customer_id && typeof quoteAny.customer_id === 'string') {
        try {
          const customerData = await customerService.getCustomerById(quoteAny.customer_id);
          // Transform to match expected format
          setCustomer({
            _id: customerData.id,
            full_name: customerData.name,
            email: customerData.email,
            phone: customerData.phone,
            address: customerData.address
          });
        } catch (error) {
          console.error('Error fetching customer:', error);
          setCustomer(null);
        }
      } else {
        setCustomer(null);
      }
    };

    if (visible && quote) {
      fetchCustomer();
    } else {
      setCustomer(null);
    }
  }, [visible, quote]);

  // Reset form when modal opens/closes and regenerate preview when customer changes
  useEffect(() => {
    if (visible && quote) {
      setPaymentMethod('cash');
      setNotes(`Chuyển từ báo giá ${quote.code}`);
    } else {
      setPreviewData(null);
    }
  }, [visible, quote]);

  // Regenerate preview when customer is loaded
  useEffect(() => {
    if (visible && quote) {
      generatePreview();
    }
  }, [visible, quote, customer]);

  // Generate preview data
  const generatePreview = () => {
    if (!quote) return;

    // Use customer from state (which may be fetched from API)
    const customerData = customer || getCustomerFromQuote(quote);

    const preview = {
      code: `ORD${dayjs().format('YYMMDDHHmmss')}`,
      customer: customerData,
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

  const handleConvert = async () => {
    if (!quote || !previewData) return;

    setLoading(true);
    try {
      const orderData = {
        quote_id: quote._id, 
        notes: skipStockCheck ? 
          `${previewData.notes}\n\n[LƯU Ý: Bỏ qua kiểm tra tồn kho đại lý - Chuyển đổi thủ công]` : 
          previewData.notes,
        
      };

      console.log('🔍 Converting quote to order:', {
        quoteId: quote._id,
        notes: orderData.notes,
        skipStockCheck: skipStockCheck
      });

      const response = await orderService.createOrder(orderData);
      
      if (response && response.success) {
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
        } else if (backendMessage.includes('quote_id là bắt buộc')) {
          errorMessage = 'Lỗi hệ thống: Thiếu thông tin báo giá';
          errorDetails = 'Vui lòng tải lại trang và thử lại.';
        } else if (backendMessage.includes('Báo giá không hợp lệ')) {
          errorMessage = 'Báo giá không hợp lệ hoặc đã hết hạn';
          errorDetails = 'Chỉ có thể tạo đơn hàng từ báo giá có trạng thái "valid".';
        } else if (backendMessage.includes('đã được chuyển thành đơn hàng')) {
          errorMessage = 'Báo giá này đã được chuyển thành đơn hàng';
          errorDetails = 'Mỗi báo giá chỉ có thể chuyển thành đơn hàng một lần.';
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
                    {customer?.full_name || customer?.name || 'N/A'}
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

          
          {/* Order Configuration */}
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Thông tin thanh toán
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
                    <option value="cash">Trả thẳng</option>
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
                {/* <FormControlLabel
                  control={
                    <Checkbox
                      checked={skipStockCheck}
                      onChange={(e) => setSkipStockCheck(e.target.checked)}
                      color="warning"
                    />
                  }
                  label="Bỏ qua kiểm tra tồn kho đại lý (Chỉ dùng khi chắc chắn đại lý có hàng)"
                /> */}
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
                      label={previewData.payment_method === 'cash' ? 'Trả thẳng' : 'Trả góp'} 
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
                        
                        previewData.items.forEach((item: any, itemIndex: number) => {
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