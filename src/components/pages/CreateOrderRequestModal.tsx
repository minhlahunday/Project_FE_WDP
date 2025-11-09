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
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

import {
  orderService,
  CreateOrderRequestData,
  OrderRequestItem,
} from "../../services/orderService";
import { authService } from "../../services/authService";

interface VehicleOption {
  _id: string;
  name: string;
  category: string;
  price: number;
  sku: string;
  manufacturer_name: string;
  color_options: string[];
}

interface CreateOrderRequestModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialItems?: OrderRequestItem[];
  initialNotes?: string;
}

export const CreateOrderRequestModal: React.FC<
  CreateOrderRequestModalProps
> = ({ open, onClose, onSuccess, initialItems, initialNotes }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<OrderRequestItem[]>([
    { vehicle_id: "", color: "", quantity: 1 },
  ]);

  // Vehicle selection states
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [vehicleLoading, setVehicleLoading] = useState(false);

  // Update items when initialItems changes
  React.useEffect(() => {
    if (open && initialItems && initialItems.length > 0) {
      setItems(initialItems);
    } else if (open && !initialItems) {
      setItems([{ vehicle_id: "", color: "", quantity: 1 }]);
    }
  }, [open, initialItems]);

  // Update notes when initialNotes changes
  React.useEffect(() => {
    if (open && initialNotes) {
      setNotes(initialNotes);
    } else if (open && !initialNotes) {
      setNotes("");
    }
  }, [open, initialNotes]);

  // Load vehicles when modal opens
  React.useEffect(() => {
    if (open) {
      loadVehicles();
    }
  }, [open]);

  const loadVehicles = async () => {
    try {
      setVehicleLoading(true);
      setError(null);

      console.log("🚀 Loading vehicles for order request modal...");
      const response = await authService.getVehicles({
        page: 1,
        limit: 100, // Get all vehicles
      });

      if (response.success && response.data) {
        const responseData = response.data as Record<string, unknown>;
        console.log("✅ Vehicles loaded successfully:", responseData.data);
        const vehiclesData = responseData.data as unknown[];

        // Transform vehicle data to our format
        const transformedVehicles: VehicleOption[] = vehiclesData.map(
          (vehicle) => {
            const v = vehicle as Record<string, unknown>;
            const manufacturer = v.manufacturer_id as Record<string, unknown>;
            return {
              _id: v._id as string,
              name: v.name as string,
              category: v.category as string,
              price: v.price as number,
              sku: v.sku as string,
              manufacturer_name:
                (manufacturer?.name as string) || "Unknown Manufacturer",
              color_options: (v.color_options as string[]) || [],
            };
          }
        );

        setVehicles(transformedVehicles);
        console.log(
          `📋 Transformed ${transformedVehicles.length} vehicles for selection`
        );
      } else {
        console.error("❌ Failed to load vehicles:", response.message);
        setError("Không thể tải danh sách xe");
      }
    } catch (err) {
      console.error("❌ Error loading vehicles:", err);
      setError("Lỗi khi tải danh sách xe");
    } finally {
      setVehicleLoading(false);
    }
  };

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
    const validItems = items.filter(
      (item) => item.vehicle_id && item.vehicle_id.trim() !== ""
    );
    if (validItems.length === 0) {
      setError("Vui lòng chọn ít nhất một xe");
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

      // Redirect to order requests page
      navigate("/portal/order-requests");
    } catch (error: unknown) {
      console.error("Error creating order request:", error);
      const errorObj = error as Record<string, unknown>;
      const response = errorObj.response as Record<string, unknown>;
      const data = response?.data as Record<string, unknown>;
      setError((data?.message as string) || "Có lỗi xảy ra khi tạo yêu cầu");
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
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      sx={{
        zIndex: "9999 !important", // Much higher zIndex with !important
        "& .MuiDialog-paper": {
          zIndex: "10000 !important",
          position: "relative !important",
        },
        "& .MuiBackdrop-root": {
          zIndex: "9998 !important",
        },
      }}
      BackdropProps={{
        sx: {
          zIndex: "9998 !important",
          backgroundColor: "rgba(0, 0, 0, 0.5) !important",
        },
      }}
      disablePortal={false}
      keepMounted={false}
    >
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
                {vehicleLoading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : (
                  <Box>
                    <FormControl fullWidth required>
                      <InputLabel>Chọn xe</InputLabel>
                      <Select
                        value={item.vehicle_id || ""}
                        label="Chọn xe"
                        displayEmpty
                        onChange={(e) => {
                          const selectedVehicle = vehicles.find(
                            (v) => v._id === e.target.value
                          );

                          // Update all fields in one go to avoid state batching issues
                          const updatedItems = items.map((item, i) => {
                            if (i === index) {
                              return {
                                ...item,
                                vehicle_id: e.target.value,
                                vehicle_name: selectedVehicle?.name || "",
                                color:
                                  selectedVehicle?.color_options?.[0] ||
                                  item.color ||
                                  "",
                              };
                            }
                            return item;
                          });

                          setItems(updatedItems);
                        }}
                        renderValue={(selected) => {
                          if (!selected || selected === "") {
                            return "Chọn xe";
                          }

                          const selectedVehicle = vehicles.find(
                            (v) => v._id === selected
                          );

                          if (selectedVehicle) {
                            return `${selectedVehicle.name} - ${selectedVehicle.manufacturer_name}`;
                          }

                          return "Chọn xe";
                        }}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              zIndex: 10001,
                              maxHeight: 300,
                            },
                          },
                          MenuListProps: {
                            sx: {
                              zIndex: 10001,
                            },
                          },
                        }}
                      >
                        <MenuItem value="">
                          <em>Chọn xe</em>
                        </MenuItem>
                        {vehicles.map((vehicle) => (
                          <MenuItem key={vehicle._id} value={vehicle._id}>
                            <Box>
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 500 }}
                              >
                                {vehicle.name} - {vehicle.manufacturer_name}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                display="block"
                              >
                                {vehicle.category.toUpperCase()} •{" "}
                                {vehicle.price.toLocaleString()} VNĐ
                              </Typography>
                              {vehicle.color_options.length > 0 && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  display="block"
                                >
                                  Màu: {vehicle.color_options.join(", ")}
                                </Typography>
                              )}
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                )}

                <Box sx={{ display: "flex", gap: 2 }}>
                  {(() => {
                    const selectedVehicle = vehicles.find(
                      (v) => v._id === item.vehicle_id
                    );
                    if (
                      selectedVehicle &&
                      selectedVehicle.color_options.length > 0
                    ) {
                      return (
                        <FormControl sx={{ flex: 1 }}>
                          <InputLabel>Màu sắc</InputLabel>
                          <Select
                            value={item.color || ""}
                            label="Màu sắc"
                            onChange={(e) =>
                              handleItemChange(index, "color", e.target.value)
                            }
                            MenuProps={{
                              PaperProps: {
                                sx: {
                                  zIndex: 10001,
                                  maxHeight: 300,
                                },
                              },
                            }}
                          >
                            {selectedVehicle.color_options.map((color) => (
                              <MenuItem key={color} value={color}>
                                {color}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      );
                    }
                    return (
                      <TextField
                        label="Màu sắc"
                        value={item.color || ""}
                        onChange={(e) =>
                          handleItemChange(index, "color", e.target.value)
                        }
                        placeholder="Nhập màu sắc..."
                        sx={{ flex: 1 }}
                      />
                    );
                  })()}

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
