import React, {useState, useEffect} from "react";
import dayjs, {Dayjs} from "dayjs";
import {useAuth} from "../../contexts/AuthContext";
import {testDriveService} from "../../services/testDriveService";
import {userService} from "../../services/userService";
import {
  customerService,
  CreateCustomerRequest,
} from "../../services/customerService";
import {authService} from "../../services/authService";

import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Typography,
  Autocomplete,
  CircularProgress,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  Divider,
  IconButton,
} from "@mui/material";
import { 
  Close as CloseIcon, 
  Search as SearchIcon, 
  Refresh as RefreshIcon,
  CalendarToday as CalendarIcon 
} from "@mui/icons-material";

import {LocalizationProvider, DateTimePicker} from "@mui/x-date-pickers";
import {AdapterDayjs} from "@mui/x-date-pickers/AdapterDayjs";
import {message} from "antd";
import Swal from "sweetalert2";

interface TestDrive {
  _id: string;
  customer_id:
    | {_id: string; full_name: string; phone?: string; email?: string}
    | string;
  vehicle_id: {_id: string; name: string; model?: string} | string;
  schedule_at: string;
  assigned_staff_id?:
    | {_id: string; full_name?: string; email?: string}
    | string;
  notes?: string;
  status: "pending" | "confirmed" | "completed" | "canceled";
}

interface Staff {
  _id: string;
  full_name: string;
  email?: string;
}

const statusLabels = {
  pending: "Chờ duyệt",
  confirmed: "Đã xác nhận",
  completed: "Hoàn thành",
  canceled: "Đã hủy",
} as const;

const statusColors = {
  pending: "default",
  confirmed: "primary",
  completed: "success",
  canceled: "error",
} as const;

const PAGE_SIZE = 10;

