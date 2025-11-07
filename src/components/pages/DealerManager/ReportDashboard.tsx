import React, { useState, useEffect } from 'react';
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
  Image,
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
  TeamOutlined
} from '@ant-design/icons';
import { reportService, TopSellingProduct, DealerStock, SalesByStaff } from '../../../services/reportService';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

const { Title } = Typography;
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
      
      // Fetch all reports in parallel
      const [topSellingData, dealerStockData, salesByStaffData] = await Promise.allSettled([
        reportService.getTopSelling(startDate, endDate, 10),
        reportService.getDealerStock(),
        reportService.getSalesByStaff(startDate, endDate)
      ]);

      // Handle top selling
      if (topSellingData.status === 'fulfilled') {
        setTopSelling(topSellingData.value);
        // Calculate total revenue from top selling
        const totalRevenue = topSellingData.value.reduce((sum, item) => sum + (item.total_revenue || 0), 0);
        setStats(prev => ({
          ...prev,
          totalRevenue,
          totalOrders: topSellingData.value.reduce((sum, item) => sum + (item.total_sold || 0), 0)
        }));
      } else {
        console.error('❌ Failed to load top selling:', topSellingData.reason);
        setTopSelling([]);
      }

      // Handle dealer stock
      if (dealerStockData.status === 'fulfilled') {
        setDealerStock(dealerStockData.value);
      } else {
        console.error('❌ Failed to load dealer stock:', dealerStockData.reason);
        setDealerStock([]);
      }

      // Handle sales by staff
      if (salesByStaffData.status === 'fulfilled') {
        setSalesByStaff(salesByStaffData.value);
        // Calculate total customers from sales
        const totalCustomers = salesByStaffData.value.length;
        setStats(prev => ({
          ...prev,
          totalCustomers
        }));
      } else {
        console.error('❌ Failed to load sales by staff:', salesByStaffData.reason);
        setSalesByStaff([]);
      }
      
      // Mock growth data for now (can be calculated from previous period)
      setStats(prev => ({
        ...prev,
        revenueGrowth: 12.5,
        orderGrowth: 8.3,
        totalQuotations: 78 // This can be fetched from another API if needed
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
        start = dayjs().startOf('quarter');
        end = dayjs().endOf('quarter');
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
                  title: 'Hình ảnh',
                  dataIndex: 'image',
                  key: 'image',
                  width: 100,
                  render: (image: string) => (
                    <Image
                      src={image || '/placeholder-car.jpg'}
                      alt="Vehicle"
                      width={60}
                      height={40}
                      style={{ objectFit: 'cover', borderRadius: 4 }}
                      preview={false}
                    />
                  )
                },
                {
                  title: 'Tên sản phẩm',
                  dataIndex: 'vehicle_name',
                  key: 'vehicle_name',
                  width: 200
                },
                {
                  title: 'Số lượng bán',
                  dataIndex: 'total_sold',
                  key: 'total_sold',
                  width: 120,
                  align: 'center' as const,
                  render: (value: number) => <Text strong>{value}</Text>
                },
                {
                  title: 'Doanh thu',
                  dataIndex: 'total_revenue',
                  key: 'total_revenue',
                  width: 150,
                  align: 'right' as const,
                  render: (value: number) => (
                    <Text strong style={{ color: '#3f8600' }}>
                      {formatCurrency(value)}
                    </Text>
                  )
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
                  render: (value: number) => <Text strong>{value}</Text>
                },
                {
                  title: 'Tổng doanh thu',
                  dataIndex: 'total_revenue',
                  key: 'total_revenue',
                  width: 150,
                  align: 'right' as const,
                  render: (value: number) => (
                    <Text strong style={{ color: '#3f8600' }}>
                      {formatCurrency(value)}
                    </Text>
                  )
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

