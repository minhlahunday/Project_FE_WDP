import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Tag, 
  Button, 
  Input, 
  Typography,
  Modal,
  Descriptions,
  message,
  Spin,
  Row,
  Col,
  Statistic,
  Tooltip
} from 'antd';
import { 
  SearchOutlined, 
  EyeOutlined, 
  FileTextOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { authService } from '../../../services/authService';
import '../../../styles/quotation-management.css';

const { Title, Text } = Typography;

interface Quotation {
  _id: string;
  code: string; // API returns 'code', not 'quote_number'
  quote_number?: string; // For backward compatibility
  customer_id: string | {
    _id: string;
    full_name: string;
    email: string;
    phone: string;
    address?: string;
  };
  customer_name?: string;
  dealership_id?: string | {
    _id: string;
    company_name: string;
    code?: string;
  };
  dealership_name?: string;
  items: {
    _id?: string;
    vehicle_id: string; // API returns string ID
    vehicle_name: string; // API returns vehicle_name directly
    vehicle_price: number; // API returns vehicle_price
    vehicle_model?: string;
    quantity: number;
    unit_price?: number;
    discount: number;
    color?: string;
    promotion_id?: string;
    promotion_name?: string;
    options?: Array<{
      option_id?: string;
      name?: string;
      price?: number;
    }>;
    accessories?: Array<{
      accessory_id?: string;
      name?: string;
      quantity: number;
      unit_price?: number;
    }>;
    final_amount: number; // Per item final amount
    subtotal?: number;
  }[];
  total_amount?: number;
  discount_amount?: number;
  final_amount?: number;
  tax_amount?: number;
  status?: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted' | 'valid' | 'cancelled' | 'canceled';
  notes?: string;
  valid_until?: string;
  startDate?: string; // API field
  endDate?: string; // API field
  sent_at?: string;
  accepted_at?: string;
  rejected_at?: string;
  rejection_reason?: string;
  created_by?: string | {
    _id: string;
    full_name: string;
    email?: string;
    role?: string;
  };
  created_by_name?: string;
  updated_by?: string | {
    _id: string;
    full_name: string;
  };
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
  isActive?: boolean;
}

export const QuotationManagement: React.FC = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    sent: 0,
    accepted: 0,
    rejected: 0,
    converted: 0
  });

  useEffect(() => {
    loadQuotations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, searchQuery]);

  const loadQuotations = async () => {
    try {
      setLoading(true);
      console.log('📋 Loading quotations with params:', { page: currentPage, limit: pageSize, q: searchQuery });
      
      // Call API with pagination and search
      const response = await authService.getQuotations({
        page: currentPage,
        limit: pageSize,
        q: searchQuery || undefined
      }) as { 
        status?: number;
        success?: boolean;
        message?: string;
        data?: {
          quotes?: Quotation[];
          pagination?: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
          };
        } | Quotation[]; // Handle both formats
      };
      console.log('✅ Quotations loaded:', response);
      console.log('🔍 Response data type:', typeof response?.data, Array.isArray(response?.data));
      console.log('📊 Response.data:', response?.data);
      
      // Handle response structure from API
      if (response?.data) {
        // Case 1: data is an object with quotes array
        if (!Array.isArray(response.data) && 'quotes' in response.data && Array.isArray(response.data.quotes)) {
          console.log('📦 Case 1: data.quotes array found');
          console.log('📋 First quote sample:', response.data.quotes[0]);
          setQuotations(response.data.quotes);
          calculateStats(response.data.quotes);
          
          // Set pagination info
          if (response.data.pagination) {
            setTotalItems(response.data.pagination.total);
          }
        } 
        // Case 2: data is directly an array of quotations
        else if (Array.isArray(response.data)) {
          console.log('📦 Case 2: data is array');
          setQuotations(response.data);
          calculateStats(response.data);
          setTotalItems(response.data.length);
        }
        // Case 3: Unknown structure - try to find array in data
        else {
          console.warn('⚠️ Unexpected API response structure:', response);
          console.log('📊 Response.data:', response.data);
          console.log('📊 Response.data keys:', Object.keys(response.data));
          console.log('📊 Response.data type:', typeof response.data);
          
          // Try to find array in various possible locations
          const dataObj = response.data as Record<string, unknown>;
          let foundQuotes: Quotation[] | null = null;
          
          // Check common array field names
          const possibleArrayKeys = ['quotes', 'data', 'items', 'results', 'list'];
          for (const key of possibleArrayKeys) {
            if (dataObj[key] && Array.isArray(dataObj[key])) {
              console.log(`✅ Found array at data.${key}`);
              foundQuotes = dataObj[key] as Quotation[];
              break;
            }
          }
          
          if (foundQuotes) {
            console.log('📋 Found quotes sample:', foundQuotes[0]);
            console.log('📊 Total quotes found:', foundQuotes.length);
            setQuotations(foundQuotes);
            calculateStats(foundQuotes);
            
            // Try to find pagination info
            const pagination = dataObj.pagination as { total?: number } | undefined;
            if (pagination?.total) {
              setTotalItems(pagination.total);
              console.log('📄 Pagination total:', pagination.total);
            } else {
              setTotalItems(foundQuotes.length);
            }
          } else {
            console.error('❌ Could not find quotations array in response');
            console.error('📊 Available keys:', Object.keys(dataObj));
            setQuotations([]);
            setTotalItems(0);
          }
        }
      } else {
        console.warn('⚠️ No data in response:', response);
        setQuotations([]);
        setTotalItems(0);
      }
    } catch (error) {
      console.error('❌ Error loading quotations:', error);
      message.error('Không thể tải danh sách báo giá');
      setQuotations([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setSearchQuery(searchText);
    setCurrentPage(1); // Reset to first page on search
  };

  const handleSearchClear = () => {
    setSearchText('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const calculateStats = (data: Quotation[]) => {
    const newStats = {
      total: data.length,
      draft: data.filter(q => q.status === 'draft').length,
      sent: data.filter(q => q.status === 'sent' || q.status === 'valid').length,
      accepted: data.filter(q => q.status === 'accepted').length,
      rejected: data.filter(q => q.status === 'rejected' || q.status === 'cancelled').length,
      converted: data.filter(q => q.status === 'converted').length
    };
    setStats(newStats);
  };

  const handleViewDetail = async (quotation: Quotation) => {
    try {
      console.log('🔍 Fetching quotation detail for ID:', quotation._id);
      setLoading(true);
      
      // Call API to get full quotation detail
      const response = await authService.getQuotationById(quotation._id);
      console.log('✅ Quotation detail response:', response);
      
      // Extract quotation data from response
      let detailData = quotation; // Fallback to current data
      
      if (response && typeof response === 'object') {
        const apiData = response as { data?: Quotation; quotation?: Quotation };
        if (apiData.data) {
          detailData = apiData.data;
        } else if (apiData.quotation) {
          detailData = apiData.quotation as Quotation;
        } else if ('_id' in response) {
          detailData = response as Quotation;
        }
      }
      
      console.log('📋 Setting quotation detail:', detailData);
      setSelectedQuotation(detailData);
      setShowDetailModal(true);
    } catch (error) {
      console.error('❌ Error fetching quotation detail:', error);
      message.error('Không thể tải chi tiết báo giá');
      // Fallback: show current data
      setSelectedQuotation(quotation);
      setShowDetailModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuotation = (quotation: Quotation) => {
    // Check if quotation can be canceled based on status
    const currentStatus = quotation.status || 'valid';
    
    // Cannot cancel if already canceled or expired
    if (currentStatus === 'cancelled' || currentStatus === 'canceled') {
      Modal.warning({
        title: 'Không thể hủy báo giá',
        icon: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
        content: (
          <div>
            <p>Báo giá này đã bị hủy trước đó.</p>
            <div style={{ 
              marginTop: 12, 
              padding: 12, 
              background: '#fff7e6', 
              borderRadius: 8,
              border: '1px solid #ffd666'
            }}>
              <Text strong style={{ display: 'block', marginBottom: 4 }}>
                Mã báo giá: {quotation.code || quotation._id}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Trạng thái: {getStatusText(currentStatus)}
              </Text>
            </div>
          </div>
        ),
        okText: 'Đã hiểu',
        okButtonProps: {
          style: {
            borderRadius: 8,
            height: 40,
            fontSize: 14
          }
        }
      });
      return;
    }
    
    // Check if expired (based on valid_until or endDate)
    const validUntil = quotation.valid_until || quotation.endDate;
    if (validUntil && new Date(validUntil) < new Date()) {
      Modal.warning({
        title: 'Không thể hủy báo giá',
        icon: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
        content: (
          <div>
            <p>Báo giá này đã hết hạn và không thể hủy.</p>
            <div style={{ 
              marginTop: 12, 
              padding: 12, 
              background: '#fff7e6', 
              borderRadius: 8,
              border: '1px solid #ffd666'
            }}>
              <Text strong style={{ display: 'block', marginBottom: 4 }}>
                Mã báo giá: {quotation.code || quotation._id}
              </Text>
              <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                Hết hạn: {formatDate(validUntil)}
              </Text>
            </div>
          </div>
        ),
        okText: 'Đã hiểu',
        okButtonProps: {
          style: {
            borderRadius: 8,
            height: 40,
            fontSize: 14
          }
        }
      });
      return;
    }
    
    Modal.confirm({
      title: 'Xác nhận hủy báo giá',
      icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      content: (
        <div>
          <p>Bạn có chắc chắn muốn hủy báo giá này?</p>
          <div style={{ 
            marginTop: 12, 
            padding: 12, 
            background: '#fff7e6', 
            borderRadius: 8,
            border: '1px solid #ffd666'
          }}>
            <Text strong style={{ display: 'block', marginBottom: 4 }}>
              Mã báo giá: {quotation.code || quotation._id}
            </Text>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
              Trạng thái hiện tại: {getStatusText(currentStatus)}
            </Text>
          </div>
          <div style={{ 
            marginTop: 12, 
            padding: 10, 
            background: '#e6f7ff', 
            borderRadius: 8,
            border: '1px solid #91d5ff'
          }}>
            <Text style={{ fontSize: 12, color: '#0050b3' }}>
              ℹ️ Báo giá sẽ được đánh dấu là "Đã hủy" và không thể khôi phục
            </Text>
          </div>
        </div>
      ),
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      okButtonProps: {
        style: {
          borderRadius: 8,
          height: 40,
          fontSize: 14,
          fontWeight: 500
        }
      },
      cancelButtonProps: {
        style: {
          borderRadius: 8,
          height: 40,
          fontSize: 14
        }
      },
      onOk: async () => {
        try {
          console.log('🗑️ Canceling quotation:', quotation._id);
          await authService.deleteQuotation(quotation._id);
          message.success({
            content: (
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>✅ Hủy báo giá thành công!</div>
                <div style={{ fontSize: 12, color: '#52c41a' }}>
                  Báo giá đã được đánh dấu là "Đã hủy"
                </div>
              </div>
            ),
            duration: 4
          });
          loadQuotations(); // Reload the list
        } catch (error) {
          console.error('❌ Error canceling quotation:', error);
          console.error('❌ Error type:', typeof error);
          console.error('❌ Error keys:', error && typeof error === 'object' ? Object.keys(error) : 'N/A');
          
          // Extract error message
          let errorMessage = 'Không thể hủy báo giá';
          let errorDetails = '';
          
          if (error instanceof Error) {
            errorMessage = error.message;
          } else if (error && typeof error === 'object') {
            const apiError = error as { 
              response?: { 
                data?: { 
                  message?: string;
                  error?: string | number;
                  status?: number;
                };
                status?: number;
              };
              message?: string;
            };
            
            console.error('📋 Extracted API error:', apiError.response?.data);
            
            if (apiError.response?.data) {
              errorMessage = apiError.response.data.message || errorMessage;
              if (apiError.response.data.error) {
                errorDetails = `Error code: ${apiError.response.data.error}`;
              }
            } else if (apiError.message) {
              errorMessage = apiError.message;
            }
          }
          
          // Show error with details
          // Check if it's a server error (500)
          const is500Error = error && typeof error === 'object' && 
            (error as { response?: { status?: number } }).response?.status === 500;
          
          if (is500Error) {
            // Show detailed error modal for server errors
            Modal.error({
              title: 'Lỗi hệ thống khi hủy báo giá',
              content: (
                <div>
                  <p style={{ marginBottom: 12 }}>
                    Đã xảy ra lỗi từ phía server. Vui lòng thử lại sau hoặc liên hệ quản trị viên.
                  </p>
                  <div style={{ 
                    padding: 12, 
                    background: '#fff7e6', 
                    borderRadius: 8,
                    border: '1px solid #ffd666',
                    marginBottom: 12
                  }}>
                    <Text strong style={{ display: 'block', marginBottom: 4, fontSize: 13 }}>
                      Chi tiết lỗi:
                    </Text>
                    <Text style={{ fontSize: 12, color: '#666' }}>
                      {errorMessage}
                    </Text>
                  </div>
                  <div style={{ 
                    padding: 10, 
                    background: '#e6f7ff', 
                    borderRadius: 8,
                    border: '1px solid #91d5ff'
                  }}>
                    <Text style={{ fontSize: 12, color: '#0050b3' }}>
                      💡 Mã báo giá: <strong>{quotation.code || quotation._id}</strong>
                    </Text>
                  </div>
                </div>
              ),
              okText: 'Đã hiểu',
              okButtonProps: {
                style: {
                  borderRadius: 8,
                  height: 40
                }
              }
            });
          } else {
            // Show normal error message for other errors
            message.error({
              content: (
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>❌ Không thể hủy báo giá</div>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: errorDetails ? 4 : 0 }}>
                    {errorMessage}
                  </div>
                  {errorDetails && (
                    <div style={{ fontSize: 11, color: '#999', fontStyle: 'italic' }}>
                      {errorDetails}
                    </div>
                  )}
                </div>
              ),
              duration: 6
            });
          }
        }
      }
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'default',
      sent: 'blue',
      accepted: 'green',
      rejected: 'red',
      expired: 'orange',
      converted: 'purple',
      valid: 'cyan',
      cancelled: 'volcano'
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      draft: 'Nháp',
      sent: 'Đã gửi',
      accepted: 'Đã chấp nhận',
      rejected: 'Từ chối',
      expired: 'Hết hạn',
      converted: 'Đã chuyển đơn',
      valid: 'Hợp lệ',
      cancelled: 'Đã hủy'
    };
    return texts[status] || status;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const columns = [
    {
      title: <span style={{ fontWeight: 600, color: '#1a1a2e', fontSize: 14 }}>Mã báo giá</span>,
      dataIndex: 'code',
      key: 'code',
      width: 160,
      render: (text: string, record: Quotation) => {
        console.log('🔍 Quote record:', record);
        const quoteCode = text || record.code || record.quote_number || record._id;
        return (
          <div style={{ 
            padding: '6px 12px',
            background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
            borderRadius: 8,
            display: 'inline-block'
          }}>
            <Text strong style={{ color: '#667eea', fontSize: 14 }}>
              {quoteCode}
            </Text>
          </div>
        );
      }
    },
    {
      title: <span style={{ fontWeight: 600, color: '#1a1a2e', fontSize: 14 }}>Khách hàng</span>,
      dataIndex: 'customer_name',
      key: 'customer',
      width: 200,
      render: (_: unknown, record: Quotation) => {
        console.log('👤 Customer data:', record);
        
        // Try to get customer info from different sources
        let customerName = 'N/A';
        let customerPhone = '';
        
        if (record.customer_name) {
          customerName = record.customer_name;
        } else if (typeof record.customer_id === 'object' && record.customer_id) {
          customerName = record.customer_id.full_name || 'N/A';
          customerPhone = record.customer_id.phone || '';
        } else if (typeof record.customer_id === 'string') {
          customerName = `ID: ${record.customer_id}`;
        }
        
        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: 14
              }}>
                {customerName.charAt(0).toUpperCase()}
              </div>
              <div>
                <Text strong style={{ fontSize: 14, color: '#1a1a2e' }}>{customerName}</Text>
                {customerPhone && (
                  <>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      📱 {customerPhone}
                    </Text>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      }
    },
    {
      title: <span style={{ fontWeight: 600, color: '#1a1a2e', fontSize: 14 }}>🚗 Xe</span>,
      dataIndex: 'items',
      key: 'vehicles',
      width: 250,
      render: (items: Quotation['items'], record: Quotation) => {
        console.log('🚗 Items data:', items, 'Full record:', record);
        
        if (!items || items.length === 0) {
          return <Text type="secondary">Không có xe</Text>;
        }
        
        return (
          <div>
            {items.slice(0, 2).map((item, idx) => {
              const vehicleName = item.vehicle_name || 'N/A';
              const color = item.color;
              
              return (
                <div key={idx} style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 14, color: '#1a1a2e' }}>{vehicleName}</Text>
                  {color && (
                    <Tag 
                      color="blue" 
                      style={{ 
                        borderRadius: 6,
                        fontSize: 12,
                        padding: '2px 8px'
                      }}
                    >
                      {color}
                    </Tag>
                  )}
                </div>
              );
            })}
            {items.length > 2 && (
              <Tag color="default" style={{ fontSize: 12 }}>+{items.length - 2} xe khác</Tag>
            )}
          </div>
        );
      }
    },
    {
      title: <span style={{ fontWeight: 600, color: '#1a1a2e', fontSize: 14 }}>💰 Tổng giá trị</span>,
      dataIndex: 'final_amount',
      key: 'final_amount',
      width: 170,
      render: (_: unknown, record: Quotation) => {
        let totalAmount = record.final_amount || record.total_amount || 0;
        
        if (!totalAmount && record.items && record.items.length > 0) {
          totalAmount = record.items.reduce((sum, item) => sum + (item.final_amount || item.vehicle_price * item.quantity), 0);
        }
        
        return (
          <div style={{
            padding: '8px 12px',
            background: 'linear-gradient(135deg, #52c41a15 0%, #389e0d15 100%)',
            borderRadius: 8,
            display: 'inline-block'
          }}>
            <Text strong style={{ color: '#52c41a', fontSize: 15 }}>
              {formatPrice(totalAmount)}
            </Text>
          </div>
        );
      }
    },
    {
      title: <span style={{ fontWeight: 600, color: '#1a1a2e', fontSize: 14 }}>Trạng thái</span>,
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: string, record: Quotation) => {
        const currentStatus = status || record.status || 'valid';
        return (
          <Tag 
            color={getStatusColor(currentStatus)}
            style={{
              fontSize: 13,
              padding: '4px 12px',
              borderRadius: 20,
              fontWeight: 500
            }}
          >
            {getStatusText(currentStatus)}
          </Tag>
        );
      }
    },
    {
      title: <span style={{ fontWeight: 600, color: '#1a1a2e', fontSize: 14 }}>📅 Ngày tạo</span>,
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string, record: Quotation) => {
        const createdDate = date || record.createdAt || (record as { created_at?: string }).created_at;
        return (
          <Text style={{ fontSize: 13, color: '#666' }}>
            {createdDate ? formatDate(createdDate) : 'N/A'}
          </Text>
        );
      }
    },
    {
      title: <span style={{ fontWeight: 600, color: '#1a1a2e', fontSize: 14 }}>Hành động</span>,
      key: 'action',
      width: 180,
      fixed: 'right' as const,
      render: (_: unknown, record: Quotation) => {
        const currentStatus = record.status || 'valid';
        const isAlreadyCanceled = currentStatus === 'cancelled' || currentStatus === 'canceled';
        const validUntil = record.valid_until || record.endDate;
        const isExpired = validUntil && new Date(validUntil) < new Date();
        const canCancel = !isAlreadyCanceled && !isExpired;
        
        return (
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              type="primary"
              icon={<EyeOutlined />}
              size="middle"
              onClick={() => handleViewDetail(record)}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: 8,
                fontWeight: 500
              }}
            >
              Xem
            </Button>
            <Tooltip 
              title={
                isAlreadyCanceled 
                  ? 'Báo giá đã bị hủy' 
                  : isExpired 
                    ? 'Báo giá đã hết hạn' 
                    : 'Hủy báo giá'
              }
            >
              <Button
                danger
                icon={<DeleteOutlined />}
                size="middle"
                onClick={() => handleDeleteQuotation(record)}
                disabled={!canCancel}
                style={{
                  borderRadius: 8,
                  opacity: canCancel ? 1 : 0.5
                }}
              />
            </Tooltip>
          </div>
        );
      }
    }
  ];

  const handleTableChange = (pagination: { current?: number; pageSize?: number }) => {
    if (pagination.current) setCurrentPage(pagination.current);
    if (pagination.pageSize) setPageSize(pagination.pageSize);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6">
      <div className="w-full mx-auto">
            {/* Header Section with Gradient */}
            <div className="mb-8">
              <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-xl p-8">
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-4xl font-bold text-white mb-2">
                      Quản lý báo giá
                    </h1>
                    <p className="text-blue-100 text-lg">
                      Quản lý và theo dõi báo giá cho khách hàng
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <Row gutter={[16, 16]} className="mb-6">
              <Col xs={24} sm={12} lg={4}>
                <Card 
                  className="shadow-md hover:shadow-lg transition-all duration-200 rounded-xl border-0"
                  style={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white'
                  }}
                  bodyStyle={{ padding: '20px' }}
                >
                  <Statistic
                    title={<span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13 }}>Tổng báo giá</span>}
                    value={stats.total}
                    prefix={<FileTextOutlined style={{ color: 'white', fontSize: 18 }} />}
                    valueStyle={{ color: 'white', fontSize: 28, fontWeight: 'bold' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={4}>
                <Card 
                  className="shadow-md hover:shadow-lg transition-all duration-200 rounded-xl border-0"
                  style={{ 
                    background: 'linear-gradient(135deg, #13c2c2 0%, #0891b2 100%)',
                    color: 'white'
                  }}
                  bodyStyle={{ padding: '20px' }}
                >
                  <Statistic
                    title={<span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13 }}>Đã gửi</span>}
                    value={stats.sent}
                    prefix={<ClockCircleOutlined style={{ color: 'white', fontSize: 18 }} />}
                    valueStyle={{ color: 'white', fontSize: 28, fontWeight: 'bold' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={4}>
                <Card 
                  className="shadow-md hover:shadow-lg transition-all duration-200 rounded-xl border-0"
                  style={{ 
                    background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                    color: 'white'
                  }}
                  bodyStyle={{ padding: '20px' }}
                >
                  <Statistic
                    title={<span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13 }}>Đã chấp nhận</span>}
                    value={stats.accepted}
                    prefix={<CheckCircleOutlined style={{ color: 'white', fontSize: 18 }} />}
                    valueStyle={{ color: 'white', fontSize: 28, fontWeight: 'bold' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={4}>
                <Card 
                  className="shadow-md hover:shadow-lg transition-all duration-200 rounded-xl border-0"
                  style={{ 
                    background: 'linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%)',
                    color: 'white'
                  }}
                  bodyStyle={{ padding: '20px' }}
                >
                  <Statistic
                    title={<span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13 }}>Từ chối</span>}
                    value={stats.rejected}
                    prefix={<CloseCircleOutlined style={{ color: 'white', fontSize: 18 }} />}
                    valueStyle={{ color: 'white', fontSize: 28, fontWeight: 'bold' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={4}>
                <Card 
                  className="shadow-md hover:shadow-lg transition-all duration-200 rounded-xl border-0"
                  style={{ 
                    background: 'linear-gradient(135deg, #722ed1 0%, #531dab 100%)',
                    color: 'white'
                  }}
                  bodyStyle={{ padding: '20px' }}
                >
                  <Statistic
                    title={<span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13 }}>Đã chuyển đơn</span>}
                    value={stats.converted}
                    prefix={<DollarOutlined style={{ color: 'white', fontSize: 18 }} />}
                    valueStyle={{ color: 'white', fontSize: 28, fontWeight: 'bold' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={4}>
                <Card 
                  className="shadow-md hover:shadow-lg transition-all duration-200 rounded-xl border-0"
                  style={{ 
                    background: 'linear-gradient(135deg, #8c8c8c 0%, #595959 100%)',
                    color: 'white'
                  }}
                  bodyStyle={{ padding: '20px' }}
                >
                  <Statistic
                    title={<span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13 }}>Nháp</span>}
                    value={stats.draft}
                    prefix={<FileTextOutlined style={{ color: 'white', fontSize: 18 }} />}
                    valueStyle={{ color: 'white', fontSize: 28, fontWeight: 'bold' }}
                  />
                </Card>
              </Col>
            </Row>

            {/* Search Bar */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <div className="flex flex-col gap-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <SearchOutlined className="text-blue-600" />
                  Tìm kiếm báo giá
                </h3>
                <div className="flex gap-3 flex-col md:flex-row">
                  <Input
                    placeholder="Nhập mã báo giá hoặc ghi chú để tìm kiếm..."
                    prefix={<SearchOutlined style={{ color: '#667eea' }} />}
                    size="large"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    onPressEnter={handleSearch}
                    allowClear
                    onClear={handleSearchClear}
                    className="flex-1"
                    style={{ 
                      borderRadius: 10,
                      border: '2px solid #e5e7eb'
                    }}
                  />
                  <Button
                    type="primary"
                    size="large"
                    icon={<SearchOutlined />}
                    onClick={handleSearch}
                    loading={loading}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-0 font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                    style={{ 
                      minWidth: 120,
                      height: 44,
                      borderRadius: 10
                    }}
                  >
                    Tìm kiếm
                  </Button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">
                      Danh sách báo giá
                    </h2>
                    <p className="text-blue-100">
                      {totalItems > 0 ? `Tổng cộng ${totalItems} báo giá` : 'Không có dữ liệu'}
                    </p>
                  </div>
                  {searchQuery && (
                    <div className="bg-white bg-opacity-20 backdrop-blur-sm px-4 py-2 rounded-full border border-white border-opacity-30">
                      <span className="text-white text-sm font-medium">
                        🔍 "{searchQuery}"
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <Spin spinning={loading}>
                <div style={{ padding: '0', overflowX: 'auto' }}>
                  <Table
                    columns={columns}
                    dataSource={quotations}
                    rowKey="_id"
                    pagination={{
                      current: currentPage,
                      pageSize: pageSize,
                      total: totalItems,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total, range) => (
                        <Text style={{ fontSize: 13, fontWeight: 500, color: '#667eea' }}>
                          Hiển thị {range[0]}-{range[1]} trong tổng số {total} báo giá
                        </Text>
                      ),
                      pageSizeOptions: ['10', '20', '50', '100'],
                      style: { padding: '12px 20px' },
                      responsive: true
                    }}
                    onChange={handleTableChange}
                    scroll={{ x: 1200 }}
                    className="quotation-table"
                    style={{
                      borderRadius: 0
                    }}
                    rowClassName={(_record, index) => 
                      index % 2 === 0 ? '' : 'bg-[#fafaff]'
                    }
                  />
                </div>
              </Spin>
            </div>
          </div>

      {/* Detail Modal */}
      <Modal
        title={
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 12,
            padding: '4px 0'
          }}>
            <div style={{
              width: 40,
              height: 40,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(102, 126, 234, 0.25)'
            }}>
              <FileTextOutlined style={{ fontSize: 20, color: 'white' }} />
            </div>
            <div>
              <Text strong style={{ fontSize: 16, display: 'block', color: '#1a1a2e' }}>
                Chi tiết báo giá
              </Text>
              {selectedQuotation && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {selectedQuotation.code || selectedQuotation.quote_number || selectedQuotation._id}
                </Text>
              )}
            </div>
          </div>
        }
        open={showDetailModal}
        onCancel={() => setShowDetailModal(false)}
        width={900}
        footer={[
          <Button 
            key="close" 
            onClick={() => setShowDetailModal(false)}
            style={{
              borderRadius: 8,
              height: 40,
              minWidth: 120,
              fontSize: 14,
              fontWeight: 500,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none'
            }}
          >
            Đóng
          </Button>
        ]}
        styles={{
          body: { 
            maxHeight: '70vh', 
            overflowY: 'auto', 
            padding: '24px',
            background: '#fafafa'
          }
        }}
      >
        {loading && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: 400 
          }}>
            <Spin size="large" tip="Đang tải chi tiết báo giá..." />
          </div>
        )}
        
        {!loading && selectedQuotation && (
          <div>
            <Descriptions 
              bordered 
              column={2} 
              size="small" 
              className="mb-4"
              style={{
                background: 'white',
                borderRadius: 12,
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                border: '1px solid #e8eaed'
              }}
              labelStyle={{
                background: 'linear-gradient(135deg, #fafbfc 0%, #f6f8fb 100%)',
                fontWeight: 600,
                color: '#1a1a2e',
                fontSize: 13,
                padding: '10px 14px'
              }}
              contentStyle={{
                background: 'white',
                fontSize: 13,
                padding: '10px 14px',
                color: '#2c3e50'
              }}
            >
              <Descriptions.Item label="Mã báo giá" span={2}>
                <Text strong style={{ fontSize: 14 }}>
                  {selectedQuotation.code || selectedQuotation.quote_number || selectedQuotation._id}
                </Text>
              </Descriptions.Item>
              
              <Descriptions.Item label="Trạng thái">
                <Tag color={getStatusColor(selectedQuotation.status || 'valid')} style={{ fontSize: 13 }}>
                  {getStatusText(selectedQuotation.status || 'valid')}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Hoạt động">
                <Tag color={selectedQuotation.isActive !== false ? 'success' : 'default'}>
                  {selectedQuotation.isActive !== false ? 'Active' : 'Inactive'}
                </Tag>
              </Descriptions.Item>

              <Descriptions.Item label="Người tạo" span={2}>
                <div>
                  {typeof selectedQuotation.created_by === 'object' && selectedQuotation.created_by ? (
                    <>
                      <Text strong>{selectedQuotation.created_by.full_name || 'N/A'}</Text>
                      {selectedQuotation.created_by.email && (
                        <>
                          <br />
                          <Text type="secondary">{selectedQuotation.created_by.email}</Text>
                        </>
                      )}
                      {selectedQuotation.created_by.role && (
                        <Tag color="blue" style={{ marginLeft: 8 }}>{selectedQuotation.created_by.role}</Tag>
                      )}
                    </>
                  ) : (
                    <Text>{selectedQuotation.created_by_name || selectedQuotation.created_by || 'N/A'}</Text>
                  )}
                </div>
              </Descriptions.Item>

              {selectedQuotation.updated_by && (
                <Descriptions.Item label="Người cập nhật" span={2}>
                  <Text>
                    {typeof selectedQuotation.updated_by === 'object' 
                      ? selectedQuotation.updated_by.full_name 
                      : selectedQuotation.updated_by}
                  </Text>
                </Descriptions.Item>
              )}

              <Descriptions.Item label="Khách hàng" span={2}>
                <div>
                  {typeof selectedQuotation.customer_id === 'object' && selectedQuotation.customer_id ? (
                    <>
                      <Text strong>{selectedQuotation.customer_id.full_name || 'N/A'}</Text>
                      <br />
                      <Text type="secondary">📧 {selectedQuotation.customer_id.email || 'N/A'}</Text>
                      <br />
                      <Text type="secondary">📱 {selectedQuotation.customer_id.phone || 'N/A'}</Text>
                      {selectedQuotation.customer_id.address && (
                        <>
                          <br />
                          <Text type="secondary">📍 {selectedQuotation.customer_id.address}</Text>
                        </>
                      )}
                    </>
                  ) : (
                    <Text>{selectedQuotation.customer_name || `ID: ${selectedQuotation.customer_id}`}</Text>
                  )}
                </div>
              </Descriptions.Item>

              <Descriptions.Item label="Đại lý" span={2}>
                <div>
                  {typeof selectedQuotation.dealership_id === 'object' && selectedQuotation.dealership_id ? (
                    <>
                      <Text strong>{selectedQuotation.dealership_id.company_name || 'N/A'}</Text>
                      {selectedQuotation.dealership_id.code && (
                        <Tag color="purple" style={{ marginLeft: 8 }}>{selectedQuotation.dealership_id.code}</Tag>
                      )}
                    </>
                  ) : (
                    <Text>{selectedQuotation.dealership_name || selectedQuotation.dealership_id || 'N/A'}</Text>
                  )}
                </div>
              </Descriptions.Item>

              {selectedQuotation.createdAt && (
                <Descriptions.Item label="Ngày tạo">
                  {formatDate(selectedQuotation.createdAt)}
                </Descriptions.Item>
              )}
              {selectedQuotation.updatedAt && (
                <Descriptions.Item label="Ngày cập nhật">
                  {formatDate(selectedQuotation.updatedAt)}
                </Descriptions.Item>
              )}

              {selectedQuotation.startDate && (
                <Descriptions.Item label="📅 Ngày bắt đầu">
                  <Text strong style={{ color: '#1890ff' }}>
                    {formatDate(selectedQuotation.startDate)}
                  </Text>
                </Descriptions.Item>
              )}
              {selectedQuotation.endDate && (
                <Descriptions.Item label="⏰ Ngày kết thúc">
                  <Text strong style={{ 
                    color: new Date(selectedQuotation.endDate) < new Date() ? '#ff4d4f' : '#52c41a' 
                  }}>
                    {formatDate(selectedQuotation.endDate)}
                  </Text>
                  {new Date(selectedQuotation.endDate) < new Date() && (
                    <Tag color="red" style={{ marginLeft: 8 }}>Đã hết hạn</Tag>
                  )}
                </Descriptions.Item>
              )}

              {selectedQuotation.valid_until && (
                <Descriptions.Item label="Hiệu lực đến">
                  <Text strong style={{ color: new Date(selectedQuotation.valid_until) < new Date() ? '#ff4d4f' : '#52c41a' }}>
                    {formatDate(selectedQuotation.valid_until)}
                  </Text>
                </Descriptions.Item>
              )}

              <Descriptions.Item label="ID">
                <Text code style={{ fontSize: 11 }}>{selectedQuotation._id}</Text>
              </Descriptions.Item>
              
              {selectedQuotation.__v !== undefined && (
                <Descriptions.Item label="Version">
                  <Tag color="default">v{selectedQuotation.__v}</Tag>
                </Descriptions.Item>
              )}

              {selectedQuotation.sent_at && (
                <>
                  <Descriptions.Item label="Ngày gửi">
                    {formatDate(selectedQuotation.sent_at)}
                  </Descriptions.Item>
                </>
              )}

              {selectedQuotation.accepted_at && (
                <Descriptions.Item label="Ngày chấp nhận">
                  {formatDate(selectedQuotation.accepted_at)}
                </Descriptions.Item>
              )}

              {selectedQuotation.rejected_at && (
                <>
                  <Descriptions.Item label="Ngày từ chối">
                    {formatDate(selectedQuotation.rejected_at)}
                  </Descriptions.Item>
                  {selectedQuotation.rejection_reason && (
                    <Descriptions.Item label="Lý do từ chối" span={2}>
                      <Text type="danger">{selectedQuotation.rejection_reason}</Text>
                    </Descriptions.Item>
                  )}
                </>
              )}
            </Descriptions>

            <div style={{
              marginTop: 24,
              marginBottom: 16,
              padding: '14px 18px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.25)'
            }}>
              <div style={{
                width: 36,
                height: 36,
                background: 'rgba(255,255,255,0.25)',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                border: '1px solid rgba(255,255,255,0.3)'
              }}>
                🚗
              </div>
              <Title level={5} style={{ margin: 0, color: 'white', fontSize: 16, fontWeight: 600 }}>
                Chi tiết xe
              </Title>
            </div>
            
            {selectedQuotation.items.map((item, itemIndex) => (
              <Card 
                key={itemIndex} 
                style={{ 
                  marginBottom: 16, 
                  borderRadius: 12,
                  border: '1px solid #e8eaed',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  overflow: 'hidden'
                }}
              >
                <Row gutter={16}>
                  <Col span={24}>
                    <div style={{ 
                      marginBottom: 16, 
                      background: 'linear-gradient(135deg, #f8f9fe 0%, #fafaff 100%)',
                      borderRadius: 10,
                      padding: '12px 16px',
                      border: '1px solid #e8eaed'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 32,
                          height: 32,
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          borderRadius: 8,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: 16
                        }}>
                          🚗
                        </div>
                        <div style={{ flex: 1 }}>
                          <Text strong style={{ fontSize: 15, color: '#1a1a2e', display: 'block' }}>
                            {item.vehicle_name || 'N/A'}
                          </Text>
                          {item.vehicle_model && (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              Model: {item.vehicle_model}
                            </Text>
                          )}
                        </div>
                        {item.vehicle_id && (
                          <Tag color="purple" style={{ 
                            padding: '2px 8px',
                            fontSize: 11,
                            borderRadius: 6
                          }}>
                            ID: {item.vehicle_id}
                          </Tag>
                        )}
                      </div>
                    </div>
                  </Col>

                  <Col xs={24} sm={12} md={6}>
                    <div style={{
                      padding: '10px 12px',
                      background: '#fafbfc',
                      borderRadius: 8,
                      border: '1px solid #e8eaed'
                    }}>
                      <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>
                        🎨 Màu sắc
                      </Text>
                      <div>
                        {item.color ? (
                          <Tag color="blue" style={{ 
                            borderRadius: 4, 
                            padding: '2px 8px',
                            fontSize: 12
                          }}>
                            {item.color}
                          </Tag>
                        ) : <Text>-</Text>}
                      </div>
                    </div>
                  </Col>

                  <Col xs={24} sm={12} md={6}>
                    <div style={{
                      padding: '10px 12px',
                      background: '#fafbfc',
                      borderRadius: 8,
                      border: '1px solid #e8eaed'
                    }}>
                      <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>
                        📦 Số lượng
                      </Text>
                      <Text strong style={{ fontSize: 16, color: '#1a1a2e' }}>
                        {item.quantity}
                      </Text>
                    </div>
                  </Col>

                  <Col xs={24} sm={12} md={6}>
                    <div style={{
                      padding: '10px 12px',
                      background: '#fafbfc',
                      borderRadius: 8,
                      border: '1px solid #e8eaed'
                    }}>
                      <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>
                        💰 Đơn giá
                      </Text>
                      <Text strong style={{ fontSize: 14, color: '#1890ff' }}>
                        {formatPrice(item.vehicle_price || item.unit_price || 0)}
                      </Text>
                    </div>
                  </Col>

                  <Col xs={24} sm={12} md={6}>
                    <div style={{
                      padding: '10px 12px',
                      background: item.discount > 0 ? '#f6ffed' : '#fafbfc',
                      borderRadius: 8,
                      border: `1px solid ${item.discount > 0 ? '#b7eb8f' : '#e8eaed'}`
                    }}>
                      <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>
                        🎁 Giảm giá
                      </Text>
                      <Text strong style={{ 
                        fontSize: 14,
                        color: item.discount > 0 ? '#52c41a' : '#8c8c8c'
                      }}>
                        {item.discount > 0 ? `-${formatPrice(item.discount)}` : '-'}
                      </Text>
                    </div>
                  </Col>

                  {/* Promotion */}
                  {(item.promotion_id || item.promotion_name) && (
                    <Col span={24} style={{ marginTop: 12 }}>
                      <div style={{
                        padding: '10px 12px',
                        background: 'linear-gradient(135deg, #fff7e6 0%, #fffbe6 100%)',
                        borderRadius: 8,
                        border: '1px solid #ffd666'
                      }}>
                        <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 6 }}>
                          🎁 Khuyến mãi
                        </Text>
                        <Tag color="gold" style={{
                          padding: '3px 10px',
                          fontSize: 12,
                          borderRadius: 6
                        }}>
                          {item.promotion_name || item.promotion_id}
                        </Tag>
                      </div>
                    </Col>
                  )}

                  {/* Options */}
                  {item.options && item.options.length > 0 && (
                    <Col span={24} style={{ marginTop: 12 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>Tùy chọn bổ sung</Text>
                      <div style={{ marginTop: 4 }}>
                        {item.options.map((opt, optIdx) => (
                          <Tag key={optIdx} color="purple">
                            {opt.name || opt.option_id}
                            {opt.price && ` (+${formatPrice(opt.price)})`}
                          </Tag>
                        ))}
                      </div>
                    </Col>
                  )}

                  {/* Accessories */}
                  {item.accessories && item.accessories.length > 0 && (
                    <Col span={24} style={{ marginTop: 12 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>Phụ kiện</Text>
                      <div style={{ marginTop: 4 }}>
                        {item.accessories.map((acc, accIdx) => (
                          <Tag key={accIdx} color="green">
                            {acc.name || acc.accessory_id} x {acc.quantity}
                            {acc.unit_price && ` (${formatPrice(acc.unit_price)})`}
                          </Tag>
                        ))}
                      </div>
                    </Col>
                  )}

                  {/* Subtotal */}
                  <Col span={24} style={{ marginTop: 16 }}>
                    <div style={{ 
                      padding: '12px 16px',
                      background: 'linear-gradient(135deg, #f6ffed 0%, #f0f9ff 100%)',
                      borderRadius: 10,
                      border: '1px solid #b7eb8f',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <Text strong style={{ fontSize: 14, color: '#1a1a2e' }}>
                        💵 Thành tiền:
                      </Text>
                      <Text strong style={{ fontSize: 18, color: '#52c41a', fontWeight: 700 }}>
                        {formatPrice(item.final_amount || item.subtotal || (item.vehicle_price * item.quantity - item.discount))}
                      </Text>
                    </div>
                  </Col>
                </Row>
              </Card>
            ))}

            <div style={{ 
              marginTop: 20, 
              padding: '16px 20px', 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 12,
              color: 'white',
              boxShadow: '0 6px 16px rgba(102, 126, 234, 0.3)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: -30,
                right: -30,
                width: 120,
                height: 120,
                background: 'rgba(255,255,255,0.08)',
                borderRadius: '50%',
                filter: 'blur(40px)'
              }} />
              {selectedQuotation.total_amount && selectedQuotation.total_amount > 0 && (
                <Row gutter={16}>
                  <Col span={12}>
                    <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 15 }}>Tổng giá trị:</Text>
                  </Col>
                  <Col span={12} style={{ textAlign: 'right' }}>
                    <Text strong style={{ color: 'white', fontSize: 16 }}>
                      {formatPrice(selectedQuotation.total_amount)}
                    </Text>
                  </Col>
                </Row>
              )}
              
              {selectedQuotation.discount_amount && selectedQuotation.discount_amount > 0 && (
                <Row gutter={16} style={{ marginTop: 12 }}>
                  <Col span={12}>
                    <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 15 }}>Giảm giá:</Text>
                  </Col>
                  <Col span={12} style={{ textAlign: 'right' }}>
                    <Text strong style={{ color: '#52c41a', fontSize: 16, textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                      -{formatPrice(selectedQuotation.discount_amount)}
                    </Text>
                  </Col>
                </Row>
              )}

              {selectedQuotation.tax_amount && selectedQuotation.tax_amount > 0 && (
                <Row gutter={16} style={{ marginTop: 12 }}>
                  <Col span={12}>
                    <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 15 }}>Thuế:</Text>
                  </Col>
                  <Col span={12} style={{ textAlign: 'right' }}>
                    <Text strong style={{ color: '#ffd666', fontSize: 16 }}>
                      +{formatPrice(selectedQuotation.tax_amount)}
                    </Text>
                  </Col>
                </Row>
              )}

              <Row gutter={16} style={{ 
                marginTop: 12, 
                paddingTop: 12, 
                borderTop: '2px solid rgba(255,255,255,0.3)',
                position: 'relative'
              }}>
                <Col span={12}>
                  <Title level={5} style={{ margin: 0, color: 'white', fontSize: 16, fontWeight: 600 }}>
                    💎 Tổng cộng:
                  </Title>
                </Col>
                <Col span={12} style={{ textAlign: 'right' }}>
                  <Title level={3} style={{ 
                    margin: 0, 
                    color: 'white', 
                    textShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    fontSize: 24,
                    fontWeight: 700
                  }}>
                    {formatPrice(selectedQuotation.final_amount || 
                      (selectedQuotation.items?.reduce((sum, item) => sum + (item.final_amount || 0), 0) || 0)
                    )}
                  </Title>
                </Col>
              </Row>
            </div>

            {selectedQuotation.notes && (
              <Card style={{ 
                marginTop: 16, 
                borderRadius: 10, 
                background: 'linear-gradient(135deg, #fffbe6 0%, #fff7e6 100%)', 
                border: '1px solid #ffd666',
                boxShadow: '0 2px 8px rgba(255, 193, 7, 0.1)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 12
                }}>
                  <div style={{
                    width: 28,
                    height: 28,
                    background: '#ffd666',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14
                  }}>
                    📝
                  </div>
                  <Title level={5} style={{ margin: 0, color: '#ad6800', fontSize: 15 }}>
                    Ghi chú
                  </Title>
                </div>
                <Text style={{ fontSize: 13, lineHeight: 1.6, color: '#595959' }}>
                  {selectedQuotation.notes}
                </Text>
              </Card>
            )}

            {/* API Raw Data Summary */}
            <Card 
              style={{ 
                marginTop: 20, 
                borderRadius: 12, 
                background: 'white',
                border: '1px solid #e8eaed',
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
              }}
            >
              <div style={{
                marginBottom: 16,
                padding: '14px 18px',
                background: 'linear-gradient(135deg, #f6f8fb 0%, #fafbfc 100%)',
                borderRadius: 10,
                border: '1px solid #e8eaed',
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}>
                <div style={{
                  width: 40,
                  height: 40,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: 20,
                  boxShadow: '0 2px 8px rgba(102, 126, 234, 0.25)'
                }}>
                  📊
                </div>
                <div>
                  <Title level={5} style={{ margin: 0, color: '#1a1a2e', fontSize: 16, fontWeight: 600 }}>
                    Tóm tắt báo giá
                  </Title>
                  <Text style={{ color: '#8c8c8c', fontSize: 12 }}>
                    Thông tin tổng quan về báo giá
                  </Text>
                </div>
              </div>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={8}>
                  <div style={{ 
                    padding: '12px 14px', 
                    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', 
                    borderRadius: 10,
                    border: '1px solid #bae7ff'
                  }}
                  >
                    <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>
                      Mã báo giá
                    </Text>
                    <Text strong style={{ fontSize: 14, color: '#667eea' }}>
                      {selectedQuotation.code}
                    </Text>
                  </div>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <div style={{ 
                    padding: 16, 
                    background: 'white', 
                    borderRadius: 8,
                    border: '1px solid #e8eaed'
                  }}>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                      Trạng thái
                    </Text>
                    <Tag color={getStatusColor(selectedQuotation.status || 'valid')} style={{ fontSize: 13 }}>
                      {getStatusText(selectedQuotation.status || 'valid')}
                    </Tag>
                  </div>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <div style={{ 
                    padding: 16, 
                    background: 'white', 
                    borderRadius: 8,
                    border: '1px solid #e8eaed'
                  }}>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                      Tổng tiền cuối cùng
                    </Text>
                    <Text strong style={{ fontSize: 16, color: '#52c41a' }}>
                      {formatPrice(selectedQuotation.final_amount || 0)}
                    </Text>
                  </div>
                </Col>
                {selectedQuotation.startDate && (
                  <Col xs={24} sm={12} md={8}>
                    <div style={{ 
                      padding: 16, 
                      background: 'white', 
                      borderRadius: 8,
                      border: '1px solid #e8eaed'
                    }}>
                      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                        📅 Ngày bắt đầu
                      </Text>
                      <Text strong style={{ fontSize: 14, color: '#1890ff' }}>
                        {new Date(selectedQuotation.startDate).toLocaleDateString('vi-VN')}
                      </Text>
                    </div>
                  </Col>
                )}
                {selectedQuotation.endDate && (
                  <Col xs={24} sm={12} md={8}>
                    <div style={{ 
                      padding: 16, 
                      background: 'white', 
                      borderRadius: 8,
                      border: '1px solid #e8eaed'
                    }}>
                      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                        ⏰ Ngày kết thúc
                      </Text>
                      <Text strong style={{ 
                        fontSize: 14,
                        color: new Date(selectedQuotation.endDate) < new Date() ? '#ff4d4f' : '#52c41a'
                      }}>
                        {new Date(selectedQuotation.endDate).toLocaleDateString('vi-VN')}
                      </Text>
                    </div>
                  </Col>
                )}
                <Col xs={24} sm={12} md={8}>
                  <div style={{ 
                    padding: 16, 
                    background: 'white', 
                    borderRadius: 8,
                    border: '1px solid #e8eaed'
                  }}>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                      Số lượng xe
                    </Text>
                    <Text strong style={{ fontSize: 15 }}>
                      {selectedQuotation.items.reduce((sum, item) => sum + item.quantity, 0)} xe
                    </Text>
                  </div>
                </Col>
              </Row>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
};

