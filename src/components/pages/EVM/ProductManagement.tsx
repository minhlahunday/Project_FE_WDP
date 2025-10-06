import React, { useEffect, useState } from "react";
import { AdminLayout } from "../admin/AdminLayout";
import { get } from "../../../services/httpClient";
import AddProduct from "./AddProduct";
import "../../../styles/antd-custom.css";
import { 
  Card, 
  Row, 
  Col, 
  Button, 
  Input, 
  Tag, 
  Space, 
  Typography, 
  Image,
  message,
  Badge,
  Avatar,
  Tooltip,
  Modal,
  Descriptions,
  Divider,
  Statistic
} from 'antd';
import { 
  PlusOutlined, 
  CarOutlined, 
  ThunderboltOutlined, 
  AppstoreOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  SearchOutlined,
  HomeOutlined,
  RightOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Search } = Input;

interface Product {
  _id: string;
  name: string;
  model: string;
  category: string;
  manufacturer_id: string | { _id: string; name: string };
  sku: string;
  version: string;
  release_status: string;
  release_date: string;
  status: string;
  price: number;
  on_road_price: number;
  battery_type: string;
  battery_capacity: number;
  range_km: number;
  wltp_range_km: number;
  charging_fast: number;
  charging_slow: number;
  charging_port_type: string;
  motor_power: number;
  top_speed: number;
  acceleration: number;
  drivetrain: string;
  dimensions: {
    length: number;
    width: number;
    height: number;
    wheelbase: number;
    ground_clearance: number;
  };
  weight: number;
  payload: number;
  seating_capacity: number;
  tire_size: string;
  trunk_type: string;
  safety_features: string[];
  interior_features: Array<{
    name: string;
    description: string;
  }>;
  driving_modes: string[];
  software_version: string;
  ota_update: boolean;
  stock: number;
  stocks: Array<{
    owner_type: string;
    owner_id: string;
    quantity: number;
    _id: string;
  }>;
  warranty_years: number;
  battery_warranty_years: number;
  color_options: string[];
  images: string[];
  description: string;
  promotions: string[];
  createdAt: string;
  updatedAt: string;
}

const ProductManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<'car' | 'motorbike' | ''>('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductDetail, setShowProductDetail] = useState(false);
  const [showEditProduct, setShowEditProduct] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const createStatusFormData = (status: string) => {
    const formData = new FormData();
    formData.append('status', status);
    return formData;
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await get<any>("/api/vehicles");
      if (res.data && Array.isArray(res.data.data)) {
        setProducts(res.data.data);
        setError(null);
      } else if (res.data && Array.isArray(res.data)) {
        setProducts(res.data);
        setError(null);
      } else {
        throw new Error("Invalid data format from API");
      }
    } catch (err) {
      setError("Không thể tải danh sách sản phẩm. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const cars = products.filter((product) => product.category === 'car');
  const motorbikes = products.filter((product) => product.category === 'motorbike');

  const filteredCars = cars.filter(
    (product) => {
      const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.model?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
      return matchesSearch && matchesStatus;
    }
  );
  const filteredMotorbikes = motorbikes.filter(
    (product) => {
      const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.model?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
      return matchesSearch && matchesStatus;
    }
  );

  const handleViewProduct = async (productId: string) => {
    try {
      setLoading(true);
      const res = await get<any>(`/api/vehicles/${productId}`);
      setSelectedProduct(res.data);
      setShowProductDetail(true);
    } catch (err) {
      message.error('Không thể tải thông tin sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProduct = async (product: Product) => {
    try {
      setLoading(true);
      // Fetch latest product data from server to ensure we have the most up-to-date info
      const res = await get<any>(`/api/vehicles/${product._id}`);
      console.log('Fresh product data for edit:', res.data);
      console.log('Fresh product images:', res.data?.images);
      setSelectedProduct(res.data);
      setShowEditProduct(true);
    } catch (err) {
      message.error('Không thể tải thông tin sản phẩm để chỉnh sửa');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = (product: Product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;
    
    try {
      setLoading(true);
      const { del } = await import("../../../services/httpClient");
      await del(`/api/vehicles/${productToDelete._id}`);
      message.success('Đã ngừng kinh doanh sản phẩm thành công');
      setShowDeleteModal(false);
      setProductToDelete(null);
      fetchProducts();
    } catch (err) {
      console.error('Error deleting product:', err);
      message.error('Không thể ngừng kinh doanh sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setProductToDelete(null);
  };

  const handleReactivateProduct = async (product: Product) => {
    try {
      setLoading(true);
      const { put } = await import("../../../services/httpClient");
      const formData = createStatusFormData('active');
      await put(`/api/vehicles/${product._id}`, formData);
      message.success('Đã kích hoạt lại sản phẩm thành công');
      fetchProducts();
    } catch (err) {
      console.error('Error reactivating product:', err);
      message.error('Không thể kích hoạt lại sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDetailModal = () => {
    setShowProductDetail(false);
    setSelectedProduct(null);
  };

  const handleCloseEditModal = () => {
    setShowEditProduct(false);
    setSelectedProduct(null);
  };

  return (
    <AdminLayout activeSection="product-management">
      <div style={{ background: '#f5f7fa' }}>
        {/* Modern Page Header */}
        <div style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '32px 0',
          marginLeft: '-24px',
          marginRight: '-24px',
          marginBottom: 24,
          paddingLeft: '60px',
          paddingRight: '40px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
            <HomeOutlined style={{ color: 'rgba(255,255,255,0.8)', marginRight: 8 }} />
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>Trang chủ</Text>
            <RightOutlined style={{ color: 'rgba(255,255,255,0.8)', margin: '0 8px', fontSize: 12 }} />
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: 500 }}>Quản lý sản phẩm</Text>
          </div>
          
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={2} style={{ margin: 0, color: '#fff', marginBottom: 8, marginLeft: 16 }}>
                Quản lý sản phẩm
              </Title>
              <Space size="large">
                <Statistic 
                  title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>Tổng sản phẩm</span>}
                  value={products.length} 
                  valueStyle={{ color: '#fff', fontSize: 24 }}
                />
                <Statistic 
                  title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>Ô tô</span>}
                  value={cars.length} 
                  valueStyle={{ color: '#fff', fontSize: 24 }}
                  prefix={<CarOutlined />}
                />
                <Statistic 
                  title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>Xe máy điện</span>}
                  value={motorbikes.length} 
                  valueStyle={{ color: '#fff', fontSize: 24 }}
                  prefix={<ThunderboltOutlined />}
                />
              </Space>
            </Col>
            <Col>
              <Button
                type="primary"
                size="large"
                icon={<PlusOutlined />}
                onClick={() => setShowAddProduct(!showAddProduct)}
                style={{ 
                  background: '#fff',
                  borderColor: '#fff',
                  color: '#667eea',
                  borderRadius: 8,
                  height: 48,
                  paddingLeft: 24,
                  paddingRight: 24,
                  fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
              >
                {showAddProduct ? 'Đóng form' : 'Thêm sản phẩm mới'}
              </Button>
            </Col>
          </Row>
        </div>

        <div style={{ paddingBottom: '60px' }}>
          {showAddProduct && (
            <Card 
              style={{ 
                marginBottom: 24, 
                borderRadius: 12,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }}
            >
              <AddProduct 
                isOpen={showAddProduct} 
                onClose={() => setShowAddProduct(false)}
                onProductCreated={fetchProducts}
              />
            </Card>
          )}

          {error && (
            <div style={{ 
              background: '#fff2f0', 
              border: '1px solid #ffccc7', 
              borderRadius: 12, 
              padding: 16, 
              marginBottom: 24,
              color: '#ff4d4f',
              display: 'flex',
              alignItems: 'center'
            }}>
              <WarningOutlined style={{ marginRight: 12, fontSize: 20 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Modern Toolbar */}
          <Card 
            style={{ 
              marginBottom: 24, 
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <div style={{ marginBottom: 12 }}>
                  <Text strong style={{ fontSize: 14, color: '#262626', marginBottom: 8, display: 'block' }}>
                    Danh mục sản phẩm
                  </Text>
                  <Space wrap>
                    <Button
                      type={activeCategory === '' ? 'primary' : 'default'}
                      icon={<AppstoreOutlined />}
                      onClick={() => setActiveCategory('')}
                      size="large"
                      style={{ borderRadius: 8 }}
                    >
                      Tất cả ({filteredCars.length + filteredMotorbikes.length})
                    </Button>
                    <Button
                      type={activeCategory === 'car' ? 'primary' : 'default'}
                      icon={<CarOutlined />}
                      onClick={() => setActiveCategory('car')}
                      size="large"
                      style={{ borderRadius: 8 }}
                    >
                      Ô tô ({filteredCars.length})
                    </Button>
                    <Button
                      type={activeCategory === 'motorbike' ? 'primary' : 'default'}
                      icon={<ThunderboltOutlined />}
                      onClick={() => setActiveCategory('motorbike')}
                      size="large"
                      style={{ borderRadius: 8 }}
                    >
                      Xe máy ({filteredMotorbikes.length})
                    </Button>
                  </Space>
                </div>
                
                <div>
                  <Text strong style={{ fontSize: 14, color: '#262626', marginBottom: 8, display: 'block' }}>
                    Trạng thái
                  </Text>
                  <Space wrap>
                    <Button
                      type={statusFilter === 'all' ? 'primary' : 'default'}
                      onClick={() => setStatusFilter('all')}
                      style={{ borderRadius: 8 }}
                    >
                      Tất cả
                    </Button>
                    <Button
                      type={statusFilter === 'active' ? 'primary' : 'default'}
                      onClick={() => setStatusFilter('active')}
                      style={{ borderRadius: 8 }}
                    >
                      <CheckCircleOutlined /> Đang bán
                    </Button>
                    <Button
                      type={statusFilter === 'inactive' ? 'primary' : 'default'}
                      onClick={() => setStatusFilter('inactive')}
                      danger={statusFilter === 'inactive'}
                      style={{ borderRadius: 8 }}
                    >
                      <WarningOutlined /> Ngừng kinh doanh
                    </Button>
                  </Space>
                </div>
              </Col>
              
              <Col xs={24} lg={12}>
                <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%' }}>
                  <Search
                    placeholder="Tìm kiếm theo tên sản phẩm, model..."
                    allowClear
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    size="large"
                    prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                    style={{ width: '100%' }}
                  />
                </div>
              </Col>
            </Row>
          </Card>

          {loading && (
            <Card style={{ textAlign: 'center', padding: 60, borderRadius: 12 }}>
              <div style={{
                width: 48,
                height: 48,
                border: '4px solid #f0f0f0',
                borderTop: '4px solid #1890ff',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px'
              }}></div>
              <Text type="secondary" style={{ fontSize: 16 }}>Đang tải dữ liệu...</Text>
            </Card>
          )}

          {!loading && (activeCategory === '' || activeCategory === 'car') && (
            <div style={{ marginBottom: 40 }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: 20 
              }}>
                <Title level={3} style={{ margin: 0, color: '#262626' }}>
                  <CarOutlined style={{ marginRight: 12, color: '#1890ff' }} />
                  Danh sách ô tô
                </Title>
                <Badge count={filteredCars.length} showZero style={{ backgroundColor: '#1890ff' }} />
              </div>
              
              {filteredCars.length === 0 ? (
                <Card style={{ textAlign: 'center', padding: 80, borderRadius: 12, paddingLeft: 80 }}>
                  <CarOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
                  <Text type="secondary">Không tìm thấy sản phẩm ô tô nào</Text>
                </Card>
              ) : (
                <Row gutter={[20, 20]}>
                  {filteredCars.map((product) => (
                    <Col xs={24} sm={12} lg={8} xl={6} key={product._id}>
                      <Card
                        hoverable
                        style={{ 
                          borderRadius: 12, 
                          overflow: 'hidden',
                          border: product.status === 'inactive' ? '2px solid #ff7875' : '1px solid #f0f0f0',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                          transition: 'all 0.3s ease',
                        }}
                        styles={{ body: { padding: 16 } }}
                        cover={
                          <div style={{ height: 200, position: 'relative', background: '#fafafa' }}>
                            {product.status === 'inactive' && (
                              <div style={{
                                position: 'absolute',
                                top: 12,
                                left: 12,
                                zIndex: 2,
                                background: '#ff4d4f',
                                color: 'white',
                                padding: '6px 12px',
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 700,
                                letterSpacing: '0.5px'
                              }}>
                                NGỪNG KINH DOANH
                              </div>
                            )}
                            {product.images && Array.isArray(product.images) && product.images.length > 0 ? (
                              <>
                                <Image
                                  alt={product.name}
                                  src={product.images[0]}
                                  width="100%"
                                  height={200}
                                  style={{ 
                                    objectFit: 'cover',
                                    objectPosition: 'center',
                                    display: 'block',
                                    width: '100%',
                                    height: '200px'
                                  }}
                                  fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
                                  preview={{
                                    mask: <EyeOutlined style={{ fontSize: 24, color: '#fff' }} />
                                  }}
                                />
                                {product.images.length > 1 && (
                                  <Badge 
                                    count={`+${product.images.length - 1}`}
                                    style={{ 
                                      backgroundColor: 'rgba(0,0,0,0.7)',
                                      position: 'absolute',
                                      top: 12,
                                      right: 12,
                                      zIndex: 3
                                    }}
                                  />
                                )}
                              </>
                            ) : (
                              <div style={{ 
                                height: 200, 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                backgroundColor: '#fafafa'
                              }}>
                                <div style={{ textAlign: 'center' }}>
                                  <Avatar size={64} icon={<CarOutlined />} style={{ backgroundColor: '#e6e6e6' }} />
                                  <div style={{ marginTop: 12, color: '#bfbfbf', fontSize: 13 }}>Chưa có hình ảnh</div>
                                </div>
                              </div>
                            )}
                          </div>
                        }
                        actions={[
                          <Tooltip title="Xem chi tiết" key="view">
                            <Button 
                              type="text" 
                              icon={<EyeOutlined style={{ fontSize: 18 }} />} 
                              onClick={() => handleViewProduct(product._id)}
                              style={{ color: '#1890ff' }}
                            />
                          </Tooltip>,
                          <Tooltip title="Chỉnh sửa" key="edit">
                            <Button 
                              type="text" 
                              icon={<EditOutlined style={{ fontSize: 18 }} />} 
                              onClick={() => handleEditProduct(product)}
                              style={{ color: '#faad14' }}
                            />
                          </Tooltip>,
                          product.status === 'active' ? (
                            <Tooltip title="Ngừng kinh doanh" key="delete">
                              <Button 
                                type="text" 
                                danger 
                                icon={<DeleteOutlined style={{ fontSize: 18 }} />} 
                                onClick={() => handleDeleteProduct(product)}
                              />
                            </Tooltip>
                          ) : (
                            <Tooltip title="Kích hoạt lại" key="activate">
                              <Button 
                                type="text" 
                                style={{ color: '#52c41a' }}
                                icon={<CheckCircleOutlined style={{ fontSize: 18 }} />} 
                                onClick={() => handleReactivateProduct(product)}
                              />
                            </Tooltip>
                          )
                        ]}
                      >
                        <div style={{ minHeight: 180 }}>
                          <Title level={5} style={{ margin: 0, marginBottom: 4, color: '#262626', fontSize: 16 }}>
                            {product.name}
                          </Title>
                          <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 12 }}>
                            {product.model}
                          </Text>
                          
                          <div style={{ marginBottom: 12 }}>
                            <Text strong style={{ color: '#ff4d4f', fontSize: 20 }}>
                              {product.price?.toLocaleString()}₫
                            </Text>
                          </div>

                          <Space direction="vertical" size={8} style={{ width: '100%' }}>
                            <div>
                              <Tag color="blue" style={{ borderRadius: 4 }}>
                                Pin: {product.battery_type}
                              </Tag>
                              <Tag color="green" style={{ borderRadius: 4 }}>
                                {product.range_km}km
                              </Tag>
                            </div>
                            
                            <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                              <div>SKU: {product.sku}</div>
                              <div style={{ marginTop: 4 }}>
                                Màu: {Array.isArray(product.color_options) ? product.color_options.join(', ') : product.color_options}
                              </div>
                            </div>

                            <Divider style={{ margin: '8px 0' }} />
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Space size={4}>
                                <Tag 
                                  color={product.status === 'active' ? 'success' : 'error'}
                                  style={{ borderRadius: 4, margin: 0 }}
                                >
                                  {product.status === 'active' ? 'Đang bán' : 'Ngừng bán'}
                                </Tag>
                                <Tag color="orange" style={{ borderRadius: 4, margin: 0 }}>
                                  Kho: {product.stocks && product.stocks.length > 0 
                                    ? product.stocks[0].quantity 
                                    : product.stock || 0}
                                </Tag>
                              </Space>
                              <Text type="secondary" style={{ fontSize: 11 }}>
                                {new Date(product.createdAt).toLocaleDateString('vi-VN')}
                              </Text>
                            </div>
                          </Space>
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
            </div>
          )}

          {!loading && (activeCategory === '' || activeCategory === 'motorbike') && (
            <div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: 20 
              }}>
                <Title level={3} style={{ margin: 0, color: '#262626' }}>
                  <ThunderboltOutlined style={{ marginRight: 12, color: '#faad14' }} />
                  Danh sách xe máy điện
                </Title>
                <Badge count={filteredMotorbikes.length} showZero style={{ backgroundColor: '#faad14' }} />
              </div>
              
              {filteredMotorbikes.length === 0 ? (
                <Card style={{ textAlign: 'center', padding: 40, borderRadius: 12 }}>
                  <ThunderboltOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
                  <Text type="secondary">Không tìm thấy sản phẩm xe máy điện nào</Text>
                </Card>
              ) : (
                <Row gutter={[20, 20]}>
                  {filteredMotorbikes.map((product) => (
                    <Col xs={24} sm={12} lg={8} xl={6} key={product._id}>
                      <Card
                        hoverable
                        style={{ 
                          borderRadius: 12, 
                          overflow: 'hidden',
                          border: product.status === 'inactive' ? '2px solid #ff7875' : '1px solid #f0f0f0',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                          transition: 'all 0.3s ease'
                        }}
                        styles={{ body: { padding: 16 } }}
                        cover={
                          <div style={{ height: 200, position: 'relative', background: '#f5f5f5' }}>
                            {product.status === 'inactive' && (
                              <div style={{
                                position: 'absolute',
                                top: 12,
                                left: 12,
                                zIndex: 2,
                                background: '#ff4d4f',
                                color: 'white',
                                padding: '6px 12px',
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 700,
                                letterSpacing: '0.5px'
                              }}>
                                NGỪNG KINH DOANH
                              </div>
                            )}
                            {product.images && Array.isArray(product.images) && product.images.length > 0 ? (
                              <>
                                <Image
                                  alt={product.name}
                                  src={product.images[0]}
                                  width="100%"
                                  height={200}
                                  style={{ 
                                    objectFit: 'contain',
                                    objectPosition: 'center',
                                    display: 'block',
                                    width: '100%',
                                    height: '200px',
                                    backgroundColor: '#f5f5f5'
                                  }}
                                  fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
                                  preview={{
                                    mask: <EyeOutlined style={{ fontSize: 24, color: '#fff' }} />
                                  }}
                                />
                                {product.images.length > 1 && (
                                  <Badge 
                                    count={`+${product.images.length - 1}`}
                                    style={{ 
                                      backgroundColor: 'rgba(0,0,0,0.7)',
                                      position: 'absolute',
                                      top: 12,
                                      right: 12,
                                      zIndex: 3
                                    }}
                                  />
                                )}
                              </>
                            ) : (
                              <div style={{ 
                                height: 200, 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                backgroundColor: '#f5f5f5'
                              }}>
                                <div style={{ textAlign: 'center' }}>
                                  <Avatar size={64} icon={<ThunderboltOutlined />} style={{ backgroundColor: '#e6e6e6' }} />
                                  <div style={{ marginTop: 12, color: '#bfbfbf', fontSize: 13 }}>Chưa có hình ảnh</div>
                                </div>
                              </div>
                            )}
                          </div>
                        }
                        actions={[
                          <Tooltip title="Xem chi tiết" key="view">
                            <Button 
                              type="text" 
                              icon={<EyeOutlined style={{ fontSize: 18 }} />} 
                              onClick={() => handleViewProduct(product._id)}
                              style={{ color: '#1890ff' }}
                            />
                          </Tooltip>,
                          <Tooltip title="Chỉnh sửa" key="edit">
                            <Button 
                              type="text" 
                              icon={<EditOutlined style={{ fontSize: 18 }} />} 
                              onClick={() => handleEditProduct(product)}
                              style={{ color: '#faad14' }}
                            />
                          </Tooltip>,
                          product.status === 'active' ? (
                            <Tooltip title="Ngừng kinh doanh" key="delete">
                              <Button 
                                type="text" 
                                danger 
                                icon={<DeleteOutlined style={{ fontSize: 18 }} />} 
                                onClick={() => handleDeleteProduct(product)}
                              />
                            </Tooltip>
                          ) : (
                            <Tooltip title="Kích hoạt lại" key="activate">
                              <Button 
                                type="text" 
                                style={{ color: '#52c41a' }}
                                icon={<CheckCircleOutlined style={{ fontSize: 18 }} />} 
                                onClick={() => handleReactivateProduct(product)}
                              />
                            </Tooltip>
                          )
                        ]}
                      >
                        <div style={{ minHeight: 180 }}>
                          <Title level={5} style={{ margin: 0, marginBottom: 4, color: '#262626', fontSize: 16 }}>
                            {product.name}
                          </Title>
                          <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 12 }}>
                            {product.model}
                          </Text>
                          
                          <div style={{ marginBottom: 12 }}>
                            <Text strong style={{ color: '#ff4d4f', fontSize: 20 }}>
                              {product.price?.toLocaleString()}₫
                            </Text>
                          </div>

                          <Space direction="vertical" size={8} style={{ width: '100%' }}>
                            <div>
                              <Tag color="blue" style={{ borderRadius: 4 }}>
                                Pin: {product.battery_type}
                              </Tag>
                              <Tag color="green" style={{ borderRadius: 4 }}>
                                {product.range_km}km
                              </Tag>
                            </div>
                            
                            <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                              <div>SKU: {product.sku}</div>
                              <div style={{ marginTop: 4 }}>
                                Màu: {Array.isArray(product.color_options) ? product.color_options.join(', ') : product.color_options}
                              </div>
                            </div>

                            <Divider style={{ margin: '8px 0' }} />
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Space size={4}>
                                <Tag 
                                  color={product.status === 'active' ? 'success' : 'error'}
                                  style={{ borderRadius: 4, margin: 0 }}
                                >
                                  {product.status === 'active' ? 'Đang bán' : 'Ngừng bán'}
                                </Tag>
                                <Tag color="orange" style={{ borderRadius: 4, margin: 0 }}>
                                  Kho: {product.stocks && product.stocks.length > 0 
                                    ? product.stocks[0].quantity 
                                    : product.stock || 0}
                                </Tag>
                              </Space>
                              <Text type="secondary" style={{ fontSize: 11 }}>
                                {new Date(product.createdAt).toLocaleDateString('vi-VN')}
                              </Text>
                            </div>
                          </Space>
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
            </div>
          )}
        </div>

        {/* Enhanced Detail Modal */}
        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <EyeOutlined style={{ marginRight: 12, color: '#1890ff', fontSize: 20 }} />
              <span style={{ fontSize: 18, fontWeight: 600 }}>Chi tiết sản phẩm</span>
            </div>
          }
          open={showProductDetail}
          onCancel={handleCloseDetailModal}
          footer={[
            <Button 
              key="close" 
              type="primary"
              size="large"
              onClick={handleCloseDetailModal}
              style={{ borderRadius: 8 }}
            >
              Đóng
            </Button>
          ]}
          width={900}
          style={{ top: 20 }}
          styles={{ body: { padding: 24 } }}
        >
          {selectedProduct && (
            <div>
              <Row gutter={[32, 24]}>
                <Col span={10}>
                  <div style={{ position: 'sticky', top: 20 }}>
                    {selectedProduct.images && Array.isArray(selectedProduct.images) && selectedProduct.images.length > 0 ? (
                      <Image.PreviewGroup>
                        <Image
                          src={selectedProduct.images[0]}
                          alt={selectedProduct.name}
                          style={{ 
                            width: '100%', 
                            borderRadius: 12,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                            objectFit: selectedProduct.category === 'motorbike' ? 'contain' : 'cover',
                            backgroundColor: selectedProduct.category === 'motorbike' ? '#f5f5f5' : 'transparent'
                          }}
                        />
                        {selectedProduct.images.length > 1 && (
                          <div style={{ marginTop: 16 }}>
                            <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 12 }}>
                              Hình ảnh khác ({selectedProduct.images.length - 1})
                            </Text>
                            <Space wrap size={8}>
                              {selectedProduct.images.slice(1).map((img, index) => (
                                <Image
                                  key={index}
                                  src={img}
                                  width={70}
                                  height={70}
                                  style={{ 
                                    borderRadius: 8,
                                    objectFit: selectedProduct.category === 'motorbike' ? 'contain' : 'cover',
                                    border: '1px solid #f0f0f0',
                                    backgroundColor: selectedProduct.category === 'motorbike' ? '#f5f5f5' : 'transparent'
                                  }}
                                />
                              ))}
                            </Space>
                          </div>
                        )}
                      </Image.PreviewGroup>
                    ) : (
                      <div style={{ 
                        height: 300, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        backgroundColor: '#fafafa',
                        borderRadius: 12
                      }}>
                        <div style={{ textAlign: 'center' }}>
                          <Avatar 
                            size={80} 
                            icon={selectedProduct.category === 'motorbike' ? <ThunderboltOutlined /> : <CarOutlined />} 
                            style={{ backgroundColor: '#e6e6e6' }} 
                          />
                          <div style={{ marginTop: 16, color: '#bfbfbf' }}>Chưa có hình ảnh</div>
                        </div>
                      </div>
                    )}
                  </div>
                </Col>
                
                <Col span={14}>
                  <div style={{ marginBottom: 20 }}>
                    <Title level={3} style={{ margin: 0, marginBottom: 8, color: '#262626' }}>
                      {selectedProduct.name}
                    </Title>
                    <Space size={8} style={{ marginBottom: 12 }}>
                      <Text type="secondary" style={{ fontSize: 15 }}>
                        {selectedProduct.model} • {selectedProduct.version}
                      </Text>
                      <Tag color="blue" style={{ borderRadius: 4 }}>SKU: {selectedProduct.sku}</Tag>
                    </Space>
                    <div>
                      <Text strong style={{ color: '#ff4d4f', fontSize: 28 }}>
                        {selectedProduct.price?.toLocaleString()}₫
                      </Text>
                      {selectedProduct.on_road_price && (
                        <div style={{ marginTop: 8 }}>
                          <Text type="secondary" style={{ fontSize: 14 }}>
                            Giá lăn bánh: <Text strong>{selectedProduct.on_road_price?.toLocaleString()}₫</Text>
                          </Text>
                        </div>
                      )}
                    </div>
                  </div>

                  <Divider />

                  <Descriptions
                    column={1}
                    size="small"
                    labelStyle={{ fontWeight: 600, color: '#595959', width: 140 }}
                    contentStyle={{ color: '#262626' }}
                  >
                    <Descriptions.Item label="Pin">
                      <Space>
                        <Tag color="blue">{selectedProduct.battery_type}</Tag>
                        <Text>{selectedProduct.battery_capacity} kWh</Text>
                      </Space>
                    </Descriptions.Item>
                    
                    <Descriptions.Item label="Tầm xa">
                      <Space>
                        <Tag color="green">{selectedProduct.range_km} km</Tag>
                        {selectedProduct.wltp_range_km && (
                          <Text type="secondary" style={{ fontSize: 13 }}>
                            (WLTP: {selectedProduct.wltp_range_km} km)
                          </Text>
                        )}
                      </Space>
                    </Descriptions.Item>
                    
                    <Descriptions.Item label="Sạc nhanh/chậm">
                      <Space split={<Divider type="vertical" />}>
                        <Text>Nhanh: {selectedProduct.charging_fast} phút</Text>
                        <Text>Chậm: {selectedProduct.charging_slow} giờ</Text>
                        <Tag color="cyan">{selectedProduct.charging_port_type}</Tag>
                      </Space>
                    </Descriptions.Item>
                    
                    <Descriptions.Item label="Động cơ">
                      <Space split={<Divider type="vertical" />}>
                        <Text>{selectedProduct.motor_power} kW</Text>
                        <Text>Tốc độ: {selectedProduct.top_speed} km/h</Text>
                        <Text>0-100: {selectedProduct.acceleration}s</Text>
                      </Space>
                      <div style={{ marginTop: 8 }}>
                        <Tag color="purple">{selectedProduct.drivetrain}</Tag>
                      </div>
                    </Descriptions.Item>
                    
                    <Descriptions.Item label="Kích thước">
                      {selectedProduct.dimensions && (
                        <Text>
                          {selectedProduct.dimensions.length} × {selectedProduct.dimensions.width} × {selectedProduct.dimensions.height} mm
                        </Text>
                      )}
                    </Descriptions.Item>
                    
                    <Descriptions.Item label="Trọng lượng">
                      <Space split={<Divider type="vertical" />}>
                        <Text>{selectedProduct.weight} kg</Text>
                        <Text>Tải trọng: {selectedProduct.payload} kg</Text>
                      </Space>
                    </Descriptions.Item>
                    
                    <Descriptions.Item label="Số chỗ ngồi">
                      {selectedProduct.seating_capacity} chỗ
                    </Descriptions.Item>
                    
                    <Descriptions.Item label="Lốp xe">
                      {selectedProduct.tire_size}
                    </Descriptions.Item>
                    
                    <Descriptions.Item label="Màu sắc">
                      <Space wrap size={4}>
                        {Array.isArray(selectedProduct.color_options) 
                          ? selectedProduct.color_options.map((color, index) => (
                              <Tag key={index} color="purple" style={{ borderRadius: 4 }}>{color}</Tag>
                            ))
                          : <Tag color="purple" style={{ borderRadius: 4 }}>{selectedProduct.color_options}</Tag>
                        }
                      </Space>
                    </Descriptions.Item>
                    
                    <Descriptions.Item label="Nhà sản xuất">
                      {typeof selectedProduct.manufacturer_id === 'string' 
                        ? selectedProduct.manufacturer_id 
                        : selectedProduct.manufacturer_id?.name
                      }
                    </Descriptions.Item>
                    
                    <Descriptions.Item label="Trạng thái">
                      <Space size={8}>
                        <Tag 
                          color={selectedProduct.status === 'active' ? 'success' : 'error'}
                          style={{ borderRadius: 4 }}
                        >
                          {selectedProduct.status === 'active' ? 'Đang bán' : 'Ngừng bán'}
                        </Tag>
                        <Tag color="orange" style={{ borderRadius: 4 }}>
                          {selectedProduct.release_status}
                        </Tag>
                      </Space>
                    </Descriptions.Item>
                    
                    <Descriptions.Item label="Tính năng an toàn">
                      {selectedProduct.safety_features && selectedProduct.safety_features.length > 0 ? (
                        <Space wrap size={4}>
                          {selectedProduct.safety_features.map((feature, index) => (
                            <Tag key={index} color="red" style={{ borderRadius: 4 }}>
                              {feature}
                            </Tag>
                          ))}
                        </Space>
                      ) : (
                        <Text type="secondary">Chưa có thông tin</Text>
                      )}
                    </Descriptions.Item>
                    
                    <Descriptions.Item label="Phần mềm">
                      <Space>
                        <Text>v{selectedProduct.software_version}</Text>
                        <Tag color={selectedProduct.ota_update ? 'success' : 'default'} style={{ borderRadius: 4 }}>
                          OTA: {selectedProduct.ota_update ? 'Có' : 'Không'}
                        </Tag>
                      </Space>
                    </Descriptions.Item>
                    
                    <Descriptions.Item label="Tồn kho">
                      <Tag color="geekblue" style={{ borderRadius: 4 }}>
                        {selectedProduct.stocks && selectedProduct.stocks.length > 0 
                          ? selectedProduct.stocks[0].quantity 
                          : selectedProduct.stock || 0} chiếc
                      </Tag>
                    </Descriptions.Item>
                    
                    <Descriptions.Item label="Bảo hành">
                      <Space split={<Divider type="vertical" />}>
                        <Text>Xe: {selectedProduct.warranty_years} năm</Text>
                        <Text>Pin: {selectedProduct.battery_warranty_years} năm</Text>
                      </Space>
                    </Descriptions.Item>
                    
                    {selectedProduct.description && (
                      <Descriptions.Item label="Mô tả">
                        <Text style={{ fontSize: 13, lineHeight: 1.6 }}>
                          {selectedProduct.description}
                        </Text>
                      </Descriptions.Item>
                    )}
                    
                    <Descriptions.Item label="Ngày tạo">
                      {new Date(selectedProduct.createdAt).toLocaleDateString('vi-VN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Descriptions.Item>
                  </Descriptions>
                </Col>
              </Row>
            </div>
          )}
        </Modal>

        {/* Edit Modal */}
        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <EditOutlined style={{ marginRight: 12, color: '#faad14', fontSize: 20 }} />
              <span style={{ fontSize: 18, fontWeight: 600 }}>Chỉnh sửa sản phẩm</span>
            </div>
          }
          open={showEditProduct}
          onCancel={handleCloseEditModal}
          footer={null}
          width={1000}
          style={{ top: 20 }}
          styles={{ body: { padding: 24 } }}
        >
          {selectedProduct && (
            <AddProduct
              isOpen={showEditProduct}
              onClose={handleCloseEditModal}
              onProductCreated={fetchProducts}
              editProduct={selectedProduct}
            />
          )}
        </Modal>

        {/* Enhanced Delete Confirmation Modal */}
        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <DeleteOutlined style={{ marginRight: 12, color: '#ff4d4f', fontSize: 20 }} />
              <span style={{ fontSize: 18, fontWeight: 600 }}>Ngừng kinh doanh sản phẩm</span>
            </div>
          }
          open={showDeleteModal}
          onCancel={cancelDelete}
          onOk={confirmDeleteProduct}
          okText="Xác nhận ngừng kinh doanh"
          cancelText="Hủy"
          okButtonProps={{ 
            danger: true,
            size: 'large',
            style: { borderRadius: 8 }
          }}
          cancelButtonProps={{
            size: 'large',
            style: { borderRadius: 8 }
          }}
          confirmLoading={loading}
          width={600}
          styles={{ body: { padding: 24 } }}
        >
          {productToDelete && (
            <div>
              <Text style={{ fontSize: 15, display: 'block', marginBottom: 20, color: '#595959' }}>
                Bạn có chắc chắn muốn ngừng kinh doanh sản phẩm này?
              </Text>
              
              <Card 
                style={{ 
                  backgroundColor: '#fafafa', 
                  border: '1px solid #e8e8e8',
                  borderRadius: 12,
                  marginBottom: 20 
                }}
                styles={{ body: { padding: 20 } }}
              >
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  <div>
                    <Text strong style={{ color: '#8c8c8c', fontSize: 12 }}>TÊN SẢN PHẨM</Text>
                    <div style={{ marginTop: 4 }}>
                      <Text strong style={{ fontSize: 16 }}>{productToDelete.name}</Text>
                    </div>
                  </div>
                  <div>
                    <Text strong style={{ color: '#8c8c8c', fontSize: 12 }}>MODEL • SKU</Text>
                    <div style={{ marginTop: 4 }}>
                      <Text>{productToDelete.model}</Text>
                      <Divider type="vertical" />
                      <Text type="secondary">{productToDelete.sku}</Text>
                    </div>
                  </div>
                  <div>
                    <Text strong style={{ color: '#8c8c8c', fontSize: 12 }}>GIÁ BÁN</Text>
                    <div style={{ marginTop: 4 }}>
                      <Text strong style={{ color: '#ff4d4f', fontSize: 20 }}>
                        {productToDelete.price?.toLocaleString()}₫
                      </Text>
                    </div>
                  </div>
                </Space>
              </Card>
              
              <div style={{ 
                padding: 16, 
                backgroundColor: '#fffbe6', 
                border: '1px solid #ffe58f',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'flex-start'
              }}>
                <WarningOutlined style={{ color: '#faad14', marginRight: 12, marginTop: 2, fontSize: 18 }} />
                <div>
                  <Text strong style={{ display: 'block', marginBottom: 4, color: '#595959' }}>
                    Lưu ý quan trọng
                  </Text>
                  <Text style={{ fontSize: 13, color: '#8c8c8c', lineHeight: 1.6 }}>
                    Sản phẩm sẽ được chuyển sang trạng thái "Không hoạt động" 
                    và không hiển thị trong danh sách sản phẩm đang bán. 
                    Bạn có thể kích hoạt lại sản phẩm bất cứ lúc nào.
                  </Text>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default ProductManagement;
