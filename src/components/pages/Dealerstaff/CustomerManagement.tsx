import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Pagination,
  CircularProgress,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Select,
  MenuItem,
  InputLabel,
  Chip,
  Stack,
} from "@mui/material";
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationOnIcon,
  CreditCard as CreditCardIcon,
  Person as PersonIcon,
  Close as CloseIcon,
  Event as EventIcon,
  ShoppingCart as ShoppingCartIcon,
  Message as MessageIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material";
import { mockVehicles, mockMotorbikes } from "../../../data/mockData";
import { Customer } from "../../../types";
import { useNavigate } from "react-router-dom";
import { customerService } from "../../../services/customerService";

export const CustomerManagement: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "yours">("all");
  const [selectedCustomerPayments, setSelectedCustomerPayments] = useState<
    any[]
  >([]);
  const [showPaymentsModal, setShowPaymentsModal] = useState(false);
  const [selectedCustomerForPayments, setSelectedCustomerForPayments] =
    useState<Customer | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    vehicleId: "",
    vehicleType: "car",
    date: "",
    time: "",
    purpose: "",
    notes: "",
  });
  const [customerForm, setCustomerForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  });

  // Snackbar state
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "warning" | "info";
  }>({
    open: false,
    message: "",
    severity: "info",
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // Helper function to show snackbar
  const showSnackbarMessage = (
    message: string,
    severity: "success" | "error" | "warning" | "info" = "info"
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const allVehicles = [...mockVehicles, ...mockMotorbikes];

  useEffect(() => {
    setCurrentPage(1);
    loadCustomers();
  }, [activeTab]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      let customerData: Customer[];

      if (activeTab === "yours") {
        customerData = await customerService.getYourCustomers(
          searchTerm || undefined
        );
      } else {
        customerData = await customerService.getAllCustomers(
          searchTerm || undefined
        );
      }

      setCustomers(customerData || []);
    } catch (err) {
      const errorMessage = "Không thể tải danh sách khách hàng";
      setError(errorMessage);
      showSnackbarMessage(errorMessage, "error");
      console.error("Error loading customers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== undefined) {
        setCurrentPage(1);
        loadCustomers();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const loadCustomerPayments = async (customerId: string) => {
    try {
      const payments = await customerService.getCustomerPayments(customerId);
      // Handle both array and object with data property
      const paymentData = Array.isArray(payments)
        ? payments
        : (payments as any)?.data || [];
      setSelectedCustomerPayments(paymentData);
    } catch (err) {
      console.error("Error loading customer payments:", err);
      setSelectedCustomerPayments([]);
    }
  };

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (scheduleForm.vehicleId && selectedCustomer) {
      const vehicle = allVehicles.find((v) => v.id === scheduleForm.vehicleId);
      if (vehicle) {
        navigate(
          `/portal/test-drive?vehicleId=${scheduleForm.vehicleId}&customerId=${selectedCustomer.id}`
        );
      }
    }
    setShowScheduleModal(false);
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !customerForm.name?.trim() ||
      !customerForm.email?.trim() ||
      !customerForm.phone?.trim()
    ) {
      setError("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerForm.email.trim())) {
      setError("Email không hợp lệ");
      return;
    }

    // Basic phone validation
    const phoneRegex = /^[0-9+\-\s()]+$/;
    if (!phoneRegex.test(customerForm.phone.trim())) {
      setError("Số điện thoại không hợp lệ");
      return;
    }

    try {
      setCreating(true);
      setError(null);
      await customerService.createCustomer({
        name: customerForm.name.trim(),
        email: customerForm.email.trim(),
        phone: customerForm.phone.trim(),
        address: customerForm.address?.trim() || "",
        testDrives: [],
        orders: [],
      });

      // Reset form and close modal
      setCustomerForm({
        name: "",
        email: "",
        phone: "",
        address: "",
        notes: "",
      });
      setShowCreateModal(false);

      // Reload customers
      await loadCustomers();
      showSnackbarMessage("Tạo khách hàng thành công", "success");
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Không thể tạo khách hàng mới";
      setError(errorMessage);
      showSnackbarMessage(errorMessage, "error");
      console.error("Error creating customer:", err);
    } finally {
      setCreating(false);
    }
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerForm({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      notes: "",
    });
    setShowEditModal(true);
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !selectedCustomer ||
      !customerForm.name?.trim() ||
      !customerForm.email?.trim() ||
      !customerForm.phone?.trim()
    ) {
      setError("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerForm.email.trim())) {
      setError("Email không hợp lệ");
      return;
    }

    // Basic phone validation
    const phoneRegex = /^[0-9+\-\s()]+$/;
    if (!phoneRegex.test(customerForm.phone.trim())) {
      setError("Số điện thoại không hợp lệ");
      return;
    }

    try {
      setUpdating(true);
      setError(null);
      await customerService.updateCustomer(selectedCustomer.id, {
        name: customerForm.name.trim(),
        email: customerForm.email.trim(),
        phone: customerForm.phone.trim(),
        address: customerForm.address?.trim() || "",
      });

      // Reset form and close modal
      setCustomerForm({
        name: "",
        email: "",
        phone: "",
        address: "",
        notes: "",
      });
      setSelectedCustomer(null);
      setShowEditModal(false);

      // Reload customers
      await loadCustomers();
      showSnackbarMessage("Cập nhật khách hàng thành công", "success");
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Không thể cập nhật thông tin khách hàng";
      setError(errorMessage);
      showSnackbarMessage(errorMessage, "error");
      console.error("Error updating customer:", err);
    } finally {
      setUpdating(false);
    }
  };

  const resetForm = () => {
    setCustomerForm({ name: "", email: "", phone: "", address: "", notes: "" });
    setError(null);
  };

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1);
    loadCustomers();
  };

  // Pagination
  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setCurrentPage(value);
  };

  // Calculate pagination
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedCustomers = customers.slice(startIndex, endIndex);

  return (
    <Box sx={{ p: 3, bgcolor: "grey.50", minHeight: "100vh" }}>
      <Card>
        <CardContent>
          <Box sx={{ mb: 3 }}>
            {/* Header */}
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              mb={3}
            >
              <Box display="flex" alignItems="center" gap={1}>
                <PersonIcon color="primary" sx={{ fontSize: 32 }} />
                <Typography variant="h4" component="h1" fontWeight="bold">
                  Quản lý khách hàng
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  resetForm();
                  setShowCreateModal(true);
                }}
                sx={{
                  bgcolor: "primary.main",
                  "&:hover": { bgcolor: "primary.dark" },
                }}
              >
                Thêm khách hàng
              </Button>
            </Box>

            {/* Tabs and Search */}
            <Box
              display="flex"
              flexDirection={{ xs: "column", md: "row" }}
              gap={2}
              alignItems="center"
              mb={3}
            >
              {/* Tabs */}
              <Box display="flex" gap={1}>
                <Button
                  variant={activeTab === "all" ? "contained" : "outlined"}
                  onClick={() => setActiveTab("all")}
                  sx={{
                    minWidth: 150,
                    ...(activeTab === "all" && {
                      bgcolor: "primary.main",
                      "&:hover": { bgcolor: "primary.dark" },
                    }),
                  }}
                >
                  Tất cả ({customers.length})
                </Button>
                <Button
                  variant={activeTab === "yours" ? "contained" : "outlined"}
                  onClick={() => setActiveTab("yours")}
                  sx={{
                    minWidth: 150,
                    ...(activeTab === "yours" && {
                      bgcolor: "secondary.main",
                      "&:hover": { bgcolor: "secondary.dark" },
                    }),
                  }}
                >
                  Của tôi ({customers.length})
                </Button>
              </Box>

              {/* Search Box */}
              <Box flex={1} minWidth={{ xs: 200, md: 300 }}>
                <div className="relative">
                  <label
                    htmlFor="search-input"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Tìm kiếm
                  </label>
                  <div className="relative">
                    <input
                      id="search-input"
                      type="text"
                      placeholder="Tìm kiếm theo tên, email hoặc số điện thoại..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium transition-all duration-200 hover:border-gray-300"
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <SearchIcon className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </div>
              </Box>

              {/* Search Button */}
              <Box display="flex" gap={2} className="mt-6">
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <SearchIcon className="w-5 h-5" />
                  Tìm kiếm
                </button>
              </Box>
            </Box>

            {/* Error Message */}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {/* Loading State */}
            {loading ? (
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                py={10}
              >
                <CircularProgress size={60} />
                <Typography
                  variant="body1"
                  sx={{ mt: 3, color: "text.secondary" }}
                >
                  Đang tải danh sách khách hàng...
                </Typography>
              </Box>
            ) : (
              <>
                {/* Customer Table */}
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow
                        sx={{
                          "& th": {
                            fontWeight: "bold",
                            backgroundColor: "grey.100",
                          },
                        }}
                      >
                        <TableCell>Khách hàng</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Số điện thoại</TableCell>
                        <TableCell>Địa chỉ</TableCell>
                        <TableCell align="right">Thao tác</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedCustomers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                            <Typography variant="body2" color="text.secondary">
                              Không có khách hàng nào
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedCustomers.map((customer) => (
                          <TableRow key={customer.id} hover>
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={1}>
                                <Avatar
                                  sx={{
                                    bgcolor: "primary.main",
                                    width: 32,
                                    height: 32,
                                  }}
                                >
                                  {customer.name?.charAt(0).toUpperCase() ||
                                    "?"}
                                </Avatar>
                                <Typography variant="body2" fontWeight="medium">
                                  {customer.name || "N/A"}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={1}>
                                <EmailIcon
                                  sx={{ fontSize: 16, color: "text.secondary" }}
                                />
                                <Typography variant="body2">
                                  {customer.email || "N/A"}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={1}>
                                <PhoneIcon
                                  sx={{ fontSize: 16, color: "text.secondary" }}
                                />
                                <Typography variant="body2">
                                  {customer.phone || "N/A"}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={1}>
                                <LocationOnIcon
                                  sx={{ fontSize: 16, color: "text.secondary" }}
                                />
                                <Typography
                                  variant="body2"
                                  sx={{
                                    maxWidth: 200,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                >
                                  {customer.address || "N/A"}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell align="right">
                              <Box
                                display="flex"
                                gap={1}
                                justifyContent="flex-end"
                              >
                                <Tooltip title="Xem chi tiết">
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      setSelectedCustomer(customer)
                                    }
                                    sx={{ color: "primary.main" }}
                                  >
                                    <VisibilityIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Chỉnh sửa">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleEditCustomer(customer)}
                                    sx={{ color: "info.main" }}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Xem thanh toán">
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      setSelectedCustomerForPayments(customer);
                                      loadCustomerPayments(customer.id);
                                      setShowPaymentsModal(true);
                                    }}
                                    sx={{ color: "success.main" }}
                                  >
                                    <CreditCardIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Pagination */}
                {customers.length > pageSize && (
                  <Box display="flex" justifyContent="center" mt={3}>
                    <Pagination
                      count={Math.ceil(customers.length / pageSize)}
                      page={currentPage}
                      onChange={handlePageChange}
                      color="primary"
                      size="large"
                    />
                  </Box>
                )}
              </>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Create Customer Modal */}
      <Dialog
        open={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle
          sx={{
            bgcolor: "success.main",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <AddIcon />
            <Typography variant="h6" component="span">
              Thêm khách hàng mới
            </Typography>
          </Box>
          <IconButton
            onClick={() => {
              setShowCreateModal(false);
              resetForm();
            }}
            sx={{ color: "white" }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <form onSubmit={handleCreateCustomer} id="create-customer-form">
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Box
                display="flex"
                gap={2}
                flexDirection={{ xs: "column", md: "row" }}
              >
                <TextField
                  fullWidth
                  label="Họ và tên"
                  required
                  value={customerForm.name}
                  onChange={(e) =>
                    setCustomerForm({ ...customerForm, name: e.target.value })
                  }
                  placeholder="Nhập họ và tên"
                />
                <TextField
                  fullWidth
                  label="Số điện thoại"
                  required
                  type="tel"
                  value={customerForm.phone}
                  onChange={(e) =>
                    setCustomerForm({
                      ...customerForm,
                      phone: e.target.value,
                    })
                  }
                  placeholder="Nhập số điện thoại"
                />
              </Box>
              <TextField
                fullWidth
                label="Email"
                required
                type="email"
                value={customerForm.email}
                onChange={(e) =>
                  setCustomerForm({
                    ...customerForm,
                    email: e.target.value,
                  })
                }
                placeholder="Nhập email"
              />
              <TextField
                fullWidth
                label="Địa chỉ"
                multiline
                rows={3}
                value={customerForm.address}
                onChange={(e) =>
                  setCustomerForm({
                    ...customerForm,
                    address: e.target.value,
                  })
                }
                placeholder="Nhập địa chỉ"
              />
              <TextField
                fullWidth
                label="Ghi chú"
                multiline
                rows={2}
                value={customerForm.notes}
                onChange={(e) =>
                  setCustomerForm({
                    ...customerForm,
                    notes: e.target.value,
                  })
                }
                placeholder="Ghi chú về khách hàng"
              />
            </Stack>
          </form>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setShowCreateModal(false);
              resetForm();
            }}
            disabled={creating}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            form="create-customer-form"
            variant="contained"
            color="success"
            disabled={creating}
            startIcon={creating ? <CircularProgress size={20} /> : <AddIcon />}
          >
            {creating ? "Đang tạo..." : "Thêm khách hàng"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Customer Modal */}
      <Dialog
        open={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedCustomer(null);
          resetForm();
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle
          sx={{
            bgcolor: "primary.main",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <EditIcon />
            <Typography variant="h6" component="span">
              Chỉnh sửa khách hàng
            </Typography>
          </Box>
          <IconButton
            onClick={() => {
              setShowEditModal(false);
              setSelectedCustomer(null);
              resetForm();
            }}
            sx={{ color: "white" }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <form onSubmit={handleUpdateCustomer} id="edit-customer-form">
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Box
                display="flex"
                gap={2}
                flexDirection={{ xs: "column", md: "row" }}
              >
                <TextField
                  fullWidth
                  label="Họ và tên"
                  required
                  value={customerForm.name}
                  onChange={(e) =>
                    setCustomerForm({ ...customerForm, name: e.target.value })
                  }
                  placeholder="Nhập họ và tên"
                />
                <TextField
                  fullWidth
                  label="Số điện thoại"
                  required
                  type="tel"
                  value={customerForm.phone}
                  onChange={(e) =>
                    setCustomerForm({
                      ...customerForm,
                      phone: e.target.value,
                    })
                  }
                  placeholder="Nhập số điện thoại"
                />
              </Box>
              <TextField
                fullWidth
                label="Email"
                required
                type="email"
                value={customerForm.email}
                onChange={(e) =>
                  setCustomerForm({
                    ...customerForm,
                    email: e.target.value,
                  })
                }
                placeholder="Nhập email"
              />
              <TextField
                fullWidth
                label="Địa chỉ"
                multiline
                rows={3}
                value={customerForm.address}
                onChange={(e) =>
                  setCustomerForm({
                    ...customerForm,
                    address: e.target.value,
                  })
                }
                placeholder="Nhập địa chỉ"
              />
            </Stack>
          </form>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setShowEditModal(false);
              setSelectedCustomer(null);
              resetForm();
            }}
            disabled={updating}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            form="edit-customer-form"
            variant="contained"
            color="primary"
            disabled={updating}
            startIcon={updating ? <CircularProgress size={20} /> : <EditIcon />}
          >
            {updating ? "Đang cập nhật..." : "Cập nhật"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Customer Detail Modal */}
      <Dialog
        open={!!selectedCustomer && !showEditModal && !showPaymentsModal}
        onClose={() => setSelectedCustomer(null)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle
          sx={{
            bgcolor: "secondary.main",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <VisibilityIcon />
            <Typography variant="h6" component="span">
              Thông tin chi tiết khách hàng
            </Typography>
          </Box>
          <IconButton
            onClick={() => setSelectedCustomer(null)}
            sx={{ color: "white" }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {selectedCustomer && (
            <Box>
              {/* Header Profile Section */}
              <Box
                sx={{
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  p: 4,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    top: -20,
                    right: -20,
                    width: 120,
                    height: 120,
                    borderRadius: "50%",
                    bgcolor: "rgba(255,255,255,0.1)",
                  }}
                />
                <Box
                  sx={{
                    position: "absolute",
                    bottom: -30,
                    left: -30,
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    bgcolor: "rgba(255,255,255,0.05)",
                  }}
                />
                <Box
                  display="flex"
                  alignItems="center"
                  gap={3}
                  sx={{ position: "relative", zIndex: 1 }}
                >
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      bgcolor: "rgba(255,255,255,0.2)",
                      color: "white",
                      fontSize: "2rem",
                      fontWeight: "bold",
                      border: "3px solid rgba(255,255,255,0.3)",
                    }}
                  >
                    {selectedCustomer.name?.charAt(0).toUpperCase() || "?"}
                  </Avatar>
                  <Box flex={1}>
                    <Typography variant="h5" fontWeight="600" gutterBottom>
                      {selectedCustomer.name || "N/A"}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <EmailIcon sx={{ fontSize: 16, opacity: 0.8 }} />
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        {selectedCustomer.email || "N/A"}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <PhoneIcon sx={{ fontSize: 16, opacity: 0.8 }} />
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        {selectedCustomer.phone || "N/A"}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* Content Section */}
              <Box sx={{ p: 3 }}>
                <Box
                  display="flex"
                  gap={3}
                  flexDirection={{ xs: "column", lg: "row" }}
                >
                  {/* Left Column - Personal Info */}
                  <Box flex={{ xs: "1", lg: "0 0 50%" }}>
                    <Card
                      sx={{
                        height: "100%",
                        background:
                          "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
                        border: "none",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Box display="flex" alignItems="center" gap={1} mb={2}>
                          <Box
                            sx={{
                              p: 1,
                              borderRadius: 1.5,
                              bgcolor: "primary.main",
                              color: "white",
                            }}
                          >
                            <PersonIcon sx={{ fontSize: 20 }} />
                          </Box>
                          <Typography
                            variant="subtitle1"
                            fontWeight="600"
                            color="primary.main"
                          >
                            Thông tin cá nhân
                          </Typography>
                        </Box>
                        <Stack spacing={2}>
                          <Box
                            sx={{
                              p: 2,
                              borderRadius: 1.5,
                              bgcolor: "white",
                              boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                            }}
                          >
                            <Box
                              display="flex"
                              alignItems="center"
                              gap={1}
                              mb={0.5}
                            >
                              <PersonIcon
                                sx={{ fontSize: 16, color: "primary.main" }}
                              />
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                fontWeight="500"
                                textTransform="uppercase"
                                letterSpacing={0.5}
                              >
                                Họ và tên
                              </Typography>
                            </Box>
                            <Typography
                              variant="body2"
                              fontWeight="500"
                              color="text.primary"
                            >
                              {selectedCustomer.name || "Chưa cập nhật"}
                            </Typography>
                          </Box>

                          <Box
                            sx={{
                              p: 2,
                              borderRadius: 1.5,
                              bgcolor: "white",
                              boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                            }}
                          >
                            <Box
                              display="flex"
                              alignItems="center"
                              gap={1}
                              mb={0.5}
                            >
                              <EmailIcon
                                sx={{ fontSize: 16, color: "info.main" }}
                              />
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                fontWeight="500"
                                textTransform="uppercase"
                                letterSpacing={0.5}
                              >
                                Email
                              </Typography>
                            </Box>
                            <Typography
                              variant="body2"
                              fontWeight="500"
                              color="text.primary"
                            >
                              {selectedCustomer.email || "Chưa cập nhật"}
                            </Typography>
                          </Box>

                          <Box
                            sx={{
                              p: 2,
                              borderRadius: 1.5,
                              bgcolor: "white",
                              boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                            }}
                          >
                            <Box
                              display="flex"
                              alignItems="center"
                              gap={1}
                              mb={0.5}
                            >
                              <PhoneIcon
                                sx={{ fontSize: 16, color: "success.main" }}
                              />
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                fontWeight="500"
                                textTransform="uppercase"
                                letterSpacing={0.5}
                              >
                                Số điện thoại
                              </Typography>
                            </Box>
                            <Typography
                              variant="body2"
                              fontWeight="500"
                              color="text.primary"
                            >
                              {selectedCustomer.phone || "Chưa cập nhật"}
                            </Typography>
                          </Box>

                          <Box
                            sx={{
                              p: 2,
                              borderRadius: 1.5,
                              bgcolor: "white",
                              boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                            }}
                          >
                            <Box
                              display="flex"
                              alignItems="center"
                              gap={1}
                              mb={0.5}
                            >
                              <LocationOnIcon
                                sx={{ fontSize: 16, color: "warning.main" }}
                              />
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                fontWeight="500"
                                textTransform="uppercase"
                                letterSpacing={0.5}
                              >
                                Địa chỉ
                              </Typography>
                            </Box>
                            <Typography
                              variant="body2"
                              fontWeight="500"
                              color="text.primary"
                            >
                              {selectedCustomer.address || "Chưa cập nhật"}
                            </Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Box>

                  {/* Right Column - Status & Notes */}
                  <Box flex={{ xs: "1", lg: "0 0 50%" }}>
                    <Stack spacing={2}>
                      {/* Status Card */}
                      <Card
                        sx={{
                          background:
                            "linear-gradient(135deg, #e8f5e8 0%, #d4edda 100%)",
                          border: "1px solid",
                          borderColor: "success.light",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                        }}
                      >
                        <CardContent sx={{ p: 2.5 }}>
                          <Box
                            display="flex"
                            alignItems="center"
                            gap={1}
                            mb={1.5}
                          >
                            <Box
                              sx={{
                                p: 1,
                                borderRadius: 1.5,
                                bgcolor: "success.main",
                                color: "white",
                              }}
                            >
                              <VisibilityIcon sx={{ fontSize: 20 }} />
                            </Box>
                            <Typography
                              variant="subtitle1"
                              fontWeight="600"
                              color="success.dark"
                            >
                              Trạng thái khách hàng
                            </Typography>
                          </Box>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                bgcolor: "success.main",
                              }}
                            />
                            <Typography
                              variant="body2"
                              fontWeight="500"
                              color="success.dark"
                            >
                              Đang hoạt động
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>

                      {/* Notes Card */}
                      <Card
                        sx={{
                          background:
                            "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
                          border: "1px solid",
                          borderColor: "grey.300",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                          flex: 1,
                        }}
                      >
                        <CardContent sx={{ p: 2.5 }}>
                          <Box
                            display="flex"
                            alignItems="center"
                            gap={1}
                            mb={1.5}
                          >
                            <Box
                              sx={{
                                p: 1,
                                borderRadius: 1.5,
                                bgcolor: "primary.main",
                                color: "white",
                              }}
                            >
                              <EditIcon sx={{ fontSize: 20 }} />
                            </Box>
                            <Typography
                              variant="subtitle1"
                              fontWeight="600"
                              color="primary.main"
                            >
                              Ghi chú
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              p: 2,
                              borderRadius: 1.5,
                              bgcolor: "white",
                              border: "1px solid",
                              borderColor: "grey.200",
                              minHeight: 100,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              fontStyle="italic"
                            >
                              Chưa có ghi chú nào cho khách hàng này
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>

                      {/* Quick Actions */}
                      <Card
                        sx={{
                          background:
                            "linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)",
                          border: "1px solid",
                          borderColor: "warning.light",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                        }}
                      >
                        <CardContent sx={{ p: 2.5 }}>
                          <Box
                            display="flex"
                            alignItems="center"
                            gap={1}
                            mb={1.5}
                          >
                            <Box
                              sx={{
                                p: 1,
                                borderRadius: 1.5,
                                bgcolor: "warning.main",
                                color: "white",
                              }}
                            >
                              <CreditCardIcon sx={{ fontSize: 20 }} />
                            </Box>
                            <Typography
                              variant="subtitle1"
                              fontWeight="600"
                              color="warning.dark"
                            >
                              Thao tác nhanh
                            </Typography>
                          </Box>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            mb={1}
                          >
                            Sử dụng các nút bên dưới để thực hiện các thao tác
                            nhanh
                          </Typography>
                        </CardContent>
                      </Card>
                    </Stack>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions
          sx={{
            p: 3,
            bgcolor: "grey.50",
            borderTop: "1px solid",
            borderColor: "divider",
            display: "flex",
            gap: 2,
            justifyContent: "space-between",
          }}
        >
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => {
                if (selectedCustomer) {
                  handleEditCustomer(selectedCustomer);
                }
              }}
              sx={{
                borderColor: "primary.main",
                color: "primary.main",
                "&:hover": {
                  bgcolor: "primary.light",
                  color: "white",
                },
              }}
            >
              Chỉnh sửa
            </Button>
            <Button
              variant="outlined"
              startIcon={<CreditCardIcon />}
              onClick={() => {
                if (selectedCustomer) {
                  setSelectedCustomerForPayments(selectedCustomer);
                  loadCustomerPayments(selectedCustomer.id);
                  setShowPaymentsModal(true);
                  setSelectedCustomer(null);
                }
              }}
              sx={{
                borderColor: "success.main",
                color: "success.main",
                "&:hover": {
                  bgcolor: "success.light",
                  color: "white",
                },
              }}
            >
              Xem thanh toán
            </Button>
          </Box>
          <Button
            onClick={() => setSelectedCustomer(null)}
            variant="contained"
            sx={{
              bgcolor: "grey.600",
              "&:hover": { bgcolor: "grey.700" },
            }}
          >
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Schedule Modal */}
      <Dialog
        open={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            bgcolor: "info.main",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <EventIcon />
            <Typography variant="h6" component="span">
              Đặt lịch cho khách hàng
            </Typography>
          </Box>
          <IconButton
            onClick={() => setShowScheduleModal(false)}
            sx={{ color: "white" }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <form onSubmit={handleScheduleSubmit} id="schedule-form">
            <Stack spacing={3} sx={{ mt: 1 }}>
              {/* Vehicle Type Selection */}
              <FormControl component="fieldset">
                <FormLabel component="legend" required>
                  Loại xe
                </FormLabel>
                <RadioGroup
                  row
                  value={scheduleForm.vehicleType}
                  onChange={(e) =>
                    setScheduleForm({
                      ...scheduleForm,
                      vehicleType: e.target.value,
                      vehicleId: "",
                    })
                  }
                >
                  <FormControlLabel
                    value="car"
                    control={<Radio />}
                    label="Ô tô điện"
                  />
                  <FormControlLabel
                    value="motorbike"
                    control={<Radio />}
                    label="Xe máy điện"
                  />
                </RadioGroup>
              </FormControl>

              {/* Vehicle Selection */}
              <FormControl fullWidth required>
                <InputLabel>Chọn xe</InputLabel>
                <Select
                  value={scheduleForm.vehicleId}
                  onChange={(e) =>
                    setScheduleForm({
                      ...scheduleForm,
                      vehicleId: e.target.value,
                    })
                  }
                  label="Chọn xe"
                >
                  <MenuItem value="">
                    <em>Chọn xe</em>
                  </MenuItem>
                  {scheduleForm.vehicleType === "car"
                    ? mockVehicles.map((vehicle) => (
                        <MenuItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.model} - {vehicle.version}
                        </MenuItem>
                      ))
                    : mockMotorbikes.map((vehicle) => (
                        <MenuItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.model} - {vehicle.version}
                        </MenuItem>
                      ))}
                </Select>
              </FormControl>
            </Stack>
          </form>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setShowScheduleModal(false)}>Hủy</Button>
          <Button
            type="submit"
            form="schedule-form"
            variant="contained"
            color="info"
            startIcon={<EventIcon />}
          >
            Tiếp tục
          </Button>
        </DialogActions>
      </Dialog>

      {/* Customer Payments Modal */}
      <Dialog
        open={showPaymentsModal}
        onClose={() => {
          setShowPaymentsModal(false);
          setSelectedCustomerPayments([]);
          setSelectedCustomerForPayments(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle
          sx={{
            bgcolor: "warning.main",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <CreditCardIcon />
            <Box>
              <Typography variant="h6" component="span">
                Lịch sử thanh toán
              </Typography>
              {selectedCustomerForPayments && (
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {selectedCustomerForPayments.name}
                </Typography>
              )}
            </Box>
          </Box>
          <IconButton
            onClick={() => {
              setShowPaymentsModal(false);
              setSelectedCustomerPayments([]);
              setSelectedCustomerForPayments(null);
            }}
            sx={{ color: "white" }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {!selectedCustomerPayments ||
          selectedCustomerPayments.length === 0 ? (
            <Box textAlign="center" py={8}>
              <Box
                sx={{
                  width: 96,
                  height: 96,
                  borderRadius: "50%",
                  bgcolor: "warning.light",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mx: "auto",
                  mb: 2,
                }}
              >
                <CreditCardIcon sx={{ fontSize: 48, color: "warning.main" }} />
              </Box>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Chưa có thanh toán nào
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Khách hàng này chưa có giao dịch thanh toán nào trong hệ thống.
              </Typography>
            </Box>
          ) : (
            <Stack spacing={2} sx={{ mt: 1 }}>
              {selectedCustomerPayments.map((payment, index) => (
                <Card key={index} variant="outlined">
                  <CardContent>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="flex-start"
                    >
                      <Box flex={1}>
                        <Box display="flex" alignItems="center" gap={1} mb={2}>
                          <CreditCardIcon color="warning" />
                          <Typography variant="h6" fontWeight="bold">
                            Thanh toán #{payment?.id || index + 1}
                          </Typography>
                        </Box>
                        <Box
                          display="flex"
                          gap={2}
                          sx={{ ml: 4 }}
                          flexDirection={{ xs: "column", sm: "row" }}
                        >
                          <Box flex={1}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Ngày thanh toán
                            </Typography>
                            <Typography variant="body2" fontWeight="medium">
                              {payment?.date || "N/A"}
                            </Typography>
                          </Box>
                          <Box flex={1}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Phương thức
                            </Typography>
                            <Typography variant="body2" fontWeight="medium">
                              {payment?.method || "N/A"}
                            </Typography>
                          </Box>
                        </Box>
                        {payment?.description && (
                          <Box sx={{ ml: 4, mt: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              {payment.description}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                      <Box textAlign="right" ml={2}>
                        <Typography
                          variant="h5"
                          fontWeight="bold"
                          color="success.main"
                          gutterBottom
                        >
                          {payment?.amount
                            ? `${payment.amount.toLocaleString()} ₫`
                            : "N/A"}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setShowPaymentsModal(false);
              setSelectedCustomerPayments([]);
              setSelectedCustomerForPayments(null);
            }}
          >
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
