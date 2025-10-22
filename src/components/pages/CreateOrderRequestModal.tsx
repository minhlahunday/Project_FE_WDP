import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  Alert,
  Stack,
} from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
import Swal from "sweetalert2";

import {
  orderService,
  CreateOrderRequestData,
  OrderRequestItem,
} from "../../services/orderService";

interface CreateOrderRequestModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateOrderRequestModal: React.FC<
  CreateOrderRequestModalProps
> = ({ open, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<OrderRequestItem[]>([
    { vehicle_id: "", color: "", quantity: 1 },
  ]);

  const handleAddItem = () => {
    setItems([...items, { vehicle_id: "", color: "", quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (
    index: number,
    field: keyof OrderRequestItem,
    value: string | number
  ) => {
    const updatedItems = items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    setItems(updatedItems);
  };

  const handleSubmit = async () => {
    // Validate form
    const validItems = items.filter((item) => item.vehicle_id.trim() !== "");
    if (validItems.length === 0) {
      setError("Vui lòng thêm ít nhất một xe");
      return;
    }

    // Check for valid quantities
    const invalidQuantity = validItems.some((item) => item.quantity <= 0);
    if (invalidQuantity) {
      setError("Số lượng xe phải lớn hơn 0");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const requestData: CreateOrderRequestData = {
        items: validItems,
        notes: notes.trim() || undefined,
      };

      await orderService.createOrderRequest(requestData);

      await Swal.fire({
        title: "Thành công!",
        text: "Yêu cầu đặt xe đã được tạo thành công.",
        icon: "success",
        confirmButtonText: "OK",
        confirmButtonColor: "#10b981",
      });

      handleClose();
      onSuccess();
    } catch (error: any) {
      console.error("Error creating order request:", error);
      setError(
        error.response?.data?.message || "Có lỗi xảy ra khi tạo yêu cầu"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNotes("");
    setItems([{ vehicle_id: "", color: "", quantity: 1 }]);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Tạo yêu cầu đặt xe mới</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Typography variant="h6" sx={{ mb: 2 }}>
            Danh sách xe yêu cầu
          </Typography>

          {items.map((item, index) => (
            <Box
              key={index}
              sx={{
                p: 2,
                border: "1px solid #e0e0e0",
                borderRadius: 1,
                mb: 2,
                position: "relative",
              }}
            >
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Xe #{index + 1}
              </Typography>

              {items.length > 1 && (
                <IconButton
                  onClick={() => handleRemoveItem(index)}
                  sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    color: "#ef4444",
                  }}
                  size="small"
                >
                  <DeleteIcon />
                </IconButton>
              )}

              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label="Mã xe / Tên xe"
                  value={item.vehicle_id}
                  onChange={(e) =>
                    handleItemChange(index, "vehicle_id", e.target.value)
                  }
                  required
                  placeholder="Nhập mã xe hoặc tên xe"
                />

                <Box sx={{ display: "flex", gap: 2 }}>
                  <TextField
                    label="Màu sắc"
                    value={item.color || ""}
                    onChange={(e) =>
                      handleItemChange(index, "color", e.target.value)
                    }
                    placeholder="Ví dụ: Đỏ, Xanh..."
                    sx={{ flex: 1 }}
                  />

                  <TextField
                    label="Số lượng"
                    type="number"
                    value={item.quantity}
                    onChange={(e) =>
                      handleItemChange(
                        index,
                        "quantity",
                        parseInt(e.target.value) || 1
                      )
                    }
                    required
                    inputProps={{ min: 1 }}
                    sx={{ width: 120 }}
                  />
                </Box>
              </Stack>
            </Box>
          ))}

          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddItem}
            sx={{ mb: 3 }}
          >
            Thêm xe
          </Button>

          <TextField
            fullWidth
            label="Ghi chú"
            multiline
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ghi chú thêm về yêu cầu (tùy chọn)"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Hủy
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          sx={{
            bgcolor: "#1976d2",
            "&:hover": { bgcolor: "#1565c0" },
          }}
        >
          {loading ? "Đang xử lý..." : "Tạo yêu cầu"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateOrderRequestModal;
