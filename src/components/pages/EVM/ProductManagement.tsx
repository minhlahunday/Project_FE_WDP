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
  Descriptions
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
  CheckCircleOutlined
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

  // Helper function để tạo FormData đơn giản chỉ với status
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

  // Handle view product details
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

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowEditProduct(true);
  };

  // Handle delete product - show confirmation modal
  const handleDeleteProduct = (product: Product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  // Confirm delete product - use DELETE endpoint for soft delete
  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;
    
    try {
      setLoading(true);
      const { del } = await import("../../../services/httpClient");
      
      // Sử dụng DELETE endpoint để soft delete (set inactive)
      await del(`/api/vehicles/${productToDelete._id}`);
      message.success('Đã ngừng kinh doanh sản phẩm thành công');
      setShowDeleteModal(false);
      setProductToDelete(null);
      fetchProducts(); // Refresh the list
    } catch (err) {
      console.error('Error deleting product:', err);
      message.error('Không thể ngừng kinh doanh sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  // Cancel delete
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setProductToDelete(null);
  };

  // Reactivate product - use PUT with simple FormData
  const handleReactivateProduct = async (product: Product) => {
    try {
      setLoading(true);
      const { put } = await import("../../../services/httpClient");
      
      // Tạo FormData đơn giản chỉ với status
      const formData = createStatusFormData('active');
      
      await put(`/api/vehicles/${product._id}`, formData);
      message.success('Đã kích hoạt lại sản phẩm thành công');
      fetchProducts(); // Refresh the list
    } catch (err) {
      console.error('Error reactivating product:', err);
      message.error('Không thể kích hoạt lại sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  // Close modals
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
      <div className="p-6">
        {/* Header với thống kê */}
        <div style={{ marginBottom: 24 }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
                Danh sách sản phẩm
              </Title>
              <Text type="secondary" style={{ fontSize: 16 }}>
                Tổng cộng: {products.length} sản phẩm 
                ({cars.length} ô tô, {motorbikes.length} xe máy điện)
                {statusFilter !== 'all' && (
                  <span style={{ color: statusFilter === 'active' ? '#52c41a' : '#ff4d4f' }}>
                    {' '}• {statusFilter === 'active' ? 'Đang bán' : 'Ngừng kinh doanh'}
                  </span>
                )}
              </Text>
            </Col>
            <Col>
              <Button
                type="primary"
                size="large"
                icon={<PlusOutlined />}
            onClick={() => setShowAddProduct(!showAddProduct)}
                style={{ 
                  background: '#52c41a',
                  borderColor: '#52c41a',
                  borderRadius: 8,
                  height: 40,
                  paddingLeft: 20,
                  paddingRight: 20
                }}
              >
                {showAddProduct ? 'Đóng form' : 'Thêm sản phẩm mới'}
              </Button>
            </Col>
          </Row>
        </div>
        {/* Hiển thị form thêm sản phẩm nếu showAddProduct = true */}
        {showAddProduct && (
          <div className="mb-8">
            <AddProduct 
              isOpen={showAddProduct} 
              onClose={() => setShowAddProduct(false)}
              onProductCreated={fetchProducts}
            />
          </div>
        )}
        {error && (
          <div style={{ 
            background: '#fff2f0', 
            border: '1px solid #ffccc7', 
            borderRadius: 8, 
            padding: 16, 
            marginBottom: 16,
            color: '#ff4d4f'
          }}>
            {error}
          </div>
        )}
        {loading && (
          <div style={{ 
            textAlign: 'center', 
            padding: 40, 
            color: '#8c8c8c',
            fontSize: 16
          }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{
                width: 40,
                height: 40,
                border: '4px solid #f3f3f3',
                borderTop: '4px solid #1890ff',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto'
              }}></div>
            </div>
            Đang tải dữ liệu...
          </div>
        )}
        <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
          <Col>
            <Space wrap>
              <Button
                type={activeCategory === 'car' ? 'primary' : 'default'}
                icon={<CarOutlined />}
              onClick={() => setActiveCategory('car')}
                style={{ borderRadius: 8 }}
              >
                Ô tô ({filteredCars.length})
              </Button>
              <Button
                type={activeCategory === 'motorbike' ? 'primary' : 'default'}
                icon={<ThunderboltOutlined />}
              onClick={() => setActiveCategory('motorbike')}
                style={{ borderRadius: 8 }}
              >
                Xe máy ({filteredMotorbikes.length})
              </Button>
              <Button
                type={activeCategory === '' ? 'primary' : 'default'}
                icon={<AppstoreOutlined />}
              onClick={() => setActiveCategory('')}
                style={{ borderRadius: 8 }}
              >
                Tất cả ({filteredCars.length + filteredMotorbikes.length})
              </Button>
            </Space>
            <div style={{ marginTop: 12 }}>
              <Space wrap>
                <Text strong style={{ marginRight: 8 }}>Trạng thái:</Text>
                <Button
                  type={statusFilter === 'all' ? 'primary' : 'default'}
                  size="small"
                  onClick={() => setStatusFilter('all')}
                  style={{ borderRadius: 6 }}
            >
              Tất cả
                </Button>
                <Button
                  type={statusFilter === 'active' ? 'primary' : 'default'}
                  size="small"
                  onClick={() => setStatusFilter('active')}
                  style={{ borderRadius: 6 }}
                >
                  Đang bán
                </Button>
                <Button
                  type={statusFilter === 'inactive' ? 'primary' : 'default'}
                  size="small"
                  onClick={() => setStatusFilter('inactive')}
                  style={{ borderRadius: 6 }}
                >
                  Ngừng kinh doanh
                </Button>
              </Space>
          </div>
          </Col>
          <Col>
            <Search
              placeholder="Tìm kiếm sản phẩm..."
              allowClear
            value={search}
            onChange={(e) => setSearch(e.target.value)}
              style={{ width: 300 }}
              size="large"
          />
          </Col>
        </Row>

        {(activeCategory === '' || activeCategory === 'car') && (
          <>
            <Title level={3} style={{ marginBottom: 16, color: '#1890ff' }}>
              <CarOutlined style={{ marginRight: 8 }} />
              Danh sách ô tô
            </Title>
            <Row gutter={[16, 16]}>
              {filteredCars.map((product) => (
                <Col xs={24} sm={12} lg={8} xl={6} key={product._id}>
                  <Card
                    hoverable
                    style={{ 
                      borderRadius: 12, 
                      overflow: 'hidden',
                      border: product.status === 'inactive' ? '2px solid #ff4d4f' : undefined,
                      opacity: product.status === 'inactive' ? 0.8 : 1
                    }}
                    cover={
                      <div style={{ height: 200, position: 'relative' }}>
                        {product.status === 'inactive' && (
                          <div style={{
                            position: 'absolute',
                            top: 8,
                            left: 8,
                            zIndex: 2,
                            background: '#ff4d4f',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: 4,
                            fontSize: 12,
                            fontWeight: 'bold'
                          }}>
                            NGỪNG KINH DOANH
                          </div>
                        )}
                        {product.images && Array.isArray(product.images) && product.images.length > 0 ? (
                          <Badge 
                            count={product.images.length > 1 ? `+${product.images.length - 1}` : 0}
                            style={{ 
                              backgroundColor: 'rgba(0,0,0,0.6)',
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              zIndex: 1
                            }}
                          >
                            <Image
                              alt={product.name}
                              src={product.images[0]}
                              style={{ 
                                width: '100%', 
                                height: '100%', 
                                objectFit: 'contain',
                                backgroundColor: '#f8f9fa'
                              }}
                              fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
                              preview={{
                                mask: <EyeOutlined style={{ fontSize: 20, color: '#fff' }} />
                              }}
                            />
                          </Badge>
                        ) : (
                          <div style={{ 
                            height: 200, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            backgroundColor: '#f5f5f5',
                            color: '#999'
                          }}>
                            <div style={{ textAlign: 'center' }}>
                              <Avatar size={64} icon={<CarOutlined />} style={{ backgroundColor: '#d9d9d9' }} />
                              <div style={{ marginTop: 8 }}>Chưa có hình ảnh</div>
                            </div>
                          </div>
                        )}
                      </div>
                    }
                    actions={[
                      <Tooltip title="Xem chi tiết">
                        <Button 
                          type="text" 
                          icon={<EyeOutlined />} 
                          onClick={() => handleViewProduct(product._id)}
                        />
                      </Tooltip>,
                      <Tooltip title="Chỉnh sửa">
                        <Button 
                          type="text" 
                          icon={<EditOutlined />} 
                          onClick={() => handleEditProduct(product)}
                        />
                      </Tooltip>,
                      product.status === 'active' ? (
                        <Tooltip title="Ngừng kinh doanh">
                          <Button 
                            type="text" 
                            danger 
                            icon={<DeleteOutlined />} 
                            onClick={() => handleDeleteProduct(product)}
                          />
                        </Tooltip>
                      ) : (
                        <Tooltip title="Kích hoạt lại">
                          <Button 
                            type="text" 
                            style={{ color: '#52c41a' }}
                            icon={<CheckCircleOutlined />} 
                            onClick={() => handleReactivateProduct(product)}
                          />
                        </Tooltip>
                      )
                    ]}
                  >
                    <Card.Meta
                      title={
                        <div>
                          <Title level={5} style={{ margin: 0, color: '#1890ff' }}>
                            {product.name}
                          </Title>
                          <Text type="secondary">{product.model}</Text>
                        </div>
                      }
                      description={
                        <div>
                          <div style={{ marginBottom: 8 }}>
                            <Text strong style={{ color: '#f5222d', fontSize: 16 }}>
                              {product.price?.toLocaleString()}₫
                            </Text>
                          </div>
                          <Space direction="vertical" size={4} style={{ width: '100%' }}>
                            <div>
                              <Tag color="blue">Pin: {product.battery_type}</Tag>
                              <Tag color="green">Tầm xa: {product.range_km}km</Tag>
                            </div>
                            <div>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                SKU: {product.sku}
                              </Text>
                            </div>
                            <div>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                Model: {product.model} | Version: {product.version}
                              </Text>
                            </div>
                            <div>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                Màu: {Array.isArray(product.color_options) ? product.color_options.join(', ') : product.color_options}
                              </Text>
                            </div>
                    <div>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                NSX: {typeof product.manufacturer_id === 'string' ? product.manufacturer_id : product.manufacturer_id?.name}
                              </Text>
                    </div>
                            <div>
                              <Tag color={product.status === 'active' ? 'green' : 'red'}>
                                {product.status}
                              </Tag>
                              <Tag color="orange" style={{ marginLeft: 4 }}>
                                {product.release_status}
                              </Tag>
                              <Tag color="geekblue" style={{ marginLeft: 4 }}>
                                Kho: {product.stocks && product.stocks.length > 0 
                                  ? product.stocks[0].quantity 
                                  : product.stock || 0}
                              </Tag>
                              <Text type="secondary" style={{ fontSize: 12, float: 'right' }}>
                                {new Date(product.createdAt).toLocaleDateString()}
                              </Text>
                  </div>
                          </Space>
                </div>
                      }
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          </>
        )}

        {(activeCategory === '' || activeCategory === 'motorbike') && (
          <>
            <Title level={3} style={{ marginBottom: 16, color: '#1890ff' }}>
              <ThunderboltOutlined style={{ marginRight: 8 }} />
              Danh sách xe máy điện
            </Title>
            <Row gutter={[16, 16]}>
              {filteredMotorbikes.map((product) => (
                <Col xs={24} sm={12} lg={8} xl={6} key={product._id}>
                  <Card
                    hoverable
                    style={{ 
                      borderRadius: 12, 
                      overflow: 'hidden',
                      border: product.status === 'inactive' ? '2px solid #ff4d4f' : undefined,
                      opacity: product.status === 'inactive' ? 0.8 : 1
                    }}
                    cover={
                      <div style={{ height: 200, position: 'relative' }}>
                        {product.status === 'inactive' && (
                          <div style={{
                            position: 'absolute',
                            top: 8,
                            left: 8,
                            zIndex: 2,
                            background: '#ff4d4f',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: 4,
                            fontSize: 12,
                            fontWeight: 'bold'
                          }}>
                            NGỪNG KINH DOANH
                          </div>
                        )}
                        {product.images && Array.isArray(product.images) && product.images.length > 0 ? (
                          <Badge 
                            count={product.images.length > 1 ? `+${product.images.length - 1}` : 0}
                            style={{ 
                              backgroundColor: 'rgba(0,0,0,0.6)',
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              zIndex: 1
                            }}
                          >
                            <Image
                              alt={product.name}
                              src={product.images[0]}
                              style={{ 
                                width: '100%', 
                                height: '100%', 
                                objectFit: 'contain',
                                backgroundColor: '#f8f9fa'
                              }}
                              fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
                              preview={{
                                mask: <EyeOutlined style={{ fontSize: 20, color: '#fff' }} />
                              }}
                            />
                          </Badge>
                        ) : (
                          <div style={{ 
                            height: 200, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            backgroundColor: '#f5f5f5',
                            color: '#999'
                          }}>
                            <div style={{ textAlign: 'center' }}>
                              <Avatar size={64} icon={<ThunderboltOutlined />} style={{ backgroundColor: '#d9d9d9' }} />
                              <div style={{ marginTop: 8 }}>Chưa có hình ảnh</div>
                            </div>
                          </div>
                        )}
                      </div>
                    }
                    actions={[
                      <Tooltip title="Xem chi tiết">
                        <Button 
                          type="text" 
                          icon={<EyeOutlined />} 
                          onClick={() => handleViewProduct(product._id)}
                        />
                      </Tooltip>,
                      <Tooltip title="Chỉnh sửa">
                        <Button 
                          type="text" 
                          icon={<EditOutlined />} 
                          onClick={() => handleEditProduct(product)}
                        />
                      </Tooltip>,
                      product.status === 'active' ? (
                        <Tooltip title="Ngừng kinh doanh">
                          <Button 
                            type="text" 
                            danger 
                            icon={<DeleteOutlined />} 
                            onClick={() => handleDeleteProduct(product)}
                          />
                        </Tooltip>
                      ) : (
                        <Tooltip title="Kích hoạt lại">
                          <Button 
                            type="text" 
                            style={{ color: '#52c41a' }}
                            icon={<CheckCircleOutlined />} 
                            onClick={() => handleReactivateProduct(product)}
                          />
                        </Tooltip>
                      )
                    ]}
                  >
                    <Card.Meta
                      title={
                        <div>
                          <Title level={5} style={{ margin: 0, color: '#1890ff' }}>
                            {product.name}
                          </Title>
                          <Text type="secondary">{product.model}</Text>
                        </div>
                      }
                      description={
                        <div>
                          <div style={{ marginBottom: 8 }}>
                            <Text strong style={{ color: '#f5222d', fontSize: 16 }}>
                              {product.price?.toLocaleString()}₫
                            </Text>
                          </div>
                          <Space direction="vertical" size={4} style={{ width: '100%' }}>
                            <div>
                              <Tag color="blue">Pin: {product.battery_type}</Tag>
                              <Tag color="green">Tầm xa: {product.range_km}km</Tag>
                            </div>
                            <div>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                SKU: {product.sku}
                              </Text>
                            </div>
                            <div>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                Model: {product.model} | Version: {product.version}
                              </Text>
                            </div>
                            <div>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                Màu: {Array.isArray(product.color_options) ? product.color_options.join(', ') : product.color_options}
                              </Text>
                            </div>
                    <div>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                NSX: {typeof product.manufacturer_id === 'string' ? product.manufacturer_id : product.manufacturer_id?.name}
                              </Text>
                    </div>
                            <div>
                              <Tag color={product.status === 'active' ? 'green' : 'red'}>
                                {product.status}
                              </Tag>
                              <Tag color="orange" style={{ marginLeft: 4 }}>
                                {product.release_status}
                              </Tag>
                              <Tag color="geekblue" style={{ marginLeft: 4 }}>
                                Kho: {product.stocks && product.stocks.length > 0 
                                  ? product.stocks[0].quantity 
                                  : product.stock || 0}
                              </Tag>
                              <Text type="secondary" style={{ fontSize: 12, float: 'right' }}>
                                {new Date(product.createdAt).toLocaleDateString()}
                              </Text>
                  </div>
                          </Space>
                </div>
                      }
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          </>
        )}

        {/* Modal hiển thị chi tiết sản phẩm */}
        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <EyeOutlined style={{ marginRight: 8, color: '#1890ff' }} />
              Chi tiết sản phẩm
            </div>
          }
          open={showProductDetail}
          onCancel={handleCloseDetailModal}
          footer={[
            <Button key="close" onClick={handleCloseDetailModal}>
              Đóng
            </Button>
          ]}
          width={800}
          style={{ top: 20 }}
        >
          {selectedProduct && (
            <div>
              <Row gutter={[24, 24]}>
                <Col span={12}>
                  <div style={{ textAlign: 'center' }}>
                    {selectedProduct.images && Array.isArray(selectedProduct.images) && selectedProduct.images.length > 0 ? (
                      <Image.PreviewGroup>
                        <Image
                          src={selectedProduct.images[0]}
                          alt={selectedProduct.name}
                          style={{ 
                            width: '100%', 
                            maxHeight: 300, 
                            objectFit: 'cover',
                            borderRadius: 8
                          }}
                        />
                        {selectedProduct.images.length > 1 && (
                          <div style={{ marginTop: 8 }}>
                            <Text type="secondary">Các ảnh khác:</Text>
                            <div style={{ marginTop: 8 }}>
                              {selectedProduct.images.slice(1).map((img, index) => (
                                <Image
                                  key={index}
                                  src={img}
                                  width={60}
                                  height={60}
                                  style={{ 
                                    margin: 4, 
                                    borderRadius: 4,
                                    objectFit: 'cover'
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </Image.PreviewGroup>
                    ) : (
                      <div style={{ 
                        height: 300, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        backgroundColor: '#f5f5f5',
                        borderRadius: 8
                      }}>
                        <div style={{ textAlign: 'center' }}>
                          <Avatar size={80} icon={<CarOutlined />} style={{ backgroundColor: '#d9d9d9' }} />
                          <div style={{ marginTop: 8, color: '#999' }}>Chưa có hình ảnh</div>
                        </div>
                      </div>
                    )}
                  </div>
                </Col>
                <Col span={12}>
                  <Descriptions
                    title={
                      <div>
                        <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
                          {selectedProduct.name}
                        </Title>
                        <Text type="secondary">{selectedProduct.model} - {selectedProduct.version}</Text>
                        <div style={{ marginTop: 4 }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            SKU: {selectedProduct.sku}
                          </Text>
                        </div>
                      </div>
                    }
                    bordered
                    column={1}
                    size="small"
                  >
                    <Descriptions.Item label="Giá">
                      <Text strong style={{ color: '#f5222d', fontSize: 16 }}>
                        {selectedProduct.price?.toLocaleString()}₫
                      </Text>
                      {selectedProduct.on_road_price && (
                        <div style={{ marginTop: 4 }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            Giá lăn bánh: {selectedProduct.on_road_price?.toLocaleString()}₫
                          </Text>
                        </div>
                      )}
                    </Descriptions.Item>
                    <Descriptions.Item label="Thông tin pin">
                      <div>
                        <Tag color="blue">{selectedProduct.battery_type}</Tag>
                        <Text style={{ marginLeft: 8 }}>{selectedProduct.battery_capacity} kWh</Text>
                      </div>
                    </Descriptions.Item>
                    <Descriptions.Item label="Tầm xa">
                      <div>
                        <Tag color="green">{selectedProduct.range_km} km</Tag>
                        {selectedProduct.wltp_range_km && (
                          <Text style={{ marginLeft: 8, fontSize: 12 }}>
                            (WLTP: {selectedProduct.wltp_range_km} km)
                          </Text>
                        )}
                      </div>
                    </Descriptions.Item>
                    <Descriptions.Item label="Sạc">
                      <div>
                        <Text style={{ fontSize: 12 }}>
                          Nhanh: {selectedProduct.charging_fast} phút | 
                          Chậm: {selectedProduct.charging_slow} giờ
                        </Text>
                        <div style={{ marginTop: 4 }}>
                          <Tag color="cyan">{selectedProduct.charging_port_type}</Tag>
                        </div>
                      </div>
                    </Descriptions.Item>
                    <Descriptions.Item label="Động cơ">
                      <div>
                        <Text style={{ fontSize: 12 }}>
                          Công suất: {selectedProduct.motor_power} kW | 
                          Tốc độ: {selectedProduct.top_speed} km/h | 
                          Tăng tốc: {selectedProduct.acceleration}s
                        </Text>
                        <div style={{ marginTop: 4 }}>
                          <Tag color="purple">{selectedProduct.drivetrain}</Tag>
                        </div>
                      </div>
                    </Descriptions.Item>
                    <Descriptions.Item label="Kích thước & Trọng lượng">
                      <div>
                        {selectedProduct.dimensions && (
                          <Text style={{ fontSize: 12 }}>
                            {selectedProduct.dimensions.length} x {selectedProduct.dimensions.width} x {selectedProduct.dimensions.height} mm
                          </Text>
                        )}
                        <div style={{ marginTop: 4 }}>
                          <Text style={{ fontSize: 12 }}>
                            Trọng lượng: {selectedProduct.weight} kg | 
                            Tải trọng: {selectedProduct.payload} kg
                          </Text>
                        </div>
                        <div style={{ marginTop: 4 }}>
                          <Text style={{ fontSize: 12 }}>
                            Số chỗ: {selectedProduct.seating_capacity} | 
                            Lốp: {selectedProduct.tire_size}
                          </Text>
                        </div>
                      </div>
                    </Descriptions.Item>
                    <Descriptions.Item label="Màu sắc">
                      {Array.isArray(selectedProduct.color_options) 
                        ? selectedProduct.color_options.map((color, index) => (
                            <Tag key={index} color="purple">{color}</Tag>
                          ))
                        : <Tag color="purple">{selectedProduct.color_options}</Tag>
                      }
                    </Descriptions.Item>
                    <Descriptions.Item label="Nhà sản xuất">
                      {typeof selectedProduct.manufacturer_id === 'string' 
                        ? selectedProduct.manufacturer_id 
                        : selectedProduct.manufacturer_id?.name
                      }
                    </Descriptions.Item>
                    <Descriptions.Item label="Trạng thái">
                      <div>
                        <Tag color={selectedProduct.status === 'active' ? 'green' : 'red'}>
                          {selectedProduct.status}
                        </Tag>
                        <Tag color="orange" style={{ marginLeft: 4 }}>
                          {selectedProduct.release_status}
                        </Tag>
                      </div>
                    </Descriptions.Item>
                    <Descriptions.Item label="Tính năng an toàn">
                      {selectedProduct.safety_features && selectedProduct.safety_features.length > 0 ? (
                        <div>
                          {selectedProduct.safety_features.map((feature, index) => (
                            <Tag key={index} color="red" style={{ marginBottom: 4 }}>
                              {feature}
                            </Tag>
                          ))}
                        </div>
                      ) : (
                        <Text type="secondary">Chưa có thông tin</Text>
                      )}
                    </Descriptions.Item>
                    <Descriptions.Item label="Phần mềm">
                      <div>
                        <Text style={{ fontSize: 12 }}>
                          Phiên bản: {selectedProduct.software_version}
                        </Text>
                        <div style={{ marginTop: 4 }}>
                          <Tag color={selectedProduct.ota_update ? 'green' : 'red'}>
                            OTA Update: {selectedProduct.ota_update ? 'Có' : 'Không'}
                          </Tag>
                        </div>
                      </div>
                    </Descriptions.Item>
                    <Descriptions.Item label="Tồn kho">
                      <Tag color="geekblue">
                        Số lượng: {selectedProduct.stocks && selectedProduct.stocks.length > 0 
                          ? selectedProduct.stocks[0].quantity 
                          : selectedProduct.stock || 0}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Bảo hành">
                      <Text style={{ fontSize: 12 }}>
                        Xe: {selectedProduct.warranty_years} năm | 
                        Pin: {selectedProduct.battery_warranty_years} năm
                      </Text>
                    </Descriptions.Item>
                    {selectedProduct.description && (
                      <Descriptions.Item label="Mô tả">
                        <Text style={{ fontSize: 12 }}>
                          {selectedProduct.description}
                        </Text>
                      </Descriptions.Item>
                    )}
                    <Descriptions.Item label="Ngày tạo">
                      {new Date(selectedProduct.createdAt).toLocaleDateString('vi-VN')}
                    </Descriptions.Item>
                  </Descriptions>
                </Col>
              </Row>
            </div>
          )}
        </Modal>

        {/* Modal chỉnh sửa sản phẩm */}
        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <EditOutlined style={{ marginRight: 8, color: '#1890ff' }} />
              Chỉnh sửa sản phẩm
            </div>
          }
          open={showEditProduct}
          onCancel={handleCloseEditModal}
          footer={null}
          width={1000}
          style={{ top: 20 }}
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

        {/* Modal xác nhận ngừng kinh doanh */}
        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <DeleteOutlined style={{ marginRight: 8, color: '#ff4d4f' }} />
              Ngừng kinh doanh sản phẩm
            </div>
          }
          open={showDeleteModal}
          onCancel={cancelDelete}
          onOk={confirmDeleteProduct}
          okText="Ngừng kinh doanh"
          cancelText="Hủy"
          okButtonProps={{ danger: true }}
          confirmLoading={loading}
        >
          {productToDelete && (
            <div>
              <div style={{ marginBottom: 16 }}>
                <Text strong>Bạn có chắc chắn muốn ngừng kinh doanh sản phẩm này?</Text>
              </div>
              <div style={{ 
                padding: 16, 
                backgroundColor: '#f5f5f5', 
                borderRadius: 8,
                marginBottom: 16 
              }}>
                <div style={{ marginBottom: 8 }}>
                  <Text strong>Tên sản phẩm: </Text>
                  <Text>{productToDelete.name}</Text>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <Text strong>Model: </Text>
                  <Text>{productToDelete.model}</Text>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <Text strong>SKU: </Text>
                  <Text>{productToDelete.sku}</Text>
                </div>
                <div>
                  <Text strong>Giá: </Text>
                  <Text strong style={{ color: '#f5222d' }}>
                    {productToDelete.price?.toLocaleString()}₫
                  </Text>
                </div>
              </div>
              <div style={{ 
                padding: 12, 
                backgroundColor: '#fff7e6', 
                border: '1px solid #ffd591',
                borderRadius: 6 
              }}>
                <Text type="warning">
                  <WarningOutlined style={{ marginRight: 4 }} />
                  Lưu ý: Sản phẩm sẽ được chuyển sang trạng thái "Không hoạt động" 
                  và không hiển thị trong danh sách sản phẩm đang bán. 
                  Bạn có thể kích hoạt lại sản phẩm bất cứ lúc nào.
                </Text>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default ProductManagement;
