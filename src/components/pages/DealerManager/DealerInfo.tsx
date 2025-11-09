import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Stack,
} from '@mui/material';
import {
  Business as BusinessIcon,
  LocationOn as LocationOnIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  CalendarToday as CalendarTodayIcon,
  CheckCircle as CheckCircleIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import { Sidebar } from '../../common/Sidebar';
import { Header } from '../../common/Header';
import { authService } from '../../../services/authService';
import { useAuth } from '../../../contexts/AuthContext';

interface DealerInfo {
  _id: string;
  code: string;
  company_name: string;
  business_license: string;
  tax_code: string;
  legal_representative: string;
  manufacturer_id: {
    _id: string;
    name: string;
    code: string;
    country: string;
  };
  dealer_level: string;
  product_distribution: string;
  status: string;
  isActive: boolean;
  created_by: {
    _id: string;
    full_name: string;
    email: string;
  };
  notes: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
  contract: {
    contract_number: string;
    signed_date: string;
    expiry_date: string;
    territory: string;
    exclusive_territory: boolean;
  };
  address: {
    street: string;
    district: string;
    city: string;
    province: string;
    full_address: string;
  };
  contact: {
    phone: string;
    email: string;
    hotline: string;
  };
  capabilities: {
    services: {
      vehicle_sales: boolean;
      test_drive: boolean;
      spare_parts_sales: boolean;
    };
    showroom_area: number;
    display_capacity: number;
    total_staff: number;
    sales_staff: number;
    support_staff: number;
  };
}

export const DealerInfo: React.FC = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('dealer-info');
  const [dealerInfo, setDealerInfo] = useState<DealerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lấy dealership_id từ thông tin user sau khi login thành công
  const getDealerId = useCallback(() => {
    console.log('🔍 Getting dealer ID from user after successful login:', user);
    
    // Ưu tiên lấy dealership_id từ user object (đã có sau khi login thành công)
    if (user?.dealership_id) {
      console.log('✅ Found dealership_id in user object:', user.dealership_id);
      return user.dealership_id;
    }
    
    // Fallback: nếu không có dealership_id trong user object, thử lấy từ JWT token
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        console.log('🔍 Trying to get dealership_id from JWT token...');
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('🔍 JWT payload:', payload);
        
        if (payload.dealership_id) {
          console.log('✅ Found dealership_id in JWT:', payload.dealership_id);
          return payload.dealership_id;
        }
      }
    } catch (error) {
      console.error('❌ Error parsing JWT token:', error);
    }
    
    // Nếu không tìm thấy dealership_id
    if (user?.role === 'dealer_staff' || user?.role === 'dealer_manager') {
      console.warn('❌ Không tìm thấy dealership_id trong thông tin user sau khi login');
      return null;
    }
    
    return null;
  }, [user]);

  const loadDealerInfo = useCallback(async () => {
    console.log('🔍 Loading dealer info...');
    console.log('🔍 Current user:', user);
    
    const dealerId = getDealerId();
    console.log('🔍 Dealer ID from getDealerId():', dealerId);
    
    if (!dealerId) {
      console.log('❌ No dealer ID found');
      setError('Không tìm thấy thông tin đại lý');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🚀 Calling API getDealerById with ID:', dealerId);
      const response = await authService.getDealerById(dealerId);
      
      console.log('✅ API response:', response);
      
      if (response.success && response.data) {
        console.log('✅ Setting dealer info:', response.data);
        setDealerInfo(response.data);
      } else {
        console.log('❌ API response failed:', response.message);
        setError(response.message || 'Không thể tải thông tin đại lý');
      }
    } catch (err: unknown) {
      console.error('❌ Error loading dealer info:', err);
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải thông tin đại lý';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [getDealerId, user]);

  useEffect(() => {
    loadDealerInfo();
  }, [loadDealerInfo]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatBoolean = (value: boolean) => {
    return value ? 'Có' : 'Không';
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <Sidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onOpen={() => setSidebarOpen(true)}
        />
        <div className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'
        }`}>
          <div className="fixed top-0 right-0 left-0 z-30 lg:left-16">
            <div className={`transition-all duration-300 ${
              sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'
            }`}>
              <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
            </div>
          </div>
          <main className="flex-1 overflow-y-auto pt-16">
            <Box sx={{ p: 3, bgcolor: 'grey.50', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Box textAlign="center">
                <CircularProgress size={60} sx={{ mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  Đang tải thông tin đại lý...
                </Typography>
              </Box>
            </Box>
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <Sidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onOpen={() => setSidebarOpen(true)}
        />
        <div className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'
        }`}>
          <div className="fixed top-0 right-0 left-0 z-30 lg:left-16">
            <div className={`transition-all duration-300 ${
              sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'
            }`}>
              <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
            </div>
          </div>
          <main className="flex-1 overflow-y-auto pt-16">
            <Box sx={{ p: 3, bgcolor: 'grey.50', minHeight: '100vh' }}>
              <Card>
                <CardContent>
                  <Alert 
                    severity="error" 
                    action={
                      <Button color="inherit" size="small" onClick={loadDealerInfo}>
                        Thử lại
                      </Button>
                    }
                  >
                    <Typography variant="h6" gutterBottom>
                      Lỗi tải thông tin
                    </Typography>
                    <Typography variant="body2">
                      {error}
                    </Typography>
                  </Alert>
                </CardContent>
              </Card>
            </Box>
          </main>
        </div>
      </div>
    );
  }

  if (!dealerInfo) {
    return (
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <Sidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onOpen={() => setSidebarOpen(true)}
        />
        <div className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'
        }`}>
          <div className="fixed top-0 right-0 left-0 z-30 lg:left-16">
            <div className={`transition-all duration-300 ${
              sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'
            }`}>
              <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
            </div>
          </div>
          <main className="flex-1 overflow-y-auto pt-16">
            <Box sx={{ p: 3, bgcolor: 'grey.50', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 6 }}>
                  <BusinessIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Không có thông tin đại lý
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Vui lòng liên hệ quản trị viên để được hỗ trợ.
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpen={() => setSidebarOpen(true)}
      />
      
      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'
      }`}>
        {/* Header */}
        <div className="fixed top-0 right-0 left-0 z-30 lg:left-16">
          <div className={`transition-all duration-300 ${
            sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'
          }`}>
            <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          </div>
        </div>
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto pt-16">
          <Box sx={{ p: 3, bgcolor: 'grey.50', minHeight: '100vh' }}>
            {/* Header */}
            <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)' }}>
              <CardContent sx={{ p: 4 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
                  <Box>
                    <Typography variant="h4" component="h1" fontWeight="bold" color="white" gutterBottom>
                      Thông tin đại lý
                    </Typography>
                    <Typography variant="body1" color="rgba(255,255,255,0.9)">
                      Quản lý và theo dõi thông tin đại lý của bạn
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    startIcon={<RefreshIcon />}
                    onClick={loadDealerInfo}
                    sx={{
                      bgcolor: 'white',
                      color: 'primary.main',
                      '&:hover': { bgcolor: 'grey.100' }
                    }}
                  >
                    Làm mới
                  </Button>
                </Box>
              </CardContent>
            </Card>

            {/* Company Status Banner */}
            <Card sx={{ mb: 3, bgcolor: 'success.light', border: '2px solid', borderColor: 'success.main' }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      bgcolor: 'success.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: 3
                    }}
                  >
                    <CheckCircleIcon sx={{ fontSize: 32, color: 'white' }} />
                  </Box>
                  <Box flex={1}>
                    <Typography variant="h6" fontWeight="bold" color="success.dark" gutterBottom>
                      {dealerInfo?.company_name || 'Đại lý đang hoạt động'}
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                      <Chip label={`Mã: ${dealerInfo?.code || 'N/A'}`} size="small" sx={{ bgcolor: 'success.light', color: 'success.dark' }} />
                      <Chip label={`Cấp độ: ${dealerInfo?.dealer_level || 'N/A'}`} size="small" sx={{ bgcolor: 'info.light', color: 'info.dark' }} />
                      <Chip
                        label={dealerInfo?.status === 'active' ? '🟢 Đang hoạt động' : '🔴 Không hoạt động'}
                        size="small"
                        sx={{
                          bgcolor: dealerInfo?.status === 'active' ? 'success.main' : 'error.main',
                          color: 'white'
                        }}
                      />
                    </Stack>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            <Box display="flex" flexDirection={{ xs: 'column', lg: 'row' }} gap={3}>
              {/* Main Info */}
              <Box flex={{ lg: '2 1 0%' }} display="flex" flexDirection="column" gap={3}>
                {/* Company Information */}
                <Card>
                  <CardContent sx={{ p: 4 }}>
                    <Box display="flex" alignItems="center" mb={3} pb={2} borderBottom="2px solid" borderColor="primary.light">
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          bgcolor: 'primary.light',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2
                        }}
                      >
                        <BusinessIcon color="primary" />
                      </Box>
                      <Typography variant="h5" fontWeight="bold">
                        Thông tin công ty
                      </Typography>
                    </Box>
                    <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={3}>
                      <Box sx={{ p: 2, bgcolor: 'primary.light', borderRadius: 2, border: '1px solid', borderColor: 'primary.main' }}>
                        <Typography variant="caption" color="primary.dark" fontWeight="semibold" display="block" mb={1}>
                          Tên công ty
                        </Typography>
                        <Typography variant="h6" fontWeight="bold">
                          {dealerInfo?.company_name || 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ p: 2, bgcolor: 'secondary.light', borderRadius: 2, border: '1px solid', borderColor: 'secondary.main' }}>
                        <Typography variant="caption" color="secondary.dark" fontWeight="semibold" display="block" mb={1}>
                          Mã đại lý
                        </Typography>
                        <Typography variant="h6" fontWeight="bold">
                          {dealerInfo?.code || 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ p: 2, bgcolor: 'purple.50', borderRadius: 2, border: '1px solid', borderColor: 'purple.200' }}>
                        <Typography variant="caption" color="purple.700" fontWeight="semibold" display="block" mb={1}>
                          Giấy phép kinh doanh
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {dealerInfo?.business_license || 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ p: 2, bgcolor: 'pink.50', borderRadius: 2, border: '1px solid', borderColor: 'pink.200' }}>
                        <Typography variant="caption" color="pink.700" fontWeight="semibold" display="block" mb={1}>
                          Mã số thuế
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {dealerInfo?.tax_code || 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ p: 2, bgcolor: 'orange.50', borderRadius: 2, border: '1px solid', borderColor: 'orange.200' }}>
                        <Typography variant="caption" color="orange.700" fontWeight="semibold" display="block" mb={1}>
                          Người đại diện pháp luật
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {dealerInfo?.legal_representative || 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ p: 2, bgcolor: 'success.light', borderRadius: 2, border: '1px solid', borderColor: 'success.main' }}>
                        <Typography variant="caption" color="success.dark" fontWeight="semibold" display="block" mb={1}>
                          Cấp độ đại lý
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {dealerInfo?.dealer_level || 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ p: 2, bgcolor: 'teal.50', borderRadius: 2, border: '1px solid', borderColor: 'teal.200' }}>
                        <Typography variant="caption" color="teal.700" fontWeight="semibold" display="block" mb={1}>
                          Phân phối sản phẩm
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {dealerInfo?.product_distribution || 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ p: 2, bgcolor: 'cyan.50', borderRadius: 2, border: '1px solid', borderColor: 'cyan.200' }}>
                        <Typography variant="caption" color="cyan.700" fontWeight="semibold" display="block" mb={1}>
                          Trạng thái
                        </Typography>
                        <Chip
                          label={dealerInfo?.status === 'active' ? '✓ Hoạt động' : '✗ Không hoạt động'}
                          size="small"
                          sx={{
                            bgcolor: dealerInfo?.status === 'active' ? 'success.main' : 'error.main',
                            color: 'white',
                            fontWeight: 'bold'
                          }}
                        />
                      </Box>
                      <Box gridColumn={{ md: '1 / -1' }} sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 2, border: '1px solid', borderColor: 'grey.300' }}>
                        <Typography variant="caption" color="grey.700" fontWeight="semibold" display="block" mb={1}>
                          Ghi chú
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {dealerInfo?.notes || 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>

                {/* Manufacturer Information */}
                <Card>
                  <CardContent sx={{ p: 4 }}>
                    <Box display="flex" alignItems="center" mb={3} pb={2} borderBottom="2px solid" borderColor="purple.100">
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          bgcolor: 'purple.100',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2
                        }}
                      >
                        <BusinessIcon sx={{ color: 'purple.600' }} />
                      </Box>
                      <Typography variant="h5" fontWeight="bold">
                        Thông tin nhà sản xuất
                      </Typography>
                    </Box>
                    <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={3}>
                      <Box sx={{ p: 2.5, bgcolor: 'purple.50', borderRadius: 2, border: '1px solid', borderColor: 'purple.200' }}>
                        <Typography variant="caption" color="purple.700" fontWeight="semibold" display="block" mb={1}>
                          Tên nhà sản xuất
                        </Typography>
                        <Typography variant="h6" fontWeight="bold">
                          {dealerInfo?.manufacturer_id?.name || 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ p: 2.5, bgcolor: 'secondary.light', borderRadius: 2, border: '1px solid', borderColor: 'secondary.main' }}>
                        <Typography variant="caption" color="secondary.dark" fontWeight="semibold" display="block" mb={1}>
                          Mã nhà sản xuất
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {dealerInfo?.manufacturer_id?.code || 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ p: 2.5, bgcolor: 'primary.light', borderRadius: 2, border: '1px solid', borderColor: 'primary.main' }}>
                        <Typography variant="caption" color="primary.dark" fontWeight="semibold" display="block" mb={1}>
                          Quốc gia
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {dealerInfo?.manufacturer_id?.country || 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ p: 2.5, bgcolor: 'cyan.50', borderRadius: 2, border: '1px solid', borderColor: 'cyan.200' }}>
                        <Typography variant="caption" color="cyan.700" fontWeight="semibold" display="block" mb={1}>
                          ID nhà sản xuất
                        </Typography>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                          {dealerInfo?.manufacturer_id?._id || 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>

                {/* Contract Information */}
                <Card>
                  <CardContent sx={{ p: 4 }}>
                    <Box display="flex" alignItems="center" mb={3} pb={2} borderBottom="2px solid" borderColor="warning.light">
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          bgcolor: 'warning.light',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2
                        }}
                      >
                        <DescriptionIcon sx={{ color: 'warning.main' }} />
                      </Box>
                      <Typography variant="h5" fontWeight="bold">
                        Thông tin hợp đồng
                      </Typography>
                    </Box>
                    <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={3}>
                      <Box sx={{ p: 2.5, bgcolor: 'warning.light', borderRadius: 2, border: '1px solid', borderColor: 'warning.main' }}>
                        <Typography variant="caption" color="warning.dark" fontWeight="semibold" display="block" mb={1}>
                          Số hợp đồng
                        </Typography>
                        <Typography variant="h6" fontWeight="bold">
                          {dealerInfo?.contract?.contract_number || 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ p: 2.5, bgcolor: 'orange.50', borderRadius: 2, border: '1px solid', borderColor: 'orange.200' }}>
                        <Typography variant="caption" color="orange.700" fontWeight="semibold" display="block" mb={1}>
                          Khu vực hoạt động
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {dealerInfo?.contract?.territory || 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ p: 2.5, bgcolor: 'success.light', borderRadius: 2, border: '1px solid', borderColor: 'success.main' }}>
                        <Typography variant="caption" color="success.dark" fontWeight="semibold" display="block" mb={1}>
                          Ngày ký hợp đồng
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <CalendarTodayIcon sx={{ color: 'success.main', fontSize: 20 }} />
                          <Typography variant="body1" fontWeight="medium">
                            {dealerInfo?.contract?.signed_date ? formatDate(dealerInfo.contract.signed_date) : 'N/A'}
                          </Typography>
                        </Stack>
                      </Box>
                      <Box sx={{ p: 2.5, bgcolor: 'error.light', borderRadius: 2, border: '1px solid', borderColor: 'error.main' }}>
                        <Typography variant="caption" color="error.dark" fontWeight="semibold" display="block" mb={1}>
                          Ngày hết hạn
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <CalendarTodayIcon sx={{ color: 'error.main', fontSize: 20 }} />
                          <Typography variant="body1" fontWeight="medium">
                            {dealerInfo?.contract?.expiry_date ? formatDate(dealerInfo.contract.expiry_date) : 'N/A'}
                          </Typography>
                        </Stack>
                      </Box>
                      <Box sx={{ p: 2.5, bgcolor: 'primary.light', borderRadius: 2, border: '1px solid', borderColor: 'primary.main' }}>
                        <Typography variant="caption" color="primary.dark" fontWeight="semibold" display="block" mb={1}>
                          Độc quyền khu vực
                        </Typography>
                        <Typography variant="h6" fontWeight="bold">
                          {dealerInfo?.contract?.exclusive_territory !== undefined ? formatBoolean(dealerInfo.contract.exclusive_territory) : 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>

                {/* Contact Information */}
                <Card>
                  <CardContent sx={{ p: 4 }}>
                    <Box display="flex" alignItems="center" mb={3} pb={2} borderBottom="2px solid" borderColor="success.light">
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          bgcolor: 'success.light',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2
                        }}
                      >
                        <PhoneIcon sx={{ color: 'success.main' }} />
                      </Box>
                      <Typography variant="h5" fontWeight="bold">
                        Thông tin liên hệ
                      </Typography>
                    </Box>
                    <Stack spacing={3}>
                      <Box sx={{ p: 3, bgcolor: 'secondary.light', borderRadius: 2, border: '1px solid', borderColor: 'secondary.main' }}>
                        <Typography variant="caption" color="secondary.dark" fontWeight="semibold" display="block" mb={1.5}>
                          📍 Địa chỉ đầy đủ
                        </Typography>
                        <Stack direction="row" spacing={1.5} alignItems="flex-start">
                          <LocationOnIcon sx={{ color: 'secondary.main', mt: 0.5, flexShrink: 0 }} />
                          <Typography variant="h6" fontWeight="medium" sx={{ lineHeight: 1.6 }}>
                            {dealerInfo?.address?.full_address || 'N/A'}
                          </Typography>
                        </Stack>
                      </Box>
                      
                      <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={2.5}>
                        <Box sx={{ p: 2, bgcolor: 'primary.light', borderRadius: 2, border: '1px solid', borderColor: 'primary.main' }}>
                          <Typography variant="caption" color="primary.dark" fontWeight="semibold" display="block" mb={1}>
                            Đường
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {dealerInfo?.address?.street || 'N/A'}
                          </Typography>
                        </Box>
                        <Box sx={{ p: 2, bgcolor: 'cyan.50', borderRadius: 2, border: '1px solid', borderColor: 'cyan.200' }}>
                          <Typography variant="caption" color="cyan.700" fontWeight="semibold" display="block" mb={1}>
                            Quận/Huyện
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {dealerInfo?.address?.district || 'N/A'}
                          </Typography>
                        </Box>
                        <Box sx={{ p: 2, bgcolor: 'teal.50', borderRadius: 2, border: '1px solid', borderColor: 'teal.200' }}>
                          <Typography variant="caption" color="teal.700" fontWeight="semibold" display="block" mb={1}>
                            Thành phố
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {dealerInfo?.address?.city || 'N/A'}
                          </Typography>
                        </Box>
                        <Box sx={{ p: 2, bgcolor: 'success.light', borderRadius: 2, border: '1px solid', borderColor: 'success.main' }}>
                          <Typography variant="caption" color="success.dark" fontWeight="semibold" display="block" mb={1}>
                            Tỉnh/Thành phố
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {dealerInfo?.address?.province || 'N/A'}
                          </Typography>
                        </Box>
                      </Box>

                      <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr 1fr' }} gap={2.5}>
                        <Box sx={{ p: 2.5, bgcolor: 'purple.50', borderRadius: 2, border: '1px solid', borderColor: 'purple.200' }}>
                          <Typography variant="caption" color="purple.700" fontWeight="semibold" display="block" mb={1.5}>
                            Số điện thoại
                          </Typography>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                bgcolor: 'purple.100',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <PhoneIcon sx={{ color: 'purple.600', fontSize: 20 }} />
                            </Box>
                            <Typography variant="h6" fontWeight="bold">
                              {dealerInfo?.contact?.phone || 'N/A'}
                            </Typography>
                          </Stack>
                        </Box>
                        <Box sx={{ p: 2.5, bgcolor: 'pink.50', borderRadius: 2, border: '1px solid', borderColor: 'pink.200' }}>
                          <Typography variant="caption" color="pink.700" fontWeight="semibold" display="block" mb={1.5}>
                            Hotline
                          </Typography>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                bgcolor: 'pink.100',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <PhoneIcon sx={{ color: 'pink.600', fontSize: 20 }} />
                            </Box>
                            <Typography variant="h6" fontWeight="bold">
                              {dealerInfo?.contact?.hotline || 'N/A'}
                            </Typography>
                          </Stack>
                        </Box>
                        <Box sx={{ p: 2.5, bgcolor: 'orange.50', borderRadius: 2, border: '1px solid', borderColor: 'orange.200' }}>
                          <Typography variant="caption" color="orange.700" fontWeight="semibold" display="block" mb={1.5}>
                            Email
                          </Typography>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                bgcolor: 'orange.100',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <EmailIcon sx={{ color: 'orange.600', fontSize: 20 }} />
                            </Box>
                            <Typography variant="body1" fontWeight="medium" sx={{ wordBreak: 'break-all' }}>
                              {dealerInfo?.contact?.email || 'N/A'}
                            </Typography>
                          </Stack>
                        </Box>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>

                {/* Capabilities */}
                {dealerInfo?.capabilities && (
                  <Card>
                    <CardContent sx={{ p: 4 }}>
                      <Box display="flex" alignItems="center" mb={3} pb={2} borderBottom="2px solid" borderColor="secondary.light">
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 2,
                            bgcolor: 'secondary.light',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mr: 2
                          }}
                        >
                          <CheckCircleIcon sx={{ color: 'secondary.main' }} />
                        </Box>
                        <Typography variant="h5" fontWeight="bold">
                          Khả năng cung cấp
                        </Typography>
                      </Box>
                      
                      {/* Services */}
                      <Box mb={4}>
                        <Box display="flex" alignItems="center" mb={3}>
                          <Box
                            sx={{
                              width: 4,
                              height: 32,
                              borderRadius: 2,
                              background: 'linear-gradient(to bottom, #2196f3, #3f51b5)',
                              mr: 1.5
                            }}
                          />
                          <Typography variant="h6" fontWeight="bold">
                            Dịch vụ cung cấp
                          </Typography>
                        </Box>
                        <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr 1fr' }} gap={2}>
                          <Card
                            sx={{
                              p: 2.5,
                              border: '2px solid',
                              borderColor: dealerInfo.capabilities.services?.vehicle_sales ? 'success.main' : 'grey.300',
                              bgcolor: dealerInfo.capabilities.services?.vehicle_sales ? 'success.light' : 'grey.50',
                              boxShadow: dealerInfo.capabilities.services?.vehicle_sales ? 3 : 1
                            }}
                          >
                            <Stack direction="row" spacing={1.5} alignItems="center">
                              <Box
                                sx={{
                                  width: 48,
                                  height: 48,
                                  borderRadius: '50%',
                                  bgcolor: dealerInfo.capabilities.services?.vehicle_sales ? 'success.main' : 'grey.300',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                <CheckCircleIcon sx={{ color: 'white', fontSize: 24 }} />
                              </Box>
                              <Typography variant="h6" fontWeight="bold" color={dealerInfo.capabilities.services?.vehicle_sales ? 'success.dark' : 'text.secondary'}>
                                Bán xe
                              </Typography>
                            </Stack>
                          </Card>
                          <Card
                            sx={{
                              p: 2.5,
                              border: '2px solid',
                              borderColor: dealerInfo.capabilities.services?.test_drive ? 'primary.main' : 'grey.300',
                              bgcolor: dealerInfo.capabilities.services?.test_drive ? 'primary.light' : 'grey.50',
                              boxShadow: dealerInfo.capabilities.services?.test_drive ? 3 : 1
                            }}
                          >
                            <Stack direction="row" spacing={1.5} alignItems="center">
                              <Box
                                sx={{
                                  width: 48,
                                  height: 48,
                                  borderRadius: '50%',
                                  bgcolor: dealerInfo.capabilities.services?.test_drive ? 'primary.main' : 'grey.300',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                <CheckCircleIcon sx={{ color: 'white', fontSize: 24 }} />
                              </Box>
                              <Typography variant="h6" fontWeight="bold" color={dealerInfo.capabilities.services?.test_drive ? 'primary.dark' : 'text.secondary'}>
                                Lái thử
                              </Typography>
                            </Stack>
                          </Card>
                          <Card
                            sx={{
                              p: 2.5,
                              border: '2px solid',
                              borderColor: dealerInfo.capabilities.services?.spare_parts_sales ? 'secondary.main' : 'grey.300',
                              bgcolor: dealerInfo.capabilities.services?.spare_parts_sales ? 'purple.50' : 'grey.50',
                              boxShadow: dealerInfo.capabilities.services?.spare_parts_sales ? 3 : 1
                            }}
                          >
                            <Stack direction="row" spacing={1.5} alignItems="center">
                              <Box
                                sx={{
                                  width: 48,
                                  height: 48,
                                  borderRadius: '50%',
                                  bgcolor: dealerInfo.capabilities.services?.spare_parts_sales ? 'secondary.main' : 'grey.300',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                <CheckCircleIcon sx={{ color: 'white', fontSize: 24 }} />
                              </Box>
                              <Typography variant="h6" fontWeight="bold" color={dealerInfo.capabilities.services?.spare_parts_sales ? 'secondary.dark' : 'text.secondary'}>
                                Bán phụ tùng
                              </Typography>
                            </Stack>
                          </Card>
                        </Box>
                      </Box>

                      {/* Facility Information */}
                      <Box>
                        <Box display="flex" alignItems="center" mb={3}>
                          <Box
                            sx={{
                              width: 4,
                              height: 32,
                              borderRadius: 2,
                              background: 'linear-gradient(to bottom, #9c27b0, #e91e63)',
                              mr: 1.5
                            }}
                          />
                          <Typography variant="h6" fontWeight="bold">
                            Cơ sở vật chất & Nhân sự
                          </Typography>
                        </Box>
                        <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr', lg: 'repeat(5, 1fr)' }} gap={2}>
                          <Card sx={{ background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)', p: 3, textAlign: 'center' }}>
                            <Typography variant="h3" fontWeight="bold" color="white" gutterBottom>
                              {dealerInfo.capabilities.showroom_area || 0}
                            </Typography>
                            <Typography variant="body2" color="rgba(255,255,255,0.9)" fontWeight="semibold">
                              Diện tích showroom (m²)
                            </Typography>
                          </Card>
                          <Card sx={{ background: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)', p: 3, textAlign: 'center' }}>
                            <Typography variant="h3" fontWeight="bold" color="white" gutterBottom>
                              {dealerInfo.capabilities.display_capacity || 0}
                            </Typography>
                            <Typography variant="body2" color="rgba(255,255,255,0.9)" fontWeight="semibold">
                              Sức chứa trưng bày
                            </Typography>
                          </Card>
                          <Card sx={{ background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)', p: 3, textAlign: 'center' }}>
                            <Typography variant="h3" fontWeight="bold" color="white" gutterBottom>
                              {dealerInfo.capabilities.total_staff || 0}
                            </Typography>
                            <Typography variant="body2" color="rgba(255,255,255,0.9)" fontWeight="semibold">
                              Tổng nhân viên
                            </Typography>
                          </Card>
                          <Card sx={{ background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)', p: 3, textAlign: 'center' }}>
                            <Typography variant="h3" fontWeight="bold" color="white" gutterBottom>
                              {dealerInfo.capabilities.sales_staff || 0}
                            </Typography>
                            <Typography variant="body2" color="rgba(255,255,255,0.9)" fontWeight="semibold">
                              Nhân viên bán hàng
                            </Typography>
                          </Card>
                          <Card sx={{ background: 'linear-gradient(135deg, #3f51b5 0%, #303f9f 100%)', p: 3, textAlign: 'center' }}>
                            <Typography variant="h3" fontWeight="bold" color="white" gutterBottom>
                              {dealerInfo.capabilities.support_staff || 0}
                            </Typography>
                            <Typography variant="body2" color="rgba(255,255,255,0.9)" fontWeight="semibold">
                              Nhân viên hỗ trợ
                            </Typography>
                          </Card>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                )}
              </Box>

              {/* Statistics Sidebar */}
              <Box flex={{ lg: '1 1 0%' }} display="flex" flexDirection="column" gap={3}>
                {/* Company Overview */}
                <Card sx={{ background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box display="flex" alignItems="center" mb={3} pb={2} borderBottom="1px solid" borderColor="rgba(255,255,255,0.3)">
                      <BusinessIcon sx={{ color: 'white', mr: 1 }} />
                      <Typography variant="h6" fontWeight="bold" color="white">
                        Tổng quan công ty
                      </Typography>
                    </Box>
                    <Stack spacing={2.5}>
                      <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2, p: 2, textAlign: 'center' }}>
                        <Typography variant="h5" fontWeight="bold" color="white" gutterBottom>
                          {dealerInfo?.code || 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="rgba(255,255,255,0.9)">
                          Mã đại lý
                        </Typography>
                      </Box>
                      <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2, p: 2, textAlign: 'center' }}>
                        <Typography variant="h5" fontWeight="bold" color="white" gutterBottom>
                          {dealerInfo?.dealer_level || 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="rgba(255,255,255,0.9)">
                          Cấp độ đại lý
                        </Typography>
                      </Box>
                      <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2, p: 2, textAlign: 'center' }}>
                        <Typography variant="h5" fontWeight="bold" color="white" gutterBottom>
                          {dealerInfo?.product_distribution || 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="rgba(255,255,255,0.9)">
                          Phân phối sản phẩm
                        </Typography>
                      </Box>
                      <Box textAlign="center">
                        <Chip
                          label={dealerInfo?.status === 'active' ? '✓ Hoạt động' : '✗ Không hoạt động'}
                          sx={{
                            bgcolor: dealerInfo?.status === 'active' ? 'success.main' : 'error.main',
                            color: 'white',
                            fontWeight: 'bold'
                          }}
                        />
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>

                {/* Contract Status */}
                <Card sx={{ background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box display="flex" alignItems="center" mb={3} pb={2} borderBottom="1px solid" borderColor="rgba(255,255,255,0.3)">
                      <DescriptionIcon sx={{ color: 'white', mr: 1 }} />
                      <Typography variant="h6" fontWeight="bold" color="white">
                        Trạng thái hợp đồng
                      </Typography>
                    </Box>
                    <Stack spacing={2.5}>
                      <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2, p: 2, textAlign: 'center' }}>
                        <Typography variant="h6" fontWeight="bold" color="white" gutterBottom sx={{ wordBreak: 'break-all' }}>
                          {dealerInfo?.contract?.contract_number || 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="rgba(255,255,255,0.9)">
                          Số hợp đồng
                        </Typography>
                      </Box>
                      <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2, p: 2, textAlign: 'center' }}>
                        <Typography variant="h6" fontWeight="bold" color="white" gutterBottom>
                          {dealerInfo?.contract?.territory || 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="rgba(255,255,255,0.9)">
                          Khu vực hoạt động
                        </Typography>
                      </Box>
                      <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2, p: 2, textAlign: 'center' }}>
                        <Typography variant="h5" fontWeight="bold" color="white" gutterBottom>
                          {dealerInfo?.contract?.exclusive_territory !== undefined ? formatBoolean(dealerInfo.contract.exclusive_territory) : 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="rgba(255,255,255,0.9)">
                          Độc quyền
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>

                {/* System Information */}
                <Card>
                  <CardContent sx={{ p: 3 }}>
                    <Box display="flex" alignItems="center" mb={3} pb={2} borderBottom="2px solid" borderColor="grey.200">
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          bgcolor: 'grey.100',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2
                        }}
                      >
                        <DescriptionIcon color="action" />
                      </Box>
                      <Typography variant="h6" fontWeight="bold">
                        Thông tin hệ thống
                      </Typography>
                    </Box>
                    <Stack spacing={2}>
                      <Box sx={{ bgcolor: 'grey.50', borderRadius: 2, p: 2 }}>
                        <Typography variant="caption" color="grey.600" fontWeight="semibold" display="block" mb={1}>
                          ID đại lý:
                        </Typography>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', wordBreak: 'break-all', bgcolor: 'white', p: 1, borderRadius: 1, border: '1px solid', borderColor: 'grey.300', display: 'block' }}>
                          {dealerInfo?._id || 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ bgcolor: 'primary.light', borderRadius: 2, p: 2 }}>
                        <Typography variant="caption" color="primary.dark" fontWeight="semibold" display="block" mb={1}>
                          Người tạo:
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {dealerInfo?.created_by?.full_name || 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ bgcolor: 'purple.50', borderRadius: 2, p: 2 }}>
                        <Typography variant="caption" color="purple.700" fontWeight="semibold" display="block" mb={1}>
                          Email người tạo:
                        </Typography>
                        <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                          {dealerInfo?.created_by?.email || 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ bgcolor: 'success.light', borderRadius: 2, p: 2 }}>
                        <Typography variant="caption" color="success.dark" fontWeight="semibold" display="block" mb={1}>
                          Ngày tạo:
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {dealerInfo?.createdAt ? new Date(dealerInfo.createdAt).toLocaleString('vi-VN') : 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ bgcolor: 'orange.50', borderRadius: 2, p: 2 }}>
                        <Typography variant="caption" color="orange.700" fontWeight="semibold" display="block" mb={1}>
                          Ngày cập nhật:
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {dealerInfo?.updatedAt ? new Date(dealerInfo.updatedAt).toLocaleString('vi-VN') : 'N/A'}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card sx={{ background: 'linear-gradient(135deg, #9c27b0 0%, #e91e63 100%)' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box display="flex" alignItems="center" mb={3} pb={2} borderBottom="1px solid" borderColor="rgba(255,255,255,0.3)">
                      <Typography variant="h6" fontWeight="bold" color="white">
                        ⚡ Thao tác nhanh
                      </Typography>
                    </Box>
                    <Stack spacing={2}>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<DescriptionIcon />}
                        sx={{
                          bgcolor: 'white',
                          color: 'primary.main',
                          '&:hover': { bgcolor: 'grey.100' },
                          fontWeight: 'bold'
                        }}
                      >
                        Xem báo cáo chi tiết
                      </Button>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<BusinessIcon />}
                        sx={{
                          bgcolor: 'white',
                          color: 'success.main',
                          '&:hover': { bgcolor: 'grey.100' },
                          fontWeight: 'bold'
                        }}
                      >
                        Quản lý nhân viên
                      </Button>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<EditIcon />}
                        sx={{
                          bgcolor: 'white',
                          color: 'purple.main',
                          '&:hover': { bgcolor: 'grey.100' },
                          fontWeight: 'bold'
                        }}
                      >
                        Cập nhật thông tin
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Box>
            </Box>
          </Box>
        </main>
  </div>
</div>
  );
};