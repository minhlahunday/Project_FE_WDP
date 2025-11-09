import React, { useState, useEffect, useMemo } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Typography, 
  DatePicker, 
  Select, 
  Space,
  Spin,
  Table,
  Tag,
  Empty
} from 'antd';
import {
  DollarOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  FileTextOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  TrophyOutlined,
  StockOutlined,
  TeamOutlined,
  BarChartOutlined,
  PieChartOutlined
} from '@ant-design/icons';
import {
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
import { reportService, TopSellingProduct, DealerStock, SalesByStaff } from '../../../services/reportService';
import { useAuth } from '../../../contexts/AuthContext';
import { orderService } from '../../../services/orderService';
import { get } from '../../../services/httpClient';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface ReportStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalQuotations: number;
  revenueGrowth: number;
  orderGrowth: number;
}

export const ReportDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<ReportStats>({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalQuotations: 0,
    revenueGrowth: 0,
    orderGrowth: 0
  });
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month')
  ]);
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  
  // Report data states
  const [topSelling, setTopSelling] = useState<TopSellingProduct[]>([]);
  const [dealerStock, setDealerStock] = useState<DealerStock[]>([]);
  const [salesByStaff, setSalesByStaff] = useState<SalesByStaff[]>([]);
  
  // Get current user's dealership_id
  const getCurrentDealershipId = (): string | null => {
    if (user?.dealership_id) {
      return user.dealership_id;
    }
    // Fallback: try to get from JWT token
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.dealership_id || null;
      }
    } catch (error) {
      console.error('❌ Error parsing JWT token:', error);
    }
    return null;
  };

  useEffect(() => {
    loadReportData();
  }, [dateRange, period]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      
      // Get date range
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');
      
      console.log('📊 Loading report data:', { startDate, endDate, period });
      
      // Fetch all reports and statistics in parallel
      const [topSellingData, dealerStockData, salesByStaffData, ordersData, customersData, quotationsData] = await Promise.allSettled([
        reportService.getTopSelling(startDate, endDate, 10),
        reportService.getDealerStock(),
        reportService.getSalesByStaff(startDate, endDate),
        orderService.getOrders({ startDate, endDate, limit: 1 }), // Get orders to count total (uses pagination.total)
        get<any>('/api/customers?limit=1'), // Get customers API response to get totalRecords
        get<any>(`/api/quotes?limit=1&startDate=${startDate}&endDate=${endDate}`) // Get quotations API response to get total (with date range if supported)
      ]);

      // Handle top selling
      if (topSellingData.status === 'fulfilled') {
        console.log('📦 Top selling raw data:', JSON.stringify(topSellingData.value, null, 2));
        // Normalize data to ensure all fields are present
        const normalizedData = topSellingData.value.map((item: any) => {
          console.log('🔍 Processing item:', item);
          const vehicleId = item.vehicle_id || item._id?.vehicle || item.vehicle?._id || '';
          
          return {
            vehicle_id: vehicleId,
            vehicle_name: item.vehicle_name || item.vehicle?.name || item.name || 'N/A',
            total_sold: item.total_sold ?? item.quantity_sold ?? item.sold_quantity ?? item.quantity ?? 0,
            total_revenue: item.total_revenue ?? item.revenue ?? item.totalRevenue ?? item.amount ?? 0
          };
        });
        
        console.log('✅ Normalized top selling data:', normalizedData);
        setTopSelling(normalizedData);
        
        // Calculate total revenue from top selling (sum of all products)
        const totalRevenue = normalizedData.reduce((sum, item) => sum + (Number(item.total_revenue) || 0), 0);
        setStats(prev => ({
          ...prev,
          totalRevenue
        }));
      } else {
        console.error('❌ Failed to load top selling:', topSellingData.reason);
        setTopSelling([]);
      }
      
      // Handle orders - get real total orders count
      if (ordersData.status === 'fulfilled') {
        console.log('📦 Orders data:', JSON.stringify(ordersData.value, null, 2));
        const ordersResponse = ordersData.value as any;
        // OrderListResponse structure: { success, message, data: { data: [], pagination: { total } } }
        const totalOrders = ordersResponse?.data?.pagination?.total || ordersResponse?.pagination?.total || 0;
        console.log('✅ Total orders:', totalOrders);
        setStats(prev => ({
          ...prev,
          totalOrders: Number(totalOrders) || 0
        }));
      } else {
        console.error('❌ Failed to load orders:', ordersData.reason);
        setStats(prev => ({
          ...prev,
          totalOrders: 0
        }));
      }
      
      // Handle customers - get real total customers count
      if (customersData.status === 'fulfilled') {
        console.log('📦 Customers data:', JSON.stringify(customersData.value, null, 2));
        const customersResponse = customersData.value as any;
        // API returns: { success, message, data: { data: [], totalRecords, page, limit, totalPages } }
        const totalCustomers = customersResponse?.data?.totalRecords || customersResponse?.totalRecords || 0;
        console.log('✅ Total customers:', totalCustomers);
        setStats(prev => ({
          ...prev,
          totalCustomers: Number(totalCustomers) || 0
        }));
      } else {
        console.error('❌ Failed to load customers:', customersData.reason);
        setStats(prev => ({
          ...prev,
          totalCustomers: 0
        }));
      }

      // Handle dealer stock - filter by current user's dealership
      if (dealerStockData.status === 'fulfilled') {
        console.log('📦 Dealer stock raw data:', JSON.stringify(dealerStockData.value, null, 2));
        const currentDealershipId = getCurrentDealershipId();
        console.log('🔍 Current dealership ID:', currentDealershipId);
        
        // Normalize data to ensure all fields are present
        let normalizedStockData = dealerStockData.value.map((item: any) => {
          console.log('🔍 Processing stock item:', item);
          return {
            _id: item._id || item.dealership_id || '',
            dealership_id: item.dealership_id || item._id || item.id || '',
            dealership_name: item.dealership_name || item.dealership?.company_name || item.company_name || item.name || 'N/A',
            total_stock: item.total_stock ?? item.totalStock ?? item.totalVehicles ?? item.total_vehicles ?? item.total ?? 0,
            vehicles: item.vehicles || item.details || item.vehicle_details || []
          };
        });
        
        // Filter to show only current dealer's stock
        if (currentDealershipId) {
          normalizedStockData = normalizedStockData.filter((item: DealerStock) => {
            const matches = item.dealership_id === currentDealershipId || item._id === currentDealershipId;
            console.log(`🔍 Checking dealership ${item.dealership_id} against ${currentDealershipId}:`, matches);
            return matches;
          });
          console.log('✅ Filtered dealer stock data (current dealer only):', normalizedStockData);
        } else {
          console.warn('⚠️ No dealership_id found for current user, showing all dealers');
        }
        
        setDealerStock(normalizedStockData);
      } else {
        console.error('❌ Failed to load dealer stock:', dealerStockData.reason);
        setDealerStock([]);
      }

      // Handle sales by staff
      if (salesByStaffData.status === 'fulfilled') {
        console.log('📦 Sales by staff raw data:', JSON.stringify(salesByStaffData.value, null, 2));
        // Normalize data to ensure all fields are present
        const normalizedStaffData = salesByStaffData.value.map((item: any) => {
          console.log('🔍 Processing staff item:', item);
          return {
            staff_id: item.staff_id || item._id?.staff || item.staff?._id || item.user_id || '',
            staff_name: item.staff_name || item.staff?.full_name || item.staff?.name || item.user_name || 'N/A',
            total_sales: item.total_sales ?? item.totalSales ?? 0,
            total_revenue: item.total_revenue ?? item.revenue ?? item.totalRevenue ?? item.amount ?? 0,
            order_count: item.order_count ?? item.orderCount ?? item.orders_count ?? item.orders ?? 0
          };
        });
        console.log('✅ Normalized sales by staff data:', normalizedStaffData);
        setSalesByStaff(normalizedStaffData);
      } else {
        console.error('❌ Failed to load sales by staff:', salesByStaffData.reason);
        setSalesByStaff([]);
      }
      
      // Handle quotations - get real total quotations count
      if (quotationsData.status === 'fulfilled') {
        console.log('📦 Quotations data:', JSON.stringify(quotationsData.value, null, 2));
        const quotationsResponse = quotationsData.value as any;
        // API returns: { success, message, data: { quotes: [], pagination: { total } } } or { data: { data: [], pagination: { total } } }
        const totalQuotations = quotationsResponse?.data?.pagination?.total 
          || quotationsResponse?.pagination?.total 
          || quotationsResponse?.data?.totalRecords
          || quotationsResponse?.totalRecords
          || quotationsResponse?.total
          || 0;
        console.log('✅ Total quotations:', totalQuotations);
        setStats(prev => ({
          ...prev,
          totalQuotations: Number(totalQuotations) || 0
        }));
      } else {
        console.error('❌ Failed to load quotations:', quotationsData.reason);
        setStats(prev => ({
          ...prev,
          totalQuotations: 0
        }));
      }
      
      // Mock growth data for now (can be calculated from previous period)
      setStats(prev => ({
        ...prev,
        revenueGrowth: 12.5,
        orderGrowth: 8.3
      }));
      
    } catch (error) {
      console.error('❌ Error loading report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange([dates[0], dates[1]]);
    }
  };

  const handlePeriodChange = (value: 'month' | 'quarter' | 'year') => {
    setPeriod(value);
    let start: Dayjs, end: Dayjs;
    
    switch (value) {
      case 'month':
        start = dayjs().startOf('month');
        end = dayjs().endOf('month');
        break;
      case 'quarter':
        const currentMonth = dayjs().month(); // 0-11
        const quarterStartMonth = Math.floor(currentMonth / 3) * 3; // 0, 3, 6, 9
        start = dayjs().month(quarterStartMonth).startOf('month');
        end = dayjs().month(quarterStartMonth + 2).endOf('month');
        break;
      case 'year':
        start = dayjs().startOf('year');
        end = dayjs().endOf('year');
        break;
      default:
        start = dayjs().startOf('month');
        end = dayjs().endOf('month');
    }
    
    setDateRange([start, end]);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value);
  };

  // Top selling products chart data
  const topSellingChartData = useMemo(() => {
    return topSelling.slice(0, 5).map(item => ({
      name: item.vehicle_name.length > 15 ? item.vehicle_name.substring(0, 15) + '...' : item.vehicle_name,
      fullName: item.vehicle_name,
      soLuong: item.total_sold,
      doanhThu: item.total_revenue
    }));
  }, [topSelling]);

  // Sales by staff chart data
  const salesByStaffChartData = useMemo(() => {
    return salesByStaff.map(item => ({
      name: item.staff_name.length > 10 ? item.staff_name.substring(0, 10) + '...' : item.staff_name,
      fullName: item.staff_name,
      doanhThu: item.total_revenue,
      donHang: item.order_count
    }));
  }, [salesByStaff]);

  // Colors for charts
  const CHART_COLORS = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2', '#eb2f96'];
  
  // Custom tooltip formatter
  const currencyFormatter = (value: number) => formatCurrency(value);

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      <Card style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
          <Col>
            <Title level={2} style={{ margin: 0 }}>
              Báo cáo Dashboard
            </Title>
          </Col>
          <Col>
            <Space size="middle" style={{ display: 'flex', alignItems: 'center' }}>
              <Select
                value={period}
                onChange={handlePeriodChange}
                style={{ 
                  width: 140,
                  minWidth: 140
                }}
                size="large"
              >
                <Option value="month">Tháng này</Option>
                <Option value="quarter">Quý này</Option>
                <Option value="year">Năm này</Option>
              </Select>
              <RangePicker
                value={dateRange}
                onChange={handleDateRangeChange}
                format="DD/MM/YYYY"
                style={{ 
                  width: 320,
                  minWidth: 320
                }}
                size="large"
                allowClear={false}
                placeholder={['Từ ngày', 'Đến ngày']}
                separator={<span style={{ margin: '0 8px', color: '#8c8c8c' }}>→</span>}
              />
            </Space>
          </Col>
        </Row>
      </Card>

      <Spin spinning={loading}>
        {/* Statistics Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Tổng doanh thu"
                value={stats.totalRevenue}
                precision={0}
                prefix={<DollarOutlined />}
                formatter={(value) => formatCurrency(Number(value))}
                valueStyle={{ color: '#3f8600' }}
                suffix={
                  <span style={{ fontSize: 14, color: '#3f8600' }}>
                    <ArrowUpOutlined /> {stats.revenueGrowth}%
                  </span>
                }
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Tổng đơn hàng"
                value={stats.totalOrders}
                prefix={<ShoppingCartOutlined />}
                valueStyle={{ color: '#1890ff' }}
                suffix={
                  <span style={{ fontSize: 14, color: '#1890ff' }}>
                    <ArrowUpOutlined /> {stats.orderGrowth}%
                  </span>
                }
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Tổng khách hàng"
                value={stats.totalCustomers}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Tổng báo giá"
                value={stats.totalQuotations}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Charts Section */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {/* Top Selling Products Pie Chart */}
          <Col xs={24} lg={8}>
            <Card 
              title={
                <Space>
                  <PieChartOutlined style={{ color: '#faad14' }} />
                  <span>Phân bố doanh số</span>
                </Space>
              }
            >
              {topSellingChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={topSellingChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="doanhThu"
                    >
                      {topSellingChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={currencyFormatter} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Empty description="Không có dữ liệu để hiển thị" />
              )}
            </Card>
          </Col>

          {/* Top Selling Products Bar Chart */}
          <Col xs={24} lg={16}>
            <Card 
              title={
                <Space>
                  <BarChartOutlined style={{ color: '#faad14' }} />
                  <span>Top sản phẩm bán chạy (Doanh thu)</span>
                </Space>
              }
            >
              {topSellingChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topSellingChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis 
                      label={{ value: 'Doanh thu (₫)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip formatter={currencyFormatter} />
                    <Legend />
                    <Bar dataKey="doanhThu" fill="#1890ff" name="Doanh thu">
                      {topSellingChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Empty description="Không có dữ liệu để hiển thị" />
              )}
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {/* Sales by Staff Bar Chart */}
          <Col xs={24} lg={12}>
            <Card 
              title={
                <Space>
                  <TeamOutlined style={{ color: '#1890ff' }} />
                  <span>Doanh số theo nhân viên</span>
                </Space>
              }
            >
              {salesByStaffChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={salesByStaffChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis 
                      label={{ value: 'Doanh thu (₫)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip formatter={currencyFormatter} />
                    <Legend />
                    <Bar dataKey="doanhThu" fill="#52c41a" name="Doanh thu">
                      {salesByStaffChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Empty description="Không có dữ liệu để hiển thị" />
              )}
            </Card>
          </Col>
        </Row>

        {/* Top Selling Products */}
        <Card 
          title={
            <Space>
              <TrophyOutlined style={{ color: '#faad14' }} />
              <span>Top sản phẩm bán chạy</span>
            </Space>
          }
          style={{ marginBottom: 24 }}
        >
          {topSelling.length > 0 ? (
            <Table
              dataSource={topSelling.map((item, index) => ({ ...item, key: item.vehicle_id || index }))}
              columns={[
                {
                  title: 'STT',
                  dataIndex: 'index',
                  key: 'index',
                  width: 60,
                  render: (_: unknown, __: unknown, index: number) => index + 1
                },
                {
                  title: 'Tên sản phẩm',
                  dataIndex: 'vehicle_name',
                  key: 'vehicle_name',
                  width: 250,
                  render: (name: string | undefined, record: any) => {
                    return name || record.vehicle?.name || record.name || 'N/A';
                  }
                },
                {
                  title: 'Số lượng bán',
                  dataIndex: 'total_sold',
                  key: 'total_sold',
                  width: 150,
                  align: 'center' as const,
                  render: (value: number | undefined | null, record: any) => {
                    const sold = value ?? record.quantity_sold ?? record.sold_quantity ?? record.quantity ?? 0;
                    return <Text strong style={{ fontSize: 15 }}>{Number(sold) || 0} xe</Text>;
                  }
                },
                {
                  title: 'Doanh thu',
                  dataIndex: 'total_revenue',
                  key: 'total_revenue',
                  width: 200,
                  align: 'right' as const,
                  render: (value: number | undefined | null, record: any) => {
                    const revenue = value ?? record.revenue ?? record.totalRevenue ?? record.amount ?? 0;
                    const numValue = Number(revenue);
                    if (isNaN(numValue) || numValue === 0) {
                      return <Text type="secondary">0 ₫</Text>;
                    }
                    return (
                      <Text strong style={{ color: '#3f8600', fontSize: 15 }}>
                        {formatCurrency(numValue)}
                      </Text>
                    );
                  }
                }
              ]}
              pagination={false}
              size="middle"
            />
          ) : (
            <Empty description="Không có dữ liệu" />
          )}
        </Card>

        {/* Sales by Staff */}
        <Card 
          title={
            <Space>
              <TeamOutlined style={{ color: '#1890ff' }} />
              <span>Doanh số theo nhân viên</span>
            </Space>
          }
          style={{ marginBottom: 24 }}
        >
          {salesByStaff.length > 0 ? (
            <Table
              dataSource={salesByStaff.map((item, index) => ({ ...item, key: item.staff_id || index }))}
              columns={[
                {
                  title: 'STT',
                  dataIndex: 'index',
                  key: 'index',
                  width: 60,
                  render: (_: unknown, __: unknown, index: number) => index + 1
                },
                {
                  title: 'Nhân viên',
                  dataIndex: 'staff_name',
                  key: 'staff_name',
                  width: 200
                },
                {
                  title: 'Số đơn hàng',
                  dataIndex: 'order_count',
                  key: 'order_count',
                  width: 120,
                  align: 'center' as const,
                  render: (value: number | undefined | null, record: any) => {
                    const count = value ?? record.orderCount ?? record.orders_count ?? record.orders ?? 0;
                    return <Text strong>{Number(count) || 0}</Text>;
                  }
                },
                {
                  title: 'Tổng doanh thu',
                  dataIndex: 'total_revenue',
                  key: 'total_revenue',
                  width: 150,
                  align: 'right' as const,
                  render: (value: number | undefined | null, record: any) => {
                    const revenue = value ?? record.revenue ?? record.totalRevenue ?? record.amount ?? 0;
                    const numValue = Number(revenue);
                    if (isNaN(numValue) || numValue === 0) {
                      return <Text type="secondary">0 ₫</Text>;
                    }
                    return (
                      <Text strong style={{ color: '#3f8600' }}>
                        {formatCurrency(numValue)}
                      </Text>
                    );
                  }
                }
              ]}
              pagination={false}
              size="middle"
            />
          ) : (
            <Empty description="Không có dữ liệu" />
          )}
        </Card>

        {/* Dealer Stock Report */}
        <Card 
          title={
            <Space>
              <StockOutlined style={{ color: '#722ed1' }} />
              <span>Báo cáo tồn kho đại lý</span>
            </Space>
          }
        >
          {dealerStock.length > 0 ? (
            <Table
              dataSource={dealerStock.map((item, index) => ({ ...item, key: item.dealership_id || index }))}
              columns={[
                {
                  title: 'STT',
                  dataIndex: 'index',
                  key: 'index',
                  width: 60,
                  render: (_: unknown, __: unknown, index: number) => index + 1
                },
                {
                  title: 'Tên đại lý',
                  dataIndex: 'dealership_name',
                  key: 'dealership_name',
                  width: 250
                },
                {
                  title: 'Tổng tồn kho',
                  dataIndex: 'total_stock',
                  key: 'total_stock',
                  width: 120,
                  align: 'center' as const,
                  render: (value: number) => (
                    <Tag color="blue" style={{ fontSize: 14, padding: '4px 12px' }}>
                      {value} xe
                    </Tag>
                  )
                },
                {
                  title: 'Chi tiết',
                  dataIndex: 'vehicles',
                  key: 'vehicles',
                  render: (vehicles: Array<{ vehicle_name: string; quantity: number }>) => (
                    <div>
                      {vehicles && vehicles.length > 0 ? (
                        <div>
                          {vehicles.slice(0, 3).map((vehicle, idx) => (
                            <div key={idx} style={{ marginBottom: 4 }}>
                              <Text>{vehicle.vehicle_name}: </Text>
                              <Text strong>{vehicle.quantity}</Text>
                            </div>
                          ))}
                          {vehicles.length > 3 && (
                            <Text type="secondary">+{vehicles.length - 3} sản phẩm khác</Text>
                          )}
                        </div>
                      ) : (
                        <Text type="secondary">Không có dữ liệu</Text>
                      )}
                    </div>
                  )
                }
              ]}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 800 }}
              size="middle"
            />
          ) : (
            <Empty description="Không có dữ liệu" />
          )}
        </Card>
      </Spin>
    </div>
  );
};

