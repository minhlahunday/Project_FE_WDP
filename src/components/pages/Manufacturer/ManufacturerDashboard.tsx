import React, { useState, useEffect, useRef } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Typography, 
  Space,
  Spin,
  Empty,
  Alert
} from 'antd';
import {
  DollarOutlined,
  ShoppingCartOutlined,
  ShopOutlined,
  StockOutlined,
  ArrowUpOutlined,
  BarChartOutlined,
  PieChartOutlined
} from '@ant-design/icons';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { reportService, SalesByDealership, DealerStock } from '../../../services/reportService';
import { organizationService, Dealership } from '../../../services/organizationService';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

const { Title } = Typography;

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalDealerships: number;
  totalStock: number;
  // revenueGrowth: number;
  // orderGrowth: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

export const ManufacturerDashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalOrders: 0,
    totalDealerships: 0,
    totalStock: 0,
    // revenueGrowth: 0,
    // orderGrowth: 0
  });
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month')
  ]);
  const [selectedDealership, setSelectedDealership] = useState<string | undefined>(undefined);
  const [showDealershipDropdown, setShowDealershipDropdown] = useState(false);
  const dealershipDropdownRef = useRef<HTMLDivElement>(null);
  
  // Data states
  const [salesByDealership, setSalesByDealership] = useState<SalesByDealership[]>([]);
  const [dealerStock, setDealerStock] = useState<DealerStock[]>([]);
  const [dealerships, setDealerships] = useState<Dealership[]>([]);
  const [error, setError] = useState<{ sales?: string; stock?: string }>({});

  useEffect(() => {
    loadDealerships();
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [dateRange, selectedDealership]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dealershipDropdownRef.current && !dealershipDropdownRef.current.contains(event.target as Node)) {
        setShowDealershipDropdown(false);
      }
    };

    if (showDealershipDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDealershipDropdown]);

  const loadDealerships = async () => {
    try {
      console.log('🔄 Loading dealerships...');
      const response = await organizationService.getDealerships();
      console.log('✅ Dealerships API response:', response);
      
      // Handle different response structures
      let dealers: Dealership[] = [];
      
      if (response.success) {
        // Try multiple possible response structures
        if (Array.isArray(response.data?.data?.data)) {
          dealers = response.data.data.data;
        } else if (Array.isArray(response.data?.data)) {
          dealers = response.data.data;
        } else if (Array.isArray(response.data)) {
          dealers = response.data;
        }
        
        console.log('✅ Loaded dealerships:', dealers);
        setDealerships(dealers);
      } else {
        console.warn('⚠️ Failed to load dealerships:', response.message);
        setDealerships([]);
      }
    } catch (error: any) {
      console.error('❌ Error loading dealerships:', error);
      console.error('❌ Error details:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status
      });
      setDealerships([]);
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');
      
      console.log('📊 Loading dashboard data:', { startDate, endDate, selectedDealership });
      
      // Fetch all data in parallel
      const [salesData, stockData] = await Promise.allSettled([
        reportService.getSalesByDealership(startDate, endDate, selectedDealership),
        reportService.getDealerStock()
      ]);

      // Handle sales data
      if (salesData.status === 'fulfilled') {
        console.log('✅ Sales data loaded:', salesData.value);
        console.log('✅ Sales data sample:', salesData.value[0]);
        setSalesByDealership(salesData.value);
        const totalRevenue = salesData.value.reduce((sum, item) => sum + (item.total_revenue || 0), 0);
        const totalOrders = salesData.value.reduce((sum, item) => sum + (item.total_orders || 0), 0);
        setStats(prev => ({
          ...prev,
          totalRevenue,
          totalOrders,
          totalDealerships: salesData.value.length
        }));
        setError(prev => ({ ...prev, sales: undefined }));
      } else {
        console.error('❌ Failed to load sales:', salesData.reason);
        setSalesByDealership([]);
        const errorReason = salesData.reason as any;
        const status = errorReason?.response?.status || errorReason?.status;
        if (status === 403) {
          setError(prev => ({ 
            ...prev, 
            sales: 'Bạn không có quyền truy cập dữ liệu doanh số. Backend hiện chỉ cho phép DEALER_MANAGER và ADMIN. Vui lòng liên hệ quản trị viên để được cấp quyền EVM_STAFF.' 
          }));
        } else {
          const errorMsg = errorReason?.response?.data?.message || errorReason?.message || 'Không thể tải dữ liệu doanh số. Vui lòng thử lại sau.';
          setError(prev => ({ 
            ...prev, 
            sales: errorMsg
          }));
        }
      }

      // Handle stock data
      if (stockData.status === 'fulfilled') {
        console.log('✅ Stock data loaded:', stockData.value);
        setDealerStock(stockData.value);
        const totalStock = stockData.value.reduce((sum, item) => sum + (item.total_stock || item.totalVehicles || 0), 0);
        setStats(prev => ({
          ...prev,
          totalStock
        }));
        setError(prev => ({ ...prev, stock: undefined }));
      } else {
        console.error('❌ Failed to load stock:', stockData.reason);
        setDealerStock([]);
        const errorReason = stockData.reason as any;
        const status = errorReason?.response?.status || errorReason?.status;
        if (status === 403) {
          setError(prev => ({ 
            ...prev, 
            stock: 'Bạn không có quyền truy cập dữ liệu tồn kho. Backend hiện chỉ cho phép DEALER_MANAGER và ADMIN. Vui lòng liên hệ quản trị viên để được cấp quyền EVM_STAFF.' 
          }));
        } else {
          const errorMsg = errorReason?.response?.data?.message || errorReason?.message || 'Không thể tải dữ liệu tồn kho. Vui lòng thử lại sau.';
          setError(prev => ({ 
            ...prev, 
            stock: errorMsg
          }));
        }
      }
      
      // // Mock growth data (can be calculated from previous period)
      // setStats(prev => ({
      //   ...prev,
      //   revenueGrowth: 15.2,
      //   orderGrowth: 10.5
      // }));
      
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (startDate: string, endDate: string) => {
    if (startDate && endDate) {
      setDateRange([dayjs(startDate), dayjs(endDate)]);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value);
  };

  // Prepare chart data
  const salesChartData = salesByDealership.map((item, index) => {
    const chartItem = {
      name: item.dealership_name && item.dealership_name.length > 15 
        ? item.dealership_name.substring(0, 15) + '...' 
        : item.dealership_name || 'Unknown',
      fullName: item.dealership_name || 'Unknown',
      doanhThu: Number(item.total_revenue) || 0,
      donHang: Number(item.total_orders) || 0,
      xeBan: Number(item.total_vehicles_sold) || 0
    };
    console.log(`📊 Chart data item ${index}:`, chartItem);
    return chartItem;
  });
  
  console.log('📊 Full salesChartData:', salesChartData);

  const stockChartData = dealerStock.map(item => ({
    name: item.dealership_name && item.dealership_name.length > 15 
      ? item.dealership_name.substring(0, 15) + '...' 
      : item.dealership_name || 'Unknown',
    fullName: item.dealership_name || 'Unknown',
    tonKho: item.total_stock || item.totalVehicles || 0
  }));

  const revenuePieData = salesByDealership
    .filter(item => (item.total_revenue || 0) > 0)
    .sort((a, b) => (b.total_revenue || 0) - (a.total_revenue || 0))
    .slice(0, 8)
    .map(item => ({
      name: item.dealership_name && item.dealership_name.length > 20 
        ? item.dealership_name.substring(0, 20) + '...' 
        : item.dealership_name || 'Unknown',
      value: item.total_revenue || 0
    }));

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      <Card style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
          <Col>
            <Title level={2} style={{ margin: 0 }}>
              <ShopOutlined style={{ marginRight: 8, color: '#1890ff' }} />
              Dashboard Hãng - Doanh số & Tồn kho
            </Title>
          </Col>
          <Col>
            <div className="flex items-center gap-4">
              {/* Custom Select Dropdown */}
              <div className="relative" ref={dealershipDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowDealershipDropdown(!showDealershipDropdown)}
                  disabled={loading}
                  className="px-4 py-2.5 w-48 text-left bg-white border border-blue-300 rounded-lg shadow-sm hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className={selectedDealership ? 'text-gray-900' : 'text-gray-500'}>
                    {loading 
                      ? 'Đang tải...'
                      : selectedDealership 
                        ? dealerships.find(d => d._id === selectedDealership)?.name || 'Tất cả đại lý'
                        : 'Tất cả đại lý'
                    }
                  </span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showDealershipDropdown && !loading && (
                  <div className="absolute z-50 w-48 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDealership(undefined);
                        setShowDealershipDropdown(false);
                      }}
                      className={`w-full px-4 py-2 text-left hover:bg-blue-50 transition-colors ${
                        !selectedDealership ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'
                      }`}
                    >
                      Tất cả đại lý
                    </button>
                    {dealerships.length === 0 ? (
                      <div className="px-4 py-2 text-sm text-gray-500 text-center">
                        Không có đại lý
                      </div>
                    ) : (
                      dealerships.map(dealership => (
                        <button
                          key={dealership._id}
                          type="button"
                          onClick={() => {
                            setSelectedDealership(dealership._id);
                            setShowDealershipDropdown(false);
                          }}
                          className={`w-full px-4 py-2 text-left hover:bg-blue-50 transition-colors ${
                            selectedDealership === dealership._id 
                              ? 'bg-blue-50 text-blue-600 font-medium' 
                              : 'text-gray-700'
                          }`}
                        >
                          {dealership.name}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Custom Date Range Picker */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    type="date"
                    value={dateRange[0].format('YYYY-MM-DD')}
                    onChange={(e) => {
                      if (e.target.value) {
                        handleDateRangeChange(e.target.value, dateRange[1].format('YYYY-MM-DD'));
                      }
                    }}
                    className="px-4 py-2.5 w-40 bg-white border border-blue-300 rounded-lg shadow-sm hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900"
                  />
                  <label className="absolute -top-2 left-3 px-1 bg-white text-xs text-gray-500">
                    Từ ngày
                  </label>
                </div>
                <span className="text-gray-400">-</span>
                <div className="relative">
                  <input
                    type="date"
                    value={dateRange[1].format('YYYY-MM-DD')}
                    onChange={(e) => {
                      if (e.target.value) {
                        handleDateRangeChange(dateRange[0].format('YYYY-MM-DD'), e.target.value);
                      }
                    }}
                    className="px-4 py-2.5 w-40 bg-white border border-blue-300 rounded-lg shadow-sm hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900"
                  />
                  <label className="absolute -top-2 left-3 px-1 bg-white text-xs text-gray-500">
                    Đến ngày
                  </label>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      <Spin spinning={loading}>
        {/* Error Alerts - Always show if there are errors */}
        {(error.sales || error.stock) && (
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={24}>
              {error.sales && (
                <Alert
                  message="Lỗi tải dữ liệu doanh số"
                  description={error.sales}
                  type="error"
                  showIcon
                  closable
                  onClose={() => setError(prev => ({ ...prev, sales: undefined }))}
                  style={{ marginBottom: 16 }}
                  banner
                />
              )}
              {error.stock && (
                <Alert
                  message="Lỗi tải dữ liệu tồn kho"
                  description={error.stock}
                  type="error"
                  showIcon
                  closable
                  onClose={() => setError(prev => ({ ...prev, stock: undefined }))}
                  banner
                />
              )}
            </Col>
          </Row>
        )}

        {/* Info Alert when no data */}
        {!loading && !error.sales && !error.stock && salesByDealership.length === 0 && dealerStock.length === 0 && (
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={24}>
              <Alert
                message="Không có dữ liệu"
                description="Không tìm thấy dữ liệu doanh số hoặc tồn kho trong khoảng thời gian đã chọn. Vui lòng thử chọn khoảng thời gian khác hoặc kiểm tra lại quyền truy cập."
                type="info"
                showIcon
                closable
              />
            </Col>
          </Row>
        )}

        {/* Statistics Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card 
              style={{ 
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                border: 'none'
              }}
            >
              <Statistic
                title="Tổng doanh thu"
                value={stats.totalRevenue}
                precision={0}
                prefix={<DollarOutlined style={{ fontSize: 24, color: '#3f8600' }} />}
                formatter={(value) => formatCurrency(Number(value))}
                valueStyle={{ color: '#3f8600', fontSize: 20, fontWeight: 'bold' }}
                // suffix={
                //   <span style={{ fontSize: 14, color: '#3f8600', fontWeight: 500 }}>
                //     <ArrowUpOutlined /> {stats.revenueGrowth}%
                //   </span>
                // }
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card 
              style={{ 
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                border: 'none'
              }}
            >
              <Statistic
                title="Tổng đơn hàng"
                value={stats.totalOrders}
                prefix={<ShoppingCartOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff', fontSize: 20, fontWeight: 'bold' }}
                // suffix={
                //   <span style={{ fontSize: 14, color: '#1890ff', fontWeight: 500 }}>
                //     <ArrowUpOutlined /> {stats.orderGrowth}%
                //   </span>
                // }
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card 
              style={{ 
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
                border: 'none'
              }}
            >
              <Statistic
                title="Số đại lý"
                value={stats.totalDealerships}
                prefix={<ShopOutlined style={{ fontSize: 24, color: '#722ed1' }} />}
                valueStyle={{ color: '#722ed1', fontSize: 20, fontWeight: 'bold' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card 
              style={{ 
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
                border: 'none'
              }}
            >
              <Statistic
                title="Tổng tồn kho"
                value={stats.totalStock}
                prefix={<StockOutlined style={{ fontSize: 24, color: '#fa8c16' }} />}
                valueStyle={{ color: '#fa8c16', fontSize: 20, fontWeight: 'bold' }}
                suffix={<span style={{ fontSize: 16, fontWeight: 500 }}>xe</span>}
              />
            </Card>
          </Col>
        </Row>

        {/* Charts Row 1: Sales by Dealership */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={16}>
            <Card
              title={
                <Space>
                  <BarChartOutlined style={{ color: '#1890ff' }} />
                  <span>Doanh số theo đại lý</span>
                </Space>
              }
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
            >
              {salesChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={salesChartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      interval={0}
                      tick={{ fill: '#666', fontSize: 12 }}
                      stroke="#999"
                    />
                    <YAxis 
                      yAxisId="left" 
                      tick={{ fill: '#666', fontSize: 12 }}
                      stroke="#999"
                      tickFormatter={(value) => {
                        if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`;
                        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                        if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                        return value.toString();
                      }}
                    />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right"
                      tick={{ fill: '#666', fontSize: 12 }}
                      stroke="#999"
                    />
                    <Tooltip 
                      shared={false}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e8e8e8',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        padding: '10px'
                      }}
                      content={({ active, payload, label }) => {
                        if (!active || !payload || payload.length === 0) {
                          return null;
                        }
                        
                        const item = salesChartData.find(d => d.name === label);
                        const hoveredBar = payload[0];
                        
                        // Debug để xem payload chứa gì
                        if (process.env.NODE_ENV === 'development') {
                          console.log('🔍 Tooltip Debug:', {
                            payload,
                            hoveredBar,
                            dataKey: hoveredBar?.dataKey,
                            name: hoveredBar?.name,
                            value: hoveredBar?.value,
                            label
                          });
                        }
                        
                        if (!hoveredBar) {
                          return (
                            <div style={{ padding: '10px' }}>
                              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                                {item?.fullName || label}
                              </div>
                              <div>Không có dữ liệu</div>
                            </div>
                          );
                        }
                        
                        // Xác định loại dữ liệu từ dataKey hoặc name
                        const dataKey = hoveredBar.dataKey || '';
                        const name = hoveredBar.name || '';
                        const value = hoveredBar.value;
                        
                        const isRevenue = dataKey === 'doanhThu' || name === 'doanhThu' || name === 'Doanh thu';
                        const isOrders = dataKey === 'donHang' || name === 'donHang' || name === 'Đơn hàng';
                        
                        // Xác định background color
                        const bgColor = isRevenue ? '#e6f7ff' : isOrders ? '#f6ffed' : '#f5f5f5';
                        const borderColor = isRevenue ? '#91d5ff' : isOrders ? '#b7eb8f' : '#d9d9d9';
                        const textColor = isRevenue ? '#1890ff' : isOrders ? '#52c41a' : '#666';
                        
                        return (
                          <div style={{ padding: '10px', minWidth: '180px' }}>
                            <div style={{ 
                              marginBottom: '10px', 
                              fontWeight: 'bold', 
                              color: '#262626', 
                              fontSize: '14px',
                              borderBottom: '1px solid #f0f0f0',
                              paddingBottom: '6px'
                            }}>
                              {item?.fullName || label}
                            </div>
                            <div style={{ 
                              padding: '8px 10px', 
                              backgroundColor: bgColor,
                              borderRadius: '4px',
                              border: `1px solid ${borderColor}`
                            }}>
                              {isRevenue && (
                                <div style={{ color: textColor, fontSize: '13px' }}>
                                  <span style={{ marginRight: '6px', fontSize: '14px' }}>●</span>
                                  <span style={{ fontWeight: 500 }}>Doanh thu:</span>
                                  <div style={{ marginTop: '4px', fontWeight: 'bold', fontSize: '15px' }}>
                                    {formatCurrency(Number(value) || 0)}
                                  </div>
                                </div>
                              )}
                              {isOrders && (
                                <div style={{ color: textColor, fontSize: '13px' }}>
                                  <span style={{ marginRight: '6px', fontSize: '14px' }}>●</span>
                                  <span style={{ fontWeight: 500 }}>Đơn hàng:</span>
                                  <div style={{ marginTop: '4px', fontWeight: 'bold', fontSize: '15px' }}>
                                    {value !== undefined && value !== null ? value : 0}
                                  </div>
                                </div>
                              )}
                              {!isRevenue && !isOrders && (
                                <div style={{ color: textColor, fontSize: '13px' }}>
                                  <span style={{ marginRight: '6px', fontSize: '14px' }}>●</span>
                                  <span style={{ fontWeight: 500 }}>{name || dataKey || 'Giá trị'}:</span>
                                  <div style={{ marginTop: '4px', fontWeight: 'bold', fontSize: '15px' }}>
                                    {value !== undefined && value !== null 
                                      ? (typeof value === 'number' && value > 1000 
                                        ? formatCurrency(value) 
                                        : value)
                                      : 'N/A'
                                    }
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      }}
                    />
                    <defs>
                      {salesChartData.map((_, index) => (
                        <linearGradient key={`colorRevenue${index}`} id={`colorRevenue${index}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#1890ff" stopOpacity={0.9}/>
                          <stop offset="100%" stopColor="#0050b3" stopOpacity={0.9}/>
                        </linearGradient>
                      ))}
                      {salesChartData.map((_, index) => (
                        <linearGradient key={`colorOrders${index}`} id={`colorOrders${index}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#52c41a" stopOpacity={0.9}/>
                          <stop offset="100%" stopColor="#389e0d" stopOpacity={0.9}/>
                        </linearGradient>
                      ))}
                    </defs>
                    <Bar 
                      yAxisId="left"
                      dataKey="doanhThu" 
                      name="Doanh thu"
                      radius={[8, 8, 0, 0]}
                      fill="#1890ff"
                    >
                      {salesChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={`url(#colorRevenue${index})`} />
                      ))}
                    </Bar>
                    <Bar 
                      yAxisId="right"
                      dataKey="donHang" 
                      name="Đơn hàng"
                      radius={[8, 8, 0, 0]}
                      fill="#52c41a"
                    >
                      {salesChartData.map((_, index) => (
                        <Cell key={`cell-order-${index}`} fill={`url(#colorOrders${index})`} />
                      ))}
                    </Bar>
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="rect"
                      content={({ payload }) => (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '20px' }}>
                          {payload?.map((entry: any, index: number) => (
                            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span 
                                style={{ 
                                  display: 'inline-block', 
                                  width: '14px', 
                                  height: '14px', 
                                  backgroundColor: entry.value === 'Doanh thu' ? '#1890ff' : entry.value === 'Đơn hàng' ? '#52c41a' : '#999',
                                  borderRadius: '2px'
                                }} 
                              />
                              <span style={{ fontSize: '12px', color: '#666' }}>
                                {entry.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Empty description="Không có dữ liệu" />
              )}
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card
              title={
                <Space>
                  <PieChartOutlined style={{ color: '#722ed1' }} />
                  <span>Phân bổ doanh thu</span>
                </Space>
              }
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
            >
              {revenuePieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <defs>
                      {revenuePieData.map((_, index) => (
                        <linearGradient key={`pieGradient${index}`} id={`pieGradient${index}`} x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.9}/>
                          <stop offset="100%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.6}/>
                        </linearGradient>
                      ))}
                    </defs>
                    <Pie
                      data={revenuePieData}
                      cx="50%"
                      cy="45%"
                      labelLine={false}
                      label={({ name, percent }: any) => 
                        percent > 0.05 ? `${name.substring(0, 15)}: ${(percent * 100).toFixed(0)}%` : ''
                      }
                      outerRadius={100}
                      innerRadius={40}
                      fill="#8884d8"
                      dataKey="value"
                      paddingAngle={2}
                    >
                      {revenuePieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={`url(#pieGradient${index})`} stroke="#fff" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e8e8e8',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                      }}
                      formatter={(value: any) => formatCurrency(value)}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      iconType="circle"
                      wrapperStyle={{ paddingTop: '20px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Empty description="Không có dữ liệu" />
              )}
            </Card>
          </Col>
        </Row>

        {/* Charts Row 2: Stock by Dealership */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card
              title={
                <Space>
                  <StockOutlined style={{ color: '#fa8c16' }} />
                  <span>Tồn kho theo đại lý</span>
                </Space>
              }
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
            >
              {stockChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={stockChartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      interval={0}
                      tick={{ fill: '#666', fontSize: 12 }}
                      stroke="#999"
                    />
                    <YAxis 
                      tick={{ fill: '#666', fontSize: 12 }}
                      stroke="#999"
                    />
                    <Tooltip 
                      shared={false}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e8e8e8',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        padding: '10px'
                      }}
                      content={({ active, payload, label }) => {
                        if (!active || !payload || payload.length === 0) {
                          return null;
                        }
                        
                        const item = stockChartData.find(d => d.name === label);
                        const hoveredBar = payload[0];
                        
                        if (!hoveredBar) {
                          return (
                            <div style={{ padding: '10px' }}>
                              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                                {item?.fullName || label}
                              </div>
                              <div>Không có dữ liệu</div>
                            </div>
                          );
                        }
                        
                        const value = hoveredBar.value;
                        
                        return (
                          <div style={{ padding: '10px', minWidth: '180px' }}>
                            <div style={{ 
                              marginBottom: '10px', 
                              fontWeight: 'bold', 
                              color: '#262626', 
                              fontSize: '14px',
                              borderBottom: '1px solid #f0f0f0',
                              paddingBottom: '6px'
                            }}>
                              {item?.fullName || label}
                            </div>
                            <div style={{ 
                              padding: '8px 10px', 
                              backgroundColor: '#fff7ed',
                              borderRadius: '4px',
                              border: '1px solid #ffd591'
                            }}>
                              <div style={{ color: '#fa8c16', fontSize: '13px' }}>
                                <span style={{ marginRight: '6px', fontSize: '14px' }}>●</span>
                                <span style={{ fontWeight: 500 }}>Tồn kho:</span>
                                <div style={{ marginTop: '4px', fontWeight: 'bold', fontSize: '15px' }}>
                                  {value !== undefined && value !== null ? `${value} xe` : '0 xe'}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }}
                    />
                    <defs>
                      {stockChartData.map((_, index) => (
                        <linearGradient key={`colorStock${index}`} id={`colorStock${index}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#fa8c16" stopOpacity={0.9}/>
                          <stop offset="100%" stopColor="#d46b08" stopOpacity={0.9}/>
                        </linearGradient>
                      ))}
                    </defs>
                    <Bar 
                      dataKey="tonKho" 
                      name="Tồn kho"
                      radius={[8, 8, 0, 0]}
                      fill="#fa8c16"
                    >
                      {stockChartData.map((_, index) => (
                        <Cell key={`cell-stock-${index}`} fill={`url(#colorStock${index})`} />
                      ))}
                    </Bar>
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="rect"
                      content={({ payload }) => (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '20px' }}>
                          {payload?.map((entry: any, index: number) => (
                            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span 
                                style={{ 
                                  display: 'inline-block', 
                                  width: '14px', 
                                  height: '14px', 
                                  backgroundColor: '#fa8c16',
                                  borderRadius: '2px'
                                }} 
                              />
                              <span style={{ fontSize: '12px', color: '#666' }}>
                                {entry.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Empty description="Không có dữ liệu" />
              )}
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card
              title={
                <Space>
                  <BarChartOutlined style={{ color: '#00c49f' }} />
                  <span>Xu hướng doanh số</span>
                </Space>
              }
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
            >
              {salesChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={salesChartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      interval={0}
                      tick={{ fill: '#666', fontSize: 12 }}
                      stroke="#999"
                    />
                    <YAxis 
                      tick={{ fill: '#666', fontSize: 12 }}
                      stroke="#999"
                      tickFormatter={(value) => {
                        if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`;
                        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                        if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                        return value.toString();
                      }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e8e8e8',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                      }}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length > 0) {
                          const item = salesChartData.find(d => d.name === label);
                          // Chỉ hiển thị giá trị của line đang được hover
                          const hoveredData = payload[0];
                          return (
                            <div style={{ padding: '8px 12px' }}>
                              <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: '#333' }}>
                                {item?.fullName || label}
                              </p>
                              {hoveredData.name === 'doanhThu' && (
                                <p style={{ margin: 0, color: '#1890ff' }}>
                                  Doanh thu: <strong>{formatCurrency(hoveredData.value as number)}</strong>
                                </p>
                              )}
                              {hoveredData.name === 'donHang' && (
                                <p style={{ margin: 0, color: '#52c41a' }}>
                                  Đơn hàng: <strong>{hoveredData.value}</strong>
                                </p>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="line"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="doanhThu" 
                      stroke="#1890ff" 
                      strokeWidth={3}
                      name="Doanh thu"
                      dot={{ r: 6, fill: '#1890ff', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 8 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="donHang" 
                      stroke="#52c41a" 
                      strokeWidth={3}
                      name="Đơn hàng"
                      dot={{ r: 6, fill: '#52c41a', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 8 }}
                    />
                    <defs>
                      <linearGradient id="colorRevenueLine" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1890ff" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#1890ff" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorOrdersLine" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#52c41a" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#52c41a" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Empty description="Không có dữ liệu" />
              )}
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
};

