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
} from "@mui/material";
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Description as DescriptionIcon,
  Print as PrintIcon,
  AttachMoney as AttachMoneyIcon,
  ShoppingCart as ShoppingCartIcon,
} from "@mui/icons-material";
import dayjs from "dayjs";

import { orderService } from "../../services/orderService";
import { Order } from "../../types/index";
import ContractGenerator from "./ContractGenerator";
import ContractUpload from "./ContractUpload";
import DepositPayment from "./DepositPayment";
import ContractViewer from "./ContractViewer";
import CreateOrderRequestModal from "./CreateOrderRequestModal";

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
      fullyPayment: "success",
      closed: "default",
      cancelled: "error",
    };
    return statusColors[status as keyof typeof statusColors] || "default";
  };

  // Status text mapping
  const getStatusText = (status: string) => {
    const statusTexts = {
      pending: "Chờ xác nhận",
      confirmed: "Đã xác nhận",
      halfPayment: "Đã đặt cọc",
      fullyPayment: "Đã thanh toán",
      closed: "Đã đóng",
      cancelled: "Đã hủy",
    };
    return statusTexts[status as keyof typeof statusTexts] || status;
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
                          color={getStatusColor(order.status) as any}
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
                            order.contract?.signed_contract_url
                              ? "Đã ký"
                              : "Chưa ký"
                          }
                          color={
                            order.contract?.signed_contract_url
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
                            <TableCell>Sản phẩm</TableCell>
                            <TableCell align="center">Số lượng</TableCell>
                            <TableCell align="right">Giá gốc</TableCell>
                            <TableCell align="right">Giảm giá</TableCell>
                            <TableCell align="right">Thành tiền</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {order.items.map((item: any, index: number) => (
                            <TableRow
                              key={`${item?.vehicle_id || "unknown"}-${
                                item?.color || "default"
                              }-${index}`}
                            >
                              <TableCell>
                                <Box>
                                  <Typography
                                    variant="body2"
                                    fontWeight="medium"
                                  >
                                    {item.vehicle_name}
                                  </Typography>
                                  {item.color && (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      Màu: {item.color}
                                    </Typography>
                                  )}
                                  {item.options && item.options.length > 0 && (
                                    <Typography
                                      variant="caption"
                                      color="primary"
                                      display="block"
                                    >
                                      Tùy chọn:{" "}
                                      {item.options
                                        .map((opt: any) => opt.name)
                                        .join(", ")}
                                    </Typography>
                                  )}
                                  {item.accessories &&
                                    item.accessories.length > 0 && (
                                      <Typography
                                        variant="caption"
                                        color="secondary"
                                        display="block"
                                      >
                                        Phụ kiện:{" "}
                                        {item.accessories
                                          .map(
                                            (acc: any) =>
                                              `${acc.name} (x${acc.quantity})`
                                          )
                                          .join(", ")}
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
                                  {item.discount > 0
                                    ? `-${formatCurrency(item.discount)}`
                                    : "-"}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography
                                  variant="body2"
                                  fontWeight="medium"
                                  color="success.main"
                                >
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
                              <Typography
                                variant="body1"
                                fontWeight="bold"
                                color="success.main"
                              >
                                {formatCurrency(
                                  order.items.reduce(
                                    (sum, item) => sum + item.final_amount,
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

                  {/* Salesperson Information */}
                  <Paper elevation={1} sx={{ p: 3, mt: 3 }}>
                    <Typography variant="h6" gutterBottom fontWeight="bold">
                      Nhân viên phụ trách
                    </Typography>
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
                  </Paper>

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
                              order.delivery.status === "delivered"
                                ? "Đã giao"
                                : order.delivery.status === "in_transit"
                                ? "Đang giao"
                                : order.delivery.status === "scheduled"
                                ? "Đã lên lịch"
                                : order.delivery.status
                            }
                            color={
                              order.delivery.status === "delivered"
                                ? "success"
                                : order.delivery.status === "in_transit"
                                ? "info"
                                : order.delivery.status === "scheduled"
                                ? "warning"
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
          {order && onEdit && (
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => onEdit(order)}
            >
              Chỉnh sửa
            </Button>
          )}
          {/* Workflow buttons based on order status */}
          {order?.status === "pending" && (
            <Button
              variant="outlined"
              startIcon={<DescriptionIcon />}
              onClick={handleGenerateContract}
            >
              Sinh hợp đồng
            </Button>
          )}
          {/* Upload button - hiện khi chưa có signed contract */}
          {!order?.contract?.signed_contract_url && (
            <Button
              variant="outlined"
              startIcon={<DescriptionIcon />}
              onClick={handleUploadContract}
              title={`Upload contract for order ${order?.code}`}
            >
              Upload hợp đồng
            </Button>
          )}
          {/* Deposit button - hiện khi có signed contract và status phù hợp */}
          {order?.contract?.signed_contract_url &&
            ["pending", "confirmed"].includes(order?.status || "") && (
              <Button
                variant="outlined"
                startIcon={<AttachMoneyIcon />}
                onClick={handleDepositPayment}
              >
                Đặt cọc
              </Button>
            )}
          <Button
            variant="outlined"
            startIcon={<DescriptionIcon />}
            onClick={handleViewContract}
          >
            Xem hợp đồng
          </Button>
          <Button
            variant="outlined"
            startIcon={<ShoppingCartIcon />}
            onClick={handleOpenOrderRequest}
            color="primary"
          >
            Gửi yêu cầu đặt xe
          </Button>
          <Button variant="outlined" startIcon={<PrintIcon />}>
            In đơn hàng
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
        }))}
        initialNotes={order?.notes}
      />
    </>
  );
};

export default OrderDetailModalMUI;
