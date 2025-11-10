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
  TrophyOutlined,
  StockOutlined,
  TeamOutlined,
  BarChartOutlined,
  PieChartOutlined,
  RightOutlined,
  DownOutlined
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
import { stockService, VehicleStock } from '../../../services/stockService';
import { useAuth } from '../../../contexts/AuthContext';
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
      // Fetch all data (removed topSelling API call - will calculate from sales data instead)
      const [dealerStockData, salesByStaffData, salesData, customersData, quotationsData, vehicleStockData] = await Promise.allSettled([
        reportService.getDealerStock(),
        reportService.getSalesByStaff(startDate, endDate),
        reportService.getSalesReport(startDate, endDate), // Get sales data for total orders, revenue AND top selling
        get<unknown>('/api/customers?limit=1'), // Get customers API response to get totalRecords
        get<unknown>(`/api/quotes?limit=1&startDate=${startDate}&endDate=${endDate}`), // Get quotations API response to get total (with date range if supported)
        stockService.getMyStock({ limit: 1000 }) // Get vehicle stock data to get accurate sold quantities
      ]);

      // Handle sales data - calculate total orders, revenue AND top selling from /api/reports/sales
      if (salesData.status === 'fulfilled') {
        console.log('📦 Sales data RAW:', salesData.value);
        console.log('📦 Sales data type:', typeof salesData.value);
        console.log('📦 Sales data is array:', Array.isArray(salesData.value));
        
        const sales = salesData.value;
        
        // Check if sales is empty
        if (!sales || sales.length === 0) {
          console.warn('⚠️ Sales data is empty from API');
          setStats(prev => ({
            ...prev,
            totalOrders: 0,
            totalRevenue: 0
          }));
          setTopSelling([]); // No top selling data either
        } else {
          console.log('📦 Sales data count:', sales.length);
          console.log('📦 First sale item:', sales[0]);
          
          // Get current user's dealership ID
          const currentDealershipId = getCurrentDealershipId();
          console.log('🔍 Current dealership ID for sales filter:', currentDealershipId);
          
          // Filter sales by current dealership
          const filteredSales = currentDealershipId 
            ? sales.filter(item => {
                // dealership_id can be in item.dealership_id or item._id.dealership
                const itemDealershipId = item.dealership_id || 
                  (item._id && typeof item._id === 'object' ? (item._id as { dealership?: string }).dealership : null);
                console.log('🔍 Checking item dealership_id:', itemDealershipId, 'vs current:', currentDealershipId);
                return itemDealershipId === currentDealershipId;
              })
            : sales;
          
          console.log('📊 Filtered sales count:', filteredSales.length, 'out of', sales.length);
          
          if (filteredSales.length > 0) {
            console.log('📦 First filtered sale:', filteredSales[0]);
          }
          
          // Calculate total orders (count unique orders) and total revenue from filtered sales
          const totalOrders = filteredSales.length; // Each record is an order
          const totalRevenue = filteredSales.reduce((sum, item) => {
            const revenue = item.total_amount || item.totalRevenue || 0;
            console.log('💰 Adding revenue:', revenue, 'Current sum:', sum);
            return sum + revenue;
          }, 0);
          
          console.log('✅ Total orders from sales (filtered):', totalOrders);
          console.log('✅ Total revenue from sales (filtered):', totalRevenue);
          
          setStats(prev => ({
            ...prev,
            totalOrders: Number(totalOrders) || 0,
            totalRevenue: Number(totalRevenue) || 0
          }));
          
          // Calculate top selling products - use stock data for accurate sold quantities
          console.log('🔍 Starting to calculate top selling products...');
          
          // First, get accurate sold quantities from vehicle stock data
          const vehicleSoldMap = new Map<string, { vehicle_id: string; vehicle_name: string; total_sold: number }>();
          
          if (vehicleStockData.status === 'fulfilled') {
            console.log('� Vehicle stock data available:', vehicleStockData.value);
            const stockData = vehicleStockData.value.data?.data || [];
            
            stockData.forEach((stock: VehicleStock) => {
              const vehicleId = stock.vehicle.id;
              const vehicleName = stock.vehicle.name;
              const totalSold = stock.summary.total_sold || 0;
              
              if (totalSold > 0) {
                vehicleSoldMap.set(vehicleId, {
                  vehicle_id: vehicleId,
                  vehicle_name: vehicleName,
                  total_sold: totalSold
                });
                console.log(`✅ Stock data - ${vehicleName}: sold ${totalSold} units`);
              }
            });
          } else {
            console.warn('⚠️ Vehicle stock data not available, will use sales data for quantity (may be inaccurate)');
          }
          
          // Now calculate revenue for each vehicle from sales data
          const topSellingMap = new Map<string, { vehicle_name: string; total_sold: number; total_revenue: number }>();
          
          console.log('� Starting to process sales for revenue calculation...');
          console.log('🔍 Total filtered sales to process:', filteredSales.length);
          
          filteredSales.forEach((item, index) => {
            const vehicleId = (item._id && typeof item._id === 'object' ? (item._id as { vehicle?: string }).vehicle : null) || item.vehicle_id || '';
            const vehicleName = item.vehicle_name || 'N/A';
            const revenue = item.totalRevenue || item.total_amount || 0;
            
            console.log(`📊 [${index + 1}/${filteredSales.length}] Processing sale for ${vehicleName}:`, {
              vehicleId,
              revenue,
              'Full item': item
            });
            
            if (vehicleId) {
              const existing = topSellingMap.get(vehicleId);
              if (existing) {
                existing.total_revenue += revenue;
                console.log(`✅ Updated ${vehicleName}: total_revenue=${existing.total_revenue}`);
              } else {
                // Get accurate sold quantity from stock data, or fallback to counting sales records
                const stockInfo = vehicleSoldMap.get(vehicleId);
                const totalSold = stockInfo ? stockInfo.total_sold : 1; // Fallback to 1 if no stock data
                
                topSellingMap.set(vehicleId, {
                  vehicle_name: vehicleName,
                  total_sold: totalSold,
                  total_revenue: revenue
                });
                console.log(`✅ Added ${vehicleName}: total_sold=${totalSold} (from ${stockInfo ? 'stock data' : 'fallback'}), total_revenue=${revenue}`);
              }
            } else {
              console.warn(`⚠️ Skipping sale record - no vehicle ID found:`, item);
            }
          });
          
          // Don't add vehicles from stock data that have no sales records in the selected period
          // Because we can't calculate accurate revenue for them
          // Only show vehicles that have actual sales in the report period
          
          console.log('📊 Final top selling map:', topSellingMap);
          
          // Convert map to array and sort by revenue (descending)
          const topSellingArray = Array.from(topSellingMap.entries())
            .map(([vehicle_id, data]) => ({
              vehicle_id,
              ...data
            }))
            .sort((a, b) => b.total_revenue - a.total_revenue)
            .slice(0, 10); // Top 10
          
          console.log('✅ Top selling products (calculated from filtered sales):', topSellingArray);
          setTopSelling(topSellingArray);
        }
      } else {
        console.error('❌ Failed to load sales data:', salesData.reason);
        console.error('❌ Full error:', salesData);
        setStats(prev => ({
          ...prev,
          totalOrders: 0,
          totalRevenue: 0
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
        
        interface VehicleWithStock {
          vehicle_name: string;
          vehicle_id?: string;
          color?: string;
          quantity?: number;
          remaining_quantity?: number;
        }
        
        type RawDealerStockItem = DealerStock & {
          vehicles?: VehicleWithStock[] | Array<{ vehicle_id: string; vehicle_name: string; quantity: number }>;
          details?: VehicleWithStock[];
          vehicle_details?: VehicleWithStock[];
          dealership?: { company_name?: string };
          company_name?: string;
          name?: string;
          id?: string;
          totalStock?: number;
          totalVehicles?: number;
          total_vehicles?: number;
          total?: number;
        };
        
        // Normalize data to ensure all fields are present
        let normalizedStockData = dealerStockData.value.map((item: RawDealerStockItem) => {
          console.log('🔍 Processing stock item:', item);
          
          // Filter vehicles to only include those with remaining_quantity > 0 (available vehicles only)
          const allVehicles = (item.vehicles || item.details || item.vehicle_details || []) as VehicleWithStock[];
          const availableVehicles = allVehicles.filter((vehicle: VehicleWithStock) => {
            const remainingQty = vehicle.remaining_quantity ?? vehicle.quantity ?? 0;
            console.log(`🔍 Vehicle ${vehicle.vehicle_name}: remaining=${remainingQty}`);
            return remainingQty > 0;
          });
          
          // Calculate total stock from available vehicles only
          const totalAvailableStock = availableVehicles.reduce((sum: number, vehicle: VehicleWithStock) => {
            const qty = vehicle.remaining_quantity ?? vehicle.quantity ?? 0;
            return sum + qty;
          }, 0);
          
          console.log(`✅ Available vehicles count: ${availableVehicles.length} (total stock: ${totalAvailableStock})`);
          
          return {
            _id: item._id || item.dealership_id || '',
            dealership_id: item.dealership_id || item._id || item.id || '',
            dealership_name: item.dealership_name || item.dealership?.company_name || item.company_name || item.name || 'N/A',
            total_stock: totalAvailableStock, // Use calculated available stock
            vehicles: availableVehicles.map(v => ({
              vehicle_id: v.vehicle_id || '',
              vehicle_name: v.vehicle_name,
              quantity: v.remaining_quantity ?? v.quantity ?? 0
            })) // Only include available vehicles
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
        const normalizedStaffData = salesByStaffData.value.map((item: unknown) => {
          const itemObj = item as Record<string, unknown>;
          console.log('🔍 Processing staff item:', itemObj);
          
          // Extract staff_id
          let staffId = '';
          if (typeof itemObj.staff_id === 'string') {
            staffId = itemObj.staff_id;
          } else if (typeof itemObj.user_id === 'string') {
            staffId = itemObj.user_id;
          } else if (itemObj._id && typeof itemObj._id === 'object') {
            staffId = (itemObj._id as Record<string, unknown>).staff as string || '';
          } else if (itemObj.staff && typeof itemObj.staff === 'object') {
            staffId = (itemObj.staff as Record<string, unknown>)._id as string || '';
          }
          
          // Extract staff_name
          let staffName = 'N/A';
          if (typeof itemObj.staff_name === 'string') {
            staffName = itemObj.staff_name;
          } else if (typeof itemObj.user_name === 'string') {
            staffName = itemObj.user_name;
          } else if (itemObj.staff && typeof itemObj.staff === 'object') {
            const staff = itemObj.staff as Record<string, unknown>;
            staffName = (staff.full_name as string) || (staff.name as string) || 'N/A';
          }
          
          // Extract total_sales (quantity) - not used in sales by staff
          const totalSales = (itemObj.total_sales as number) 
            ?? (itemObj.totalSales as number) 
            ?? (itemObj.totalQuantity as number) 
            ?? (itemObj.total_quantity as number) 
            ?? 0;
          
          // Extract total_revenue
          const totalRevenue = (itemObj.total_revenue as number) 
            ?? (itemObj.revenue as number) 
            ?? (itemObj.totalRevenue as number) 
            ?? (itemObj.amount as number) 
            ?? 0;
          
          // Extract order_count (totalOrders from API)
          const orderCount = (itemObj.order_count as number) 
            ?? (itemObj.orderCount as number) 
            ?? (itemObj.totalOrders as number)
            ?? (itemObj.orders_count as number) 
            ?? (itemObj.orders as number) 
            ?? 0;
          
          const normalizedItem = {
            staff_id: staffId || (itemObj._id as string) || '',
            staff_name: staffName,
            total_sales: totalSales,
            total_revenue: totalRevenue,
            order_count: orderCount
          };
          console.log('✅ Normalized staff item:', normalizedItem);
          return normalizedItem;
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
        const quotationsResponse = quotationsData.value as unknown;
        const quotationsObj = quotationsResponse as Record<string, unknown>;
        // API returns: { success, message, data: { quotes: [], pagination: { total } } } or { data: { data: [], pagination: { total } } }
        const dataObj = quotationsObj?.data as Record<string, unknown> | undefined;
        const paginationObj = dataObj?.pagination as Record<string, unknown> | undefined;
        const totalQuotations = paginationObj?.total 
          || quotationsObj?.pagination as Record<string, unknown>
          || dataObj?.totalRecords
          || quotationsObj?.totalRecords
          || quotationsObj?.total
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
      // setStats(prev => ({
      //   ...prev,
      //   revenueGrowth: 12.5,
      //   orderGrowth: 8.3
      // }));
      
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

  // Colors for charts - matching manufacturer dashboard
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

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
                title="Tổng khách hàng"
                value={stats.totalCustomers}
                prefix={<UserOutlined style={{ fontSize: 24, color: '#722ed1' }} />}
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
                title="Tổng báo giá"
                value={stats.totalQuotations}
                prefix={<FileTextOutlined style={{ fontSize: 24, color: '#fa8c16' }} />}
                valueStyle={{ color: '#fa8c16', fontSize: 20, fontWeight: 'bold' }}
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
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
            >
              {topSellingChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={450}>
                  <PieChart>
                    <defs>
                      {topSellingChartData.map((_, index) => (
                        <linearGradient key={`pieGradient${index}`} id={`pieGradient${index}`} x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.9}/>
                          <stop offset="100%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.6}/>
                        </linearGradient>
                      ))}
                    </defs>
                    <Pie
                      data={topSellingChartData}
                      cx="50%"
                      cy="45%"
                      labelLine={false}
                      label={(entry: unknown) => {
                        const e = entry as { name: string; percent: number };
                        return e.percent > 0.05 ? `${e.name}: ${(e.percent * 100).toFixed(0)}%` : '';
                      }}
                      outerRadius={90}
                      innerRadius={35}
                      fill="#8884d8"
                      dataKey="doanhThu"
                      paddingAngle={2}
                    >
                      {topSellingChartData.map((_, index) => (
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
                      formatter={(value: number) => formatCurrency(value)}
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
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
            >
              {topSellingChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={450}>
                  <BarChart data={topSellingChartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
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
                        
                        const item = topSellingChartData.find(d => d.name === label);
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
                              backgroundColor: '#e6f7ff',
                              borderRadius: '4px',
                              border: '1px solid #91d5ff'
                            }}>
                              <div style={{ color: '#1890ff', fontSize: '13px' }}>
                                <span style={{ marginRight: '6px', fontSize: '14px' }}>●</span>
                                <span style={{ fontWeight: 500 }}>Doanh thu:</span>
                                <div style={{ marginTop: '4px', fontWeight: 'bold', fontSize: '15px' }}>
                                  {formatCurrency(Number(value) || 0)}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }}
                    />
                    <defs>
                      {topSellingChartData.map((_, index) => (
                        <linearGradient key={`colorRevenue${index}`} id={`colorRevenue${index}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#1890ff" stopOpacity={0.9}/>
                          <stop offset="100%" stopColor="#0050b3" stopOpacity={0.9}/>
                        </linearGradient>
                      ))}
                    </defs>
                    <Bar 
                      dataKey="doanhThu" 
                      name="Doanh thu"
                      radius={[8, 8, 0, 0]}
                      fill="#1890ff"
                    >
                      {topSellingChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={`url(#colorRevenue${index})`} />
                      ))}
                    </Bar>
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="rect"
                      content={({ payload }) => (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '20px' }}>
                          {payload?.map((entry, index: number) => (
                            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span 
                                style={{ 
                                  display: 'inline-block', 
                                  width: '14px', 
                                  height: '14px', 
                                  backgroundColor: '#1890ff',
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
                  render: (value: number | undefined | null, record: unknown) => {
                    const recordObj = record as Record<string, unknown>;
                    const count = value ?? recordObj.orderCount ?? recordObj.totalOrders ?? recordObj.orders_count ?? recordObj.orders ?? 0;
                    return <Text strong>{Number(count) || 0}</Text>;
                  }
                },
                {
                  title: 'Tổng doanh thu',
                  dataIndex: 'total_revenue',
                  key: 'total_revenue',
                  width: 150,
                  align: 'right' as const,
                  render: (value: number | undefined | null, record: unknown) => {
                    const recordObj = record as Record<string, unknown>;
                    const revenue = value ?? recordObj.revenue ?? recordObj.totalRevenue ?? recordObj.amount ?? 0;
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
          style={{ marginBottom: 24 }}
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
                }
              ]}
              expandable={{
                expandedRowRender: (record: DealerStock) => (
                  <div style={{ padding: '16px 24px', background: '#fafafa', borderRadius: '8px' }}>
                    <Title level={5} style={{ marginBottom: 16, color: '#722ed1' }}>
                      Chi tiết sản phẩm
                    </Title>
                    {record.vehicles && record.vehicles.length > 0 ? (
                      <Row gutter={[16, 16]}>
                        {record.vehicles.map((vehicle, idx) => (
                          <Col xs={24} sm={12} md={8} key={idx}>
                            <Card 
                              size="small" 
                              style={{ 
                                borderLeft: '3px solid #722ed1',
                                boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
                              }}
                            >
                              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                                <Text strong style={{ color: '#262626', fontSize: 14 }}>
                                  {vehicle.vehicle_name}
                                </Text>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Text type="secondary">Số lượng:</Text>
                                  <Tag color="blue" style={{ margin: 0 }}>
                                    {vehicle.quantity} xe
                                  </Tag>
                                </div>
                              </Space>
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    ) : (
                      <Empty description="Không có dữ liệu sản phẩm" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                    )}
                  </div>
                ),
                rowExpandable: (record: DealerStock) => record.vehicles && record.vehicles.length > 0,
                expandIcon: ({ expanded, onExpand, record }) => (
                  expanded ? (
                    <DownOutlined 
                      onClick={e => onExpand(record, e)} 
                      style={{ color: '#722ed1', fontSize: 12, cursor: 'pointer' }}
                    />
                  ) : (
                    <RightOutlined 
                      onClick={e => onExpand(record, e)} 
                      style={{ color: '#722ed1', fontSize: 12, cursor: 'pointer' }}
                    />
                  )
                )
              }}
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

