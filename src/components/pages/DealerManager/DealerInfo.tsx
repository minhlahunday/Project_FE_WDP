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
  Refresh as RefreshIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
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
      <Box sx={{ pl: 8, pr: 3, py: 3, pt: 3.75, bgcolor: 'grey.50', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Box textAlign="center">
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="body1" color="text.secondary">
            Đang tải thông tin đại lý...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ pl: 8, pr: 3, py: 3, pt: 3.75, bgcolor: 'grey.50', minHeight: '100vh' }}>
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
    );
  }

  if (!dealerInfo) {
    return (
      <Box sx={{ pl: 8, pr: 3, py: 3, pt: 3.75, bgcolor: 'grey.50', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
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
    );
  }

  return (
    <Box sx={{ pl: 8, pr: 3, py: 3, pt: 3.75, bgcolor: 'grey.50', minHeight: '100vh' }}>
      {/* Header */}
      <Card sx={{ mb: 3, bgcolor: 'white', border: '1px solid', borderColor: 'grey.300' }}>
        <CardContent sx={{ p: 4 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
                  <Box>
                    <Typography variant="h4" component="h1" fontWeight="bold" color="text.primary" gutterBottom>
                      Thông tin đại lý
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Quản lý và theo dõi thông tin đại lý của bạn
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    startIcon={<RefreshIcon />}
                    onClick={loadDealerInfo}
                    sx={{
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': { bgcolor: 'primary.dark' }
                    }}
                  >
                    Làm mới
                  </Button>
                </Box>
        </CardContent>
      </Card>

      {/* Company Status Banner */}
      <Card sx={{ mb: 3, bgcolor: '#fafafa', border: '1px solid', borderColor: 'grey.300' }}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center">
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      bgcolor: 'white',
                      border: '2px solid',
                      borderColor: 'grey.400',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <CheckCircleIcon sx={{ fontSize: 32, color: dealerInfo?.status === 'active' ? 'success.main' : 'grey.500' }} />
                  </Box>
                  <Box flex={1}>
                    <Typography variant="h6" fontWeight="bold" color="text.primary" gutterBottom>
                      {dealerInfo?.company_name || 'Đại lý đang hoạt động'}
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                      <Chip label={`Mã: ${dealerInfo?.code || 'N/A'}`} size="small" sx={{ bgcolor: 'white', color: 'text.primary', border: '1px solid', borderColor: 'grey.300' }} />
                      <Chip label={`Cấp độ: ${dealerInfo?.dealer_level || 'N/A'}`} size="small" sx={{ bgcolor: 'white', color: 'text.primary', border: '1px solid', borderColor: 'grey.300' }} />
                      <Chip
                        label={dealerInfo?.status === 'active' ? 'Đang hoạt động' : 'Không hoạt động'}
                        size="small"
                        sx={{
                          bgcolor: dealerInfo?.status === 'active' ? 'success.main' : 'grey.400',
                          color: 'white',
                          fontWeight: 'medium'
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
              <Box display="flex" alignItems="center" mb={3} pb={2} borderBottom="2px solid" borderColor="grey.300">
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          bgcolor: '#fafafa',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2
                        }}
                      >
                        <BusinessIcon sx={{ color: 'text.secondary' }} />
                      </Box>
                      <Typography variant="h5" fontWeight="bold" color="text.primary">
                        Thông tin công ty
                      </Typography>
                    </Box>
                    <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={3}>
                      <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight="semibold" display="block" mb={1}>
                          Tên công ty
                        </Typography>
                        <Typography variant="h6" fontWeight="bold" color="text.primary">
                          {dealerInfo?.company_name || 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight="semibold" display="block" mb={1}>
                          Mã đại lý
                        </Typography>
                        <Typography variant="h6" fontWeight="bold" color="text.primary">
                          {dealerInfo?.code || 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight="semibold" display="block" mb={1}>
                          Giấy phép kinh doanh
                        </Typography>
                        <Typography variant="body1" fontWeight="medium" color="text.primary">
                          {dealerInfo?.business_license || 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight="semibold" display="block" mb={1}>
                          Mã số thuế
                        </Typography>
                        <Typography variant="body1" fontWeight="medium" color="text.primary">
                          {dealerInfo?.tax_code || 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight="semibold" display="block" mb={1}>
                          Người đại diện pháp luật
                        </Typography>
                        <Typography variant="body1" fontWeight="medium" color="text.primary">
                          {dealerInfo?.legal_representative || 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight="semibold" display="block" mb={1}>
                          Cấp độ đại lý
                        </Typography>
                        <Typography variant="body1" fontWeight="medium" color="text.primary">
                          {dealerInfo?.dealer_level || 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight="semibold" display="block" mb={1}>
                          Phân phối sản phẩm
                        </Typography>
                        <Typography variant="body1" fontWeight="medium" color="text.primary">
                          {dealerInfo?.product_distribution || 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight="semibold" display="block" mb={1}>
                          Trạng thái
                        </Typography>
                        <Chip
                          label={dealerInfo?.status === 'active' ? '● Hoạt động' : '● Không hoạt động'}
                          size="small"
                          sx={{
                            bgcolor: 'grey.200',
                            color: 'text.primary',
                            fontWeight: 'bold'
                          }}
                        />
                      </Box>
                      <Box gridColumn={{ md: '1 / -1' }} sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight="semibold" display="block" mb={1}>
                          Ghi chú
                        </Typography>
                        <Typography variant="body1" fontWeight="medium" color="text.primary">
                          {dealerInfo?.notes || 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
            </CardContent>
          </Card>

          {/* Manufacturer Information */}
          <Card>
            <CardContent sx={{ p: 4 }}>
              <Box display="flex" alignItems="center" mb={3} pb={2} borderBottom="2px solid" borderColor="grey.300">
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          bgcolor: '#fafafa',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2
                        }}
                      >
                        <BusinessIcon sx={{ color: 'text.secondary' }} />
                      </Box>
                      <Typography variant="h5" fontWeight="bold" color="text.primary">
                        Thông tin nhà sản xuất
                      </Typography>
                    </Box>
                    <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={3}>
                      <Box sx={{ p: 2.5, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight="semibold" display="block" mb={1}>
                          Tên nhà sản xuất
                        </Typography>
                        <Typography variant="h6" fontWeight="bold" color="text.primary">
                          {dealerInfo?.manufacturer_id?.name || 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ p: 2.5, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight="semibold" display="block" mb={1}>
                          Mã nhà sản xuất
                        </Typography>
                        <Typography variant="body1" fontWeight="medium" color="text.primary">
                          {dealerInfo?.manufacturer_id?.code || 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ p: 2.5, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight="semibold" display="block" mb={1}>
                          Quốc gia
                        </Typography>
                        <Typography variant="body1" fontWeight="medium" color="text.primary">
                          {dealerInfo?.manufacturer_id?.country || 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ p: 2.5, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight="semibold" display="block" mb={1}>
                          ID nhà sản xuất
                        </Typography>
                        <Typography variant="caption" color="text.primary" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                          {dealerInfo?.manufacturer_id?._id || 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
            </CardContent>
          </Card>

          {/* Contract Information */}
          <Card>
            <CardContent sx={{ p: 4 }}>
              <Box display="flex" alignItems="center" mb={3} pb={2} borderBottom="2px solid" borderColor="grey.300">
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          bgcolor: '#fafafa',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2
                        }}
                      >
                        <DescriptionIcon sx={{ color: 'text.secondary' }} />
                      </Box>
                      <Typography variant="h5" fontWeight="bold" color="text.primary">
                        Thông tin hợp đồng
                      </Typography>
                    </Box>
                    <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={3}>
                      <Box sx={{ p: 2.5, bgcolor: '#fafafa', borderRadius: 2, border: '1px solid', borderColor: 'grey.300' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight="semibold" display="block" mb={1}>
                          Số hợp đồng
                        </Typography>
                        <Typography variant="h6" fontWeight="bold" color="text.primary">
                          {dealerInfo?.contract?.contract_number || 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ p: 2.5, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight="semibold" display="block" mb={1}>
                          Khu vực hoạt động
                        </Typography>
                        <Typography variant="body1" fontWeight="medium" color="text.primary">
                          {dealerInfo?.contract?.territory || 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ p: 2.5, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight="semibold" display="block" mb={1}>
                          Ngày ký hợp đồng
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <CalendarTodayIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                          <Typography variant="body1" fontWeight="medium" color="text.primary">
                            {dealerInfo?.contract?.signed_date ? formatDate(dealerInfo.contract.signed_date) : 'N/A'}
                          </Typography>
                        </Stack>
                      </Box>
                      <Box sx={{ p: 2.5, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight="semibold" display="block" mb={1}>
                          Ngày hết hạn
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <CalendarTodayIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                          <Typography variant="body1" fontWeight="medium" color="text.primary">
                            {dealerInfo?.contract?.expiry_date ? formatDate(dealerInfo.contract.expiry_date) : 'N/A'}
                          </Typography>
                        </Stack>
                      </Box>
                      <Box sx={{ p: 2.5, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight="semibold" display="block" mb={1}>
                          Độc quyền khu vực
                        </Typography>
                        <Typography variant="h6" fontWeight="bold" color="text.primary">
                          {dealerInfo?.contract?.exclusive_territory !== undefined ? formatBoolean(dealerInfo.contract.exclusive_territory) : 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardContent sx={{ p: 4 }}>
              <Box display="flex" alignItems="center" mb={3} pb={2} borderBottom="2px solid" borderColor="grey.300">
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          bgcolor: '#fafafa',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2
                        }}
                      >
                        <PhoneIcon sx={{ color: 'text.secondary' }} />
                      </Box>
                      <Typography variant="h5" fontWeight="bold" color="text.primary">
                        Thông tin liên hệ
                      </Typography>
                    </Box>
                    <Stack spacing={3}>
                      <Box sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight="semibold" display="block" mb={1.5}>
                          📍 Địa chỉ đầy đủ
                        </Typography>
                        <Stack direction="row" spacing={1.5} alignItems="flex-start">
                          <LocationOnIcon sx={{ color: 'text.secondary', mt: 0.5, flexShrink: 0 }} />
                          <Typography variant="h6" fontWeight="medium" color="text.primary" sx={{ lineHeight: 1.6 }}>
                            {dealerInfo?.address?.full_address || 'N/A'}
                          </Typography>
                        </Stack>
                      </Box>
                      
                      <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={2.5}>
                        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
                          <Typography variant="caption" color="text.secondary" fontWeight="semibold" display="block" mb={1}>
                            Đường
                          </Typography>
                          <Typography variant="body1" fontWeight="medium" color="text.primary">
                            {dealerInfo?.address?.street || 'N/A'}
                          </Typography>
                        </Box>
                        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
                          <Typography variant="caption" color="text.secondary" fontWeight="semibold" display="block" mb={1}>
                            Quận/Huyện
                          </Typography>
                          <Typography variant="body1" fontWeight="medium" color="text.primary">
                            {dealerInfo?.address?.district || 'N/A'}
                          </Typography>
                        </Box>
                        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
                          <Typography variant="caption" color="text.secondary" fontWeight="semibold" display="block" mb={1}>
                            Thành phố
                          </Typography>
                          <Typography variant="body1" fontWeight="medium" color="text.primary">
                            {dealerInfo?.address?.city || 'N/A'}
                          </Typography>
                        </Box>
                        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
                          <Typography variant="caption" color="text.secondary" fontWeight="semibold" display="block" mb={1}>
                            Tỉnh/Thành phố
                          </Typography>
                          <Typography variant="body1" fontWeight="medium" color="text.primary">
                            {dealerInfo?.address?.province || 'N/A'}
                          </Typography>
                        </Box>
                      </Box>

                      <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr 1fr' }} gap={2.5}>
                        <Box sx={{ p: 2.5, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
                          <Typography variant="caption" color="text.secondary" fontWeight="semibold" display="block" mb={1.5}>
                            Số điện thoại
                          </Typography>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                bgcolor: 'grey.200',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <PhoneIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                            </Box>
                            <Typography variant="h6" fontWeight="bold" color="text.primary">
                              {dealerInfo?.contact?.phone || 'N/A'}
                            </Typography>
                          </Stack>
                        </Box>
                        <Box sx={{ p: 2.5, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
                          <Typography variant="caption" color="text.secondary" fontWeight="semibold" display="block" mb={1.5}>
                            Hotline
                          </Typography>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                bgcolor: 'grey.200',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <PhoneIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                            </Box>
                            <Typography variant="h6" fontWeight="bold" color="text.primary">
                              {dealerInfo?.contact?.hotline || 'N/A'}
                            </Typography>
                          </Stack>
                        </Box>
                        <Box sx={{ p: 2.5, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
                          <Typography variant="caption" color="text.secondary" fontWeight="semibold" display="block" mb={1.5}>
                            Email
                          </Typography>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                bgcolor: 'grey.200',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <EmailIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                            </Box>
                            <Typography variant="body1" fontWeight="medium" color="text.primary" sx={{ wordBreak: 'break-all' }}>
                              {dealerInfo?.contact?.email || 'N/A'}
                            </Typography>
                          </Stack>
                        </Box>
                      </Box>
                    </Stack>
            </CardContent>
          </Card>

          {/* Capabilities */}
          
        </Box>

        {/* Statistics Sidebar */}
        <Box flex={{ lg: '1 1 0%' }} display="flex" flexDirection="column" gap={3}>
          {/* Company Overview */}
          <Card sx={{ bgcolor: 'white', border: '1px solid', borderColor: 'grey.300' }}>
            <CardContent sx={{ p: 3 }}>
                    <Box display="flex" alignItems="center" mb={3} pb={2} borderBottom="1px solid" borderColor="grey.300">
                      <BusinessIcon sx={{ color: 'text.secondary', mr: 1 }} />
                      <Typography variant="h6" fontWeight="bold" color="text.primary">
                        Tổng quan công ty
                      </Typography>
                    </Box>
                    <Stack spacing={2.5}>
                      <Box sx={{ bgcolor: '#fafafa', borderRadius: 2, p: 2, textAlign: 'center', border: '1px solid', borderColor: 'grey.300' }}>
                        <Typography variant="h5" fontWeight="bold" color="text.primary" gutterBottom>
                          {dealerInfo?.code || 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Mã đại lý
                        </Typography>
                      </Box>
                      <Box sx={{ bgcolor: '#fafafa', borderRadius: 2, p: 2, textAlign: 'center', border: '1px solid', borderColor: 'grey.300' }}>
                        <Typography variant="h5" fontWeight="bold" color="text.primary" gutterBottom>
                          {dealerInfo?.dealer_level || 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Cấp độ đại lý
                        </Typography>
                      </Box>
                      <Box sx={{ bgcolor: '#fafafa', borderRadius: 2, p: 2, textAlign: 'center', border: '1px solid', borderColor: 'grey.300' }}>
                        <Typography variant="h5" fontWeight="bold" color="text.primary" gutterBottom>
                          {dealerInfo?.product_distribution || 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Phân phối sản phẩm
                        </Typography>
                      </Box>
                      <Box textAlign="center">
                        <Chip
                          label={dealerInfo?.status === 'active' ? 'Đang hoạt động' : 'Không hoạt động'}
                          sx={{
                            bgcolor: dealerInfo?.status === 'active' ? 'success.main' : 'grey.400',
                            color: 'white',
                            fontWeight: 'medium'
                          }}
                        />
                      </Box>
                    </Stack>
            </CardContent>
          </Card>

          {/* Contract Status */}
          <Card sx={{ bgcolor: 'white', border: '1px solid', borderColor: 'grey.300' }}>
            <CardContent sx={{ p: 3 }}>
                    <Box display="flex" alignItems="center" mb={3} pb={2} borderBottom="1px solid" borderColor="grey.300">
                      <DescriptionIcon sx={{ color: 'text.secondary', mr: 1 }} />
                      <Typography variant="h6" fontWeight="bold" color="text.primary">
                        Trạng thái hợp đồng
                      </Typography>
                    </Box>
                    <Stack spacing={2.5}>
                      <Box sx={{ bgcolor: '#fafafa', borderRadius: 2, p: 2, textAlign: 'center', border: '1px solid', borderColor: 'grey.300' }}>
                        <Typography variant="h6" fontWeight="bold" color="text.primary" gutterBottom sx={{ wordBreak: 'break-all' }}>
                          {dealerInfo?.contract?.contract_number || 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Số hợp đồng
                        </Typography>
                      </Box>
                      <Box sx={{ bgcolor: '#fafafa', borderRadius: 2, p: 2, textAlign: 'center', border: '1px solid', borderColor: 'grey.300' }}>
                        <Typography variant="h6" fontWeight="bold" color="text.primary" gutterBottom>
                          {dealerInfo?.contract?.territory || 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Khu vực hoạt động
                        </Typography>
                      </Box>
                      <Box sx={{ bgcolor: '#fafafa', borderRadius: 2, p: 2, textAlign: 'center', border: '1px solid', borderColor: 'grey.300' }}>
                        <Typography variant="h5" fontWeight="bold" color="text.primary" gutterBottom>
                          {dealerInfo?.contract?.exclusive_territory !== undefined ? formatBoolean(dealerInfo.contract.exclusive_territory) : 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
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
                      <Box sx={{ bgcolor: 'grey.50', borderRadius: 2, p: 2, border: '1px solid', borderColor: 'grey.300' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight="semibold" display="block" mb={1}>
                          Người tạo:
                        </Typography>
                        <Typography variant="body2" fontWeight="bold" color="text.primary">
                          {dealerInfo?.created_by?.full_name || 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ bgcolor: 'grey.50', borderRadius: 2, p: 2, border: '1px solid', borderColor: 'grey.300' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight="semibold" display="block" mb={1}>
                          Email người tạo:
                        </Typography>
                        <Typography variant="body2" color="text.primary" sx={{ wordBreak: 'break-all' }}>
                          {dealerInfo?.created_by?.email || 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ bgcolor: 'grey.50', borderRadius: 2, p: 2, border: '1px solid', borderColor: 'grey.300' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight="semibold" display="block" mb={1}>
                          Ngày tạo:
                        </Typography>
                        <Typography variant="body2" fontWeight="medium" color="text.primary">
                          {dealerInfo?.createdAt ? new Date(dealerInfo.createdAt).toLocaleString('vi-VN') : 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ bgcolor: 'grey.50', borderRadius: 2, p: 2, border: '1px solid', borderColor: 'grey.300' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight="semibold" display="block" mb={1}>
                          Ngày cập nhật:
                        </Typography>
                        <Typography variant="body2" fontWeight="medium" color="text.primary">
                          {dealerInfo?.updatedAt ? new Date(dealerInfo.updatedAt).toLocaleString('vi-VN') : 'N/A'}
                        </Typography>
                      </Box>
                    </Stack>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};