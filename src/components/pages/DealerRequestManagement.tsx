import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Card,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Tooltip,
  Stack,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from "@mui/lab";
import {
  Visibility as ViewIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
} from "@mui/icons-material";
import dayjs from "dayjs";
import Swal from "sweetalert2";

// Services & Types
import { orderService } from "../../services/orderService";
import type {
  OrderRequest,
  OrderRequestHistoryEvent,
  DealerVehicleRequestSearchParams,
} from "../../services/orderService";
import { useAuth } from "../../contexts/AuthContext";

export const DealerRequestManagement: React.FC = () => {
  const { user } = useAuth();
  const [orderRequests, setOrderRequests] = useState<OrderRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    "success" | "info" | "warning" | "error"
  >("info");

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");

  // Modal states
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<OrderRequest | null>(
    null
  );

  // History states
  const [requestHistory, setRequestHistory] = useState<
    OrderRequestHistoryEvent[]
  >([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const statusOptions = [
    { value: "pending", label: "Chờ duyệt", color: "warning" },
    { value: "approved", label: "Đã duyệt", color: "success" },
    { value: "rejected", label: "Đã từ chối", color: "error" },
  ];

  const getStatusChip = (status: string) => {
    const option = statusOptions.find((opt) => opt.value === status);
    return (
      <Chip
        label={option?.label || status}
        color={option?.color as any}
        size="small"
        sx={{ minWidth: 90 }}
      />
    );
  };

  const getTimelineDotColor = (status: string) => {
    switch (status) {
      case "pending":
        return "warning";
      case "approved":
        return "success";
      case "rejected":
        return "error";
      default:
        return "grey";
    }
  };

  const getStatusLabel = (status: string) => {
    const option = statusOptions.find((opt) => opt.value === status);
    return option?.label || status;
  };

  const loadDealerRequests = useCallback(
    async (params?: DealerVehicleRequestSearchParams) => {
      console.log("🔍 Loading dealer vehicle requests with params:", params);
      setLoading(true);
      setError(null);

      const searchParams: DealerVehicleRequestSearchParams = {
        page: params?.page || pagination.current,
        limit: params?.limit || pagination.pageSize,
        status: params?.status as any,
        vehicle_id: params?.vehicle_id,
      };

      console.log("📋 API params being sent:", searchParams);
      console.log("👤 User role:", user?.role);

      try {
        const response = await orderService.getDealerVehicleRequests(
          searchParams
        );
        console.log("📋 API response received:", response);

        if (response && response.success) {
          let requestsData: OrderRequest[] = [];
          let paginationData: any = {};

          if (response.data) {
            if (response.data.data && Array.isArray(response.data.data)) {
              // Map API response to our interface
              requestsData = response.data.data.map((item: any) => ({
                _id: item._id,
                code: item.code,
                dealer_staff_id: item.requested_by?._id || item.dealer_staff_id,
                requested_by: item.requested_by
                  ? {
                      _id: item.requested_by._id,
                      full_name: item.requested_by.full_name,
                      email: item.requested_by.email,
                    }
                  : undefined,
                items:
                  item.items?.map((vehicleItem: any) => ({
                    vehicle_id: vehicleItem.vehicle_id,
                    vehicle_name: vehicleItem.vehicle_name,
                    manufacturer_id: vehicleItem.manufacturer_id,
                    color: vehicleItem.color,
                    quantity: vehicleItem.quantity,
                    notes: vehicleItem.notes,
                    _id: vehicleItem._id,
                  })) || [],
                notes: item.notes,
                status: item.status,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
                approved_by: item.approved_by,
                rejected_by: item.rejected_by,
                approved_at: item.approved_at,
                dealership_id: item.dealership_id,
                is_deleted: item.is_deleted,
                order_id: item.order_id,
                __v: item.__v,
                // Keep for backward compatibility
                dealer_staff: item.requested_by
                  ? {
                      _id: item.requested_by._id,
                      full_name: item.requested_by.full_name,
                      email: item.requested_by.email,
                    }
                  : undefined,
              }));

              paginationData = {
                total: response.data.totalRecords || response.data.data.length,
                page: response.data.page || 1,
                pages: response.data.totalPages || 1,
              };
            } else if (Array.isArray(response.data)) {
              requestsData = response.data;
              paginationData = { total: response.data.length, page: 1 };
            }
          }

          console.log("✅ Mapped dealer requests:", requestsData);

          setOrderRequests(requestsData);
          setPagination((prev) => ({
            ...prev,
            total: paginationData.total || requestsData.length,
            current: paginationData.page || 1,
          }));

          setSnackbarMessage(`Đã tải ${requestsData.length} yêu cầu từ đại lý`);
          setSnackbarSeverity("success");
          setSnackbarOpen(true);
        } else {
          throw new Error("Invalid response format");
        }
      } catch (err: any) {
        console.error("❌ Error loading dealer requests:", err);
        const errorMessage =
          err?.response?.data?.message || err?.message || "Lỗi kết nối API";
        setError(errorMessage);
        setOrderRequests([]);
        setPagination((prev) => ({ ...prev, total: 0 }));
      } finally {
        setLoading(false);
      }
    },
    [pagination.current, pagination.pageSize, user?.role]
  );

  useEffect(() => {
    loadDealerRequests({});
  }, [loadDealerRequests]);

  const handleSearch = () => {
    const searchParams: DealerVehicleRequestSearchParams = {
      page: 1,
      limit: pagination.pageSize,
    };

    if (selectedStatus) {
      searchParams.status = selectedStatus as any;
    }
    if (selectedVehicleId.trim()) {
      searchParams.vehicle_id = selectedVehicleId.trim();
    }

    setPagination((prev) => ({ ...prev, current: 1 }));
    loadDealerRequests(searchParams);
  };

  const handleReset = () => {
    setSelectedStatus("");
    setSelectedVehicleId("");
    setPagination((prev) => ({ ...prev, current: 1 }));
    loadDealerRequests({ page: 1, limit: pagination.pageSize });
  };

  const handlePageChange = (_event: unknown, newPage: number) => {
    const newCurrent = newPage + 1;
    setPagination((prev) => ({ ...prev, current: newCurrent }));
    loadDealerRequests({
      page: newCurrent,
      limit: pagination.pageSize,
      status: (selectedStatus as any) || undefined,
      vehicle_id: selectedVehicleId || undefined,
    });
  };

  const handleRowsPerPageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newPageSize = parseInt(event.target.value, 10);
    setPagination((prev) => ({ ...prev, pageSize: newPageSize, current: 1 }));
    loadDealerRequests({
      page: 1,
      limit: newPageSize,
      status: (selectedStatus as any) || undefined,
      vehicle_id: selectedVehicleId || undefined,
    });
  };

  const handleViewRequest = (request: OrderRequest) => {
    setSelectedRequest(request);
    setDetailModalOpen(true);
    // Use request._id for history API call
    loadOrderRequestHistory(request._id);
  };

  const loadOrderRequestHistory = async (requestId: string) => {
    setHistoryLoading(true);
    try {
      const response = await orderService.getOrderRequestHistory(requestId);
      console.log("📋 Order request history response:", response);

      if (response.success && response.data.timeline) {
        // Map API response to our interface
        const mappedTimeline: OrderRequestHistoryEvent[] =
          response.data.timeline.map((event: any) => ({
            _id: event._id,
            timestamp: event.timestamp,
            status_change: {
              from: event.old_status,
              to: event.new_status,
            },
            changed_by: event.changed_by
              ? {
                  _id: event.changed_by._id,
                  full_name:
                    event.changed_by.full_name ||
                    event.changed_by.email ||
                    "N/A",
                  role: event.changed_by.role || "N/A",
                }
              : undefined,
            reason: event.reason || undefined,
            notes: event.notes || undefined,
            is_current: false, // Will be set for the latest status
          }));

        // Mark the latest event as current
        if (mappedTimeline.length > 0) {
          mappedTimeline[0].is_current = true;
        }

        console.log("✅ Mapped timeline:", mappedTimeline);
        setRequestHistory(mappedTimeline);
      } else {
        setRequestHistory([]);
      }
    } catch (error) {
      console.error("Error loading order request history:", error);
      setRequestHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleApproveRequest = async (request: OrderRequest) => {
    const result = await Swal.fire({
      title: "Xác nhận duyệt yêu cầu",
      text: `Bạn có chắc chắn muốn duyệt yêu cầu ${request.code}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Duyệt",
      cancelButtonText: "Hủy",
    });

    if (!result.isConfirmed) return;

    try {
      setLoading(true);
      await orderService.approveOrderRequest(request._id);

      await Swal.fire({
        title: "Thành công!",
        text: "Yêu cầu đã được duyệt thành công.",
        icon: "success",
        confirmButtonText: "OK",
        confirmButtonColor: "#10b981",
      });

      loadDealerRequests({
        page: pagination.current,
        limit: pagination.pageSize,
        status: (selectedStatus as any) || undefined,
        vehicle_id: selectedVehicleId || undefined,
      });
    } catch (error: any) {
      console.error("Error approving request:", error);
      await Swal.fire({
        title: "Lỗi!",
        text:
          error.response?.data?.message || "Có lỗi xảy ra khi duyệt yêu cầu",
        icon: "error",
        confirmButtonText: "OK",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRejectRequest = async (request: OrderRequest) => {
    const { value: reason } = await Swal.fire({
      title: "Từ chối yêu cầu",
      text: "Vui lòng nhập lý do từ chối:",
      input: "textarea",
      inputPlaceholder: "Nhập lý do từ chối...",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Từ chối",
      cancelButtonText: "Hủy",
      inputValidator: (value) => {
        if (!value) {
          return "Vui lòng nhập lý do từ chối!";
        }
      },
    });

    if (!reason) return;

    try {
      setLoading(true);
      await orderService.rejectOrderRequest(request._id, reason);

      await Swal.fire({
        title: "Thành công!",
        text: "Yêu cầu đã được từ chối.",
        icon: "success",
        confirmButtonText: "OK",
        confirmButtonColor: "#10b981",
      });

      loadDealerRequests({
        page: pagination.current,
        limit: pagination.pageSize,
        status: (selectedStatus as any) || undefined,
        vehicle_id: selectedVehicleId || undefined,
      });
    } catch (error: any) {
      console.error("Error rejecting request:", error);
      await Swal.fire({
        title: "Lỗi!",
        text:
          error.response?.data?.message || "Có lỗi xảy ra khi từ chối yêu cầu",
        icon: "error",
        confirmButtonText: "OK",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSnackbarClose = (
    _event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarOpen(false);
  };

  return (
    <Box sx={{ p: 3, m: 0 }}>
      {/* Error Display */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
          Quản lý yêu cầu từ nhân viên
        </Typography>
      </Box>

      {/* Search and Filters */}
      <Card sx={{ p: 3, mb: 4, boxShadow: 3 }}>
        <Stack spacing={3}>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Trạng thái</InputLabel>
              <Select
                value={selectedStatus}
                label="Trạng thái"
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <MenuItem value="">Tất cả</MenuItem>
                {statusOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Mã xe"
              placeholder="Nhập mã xe..."
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              sx={{ minWidth: 200 }}
            />
          </Box>

          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              onClick={handleSearch}
              startIcon={<SearchIcon />}
              sx={{ minWidth: 120 }}
            >
              Tìm kiếm
            </Button>
            <Button
              variant="outlined"
              onClick={handleReset}
              startIcon={<RefreshIcon />}
            >
              Đặt lại
            </Button>
          </Stack>
        </Stack>
      </Card>

      {/* Data Table */}
      <Card sx={{ boxShadow: 3 }}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ bgcolor: "#f5f5f5" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Mã yêu cầu</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Đại lý</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Loại xe</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Số lượng</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Trạng thái</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Ngày tạo</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : orderRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      Không có yêu cầu nào
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                orderRequests.map((request) => (
                  <TableRow key={request._id} hover>
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                        {request.code}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {request.requested_by?.full_name ||
                          request.dealer_staff?.full_name ||
                          "N/A"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {request.requested_by?.email ||
                          request.dealer_staff?.email ||
                          ""}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.5}>
                        {request.items.slice(0, 2).map((item, index) => (
                          <Typography key={index} variant="body2">
                            {item.vehicle_name || item.vehicle_id}
                            {item.color && ` - ${item.color}`}
                          </Typography>
                        ))}
                        {request.items.length > 2 && (
                          <Typography variant="caption" color="text.secondary">
                            +{request.items.length - 2} xe khác
                          </Typography>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {request.items.reduce(
                          (sum, item) => sum + item.quantity,
                          0
                        )}
                      </Typography>
                    </TableCell>
                    <TableCell>{getStatusChip(request.status)}</TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {dayjs(request.createdAt).format("DD/MM/YYYY HH:mm")}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Tooltip title="Xem chi tiết">
                          <IconButton
                            size="small"
                            onClick={() => handleViewRequest(request)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>

                        {request.status === "pending" && (
                          <>
                            <Tooltip title="Duyệt yêu cầu">
                              <IconButton
                                size="small"
                                sx={{ color: "success.main" }}
                                onClick={() => handleApproveRequest(request)}
                              >
                                <ApproveIcon />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Từ chối yêu cầu">
                              <IconButton
                                size="small"
                                sx={{ color: "error.main" }}
                                onClick={() => handleRejectRequest(request)}
                              >
                                <RejectIcon />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={pagination.total}
          page={pagination.current - 1}
          onPageChange={handlePageChange}
          rowsPerPage={pagination.pageSize}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelRowsPerPage="Số dòng mỗi trang:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} của ${count !== -1 ? count : `hơn ${to}`}`
          }
        />
      </Card>

      {/* Detail Modal */}
      <Dialog
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ pb: 2 }}>
          <Typography variant="h6">Chi tiết yêu cầu</Typography>
        </DialogTitle>

        <DialogContent dividers>
          {selectedRequest && (
            <Box>
              {/* Request Information */}
              <Card sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Thông tin yêu cầu
                </Typography>
                <Stack spacing={2}>
                  <Box sx={{ display: "flex", gap: 4 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Mã yêu cầu
                      </Typography>
                      <Typography variant="body1">
                        {selectedRequest.code}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Trạng thái
                      </Typography>
                      {getStatusChip(selectedRequest.status)}
                    </Box>
                  </Box>

                  <Box sx={{ display: "flex", gap: 4 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Nhân viên yêu cầu
                      </Typography>
                      <Typography variant="body1">
                        {selectedRequest.requested_by?.full_name ||
                          selectedRequest.dealer_staff?.full_name ||
                          "N/A"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {selectedRequest.requested_by?.email ||
                          selectedRequest.dealer_staff?.email ||
                          ""}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Ngày tạo
                      </Typography>
                      <Typography variant="body1">
                        {dayjs(selectedRequest.createdAt).format(
                          "DD/MM/YYYY HH:mm"
                        )}
                      </Typography>
                    </Box>
                  </Box>

                  {selectedRequest.notes && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Ghi chú
                      </Typography>
                      <Typography variant="body1">
                        {selectedRequest.notes}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Card>

              {/* Vehicle Items */}
              <Card sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Danh sách xe yêu cầu
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Tên xe</TableCell>
                        <TableCell>Màu sắc</TableCell>
                        <TableCell>Số lượng</TableCell>
                        <TableCell>Ghi chú</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedRequest.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            {item.vehicle_name || item.vehicle_id}
                          </TableCell>
                          <TableCell>
                            {item.color || "Không xác định"}
                          </TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{item.notes || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>

              {/* Timeline */}
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Lịch sử thay đổi
                </Typography>
                {historyLoading ? (
                  <Box display="flex" justifyContent="center" p={2}>
                    <CircularProgress size={24} />
                  </Box>
                ) : requestHistory.length > 0 ? (
                  <Timeline>
                    {requestHistory.map((event, index) => (
                      <TimelineItem key={event._id}>
                        <TimelineOppositeContent sx={{ flex: 0.3 }}>
                          <Typography variant="caption" color="text.secondary">
                            {dayjs(event.timestamp).format("DD/MM/YYYY HH:mm")}
                          </Typography>
                        </TimelineOppositeContent>
                        <TimelineSeparator>
                          <TimelineDot
                            color={getTimelineDotColor(
                              event.status_change?.to || "pending"
                            )}
                          />
                          {index < requestHistory.length - 1 && (
                            <TimelineConnector />
                          )}
                        </TimelineSeparator>
                        <TimelineContent>
                          <Typography variant="subtitle2">
                            {event.status_change
                              ? `${getStatusLabel(
                                  event.status_change.from
                                )} → ${getStatusLabel(event.status_change.to)}`
                              : "Tạo yêu cầu"}
                          </Typography>
                          {event.changed_by && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Bởi: {event.changed_by.full_name}
                            </Typography>
                          )}
                          {event.reason && (
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              Lý do: {event.reason}
                            </Typography>
                          )}
                        </TimelineContent>
                      </TimelineItem>
                    ))}
                  </Timeline>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Không có lịch sử thay đổi
                  </Typography>
                )}
              </Card>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDetailModalOpen(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};
