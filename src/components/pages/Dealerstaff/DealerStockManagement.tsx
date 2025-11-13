import React, { useState, useEffect, useCallback } from 'react';
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
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';
import { Header } from '../../common/Header';
import { Sidebar } from '../../common/Sidebar';
import { stockService, VehicleStock, VehicleStockParams } from '../../../services/stockService';

export const DealerStockManagement: React.FC = () => {
  const { user } = useAuth();
  const [stocks, setStocks] = useState<VehicleStock[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'info' | 'warning' | 'error'>('info');
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const [filters, setFilters] = useState<VehicleStockParams>({
    category: undefined,
    color: undefined,
    status: undefined,
    manufacturer_id: undefined,
    page: 1,
    limit: 10,
  });

  const [searchText, setSearchText] = useState('');
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<VehicleStock | null>(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('dealer-stock');

  const showSnackbar = (message: string, severity: 'success' | 'info' | 'warning' | 'error' = 'info') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const loadStocks = useCallback(async (params?: VehicleStockParams) => {
    console.log('🔍 Loading dealer stocks with params:', params);
    setLoading(true);
    setError(null);

    try {
      const searchParams: VehicleStockParams = {
        page: 1,
        limit: 10,
        ...params,
      };

      // Remove undefined values
      Object.keys(searchParams).forEach(key => {
        if (searchParams[key as keyof VehicleStockParams] === undefined) {
          delete searchParams[key as keyof VehicleStockParams];
        }
      });

      console.log('📋 API params being sent:', searchParams);

      const response = await stockService.getMyStock(searchParams);
      console.log('✅ API response received:', response);

      if (response && response.success && response.data) {
        setStocks(response.data.data || []);
        setPagination({
          page: response.data.pagination.page || 1,
          limit: response.data.pagination.limit || 10,
          total: response.data.pagination.total || 0,
          totalPages: response.data.pagination.totalPages || 0,
        });
        showSnackbar(`Đã tải ${response.data.data?.length || 0} sản phẩm`, 'success');
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err: any) {
      console.error('❌ Error loading dealer stocks:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Lỗi kết nối API';
      setError(errorMessage);
      setStocks([]);
      showSnackbar(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStocks({ page: 1, limit: 10 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = () => {
    const newFilters: VehicleStockParams = {
      ...filters,
      page: 1,
    };
    
    // If searchText looks like a vehicle ID, use it as vehicle_id filter
    if (searchText.trim()) {
      // Try to use as vehicle_id if it's a valid ID format (MongoDB ObjectId)
      if (/^[0-9a-fA-F]{24}$/.test(searchText.trim())) {
        newFilters.vehicle_id = searchText.trim();
      }
    } else {
      newFilters.vehicle_id = undefined;
    }
    
    setFilters(newFilters);
    loadStocks(newFilters);
  };

  const handleFilterChange = (key: keyof VehicleStockParams, value: any) => {
    const newFilters: VehicleStockParams = {
      ...filters,
      [key]: value || undefined,
      page: 1,
    };
    setFilters(newFilters);
    loadStocks(newFilters);
  };

  const handlePageChange = (_event: unknown, newPage: number) => {
    const newPageNum = newPage + 1;
    const newFilters: VehicleStockParams = {
      ...filters,
      page: newPageNum,
    };
    setFilters(newFilters);
    loadStocks(newFilters);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newLimit = parseInt(event.target.value, 10);
    const newFilters: VehicleStockParams = {
      ...filters,
      limit: newLimit,
      page: 1,
    };
    setFilters(newFilters);
    loadStocks(newFilters);
  };

  const handleViewDetails = (stock: VehicleStock) => {
    setSelectedStock(stock);
    setDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setDetailModalOpen(false);
    setSelectedStock(null);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const getStockStatusColor = (remaining: number, total: number) => {
    const percentage = total > 0 ? (remaining / total) * 100 : 0;
    if (percentage > 50) return 'success';
    if (percentage > 20) return 'warning';
    return 'error';
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <Header 
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        isSidebarOpen={sidebarOpen}
      />
      <Sidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpen={() => setSidebarOpen(true)}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8,
          ml: { lg: sidebarOpen ? '240px' : '16px', xs: 0 },
          transition: 'margin-left 0.2s',
        }}
      >
        <Card sx={{ p: 3, mb: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
              <InventoryIcon sx={{ fontSize: 32 }} />
              Quản lý tồn kho
            </Typography>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => loadStocks(filters)}
              disabled={loading}
            >
              Làm mới
            </Button>
          </Stack>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Filters */}
          <Card sx={{ p: 2, mb: 3, backgroundColor: '#fafafa' }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Tìm kiếm"
                  variant="outlined"
                  size="small"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Tìm theo tên, SKU, màu sắc..."
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              </Grid>
              {/* <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Loại xe</InputLabel>
                  <Select
                    value={filters.category || ''}
                    label="Loại xe"
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                  >
                    <MenuItem value="">Tất cả</MenuItem>
                    <MenuItem value="car">Ô tô</MenuItem>
                    <MenuItem value="motorbike">Xe máy</MenuItem>
                  </Select>
                </FormControl>
              </Grid> */}
              {/* <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Màu sắc</InputLabel>
                  <Select
                    value={filters.color || ''}
                    label="Màu sắc"
                    onChange={(e) => handleFilterChange('color', e.target.value)}
                  >
                    <MenuItem value="">Tất cả</MenuItem>
                    <MenuItem value="Đỏ">Đỏ</MenuItem>
                    <MenuItem value="Xanh">Xanh</MenuItem>
                    <MenuItem value="Trắng">Trắng</MenuItem>
                    <MenuItem value="Đen">Đen</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Trạng thái</InputLabel>
                  <Select
                    value={filters.status || ''}
                    label="Trạng thái"
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <MenuItem value="">Tất cả</MenuItem>
                    <MenuItem value="active">Đang có</MenuItem>
                    <MenuItem value="depleted">Hết hàng</MenuItem>
                    <MenuItem value="reserved">Đã đặt</MenuItem>
                  </Select>
                </FormControl>
              </Grid> */}
              <Grid item xs={12} sm={6} md={2}>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="contained"
                    startIcon={<SearchIcon />}
                    onClick={handleSearch}
                    sx={{ 
                      minWidth: '100px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    TÌM KIẾM
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      const resetFilters: VehicleStockParams = {
                        category: undefined,
                        color: undefined,
                        status: undefined,
                        manufacturer_id: undefined,
                        vehicle_id: undefined,
                        page: 1,
                        limit: 10,
                      };
                      setFilters(resetFilters);
                      setSearchText('');
                      loadStocks(resetFilters);
                    }}
                    sx={{ 
                      minWidth: '90px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    RESET
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </Card>

          {/* Table */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>STT</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Tên xe</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Mã hàng</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Hãng sản xuất</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Giá</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="center">Tổng số lượng</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="center">Đã bán</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="center">Còn lại</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="center">Số lô</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="center">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : stocks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        Không có dữ liệu
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  stocks.map((stock, index) => (
                    <TableRow key={stock.vehicle.id} hover>
                      <TableCell>{(pagination.page - 1) * pagination.limit + index + 1}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {stock.vehicle.name}
                        </Typography>
                        {stock.vehicle.model && (
                          <Typography variant="caption" color="text.secondary">
                            {stock.vehicle.model}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {stock.vehicle.sku}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {stock.vehicle.manufacturer?.name || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium" color="primary">
                          {formatPrice(stock.vehicle.price)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">
                          {stock.summary.total_quantity}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={stock.summary.total_sold}
                          size="small"
                          color="default"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={stock.summary.total_remaining}
                          size="small"
                          color={getStockStatusColor(
                            stock.summary.total_remaining,
                            stock.summary.total_quantity
                          ) as any}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">
                          {stock.summary.batches_count}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Xem chi tiết">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleViewDetails(stock)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <TablePagination
            component="div"
            count={pagination.total}
            page={pagination.page - 1}
            onPageChange={handlePageChange}
            rowsPerPage={pagination.limit}
            onRowsPerPageChange={handleRowsPerPageChange}
            rowsPerPageOptions={[5, 10, 25, 50]}
            labelRowsPerPage="Số hàng mỗi trang:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} trong tổng ${count !== -1 ? count : `nhiều hơn ${to}`}`
            }
          />
        </Card>

        {/* Detail Modal */}
        <Dialog
          open={detailModalOpen}
          onClose={handleCloseDetailModal}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Stack direction="row" alignItems="center" spacing={1}>
              <InventoryIcon />
              <Typography variant="h6">
                Chi tiết tồn kho: {selectedStock?.vehicle.name}
              </Typography>
            </Stack>
          </DialogTitle>
          <DialogContent>
            {selectedStock && (
              <Stack spacing={3}>
                {/* Vehicle Info */}
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Thông tin xe
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Tên xe:
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {selectedStock.vehicle.name}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Mã hàng:
                      </Typography>
                      <Typography variant="body1">
                        {selectedStock.vehicle.sku}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Hãng sản xuất:
                      </Typography>
                      <Typography variant="body1">
                        {selectedStock.vehicle.manufacturer?.name || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Giá:
                      </Typography>
                      <Typography variant="body1" fontWeight="medium" color="primary">
                        {formatPrice(selectedStock.vehicle.price)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>

                {/* Summary */}
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Tổng quan
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={3}>
                      <Card sx={{ p: 2, textAlign: 'center', backgroundColor: '#f5f5f5' }}>
                        <Typography variant="h6" color="primary">
                          {selectedStock.summary.total_quantity}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Tổng số lượng
                        </Typography>
                      </Card>
                    </Grid>
                    <Grid item xs={3}>
                      <Card sx={{ p: 2, textAlign: 'center', backgroundColor: '#f5f5f5' }}>
                        <Typography variant="h6" color="error">
                          {selectedStock.summary.total_sold}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Đã bán
                        </Typography>
                      </Card>
                    </Grid>
                    <Grid item xs={3}>
                      <Card sx={{ p: 2, textAlign: 'center', backgroundColor: '#f5f5f5' }}>
                        <Typography variant="h6" color="success.main">
                          {selectedStock.summary.total_remaining}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Còn lại
                        </Typography>
                      </Card>
                    </Grid>
                    <Grid item xs={3}>
                      <Card sx={{ p: 2, textAlign: 'center', backgroundColor: '#f5f5f5' }}>
                        <Typography variant="h6">
                          {selectedStock.summary.batches_count}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Số lô
                        </Typography>
                      </Card>
                    </Grid>
                  </Grid>
                </Box>

                {/* Stocks by Color */}
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Tồn kho theo màu
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>Màu sắc</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 'bold' }}>Tổng số lượng</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 'bold' }}>Đã bán</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 'bold' }}>Còn lại</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedStock.stocks_by_color.map((colorStock, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Chip
                                label={colorStock.color}
                                size="small"
                                sx={{
                                  backgroundColor: (theme) => {
                                    const colorMap: Record<string, string> = {
                                      'đỏ': '#f44336',
                                      'xanh': '#2196f3',
                                      'trắng': '#ffffff',
                                      'đen': '#212121',
                                    };
                                    return colorMap[colorStock.color.toLowerCase()] || theme.palette.grey[300];
                                  },
                                  color: (theme) => {
                                    const lightColors = ['trắng', 'white'];
                                    return lightColors.includes(colorStock.color.toLowerCase())
                                      ? theme.palette.text.primary
                                      : 'white';
                                  },
                                  fontWeight: 'medium',
                                  border: (theme) => {
                                    const lightColors = ['trắng', 'white'];
                                    return lightColors.includes(colorStock.color.toLowerCase())
                                      ? `1px solid ${theme.palette.divider}`
                                      : 'none';
                                  },
                                }}
                              />
                            </TableCell>
                            <TableCell align="center">
                              {colorStock.total_quantity}
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={colorStock.total_sold}
                                size="small"
                                color="default"
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={colorStock.total_remaining}
                                size="small"
                                color={getStockStatusColor(
                                  colorStock.total_remaining,
                                  colorStock.total_quantity
                                ) as any}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDetailModal}>Đóng</Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

