import React, { useState, useEffect, useCallback } from 'react';
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
    Chip,
    Pagination,
    CircularProgress,
} from '@mui/material';
import {
    Search as SearchIcon,
    ShoppingCart as ShoppingCartIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import Swal from 'sweetalert2';
// Giả định các services và types đã được import đúng
import { quoteService, Quote, QuoteSearchParams } from '../../services/quoteService'; 
import { QuoteToOrderConverterMUI } from './QuoteToOrderConverterMUI';

interface QuoteToOrderPageProps {}

// No mock data - using real API only
// Giả định quoteService có sẵn

export const QuoteToOrderPageMUI: React.FC<QuoteToOrderPageProps> = () => {
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
    const [showConverter, setShowConverter] = useState(false);

    // Filter states
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Pagination states
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });

    // --- Helper Functions ---

    // Handle successful quote conversion
    const handleConverterSuccess = () => {
        setShowConverter(false);
        setSelectedQuote(null);
        
        // Show success toast notification with SweetAlert2
        Swal.fire({
            icon: 'success',
            title: 'Thành công!',
            text: 'Chuyển đổi báo giá thành đơn hàng thành công!',
            timer: 3000,
            timerProgressBar: true,
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
        });
        
        // Reload data after successful conversion
        fetchQuotes(pagination.current, pagination.pageSize, searchText, statusFilter);
    };
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount);
    };

    const getStatusColor = (status: string) => {
        const statusColors = {
            valid: '#52c41a',      // Green
            expired: '#faad14',    // Orange
            canceled: '#ff4d4f',   // Red
            cancelled: '#ff4d4f',  // Red
            invalid: '#d9d9d9',    // Gray
            used: '#1890ff',       // Blue
            converted: '#1890ff',  // Blue
        };
        return statusColors[status as keyof typeof statusColors] || '#d9d9d9';
    };

    const getStatusText = (status: string) => {
        const statusTexts = {
            valid: 'Còn hiệu lực',
            expired: 'Hết hạn',
            canceled: 'Đã hủy',
            cancelled: 'Đã hủy',
            invalid: 'Không hợp lệ',
            used: 'Đã chuyển đổi',
            converted: 'Đã chuyển đổi',
        };
        return statusTexts[status as keyof typeof statusTexts] || status;
    };
    
    // --- Core Data Fetch Logic ---

     const fetchQuotes = useCallback(async (page: number, limit: number, q: string, status: string) => {
         console.log('🔍 Fetching quotes with params:', { page, limit, q, status });
         setLoading(true);
         
         try {
             const params: QuoteSearchParams = {
                 page,
                 limit,
                 q: q || undefined,
                 // ✅ CHỈ sử dụng status nếu nó có giá trị. Nếu là rỗng (''), gửi undefined.
                 status: status || undefined, 
             };
             
             console.log('📋 API params being sent:', params);
             console.log('🌐 Making API call to quoteService.getQuotes...');

            const response = await quoteService.getQuotes(params);
            console.log('📋 API response received:', response);
            console.log('📋 Response data structure:', {
                success: response?.success,
                data: response?.data,
                dataType: typeof response?.data,
                isArray: Array.isArray(response?.data),
                hasDataProperty: (response?.data as any)?.data ? 'yes' : 'no'
            });
            
            let quotesData: Quote[] = [];
            let paginationData: any = {};
            
            // Xử lý response (Giữ nguyên logic của bạn)
            if (response && response.success !== undefined) {
                if (response.success && response.data) {
                    const responseData = response.data as any;
                    if (responseData.data && Array.isArray(responseData.data)) {
                        quotesData = responseData.data;
                        paginationData = {
                            page: responseData.page || page,
                            total: responseData.totalRecords || responseData.total || 0,
                            limit: responseData.limit || limit,
                        };
                    } else if (Array.isArray(responseData)) {
                        quotesData = responseData;
                    } else {
                        quotesData = [responseData as Quote];
                    }
                } else {
                    throw new Error(response.message || 'Failed to fetch quotes');
                }
            } else if (response && Array.isArray((response as any).data)) {
                const responseData = response as any;
                quotesData = responseData.data;
                paginationData = {
                    page: responseData.page || page,
                    total: responseData.totalRecords || responseData.total || 0,
                    limit: responseData.limit || limit,
                };
            } else {
                throw new Error('Invalid response structure');
            }
            
             // Map customer object
             const processedQuotes = quotesData.map((quote: any) => ({
                 ...quote,
                 customer: quote.customer_id && typeof quote.customer_id === 'object' ? quote.customer_id : quote.customer,
             }));

             console.log('✅ Processed quotes:', processedQuotes);
             console.log('🔍 Raw quotes statuses:', processedQuotes.map(q => ({ id: q._id, status: q.status })));
             console.log('🔍 Filter results:', {
                 statusFilter: status,
                 totalQuotes: processedQuotes.length,
                 statusCounts: {
                     valid: processedQuotes.filter(q => q.status === 'valid').length,
                     cancelled: processedQuotes.filter(q => q.status === 'cancelled').length,
                     canceled: processedQuotes.filter(q => q.status === 'canceled').length,
                     expired: processedQuotes.filter(q => q.status === 'expired').length,
                     converted: processedQuotes.filter(q => q.status === 'converted').length
                 }
             });

             // ✅ CLIENT-SIDE FILTERING: Backend không filter đúng, filter ở frontend
             let filteredQuotes = processedQuotes;
             if (status) {
                 filteredQuotes = processedQuotes.filter(quote => {
                     // Map API status to UI status for comparison
                     let quoteStatus = quote.status;
                     if (quoteStatus === 'cancelled') {
                         quoteStatus = 'canceled'; // Map backend 'cancelled' to UI 'canceled'
                     }
                     return quoteStatus === status;
                 });
                 console.log('🔍 Client-side filtering applied:', {
                     originalCount: processedQuotes.length,
                     filteredCount: filteredQuotes.length,
                     filterStatus: status,
                     filteredQuotes: filteredQuotes.map(q => ({ id: q._id, status: q.status }))
                 });
             }

             console.log('📊 Setting quotes state with:', filteredQuotes.length, 'quotes');
             setQuotes(filteredQuotes);
            setPagination(prev => ({
                ...prev,
                current: paginationData.page || page,
                total: filteredQuotes.length, // Use filtered count instead of total from API
            }));
            
         } catch (error: any) {
             console.error('❌ Error fetching quotes:', error);
             console.error('❌ Error details:', {
                 message: error?.message,
                 response: error?.response?.data,
                 status: error?.response?.status
             });
             
             // Show empty state when API fails
             setQuotes([]);
             setPagination(prev => ({ ...prev, total: 0 }));
         } finally {
             setLoading(false);
         }
    }, []);

    // --- Initial Load ---
    useEffect(() => {
        // Tải dữ liệu ban đầu
        fetchQuotes(pagination.current, pagination.pageSize, searchText, statusFilter);
    }, [fetchQuotes]);

    // --- Handle Functions ---

     // Xử lý thay đổi status. CẬP NHẬT STATE VÀ GỌI API.
     const handleStatusFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
         const newValue = event.target.value;
         console.log('🔄 Status filter changing:', { from: statusFilter, to: newValue });
         
         // Map UI values to API values
         let apiStatus = newValue;
         if (newValue === 'canceled') {
             apiStatus = 'cancelled'; // Backend uses 'cancelled' with double 'l'
         }
         
         console.log('🔄 Mapped status for API:', { uiStatus: newValue, apiStatus });
         
         setStatusFilter(newValue);
         setPagination(prev => ({ ...prev, current: 1 }));
         
         // Gọi API ngay lập tức khi filter thay đổi
         fetchQuotes(1, pagination.pageSize, searchText, apiStatus);
     };

    // Gọi tìm kiếm khi người dùng nhấn nút hoặc Enter
    const handleSearch = () => {
        setPagination(prev => ({ ...prev, current: 1 }));
        // ✅ Gọi fetchQuotes với giá trị state hiện tại
        fetchQuotes(1, pagination.pageSize, searchText, statusFilter);
    };
    
    // Reset Filters
    const handleReset = () => {
        setSearchText('');
        setStatusFilter('');
        setPagination(prev => ({ ...prev, current: 1 }));
        // Gọi lại fetchQuotes với giá trị rỗng
        fetchQuotes(1, pagination.pageSize, '', ''); 
    };

    // Xử lý phân trang
    const handlePaginationChange = (_event: React.ChangeEvent<unknown>, page: number) => {
        setPagination(prev => ({ ...prev, current: page }));
        // Giữ nguyên các bộ lọc hiện tại
        fetchQuotes(page, pagination.pageSize, searchText, statusFilter);
    };

    const handleConvertQuote = (quote: Quote) => {
        setSelectedQuote(quote);
        setShowConverter(true);
    };

    return (
        <Box sx={{ p: 3, bgcolor: 'grey.50', minHeight: '100vh' }}>
            <Card>
                <CardContent>
                    <Box sx={{ mb: 3 }}>
                        <Box display="flex" alignItems="center" gap={1} mb={3}>
                            <ShoppingCartIcon color="primary" sx={{ fontSize: 32 }} />
                            <Typography variant="h4" component="h1" fontWeight="bold">
                                Chuyển đổi báo giá thành đơn hàng
                            </Typography>
                        </Box>
                        
                        {/* --- Filter Section --- */}
                        <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={2} alignItems="center">
                            
                             {/* Search Box */}
                             <Box flex={1} minWidth={{ xs: 200, md: 300 }}>
                                 <div className="relative">
                                     <label htmlFor="search-input" className="block text-sm font-semibold text-gray-700 mb-2">
                                         Tìm kiếm
                                     </label>
                                     <div className="relative">
                                         <input
                                             id="search-input"
                                             type="text"
                                             placeholder="Tìm kiếm theo mã, tên khách hàng..."
                                             value={searchText}
                                             onChange={(e) => setSearchText(e.target.value)}
                                             onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                             className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium transition-all duration-200 hover:border-gray-300"
                                         />
                                         <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                             <SearchIcon className="w-5 h-5 text-gray-400" />
                                         </div>
                                     </div>
                                 </div>
                             </Box>
                            
                             {/* Status Filter Dropdown */}
                             <Box minWidth={200}>
                                 <div className="relative">
                                     <label htmlFor="status-filter" className="block text-sm font-semibold text-gray-700 mb-2">
                                         Lọc theo trạng thái
                                     </label>
                                     <div className="relative">
                                         <select
                                             id="status-filter"
                                             value={statusFilter}
                                             onChange={handleStatusFilterChange}
                                             className="w-full px-4 py-3 pr-10 border-2 border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium transition-all duration-200 hover:border-gray-300 appearance-none cursor-pointer"
                                         >
                                             <option value="">Tất cả</option>
                                             <option value="valid">Còn hiệu lực</option>
                                             <option value="expired">Hết hạn</option>
                                             <option value="canceled">Đã hủy</option>
                                             <option value="invalid">Không hợp lệ</option>
                                             <option value="used">Đã sử dụng</option>
                                             <option value="converted">Đã chuyển đổi</option>
                                         </select>
                                         {/* Custom dropdown arrow */}
                                         <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                             <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                             </svg>
                                         </div>
                                     </div>
                                 </div>
                             </Box>
                            
                            {/* Action Buttons */}
                            <Box display="flex" gap={2} className="mt-6">
                                <button
                                    onClick={handleSearch}
                                    disabled={loading}
                                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <SearchIcon className="w-5 h-5" />
                                    Tìm kiếm
                                </button>
                                {/* <button
                                    onClick={handleReset}
                                    disabled={loading}
                                    className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <RefreshIcon className="w-5 h-5" />
                                    Reset
                                </button> */}
                            </Box>
                        </Box>
                        {/* --- End Filter Section --- */}
                    </Box>

                    {loading ? (
                        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                            <CircularProgress />
                        </Box>
                    ) : (
                        <>
                            <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ '& th': { fontWeight: 'bold', backgroundColor: 'grey.100' } }}>
                                            <TableCell>Mã báo giá</TableCell>
                                            {/* <TableCell>Khách hàng</TableCell>
                                            <TableCell>Số điện thoại</TableCell>
                                            <TableCell>Email</TableCell> */}
                                            <TableCell align="right">Tổng tiền</TableCell>
                                            <TableCell>Ngày tạo</TableCell>
                                            <TableCell>Hiệu lực đến</TableCell>
                                            <TableCell>Trạng thái</TableCell>
                                            <TableCell align="center">Hành động</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {quotes.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={9} align="center">
                                                    <Typography color="text.secondary" py={2}>
                                                        Không tìm thấy báo giá nào
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            quotes.map((quote) => (
                                                <TableRow key={quote._id} hover>
                                                    <TableCell>
                                                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }} color="primary">
                                                            {quote.code}
                                                        </Typography>
                                                    </TableCell>
                                                    {/* <TableCell>
                                                        <Typography variant="body2">
                                                            {quote.customer?.full_name || 'N/A'}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2">
                                                            {quote.customer?.phone || 'N/A'}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2">
                                                            {quote.customer?.email || 'N/A'}
                                                        </Typography>
                                                    </TableCell> */}
                                                    <TableCell align="right">
                                                        <Typography variant="body2" fontWeight="medium">
                                                            {formatCurrency(quote.final_amount)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2">
                                                            {new Date(quote.createdAt).toLocaleDateString('vi-VN')}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2">
                                                            {new Date(quote.endDate).toLocaleDateString('vi-VN')}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip 
                                                            label={getStatusText(quote.status)} 
                                                            size="small"
                                                            sx={{
                                                                backgroundColor: getStatusColor(quote.status),
                                                                color: '#fff',
                                                                fontWeight: 600,
                                                                border: 'none',
                                                                '& .MuiChip-label': {
                                                                    padding: '4px 12px'
                                                                }
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        {quote.status === 'valid' ? (
                                                            <Button 
                                                                variant="contained"
                                                                size="small"
                                                                startIcon={<ShoppingCartIcon sx={{ fontSize: 16 }} />}
                                                                onClick={() => handleConvertQuote(quote)}
                                                            >
                                                                Chuyển đổi
                                                            </Button>
                                                        ) : (
                                                            <Typography 
                                                                variant="caption" 
                                                                color="text.secondary"
                                                                fontWeight="medium"
                                                            >
                                                                {getStatusText(quote.status)}
                                                            </Typography>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            {/* Pagination */}
                            {pagination.total > 0 && (
                                <Box display="flex" justifyContent="center" mt={3} mb={1}>
                                    <Pagination
                                        count={Math.ceil(pagination.total / pagination.pageSize)}
                                        page={pagination.current}
                                        onChange={handlePaginationChange}
                                        color="primary"
                                        showFirstButton
                                        showLastButton
                                    />
                                </Box>
                            )}

                            {pagination.total > 0 && (
                                <Box mt={1}>
                                    <Typography variant="body2" color="text.secondary" textAlign="center">
                                        Hiển thị {quotes.length} trong tổng số {pagination.total} báo giá
                                    </Typography>
                                </Box>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {selectedQuote && (
                <QuoteToOrderConverterMUI
                    quote={selectedQuote}
                    visible={showConverter}
                    onClose={() => {
                        setShowConverter(false);
                        setSelectedQuote(null);
                    }}
                    onSuccess={handleConverterSuccess}
                />
            )}
        </Box>
    );
};

export default QuoteToOrderPageMUI;