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
  Divider,
  CircularProgress,
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
  Delete as DeleteIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateRange } from "@mui/x-date-pickers-pro";
import dayjs, { Dayjs } from "dayjs";
import Swal from "sweetalert2";

import { useAuth } from "../../contexts/AuthContext";
import {
  orderService,
  OrderRequest,
  OrderRequestSearchParams,
  OrderRequestHistoryEvent,
} from "../../services/orderService";
import CreateOrderRequestModal from "./CreateOrderRequestModal";

export const OrderRequestManagement: React.FC = () => {
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

  const [searchText, setSearchText] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange<Dayjs>>([null, null]);

  // Modal states
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<OrderRequest | null>(
    null
  );
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // History states
  const [requestHistory, setRequestHistory] = useState<
    OrderRequestHistoryEvent[]
  >([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const statusOptions = [
    { value: "pending", label: "Chờ duyệt", color: "warning" },
    { value: "approved", label: "Đã duyệt", color: "success" },
    { value: "rejected", label: "Đã từ chối", color: "error" },
    {
      value: "waiting_vehicle_request",
      label: "Chờ xe từ hãng",
      color: "info",
    },
    { value: "completed", label: "Hoàn thành", color: "success" },
    { value: "cancelled", label: "Đã hủy", color: "error" },
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
      case "cancelled":
        return "error";
      case "waiting_vehicle_request":
        return "info";
      case "completed":
        return "success";
      default:
        return "grey";
    }
  };

  const getStatusLabel = (status: string) => {
    const option = statusOptions.find((opt) => opt.value === status);
    return option?.label || status;
  };

  const loadOrderRequests = useCallback(
    async (params?: OrderRequestSearchParams) => {
      console.log("🔍 Loading order requests with params:", params);
      setLoading(true);
      setError(null);

      const searchParams: OrderRequestSearchParams = {
        page: params?.page || pagination.current,
        limit: params?.limit || pagination.pageSize,
        q: params?.q,
        status: params?.status as any,
        startDate: params?.startDate,
        endDate: params?.endDate,
      };

      console.log("📋 API params being sent:", searchParams);
      console.log("👤 User role:", user?.role);

      try {
        const response = await orderService.getOrderRequests(searchParams);
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

          console.log("✅ Mapped order requests:", requestsData);

          setOrderRequests(requestsData);
          setPagination((prev) => ({
            ...prev,
            total: paginationData.total || requestsData.length,
            current: paginationData.page || 1,
          }));

          setSnackbarMessage(`Đã tải ${requestsData.length} yêu cầu đặt xe`);
          setSnackbarSeverity("success");
          setSnackbarOpen(true);
        } else {
          throw new Error("Invalid response format");
        }
      } catch (err: any) {
        console.error("❌ Error loading order requests:", err);
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
    loadOrderRequests({});
  }, [loadOrderRequests]);

  const handleSearch = () => {
    const searchParams: OrderRequestSearchParams = {
      page: 1,
      limit: pagination.pageSize,
    };

    if (searchText.trim()) {
      searchParams.q = searchText.trim();
    }
    if (selectedStatus) {
      searchParams.status = selectedStatus as any;
    }
    if (dateRange[0] && dateRange[1]) {
      searchParams.startDate = dateRange[0].format("YYYY-MM-DD");
      searchParams.endDate = dateRange[1].format("YYYY-MM-DD");
    }

    setPagination((prev) => ({ ...prev, current: 1 }));
    loadOrderRequests(searchParams);
  };

  const handleReset = () => {
    setSearchText("");
    setSelectedStatus("");
    setDateRange([null, null]);
    setPagination((prev) => ({ ...prev, current: 1 }));
    loadOrderRequests({ page: 1, limit: pagination.pageSize });
  };

  const handlePageChange = (_event: unknown, newPage: number) => {
    const newCurrent = newPage + 1;
    setPagination((prev) => ({ ...prev, current: newCurrent }));
    loadOrderRequests({
      page: newCurrent,
      limit: pagination.pageSize,
      q: searchText || undefined,
      status: (selectedStatus as any) || undefined,
      startDate: dateRange[0]?.format("YYYY-MM-DD"),
      endDate: dateRange[1]?.format("YYYY-MM-DD"),
    });
  };

  const handleRowsPerPageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newPageSize = parseInt(event.target.value, 10);
    setPagination((prev) => ({ ...prev, pageSize: newPageSize, current: 1 }));
    loadOrderRequests({
      page: 1,
      limit: newPageSize,
      q: searchText || undefined,
      status: (selectedStatus as any) || undefined,
      startDate: dateRange[0]?.format("YYYY-MM-DD"),
      endDate: dateRange[1]?.format("YYYY-MM-DD"),
    });
  };

  const handleViewRequest = (request: OrderRequest) => {
    setSelectedRequest(request);
    setDetailModalOpen(true);
    // Use request._id for history API call
    loadOrderRequestHistory(request.order_id._id);
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
    if (user?.role !== "dealer_manager") {
      setSnackbarMessage("Chỉ dealer manager mới có quyền duyệt yêu cầu");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

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

      loadOrderRequests({
        page: pagination.current,
        limit: pagination.pageSize,
        q: searchText || undefined,
        status: (selectedStatus as any) || undefined,
        startDate: dateRange[0]?.format("YYYY-MM-DD"),
        endDate: dateRange[1]?.format("YYYY-MM-DD"),
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
    if (user?.role !== "dealer_manager") {
      setSnackbarMessage("Chỉ dealer manager mới có quyền từ chối yêu cầu");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

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

      loadOrderRequests({
        page: pagination.current,
        limit: pagination.pageSize,
        q: searchText || undefined,
        status: (selectedStatus as any) || undefined,
        startDate: dateRange[0]?.format("YYYY-MM-DD"),
        endDate: dateRange[1]?.format("YYYY-MM-DD"),
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

  const handleDeleteRequest = async (request: OrderRequest) => {
    // Only allow staff to delete their own pending requests
    if (user?.role === "dealer_staff" && request.status !== "pending") {
      setSnackbarMessage("Chỉ có thể xóa yêu cầu đang chờ duyệt");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    if (user?.role !== "dealer_manager" && user?.role !== "dealer_staff") {
      setSnackbarMessage("Bạn không có quyền xóa yêu cầu này");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    const result = await Swal.fire({
      title: "Xác nhận xóa yêu cầu",
      text: `Bạn có chắc chắn muốn xóa yêu cầu ${request.code}? Hành động này không thể hoàn tác.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      setLoading(true);
      await orderService.deleteOrderRequest(request._id);

      await Swal.fire({
        title: "Thành công!",
        text: "Yêu cầu đã được xóa thành công.",
        icon: "success",
        confirmButtonText: "OK",
        confirmButtonColor: "#10b981",
      });

      loadOrderRequests({
        page: pagination.current,
        limit: pagination.pageSize,
        q: searchText || undefined,
        status: (selectedStatus as any) || undefined,
        startDate: dateRange[0]?.format("YYYY-MM-DD"),
        endDate: dateRange[1]?.format("YYYY-MM-DD"),
      });
    } catch (error: any) {
      console.error("Error deleting request:", error);
      await Swal.fire({
        title: "Lỗi!",
        text: error.response?.data?.message || "Có lỗi xảy ra khi xóa yêu cầu",
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
    <LocalizationProvider dateAdapter={AdapterDayjs}>
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
            Quản lý yêu cầu đặt xe
          </Typography>

          {user?.role === "dealer_staff" && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateModalOpen(true)}
              sx={{
                bgcolor: "#1976d2",
                "&:hover": { bgcolor: "#1565c0" },
                borderRadius: 2,
                px: 3,
              }}
            >
              Tạo yêu cầu mới
            </Button>
          )}
        </Box>

        {/* Search and Filters */}
        <Card sx={{ p: 3, mb: 4, boxShadow: 3 }}>
          <Stack spacing={3}>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <TextField
                label="Tìm kiếm"
                placeholder="Mã yêu cầu, nhân viên..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <SearchIcon sx={{ color: "action.active", mr: 1 }} />
                  ),
                }}
                sx={{ minWidth: 200 }}
              />

              {/* <FormControl sx={{ minWidth: 150 }}>
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
              </FormControl> */}

              <DatePicker
                label="Từ ngày"
                value={dateRange[0]}
                onChange={(newValue) => setDateRange([newValue, dateRange[1]])}
                slotProps={{ textField: { sx: { minWidth: 150 } } }}
              />

              <DatePicker
                label="Đến ngày"
                value={dateRange[1]}
                onChange={(newValue) => setDateRange([dateRange[0], newValue])}
                slotProps={{ textField: { sx: { minWidth: 150 } } }}
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
                  <TableCell sx={{ fontWeight: 600 }}>Nhân viên</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Số lượng xe</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Trạng thái</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Ngày tạo</TableCell>
                  <TableCell sx={{ fontWeight: 600, textAlign: "center" }}>
                    Thao tác
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: "center", py: 4 }}>
                      <Typography>Đang tải...</Typography>
                    </TableCell>
                  </TableRow>
                ) : orderRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: "center", py: 4 }}>
                      <Typography color="text.secondary">
                        Không có dữ liệu
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  orderRequests.map((request) => (
                    <TableRow key={request._id} hover>
                      <TableCell sx={{ fontWeight: 500 }}>
                        {request.code}
                      </TableCell>
                      <TableCell>
                        {request.dealer_staff?.full_name ||
                          request.requested_by?.full_name ||
                          "N/A"}
                      </TableCell>
                      <TableCell>
                        {request.items?.length || 0} xe
                        {request.items && request.items.length > 0 && (
                          <Typography
                            variant="caption"
                            display="block"
                            color="text.secondary"
                          >
                            {request.items[0].vehicle_name ||
                              request.items[0].vehicle_id}
                            {request.items.length > 1 &&
                              ` +${request.items.length - 1} xe khác`}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{getStatusChip(request.status)}</TableCell>
                      <TableCell>
                        {dayjs(request.createdAt).format("DD/MM/YYYY HH:mm")}
                      </TableCell>
                      <TableCell sx={{ textAlign: "center" }}>
                        <Stack
                          direction="row"
                          spacing={1}
                          justifyContent="center"
                        >
                          <Tooltip title="Xem chi tiết">
                            <IconButton
                              size="small"
                              onClick={() => handleViewRequest(request)}
                              sx={{ color: "#1976d2" }}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>

                          {user?.role === "dealer_manager" &&
                            request.status === "pending" && (
                              <>
                                <Tooltip title="Duyệt">
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      handleApproveRequest(request)
                                    }
                                    sx={{ color: "#10b981" }}
                                  >
                                    <ApproveIcon />
                                  </IconButton>
                                </Tooltip>

                                <Tooltip title="Từ chối">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleRejectRequest(request)}
                                    sx={{ color: "#ef4444" }}
                                  >
                                    <RejectIcon />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}

                          {((user?.role === "dealer_staff" &&
                            request.status === "pending") ||
                            user?.role === "dealer_manager") && (
                            <Tooltip title="Xóa">
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteRequest(request)}
                                sx={{ color: "#ef4444" }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
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
          <DialogTitle>
            Chi tiết yêu cầu đặt xe - {selectedRequest?.code}
          </DialogTitle>
          <DialogContent>
            {selectedRequest && (
              <Box sx={{ mt: 2 }}>
                <Stack spacing={3}>
                  {/* Basic Information */}
                  <Box>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Thông tin cơ bản
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                      <Box sx={{ flex: "1 1 300px" }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Mã yêu cầu:
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                          {selectedRequest.code}
                        </Typography>
                      </Box>
                      <Box sx={{ flex: "1 1 300px" }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Trạng thái:
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                          {getStatusChip(selectedRequest.status)}
                        </Box>
                      </Box>
                      <Box sx={{ flex: "1 1 300px" }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Nhân viên:
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                          {selectedRequest.dealer_staff?.full_name ||
                            selectedRequest.requested_by?.full_name ||
                            "N/A"}
                        </Typography>
                      </Box>
                      <Box sx={{ flex: "1 1 300px" }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Ngày tạo:
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                          {dayjs(selectedRequest.createdAt).format(
                            "DD/MM/YYYY HH:mm"
                          )}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Divider />

                  {/* Vehicle List */}
                  <Box>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Danh sách xe
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      {selectedRequest.items?.map((item, index) => (
                        <Box
                          key={index}
                          sx={{
                            p: 2,
                            border: "1px solid #e0e0e0",
                            borderRadius: 1,
                            mb: 1,
                            bgcolor: "#fafafa",
                          }}
                        >
                          <Typography variant="body2">
                            <strong>Xe #{index + 1}:</strong>{" "}
                            {item.vehicle_name || item.vehicle_id}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Màu: {item.color || "N/A"} | Số lượng:{" "}
                            {item.quantity}
                          </Typography>
                          {item.notes && (
                            <Typography variant="body2" color="text.secondary">
                              Ghi chú: {item.notes}
                            </Typography>
                          )}
                        </Box>
                      ))}
                    </Box>
                  </Box>

                  {selectedRequest.notes && (
                    <>
                      <Divider />
                      <Box>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                          Ghi chú
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{
                            p: 2,
                            bgcolor: "#f5f5f5",
                            borderRadius: 1,
                            border: "1px solid #e0e0e0",
                          }}
                        >
                          {selectedRequest.notes}
                        </Typography>
                      </Box>
                    </>
                  )}

                  <Divider />

                  {/* Status Timeline */}
                  <Box>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Lịch sử trạng thái
                    </Typography>
                    {historyLoading ? (
                      <Box
                        sx={{ display: "flex", justifyContent: "center", p: 3 }}
                      >
                        <CircularProgress />
                      </Box>
                    ) : requestHistory.length > 0 ? (
                      <Timeline>
                        {requestHistory.map((event, index) => (
                          <TimelineItem key={index}>
                            <TimelineOppositeContent
                              sx={{ m: "auto 0" }}
                              align="right"
                              variant="body2"
                              color="text.secondary"
                            >
                              {dayjs(event.timestamp).format(
                                "DD/MM/YYYY HH:mm"
                              )}
                            </TimelineOppositeContent>
                            <TimelineSeparator>
                              <TimelineConnector sx={{ bgcolor: "grey.300" }} />
                              <TimelineDot
                                color={
                                  event.status_change?.to
                                    ? getTimelineDotColor(
                                        event.status_change.to
                                      )
                                    : "grey"
                                }
                              />
                              <TimelineConnector sx={{ bgcolor: "grey.300" }} />
                            </TimelineSeparator>
                            <TimelineContent sx={{ py: "12px", px: 2 }}>
                              <Typography variant="h6" component="span">
                                {event.status_change?.from &&
                                event.status_change?.to
                                  ? `${getStatusLabel(
                                      event.status_change.from
                                    )} → ${getStatusLabel(
                                      event.status_change.to
                                    )}`
                                  : getStatusLabel(
                                      event.status_change?.to ||
                                        event.status_change?.from ||
                                        "pending"
                                    )}
                              </Typography>
                              {event.changed_by && (
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  Bởi: {event.changed_by.full_name}{" "}
                                  {event.changed_by.role &&
                                    `(${event.changed_by.role})`}
                                </Typography>
                              )}
                              {event.reason && (
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  Lý do: {event.reason}
                                </Typography>
                              )}
                              {event.notes && (
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{
                                    mt: 1,
                                    p: 1.5,
                                    bgcolor: "#f8f9fa",
                                    borderRadius: 1,
                                    border: "1px solid #e9ecef",
                                  }}
                                >
                                  {event.notes}
                                </Typography>
                              )}
                            </TimelineContent>
                          </TimelineItem>
                        ))}
                      </Timeline>
                    ) : (
                      <Typography
                        color="text.secondary"
                        sx={{ p: 2, textAlign: "center" }}
                      >
                        Chưa có lịch sử trạng thái
                      </Typography>
                    )}
                  </Box>
                </Stack>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailModalOpen(false)}>Đóng</Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
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

        {/* Create Order Request Modal */}
        <CreateOrderRequestModal
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSuccess={() => {
            setCreateModalOpen(false);
            loadOrderRequests({});
          }}
        />
      </Box>
    </LocalizationProvider>
  );
};

export default OrderRequestManagement;
