import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Layout, 
  Button, 
  Row, 
  Col, 
  Typography, 
  Spin, 
  Image, 
  Space, 
  Card, 
  Divider,
  BackTop,
  Affix,
  Badge,
  Progress
} from 'antd';
import {
  ArrowLeftOutlined,
  ShoppingCartOutlined,
  CarOutlined,
  HeartOutlined,
  ShareAltOutlined,
  CheckCircleOutlined,
  RotateLeftOutlined,
  RotateRightOutlined,
  DownloadOutlined,
  ArrowUpOutlined,
  ThunderboltOutlined,
  PoweroffOutlined,
  ClockCircleOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';
import { authService } from '../../../services/authService';
import { QuotationModal } from '../QuotationModal';

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

// Map các màu tiếng Anh sang mã hex
const colorHexMap: Record<string, string> = {
  'red': '#FF0000',
  'blue': '#0000FF',
  'green': '#008000',
  'yellow': '#FFFF00',
  'black': '#000000',
  'white': '#FFFFFF',
  'gray': '#808080',
  'silver': '#C0C0C0',
  'orange': '#FFA500',
  'pink': '#FFC0CB',
  'purple': '#800080',
};

export const CarDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [vehicle, setVehicle] = useState<unknown | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedColor, setSelectedColor] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  
  // Refs for section navigation
  const introRef = useRef<HTMLDivElement>(null);
  const exteriorRef = useRef<HTMLDivElement>(null);
  const interiorRef = useRef<HTMLDivElement>(null);
  const specsRef = useRef<HTMLDivElement>(null);
  const priceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    setImageLoaded(false);
    setShowContent(false);
    
    if (id) {
      loadVehicle(id);
    }
  }, [id]);

  const loadVehicle = async (vehicleId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🚀 Loading vehicle by ID:', vehicleId);
      const response = await authService.getVehicleById(vehicleId);
      
      if (response.success && response.data) {
        console.log('✅ Vehicle loaded successfully:', response.data);
        setVehicle(response.data);
      } else {
        console.error('❌ Failed to load vehicle:', response.message);
        setError(response.message || 'Không thể tải thông tin xe');
      }
    } catch (err) {
      console.error('❌ Error loading vehicle:', err);
      setError('Lỗi khi tải thông tin xe');
    } finally {
      setLoading(false);
    }
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    setTimeout(() => {
      setShowContent(true);
    }, 500);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const getVehicleProperty = (property: string, defaultValue: unknown = '') => {
    if (!vehicle) return defaultValue;
    const vehicleObj = vehicle as Record<string, unknown>;
    return vehicleObj[property] || defaultValue;
  };

  // Scroll to section
  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Rotate car image
  const rotateCar = (direction: 'left' | 'right') => {
    setRotation(prev => direction === 'left' ? prev - 45 : prev + 45);
  };

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Spin size="large" tip="Đang tải thông tin xe..." />
      </div>
    );
  }

  if (error && !vehicle) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
        <Title level={3} style={{ marginBottom: 16 }}>Không thể tải thông tin xe</Title>
        <Text type="danger" style={{ marginBottom: 24 }}>{error}</Text>
        <Button 
          type="primary"
          onClick={() => navigate('/portal/car-product')}
          size="large"
        >
          Quay lại danh sách xe
        </Button>
      </div>
    );
  }

  // Lấy thông tin cần thiết từ vehicle
  const images = getVehicleProperty('images', []) as string[];
  const colorOptions = getVehicleProperty('color_options', ['Đỏ', 'Trắng', 'Đen', 'Xanh', 'Vàng', 'Xám', 'Bạc']) as string[];
  const safetyFeatures = getVehicleProperty('safety_features', []) as string[];

  // Dữ liệu cho bảng thông số kỹ thuật
  const specificationData = [
    { key: 'engine', label: 'Động cơ', value: '01 Motor điện' },
    { key: 'power', label: 'Công suất tối đa (kW)', value: `${getVehicleProperty('motor_power', '30')} kW` },
    { key: 'torque', label: 'Mô men xoắn cực đại (Nm)', value: '110' },
    { key: 'battery', label: 'Loại pin', value: getVehicleProperty('battery_type', 'NMC') },
    { key: 'battery_capacity', label: 'Dung lượng pin', value: `${getVehicleProperty('battery_capacity', '18.4')} kWh` },
    { key: 'range', label: 'Quãng đường chạy một lần sạc đầy', value: `${getVehicleProperty('range_km', '300')} km` },
    { key: 'charging_fast', label: 'Thời gian sạc nhanh', value: `${getVehicleProperty('charging_fast', '1')} giờ` },
    { key: 'charging_slow', label: 'Thời gian sạc chậm', value: `${getVehicleProperty('charging_slow', '5')} giờ` },
    { key: 'weight', label: 'Trọng lượng', value: `${getVehicleProperty('weight', '1200')} kg` },
    { key: 'seats', label: 'Số chỗ ngồi', value: getVehicleProperty('seating_capacity', '5') }
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#fff' }}>
      {/* Premium Navigation Header */}
      <Affix>
        <Header style={{ 
          background: 'rgba(255, 255, 255, 0.95)', 
          backdropFilter: 'blur(20px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          padding: '0 40px',
          zIndex: 1000,
          border: 'none'
        }}>
          <Row justify="space-between" align="middle" style={{ height: '100%' }}>
            <Col>
              <Space size="large">
                <Button 
                  icon={<ArrowLeftOutlined />} 
                  type="default"
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
                <Title level={2} style={{ 
                  margin: 0, 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: 700
                }}>
                  VinFast {getVehicleProperty('model', 'VF3') as string}
                </Title>
              </Space>
            </Col>
            <Col>
              <Space size="large">
                <Button 
                  type="text" 
                  onClick={() => scrollToSection(introRef)}
                  style={{ fontWeight: 500, color: '#6b7280' }}
                >
                  Giới thiệu
                </Button>
                <Button 
                  type="text" 
                  onClick={() => scrollToSection(exteriorRef)}
                  style={{ fontWeight: 500, color: '#6b7280' }}
                >
                  Ngoại thất
                </Button>
                <Button 
                  type="text" 
                  onClick={() => scrollToSection(specsRef)}
                  style={{ fontWeight: 500, color: '#6b7280' }}
                >
                  Thông số
                </Button>
              </Space>
            </Col>
            <Col>
              <Space>
                <Button 
                  icon={<HeartOutlined />}
                  shape="circle"
                  size="large"
                  onClick={() => setIsFavorite(!isFavorite)}
                  style={{ 
                    borderColor: isFavorite ? '#ff4d4f' : '#e5e7eb',
                    color: isFavorite ? '#ff4d4f' : '#6b7280'
                  }}
                />
                <Button 
                  type="primary" 
                  size="large"
                  onClick={() => navigate(`/car-deposit?vehicleId=${id}`)}
                  style={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    borderRadius: 8,
                    fontWeight: 600,
                    height: 44,
                    paddingLeft: 24,
                    paddingRight: 24
                  }}
                >
                  Đặt cọc ngay
                </Button>
              </Space>
            </Col>
          </Row>
        </Header>
      </Affix>

      <Content>
        {/* Hero Section - Premium Design */}
        <div style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          position: 'relative',
          overflow: 'hidden',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center'
        }}>
          {/* Animated Background Elements */}
          <div style={{
            position: 'absolute',
            top: '10%',
            right: '10%',
            width: 200,
            height: 200,
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '50%',
            filter: 'blur(40px)'
          }} />
          <div style={{
            position: 'absolute',
            bottom: '10%',
            left: '5%',
            width: 150,
            height: 150,
            background: 'rgba(255,255,255,0.08)',
            borderRadius: '50%',
            filter: 'blur(30px)'
          }} />

          <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 40px', width: '100%', zIndex: 2 }}>
            <Row gutter={[64, 64]} align="middle">
              <Col xs={24} lg={14}>
                <div style={{ position: 'relative', textAlign: 'center' }}>
                  {/* Car Showcase */}
                  <div style={{
                    position: 'relative',
                    padding: '60px 0',
                    filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.3))'
                  }}>
                    <Image
                      src={images[0] || '/placeholder-car.jpg'}
                      alt={getVehicleProperty('model', 'Car') as string}
                      style={{ 
                        width: '100%',
                        maxWidth: 700,
                        height: 'auto'
                      }}
                      preview={false}
            onLoad={handleImageLoad}
          />
        </div>

                  {/* Floating Badge */}
                  <div style={{
                    position: 'absolute',
                    top: 40,
                    right: 40,
                    background: 'rgba(255,255,255,0.9)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: 20,
                    padding: '8px 16px',
                    color: '#1f2937',
                    fontWeight: 600,
                    fontSize: 14
                  }}>
                    🔥 Mới nhất 2024
                  </div>
        </div>
              </Col>
              
              <Col xs={24} lg={10}>
                <div style={{ color: 'white' }}>
                  <Badge count="Hot" style={{ backgroundColor: '#ff4d4f', marginBottom: 20 }}>
                    <div style={{ width: 'auto', minWidth: 60 }} />
                  </Badge>
                  
                  <Title level={1} style={{ 
                    color: 'white', 
                    fontSize: 56, 
                    marginBottom: 16,
                    fontWeight: 800,
                    lineHeight: 1.1,
                    textShadow: '0 4px 20px rgba(0,0,0,0.3)'
                  }}>
                    VinFast<br/>{getVehicleProperty('model', 'VF3') as string}
                  </Title>
                  
                  <Paragraph style={{ 
                    fontSize: 20, 
                    color: 'rgba(255,255,255,0.9)', 
                    marginBottom: 32,
                    lineHeight: 1.6
                  }}>
                    Xe điện thông minh cho thành phố hiện đại.<br/>
                    Thiết kế tinh tế, công nghệ vượt trội.
                  </Paragraph>
                  
                  {/* Price Section */}
                  <div style={{ 
                    background: 'rgba(255,255,255,0.1)', 
                    backdropFilter: 'blur(20px)',
                    borderRadius: 16,
                    padding: 24,
                    marginBottom: 32,
                    border: '1px solid rgba(255,255,255,0.2)'
                  }}>
                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16 }}>Giá từ</Text>
                    <Title level={2} style={{ 
                      color: 'white', 
                      margin: '8px 0',
                      fontSize: 36,
                      fontWeight: 700
                    }}>
                      {formatPrice(getVehicleProperty('price', 240000000) as number)}
                    </Title>
                    <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
                      Đã bao gồm VAT • Hỗ trợ trả góp 0%
                    </Text>
      </div>

                  {/* CTA Buttons */}
                  <Space size={16} style={{ width: '100%' }} direction="vertical">
                    <Button
                      type="primary"
                      size="large"
                      icon={<ShoppingCartOutlined />}
                      onClick={() => navigate(`/car-deposit?vehicleId=${id}`)}
                      style={{ 
                        background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
                        border: 'none',
                        borderRadius: 12,
                        height: 56,
                        fontSize: 16,
                        fontWeight: 700,
                        width: '100%',
                        boxShadow: '0 8px 32px rgba(245, 158, 11, 0.4)'
                      }}
                    >
                      ĐẶT CỌC NGAY - NHẬN ƯU ĐÃI
                    </Button>
                    <Button
                      size="large"
                      icon={<CarOutlined />}
                      onClick={() => navigate(`/portal/test-drive?vehicleId=${id}`)}
                      style={{ 
                        borderColor: 'rgba(255,255,255,0.4)',
                        color: 'white',
                        borderRadius: 12,
                        height: 48,
                        width: '100%',
                        fontWeight: 600,
                        background: 'rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(20px)'
                      }}
                    >
                      Đăng ký lái thử miễn phí
                    </Button>
                    <Button
                      size="large"
                      icon={<ThunderboltOutlined />}
                      onClick={() => setShowQuotationModal(true)}
                      style={{ 
                        borderColor: 'rgba(255,255,255,0.4)',
                        color: 'white',
                        borderRadius: 12,
                        height: 48,
                        width: '100%',
                        fontWeight: 600,
                        background: 'linear-gradient(135deg, rgba(250,204,21,0.2), rgba(234,179,8,0.3))',
                        border: '2px solid rgba(250,204,21,0.6)',
                        backdropFilter: 'blur(20px)'
                      }}
                    >
                      Tạo báo giá
                    </Button>
                  </Space>
                </div>
              </Col>
            </Row>
        </div>
      </div>

        {/* Key Features - Modern Cards */}
        <div style={{ 
          background: '#f8fafc', 
          padding: '100px 0',
          position: 'relative'
        }}>
          <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 40px' }}>
            <Title level={2} style={{ 
              textAlign: 'center', 
              marginBottom: 60,
              fontSize: 42,
              fontWeight: 700,
              color: '#1f2937'
            }}>
              Tính năng nổi bật
            </Title>
            
            <Row gutter={[32, 32]}>
              <Col xs={24} sm={12} lg={6}>
                <Card style={{
                  borderRadius: 20,
                  border: 'none',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                  height: '100%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white'
                }}>
                  <div style={{ textAlign: 'center', padding: 20 }}>
                    <PoweroffOutlined style={{ fontSize: 48, marginBottom: 16, color: 'white' }} />
                    <Title level={3} style={{ color: 'white', marginBottom: 8 }}>
                      {getVehicleProperty('range_km', '300')} km
                    </Title>
                    <Text style={{ color: 'rgba(255,255,255,0.9)' }}>Phạm vi hoạt động</Text>
                  </div>
                </Card>
              </Col>
              
              <Col xs={24} sm={12} lg={6}>
                <Card style={{
                  borderRadius: 20,
                  border: 'none',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                  height: '100%',
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  color: 'white'
                }}>
                  <div style={{ textAlign: 'center', padding: 20 }}>
                    <ThunderboltOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                    <Title level={3} style={{ color: 'white', marginBottom: 8 }}>
                      {getVehicleProperty('motor_power', '30')} kW
                    </Title>
                    <Text style={{ color: 'rgba(255,255,255,0.9)' }}>Công suất tối đa</Text>
            </div>
                </Card>
              </Col>
              
              <Col xs={24} sm={12} lg={6}>
                <Card style={{
                  borderRadius: 20,
                  border: 'none',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                  height: '100%',
                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  color: 'white'
                }}>
                  <div style={{ textAlign: 'center', padding: 20 }}>
                    <ClockCircleOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                    <Title level={3} style={{ color: 'white', marginBottom: 8 }}>
                      {getVehicleProperty('charging_fast', '1')}h
                    </Title>
                    <Text style={{ color: 'rgba(255,255,255,0.9)' }}>Sạc nhanh (10%-70%)</Text>
            </div>
                </Card>
              </Col>
              
              <Col xs={24} sm={12} lg={6}>
                <Card style={{
                  borderRadius: 20,
                  border: 'none',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                  height: '100%',
                  background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                  color: 'white'
                }}>
                  <div style={{ textAlign: 'center', padding: 20 }}>
                    <SafetyCertificateOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                    <Title level={3} style={{ color: 'white', marginBottom: 8 }}>
                      5★
                    </Title>
                    <Text style={{ color: 'rgba(255,255,255,0.9)' }}>An toàn tối đa</Text>
            </div>
                </Card>
              </Col>
            </Row>
            </div>
          </div>
          
        {/* Exterior Section - 360° Viewer */}
        <div ref={exteriorRef} style={{ 
          background: 'white', 
          padding: '100px 0',
          position: 'relative'
        }}>
          <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 40px' }}>
            <div style={{ textAlign: 'center', marginBottom: 80 }}>
              <Title level={2} style={{ 
                fontSize: 42,
                fontWeight: 700,
                color: '#1f2937',
                marginBottom: 16
              }}>
                Ngoại thất đẳng cấp
              </Title>
              <Paragraph style={{ fontSize: 18, color: '#6b7280', maxWidth: 600, margin: '0 auto' }}>
                Thiết kế hiện đại với đường nét tinh tế, thể hiện phong cách sống năng động
              </Paragraph>
            </div>
            
            {/* 360° Car Viewer */}
            <div style={{ 
              background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
              borderRadius: 30,
              padding: 60,
              marginBottom: 60,
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Decorative Elements */}
              <div style={{
                position: 'absolute',
                top: -50,
                right: -50,
                width: 200,
                height: 200,
                background: 'rgba(102, 126, 234, 0.1)',
                borderRadius: '50%',
                filter: 'blur(40px)'
              }} />
              
              <div style={{ 
                position: 'relative',
                textAlign: 'center'
              }}>
                <div style={{
                  position: 'relative',
                  maxWidth: 900,
                  margin: '0 auto',
                  height: 500,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {/* Enhanced Floor Shadow */}
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    width: '80%',
                    height: 30,
                    background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0) 70%)',
                    borderRadius: '50%',
                    filter: 'blur(15px)'
                  }} />
                  
                  <Image
                    src={images[selectedColor] || images[0] || '/placeholder-car.jpg'}
                    alt={getVehicleProperty('model', 'Car') as string}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      transform: `rotate(${rotation}deg) scale(1.1)`,
                      transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                      filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.2))'
                    }}
                    preview={false}
                  />
                  
                  {/* 360° Badge */}
                  <div style={{
                    position: 'absolute',
                    top: 20,
                    right: 20,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 600,
                    boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)'
                  }}>
                    360° VIEW
                  </div>
                  
                  {/* Rotation Controls */}
                  <div style={{
                    position: 'absolute',
                    bottom: -20,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: 16,
                    background: 'rgba(255,255,255,0.9)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: 25,
                    padding: '12px 20px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                  }}>
                    <Button 
                      icon={<RotateLeftOutlined />}
                      onClick={() => rotateCar('left')}
                      shape="circle"
                      size="large"
                      style={{ 
                        border: 'none',
                        background: 'transparent',
                        color: '#667eea'
                      }}
                    />
                    <Divider type="vertical" style={{ height: 40, margin: 0 }} />
                    <Button 
                      icon={<RotateRightOutlined />}
                      onClick={() => rotateCar('right')}
                      shape="circle"
                      size="large"
                      style={{ 
                        border: 'none',
                        background: 'transparent',
                        color: '#667eea'
                      }}
                    />
                  </div>
          </div>
        </div>
      </div>

            {/* Color Selection */}
            <div style={{ textAlign: 'center' }}>
              <Title level={3} style={{ 
                marginBottom: 32,
                color: '#1f2937',
                fontSize: 28
              }}>
                {colorOptions[selectedColor] || 'Màu sắc'} 
              </Title>

              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 20,
                flexWrap: 'wrap'
              }}>
                {colorOptions.map((color, index) => {
                  const colorLower = color.toLowerCase();
                  const colorCode = colorHexMap[colorLower] || '#ccc';
                  
                  return (
                    <div
                      key={index}
                      onClick={() => setSelectedColor(index)}
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        backgroundColor: colorCode,
                        cursor: 'pointer',
                        border: index === selectedColor ? '4px solid #667eea' : '4px solid transparent',
                        boxShadow: index === selectedColor 
                          ? '0 8px 32px rgba(102, 126, 234, 0.4), inset 0 0 0 2px white' 
                          : '0 4px 20px rgba(0,0,0,0.1)',
                        transition: 'all 0.3s ease',
                        transform: index === selectedColor ? 'scale(1.1)' : 'scale(1)',
                        position: 'relative'
                      }}
                    >
                      {index === selectedColor && (
                        <div style={{
                          position: 'absolute',
                          top: -8,
                          right: -8,
                          width: 20,
                          height: 20,
                          background: '#667eea',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <CheckCircleOutlined style={{ color: 'white', fontSize: 12 }} />
                </div>
                )}
              </div>
                  );
                })}
              </div>
            </div>
            </div>
          </div>

        {/* Specifications Section - Premium Table */}
        <div ref={specsRef} style={{ 
          background: '#f8fafc', 
          padding: '100px 0'
        }}>
          <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 40px' }}>
            <Title level={2} style={{ 
              textAlign: 'center', 
              marginBottom: 80,
              fontSize: 42,
              fontWeight: 700,
              color: '#1f2937'
            }}>
              Thông số kỹ thuật
            </Title>
            
            <Row gutter={64}>
              <Col xs={24} lg={16}>
                <Card style={{ 
                  borderRadius: 20,
                  border: 'none',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
                  overflow: 'hidden'
                }}>
                  <div style={{ padding: 40 }}>
                    {specificationData.map((spec, index) => (
                      <div
                        key={spec.key}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '20px 0',
                          borderBottom: index < specificationData.length - 1 ? '1px solid #f1f5f9' : 'none'
                        }}
                      >
                        <Text style={{ 
                          color: '#64748b', 
                          fontWeight: 500,
                          fontSize: 16
                        }}>
                          {spec.label}
                        </Text>
                        <Text style={{ 
                          color: '#1e293b', 
                          fontWeight: 700,
                          fontSize: 16
                        }}>
                          {spec.value}
                        </Text>
                      </div>
                    ))}
                  </div>
                  
                  
                </Card>
              </Col>
              
              <Col xs={24} lg={8}>
                <div style={{ 
                  position: 'sticky', 
                  top: 120,
                  background: 'white',
                  borderRadius: 20,
                  padding: 40,
                  boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
                  textAlign: 'center'
                }}>
                  <Image
                    src={images[0] || '/placeholder-car.jpg'}
                    alt={getVehicleProperty('model', 'Car') as string}
                    preview={false}
                    style={{ 
                      maxWidth: '100%',
                      borderRadius: 12
                    }}
                  />
                  
                  <Title level={4} style={{ 
                    marginTop: 24,
                    color: '#1f2937'
                  }}>
                    {getVehicleProperty('model', 'VF3')} {getVehicleProperty('version', '2024')}
                  </Title>
                  
                  <Text style={{ color: '#64748b' }}>
                    {getVehicleProperty('category', 'Xe điện thành phố')}
                  </Text>
          </div>
              </Col>
            </Row>
        </div>
      </div>
      </Content>

      <BackTop style={{ right: 32, bottom: 32 }}>
        <Button 
          type="primary" 
          shape="circle" 
          icon={<ArrowUpOutlined />} 
          size="large"
          style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            width: 56,
            height: 56,
            boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)'
          }}
        />
      </BackTop>

      {/* Quotation Modal */}
      <QuotationModal
        visible={showQuotationModal}
        onClose={() => setShowQuotationModal(false)}
        vehicleId={id || ''}
        vehicleName={`VinFast ${getVehicleProperty('model', 'VF3')} ${getVehicleProperty('version', '')}`}
        vehiclePrice={getVehicleProperty('price', 0) as number}
        colorOptions={colorOptions}
      />
    </Layout>
  );
};
