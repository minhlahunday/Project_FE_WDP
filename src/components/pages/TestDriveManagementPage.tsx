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
} from "@mui/material";

import {LocalizationProvider, DateTimePicker} from "@mui/x-date-pickers";
import {AdapterDayjs} from "@mui/x-date-pickers/AdapterDayjs";
import {message} from "antd";

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
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

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
      setTotal(drives.length);
      setTestDrives(drives.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE));
    } catch (error) {
      console.error(error);
    }
    setIsLoading(false);
  };

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
    if (!form.customer || !form.vehicle || !form.schedule_at) return;

    const customerId = form.customer._id || form.customer.id;
    const vehicleId = form.vehicle._id || form.vehicle.id;
    if (!customerId || !vehicleId) {
      console.error("Thiếu customerId hoặc vehicleId trong form:", form);
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
    <Box p={4}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <div>
          <Typography variant="h4">Quản lý lịch hẹn lái thử</Typography>
          <Typography variant="subtitle1">Tổng số: {total}</Typography>
        </div>
        {
          <Button variant="contained" onClick={openCreateModal}>
            + Tạo lịch hẹn
          </Button>
        }
      </Box>

      <Box mb={2}>
        {isLoading ? (
          <Box textAlign="center">
            <CircularProgress />
          </Box>
        ) : testDrives.length === 0 ? (
          <Typography textAlign="center" color="text.secondary">
            Không có lịch hẹn nào.
          </Typography>
        ) : (
          <Box
            display="grid"
            gridTemplateColumns="repeat(auto-fill, minmax(300px, 1fr))"
            gap={2}
          >
            {testDrives.map((d) => (
              <Box
                key={d._id}
                p={2}
                border={1}
                borderRadius={2}
                borderColor="grey.300"
                onClick={() => {
                  setSelectedDrive(d);
                  setOpenDetail(true);
                }}
                sx={{cursor: "pointer", "&:hover": {boxShadow: 3}}}
              >
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={1}
                >
                  <Typography fontWeight="bold" noWrap>
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
                <Typography variant="body2">
                  Xe:{" "}
                  {typeof d.vehicle_id === "object"
                    ? d.vehicle_id.name
                    : d.vehicle_id}
                </Typography>
                <Typography variant="body2">
                  Ngày: {dayjs(d.schedule_at).format("DD/MM/YYYY HH:mm")}
                </Typography>
                <Typography variant="body2">
                  Ghi chú: {d.notes || "-"}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Box>

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
                getOptionLabel={(option: any) => option.full_name}
                value={form.customer}
                onChange={(_, value) =>
                  setForm((f) => ({...f, customer: value}))
                }
                slotProps={{
                  popper: {
                    sx: {zIndex: 9999999}, // đảm bảo nằm trên modal
                  },
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Khách hàng" />
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
                `${option.name} - ${option.version}`
              }
              value={form.vehicle}
              onChange={(_, value) => setForm((f) => ({...f, vehicle: value}))}
              slotProps={{
                popper: {
                  sx: {zIndex: 9999999}, // đảm bảo nằm trên modal
                },
              }}
              renderInput={(params) => <TextField {...params} label="Xe" />}
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
        maxWidth="md"
      >
        <DialogTitle>Chi tiết lịch hẹn</DialogTitle>
        <DialogContent>
          {selectedDrive && (
            <Stack spacing={2} mt={1}>
              <Typography>
                Khách hàng:{" "}
                {typeof selectedDrive.customer_id === "object"
                  ? selectedDrive.customer_id.full_name
                  : selectedDrive.customer_id}
              </Typography>
              <Typography>
                Xe:{" "}
                {typeof selectedDrive.vehicle_id === "object"
                  ? selectedDrive.vehicle_id.name
                  : selectedDrive.vehicle_id}
              </Typography>
              <Typography>
                Ngày:{" "}
                {dayjs(selectedDrive.schedule_at).format("DD/MM/YYYY HH:mm")}
              </Typography>
              <Typography>Ghi chú: {selectedDrive.notes || "-"}</Typography>

              <Stack direction="row" spacing={2} alignItems="center">
                <Typography>Trạng thái:</Typography>
                <TextField
                  select
                  size="small"
                  value={selectedDrive.status}
                  onChange={(e) =>
                    handleUpdateStatus(
                      selectedDrive,
                      e.target.value as TestDrive["status"]
                    )
                  }
                  SelectProps={{
                    native: true,
                  }}
                >
                  {Object.keys(statusLabels).map((key) => (
                    <option key={key} value={key}>
                      {statusLabels[key as keyof typeof statusLabels]}
                    </option>
                  ))}
                </TextField>
              </Stack>

              <Stack spacing={1}>
                <Typography>Nhân viên phụ trách:</Typography>
                {user?.role === "dealer_manager" ? (
                  <Autocomplete
                    options={staffs}
                    loading={assigning}
                    getOptionLabel={(option: any) => option.full_name}
                    slotProps={{
                      popper: {
                        sx: {zIndex: 9999999999}, // đảm bảo nằm trên modal
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
                      <TextField {...params} label="Chọn nhân viên" />
                    )}
                  />
                ) : (
                  <Typography>
                    {typeof selectedDrive.assigned_staff_id === "object"
                      ? selectedDrive.assigned_staff_id.full_name
                      : selectedDrive.assigned_staff_id || "-"}
                  </Typography>
                )}
              </Stack>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          {selectedDrive && (
            <Stack mt={2} gap={2} direction="row" justifyContent="flex-end">
              <Button
                color="error"
                variant="outlined"
                onClick={async () => {
                  try {
                    await testDriveService.deleteTestDrive(selectedDrive._id);
                    setOpenDetail(false);
                    setSelectedDrive(null);
                    fetchList(currentPage);
                  } catch (error) {
                    console.error(error);
                  }
                }}
              >
                Xóa lịch hẹn
              </Button>
              <Button onClick={() => setOpenDetail(false)}>Đóng</Button>
            </Stack>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TestDriveManagementPage;
