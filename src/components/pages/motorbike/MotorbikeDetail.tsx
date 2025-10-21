import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Row, 
  Col, 
  Card, 
  Button, 
  Tabs, 
  Image, 
  Tag, 
  Descriptions, 
  Divider, 
  Space, 
  Typography, 
  List, 
  Badge,
  Carousel,
  Grid,
  Spin,
  Alert,
  ConfigProvider
} from 'antd';
import { 
  Battery, 
  Zap, 
  Clock, 
  ShoppingCart, 
  Heart, 
  Share2, 
  Star,
  MapPin,
  Calendar,
  Shield,
  Settings,
  Car,
  Users,
  Weight,
  Ruler,
  Gauge,
  Wrench,
  Palette,
  Camera,
  CheckCircle,
  AlertCircle,
  Info,
  Eye,
  Bike,
  ArrowLeft,
  Play
} from 'lucide-react';
import { Header } from '../../common/Header';
import { Sidebar } from '../../common/Sidebar';
import { authService } from '../../../services/authService';
import { QuotationModal } from '../QuotationModal';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { useBreakpoint } = Grid;

export const MotorbikeDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [vehicle, setVehicle] = useState<unknown | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('motorbikes');
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const [isFavorite, setIsFavorite] = useState(false);
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const screens = useBreakpoint();

  useEffect(() => {
    window.scrollTo(0, 0);
    if (id) {
      loadVehicle(id);
    }
  }, [id]);

  const loadVehicle = async (vehicleId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🚀 Loading motorbike by ID:', vehicleId);
      const response = await authService.getVehicleById(vehicleId);
      
      if (response.success && response.data) {
        console.log('✅ Motorbike loaded successfully:', response.data);
        setVehicle(response.data);
      } else {
        console.error('❌ Failed to load motorbike:', response.message);
        setError(response.message || 'Không thể tải thông tin xe máy');
        // Không fallback về mock data để thấy lỗi thật
      }
    } catch (err) {
      console.error('❌ Error loading motorbike:', err);
      setError('Lỗi khi tải thông tin xe máy');
      // Không fallback về mock data để thấy lỗi thật
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      'available': { color: 'bg-green-100 text-green-800', text: 'Có sẵn' },
      'coming_soon': { color: 'bg-orange-100 text-orange-800', text: 'Sắp ra mắt' },
      'out_of_stock': { color: 'bg-red-100 text-red-800', text: 'Hết hàng' },
      'discontinued': { color: 'bg-gray-100 text-gray-800', text: 'Ngừng sản xuất' }
    };
    return statusMap[status] || { color: 'bg-gray-100 text-gray-800', text: status };
  };

  const getReleaseStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      'available': { color: 'bg-green-100 text-green-800', text: 'Đã có hàng' },
      'coming_soon': { color: 'bg-blue-100 text-blue-800', text: 'Sắp ra mắt' },
      'pre_order': { color: 'bg-purple-100 text-purple-800', text: 'Đặt trước' }
    };
    return statusMap[status] || { color: 'bg-gray-100 text-gray-800', text: status };
  };

  // Helper function to get vehicle property safely
  const getVehicleProperty = (property: string, defaultValue: unknown = '') => {
    if (!vehicle) return defaultValue;
    const vehicleObj = vehicle as Record<string, unknown>;
    return vehicleObj[property] || defaultValue;
  };

  const handleTestDrive = (vehicleId: string) => {
    navigate(`/portal/motorbike-schedule?vehicleId=${vehicleId}`);
  };

  const handleDeposit = (vehicleId: string) => {
    navigate(`/portal/motorbike-deposit?vehicleId=${vehicleId}`);
  };

  // Get image array
  const images = (getVehicleProperty('images', ['/placeholder-motorbike.jpg']) as string[]);
  
  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spin size="large" />
        <Text className="ml-4">Đang tải thông tin xe máy...</Text>
      </div>
    );
  }

  // Error state
  if (error && !vehicle) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <Alert
            message="Không thể tải thông tin xe máy"
            description={error}
            type="error"
            showIcon
            className="mb-4"
          />
          <Button 
            type="primary" 
            size="large"
            onClick={() => navigate('/portal/motorbike-product')}
          >
            Quay lại danh sách xe máy
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 8,
        },
      }}
    >
      <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <Header 
        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />
      
      {/* Sidebar */}
      <Sidebar
        activeSection={activeSection}
        onSectionChange={(section) => setActiveSection(section)}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpen={() => setIsSidebarOpen(true)}
      />

        <div className={`flex-1 pt-16 transition-all duration-150 pb-8 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
          {/* Breadcrumb */}
          <div className="max-w-7xl mx-auto px-6 py-4">
            <Button 
              type="default"
              icon={<ArrowLeft size={18} />}
              onClick={() => navigate(-1)}
              size="large"
              style={{
                borderRadius: '8px',
                minWidth: '120px',
                fontWeight: 500,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
              className="hover:border-blue-500 hover:text-blue-500 transition-all duration-200"
            >
              Quay lại
            </Button>
          </div>

          <div className="max-w-7xl mx-auto px-6 py-8">
            {/* Product Header */}
            <div className="mb-8">
              <Space className="mb-4">
                <Tag color="blue">{getVehicleProperty('sku', 'N/A') as string}</Tag>
                <Tag color="green">Version {getVehicleProperty('version', '2025') as string}</Tag>
                <Tag color={getVehicleProperty('release_status') === 'available' ? 'success' : 'warning'}>
                  {getVehicleProperty('release_status') === 'available' ? 'Có sẵn' : 'Sắp ra mắt'}
                </Tag>
              </Space>
              
              <Title level={1} className="mb-2">
                {getVehicleProperty('name', getVehicleProperty('model', 'Motorbike')) as string}
              </Title>
              
              <Text type="secondary" className="text-lg">
                {getVehicleProperty('version', '2025') as string} - {(getVehicleProperty('color_options', ['Black']) as string[]).join(', ')}
              </Text>
        </div>

            <Row gutter={[32, 32]}>
            {/* Image Gallery */}
              <Col xs={24} lg={14}>
                <Card className="overflow-hidden shadow-lg">
                  <div className="relative">
                    <Image.PreviewGroup>
                      <Image
                        src={images[selectedImage]}
                        alt={getVehicleProperty('model', 'Motorbike') as string}
                        className="w-full h-[500px] object-cover rounded-lg"
                        preview={{
                          mask: <div className="flex items-center"><Eye size={20} className="mr-2" />Xem chi tiết</div>
                        }}
                      />
                    </Image.PreviewGroup>
                  </div>
                  
                  {/* Thumbnail Gallery */}
                  {images.length > 1 && (
                    <div className="mt-4">
                      <Row gutter={[8, 8]}>
                        {images.slice(0, 5).map((img, index) => (
                          <Col key={index} span={4}>
                            <div
                              className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                                selectedImage === index ? 'border-blue-500' : 'border-gray-200 hover:border-gray-400'
                              }`}
                              onClick={() => setSelectedImage(index)}
                            >
                              <img
                                src={img}
                                alt={`View ${index + 1}`}
                                className="w-full h-16 object-cover"
                />
              </div>
                          </Col>
                        ))}
                      </Row>
                    </div>
                  )}
                </Card>
              </Col>

              {/* Product Info */}
              <Col xs={24} lg={10}>
                <Card className="shadow-lg h-fit">
                  <div className="mb-6">
                    <Title level={2} className="text-green-600 mb-0">
                      {formatPrice(getVehicleProperty('price', 25000000) as number)}
                    </Title>
                    <Text type="secondary">Giá đã bao gồm VAT</Text>
            </div>

                  {/* Key Specs */}
                  <div className="mb-6">
                    <Title level={4} className="mb-4">Thông số chính</Title>
                    <Row gutter={[16, 16]}>
                      <Col span={12}>
                        <Card size="small" className="text-center bg-blue-50">
                          <Battery className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                          <Text strong className="block">{getVehicleProperty('range_km', '120')} km</Text>
                          <Text type="secondary" className="text-xs">Tầm hoạt động</Text>
                        </Card>
                      </Col>
                      <Col span={12}>
                        <Card size="small" className="text-center bg-yellow-50">
                          <Zap className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
                          <Text strong className="block">{getVehicleProperty('top_speed', '80')} km/h</Text>
                          <Text type="secondary" className="text-xs">Tốc độ tối đa</Text>
                        </Card>
                      </Col>
                      <Col span={12}>
                        <Card size="small" className="text-center bg-red-50">
                          <Clock className="h-6 w-6 text-red-500 mx-auto mb-2" />
                          <Text strong className="block">{getVehicleProperty('charging_fast', '1')}h</Text>
                          <Text type="secondary" className="text-xs">Sạc nhanh</Text>
                        </Card>
                      </Col>
                      <Col span={12}>
                        <Card size="small" className="text-center bg-green-50">
                          <Users className="h-6 w-6 text-green-500 mx-auto mb-2" />
                          <Text strong className="block">{getVehicleProperty('seating_capacity', '2')}</Text>
                          <Text type="secondary" className="text-xs">Chỗ ngồi</Text>
                        </Card>
                      </Col>
                    </Row>
                  </div>

                  {/* Additional Specs */}
                  <div className="mb-6">
                    <Title level={5}>Thông số bổ sung</Title>
                    <Row gutter={[8, 8]}>
                      <Col span={12}>
                        <div className="bg-purple-50 p-3 rounded-lg text-center">
                          <Settings className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                          <Text strong className="block text-sm">{getVehicleProperty('motor_power', '0')} kW</Text>
                          <Text type="secondary" className="text-xs">Công suất</Text>
                        </div>
                      </Col>
                      <Col span={12}>
                        <div className="bg-orange-50 p-3 rounded-lg text-center">
                          <Battery className="h-5 w-5 text-orange-600 mx-auto mb-1" />
                          <Text strong className="block text-sm">{getVehicleProperty('battery_capacity', '0')} kWh</Text>
                          <Text type="secondary" className="text-xs">Dung lượng pin</Text>
                        </div>
                      </Col>
                      <Col span={12}>
                        <div className="bg-gray-50 p-3 rounded-lg text-center">
                          <Weight className="h-5 w-5 text-gray-600 mx-auto mb-1" />
                          <Text strong className="block text-sm">{getVehicleProperty('weight', '0')} kg</Text>
                          <Text type="secondary" className="text-xs">Trọng lượng</Text>
                    </div>
                      </Col>
                      <Col span={12}>
                        <div className="bg-blue-50 p-3 rounded-lg text-center">
                          <AlertCircle className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                          <Text strong className="block text-sm">{getVehicleProperty('stock', '0')}</Text>
                          <Text type="secondary" className="text-xs">Tồn kho</Text>
                  </div>
                      </Col>
                    </Row>
                    </div>

                  {/* Color Options */}
                  <div className="mb-6">
                    <Title level={5}>Màu sắc có sẵn</Title>
                    <Space wrap>
                      {(getVehicleProperty('color_options', ['red']) as string[]).map((color, index) => (
                        <div key={index} className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg">
                          <div 
                            className="w-6 h-6 rounded-full border-2 border-gray-300"
                            style={{ backgroundColor: color.toLowerCase() }}
                          />
                          <Text className="font-medium">{color}</Text>
                  </div>
                      ))}
                    </Space>
                    </div>

                  {/* Safety Features */}
                  <div className="mb-6">
                    <Title level={5}>Tính năng an toàn</Title>
                    <div className="flex flex-wrap gap-2">
                      {(getVehicleProperty('safety_features', ['ABS', 'Cảnh báo va chạm']) as string[]).map((feature, index) => (
                        <Tag key={index} color="success" className="mb-1">
                          <CheckCircle size={12} className="mr-1" />
                          {feature}
                        </Tag>
                      ))}
                  </div>
                </div>

                  {/* Stock Status */}
                  <div className="mb-6">
                    <Badge 
                      count={`${getVehicleProperty('stock', '0')} xe có sẵn`} 
                      style={{ backgroundColor: '#52c41a' }}
                      className="w-full"
                    />
                </div>

                  {/* Action Buttons */}
                  <Space direction="vertical" className="w-full" size="middle">
                    <Button
                      type="primary"
                      size="large"
                      block
                      icon={<ShoppingCart size={20} />}
                      onClick={() => handleDeposit(id || '')}
                      className="bg-black hover:bg-gray-800 border-black h-12"
                    >
                      Đặt cọc ngay
                    </Button>
                    <Button
                      size="large"
                      block
                      onClick={() => handleTestDrive(id || '')}
                      className="h-12"
                    >
                      Đặt lịch lái thử
                    </Button>
                    <Button
                      type="default"
                      size="large"
                      block
                      onClick={() => setShowQuotationModal(true)}
                      className="h-12 bg-gradient-to-r from-amber-400 to-yellow-500 border-amber-500 hover:from-amber-500 hover:to-yellow-600 text-white font-semibold"
                    >
                      <span className="flex items-center justify-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Tạo báo giá
                      </span>
                    </Button>
                    <Row gutter={8}>
                      <Col span={12}>
                        <Button
                          icon={<Heart size={18} />}
                          block
                          onClick={() => setIsFavorite(!isFavorite)}
                          className={isFavorite ? 'text-red-500' : ''}
                        >
                          Yêu thích
                        </Button>
                      </Col>
                      <Col span={12}>
                        <Button icon={<Share2 size={18} />} block>
                          Chia sẻ
                        </Button>
                      </Col>
                    </Row>
                  </Space>
                </Card>
              </Col>
            </Row>

            {/* Detailed Information Tabs */}
            <Card className="mt-8 shadow-lg mb-8">
              <Tabs defaultActiveKey="overview" size="large">
                <TabPane tab="Tổng quan" key="overview">
                  <Row gutter={[24, 24]}>
                    <Col xs={24} md={12}>
                      <Title level={4}>Mô tả sản phẩm</Title>
                      <Paragraph className="text-gray-700">
                        {getVehicleProperty('description', 'Xe máy điện VinFast với công nghệ tiên tiến và thiết kế hiện đại.') as string}
                      </Paragraph>
                    </Col>
                    <Col xs={24} md={12}>
                      <Title level={4}>Thông tin bổ sung</Title>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 text-center">
                          <div className="text-lg font-bold text-gray-800 mb-1">{getVehicleProperty('battery_type', 'N/A') as string}</div>
                          <p className="text-gray-600 text-sm font-medium">Loại pin</p>
                        </div>
                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 text-center">
                          <div className="text-lg font-bold text-blue-600 mb-1">{getVehicleProperty('charging_slow', '0')}h</div>
                          <p className="text-gray-600 text-sm font-medium">Sạc chậm</p>
                        </div>
                        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 text-center">
                          <div className="text-lg font-bold text-green-600 mb-1">{getVehicleProperty('acceleration', '0')}s</div>
                          <p className="text-gray-600 text-sm font-medium">Gia tốc</p>
                        </div>
                        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4 text-center">
                          <div className="text-lg font-bold text-purple-600 mb-1">{getVehicleProperty('warranty_years', '3')} năm</div>
                          <p className="text-gray-600 text-sm font-medium">Bảo hành</p>
                        </div>
                      </div>
                    </Col>
                  </Row>
                </TabPane>

                <TabPane tab="Thông số kỹ thuật" key="specs">
                  <Descriptions bordered column={2}>
                    <Descriptions.Item label="Công suất động cơ">
                      {getVehicleProperty('motor_power', '0')} kW
                    </Descriptions.Item>
                    <Descriptions.Item label="Dung lượng pin">
                      {getVehicleProperty('battery_capacity', '0')} kWh
                    </Descriptions.Item>
                    <Descriptions.Item label="Loại pin">
                      {getVehicleProperty('battery_type', 'NMC') as string}
                    </Descriptions.Item>
                    <Descriptions.Item label="Trọng lượng">
                      {getVehicleProperty('weight', '0')} kg
                    </Descriptions.Item>
                    <Descriptions.Item label="Tầm hoạt động">
                      {getVehicleProperty('range_km', '120')} km
                    </Descriptions.Item>
                    <Descriptions.Item label="Tốc độ tối đa">
                      {getVehicleProperty('top_speed', '80')} km/h
                    </Descriptions.Item>
                    <Descriptions.Item label="Sạc nhanh">
                      {getVehicleProperty('charging_fast', '1')} giờ
                    </Descriptions.Item>
                    <Descriptions.Item label="Sạc chậm">
                      {getVehicleProperty('charging_slow', '5')} giờ
                    </Descriptions.Item>
                    <Descriptions.Item label="Gia tốc 0-50km/h">
                      {getVehicleProperty('acceleration', '4')} giây
                    </Descriptions.Item>
                    <Descriptions.Item label="Số chỗ ngồi">
                      {getVehicleProperty('seating_capacity', '2')}
                    </Descriptions.Item>
                    <Descriptions.Item label="Bảo hành">
                      {getVehicleProperty('warranty_years', '3')} năm
                    </Descriptions.Item>
                    <Descriptions.Item label="Tình trạng kho">
                      <Badge 
                        status={Number(getVehicleProperty('stock', 0)) > 0 ? 'success' : 'error'}
                        text={`${getVehicleProperty('stock', '0')} xe`}
                      />
                    </Descriptions.Item>
                  </Descriptions>
                </TabPane>

                <TabPane tab="Hình ảnh & Video" key="media">
                  <Row gutter={[16, 16]}>
                    {images.map((img, index) => (
                      <Col key={index} xs={24} sm={12} md={8} lg={6}>
                        <Image
                          src={img}
                          alt={`Gallery ${index + 1}`}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      </Col>
                    ))}
                  </Row>
                </TabPane>
              </Tabs>
            </Card>
            
            {/* Call to Action Bottom - With proper margin to ensure space between content and footer */}
            <div className="mt-8 mb-10 bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 text-white text-center shadow-xl">
              <Title level={2} className="text-white mb-4">Sẵn sàng trải nghiệm {getVehicleProperty('model', 'xe máy điện') as string}?</Title>
              <Paragraph className="text-blue-100 mb-6 text-lg">
                Đặt lịch lái thử hoặc đặt cọc ngay hôm nay để nhận ưu đãi đặc biệt
              </Paragraph>
              
              <Space size="large" wrap>
                <Button
                  type="primary"
                  size="large"
                  onClick={() => handleDeposit(id || '')}
                  className="bg-white text-blue-700 border-none hover:bg-blue-50 h-12 px-8 font-semibold"
                >
                  Đặt cọc ngay
                </Button>
                <Button
                  size="large"
                  onClick={() => handleTestDrive(id || '')}
                  className="border-white text-blue-700 hover:bg-white/20 h-12 px-8 font-semibold"
                >
                  Đặt lịch lái thử
                </Button>
                <Button
                  size="large"
                  onClick={() => setShowQuotationModal(true)}
                  className="bg-gradient-to-r from-amber-400 to-yellow-500 border-none hover:from-amber-500 hover:to-yellow-600 text-white h-12 px-8 font-semibold"
                >
                  <span className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Tạo báo giá
                  </span>
                </Button>
              </Space>
              </div>
            </div>
          </div>

       

      {/* Quotation Modal */}
      <QuotationModal
        visible={showQuotationModal}
        onClose={() => setShowQuotationModal(false)}
        vehicleId={id || ''}
        vehicleName={getVehicleProperty('name', getVehicleProperty('model', 'Motorbike')) as string}
        vehiclePrice={getVehicleProperty('price', 0) as number}
        colorOptions={getVehicleProperty('color_options', []) as string[]}
      />
      </div>
    </ConfigProvider>
  );
};
