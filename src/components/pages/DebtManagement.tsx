import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Tooltip,
  IconButton,
  Alert,
  Snackbar,
  CircularProgress,
  Stack,
  Grid,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Modal, Descriptions, Tag as AntTag, Row, Col, Typography as AntTypography, Table as AntTable } from 'antd';
import {
  Search as SearchIcon,
  Refresh as ReloadIcon,
  Visibility as EyeIcon,
  AttachMoney as DollarIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { debtService, Debt, DebtSearchParams, DebtStats } from '../../services/debtService';
import { customerService } from '../../services/customerService';
import { useAuth } from '../../contexts/AuthContext';
import Swal from 'sweetalert2';
import dayjs, { Dayjs } from 'dayjs';

export const DebtManagement: React.FC = () => {
  const { user } = useAuth();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'info' | 'warning' | 'error'>('info');

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const [searchText, setSearchText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);

  const [stats, setStats] = useState<DebtStats | null>(null);
  const [activeTab, setActiveTab] = useState<'dealer' | 'customers'>('dealer');
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [customerMap, setCustomerMap] = useState<Record<string, {name: string; email?: string; phone?: string}>>({});

  const statusOptions = [
    { value: 'active', label: 'Đang nợ', color: 'warning' },
    { value: 'partial', label: 'Trả một phần', color: 'info' },
    { value: 'paid', label: 'Đã trả', color: 'success' },
    { value: 'overdue', label: 'Quá hạn', color: 'error' },
    { value: 'cancelled', label: 'Đã hủy', color: 'default' },
  ];

  const debtorTypeOptions = [
    { value: 'customer', label: 'Khách hàng' },
    { value: 'manufacturer', label: 'Nhà sản xuất' },
    { value: 'dealer', label: 'Đại lý' },
  ];

  const loadDebts = useCallback(async (searchParams?: DebtSearchParams) => {
    try {
      setLoading(true);
      setError(null);

      const params: DebtSearchParams = {
        page: searchParams?.page || pagination.current,
        limit: searchParams?.limit || pagination.pageSize,
        q: searchParams?.q || searchText || undefined,
        status: searchParams?.status || selectedStatus || undefined,
        start_date: searchParams?.start_date || startDate?.format('YYYY-MM-DD'),
        end_date: searchParams?.end_date || endDate?.format('YYYY-MM-DD'),
      };

      let response;
      console.log('Loading debts for tab:', activeTab, 'with params:', params);
      
      switch (activeTab) {
        case 'customers':
          console.log('Calling getCustomerDebtsOfDealer API');
          response = await debtService.getCustomerDebtsOfDealer(params);
          break;
        case 'dealer':
        default:
          console.log('Calling getDealerManufacturerDebts API');
          response = await debtService.getDealerManufacturerDebts(params);
          break;
      }
      
      console.log('Debts API Response:', response);
      
      if (response.success) {
        const newDebts = response.data?.data || [];
        setDebts(newDebts);
        // Update pagination from response data
        setPagination(prev => ({
          ...prev,
          current: response.data?.pagination?.page || 1,
          pageSize: response.data?.pagination?.limit || 10,
          total: response.data?.pagination?.total || 0,
        }));

        // Prefetch customer info for rows (when tab = customers)
        if (activeTab === 'customers' && newDebts.length > 0) {
          const ids = Array.from(new Set(
            newDebts
              .map((d: any) => d?.customer_id && typeof d.customer_id !== 'object' ? String(d.customer_id) : null)
              .filter(Boolean) as string[]
          ));
          if (ids.length > 0) {
            try {
              const results = await Promise.allSettled(ids.map(id => customerService.getCustomerById(id)));
              const map: Record<string, {name: string; email?: string; phone?: string}> = {};
              results.forEach((r, idx) => {
                if (r.status === 'fulfilled' && r.value) {
                  const c = r.value as any;
                  map[ids[idx]] = {name: c.name, email: c.email, phone: c.phone};
                }
              });
              setCustomerMap(prev => ({...prev, ...map}));
            } catch {}
          }
        }
      } else {
        setError(response.message || 'Có lỗi xảy ra khi tải dữ liệu công nợ');
      }
    } catch (error: any) {
      console.error('Error loading debts:', error);
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi tải dữ liệu công nợ');
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, searchText, selectedStatus, startDate, endDate, activeTab]);

  const loadStats = useCallback(async () => {
    try {
      // Calculate stats from current debts data
      const totalDebt = debts.reduce((sum, debt: any) => sum + toNumber(debt.total_amount, 0), 0);
      const totalPaid = debts.reduce((sum, debt) => sum + getPaidAmount(debt), 0);
      const totalRemaining = debts.reduce((sum, debt: any) => sum + toNumber(debt.remaining_amount, 0), 0);
      const overdueCount = debts.filter(debt => debt.status === 'overdue').length;
      
      setStats({
        total_debt: totalDebt,
        total_paid: totalPaid,
        total_remaining: totalRemaining,
        overdue_count: overdueCount,
        active_count: debts.filter(debt => debt.status === 'active').length,
        paid_count: debts.filter(debt => debt.status === 'paid').length,
        customer_debt: 0,
        manufacturer_debt: 0,
      });
    } catch (error) {
      console.error('Error loading debt stats:', error);
    }
  }, [debts]);

  useEffect(() => {
    loadDebts();
  }, [loadDebts]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Load debts when activeTab changes
  useEffect(() => {
    setPagination(prev => ({ ...prev, current: 1 }));
    loadDebts({ page: 1, limit: pagination.pageSize });
  }, [activeTab]);

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, current: 1 }));
    loadDebts({
      page: 1,
      limit: pagination.pageSize,
      q: searchText || undefined,
      status: selectedStatus || undefined,
      start_date: startDate?.format('YYYY-MM-DD'),
      end_date: endDate?.format('YYYY-MM-DD'),
    });
  };

  const handleReset = () => {
    setSearchText('');
    setSelectedStatus('');
    setStartDate(null);
    setEndDate(null);
    setPagination(prev => ({ ...prev, current: 1 }));
    loadDebts({ page: 1, limit: pagination.pageSize });
  };

  const handlePageChange = (_event: unknown, newPage: number) => {
    const newCurrent = newPage + 1;
    setPagination(prev => ({ ...prev, current: newCurrent }));
    loadDebts({
      page: newCurrent,
      limit: pagination.pageSize,
      q: searchText || undefined,
      status: selectedStatus || undefined,
      start_date: startDate?.format('YYYY-MM-DD'),
      end_date: endDate?.format('YYYY-MM-DD'),
    });
  };

  const handleViewDebt = async (debt: Debt) => {
    setSelectedDebt(debt);
    setDetailModalOpen(true);
    setSelectedCustomer(null);
    try {
      if (activeTab === 'customers') {
        const cid: any = debt.customer_id as any;
        const id = (cid && typeof cid === 'object' ? cid._id : cid) || (debt as any).debtor_id;
        if (id) {
          const customer = await customerService.getCustomerById(id);
          setSelectedCustomer(customer);
        }
      }
    } catch (e) {
      // ignore
    }
  };

  const getStatusChip = (status: string) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    if (!statusOption) return <Chip label={status} size="small" />;
    
    return (
      <Chip
        label={statusOption.label}
        size="small"
        color={statusOption.color as any}
        variant="outlined"
      />
    );
  };

  const getDebtorTypeChip = (type: string) => {
    const typeOption = debtorTypeOptions.find(opt => opt.value === type);
    if (!typeOption) return <Chip label={type} size="small" />;
    
    return (
      <Chip
        label={typeOption.label}
        size="small"
        color="primary"
        variant="outlined"
      />
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return dayjs(dateString).format('DD/MM/YYYY');
  };

  const toNumber = (value: any, fallback = 0): number => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  };

  const getRemainingAmount = (debt: Debt): number => {
    const remaining = (debt as any).remaining_amount;
    if (remaining === undefined || remaining === null) return 0;
    return toNumber(remaining, 0);
  };

  const getPaidAmount = (debt: Debt): number => {
    const paid = (debt as any).paid_amount;
    if (paid !== undefined && paid !== null) return toNumber(paid, 0);
    // Fallback: total - remaining
    const total = toNumber((debt as any).total_amount, 0);
    const remaining = getRemainingAmount(debt);
    const calc = total - remaining;
    return calc > 0 ? calc : 0;
  };

  const getProgressPercentage = (paid: number, total: number) => {
    const p = toNumber(paid, 0);
    const t = toNumber(total, 0);
    if (t <= 0) return 0;
    return Math.round((p / t) * 100);
  };

  // ===== Helpers: hiển thị thông tin KH kể cả khi backend không populate đầy đủ =====
  const getCustomerName = (debt: Debt) => {
    const cid: any = debt.customer_id as any;
    if (cid && typeof cid === 'object') {
      return cid.full_name || cid.name || 'N/A';
    }
    if (cid && typeof cid !== 'object' && customerMap[String(cid)]) {
      return customerMap[String(cid)].name || 'N/A';
    }
    return debt.debtor_name || 'N/A';
  };

  const getCustomerEmail = (debt: Debt) => {
    const cid: any = debt.customer_id as any;
    if (cid && typeof cid === 'object') {
      return cid.email || '';
    }
    if (cid && typeof cid !== 'object' && customerMap[String(cid)]) {
      return customerMap[String(cid)].email || '';
    }
    return debt.debtor_email || '';
  };

  const getCustomerPhone = (debt: Debt) => {
    const cid: any = debt.customer_id as any;
    if (cid && typeof cid === 'object') {
      return cid.phone || '';
    }
    if (cid && typeof cid !== 'object' && customerMap[String(cid)]) {
      return customerMap[String(cid)].phone || '';
    }
    return debt.debtor_phone || '';
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Quản lý công nợ
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Quản lý công nợ cho đại lý, khách hàng và nhà sản xuất
        </Typography>

        {/* Debt Type Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('dealer')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'dealer'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Đại lý nợ hãng
              </button>
              <button
                onClick={() => setActiveTab('customers')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'customers'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Khách hàng nợ đại lý
              </button>
            </nav>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
              <DollarIcon className="text-blue-500 text-4xl mb-2 mx-auto" />
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(stats.total_debt)}
              </div>
              <div className="text-sm text-gray-600">
                Tổng công nợ
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
              <CheckCircleOutlineIcon className="text-green-500 text-4xl mb-2 mx-auto" />
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.total_paid)}
              </div>
              <div className="text-sm text-gray-600">
                Đã thanh toán
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
              <TrendingDownIcon className="text-orange-500 text-4xl mb-2 mx-auto" />
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(stats.total_remaining)}
              </div>
              <div className="text-sm text-gray-600">
                Còn lại
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
              <AccessTimeIcon className="text-red-500 text-4xl mb-2 mx-auto" />
              <div className="text-2xl font-bold text-red-600">
                {stats.overdue_count}
              </div>
              <div className="text-sm text-gray-600">
                Quá hạn
              </div>
            </div>
          </div>
        )}

        {/* Search and Filter */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
          <div className="grid grid-cols-1 md:grid-cols-10 gap-4 items-end">
            {/* Search Input */}
            <div className="md:col-span-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên, email, SĐT..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="md:col-span-2">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Tất cả trạng thái</option>
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* From Date */}
            <div className="md:col-span-2">
              <input
                type="date"
                value={startDate?.format('YYYY-MM-DD') || ''}
                onChange={(e) => setStartDate(e.target.value ? dayjs(e.target.value) : null)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            {/* To Date */}
            <div className="md:col-span-2">
              <input
                type="date"
                value={endDate?.format('YYYY-MM-DD') || ''}
                onChange={(e) => setEndDate(e.target.value ? dayjs(e.target.value) : null)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            {/* Action Buttons */}
            <div className="md:col-span-1">
              <div className="flex space-x-2">
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <SearchIcon className="h-4 w-4 mr-1" />
                  Tìm
                </button>
                <button
                  onClick={handleReset}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Danh sách công nợ ({pagination.total})
          </h3>
          
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    onClick={() => setError(null)}
                    className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
                  >
                    <span className="sr-only">Dismiss</span>
                    <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Debts Table */}
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Người nợ</TableCell>
                  <TableCell>Loại</TableCell>
                  <TableCell align="right">Tổng tiền</TableCell>
                  <TableCell align="right">Đã trả</TableCell>
                  <TableCell align="right">Còn lại</TableCell>
                  <TableCell align="center">Tiến độ</TableCell>
                  <TableCell align="center">Trạng thái</TableCell>
                  <TableCell>Hạn thanh toán</TableCell>
                  <TableCell>Ngày tạo</TableCell>
                  <TableCell align="center">Hành động</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : debts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                      <Typography variant="body1" color="text.secondary">
                        Không có dữ liệu công nợ
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  debts.map((debt) => (
                    <TableRow key={debt._id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {activeTab === 'customers' 
                              ? getCustomerName(debt)
                              : (debt.manufacturer_id?.name || debt.debtor_name || 'N/A')
                            }
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {debt._id}
                          </Typography>
                          {activeTab === 'customers' && getCustomerEmail(debt) && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              {getCustomerEmail(debt)}
                            </Typography>
                          )}
                          {activeTab === 'customers' && getCustomerPhone(debt) && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              {getCustomerPhone(debt)}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={
                            activeTab === 'dealer' ? 'Nhà sản xuất' :
                            activeTab === 'customers' ? 'Khách hàng' :
                            'Nhà sản xuất'
                          }
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="bold">
                          {formatCurrency(debt.total_amount)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="success.main">
                          {formatCurrency(getPaidAmount(debt))}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="warning.main" fontWeight="bold">
                          {formatCurrency(debt.remaining_amount)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 60, bgcolor: 'grey.200', borderRadius: 1, height: 8 }}>
                            <Box
                              sx={{
                                width: `${getProgressPercentage(getPaidAmount(debt), toNumber((debt as any).total_amount, 0))}%`,
                                bgcolor: debt.remaining_amount === 0 ? 'success.main' : 'primary.main',
                                height: '100%',
                                borderRadius: 1,
                              }}
                            />
                          </Box>
                          <Typography variant="caption">
                            {getProgressPercentage(getPaidAmount(debt), toNumber((debt as any).total_amount, 0))}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">{getStatusChip(debt.status)}</TableCell>
                      <TableCell>
                        {debt.due_date ? formatDate(debt.due_date) : '-'}
                      </TableCell>
                      <TableCell>{formatDate(debt.createdAt)}</TableCell>
                      <TableCell align="center">
                        <Tooltip title="Xem chi tiết">
                          <IconButton onClick={() => handleViewDebt(debt)} size="small">
                            <EyeIcon fontSize="inherit" color="primary" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        {/* Snackbar */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={4000}
          onClose={() => setSnackbarOpen(false)}
          message={snackbarMessage}
        />

        {/* Debt Detail Modal */}
        {selectedDebt && (
          <Modal
            title={
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 mb-0">
                  Chi tiết công nợ
                </h3>
                <button
                  onClick={() => setDetailModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            }
            open={detailModalOpen}
            onCancel={() => setDetailModalOpen(false)}
            closable={false}
            width={1200}
            footer={[
              <Button key="close" onClick={() => setDetailModalOpen(false)}>
                Đóng
              </Button>
            ]}
            className="debt-detail-modal"
          >

            <div className="max-h-[600px] overflow-y-auto" style={{ padding: '0 16px 0 8px' }}>
              <Row gutter={[24, 24]}>
                {/* Debt Information */}
                <Col xs={24} lg={24}>
                  <div className="mb-6">
                    <AntTypography.Title level={5}>Thông tin công nợ</AntTypography.Title>
                    <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
                      <Descriptions.Item label="ID">
                        <span className="font-mono text-blue-600">{selectedDebt._id}</span>
                      </Descriptions.Item>
                      <Descriptions.Item label="Trạng thái">
                        {getStatusChip(selectedDebt.status)}
                      </Descriptions.Item>
                      <Descriptions.Item label="Tổng tiền">
                        <span className="font-medium text-red-600">
                          {formatCurrency(selectedDebt.total_amount)}
                        </span>
                      </Descriptions.Item>
                      <Descriptions.Item label="Đã trả">
                        <span className="font-medium text-green-600">
                          {formatCurrency(getPaidAmount(selectedDebt))}
                        </span>
                      </Descriptions.Item>
                      <Descriptions.Item label="Còn lại">
                        <span className="font-medium text-orange-600">
                          {formatCurrency(getRemainingAmount(selectedDebt))}
                        </span>
                      </Descriptions.Item>
                      <Descriptions.Item label="Ngày tạo">
                        {formatDate(selectedDebt.createdAt)}
                      </Descriptions.Item>
                      {selectedDebt.due_date && (
                        <Descriptions.Item label="Hạn thanh toán">
                          {formatDate(selectedDebt.due_date)}
                        </Descriptions.Item>
                      )}
                      {selectedDebt.description && (
                        <Descriptions.Item label="Mô tả" span={2}>
                          {selectedDebt.description}
                        </Descriptions.Item>
                      )}
                    </Descriptions>
                  </div>

                  {/* Debt Items */}
                  {selectedDebt.items && selectedDebt.items.length > 0 && (
                    <div className="mb-6">
                      <AntTypography.Title level={5}>Chi tiết sản phẩm</AntTypography.Title>
                      <div style={{ marginRight: '16px' }}>
                        <AntTable
                        columns={[
                          {
                            title: 'Sản phẩm',
                            dataIndex: 'vehicle_name',
                            key: 'vehicle_name',
                            render: (text: string) => (
                              <span className="font-medium">{text}</span>
                            )
                          },
                          {
                            title: 'Màu',
                            dataIndex: 'color',
                            key: 'color',
                            render: (color: string) => (
                              <AntTag color="blue">{color}</AntTag>
                            )
                          },
                          {
                            title: 'Đơn giá',
                            dataIndex: 'unit_price',
                            key: 'unit_price',
                            align: 'right' as const,
                            render: (price: number) => formatCurrency(price)
                          },
                          {
                            title: 'Số lượng',
                            dataIndex: 'quantity',
                            key: 'quantity',
                            align: 'center' as const,
                            render: (quantity: number) => (
                              <span className="font-medium">{quantity}</span>
                            )
                          },
                          {
                            title: 'Thành tiền',
                            dataIndex: 'amount',
                            key: 'amount',
                            align: 'right' as const,
                            render: (amount: number) => (
                              <span className="font-medium text-green-600">
                                {formatCurrency(amount)}
                              </span>
                            )
                          },
                          {
                            title: 'Ngày giao',
                            dataIndex: 'delivered_at',
                            key: 'delivered_at',
                            render: (date: string) => formatDate(date)
                          }
                        ]}
                        dataSource={selectedDebt.items}
                        rowKey="_id"
                        pagination={false}
                        size="small"
                        scroll={{ x: 600 }}
                        summary={(pageData: readonly any[]) => {
                          const total = pageData.reduce((sum: number, item: any) => sum + item.amount, 0);
                          return (
                            <AntTable.Summary.Row>
                              <AntTable.Summary.Cell index={0} colSpan={4}>
                                <span className="font-bold">Tổng cộng:</span>
                              </AntTable.Summary.Cell>
                              <AntTable.Summary.Cell index={4}>
                                <span className="font-bold text-green-600">
                                  {formatCurrency(total)}
                                </span>
                              </AntTable.Summary.Cell>
                              <AntTable.Summary.Cell index={5}></AntTable.Summary.Cell>
                            </AntTable.Summary.Row>
                          );
                        }}
                      />
                      </div>
                    </div>
                  )}

                  {/* Payment History - Moved below Product Details */}
                  {selectedDebt.payments && selectedDebt.payments.length > 0 && (
                    <div>
                      <AntTypography.Title level={5}>Lịch sử thanh toán</AntTypography.Title>
                      <div style={{ marginRight: '16px' }}>
                        <AntTable
                        columns={[
                          {
                            title: 'Số tiền',
                            dataIndex: 'amount',
                            key: 'amount',
                            align: 'right' as const,
                            render: (amount: number) => (
                              <span className="font-medium text-green-600">
                                {formatCurrency(amount)}
                              </span>
                            )
                          },
                          {
                            title: 'Phương thức',
                            dataIndex: 'method',
                            key: 'method',
                            render: (method: string) => (
                              <AntTag color="blue">{method}</AntTag>
                            )
                          },
                          {
                            title: 'Ngày thanh toán',
                            dataIndex: 'paid_at',
                            key: 'paid_at',
                            render: (date: string) => formatDate(date)
                          },
                          {
                            title: 'Ghi chú',
                            dataIndex: 'note',
                            key: 'note',
                            ellipsis: true
                          }
                        ]}
                        dataSource={selectedDebt.payments}
                        rowKey="_id"
                        pagination={false}
                        size="small"
                        scroll={{ x: 600 }}
                        summary={(pageData: readonly any[]) => {
                          const total = pageData.reduce((sum: number, payment: any) => sum + payment.amount, 0);
                          return (
                            <AntTable.Summary.Row>
                              <AntTable.Summary.Cell index={0} align="right">
                                <span className="font-bold text-green-600">
                                  {formatCurrency(total)}
                                </span>
                              </AntTable.Summary.Cell>
                              <AntTable.Summary.Cell index={1} colSpan={3}>
                                <span className="font-bold">Tổng đã trả:</span>
                              </AntTable.Summary.Cell>
                            </AntTable.Summary.Row>
                          );
                        }}
                      />
                      </div>
                    </div>
                  )}
                </Col>

                {/* Partner Information */}
                <Col xs={24} lg={8}>
                  <div className="mb-6">
                    {/* <AntTypography.Title level={5}>Thông tin đối tác</AntTypography.Title> */}
                    <Descriptions column={1} size="small">
                      {activeTab === 'customers' && (selectedDebt.customer_id || selectedCustomer) && (
                        <>
                          <Descriptions.Item label="Khách hàng">
                            {selectedCustomer?.name || getCustomerName(selectedDebt)}
                          </Descriptions.Item>
                          {(selectedCustomer?.email || getCustomerEmail(selectedDebt)) && (
                            <Descriptions.Item label="Email">
                              {selectedCustomer?.email || getCustomerEmail(selectedDebt)}
                            </Descriptions.Item>
                          )}
                          {(selectedCustomer?.phone || getCustomerPhone(selectedDebt)) && (
                            <Descriptions.Item label="Số điện thoại">
                              {selectedCustomer?.phone || getCustomerPhone(selectedDebt)}
                            </Descriptions.Item>
                          )}
                        </>
                      )}
                      {/* <Descriptions.Item label="Đại lý ID">
                        <span className="font-mono text-blue-600">
                          {typeof selectedDebt.dealership_id === 'object' ? selectedDebt.dealership_id._id : selectedDebt.dealership_id}
                        </span>
                      </Descriptions.Item> */}
                    </Descriptions>
                  </div>
                </Col>
              </Row>
            </div>
          </Modal>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default DebtManagement;