const TestDriveManagementPage: React.FC = () => {
  const {user} = useAuth();

  const [testDrives, setTestDrives] = useState<TestDrive[]>([]);
  const [allTestDrives, setAllTestDrives] = useState<TestDrive[]>([]);
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Detail modal
  const [selectedDrive, setSelectedDrive] = useState<TestDrive | null>(null);
  const [openDetail, setOpenDetail] = useState(false);

  // Create Test Drive modal
  const [openCreate, setOpenCreate] = useState(false);
  const [vehicleList, setVehicleList] = useState<any[]>([]);
  const [customerList, setCustomerList] = useState<any[]>([]);
  const [creatingDrive, setCreatingDrive] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const [form, setForm] = useState<{
    customer: any | null;
    vehicle: any | null;
    schedule_at: Dayjs | null;
    notes: string;
  }>({
    customer: null,
    vehicle: null,
    schedule_at: null,
    notes: "",
  });

  // Create Customer modal
  const [openCustomerModal, setOpenCustomerModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState<CreateCustomerRequest>({
    full_name: "",
    phone: "",
    email: "",
    address: "",
  });
  const [creatingCustomer, setCreatingCustomer] = useState(false);

  const currentUserId = (user as any)?._id || (user as any)?.id;

  useEffect(() => {
    fetchList();
    if (user?.role === "dealer_manager" && user?.dealership_id) {
      userService
        .getUsers({dealership_id: user.dealership_id, role: "dealer_staff"})
        .then((res) => setStaffs(res?.data?.data || []));
    }
  }, [user]);

  const fetchList = async (page = 1) => {
    setIsLoading(true);
    setCurrentPage(page);
    try {
      let res;
      if (user?.role === "dealer_manager") {
        res = await testDriveService.getTestDrives();
      } else {
        res = await testDriveService.getMyTestDrives();
      }
      const drives: TestDrive[] = res?.data?.data || res?.data || [];
      setAllTestDrives(drives);
      applyFilters(drives, page);
    } catch (error) {
      console.error(error);
    }
    setIsLoading(false);
  };

  const applyFilters = (drives: TestDrive[], page = 1) => {
    let filtered = [...drives];

    // Apply search filter
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter((drive) => {
        const customerName = typeof drive.customer_id === "object"
          ? drive.customer_id.full_name?.toLowerCase() || ""
          : String(drive.customer_id).toLowerCase();
        const vehicleName = typeof drive.vehicle_id === "object"
          ? drive.vehicle_id.name?.toLowerCase() || ""
          : String(drive.vehicle_id).toLowerCase();
        const notes = (drive.notes || "").toLowerCase();
        
        return (
          customerName.includes(searchLower) ||
          vehicleName.includes(searchLower) ||
          notes.includes(searchLower)
        );
      });
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((drive) => drive.status === statusFilter);
    }

    setTotal(filtered.length);
    setTestDrives(filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE));
  };

  const handleSearch = () => {
    setCurrentPage(1);
    applyFilters(allTestDrives, 1);
  };

  const handleReset = () => {
    setSearchText('');
    setStatusFilter('all');
    setCurrentPage(1);
    applyFilters(allTestDrives, 1);
  };

  useEffect(() => {
    if (allTestDrives.length > 0) {
      applyFilters(allTestDrives, currentPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText, statusFilter, currentPage]);

  const openCreateModal = async () => {
    setOpenCreate(true);
    try {
      const vehiclesRes = await authService.getVehicles();
      const vehicles = Array.isArray((vehiclesRes?.data as any)?.data)
        ? (vehiclesRes?.data as any).data
        : [];
      setVehicleList(vehicles);
    } catch {
      setVehicleList([]);
    }

    try {
      const customers = await customerService.getAllCustomers();
      const normalized = (customers || []).map((c: any) => ({
        ...c,
        full_name: c.full_name || c.name || "Khách chưa đặt tên",
      }));
      setCustomerList(normalized);
    } catch {
      setCustomerList([]);
    }
  };

  const closeCreateModal = () => {
    setForm({customer: null, vehicle: null, schedule_at: null, notes: ""});
    setOpenCreate(false);
  };

  const handleCreateCustomer = async () => {
    if (!newCustomer.full_name.trim()) return;
    setCreatingCustomer(true);
    try {
      const customer = await customerService.createCustomer(newCustomer);

      const normalized = {
        ...customer,
        full_name: customer.name || newCustomer.full_name,
        name: customer.name || newCustomer.full_name,
      };
      setCustomerList((prev) => [...prev, normalized]);
      setForm((f) => ({...f, customer: normalized}));
      setNewCustomer({full_name: "", phone: "", email: "", address: ""});
      setOpenCustomerModal(false);
      message.success("Tạo khách hàng mới thành công.");
    } catch (error) {
      console.error(error);
      message.error("Tạo khách hàng mới thất bại. Vui lòng thử lại.");
    }
    setCreatingCustomer(false);
  };

  const handleCreateDrive = async () => {
    if (!form.customer || !form.vehicle || !form.schedule_at) {
      message.error("Vui lòng điền đầy đủ thông tin: khách hàng, xe và ngày giờ");
      return;
    }

    // Lấy customerId từ nhiều nguồn có thể
    const customerId = form.customer._id || form.customer.id || (form.customer as any)?.customer_id;
    // Lấy vehicleId từ nhiều nguồn có thể
    const vehicleId = form.vehicle._id || form.vehicle.id || (form.vehicle as any)?.vehicle_id;
    
    if (!customerId || !vehicleId) {
      console.error("Thiếu customerId hoặc vehicleId trong form:", {
        customer: form.customer,
        vehicle: form.vehicle,
        customerId,
        vehicleId
      });
      message.error("Không tìm thấy ID của khách hàng hoặc xe. Vui lòng chọn lại.");
      return;
    }

    setCreatingDrive(true);
    try {
      const response = await testDriveService.createTestDrive({
        customer_id: customerId,
        vehicle_id: vehicleId,
        schedule_at: form.schedule_at.toISOString(),
        notes: form.notes,
      });

      // Nếu staff tạo, tự assign chính mình
      if (user?.role === "dealer_staff" && currentUserId) {
        const created =
          (response?.data as any)?.data ||
          (response?.data as any) ||
          (response as any);
        const newId = created?._id || created?.id;
        if (newId) {
          try {
            await testDriveService.assignStaff(newId, currentUserId);
          } catch (assignErr) {
            console.error("Assign chính mình thất bại:", assignErr);
          }
        }
      }
      closeCreateModal();
      message.success("Tạo lịch hẹn lái thử với khách hàng thành công.");

      fetchList(currentPage);
    } catch (error) {
      console.error(error);
      message.error("Tạo lịch hẹn lái thử không thành công. Vui lòng thử lại.");
    }
    setCreatingDrive(false);
  };

  const handleAssignStaff = async (drive: TestDrive, staff: Staff | null) => {
    if (!staff?._id) return;
    setAssigning(true);
    try {
      await testDriveService.assignStaff(drive._id, staff._id);
      setSelectedDrive((prev) =>
        prev && prev._id === drive._id
          ? {...prev, assigned_staff_id: staff}
          : prev
      );
      fetchList(currentPage);
      message.success("Phân công cho nhân viên thành công.");
    } catch (error) {
      console.error(error);
      message.error("Phân công thất bại. Vui lòng thử lại sau.");
    }
    setAssigning(false);
  };

  const handleUpdateStatus = async (
    drive: TestDrive,
    status: TestDrive["status"]
  ) => {
    try {
      await testDriveService.updateStatus(drive._id, status);
      setSelectedDrive((prev) =>
        prev && prev._id === drive._id ? {...prev, status} : prev
      );
      fetchList(currentPage);
      setOpenDetail(false);
      message.success("Cập nhật trạng thái thành công.");
    } catch (error) {
      console.error(error);
      message.error(
        "Cập nhật trạng thái thất bại. Vui lòng thử lại trong giây lát."
      );
    }
  };

  //   const canStaffUpdateStatus = (drive?: TestDrive | null) => {
  //     if (!drive) return false;
  //     if (user?.role === "dealer_manager") return true;
  //     if (user?.role === "dealer_staff") {
  //       const assignedId = extractStaffId(drive.assigned_staff_id);
  //       return assignedId && currentUserId && assignedId === currentUserId;
  //     }
  //     return false;
  //   };

  return (
    <div className="pl-8 pr-3 py-3 bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 min-h-full">
      <Card>
        <CardContent>
          <Box sx={{ mb: 3 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
              <Box display="flex" alignItems="center" gap={1}>
                <CalendarIcon color="primary" sx={{ fontSize: 32 }} />
                <Typography variant="h4" component="h1" fontWeight="bold">
                  Quản lý lịch hẹn lái thử
                </Typography>
              </Box>
              <Button 
                variant="contained" 
                onClick={openCreateModal}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                + Tạo lịch hẹn
              </Button>
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Tổng số: {total} lịch hẹn
            </Typography>

            {/* Search and Filter Section */}
            <Card sx={{ p: 3, mb: 3, bgcolor: 'white', boxShadow: 1 }}>
              <Stack spacing={2}>
                <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={2} alignItems="flex-end">
                  {/* Search Box */}
                  <Box flex={1} minWidth={{ xs: 200, md: 300 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>
                      Tìm kiếm
                    </Typography>
                    <Box sx={{ position: 'relative' }}>
                      <TextField
                        fullWidth
                        placeholder="Tìm kiếm theo tên khách hàng, xe, ghi chú..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            pl: 4,
                            borderRadius: 2,
                            '&:hover': {
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'grey.300',
                              },
                            },
                          },
                        }}
                      />
                      <Box
                        sx={{
                          position: 'absolute',
                          left: 12,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          pointerEvents: 'none',
                          color: 'text.secondary',
                        }}
                      >
                        <SearchIcon />
                      </Box>
                    </Box>
                  </Box>

                  {/* Status Filter */}
                  <Box minWidth={{ xs: '100%', md: 200 }}>
                    {/* <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>
                      Trạng thái
                    </Typography> */}
                    <FormControl fullWidth size="small">
                      <Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        sx={{
                          borderRadius: 2,
                        }}
                      >
                        <MenuItem value="all">Tất cả</MenuItem>
                        <MenuItem value="pending">Chờ duyệt</MenuItem>
                        <MenuItem value="confirmed">Đã xác nhận</MenuItem>
                        <MenuItem value="completed">Hoàn thành</MenuItem>
                        <MenuItem value="canceled">Đã hủy</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  {/* Action Buttons */}
                  <Box display="flex" gap={2}>
                    <Button
                      variant="contained"
                      startIcon={<SearchIcon />}
                      onClick={handleSearch}
                      disabled={isLoading}
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        px: 3,
                        py: 1.5,
                      }}
                    >
                      Tìm kiếm
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<RefreshIcon />}
                      onClick={handleReset}
                      disabled={isLoading}
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        px: 3,
                        py: 1.5,
                      }}
                    >
                      Đặt lại
                    </Button>
                  </Box>
                </Box>
              </Stack>
            </Card>

            {isLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
              </Box>
            ) : testDrives.length === 0 ? (
              <Box textAlign="center" py={8}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Không có lịch hẹn nào
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Hãy tạo lịch hẹn mới để bắt đầu
                </Typography>
              </Box>
            ) : (
              <Box
                display="grid"
                gridTemplateColumns="repeat(auto-fill, minmax(300px, 1fr))"
                gap={3}
              >
                {testDrives.map((d) => (
                  <Card
                    key={d._id}
                    onClick={() => {
                      setSelectedDrive(d);
                      setOpenDetail(true);
                    }}
                    sx={{
                      cursor: "pointer",
                      "&:hover": {
                        boxShadow: 4,
                        transform: "translateY(-2px)",
                        transition: "all 0.2s",
                      },
                      transition: "all 0.2s",
                    }}
                  >
                    <CardContent>
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        mb={2}
                      >
                        <Typography variant="h6" fontWeight="bold" noWrap>
                          {typeof d.customer_id === "object"
                            ? d.customer_id.full_name
                            : d.customer_id}
                        </Typography>
                        <Chip
                          label={statusLabels[d.status]}
                          color={statusColors[d.status]}
                          size="small"
                        />
                      </Box>
                      <Stack spacing={1}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Xe:</strong>{" "}
                          {typeof d.vehicle_id === "object"
                            ? d.vehicle_id.name
                            : d.vehicle_id}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Ngày:</strong> {dayjs(d.schedule_at).format("DD/MM/YYYY HH:mm")}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Ghi chú:</strong> {d.notes || "-"}
                        </Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Create Test Drive Modal */}
      <Dialog
        open={openCreate}
        onClose={closeCreateModal}
        fullWidth
        maxWidth="lg"
        PaperProps={{sx: {width: "60vw"}}}
      >
        <DialogTitle>Tạo lịch hẹn lái thử</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DateTimePicker
                label="Ngày giờ"
                value={form.schedule_at}
                onChange={(value) =>
                  setForm((f) => ({...f, schedule_at: value}))
                }
                disablePast
                slotProps={{
                  popper: {
                    sx: {zIndex: 999999999999}, // đảm bảo nằm trên modal
                  },
                }}
              />
            </LocalizationProvider>
            {/* Customer Autocomplete */}
            <Stack direction="row" spacing={1} alignItems="center">
              <Autocomplete
                options={customerList}
                getOptionLabel={(option: any) => option.full_name || option.name || "Khách chưa đặt tên"}
                value={form.customer}
                onChange={(_, value) =>
                  setForm((f) => ({...f, customer: value}))
                }
                isOptionEqualToValue={(option, value) => {
                  const optionId = option._id || option.id;
                  const valueId = value?._id || value?.id;
                  return optionId === valueId;
                }}
                slotProps={{
                  popper: {
                    sx: {zIndex: 9999999}, // đảm bảo nằm trên modal
                  },
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Khách hàng" required />
                )}
                fullWidth
              />
              <Button
                variant="outlined"
                onClick={() => setOpenCustomerModal(true)}
              >
                + Khách mới
              </Button>
            </Stack>

            {/* Vehicle Autocomplete */}
            <Autocomplete
              options={vehicleList}
              getOptionLabel={(option: any) =>
                option.name && option.version 
                  ? `${option.name} - ${option.version}`
                  : option.name || option.model || "Xe chưa xác định"
              }
              value={form.vehicle}
              onChange={(_, value) => setForm((f) => ({...f, vehicle: value}))}
              isOptionEqualToValue={(option, value) => {
                const optionId = option._id || option.id;
                const valueId = value?._id || value?.id;
                return optionId === valueId;
              }}
              slotProps={{
                popper: {
                  sx: {zIndex: 9999999}, // đảm bảo nằm trên modal
                },
              }}
              renderInput={(params) => <TextField {...params} label="Xe" required />}
              fullWidth
            />

            {/* Notes */}
            <TextField
              label="Ghi chú"
              multiline
              rows={2}
              value={form.notes}
              onChange={(e) => setForm((f) => ({...f, notes: e.target.value}))}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCreateModal}>Hủy</Button>
          <Button
            variant="contained"
            onClick={handleCreateDrive}
            disabled={creatingDrive}
          >
            Tạo lịch hẹn
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Customer Modal */}
      <Dialog
        open={openCustomerModal}
        onClose={() => setOpenCustomerModal(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{sx: {width: "40vw"}}}
      >
        <DialogTitle>Tạo khách hàng mới</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Họ và tên"
              value={newCustomer.full_name}
              onChange={(e) =>
                setNewCustomer({...newCustomer, full_name: e.target.value})
              }
              fullWidth
            />
            <TextField
              label="Số điện thoại"
              value={newCustomer.phone}
              onChange={(e) =>
                setNewCustomer({...newCustomer, phone: e.target.value})
              }
              fullWidth
            />
            <TextField
              label="Email"
              value={newCustomer.email}
              onChange={(e) =>
                setNewCustomer({...newCustomer, email: e.target.value})
              }
              fullWidth
            />
            <TextField
              label="Địa chỉ"
              value={newCustomer.address}
              onChange={(e) =>
                setNewCustomer({...newCustomer, address: e.target.value})
              }
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCustomerModal(false)}>Hủy</Button>
          <Button
            variant="contained"
            onClick={handleCreateCustomer}
            disabled={creatingCustomer || !newCustomer.full_name.trim()}
          >
            Tạo khách hàng
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail Modal */}
      <Dialog
        open={openDetail}
        onClose={() => setOpenDetail(false)}
        fullWidth
        maxWidth="lg"
        disableEscapeKeyDown={false}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            maxHeight: '90vh',
            zIndex: 1300,
          }
        }}
        slotProps={{
          backdrop: {
            sx: {
              zIndex: 1299,
            }
          }
        }}
      >
        <DialogTitle sx={{ pb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              Chi tiết lịch hẹn
            </Typography>
            <IconButton
              onClick={() => setOpenDetail(false)}
              size="small"
              sx={{ color: 'text.secondary' }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ p: 3, pt: 3 }}>
          {selectedDrive && (
            <Box sx={{ maxWidth: '100%' }}>
              <Box display="flex" flexDirection={{ xs: 'column', lg: 'row' }} gap={4}>
                {/* Left Column - Customer & Vehicle Info */}
                <Box flex="1">
                  <Card elevation={1} sx={{ p: 3, height: 'fit-content' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3, color: 'primary.main' }}>
                      Thông tin lịch hẹn
                    </Typography>
                    <Stack spacing={3}>
                      {/* Customer Info */}
                      <Box>
                        <Typography variant="subtitle2" sx={{ 
                          mb: 1, 
                          fontWeight: 600, 
                          color: 'text.secondary',
                          textTransform: 'uppercase',
                          fontSize: '0.75rem',
                          letterSpacing: '0.5px'
                        }}>
                          Khách hàng
                        </Typography>
                        <Box sx={{ 
                          p: 2, 
                          backgroundColor: 'grey.50', 
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'grey.200'
                        }}>
                          <Typography variant="body1" sx={{ fontWeight: 500, fontSize: '1rem' }}>
                            {typeof selectedDrive.customer_id === "object"
                              ? selectedDrive.customer_id.full_name
                              : selectedDrive.customer_id}
                          </Typography>
                          {typeof selectedDrive.customer_id === "object" && selectedDrive.customer_id.phone && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              {selectedDrive.customer_id.phone}
                            </Typography>
                          )}
                        </Box>
                      </Box>

                      {/* Vehicle Info */}
                      <Box>
                        <Typography variant="subtitle2" sx={{ 
                          mb: 1, 
                          fontWeight: 600, 
                          color: 'text.secondary',
                          textTransform: 'uppercase',
                          fontSize: '0.75rem',
                          letterSpacing: '0.5px'
                        }}>
                          Xe thử nghiệm
                        </Typography>
                        <Box sx={{ 
                          p: 2, 
                          backgroundColor: 'primary.50', 
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'primary.200'
                        }}>
                          <Typography variant="body1" sx={{ fontWeight: 500, fontSize: '1rem', color: 'primary.dark' }}>
                            {typeof selectedDrive.vehicle_id === "object"
                              ? `${selectedDrive.vehicle_id.name} ${selectedDrive.vehicle_id.model || ''}`.trim()
                              : selectedDrive.vehicle_id}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Date Info */}
                      <Box>
                        <Typography variant="subtitle2" sx={{ 
                          mb: 1, 
                          fontWeight: 600, 
                          color: 'text.secondary',
                          textTransform: 'uppercase',
                          fontSize: '0.75rem',
                          letterSpacing: '0.5px'
                        }}>
                          Thời gian lái thử
                        </Typography>
                        <Box sx={{ 
                          p: 2, 
                          backgroundColor: 'warning.50', 
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'warning.200',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}>
                          <CalendarIcon sx={{ color: 'warning.main', fontSize: '1.2rem' }} />
                          <Typography variant="body1" sx={{ fontWeight: 500, fontSize: '1rem', color: 'warning.dark' }}>
                            {dayjs(selectedDrive.schedule_at).format("DD/MM/YYYY HH:mm")}
                          </Typography>
                        </Box>
                      </Box>
                    </Stack>
                  </Card>
                </Box>

                {/* Right Column - Status & Staff */}
                <Box flex="1">
                  <Card elevation={1} sx={{ p: 3, height: 'fit-content' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3, color: 'success.main' }}>
                      Quản lý & Ghi chú
                    </Typography>
                    <Stack spacing={3}>
                      {/* Notes */}
                      <Box>
                        <Typography variant="subtitle2" sx={{ 
                          mb: 1, 
                          fontWeight: 600, 
                          color: 'text.secondary',
                          textTransform: 'uppercase',
                          fontSize: '0.75rem',
                          letterSpacing: '0.5px'
                        }}>
                          Ghi chú
                        </Typography>
                        <Box sx={{ 
                          p: 2, 
                          backgroundColor: 'grey.50', 
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'grey.200',
                          minHeight: '60px'
                        }}>
                          <Typography variant="body1" sx={{ 
                            fontStyle: selectedDrive.notes ? 'normal' : 'italic',
                            color: selectedDrive.notes ? 'text.primary' : 'text.secondary'
                          }}>
                            {selectedDrive.notes || "Chưa có ghi chú"}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Status */}
                      <Box>
                        <Typography variant="subtitle2" sx={{ 
                          mb: 1.5, 
                          fontWeight: 600, 
                          color: 'text.secondary',
                          textTransform: 'uppercase',
                          fontSize: '0.75rem',
                          letterSpacing: '0.5px'
                        }}>
                          Trạng thái
                        </Typography>
                        <FormControl fullWidth>
                          <Select
                            value={selectedDrive.status}
                            onChange={(e) =>
                              handleUpdateStatus(
                                selectedDrive,
                                e.target.value as TestDrive["status"]
                              )
                            }
                            sx={{
                              borderRadius: 2,
                              height: '48px',
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderWidth: 2,
                              },
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'primary.main',
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'primary.main',
                              }
                            }}
                            MenuProps={{
                              PaperProps: {
                                style: {
                                  maxHeight: 300,
                                  zIndex: 9999,
                                  borderRadius: 12,
                                  boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                                },
                              },
                              style: {
                                zIndex: 9999,
                              },
                              disableScrollLock: true,
                            }}
                          >
                            {Object.keys(statusLabels).map((key) => (
                              <MenuItem 
                                key={key} 
                                value={key}
                                sx={{
                                  py: 1.5,
                                  '&:hover': {
                                    backgroundColor: 'primary.50',
                                  }
                                }}
                              >
                                <Chip
                                  label={statusLabels[key as keyof typeof statusLabels]}
                                  color={statusColors[key as keyof typeof statusColors] as any}
                                  size="small"
                                  sx={{ minWidth: '80px' }}
                                />
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Box>

                      {/* Assigned Staff */}
                      <Box>
                        <Typography variant="subtitle2" sx={{ 
                          mb: 1.5, 
                          fontWeight: 600, 
                          color: 'text.secondary',
                          textTransform: 'uppercase',
                          fontSize: '0.75rem',
                          letterSpacing: '0.5px'
                        }}>
                          Nhân viên phụ trách
                        </Typography>
                        {user?.role === "dealer_manager" ? (
                          <Autocomplete
                            options={staffs}
                            loading={assigning}
                            getOptionLabel={(option: any) => option.full_name}
                            slotProps={{
                              popper: {
                                sx: {zIndex: 9999999999},
                              },
                            }}
                            isOptionEqualToValue={(option, value) =>
                              option._id === value._id
                            }
                            value={(() => {
                              if (typeof selectedDrive.assigned_staff_id === "object") {
                                const obj = selectedDrive.assigned_staff_id;
                                const normalized: Staff = {
                                  _id: obj._id || (obj as any).id || "",
                                  full_name: obj.full_name || "Chưa gán",
                                  email: obj.email,
                                };
                                return (
                                  staffs.find((s) => s._id === normalized._id) ||
                                  normalized
                                );
                              }
                              const id = selectedDrive.assigned_staff_id;
                              if (!id) return null;
                              return staffs.find((s) => s._id === id) || null;
                            })()}
                            onChange={(_, value) =>
                              value && handleAssignStaff(selectedDrive, value)
                            }
                            renderInput={(params) => (
                              <TextField 
                                {...params} 
                                placeholder="Chọn nhân viên"
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    height: '48px',
                                    '& .MuiOutlinedInput-notchedOutline': {
                                      borderWidth: 2,
                                    },
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                      borderColor: 'primary.main',
                                    },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                      borderColor: 'primary.main',
                                    }
                                  }
                                }}
                              />
                            )}
                          />
                        ) : (
                          <Box sx={{ 
                            p: 2, 
                            backgroundColor: 'success.50', 
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'success.200'
                          }}>
                            <Typography variant="body1" sx={{ fontWeight: 500, fontSize: '1rem', color: 'success.dark' }}>
                              {typeof selectedDrive.assigned_staff_id === "object"
                                ? selectedDrive.assigned_staff_id.full_name
                                : selectedDrive.assigned_staff_id || "Chưa phân công"}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Stack>
                  </Card>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 2.5,
            backgroundColor: 'grey.50',
            borderTop: '1px solid',
            borderColor: 'divider',
            gap: 2
          }}
        >
          {selectedDrive && (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <Chip 
                  label={`ID: ${selectedDrive._id}`} 
                  size="small" 
                  variant="outlined"
                  sx={{ fontFamily: 'monospace' }}
                />
              </Box>
              <Button 
                onClick={() => setOpenDetail(false)} 
                sx={{ 
                  color: 'text.secondary',
                  '&:hover': { backgroundColor: 'grey.100' }
                }}
              >
                Đóng
              </Button>
              <Button
                onClick={() => {
                  Swal.fire({
                    title: 'Xác nhận xóa',
                    text: 'Bạn có chắc muốn xóa lịch lái thử này?',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#d33',
                    cancelButtonColor: '#3085d6',
                    confirmButtonText: 'Xóa',
                    cancelButtonText: 'Hủy'
                  }).then((result) => {
                    if (result.isConfirmed) {
                      // Handle delete logic here
                      setOpenDetail(false);
                      Swal.fire('Đã xóa!', 'Lịch lái thử đã được xóa.', 'success');
                    }
                  });
                }}
                color="error"
                sx={{ 
                  '&:hover': { backgroundColor: 'error.dark' }
                }}
              >
                Xóa
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default TestDriveManagementPage;
