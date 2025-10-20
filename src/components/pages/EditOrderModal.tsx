import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Divider,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { Order, OrderItem } from '../../services/orderService';
import Swal from 'sweetalert2';

interface EditOrderModalProps {
  open: boolean;
  onClose: () => void;
  order: Order | null;
  onUpdate: (orderId: string, updateData: any) => Promise<void>;
}

interface EditOrderItem extends OrderItem {
  _tempId?: string; // For tracking items during editing
}

export const EditOrderModal: React.FC<EditOrderModalProps> = ({
  open,
  onClose,
  order,
  onUpdate,
}) => {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [items, setItems] = useState<EditOrderItem[]>([]);

  useEffect(() => {
    if (order) {
      setPaymentMethod(order.payment_method || 'cash');
      setNotes(order.notes || '');
      setItems(
        order.items?.map((item, index) => ({
          ...item,
          _tempId: `temp_${index}`,
        })) || []
      );
    }
  }, [order]);

  const handleAddItem = () => {
    const newItem: EditOrderItem = {
      _tempId: `temp_${Date.now()}`,
      vehicle_id: '',
      vehicle_name: '',
      vehicle_price: 0,
      color: '',
      quantity: 1,
      discount: 0,
      final_amount: 0,
      options: [],
      accessories: [],
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (tempId: string) => {
    setItems(items.filter(item => item._tempId !== tempId));
  };

  const handleItemChange = (tempId: string, field: keyof EditOrderItem, value: any) => {
    setItems(items.map(item => 
      item._tempId === tempId 
        ? { ...item, [field]: value }
        : item
    ));
  };

  const handleSubmit = async () => {
    if (!order) return;

    // Validate items
    if (items.length === 0) {
      await Swal.fire({
        title: 'Lỗi!',
        text: 'Đơn hàng phải có ít nhất 1 sản phẩm',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#ef4444'
      });
      return;
    }

    // Validate each item
    for (const item of items) {
      if (!item.vehicle_id) {
        await Swal.fire({
          title: 'Lỗi!',
          text: 'Vui lòng chọn xe cho tất cả sản phẩm',
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#ef4444'
        });
        return;
      }
    }

    try {
      setLoading(true);

      // Prepare update data
      const updateData = {
        items: items.map(item => ({
          vehicle_id: item.vehicle_id,
          color: item.color || undefined,
          quantity: item.quantity,
          discount: item.discount || 0,
          promotion_id: item.promotion_id || undefined,
          options: item.options?.map(opt => opt.option_id) || [],
          accessories: item.accessories?.map(acc => ({
            accessory_id: acc.accessory_id,
            quantity: acc.quantity,
          })) || [],
        })),
        payment_method: paymentMethod,
        notes: notes || undefined,
      };

      await onUpdate(order._id, updateData);

      await Swal.fire({
        title: 'Thành công!',
        text: 'Đơn hàng đã được cập nhật thành công.',
        icon: 'success',
        confirmButtonText: 'OK',
        confirmButtonColor: '#10b981'
      });

      onClose();
    } catch (error: any) {
      console.error('Error updating order:', error);
      await Swal.fire({
        title: 'Lỗi!',
        text: error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật đơn hàng',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!order) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { minHeight: '80vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            Chỉnh sửa đơn hàng {order.code}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Payment Method */}
          <FormControl fullWidth>
            <InputLabel>Phương thức thanh toán</InputLabel>
            <Select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              label="Phương thức thanh toán"
            >
              <MenuItem value="cash">Tiền mặt</MenuItem>
              <MenuItem value="installment">Trả góp</MenuItem>
            </Select>
          </FormControl>

          {/* Notes */}
          <TextField
            fullWidth
            label="Ghi chú"
            multiline
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Nhập ghi chú cho đơn hàng..."
          />

          <Divider />

          {/* Items Section */}
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Sản phẩm trong đơn hàng</Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddItem}
                size="small"
              >
                Thêm sản phẩm
              </Button>
            </Box>

            {items.map((item, index) => (
              <Box
                key={item._tempId}
                sx={{
                  border: '1px solid #e0e0e0',
                  borderRadius: 2,
                  p: 2,
                  mb: 2,
                  position: 'relative'
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Sản phẩm {index + 1}
                  </Typography>
                  <Tooltip title="Xóa sản phẩm">
                    <IconButton
                      onClick={() => handleRemoveItem(item._tempId!)}
                      size="small"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <TextField
                    label="Tên xe"
                    value={item.vehicle_name || ''}
                    disabled
                    helperText="Tên xe hiện tại (không thể thay đổi)"
                  />
                  
                  <TextField
                    label="Màu sắc"
                    value={item.color || ''}
                    onChange={(e) => handleItemChange(item._tempId!, 'color', e.target.value)}
                    placeholder="Nhập màu sắc"
                  />
                  
                  <TextField
                    label="Số lượng"
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(item._tempId!, 'quantity', parseInt(e.target.value) || 1)}
                    inputProps={{ min: 1 }}
                  />
                  
                  <TextField
                    label="Giảm giá (VNĐ)"
                    type="number"
                    value={item.discount || 0}
                    onChange={(e) => handleItemChange(item._tempId!, 'discount', parseInt(e.target.value) || 0)}
                    inputProps={{ min: 0 }}
                  />
                </Box>

                <Box mt={2}>
                  <Typography variant="body2" color="text.secondary">
                    Giá gốc: {item.vehicle_price?.toLocaleString('vi-VN')} ₫
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Thành tiền: {item.final_amount?.toLocaleString('vi-VN')} ₫
                  </Typography>
                </Box>
              </Box>
            ))}

            {items.length === 0 && (
              <Box
                sx={{
                  border: '2px dashed #e0e0e0',
                  borderRadius: 2,
                  p: 4,
                  textAlign: 'center',
                  color: 'text.secondary'
                }}
              >
                <Typography>Chưa có sản phẩm nào. Nhấn "Thêm sản phẩm" để bắt đầu.</Typography>
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Hủy
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          sx={{ minWidth: 120 }}
        >
          {loading ? 'Đang cập nhật...' : 'Cập nhật đơn hàng'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditOrderModal;
