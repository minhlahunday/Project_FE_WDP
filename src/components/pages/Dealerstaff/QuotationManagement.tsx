import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Snackbar,
  Alert,
  Divider,
  Stack,
  Grid,
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  Description as FileTextIcon,
  Send as SendIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  ShoppingCart as ShoppingCartIcon,
} from '@mui/icons-material';
import { 
  Modal,
  message,
  Spin,
  Descriptions,
  Tag,
  Row,
  Col,
  Statistic,
  Typography as AntTypography,
  Table as AntTable,
} from 'antd';

const { Text, Title } = AntTypography;
import {
  FileTextOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { authService } from '../../../services/authService';
import { accessoryService, Accessory } from '../../../services/accessoryService';
import { optionService, VehicleOption } from '../../../services/optionService';
import { customerService } from '../../../services/customerService';
import '../../../styles/quotation-management.css';


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
      quantity?: number;
      price?: number;
      amount?: number;
      value?: number;
      cost?: number;
      unit_price?: number;
    }>;
    accessories?: Array<{
      accessory_id?: string;
      name?: string;
      quantity: number;
      unit_price?: number;
      price?: number;
      amount?: number;
      value?: number;
      cost?: number;
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
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [accessoriesCatalog, setAccessoriesCatalog] = useState<Accessory[]>([]);
  const [optionsCatalog, setOptionsCatalog] = useState<VehicleOption[]>([]);
  const [creatorInfo, setCreatorInfo] = useState<{
    full_name?: string;
    email?: string;
    role?: string;
  } | null>(null);
  const [customerInfo, setCustomerInfo] = useState<{
    full_name: string;
    email?: string;
    phone?: string;
    address?: string;
  } | null>(null);
  const [dealershipInfo, setDealershipInfo] = useState<{
    company_name: string;
    code?: string;
    address?: string;
  } | null>(null);
  // Cache customer names for table display
  const [customerNamesMap, setCustomerNamesMap] = useState<Record<string, string>>({});

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    valid: 0,
    expired: 0,
    canceled: 0,
    invalid: 0,
    used: 0,
    converted: 0
  });

  // Snackbar state
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Helper function to show snackbar
  const showSnackbarMessage = (msg: string, severity: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setSnackbar({ open: true, message: msg, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Handle navigate to quote-to-order page
  const handleNavigateToConverter = () => {
    navigate('/portal/quote-to-order');
  };

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
      let loadedQuotations: Quotation[] = [];
      
      if (response?.data) {
        // Case 1: data is an object with quotes array
        if (!Array.isArray(response.data) && 'quotes' in response.data && Array.isArray(response.data.quotes)) {
          console.log('📦 Case 1: data.quotes array found');
          console.log('📋 First quote sample:', response.data.quotes[0]);
          loadedQuotations = response.data.quotes;
          calculateStats(loadedQuotations);
          
          // Set pagination info
          if (response.data.pagination) {
            setTotalItems(response.data.pagination.total);
          }
        } 
        // Case 2: data is directly an array of quotations
        else if (Array.isArray(response.data)) {
          console.log('📦 Case 2: data is array');
          loadedQuotations = response.data;
          calculateStats(loadedQuotations);
          setTotalItems(loadedQuotations.length);
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
            loadedQuotations = foundQuotes;
            calculateStats(loadedQuotations);
            
            // Try to find pagination info
            const pagination = dataObj.pagination as { total?: number } | undefined;
            if (pagination?.total) {
              setTotalItems(pagination.total);
              console.log('📄 Pagination total:', pagination.total);
            } else {
              setTotalItems(loadedQuotations.length);
            }
          } else {
            console.error('❌ Could not find quotations array in response');
            console.error('📊 Available keys:', Object.keys(dataObj));
            setQuotations([]);
            setTotalItems(0);
            return;
          }
        }
      } else {
        console.warn('⚠️ No data in response:', response);
        setQuotations([]);
        setTotalItems(0);
        return;
      }

      // Fetch customer names for quotations with string customer_id
      const customerIdsToFetch = new Set<string>();
      loadedQuotations.forEach(quote => {
        if (typeof quote.customer_id === 'string' && !customerNamesMap[quote.customer_id]) {
          customerIdsToFetch.add(quote.customer_id);
        }
      });

      if (customerIdsToFetch.size > 0) {
        console.log('🔍 Fetching customer names for', customerIdsToFetch.size, 'customers');
        const newCustomerNamesMap = { ...customerNamesMap };
        
        // Fetch customer info in parallel
        await Promise.allSettled(
          Array.from(customerIdsToFetch).map(async (customerId) => {
            try {
              const customer = await customerService.getCustomerById(customerId);
              newCustomerNamesMap[customerId] = customer.name || 'N/A';
              console.log(`✅ Fetched customer name for ${customerId}:`, newCustomerNamesMap[customerId]);
            } catch (error) {
              console.error(`❌ Error fetching customer ${customerId}:`, error);
              newCustomerNamesMap[customerId] = 'N/A';
            }
          })
        );
        
        setCustomerNamesMap(newCustomerNamesMap);
      }

      setQuotations(loadedQuotations);
    } catch (error) {
      console.error(' Error loading quotations:', error);
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
      valid: data.filter(q => q.status === 'valid' || !q.status).length,
      expired: data.filter(q => q.status === 'expired').length,
      canceled: data.filter(q => q.status === 'canceled' || q.status === 'cancelled').length,
      invalid: data.filter(q => q.status === 'invalid').length,
      used: data.filter(q => q.status === 'used').length,
      converted: data.filter(q => q.status === 'converted').length
    };
    setStats(newStats);
  };

  // Load accessories and options catalog for price lookup
  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        const [accessories, options] = await Promise.all([
          accessoryService.getAccessories(),
          optionService.getOptions()
        ]);
        setAccessoriesCatalog(accessories);
        setOptionsCatalog(options);
        console.log('✅ Loaded catalogs - Accessories:', accessories.length, 'Options:', options.length);
      } catch (error) {
        console.error('❌ Error loading catalogs:', error);
      }
    };
    loadCatalogs();
  }, []);

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
      
      // Enrich with catalog prices if missing
      const enrichedData = { ...detailData };
      console.log('📦 Raw quotation data from API:', JSON.stringify(detailData, null, 2));
      
      if (enrichedData.items) {
        console.log('📦 Raw items:', enrichedData.items);
        enrichedData.items.forEach((item, itemIndex) => {
          console.log(`📦 Item ${itemIndex}:`, {
            vehicle: item.vehicle_name,
            accessories: item.accessories,
            options: item.options
          });
        });
        
        enrichedData.items = enrichedData.items.map(item => {
          const enrichedItem = { ...item };
          
          // Enrich accessories with catalog prices
          if (enrichedItem.accessories && enrichedItem.accessories.length > 0) {
            console.log('🔍 Processing accessories for item:', enrichedItem.vehicle_name, 'Accessories:', enrichedItem.accessories);
            enrichedItem.accessories = enrichedItem.accessories.map(acc => {
              const accObj = acc as Record<string, unknown>;
              // Preserve quantity - check explicitly for undefined/null, not just falsy
              // quantity can be 0 (though unlikely), so we need to check for undefined/null specifically
              const rawQuantity = acc.quantity;
              const accQuantity = (rawQuantity !== undefined && rawQuantity !== null && rawQuantity > 0) ? rawQuantity : 1;
              
              console.log('🔍 Accessory before enrich:', { 
                accessory_id: acc.accessory_id, 
                name: acc.name, 
                rawQuantity: rawQuantity,
                processedQuantity: accQuantity,
                price: accObj.price,
                unit_price: accObj.unit_price,
                fullAccessory: acc
              });
              
              // If no price, try to find in catalog
              if (!accObj.price && !accObj.unit_price && acc.accessory_id) {
                const catalogAcc = accessoriesCatalog.find(a => a._id === acc.accessory_id);
                if (catalogAcc?.price) {
                  console.log('💰 Found accessory price from catalog:', acc.accessory_id, catalogAcc.price, 'Quantity:', accQuantity);
                  return { 
                    ...acc, 
                    unit_price: catalogAcc.price, 
                    price: catalogAcc.price, 
                    quantity: accQuantity 
                  };
                }
              }
              // Ensure quantity is preserved - always return with quantity
              const enrichedAcc = { ...acc, quantity: accQuantity };
              console.log('✅ Accessory after enrich:', enrichedAcc);
              return enrichedAcc;
            });
            console.log('✅ Accessories after enrich:', enrichedItem.accessories);
          }
          
          // Enrich options with catalog prices
          if (enrichedItem.options && enrichedItem.options.length > 0) {
            console.log('🔍 Processing options for item:', enrichedItem.vehicle_name, 'Options:', enrichedItem.options);
            enrichedItem.options = enrichedItem.options.map(opt => {
              const optObj = opt as Record<string, unknown>;
              // Preserve quantity - check explicitly for undefined/null, not just falsy
              const rawQuantity = opt.quantity;
              const optQuantity = (rawQuantity !== undefined && rawQuantity !== null && rawQuantity > 0) ? rawQuantity : 1;
              
              console.log('🔍 Option before enrich:', { 
                option_id: opt.option_id, 
                name: opt.name, 
                rawQuantity: rawQuantity,
                processedQuantity: optQuantity,
                price: optObj.price,
                fullOption: opt
              });
              
              // If no price, try to find in catalog
              if (!optObj.price && opt.option_id) {
                const catalogOpt = optionsCatalog.find(o => o._id === opt.option_id);
                if (catalogOpt?.price) {
                  console.log('💰 Found option price from catalog:', opt.option_id, catalogOpt.price, 'Quantity:', optQuantity);
                  return { ...opt, price: catalogOpt.price, quantity: optQuantity };
                }
              }
              // Ensure quantity is set even if price exists - always return with quantity
              const enrichedOpt = { ...opt, quantity: optQuantity };
              console.log('✅ Option after enrich:', enrichedOpt);
              return enrichedOpt;
            });
            console.log('✅ Options after enrich:', enrichedItem.options);
          }
          
          return enrichedItem;
        });
      }
      
      // Fetch creator info if created_by is a string ID
      let creatorData = null;
      if (enrichedData.created_by) {
        if (typeof enrichedData.created_by === 'object' && enrichedData.created_by !== null) {
          // Already populated
          creatorData = {
            full_name: enrichedData.created_by.full_name,
            email: enrichedData.created_by.email,
            role: enrichedData.created_by.role
          };
          console.log('✅ Creator info from populated data:', creatorData);
        } else if (typeof enrichedData.created_by === 'string') {
          // Need to fetch
          try {
            console.log('🔍 Fetching creator info for ID:', enrichedData.created_by);
            const userResponse = await authService.getUserById(enrichedData.created_by);
            if (userResponse.success && userResponse.data) {
              const user = userResponse.data as unknown as Record<string, unknown>;
              creatorData = {
                full_name: (user.full_name as string) || (user.name as string) || '',
                email: (user.email as string) || '',
                role: (user.role as string) || ((user.role_id as { name?: string })?.name) || ''
              };
              console.log('✅ Creator info fetched:', creatorData);
            }
          } catch (error) {
            console.error('❌ Error fetching creator info:', error);
          }
        }
      }
      
      // Fetch customer info if customer_id is a string ID
      let customerData = null;
      if (enrichedData.customer_id) {
        if (typeof enrichedData.customer_id === 'object' && enrichedData.customer_id !== null) {
          // Already populated
          customerData = {
            full_name: enrichedData.customer_id.full_name,
            email: enrichedData.customer_id.email,
            phone: enrichedData.customer_id.phone,
            address: enrichedData.customer_id.address
          };
          console.log('✅ Customer info from populated data:', customerData);
        } else if (typeof enrichedData.customer_id === 'string') {
          // Need to fetch
          try {
            console.log('🔍 Fetching customer info for ID:', enrichedData.customer_id);
            const customer = await customerService.getCustomerById(enrichedData.customer_id);
            customerData = {
              full_name: customer.name || '',
              email: customer.email || '',
              phone: customer.phone || '',
              address: customer.address || ''
            };
            console.log('✅ Customer info fetched:', customerData);
          } catch (error) {
            console.error('❌ Error fetching customer info:', error);
          }
        }
      }
      
      // Fetch dealership info if dealership_id is a string ID
      let dealershipData = null;
      if (enrichedData.dealership_id) {
        if (typeof enrichedData.dealership_id === 'object' && enrichedData.dealership_id !== null) {
          // Already populated
          dealershipData = {
            company_name: enrichedData.dealership_id.company_name || '',
            code: enrichedData.dealership_id.code,
            address: ''
          };
          console.log('✅ Dealership info from populated data:', dealershipData);
        } else if (typeof enrichedData.dealership_id === 'string') {
          // Need to fetch
          try {
            console.log('🔍 Fetching dealership info for ID:', enrichedData.dealership_id);
            const dealerResponse = await authService.getDealerById(enrichedData.dealership_id);
            if (dealerResponse.success && dealerResponse.data) {
              const dealer = dealerResponse.data as Record<string, unknown>;
              dealershipData = {
                company_name: (dealer.company_name as string) || (dealer.name as string) || '',
                code: dealer.code as string,
                address: (dealer.address as string) || ''
              };
              console.log('✅ Dealership info fetched:', dealershipData);
            }
          } catch (error) {
            console.error('❌ Error fetching dealership info:', error);
          }
        }
      }
      
      console.log('📋 Setting quotation detail (enriched):', enrichedData);
      console.log('📊 Items with prices and quantities:', enrichedData.items?.map(item => ({
        vehicle: item.vehicle_name,
        accessories: item.accessories?.map(acc => ({ 
          name: acc.name, 
          accessory_id: acc.accessory_id,
          quantity: acc.quantity || 1,
          price: (acc as Record<string, unknown>).price || (acc as Record<string, unknown>).unit_price 
        })),
        options: item.options?.map(opt => ({ 
          name: opt.name, 
          option_id: opt.option_id,
          quantity: opt.quantity || 1,
          price: (opt as Record<string, unknown>).price 
        }))
      })));
      setSelectedQuotation(enrichedData);
      setCreatorInfo(creatorData);
      setCustomerInfo(customerData);
      setDealershipInfo(dealershipData);
      setShowDetailModal(true);
    } catch (error) {
      console.error('❌ Error fetching quotation detail:', error);
      message.error('Không thể tải chi tiết báo giá');
      // Fallback: show current data
      setSelectedQuotation(quotation);
      setCreatorInfo(null);
      setCustomerInfo(null);
      setDealershipInfo(null);
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
                <div style={{ fontWeight: 600, marginBottom: 4 }}> Hủy báo giá thành công!</div>
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

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      valid: '#52c41a',      // Green
      expired: '#faad14',    // Orange
      canceled: '#f5222d',   // Red
      cancelled: '#f5222d',  // Red
      invalid: '#8c8c8c',    // Gray
      used: '#1890ff',       // Blue
      converted: '#1890ff'   // Blue
    };
    return colors[status] || '#8c8c8c';
  };

  const getStatusColorForTag = (status: string): string => {
    const colorMap: Record<string, string> = {
      valid: '#52c41a',      // Green
      expired: '#faad14',    // Orange
      canceled: '#ff4d4f',   // Red
      cancelled: '#ff4d4f',  // Red
      invalid: '#d9d9d9',    // Gray
      used: '#1890ff',       // Blue
      converted: '#1890ff'   // Blue
    };
    return colorMap[status] || '#d9d9d9';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      valid: 'Còn hiệu lực',
      expired: 'Hết hạn',
      canceled: 'Đã hủy',
      cancelled: 'Đã hủy',
      invalid: 'Không hợp lệ',
      used: 'Đã chuyển đổi',
      converted: 'Đã chuyển đổi'
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
                      {customerPhone}
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
      title: <span style={{ fontWeight: 600, color: '#1a1a2e', fontSize: 14 }}>Xe</span>,
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
      title: <span style={{ fontWeight: 600, color: '#1a1a2e', fontSize: 14 }}>Tổng giá trị</span>,
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
      title: <span style={{ fontWeight: 600, color: '#1a1a2e', fontSize: 14 }}> Ngày tạo</span>,
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
              size="medium"
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
                size="medium"
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
    <Box sx={{ p: 3, bgcolor: 'grey.50', minHeight: '100vh' }}>
      <Card>
        <CardContent>
          <Box sx={{ mb: 3 }}>
            <Box display="flex" alignItems="center" gap={1} mb={3}>
              <FileTextIcon color="primary" sx={{ fontSize: 32 }} />
              <Typography variant="h4" component="h1" fontWeight="bold">
                Quản lý báo giá
              </Typography>
            </Box>


            {/* Filter Section */}
            <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={2} alignItems="center" mb={3}>
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
              </Box>
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
                        <TableCell>Khách hàng</TableCell>
                        <TableCell>Xe</TableCell>
                        <TableCell align="right">Tổng tiền</TableCell>
                        <TableCell>Ngày tạo</TableCell>
                        <TableCell>Trạng thái</TableCell>
                        <TableCell align="center">Hành động</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {quotations.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} align="center">
                            <Typography color="text.secondary" py={2}>
                              Không tìm thấy báo giá nào
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        quotations.map((quote) => {
                          const currentStatus = quote.status || 'valid';
                          const isAlreadyCanceled = currentStatus === 'cancelled' || currentStatus === 'canceled';
                          const validUntil = quote.valid_until || quote.endDate;
                          const isExpired = validUntil && new Date(validUntil) < new Date();
                          const canCancel = !isAlreadyCanceled && !isExpired;
                          
                          // Get customer name
                          let customerName = 'N/A';
                          if (quote.customer_name) {
                            customerName = quote.customer_name;
                          } else if (typeof quote.customer_id === 'object' && quote.customer_id) {
                            customerName = quote.customer_id.full_name || 'N/A';
                          } else if (typeof quote.customer_id === 'string') {
                            // Use cached customer name
                            customerName = customerNamesMap[quote.customer_id] || 'Đang tải...';
                          }
                          
                          // Get total amount
                          let totalAmount = quote.final_amount || quote.total_amount || 0;
                          if (!totalAmount && quote.items && quote.items.length > 0) {
                            totalAmount = quote.items.reduce((sum, item) => sum + (item.final_amount || item.vehicle_price * item.quantity), 0);
                          }
                          
                          // Get vehicles
                          const vehicleNames = quote.items?.slice(0, 2).map(item => item.vehicle_name || 'N/A').join(', ') || 'N/A';
                          
                          return (
                            <TableRow key={quote._id} hover>
                              <TableCell>
                                <Typography variant="body2" sx={{ fontFamily: 'monospace' }} color="primary">
                                  {quote.code || quote._id}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">{customerName}</Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">{vehicleNames}</Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" fontWeight="medium">
                                  {formatPrice(totalAmount)}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {quote.createdAt ? new Date(quote.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Tag 
                                  style={{ 
                                    backgroundColor: getStatusColorForTag(currentStatus),
                                    color: '#fff',
                                    border: 'none',
                                    fontSize: 13, 
                                    fontWeight: 600, 
                                    padding: '4px 12px', 
                                    borderRadius: 20 
                                  }}
                                >
                                  {getStatusText(currentStatus)}
                                </Tag>
                              </TableCell>
                              <TableCell align="center">
                                <Box display="flex" gap={1} justifyContent="center">
                                  <Button 
                                    variant="contained"
                                    size="small"
                                    startIcon={<VisibilityIcon sx={{ fontSize: 16 }} />}
                                    onClick={() => handleViewDetail(quote)}
                                    sx={{ 
                                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                      '&:hover': {
                                        background: 'linear-gradient(135deg, #5568d3 0%, #6a3f91 100%)',
                                      }
                                    }}
                                  >
                                    Xem
                                  </Button>
                                  <Tooltip title={isAlreadyCanceled ? 'Báo giá đã bị hủy' : isExpired ? 'Báo giá đã hết hạn' : 'Hủy báo giá'}>
                                    <span>
                                      <IconButton
                                        color="error"
                                        size="small"
                                        onClick={() => handleDeleteQuotation(quote)}
                                        disabled={!canCancel}
                                      >
                                        <DeleteIcon />
                                      </IconButton>
                                    </span>
                                  </Tooltip>
                                </Box>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Pagination */}
                {totalItems > 0 && (
                  <Box display="flex" justifyContent="center" mt={3} mb={1}>
                    <Pagination
                      count={Math.ceil(totalItems / pageSize)}
                      page={currentPage}
                      onChange={(_event, page) => {
                        setCurrentPage(page);
                        handleTableChange({ current: page, pageSize });
                      }}
                      color="primary"
                      showFirstButton
                      showLastButton
                    />
                  </Box>
                )}

                {totalItems > 0 && (
                  <Box mt={1}>
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                      Hiển thị {quotations.length} trong tổng số {totalItems} báo giá
                    </Typography>
                  </Box>
                )}
              </>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Detail Modal - Keep using Ant Design Modal for now */}
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
        onCancel={() => {
          setShowDetailModal(false);
          setCreatorInfo(null);
          setCustomerInfo(null);
          setDealershipInfo(null);
        }}
        width={900}
        footer={[
          <Button 
            key="convert"
            variant="contained"
            startIcon={<ShoppingCartIcon />}
            onClick={handleNavigateToConverter}
            disabled={selectedQuotation?.status !== 'valid'}
            style={{
              borderRadius: 8,
              height: 40,
              minWidth: 180,
              fontSize: 14,
              fontWeight: 600,
              marginRight: 8,
              background: selectedQuotation?.status === 'valid' 
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : '#d9d9d9',
              color: 'white',
              border: 'none'
            }}
          >
            Đến trang chuyển đổi
          </Button>,
          <Button 
            key="close" 
            onClick={() => setShowDetailModal(false)}
            style={{
              borderRadius: 8,
              height: 40,
              minWidth: 120,
              fontSize: 14,
              fontWeight: 500,
              background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
              color: '#1a1a2e',
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
                fontWeight: 700,
                color: '#1a1a2e',
                fontSize: 14,
                padding: '12px 16px'
              }}
              contentStyle={{
                background: 'white',
                fontSize: 14,
                padding: '12px 16px',
                color: '#1a1a2e',
                fontWeight: 500
              }}
            >
              <Descriptions.Item label="Mã báo giá" span={2}>
                <Text strong style={{ fontSize: 15, fontWeight: 600, color: '#1a1a2e' }}>
                  {selectedQuotation.code || selectedQuotation.quote_number || selectedQuotation._id}
                </Text>
              </Descriptions.Item>
              
              <Descriptions.Item label="Trạng thái">
                <Tag 
                  style={{ 
                    backgroundColor: getStatusColorForTag(selectedQuotation.status || 'valid'),
                    color: '#fff',
                    border: 'none',
                    fontSize: 14, 
                    fontWeight: 600, 
                    padding: '6px 14px', 
                    borderRadius: 6 
                  }}
                >
                  {getStatusText(selectedQuotation.status || 'valid')}
                </Tag>
              </Descriptions.Item>
              {/* <Descriptions.Item label="Hoạt động">
                <Tag color={selectedQuotation.isActive !== false ? 'success' : 'default'}>
                  {selectedQuotation.isActive !== false ? 'Active' : 'Inactive'}
                </Tag>
              </Descriptions.Item> */}

              {(() => {
                // Check if we have any creator info to display
                const createdByObj = typeof selectedQuotation.created_by === 'object' && selectedQuotation.created_by !== null 
                  ? selectedQuotation.created_by 
                  : null;
                const hasCreatorObject = createdByObj && createdByObj.full_name;
                const hasCreatorInfo = creatorInfo && creatorInfo.full_name;
                const hasCreatorName = selectedQuotation.created_by_name;
                const hasCreatorId = selectedQuotation.created_by && typeof selectedQuotation.created_by === 'string';
                
                // Only show if we have some creator information
                if (!hasCreatorObject && !hasCreatorInfo && !hasCreatorName && !hasCreatorId) {
                  return null;
                }
                
                return (
                  <Descriptions.Item label="Người tạo" span={2}>
                    <div>
                      {(() => {
                        // Check populated created_by object
                        if (hasCreatorObject && createdByObj) {
                          return (
                            <>
                              <Text strong style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e' }}>{createdByObj.full_name}</Text>
                              {createdByObj.email && (
                                <>
                                  <br />
                                  <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>{createdByObj.email}</Text>
                                </>
                              )}
                              {createdByObj.role && (
                                <Tag color="blue" style={{ marginLeft: 8, fontWeight: 600 }}>{createdByObj.role}</Tag>
                              )}
                            </>
                          );
                        }
                        
                        // Check fetched creator info
                        if (hasCreatorInfo && creatorInfo) {
                          return (
                            <>
                              <Text strong style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e' }}>{creatorInfo.full_name}</Text>
                              {creatorInfo.email && (
                                <>
                                  <br />
                                  <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>{creatorInfo.email}</Text>
                                </>
                              )}
                              {creatorInfo.role && (
                                <Tag color="blue" style={{ marginLeft: 8, fontWeight: 600 }}>{creatorInfo.role}</Tag>
                              )}
                            </>
                          );
                        }
                        
                        // Check created_by_name
                        if (hasCreatorName) {
                          return <Text strong style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e' }}>{selectedQuotation.created_by_name}</Text>;
                        }
                        
                        // Check created_by as string ID
                        if (hasCreatorId && typeof selectedQuotation.created_by === 'string') {
                          return <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>ID: {selectedQuotation.created_by}</Text>;
                        }
                        
                        return null;
                      })()}
                    </div>
                  </Descriptions.Item>
                );
              })()}

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
                  {(() => {
                    // Priority 1: Use populated customer_id object
                    if (typeof selectedQuotation.customer_id === 'object' && selectedQuotation.customer_id) {
                      return (
                        <>
                          <Text strong style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e' }}>{selectedQuotation.customer_id.full_name || 'N/A'}</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}> {selectedQuotation.customer_id.email || 'N/A'}</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}> {selectedQuotation.customer_id.phone || 'N/A'}</Text>
                          {selectedQuotation.customer_id.address && (
                            <>
                              <br />
                              <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}> {selectedQuotation.customer_id.address}</Text>
                            </>
                          )}
                        </>
                      );
                    }
                    
                    // Priority 2: Use fetched customerInfo
                    if (customerInfo) {
                      return (
                        <>
                          <Text strong style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e' }}>{customerInfo.full_name || 'N/A'}</Text>
                          {customerInfo.email && (
                            <>
                              <br />
                              <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>{customerInfo.email}</Text>
                            </>
                          )}
                          {customerInfo.phone && (
                            <>
                              <br />
                              <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>{customerInfo.phone}</Text>
                            </>
                          )}
                          {customerInfo.address && (
                            <>
                              <br />
                              <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>{customerInfo.address}</Text>
                            </>
                          )}
                        </>
                      );
                    }
                    
                    // Priority 3: Use customer_name if available
                    if (selectedQuotation.customer_name) {
                      return <Text strong style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e' }}>{selectedQuotation.customer_name}</Text>;
                    }
                    
                    // Fallback: Show ID (should not happen if fetch was successful)
                    return <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>Đang tải thông tin khách hàng...</Text>;
                  })()}
                </div>
              </Descriptions.Item>

              <Descriptions.Item label="Đại lý" span={2}>
                <div>
                  {(() => {
                    // Priority 1: Use populated dealership_id object
                    if (typeof selectedQuotation.dealership_id === 'object' && selectedQuotation.dealership_id) {
                      return (
                        <>
                          <Text strong style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e' }}>{selectedQuotation.dealership_id.company_name || 'N/A'}</Text>
                          {selectedQuotation.dealership_id.code && (
                            <Tag color="purple" style={{ marginLeft: 8, fontWeight: 600 }}>{selectedQuotation.dealership_id.code}</Tag>
                          )}
                        </>
                      );
                    }
                    
                    // Priority 2: Use fetched dealershipInfo
                    if (dealershipInfo) {
                      return (
                        <>
                          <Text strong style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e' }}>{dealershipInfo.company_name || 'N/A'}</Text>
                          {dealershipInfo.code && (
                            <Tag color="purple" style={{ marginLeft: 8, fontWeight: 600 }}>{dealershipInfo.code}</Tag>
                          )}
                        </>
                      );
                    }
                    
                    // Priority 3: Use dealership_name if available
                    if (selectedQuotation.dealership_name) {
                      return <Text strong style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e' }}>{selectedQuotation.dealership_name}</Text>;
                    }
                    
                    // Fallback: Show loading message (should not happen if fetch was successful)
                    return <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>Đang tải thông tin đại lý...</Text>;
                  })()}
                </div>
              </Descriptions.Item>

              {/* {selectedQuotation.createdAt && (
                <Descriptions.Item label="Ngày tạo">
                  {formatDate(selectedQuotation.createdAt)}
                </Descriptions.Item>
              )} */}
              {/* {selectedQuotation.updatedAt && (
                <Descriptions.Item label="Ngày cập nhật">
                  {formatDate(selectedQuotation.updatedAt)}
                </Descriptions.Item>
              )} */}

              {selectedQuotation.startDate && (
                <Descriptions.Item label=" Ngày bắt đầu">
                  <Text strong style={{ color: '#1890ff', fontSize: 14, fontWeight: 600 }}>
                    {formatDate(selectedQuotation.startDate)}
                  </Text>
                </Descriptions.Item>
              )}
              {selectedQuotation.endDate && (
                <Descriptions.Item label=" Ngày kết thúc">
                  <Text strong style={{ 
                    color: new Date(selectedQuotation.endDate) < new Date() ? '#ff4d4f' : '#52c41a',
                    fontSize: 14,
                    fontWeight: 600
                  }}>
                    {formatDate(selectedQuotation.endDate)}
                  </Text>
                  {new Date(selectedQuotation.endDate) < new Date() && (
                    <Tag color="red" style={{ marginLeft: 8, fontWeight: 600 }}>Đã hết hạn</Tag>
                  )}
                </Descriptions.Item>
              )}

              {selectedQuotation.valid_until && (
                <Descriptions.Item label="Hiệu lực đến">
                  <Text strong style={{ 
                    color: new Date(selectedQuotation.valid_until) < new Date() ? '#ff4d4f' : '#52c41a',
                    fontSize: 14,
                    fontWeight: 600
                  }}>
                    {formatDate(selectedQuotation.valid_until)}
                  </Text>
                </Descriptions.Item>
              )}

              {/* <Descriptions.Item label="ID">
                <Text code style={{ fontSize: 11 }}>{selectedQuotation._id}</Text>
              </Descriptions.Item> */}
              
              {/* {selectedQuotation.__v !== undefined && (
                <Descriptions.Item label="Version">
                  <Tag color="default">v{selectedQuotation.__v}</Tag>
                </Descriptions.Item>
              )} */}

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

            {/* Title Section */}
            <div style={{
              marginTop: 24,
              marginBottom: 16,
              padding: '14px 18px',
              background: '#fafafa',
              borderRadius: 8,
              borderLeft: '4px solid #1890ff'
            }}>
              <Title level={5} style={{ margin: 0, color: '#262626', fontSize: 16, fontWeight: 600 }}>
                Chi tiết báo giá
              </Title>
              <Text type="secondary" style={{ fontSize: 13 }}>
                {selectedQuotation.code}
              </Text>
            </div>

            {/* Table Section */}
            <div style={{ 
              background: 'white', 
              borderRadius: 8, 
              overflow: 'hidden',
              border: '1px solid #d9d9d9'
            }}>
              <AntTable
                dataSource={(() => {
                  const tableData: Array<{
                    key: string;
                    stt: number;
                    tenHangHoa: string;
                    donViTinh: string;
                    soLuong: number;
                    donGia: number;
                    thanhTien: number;
                  }> = [];
                  let stt = 1;

                  // Helper function to extract price from various possible fields
                  const getPrice = (obj: Record<string, unknown>, defaultPrice = 0): number => {
                    const price = obj.price || obj.unit_price || obj.amount || obj.value || obj.cost;
                    if (typeof price === 'number') {
                      return price > 0 ? price : defaultPrice;
                    }
                    if (typeof price === 'string') {
                      const parsed = parseFloat(price);
                      return !isNaN(parsed) && parsed > 0 ? parsed : defaultPrice;
                    }
                    return defaultPrice;
                  };

                  // Add vehicles
                  selectedQuotation.items.forEach((item) => {
                    const vehicleName = item.vehicle_name || 'N/A';
                    const colorText = item.color ? ` (Màu ${item.color})` : '';
                    const vehiclePrice = item.vehicle_price || item.unit_price || 0;
                    
                    tableData.push({
                      key: `vehicle-${stt}`,
                      stt: stt++,
                      tenHangHoa: `${vehicleName}${colorText}`,
                      donViTinh: 'Chiếc',
                      soLuong: item.quantity,
                      donGia: vehiclePrice,
                      thanhTien: vehiclePrice * item.quantity
                    });

                    // Add accessories
                    if (item.accessories && item.accessories.length > 0) {
                      console.log('🔍 Processing accessories for table - Item:', item.vehicle_name, 'Accessories count:', item.accessories.length);
                      item.accessories.forEach((acc, accIndex) => {
                        const accObj = acc as Record<string, unknown>;
                        const accPrice = getPrice(accObj);
                        const accQuantity = (acc.quantity !== undefined && acc.quantity !== null) ? acc.quantity : 1;
                        
                        console.log(`🔍 Accessory ${accIndex}:`, {
                          accessory_id: acc.accessory_id,
                          name: acc.name,
                          quantity: acc.quantity,
                          rawQuantity: accQuantity,
                          price: accPrice,
                          calculatedTotal: accPrice * accQuantity
                        });
                        
                        tableData.push({
                          key: `accessory-${stt}`,
                          stt: stt++,
                          tenHangHoa: acc.name || acc.accessory_id || 'Phụ kiện',
                          donViTinh: 'Cái',
                          soLuong: accQuantity,
                          donGia: accPrice,
                          thanhTien: accPrice * accQuantity
                        });
                      });
                    }

                    // Add options
                    if (item.options && item.options.length > 0) {
                      console.log('🔍 Processing options for table - Item:', item.vehicle_name, 'Options count:', item.options.length);
                      item.options.forEach((opt, optIndex) => {
                        const optObj = opt as Record<string, unknown>;
                        const optPrice = getPrice(optObj);
                        const optQuantity = (opt.quantity !== undefined && opt.quantity !== null) ? opt.quantity : 1;
                        
                        console.log(`🔍 Option ${optIndex}:`, {
                          option_id: opt.option_id,
                          name: opt.name,
                          quantity: opt.quantity,
                          rawQuantity: optQuantity,
                          price: optPrice,
                          calculatedTotal: optPrice * optQuantity
                        });
                        
                        tableData.push({
                          key: `option-${stt}`,
                          stt: stt++,
                          tenHangHoa: opt.name || opt.option_id || 'Tùy chọn',
                          donViTinh: 'Bộ',
                          soLuong: optQuantity,
                          donGia: optPrice,
                          thanhTien: optPrice * optQuantity
                        });
                      });
                    }
                  });

                  console.log('📊 Table data generated:', tableData);
                  return tableData;
                })()}
                columns={[
                  {
                    title: <Text strong style={{ color: '#262626', fontSize: 13 }}>STT</Text>,
                    dataIndex: 'stt',
                    key: 'stt',
                    width: 60,
                    align: 'center' as const,
                    render: (text: number) => <Text style={{ fontSize: 13, color: '#595959' }}>{text}</Text>
                  },
                  {
                    title: <Text strong style={{ color: '#262626', fontSize: 13 }}>Tên hàng hóa, dịch vụ</Text>,
                    dataIndex: 'tenHangHoa',
                    key: 'tenHangHoa',
                    width: 300,
                    render: (text: string) => <Text style={{ fontSize: 13, color: '#262626' }}>{text}</Text>
                  },
                  {
                    title: <Text strong style={{ color: '#262626', fontSize: 13 }}>Đơn vị tính</Text>,
                    dataIndex: 'donViTinh',
                    key: 'donViTinh',
                    width: 100,
                    align: 'center' as const,
                    render: (text: string) => <Text style={{ fontSize: 13, color: '#595959' }}>{text}</Text>
                  },
                  {
                    title: <Text strong style={{ color: '#262626', fontSize: 13 }}>Số lượng</Text>,
                    dataIndex: 'soLuong',
                    key: 'soLuong',
                    width: 80,
                    align: 'center' as const,
                    render: (text: number) => <Text style={{ fontSize: 13, color: '#262626' }}>{text}</Text>
                  },
                  {
                    title: <Text strong style={{ color: '#262626', fontSize: 13 }}>Đơn giá</Text>,
                    dataIndex: 'donGia',
                    key: 'donGia',
                    width: 120,
                    align: 'right' as const,
                    render: (price: number) => (
                      <Text style={{ fontSize: 13, color: '#595959' }}>{new Intl.NumberFormat('vi-VN').format(price)} ₫</Text>
                    )
                  },
                  {
                    title: (
                      <div>
                        <Text strong style={{ color: '#262626', fontSize: 13 }}>Thành tiền</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 11, fontWeight: 400 }}>
                          (Thành tiền = Số lượng × Đơn giá)
                        </Text>
                      </div>
                    ),
                    dataIndex: 'thanhTien',
                    key: 'thanhTien',
                    width: 150,
                    align: 'right' as const,
                    render: (amount: number) => (
                      <Text style={{ fontSize: 13, color: '#262626' }}>{new Intl.NumberFormat('vi-VN').format(amount)} ₫</Text>
                    )
                  }
                ]}
                pagination={false}
                size="small"
                bordered
                style={{
                  background: 'white'
                }}
                components={{
                  header: {
                    cell: (props: React.HTMLAttributes<HTMLTableCellElement>) => (
                      <th {...props} style={{ 
                        ...props.style, 
                        backgroundColor: '#fafafa',
                        borderBottom: '2px solid #d9d9d9',
                        color: '#262626',
                        fontWeight: 600
                      }} />
                    )
                  }
                }}
                rowClassName={() => ''}
              />

              {/* Total Row */}
              <div style={{
                padding: '12px 16px',
                background: '#fafafa',
                borderTop: '2px solid #d9d9d9',
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: 24
              }}>
                <Text strong style={{ fontSize: 14, color: '#262626' }}>Tổng cộng tiền thanh toán:</Text>
                <Text strong style={{ fontSize: 16, color: '#cf1322', minWidth: 150, textAlign: 'right' }}>
                  {new Intl.NumberFormat('vi-VN').format(
                      ((): number => {
                        // Calculate total from items exactly as displayed in table
                        let total = 0;
                        selectedQuotation.items.forEach((item) => {
                          // Vehicle total
                          const vehiclePrice = item.vehicle_price || item.unit_price || 0;
                          total += vehiclePrice * item.quantity;
                          
                          // Helper to get price from various fields
                          const getPrice = (obj: Record<string, unknown>): number => {
                            const price = obj.price || obj.unit_price || obj.amount || obj.value || obj.cost;
                            if (typeof price === 'number') return price > 0 ? price : 0;
                            if (typeof price === 'string') {
                              const parsed = parseFloat(price);
                              return !isNaN(parsed) && parsed > 0 ? parsed : 0;
                            }
                            return 0;
                          };
                          
                          // Add accessories with quantity
                          if (item.accessories && item.accessories.length > 0) {
                            item.accessories.forEach(acc => {
                              const accObj = acc as Record<string, unknown>;
                              const accPrice = getPrice(accObj);
                              const accQuantity = (acc.quantity !== undefined && acc.quantity !== null) ? acc.quantity : 1;
                              console.log('💰 Calculating accessory total:', acc.name, 'Price:', accPrice, 'Quantity:', accQuantity, 'Total:', accPrice * accQuantity);
                              total += accPrice * accQuantity;
                            });
                          }
                          
                          // Add options with quantity
                          if (item.options && item.options.length > 0) {
                            item.options.forEach(opt => {
                              const optObj = opt as Record<string, unknown>;
                              const optPrice = getPrice(optObj);
                              const optQuantity = (opt.quantity !== undefined && opt.quantity !== null) ? opt.quantity : 1;
                              console.log('💰 Calculating option total:', opt.name, 'Price:', optPrice, 'Quantity:', optQuantity, 'Total:', optPrice * optQuantity);
                              total += optPrice * optQuantity;
                            });
                          }
                        });
                        console.log('💰 Final calculated total:', total);
                        return total;
                      })()
                    )} ₫
                  </Text>
              </div>
            </div>

            {/* Valid Until Date */}
            {(selectedQuotation.valid_until || selectedQuotation.endDate) && (
              <div style={{
                marginTop: 16,
                textAlign: 'center',
                padding: '14px',
                background: 'linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%)',
                borderRadius: 10,
                border: '1px solid #ffa940'
              }}>
                <Text style={{ fontSize: 14, color: '#ad6800', fontWeight: 600 }}>
                  Báo giá có hiệu lực đến: {formatDate(selectedQuotation.valid_until || selectedQuotation.endDate || '')}
                </Text>
              </div>
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
                
                <div>
                  <Title level={5} style={{ margin: 0, color: '#1a1a2e', fontSize: 18, fontWeight: 600 }}>
                    Tóm tắt báo giá
                  </Title>
                  <Text style={{ color: '#8c8c8c', fontSize: 13 }}>
                    Thông tin tổng quan về báo giá
                  </Text>
                </div>
              </div>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={8}>
                  <div style={{ 
                    padding: '16px 18px', 
                    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', 
                    borderRadius: 12,
                    border: '1px solid #bae7ff',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
                  }}
                  >
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6, fontWeight: 500 }}>
                      Mã báo giá
                    </Text>
                    <Text strong style={{ fontSize: 15, color: '#1a1a2e' }}>
                      {selectedQuotation.code}
                    </Text>
                  </div>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <div style={{ 
                    padding: '16px 18px', 
                    background: 'white', 
                    borderRadius: 12,
                    border: '1px solid #e8eaed',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
                  }}>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6, fontWeight: 500 }}>
                      Trạng thái
                    </Text>
                    <Tag 
                      style={{ 
                        backgroundColor: getStatusColorForTag(selectedQuotation.status || 'valid'),
                        color: '#fff',
                        border: 'none',
                        fontSize: 13, 
                        padding: '4px 12px', 
                        borderRadius: 6 
                      }}
                    >
                      {getStatusText(selectedQuotation.status || 'valid')}
                    </Tag>
                  </div>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <div style={{ 
                    padding: '16px 18px', 
                    background: 'linear-gradient(135deg, #f0fff4 0%, #d9f7be 100%)', 
                    borderRadius: 12,
                    border: '1px solid #b7eb8f',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
                  }}>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6, fontWeight: 500 }}>
                      Tổng tiền cuối cùng
                    </Text>
                    <Text strong style={{ fontSize: 17, color: '#1a1a2e' }}>
                      {formatPrice(selectedQuotation.final_amount || 0)}
                    </Text>
                  </div>
                </Col>
                {selectedQuotation.startDate && (
                  <Col xs={24} sm={12} md={8}>
                    <div style={{ 
                      padding: '16px 18px', 
                      background: 'white', 
                      borderRadius: 12,
                      border: '1px solid #e8eaed',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
                    }}>
                      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6, fontWeight: 500 }}>
                        Ngày bắt đầu
                      </Text>
                      <Text strong style={{ fontSize: 15, color: '#1a1a2e' }}>
                        {new Date(selectedQuotation.startDate).toLocaleDateString('vi-VN')}
                      </Text>
                    </div>
                  </Col>
                )}
                {selectedQuotation.endDate && (
                  <Col xs={24} sm={12} md={8}>
                    <div style={{ 
                      padding: '16px 18px', 
                      background: 'white', 
                      borderRadius: 12,
                      border: '1px solid #e8eaed',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
                    }}>
                      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6, fontWeight: 500 }}>
                        Ngày kết thúc
                      </Text>
                      <Text strong style={{ 
                        fontSize: 15,
                        color: new Date(selectedQuotation.endDate) < new Date() ? '#ff4d4f' : '#1a1a2e'
                      }}>
                        {new Date(selectedQuotation.endDate).toLocaleDateString('vi-VN')}
                      </Text>
                    </div>
                  </Col>
                )}
                <Col xs={24} sm={12} md={8}>
                  <div style={{ 
                    padding: '16px 18px', 
                    background: 'white', 
                    borderRadius: 12,
                    border: '1px solid #e8eaed',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
                  }}>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6, fontWeight: 500 }}>
                      Số lượng xe
                    </Text>
                    <Text strong style={{ fontSize: 15, color: '#1a1a2e' }}>
                      {selectedQuotation.items.reduce((sum, item) => sum + item.quantity, 0)} xe
                    </Text>
                  </div>
                </Col>
              </Row>
            </Card>
          </div>
        )}
      </Modal>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

