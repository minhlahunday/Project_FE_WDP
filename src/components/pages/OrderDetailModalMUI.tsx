import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  Stack,
  Divider,
  TextField,
} from "@mui/material";
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Description as DescriptionIcon,
  Print as PrintIcon,
  AttachMoney as AttachMoneyIcon,
  ShoppingCart as ShoppingCartIcon,
  LocalShipping as LocalShippingIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";
import dayjs from "dayjs";

import { orderService } from "../../services/orderService";
import { Order } from "../../types/index";
import ContractGenerator from "./ContractGenerator";
import ContractUpload from "./ContractUpload";
import DepositPayment from "./DepositPayment";
import ContractViewer from "./ContractViewer";
import CreateOrderRequestModal from "./CreateOrderRequestModal";
import Swal from "sweetalert2";

interface OrderDetailModalProps {
  visible: boolean;
  orderId: string | null;
  onClose: () => void;
  onEdit?: (order: Order) => void;
  onRefresh?: () => void;
}

export const OrderDetailModalMUI: React.FC<OrderDetailModalProps> = ({
  visible,
  orderId,
  onClose,
  onEdit,
  onRefresh,
}) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Workflow modal states
  const [contractGeneratorVisible, setContractGeneratorVisible] =
    useState(false);
  const [contractUploadVisible, setContractUploadVisible] = useState(false);
  const [depositPaymentVisible, setDepositPaymentVisible] = useState(false);
  const [contractViewerVisible, setContractViewerVisible] = useState(false);
  const [orderRequestModalVisible, setOrderRequestModalVisible] =
    useState(false);

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
  const loadOrderDetail = useCallback(async () => {
    if (!orderId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await orderService.getOrderById(orderId);

      if (response && response.success) {
        console.log("Order detail response:", response);

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
          // Handle populated fields from backend
          const processedOrder = {
            ...orderData,
            // Map customer_id (populated object) to customer
            customer:
              (orderData as any).customer_id &&
              typeof (orderData as any).customer_id === "object"
                ? (orderData as any).customer_id
                : (orderData as any).customer,
            // Map salesperson_id (populated object) to salesperson
            salesperson:
              (orderData as any).salesperson_id &&
              typeof (orderData as any).salesperson_id === "object"
                ? (orderData as any).salesperson_id
                : (orderData as any).salesperson,
          };

          console.log("Processed order data:", processedOrder);
          setOrder(processedOrder);
        } else {
          throw new Error("No order data found in response");
        }
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err: any) {
      console.error("Error loading order detail:", err);
      const errorMessage =
        err?.response?.data?.message || err?.message || "Lỗi kết nối API";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (visible && orderId) {
      loadOrderDetail();
    } else {
      setOrder(null);
      setError(null);
    }
  }, [visible, orderId, loadOrderDetail]);

  // Status color mapping
  const getStatusColor = (status: string) => {
    const statusColors = {
      pending: "warning",
      confirmed: "info",
      halfPayment: "secondary",
      deposit_paid: "warning",
      fullyPayment: "success",
      fully_paid: "success",
      waiting_vehicle_request: "warning",
      vehicle_ready: "info",
      delivered: "success",
      completed: "success",
      closed: "default",
      cancelled: "error",
      canceled: "error",
    };
    return statusColors[status as keyof typeof statusColors] || "default";
  };

  // Status text mapping
  const getStatusText = (status: string) => {
    const statusTexts = {
      pending: "Chờ cọc",
      confirmed: "Đã xác nhận",
      halfPayment: "Đã đặt cọc",
      deposit_paid: "Đã đặt cọc",
      fullyPayment: "Đã thanh toán",
      fully_paid: "Đã thanh toán đủ",
      waiting_vehicle_request: "Chờ yêu cầu xe",
      vehicle_ready: "Xe sẵn sàng",
      delivered: "Đã giao",
      completed: "Hoàn thành",
      closed: "Đã đóng",
      cancelled: "Đã hủy",
      canceled: "Đã hủy",
    };
    return statusTexts[status as keyof typeof statusTexts] || status;
  };

  // Get status chip style with gradient background for MUI Chip
  const getStatusChipStyle = (status: string) => {
    const styleMap: { [key: string]: any } = {
      pending: {
        background: 'linear-gradient(135deg, #faad14 0%, #ffc53d 100%)',
        color: '#fff',
        border: 'none',
        fontWeight: 600,
        boxShadow: '0 2px 4px rgba(250, 173, 20, 0.3)',
      },
      confirmed: {
        background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
        color: '#fff',
        border: 'none',
        fontWeight: 600,
        boxShadow: '0 2px 4px rgba(24, 144, 255, 0.3)',
      },
      halfPayment: {
        background: 'linear-gradient(135deg, #fa8c16 0%, #ffa940 100%)',
        color: '#fff',
        border: 'none',
        fontWeight: 600,
        boxShadow: '0 2px 4px rgba(250, 140, 22, 0.3)',
      },
      deposit_paid: {
        background: 'linear-gradient(135deg, #fa8c16 0%, #ffa940 100%)',
        color: '#fff',
        border: 'none',
        fontWeight: 600,
        boxShadow: '0 2px 4px rgba(250, 140, 22, 0.3)',
      },
      fullyPayment: {
        background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
        color: '#fff',
        border: 'none',
        fontWeight: 600,
        boxShadow: '0 2px 4px rgba(82, 196, 26, 0.3)',
      },
      fully_paid: {
        background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
        color: '#fff',
        border: 'none',
        fontWeight: 600,
        boxShadow: '0 2px 4px rgba(82, 196, 26, 0.3)',
      },
      waiting_vehicle_request: {
        background: 'linear-gradient(135deg, #faad14 0%, #ffc53d 100%)',
        color: '#fff',
        border: 'none',
        fontWeight: 600,
        boxShadow: '0 2px 4px rgba(250, 173, 20, 0.3)',
      },
      vehicle_ready: {
        background: 'linear-gradient(135deg, #13c2c2 0%, #36cfc9 100%)',
        color: '#fff',
        border: 'none',
        fontWeight: 600,
        boxShadow: '0 2px 4px rgba(19, 194, 194, 0.3)',
      },
      delivered: {
        background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
        color: '#fff',
        border: 'none',
        fontWeight: 600,
        boxShadow: '0 2px 4px rgba(82, 196, 26, 0.3)',
      },
      completed: {
        background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
        color: '#fff',
        border: 'none',
        fontWeight: 600,
        boxShadow: '0 2px 4px rgba(82, 196, 26, 0.3)',
      },
      closed: {
        background: 'linear-gradient(135deg, #8c8c8c 0%, #bfbfbf 100%)',
        color: '#fff',
        border: 'none',
        fontWeight: 600,
        boxShadow: '0 2px 4px rgba(140, 140, 140, 0.3)',
      },
      cancelled: {
        background: 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)',
        color: '#fff',
        border: 'none',
        fontWeight: 600,
        boxShadow: '0 2px 4px rgba(255, 77, 79, 0.3)',
      },
      canceled: {
        background: 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)',
        color: '#fff',
        border: 'none',
        fontWeight: 600,
        boxShadow: '0 2px 4px rgba(255, 77, 79, 0.3)',
      },
    };
    return styleMap[status] || {};
  };

  // Delivery status text mapping
  const getDeliveryStatusText = (status: string) => {
    const deliveryStatusTexts = {
      pending: "Chờ xác nhận",
      scheduled: "Đã lên lịch",
      in_transit: "Đang giao",
      delivered: "Đã giao",
      cancelled: "Đã hủy",
      canceled: "Đã hủy",
    };
    return deliveryStatusTexts[status as keyof typeof deliveryStatusTexts] || status;
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const handleClose = () => {
    setOrder(null);
    setError(null);
    onClose();
  };

  // Workflow handlers
  const handleGenerateContract = () => {
    setContractGeneratorVisible(true);
  };

  const handleUploadContract = () => {
    console.log(
      "🔍 Opening upload contract for order:",
      order?._id,
      order?.code
    );
    setContractUploadVisible(true);
  };

  const handleDepositPayment = () => {
    setDepositPaymentVisible(true);
  };

  const handleViewContract = () => {
    setContractViewerVisible(true);
  };

  const handleOpenOrderRequest = () => {
    setOrderRequestModalVisible(true);
  };

  const handleWorkflowSuccess = () => {
    // Refresh order data
    loadOrderDetail();
    // Refresh parent component
    onRefresh?.();
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
    if (!order || !orderId) return;

    // Validate required fields
    if (!deliveryFormData.recipient_name || !deliveryFormData.recipient_phone) {
      await Swal.fire({
        title: "Thiếu thông tin",
        text: "Vui lòng nhập đầy đủ thông tin người nhận",
        icon: "warning",
        confirmButtonText: "OK",
        confirmButtonColor: "#faad14",
      });
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

      const response = await orderService.deliverOrder(orderId, deliveryData);
      
      if (response.success) {
        await Swal.fire({
          title: "Thành công!",
          text: "Đã giao xe cho khách hàng thành công.",
          icon: "success",
          confirmButtonText: "OK",
          confirmButtonColor: "#10b981",
        });
        handleCloseDeliveryModal();
        handleWorkflowSuccess(); // Reload order
      } else {
        await Swal.fire({
          title: "Lỗi!",
          text: response.message || 'Có lỗi xảy ra khi giao xe',
          icon: "error",
          confirmButtonText: "OK",
          confirmButtonColor: "#ef4444",
        });
      }
    } catch (err: any) {
      console.error('Error delivering order:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Lỗi kết nối API';
      await Swal.fire({
        title: "Lỗi!",
        text: errorMessage,
        icon: "error",
        confirmButtonText: "OK",
        confirmButtonColor: "#ef4444",
      });
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
    if (!order || !orderId) return;

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
          title: "Chưa thể hoàn tất",
          html: `
            <p>Đơn hàng chỉ có thể hoàn tất sau ít nhất <strong>1 ngày</strong> kể từ khi giao xe.</p>
            <p style="margin-top: 10px;">
              <strong>Ngày giao xe:</strong> ${deliveryDateTime.format('DD/MM/YYYY HH:mm')}<br/>
              <strong>Thời gian đã trôi qua:</strong> ${hoursSinceDelivery} giờ<br/>
              <strong>Còn lại:</strong> ${remainingHours} giờ
            </p>
          `,
          icon: "warning",
          confirmButtonText: "Đã hiểu",
          confirmButtonColor: "#3b82f6",
        });
        return;
      }
    }

    setCompleteLoading(true);
    try {
      const response = await orderService.completeOrder(orderId, {
        completion_notes: completionNotes || undefined
      });
      
      if (response.success) {
        await Swal.fire({
          title: "Thành công!",
          text: "Đã hoàn tất đơn hàng thành công.",
          icon: "success",
          confirmButtonText: "OK",
          confirmButtonColor: "#10b981",
        });
        handleCloseCompleteModal();
        handleWorkflowSuccess(); // Reload order
      } else {
        await Swal.fire({
          title: "Lỗi!",
          text: response.message || 'Có lỗi xảy ra khi hoàn tất đơn hàng',
          icon: "error",
          confirmButtonText: "OK",
          confirmButtonColor: "#ef4444",
        });
      }
    } catch (err: any) {
      console.error('Error completing order:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Lỗi kết nối API';
      await Swal.fire({
        title: "Lỗi!",
        text: errorMessage,
        icon: "error",
        confirmButtonText: "OK",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setCompleteLoading(false);
    }
  };

  // Debug logging - removed for production

  return (
    <>
      <Dialog
        open={visible}
        onClose={handleClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            minHeight: "80vh",
            maxHeight: "90vh",
            zIndex: 10001,
            position: "relative",
          },
        }}
        sx={{
          zIndex: 10000,
          "& .MuiBackdrop-root": {
            zIndex: 9999,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
          },
          "& .MuiDialog-paper": {
            position: "relative",
            zIndex: 10001,
            maxWidth: "90vw",
            maxHeight: "90vh",
            margin: "auto",
            borderRadius: "12px",
            boxShadow:
              "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            border: "1px solid rgba(0, 0, 0, 0.05)",
          },
        }}
      >
        <DialogTitle>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h5" component="div" fontWeight="bold">
              Chi tiết đơn hàng {order?.code || orderId}
            </Typography>
            <IconButton onClick={handleClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <Divider />

        <DialogContent dividers sx={{ p: 3 }}>
          {loading && (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              minHeight="200px"
            >
              <CircularProgress />
            </Box>
          )}

          {error && (
            <Alert
              severity="error"
              action={
                <Button size="small" onClick={loadOrderDetail}>
                  Thử lại
                </Button>
              }
              sx={{ mb: 2 }}
            >
              {error}
            </Alert>
          )}

          {order && !loading && (
            <Box sx={{ maxHeight: "60vh", overflow: "auto" }}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", md: "row" },
                  gap: 3,
                }}
              >
                {/* Order Information */}
                <Box sx={{ flex: 2 }}>
                  <Paper elevation={1} sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom fontWeight="bold">
                      Thông tin đơn hàng
                    </Typography>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: 2,
                      }}
                    >
                      <Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          gutterBottom
                        >
                          Mã đơn hàng
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{
                            fontFamily: "monospace",
                            color: "primary.main",
                            fontWeight: "bold",
                          }}
                        >
                          {order.code}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          gutterBottom
                        >
                          Trạng thái
                        </Typography>
                        <Chip
                          label={getStatusText(order.status)}
                          sx={getStatusChipStyle(order.status)}
                          size="small"
                        />
                      </Box>
                      <Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          gutterBottom
                        >
                          Phương thức thanh toán
                        </Typography>
                        <Chip
                          label={
                            order.payment_method === "cash"
                              ? "Tiền mặt"
                              : "Trả góp"
                          }
                          color={
                            order.payment_method === "cash" ? "warning" : "info"
                          }
                          size="small"
                        />
                      </Box>
                      <Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          gutterBottom
                        >
                          Tổng tiền
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{ color: "success.main", fontWeight: "bold" }}
                        >
                          {formatCurrency(order.final_amount)}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          gutterBottom
                        >
                          Đã thanh toán
                        </Typography>
                        <Typography variant="body1">
                          {formatCurrency(order.paid_amount)}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          gutterBottom
                        >
                          Còn lại
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{ color: "warning.main", fontWeight: "bold" }}
                        >
                          {formatCurrency(
                            order.final_amount - order.paid_amount
                          )}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          gutterBottom
                        >
                          Ngày tạo
                        </Typography>
                        <Typography variant="body1">
                          {dayjs(order.createdAt).format("DD/MM/YYYY HH:mm:ss")}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          gutterBottom
                        >
                          Hợp đồng đã ký
                        </Typography>
                        <Chip
                          label={
                            (order.contract?.signed_contract_urls && order.contract.signed_contract_urls.length > 0)
                              ? "Đã ký"
                              : "Chưa ký"
                          }
                          color={
                            (order.contract?.signed_contract_urls && order.contract.signed_contract_urls.length > 0)
                              ? "success"
                              : "error"
                          }
                          size="small"
                        />
                      </Box>
                      {order.notes && (
                        <Box sx={{ gridColumn: "1 / -1" }}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            gutterBottom
                          >
                            Ghi chú
                          </Typography>
                          <Typography variant="body1">{order.notes}</Typography>
                        </Box>
                      )}
                    </Box>
                  </Paper>

                  {/* Order Items */}
                  <Paper elevation={1} sx={{ p: 3, mt: 3 }}>
                    <Typography variant="h6" gutterBottom fontWeight="bold">
                      Sản phẩm trong đơn hàng
                    </Typography>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell align="center" sx={{ width: "5%" }}>
                              STT
                            </TableCell>
                            <TableCell sx={{ width: "40%" }}>
                              Tên hàng hóa, dịch vụ
                            </TableCell>
                            <TableCell align="center" sx={{ width: "10%" }}>
                              Đơn vị tính
                            </TableCell>
                            <TableCell align="center" sx={{ width: "10%" }}>
                              Số lượng
                            </TableCell>
                            <TableCell align="right" sx={{ width: "15%" }}>
                              Đơn giá
                            </TableCell>
                            <TableCell align="right" sx={{ width: "20%" }}>
                              Thành tiền
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell
                              colSpan={6}
                              align="right"
                              sx={{ fontSize: "0.75rem", fontStyle: "italic" }}
                            >
                              (Thành tiền = Số lượng × Đơn giá)
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {(() => {
                            let rowIndex = 1;
                            const rows: JSX.Element[] = [];

                            order.items.forEach((item: any) => {
                              const vehicleAmount =
                                (item.vehicle_price || 0) *
                                (item.quantity || 1);

                              // Vehicle row
                              rows.push(
                                <TableRow key={`vehicle-${rowIndex}`}>
                                  <TableCell align="center">
                                    {rowIndex++}
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2">
                                      {item.vehicle_name || "N/A"}
                                      {item.color && ` (Màu ${item.color})`}
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="center">Chiếc</TableCell>
                                  <TableCell align="center">
                                    {item.quantity || 1}
                                  </TableCell>
                                  <TableCell align="right">
                                    {formatCurrency(item.vehicle_price || 0)}
                                  </TableCell>
                                  <TableCell align="right">
                                    {formatCurrency(vehicleAmount)}
                                  </TableCell>
                                </TableRow>
                              );

                              // Accessories rows
                              if (
                                item.accessories &&
                                item.accessories.length > 0
                              ) {
                                item.accessories.forEach(
                                  (acc: any, accIndex: number) => {
                                    const accAmount =
                                      (acc.price || 0) * (acc.quantity || 1);
                                    rows.push(
                                      <TableRow
                                        key={`accessory-${rowIndex}-${accIndex}`}
                                      >
                                        <TableCell align="center">
                                          {rowIndex++}
                                        </TableCell>
                                        <TableCell>
                                          <Typography variant="body2">
                                            {acc.name || "N/A"}
                                          </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                          Chiếc
                                        </TableCell>
                                        <TableCell align="center">
                                          {acc.quantity || 1}
                                        </TableCell>
                                        <TableCell align="right">
                                          {formatCurrency(acc.price || 0)}
                                        </TableCell>
                                        <TableCell align="right">
                                          {formatCurrency(accAmount)}
                                        </TableCell>
                                      </TableRow>
                                    );
                                  }
                                );
                              }

                              // Options rows
                              if (item.options && item.options.length > 0) {
                                item.options.forEach(
                                  (opt: any, optIndex: number) => {
                                    const optQuantity = opt.quantity || 1;
                                    const optAmount =
                                      (opt.price || 0) * optQuantity;
                                    rows.push(
                                      <TableRow
                                        key={`option-${rowIndex}-${optIndex}`}
                                      >
                                        <TableCell align="center">
                                          {rowIndex++}
                                        </TableCell>
                                        <TableCell>
                                          <Typography variant="body2">
                                            {opt.name || "N/A"}
                                          </Typography>
                                        </TableCell>
                                        <TableCell align="center">Bộ</TableCell>
                                        <TableCell align="center">
                                          {optQuantity}
                                        </TableCell>
                                        <TableCell align="right">
                                          {formatCurrency(opt.price || 0)}
                                        </TableCell>
                                        <TableCell align="right">
                                          {formatCurrency(optAmount)}
                                        </TableCell>
                                      </TableRow>
                                    );
                                  }
                                );
                              }
                            });

                            return rows;
                          })()}
                          <TableRow>
                            <TableCell
                              colSpan={5}
                              sx={{
                                borderTop: "2px solid #333",
                                fontWeight: "bold",
                                textAlign: "right",
                                paddingRight: "16px",
                              }}
                            >
                              <Typography variant="body1" fontWeight="bold">
                                Tổng cộng tiền thanh toán:
                              </Typography>
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{ borderTop: "2px solid #333" }}
                            >
                              <Typography
                                variant="body1"
                                fontWeight="bold"
                                color="error.main"
                                sx={{ fontSize: "1rem" }}
                              >
                                {formatCurrency(
                                  order.items.reduce(
                                    (sum: number, item: any) =>
                                      sum + (item.final_amount || 0),
                                    0
                                  )
                                )}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                </Box>

                {/* Customer Information */}
                <Box sx={{ flex: 1 }}>
                  <Paper elevation={1} sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom fontWeight="bold">
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
                  </Paper>

                  {/* Salesperson Information
                  <Paper elevation={1} sx={{ p: 3, mt: 3 }}>
                    {/* <Typography variant="h6" gutterBottom fontWeight="bold">
                      Nhân viên phụ trách
                    </Typography> */}
                  {/* {order.salesperson ? (
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
                      // <Typography color="text.secondary">
                      //   Chưa phân công nhân viên
                      // </Typography>
                      <div></div>
                    )}
                  </Paper> */}

                  {/* Delivery Information */}
                  {order.delivery && (
                    <Paper elevation={1} sx={{ p: 3, mt: 3 }}>
                      <Typography variant="h6" gutterBottom fontWeight="bold">
                        Thông tin giao hàng
                      </Typography>
                      <Stack spacing={1}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Trạng thái giao hàng
                          </Typography>
                          <Chip
                            label={
                              // Nếu đơn hàng đã bị hủy, delivery status cũng phải là "Đã hủy"
                              order.status === 'cancelled' || order.status === 'canceled' || (order as any).is_deleted
                                ? "Đã hủy"
                                : getDeliveryStatusText(order.delivery.status)
                            }
                            color={
                              // Nếu đơn hàng đã bị hủy, hiển thị màu đỏ
                              order.status === 'cancelled' || order.status === 'canceled' || (order as any).is_deleted
                                ? "error"
                                : order.delivery.status === "delivered"
                                ? "success"
                                : order.delivery.status === "in_transit"
                                ? "info"
                                : order.delivery.status === "scheduled"
                                ? "warning"
                                : order.delivery.status === "pending"
                                ? "warning"
                                : order.delivery.status === "failed"
                                ? "error"
                                : "default"
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
                              {dayjs(order.delivery.scheduled_date).format(
                                "DD/MM/YYYY HH:mm"
                              )}
                            </Typography>
                          </Box>
                        )}
                        {order.delivery.actual_date && (
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Ngày thực tế giao
                            </Typography>
                            <Typography variant="body1">
                              {dayjs(order.delivery.actual_date).format(
                                "DD/MM/YYYY HH:mm"
                              )}
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
                    </Paper>
                  )}
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>

        <Divider />

        <DialogActions sx={{ p: 3, gap: 1, flexWrap: "wrap" }}>
          <Button onClick={handleClose} variant="outlined">
            Đóng
          </Button>
          {/* {order && onEdit && (
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => onEdit(order)}
            >
              Chỉnh sửa
            </Button>
          )} */}
          {/* Workflow buttons based on order status */}
          {/* {order?.status === "pending" && (
            <Button
              variant="outlined"
              startIcon={<DescriptionIcon />}
              onClick={handleGenerateContract}
            >
              Sinh hợp đồng
            </Button>
          )} */}
          {/* Upload button - luôn hiển thị để có thể upload nhiều hợp đồng */}
          <Button
            variant="outlined"
            startIcon={<DescriptionIcon />}
            onClick={handleUploadContract}
            title={`Upload contract for order ${order?.code}`}
          >
            Upload hợp đồng
          </Button>
          {/* Deposit button - hiện khi có signed contract và status phù hợp */}
          {/* {((order?.contract?.signed_contract_urls?.length ?? 0) > 0) &&
            ["pending", "confirmed"].includes(order?.status || "") && (
              <Button
                variant="outlined"
                startIcon={<AttachMoneyIcon />}
                onClick={handleDepositPayment}
              >
                Đặt cọc
              </Button>
            )} */}
          <Button
            variant="outlined"
            startIcon={<DescriptionIcon />}
            onClick={handleViewContract}
          >
            Xem hợp đồng
          </Button>
          {/* <Button
            variant="outlined"
            startIcon={<ShoppingCartIcon />}
            onClick={handleOpenOrderRequest}
            color="primary"
          >
            Gửi yêu cầu đặt xe
          </Button> */}
          {/* <Button variant="outlined" startIcon={<PrintIcon />}>
            In đơn hàng
          </Button> */}
          {/* Giao xe button - chỉ hiển thị khi order đã thanh toán đủ */}
          {(order?.status === 'fully_paid' || order?.status === 'fullyPayment') && (
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
          {order?.status === 'delivered' && (
            <Button 
              variant="contained" 
              color="success"
              startIcon={<CheckCircleIcon />}
              onClick={handleOpenCompleteModal}
            >
              Hoàn tất đơn hàng
            </Button>
          )}
        </DialogActions>
      </Dialog>

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

      {/* Workflow Modals */}
      <ContractGenerator
        visible={contractGeneratorVisible}
        order={order}
        onClose={() => setContractGeneratorVisible(false)}
        onSuccess={handleWorkflowSuccess}
      />

      <ContractUpload
        visible={contractUploadVisible}
        order={order}
        onClose={() => setContractUploadVisible(false)}
        onSuccess={handleWorkflowSuccess}
      />

      <DepositPayment
        visible={depositPaymentVisible}
        order={order}
        onClose={() => setDepositPaymentVisible(false)}
        onSuccess={handleWorkflowSuccess}
      />

      <ContractViewer
        visible={contractViewerVisible}
        order={order}
        onClose={() => setContractViewerVisible(false)}
        onRefresh={handleWorkflowSuccess}
      />

      <CreateOrderRequestModal
        open={orderRequestModalVisible}
        onClose={() => setOrderRequestModalVisible(false)}
        onSuccess={handleWorkflowSuccess}
        initialItems={order?.items?.map((item: any) => ({
          vehicle_id: item.vehicle_id || "",
          color: item.color || "",
          quantity: item.quantity || 1,
          vehicle_name: item.vehicle_name || "",
        }))}
        initialNotes={order?.notes}
      />
    </>
  );
};

export default OrderDetailModalMUI;
